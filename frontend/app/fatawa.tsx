/**
 * fatawa.tsx — Fatawa & Scholarly Answers Hub
 *
 * Displays original Islamic Hikmah summaries of Islamic rulings with:
 *  - Educational safety disclaimer
 *  - Category chip filters
 *  - Full-text search (English + Arabic)
 *  - Fatwa cards with evidence citations, review badges, source attribution
 *  - Detailed Q&A modal with differing opinions & canonical source link
 *  - Bookmarking (AsyncStorage)
 *  - Responsive desktop web & mobile layout
 *
 * Content policy: summaries are original; no full copyrighted answers are
 * stored. Users are always directed to the canonical source (e.g. IslamQA.info).
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Linking,
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/src/ThemeContext";
import {
  FatawaItem,
  FatawaCategoryMeta,
  FatawaCategory,
  ReviewStatus,
  EvidenceCitation,
  fetchFatawaCategories,
  searchFatawa,
  askFatawaQuestion,
  CATEGORY_ICON_MAP,
  CATEGORY_COLOR_MAP,
  getReviewStatusLabel,
  getReviewStatusColor,
  getEvidenceIcon,
} from "@/src/services/fatawaService";
import { API_BASE_URL } from "@/src/apiBaseUrl";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BOOKMARKS_KEY = "hikmah:fatawa:bookmarks";

const DISCLAIMER =
  "Educational Purpose Only: Content provided is for educational and informational reference and does not replace consulting a qualified local scholar or Mufti, especially for legal, financial, family, or medical rulings.";

// ---------------------------------------------------------------------------
// Small reusable components
// ---------------------------------------------------------------------------

function ReviewBadge({ status }: { status: ReviewStatus }) {
  const { colors } = useTheme();
  const color = getReviewStatusColor(status);
  const label = getReviewStatusLabel(status);
  return (
    <View style={[styles.badge, { backgroundColor: color + "18", borderColor: color + "44" }]}>
      <MaterialCommunityIcons
        name={status === "published" ? "check-circle" : status === "scholar_reviewed" ? "shield-check" : "clock-outline"}
        size={11}
        color={color}
      />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function EvidenceTag({ citation }: { citation: EvidenceCitation }) {
  const { colors } = useTheme();
  const icon = getEvidenceIcon(citation.type);
  const color =
    citation.type === "quran"
      ? "#00A884"
      : citation.type === "hadith"
      ? "#8B5CF6"
      : citation.type === "fatwa"
      ? "#F59E0B"
      : "#3B82F6";
  return (
    <View style={[styles.evidenceTag, { backgroundColor: color + "15", borderColor: color + "35" }]}>
      <MaterialCommunityIcons name={icon as any} size={12} color={color} />
      <Text style={[styles.evidenceTagText, { color }]} numberOfLines={1}>
        {citation.reference}
      </Text>
      {citation.verified && (
        <MaterialCommunityIcons name="check-circle" size={10} color={color} />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function FatawaScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();

  // Data state
  const [categories, setCategories] = useState<FatawaCategoryMeta[]>([]);
  const [items, setItems] = useState<FatawaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FatawaCategory | null>(null);
  const [page, setPage] = useState(1);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  // Modal
  const [selectedItem, setSelectedItem] = useState<FatawaItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Disclaimer expanded/collapsed
  const [disclaimerExpanded, setDisclaimerExpanded] = useState(true);

  // Asking question state
  const [asking, setAsking] = useState(false);

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const handleAskQuestion = async (customQ?: string) => {
    const q = (customQ || searchQuery).trim();
    if (!q) return;
    setAsking(true);
    try {
      const result = await askFatawaQuestion(q);
      openItem(result);
    } catch {
      Alert.alert("Error", "Could not resolve question. Please try again.");
    } finally {
      setAsking(false);
    }
  };

  // Fade animation for cards
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // nextPageRef tracks the next page to fetch for "load more".
  const nextPageRef = useRef(2);

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadBookmarks();
    loadCategories();
  }, []);

  useEffect(() => {
    loadItems(true);
  }, [debouncedQuery, selectedCategory]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [items]);

  // ---------------------------------------------------------------------------
  // Data loaders
  // ---------------------------------------------------------------------------

  const loadCategories = async () => {
    try {
      const cats = await fetchFatawaCategories();
      setCategories(cats);
    } catch {
      // Non-critical; fallback categories are handled inside service
    }
  };

  const loadItems = useCallback(
    async (reset: boolean = false) => {
      const currentPage = reset ? 1 : nextPageRef.current;
      if (reset) {
        setItems([]);
        setPage(1);
        nextPageRef.current = 2; // after page 1 loads, next fetch is page 2
        setLoading(true);
        fadeAnim.setValue(0);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const resp = await searchFatawa({
          q: debouncedQuery || undefined,
          category: selectedCategory || undefined,
          page: currentPage,
          limit: 20,
        });
        setTotal(resp.total);
        if (reset) {
          setItems(resp.results);
        } else {
          setItems((prev) => [...prev, ...resp.results]);
          nextPageRef.current = currentPage + 1;
          setPage(currentPage + 1);
        }
      } catch (err: any) {
        setError("Unexpected error loading content.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [debouncedQuery, selectedCategory]
  );

  const loadMore = () => {
    if (!loadingMore && items.length < total) {
      loadItems(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Bookmarks
  // ---------------------------------------------------------------------------

  const loadBookmarks = async () => {
    try {
      const raw = await AsyncStorage.getItem(BOOKMARKS_KEY);
      if (raw) setBookmarks(new Set(JSON.parse(raw)));
    } catch {}
  };

  const toggleBookmark = async (id: string) => {
    const next = new Set(bookmarks);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setBookmarks(next);
    try {
      await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...next]));
    } catch {}
  };

  // ---------------------------------------------------------------------------
  // Search debounce
  // ---------------------------------------------------------------------------

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQuery(text), 400);
  };

  // ---------------------------------------------------------------------------
  // Modal
  // ---------------------------------------------------------------------------

  const openItem = (item: FatawaItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const openSourceUrl = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Cannot open link", "Please visit the source URL manually:\n" + url)
    );
  };

  // ---------------------------------------------------------------------------
  // Category chips
  // ---------------------------------------------------------------------------

  const categoryChips = useMemo(
    () => [{ id: null, name_english: "All", icon: "apps", count: total }, ...categories],
    [categories, total]
  );

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderCategoryChip = (cat: { id: string | null; name_english: string; icon: string; count?: number }) => {
    const isSelected = selectedCategory === cat.id;
    const color = cat.id ? (CATEGORY_COLOR_MAP[cat.id] ?? colors.brand) : colors.brand;
    return (
      <Pressable
        key={cat.id ?? "all"}
        onPress={() => setSelectedCategory(cat.id as FatawaCategory | null)}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? color : mode === "dark" ? "#1E293B" : "#F1F5F9",
            borderColor: isSelected ? color : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={(CATEGORY_ICON_MAP[cat.id ?? ""] ?? cat.icon) as any}
          size={14}
          color={isSelected ? "#fff" : colors.onSurfaceMuted}
        />
        <Text style={[styles.chipText, { color: isSelected ? "#fff" : colors.onSurface }]}>
          {cat.name_english}
        </Text>
      </Pressable>
    );
  };

  const renderFatawaCard = ({ item }: { item: FatawaItem }) => {
    const catColor = CATEGORY_COLOR_MAP[item.category] ?? colors.brand;
    const isBookmarked = bookmarks.has(item.id);

    return (
      <Pressable
        onPress={() => openItem(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: mode === "dark" ? colors.surfaceSecondary : "#FFFFFF",
            borderColor: colors.border,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
        testID={`fatawa-card-${item.id}`}
      >
        {/* Card header */}
        <View style={styles.cardHeader}>
          <View style={[styles.categoryPill, { backgroundColor: catColor + "15", borderColor: catColor + "40" }]}>
            <MaterialCommunityIcons
              name={(CATEGORY_ICON_MAP[item.category] ?? "help-circle") as any}
              size={12}
              color={catColor}
            />
            <Text style={[styles.categoryPillText, { color: catColor }]}>
              {item.category_name_english}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <ReviewBadge status={item.review_status} />
            <Pressable
              onPress={() => toggleBookmark(item.id)}
              hitSlop={8}
              testID={`bookmark-${item.id}`}
            >
              <MaterialCommunityIcons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={20}
                color={isBookmarked ? colors.brand : colors.onSurfaceMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Question summary */}
        <View style={[styles.cardQuestionBox, { backgroundColor: mode === "dark" ? "#0F172A" : "#F8FAFC" }]}>
          <Text style={[styles.cardQuestion, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
            "{item.question_summary}"
          </Text>
        </View>

        {/* Answer excerpt */}
        <Text style={[styles.cardExcerpt, { color: colors.onSurfaceSecondary ?? colors.onSurface }]} numberOfLines={3}>
          {item.excerpt_or_summary}
        </Text>

        {/* Evidence tags */}
        {item.evidence_citations.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.evidenceRow}>
            {item.evidence_citations.slice(0, 3).map((cit, i) => (
              <EvidenceTag key={i} citation={cit} />
            ))}
            {item.evidence_citations.length > 3 && (
              <View style={[styles.evidenceTag, { backgroundColor: colors.surfaceTertiary ?? colors.border }]}>
                <Text style={[styles.evidenceTagText, { color: colors.onSurfaceMuted }]}>
                  +{item.evidence_citations.length - 3} more
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterLeft}>
            <MaterialCommunityIcons name="link-variant" size={13} color={colors.onSurfaceMuted} />
            <Text style={[styles.cardFooterSource, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
              {item.source_provider} · {item.source_reference}
            </Text>
          </View>
          <Text style={[styles.cardReadMore, { color: colors.brand }]}>Read ruling ›</Text>
        </View>
      </Pressable>
    );
  };

  const renderModal = () => {
    if (!selectedItem) return null;
    const item = selectedItem;
    const catColor = CATEGORY_COLOR_MAP[item.category] ?? colors.brand;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              {/* Category & close */}
              <View style={styles.modalTopRow}>
                <View style={[styles.categoryPill, { backgroundColor: catColor + "15", borderColor: catColor + "40" }]}>
                  <MaterialCommunityIcons
                    name={(CATEGORY_ICON_MAP[item.category] ?? "help-circle") as any}
                    size={12}
                    color={catColor}
                  />
                  <Text style={[styles.categoryPillText, { color: catColor }]}>
                    {item.category_name_arabic} · {item.category_name_english}
                  </Text>
                </View>
                <Pressable onPress={closeModal} hitSlop={10} testID="modal-close">
                  <MaterialCommunityIcons name="close-circle" size={26} color={colors.onSurfaceMuted} />
                </Pressable>
              </View>

              {/* Badges */}
              <View style={styles.modalBadgesRow}>
                <ReviewBadge status={item.review_status} />
                {item.madhhab_or_scope && (
                  <View style={[styles.badge, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="scale-balance" size={11} color={colors.onSurfaceMuted} />
                    <Text style={[styles.badgeText, { color: colors.onSurfaceMuted }]}>
                      {item.madhhab_or_scope}
                    </Text>
                  </View>
                )}
                <Pressable
                  onPress={() => toggleBookmark(item.id)}
                  hitSlop={8}
                  testID={`modal-bookmark-${item.id}`}
                >
                  <MaterialCommunityIcons
                    name={bookmarks.has(item.id) ? "bookmark" : "bookmark-outline"}
                    size={22}
                    color={bookmarks.has(item.id) ? colors.brand : colors.onSurfaceMuted}
                  />
                </Pressable>
              </View>

              {/* Title */}
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {item.title}
              </Text>

              {/* Question */}
              <View style={[styles.questionBox, { backgroundColor: mode === "dark" ? "#0F172A" : "#F8FAFC", borderColor: colors.border }]}>
                <MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.brand} />
                <Text style={[styles.questionText, { color: colors.onSurface }]}>
                  {item.question_summary}
                </Text>
              </View>

              {/* Summary */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, { color: colors.brand }]}>
                  📖 Summary of Ruling
                </Text>
                <Text style={[styles.sectionBody, { color: colors.onSurface }]}>
                  {item.excerpt_or_summary}
                </Text>
                {item.summary_author && (
                  <Text style={[styles.sectionMeta, { color: colors.onSurfaceMuted }]}>
                    — {item.summary_author}
                  </Text>
                )}
              </View>

              {/* Evidence */}
              {item.evidence_citations.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.brand }]}>
                    📚 Evidence & References
                  </Text>
                  {item.evidence_citations.map((cit, i) => {
                    const citColor =
                      cit.type === "quran"
                        ? "#00A884"
                        : cit.type === "hadith"
                        ? "#8B5CF6"
                        : "#F59E0B";
                    return (
                      <Pressable
                        key={i}
                        onPress={() => cit.url && openSourceUrl(cit.url)}
                        style={[styles.evidenceItem, { borderLeftColor: citColor, backgroundColor: mode === "dark" ? "#0F172A" : "#F8FAFC" }]}
                      >
                        <View style={styles.evidenceItemHeader}>
                          <MaterialCommunityIcons
                            name={(getEvidenceIcon(cit.type)) as any}
                            size={14}
                            color={citColor}
                          />
                          <Text style={[styles.evidenceType, { color: citColor }]}>
                            {cit.type.charAt(0).toUpperCase() + cit.type.slice(1)}
                          </Text>
                          {cit.verified && (
                            <MaterialCommunityIcons name="check-circle" size={12} color={citColor} />
                          )}
                        </View>
                        <Text style={[styles.evidenceRef, { color: colors.onSurface }]}>
                          {cit.reference}
                        </Text>
                        {cit.url && (
                          <Text style={[styles.evidenceLink, { color: colors.brand }]}>
                            View source ↗
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Differing opinions */}
              {item.differing_opinions_note && (
                <View style={[styles.opinionsBox, { backgroundColor: "#F59E0B12", borderColor: "#F59E0B35" }]}>
                  <Text style={[styles.opinionsLabel, { color: "#F59E0B" }]}>
                    ⚖️ Differing Scholarly Opinions
                  </Text>
                  <Text style={[styles.opinionsText, { color: colors.onSurface }]}>
                    {item.differing_opinions_note}
                  </Text>
                </View>
              )}

              {/* Scholar attribution */}
              {item.scholar_or_author && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: colors.brand }]}>Scholar / Author</Text>
                  <Text style={[styles.sectionBody, { color: colors.onSurface }]}>
                    {item.scholar_or_author}
                  </Text>
                </View>
              )}

              {/* CTA: Read original */}
              <Pressable
                onPress={() => openSourceUrl(item.source_url)}
                style={[styles.ctaBtn, { backgroundColor: colors.brand }]}
                testID={`open-source-${item.id}`}
              >
                <MaterialCommunityIcons name="open-in-new" size={16} color="#fff" />
                <Text style={styles.ctaBtnText}>
                  Read Full Ruling on {item.source_provider} ↗
                </Text>
              </Pressable>

              <Text style={[styles.sourceRef, { color: colors.onSurfaceMuted }]}>
                {item.source_reference} · {item.source_provider}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Centered responsive container for desktop web */}
      <View style={styles.mainWrapper}>
        {/* ── Header ── */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={10} testID="fatawa-back">
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Fatawa & Scholarly Answers</Text>
            <Text style={[styles.headerSubtitle, { color: colors.onSurfaceMuted }]}>
              Islamic Q&A — Original Summaries
            </Text>
          </View>
          <MaterialCommunityIcons name="scale-balance" size={24} color={colors.brand} />
        </View>

        {/* ── Search bar ── */}
        <View style={[styles.searchRow, { backgroundColor: mode === "dark" ? colors.surfaceSecondary : "#FFFFFF", borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search or ask any question in English or Arabic…"
            placeholderTextColor={colors.onSurfaceMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => handleAskQuestion()}
            returnKeyType="search"
            testID="fatawa-search-input"
          />
          {searchQuery.length > 2 && (
            <Pressable
              onPress={() => handleAskQuestion()}
              disabled={asking}
              style={[styles.quickAskPill, { backgroundColor: colors.brand }]}
              testID="quick-ask-pill"
            >
              {asking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.quickAskPillText}>Ask ✨</Text>
              )}
            </Pressable>
          )}
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearchChange("")} hitSlop={8} testID="clear-search">
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>

        {/* ── Category chips ── */}
        <View style={styles.chipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {categoryChips.map((cat) => renderCategoryChip(cat as any))}
          </ScrollView>
        </View>

        {/* ── Results count ── */}
        {!loading && (
          <View style={styles.resultsCountRow}>
            <Text style={[styles.resultsCount, { color: colors.onSurfaceMuted }]}>
              {total} ruling{total !== 1 ? "s" : ""}
              {selectedCategory ? ` in ${categories.find((c) => c.id === selectedCategory)?.name_english ?? selectedCategory}` : ""}
              {debouncedQuery ? ` for "${debouncedQuery}"` : ""}
            </Text>
          </View>
        )}

        {/* ── Content ── */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={[styles.loadingText, { color: colors.onSurfaceMuted }]}>
              Loading rulings…
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="wifi-off" size={48} color={colors.onSurfaceMuted} />
            <Text style={[styles.errorTitle, { color: colors.onSurface }]}>Connection Error</Text>
            <Text style={[styles.errorBody, { color: colors.onSurfaceMuted }]}>{error}</Text>
            <Pressable
              onPress={() => loadItems(true)}
              style={[styles.retryBtn, { backgroundColor: colors.brand }]}
              testID="retry-btn"
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="auto-fix" size={52} color={colors.brand} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              {searchQuery ? "No Catalog Match Found" : "No Rulings Available"}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.onSurfaceMuted }]}>
              {searchQuery
                ? `Ask our Scholarly Knowledge Engine for a grounded ruling summary on "${searchQuery}".`
                : "Ask any Islamic question below to receive a grounded scholarly ruling summary with evidence citations."}
            </Text>
            {searchQuery ? (
              <Pressable
                onPress={() => handleAskQuestion()}
                disabled={asking}
                style={[styles.askCtaBtn, { backgroundColor: colors.brand }]}
                testID="ask-assistant-btn"
              >
                {asking ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="auto-fix" size={18} color="#fff" />
                    <Text style={styles.askCtaBtnText}>Ask Scholar Assistant ✨</Text>
                  </>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Animated.View style={[{ flex: 1, opacity: fadeAnim }]}>
            <FlatList
              data={items}
              keyExtractor={(item) => item.id}
              renderItem={renderFatawaCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator style={{ marginVertical: 16 }} color={colors.brand} />
                ) : null
              }
            />
          </Animated.View>
        )}
      </View>

      {/* ── Detail modal ── */}
      {renderModal()}
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 840,
    alignSelf: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "800", letterSpacing: 0.2 },
  headerSubtitle: { fontSize: 12, marginTop: 1 },

  // Disclaimer banner
  disclaimerBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  disclaimerBannerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  disclaimerBannerTitle: { flex: 1, fontSize: 12, fontWeight: "700" },
  disclaimerBannerText: { fontSize: 11, lineHeight: 16, marginTop: 6, opacity: 0.85 },

  // Offline banner
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineBannerText: { flex: 1, fontSize: 11, fontWeight: "600", lineHeight: 15 },

  // Search
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, height: 40 },

  // Category chips
  chipsContainer: {
    height: 54,
    marginVertical: 4,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  // Results count
  resultsCountRow: { paddingHorizontal: 18, paddingBottom: 6 },
  resultsCount: { fontSize: 12, fontWeight: "500" },

  // List
  listContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryPillText: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  cardQuestionBox: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardQuestion: { fontSize: 12.5, lineHeight: 18, fontStyle: "italic" },
  cardExcerpt: { fontSize: 13.5, lineHeight: 20 },
  evidenceRow: { flexDirection: "row" },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  cardFooterLeft: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  cardFooterSource: { fontSize: 11.5, fontWeight: "500" },
  cardReadMore: { fontSize: 12.5, fontWeight: "700" },

  // Badge
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10.5, fontWeight: "700" },

  // Evidence tags
  evidenceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
    maxWidth: 240,
  },
  evidenceTagText: { fontSize: 10.5, fontWeight: "500", flexShrink: 1 },

  // Loading / error / empty
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: "700" },
  errorBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === "web" ? 24 : 0,
    borderBottomRightRadius: Platform.OS === "web" ? 24 : 0,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    maxHeight: "90%",
    paddingBottom: 24,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 14 },
  modalTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  modalBadgesRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  modalTitle: { fontSize: 20, fontWeight: "800", lineHeight: 26 },

  // Question box
  questionBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  questionText: { flex: 1, fontSize: 14, lineHeight: 21, fontStyle: "italic" },

  // Section
  sectionBlock: { gap: 6 },
  sectionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  sectionMeta: { fontSize: 12, fontStyle: "italic" },

  // Evidence items
  evidenceItem: {
    borderLeftWidth: 3,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 4,
  },
  evidenceItemHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  evidenceType: { fontSize: 11.5, fontWeight: "700", flex: 1 },
  evidenceRef: { fontSize: 13.5, lineHeight: 19 },
  evidenceLink: { fontSize: 12, fontWeight: "600", marginTop: 2 },

  // Differing opinions
  opinionsBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  opinionsLabel: { fontSize: 13, fontWeight: "700" },
  opinionsText: { fontSize: 13.5, lineHeight: 20 },

  // Disclaimer (in modal)
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  disclaimerText: { flex: 1, fontSize: 11, lineHeight: 16, opacity: 0.9 },

  // CTA button
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  ctaBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // Ask assistant buttons
  quickAskPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickAskPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  askCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  askCtaBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  // Source reference
  sourceRef: { fontSize: 11, textAlign: "center", marginTop: -4 },
});
