"""Generate the backend Quran corpus from the app's canonical local dataset.

Run from the repository root or from backend/:

    python backend/scripts/build_quran_corpus.py
"""

import json
import sys
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent
SOURCE = REPO_ROOT / "frontend" / "src" / "data" / "quran" / "quranData.json"
DESTINATION = BACKEND_DIR / "data" / "quran_corpus.json"
EXPECTED_SURAH_COUNT = 114
EXPECTED_AYAH_COUNT = 6236


def main() -> None:
    if not SOURCE.is_file():
        print(f"Could not find the source Quran corpus at {SOURCE}", file=sys.stderr)
        raise SystemExit(1)

    surahs = json.loads(SOURCE.read_text(encoding="utf-8"))
    if len(surahs) != EXPECTED_SURAH_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_SURAH_COUNT} surahs, found {len(surahs)}."
        )

    flattened = [
        {
            "surah_number": surah["number"],
            "surah_name_english": surah["name"],
            "surah_name_arabic": surah["arabicName"],
            "ayah_number": ayah["numberInSurah"],
            "arabic": ayah["arabic"],
            "translation": ayah.get("translation", ""),
        }
        for surah in surahs
        for ayah in surah["ayahs"]
    ]
    if len(flattened) != EXPECTED_AYAH_COUNT:
        raise ValueError(
            f"Expected {EXPECTED_AYAH_COUNT} ayahs, found {len(flattened)}."
        )

    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    DESTINATION.write_text(
        json.dumps(flattened, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(
        f"Wrote {len(flattened)} ayahs from {len(surahs)} surahs "
        f"to {DESTINATION}"
    )


if __name__ == "__main__":
    main()
