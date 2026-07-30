const {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");

const frontendDir = path.join(__dirname, "..");
if (typeof process.loadEnvFile === "function") {
  const localEnvPath = path.join(frontendDir, ".env.content.local");
  if (fs.existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "islamic-contents-cdn";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const corsConfig = {
  CORSRules: [
    {
      AllowedOrigins: ["*"],
      AllowedMethods: ["GET", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["Content-Encoding", "Content-Length", "Content-Type"],
      MaxAgeSeconds: 86400,
    },
  ],
};

async function main() {
  console.log(`Setting CORS on bucket: ${bucketName}`);
  
  await s3Client.send(
    new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfig,
    })
  );
  console.log("✅ CORS configured successfully!");

  // Verify
  const result = await s3Client.send(
    new GetBucketCorsCommand({ Bucket: bucketName })
  );
  console.log("Verified CORS rules:", JSON.stringify(result.CORSRules, null, 2));
}

main().catch((err) => {
  console.error("Failed to set CORS:", err);
  process.exit(1);
});
