/**
 * QuranEnc API Service
 *
 * Wraps the QuranEnc.com API v1 to provide:
 *  - List of available translations (multiple per language)
 *  - Surah-level translation fetching with footnotes
 *  - Language-filtered translation discovery
 *
 * This supplements (does NOT replace) the existing Quran.com API integration.
 * Users can choose QuranEnc as an additional translation source in Settings.
 *
 * Caching: memory Map → AsyncStorage → network
 * Attribution: QuranEnc.com (required by terms of use)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ── API Base ────────────────────────────────────────────────────────────────────
const BASE_URL = "https://quranenc.com/api/v1";
const TRANSLATION_KEY_STORAGE = "hikmah:quranenc:translation_key";
const LEGACY_TRANSLATION_KEY_STORAGE = "quranenc_translation_key";

// ── Cache Config ────────────────────────────────────────────────────────────────
const CACHE_PREFIX = "hikmah:quranenc:";
const TRANSLATIONS_LIST_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const SURAH_TRANSLATION_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Memory Cache ────────────────────────────────────────────────────────────────
const memoryCache = new Map<string, { data: unknown; ts: number }>();
const MAX_MEMORY_ENTRIES = 150;

function getMemory<T>(key: string): T | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  memoryCache.delete(key);
  memoryCache.set(key, entry);
  return entry.data as T;
}

function setMemory(key: string, data: unknown): void {
  memoryCache.delete(key);
  memoryCache.set(key, { data, ts: Date.now() });
  while (memoryCache.size > MAX_MEMORY_ENTRIES) {
    const oldest = memoryCache.keys().next().value as string | undefined;
    if (!oldest) break;
    memoryCache.delete(oldest);
  }
}

// ── AsyncStorage Cache Helpers ──────────────────────────────────────────────────
interface CachedEntry<T> {
  data: T;
  cachedAt: number;
}

async function getCached<T>(key: string, ttl: number): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CachedEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.cachedAt > ttl) {
      AsyncStorage.removeItem(CACHE_PREFIX + key).catch(() => {});
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

async function setCache<T>(key: string, data: T): Promise<void> {
  try {
    const entry: CachedEntry<T> = { data, cachedAt: Date.now() };
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {}
}

// ── Network Fetch Helper ────────────────────────────────────────────────────────
async function fetchApi<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`QuranEnc API error: HTTP ${response.status} for ${url}`);
  }
  const json = await response.json();
  // QuranEnc wraps responses in { result: [...] }
  return (json.result ?? json) as T;
}

// ── TypeScript Types (from live API response analysis) ──────────────────────────

/** Metadata for an available translation/tafsir */
export interface QuranEncTranslation {
  key: string;                // e.g. "english_saheeh", "english_mokhtasar"
  language_iso_code: string;  // e.g. "en", "es", "ta"
  version: string;            // e.g. "1.0.0"
  last_update: number;        // Unix timestamp
  title: string;              // e.g. "Saheeh International"
  description: string;        // Detailed description with provenance
}

/** A single verse with translation and optional footnotes */
export interface QuranEncVerse {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes: string;           // HTML or empty string
}

/** A translation grouped by language for the picker UI */
export interface LanguageTranslationGroup {
  languageCode: string;
  languageName: string;
  translations: QuranEncTranslation[];
}

// ── Language Name Mapping ───────────────────────────────────────────────────────

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", ar: "Arabic", fr: "French", es: "Spanish", tr: "Turkish",
  ur: "Urdu", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu",
  kn: "Kannada", ml: "Malayalam", gu: "Gujarati", mr: "Marathi",
  pa: "Punjabi", id: "Indonesian", ru: "Russian", fa: "Persian",
  ha: "Hausa", so: "Somali", ms: "Malay", uz: "Uzbek", yo: "Yoruba",
  ps: "Pashto", zh: "Chinese", de: "German", pt: "Portuguese",
  ja: "Japanese", ko: "Korean", it: "Italian", th: "Thai",
  vi: "Vietnamese", sw: "Swahili", ku: "Kurdish", si: "Sinhala",
  am: "Amharic", az: "Azerbaijani", bs: "Bosnian", sq: "Albanian",
  tg: "Tajik", km: "Khmer", my: "Burmese", nl: "Dutch",
};

export function getLanguageNameFromCode(code: string): string {
  return LANGUAGE_NAMES[code] || code.toUpperCase();
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * Fetch all available translations/tafsirs.
 * Optionally filter by language ISO code.
 */
export async function getAvailableTranslations(
  languageCode?: string
): Promise<QuranEncTranslation[]> {
  const cacheKey = `translations:list:${languageCode || "all"}`;

  // 1. Memory
  const mem = getMemory<QuranEncTranslation[]>(cacheKey);
  if (mem) return mem;

  // 2. AsyncStorage
  const cached = await getCached<QuranEncTranslation[]>(cacheKey, TRANSLATIONS_LIST_TTL);
  if (cached) {
    setMemory(cacheKey, cached);
    return cached;
  }

  // 3. Network
  const path = languageCode
    ? `/translations/list/${encodeURIComponent(languageCode)}`
    : "/translations/list";
  const data = await fetchApi<QuranEncTranslation[]>(path);
  setMemory(cacheKey, data);
  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch a complete Surah translation by translation key and surah number.
 * Returns an array of verses with Arabic text, translation, and footnotes.
 */
export async function getSurahTranslation(
  translationKey: string,
  surahNumber: number
): Promise<QuranEncVerse[]> {
  const cacheKey = `sura:${translationKey}:${surahNumber}`;

  // 1. Memory
  const mem = getMemory<QuranEncVerse[]>(cacheKey);
  if (mem) return mem;

  // 2. AsyncStorage
  const cached = await getCached<QuranEncVerse[]>(cacheKey, SURAH_TRANSLATION_TTL);
  if (cached) {
    setMemory(cacheKey, cached);
    return cached;
  }

  // 3. Network
  const data = await fetchApi<QuranEncVerse[]>(
    `/translation/sura/${encodeURIComponent(translationKey)}/${surahNumber}`
  );
  setMemory(cacheKey, data);
  setCache(cacheKey, data);
  return data;
}

/**
 * Group available translations by language for the UI picker.
 * Returns a sorted list of language groups, each containing
 * the available translations for that language.
 */
export async function getTranslationsByLanguage(): Promise<LanguageTranslationGroup[]> {
  const all = await getAvailableTranslations();

  const groupMap = new Map<string, QuranEncTranslation[]>();
  for (const t of all) {
    const code = t.language_iso_code;
    if (!groupMap.has(code)) groupMap.set(code, []);
    groupMap.get(code)!.push(t);
  }

  const groups: LanguageTranslationGroup[] = [];
  for (const [code, translations] of groupMap.entries()) {
    groups.push({
      languageCode: code,
      languageName: getLanguageNameFromCode(code),
      translations: translations.sort((a, b) => a.title.localeCompare(b.title)),
    });
  }

  // Sort by language name, but put English first
  groups.sort((a, b) => {
    if (a.languageCode === "en") return -1;
    if (b.languageCode === "en") return 1;
    return a.languageName.localeCompare(b.languageName);
  });

  return groups;
}

/**
 * Get the user's stored QuranEnc translation key preference.
 * Returns null if no preference is set (user hasn't opted into QuranEnc).
 */
export async function getStoredTranslationKey(): Promise<string | null> {
  try {
    const current = await AsyncStorage.getItem(TRANSLATION_KEY_STORAGE);
    if (current) return current;

    const legacy = await AsyncStorage.getItem(LEGACY_TRANSLATION_KEY_STORAGE);
    if (legacy) {
      await AsyncStorage.setItem(TRANSLATION_KEY_STORAGE, legacy);
      await AsyncStorage.removeItem(LEGACY_TRANSLATION_KEY_STORAGE);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store the user's preferred QuranEnc translation key.
 */
export async function setStoredTranslationKey(key: string): Promise<void> {
  try {
    const normalized = key.trim();
    if (normalized) {
      await AsyncStorage.setItem(TRANSLATION_KEY_STORAGE, normalized);
    } else {
      await AsyncStorage.removeItem(TRANSLATION_KEY_STORAGE);
    }
    await AsyncStorage.removeItem(LEGACY_TRANSLATION_KEY_STORAGE);
  } catch {}
}

/**
 * Check if QuranEnc is enabled as a translation source.
 */
export async function isQuranEncEnabled(): Promise<boolean> {
  const key = await getStoredTranslationKey();
  return key !== null && key.length > 0;
}

/**
 * Strip HTML from footnotes text for plain display.
 */
export function stripHtmlFromFootnotes(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Prefetch the next surah's translation in the background.
 * Called when the user finishes reading a surah.
 */
export function prefetchNextSurah(
  translationKey: string,
  currentSurahNumber: number
): void {
  const next = currentSurahNumber + 1;
  if (next > 114) return;
  // Fire and forget — cached for next time
  getSurahTranslation(translationKey, next).catch(() => {});
}
