import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { DAWAH_HERO, DAWAH_PARTS, DawahSection } from "@/src/data/dawahData";

const { width } = Dimensions.get("window");

export default function DawahScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0); // 0 = All, 1..4 = Part 1..4
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedTopics, setBookmarkedTopics] = useState<Set<string>>(new Set());

  const toggleBookmark = (title: string) => {
    Haptics.selectionAsync().catch(() => {});
    setBookmarkedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const handleShareText = async (title: string, text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Share.share({
        title: `Islamic Hikmah - ${title}`,
        message: `${title}\n\n${text}\n\nRead more on Islamic Hikmah Dawah Hub (Resource: ${DAWAH_HERO.sourceUrl})`,
      });
    } catch {}
  };

  const filteredParts = useMemo(() => {
    let result = DAWAH_PARTS;
    if (activeTab > 0) {
      result = result.filter((p) => p.partNumber === activeTab);
    }
    if (!searchQuery.trim()) return result;

    const q = searchQuery.toLowerCase();
    return result
      .map((part) => ({
        ...part,
        topics: part.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.quotes?.some((quote) => quote.author.toLowerCase().includes(q) || quote.quote.toLowerCase().includes(q)) ||
            t.prophets?.some((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) ||
            t.miracles?.some((m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) ||
            t.quranVerses?.some((v) => v.text.toLowerCase().includes(q) || v.reference.toLowerCase().includes(q))
        ),
      }))
      .filter((part) => part.topics.length > 0 || part.title.toLowerCase().includes(q));
  }, [activeTab, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>

        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Dawah Hub</Text>
          <Text style={[styles.headerSubtitle, { color: colors.brand }]}>Why Islam & Following It Correctly</Text>
        </View>

        <Pressable
          onPress={() => handleShareText(DAWAH_HERO.title, "Explore Why Islam and Following It Correctly on Islamic Hikmah.")}
          style={styles.shareHeaderBtn}
          hitSlop={10}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={styles.heroBannerContainer}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80" }}
            style={styles.heroBannerImage}
            contentFit="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.bismillahText}>{DAWAH_HERO.arabicText}</Text>
            <Text style={styles.heroTitle}>{DAWAH_HERO.title}</Text>
            <Text style={styles.heroSubtitle}>{DAWAH_HERO.subtitle}</Text>
            
            <View style={styles.hadithHeaderBadge}>
              <Text style={styles.hadithHeaderAr}>{DAWAH_HERO.hadithHeader.arabic}</Text>
              <Text style={styles.hadithHeaderEn}>{DAWAH_HERO.hadithHeader.english}</Text>
              <Text style={styles.hadithHeaderSrc}>{DAWAH_HERO.hadithHeader.source}</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
          <TextInput
            placeholder="Search existence of God, prophets, science quotes..."
            placeholderTextColor={colors.onSurfaceMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>

        {/* Parts Tabs Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {[
            { id: 0, label: "All Parts" },
            { id: 1, label: "1. God's Existence" },
            { id: 2, label: "2. Creation & Prophets" },
            { id: 3, label: "3. Qur'an & Miracles" },
            { id: 4, label: "4. Sunnah & Salaf" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTab(tab.id);
                }}
                style={[
                  styles.tabChip,
                  { borderColor: isSelected ? colors.brand : colors.border, backgroundColor: isSelected ? colors.brand : colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.tabChipText, { color: isSelected ? "#ffffff" : colors.onSurface }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Conditions Box (Shown on All or Part 1) */}
        {(activeTab === 0 || activeTab === 1) && !searchQuery && (
          <View style={[styles.conditionsCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.conditionsHeader}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.brand} />
              <Text style={[styles.conditionsTitle, { color: colors.brand }]}>{DAWAH_HERO.introduction.title}</Text>
            </View>
            {DAWAH_HERO.introduction.points.map((point, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[styles.bulletPoint, { color: colors.brand }]}>•</Text>
                <Text style={[styles.bulletText, { color: colors.onSurfaceSecondary }]}>{point}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Render Dawah Parts */}
        {filteredParts.map((part) => (
          <View key={part.id} style={styles.partCard}>
            {/* Part Image Banner */}
            <View style={styles.partImageFrame}>
              <Image source={{ uri: part.imageUrl }} style={styles.partImage} contentFit="cover" />
              <View style={styles.partBadgeOverlay}>
                <Text style={styles.partBadgeText}>PART {part.partNumber}</Text>
              </View>
            </View>

            {/* Part Title Header */}
            <View style={styles.partHeaderBox}>
              <Text style={[styles.partTitle, { color: colors.onSurface }]}>{part.title}</Text>
              <Text style={[styles.partSubtitle, { color: colors.brand }]}>{part.subtitle}</Text>
              <Text style={[styles.partSummary, { color: colors.onSurfaceSecondary }]}>{part.summary}</Text>
            </View>

            {/* Topics inside Part */}
            {part.topics.map((topic, index) => {
              const isBm = bookmarkedTopics.has(topic.title);
              return (
                <View key={index} style={[styles.topicBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <View style={styles.topicHeader}>
                    <Text style={[styles.topicTitle, { color: colors.onSurface }]}>{topic.title}</Text>
                    <Pressable onPress={() => toggleBookmark(topic.title)} hitSlop={8}>
                      <MaterialCommunityIcons
                        name={isBm ? "bookmark" : "bookmark-outline"}
                        size={22}
                        color={isBm ? colors.brand : colors.onSurfaceMuted}
                      />
                    </Pressable>
                  </View>

                  <Text style={[styles.topicDesc, { color: colors.onSurfaceSecondary }]}>{topic.description}</Text>

                  {/* Miracles / Observations List */}
                  {topic.miracles && topic.miracles.length > 0 && (
                    <View style={styles.miraclesGrid}>
                      {topic.miracles.map((m, mIdx) => (
                        <View key={mIdx} style={[styles.miracleCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                          <View style={styles.miracleCardHeader}>
                            <MaterialCommunityIcons name="star-four-points" size={16} color={colors.brand} />
                            <Text style={[styles.miracleName, { color: colors.onSurface }]}>{m.name}</Text>
                          </View>
                          <Text style={[styles.miracleDesc, { color: colors.onSurfaceSecondary }]}>{m.description}</Text>
                          {m.reference && <Text style={[styles.miracleRef, { color: colors.brand }]}>{m.reference}</Text>}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Qur'an Verses */}
                  {topic.quranVerses && topic.quranVerses.length > 0 && (
                    <View style={styles.versesSection}>
                      <Text style={[styles.sectionLabel, { color: colors.brand }]}>Qur'an References:</Text>
                      {topic.quranVerses.map((v, vIdx) => (
                        <View key={vIdx} style={[styles.verseQuoteCard, { borderColor: colors.brand + "40", backgroundColor: colors.brand + "08" }]}>
                          <Text style={[styles.verseText, { color: colors.onSurface }]}>"{v.text}"</Text>
                          <View style={styles.verseFooter}>
                            <Text style={[styles.verseRef, { color: colors.brand }]}>{v.reference}</Text>
                            <Pressable onPress={() => handleShareText(v.reference, v.text)}>
                              <MaterialCommunityIcons name="content-copy" size={16} color={colors.onSurfaceMuted} />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Hadiths */}
                  {topic.hadiths && topic.hadiths.length > 0 && (
                    <View style={styles.versesSection}>
                      <Text style={[styles.sectionLabel, { color: colors.brand }]}>Authentic Hadiths:</Text>
                      {topic.hadiths.map((h, hIdx) => (
                        <View key={hIdx} style={[styles.verseQuoteCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                          <Text style={[styles.verseText, { color: colors.onSurface }]}>"{h.text}"</Text>
                          <View style={styles.verseFooter}>
                            <Text style={[styles.verseRef, { color: colors.brand }]}>{h.reference}</Text>
                            <Pressable onPress={() => handleShareText(h.reference, h.text)}>
                              <MaterialCommunityIcons name="content-copy" size={16} color={colors.onSurfaceMuted} />
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Quotes from Scientists */}
                  {topic.quotes && topic.quotes.length > 0 && (
                    <View style={styles.quotesSection}>
                      <Text style={[styles.sectionLabel, { color: colors.brand }]}>Testimonies of Scientists & Thinkers:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                        {topic.quotes.map((q, qIdx) => (
                          <View key={qIdx} style={[styles.quoteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <MaterialCommunityIcons name="format-quote-open" size={24} color={colors.brand} />
                            <Text style={[styles.quoteText, { color: colors.onSurface }]}>"{q.quote}"</Text>
                            <Text style={[styles.quoteAuthor, { color: colors.brand }]}>— {q.author}</Text>
                            <Text style={[styles.quoteRole, { color: colors.onSurfaceMuted }]}>{q.role}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* All 25 Prophets List Displayed Inline */}
                  {topic.prophets && topic.prophets.length > 0 && (
                    <View style={styles.prophetsSection}>
                      <Text style={[styles.sectionLabel, { color: colors.brand }]}>All 25 Prophets Mentioned in the Qur'an:</Text>
                      <View style={{ gap: 10 }}>
                        {topic.prophets.map((p, pIdx) => (
                          <View key={pIdx} style={[styles.prophetCardInline, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={styles.prophetHeaderRow}>
                              <View style={[styles.prophetBadgeCircle, { backgroundColor: colors.brand + "20" }]}>
                                <Text style={[styles.prophetBadgeNum, { color: colors.brand }]}>{pIdx + 1}</Text>
                              </View>
                              <Text style={[styles.prophetNameInline, { color: colors.onSurface }]}>{p.name}</Text>
                            </View>
                            <Text style={[styles.prophetDescInline, { color: colors.onSurfaceSecondary }]}>{p.description}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Hadith Books List */}
                  {topic.books && topic.books.length > 0 && (
                    <View style={styles.booksSection}>
                      <Text style={[styles.sectionLabel, { color: colors.brand }]}>Major Hadith Collections (Kutub al-Sittah):</Text>
                      <View style={{ gap: 8 }}>
                        {topic.books.map((b, bIdx) => (
                          <View key={bIdx} style={[styles.bookRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.brand} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.bookName, { color: colors.onSurface }]}>{b.name}</Text>
                              <Text style={[styles.bookDesc, { color: colors.onSurfaceMuted }]}>{b.description}</Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitleBox: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSubtitle: { fontSize: 11, fontWeight: "600" },
  shareHeaderBtn: { padding: 4 },

  heroBannerContainer: {
    position: "relative",
    width: "100%",
    height: 240,
    justifyContent: "flex-end",
  },
  heroBannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bismillahText: {
    color: "#e2e8f0",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 2,
  },
  heroSubtitle: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
  },
  hadithHeaderBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  hadithHeaderAr: { color: "#ffffff", fontSize: 13, fontWeight: "700" },
  hadithHeaderEn: { color: "#f1f5f9", fontSize: 11, fontStyle: "italic", marginTop: 2 },
  hadithHeaderSrc: { color: "#94a3b8", fontSize: 10, marginTop: 2 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13 },

  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabChipText: { fontSize: 12, fontWeight: "700" },

  conditionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  conditionsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  conditionsTitle: { fontSize: 13, fontWeight: "700" },
  bulletRow: { flexDirection: "row", gap: 6, marginBottom: 6 },
  bulletPoint: { fontSize: 14, fontWeight: "700" },
  bulletText: { flex: 1, fontSize: 12, lineHeight: 18 },

  partCard: { marginBottom: 24 },
  partImageFrame: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  partImage: { width: "100%", height: "100%" },
  partBadgeOverlay: {
    position: "absolute",
    top: 12,
    left: 16,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  partBadgeText: { color: "#38bdf8", fontSize: 11, fontWeight: "800", letterSpacing: 1 },

  partHeaderBox: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  partTitle: { fontSize: 18, fontWeight: "800" },
  partSubtitle: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  partSummary: { fontSize: 13, lineHeight: 20, marginTop: 6 },

  topicBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  topicHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  topicTitle: { fontSize: 15, fontWeight: "700", flex: 1, paddingRight: 8 },
  topicDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },

  miraclesGrid: { gap: 10, marginBottom: 12 },
  miracleCard: { padding: 12, borderRadius: 12, borderWidth: 1 },
  miracleCardHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  miracleName: { fontSize: 13, fontWeight: "700" },
  miracleDesc: { fontSize: 12, lineHeight: 18 },
  miracleRef: { fontSize: 11, fontWeight: "700", marginTop: 4 },

  versesSection: { marginTop: 8, marginBottom: 12 },
  sectionLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  verseQuoteCard: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  verseText: { fontSize: 13, fontStyle: "italic", lineHeight: 20 },
  verseFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  verseRef: { fontSize: 11, fontWeight: "700" },

  quotesSection: { marginTop: 8, marginBottom: 12 },
  quoteCard: {
    width: width * 0.72,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  quoteText: { fontSize: 12, fontStyle: "italic", lineHeight: 18, marginVertical: 6 },
  quoteAuthor: { fontSize: 12, fontWeight: "700" },
  quoteRole: { fontSize: 10 },

  prophetsSection: { marginTop: 8, marginBottom: 12 },
  prophetCardInline: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  prophetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  prophetBadgeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  prophetBadgeNum: {
    fontSize: 11,
    fontWeight: "800",
  },
  prophetNameInline: {
    fontSize: 14,
    fontWeight: "700",
  },
  prophetDescInline: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },

  booksSection: { marginTop: 8 },
  bookRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 10, borderRadius: 12, borderWidth: 1 },
  bookName: { fontSize: 13, fontWeight: "700" },
  bookDesc: { fontSize: 11, marginTop: 2 },
});
