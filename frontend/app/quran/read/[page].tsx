import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, ActivityIndicator, Platform, ScrollView, Modal, TextInput, Alert } from "react-native";
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
import transliterationTajweedData from "@/src/data/quran/transliterationTajweed.json";
import transliterationSyllablesData from "@/src/data/quran/transliterationSyllables.json";
import transliterationWbwData from "@/src/data/quran/transliterationWbw.json";
import qpcV4LayoutData from "@/src/data/quran/qpcV4Layout.json";
import * as FileSystem from "expo-file-system/legacy";
import tafsirIndexData from "@/src/data/quran/tafsirIndex.json";

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

const READING_COLORS = {
  default: {
    bg: "#FFFFFF",
    containerBg: "#FFFFFF",
    mushafBg: "#FAF7F0",
    headerBg: "#FFFFFF",
    cardBg: "#F5EFE4",
    text: "#2C1E10",
    textMuted: "#6B4423",
    border: "#E2E8F0",
    icon: "#5C4E3C"
  },
  sepia: {
    bg: "#F5ECD7",
    containerBg: "#F5ECD7",
    mushafBg: "#EDE0C4",
    headerBg: "#F5ECD7",
    cardBg: "#E3D5BA",
    text: "#2C1A0E",
    textMuted: "#6B4423",
    border: "#EDE0C4",
    icon: "#8B5E2A"
  },
  dark: {
    bg: "#0D1829",
    containerBg: "#0D1829",
    mushafBg: "#0D1E2E",
    headerBg: "#0D1829",
    cardBg: "#152235",
    text: "#FFFFFF",
    textMuted: "#8BAFC8",
    border: "#334155",
    icon: "#FFFFFF"
  }
};

interface QuranPageItemProps {
  item: number;
  colors: any;
  zoomScale: number;
  playingAyah: { surah: number; ayah: number } | null;
  onTapAyah: (ayah: any) => void;
  onLongPressAyah: (ayah: any) => void;
  bookmarkedVerses: Set<string>; // "surahNum-ayahNum"
  fontType: "indopak" | "uthmani" | "naskh";
  transliterationType: "tajweed" | "syllables" | "wbw";
  fontSize: number;
  readingMode: "default" | "sepia" | "dark";
  mushafLayout?: "default" | "qpc_v4";
  quranElements?: any[];
}

const QuranPageItem = ({
  item,
  colors,
  zoomScale,
  playingAyah,
  onTapAyah,
  onLongPressAyah,
  bookmarkedVerses,
  fontType,
  transliterationType,
  fontSize,
  readingMode,
  mushafLayout = "default",
  quranElements = [],
}: QuranPageItemProps) => {
  const rc = READING_COLORS[readingMode];

  if (mushafLayout === "qpc_v4") {
    const pageLines = (qpcV4LayoutData as any)[String(item)] || [];
    return (
      <View style={{ flex: 1, paddingVertical: 8 }}>
        {pageLines.map((line: any, lIdx: number) => {
          const lineKey = `line-${lIdx}`;
          if (line.type === "surah_name") {
            const surah = QURAN.find((s) => s.number === line.surah);
            return (
              <View
                key={lineKey}
                style={[
                  styles.surahHeader,
                  {
                    backgroundColor: rc.cardBg,
                    borderColor: colors.brand,
                    marginVertical: 4,
                    paddingVertical: 10,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.surahHeaderArabic,
                    {
                      fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                      color: rc.text,
                      fontSize: 20,
                    },
                  ]}
                >
                  سُورَةُ {surah?.arabicName}
                </Text>
                <Text style={[styles.surahHeaderEng, { color: colors.brand, fontSize: 11 }]}>
                  Surah {surah?.name} ({surah?.type})
                </Text>
              </View>
            );
          }

          if (line.type === "basmallah") {
            return (
              <View key={lineKey} style={[styles.bismillahBox, { marginVertical: 3, paddingVertical: 4 }]}>
                <Text
                  style={[
                    styles.bismillahText,
                    {
                      fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                      color: rc.text,
                      fontSize: 20,
                    },
                  ]}
                >
                  بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
                </Text>
              </View>
            );
          }

          // Ayah line
          const startIdx = Math.max(0, Math.min(quranElements.length - 1, line.firstWord - 1));
          const endIdx = Math.max(0, Math.min(quranElements.length - 1, line.lastWord - 1));
          const lineElements = quranElements.slice(startIdx, endIdx + 1);

          return (
            <View key={lineKey} style={{ width: "100%", alignItems: "center", marginVertical: 2 }}>
              <Text style={{ textAlign: "center" }}>
                {lineElements.map((el, elIdx) => {
                  const verseKey = `${el.surah}-${el.ayah}`;
                  const isBookmarked = bookmarkedVerses.has(verseKey);
                  const isPlaying = playingAyah?.surah === el.surah && playingAyah?.ayah === el.ayah;
                  const isWord = el.type === "word";

                  const verseObj = {
                    surahNumber: el.surah,
                    ayahNumber: el.ayah,
                    arabic: QURAN.find(s => s.number === el.surah)?.ayahs.find(a => a.numberInSurah === el.ayah)?.arabic || "",
                    translation: "",
                    transliteration: "",
                  };

                  return (
                    <Text
                      key={elIdx}
                      onPress={() => onTapAyah(verseObj)}
                      onLongPress={() => onLongPressAyah(verseObj)}
                      style={[
                        styles.arabicWord,
                        {
                          fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                          fontSize: zoomScale * (fontSize - 3),
                          lineHeight: zoomScale * (fontSize - 3) * 1.95,
                          color: isPlaying
                            ? colors.brandSecondary
                            : isBookmarked
                            ? colors.brand
                            : isWord
                            ? rc.text
                            : rc.icon,
                          backgroundColor: isPlaying
                            ? colors.brandSecondary + "28"
                            : isBookmarked
                            ? colors.brand + "22"
                            : "transparent",
                          fontWeight: isBookmarked ? "900" : "400",
                          borderRadius: 4,
                        },
                      ]}
                    >
                      {el.text}
                    </Text>
                  );
                })}
              </Text>
            </View>
          );
        })}
      </View>
    );
  }

  const pageMap = PAGE_MAPPING.find((p) => p.page === item);
  if (!pageMap) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: rc.text }}>Page mapping not found.</Text>
      </View>
    );
  }

  const pageVerses = pageMap.ayahs.map((m) => {
    const surah = QURAN.find((s) => s.number === m.surah);
    const ayah = surah?.ayahs.find((a) => a.numberInSurah === m.ayah);
    const key = `${m.surah}:${m.ayah}`;
    let highQualityText = "";
    if (transliterationType === "syllables") {
      highQualityText = (transliterationSyllablesData as Record<string, string>)[key] || ayah?.transliteration || "";
    } else if (transliterationType === "wbw") {
      const words: string[] = [];
      let wordIdx = 1;
      while (true) {
        const wordKey = `${m.surah}:${m.ayah}:${wordIdx}`;
        const wordVal = (transliterationWbwData as Record<string, string>)[wordKey];
        if (!wordVal) break;
        words.push(wordVal);
        wordIdx++;
      }
      highQualityText = words.length > 0 ? words.join(" ") : (ayah?.transliteration || "");
    } else {
      highQualityText = (transliterationTajweedData as Record<string, string>)[key] || ayah?.transliteration || "";
    }

    return {
      surahNumber: m.surah,
      surahName: surah?.name || "",
      surahArabicName: surah?.arabicName || "",
      surahType: surah?.type || "",
      ayahNumber: m.ayah,
      arabic: ayah?.arabic || "",
      translation: ayah?.translation || "",
      transliteration: highQualityText,
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
                  backgroundColor: rc.cardBg,
                  borderColor: colors.brand,
                },
              ]}
            >
              <Text
                style={[
                  styles.surahHeaderArabic,
                  {
                    fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                    color: rc.text,
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
                    color: rc.text,
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
                        fontSize: zoomScale * (fontSize - 3),
                        lineHeight: zoomScale * (fontSize - 3) * 1.95,
                        // Priority: playing > bookmarked > normal
                        color: isPlaying
                          ? colors.brandSecondary   // teal while playing
                          : isBookmarked
                          ? colors.brand            // gold for bookmarked
                          : rc.text,
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
                      color: isPlaying ? colors.brandSecondary : isBookmarked ? colors.brand : rc.icon,
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
  const [readingMode, setReadingMode] = useState<"default" | "sepia" | "dark">("default");
  const [fontSize, setFontSize] = useState<number>(24);
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [zoomScale, setZoomScale] = useState(1);
  const [fontType, setFontType] = useState<"indopak" | "uthmani" | "naskh">(arabicFont as any);
  const [transliterationType, setTransliterationType] = useState<"tajweed" | "syllables" | "wbw">("tajweed");
  const [quranTransLang, setQuranTransLang] = useState<string>("en");
  const [mushafLayout, setMushafLayout] = useState<"default" | "qpc_v4">("default");
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);

  // Build global elements mapping on mount/render
  const quranElements = useMemo(() => {
    const list: { surah: number; ayah: number; text: string; type: "word" | "ayah_symbol"; wordIndex: number }[] = [];
    QURAN.forEach((surah) => {
      surah.ayahs.forEach((ayah) => {
        const words = ayah.arabic.trim().split(/\s+/).filter(Boolean);
        words.forEach((w, wIdx) => {
          list.push({
            surah: surah.number,
            ayah: ayah.numberInSurah,
            text: w,
            type: "word",
            wordIndex: wIdx + 1,
          });
        });
        list.push({
          surah: surah.number,
          ayah: ayah.numberInSurah,
          text: ` ۝${toArabicNumber(ayah.numberInSurah)} `,
          type: "ayah_symbol",
          wordIndex: 0,
        });
      });
    });
    return list;
  }, []);

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
    if (quranTransLang === "en") return;
    let active = true;

    const pageMap = pageMappingData.find((p) => p.page === currentPage);
    if (!pageMap) return;

    const surahIds = Array.from(new Set(pageMap.ayahs.map((m) => m.surah)));

    const fetchTranslationForSurah = async (surahId: number) => {
      const cacheKey = `islamic_hikmah:quran_trans_${quranTransLang}_${surahId}`;
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

        if (quranTransLang === "ta") {
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

        const translationId = TRANSLATION_MAP[quranTransLang as keyof typeof TRANSLATION_MAP];
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
  }, [currentPage, quranTransLang]);

  // Tafsir Modal States
  const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirContent, setTafsirContent] = useState("");
  const [tafsirRef, setTafsirRef] = useState({ surah: 0, ayah: 0, arabic: "", trans: "" });
  const [activeTafsirId, setActiveTafsirId] = useState<number>(169); // 169 = Ibn Kathir (English), 160 = Al-Jalalayn (English by F. Hamza)

  const availableTafsirs = useMemo(() => {
    // Maps standard translation ISO codes to language tags in tarteel JSON
    const langMap: Record<string, string> = {
      en: "english",
      ta: "tamil",
      hi: "hindi",
      ur: "urdu",
      bn: "bengali",
      te: "telugu",
      kn: "kannada",
      ml: "malayalam",
      es: "spanish",
      fr: "french",
      de: "german",
      tr: "turkish",
      id: "indones", // matches indonesian and indoniesua
      ru: "russian",
      fa: "persian",
      so: "somali",
      ms: "malay",
      uz: "uzbek",
      yo: "yoruba",
      ps: "pashto",
      gu: "gujarati",
      mr: "marathi",
      pa: "punjabi",
      sq: "albanian",
      bs: "bosnian",
      ro: "romanian",
      sw: "swahili",
      tg: "tajik",
      az: "azeri",
      zh: "chinese",
      ja: "japanese",
      ko: "korean",
      ku: "kurdish",
      pt: "portuguese",
      th: "thai",
      vi: "vietnamese",
      si: "sinhalese",
      tl: "tagalog",
      ug: "uyghur",
      ar: "arabic"
    };

    const targetLang = langMap[quranTransLang] || "english";
    let filtered = (tafsirIndexData as any[]).filter((t) => {
      const l = t.language.toLowerCase();
      if (targetLang === "indones") {
        return l.includes("indones") || l.includes("indoniesua");
      }
      return l.includes(targetLang) || targetLang.includes(l);
    });

    // Merge quran.com Tafsirs for specific major languages to offer more rich commentary
    if (targetLang === "english") {
      filtered = [
        { id: "169", title: "Ibn Kathir (Eng)", language: "english" },
        { id: "160", title: "Al-Jalalayn (Eng)", language: "english" },
        ...filtered
      ];
    } else if (targetLang === "arabic") {
      filtered = [
        { id: "16", title: "Tafsir Muyassar", language: "arabic" },
        { id: "91", title: "Tafsir Al-Sa'di", language: "arabic" },
        ...filtered
      ];
    } else if (targetLang === "urdu") {
      filtered = [
        { id: "160", title: "Ibn Kathir (Urdu)", language: "urdu" },
        ...filtered
      ];
    }

    if (filtered.length === 0) {
      filtered = [
        { id: "266", title: "English Al-Mukhtasar", language: "english" }
      ];
    }
    return filtered;
  }, [quranTransLang]);

  // Keep activeTafsirId synced when availableTafsirs changes
  useEffect(() => {
    if (availableTafsirs.length > 0) {
      const exists = availableTafsirs.some(t => String(t.id) === String(activeTafsirId));
      if (!exists) {
        setActiveTafsirId(Number(availableTafsirs[0].id));
      }
    }
  }, [availableTafsirs, activeTafsirId]);

  // Track which local Tafsirs have been downloaded (on native)
  const [downloadedTafsirs, setDownloadedTafsirs] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const checkDownloads = async () => {
      const isWeb = Platform.OS === 'web' || !FileSystem.documentDirectory;
      if (isWeb) return;
      const newMap: Record<number, boolean> = {};
      for (const taf of availableTafsirs) {
        const isLocal = (tafsirIndexData as any[]).some(t => String(t.id) === String(taf.id));
        if (!isLocal) continue;
        const localUri = `${FileSystem.documentDirectory}tafsirs/${taf.id}.json`;
        try {
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          newMap[Number(taf.id)] = fileInfo.exists;
        } catch {}
      }
      setDownloadedTafsirs(newMap);
    };
    checkDownloads();
  }, [availableTafsirs]);

  const downloadTafsirOffline = async (tafsirId: number) => {
    const isWeb = Platform.OS === 'web' || !FileSystem.documentDirectory;
    if (isWeb) {
      Alert.alert("Offline Mode", "Offline downloads are supported on mobile devices.");
      return;
    }
    
    setTafsirLoading(true);
    try {
      const localUri = `${FileSystem.documentDirectory}tafsirs/${tafsirId}.json`;
      const dirUri = `${FileSystem.documentDirectory}tafsirs/`;
      
      const dirInfo = await FileSystem.getInfoAsync(dirUri);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
      }
      
      const downloadUrl = `https://raw.githubusercontent.com/codeveriyan/Islamic_Hikmah/main/frontend/public/tafsirs/${tafsirId}.json`;
      console.log("Downloading Tafsir to offline cache:", downloadUrl);
      const dlResult = await FileSystem.downloadAsync(downloadUrl, localUri);
      if (dlResult.status === 200) {
        setDownloadedTafsirs(prev => ({ ...prev, [tafsirId]: true }));
        Alert.alert("Success", "Tafsir downloaded successfully for offline use.");
        // Reload current Tafsir content
        if (tafsirRef.surah > 0 && tafsirRef.ayah > 0) {
          openTafsirModal(tafsirRef.surah, tafsirRef.ayah, tafsirRef.arabic, tafsirRef.trans, tafsirId);
        }
      } else {
        throw new Error(`Download failed with status ${dlResult.status}`);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Download Failed", "Please check your internet connection.");
    } finally {
      setTafsirLoading(false);
    }
  };

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

      // Check if this tafsirId is one of the local Tarteel Tafsirs
      const isLocalTafsir = (tafsirIndexData as any[]).some(t => String(t.id) === String(tafsirId));

      if (isLocalTafsir) {
        const isWeb = Platform.OS === 'web' || !FileSystem.documentDirectory;
        let jsonContent = null;

        if (isWeb) {
          // On Web, first try to fetch from local server's public folder, then fall back to GitHub
          let response = null;
          try {
            const localUrl = window.location.origin + '/tafsirs/' + tafsirId + '.json';
            console.log("Attempting local fetch:", localUrl);
            response = await fetch(localUrl);
          } catch (localErr) {
            console.warn("Local fetch failed, falling back to GitHub:", localErr);
          }

          if (!response || !response.ok) {
            const githubUrl = `https://raw.githubusercontent.com/codeveriyan/Islamic_Hikmah/main/frontend/public/tafsirs/${tafsirId}.json`;
            console.log("Fetching from GitHub:", githubUrl);
            response = await fetch(githubUrl);
          }

          if (response && response.ok) {
            jsonContent = await response.json();
          } else {
            throw new Error(`Failed to load Tafsir: ${response ? response.status : 'network error'}`);
          }
        } else {
          // On Native (iOS/Android), read from local file system or download if not exists
          const localUri = `${FileSystem.documentDirectory}tafsirs/${tafsirId}.json`;
          const dirUri = `${FileSystem.documentDirectory}tafsirs/`;

          try {
            const dirInfo = await FileSystem.getInfoAsync(dirUri);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
            }

            const fileInfo = await FileSystem.getInfoAsync(localUri);
            if (fileInfo.exists) {
              const raw = await FileSystem.readAsStringAsync(localUri);
              jsonContent = JSON.parse(raw);
            }
          } catch (fsErr) {
            console.warn("FS read error:", fsErr);
          }

          if (!jsonContent) {
            // Download JSON from raw GitHub
            const downloadUrl = `https://raw.githubusercontent.com/codeveriyan/Islamic_Hikmah/main/frontend/public/tafsirs/${tafsirId}.json`;
            console.log("Downloading Tafsir from:", downloadUrl);
            const dlResult = await FileSystem.downloadAsync(downloadUrl, localUri);
            if (dlResult.status === 200) {
              const raw = await FileSystem.readAsStringAsync(localUri);
              jsonContent = JSON.parse(raw);
            } else {
              throw new Error(`Download failed with status ${dlResult.status}`);
            }
          }
        }

        const key = `${surahNum}:${ayahNum}`;
        if (jsonContent && jsonContent[key]) {
          let text = jsonContent[key].text || "";
          text = text.replace(/<\/?[^>]+(>|$)/g, "").trim();
          setTafsirContent(text);
          await AsyncStorage.setItem(cacheKey, text);
        } else {
          setTafsirContent("Commentary not available for this verse.");
        }
      } else {
        // Quran.com API fallback
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
  useEffect(() => {
    if (isFocused) {
      AsyncStorage.getItem("islamic_hikmah:transliteration_type").then((val) => {
        if (val === "syllables" || val === "wbw" || val === "tajweed") {
          setTransliterationType(val as any);
        }
      });
      AsyncStorage.getItem("islamic_hikmah:quran_reading_mode").then((val) => {
        if (val === "default" || val === "sepia" || val === "dark") {
          setReadingMode(val as any);
          setIsNightMode(val === "dark");
        }
      });
      AsyncStorage.getItem("islamic_hikmah:quran_font_size").then((val) => {
        if (val) {
          setFontSize(Number(val));
        }
      });
      AsyncStorage.getItem("islamic_hikmah:quran_translation_lang").then((val) => {
        if (val) {
          setQuranTransLang(val);
        } else {
          setQuranTransLang(language);
        }
      });
      AsyncStorage.getItem("islamic_hikmah:mushaf_layout").then((val) => {
        if (val === "default" || val === "qpc_v4") {
          setMushafLayout(val);
        }
      });
    }
  }, [isFocused, language]);

  useEffect(() => {
    AsyncStorage.getItem("islamic_hikmah:quran_translation_lang").then((val) => {
      if (!val) {
        setQuranTransLang(language);
      }
    });
  }, [language]);

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
    let nextMode: "default" | "sepia" | "dark" = "default";
    if (readingMode === "default") nextMode = "sepia";
    else if (readingMode === "sepia") nextMode = "dark";
    else nextMode = "default";

    setReadingMode(nextMode);
    setIsNightMode(nextMode === "dark");
    await AsyncStorage.setItem("islamic_hikmah:quran_reading_mode", nextMode);
    await AsyncStorage.setItem("islamic_hikmah:read_night_mode", String(nextMode === "dark"));
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

  const renderPage = useCallback(({ item }: { item: number }) => {
    const rc = READING_COLORS[readingMode];
    return (
      <View 
        style={{ 
          width,
          backgroundColor: rc.mushafBg,
          paddingHorizontal: 20,
          paddingVertical: 24,
          borderBottomWidth: 1,
          borderBottomColor: rc.border,
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 11, color: colors.brand, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
          PAGE {item}
        </Text>
        <QuranPageItem
          item={item}
          colors={colors}
          zoomScale={zoomScale}
          playingAyah={playingAyah}
          onTapAyah={onTapAyah}
          onLongPressAyah={onLongPressAyah}
          bookmarkedVerses={bookmarkedVerses}
          fontType={fontType}
          transliterationType={transliterationType}
          fontSize={fontSize}
          readingMode={readingMode}
          mushafLayout={mushafLayout}
          quranElements={quranElements}
        />
      </View>
    );
  }, [colors, zoomScale, playingAyah, bookmarkedVerses, fontType, onTapAyah, onLongPressAyah, transliterationType, fontSize, readingMode, mushafLayout, quranElements]);

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

  const rc = READING_COLORS[readingMode];

  return (
    <View style={[styles.container, { backgroundColor: rc.bg }]}>
      {/* Reading progress bar */}
      <View style={{ height: 3, backgroundColor: rc.border, width: "100%" }}>
        <View style={{ height: 3, backgroundColor: "#C5A880", width: `${pageScrollPct}%` }} />
      </View>


      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: rc.border, backgroundColor: rc.headerBg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={rc.icon} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.title, { color: rc.text }]}>
            Medina Mushaf - Page {currentPage}
          </Text>
          <Text style={{ fontSize: 10, color: "#C5A880", fontWeight: "700", marginTop: 1 }}>
            {pageScrollPct}% read
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => {
            setJumpPageInput(String(currentPage));
            setJumpModalVisible(true);
          }} hitSlop={10}>
            <MaterialCommunityIcons name="magnify" size={24} color={rc.icon} />
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={rc.icon} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={rc.icon} />
          </Pressable>
        </View>
      </View>
 
      {/* Page swiper / Tafsir view switcher */}
      {activeViewMode === "tafsir" ? (
        <ScrollView style={{ flex: 1, padding: 16 }} showsVerticalScrollIndicator={false}>
          {(() => {
            const pageMap = PAGE_MAPPING.find((p) => p.page === currentPage);
            if (!pageMap) return <Text style={{ color: rc.text, textAlign: "center" }}>Page mapping not found.</Text>;
            
            return pageMap.ayahs.map((m, idx) => {
              const surah = QURAN.find((s) => s.number === m.surah);
              const ayah = surah?.ayahs.find((a) => a.numberInSurah === m.ayah);
              const isPlaying = playingAyah?.surah === m.surah && playingAyah?.ayah === m.ayah;

              const key = `${m.surah}:${m.ayah}`;
              let highQualityText = "";
              if (transliterationType === "syllables") {
                highQualityText = (transliterationSyllablesData as Record<string, string>)[key] || ayah?.transliteration || "";
              } else if (transliterationType === "wbw") {
                const words: string[] = [];
                let wordIdx = 1;
                while (true) {
                  const wordKey = `${m.surah}:${m.ayah}:${wordIdx}`;
                  const wordVal = (transliterationWbwData as Record<string, string>)[wordKey];
                  if (!wordVal) break;
                  words.push(wordVal);
                  wordIdx++;
                }
                highQualityText = words.length > 0 ? words.join(" ") : (ayah?.transliteration || "");
              } else {
                highQualityText = (transliterationTajweedData as Record<string, string>)[key] || ayah?.transliteration || "";
              }

              return (
                <View
                  key={idx}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isPlaying ? colors.brand + "15" : rc.cardBg,
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
                        <MaterialCommunityIcons name="comment-text-outline" size={22} color={rc.icon} />
                      </Pressable>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: fontSize - 2,
                      fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                      color: rc.text,
                      textAlign: "right",
                      lineHeight: (fontSize - 2) * 1.7,
                      marginBottom: 8,
                      fontWeight: fontType === "indopak" ? "800" : "400"
                    }}
                  >
                    {ayah?.arabic}
                  </Text>
                  <Text style={{ fontSize: 13, color: rc.textMuted, fontStyle: "italic", marginBottom: 6 }}>
                    {highQualityText}
                  </Text>
                   <Text style={{ fontSize: 14, color: rc.text, lineHeight: 20 }}>
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
        borderTopColor: rc.border,
        backgroundColor: rc.headerBg
      }]}>
        <Pressable onPress={toggleNightMode} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={readingMode === "dark" ? "brightness-7" : readingMode === "sepia" ? "brightness-5" : "brightness-4"}
            size={24}
            color={readingMode === "dark" ? colors.brand : readingMode === "sepia" ? "#8B5E2A" : rc.icon}
          />
        </Pressable>

        <Pressable
          onPress={() => isPlayingContinuous ? stopContinuousPlayback() : startContinuousPlayback()}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons
            name={isPlayingContinuous ? "pause-circle" : "play-circle"}
            size={24}
            color={isPlayingContinuous ? colors.brand : rc.text}
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
            color={activeViewMode === "tafsir" ? colors.brand : rc.icon}
          />
        </Pressable>

        {/* Mushaf Layout Selector Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setLayoutModalVisible(true);
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="book-open-outline" size={24} color={rc.icon} />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/quran/personalise");
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color={rc.icon} />
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
          <View style={[styles.tafsirModalContent, { backgroundColor: rc.mushafBg, borderColor: colors.border }]}>
            <View style={styles.tafsirModalHeader}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: "row", gap: 12, alignItems: "center" }}
              >
                {availableTafsirs.map((taf) => {
                  const isActive = String(activeTafsirId) === String(taf.id);
                  return (
                    <Pressable
                      key={taf.id}
                      onPress={() => {
                        setActiveTafsirId(Number(taf.id));
                        openTafsirModal(tafsirRef.surah, tafsirRef.ayah, tafsirRef.arabic, tafsirRef.trans, Number(taf.id));
                      }}
                      style={{
                        borderBottomWidth: isActive ? 2 : 0,
                        borderBottomColor: colors.brand,
                        paddingBottom: 4,
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={[styles.tafsirModalTitle, { color: isActive ? colors.brand : colors.onSurfaceMuted, fontSize: 14 }]}>
                        {taf.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {(() => {
                const isLocal = tafsirIndexData.some(t => String(t.id) === String(activeTafsirId));
                if (!isLocal) return null;
                const isDownloaded = downloadedTafsirs[activeTafsirId];
                return (
                  <Pressable 
                    onPress={() => isDownloaded ? null : downloadTafsirOffline(activeTafsirId)} 
                    style={{ marginLeft: 12, flexDirection: "row", alignItems: "center", gap: 4 }}
                    hitSlop={10}
                  >
                    <MaterialCommunityIcons 
                      name={isDownloaded ? "cloud-check" : "cloud-download-outline"} 
                      size={20} 
                      color={isDownloaded ? colors.brand : colors.onSurfaceMuted} 
                    />
                    <Text style={{ fontSize: 11, color: isDownloaded ? colors.brand : colors.onSurfaceMuted }}>
                      {isDownloaded ? "Saved" : "Save Offline"}
                    </Text>
                  </Pressable>
                );
              })()}
              <Pressable onPress={() => setTafsirModalVisible(false)} hitSlop={10} style={{ marginLeft: 12 }}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, color: colors.brand, fontWeight: "700", marginBottom: 8 }}>
                Surah {tafsirRef.surah} · Ayah {tafsirRef.ayah}
              </Text>
              <Text style={{ fontFamily: "AmiriBold", fontSize: 22, color: rc.text, textAlign: "right", marginBottom: 12, lineHeight: 36 }}>
                {tafsirRef.arabic}
              </Text>
              <Text style={{ fontSize: 14, color: rc.textMuted, marginBottom: 16, lineHeight: 22 }}>
                {tafsirRef.trans}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

              {tafsirLoading ? (
                <ActivityIndicator color={colors.brand} style={{ marginVertical: 32 }} />
              ) : (
                <Text style={{ fontSize: 14, color: rc.text, lineHeight: 22, textAlign: "justify" }}>
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

      {/* Mushaf Layout Selector Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={layoutModalVisible}
        onRequestClose={() => setLayoutModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLayoutModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, width: width * 0.85 }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface, marginBottom: 4 }]}>Mushaf Layout</Text>
            <Text style={{ fontSize: 13, color: colors.onSurfaceMuted, marginBottom: 16 }}>
              Select your preferred page display style:
            </Text>

            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setMushafLayout("default");
                await AsyncStorage.setItem("islamic_hikmah:mushaf_layout", "default");
                setLayoutModalVisible(false);
              }}
              style={{
                padding: 14,
                borderRadius: 8,
                backgroundColor: mushafLayout === "default" ? colors.brand + "15" : colors.surface,
                borderWidth: 1,
                borderColor: mushafLayout === "default" ? colors.brand : colors.border,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={24}
                color={mushafLayout === "default" ? colors.brand : colors.onSurfaceMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.onSurface }}>
                  Medina Mushaf (Standard)
                </Text>
                <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>
                  Centered continuous paragraph page view
                </Text>
              </View>
              {mushafLayout === "default" && (
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />
              )}
            </Pressable>

            <Pressable
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setMushafLayout("qpc_v4");
                await AsyncStorage.setItem("islamic_hikmah:mushaf_layout", "qpc_v4");
                setLayoutModalVisible(false);
              }}
              style={{
                padding: 14,
                borderRadius: 8,
                backgroundColor: mushafLayout === "qpc_v4" ? colors.brand + "15" : colors.surface,
                borderWidth: 1,
                borderColor: mushafLayout === "qpc_v4" ? colors.brand : colors.border,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <MaterialCommunityIcons
                name="format-list-numbered-rtl"
                size={24}
                color={mushafLayout === "qpc_v4" ? colors.brand : colors.onSurfaceMuted}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.onSurface }}>
                  KFGQPC V4 (15-Lines)
                </Text>
                <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>
                  Authentic line-by-line page print (1441H)
                </Text>
              </View>
              {mushafLayout === "qpc_v4" && (
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />
              )}
            </Pressable>

            <Pressable
              onPress={() => setLayoutModalVisible(false)}
              style={[styles.modalBtn, { backgroundColor: colors.surface, width: "100%", alignSelf: "center" }]}
            >
              <Text style={[styles.modalBtnTxt, { color: colors.onSurfaceMuted }]}>Close</Text>
            </Pressable>
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
