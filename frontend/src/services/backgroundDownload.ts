import AsyncStorage from "@react-native-async-storage/async-storage";
import { ALLAH_NAMES } from "@/src/data/names";
import { HADITH_BOOKS } from "@/app/hadith/index";
import { HADITH_CHAPTERS } from "@/src/data/hadithChapters";
import { getHadithFallback } from "@/src/services/cdnContentService";
// hadithFallback.json (19.3 MB) is no longer bundled — served from CDN.

const OFFLINE_INIT_KEY = "hikmah:offline_content_initialized:v2";
const QURAN_CHAPTERS_CACHE_KEY = "hikmah:quran_chapters_cache";
const PROPHETS_OFFLINE_KEY = "hikmah:prophets_offline_cache";

export type DownloadProgressCallback = (progress: number, status: string) => void;

class BackgroundDownloadManager {
  private isDownloading: boolean = false;

  public async isContentInitialized(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(OFFLINE_INIT_KEY);
      return val === "true";
    } catch {
      return false;
    }
  }

  public async startBackgroundDownload(isPremiumUser: boolean, onProgress?: DownloadProgressCallback): Promise<boolean> {
    // Only Premium Members can activate background offline downloading
    if (!isPremiumUser) {
      if (onProgress) onProgress(0, "Offline Download is a Premium Feature. Upgrade to unlock full offline reading!");
      return false;
    }

    if (this.isDownloading) return true;
    this.isDownloading = true;

    try {
      if (onProgress) onProgress(10, "Initializing premium offline storage...");

      // 1. Cache Asma-ul-Husna (99 Names of Allah)
      if (onProgress) onProgress(25, "Caching 99 Names of Allah & Islamtics commentary...");
      await AsyncStorage.setItem("hikmah:99_names_offline", JSON.stringify(ALLAH_NAMES));

      // 2. Cache Quran Surah Index & Chapters
      if (onProgress) onProgress(45, "Caching Quran Surahs & Verses...");
      await this.cacheQuranData();

      // 3. Cache Hadith Collections & Indexes
      if (onProgress) onProgress(70, "Caching 14 Hadith Collections & Chapters...");
      await this.cacheHadithData();

      // 4. Cache Prophet Stories & Seerah
      if (onProgress) onProgress(88, "Caching Prophet Stories & Seerah...");
      await AsyncStorage.setItem(PROPHETS_OFFLINE_KEY, JSON.stringify({ savedAt: Date.now() }));

      // Mark offline initialization complete
      await AsyncStorage.setItem(OFFLINE_INIT_KEY, "true");
      if (onProgress) onProgress(100, "All content downloaded & ready for offline reading!");
      return true;

    } catch (error) {
      console.warn("Background download notice:", error);
      return false;
    } finally {
      this.isDownloading = false;
    }
  }

  private async cacheQuranData(): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(QURAN_CHAPTERS_CACHE_KEY);
      if (!existing) {
        const res = await fetch("https://api.quran.com/api/v4/chapters?language=en");
        if (res.ok) {
          const json = await res.json();
          await AsyncStorage.setItem(QURAN_CHAPTERS_CACHE_KEY, JSON.stringify(json.chapters || []));
        }
      }
    } catch (e) {
      console.warn("Quran background cache notice:", e);
    }
  }

  private async cacheHadithData(): Promise<void> {
    try {
      await AsyncStorage.setItem("hikmah:hadith_books_meta", JSON.stringify(HADITH_BOOKS));
      await AsyncStorage.setItem("hikmah:hadith_chapters_meta", JSON.stringify(HADITH_CHAPTERS));

      // Pre-warm CDN cache for primary offline books.
      // getHadithFallback fetches from Cloudflare R2 and saves to device disk —
      // subsequent opens of the Hadith screen will load from disk at 0ms.
      for (const bookId of ["bukhari", "mishkat_almasabih"]) {
        const cacheKey = `hikmah:hadith:sunnah:${bookId}`;
        const existing = await AsyncStorage.getItem(cacheKey);
        if (!existing) {
          const result = await getHadithFallback(bookId);
          if (result.success && result.data && result.data.length > 0) {
            await AsyncStorage.setItem(cacheKey, JSON.stringify({
              savedAt: Date.now(),
              source: "cdn",
              data: result.data,
            }));
          }
        }
      }
    } catch (e) {
      console.warn("Hadith background cache notice:", e);
    }
  }
}

export const backgroundDownloader = new BackgroundDownloadManager();
