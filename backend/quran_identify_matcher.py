"""Match Quran ASR transcripts to ayah spans in the complete Quran corpus.

This identifies the recited text. It intentionally does not identify the
reciter: speaker identification requires a separate voice-embedding model and
labelled reference recordings.
"""

from collections import Counter, defaultdict
from dataclasses import dataclass
from difflib import SequenceMatcher
from functools import lru_cache
import heapq
import os
from typing import Optional

from learn_quran.alignment import normalize_arabic_word
from learn_quran.asr import AsrTranscript
from quran_corpus import AyahEntry, get_corpus


MAX_WINDOW_AYAHS = 3
MAX_CANDIDATE_AYAHS = 64
MAX_FRAGMENT_FINALISTS = 120
MIN_TRANSCRIPT_WORDS = 2
MIN_CONFIDENT_MATCH = float(
    os.environ.get("QURAN_IDENTIFY_MIN_CONFIDENCE", "0.65")
)
MIN_MATCH_MARGIN = float(os.environ.get("QURAN_IDENTIFY_MIN_MARGIN", "0.04"))


@dataclass(frozen=True)
class IdentifyMatch:
    surah_number: int
    surah_name_english: str
    surah_name_arabic: str
    ayah_start: int
    ayah_end: int
    matched_text_arabic: str
    matched_text_english: str
    confidence: float


@dataclass(frozen=True)
class _LocationScore:
    start_index: int
    end_index: int
    score: float


@dataclass(frozen=True)
class _FragmentCandidate:
    start_index: int
    end_index: int
    regular_text: str
    dagger_alif_text: str
    coarse_score: float


class NoConfidentMatchError(ValueError):
    """Raised when a transcript is too short, weak, or ambiguous to show."""


def _word_forms(value: str) -> tuple[str, ...]:
    # Uthmani dagger alif may be emitted by ASR as an ordinary alif or omitted.
    forms = {
        normalize_arabic_word(value),
        normalize_arabic_word(value.replace("ٰ", "ا")),
    }
    forms.discard("")
    return tuple(sorted(forms))


def _normalized_words(text: str, *, restore_dagger_alif: bool = False) -> list[str]:
    words: list[str] = []
    for word in text.split():
        source = word.replace("ٰ", "ا") if restore_dagger_alif else word
        normalized = normalize_arabic_word(source)
        if normalized:
            words.append(normalized)
    return words


@lru_cache(maxsize=1)
def _inverted_index() -> dict[str, tuple[int, ...]]:
    index: dict[str, list[int]] = defaultdict(list)
    for corpus_index, ayah in enumerate(get_corpus()):
        forms = {
            form
            for word in ayah.arabic.split()
            for form in _word_forms(word)
        }
        for form in forms:
            index[form].append(corpus_index)
    return {word: tuple(indices) for word, indices in index.items()}


def _candidate_ayah_indices(query_words: list[str]) -> list[int]:
    hit_counts: Counter[int] = Counter()
    index = _inverted_index()
    for word in set(query_words):
        hit_counts.update(index.get(word, ()))
    return [
        corpus_index
        for corpus_index, _ in hit_counts.most_common(MAX_CANDIDATE_AYAHS)
    ]


def _window_end(
    corpus: tuple[AyahEntry, ...],
    start_index: int,
    ayah_count: int,
) -> Optional[int]:
    end_index = start_index + ayah_count - 1
    if end_index >= len(corpus):
        return None
    if corpus[start_index].surah_number != corpus[end_index].surah_number:
        return None
    return end_index


def _candidate_windows(
    corpus: tuple[AyahEntry, ...],
    hit_indices: list[int],
) -> set[tuple[int, int]]:
    windows: set[tuple[int, int]] = set()
    for hit_index in hit_indices:
        # A transcript may begin near an ayah boundary, so also evaluate spans
        # beginning up to two ayahs before the matching word.
        for offset in range(MAX_WINDOW_AYAHS):
            start_index = hit_index - offset
            if start_index < 0:
                continue
            if corpus[start_index].surah_number != corpus[hit_index].surah_number:
                continue
            for ayah_count in range(1, MAX_WINDOW_AYAHS + 1):
                end_index = _window_end(corpus, start_index, ayah_count)
                if end_index is not None and start_index <= hit_index <= end_index:
                    windows.add((start_index, end_index))
    return windows


@lru_cache(maxsize=1)
def _corpus_words() -> tuple[tuple[tuple[str, str], ...], ...]:
    normalized: list[tuple[tuple[str, str], ...]] = []
    for ayah in get_corpus():
        words: list[tuple[str, str]] = []
        for word in ayah.arabic.split():
            regular = normalize_arabic_word(word)
            dagger_as_alif = normalize_arabic_word(word.replace("ٰ", "ا"))
            if regular:
                words.append((regular, dagger_as_alif or regular))
        normalized.append(tuple(words))
    return tuple(normalized)


def _fragment_finalists(
    windows: set[tuple[int, int]],
    query_words: list[str],
) -> list[_FragmentCandidate]:
    query_counter = Counter(query_words)
    query_word_count = len(query_words)
    normalized_corpus = _corpus_words()
    candidates: dict[tuple[int, int, str, str], _FragmentCandidate] = {}

    for start_index, end_index in windows:
        words = [
            (regular, dagger_as_alif, corpus_index)
            for corpus_index in range(start_index, end_index + 1)
            for regular, dagger_as_alif in normalized_corpus[corpus_index]
        ]
        if not words:
            continue

    # A phone clip often contains only part of a long ayah. Compare similarly
    # sized word slices instead of penalising the query for the unrecorded rest.
        minimum_length = max(MIN_TRANSCRIPT_WORDS, query_word_count - 2)
        maximum_length = min(len(words), query_word_count + 2)
        lengths = (
            (len(words),)
            if len(words) < minimum_length
            else range(minimum_length, maximum_length + 1)
        )

        for length in lengths:
            for word_start in range(0, len(words) - length + 1):
                fragment = words[word_start : word_start + length]
                # Single-ayah windows already evaluate fragments wholly inside
                # one ayah. Multi-ayah windows only need boundary-crossing
                # fragments; skipping duplicates keeps request latency bounded.
                if start_index != end_index and fragment[0][2] == fragment[-1][2]:
                    continue
                regular_words = [word[0] for word in fragment]
                dagger_alif_words = [word[1] for word in fragment]
                overlap = max(
                    sum((query_counter & Counter(form)).values())
                    for form in (regular_words, dagger_alif_words)
                )
                coarse_score = overlap / max(query_word_count, length)
                candidate = _FragmentCandidate(
                    start_index=fragment[0][2],
                    end_index=fragment[-1][2],
                    regular_text=" ".join(regular_words),
                    dagger_alif_text=" ".join(dagger_alif_words),
                    coarse_score=coarse_score,
                )
                key = (
                    candidate.start_index,
                    candidate.end_index,
                    candidate.regular_text,
                    candidate.dagger_alif_text,
                )
                existing = candidates.get(key)
                if existing is None or candidate.coarse_score > existing.coarse_score:
                    candidates[key] = candidate

    return heapq.nlargest(
        MAX_FRAGMENT_FINALISTS,
        candidates.values(),
        key=lambda candidate: candidate.coarse_score,
    )


def _score_locations(
    finalists: list[_FragmentCandidate],
    query_forms: tuple[str, ...],
) -> list[_LocationScore]:
    location_scores: dict[tuple[int, int], float] = {}
    for candidate in finalists:
        score = max(
            SequenceMatcher(
                None,
                query_form,
                fragment_form,
                autojunk=False,
            ).ratio()
            for query_form in query_forms
            for fragment_form in (
                candidate.regular_text,
                candidate.dagger_alif_text,
            )
        )
        key = (candidate.start_index, candidate.end_index)
        location_scores[key] = max(location_scores.get(key, 0.0), score)
    return sorted(
        (
            _LocationScore(start_index, end_index, score)
            for (start_index, end_index), score in location_scores.items()
        ),
        key=lambda result: result.score,
        reverse=True,
    )


def find_best_match(
    transcript_text: str,
    min_confidence: Optional[float] = None,
) -> IdentifyMatch:
    corpus = get_corpus()
    query_words = _normalized_words(transcript_text)
    if len(query_words) < MIN_TRANSCRIPT_WORDS:
        raise NoConfidentMatchError(
            "The recording is too short to identify confidently. Recite a few more words."
        )

    candidate_indices = _candidate_ayah_indices(query_words)
    if not candidate_indices:
        raise NoConfidentMatchError(
            "No ayah in the corpus shares usable words with the transcript."
        )

    query_forms = tuple(
        {
            " ".join(query_words),
            " ".join(
                _normalized_words(transcript_text, restore_dagger_alif=True)
            ),
        }
    )
    windows = _candidate_windows(corpus, candidate_indices)
    ranked = _score_locations(
        _fragment_finalists(windows, query_words),
        query_forms,
    )
    effective_min_confidence = (
        min_confidence if min_confidence is not None else MIN_CONFIDENT_MATCH
    )
    if not ranked or ranked[0].score < effective_min_confidence:
        best_score = ranked[0].score if ranked else 0.0
        raise NoConfidentMatchError(
            f"The best Quran-text match ({best_score:.0%}) was below the "
            "confidence floor."
        )

    best = ranked[0]
    if len(ranked) > 1 and best.score - ranked[1].score < MIN_MATCH_MARGIN:
        first = corpus[best.start_index]
        second = corpus[ranked[1].start_index]
        if (
            first.surah_number,
            first.ayah_number,
            corpus[best.end_index].ayah_number,
        ) != (
            second.surah_number,
            second.ayah_number,
            corpus[ranked[1].end_index].ayah_number,
        ):
            raise NoConfidentMatchError(
                "The recording matched more than one ayah. Recite a longer passage."
            )

    start_ayah = corpus[best.start_index]
    end_ayah = corpus[best.end_index]
    matched_entries = corpus[best.start_index : best.end_index + 1]
    return IdentifyMatch(
        surah_number=start_ayah.surah_number,
        surah_name_english=start_ayah.surah_name_english,
        surah_name_arabic=start_ayah.surah_name_arabic,
        ayah_start=start_ayah.ayah_number,
        ayah_end=end_ayah.ayah_number,
        matched_text_arabic=" ".join(entry.arabic for entry in matched_entries),
        matched_text_english=" ".join(
            entry.translation for entry in matched_entries if entry.translation
        ),
        confidence=round(best.score, 3),
    )


def identify_from_transcript(transcript: AsrTranscript) -> IdentifyMatch:
    return find_best_match(transcript.text)
