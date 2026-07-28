# Static content release pipeline

Large Tafsir and optional Hadith fallback files are source data, not web
assets. Keep them outside `public`:

- `content-source/tafsirs/<tafsir-id>.json`
- `content-source/hadith/<book-id>.json`

Both directories are intentionally ignored by Git.

## Prepare a release

1. Run `npm run content:prepare`.
2. Run `npm run verify:content`.
3. Inspect `.generated/r2`. Tafsir payload files are capped at 512 KiB and
   oversized surahs use a small index plus multiple parts.
4. If the content changed, bump the immutable version in
   `content-version.json`.

## Upload to Cloudflare R2

Set these in the shell or in ignored `.env.content.local`:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME` (optional)

Then run `npm run content:upload`. Objects are gzip-compressed, uploaded under
the version prefix, and assigned an immutable one-year cache policy. Existing
objects with a different SHA-256 hash are rejected, requiring a new version.

Set `EXPO_PUBLIC_CONTENT_CDN_URL` as a plain-text EAS variable for both preview
and production. Never place R2 credentials or the Sunnah.com API key in an
`EXPO_PUBLIC_` variable.
