import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Configuration ───────────────────────────────────────────────────────────
// PUBLIC GET-only CDN URL. Default fallback points to raw Github / CDN.
// ZERO write credentials or secret keys exist in this client service.
const CDN_BASE_URL = (
  process.env.EXPO_PUBLIC_CONTENT_CDN_URL ||
  "https://raw.githubusercontent.com/codeveriyan/Islamic_Hikmah/main/frontend/public/tafsirs_chunked"
).replace(/\/$/, "");

const CACHE_DIR = `${FileSystem.documentDirectory || ""}content_cache/`;
const LOW_DATA_MODE_KEY = "hikmah:low_data_mode";

// In-memory cache for fast tab-switching during active session
const memoryCache = new Map<string, any>();

export type ContentFetchResult<T = any> = {
  success: boolean;
  data?: T;
  isCached?: boolean;
  error?: string;
};

// ─── Internal Helper: Ensure Directory Exists ────────────────────────────────
async function ensureDirExists(dirPath: string): Promise<void> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
  try {
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  } catch {}
}

// ─── Fetch Tafsir Chunk (Surah level) ───────────────────────────────────────
/**
 * Loads Tafsir data for a specific surah and tafsir source.
 * Checks Memory -> FileSystem Cache -> Remote CDN.
 * Guaranteed 0ms load after initial download.
 */
export async function getTafsirSurah(
  tafsirId: number | string,
  surahId: number | string
): Promise<ContentFetchResult<Record<string, any>>> {
  const cacheKey = `tafsir_${tafsirId}_${surahId}`;

  // 1. Level 0: Memory cache (0ms)
  if (memoryCache.has(cacheKey)) {
    return { success: true, data: memoryCache.get(cacheKey), isCached: true };
  }

  const isWeb = Platform.OS === "web" || !FileSystem.documentDirectory;
  const localDir = `${CACHE_DIR}tafsirs/${tafsirId}/`;
  const localFilePath = `${localDir}${surahId}.json`;

  // 2. Level 1: Native Disk Cache (0ms - FileSystem)
  if (!isWeb) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);
      if (fileInfo.exists) {
        const rawText = await FileSystem.readAsStringAsync(localFilePath);
        const parsed = JSON.parse(rawText);
        memoryCache.set(cacheKey, parsed);
        return { success: true, data: parsed, isCached: true };
      }
    } catch (err) {
      if (__DEV__) console.warn("[CDNContentService] Disk cache read error:", err);
    }
  }

  // 3. Level 2: Remote CDN Fetch (Cloudflare R2 / Fallback)
  const remoteUrl = `${CDN_BASE_URL}/${tafsirId}/${surahId}.json`;
  try {
    if (__DEV__) console.log("[CDNContentService] Fetching remote chunk:", remoteUrl);
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when loading Tafsir chunk`);
    }

    const data = await response.json();
    memoryCache.set(cacheKey, data);

    // Save to native disk cache for future 0ms loads
    if (!isWeb) {
      ensureDirExists(localDir).then(() => {
        FileSystem.writeAsStringAsync(localFilePath, JSON.stringify(data)).catch((err) => {
          if (__DEV__) console.warn("[CDNContentService] Failed writing disk cache:", err);
        });
      });
    }

    return { success: true, data, isCached: false };
  } catch (error: any) {
    const msg = error?.message || "Failed to load content. Please check your network connection.";
    if (__DEV__) console.error("[CDNContentService] Fetch error:", msg);
    return { success: false, error: msg };
  }
}

// ─── Network-Aware Prefetching ───────────────────────────────────────────────
/**
 * Prefetches the next Surah's tafsir in the background.
 * Checks Low Data Mode before prefetching on mobile.
 */
export async function prefetchNextSurahTafsir(
  tafsirId: number | string,
  currentSurahId: number
): Promise<void> {
  const nextSurahId = currentSurahId + 1;
  if (nextSurahId > 114) return; // End of Quran

  // Check if Low Data Mode is enabled by user
  try {
    const isLowData = await AsyncStorage.getItem(LOW_DATA_MODE_KEY);
    if (isLowData === "true") {
      if (__DEV__) console.log("[CDNContentService] Low Data Mode enabled — skipping prefetch.");
      return;
    }
  } catch {}

  // Trigger non-blocking fetch in background
  getTafsirSurah(tafsirId, nextSurahId).catch(() => {});
}

// ─── Clear Content Cache ──────────────────────────────────────────────────────
export async function clearContentCache(): Promise<void> {
  memoryCache.clear();
  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    } catch {}
  }
}
