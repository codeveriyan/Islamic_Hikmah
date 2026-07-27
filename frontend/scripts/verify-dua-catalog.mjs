import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const catalogPath = path.join(scriptDirectory, "..", "src", "data", "duas.ts");
const source = fs.readFileSync(catalogPath, "utf8");
const marker = "export const CATEGORIES: DuaCategory[] = ";
const jsonStart = source.indexOf(marker);
const jsonEnd = source.lastIndexOf("];");

if (jsonStart < 0 || jsonEnd < 0) {
  throw new Error("Unable to find the serialized CATEGORIES catalog.");
}

const categories = JSON.parse(
  source.slice(jsonStart + marker.length, jsonEnd + 1),
);

const expectedCounts = {
  morning: 24,
  evening: 23,
  sleep: 18,
  tahajjud: 12,
  salah: 52,
  "after-salah": 12,
  ruqyah: 20,
  praises: 30,
  salawat: 9,
  quranic: 41,
  "sunnah-duas": 75,
  "names-of-allah": 99,
  istighfar: 19,
  ummah: 7,
  "waking-up": 5,
  nightmares: 1,
  clothes: 4,
  "lavatory-wudu": 6,
  home: 3,
  "adhan-masjid": 8,
  istikharah: 1,
  gatherings: 4,
  "food-drink": 16,
  travel: 13,
  death: 16,
  nature: 14,
  social: 6,
  iman: 6,
  difficulties: 22,
  hajj: 10,
  money: 9,
  marriage: 12,
};

// These are source omissions or confirmed dead source audio links, not accidental app data loss.
const expectedMissingFields = {
  morning: { virtue: 1, explanation: 6, audio: 2 },
  evening: { audio: 1 },
  sleep: { translation: 1, transliteration: 1 },
  salah: { explanation: 1 },
  ruqyah: { translation: 1, transliteration: 1, audio: 1 },
  praises: { virtue: 5 },
  quranic: { virtue: 40 },
  "sunnah-duas": { audio: 2 },
  "names-of-allah": { virtue: 99, explanation: 99, audio: 99 },
  istighfar: { virtue: 9, explanation: 10, audio: 1 },
  ummah: { virtue: 4, explanation: 4 },
  "waking-up": { explanation: 1 },
  nightmares: { explanation: 1 },
  travel: { virtue: 1, explanation: 1 },
  death: { explanation: 1 },
  iman: { transliteration: 1, explanation: 1 },
  marriage: { virtue: 5 },
};

const errors = [];
const expectedIds = Object.keys(expectedCounts);
const actualIds = categories.map((category) => category.id);

if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
  errors.push(
    `Category order/set changed.\nExpected: ${expectedIds.join(", ")}\nActual: ${actualIds.join(", ")}`,
  );
}

const allDuaIds = new Set();
const auditedFields = [
  "translation",
  "transliteration",
  "virtue",
  "explanation",
  "audio",
];

for (const category of categories) {
  const expectedCount = expectedCounts[category.id];
  if (category.duas.length !== expectedCount) {
    errors.push(
      `${category.id}: expected ${expectedCount} entries, found ${category.duas.length}`,
    );
  }

  if (!category.sourceUrl) {
    errors.push(`${category.id}: sourceUrl is missing`);
  }

  const missing = Object.fromEntries(
    auditedFields.map((field) => [
      field,
      category.duas.filter((dua) => !dua[field]).length,
    ]),
  );
  const expectedMissing = expectedMissingFields[category.id] ?? {};

  for (const field of auditedFields) {
    const expected = expectedMissing[field] ?? 0;
    if (missing[field] !== expected) {
      errors.push(
        `${category.id}.${field}: expected ${expected} missing values, found ${missing[field]}`,
      );
    }
  }

  category.duas.forEach((dua, index) => {
    if (!dua.id || !dua.title || !dua.arabic) {
      errors.push(`${category.id}[${index}]: missing id, title, or Arabic text`);
    }

    if (allDuaIds.has(dua.id)) {
      errors.push(`Duplicate dua id: ${dua.id}`);
    }
    allDuaIds.add(dua.id);

    if (dua.audio) {
      try {
        const url = new URL(dua.audio);
        if (url.protocol !== "https:") {
          errors.push(`${dua.id}: audio URL is not HTTPS`);
        }
      } catch {
        errors.push(`${dua.id}: invalid audio URL`);
      }
    } else if (category.id !== "names-of-allah" && dua.audioFallback !== "tts") {
      errors.push(`${dua.id}: missing audio without an explicit TTS fallback`);
    }
  });
}

const mojibakePattern = /(?:Ã|Â|Ø|Ù|â€|â€™)/u;
if (mojibakePattern.test(JSON.stringify(categories))) {
  errors.push("The catalog contains mojibake/corrupted Unicode.");
}

if (errors.length) {
  console.error(`Dua catalog verification failed:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const total = categories.reduce((sum, category) => sum + category.duas.length, 0);
console.log(
  `Dua catalog verified: ${categories.length} categories, ${total} entries, no duplicate IDs or corrupted Unicode.`,
);
