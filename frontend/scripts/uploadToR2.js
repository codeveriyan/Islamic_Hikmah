const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");

const frontendDir = path.join(__dirname, "..");
const generatedDir = path.join(frontendDir, ".generated", "r2");
const hadithSourceDir = path.join(frontendDir, "content-source", "hadith");
const release = require(path.join(frontendDir, "content-version.json"));

if (typeof process.loadEnvFile === "function") {
  const localEnvPath = path.join(frontendDir, ".env.content.local");
  if (fs.existsSync(localEnvPath)) process.loadEnvFile(localEnvPath);
}

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName =
  process.env.CLOUDFLARE_R2_BUCKET_NAME || "islamic-hikmah-cdn";
const dryRun = process.argv.includes("--dry-run");

if (fs.existsSync(hadithSourceDir)) {
  const generatedHadithDir = path.join(generatedDir, "hadith");
  fs.rmSync(generatedHadithDir, { recursive: true, force: true });
  fs.cpSync(hadithSourceDir, generatedHadithDir, {
    recursive: true,
  });
}
if (!fs.existsSync(generatedDir)) {
  console.error("Generated content is missing. Run npm run content:prepare first.");
  process.exit(1);
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

const contentFiles = listFiles(generatedDir).filter(
  (file) => file.endsWith(".json") && path.basename(file) !== "manifest.json"
);
const manifest = {
  version: release.version,
  schemaVersion: release.schemaVersion,
  generatedAt: new Date().toISOString(),
  files: contentFiles.map((file) => {
    const body = fs.readFileSync(file);
    return {
      path: path.relative(generatedDir, file).replace(/\\/g, "/"),
      bytes: body.length,
      sha256: sha256(body),
    };
  }),
};
fs.writeFileSync(
  path.join(generatedDir, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);

const filesToUpload = listFiles(generatedDir).filter((file) =>
  file.endsWith(".json")
);
if (dryRun) {
  const totalBytes = manifest.files.reduce((sum, file) => sum + file.bytes, 0);
  console.log(
    JSON.stringify(
      {
        version: release.version,
        files: filesToUpload.length,
        sourceMiB: Number((totalBytes / 1024 / 1024).toFixed(1)),
        manifest: path.join(generatedDir, "manifest.json"),
      },
      null,
      2
    )
  );
  process.exit(0);
}

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error(
    "Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY."
  );
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function sendWithRetry(command) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await s3Client.send(command);
    } catch (error) {
      lastError = error;
      const status = error?.$metadata?.httpStatusCode;
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function uploadFile(filePath) {
  const rawBody = fs.readFileSync(filePath);
  const hash = sha256(rawBody);
  const relativePath = path.relative(generatedDir, filePath).replace(/\\/g, "/");
  const key = `${release.version}/${relativePath}`;

  try {
    const existing = await sendWithRetry(
      new HeadObjectCommand({ Bucket: bucketName, Key: key })
    );
    if (existing.Metadata?.sha256 === hash) return `Skipped ${key}`;
    throw new Error(
      `${key} already exists with different content. Bump content-version.json before uploading.`
    );
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status !== 404 && error?.name !== "NotFound") throw error;
  }

  await sendWithRetry(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: zlib.gzipSync(rawBody, { level: 9 }),
      ContentType: "application/json; charset=utf-8",
      ContentEncoding: "gzip",
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: { sha256: hash },
    })
  );
  return `Uploaded ${key}`;
}

async function runPool(items, concurrency, task) {
  let nextIndex = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      const result = await task(items[index]);
      if ((index + 1) % 100 === 0 || index === items.length - 1) {
        console.log(`${index + 1}/${items.length}: ${result}`);
      }
    }
  });
  await Promise.all(workers);
}

runPool(filesToUpload, 8, uploadFile)
  .then(() => console.log(`Published immutable content release ${release.version}.`))
  .catch((error) => {
    console.error("R2 upload failed:", error);
    process.exit(1);
  });
