import { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Share } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { HADITH_BOOKS } from "./index";
import { HADITH_CHAPTERS, HadithChapter } from "@/src/data/hadithChapters";

type Hadith = {
  hadithnumber: number;
  text: string;
  arabicText?: string;
};

const getLanguageName = (code: string) => {
  switch (code) {
    case "ta": return "Tamil (தமிழ்)";
    case "hi": return "Hindi (हिन्दी)";
    case "ur": return "Urdu (اردو)";
    case "te": return "Telugu (తెలుగు)";
    case "kn": return "Kannada (ಕನ್ನಡ)";
    case "ml": return "Malayalam (മലയാളം)";
    default: return "English";
  }
};

const getLanguageLabel = (code: string) => {
  switch (code) {
    case "ta": return "Tamil (தமிழ்) மொழிபெயர்ப்பு";
    case "hi": return "Hindi (हिन्दी) अनुवाद";
    case "ur": return "Urdu (اردو) ترجمہ";
    case "te": return "Telugu (తెలుగు) అనువాదం";
    case "kn": return "Kannada (ಕನ್ನಡ) ಅನುವಾದ";
    case "ml": return "Malayalam (മലയാളം) വിവർത്തനം";
    default: return "Translation";
  }
};

export default function HadithDetailScreen() {
  const { book } = useLocalSearchParams<{ book: string }>();
  const router = useRouter();
  const { colors, language } = useTheme();

  const bookMeta = useMemo(() => HADITH_BOOKS.find((b) => b.id === book), [book]);

  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  
  // Pagination
  const [limit, setLimit] = useState(15);
  
  // Translation cache states
  const [translatedTexts, setTranslatedTexts] = useState<Record<number, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Set<number>>(new Set());

  // Tab state & Filtering
  const [activeTab, setActiveTab] = useState<"chapters" | "hadiths">("chapters");
  const [selectedChapter, setSelectedChapter] = useState<HadithChapter | null>(null);

  const chapters = useMemo(() => {
    if (!book) return [];
    return HADITH_CHAPTERS[book] || [];
  }, [book]);

  // Load the full book once (English and Arabic in parallel)
  useEffect(() => {
    if (!book) return;
    setLoading(true);
    
    Promise.all([
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-${book}.min.json`).then((r) => r.json()),
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${book}.min.json`).then((r) => r.json()).catch(() => ({ hadiths: [] })),
    ])
      .then(([engData, araData]) => {
        const engList = engData?.hadiths || [];
        const araList = araData?.hadiths || [];
        
        const zippedList: (Hadith & { arabicText?: string })[] = [];
        
        // Map Arabic by hadith number for instant lookups
        const araMap: Record<number, string> = {};
        araList.forEach((h: any) => {
          if (h.hadithnumber) araMap[h.hadithnumber] = h.text;
        });

        engList.forEach((eng: any) => {
          const araText = araMap[eng.hadithnumber] || "";
          
          // Skip if both texts are completely empty (fixes Sahih Muslim Hadith 1 to 92 blank cards bug!)
          if (eng.text.trim() === "" && araText.trim() === "") {
            return;
          }

          zippedList.push({
            hadithnumber: eng.hadithnumber,
            text: eng.text,
            arabicText: araText,
          });
        });

        setHadiths(zippedList);
      })
      .catch((e) => {
        console.error("Failed to fetch Hadiths:", e);
      })
      .finally(() => setLoading(false));
  }, [book]);

  // Clear translations when settings language changes
  useEffect(() => {
    setTranslatedTexts({});
  }, [language]);

  const handleShare = async (item: Hadith) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const transTxt = translatedTexts[item.hadithnumber];
      const message = `${bookMeta?.name} - Hadith #${item.hadithnumber}\n\n` +
        `English: ${item.text}\n\n` +
        (transTxt ? `${getLanguageName(language)}: ${transTxt}\n\n` : "") +
        `Shared via Islamic Hikmah 🕌`;
      await Share.share({ message });
    } catch {}
  };

  const handleTranslate = async (item: Hadith) => {
    if (translatedTexts[item.hadithnumber] || translatingIds.has(item.hadithnumber)) return;
    
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

  // Filter Chapters based on query
  const filteredChapters = useMemo(() => {
    if (activeTab !== "chapters") return [];
    if (!q.trim()) return chapters;
    return chapters.filter((ch) => ch.name.toLowerCase().includes(q.toLowerCase()));
  }, [chapters, q, activeTab]);

  // Filter Hadiths based on query and selected chapter range
  const filtered = useMemo(() => {
    let list = hadiths;
    if (selectedChapter) {
      list = list.filter((h) => h.hadithnumber >= selectedChapter.first && h.hadithnumber <= selectedChapter.last);
    }
    if (!q.trim()) return list;
    const isNum = !isNaN(Number(q));
    if (isNum) {
      return list.filter((h) => h.hadithnumber === Number(q));
    }
    return list.filter((h) => h.text.toLowerCase().includes(q.toLowerCase()));
  }, [hadiths, selectedChapter, q]);

  // Paginated subset
  const paginated = useMemo(() => {
    return filtered.slice(0, limit);
  }, [filtered, limit]);

  const loadMore = () => {
    if (limit < filtered.length) {
      setLimit((l) => l + 15);
    }
  };

  const handleSelectChapter = (ch: HadithChapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedChapter(ch);
    setQ(""); // clear search query when entering a chapter
    setLimit(15); // reset limit
    setActiveTab("hadiths"); // switch to hadiths tab
  };

  const handleClearChapterFilter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedChapter(null);
    setQ("");
    setLimit(15);
    setActiveTab("chapters"); // go back to chapters tab
  };

  // Render individual Hadith card
  const renderItem = useCallback(({ item }: { item: Hadith }) => {
    const isTranslating = translatingIds.has(item.hadithnumber);
    const transText = translatedTexts[item.hadithnumber];

    return (
      <View style={[styles.hadithCard, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: colors.brand + "18" }]}>
            <Text style={[styles.badgeTxt, { color: colors.brand }]}>Hadith #{item.hadithnumber}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => handleShare(item)} hitSlop={8} style={styles.headerBtn}>
              <MaterialCommunityIcons name="share-variant" size={20} color={colors.onSurfaceMuted} />
            </Pressable>
          </View>
        </View>

        {/* Arabic Text (Default) */}
        {item.arabicText ? (
          <Text style={[styles.arabicText, { color: colors.onSurface }]}>{item.arabicText}</Text>
        ) : null}

        {/* English Text (Default) */}
        {item.text ? (
          <Text style={[styles.englishText, { color: colors.onSurfaceSecondary }]}>{item.text}</Text>
        ) : null}

        {/* Settings-driven translation section */}
        {language !== "en" && (
          transText ? (
            <View style={[styles.transBox, { backgroundColor: colors.brandSecondary + "10", borderColor: colors.brandSecondary + "33" }]}>
              <View style={styles.transHeader}>
                <Text style={[styles.transLabel, { color: colors.brandSecondary }]}>{getLanguageLabel(language)}:</Text>
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
              <Text style={[styles.transText, { color: colors.onSurface }]}>{transText}</Text>
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
                  <Text style={[styles.translateBtnTxt, { color: colors.brand }]}>Translate to {getLanguageName(language)}</Text>
                </>
              )}
            </Pressable>
          )
        )}
      </View>
    );
  }, [colors, translatedTexts, translatingIds, bookMeta, language]);

  // Render individual Chapter card
  const renderChapterItem = useCallback(({ item }: { item: HadithChapter }) => {
    const totalHadith = item.last - item.first + 1;
    return (
      <Pressable
        onPress={() => handleSelectChapter(item)}
        style={({ pressed }) => [
          styles.chapterCard,
          { backgroundColor: colors.surfaceSecondary },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={[styles.chapterNumContainer, { backgroundColor: colors.brand + "12" }]}>
          <Text style={[styles.chapterNumText, { color: colors.brand }]}>{item.id}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.chapterName, { color: colors.onSurface }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.chapterDetail, { color: colors.onSurfaceMuted }]}>
            Hadith {item.first} - {item.last} · {totalHadith} narrations
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
      </Pressable>
    );
  }, [colors]);

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
        <Text style={[styles.title, { color: colors.onSurface }]}>{bookMeta.name}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveTab("chapters");
          }}
          style={[
            styles.tabItem,
            activeTab === "chapters" && [styles.activeTabItem, { borderBottomColor: colors.brand }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "chapters" ? colors.brand : colors.onSurfaceMuted },
            ]}
          >
            Chapters ({chapters.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveTab("hadiths");
          }}
          style={[
            styles.tabItem,
            activeTab === "hadiths" && [styles.activeTabItem, { borderBottomColor: colors.brand }],
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "hadiths" ? colors.brand : colors.onSurfaceMuted },
            ]}
          >
            All Hadiths
          </Text>
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceMuted} />
        <TextInput
          value={q}
          onChangeText={(txt) => {
            setQ(txt);
            setLimit(15); // reset page limit on search
          }}
          placeholder={activeTab === "chapters" ? "Search chapters by name..." : "Search by number or narration text..."}
          placeholderTextColor={theme.colors.onSurfaceMuted}
          style={[styles.search, { color: colors.onSurface }]}
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
      ) : activeTab === "chapters" ? (
        <FlatList
          data={filteredChapters}
          keyExtractor={(item) => item.id}
          renderItem={renderChapterItem}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ alignItems: "center", marginTop: 40 }}>
              <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.onSurfaceMuted} />
              <Text style={{ color: colors.onSurfaceMuted, marginTop: 8 }}>No chapters found matching filter.</Text>
            </View>
          )}
        />
      ) : (
        <>
          {selectedChapter && (
            <View style={[styles.filterBanner, { backgroundColor: colors.brand + "0F", borderColor: colors.brand + "22" }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.filterLabel, { color: colors.brand }]}>Active Filter</Text>
                <Text style={[styles.filterVal, { color: colors.onSurface }]} numberOfLines={1}>
                  Chapter {selectedChapter.id}: {selectedChapter.name}
                </Text>
                <Text style={[styles.filterRange, { color: colors.onSurfaceMuted }]}>
                  Hadith {selectedChapter.first} - {selectedChapter.last} ({selectedChapter.last - selectedChapter.first + 1} items)
                </Text>
              </View>
              <Pressable onPress={handleClearChapterFilter} style={styles.clearFilterBtn} hitSlop={12}>
                <MaterialCommunityIcons name="close-circle" size={24} color={colors.brand} />
              </Pressable>
            </View>
          )}
          <FlatList
            data={paginated}
            keyExtractor={(item) => String(item.hadithnumber)}
            renderItem={renderItem}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginHorizontal: theme.spacing.lg,
    marginBottom: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabItem: {},
  tabText: {
    fontSize: 14,
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
  transBox: {
    padding: theme.spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    gap: 4,
  },
  transHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  transLabel: { fontSize: 12, fontWeight: "800" },
  transText: { fontSize: 13, lineHeight: 20 },
  arabicText: {
    fontFamily: "AmiriBold",
    fontSize: 20,
    textAlign: "right",
    lineHeight: 34,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  filterBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.lg,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  filterVal: {
    fontSize: 14,
    fontWeight: "700",
  },
  filterRange: {
    fontSize: 12,
    marginTop: 2,
  },
  clearFilterBtn: {
    padding: 6,
  },
  chapterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: 16,
  },
  chapterNumContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumText: {
    fontSize: 14,
    fontWeight: "800",
  },
  chapterName: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  chapterDetail: {
    fontSize: 12,
    marginTop: 4,
  },
});
