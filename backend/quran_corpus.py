"""Load the backend-owned Quran corpus used by recitation identification."""

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parent
CORPUS_PATH = BACKEND_DIR / "data" / "quran_corpus.json"
EXPECTED_SURAH_COUNT = 114
EXPECTED_AYAH_COUNT = 6236


class CorpusUnavailableError(RuntimeError):
    """Raised when the generated corpus is missing or structurally invalid."""


@dataclass(frozen=True)
class AyahEntry:
    surah_number: int
    surah_name_english: str
    surah_name_arabic: str
    ayah_number: int
    arabic: str
    translation: str = ""


@lru_cache(maxsize=1)
def get_corpus() -> tuple[AyahEntry, ...]:
    if not CORPUS_PATH.is_file():
        raise CorpusUnavailableError(
            f"Quran corpus not found at {CORPUS_PATH}. Run "
            "python scripts/build_quran_corpus.py first."
        )

    try:
        raw = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
        corpus = tuple(AyahEntry(**entry) for entry in raw)
    except (OSError, json.JSONDecodeError, TypeError) as exc:
        raise CorpusUnavailableError("The Quran corpus could not be loaded.") from exc

    surah_count = len({entry.surah_number for entry in corpus})
    if len(corpus) != EXPECTED_AYAH_COUNT or surah_count != EXPECTED_SURAH_COUNT:
        raise CorpusUnavailableError(
            "The Quran corpus is incomplete: expected "
            f"{EXPECTED_SURAH_COUNT} surahs and {EXPECTED_AYAH_COUNT} ayahs."
        )
    return corpus
