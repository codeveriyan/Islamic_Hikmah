/**
 * IslamHouse API Proxy Service
 *
 * Fetches items (books, audios, videos, etc.) from the FastAPI proxy
 * which in turn queries the official IslamHouse API v3.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/src/apiBaseUrl";

// ── Cache Config ────────────────────────────────────────────────────────────────
const CACHE_PREFIX = "hikmah:islamhouse:";
const ITEMS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const ITEM_DETAIL_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── Memory Cache (LRU-style) ──────────────────────────────────────────────────
const memoryCache = new Map<string, { data: unknown; ts: number }>();
const MAX_MEMORY_ENTRIES = 200;

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
  } catch {
    // Non-critical
  }
}

// ── Types (based on IslamHouse v3 API) ──────────────────────────────────────────

export interface IslamHouseItemShort {
  id: number;
  title: string;
  type: string;
  add_date: number;
  update_date: number;
  source_language: string;
  author_id?: string;
  author_title?: string;
  source_id?: string;
  source_title?: string;
  description?: string;
}

export interface IslamHouseGetItemsResponse {
  data: IslamHouseItemShort[];
  links: any;
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface IslamHouseItemDetail {
  id: number;
  title: string;
  type: string;
  description: string;
  add_date: number;
  update_date: number;
  source_language: string;
  authors: { id: number; title: string; kind: string }[];
  sources: { id: number; title: string; url: string }[];
  categories: { id: number; title: string }[];
  locales: { language: string; url: string }[];
  attachments: {
    id: number;
    order: number;
    title: string;
    description: string;
    url: string;
    size: string;
    extension_type: string;
    mime_type: string;
  }[];
}

// ── API Functions ───────────────────────────────────────────────────────────────

export async function getIslamHouseItems(
  language: string = "en",
  type: string = "showall",
  page: number = 1,
  limit: number = 20
): Promise<IslamHouseGetItemsResponse> {
  const cacheKey = `items:${language}:${type}:${page}:${limit}`;

  // 1. Memory Cache
  const mem = getMemory<IslamHouseGetItemsResponse>(cacheKey);
  if (mem) return mem;

  // 2. AsyncStorage
  const stored = await getCached<IslamHouseGetItemsResponse>(cacheKey, ITEMS_CACHE_TTL);
  if (stored) {
    setMemory(cacheKey, stored);
    return stored;
  }

  // 3. Network Fetch
  const url = `${API_BASE_URL}/islamhouse/items?language=${language}&type=${type}&page=${page}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Proxy error fetching IslamHouse items: HTTP ${response.status}`);
  }
  const data = await response.json();

  setMemory(cacheKey, data);
  await setCache(cacheKey, data);
  return data;
}

export async function getIslamHouseItemDetail(
  itemId: number,
  language: string = "en"
): Promise<IslamHouseItemDetail> {
  const cacheKey = `item_detail:${itemId}:${language}`;

  const mem = getMemory<IslamHouseItemDetail>(cacheKey);
  if (mem) return mem;

  const stored = await getCached<IslamHouseItemDetail>(cacheKey, ITEM_DETAIL_CACHE_TTL);
  if (stored) {
    setMemory(cacheKey, stored);
    return stored;
  }

  const url = `${API_BASE_URL}/islamhouse/item/${itemId}?language=${language}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Proxy error fetching IslamHouse item details: HTTP ${response.status}`);
  }
  const data = await response.json();

  setMemory(cacheKey, data);
  await setCache(cacheKey, data);
  return data;
}

export async function searchIslamHouseItems(
  language: string = "en",
  query: string,
  type: string = "showall",
  page: number = 1,
  limit: number = 10
): Promise<IslamHouseGetItemsResponse> {
  const cacheKey = `search:${language}:${type}:${encodeURIComponent(query)}:${page}:${limit}`;

  const mem = getMemory<IslamHouseGetItemsResponse>(cacheKey);
  if (mem) return mem;

  const stored = await getCached<IslamHouseGetItemsResponse>(cacheKey, ITEMS_CACHE_TTL);
  if (stored) {
    setMemory(cacheKey, stored);
    return stored;
  }

  const url = `${API_BASE_URL}/islamhouse/search?language=${language}&query=${encodeURIComponent(query)}&type=${type}&page=${page}&limit=${limit}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Proxy error searching IslamHouse: HTTP ${response.status}`);
  }
  const data = await response.json();

  setMemory(cacheKey, data);
  await setCache(cacheKey, data);
  return data;
}
