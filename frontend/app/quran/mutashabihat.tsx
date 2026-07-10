import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Modal, 
  FlatList,
  TextInput
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import quranData from "@/src/data/quran/quranData.json";
import matchingAyahData from "@/src/data/quran/matching-ayah.json";
import { SURAH_LIST } from "@/src/data/surahList";
import * as Haptics from "expo-haptics";

// Helper to normalize Arabic diacritics/variations for fuzzy matching
const normalizeArabic = (text: string) => {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "") // remove diacritics
    .replace(/[ٱأإآا]/g, "ا") // normalize Alef
    .replace(/ة/g, "ه") // normalize Teh Marbuta
    .trim();
};

// Helper to find the start and end word indices of a phrase inside an ayah's words
const findPhraseWordRange = (ayahWords: string[], phraseWords: string[]): [number, number][] => {
  if (phraseWords.length === 0 || ayahWords.length === 0) return [];
  const results: [number, number][] = [];
  const normAyah = ayahWords.map(normalizeArabic);
  const normPhrase = phraseWords.map(normalizeArabic);

  for (let i = 0; i <= normAyah.length - normPhrase.length; i++) {
    let match = true;
    for (let j = 0; j < normPhrase.length; j++) {
      if (normAyah[i + j] !== normPhrase[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      results.push([i, i + normPhrase.length]);
    }
  }
  return results;
};

interface MatchItem {
  matched_ayah_key: string;
  matched_words_count: number;
  coverage: number;
  score: number;
  match_words: [number, number][];
}

interface GroupedPhrase {
  phraseText: string;
  normalizedPhrase: string;
  matches: MatchItem[];
  highlightRanges: [number, number][];
}

export default function MutashabihatView() {
  const { colors } = useTheme();
  const router = useRouter();

  // 1. Prepare sorted list of all verses that contain Mutashabihat in the new dataset
  const verseKeys = useMemo(() => {
    return Object.keys(matchingAyahData).sort((a, b) => {
      const [sA, aA] = a.split(":").map(Number);
      const [sB, aB] = b.split(":").map(Number);
      if (sA !== sB) return sA - sB;
      return aA - aB;
    });
  }, []);

  // Set default active verse to "1:2" (Al-Fatihah, Ayah 2) if it exists, or the first key
  const defaultKey = verseKeys.includes("1:2") ? "1:2" : verseKeys[0];
  const [activeKey, setActiveKey] = useState<string>(defaultKey);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Phrase View Modal state
  const [selectedGroup, setSelectedGroup] = useState<GroupedPhrase | null>(null);

  const activeIndex = verseKeys.indexOf(activeKey);

  // Helper to fetch Surah Name
  const getSurahName = (surahNum: number) => {
    const meta = (SURAH_LIST as any[]).find((s) => s.number === surahNum);
    return meta?.englishName || `Surah ${surahNum}`;
  };

  const getSurahArabicName = (surahNum: number) => {
    const meta = (SURAH_LIST as any[]).find((s) => s.number === surahNum);
    return meta?.name || "";
  };

  // Split active key
  const [activeSurahNum, activeAyahNum] = activeKey.split(":").map(Number);
  const currentSurahName = getSurahName(activeSurahNum);

  // Fetch full Arabic text of any verse from quranData.json
  const getAyahArabicText = (surah: number, ayah: number) => {
    try {
      const sData = (quranData as any)[surah - 1];
      const aData = sData?.ayahs?.find((a: any) => a.numberInSurah === ayah);
      return aData?.arabic || "";
    } catch {
      return "";
    }
  };

  // Fetch translation & transliteration
  const getAyahDetails = (surah: number, ayah: number) => {
    try {
      const sData = (quranData as any)[surah - 1];
      const aData = sData?.ayahs?.find((a: any) => a.numberInSurah === ayah);
      return {
        translation: aData?.translation || "",
        transliteration: aData?.transliteration || ""
      };
    } catch {
      return { translation: "", transliteration: "" };
    }
  };

  const activeAyahText = getAyahArabicText(activeSurahNum, activeAyahNum);
  const activeAyahDetails = getAyahDetails(activeSurahNum, activeAyahNum);

  // Get active matches from matchingAyahData
  const activeMatches: MatchItem[] = (matchingAyahData as any)[activeKey] || [];

  // Group active matches dynamically by the repeating Arabic phrase text
  const groupedPhrases = useMemo(() => {
    const groups: Record<string, GroupedPhrase> = {};
    const activeWords = activeAyahText.split(" ");

    activeMatches.forEach((m) => {
      const [s, a] = m.matched_ayah_key.split(":").map(Number);
      const text = getAyahArabicText(s, a);
      if (!text) return;
      const matchedAyahWords = text.split(" ");

      // Reconstruct matching phrase from the ranges of matched_ayah_key
      const phraseWords: string[] = [];
      m.match_words.forEach(([from, to]) => {
        phraseWords.push(...matchedAyahWords.slice(from, to));
      });
      const phraseText = phraseWords.join(" ");
      const normalizedPhrase = normalizeArabic(phraseText);

      if (!normalizedPhrase) return;

      if (!groups[normalizedPhrase]) {
        // Find matching word range inside the active ayah's words to highlight it correctly
        const activeRanges = findPhraseWordRange(activeWords, phraseWords);

        groups[normalizedPhrase] = {
          phraseText,
          normalizedPhrase,
          matches: [],
          highlightRanges: activeRanges
        };
      }
      groups[normalizedPhrase].matches.push(m);
    });

    return Object.values(groups).sort((a, b) => b.matches.length - a.matches.length);
  }, [activeKey, activeMatches, activeAyahText]);

  // Navigation handlers
  const handlePrevious = () => {
    if (activeIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActiveKey(verseKeys[activeIndex - 1]);
    }
  };

  const handleNext = () => {
    if (activeIndex < verseKeys.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      setActiveKey(verseKeys[activeIndex + 1]);
    }
  };

  // Filtered dropdown keys
  const filteredKeys = useMemo(() => {
    if (!searchQuery.trim()) return verseKeys;
    const q = searchQuery.toLowerCase();
    return verseKeys.filter((key) => {
      const [sNum, aNum] = key.split(":").map(Number);
      const name = getSurahName(sNum).toLowerCase();
      return name.includes(q) || key.includes(q);
    });
  }, [searchQuery, verseKeys]);

  // Highlights specific words in the Arabic text based on ranges
  const renderHighlightedText = (fullText: string, ranges: [number, number][], fontSize = 24) => {
    if (!fullText) return null;
    const words = fullText.split(" ");
    
    return (
      <Text style={[styles.arabicTextBase, { fontSize, color: colors.onSurface }]} testID="arabic-text">
        {words.map((word, index) => {
          // Check if index is inside any of the highlighted ranges
          const isHighlighted = ranges.some(([from, to]) => index >= from && index < to);
          
          return (
            <Text 
              key={index} 
              style={[
                isHighlighted && { color: "#8B5CF6", fontWeight: "700" } // purple highlight matching screenshots
              ]}
            >
              {word}{" "}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Custom Header */}
      <View style={[styles.customHeader, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.customHeaderTitle, { color: colors.onSurface }]}>Mutashabihat</Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Title / Header Area */}
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.mainHeading, { color: colors.onSurface }]}>
            Mutashabihat ul Quran {currentSurahName} — Ayah {activeAyahNum}
          </Text>
          <Text style={[styles.subHeading, { color: colors.onSurfaceSecondary }]}>
            Select ayah to see list of shared phrases in that ayah.
          </Text>
        </View>

        {/* Controls Row */}
        <View style={styles.controlsRow}>
          <Text style={[styles.controlLabel, { color: colors.onSurfaceSecondary }]}>Jump to Ayah</Text>
          
          {/* Custom Select Dropdown Trigger */}
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setDropdownVisible(true);
            }}
            style={[styles.dropdownTrigger, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Text style={[styles.dropdownTriggerTxt, { color: colors.onSurfaceSecondary }]}>
              {currentSurahName} {activeSurahNum}:{activeAyahNum}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={colors.onSurfaceMuted} />
          </Pressable>

          {/* Prev/Next buttons */}
          <View style={styles.navButtons}>
            <Pressable 
              onPress={handlePrevious}
              disabled={activeIndex === 0}
              style={[
                styles.navBtn, 
                { backgroundColor: colors.surfaceSecondary },
                activeIndex === 0 && { opacity: 0.4 }
              ]}
            >
              <Text style={[styles.navBtnTxt, { color: colors.onSurface }]}>← Previous</Text>
            </Pressable>

            <Pressable 
              onPress={handleNext}
              disabled={activeIndex === verseKeys.length - 1}
              style={[
                styles.navBtn, 
                { backgroundColor: colors.surfaceSecondary },
                activeIndex === verseKeys.length - 1 && { opacity: 0.4 }
              ]}
            >
              <Text style={[styles.navBtnTxt, { color: colors.onSurface }]}>Next →</Text>
            </Pressable>
          </View>
        </View>

        {/* List of Phrase Cards in Active Verse */}
        <View style={styles.cardsContainer}>
          {groupedPhrases.length === 0 ? (
            <View style={[styles.noDataCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="information-outline" size={24} color={colors.onSurfaceMuted} />
              <Text style={{ color: colors.onSurfaceMuted, textAlign: "center" }}>No repeating phrases found in this Ayah.</Text>
            </View>
          ) : (
            groupedPhrases.map((group) => {
              // Calculate unique Surahs and Ayahs count
              const surahsCount = new Set(group.matches.map(m => m.matched_ayah_key.split(":")[0])).size;
              const ayahsCount = group.matches.length; // total repetitions in dataset

              return (
                <View 
                  key={group.normalizedPhrase} 
                  style={[styles.phraseCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                >
                  {/* Top Right: Full verse with highlight */}
                  <View style={styles.cardHeaderVerse}>
                    {renderHighlightedText(activeAyahText, group.highlightRanges, 25)}
                    
                    {/* Translation & Transliteration */}
                    {activeAyahDetails.transliteration ? (
                      <Text style={[styles.transliterationText, { color: colors.onSurfaceSecondary }]}>
                        {activeAyahDetails.transliteration}
                      </Text>
                    ) : null}
                    {activeAyahDetails.translation ? (
                      <Text style={[styles.translationText, { color: colors.onSurfaceMuted }]}>
                        {activeAyahDetails.translation}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.cardDivider} />

                  {/* Middle Area: Phrase Details */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.bodyTitle, { color: colors.onSurface }]}>
                      Phrases in {activeSurahNum}:{activeAyahNum}
                    </Text>
                    
                    {/* Phrase extract rendered in purple */}
                    <Text style={styles.extractedPhraseArabic}>
                      {group.phraseText}
                    </Text>
                  </View>

                  {/* Footer links */}
                  <View style={styles.cardFooter}>
                    <Text style={[styles.footerText, { color: colors.onSurfaceMuted }]}>
                      This phrase is repeated {ayahsCount} times in {ayahsCount} ayahs across {surahsCount} surahs.{" "}
                      <Text 
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                          setSelectedGroup(group);
                        }}
                        style={styles.viewAllLink}
                      >
                        View all
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* 1. JUMP TO AYAH SELECT DROPDOWN MODAL */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setDropdownVisible(false)}
        >
          <View style={[styles.selectModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.selectModalHeader}>
              <Text style={[styles.selectModalTitle, { color: colors.onSurface }]}>Jump to Verse</Text>
              <Pressable onPress={() => setDropdownVisible(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search Surah Name..."
                placeholderTextColor={colors.onSurfaceMuted}
                style={[styles.searchInput, { color: colors.onSurface }]}
              />
            </View>

            {/* Scrollable list */}
            <FlatList
              data={filteredKeys}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const [s, a] = item.split(":").map(Number);
                const isSelected = item === activeKey;
                
                return (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setActiveKey(item);
                      setDropdownVisible(false);
                      setSearchQuery("");
                    }}
                    style={[
                      styles.selectItem,
                      isSelected && { backgroundColor: colors.brand + "18" }
                    ]}
                  >
                    <View style={styles.selectItemInfo}>
                      <Text style={[styles.selectItemSurah, { color: colors.onSurface }]}>
                        {getSurahName(s)} {s}:{a}
                      </Text>
                      <Text style={[styles.selectItemArabicName, { color: colors.brand }]}>
                        {getSurahArabicName(s)}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={18} color={colors.brand} />
                    )}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />}
            />
          </View>
        </Pressable>
      </Modal>

      {/* 2. AYAHS CONTAINING THE PHRASE DETAILS MODAL (IMAGE 2) */}
      <Modal
        visible={selectedGroup !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedGroup(null)}
      >
        {(() => {
          if (!selectedGroup) return null;

          return (
            <View style={styles.detailsModalOverlay}>
              <View style={[styles.detailsModalContent, { backgroundColor: colors.surface }]}>
                
                {/* Modal Header */}
                <View style={[styles.detailsModalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.detailsModalTitle, { color: colors.onSurface }]}>
                    Ayahs containing the phrase
                  </Text>
                  <Pressable 
                    onPress={() => setSelectedGroup(null)} 
                    hitSlop={12}
                    style={[styles.detailsCloseBtn, { backgroundColor: colors.surfaceSecondary }]}
                  >
                    <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                  </Pressable>
                </View>

                {/* List of occurrences */}
                <FlatList
                  data={selectedGroup.matches}
                  keyExtractor={(item) => item.matched_ayah_key}
                  contentContainerStyle={styles.detailsListContent}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const [sNum, aNum] = item.matched_ayah_key.split(":").map(Number);
                    const sName = getSurahName(sNum);
                    const fullArabicText = getAyahArabicText(sNum, aNum);
                    const occDetails = getAyahDetails(sNum, aNum);

                    return (
                      <View style={[styles.occurrenceCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                        {/* Reference Header */}
                        <View style={styles.occurrenceMetaRow}>
                          <View style={[styles.refBadge, { backgroundColor: colors.brand }]}>
                            <Text style={styles.refBadgeTxt}>{sNum}:{aNum}</Text>
                          </View>
                          <Text style={[styles.occurrenceSurahName, { color: colors.onSurfaceSecondary }]}>
                            {sName}
                          </Text>
                        </View>

                        {/* Arabic text with highlighted matching phrase */}
                        <View style={styles.occurrenceVerseWrap}>
                           {renderHighlightedText(fullArabicText, item.match_words, 21)}
                        </View>

                        {/* Translation & Transliteration */}
                        {occDetails.transliteration ? (
                          <Text style={[styles.transliterationText, { color: colors.onSurfaceSecondary, marginTop: 8 }]}>
                            {occDetails.transliteration}
                          </Text>
                        ) : null}
                        {occDetails.translation ? (
                          <Text style={[styles.translationText, { color: colors.onSurfaceMuted, marginTop: 4 }]}>
                            {occDetails.translation}
                          </Text>
                        ) : null}
                      </View>
                    );
                  }}
                  ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                />
              </View>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 20,
  },
  headerTitleContainer: {
    gap: 6,
    marginTop: 8,
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28,
  },
  subHeading: {
    fontSize: 14,
    lineHeight: 20,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    minWidth: 140,
    justifyContent: "space-between",
  },
  dropdownTriggerTxt: {
    fontSize: 14,
    fontWeight: "700",
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navBtnTxt: {
    fontSize: 13,
    fontWeight: "600",
  },
  cardsContainer: {
    gap: 16,
  },
  phraseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  cardHeaderVerse: {
    alignItems: "flex-end",
    paddingBottom: 6,
  },
  arabicTextBase: {
    fontFamily: "Amiri",
    lineHeight: 46,
    textAlign: "right",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  bodyTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  extractedPhraseArabic: {
    fontFamily: "Amiri",
    fontSize: 22,
    color: "#8B5CF6", // purple text matching screenshot
    fontWeight: "700",
    textAlign: "right",
  },
  cardFooter: {
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  viewAllLink: {
    color: "#4F46E5",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  noDataCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  
  // Custom Dropdown Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  selectModalContent: {
    width: "100%",
    maxHeight: "75%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  selectModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  selectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectItemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  selectItemSurah: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectItemArabicName: {
    fontFamily: "Amiri",
    fontSize: 16,
  },
  itemDivider: {
    height: 1,
    opacity: 0.1,
  },

  // Details Modal Styles (IMAGE 2)
  detailsModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  detailsModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  detailsModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  detailsModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  detailsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsListContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  occurrenceCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  occurrenceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refBadgeTxt: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  occurrenceSurahName: {
    fontSize: 13,
    fontWeight: "700",
  },
  occurrenceVerseWrap: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  transliterationText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
    marginTop: 8,
    textAlign: "left",
  },
  translationText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: "left",
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
});
