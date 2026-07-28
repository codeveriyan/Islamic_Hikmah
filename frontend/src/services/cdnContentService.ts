import * as FileSystem from "expo-file-system/legacy";
import * as Network from "expo-network";
import { Platform } from "react-native";
import contentRelease from "../../content-version.json";

const CDN_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_CDN_URL?.replace(/\/$/, "");
export const CONTENT_VERSION = contentRelease.version;
const CONTENT_BASE_URL = CDN_BASE_URL
  ? `${CDN_BASE_URL}/${encodeURIComponent(CONTENT_VERSION)}`
  : "";

if (__DEV__ && !CDN_BASE_URL) {
  console.warn(
    "[CDNContentService] EXPO_PUBLIC_CONTENT_CDN_URL is not configured. " +
      "CDN-backed Tafsir and Hadith content will be unavailable."
  );
}

const CACHE_ROOT = `${FileSystem.documentDirectory || ""}content_cache/`;
const CACHE_DIR = `${CACHE_ROOT}${CONTENT_VERSION}/`;
const MAX_MEMORY_CACHE_BYTES = 32 * 1024 * 1024;
const memoryCache = new Map<string, { data: unknown; bytes: number }>();
const inFlight = new Map<string, Promise<ContentFetchResult<any>>>();
let memoryCacheBytes = 0;
let cacheReadyPromise: Promise<void> | null = null;

export type ContentFetchResult<T = any> = {
  success: boolean;
  data?: T;
  isCached?: boolean;
  error?: string;
};

type TafsirRecord = Record<string, any>;
type SplitChunkIndex = { __chunked: true; parts: string[] };

function isObjectRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isSplitChunkIndex(value: unknown): value is SplitChunkIndex {
  return (
    isObjectRecord(value) &&
    value.__chunked === true &&
    Array.isArray(value.parts) &&
    value.parts.every((part) => typeof part === "string")
  );
}

function estimateBytes(data: unknown): number {
  try {
    return JSON.stringify(data).length * 2;
  } catch {
    return 0;
  }
}

function getMemory<T>(key: string): T | undefined {
  const entry = memoryCache.get(key);
  if (!entry) return undefined;
  memoryCache.delete(key);
  memoryCache.set(key, entry);
  return entry.data as T;
}

function setMemory(key: string, data: unknown): void {
  const bytes = estimateBytes(data);
  if (bytes <= 0 || bytes > MAX_MEMORY_CACHE_BYTES) return;
  const previous = memoryCache.get(key);
  if (previous) memoryCacheBytes -= previous.bytes;
  memoryCache.delete(key);
  memoryCache.set(key, { data, bytes });
  memoryCacheBytes += bytes;
  while (memoryCacheBytes > MAX_MEMORY_CACHE_BYTES) {
    const oldest = memoryCache.entries().next().value as
      | [string, { data: unknown; bytes: number }]
      | undefined;
    if (!oldest) break;
    memoryCache.delete(oldest[0]);
    memoryCacheBytes -= oldest[1].bytes;
  }
}

async function ensureDirExists(dirPath: string): Promise<void> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(dirPath);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}

async function ensureCurrentCacheVersion(): Promise<void> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
  if (cacheReadyPromise) return cacheReadyPromise;
  cacheReadyPromise = (async () => {
    const markerPath = `${CACHE_ROOT}version.txt`;
    let current = "";
    try {
      const marker = await FileSystem.getInfoAsync(markerPath);
      if (marker.exists) current = await FileSystem.readAsStringAsync(markerPath);
    } catch {}
    if (current.trim() !== CONTENT_VERSION) {
      await FileSystem.deleteAsync(CACHE_ROOT, { idempotent: true });
    }
    await ensureDirExists(CACHE_DIR);
    await FileSystem.writeAsStringAsync(markerPath, CONTENT_VERSION);
  })();
  return cacheReadyPromise;
}

async function writeJsonAtomically(path: string, data: unknown): Promise<void> {
  const tempPath = `${path}.tmp`;
  await FileSystem.writeAsStringAsync(tempPath, JSON.stringify(data));
  await FileSystem.deleteAsync(path, { idempotent: true });
  await FileSystem.moveAsync({ from: tempPath, to: path });
}

async function readJsonFile<T>(
  path: string,
  validator: (value: unknown) => value is T
): Promise<T | null> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(path));
    if (!validator(parsed)) throw new Error("Invalid cached content");
    return parsed;
  } catch {
    await FileSystem.deleteAsync(path, { idempotent: true }).catch(() => {});
    return null;
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} from CDN`);
  return response.json();
}

async function fetchTafsirChunk(remoteUrl: string): Promise<TafsirRecord> {
  const initial = await fetchJson(remoteUrl);
  if (isObjectRecord(initial) && !isSplitChunkIndex(initial)) return initial;
  if (!isSplitChunkIndex(initial)) throw new Error("Invalid Tafsir chunk");

  const base = remoteUrl.slice(0, remoteUrl.lastIndexOf("/") + 1);
  const merged: TafsirRecord = {};
  for (let index = 0; index < initial.parts.length; index += 4) {
    const batch = initial.parts.slice(index, index + 4);
    const parts = await Promise.all(
      batch.map((part) => fetchJson(`${base}${encodeURIComponent(part)}`))
    );
    for (const part of parts) {
      if (!isObjectRecord(part)) throw new Error("Invalid Tafsir chunk part");
      Object.assign(merged, part);
    }
  }
  return merged;
}

async function isOnWifi(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.type === Network.NetworkStateType.WIFI;
  } catch {
    return false;
  }
}

export async function getTafsirSurah(
  tafsirId: number | string,
  surahId: number | string,
  options: { useMemoryCache?: boolean } = {}
): Promise<ContentFetchResult<TafsirRecord>> {
  const useMemoryCache = options.useMemoryCache !== false;
  const safeTafsirId = encodeURIComponent(String(tafsirId));
  const safeSurahId = encodeURIComponent(String(surahId));
  const cacheKey = `${CONTENT_VERSION}:tafsir:${safeTafsirId}:${safeSurahId}`;

  if (useMemoryCache) {
    const cached = getMemory<TafsirRecord>(cacheKey);
    if (cached) return { success: true, data: cached, isCached: true };
  }

  const isNative = Platform.OS !== "web" && !!FileSystem.documentDirectory;
  const localDir = `${CACHE_DIR}tafsirs/${safeTafsirId}/`;
  const localFilePath = `${localDir}${safeSurahId}.json`;
  if (isNative) {
    await ensureCurrentCacheVersion();
    const diskData = await readJsonFile(localFilePath, isObjectRecord);
    if (diskData) {
      if (useMemoryCache) setMemory(cacheKey, diskData);
      return { success: true, data: diskData, isCached: true };
    }
  }

  if (!CONTENT_BASE_URL) {
    return { success: false, error: "Content CDN is not configured." };
  }

  const existing = inFlight.get(cacheKey);
  if (existing) return existing;
  const request = (async (): Promise<ContentFetchResult<TafsirRecord>> => {
    try {
      const remoteUrl = `${CONTENT_BASE_URL}/tafsirs_chunked/${safeTafsirId}/${safeSurahId}.json`;
      const data = await fetchTafsirChunk(remoteUrl);
      if (useMemoryCache) setMemory(cacheKey, data);
      if (isNative) {
        await ensureDirExists(localDir);
        await writeJsonAtomically(localFilePath, data);
      }
      return { success: true, data, isCached: false };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || "Failed to load Tafsir content.",
      };
    } finally {
      inFlight.delete(cacheKey);
    }
  })();
  inFlight.set(cacheKey, request);
  return request;
}

export async function isTafsirDownloaded(
  tafsirId: number | string
): Promise<boolean> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return false;
  await ensureCurrentCacheVersion();
  const safeTafsirId = encodeURIComponent(String(tafsirId));
  const marker = await readJsonFile(
    `${CACHE_DIR}tafsirs/${safeTafsirId}/complete.json`,
    (value): value is { version: string; total: number } =>
      isObjectRecord(value) &&
      value.version === CONTENT_VERSION &&
      value.total === 114
  );
  return !!marker;
}

export async function downloadTafsirAllSurahs(
  tafsirId: number | string,
  onProgress?: (downloaded: number, total: number) => void
): Promise<ContentFetchResult<void>> {
  if (!CONTENT_BASE_URL) {
    return { success: false, error: "Content CDN is not configured." };
  }

  const total = 114;
  let nextSurah = 1;
  let completed = 0;
  let firstError = "";
  const worker = async () => {
    while (!firstError) {
      const surahId = nextSurah++;
      if (surahId > total) return;
      const result = await getTafsirSurah(tafsirId, surahId, {
        useMemoryCache: false,
      });
      if (!result.success) {
        firstError = `Failed at Surah ${surahId}: ${result.error}`;
        return;
      }
      completed += 1;
      onProgress?.(completed, total);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  if (firstError) return { success: false, error: firstError };

  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    await ensureCurrentCacheVersion();
    const safeTafsirId = encodeURIComponent(String(tafsirId));
    const localDir = `${CACHE_DIR}tafsirs/${safeTafsirId}/`;
    await ensureDirExists(localDir);
    await writeJsonAtomically(`${localDir}complete.json`, {
      version: CONTENT_VERSION,
      total,
      completedAt: new Date().toISOString(),
    });
  }
  return { success: true };
}

export async function getHadithFallback(
  bookId: string
): Promise<ContentFetchResult<any[]>> {
  const safeBookId = encodeURIComponent(bookId);
  const cacheKey = `${CONTENT_VERSION}:hadith:${safeBookId}`;
  const cached = getMemory<any[]>(cacheKey);
  if (cached) return { success: true, data: cached, isCached: true };

  const isNative = Platform.OS !== "web" && !!FileSystem.documentDirectory;
  const localDir = `${CACHE_DIR}hadith/`;
  const localFilePath = `${localDir}${safeBookId}.json`;
  if (isNative) {
    await ensureCurrentCacheVersion();
    const diskData = await readJsonFile(
      localFilePath,
      (value): value is any[] => Array.isArray(value)
    );
    if (diskData) {
      setMemory(cacheKey, diskData);
      return { success: true, data: diskData, isCached: true };
    }
  }

  if (!CONTENT_BASE_URL) return { success: true, data: [], isCached: false };
  try {
    const data = await fetchJson(`${CONTENT_BASE_URL}/hadith/${safeBookId}.json`);
    if (!Array.isArray(data)) throw new Error("Invalid Hadith fallback");
    setMemory(cacheKey, data);
    if (isNative) {
      await ensureDirExists(localDir);
      await writeJsonAtomically(localFilePath, data);
    }
    return { success: true, data, isCached: false };
  } catch (error: any) {
    return { success: false, error: error?.message, data: [] };
  }
}

export async function prefetchNextSurahTafsir(
  tafsirId: number | string,
  currentSurahId: number
): Promise<void> {
  const nextSurahId = currentSurahId + 1;
  if (nextSurahId > 114 || !(await isOnWifi())) return;
  getTafsirSurah(tafsirId, nextSurahId).catch(() => {});
}

export async function clearContentCache(): Promise<void> {
  memoryCache.clear();
  memoryCacheBytes = 0;
  cacheReadyPromise = null;
  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    await FileSystem.deleteAsync(CACHE_ROOT, { idempotent: true }).catch(
      () => {}
    );
  }
}
