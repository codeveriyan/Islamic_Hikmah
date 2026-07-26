import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Optional


_ARABIC_MARKS = re.compile(
    "[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u08d3-\u08ff]"
)
_NON_LETTERS = re.compile(r"[^\u0621-\u063a\u0641-\u064a]+")
_ORTHOGRAPHY_TRANSLATION = str.maketrans(
    {
        "ٱ": "ا",
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ى": "ي",
        "ؤ": "و",
        "ئ": "ي",
        "ـ": "",
    }
)


@dataclass(frozen=True)
class AlignedWord:
    expected_index: int
    expected_text: str
    heard_text: Optional[str]
    status: str


@dataclass(frozen=True)
class AlignmentResult:
    words: list[AlignedWord]
    extra_word_count: int
    score: int


def normalize_arabic_word(value: str) -> str:
    """Normalize Quran/ASR spelling only for transcript comparison.

    This intentionally removes written vowel and recitation marks. It therefore
    measures word transcription, not Tajweed or vowel quality.
    """

    normalized = _ARABIC_MARKS.sub("", value).translate(_ORTHOGRAPHY_TRANSLATION)
    return _NON_LETTERS.sub("", normalized)


def _normalization_variants(value: str) -> frozenset[str]:
    # Uthmani dagger alif is inconsistently represented by ASR as either an
    # ordinary alif or no written alif (for example العالمين and الرحمن).
    return frozenset(
        {
            normalize_arabic_word(value),
            normalize_arabic_word(value.replace("ٰ", "ا")),
        }
    )


def _similarity(expected: frozenset[str], heard: frozenset[str]) -> float:
    if expected.intersection(heard):
        return 1.0
    return max(
        SequenceMatcher(a=expected_form, b=heard_form).ratio()
        for expected_form in expected
        for heard_form in heard
    )


def _substitution_cost(expected: frozenset[str], heard: frozenset[str]) -> float:
    similarity = _similarity(expected, heard)
    if similarity == 1.0:
        return 0.0
    return 0.45 if similarity >= 0.82 else 1.0


def _word_status(expected: frozenset[str], heard: frozenset[str]) -> str:
    similarity = _similarity(expected, heard)
    if similarity == 1.0:
        return "correct"
    return "minor_issue" if similarity >= 0.82 else "incorrect"


def align_transcript(
    expected_words: list[str],
    transcript: str,
    *,
    expected_indices: Optional[list[int]] = None,
) -> AlignmentResult:
    """Align ASR words to an ayah without shifting all later feedback.

    A dynamic-programming edit alignment handles omissions, substitutions, and
    extra/repeated words. The returned statuses describe transcript matching
    only; they must not be presented as acoustic Tajweed judgements.
    """

    if expected_indices is None:
        expected_indices = list(range(len(expected_words)))
    if len(expected_indices) != len(expected_words):
        raise ValueError("expected_indices must match expected_words")

    heard_words = [word for word in transcript.strip().split() if normalize_arabic_word(word)]
    expected_normalized = [_normalization_variants(word) for word in expected_words]
    heard_normalized = [_normalization_variants(word) for word in heard_words]

    expected_count = len(expected_words)
    heard_count = len(heard_words)
    costs = [[0.0] * (heard_count + 1) for _ in range(expected_count + 1)]
    operations = [[""] * (heard_count + 1) for _ in range(expected_count + 1)]

    for expected_index in range(1, expected_count + 1):
        costs[expected_index][0] = float(expected_index)
        operations[expected_index][0] = "delete"
    for heard_index in range(1, heard_count + 1):
        costs[0][heard_index] = float(heard_index)
        operations[0][heard_index] = "insert"

    for expected_index in range(1, expected_count + 1):
        for heard_index in range(1, heard_count + 1):
            choices = [
                (
                    costs[expected_index - 1][heard_index - 1]
                    + _substitution_cost(
                        expected_normalized[expected_index - 1],
                        heard_normalized[heard_index - 1],
                    ),
                    "pair",
                ),
                (costs[expected_index - 1][heard_index] + 1.0, "delete"),
                (costs[expected_index][heard_index - 1] + 1.0, "insert"),
            ]
            costs[expected_index][heard_index], operations[expected_index][heard_index] = min(
                choices,
                key=lambda choice: choice[0],
            )

    aligned_reversed: list[AlignedWord] = []
    extra_word_count = 0
    expected_index = expected_count
    heard_index = heard_count
    while expected_index > 0 or heard_index > 0:
        operation = operations[expected_index][heard_index]
        if operation == "pair":
            expected_position = expected_index - 1
            heard_position = heard_index - 1
            aligned_reversed.append(
                AlignedWord(
                    expected_index=expected_indices[expected_position],
                    expected_text=expected_words[expected_position],
                    heard_text=heard_words[heard_position],
                    status=_word_status(
                        expected_normalized[expected_position],
                        heard_normalized[heard_position],
                    ),
                )
            )
            expected_index -= 1
            heard_index -= 1
        elif operation == "delete":
            expected_position = expected_index - 1
            aligned_reversed.append(
                AlignedWord(
                    expected_index=expected_indices[expected_position],
                    expected_text=expected_words[expected_position],
                    heard_text=None,
                    status="incorrect",
                )
            )
            expected_index -= 1
        elif operation == "insert":
            extra_word_count += 1
            heard_index -= 1
        else:
            raise RuntimeError("Transcript alignment could not be reconstructed")

    aligned = list(reversed(aligned_reversed))
    earned = sum(
        1.0 if word.status == "correct" else 0.5 if word.status == "minor_issue" else 0.0
        for word in aligned
    )
    denominator = max(1, len(expected_words) + extra_word_count)
    score = round(earned / denominator * 100)
    return AlignmentResult(words=aligned, extra_word_count=extra_word_count, score=score)
