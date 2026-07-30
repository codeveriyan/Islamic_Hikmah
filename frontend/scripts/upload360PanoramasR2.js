/**
 * Script to verify and upload 360° Equirectangular Panoramas & Thumbnails
 * to Cloudflare R2 storage bucket (`2026-07-28.5/360/`).
 */

const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "d94e33989c745cf54898ff99c4246698";
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "6aa8caeeb32a58b29c9efd978a3c8965";
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "c72eaed9a2aa9ae55ceb0965c4ec9cfcaefebcceae8a9d16a5d4111322253ed5";
const BUCKET_NAME = "islamic-contents-cdn";
const RELEASE_PREFIX = "2026-07-28.5/360/";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function fileExistsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch (e) {
    return false;
  }
}

async function uploadToR2(localPath, r2Key, contentType = "image/jpeg") {
  const fileBuffer = fs.readFileSync(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  console.log(`Uploaded to R2: ${r2Key}`);
}

async function main() {
  console.log("=== 360° Panoramas R2 Uploader ===");
  console.log(`Target Bucket: ${BUCKET_NAME}`);
  console.log(`Target Prefix: ${RELEASE_PREFIX}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fileExistsInR2, uploadToR2 };
