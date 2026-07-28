/**
 * Cloudflare R2 Content Upload Tool
 * 
 * 🔒 SECURITY WARNING:
 * Secret credentials (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) MUST NEVER be prefixed
 * with EXPO_PUBLIC_ or imported in React Native client code.
 * This script runs strictly on your local development machine or CI server.
 * 
 * Usage:
 *   node scripts/uploadToR2.js
 */

const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Load local environment variables (not bundled into client)
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "islamic-hikmah-cdn";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.log("ℹ️ R2 Upload Script Ready.");
  console.log("To sync local chunks to Cloudflare R2, set these environment variables in your terminal / .env.local:");
  console.log("  - CLOUDFLARE_ACCOUNT_ID");
  console.log("  - CLOUDFLARE_R2_ACCESS_KEY_ID");
  console.log("  - CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  console.log("  - CLOUDFLARE_R2_BUCKET_NAME (default: islamic-hikmah-cdn)");
  console.log("\nChunked local files are ready in: public/tafsirs_chunked/\n");
  process.exit(0);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function uploadFile(filePath, key) {
  const fileContent = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: "application/json",
    CacheControl: "public, max-age=31536000, immutable",
  });

  await s3Client.send(command);
  console.log(`✅ Uploaded: ${key}`);
}

async function uploadDirectory(dirPath, baseR2Key = "") {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const r2Key = baseR2Key ? `${baseR2Key}/${item}` : item;
    if (fs.statSync(fullPath).isDirectory()) {
      await uploadDirectory(fullPath, r2Key);
    } else if (item.endsWith(".json")) {
      await uploadFile(fullPath, r2Key);
    }
  }
}

async function run() {
  const localChunkDir = path.join(__dirname, "..", "public", "tafsirs_chunked");
  if (!fs.existsSync(localChunkDir)) {
    console.error("❌ public/tafsirs_chunked/ directory not found. Run `node scripts/chunkTafsirs.js` first.");
    process.exit(1);
  }

  console.log(`🚀 Syncing ${localChunkDir} to Cloudflare R2 bucket: ${bucketName}...`);
  await uploadDirectory(localChunkDir, "tafsirs_chunked");
  console.log("\n🎉 Cloudflare R2 Upload Complete!");
}

run().catch((err) => {
  console.error("❌ R2 Upload Failed:", err);
  process.exit(1);
});
