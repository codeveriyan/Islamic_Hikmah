/**
 * HadeethEnc API Service
 *
 * Wraps the HadeethEnc.com API v1 to provide:
 *  - Thematic category browsing (root categories, subcategories)
 *  - Paginated hadith lists by category
 *  - Individual hadith details with grading, explanation, hints, word meanings
 *  - Text-based hadith search
 *  - Hybrid matching: pre-built mapping for popular collections + text search fallback
 *
 * Caching: memory Map → AsyncStorage → network (same pattern as cdnContentService.ts)
 * Attribution: HadeethEnc.com (required by terms of use)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ── API Base ────────────────────────────────────────────────────────────────────
const BASE_URL = "https://hadeethenc.com/api/v1";

// ── Cache Config ────────────────────────────────────────────────────────────────
const CACHE_PREFIX = "hikmah:hadeethenc:";
const CATEGORY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const HADITH_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;   // 30 days (content rarely changes)
const MAPPING_CACHE_PREFIX = "hikmah:hadeethenc:mapping:";

// ── Memory Cache (LRU-style, same pattern as cdnContentService.ts) ──────────
const memoryCache = new Map<string, { data: unknown; ts: number }>();
const MAX_MEMORY_ENTRIES = 200;

function getMemory<T>(key: string): T | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  // Move to end (most recently used)
  memoryCache.delete(key);
  memoryCache.set(key, entry);
  return entry.data as T;
}

function setMemory(key: string, data: unknown): void {
  memoryCache.delete(key);
  memoryCache.set(key, { data, ts: Date.now() });
  // Evict oldest if over limit
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
      // Expired — remove and return null
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
  } catch {
    // Cache write failure is non-critical
  }
}

// ── Network Fetch Helper ────────────────────────────────────────────────────────
async function fetchApi<T>(path: string): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HadeethEnc API error: HTTP ${response.status} for ${url}`);
  }
  return response.json() as Promise<T>;
}

// ── TypeScript Types (from live API response analysis) ──────────────────────────

/** A thematic category (e.g. "Creed", "Worship", "Manners") */
export interface HadeethEncCategory {
  id: string;
  title: string;
  hadeeths_count: string;
  parent_id: string | null;
}

/** A category tree node with children */
export interface CategoryTreeNode extends HadeethEncCategory {
  children: CategoryTreeNode[];
}

/** A hadith summary in a paginated list */
export interface HadeethEncListItem {
  id: string;
  title: string;
  translations: string[];
}

/** Pagination metadata */
export interface HadeethEncMeta {
  current_page: string;
  last_page: number;
  total_items: number;
  per_page: string;
}

/** Paginated hadith list response */
export interface HadeethEncListResponse {
  data: HadeethEncListItem[];
  meta: HadeethEncMeta;
}

/** A word meaning entry */
export interface HadeethEncWordMeaning {
  word: string;
  meaning: string;
}

/** Full hadith detail with grading, explanation, and benefits */
export interface HadeethEncHadith {
  id: string;
  title: string;
  hadeeth: string;
  attribution: string;
  grade: string;
  explanation: string;
  hints: string[];
  categories: string[];
  translations: string[];
  words_meanings: HadeethEncWordMeaning[];
  reference: string;
}

/** Enrichment data extracted from a HadeethEncHadith for display overlays */
export interface HadithEnrichment {
  hadeethEncId: string;
  grade: string;
  gradeKey: HadithGradeKey;
  attribution: string;
  explanation: string;
  hints: string[];
  wordsMeanings: HadeethEncWordMeaning[];
  reference: string;
}

/** Normalised grade keys for badge colour mapping */
export type HadithGradeKey =
  | "sahih"
  | "hasan"
  | "daif"
  | "fabricated"
  | "unknown";

// ── Grade Normalisation ─────────────────────────────────────────────────────────

/** Badge colours for each grade */
export const GRADE_BADGE_COLORS: Record<HadithGradeKey, { bg: string; text: string; label: string }> = {
  sahih:      { bg: "#10B981", text: "#FFFFFF", label: "Sahih" },
  hasan:      { bg: "#F59E0B", text: "#FFFFFF", label: "Hasan" },
  daif:       { bg: "#EF4444", text: "#FFFFFF", label: "Da'if" },
  fabricated: { bg: "#7C3AED", text: "#FFFFFF", label: "Fabricated" },
  unknown:    { bg: "#6B7280", text: "#FFFFFF", label: "Ungraded" },
};

/** Normalise the raw grade string from HadeethEnc to a key */
export function normalizeGrade(rawGrade: string): HadithGradeKey {
  const lower = rawGrade.toLowerCase();
  if (lower.includes("sahih") || lower.includes("authentic") || lower.includes("sound")) return "sahih";
  if (lower.includes("hasan") || lower.includes("good") || lower.includes("fair")) return "hasan";
  if (lower.includes("da'if") || lower.includes("daif") || lower.includes("weak")) return "daif";
  if (lower.includes("fabricat") || lower.includes("mawdu") || lower.includes("forged")) return "fabricated";
  return "unknown";
}

// ── API Functions ───────────────────────────────────────────────────────────────

/**
 * Fetch root-level thematic categories.
 * E.g. "Creed", "The Noble Qur'an", "Worship", etc.
 */
export async function getRootCategories(language: string = "en"): Promise<HadeethEncCategory[]> {
  const cacheKey = `categories:roots:${language}`;

  // 1. Memory
  const mem = getMemory<HadeethEncCategory[]>(cacheKey);
  if (mem) return mem;

  // 2. AsyncStorage
  const cached = await getCached<HadeethEncCategory[]>(cacheKey, CATEGORY_CACHE_TTL);
  if (cached) {
    setMemory(cacheKey, cached);
    return cached;
  }

  // 3. Network
  const data = await fetchApi<HadeethEncCategory[]>(
    `/categories/roots/?language=${encodeURIComponent(language)}`
  );
  setMemory(cacheKey, data);
  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch all categories (root + sub) in a flat list.
 * Use buildCategoryTree() to convert to a nested tree.
 */
export async function getAllCategories(language: string = "en"): Promise<HadeethEncCategory[]> {
  const cacheKey = `categories:all:${language}`;

  const mem = getMemory<HadeethEncCategory[]>(cacheKey);
  if (mem) return mem;

  const cached = await getCached<HadeethEncCategory[]>(cacheKey, CATEGORY_CACHE_TTL);
  if (cached) {
    setMemory(cacheKey, cached);
    return cached;
  }

  const data = await fetchApi<HadeethEncCategory[]>(
    `/categories/list/?language=${encodeURIComponent(language)}`
  );
  setMemory(cacheKey, data);
  setCache(cacheKey, data);
  return data;
}

/**
 * Get subcategories for a given parent category ID.
 */
export async function getSubcategories(
  language: string,
  parentId: string
): Promise<HadeethEncCategory[]> {
  const all = await getAllCategories(language);
  return all.filter((c) => c.parent_id === parentId);
}

/**
 * Fetch a paginated list of hadiths in a specific category.
 */
export async function getHadeethsByCategory(
  language: string,
  categoryId: string,
  page: number = 1,
  perPage: number = 20
): Promise<HadeethEncListResponse> {
  const cacheKey = `hadeeths:cat:${language}:${categoryId}:p${page}:pp${perPage}`;

  const mem = getMemory<HadeethEncListResponse>(cacheKey);
  if (mem) return mem;

  const cached = await getCached<HadeethEncListResponse>(cacheKey, HADITH_CACHE_TTL);
  if (cached) {
    setMemory(cacheKey, cached);
    return cached;
  }

  const data = await fetchApi<HadeethEncListResponse>(
    `/hadeeths/list/?language=${encodeURIComponent(language)}&category_id=${encodeURIComponent(categoryId)}&page=${page}&per_page=${perPage}`
  );
  setMemory(cacheKey, data);
  setCache(cacheKey, data);
  return data;
}

/**
 * Fetch the full detail of a single hadith by its HadeethEnc ID.
 */
export async function getHadeethDetail(
  language: string,
  id: string
): Promise<HadeethEncHadith> {
  const cacheKey = `hadeeths:one:${language}:${id}`;

  const mem = getMemory<HadeethEncHadith>(cacheKey);
  if (mem) return mem;

  const cached = await getCached<HadeethEncHadith>(cacheKey, HADITH_CACHE_TTL);
  if (cached) {
    setMemory(cacheKey, cached);
    return cached;
  }

  const data = await fetchApi<HadeethEncHadith>(
    `/hadeeths/one/?language=${encodeURIComponent(language)}&id=${encodeURIComponent(id)}`
  );
  setMemory(cacheKey, data);
  setCache(cacheKey, data);
  return data;
}

/**
 * Search hadiths by text query.
 */
export async function searchHadeeths(
  language: string,
  query: string,
  page: number = 1,
  perPage: number = 20
): Promise<HadeethEncListResponse> {
  const cacheKey = `hadeeths:search:${language}:${hashStr(query)}:p${page}`;

  const mem = getMemory<HadeethEncListResponse>(cacheKey);
  if (mem) return mem;

  // Search results have a shorter cache TTL (1 day)
  const cached = await getCached<HadeethEncListResponse>(cacheKey, 24 * 60 * 60 * 1000);
  if (cached) {
    setMemory(cacheKey, cached);
    return cached;
  }

  const data = await fetchApi<HadeethEncListResponse>(
    `/hadeeths/list/?language=${encodeURIComponent(language)}&search=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
  );
  setMemory(cacheKey, data);
  setCache(cacheKey, data);
  return data;
}

// ── Category Tree Builder ───────────────────────────────────────────────────────

/**
 * Convert a flat category list into a nested tree.
 */
export function buildCategoryTree(categories: HadeethEncCategory[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  // Create tree nodes
  for (const cat of categories) {
    nodeMap.set(cat.id, { ...cat, children: [] });
  }

  // Link parents ↔ children
  for (const cat of categories) {
    const node = nodeMap.get(cat.id)!;
    if (cat.parent_id === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        // Orphan — treat as root
        roots.push(node);
      }
    }
  }

  return roots;
}

// ── Hybrid Matching: Pre-Built Mapping + Text Search Fallback ───────────────────

/**
 * Pre-built mapping for the most popular collections.
 * Maps `{collectionId}:{hadithNumber}` → HadeethEnc ID.
 *
 * This is populated by running a one-time mapping script that aligns
 * Sunnah.com hadith numbers with HadeethEnc IDs via text matching.
 * See: scripts/build-hadeethenc-mapping.ts
 *
 * For now, we start with an empty mapping that gets populated at runtime
 * as hadiths are matched via text search. Matches are persisted to
 * AsyncStorage so they only need to be resolved once.
 */
const enrichmentInFlight = new Map<string, Promise<HadithEnrichment | null>>();

/**
 * Deduplicate concurrent enrichment requests. A hadith card renders both an
 * inline grade and a full detail panel, so both consumers share one lookup.
 */
export async function getHadithEnrichment(
  collectionId: string,
  hadithNumber: number,
  hadithText: string,
  language: string = "en"
): Promise<HadithEnrichment | null> {
  const requestKey = `${language}:${collectionId}:${hadithNumber}`;
  const existing = enrichmentInFlight.get(requestKey);
  if (existing) return existing;

  const request = resolveHadithEnrichment(collectionId, hadithNumber, hadithText, language);
  enrichmentInFlight.set(requestKey, request);
  try {
    return await request;
  } finally {
    if (enrichmentInFlight.get(requestKey) === request) {
      enrichmentInFlight.delete(requestKey);
    }
  }
}

/**
 * Look up the HadeethEnc enrichment for a hadith from your existing collection.
 *
 * Strategy:
 *  1. Check if we have a cached mapping for this specific hadith
 *  2. If found, fetch the full detail from HadeethEnc
 *  3. If not, search by text and cache the mapping for next time
 *  4. Returns null if no match found (graceful degradation)
 */
async function resolveHadithEnrichment(
  collectionId: string,
  hadithNumber: number,
  hadithText: string,
  language: string = "en"
): Promise<HadithEnrichment | null> {
  const mappingKey = `${collectionId}:${hadithNumber}`;

  // 1. Check memory cache for enrichment
  const memKey = `enrichment:${language}:${mappingKey}`;
  const memResult = getMemory<HadithEnrichment | null>(memKey);
  if (memResult !== undefined) return memResult;

  try {
    // 2. Check if we have a persisted mapping
    let hadeethEncId = await getMappedId(mappingKey);

    // 3. If no mapping, search by text
    if (!hadeethEncId) {
      hadeethEncId = await findMatchBySearch(hadithText, language);
      if (hadeethEncId) {
        // Persist the mapping for future lookups
        await setMappedId(mappingKey, hadeethEncId);
      }
    }

    if (!hadeethEncId) {
      // No match found — cache null so we don't re-search
      setMemory(memKey, null);
      await setMappedId(mappingKey, "__none__");
      return null;
    }

    if (hadeethEncId === "__none__") {
      setMemory(memKey, null);
      return null;
    }

    // 4. Fetch full detail
    const detail = await getHadeethDetail(language, hadeethEncId);
    const enrichment: HadithEnrichment = {
      hadeethEncId: detail.id,
      grade: detail.grade,
      gradeKey: normalizeGrade(detail.grade),
      attribution: detail.attribution,
      explanation: detail.explanation,
      hints: detail.hints || [],
      wordsMeanings: detail.words_meanings || [],
      reference: detail.reference,
    };

    setMemory(memKey, enrichment);
    return enrichment;
  } catch (error) {
    if (__DEV__) {
      console.warn("[HadeethEncService] Enrichment fetch failed:", error);
    }
    return null;
  }
}

// ── Mapping Persistence ─────────────────────────────────────────────────────────

async function getMappedId(mappingKey: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(MAPPING_CACHE_PREFIX + mappingKey);
  } catch {
    return null;
  }
}

async function setMappedId(mappingKey: string, hadeethEncId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(MAPPING_CACHE_PREFIX + mappingKey, hadeethEncId);
  } catch {
    // Non-critical
  }
}

/**
 * Search HadeethEnc for a hadith matching the given text.
 * Returns the HadeethEnc ID if a strong match is found, null otherwise.
 */
async function findMatchBySearch(
  hadithText: string,
  language: string
): Promise<string | null> {
  // Use first ~80 chars of the hadith text as a search query
  // (more chars = more specific, but API may struggle with very long queries)
  const cleanText = hadithText
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanText.length < 10) return null;

  const searchQuery = cleanText.substring(0, 80);

  try {
    const results = await searchHadeeths(language, searchQuery, 1, 5);
    if (!results.data || results.data.length === 0) return null;

    // Search ranking alone is not enough to safely attach a grade to a
    // different narration. Fetch a few candidates and require a meaningful
    // token overlap with the source narration before accepting a mapping.
    const candidates = await Promise.all(
      results.data.slice(0, 3).map(async (result) => {
        try {
          const detail = await getHadeethDetail(language, result.id);
          return { id: result.id, text: detail.hadeeth };
        } catch {
          return null;
        }
      })
    );

    const sourceTokens = toMatchTokens(cleanText);
    const queryTokens = sourceTokens.slice(0, 18);
    if (queryTokens.length < 6) return null;

    let best: { id: string; score: number } | null = null;
    for (const candidate of candidates) {
      if (!candidate) continue;
      const candidateTokens = new Set(toMatchTokens(candidate.text));
      const matched = queryTokens.filter((token) => candidateTokens.has(token)).length;
      const score = matched / queryTokens.length;
      if (!best || score > best.score) best = { id: candidate.id, score };
    }

    // A conservative threshold prevents a loosely related search result from
    // displaying an authoritative-looking authenticity badge.
    return best && best.score >= 0.45 ? best.id : null;
  } catch {
    return null;
  }
}

function toMatchTokens(text: string): string[] {
  return text
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

/**
 * Bulk-load pre-built mappings from a JSON file into AsyncStorage.
 * Called once during app initialization or when the mapping data is updated.
 */
export async function loadPrebuiltMappings(
  mappings: Record<string, string>
): Promise<void> {
  const entries = Object.entries(mappings).map(
    ([key, value]) => [MAPPING_CACHE_PREFIX + key, value] as [string, string]
  );

  if (entries.length > 0) {
    try {
      await AsyncStorage.multiSet(entries);
    } catch (error) {
      if (__DEV__) {
        console.warn("[HadeethEncService] Failed to load pre-built mappings:", error);
      }
    }
  }
}

// ── Utilities ───────────────────────────────────────────────────────────────────

function hashStr(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

/**
 * Map a HadeethEnc language ISO code to a human-readable name.
 * Useful for displaying available translations.
 */
export function getHadeethEncLanguageName(code: string): string {
  const names: Record<string, string> = {
    ar: "Arabic", en: "English", fr: "French", es: "Spanish", tr: "Turkish",
    ur: "Urdu", id: "Indonesian", ru: "Russian", fa: "Persian", hi: "Hindi",
    bn: "Bengali", ta: "Tamil", te: "Telugu", kn: "Kannada", ml: "Malayalam",
    gu: "Gujarati", mr: "Marathi", pa: "Punjabi", ha: "Hausa", so: "Somali",
    ms: "Malay", uz: "Uzbek", yo: "Yoruba", ps: "Pashto", zh: "Chinese",
    de: "German", pt: "Portuguese", ja: "Japanese", ko: "Korean", it: "Italian",
    th: "Thai", vi: "Vietnamese", sw: "Swahili", ku: "Kurdish",
  };
  return names[code] || code.toUpperCase();
}
