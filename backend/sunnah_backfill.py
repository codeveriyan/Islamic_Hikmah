import argparse
import json
import os
import time
from pathlib import Path
from typing import Any, Dict

import requests
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

SUNNAH_API_BASE_URL = os.environ.get("SUNNAH_API_BASE_URL", "https://api.sunnah.com/v1").rstrip("/")
SUNNAH_API_KEY = os.environ.get("SUNNAH_API_KEY")
SUNNAH_CACHE_DIR = Path(os.environ.get("SUNNAH_CACHE_DIR", ROOT_DIR / "data" / "sunnah_cache"))

ALL_COLLECTIONS = [
    "bukhari",
    "muslim",
    "nasai",
    "abudawud",
    "tirmidhi",
    "ibnmajah",
    "malik",
    "ahmad",
    "darimi",
    "adab",
    "shamail",
    "nawawi40",
    "riyadussalihin",
    "bulugh",
    "mishkat",
    "qudsi40",
    "hisn",
    "ibnkhuzayma",
    "ibnhibban",
    "hakim",
    "abdurrazzaq",
    "ibnabishayba",
    "daraqutni",
    "bayhaqi",
    "nasai-kubra",
]


def cache_path(collection: str, page: int, limit: int) -> Path:
    safe_collection = "".join(ch for ch in collection if ch.isalnum() or ch in {"-", "_"})
    return SUNNAH_CACHE_DIR / safe_collection / f"page-{page}-limit-{limit}.json"


def fetch_page(collection: str, page: int, limit: int) -> Dict[str, Any]:
    if not SUNNAH_API_KEY:
        raise RuntimeError("SUNNAH_API_KEY is missing. Add it to backend/.env or the process environment.")
    response = requests.get(
        f"{SUNNAH_API_BASE_URL}/hadiths",
        headers={"X-API-Key": SUNNAH_API_KEY},
        params={"collection": collection, "page": page, "limit": limit},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict) or not isinstance(payload.get("data"), list):
        raise RuntimeError(f"Sunnah.com returned an invalid payload for {collection} page {page}.")
    return payload


def backfill_collection(collection: str, limit: int, sleep_seconds: float) -> None:
    page = 1
    total_hadith = 0
    total_pages = 0
    while page:
        payload = fetch_page(collection, page, limit)
        path = cache_path(collection, page, limit)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        total_pages += 1
        total_hadith += len(payload.get("data", []))
        print(f"{collection}: cached page {page} ({len(payload.get('data', []))} hadith)")
        page = payload.get("next") or 0
        if page and sleep_seconds > 0:
            time.sleep(sleep_seconds)
    print(f"{collection}: complete, {total_hadith} hadith across {total_pages} pages")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download Sunnah.com hadith pages into the backend offline cache.")
    parser.add_argument("collections", nargs="*", help="Sunnah.com collection ids, for example bukhari muslim nasai-kubra")
    parser.add_argument("--all", action="store_true", help="Backfill every collection configured in Islamic Hikmah.")
    parser.add_argument("--limit", type=int, default=100, choices=range(1, 101), metavar="1-100")
    parser.add_argument("--sleep", type=float, default=0.25, help="Delay between API requests. Default stays under 5 requests/second.")
    args = parser.parse_args()

    collections = ALL_COLLECTIONS if args.all else args.collections
    if not collections:
        parser.error("provide at least one collection or use --all")

    for collection in collections:
        backfill_collection(collection, args.limit, args.sleep)


if __name__ == "__main__":
    main()
