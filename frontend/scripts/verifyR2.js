const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "e6870f3e9aaf5d00ffbc83f71cef6252";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "ee2c6afaed4a2a235677fe01bff969e8";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "d971a328d6f395d24625c7fdc15d2a542f47de7a5b20ffa3ba70973a8aa275dc";
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "islamic-contents-cdn";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey }
});

async function verify() {
  let count = 0, tafsirs = 0, images = 0, books = 0, audio = 0, manifest = 0;
  let token;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: "2026-07-28.5/", ContinuationToken: token }));
    (res.Contents || []).forEach(o => {
      count++;
      if (o.Key.includes("/tafsirs_chunked/")) tafsirs++;
      else if (o.Key.includes("/images/")) images++;
      else if (o.Key.includes("/books/")) books++;
      else if (o.Key.includes("/audio/")) audio++;
      else if (o.Key.includes("manifest.json")) manifest++;
    });
    token = res.NextContinuationToken;
  } while(token);

  console.log(JSON.stringify({ total: count, tafsirs, images, books, audio, manifest }, null, 2));
}

verify().catch(console.error);
