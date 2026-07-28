import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";

// ─── Configuration ────────────────────────────────────────────────────────────
// This MUST be set via EXPO_PUBLIC_CONTENT_CDN_URL in your .env before building.
// See .env.example for Cloudflare R2 setup instructions.
// There is NO raw.githubusercontent.com fallback — that would force large static
// files back into the main repo, defeating the purpose of this architecture.
const CDN_BASE_URL = process.env.EXPO_PUBLIC_CONTENT_CDN_URL?.replace(/\/$/, "");

if (__DEV__ && !CDN_BASE_URL) {
  console.warn(
    "[CDNContentService] EXPO_PUBLIC_CONTENT_CDN_URL is not set.\n" +
    "Tafsir and Hadith CDN loading will fail until you:\n" +
    "  1. Set up a Cloudflare R2 bucket (free, see .env.example)\n" +
    "  2. Run: node scripts/chunkTafsirs.js\n" +
    "  3. Run: node scripts/uploadToR2.js\n" +
    "  4. Add EXPO_PUBLIC_CONTENT_CDN_URL=https://your-bucket.r2.dev to .env"
  );
}

const CACHE_DIR = `${FileSystem.documentDirectory || ""}content_cache/`;

// In-memory cache — fast tab-switching within same session (0ms)
const memoryCache = new Map<string, any>();

export type ContentFetchResult<T = any> = {
  success: boolean;
  data?: T;
  isCached?: boolean;
  error?: string;
};

// ─── Internal: Ensure directory exists ───────────────────────────────────────
async function ensureDirExists(dirPath: string): Promise<void> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
  try {
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  } catch {}
}

// ─── Internal: Is the device on Wi-Fi? ───────────────────────────────────────
// Used to guard background prefetching so we never burn mobile data silently.
async function isOnWifi(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.type === Network.NetworkStateType.WIFI;
  } catch {
    // If we can't tell, default to false (conservative — don't prefetch)
    return false;
  }
}

// ─── Fetch Tafsir Chunk (Surah level) ────────────────────────────────────────
/**
 * Loads Tafsir commentary for a specific surah from the CDN.
 * Lookup order: Memory cache (0ms) → FileSystem disk cache (0ms) → CDN fetch.
 * On first load the surah chunk (~200KB–12MB) is downloaded and saved to disk.
 * All subsequent opens of that surah are instant and work fully offline.
 */
export async function getTafsirSurah(
  tafsirId: number | string,
  surahId: number | string
): Promise<ContentFetchResult<Record<string, any>>> {
  const cacheKey = `tafsir_${tafsirId}_${surahId}`;

  // 1. Memory cache
  if (memoryCache.has(cacheKey)) {
    return { success: true, data: memoryCache.get(cacheKey), isCached: true };
  }

  const isNative = Platform.OS !== "web" && !!FileSystem.documentDirectory;
  const localDir = `${CACHE_DIR}tafsirs/${tafsirId}/`;
  const localFilePath = `${localDir}${surahId}.json`;

  // 2. Disk cache (native only)
  if (isNative) {
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

  // 3. CDN fetch
  if (!CDN_BASE_URL) {
    return {
      success: false,
      error:
        "Content CDN is not configured. Please set EXPO_PUBLIC_CONTENT_CDN_URL in your .env file.",
    };
  }

  const remoteUrl = `${CDN_BASE_URL}/tafsirs_chunked/${tafsirId}/${surahId}.json`;
  try {
    if (__DEV__) console.log("[CDNContentService] Fetching:", remoteUrl);
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from CDN`);
    }
    const data = await response.json();
    memoryCache.set(cacheKey, data);

    // Save to disk in background — don't await so UI renders immediately
    if (isNative) {
      ensureDirExists(localDir).then(() => {
        FileSystem.writeAsStringAsync(localFilePath, JSON.stringify(data)).catch(
          (err) => {
            if (__DEV__) console.warn("[CDNContentService] Disk write error:", err);
          }
        );
      });
    }

    return { success: true, data, isCached: false };
  } catch (error: any) {
    const msg =
      error?.message || "Failed to load content. Please check your internet connection.";
    if (__DEV__) console.error("[CDNContentService] Fetch error:", msg);
    return { success: false, error: msg };
  }
}

// ─── Download all Surah chunks for a Tafsir (offline download) ───────────────
/**
 * Downloads all 114 Surah chunks for a given Tafsir ID to local disk.
 * Called by the "Download for offline" button — replaces the old single 68MB file download.
 * onProgress(downloaded, total) fires after each chunk so you can show a progress bar.
 */
export async function downloadTafsirAllSurahs(
  tafsirId: number | string,
  onProgress?: (downloaded: number, total: number) => void
): Promise<ContentFetchResult<void>> {
  if (!CDN_BASE_URL) {
    return {
      success: false,
      error: "Content CDN is not configured. Set EXPO_PUBLIC_CONTENT_CDN_URL in .env.",
    };
  }

  const total = 114;
  let downloaded = 0;

  for (let surahId = 1; surahId <= total; surahId++) {
    const result = await getTafsirSurah(tafsirId, surahId);
    if (!result.success) {
      return {
        success: false,
        error: `Failed at Surah ${surahId}: ${result.error}`,
      };
    }
    downloaded++;
    onProgress?.(downloaded, total);
  }

  return { success: true };
}

// ─── Fetch Hadith Fallback from CDN ──────────────────────────────────────────
/**
 * Loads hadith fallback data for a given book from CDN.
 * CDN path: <CDN_BASE_URL>/hadith/<bookId>.json
 * Follows the same memory → disk → CDN layered caching pattern.
 */
export async function getHadithFallback(
  bookId: string
): Promise<ContentFetchResult<any[]>> {
  const cacheKey = `hadith_fallback_${bookId}`;

  if (memoryCache.has(cacheKey)) {
    return { success: true, data: memoryCache.get(cacheKey), isCached: true };
  }

  const isNative = Platform.OS !== "web" && !!FileSystem.documentDirectory;
  const localDir = `${CACHE_DIR}hadith/`;
  const localFilePath = `${localDir}${bookId}.json`;

  if (isNative) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localFilePath);
      if (fileInfo.exists) {
        const rawText = await FileSystem.readAsStringAsync(localFilePath);
        const parsed = JSON.parse(rawText);
        memoryCache.set(cacheKey, parsed);
        return { success: true, data: parsed, isCached: true };
      }
    } catch {}
  }

  if (!CDN_BASE_URL) {
    // CDN not configured — return empty so the app gracefully shows API results only
    return { success: true, data: [], isCached: false };
  }

  const remoteUrl = `${CDN_BASE_URL}/hadith/${bookId}.json`;
  try {
    if (__DEV__) console.log("[CDNContentService] Fetching hadith fallback:", remoteUrl);
    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    memoryCache.set(cacheKey, data);

    if (isNative) {
      ensureDirExists(localDir).then(() => {
        FileSystem.writeAsStringAsync(localFilePath, JSON.stringify(data)).catch(() => {});
      });
    }

    return { success: true, data, isCached: false };
  } catch (error: any) {
    if (__DEV__) console.warn("[CDNContentService] Hadith fallback fetch error:", error?.message);
    return { success: false, error: error?.message, data: [] };
  }
}

// ─── Wi-Fi-guarded Background Prefetch ───────────────────────────────────────
/**
 * Pre-fetches the next Surah's tafsir chunk in the background.
 * ONLY runs on Wi-Fi — never silently uses mobile data.
 */
export async function prefetchNextSurahTafsir(
  tafsirId: number | string,
  currentSurahId: number
): Promise<void> {
  const nextSurahId = currentSurahId + 1;
  if (nextSurahId > 114) return;

  // Hard network check — only prefetch on Wi-Fi
  const wifi = await isOnWifi();
  if (!wifi) {
    if (__DEV__) console.log("[CDNContentService] Not on Wi-Fi — skipping prefetch.");
    return;
  }

  // Non-blocking background fetch
  getTafsirSurah(tafsirId, nextSurahId).catch(() => {});
}

// ─── Cache Management ─────────────────────────────────────────────────────────
export async function clearContentCache(): Promise<void> {
  memoryCache.clear();
  if (Platform.OS !== "web" && FileSystem.documentDirectory) {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    } catch {}
  }
}
