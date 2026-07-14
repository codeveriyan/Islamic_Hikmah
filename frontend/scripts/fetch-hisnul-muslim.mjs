import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "src/data/hisnulMuslim.json");
const base = "https://www.hisnmuslim.com/api/en";

const escapeControlCharactersInStrings = (input) => {
  let output = "";
  let inString = false;
  let escaped = false;

  for (const character of input) {
    if (escaped) {
      output += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && inString) {
      output += character;
      escaped = true;
      continue;
    }
    if (character === '"') {
      output += character;
      inString = !inString;
      continue;
    }
    if (inString && character.charCodeAt(0) < 32) {
      output += character === "\n" ? "\\n" : character === "\r" ? "\\r" : character === "\t" ? "\\t" : "";
      continue;
    }
    output += character;
  }
  return output;
};

const readJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, "");
  return JSON.parse(escapeControlCharactersInStrings(text));
};

const readChapterEntries = async (number) => {
  const response = await fetch(`${base}/${number}.json`);
  if (!response.ok) throw new Error(`Chapter ${number} returned ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, "");
  const firstBracket = text.indexOf("[");
  const lastBracket = text.lastIndexOf("]");
  if (firstBracket < 0 || lastBracket < firstBracket) throw new Error(`Chapter ${number} has no entries array`);
  return JSON.parse(escapeControlCharactersInStrings(text.slice(firstBracket, lastBracket + 1)));
};

const index = await readJson(`${base}/husn_en.json`);
const chapterMeta = new Map(index.English.map((chapter) => [Number(chapter.ID), chapter]));
const loadChapter = async (number) => {
  const entries = await readChapterEntries(number);
  const meta = chapterMeta.get(number);

  return {
    number,
    title: meta?.TITLE || `Chapter ${number}`,
    audio: meta?.AUDIO_URL?.replace(/^http:/, "https:"),
    duas: entries.map((entry, indexInChapter) => ({
      id: Number(entry.ID) || Number(`${number}${String(indexInChapter + 1).padStart(2, "0")}`),
      arabic: entry.ARABIC_TEXT || entry.Text || "",
      transliteration: entry.LANGUAGE_ARABIC_TRANSLATED_TEXT || "",
      translation: entry.TRANSLATED_TEXT || "",
      repeat: Number(entry.REPEAT) || 1,
      audio: entry.AUDIO?.replace(/^http:/, "https:"),
    })),
  };
};

const chapters = [];
for (let first = 1; first <= 132; first += 8) {
  const numbers = Array.from({ length: Math.min(8, 133 - first) }, (_, indexInBatch) => first + indexInBatch);
  chapters.push(...await Promise.all(numbers.map(loadChapter)));
}

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({ source: "Hisnul Muslim", chapters }, null, 2)}\n`, "utf8");

const total = chapters.reduce((sum, chapter) => sum + chapter.duas.length, 0);
console.log(`Saved ${chapters.length} chapters and ${total} du'as to ${output}`);
