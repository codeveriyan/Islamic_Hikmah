import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, ActivityIndicator, Platform, ScrollView, Modal, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { theme } from "@/src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useIsFocused } from "@react-navigation/native";

import quranData from "@/src/data/quran/quranData.json";
import pageMappingData from "@/src/data/quran/pageMapping.json";
import { TRANSLATION_MAP } from "@/src/data/quran/translationLanguages";

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
  playingAyah: { surah: number; ayah: number } | null;
  onTapAyah: (ayah: any) => void;
  onLongPressAyah: (ayah: any) => void;
  bookmarkedVerses: Set<string>; // "surahNum-ayahNum"
  fontType: "indopak" | "uthmani" | "naskh";
}

const QuranPageItem = ({
  item,
  isNightMode,
  colors,
  zoomScale,
  playingAyah,
  onTapAyah,
  onLongPressAyah,
  bookmarkedVerses,
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
                const verseKey = `${v.surahNumber}-${v.ayahNumber}`;
                const isBookmarked = bookmarkedVerses.has(verseKey);
                const isPlaying = playingAyah?.surah === v.surahNumber && playingAyah?.ayah === v.ayahNumber;
                return (
                  <Text
                    key={vIdx}
                    onPress={() => onTapAyah(v)}
                    onLongPress={() => onLongPressAyah(v)}
                    style={[
                      styles.arabicWord,
                      {
                        fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                        fontSize: zoomScale * 21,
                        lineHeight: zoomScale * 21 * 1.95,
                        // Priority: playing > bookmarked > normal
                        color: isPlaying
                          ? colors.brandSecondary   // teal while playing
                          : isBookmarked
                          ? colors.brand            // gold for bookmarked
                          : isNightMode ? "#F0F4F8" : "#2C1E10",
                        // Bold weight for bookmarked verses
                        fontWeight: isBookmarked ? "900" : "400",
                        // Highlighted background for bookmarked
                        backgroundColor: isPlaying
                          ? colors.brandSecondary + "28"
                          : isBookmarked
                          ? colors.brand + "22"
                          : "transparent",
                        borderRadius: 4,
                      },
                    ]}
                  >
                    {v.arabic}
                    {isBookmarked && (
                      <Text style={{ color: colors.brand, fontSize: zoomScale * 11 }}>🔖</Text>
                    )}
                    <Text style={[styles.ayahEndCircle, {
                      color: isPlaying ? colors.brandSecondary : colors.brand,
                      fontSize: zoomScale * 14
                    }]}>
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
  const { t } = useTranslation(language);

  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [zoomScale, setZoomScale] = useState(1);
  const [fontType, setFontType] = useState<"indopak" | "uthmani" | "naskh">(arabicFont as any);

  // Bookmarked verses as a Set of "surahNum-ayahNum" strings for O(1) lookup
  const [bookmarkedVerses, setBookmarkedVerses] = useState<Set<string>>(new Set());

  // Vertical scroll percentage of current page
  const [pageScrollPct, setPageScrollPct] = useState(0);

  // Currently playing ayah label
  // Bookmark Prompt Modal State

  // Jump to Page Modal State
  const [jumpModalVisible, setJumpModalVisible] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Tier 2: View Mode (mushaf = page layout, list = list layout with translations, tafsir = exegesis view)
  const [activeViewMode, setActiveViewMode] = useState<"mushaf" | "list" | "tafsir">("mushaf");

  // Page translation states for the selected language if non-English
  const [pageTranslations, setPageTranslations] = useState<Record<number, Record<number, string>>>({});

  useEffect(() => {
    if (language === "en") return;
    let active = true;

    const pageMap = pageMappingData.find((p) => p.page === currentPage);
    if (!pageMap) return;

    const surahIds = Array.from(new Set(pageMap.ayahs.map((m) => m.surah)));

    const fetchTranslationForSurah = async (surahId: number) => {
      const cacheKey = `islamic_hikmah:quran_trans_${language}_${surahId}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && active) {
          try {
            const { trans } = JSON.parse(cached);
            if (trans && Array.isArray(trans)) {
              const mapping: Record<number, string> = {};
              trans.forEach((ayah: any) => {
                mapping[ayah.numberInSurah] = ayah.text;
              });
              setPageTranslations((prev) => ({ ...prev, [surahId]: mapping }));
              return;
            }
          } catch {
            // ignore
          }
        }

        if (language === "ta") {
          const taJanTrust = require("@/src/data/quran/ta-jan-trust-simple.json");
          const pageMapLocal = pageMappingData.find((p) => p.page === currentPage);
          if (pageMapLocal && active) {
            const mapping: Record<number, string> = {};
            const transList: any[] = [];
            // We want to load the translation for ALL verses of this surah so it gets cached and reused correctly!
            const surahObj = quranData.find((s) => s.number === surahId);
            if (surahObj) {
              surahObj.ayahs.forEach((ayah) => {
                const key = `${surahId}:${ayah.numberInSurah}`;
                const text = taJanTrust[key] ? taJanTrust[key].t : ayah.translation;
                mapping[ayah.numberInSurah] = text;
                transList.push({ numberInSurah: ayah.numberInSurah, text });
              });
            }
            setPageTranslations((prev) => ({ ...prev, [surahId]: mapping }));
            await AsyncStorage.setItem(cacheKey, JSON.stringify({ trans: transList, translit: [] })).catch(() => {});
          }
          return;
        }

        const translationId = TRANSLATION_MAP[language as keyof typeof TRANSLATION_MAP];
        if (translationId) {
          const response = await fetch(`https://api.quran.com/api/v4/quran/translations/${translationId}?chapter_number=${surahId}`);
          if (!active) return;

          if (response.ok) {
            const data = await response.json();
            if (data && data.translations && data.translations.length > 0) {
              const transList = data.translations.map((item: any, idx: number) => ({
                numberInSurah: idx + 1,
                text: item.text.replace(/<[^>]*>/g, "").trim()
              }));

              const mapping: Record<number, string> = {};
              transList.forEach((t: any) => {
                mapping[t.numberInSurah] = t.text;
              });

              setPageTranslations((prev) => ({ ...prev, [surahId]: mapping }));
              await AsyncStorage.setItem(cacheKey, JSON.stringify({ trans: transList, translit: [] })).catch(() => {});
            }
          }
        }
      } catch (e) {
        console.error(`Failed to load page translation for surah ${surahId}:`, e);
      }
    };

    surahIds.forEach((id) => {
      fetchTranslationForSurah(id);
    });

    return () => {
      active = false;
    };
  }, [currentPage, language]);

  // Tafsir Modal States
  const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirContent, setTafsirContent] = useState("");
  const [tafsirRef, setTafsirRef] = useState({ surah: 0, ayah: 0, arabic: "", trans: "" });
  const [activeTafsirId, setActiveTafsirId] = useState<number>(169); // 169 = Ibn Kathir (English), 160 = Al-Jalalayn (English by F. Hamza)

  const openTafsirModal = useCallback(async (surahNum: number, ayahNum: number, arabicText: string, transText: string, tafsirIdOverride?: number) => {
    const tafsirId = tafsirIdOverride ?? activeTafsirId;
    setTafsirRef({ surah: surahNum, ayah: ayahNum, arabic: arabicText, trans: transText });
    setTafsirModalVisible(true);
    setTafsirLoading(true);
    setTafsirContent("");

    try {
      const cacheKey = `hikmah:tafsir:${tafsirId}:${surahNum}:${ayahNum}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setTafsirContent(cached);
        setTafsirLoading(false);
        return;
      }

      const response = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surahNum}:${ayahNum}`);
      const data = await response.json();
      if (data && data.tafsir && data.tafsir.text) {
        let cleanText = data.tafsir.text.replace(/<\/?[^>]+(>|$)/g, "");
        cleanText = cleanText.trim();
        setTafsirContent(cleanText);
        await AsyncStorage.setItem(cacheKey, cleanText);
      } else {
        setTafsirContent("Commentary not available for this verse.");
      }
    } catch (e) {
      console.error(e);
      setTafsirContent("Failed to load Tafsir. Please check your internet connection.");
    } finally {
      setTafsirLoading(false);
    }
  }, [activeTafsirId]);

  // Audio Player states
  const [playingAyah, setPlayingAyah] = useState<{ surah: number; ayah: number } | null>(null);
  const [isPlayingContinuous, setIsPlayingContinuous] = useState(false);
  const [continuePlayNextPage, setContinuePlayNextPage] = useState(false);
  const player = useAudioPlayer(null);
  const audioStatus = useAudioPlayerStatus(player);

  const flatListRef = useRef<FlatList>(null);
  const initialDist = useRef<number | null>(null);
  const baseScale = useRef<number>(1);
  const playQueueRef = useRef<{ surah: number; ayah: number }[]>([]);
  const currentQueueIndexRef = useRef<number>(0);

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
          // Rebuild bookmarkedVerses Set from stored bookmarks
          const verses = new Set<string>(
            migrated
              .filter(b => b.verse && b.verse.includes("Surah "))
              .map(b => {
                // Parse "Surah X Ayah Y" into "surahNum-ayahNum"
                const m = b.verse!.match(/Surah (\d+) Ayah (\d+)/);
                return m ? `${m[1]}-${m[2]}` : "";
              })
              .filter(Boolean)
          );
          setBookmarkedVerses(verses);
        } catch {
          setBookmarks([]);
        }
      }
    });
    AsyncStorage.getItem("islamic_hikmah:read_night_mode").then((val) => {
      if (val !== null) setIsNightMode(val === "true");
    });
  }, []);

  // Audio status monitor - handles automatic next verse playback
  useEffect(() => {
    if (audioStatus?.didJustFinish) {
      if (isPlayingContinuous && continuePlayNextPage) {
        // Auto-play next verse in queue
        playNextInQueue();
      } else {
        setPlayingAyah(null);
      }
    }
  }, [audioStatus?.didJustFinish, isPlayingContinuous, continuePlayNextPage]);

  // Handle auto page-turning when reaching end of current page verses
  useEffect(() => {
    if (isPlayingContinuous && playingAyah && continuePlayNextPage) {
      const currentPageMap = PAGE_MAPPING.find((p) => p.page === currentPage);
      if (currentPageMap) {
        const lastVerseOnPage = currentPageMap.ayahs[currentPageMap.ayahs.length - 1];
        // If current playing verse is the last on page, go to next page
        if (
          playingAyah.surah === lastVerseOnPage.surah &&
          playingAyah.ayah === lastVerseOnPage.ayah
        ) {
          if (currentPage < TOTAL_PAGES) {
            setCurrentPage(currentPage + 1);
            saveLastRead(currentPage + 1);
            if (flatListRef.current) {
              flatListRef.current.scrollToIndex({
                index: currentPage,
                animated: false,
              });
            }
          }
        }
      }
    }
  }, [playingAyah, isPlayingContinuous, continuePlayNextPage, currentPage]);



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
      const newBookmark: QuranBookmark = { page: currentPage, timestamp: Date.now() };
      const updated = [...bookmarks, newBookmark];
      setBookmarks(updated);
      await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(updated));
    }
  };

  const handleJumpPage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const pageNum = Number(jumpPageInput);
    if (pageNum >= 1 && pageNum <= TOTAL_PAGES) {
      setJumpModalVisible(false);
      flatListRef.current?.scrollToIndex({ index: pageNum - 1, animated: false });
      setCurrentPage(pageNum);
      saveLastRead(pageNum);
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

  // Tap: play the verse immediately
  const onTapAyah = (v: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    playSingleAyah(v.surahNumber, v.ayahNumber);
  };

  // Long press: toggle bookmark on the verse + haptic feedback
  const onLongPressAyah = async (v: any) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const verseKey = `${v.surahNumber}-${v.ayahNumber}`;
    const bookmarkName = `Surah ${v.surahNumber} Ayah ${v.ayahNumber}`;

    setBookmarkedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseKey)) next.delete(verseKey);
      else next.add(verseKey);
      return next;
    });

    // Persist to bookmarks list
    const alreadyBookmarked = bookmarks.some(b => b.verse === bookmarkName);
    let updated = [...bookmarks];
    if (alreadyBookmarked) {
      updated = updated.filter(b => b.verse !== bookmarkName);
    } else {
      updated.push({ page: currentPage, verse: bookmarkName, timestamp: Date.now() });
    }
    setBookmarks(updated);
    await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(updated));
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

  // Get all verses from current page onwards
  const getAllVersesFromPage = (pageNum: number) => {
    const verses: { surah: number; ayah: number }[] = [];
    for (let p = pageNum; p <= TOTAL_PAGES; p++) {
      const pageMap = PAGE_MAPPING.find((pm) => pm.page === p);
      if (pageMap) {
        pageMap.ayahs.forEach((m) => {
          verses.push({ surah: m.surah, ayah: m.ayah });
        });
      }
    }
    return verses;
  };

  // Start continuous playback from current page
  const startContinuousPlayback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsPlayingContinuous(true);
    setContinuePlayNextPage(true);
    const verses = getAllVersesFromPage(currentPage);
    playQueueRef.current = verses;
    currentQueueIndexRef.current = 0;
    playNextInQueue();
  };

  // Stop continuous playback
  const stopContinuousPlayback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsPlayingContinuous(false);
    setContinuePlayNextPage(false);
    player.pause();
    setPlayingAyah(null);
    playQueueRef.current = [];
    currentQueueIndexRef.current = 0;
  };

  // Play next verse in queue
  const playNextInQueue = () => {
    if (currentQueueIndexRef.current >= playQueueRef.current.length) {
      // Queue finished
      setIsPlayingContinuous(false);
      setContinuePlayNextPage(false);
      return;
    }

    const verse = playQueueRef.current[currentQueueIndexRef.current];
    
    // Calculate absolute verse index
    let count = 0;
    for (let i = 1; i < verse.surah; i++) {
      const s = QURAN.find((x) => x.number === i);
      if (s) count += s.totalAyahs;
    }
    const absoluteIdx = count + verse.ayah;
    const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${absoluteIdx}.mp3`;

    player.replace({ uri: url });
    player.play();
    setPlayingAyah(verse);
    currentQueueIndexRef.current += 1;
  };

  const onScroll = useCallback((e: any) => {
    const offset = e.nativeEvent.contentOffset.y;
    const pageNum = Math.min(TOTAL_PAGES, Math.max(1, Math.round(offset / 780) + 1));
    if (pageNum !== currentPage) {
      setCurrentPage(pageNum);
      saveLastRead(pageNum);
      // Only stop playback if not in continuous playback mode (manual scroll)
      if (player && !isPlayingContinuous) {
        player.pause();
        setPlayingAyah(null);
      }
    }
    // Calculate progress within current page (0 to 100)
    const pageOffset = offset % 780;
    setPageScrollPct(Math.min(100, Math.max(0, Math.round((pageOffset / 780) * 100))));
  }, [currentPage, player, isPlayingContinuous]);

  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const pagesData = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

  const renderPage = useCallback(({ item }: { item: number }) => (
    <View
      style={{
        width,
        height: 780,
        backgroundColor: isNightMode ? "#0D1E2E" : "#FAF7F0",
        paddingHorizontal: 20,
        paddingVertical: 24,
        borderBottomWidth: 1,
        borderBottomColor: isNightMode ? "#1E2F40" : "#E2E8F0",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 11, color: colors.brand, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
        PAGE {item}
      </Text>
      <QuranPageItem
        item={item}
        isNightMode={isNightMode}
        colors={colors}
        zoomScale={zoomScale}
        playingAyah={playingAyah}
        onTapAyah={onTapAyah}
        onLongPressAyah={onLongPressAyah}
        bookmarkedVerses={bookmarkedVerses}
        fontType={fontType}
      />
    </View>
  ), [isNightMode, colors, zoomScale, playingAyah, bookmarkedVerses, fontType, onTapAyah, onLongPressAyah]);

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
      {/* Reading progress bar */}
      <View style={{ height: 3, backgroundColor: isNightMode ? "#1E3A55" : "#E2E8F0", width: "100%" }}>
        <View style={{ height: 3, backgroundColor: "#C5A880", width: `${pageScrollPct}%` }} />
      </View>


      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: isNightMode ? "#334155" : "#E2E8F0", backgroundColor: isNightMode ? "#0D1829" : "#FFFFFF" }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={isNightMode ? "#FFF" : "#5C4E3C"} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.title, { color: isNightMode ? "#F0F4F8" : "#5C4E3C" }]}>
            Medina Mushaf - Page {currentPage}
          </Text>
          <Text style={{ fontSize: 10, color: "#C5A880", fontWeight: "700", marginTop: 1 }}>
            {pageScrollPct}% read
          </Text>
        </View>
        <Pressable onPress={() => {
          setJumpPageInput(String(currentPage));
          setJumpModalVisible(true);
        }} hitSlop={10}>
          <MaterialCommunityIcons name="magnify" size={24} color={isNightMode ? "#FFF" : "#5C4E3C"} />
        </Pressable>
      </View>
 
      {/* Page swiper / Tafsir view switcher */}
      {activeViewMode === "tafsir" ? (
        <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
          {(() => {
            const pageMap = PAGE_MAPPING.find((p) => p.page === currentPage);
            if (!pageMap) return <Text style={{ color: isNightMode ? "#FFF" : "#333", textAlign: "center" }}>Page mapping not found.</Text>;
            
            return pageMap.ayahs.map((m, idx) => {
              const surah = QURAN.find((s) => s.number === m.surah);
              const ayah = surah?.ayahs.find((a) => a.numberInSurah === m.ayah);
              const isPlaying = playingAyah?.surah === m.surah && playingAyah?.ayah === m.ayah;

              return (
                <View
                  key={idx}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isPlaying ? colors.brand + "15" : isNightMode ? "#152235" : "#F5EFE4",
                    marginBottom: 12,
                    borderWidth: isPlaying ? 1 : 0,
                    borderColor: colors.brand,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, color: colors.brand, fontWeight: "700" }}>
                      Surah {surah?.name} · Ayah {m.ayah}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <Pressable onPress={() => playSingleAyah(m.surah, m.ayah)} hitSlop={10}>
                        <MaterialCommunityIcons
                          name={isPlaying ? "pause-circle" : "play-circle"}
                          size={24}
                          color={colors.brand}
                        />
                      </Pressable>
                      <Pressable
                        onPress={() => openTafsirModal(m.surah, m.ayah, ayah?.arabic || "", pageTranslations[m.surah]?.[m.ayah] || ayah?.translation || "")}
                        hitSlop={10}
                      >
                        <MaterialCommunityIcons name="comment-text-outline" size={22} color={colors.onSurfaceMuted} />
                      </Pressable>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                      color: isNightMode ? "#FFF" : "#2C1E10",
                      textAlign: "right",
                      lineHeight: 38,
                      marginBottom: 8,
                    }}
                  >
                    {ayah?.arabic}
                  </Text>
                  <Text style={{ fontSize: 13, color: isNightMode ? "#8BAFC8" : "#6B4423", fontStyle: "italic", marginBottom: 6 }}>
                    {ayah?.transliteration}
                  </Text>
                   <Text style={{ fontSize: 14, color: isNightMode ? "#D1D7DB" : "#333", lineHeight: 20 }}>
                    {pageTranslations[m.surah]?.[m.ayah] || ayah?.translation}
                  </Text>
                </View>
              );
            });
          })()}
        </ScrollView>
      ) : (
        /* Page swiper (Mushaf Page View Mode) */
        <View 
          style={{ flex: 1 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <FlatList
            ref={flatListRef}
            data={pagesData}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => String(item)}
            renderItem={renderPage}
            onScroll={onScroll}
            initialScrollIndex={currentPage - 1}
            getItemLayout={(data, index) => ({
              length: 780,
              offset: 780 * index,
              index,
            })}
            removeClippedSubviews={Platform.OS === "android"}
          />
        </View>
      )}

      {/* Interaction hints */}
      <View style={{ backgroundColor: colors.brand + "14", paddingVertical: 5, alignItems: "center" }}>
        <Text style={{ fontSize: 10, color: colors.brand, fontWeight: "600" }}>
          {activeViewMode === "tafsir" ? "Scroll vertically to read verse translations & Tafsir commentaries" : "TAP verse to play  ·  LONG PRESS to bookmark 🔖  ·  Use ⏯️ button to play all"}
        </Text>
      </View>

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
          onPress={() => isPlayingContinuous ? stopContinuousPlayback() : startContinuousPlayback()}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons
            name={isPlayingContinuous ? "pause-circle" : "play-circle"}
            size={24}
            color={isPlayingContinuous ? colors.brand : isNightMode ? "#F0F4F8" : "#5C4E3C"}
          />
        </Pressable>

        {/* Dynamic View Mode Toggle Button (Mushaf View vs Tafsir List View Toggle) */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveViewMode(prev => prev === "mushaf" ? "tafsir" : "mushaf");
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons
            name={activeViewMode === "tafsir" ? "book-open-page-variant" : "comment-text-multiple-outline"}
            size={24}
            color={activeViewMode === "tafsir" ? colors.brand : isNightMode ? "#FFF" : "#5C4E3C"}
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

      {/* Tafsir Commentary Modal Dialog */}
      <Modal
        visible={tafsirModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTafsirModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.tafsirModalContent, { backgroundColor: isNightMode ? "#0D1E2E" : "#FAF7F0", borderColor: colors.border }]}>
            <View style={styles.tafsirModalHeader}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Pressable
                  onPress={() => {
                    setActiveTafsirId(169);
                    openTafsirModal(tafsirRef.surah, tafsirRef.ayah, tafsirRef.arabic, tafsirRef.trans, 169);
                  }}
                  style={{
                    borderBottomWidth: activeTafsirId === 169 ? 2 : 0,
                    borderBottomColor: colors.brand,
                    paddingBottom: 4,
                  }}
                >
                  <Text style={[styles.tafsirModalTitle, { color: activeTafsirId === 169 ? colors.brand : colors.onSurfaceMuted, fontSize: 15 }]}>
                    Ibn Kathir
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setActiveTafsirId(160);
                    openTafsirModal(tafsirRef.surah, tafsirRef.ayah, tafsirRef.arabic, tafsirRef.trans, 160);
                  }}
                  style={{
                    borderBottomWidth: activeTafsirId === 160 ? 2 : 0,
                    borderBottomColor: colors.brand,
                    paddingBottom: 4,
                  }}
                >
                  <Text style={[styles.tafsirModalTitle, { color: activeTafsirId === 160 ? colors.brand : colors.onSurfaceMuted, fontSize: 15 }]}>
                    Al-Jalalayn
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={() => setTafsirModalVisible(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, color: colors.brand, fontWeight: "700", marginBottom: 8 }}>
                Surah {tafsirRef.surah} · Ayah {tafsirRef.ayah}
              </Text>
              <Text style={{ fontFamily: "AmiriBold", fontSize: 22, color: isNightMode ? "#FFF" : "#2C1E10", textAlign: "right", marginBottom: 12, lineHeight: 36 }}>
                {tafsirRef.arabic}
              </Text>
              <Text style={{ fontSize: 14, color: isNightMode ? "#D1D7DB" : "#333", marginBottom: 16, lineHeight: 22 }}>
                {tafsirRef.trans}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

              {tafsirLoading ? (
                <ActivityIndicator color={colors.brand} style={{ marginVertical: 32 }} />
              ) : (
                <Text style={{ fontSize: 14, color: isNightMode ? "#FFF" : "#2C1E10", lineHeight: 22, textAlign: "justify" }}>
                  {tafsirContent}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
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
                <Text style={[styles.modalBtnTxt, { color: colors.onSurfaceMuted }]}>{t("cancel")}</Text>
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
  tafsirModalContent: {
    width: "90%",
    height: "80%",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 6 },
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
    }),
  },
  tafsirModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  tafsirModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
});
