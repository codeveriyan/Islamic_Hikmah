/**
 * prepareHadithCDN.js
 * Fetches all Hadith books from Sunnah.com public API + fawazahmed/AhmedBaset CDNs,
 * saves them as per-book JSON arrays, and uploads gzip-compressed to Cloudflare R2.
 *
 * Usage:
 *   CLOUDFLARE_ACCOUNT_ID=xxx CLOUDFLARE_R2_ACCESS_KEY_ID=xxx CLOUDFLARE_R2_SECRET_ACCESS_KEY=xxx \
 *   node scripts/prepareHadithCDN.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

const frontendDir = path.join(__dirname, "..");
if (typeof process.loadEnvFile === "function") {
  const localEnvPath = path.join(frontendDir, ".env.content.local");
  if (fs.existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "islamic-contents-cdn";
const release = require(path.join(frontendDir, "content-version.json"));

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

// ── Book definitions ────────────────────────────────────────────────────────
// source: "fawazahmed" → fetches from fawazahmed CDN (eng-{id}.min.json + ara-{id}.min.json)
// source: "ahmedbaset" → fetches from AhmedBaset CDN
const BOOKS = [
  // ── 6 Major Books — fawazahmed CDN ──────────────────────────────────────
  { id: "bukhari",               fawazahmed: "bukhari" },
  { id: "muslim",                fawazahmed: "muslim" },
  { id: "nasai",                 fawazahmed: "nasai" },
  { id: "abudawud",              fawazahmed: "abudawud" },
  { id: "tirmidhi",              fawazahmed: "tirmidhi" },
  { id: "ibnmajah",              fawazahmed: "ibnmajah" },
  { id: "malik",                 fawazahmed: "malik" },

  // ── AhmedBaset CDN ───────────────────────────────────────────────────────
  { id: "ahmad",                 ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/the_9_books/ahmed.json" },
  { id: "darimi",                ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/the_9_books/darimi.json" },
  { id: "nawawi40",              ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/forties/nawawi40.json" },
  { id: "qudsi40",               ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/forties/qudsi40.json" },
  { id: "shahwaliullah40",       ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/forties/shahwaliullah40.json" },
  { id: "riyad_assalihin",       ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/riyad_assalihin.json" },
  { id: "bulugh_almaram",        ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/bulugh_almaram.json" },
  { id: "aladab_almufrad",       ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/aladab_almufrad.json" },
  { id: "shamail_muhammadiyah",  ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/shamail_muhammadiyah.json" },
  { id: "mishkat_almasabih",     ahmedbaset: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/mishkat_almasabih.json" },
];





// ── helpers ─────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchJson(url, attempt = 1) {
  const res = await fetch(url);
  if (res.status === 429) {
    const wait = attempt * 1500;
    console.log(`  Rate-limited. Waiting ${wait}ms...`);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function uploadToR2(bookId, hadiths) {
  const key = `${release.version}/hadith/${bookId}.json`;
  const raw = Buffer.from(JSON.stringify(hadiths));
  const hash = sha256(raw);

  // Skip if already uploaded with same content
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    if (head.Metadata?.sha256 === hash) {
      console.log(`  ⏭  Already up-to-date: ${key}`);
      return;
    }
  } catch (e) {
    if (e?.$metadata?.httpStatusCode !== 404 && e?.name !== "NotFound") throw e;
  }

  const body = zlib.gzipSync(raw, { level: 9 });
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: "application/json; charset=utf-8",
    ContentEncoding: "gzip",
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { sha256: hash },
  }));
  const kb = (raw.length / 1024).toFixed(1);
  const compKb = (body.length / 1024).toFixed(1);
  console.log(`  ✅ Uploaded ${key} (${kb} KB → ${compKb} KB gzip, ${hadiths.length} hadiths)`);
}

// ── Sunnah.com API fetcher ──────────────────────────────────────────────────
async function fetchFromSunnah(sunnahId) {
  const hadiths = [];
  const seen = new Set();
  let page = 1;

  while (true) {
    const url = `${SUNNAH_API_BASE}/api/hadith/${encodeURIComponent(sunnahId)}/hadiths?page=${page}&limit=100`;
    let data;
    try {
      data = await fetchJson(url);
    } catch (e) {
      console.log(`  ⚠ Sunnah API failed page ${page}: ${e.message}`);
      break;
    }
    const items = Array.isArray(data?.data) ? data.data : [];
    if (items.length === 0) break;

    for (const item of items) {
      const translations = Array.isArray(item.hadith) ? item.hadith : [];
      const en = translations.find(t => t.lang === "en") || translations[0] || {};
      const ar = translations.find(t => t.lang === "ar") || {};
      const num = Number(item.hadithNumber || item.hadithNumberInBook || item.hadithnumber);
      const text = cleanText(en.body || item.text || "");
      const arabicText = cleanText(ar.body || item.arabicText || "");
      if (num && (text || arabicText) && !seen.has(num)) {
        seen.add(num);
        hadiths.push({ hadithnumber: num, bookNumber: Number(item.bookNumber || 0) || undefined, text, arabicText });
      }
    }
    console.log(`  page ${page} → ${hadiths.length} total`);
    if (items.length < 100) break;
    page += 1;
    await sleep(200); // be polite
  }
  return hadiths;
}

// ── fawazahmed CDN fetcher ───────────────────────────────────────────────────
async function fetchFromFawazahmed(bookId) {
  const [engData, araData] = await Promise.all([
    fetchJson(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${bookId}.min.json`),
    fetchJson(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${bookId}.min.json`).catch(() => ({ hadiths: [] })),
  ]);
  const araMap = {};
  (araData?.hadiths || []).forEach(h => { if (h.hadithnumber) araMap[h.hadithnumber] = h.text; });
  return (engData?.hadiths || [])
    .filter(h => h.text || araMap[h.hadithnumber])
    .map(h => ({ hadithnumber: h.hadithnumber, text: cleanText(h.text || ""), arabicText: cleanText(araMap[h.hadithnumber] || "") }));
}

// ── AhmedBaset CDN fetcher ───────────────────────────────────────────────────
async function fetchFromAhmedBaset(url) {
  const data = await fetchJson(url);
  return (data?.hadiths || []).map(h => ({
    hadithnumber: Number(h.idInBook || h.id || 1),
    text: cleanText((h.english?.narrator ? `${h.english.narrator} ` : "") + (h.english?.text || h.english || "")),
    arabicText: cleanText(h.arabic || ""),
  })).filter(h => h.text || h.arabicText);
}

function cleanText(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📚 Preparing Hadith CDN for release ${release.version}\n`);

  for (const book of BOOKS) {
    console.log(`\n▶ ${book.id}`);
    let hadiths = [];

    try {
      if (book.sunnah) {
        console.log(`  Fetching from Sunnah.com API (${book.sunnah})...`);
        hadiths = await fetchFromSunnah(book.sunnah);
      } else if (book.fawazahmed) {
        console.log(`  Fetching from fawazahmed CDN (${book.fawazahmed})...`);
        hadiths = await fetchFromFawazahmed(book.fawazahmed);
      } else if (book.ahmedbaset) {
        console.log(`  Fetching from AhmedBaset CDN...`);
        hadiths = await fetchFromAhmedBaset(book.ahmedbaset);
      }
    } catch (e) {
      console.log(`  ❌ Failed to fetch ${book.id}: ${e.message}`);
      continue;
    }

    if (hadiths.length === 0) {
      console.log(`  ⚠ No hadiths found for ${book.id}, skipping.`);
      continue;
    }

    hadiths.sort((a, b) => a.hadithnumber - b.hadithnumber);
    await uploadToR2(book.id, hadiths);
  }

  console.log(`\n✅ Done! All Hadith books uploaded to R2.\n`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
