# Sunnah.com hadith backfill

Sunnah.com asked that mobile/web apps do not bundle the API key or call their API directly in production. Islamic Hikmah keeps the key on the backend and uses it to build a local cache that the app reads through our API.

## Local setup

Create `backend/.env`:

```env
SUNNAH_API_KEY=your-sunnah-com-api-key
SUNNAH_API_BASE_URL=https://api.sunnah.com/v1
SUNNAH_CACHE_DIR=./data/sunnah_cache
```

`backend/.env` and `backend/data/sunnah_cache/` are gitignored.

## Backfill one collection

```powershell
python backend/sunnah_backfill.py bukhari
```

## Backfill every configured collection

```powershell
python backend/sunnah_backfill.py --all
```

The script sleeps `0.25` seconds between page requests by default, keeping bulk refreshes below Sunnah.com's 5 requests/second cap. Refresh the cache at least once a month to pick up corrections and fresh data.

## Backend API

The app calls:

```text
GET /api/hadith/{collection}/hadiths?page=1&limit=100
```

The backend serves cached pages first. Use `refresh=true` or the backfill script when you intentionally want to refresh from Sunnah.com.
