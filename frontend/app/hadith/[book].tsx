import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Share, ScrollView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { theme } from "@/src/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { HADITH_BOOKS } from "./index";
import { HADITH_CHAPTERS } from "@/src/data/hadithChapters";
import { HADITH_INTRODUCTIONS } from "@/src/data/hadithIntroductions";
import hadithFallback from "@/src/data/quran/hadithFallback.json";
import { 
  toggleFavourite, 
  getFavourites, 
  toggleHadithBookmark, 
  getHadithBookmarks 
} from "@/src/storage";

type Hadith = {
  hadithnumber: number;
  bookNumber?: number;
  text: string;
  arabicText?: string;
};

const HADITH_API_BASE_URL = process.env.EXPO_PUBLIC_HADITH_API_BASE_URL?.replace(/\/$/, "");

// App ids differ slightly from the official Sunnah.com collection ids.
const SUNNAH_COLLECTION_IDS: Record<string, string> = {
  bukhari: "bukhari",
  muslim: "muslim",
  nasai: "nasai",
  abudawud: "abudawud",
  tirmidhi: "tirmidhi",
  ibnmajah: "ibnmajah",
  malik: "malik",
  ahmad: "ahmad",
  darimi: "darimi",
  khuzayma: "ibnkhuzayma",
  hibban: "ibnhibban",
  hakim: "hakim",
  razzaq: "abdurrazzaq",
  ibnabishayba: "ibnabishayba",
  daraqutni: "daraqutni",
  bayhaqi: "bayhaqi",
  nasai_kubra: "nasai-kubra",
  aladab_almufrad: "adab",
  shamail_muhammadiyah: "shamail",
  nawawi40: "nawawi40",
  riyad_assalihin: "riyadussalihin",
  bulugh_almaram: "bulugh",
  mishkat_almasabih: "mishkat",
  hisn: "hisn",
  qudsi40: "forty",
};

const toPlainText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    const obj = value as any;
    const narratorStr = typeof obj.narrator === "string" ? `${obj.narrator} ` : "";
    const textStr = typeof obj.text === "string" ? obj.text : (typeof obj.body === "string" ? obj.body : "");
    const combined = (narratorStr + textStr).trim();
    if (combined) return toPlainText(combined);
    return "";
  }
  const str = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return str === "[object Object]" ? "" : str;
};

const hadithMemoryCache = new Map<string, Hadith[]>();
const HADITH_OFFLINE_CACHE_PREFIX = "hikmah:hadith:sunnah:";

export default function HadithDetailScreen() {
  const { book, chapter } = useLocalSearchParams<{ book: string; chapter?: string }>();
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const arabicFontFamily = useArabicFont();

  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const lastScrollProgressRef = useRef(0);

  const loadSavedStates = useCallback(() => {
    Promise.all([getFavourites(), getHadithBookmarks()]).then(([favs, bms]) => {
      setFavIds(new Set(favs.map((f) => f.id)));
      setBookmarkedIds(new Set(bms.map((b) => b.id)));
    });
  }, []);

  useEffect(() => {
    loadSavedStates();
  }, [loadSavedStates]);

  const handleToggleFavourite = async (item: Hadith) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const id = `hadith-${book}-${item.hadithnumber}`;
    await toggleFavourite({
      id,
      type: "hadith",
      title: `${bookMeta?.name || "Hadith"} · Hadith #${item.hadithnumber}`,
      arabic: item.arabicText || "",
      translation: item.text,
      addedAt: Date.now(),
    });
    loadSavedStates();
  };

  const handleToggleBookmark = async (item: Hadith) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const id = `hadith-${book}-${item.hadithnumber}`;
    await toggleHadithBookmark({
      id,
      bookId: String(book),
      hadithnumber: item.hadithnumber,
      text: item.text,
      arabicText: item.arabicText,
      addedAt: Date.now(),
    });
    loadSavedStates();
  };

  const bookMeta = useMemo(() => HADITH_BOOKS.find((b) => b.id === book), [book]);
  const chapters = useMemo(() => HADITH_CHAPTERS[String(book)] || [], [book]);
  const bookIntro = useMemo(() => HADITH_INTRODUCTIONS[String(book)], [book]);

  const getLanguageName = (code: string) => {
    switch (code) {
      case "ta": return "Tamil (தமிழ்)";
      case "hi": return "Hindi (हिन्दी)";
      case "ur": return "Urdu (اردو)";
      case "te": return "Telugu (తెలుగు)";
      case "kn": return "Kannada (ಕನ್ನಡ)";
      case "ml": return "Malayalam (മലയാളം)";
      case "bn": return "Bengali (বাংলা)";
      case "gu": return "Gujarati (ગુજરાતી)";
      case "mr": return "Marathi (مراठी)";
      case "pa": return "Punjabi (ਪੰਜਾਬੀ)";
      case "ar": return "Arabic (العربية)";
      case "fr": return "French (Français)";
      case "es": return "Spanish (Español)";
      case "tr": return "Turkish (Türkçe)";
      case "id": return "Indonesian (Bahasa Indonesia)";
      case "ru": return "Russian (Русский)";
      case "fa": return "Persian / Farsi (فارسی)";
      case "ha": return "Hausa (هَوُسَ)";
      case "so": return "Somali (Soomaali)";
      case "ms": return "Malay (Bahasa Melayu)";
      case "uz": return "Uzbek (Oʻzbekcha)";
      case "yo": return "Yoruba (Yorùbá)";
      case "ps": return "Pashto (پښتو)";
      default: return "English";
    }
  };

  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedChapterId, setSelectedChapterId] = useState("all");
  
  // View Mode: 'index' (Chapters Table) vs 'hadiths' (Hadith Cards)
  const [viewMode, setViewMode] = useState<"index" | "hadiths">("index");

  // Pagination
  const [limit, setLimit] = useState(15);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Translation cache states
  const [translatedTexts, setTranslatedTexts] = useState<Record<number, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<number>>(new Set());

  // Clear translations when language changes so they re-fetch in the new language
  useEffect(() => {
    setTranslatedTexts({});
  }, [language]);

  useEffect(() => {
    const requestedChapter = Array.isArray(chapter) ? chapter[0] : chapter;
    if (requestedChapter && chapters.some((item) => item.id === requestedChapter)) {
      setSelectedChapterId(requestedChapter);
      setViewMode("hadiths");
    } else if (chapters.length > 0) {
      setSelectedChapterId("all");
      setViewMode("index");
    } else {
      setSelectedChapterId("all");
      setViewMode("hadiths");
    }
    setLimit(15);
  }, [chapter, chapters]);

  // Load the full book once (English and Arabic in parallel)
  useEffect(() => {
    if (!book) return;

    const cacheKey = `hadith_${book}`;
    const offlineCacheKey = `${HADITH_OFFLINE_CACHE_PREFIX}${book}`;
    if (hadithMemoryCache.has(cacheKey)) {
      setHadiths(hadithMemoryCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const bookMeta = HADITH_BOOKS.find((b) => b.id === book);
    const sunnahCollection = SUNNAH_COLLECTION_IDS[book];
    const SUNNAH_API_KEY = "Ono1lNmgt66jCtN4BNwWGvo0aIAbl0027ruMo6Mb";

    const saveLoadedHadiths = (list: Hadith[]) => {
      hadithMemoryCache.set(cacheKey, list);
      setHadiths(list);
    };

    const saveOfflineHadiths = async (list: Hadith[]) => {
      await AsyncStorage.setItem(offlineCacheKey, JSON.stringify({
        savedAt: Date.now(),
        source: "sunnah.com",
        data: list,
      }));
    };

    const loadOfflineHadiths = async () => {
      const fallbackItems = ((hadithFallback as any)[book] || []);
      const raw = await AsyncStorage.getItem(offlineCacheKey);
      if (!raw) throw new Error("No offline Sunnah.com cache for this collection");
      const cached = JSON.parse(raw);
      if (!Array.isArray(cached?.data) || cached.data.length === 0) {
        throw new Error("Offline Sunnah.com cache is empty");
      }
      if (fallbackItems.length > 0 && cached.data.length < fallbackItems.length) {
        await AsyncStorage.removeItem(offlineCacheKey);
        throw new Error("Offline cache outdated; invalidating");
      }
      return cached.data as Hadith[];
    };

    // Load from local hadithFallback.json (bundled complete datasets), AhmedBaset, or FawazAhmed
    const loadFallbackCollection = async () => {
      const fallbackItems = ((hadithFallback as any)[book] || []).map((h: any) => ({
        hadithnumber: h.hadithnumber,
        bookNumber: h.bookNumber,
        text: toPlainText(h.text),
        arabicText: toPlainText(h.arabicText || ""),
      }));

      if (fallbackItems.length > 0) return fallbackItems;

      if (bookMeta?.source === "fawazahmed" || book === "malik") {
        const [engResponse, araResponse] = await Promise.all([
          fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${book}.min.json`),
          fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${book}.min.json`).catch(() => null),
        ]);
        if (engResponse.ok) {
          const engData = await engResponse.json();
          const araData = araResponse?.ok ? await araResponse.json() : { hadiths: [] };
          const araMap: Record<number, string> = {};
          (araData?.hadiths || []).forEach((h: any) => {
            if (h.hadithnumber) araMap[h.hadithnumber] = h.text;
          });
          return (engData?.hadiths || []).reduce((items: Hadith[], eng: any) => {
            const arabicText = araMap[eng.hadithnumber] || "";
            if (!String(eng.text || "").trim() && !arabicText.trim()) return items;
            items.push({ hadithnumber: eng.hadithnumber, text: eng.text || "", arabicText });
            return items;
          }, []);
        }
      }

      // AhmedBaset Hadith Database URLs
      const ahmedBasetFiles: Record<string, string> = {
        nawawi40: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/forties/nawawi40.json",
        qudsi40: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/forties/qudsi40.json",
        shahwaliullah40: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/forties/shahwaliullah40.json",
        riyad_assalihin: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/riyad_assalihin.json",
        bulugh_almaram: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/bulugh_almaram.json",
        aladab_almufrad: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/aladab_almufrad.json",
        shamail_muhammadiyah: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/other_books/shamail_muhammadiyah.json",
        ahmad: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/the_9_books/ahmed.json",
        darimi: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/the_9_books/darimi.json",
      };

      if (ahmedBasetFiles[book]) {
        const response = await fetch(ahmedBasetFiles[book]);
        if (response.ok) {
          const data = await response.json();
          return (data.hadiths || []).map((h: any) => ({
            hadithnumber: Number(h.idInBook || h.id || 1),
            text: toPlainText((h.english?.narrator ? `${h.english.narrator} ` : "") + (h.english?.text || h.english || "")),
            arabicText: toPlainText(h.arabic || ""),
          }));
        }
      }

      throw new Error(`No hadith data found for collection ${book}`);
    };

    // Official Sunnah.com API Fetcher with API Key Header & Retry/Pagination
    const loadOfficialCollection = async () => {
      if (!sunnahCollection) {
        throw new Error("No collection key for Sunnah.com");
      }

      const fetchWithRetry = async (url: string) => {
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            const res = await fetch(url, { headers: { "x-api-key": SUNNAH_API_KEY } });
            if (res.status === 429) {
              await new Promise((r) => setTimeout(r, attempt * 300));
              continue;
            }
            return res;
          } catch {
            await new Promise((r) => setTimeout(r, attempt * 300));
          }
        }
        return fetch(url, { headers: { "x-api-key": SUNNAH_API_KEY } });
      };

      // Paginate through all books of the collection
      let bookPage = 1;
      const booksList: any[] = [];
      while (true) {
        await new Promise((r) => setTimeout(r, 100));
        const res = await fetchWithRetry(
          `https://api.sunnah.com/v1/collections/${sunnahCollection}/books?page=${bookPage}&limit=100`
        );
        if (!res.ok) break;
        const data = await res.json();
        const pageBooks = data.data || [];
        if (pageBooks.length === 0) break;
        booksList.push(...pageBooks);
        if (pageBooks.length < 100) break;
        bookPage++;
      }

      if (booksList.length === 0) {
        throw new Error(`Sunnah.com returned 0 books for collection ${sunnahCollection}`);
      }

      const allItems: Hadith[] = [];

      for (const b of booksList) {
        let page = 1;
        while (true) {
          await new Promise((r) => setTimeout(r, 60));
          const res = await fetchWithRetry(
            `https://api.sunnah.com/v1/collections/${sunnahCollection}/books/${b.bookNumber}/hadiths?page=${page}&limit=100`
          );
          if (!res.ok) break;
          const data = await res.json();
          const items = data.data || [];
          if (items.length === 0) break;

          items.forEach((item: any) => {
            const translations = item.hadith || [];
            const english = translations.find((entry: any) => entry.lang === "en") || translations[0] || {};
            const arabic = translations.find((entry: any) => entry.lang === "ar") || {};
            const text = toPlainText(english.body);
            const arabicText = toPlainText(arabic.body);
            const hadithnum = Number(item.hadithNumber || item.hadithNumberInBook || 1);
            if (text || arabicText) {
              allItems.push({
                hadithnumber: hadithnum,
                bookNumber: Number(b.bookNumber),
                text,
                arabicText,
              });
            }
          });

          if (items.length < 100) break;
          page++;
        }
      }

      if (allItems.length === 0) {
        throw new Error("Sunnah.com API returned no readable hadiths");
      }

      await saveOfflineHadiths(allItems);
      return allItems;
    };

    loadOfficialCollection()
      .catch((officialError) => {
        console.warn("Sunnah.com Hadith fetch failed, trying offline cache:", officialError);
        return loadOfflineHadiths();
      })
      .catch((cacheError) => {
        console.warn("Offline Sunnah.com Hadith cache unavailable, trying fallback database:", cacheError);
        return loadFallbackCollection();
      })
      .then(saveLoadedHadiths)
      .catch((error) => console.error("Failed to load Hadith collection:", error))
      .finally(() => setLoading(false));
  }, [book]);

  const handleShare = async (item: Hadith) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const tamilTxt = translatedTexts[item.hadithnumber];
      const message = `${bookMeta?.name} - Hadith #${item.hadithnumber}\n\n` +
        (item.text ? `English: ${item.text}\n\n` : "") +
        (item.arabicText ? `Arabic: ${item.arabicText}\n\n` : "") +
        (tamilTxt ? `Translation: ${tamilTxt}\n\n` : "") +
        `Shared via Islamic Hikmah 🕌`;
      await Share.share({ message });
    } catch {}
  };

  const handleTranslate = async (item: Hadith) => {
    if (translatedTexts[item.hadithnumber] || translatingIds.has(item.hadithnumber)) return;

    setTranslatingIds((prev) => new Set(prev).add(item.hadithnumber));

    try {
      const textToTranslate = item.text || item.arabicText || "";
      if (!textToTranslate) return;

      const targetLang = language === "en" ? "en" : language;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0]) {
        const translatedText = data[0].map((x: any) => x[0]).join("");
        setTranslatedTexts((prev) => ({
          ...prev,
          [item.hadithnumber]: translatedText,
        }));
      }
    } catch (error) {
      console.error("Hadith translation error:", error);
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.hadithnumber);
        return next;
      });
    }
  };

  // Filter Hadiths based on query and selected chapter
  const filtered = useMemo(() => {
    const selectedChapter = chapters.find((item) => item.id === selectedChapterId);
    const chapterHadiths = selectedChapter
      ? hadiths.filter((h) => 
          (h.bookNumber !== undefined && h.bookNumber === Number(selectedChapter.id)) ||
          (h.hadithnumber >= selectedChapter.first && h.hadithnumber <= selectedChapter.last)
        )
      : hadiths;

    if (!q) return chapterHadiths;
    const isNum = !isNaN(Number(q));
    if (isNum) {
      return chapterHadiths.filter((h) => h.hadithnumber === Number(q));
    }
    return chapterHadiths.filter((h) => 
      h.text.toLowerCase().includes(q.toLowerCase()) || 
      (h.arabicText && h.arabicText.includes(q))
    );
  }, [hadiths, q, chapters, selectedChapterId]);

  // Filtered chapters for the Chapters Index view
  const filteredChapters = useMemo(() => {
    if (!q) return chapters;
    const query = q.toLowerCase();
    return chapters.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.arabicName && c.arabicName.includes(query)) ||
      c.id.includes(query)
    );
  }, [chapters, q]);

  // Paginated subset for Hadith cards
  const paginated = useMemo(() => {
    return filtered.slice(0, limit);
  }, [filtered, limit]);

  const loadMore = () => {
    if (limit < filtered.length) {
      setLimit((l) => l + 15);
    }
  };

  const selectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setViewMode("hadiths");
    setLimit(15);
    Haptics.selectionAsync().catch(() => {});
  };

  // Render individual Hadith card
  const renderItem = useCallback(({ item }: { item: Hadith }) => {
    const isTranslating = translatingIds.has(item.hadithnumber);
    const tamilText = translatedTexts[item.hadithnumber];

    const isFav = favIds.has(`hadith-${book}-${item.hadithnumber}`);
    const isBookmarked = bookmarkedIds.has(`hadith-${book}-${item.hadithnumber}`);

    return (
      <View style={[styles.hadithCard, { borderBottomColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: colors.brand + "18" }]}>
            <Text style={[styles.badgeTxt, { color: colors.brand }]}>Hadith #{item.hadithnumber}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => handleToggleFavourite(item)} hitSlop={8} style={styles.headerBtn}>
              <MaterialCommunityIcons 
                name={isFav ? "heart" : "heart-outline"} 
                size={20} 
                color={isFav ? colors.error : colors.onSurfaceMuted} 
              />
            </Pressable>
            <Pressable onPress={() => handleToggleBookmark(item)} hitSlop={8} style={styles.headerBtn}>
              <MaterialCommunityIcons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={isBookmarked ? colors.brand : colors.onSurfaceMuted} 
              />
            </Pressable>
            <Pressable onPress={() => handleShare(item)} hitSlop={8} style={styles.headerBtn}>
              <MaterialCommunityIcons name="share-variant" size={20} color={colors.onSurfaceMuted} />
            </Pressable>
          </View>
        </View>

        {item.arabicText ? (
          <Text 
            style={[
              styles.arabicText, 
              { color: colors.onSurface, fontFamily: arabicFontFamily || "NotoNaskhArabic" }
            ]}
          >
            {item.arabicText}
          </Text>
        ) : null}

        {item.text && item.text.trim() !== "" && item.text !== "[object Object]" ? (
          <Text style={[styles.englishText, { color: colors.onSurface }]}>{item.text}</Text>
        ) : null}

        {/* Translation Section */}
        {(language !== "en" || ((!item.text || item.text === "[object Object]") && item.arabicText)) && (
          tamilText ? (
            <View style={[styles.tamilBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.tamilHeader}>
                <Text style={[styles.tamilLabel, { color: colors.brand }]}>
                  {getLanguageName(language === "en" ? "en" : language)} Translation:
                </Text>
                <Pressable onPress={() => handleShare(item)} hitSlop={8}>
                  <MaterialCommunityIcons name="share-variant" size={16} color={colors.onSurfaceMuted} />
                </Pressable>
              </View>
              <Text style={[styles.tamilText, { color: colors.onSurface }]}>{tamilText}</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => handleTranslate(item)}
              style={[styles.translateBtn, { borderColor: colors.border }]}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <>
                  <MaterialCommunityIcons name="translate" size={16} color={colors.brand} />
                  <Text style={[styles.translateBtnTxt, { color: colors.brand }]}>
                    {t("translateTo").replace("{lang}", getLanguageName(language === "en" ? "en" : language))}
                  </Text>
                </>
              )}
            </Pressable>
          )
        )}

        {/* Reference & Arabic Reference Footer (Matching Sunnah.com) */}
        {(() => {
          const itemChapter = chapters.find(c => item.hadithnumber >= c.first && item.hadithnumber <= c.last);
          const bookNum = itemChapter?.id || "1";
          return (
            <View style={[styles.referenceBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.referenceLabel, { color: colors.onSurfaceMuted }]}>
                Reference : Book {bookNum}, Hadith {item.hadithnumber}
              </Text>
            </View>
          );
        })()}
      </View>
    );
  }, [colors, translatedTexts, translatingIds, bookMeta, favIds, bookmarkedIds, language]);

  if (!bookMeta) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={{ color: "#FFF", padding: 24 }}>Book not found.</Text>
      </SafeAreaView>
    );
  }

  const activeChapterInfo = chapters.find((c) => c.id === selectedChapterId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => {
            if (viewMode === "hadiths" && chapters.length > 0) {
              setViewMode("index");
            } else {
              router.back();
            }
          }} 
          hitSlop={10} 
          style={styles.backBtn}
        >
          <MaterialCommunityIcons 
            name={viewMode === "hadiths" && chapters.length > 0 ? "format-list-bulleted" : "chevron-left"} 
            size={26} 
            color={colors.onSurface} 
          />
        </Pressable>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>{bookMeta.name}</Text>
          <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 1 }}>
            {viewMode === "index" ? `${chapters.length} Chapters` : (activeChapterInfo ? activeChapterInfo.name : "All Hadiths")}
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10} testID="hadith-home">
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Mode Switcher Tabs (Chapters Index vs Read Hadiths) */}
      {chapters.length > 0 && (
        <View style={[styles.modeTabsRow, { backgroundColor: colors.surfaceSecondary }]}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setViewMode("index");
            }}
            style={[
              styles.modeTab,
              viewMode === "index" && { backgroundColor: colors.brand },
            ]}
          >
            <MaterialCommunityIcons 
              name="table-of-contents" 
              size={18} 
              color={viewMode === "index" ? colors.onBrandPrimary : colors.onSurfaceMuted} 
            />
            <Text style={[styles.modeTabTxt, { color: viewMode === "index" ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>
              Chapters Index ({chapters.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setViewMode("hadiths");
            }}
            style={[
              styles.modeTab,
              viewMode === "hadiths" && { backgroundColor: colors.brand },
            ]}
          >
            <MaterialCommunityIcons 
              name="book-open-variant" 
              size={18} 
              color={viewMode === "hadiths" ? colors.onBrandPrimary : colors.onSurfaceMuted} 
            />
            <Text style={[styles.modeTabTxt, { color: viewMode === "hadiths" ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>
              Read Hadiths
            </Text>
          </Pressable>
        </View>
      )}

      {/* Reading progress bar in Hadiths View */}
      {viewMode === "hadiths" && filtered.length > 0 && (() => {
        const loadedFraction = Math.min(limit, filtered.length) / (filtered.length || 1);
        const overallPct = Math.min(100, Math.max(0, Math.round(scrollProgress * loadedFraction * 100)));
        return (
          <View style={{ height: 3, backgroundColor: colors.surfaceSecondary, width: "100%" }}>
            <View style={{ height: 3, backgroundColor: colors.brand, width: `${overallPct}%` }} />
          </View>
        );
      })()}

      {/* Search Input Bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
        <TextInput
          value={q}
          onChangeText={(txt) => {
            setQ(txt);
            setLimit(15);
          }}
          placeholder={viewMode === "index" ? "Search chapters or categories..." : (t("searchPlaceholder") || "Search Hadith or Hadith #...")}
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.search, { color: colors.onSurface }]}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {/* VIEW 1: CHAPTERS TABLE / INDEX VIEW (Image-1 Layout + Image-2 Intro Card) */}
      {viewMode === "index" && chapters.length > 0 ? (
        <ScrollView contentContainerStyle={styles.chaptersIndexContainer} showsVerticalScrollIndicator={false}>
          
          {/* Book Introduction Hero Card (Image-2 Design) */}
          <View style={[styles.bookIntroCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.bookIntroTopRow}>
              <Text style={[styles.bookIntroTitleEng, { color: colors.onSurface }]}>
                {bookMeta.name}
              </Text>
              {bookIntro?.arabicTitle ? (
                <Text style={[styles.bookIntroTitleAra, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                  {bookIntro.arabicTitle}
                </Text>
              ) : null}
            </View>

            <Text style={[styles.bookIntroDesc, { color: colors.onSurfaceMuted }]}>
              {bookIntro?.description || `${bookMeta.name} compiled by ${bookMeta.compiler}.`}
            </Text>
          </View>

          {/* Chapters Header Card */}
          <View style={[styles.chaptersHeaderCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.chaptersHeaderRow}>
              <View style={[styles.chapterCountBadge, { backgroundColor: colors.brand + "18" }]}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: colors.brand }}>
                  {chapters.length} Chapters
                </Text>
              </View>
              <Pressable
                onPress={() => selectChapter("all")}
                style={[styles.viewAllBtn, { backgroundColor: colors.brand }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: colors.onBrandPrimary }}>
                  View All Hadiths
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Chapters Table Rows (Image-1 Design with Glitch Fix) */}
          <View style={[styles.chaptersTable, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            {filteredChapters.map((item, index) => {
              // Glitch Fix: Ensure clean numeric display without text overflow
              const isNumeric = !isNaN(Number(item.id)) && Number(item.id) > 0;
              const displayNum = isNumeric ? item.id : String(index + 1);

              return (
                <Pressable
                  key={item.id || index}
                  onPress={() => selectChapter(item.id)}
                  style={({ pressed }) => [
                    styles.chapterRow,
                    { borderBottomColor: colors.border },
                    index === filteredChapters.length - 1 && { borderBottomWidth: 0 },
                    pressed && { backgroundColor: colors.brand + "10" },
                  ]}
                >
                  {/* Chapter ID Pill */}
                  <View style={[styles.chapterNumPill, { backgroundColor: colors.brand + "18" }]}>
                    <Text style={[styles.chapterNumTxt, { color: colors.brand }]} numberOfLines={1}>
                      {displayNum}
                    </Text>
                  </View>

                  {/* Chapter Titles */}
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={[styles.chapterNameEng, { color: colors.onSurface }]}>
                      {item.name}
                    </Text>
                    {item.arabicName ? (
                      <Text style={[styles.chapterNameAra, { color: colors.brand }]}>
                        {item.arabicName}
                      </Text>
                    ) : null}
                  </View>

                  {/* Chapter Hadith Range & Arrow */}
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.chapterRangeBadge, { color: colors.onSurfaceMuted }]}>
                      {item.first} to {item.last}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} style={{ marginLeft: 6 }} />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* VIEW 2: HADITH NARRATION CARDS VIEW */
        <>
          {/* Horizontal Chips Bar in Hadiths View */}
          {chapters.length > 0 && (
            <View style={styles.chapterSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chapterChipsRow}
              >
                <Pressable
                  onPress={() => selectChapter("all")}
                  style={[
                    styles.chapterChip,
                    {
                      backgroundColor: selectedChapterId === "all" ? colors.brand : colors.surfaceSecondary,
                      borderColor: selectedChapterId === "all" ? colors.brand : colors.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.chapterChipText,
                    { color: selectedChapterId === "all" ? colors.onBrandPrimary : colors.onSurface },
                  ]}>
                    {t("allHadith")}
                  </Text>
                </Pressable>

                {chapters.map((item) => {
                  const isActive = selectedChapterId === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => selectChapter(item.id)}
                      style={[
                        styles.chapterChip,
                        {
                          backgroundColor: isActive ? colors.brand : colors.surfaceSecondary,
                          borderColor: isActive ? colors.brand : colors.border,
                        },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.chapterChipText,
                          { color: isActive ? colors.onBrandPrimary : colors.onSurface },
                        ]}
                      >
                        {item.name} {item.arabicName ? `· ${item.arabicName}` : ""}
                      </Text>
                      <Text
                        style={[
                          styles.chapterRange,
                          { color: isActive ? colors.onBrandPrimary : colors.onSurfaceMuted },
                        ]}
                      >
                        #{item.first}-#{item.last}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={paginated}
              extraData={[favIds, bookmarkedIds]}
              keyExtractor={(item) => String(item.hadithnumber)}
              renderItem={renderItem}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={32}
              onScroll={(e) => {
                const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
                const scrollable = contentSize.height - layoutMeasurement.height;
                if (scrollable > 0) {
                  const p = Math.min(1, contentOffset.y / scrollable);
                  if (Math.abs(p - lastScrollProgressRef.current) >= 0.02) {
                    lastScrollProgressRef.current = p;
                    setScrollProgress(p);
                  }
                }
              }}
              ListFooterComponent={() => {
                if (limit < filtered.length) {
                  return <ActivityIndicator size="small" color={colors.brand} style={{ marginVertical: 20 }} />;
                }
                return null;
              }}
              ListEmptyComponent={() => (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.onSurfaceMuted} />
                  <Text style={{ color: colors.onSurfaceMuted, marginTop: 8 }}>No narrations found matching filter.</Text>
                </View>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    ...Platform.select({
      web: { height: "100%", overflow: "hidden" } as any
    })
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700" },
  modeTabsRow: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.lg,
    marginBottom: 10,
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modeTabTxt: {
    fontSize: 13,
    fontWeight: "700",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    gap: 8,
    marginBottom: 8,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 14 },
  chaptersIndexContainer: {
    padding: theme.spacing.lg,
  },
  bookIntroCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  bookIntroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  bookIntroTitleEng: {
    fontSize: 20,
    fontWeight: "800",
  },
  bookIntroTitleAra: {
    fontSize: 22,
    fontWeight: "700",
  },
  bookIntroDesc: {
    fontSize: 14,
    lineHeight: 22,
  },
  chaptersHeaderCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  chaptersHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chapterCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chaptersTable: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
  },
  chapterNumPill: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumTxt: {
    fontSize: 13,
    fontWeight: "800",
  },
  chapterNameEng: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  chapterNameAra: {
    fontFamily: "NotoNaskhArabic",
    fontSize: 15,
    marginTop: 2,
  },
  chapterRangeBadge: {
    fontSize: 12,
    fontWeight: "700",
  },
  chapterSection: {
    marginBottom: 8,
  },
  chapterChipsRow: {
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
  },
  chapterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    gap: 2,
    alignItems: "center",
  },
  chapterChipText: { fontSize: 13, fontWeight: "800" },
  chapterRange: { fontSize: 11, fontWeight: "700" },
  hadithCard: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTxt: { fontSize: 12, fontWeight: "800" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerBtn: { padding: 4 },
  englishText: { fontSize: 14, lineHeight: 22, marginTop: 4 },
  translateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  translateBtnTxt: { fontSize: 13, fontWeight: "700" },
  tamilBox: {
    padding: theme.spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    gap: 4,
  },
  tamilHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tamilLabel: { fontSize: 12, fontWeight: "800" },
  tamilText: { fontSize: 13, lineHeight: 20 },
  arabicText: {
    fontFamily: "NotoNaskhArabic",
    fontSize: 20,
    textAlign: "right",
    lineHeight: 34,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  referenceBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
  },
  referenceLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  arabicRefLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});
