const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "e6870f3e9aaf5d00ffbc83f71cef6252";
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "ee2c6afaed4a2a235677fe01bff969e8";
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "d971a328d6f395d24625c7fdc15d2a542f47de7a5b20ffa3ba70973a8aa275dc";
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "islamic-contents-cdn";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey }
});

const oldPrefixes = [
  "2026-07-28.1/",
  "2026-07-28.2/",
  "2026-07-28.3/",
  "2026-07-28.4/"
];

async function deletePrefix(prefix) {
  let token;
  let deletedTotal = 0;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, ContinuationToken: token }));
    const objects = res.Contents || [];
    if (objects.length > 0) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: { Objects: objects.map(o => ({ Key: o.Key })) }
      };
      await s3.send(new DeleteObjectsCommand(deleteParams));
      deletedTotal += objects.length;
    }
    token = res.NextContinuationToken;
  } while(token);
  console.log(`Deleted ${deletedTotal} items from ${prefix}`);
}

async function run() {
  for (const prefix of oldPrefixes) {
    await deletePrefix(prefix);
  }
  console.log("Cleanup complete!");
}

run().catch(console.error);
