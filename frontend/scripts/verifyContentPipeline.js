const fs = require("fs");
const path = require("path");

const frontendDir = path.join(__dirname, "..");
const servicePath = path.join(
  frontendDir,
  "src",
  "services",
  "cdnContentService.ts"
);
const readScreenPath = path.join(frontendDir, "app", "quran", "read", "[page].tsx");
const hadithScreenPath = path.join(frontendDir, "app", "hadith", "[book].tsx");
const version = require(path.join(frontendDir, "content-version.json"));

const service = fs.readFileSync(servicePath, "utf8");
const readScreen = fs.readFileSync(readScreenPath, "utf8");
const hadithScreen = fs.readFileSync(hadithScreenPath, "utf8");
const failures = [];

if (!/^\d{4}-\d{2}-\d{2}\.\d+$/.test(version.version)) {
  failures.push("content-version.json must use YYYY-MM-DD.N format");
}
if (!service.includes("CONTENT_VERSION")) {
  failures.push("CDN service is not using the content release version");
}
if (!readScreen.includes("getTafsirSurah(selectedTafsirId, surah)")) {
  failures.push("Read Quran is not using the chunked Tafsir service");
}
if (/raw\.githubusercontent\.com.*public\/tafsirs/.test(readScreen)) {
  failures.push("Read Quran still references monolithic GitHub Tafsir files");
}
if (/x-api-key|SUNNAH_API_KEY/.test(hadithScreen)) {
  failures.push("Hadith frontend contains a Sunnah.com credential or API header");
}
if (
  (process.env.EAS_BUILD || process.env.VERIFY_DEPLOYMENT_ENV) &&
  !process.env.EXPO_PUBLIC_CONTENT_CDN_URL
) {
  failures.push("EXPO_PUBLIC_CONTENT_CDN_URL is required for deployment builds");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL: ${failure}`));
  process.exit(1);
}
console.log("Content pipeline integration checks passed.");
