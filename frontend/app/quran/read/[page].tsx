import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, ActivityIndicator, Platform, ScrollView, Modal, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { theme } from "@/src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useIsFocused } from "@react-navigation/native";

import quranData from "@/src/data/quran/quranData.json";
import pageMappingData from "@/src/data/quran/pageMapping.json";

type QuranBookmark = {
  page: number;
  verse?: string;
  timestamp?: number;
};

type LocalAyah = { numberInSurah: number; arabic: string; translation: string; transliteration: string };
type LocalSurah = { number: number; name: string; arabicName: string; type: string; totalAyahs: number; ayahs: LocalAyah[] };
type MappedAyah = { surah: number; ayah: number };
type PageMap = { page: number; ayahs: MappedAyah[] };

const { width, height } = Dimensions.get("window");
const TOTAL_PAGES = 604; // Standard Medina Mushaf Pages

const QURAN: LocalSurah[] = quranData as LocalSurah[];
const PAGE_MAPPING: PageMap[] = pageMappingData as PageMap[];

const toArabicNumber = (num: number) => {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(num)
    .split("")
    .map((d) => (d >= "0" && d <= "9" ? arabicDigits[Number(d)] : d))
    .join("");
};

interface QuranPageItemProps {
  item: number;
  isNightMode: boolean;
  colors: any;
  zoomScale: number;
  selectedAyah: any;
  onSelectAyah: (ayah: any) => void;
  fontType: "indopak" | "uthmani" | "naskh";
}

const QuranPageItem = ({
  item,
  isNightMode,
  colors,
  zoomScale,
  selectedAyah,
  onSelectAyah,
  fontType,
}: QuranPageItemProps) => {
  const pageMap = PAGE_MAPPING.find((p) => p.page === item);
  if (!pageMap) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: isNightMode ? "#FFF" : "#333" }}>Page mapping not found.</Text>
      </View>
    );
  }

  const pageVerses = pageMap.ayahs.map((m) => {
    const surah = QURAN.find((s) => s.number === m.surah);
    const ayah = surah?.ayahs.find((a) => a.numberInSurah === m.ayah);
    return {
      surahNumber: m.surah,
      surahName: surah?.name || "",
      surahArabicName: surah?.arabicName || "",
      surahType: surah?.type || "",
      ayahNumber: m.ayah,
      arabic: ayah?.arabic || "",
      translation: ayah?.translation || "",
      transliteration: ayah?.transliteration || "",
    };
  });

  // Group verses by Surah to render header borders correctly
  const segments: {
    type: "header" | "bismillah" | "verses";
    surahNumber: number;
    surahArabicName: string;
    surahName: string;
    surahType: string;
    items: typeof pageVerses;
  }[] = [];

  let lastSurah = -1;
  let currentSegment: typeof pageVerses = [];

  pageVerses.forEach((v) => {
    if (v.surahNumber !== lastSurah) {
      if (currentSegment.length > 0) {
        segments.push({
          type: "verses",
          surahNumber: lastSurah,
          surahArabicName: pageVerses.find((x) => x.surahNumber === lastSurah)?.surahArabicName || "",
          surahName: pageVerses.find((x) => x.surahNumber === lastSurah)?.surahName || "",
          surahType: pageVerses.find((x) => x.surahNumber === lastSurah)?.surahType || "",
          items: currentSegment,
        });
        currentSegment = [];
      }

      // Add Surah Title Header
      segments.push({
        type: "header",
        surahNumber: v.surahNumber,
        surahArabicName: v.surahArabicName,
        surahName: v.surahName,
        surahType: v.surahType,
        items: [],
      });

      // Add Bismillah banner if it's the first verse of the surah (except Fatiha and Tawbah)
      if (v.ayahNumber === 1 && v.surahNumber !== 1 && v.surahNumber !== 9) {
        segments.push({
          type: "bismillah",
          surahNumber: v.surahNumber,
          surahArabicName: v.surahArabicName,
          surahName: v.surahName,
          surahType: v.surahType,
          items: [],
        });
      }

      lastSurah = v.surahNumber;
    }
    currentSegment.push(v);
  });

  if (currentSegment.length > 0) {
    segments.push({
      type: "verses",
      surahNumber: lastSurah,
      surahArabicName: pageVerses.find((x) => x.surahNumber === lastSurah)?.surahArabicName || "",
      surahName: pageVerses.find((x) => x.surahNumber === lastSurah)?.surahName || "",
      surahType: pageVerses.find((x) => x.surahNumber === lastSurah)?.surahType || "",
      items: currentSegment,
    });
  }

  return (
    <View style={{ flex: 1 }}>
      {segments.map((seg, idx) => {
        if (seg.type === "header") {
          return (
            <View
              key={`header-${idx}`}
              style={[
                styles.surahHeader,
                {
                  backgroundColor: isNightMode ? "#152235" : "#F5EFE4",
                  borderColor: colors.brand,
                },
              ]}
            >
              <Text
                style={[
                  styles.surahHeaderArabic,
                  {
                    fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                    color: isNightMode ? "#F0F4F8" : "#5C4E3C",
                  },
                ]}
              >
                سُورَةُ {seg.surahArabicName}
              </Text>
              <Text style={[styles.surahHeaderEng, { color: colors.brand }]}>
                Surah {seg.surahName} ({seg.surahType})
              </Text>
            </View>
          );
        }

        if (seg.type === "bismillah") {
          return (
            <View key={`bismillah-${idx}`} style={styles.bismillahBox}>
              <Text
                style={[
                  styles.bismillahText,
                  {
                    fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                    color: isNightMode ? "#F0F4F8" : "#2C1E10",
                  },
                ]}
              >
                بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
              </Text>
            </View>
          );
        }

        return (
          <View key={`verses-${idx}`} style={styles.versesParagraph}>
            <Text style={{ textAlign: "center" }}>
              {seg.items.map((v, vIdx) => {
                const isSelected = selectedAyah?.surahNumber === v.surahNumber && selectedAyah?.ayahNumber === v.ayahNumber;
                return (
                  <Text
                    key={vIdx}
                    onPress={() => onSelectAyah(v)}
                    style={[
                      styles.arabicWord,
                      {
                        fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                        fontSize: zoomScale * 21,
                        lineHeight: zoomScale * 21 * 1.95,
                        color: isSelected ? colors.brand : isNightMode ? "#F0F4F8" : "#2C1E10",
                      },
                      isSelected && { backgroundColor: colors.brand + "28" },
                    ]}
                  >
                    {v.arabic}
                    <Text style={[styles.ayahEndCircle, { color: colors.brand, fontSize: zoomScale * 14 }]}>
                      {` ۝${toArabicNumber(v.ayahNumber)} `}
                    </Text>
                  </Text>
                );
              })}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

export default function QuranReadScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router = useRouter();
  const { colors, language, arabicFont } = useTheme();

  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [zoomScale, setZoomScale] = useState(1);
  const [fontType, setFontType] = useState<"indopak" | "uthmani" | "naskh">(arabicFont as any);

  // Selected Verse details
  const [selectedAyah, setSelectedAyah] = useState<any>(null);
  const [translatedText, setTranslatedText] = useState("");
  const [translating, setTranslating] = useState(false);

  // Bookmark Prompt Modal State
  const [bookmarkModalVisible, setBookmarkModalVisible] = useState(false);
  const [verseInput, setVerseInput] = useState("");

  // Jump to Page Modal State
  const [jumpModalVisible, setJumpModalVisible] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Audio Player states
  const [playingAyah, setPlayingAyah] = useState<{ surah: number; ayah: number } | null>(null);
  const player = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(player);

  const flatListRef = useRef<FlatList>(null);
  const initialDist = useRef<number | null>(null);
  const baseScale = useRef<number>(1);

  const isFocused = useIsFocused();

  // Load preferences on focus
  // Sync font type whenever ThemeContext arabicFont changes (user changed in Quick Settings)
  useEffect(() => {
    setFontType(arabicFont as any);
  }, [arabicFont]);

  // Load last read & bookmarks
  useEffect(() => {
    AsyncStorage.getItem("islamic_hikmah:bookmarked_pages").then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const migrated: QuranBookmark[] = parsed.map((item: any) => {
            if (typeof item === "number") {
              return { page: item, timestamp: Date.now() };
            }
            return item;
          });
          setBookmarks(migrated);
        } catch {
          setBookmarks([]);
        }
      }
    });
    AsyncStorage.getItem("islamic_hikmah:read_night_mode").then((val) => {
      if (val !== null) setIsNightMode(val === "true");
    });
  }, []);

  // Audio status monitor
  useEffect(() => {
    if (audioStatus?.didJustFinish) {
      setPlayingAyah(null);
    }
  }, [audioStatus?.didJustFinish]);

  // Translate active selection
  useEffect(() => {
    if (!selectedAyah) return;
    const enText = selectedAyah.translation;
    if (language === "en") {
      setTranslatedText(enText);
      return;
    }

    setTranslating(true);
    const cacheKey = `islamic_hikmah:read_trans_${language}_${selectedAyah.surahNumber}_${selectedAyah.ayahNumber}`;
    AsyncStorage.getItem(cacheKey).then((cached) => {
      if (cached) {
        setTranslatedText(cached);
        setTranslating(false);
      } else {
        fetch(
          `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(
            enText
          )}`
        )
          .then((res) => res.json())
          .then((data) => {
            const result = data?.[0]?.map((x: any) => x[0]).join("") || enText;
            setTranslatedText(result);
            AsyncStorage.setItem(cacheKey, result);
            setTranslating(false);
          })
          .catch(() => {
            setTranslatedText(enText);
            setTranslating(false);
          });
      }
    });
  }, [selectedAyah, language]);

  const saveLastRead = async (pageNum: number) => {
    try {
      await AsyncStorage.setItem("islamic_hikmah:last_read_page", String(pageNum));
    } catch {}
  };

  const toggleBookmark = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const alreadyBookmarked = bookmarks.some((b) => b.page === currentPage);
    if (alreadyBookmarked) {
      const updated = bookmarks.filter((b) => b.page !== currentPage);
      setBookmarks(updated);
      await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(updated));
    } else {
      setVerseInput("");
      setBookmarkModalVisible(true);
    }
  };

  const saveBookmark = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const updated = [
      ...bookmarks,
      {
        page: currentPage,
        verse: verseInput.trim() || undefined,
        timestamp: Date.now(),
      },
    ];
    setBookmarks(updated);
    await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(updated));
    setBookmarkModalVisible(false);
  };

  const handleJumpPage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const pageNum = Number(jumpPageInput);
    if (pageNum >= 1 && pageNum <= TOTAL_PAGES) {
      setJumpModalVisible(false);
      flatListRef.current?.scrollToIndex({ index: pageNum - 1, animated: false });
      setCurrentPage(pageNum);
      saveLastRead(pageNum);
      setSelectedAyah(null);
    } else {
      alert("Please enter a valid page number between 1 and 604.");
    }
  };

  const toggleNightMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const val = !isNightMode;
    setIsNightMode(val);
    await AsyncStorage.setItem("islamic_hikmah:read_night_mode", String(val));
  };

  const playSingleAyah = (surahNum: number, ayahNum: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (playingAyah && playingAyah.surah === surahNum && playingAyah.ayah === ayahNum && audioStatus?.playing) {
      player.pause();
      setPlayingAyah(null);
      return;
    }

    // Absolute verse calculation
    let count = 0;
    for (let i = 1; i < surahNum; i++) {
      const s = QURAN.find((x) => x.number === i);
      if (s) count += s.totalAyahs;
    }
    const absoluteIdx = count + ayahNum;
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${absoluteIdx}.mp3`;

    player.replace({ uri: url });
    player.play();
    setPlayingAyah({ surah: surahNum, ayah: ayahNum });
  };

  const onScroll = useCallback((e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const pageNum = Math.round(offset / width) + 1;
    if (pageNum >= 1 && pageNum <= TOTAL_PAGES && pageNum !== currentPage) {
      setCurrentPage(pageNum);
      saveLastRead(pageNum);
      setSelectedAyah(null);
      if (player) {
        player.pause();
        setPlayingAyah(null);
      }
    }
  }, [currentPage, player]);

  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const pagesData = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

  const renderPage = useCallback(({ item }: { item: number }) => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={{ width, height: height - 150, backgroundColor: isNightMode ? "#0D1E2E" : "#FAF7F0" }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24, paddingBottom: selectedAyah ? 280 : 120 }}
    >
      <QuranPageItem
        item={item}
        isNightMode={isNightMode}
        colors={colors}
        zoomScale={zoomScale}
        selectedAyah={selectedAyah}
        onSelectAyah={setSelectedAyah}
        fontType={fontType}
      />
    </ScrollView>
  ), [isNightMode, colors, zoomScale, selectedAyah, fontType]);

  // Touch gesture handlers for pinch to zoom
  const handleTouchStart = (e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches && touches.length === 2) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      initialDist.current = Math.sqrt(dx * dx + dy * dy);
      baseScale.current = zoomScale;
    }
  };

  const handleTouchMove = (e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches && touches.length === 2 && initialDist.current !== null) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = (dist / initialDist.current) * baseScale.current;
      setZoomScale(Math.min(Math.max(scale, 0.8), 2.5));
    }
  };

  const handleTouchEnd = () => {
    initialDist.current = null;
  };

  return (
    <View style={[styles.container, { backgroundColor: isNightMode ? "#0D1829" : "#FFFFFF" }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: isNightMode ? "#334155" : "#E2E8F0", backgroundColor: isNightMode ? "#0D1829" : "#FFFFFF" }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={isNightMode ? "#FFF" : "#5C4E3C"} />
        </Pressable>
        <Text style={[styles.title, { color: isNightMode ? "#F0F4F8" : "#5C4E3C" }]}>
          Medina Mushaf - Page {currentPage}
        </Text>
        <Pressable onPress={() => {
          setJumpPageInput(String(currentPage));
          setJumpModalVisible(true);
        }} hitSlop={10}>
          <MaterialCommunityIcons name="magnify" size={24} color={isNightMode ? "#FFF" : "#5C4E3C"} />
        </Pressable>
      </View>
 
      {/* Page swiper */}
      <View 
        style={{ flex: 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <FlatList
          ref={flatListRef}
          data={pagesData}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item)}
          renderItem={renderPage}
          onScroll={onScroll}
          initialScrollIndex={currentPage - 1}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          removeClippedSubviews={Platform.OS === "android"}
        />
      </View>

      {/* Selected Ayah bottom actions drawer */}
      {selectedAyah && (
        <View style={[styles.drawer, { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border }]}>
          <View style={styles.drawerHeader}>
            <View>
              <Text style={[styles.drawerTitle, { color: colors.onSurface }]}>
                Surah {selectedAyah.surahName} · Ayah {selectedAyah.ayahNumber}
              </Text>
              <Text style={[styles.drawerSubtitle, { color: colors.onSurfaceMuted }]}>
                Page {currentPage} of {TOTAL_PAGES}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedAyah(null)} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={24} color={colors.onSurfaceMuted} />
            </Pressable>
          </View>

          <ScrollView style={styles.drawerScroll} contentContainerStyle={{ paddingBottom: 16 }}>
            <Text style={[styles.drawerArabicText, { color: colors.onSurface }]}>
              {selectedAyah.arabic}
            </Text>
            <Text style={[styles.drawerTranslit, { color: colors.brand }]}>
              {selectedAyah.transliteration}
            </Text>
            {translating ? (
              <ActivityIndicator color={colors.brand} style={{ marginVertical: 12 }} />
            ) : (
              <Text style={[styles.drawerTranslation, { color: colors.onSurfaceMuted }]}>
                {translatedText}
              </Text>
            )}
          </ScrollView>

          <View style={styles.drawerActionBar}>
            <Pressable
              onPress={() => playSingleAyah(selectedAyah.surahNumber, selectedAyah.ayahNumber)}
              style={[
                styles.actionBtn,
                {
                  backgroundColor:
                    playingAyah && playingAyah.surah === selectedAyah.surahNumber && playingAyah.ayah === selectedAyah.ayahNumber
                      ? colors.brand + "22"
                      : colors.surface,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  playingAyah && playingAyah.surah === selectedAyah.surahNumber && playingAyah.ayah === selectedAyah.ayahNumber && audioStatus?.playing
                    ? "pause"
                    : "play"
                }
                size={18}
                color={colors.brand}
              />
              <Text style={[styles.actionBtnTxt, { color: colors.brand }]}>
                {playingAyah && playingAyah.surah === selectedAyah.surahNumber && playingAyah.ayah === selectedAyah.ayahNumber && audioStatus?.playing
                  ? "Pause"
                  : "Play Ayah"}
              </Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                const bookmarkName = `Surah ${selectedAyah.surahName} Ayah ${selectedAyah.ayahNumber}`;
                const alreadyBookmarked = bookmarks.some((b) => b.page === currentPage && b.verse === bookmarkName);
                let updated = [...bookmarks];
                if (alreadyBookmarked) {
                  updated = updated.filter((b) => !(b.page === currentPage && b.verse === bookmarkName));
                } else {
                  updated.push({ page: currentPage, verse: bookmarkName, timestamp: Date.now() });
                }
                setBookmarks(updated);
                await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(updated));
              }}
              style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            >
              {(() => {
                const bookmarkName = `Surah ${selectedAyah.surahName} Ayah ${selectedAyah.ayahNumber}`;
                const isBookmarked = bookmarks.some((b) => b.page === currentPage && b.verse === bookmarkName);
                return (
                  <>
                    <MaterialCommunityIcons
                      name={isBookmarked ? "bookmark" : "bookmark-outline"}
                      size={18}
                      color={colors.brand}
                    />
                    <Text style={[styles.actionBtnTxt, { color: colors.brand }]}>
                      {isBookmarked ? "Bookmarked" : "Bookmark"}
                    </Text>
                  </>
                );
              })()}
            </Pressable>
          </View>
        </View>
      )}

      {/* Bottom Bar Controls */}
      <View style={[styles.bottomBar, { 
        borderTopColor: isNightMode ? "#334155" : "#E2E8F0",
        backgroundColor: isNightMode ? "#0D1829" : "#FFFFFF"
      }]}>
        <Pressable onPress={toggleNightMode} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isNightMode ? "brightness-7" : "brightness-4"}
            size={24}
            color={isNightMode ? colors.brand : "#5C4E3C"}
          />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            // Find the surah on the current page and go to Listen screen
            const pageMapped = (pageMappingData as any[]).find((p: any) => p.page === currentPage);
            const surahNum = pageMapped?.ayahs?.[0]?.surah ?? 1;
            router.push(`/quran/${surahNum}` as any);
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="volume-high" size={24} color={isNightMode ? "#F0F4F8" : "#5C4E3C"} />
        </Pressable>

        <Pressable onPress={toggleBookmark} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isBookmarked ? colors.brand : isNightMode ? "#FFF" : "#5C4E3C"}
          />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/quran/personalise");
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color={isNightMode ? "#FFF" : "#5C4E3C"} />
        </Pressable>
      </View>

      {/* Bookmark Modal Prompt Dialog */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={bookmarkModalVisible}
        onRequestClose={() => setBookmarkModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setBookmarkModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Bookmark Verse</Text>
            <Text style={[styles.modalSub, { color: colors.onSurfaceMuted }]}>
              Type the verse number you wish to remember on page {currentPage}:
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { 
                  color: colors.onSurface, 
                  borderColor: colors.border, 
                  backgroundColor: colors.surface 
                }
              ]}
              placeholder="e.g. Verse 12 (Optional)"
              placeholderTextColor={colors.onSurfaceMuted}
              value={verseInput}
              onChangeText={setVerseInput}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setBookmarkModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.modalBtnTxt, { color: colors.onSurfaceMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveBookmark}
                style={[styles.modalBtn, { backgroundColor: colors.brand }]}
              >
                <Text style={[styles.modalBtnTxt, { color: "#FFF" }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Jump to Page Modal Dialog */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={jumpModalVisible}
        onRequestClose={() => setJumpModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setJumpModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Jump to Page</Text>
            <Text style={[styles.modalSub, { color: colors.onSurfaceMuted }]}>
              Enter a page number between 1 and 604:
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                { 
                  color: colors.onSurface, 
                  borderColor: colors.border, 
                  backgroundColor: colors.surface 
                }
              ]}
              placeholder="Page Number (1-604)"
              placeholderTextColor={colors.onSurfaceMuted}
              keyboardType="number-pad"
              value={jumpPageInput}
              onChangeText={setJumpPageInput}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setJumpModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.modalBtnTxt, { color: colors.onSurfaceMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleJumpPage}
                style={[styles.modalBtn, { backgroundColor: colors.brand }]}
              >
                <Text style={[styles.modalBtnTxt, { color: "#FFF" }]}>Go</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "700" },
  surahHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
      android: { elevation: 1 },
      web: { boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
    }),
  },
  surahHeaderArabic: {
    fontSize: 22,
    fontFamily: "AmiriBold",
    fontWeight: "700",
  },
  surahHeaderEng: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 4,
  },
  bismillahBox: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  bismillahText: {
    fontFamily: "Amiri",
    fontSize: 22,
    textAlign: "center",
  },
  versesParagraph: {
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  arabicWord: {
    fontFamily: "AmiriBold",
    textAlign: "center",
  },
  ayahEndCircle: {
    fontFamily: "Amiri",
    fontWeight: "500",
  },
  drawer: {
    position: "absolute",
    bottom: 84,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 8 },
      web: { boxShadow: "0 -4px 12px rgba(0,0,0,0.08)" },
    }),
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  drawerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  drawerScroll: {
    maxHeight: 180,
    marginVertical: 8,
  },
  drawerArabicText: {
    fontFamily: "AmiriBold",
    fontSize: 25,
    textAlign: "right",
    lineHeight: 46,
    marginBottom: 8,
  },
  drawerTranslit: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
    marginBottom: 8,
  },
  drawerTranslation: {
    fontSize: 14,
    lineHeight: 20,
  },
  drawerActionBar: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: theme.radius.md,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 1 },
      web: { boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
    }),
  },
  actionBtnTxt: {
    fontSize: 13,
    fontWeight: "700",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 14,
    borderTopWidth: 1,
    paddingBottom: 28,
  },
  barBtn: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    padding: 20,
    borderRadius: theme.radius.lg,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 20,
  },
  modalInput: {
    width: "100%",
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
    width: "100%",
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    minWidth: 90,
    alignItems: "center",
  },
  modalBtnTxt: {
    fontSize: 14,
    fontWeight: "600",
  },
});
