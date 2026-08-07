/**
 * Thematic Hadith Browsing — Browse hadiths by topic/category.
 *
 * Navigation: Hadith Index → "Browse by Topic" → Root Category Grid →
 *   Subcategory List → Paginated Hadith List → Hadith Detail (via HadeethEnc)
 *
 * Data source: HadeethEnc API v1 categories & hadith endpoints.
 */

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import {
  getRootCategories,
  getSubcategories,
  getHadeethsByCategory,
  getHadeethDetail,
  HadeethEncCategory,
  HadeethEncListItem,
  HadeethEncHadith,
  normalizeGrade,
} from "@/src/services/hadeethEncService";
import { GradeBadge } from "@/src/components/HadeethEncEnrichment";

const { width } = Dimensions.get("window");
const GRID_GAP = 12;
const CARD_WIDTH = (width - 32 - GRID_GAP) / 2;

// Category icons — map root category titles to MaterialCommunityIcons names
const CATEGORY_ICONS: Record<string, string> = {
  "creed": "mosque",
  "aqeedah": "mosque",
  "worship": "hands-pray",
  "acts of worship": "hands-pray",
  "transactions": "scale-balance",
  "manners": "heart-outline",
  "etiquette": "heart-outline",
  "virtues": "star-outline",
  "qur'an": "book-open-variant",
  "quran": "book-open-variant",
  "the noble qur'an and qur'anic sciences": "book-open-variant",
  "hadith": "bookshelf",
  "the hadith and hadith sciences": "bookshelf",
  "islamic jurisprudence": "gavel",
  "seerah": "account-group",
  "biography": "account-group",
  "heart-softeners": "heart-pulse",
  "trials and tribulations": "shield-alert-outline",
  "supplications": "hands-pray",
  "remembrance": "meditation",
  "food and drink": "food-apple-outline",
  "medicine": "medical-bag",
  "clothing": "tshirt-crew-outline",
  "family": "account-multiple",
  "knowledge": "school-outline",
  "miscellaneous": "dots-horizontal-circle-outline",
};

function getCategoryIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "folder-outline";
}

// ── Component ───────────────────────────────────────────────────────────────────

type ViewState =
  | { type: "roots" }
  | { type: "subcategories"; parent: HadeethEncCategory }
  | { type: "hadithList"; category: HadeethEncCategory }
  | { type: "hadithDetail"; hadith: HadeethEncHadith };

export default function HadithTopicsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const initialHadithId = Array.isArray(id) ? id[0] : id;
  const { colors, language } = useTheme();

  const [viewState, setViewState] = useState<ViewState>({ type: "roots" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Root categories
  const [rootCategories, setRootCategories] = useState<HadeethEncCategory[]>([]);
  // Subcategories for current parent
  const [subcategories, setSubcategories] = useState<HadeethEncCategory[]>([]);
  // Hadith list for current category
  const [hadithList, setHadithList] = useState<HadeethEncListItem[]>([]);
  const [hadithListPage, setHadithListPage] = useState(1);
  const [hadithListLastPage, setHadithListLastPage] = useState(1);
  // Single hadith detail
  const [hadithDetail, setHadithDetail] = useState<HadeethEncHadith | null>(null);

  // ── Language mapping for API (use 2-letter ISO code) ────────────────────────
  const apiLang = useMemo(() => {
    // The app's language setting may be a full name; HadeethEnc uses ISO codes
    const langMap: Record<string, string> = {
      english: "en", arabic: "ar", french: "fr", spanish: "es", turkish: "tr",
      urdu: "ur", hindi: "hi", bengali: "bn", tamil: "ta", telugu: "te",
      kannada: "kn", malayalam: "ml", gujarati: "gu", marathi: "mr",
      punjabi: "pa", indonesian: "id", russian: "ru", persian: "fa",
      hausa: "ha", somali: "so", malay: "ms", uzbek: "uz", yoruba: "yo",
      pashto: "ps",
    };
    const code = language?.toLowerCase() || "en";
    return langMap[code] || (code.length === 2 ? code : "en");
  }, [language]);

  // ── Load Root Categories ──────────────────────────────────────────────────
  useEffect(() => {
    if (viewState.type !== "roots") return;
    if (initialHadithId) return;
    setLoading(true);
    setError(null);
    getRootCategories(apiLang)
      .then((cats) => {
        setRootCategories(cats);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load categories. Please check your connection.");
        setLoading(false);
      });
  }, [viewState.type, apiLang, initialHadithId]);

  // ── Load Subcategories ────────────────────────────────────────────────────
  useEffect(() => {
    if (viewState.type !== "subcategories") return;
    setLoading(true);
    setError(null);
    getSubcategories(apiLang, viewState.parent.id)
      .then((subs) => {
        if (subs.length === 0) {
          // No subcategories — go directly to hadith list
          setViewState({ type: "hadithList", category: viewState.parent });
        } else {
          setSubcategories(subs);
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Failed to load subcategories.");
        setLoading(false);
      });
  }, [viewState, apiLang]);

  // ── Load Hadith List ──────────────────────────────────────────────────────
  useEffect(() => {
    if (viewState.type !== "hadithList") return;
    setLoading(true);
    setError(null);
    setHadithListPage(1);
    setHadithList([]);
    getHadeethsByCategory(apiLang, viewState.category.id, 1, 20)
      .then((res) => {
        setHadithList(res.data);
        setHadithListLastPage(res.meta.last_page);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load hadiths.");
        setLoading(false);
      });
  }, [viewState, apiLang]);

  // ── Load Hadith Detail ────────────────────────────────────────────────────
  const openHadithDetail = useCallback(async (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setLoading(true);
    setError(null);
    try {
      const detail = await getHadeethDetail(apiLang, id);
      setHadithDetail(detail);
      setViewState({ type: "hadithDetail", hadith: detail });
      setLoading(false);
    } catch {
      setError("Failed to load hadith details.");
      setLoading(false);
    }
  }, [apiLang]);

  useEffect(() => {
    if (initialHadithId) openHadithDetail(initialHadithId);
  }, [initialHadithId, openHadithDetail]);

  // ── Load More (pagination) ────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (viewState.type !== "hadithList" || hadithListPage >= hadithListLastPage) return;
    const nextPage = hadithListPage + 1;
    getHadeethsByCategory(apiLang, viewState.category.id, nextPage, 20)
      .then((res) => {
        setHadithList((prev) => [...prev, ...res.data]);
        setHadithListPage(nextPage);
      })
      .catch(() => {});
  }, [viewState, hadithListPage, hadithListLastPage, apiLang]);

  // ── Back Navigation ───────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    if (viewState.type === "hadithDetail") {
      if (initialHadithId) {
        router.back();
        return;
      }
      // Go back to hadith list — find the parent category
      if (hadithDetail) {
        const catId = hadithDetail.categories?.[0];
        // Reconstruct category from available data
        setViewState({
          type: "hadithList",
          category: { id: catId || "1", title: "", hadeeths_count: "0", parent_id: null },
        });
      } else {
        setViewState({ type: "roots" });
      }
    } else if (viewState.type === "hadithList") {
      setViewState({ type: "roots" });
    } else if (viewState.type === "subcategories") {
      setViewState({ type: "roots" });
    } else {
      router.back();
    }
  }, [viewState, hadithDetail, initialHadithId, router]);

  // ── Get Screen Title ──────────────────────────────────────────────────────
  const screenTitle = useMemo(() => {
    switch (viewState.type) {
      case "roots": return "Browse by Topic";
      case "subcategories": return viewState.parent.title;
      case "hadithList": return viewState.category.title;
      case "hadithDetail": return "Hadith Detail";
    }
  }, [viewState]);

  // ── Render Root Category Grid ─────────────────────────────────────────────
  const renderRootCategory = useCallback(({ item }: { item: HadeethEncCategory }) => {
    const iconName = getCategoryIcon(item.title);
    return (
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setViewState({ type: "subcategories", parent: item });
        }}
        style={[styles.categoryCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
      >
        <View style={[styles.categoryIconWrap, { backgroundColor: colors.brand + "15" }]}>
          <MaterialCommunityIcons name={iconName as any} size={28} color={colors.brand} />
        </View>
        <Text style={[styles.categoryTitle, { color: colors.onSurface }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.categoryCount, { color: colors.onSurfaceMuted }]}>
          {item.hadeeths_count} hadiths
        </Text>
      </Pressable>
    );
  }, [colors]);

  // ── Render Subcategory Item ───────────────────────────────────────────────
  const renderSubcategory = useCallback(({ item }: { item: HadeethEncCategory }) => (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        setViewState({ type: "hadithList", category: item });
      }}
      style={[styles.subcategoryRow, { borderBottomColor: colors.border }]}
    >
      <View style={styles.subcategoryLeft}>
        <MaterialCommunityIcons name="folder-outline" size={20} color={colors.brand} />
        <Text style={[styles.subcategoryTitle, { color: colors.onSurface }]} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
      <View style={styles.subcategoryRight}>
        <Text style={[styles.subcategoryCount, { color: colors.onSurfaceMuted }]}>
          {item.hadeeths_count}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
      </View>
    </Pressable>
  ), [colors]);

  // ── Render Hadith List Item ───────────────────────────────────────────────
  const renderHadithItem = useCallback(({ item }: { item: HadeethEncListItem }) => (
    <Pressable
      onPress={() => openHadithDetail(item.id)}
      style={[styles.hadithListItem, { borderBottomColor: colors.border }]}
    >
      <Text style={[styles.hadithItemTitle, { color: colors.onSurface }]} numberOfLines={3}>
        {item.title}
      </Text>
      <View style={styles.hadithItemMeta}>
        <Text style={[styles.hadithItemLangs, { color: colors.onSurfaceMuted }]}>
          {item.translations.length} languages
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.onSurfaceMuted} />
      </View>
    </Pressable>
  ), [colors, openHadithDetail]);

  // ── Render Hadith Detail View ─────────────────────────────────────────────
  const renderDetail = () => {
    if (!hadithDetail) return null;
    const gradeKey = normalizeGrade(hadithDetail.grade);
    return (
      <FlatList
        data={[hadithDetail]}
        keyExtractor={() => "detail"}
        renderItem={() => (
          <View style={styles.detailContainer}>
            {/* Grade badge */}
            <View style={styles.detailGradeRow}>
              <GradeBadge gradeKey={gradeKey} grade={hadithDetail.grade} />
              {hadithDetail.attribution ? (
                <Text style={[styles.detailAttribution, { color: colors.onSurfaceMuted }]}>
                  {hadithDetail.attribution}
                </Text>
              ) : null}
            </View>

            {/* Title */}
            <Text style={[styles.detailTitle, { color: colors.onSurface }]}>
              {hadithDetail.title}
            </Text>

            {/* Full text */}
            <View style={[styles.detailTextBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.detailText, { color: colors.onSurface }]}>
                {hadithDetail.hadeeth}
              </Text>
            </View>

            {/* Reference */}
            {hadithDetail.reference ? (
              <View style={[styles.detailRefBox, { backgroundColor: colors.brand + "10" }]}>
                <MaterialCommunityIcons name="format-quote-open" size={16} color={colors.brand} />
                <Text style={[styles.detailRefText, { color: colors.brand }]}>
                  {hadithDetail.reference}
                </Text>
              </View>
            ) : null}

            {/* Explanation */}
            {hadithDetail.explanation ? (
              <View style={styles.detailSection}>
                <View style={styles.detailSectionHeader}>
                  <MaterialCommunityIcons name="lightbulb-outline" size={18} color={colors.brand} />
                  <Text style={[styles.detailSectionTitle, { color: colors.onSurface }]}>
                    Explanation
                  </Text>
                </View>
                <Text style={[styles.detailSectionBody, { color: colors.onSurface }]}>
                  {hadithDetail.explanation}
                </Text>
              </View>
            ) : null}

            {/* Hints / Benefits */}
            {hadithDetail.hints && hadithDetail.hints.length > 0 ? (
              <View style={styles.detailSection}>
                <View style={styles.detailSectionHeader}>
                  <MaterialCommunityIcons name="star-outline" size={18} color={colors.brand} />
                  <Text style={[styles.detailSectionTitle, { color: colors.onSurface }]}>
                    Key Benefits
                  </Text>
                </View>
                {hadithDetail.hints.map((hint, i) => (
                  <View key={i} style={styles.hintRow}>
                    <Text style={[styles.hintBullet, { color: colors.brand }]}>•</Text>
                    <Text style={[styles.hintText, { color: colors.onSurface }]}>{hint}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Word Meanings */}
            {hadithDetail.words_meanings && hadithDetail.words_meanings.length > 0 ? (
              <View style={styles.detailSection}>
                <View style={styles.detailSectionHeader}>
                  <MaterialCommunityIcons name="translate" size={18} color={colors.brand} />
                  <Text style={[styles.detailSectionTitle, { color: colors.onSurface }]}>
                    Word Meanings
                  </Text>
                </View>
                {hadithDetail.words_meanings.map((wm, i) => (
                  <View key={i} style={styles.wordRow}>
                    <Text style={[styles.wordTerm, { color: colors.brand }]}>{wm.word}</Text>
                    <Text style={[styles.wordMeaning, { color: colors.onSurface }]}>{wm.meaning}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Source */}
            <View style={styles.sourceFooter}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color={colors.onSurfaceMuted} />
              <Text style={[styles.sourceText, { color: colors.onSurfaceMuted }]}>
                Source: HadeethEnc.com · Verified and peer-reviewed
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    );
  };

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {screenTitle}
          </Text>
          {viewState.type === "roots" && (
            <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 1 }}>
              Explore hadiths by theme
            </Text>
          )}
        </View>
        <View style={{ width: 26 }} />
      </View>

      {/* Error State */}
      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceMuted }]}>
            Loading...
          </Text>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {viewState.type === "roots" && (
            <FlatList
              data={rootCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderRootCategory}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={false}
            />
          )}

          {viewState.type === "subcategories" && (
            <FlatList
              data={subcategories}
              keyExtractor={(item) => item.id}
              renderItem={renderSubcategory}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}

          {viewState.type === "hadithList" && (
            <FlatList
              data={hadithList}
              keyExtractor={(item) => item.id}
              renderItem={renderHadithItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                hadithListPage < hadithListLastPage ? (
                  <ActivityIndicator size="small" color={colors.brand} style={{ paddingVertical: 16 }} />
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <MaterialCommunityIcons name="book-open-blank-variant" size={48} color={colors.onSurfaceMuted} />
                  <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
                    No hadiths found in this category.
                  </Text>
                </View>
              }
            />
          )}

          {viewState.type === "hadithDetail" && renderDetail()}
        </>
      )}
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FEE2E2",
    marginHorizontal: 16,
    borderRadius: 8,
  },
  errorText: { color: "#EF4444", fontSize: 13, flex: 1 },

  // Loading
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13 },

  // Root category grid
  gridContainer: { padding: 16 },
  gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },
  categoryCard: {
    width: CARD_WIDTH,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  categoryCount: { fontSize: 11 },

  // Subcategory list
  listContainer: { paddingHorizontal: 16 },
  subcategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subcategoryLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  subcategoryTitle: { fontSize: 14, fontWeight: "600", flex: 1 },
  subcategoryRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  subcategoryCount: { fontSize: 12 },

  // Hadith list
  hadithListItem: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hadithItemTitle: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  hadithItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  hadithItemLangs: { fontSize: 11 },

  // Hadith detail
  detailContainer: { padding: 16, gap: 14 },
  detailGradeRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  detailAttribution: { fontSize: 12, fontStyle: "italic", flex: 1 },
  detailTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  detailTextBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 14,
  },
  detailText: { fontSize: 14, lineHeight: 22 },
  detailRefBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailRefText: { fontSize: 12, fontWeight: "600", flex: 1 },
  detailSection: { gap: 8 },
  detailSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailSectionTitle: { fontSize: 14, fontWeight: "700" },
  detailSectionBody: { fontSize: 13, lineHeight: 20, paddingLeft: 26 },
  hintRow: { flexDirection: "row", gap: 8, paddingLeft: 26 },
  hintBullet: { fontSize: 14, fontWeight: "700", lineHeight: 20 },
  hintText: { fontSize: 13, lineHeight: 20, flex: 1 },
  wordRow: { flexDirection: "row", gap: 10, paddingLeft: 26 },
  wordTerm: { fontSize: 12, fontWeight: "700", minWidth: 80 },
  wordMeaning: { fontSize: 12, lineHeight: 18, flex: 1 },
  sourceFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    opacity: 0.6,
  },
  sourceText: { fontSize: 11 },

  // Empty state
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
});
