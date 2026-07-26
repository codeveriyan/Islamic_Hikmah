"""Download and validate the configured Quran ASR model before serving users."""

import sys
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

from learn_quran.asr import get_quran_asr_service  # noqa: E402


def main() -> None:
    service = get_quran_asr_service()
    print(f"Preparing {service.model_name} at {service.model_revision}...")
    service.ensure_loaded()
    status = service.status()
    print(f"Quran ASR ready on {status['device']}.")


if __name__ == "__main__":
    main()
