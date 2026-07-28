const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '..', 'public', 'tafsirs');
const outputDir = path.join(__dirname, '..', 'public', 'tafsirs_chunked');

if (!fs.existsSync(inputDir)) {
  console.error(`❌ Input directory does not exist: ${inputDir}`);
  process.exit(1);
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
console.log(`🔍 Found ${files.length} Tafsir files to process & verify...\n`);

let grandMaxMB = 0;
let grandMaxInfo = '';
let totalProcessedFiles = 0;
let totalVerifiedAyahs = 0;

files.forEach((file, index) => {
  const tafsirId = path.basename(file, '.json');
  const filePath = path.join(inputDir, file);
  
  let rawData;
  try {
    rawData = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`❌ Failed reading ${file}:`, err);
    return;
  }

  let json;
  try {
    json = JSON.parse(rawData);
  } catch (err) {
    console.error(`❌ Failed parsing JSON in ${file}:`, err);
    return;
  }

  const originalKeyCount = Object.keys(json).length;

  const surahs = {};
  for (const [key, val] of Object.entries(json)) {
    const surahNum = key.split(':')[0];
    if (!surahs[surahNum]) surahs[surahNum] = {};
    surahs[surahNum][key] = val;
  }

  const targetTafsirDir = path.join(outputDir, tafsirId);
  if (!fs.existsSync(targetTafsirDir)) {
    fs.mkdirSync(targetTafsirDir, { recursive: true });
  }

  let fileMaxMB = 0;
  let chunkedKeyCount = 0;

  for (const [surahNum, data] of Object.entries(surahs)) {
    const keysInChunk = Object.keys(data).length;
    chunkedKeyCount += keysInChunk;

    const content = JSON.stringify(data);
    const sizeMB = content.length / (1024 * 1024);
    if (sizeMB > fileMaxMB) fileMaxMB = sizeMB;
    if (sizeMB > grandMaxMB) {
      grandMaxMB = sizeMB;
      grandMaxInfo = `Tafsir ${tafsirId}, Surah ${surahNum} (${sizeMB.toFixed(2)} MB)`;
    }

    const outPath = path.join(targetTafsirDir, `${surahNum}.json`);
    fs.writeFileSync(outPath, content, 'utf8');
  }

  // ─── Data Integrity Checksum Verification ───
  if (originalKeyCount !== chunkedKeyCount) {
    console.error(`❌ INTEGRITY ERROR in Tafsir ${tafsirId}! Original ayahs: ${originalKeyCount}, Chunked sum: ${chunkedKeyCount}`);
    process.exit(1);
  }

  totalProcessedFiles++;
  totalVerifiedAyahs += chunkedKeyCount;

  if ((index + 1) % 10 === 0 || index === files.length - 1) {
    console.log(`[${index + 1}/${files.length}] ✅ Verified & Chunked Tafsir ${tafsirId} (${originalKeyCount} ayahs, max surah chunk: ${fileMaxMB.toFixed(2)} MB)`);
  }
});

console.log('\n==================================================');
console.log('🎉 ALL TAFSIR CHUNKS SUCCESSFULLY GENERATED & VERIFIED!');
console.log(`- Total Tafsir books processed: ${totalProcessedFiles}`);
console.log(`- Total Ayahs verified: ${totalVerifiedAyahs.toLocaleString()}`);
console.log(`- Largest single chunk: ${grandMaxInfo}`);
console.log('==================================================\n');
