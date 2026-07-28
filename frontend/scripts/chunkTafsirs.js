const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const frontendDir = path.join(__dirname, "..");
const preferredInputDir = path.join(frontendDir, "content-source", "tafsirs");
const legacyInputDir = path.join(frontendDir, "public", "tafsirs");
const inputDir = fs.existsSync(preferredInputDir)
  ? preferredInputDir
  : legacyInputDir;
const outputDir = path.join(
  frontendDir,
  ".generated",
  "r2",
  "tafsirs_chunked"
);
const maxChunkBytes = Number(process.env.TAFSIR_CHUNK_MAX_BYTES || 512 * 1024);

if (!fs.existsSync(inputDir)) {
  console.error(
    `Tafsir source directory not found. Expected: ${preferredInputDir}`
  );
  process.exit(1);
}
if (inputDir === legacyInputDir) {
  console.warn(
    "Using legacy public/tafsirs input. Move it to content-source/tafsirs so Expo web exports cannot copy it."
  );
}
if (!Number.isFinite(maxChunkBytes) || maxChunkBytes < 64 * 1024) {
  console.error("TAFSIR_CHUNK_MAX_BYTES must be at least 65536.");
  process.exit(1);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

function digestRecord(record) {
  const hash = crypto.createHash("sha256");
  for (const key of Object.keys(record).sort()) {
    hash.update(key);
    hash.update("\0");
    hash.update(JSON.stringify(record[key]));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function splitRecord(record) {
  const parts = [];
  let current = {};
  let currentBytes = 2;

  for (const [key, value] of Object.entries(record)) {
    const entryBytes =
      Buffer.byteLength(JSON.stringify(key)) +
      Buffer.byteLength(JSON.stringify(value)) +
      2;
    if (Object.keys(current).length > 0 && currentBytes + entryBytes > maxChunkBytes) {
      parts.push(current);
      current = {};
      currentBytes = 2;
    }
    current[key] = value;
    currentBytes += entryBytes;
  }
  if (Object.keys(current).length > 0) parts.push(current);
  return parts;
}

const files = fs.readdirSync(inputDir).filter((file) => file.endsWith(".json"));
let tafsirCount = 0;
let ayahCount = 0;
let outputFileCount = 0;
let largestOutputBytes = 0;

for (const [fileIndex, file] of files.entries()) {
  const tafsirId = path.basename(file, ".json");
  const sourcePath = path.join(inputDir, file);
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new Error(`${file} must contain an object keyed by surah:ayah`);
  }

  const surahs = {};
  for (const [key, value] of Object.entries(source)) {
    const [surah] = key.split(":");
    if (!/^\d+$/.test(surah)) throw new Error(`Invalid ayah key "${key}" in ${file}`);
    (surahs[surah] ||= {})[key] = value;
  }

  const tafsirOutputDir = path.join(outputDir, tafsirId);
  fs.mkdirSync(tafsirOutputDir, { recursive: true });
  const reconstructed = {};

  for (const [surah, record] of Object.entries(surahs)) {
    const serialized = JSON.stringify(record);
    if (Buffer.byteLength(serialized) <= maxChunkBytes) {
      const outputPath = path.join(tafsirOutputDir, `${surah}.json`);
      fs.writeFileSync(outputPath, serialized);
      largestOutputBytes = Math.max(largestOutputBytes, Buffer.byteLength(serialized));
      outputFileCount += 1;
      Object.assign(reconstructed, record);
      continue;
    }

    const parts = splitRecord(record);
    const partNames = [];
    parts.forEach((part, index) => {
      const partName = `${surah}.part-${String(index + 1).padStart(3, "0")}.json`;
      const partContent = JSON.stringify(part);
      fs.writeFileSync(path.join(tafsirOutputDir, partName), partContent);
      partNames.push(partName);
      largestOutputBytes = Math.max(
        largestOutputBytes,
        Buffer.byteLength(partContent)
      );
      outputFileCount += 1;
      Object.assign(reconstructed, part);
    });
    const indexContent = JSON.stringify({ __chunked: true, parts: partNames });
    fs.writeFileSync(path.join(tafsirOutputDir, `${surah}.json`), indexContent);
    outputFileCount += 1;
  }

  if (digestRecord(source) !== digestRecord(reconstructed)) {
    throw new Error(`SHA-256 integrity verification failed for Tafsir ${tafsirId}`);
  }

  tafsirCount += 1;
  ayahCount += Object.keys(source).length;
  if ((fileIndex + 1) % 10 === 0 || fileIndex === files.length - 1) {
    console.log(`Verified ${fileIndex + 1}/${files.length}: Tafsir ${tafsirId}`);
  }
}

console.log(
  JSON.stringify(
    {
      tafsirCount,
      ayahCount,
      outputFileCount,
      maxChunkKiB: Number((largestOutputBytes / 1024).toFixed(1)),
      outputDir,
    },
    null,
    2
  )
);
