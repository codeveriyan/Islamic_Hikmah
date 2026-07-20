import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Share, ScrollView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { theme } from "@/src/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { HADITH_BOOKS } from "./index";
import { HADITH_CHAPTERS } from "@/src/data/hadithChapters";
import hadithFallback from "@/src/data/quran/hadithFallback.json";
import { 
  toggleFavourite, 
  getFavourites, 
  toggleHadithBookmark, 
  getHadithBookmarks 
} from "@/src/storage";

type Hadith = {
  hadithnumber: number;
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
  qudsi40: "qudsi40",
};

const toPlainText = (value: unknown) => String(value || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ")
  .trim();

const hadithMemoryCache = new Map<string, Hadith[]>();

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
      case "mr": return "Marathi (మราठी)";
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
    } else {
      setSelectedChapterId("all");
    }
    setLimit(15);
  }, [chapter, chapters]);

  // Load the full book once (English and Arabic in parallel)
  useEffect(() => {
    if (!book) return;

    const cacheKey = `hadith_${book}`;
    if (hadithMemoryCache.has(cacheKey)) {
      setHadiths(hadithMemoryCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const bookMeta = HADITH_BOOKS.find((b) => b.id === book);
    
    const sunnahCollection = SUNNAH_COLLECTION_IDS[book];

    const saveLoadedHadiths = (list: Hadith[]) => {
      hadithMemoryCache.set(cacheKey, list);
      setHadiths(list);
    };

    // These sources predate the official integration. They are intentionally
    // retained only for offline or upstream-outage recovery.
    const loadFallbackCollection = async () => {
      if (bookMeta?.source === "fawazahmed") {
        const [engResponse, araResponse] = await Promise.all([
          fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${book}.min.json`),
          fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${book}.min.json`).catch(() => null),
        ]);
        if (!engResponse.ok) throw new Error(`Fallback Hadith API returned ${engResponse.status}`);
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

      if (bookMeta?.source?.startsWith("ahmedbaset_")) {
        let folder = "";
        let file = book === "ahmad" ? "ahmed" : book;
        if (bookMeta.source === "ahmedbaset_nine") folder = "the_9_books";
        else if (bookMeta.source === "ahmedbaset_other") folder = "other_books";
        else if (bookMeta.source === "ahmedbaset_forties") folder = "forties";

        const response = await fetch(`https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@main/db/by_book/${folder}/${file}.json`);
        if (!response.ok) throw new Error(`Fallback Hadith API returned ${response.status}`);
        const data = await response.json();
        return (data.hadiths || []).map((h: any) => ({
          hadithnumber: h.idInBook || h.id,
          text: (h.english?.narrator ? `${h.english.narrator} ` : "") + (h.english?.text || ""),
          arabicText: h.arabic || "",
        }));
      }

      return ((hadithFallback as any)[book] || []).map((h: any) => ({
        hadithnumber: h.hadithnumber,
        text: h.text,
        arabicText: h.arabicText || "",
      }));
    };

    // The API key remains on our backend. When configured, this is the
    // authoritative source and supersedes the old partial third-party feeds.
    const loadOfficialCollection = async () => {
      if (!HADITH_API_BASE_URL || !sunnahCollection) {
        throw new Error("Sunnah.com integration is not configured for this collection");
      }
        const allItems: any[] = [];
        let page = 1;
        let nextPage: number | null = 1;
        const visitedPages = new Set<number>();

        while (nextPage) {
          if (visitedPages.has(page)) throw new Error("Sunnah.com returned a repeated page");
          visitedPages.add(page);
          const response = await fetch(
            `${HADITH_API_BASE_URL}/api/hadith/${sunnahCollection}/hadiths?limit=100&page=${page}`,
          );
          if (!response.ok) throw new Error(`Hadith API returned ${response.status}`);
          const data = await response.json();
          if (!Array.isArray(data.data)) throw new Error("Sunnah.com returned an invalid hadith response");
          allItems.push(...data.data);
          nextPage = data.next || null;
          page = nextPage || page + 1;
        }

      const list = allItems.map((item: any) => {
        const translations = item.hadith || [];
        const english = translations.find((entry: any) => entry.lang === "en") || translations[0] || {};
        const arabic = translations.find((entry: any) => entry.lang === "ar") || {};
        return { hadithnumber: Number(item.hadithNumber), text: toPlainText(english.body), arabicText: toPlainText(arabic.body) };
      }).filter((item: Hadith) => Number.isFinite(item.hadithnumber) && (item.text || item.arabicText));
      if (!list.length) throw new Error("Sunnah.com returned no readable hadiths");
      return list;
    };

    loadOfficialCollection()
      .catch(async (error) => {
        console.warn("Failed to fetch Hadiths from Sunnah.com; using fallback:", error);
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
        `English: ${item.text}\n\n` +
        (tamilTxt ? `Tamil: ${tamilTxt}\n\n` : "") +
        `Shared via Islamic Hikmah 🕌`;
      await Share.share({ message });
    } catch {}
  };

  const handleTranslate = async (item: Hadith) => {
    if (translatedTexts[item.hadithnumber] || translatingIds.has(item.hadithnumber)) return;
    if (language === "en") return; // no translate button shown for English
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTranslatingIds((prev) => {
      const next = new Set(prev);
      next.add(item.hadithnumber);
      return next;
    });

    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(item.text)}`
      );
      const data = await res.json();
      const translatedPart = data?.[0]?.map((x: any) => x[0]).join("") || "";
      
      setTranslatedTexts((prev) => ({
        ...prev,
        [item.hadithnumber]: translatedPart,
      }));
    } catch (e) {
      console.error("Failed to translate Hadith:", e);
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.hadithnumber);
        return next;
      });
    }
  };

  // Filter Hadiths based on query
  const filtered = useMemo(() => {
    const selectedChapter = chapters.find((item) => item.id === selectedChapterId);
    const chapterHadiths = selectedChapter
      ? hadiths.filter((h) => h.hadithnumber >= selectedChapter.first && h.hadithnumber <= selectedChapter.last)
      : hadiths;

    if (!q) return chapterHadiths;
    const isNum = !isNaN(Number(q));
    if (isNum) {
      return chapterHadiths.filter((h) => h.hadithnumber === Number(q));
    }
    return chapterHadiths.filter((h) => h.text.toLowerCase().includes(q.toLowerCase()));
  }, [hadiths, q, chapters, selectedChapterId]);

  // Paginated subset
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
      <View style={[styles.hadithCard, { backgroundColor: colors.surfaceSecondary }]}>
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

        {/* Arabic Text (Default) */}
        {item.arabicText ? (
          <Text style={[styles.arabicText, { color: colors.onSurface, fontFamily: arabicFontFamily }]}>{item.arabicText}</Text>
        ) : null}

        {/* English Text (Default) */}
        {item.text ? (
          <Text style={[styles.englishText, { color: colors.onSurfaceSecondary }]}>{item.text}</Text>
        ) : null}

        {/* Translation Section — only shown when a non-English language is selected */}
        {language !== "en" && (
          tamilText ? (
            <View style={[styles.tamilBox, { backgroundColor: colors.brandSecondary + "10", borderColor: colors.brandSecondary + "33" }]}>
              <View style={styles.tamilHeader}>
                <Text style={[styles.tamilLabel, { color: colors.brandSecondary }]}>{getLanguageName(language)}:</Text>
                <Pressable
                  onPress={() => {
                    setTranslatedTexts((prev) => {
                      const next = { ...prev };
                      delete next[item.hadithnumber];
                      return next;
                    });
                  }}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={18} color={colors.brandSecondary} />
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
                  <Text style={[styles.translateBtnTxt, { color: colors.brand }]}>{t("translateTo").replace("{lang}", getLanguageName(language))}</Text>
                </>
              )}
            </Pressable>
          )
        )}
      </View>
    );
  }, [colors, translatedTexts, translatingIds, bookMeta, favIds, bookmarkedIds]);

  if (!bookMeta) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={{ color: "#FFF", padding: 24 }}>Book not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{bookMeta.name}</Text>
          {filtered.length > 0 && (() => {
            const loadedFraction = Math.min(limit, filtered.length) / (filtered.length || 1);
            const overallPct = Math.min(100, Math.max(0, Math.round(scrollProgress * loadedFraction * 100)));
            return (
              <Text style={{ fontSize: 10, color: colors.brand, fontWeight: "700", marginTop: 1 }}>
                {overallPct}% read · {Math.min(limit, filtered.length)} of {filtered.length} hadiths
              </Text>
            );
          })()}
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

      {/* Reading progress bar */}
      {filtered.length > 0 && (() => {
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
            setLimit(15); // reset page limit on search
          }}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.search, { color: colors.onSurface }]}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {chapters.length > 0 && (
        <View style={styles.chapterSection}>
          <Text style={[styles.chapterTitle, { color: colors.onSurfaceMuted }]}>{t("chapters")}</Text>
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
              <Text style={[
                styles.chapterRange,
                { color: selectedChapterId === "all" ? colors.onBrandPrimary : colors.onSurfaceMuted },
              ]}>
                {hadiths.length}
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
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.chapterRange,
                      { color: isActive ? colors.onBrandPrimary : colors.onSurfaceMuted },
                    ]}
                  >
                    {item.first}-{item.last}
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
  chapterSection: {
    marginTop: 6,
    marginBottom: 8,
    paddingLeft: theme.spacing.lg,
  },
  chapterTitle: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  chapterChipsRow: {
    gap: 8,
    paddingRight: theme.spacing.lg,
  },
  chapterChip: {
    maxWidth: 240,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    gap: 2,
  },
  chapterChipText: { fontSize: 13, fontWeight: "800", maxWidth: 190 },
  chapterRange: { fontSize: 11, fontWeight: "700" },
  hadithCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
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
});
