import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, Modal, ActivityIndicator,
  Platform, Alert, TextInput, Share, FlatList, Switch
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as FileSystem from "expo-file-system";
import quranData from "@/src/data/quran/quranData.json";
import pageMappingData from "@/src/data/quran/pageMapping.json";
import { JUZ_DATA } from "@/src/data/juzData";
import { SURAH_LIST, SurahMeta } from "@/src/data/surahList";
import surahInfoDetailed from "@/src/data/quran/surahInfoDetailed.json";
import transliterationWbw from "@/src/data/quran/transliterationWbw.json";
import naqaaReciters from "@/src/data/quran/naqaaReciters.json";
import {
  addQuranBookmark, removeQuranBookmark, getQuranBookmarks, QuranBookmark,
} from "@/src/storage";
import { getTajweedColor, parseTajweedText } from "@/src/utils/parseTajweed";

// ─── Types ───────────────────────────────────────────────────────────────────
type LocalAyah = { numberInSurah: number; arabic: string; translation: string; transliteration: string };
type LocalSurah = { number: number; name: string; englishName: string; arabicName: string; type: string; totalAyahs: number; ayahs: LocalAyah[] };
type MappedAyah = { surah: number; ayah: number };
type PageMap = { page: number; ayahs: MappedAyah[] };
type WbwWord = { position: number; text_uthmani: string; translation: { text: string }; transliteration: { text: string }; char_type_name: string };
type TafsirSource = { id: number; name: string; author_name: string; slug: string; language_name: string };
type ApiReciter = {
  id: number;
  reciter_name: string;
  style: string | null;
  translated_name: { name: string };
  audio_type?: "ayah" | "chapter";
  url_type?: "api" | "everyayah" | "quranicaudio" | "naqaastudio";
  path?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const QURAN: LocalSurah[] = quranData as LocalSurah[];
const PAGE_MAPPING: PageMap[] = pageMappingData as PageMap[];
const TOTAL_PAGES = 604;
const WBW_DATA: Record<string, string> = transliterationWbw as any;

// Build surah→first page lookup once
const SURAH_FIRST_PAGE: Record<number, number> = {};
PAGE_MAPPING.forEach(p => {
  p.ayahs.forEach(a => {
    if (!SURAH_FIRST_PAGE[a.surah]) SURAH_FIRST_PAGE[a.surah] = p.page;
  });
});

// ─── Fallback reciters (if API fails) ────────────────────────────────────────
const FALLBACK_RECITERS: ApiReciter[] = [
  {
    id: 601,
    reciter_name: "Sheikh Noreen Mohammed Siddiq",
    style: "ad-Doori an Abi Amr",
    translated_name: { name: "Sheikh Noreen Mohammed Siddiq" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "norain",
  },
  {
    id: 602,
    reciter_name: "Sheikh Abd El, Rashid Sufi",
    style: "Murattal",
    translated_name: { name: "Sheikh Abd El, Rashid Sufi" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "soufi",
  },
  {
    id: 603,
    reciter_name: "Sheikh Abd El, Halim Hussein",
    style: "Murattal",
    translated_name: { name: "Sheikh Abd El, Halim Hussein" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "abd_alhalim",
  },
  {
    id: 604,
    reciter_name: "Sheikh Mohammed Nour Al , Islam",
    style: "Murattal",
    translated_name: { name: "Sheikh Mohammed Nour Al , Islam" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "noralislam",
  },
  {
    id: 605,
    reciter_name: "Sheikh Abdulrahman Nour al-Islam",
    style: "Murattal",
    translated_name: { name: "Sheikh Abdulrahman Nour al-Islam" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "mushaf-abdu",
  },
  {
    id: 606,
    reciter_name: "Sheikh Mohamed Othman",
    style: "Murattal",
    translated_name: { name: "Sheikh Mohamed Othman" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "sh-moh-osman",
  },
  {
    id: 607,
    reciter_name: "Sheikh Mohammed Abdulkarim",
    style: "Murattal",
    translated_name: { name: "Sheikh Mohammed Abdulkarim" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "mushaf_moha",
  },
  {
    id: 608,
    reciter_name: "Sheikh Asaad Abdulkarim Al-Sheikh",
    style: "Murattal",
    translated_name: { name: "Sheikh Asaad Abdulkarim Al-Sheikh" },
    audio_type: "chapter",
    url_type: "naqaastudio",
    path: "mushaf_asad",
  },
  {
    id: 7,
    reciter_name: "Mishari Rashid al-`Afasy",
    style: "Murattal",
    translated_name: { name: "Mishari Rashid al-`Afasy" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Alafasy_128kbps",
  },
  {
    id: 2,
    reciter_name: "AbdulBaset AbdulSamad",
    style: "Murattal",
    translated_name: { name: "AbdulBaset AbdulSamad" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Abdul_Basit_Murattal_64kbps",
  },
  {
    id: 1,
    reciter_name: "AbdulBaset AbdulSamad",
    style: "Mujawwad",
    translated_name: { name: "AbdulBaset AbdulSamad" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Abdul_Basit_Mujawwad_128kbps",
  },
  {
    id: 158,
    reciter_name: "Abdullah Ali Jabir - beta",
    style: "Murattal",
    translated_name: { name: "Abdullah Ali Jabir - beta" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Ali_Jaber_64kbps",
  },
  {
    id: 201,
    reciter_name: "Abdullah Hamad Abu Sharida - beta",
    style: "Murattal",
    translated_name: { name: "Abdullah Hamad Abu Sharida - beta" },
    audio_type: "chapter",
    url_type: "quranicaudio",
    path: "https://download.quranicaudio.com/quran/makkah_1434/",
  },
  {
    id: 3,
    reciter_name: "Abdur-Rahman as-Sudais",
    style: "Murattal",
    translated_name: { name: "Abdur-Rahman as-Sudais" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Abdurrahmaan_As-Sudais_192kbps",
  },
  {
    id: 4,
    reciter_name: "Abu Bakr al-Shatri",
    style: "Murattal",
    translated_name: { name: "Abu Bakr al-Shatri" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Abu_Bakr_Ash-Shaatree_128kbps",
  },
  {
    id: 19,
    reciter_name: "Ahmed ibn Ali al-Ajmy - beta",
    style: "Murattal",
    translated_name: { name: "Ahmed ibn Ali al-Ajmy - beta" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "ahmed_ibn_ali_al_ajamy_128kbps",
  },
  {
    id: 117,
    reciter_name: "Bandar Baleela - beta",
    style: "Murattal",
    translated_name: { name: "Bandar Baleela - beta" },
    audio_type: "chapter",
    url_type: "quranicaudio",
    path: "https://download.quranicaudio.com/quran/bandar_baleela/",
  },
  {
    id: 5,
    reciter_name: "Hani ar-Rifai",
    style: "Murattal",
    translated_name: { name: "Hani ar-Rifai" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Hani_Rifai_192kbps",
  },
  {
    id: 161,
    reciter_name: "Khalifah Al Tunaiji",
    style: "Murattal",
    translated_name: { name: "Khalifah Al Tunaiji" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "khalefa_al_tunaiji_64kbps",
  },
  {
    id: 1002,
    reciter_name: "Maher al-Muaiqly - beta",
    style: "Murattal",
    translated_name: { name: "Maher al-Muaiqly - beta" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "MaherAlMuaiqly128kbps",
  },
  {
    id: 12,
    reciter_name: "Mahmoud Khalil Al-Husary",
    style: "Muallim",
    translated_name: { name: "Mahmoud Khalil Al-Husary" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Husary_Muallim_128kbps",
  },
  {
    id: 6,
    reciter_name: "Mahmoud Khalil Al-Husary",
    style: "Murattal",
    translated_name: { name: "Mahmoud Khalil Al-Husary" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Husary_128kbps",
  },
  {
    id: 168,
    reciter_name: "Mohamed Siddiq al-Minshawi",
    style: "Kids repeat",
    translated_name: { name: "Mohamed Siddiq al-Minshawi" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Minshawy_Teacher_128kbps",
  },
  {
    id: 9,
    reciter_name: "Mohamed Siddiq al-Minshawi",
    style: "Murattal",
    translated_name: { name: "Mohamed Siddiq al-Minshawi" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Minshawy_Murattal_128kbps",
  },
  {
    id: 1003,
    reciter_name: "Saad al-Ghamdi",
    style: "Murattal",
    translated_name: { name: "Saad al-Ghamdi" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Ghamadi_40kbps",
  },
  {
    id: 10,
    reciter_name: "Sa`ud ash-Shuraym",
    style: "Murattal",
    translated_name: { name: "Sa`ud ash-Shuraym" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Saood_ash-Shuraym_128kbps",
  },
  {
    id: 174,
    reciter_name: "Yasser Ad Dussary - beta",
    style: "Murattal",
    translated_name: { name: "Yasser Ad Dussary - beta" },
    audio_type: "ayah",
    url_type: "everyayah",
    path: "Yasser_Ad-Dussary_128kbps",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function QuranPageReader() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const { page } = useLocalSearchParams<{ page: string }>();
  const currentPageNum = Math.max(1, Math.min(TOTAL_PAGES, parseInt(page || "1", 10)));
  const scrollRef = useRef<ScrollView>(null);

  // ─── Core UI State ─────────────────────────────────────────────────────────
  const [readingMode, setReadingMode] = useState<"arabic" | "verseByVerse" | "translation">("arabic");
  
  // Font scale sizes mapped dynamically (Quran.com style scales 1-10)
  const [fontSizeArabicScale, setFontSizeArabicScale] = useState(4); // Default level 4
  const [fontSizeTransScale, setFontSizeTransScale] = useState(3);   // Default level 3
  const [fontSizeWbw, setFontSizeWbw] = useState(12);

  // Dynamic font sizes computed from scales
  const fontSizeArabic = useMemo(() => 16 + fontSizeArabicScale * 2, [fontSizeArabicScale]);
  const fontSizeTrans = useMemo(() => 10 + fontSizeTransScale * 1.5, [fontSizeTransScale]);

  // ─── Quran.com settings options (Screenshot settings incorporated) ───────
  const [quranScript, setQuranScript] = useState<"uthmani" | "indopak" | "tajweed">("uthmani");
  const [tajweedTexts, setTajweedTexts] = useState<Record<string, string>>({});
  const [fontStyle, setFontStyle] = useState<"King Fahad Complex" | "Madani" | "IndoPak">("King Fahad Complex");
  const [copyAsGlyphs, setCopyAsGlyphs] = useState(false);
  const [showFontStyleDropdown, setShowFontStyleDropdown] = useState(false);

  // ─── Surah Selector (Feature 1) ───────────────────────────────────────────
  const [showSurahSelector, setShowSurahSelector] = useState(false);
  const [surahSearchQuery, setSurahSearchQuery] = useState("");

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"arabic" | "translation" | "wbw">("arabic");
  const [showInfo, setShowInfo] = useState<LocalSurah | null>(null);
  const [apiSurahInfo, setApiSurahInfo] = useState<{ short_text: string; text: string; source: string } | null>(null);
  const [infoTab, setInfoTab] = useState<"ibn_ashur" | "maududi">("ibn_ashur");

  // Verse focus modal (Image 4)
  const [focusedVerse, setFocusedVerse] = useState<any | null>(null);
  const [focusedVerseTab, setFocusedVerseTab] = useState<"tafsirs" | "hadith" | "reflections" | "qiraat" | "lessons" | "answers">("tafsirs");
  const [focusedTafsirText, setFocusedTafsirText] = useState("");
  const [focusedTafsirLoading, setFocusedTafsirLoading] = useState(false);

  // Swipe Gestures
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);

  // ─── Tafsir (Feature 3) ───────────────────────────────────────────────────
  const [showTafsir, setShowTafsir] = useState<{ surah: number; ayah: number } | null>(null);
  const [tafsirSources, setTafsirSources] = useState<TafsirSource[]>([]);
  const [selectedTafsirId, setSelectedTafsirId] = useState(169); // Ibn Kathir default
  const [tafsirText, setTafsirText] = useState("");
  const [tafsirLoading, setTafsirLoading] = useState(false);

  // ─── Word-by-Word (Feature 4) ─────────────────────────────────────────────
  const [wbwEnabled, setWbwEnabled] = useState(false);
  const [wbwDisplayMode, setWbwDisplayMode] = useState<"both" | "transliteration" | "translation">("both");
  const [wbwData, setWbwData] = useState<Record<string, WbwWord[]>>({});
  const [wbwLoading, setWbwLoading] = useState(false);
  const [showWbwDropdown, setShowWbwDropdown] = useState(false);

  // Word-by-word interaction settings (Image 3)
  const [wbwOnClick, setWbwOnClick] = useState<"recitation" | "none">("recitation");
  const [wbwShowTranslitBelow, setWbwShowTranslitBelow] = useState(true);
  const [wbwShowTransBelow, setWbwShowTransBelow] = useState(true);

  // ─── Bookmarks (Feature 7) ────────────────────────────────────────────────
  const [isPageBookmarked, setIsPageBookmarked] = useState(false);
  const [verseBookmarks, setVerseBookmarks] = useState<Set<string>>(new Set());

  // ─── Audio Player ─────────────────────────────────────────────────────────
  const [showPlayer, setShowPlayer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<{ surah: number; ayah: number; absolute: number } | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playMode, setPlayMode] = useState<"surah" | "verse">("verse");
  const [repeatCount, setRepeatCount] = useState(0);
  const [loopSurah, setLoopSurah] = useState(false);
  const [highlightActive, setHighlightActive] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const remainingRepeats = useRef(0);

  // ─── Reciters (Feature 6) ─────────────────────────────────────────────────
  const [allReciters, setAllReciters] = useState<ApiReciter[]>(FALLBACK_RECITERS);
  const [selectedReciter, setSelectedReciter] = useState<ApiReciter>(FALLBACK_RECITERS[0]);
  const [audioUrlCache, setAudioUrlCache] = useState<Record<string, string>>({});

  // ─── Options Menu ─────────────────────────────────────────────────────────
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<"none" | "repeat" | "experience" | "speed" | "reciter">("none");
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  // ─── Translations ─────────────────────────────────────────────────────────
  const [showTranslationsList, setShowTranslationsList] = useState(false);
  const [showTranslationsDropdown, setShowTranslationsDropdown] = useState(false);
  const [allTranslations, setAllTranslations] = useState<any[]>([]);
  const [selectedTranslationId, setSelectedTranslationId] = useState<number>(131); // Single active translation
  const [translationTexts, setTranslationTexts] = useState<Record<string, Record<number, string>>>({});
  const [searchTransQuery, setSearchTransQuery] = useState("");
  const [showFootnotes, setShowFootnotes] = useState(true);

  // ─── Verse Overflow Menu & Features (Screenshot 4) ────────────────────────
  const [overflowVerse, setOverflowVerse] = useState<{ surah: number; ayah: number } | null>(null);
  
  const [showCompareModal, setShowCompareModal] = useState<{ surah: number; ayah: number } | null>(null);
  const [compareData, setCompareData] = useState<any[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);

  const [showAdvancedCopy, setShowAdvancedCopy] = useState<{ surah: number; ayah: number } | null>(null);
  const [copyOptions, setCopyOptions] = useState({
    arabic: true,
    translation: true,
    transliteration: true,
    reference: true,
  });

  const [showFeedbackModal, setShowFeedbackModal] = useState<{ surah: number; ayah: number } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const [showEmbedModal, setShowEmbedModal] = useState<{ surah: number; ayah: number } | null>(null);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  // ─── Data: Page Verses ─────────────────────────────────────────────────────
  const getAbsoluteAyahNumber = (surahNum: number, ayahNum: number) => {
    let count = 0;
    for (let i = 1; i < surahNum; i++) count += QURAN[i - 1].ayahs.length;
    return count + ayahNum;
  };

  const pageVerses = useMemo(() => {
    const mapping = PAGE_MAPPING.find(m => m.page === currentPageNum);
    if (!mapping) return [];
    return mapping.ayahs.map(a => {
      const surah = QURAN.find(s => s.number === a.surah);
      const ayah = surah?.ayahs.find(ay => ay.numberInSurah === a.ayah);
      return {
        surahNumber: a.surah, ayahNumber: a.ayah,
        surahName: surah?.englishName || "", surahArabicName: surah?.arabicName || "",
        surahType: surah?.type || "Meccan", arabicText: ayah?.arabic || "",
        translationText: ayah?.translation || "", transliterationText: ayah?.transliteration || "",
        absoluteNumber: getAbsoluteAyahNumber(a.surah, a.ayah), surahObj: surah,
      };
    });
  }, [currentPageNum]);

  // Tajweed markup is supplied per ayah by Al Quran Cloud. Keep the plain
  // local Mushaf text as the fallback so the reader remains usable offline.
  useEffect(() => {
    if (quranScript !== "tajweed") return;

    let cancelled = false;
    const cacheKey = `islamic_hikmah:tajweed_page:${currentPageNum}`;
    AsyncStorage.getItem(cacheKey).then(cached => {
      if (!cached || cancelled) return;
      try { setTajweedTexts(JSON.parse(cached) as Record<string, string>); } catch {}
    });

    fetch(`https://api.alquran.cloud/v1/page/${currentPageNum}/quran-tajweed`)
      .then(response => {
        if (!response.ok) throw new Error(`Tajweed text request failed (${response.status})`);
        return response.json();
      })
      .then(payload => {
        if (cancelled || !Array.isArray(payload?.data?.ayahs)) return;
        const texts: Record<string, string> = {};
        payload.data.ayahs.forEach((ayah: any) => {
          const surah = ayah?.surah?.number;
          const number = ayah?.numberInSurah;
          if (surah && number && typeof ayah.text === "string") texts[`${surah}:${number}`] = ayah.text;
        });
        setTajweedTexts(texts);
        AsyncStorage.setItem(cacheKey, JSON.stringify(texts)).catch(() => {});
      })
      .catch(error => console.warn("Unable to load Tajweed markup:", error));

    return () => { cancelled = true; };
  }, [currentPageNum, quranScript]);

  const renderArabicText = (verse: { surahNumber: number; ayahNumber: number; arabicText: string }) => {
    const rawTajweedText = tajweedTexts[`${verse.surahNumber}:${verse.ayahNumber}`];
    if (quranScript !== "tajweed" || !rawTajweedText) return verse.arabicText;

    return parseTajweedText(rawTajweedText).map((segment, index) => (
      <Text key={`${index}-${segment.text}`} style={{ color: getTajweedColor(segment.rule, mode === "dark", colors.onSurface) }}>
        {segment.text}
      </Text>
    ));
  };

  const pageInfo = useMemo(() => {
    let currentJuz = 1;
    for (const juz of JUZ_DATA) {
      if (pageVerses.some(v => v.surahNumber === juz.surahNumber && v.ayahNumber >= juz.ayahNumber)) {
        currentJuz = juz.juz;
      }
    }
    return { juz: currentJuz, hizb: Math.ceil(currentJuz * 4) };
  }, [pageVerses]);

  // Current surah on this page (for header display)
  const currentSurah = useMemo(() => {
    if (pageVerses.length === 0) return null;
    return SURAH_LIST.find(s => s.number === pageVerses[0].surahNumber) || null;
  }, [pageVerses]);

  // Load dynamic reciters from everyayah.com
  useEffect(() => {
    const loadReciters = async () => {
      try {
        const response = await fetch("https://everyayah.com/data/recitations.js");
        const text = await response.text();
        const data = JSON.parse(text.trim());
        
        const dynamicList: ApiReciter[] = [];
        Object.keys(data).forEach((key) => {
          if (key === "ayahCount") return;
          const item = data[key];
          dynamicList.push({
            id: Number(key) + 2000,
            reciter_name: item.name,
            style: item.name.toLowerCase().includes("mujawwad") ? "Mujawwad" : "Murattal",
            translated_name: { name: item.name },
            audio_type: "ayah",
            url_type: "everyayah",
            path: item.subfolder
          });
        });
        
        if (dynamicList.length > 0) {
          const chapterFallbacks = FALLBACK_RECITERS.filter(r => r.audio_type === "chapter");
          setAllReciters([...dynamicList, ...chapterFallbacks]);

          const savedRecVal = await AsyncStorage.getItem("quran_selected_reciter_v2");
          if (savedRecVal) {
            const savedRec = JSON.parse(savedRecVal);
            const found = dynamicList.find(r => r.reciter_name === savedRec.reciter_name && r.style === savedRec.style);
            if (found) setSelectedReciter(found);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch dynamic reciters, using fallback list:", e);
      }
    };
    loadReciters();
  }, []);

  // ─── Init: Load settings + bookmarks ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const bms = await AsyncStorage.getItem("islamic_hikmah:bookmarked_pages");
        if (bms) setIsPageBookmarked((JSON.parse(bms) as number[]).includes(currentPageNum));

        const fsaScale = await AsyncStorage.getItem("quran_font_size_arabic_scale");
        if (fsaScale) setFontSizeArabicScale(parseInt(fsaScale));
        const fstScale = await AsyncStorage.getItem("quran_font_size_trans_scale");
        if (fstScale) setFontSizeTransScale(parseInt(fstScale));

        const scriptVal = await AsyncStorage.getItem("quran_script");
        if (scriptVal) setQuranScript(scriptVal as any);
        const fStyleVal = await AsyncStorage.getItem("quran_font_style");
        if (fStyleVal) setFontStyle(fStyleVal as any);
        const glyphsVal = await AsyncStorage.getItem("quran_copy_glyphs");
        if (glyphsVal) setCopyAsGlyphs(glyphsVal === "true");

        const mode = await AsyncStorage.getItem("quran_reading_mode_pref");
        if (mode) setReadingMode(mode as any);

        const rec = await AsyncStorage.getItem("quran_selected_reciter_v2");
        if (rec) setSelectedReciter(JSON.parse(rec));

        const spd = await AsyncStorage.getItem("quran_playback_speed");
        if (spd) setPlaybackSpeed(parseFloat(spd));

        const transId = await AsyncStorage.getItem("quran_selected_translation_id");
        if (transId) setSelectedTranslationId(parseInt(transId, 10));

        const wbw = await AsyncStorage.getItem("quran_wbw_enabled");
        if (wbw) setWbwEnabled(wbw === "true");
        const wbwMode = await AsyncStorage.getItem("quran_wbw_display");
        if (wbwMode) setWbwDisplayMode(wbwMode as any);

        const wbwClickVal = await AsyncStorage.getItem("quran_wbw_on_click");
        if (wbwClickVal) setWbwOnClick(wbwClickVal as any);
        const wbwTranslitBelow = await AsyncStorage.getItem("quran_wbw_show_translit_below");
        if (wbwTranslitBelow) setWbwShowTranslitBelow(wbwTranslitBelow === "true");
        const wbwTransBelow = await AsyncStorage.getItem("quran_wbw_show_trans_below");
        if (wbwTransBelow) setWbwShowTransBelow(wbwTransBelow === "true");

        const tid = await AsyncStorage.getItem("quran_selected_tafsir");
        if (tid) setSelectedTafsirId(parseInt(tid));

        // Load per-verse bookmarks for current page
        const allBm = await getQuranBookmarks();
        const bset = new Set<string>();
        allBm.forEach(b => bset.add(`${b.surahNumber}:${b.ayahNumber}`));
        setVerseBookmarks(bset);

        await AsyncStorage.setItem("islamic_hikmah:last_read_page", String(currentPageNum));
      } catch (e) { console.warn("Settings load failed:", e); }
    })();
  }, [currentPageNum]);

  // ─── Fetch: Translations list, Tafsir sources, Reciters ───────────────────
  useEffect(() => {
    // Translations
    fetch("https://api.quran.com/api/v4/resources/translations")
      .then(r => r.json()).then(d => { if (d.translations) setAllTranslations(d.translations); })
      .catch(() => {});

    // Tafsir sources
    fetch("https://api.quran.com/api/v4/resources/tafsirs")
      .then(r => r.json()).then(d => { if (d.tafsirs) setTafsirSources(d.tafsirs); })
      .catch(() => {});

    // Reciters
    fetch("https://api.quran.com/api/v4/resources/recitations")
      .then(r => r.json()).then(d => {
        if (d.recitations) {
          const merged = [...FALLBACK_RECITERS];
          d.recitations.forEach((apiRec: any) => {
            const exists = merged.some(
              r => r.reciter_name.toLowerCase() === apiRec.reciter_name.toLowerCase() &&
                   (r.style || "murattal").toLowerCase() === (apiRec.style || "murattal").toLowerCase()
            );
            if (!exists) {
              merged.push({
                id: apiRec.id,
                reciter_name: apiRec.reciter_name,
                style: apiRec.style || "Murattal",
                translated_name: apiRec.translated_name || { name: apiRec.reciter_name },
                audio_type: "ayah",
                url_type: "api",
                path: String(apiRec.id),
              });
            }
          });
          setAllReciters(merged);
        }
      })
      .catch(() => {});
  }, []);

  // ─── Fetch: Translation texts for current page ────────────────────────────
  useEffect(() => {
    const fetchTrans = async () => {
      if (selectedTranslationId === 131 || pageVerses.length === 0) return;
      try {
        const updated: Record<string, Record<number, string>> = { ...translationTexts };
        const id = selectedTranslationId;
        const uniqueSurahs = Array.from(new Set(pageVerses.map(v => v.surahNumber)));
        for (const sId of uniqueSurahs) {
          const ck = `cached_trans_${id}_surah_${sId}`;
          let list: any[] = [];
          const cached = await AsyncStorage.getItem(ck);
          if (cached) { list = JSON.parse(cached); }
          else {
            const r = await fetch(`https://api.quran.com/api/v4/quran/translations/${id}?chapter_number=${sId}`);
            const d = await r.json();
            list = d.translations || [];
            if (list.length > 0) await AsyncStorage.setItem(ck, JSON.stringify(list));
          }
          list.forEach((t: any, index: number) => {
            const ayahNum = index + 1;
            const key = `${sId}-${ayahNum}`;
            if (!updated[key]) updated[key] = {};
            updated[key][id] = t.text;
          });
        }
        setTranslationTexts(updated);
      } catch (e) { console.warn("Trans fetch failed:", e); }
    };
    fetchTrans();
  }, [currentPageNum, selectedTranslationId]);

  // ─── Fetch: WBW data when enabled ─────────────────────────────────────────
  useEffect(() => {
    if (!wbwEnabled || pageVerses.length === 0) return;
    const fetchWbw = async () => {
      setWbwLoading(true);
      try {
        const uniqueSurahs = Array.from(new Set(pageVerses.map(v => v.surahNumber)));
        const newData: Record<string, WbwWord[]> = { ...wbwData };
        for (const sId of uniqueSurahs) {
          const ck = `cached_wbw_surah_${sId}`;
          let verses: any[] = [];
          const cached = await AsyncStorage.getItem(ck);
          if (cached) { verses = JSON.parse(cached); }
          else {
            // Fetch all verses with words for this chapter (paginated)
            let allVerses: any[] = [];
            let pg = 1; let totalPg = 1;
            while (pg <= totalPg) {
              const r = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${sId}?language=en&words=true&word_fields=text_uthmani&per_page=50&page=${pg}`);
              const d = await r.json();
              allVerses = allVerses.concat(d.verses || []);
              if (d.pagination) totalPg = d.pagination.total_pages;
              pg++;
            }
            verses = allVerses;
            if (verses.length > 0) await AsyncStorage.setItem(ck, JSON.stringify(verses));
          }
          verses.forEach((v: any) => {
            if (v.words) newData[v.verse_key] = v.words;
          });
        }
        setWbwData(newData);
      } catch (e) { console.warn("WBW fetch failed:", e); }
      finally { setWbwLoading(false); }
    };
    fetchWbw();
  }, [wbwEnabled, currentPageNum]);

  // ─── Fetch: Tafsir text when modal opens or source changes ────────────────
  useEffect(() => {
    if (!showTafsir) return;
    const fetchTafsir = async () => {
      setTafsirLoading(true);
      try {
        const r = await fetch(`https://api.quran.com/api/v4/tafsirs/${selectedTafsirId}/by_ayah/${showTafsir.surah}:${showTafsir.ayah}`);
        const d = await r.json();
        setTafsirText(d.tafsir?.text?.replace(/<[^>]*>/g, "") || "No tafsir available for this verse.");
      } catch { setTafsirText("Could not load tafsir. Check your internet connection."); }
      finally { setTafsirLoading(false); }
    };
    fetchTafsir();
  }, [showTafsir, selectedTafsirId]);

  // ─── Parse HTML with formatting to React elements (Image-3 style bold headers) ───
  const parseHtmlToReact = (html: string) => {
    if (!html) return null;

    let processed = html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'")
      .replace(/&amp;/g, "&");

    const parts = processed.split(/(<\/?[a-zA-Z0-9]+[^>]*>)/g);
    let isHeading = false;
    let isStrong = false;
    let isItalic = false;
    const segments: { text: string; bold: boolean; italic: boolean; heading: boolean }[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      const token = parts[i];
      if (!token) continue;
      
      if (token.startsWith("<") && token.endsWith(">")) {
        const lowerToken = token.toLowerCase();
        if (lowerToken.startsWith("<h") && !lowerToken.startsWith("</")) {
          isHeading = true;
        } else if (lowerToken.startsWith("</h")) {
          isHeading = false;
        } else if (lowerToken === "<strong>" || lowerToken === "<b>") {
          isStrong = true;
        } else if (lowerToken === "</strong>" || lowerToken === "</b>") {
          isStrong = false;
        } else if (lowerToken === "<em>" || lowerToken === "<i>") {
          isItalic = true;
        } else if (lowerToken === "</em>" || lowerToken === "</i>") {
          isItalic = false;
        } else if (lowerToken === "<p>") {
          // Paragraph start
        } else if (lowerToken === "</p>") {
          segments.push({ text: "\n\n", bold: false, italic: false, heading: false });
        } else if (lowerToken === "<li>") {
          segments.push({ text: "  • ", bold: true, italic: false, heading: false });
        } else if (lowerToken === "</li>") {
          segments.push({ text: "\n", bold: false, italic: false, heading: false });
        }
      } else {
        const decoded = token
          .replace(/&ndash;/g, "—")
          .replace(/&mdash;/g, "—")
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"');
        
        segments.push({
          text: decoded,
          bold: isStrong,
          italic: isItalic,
          heading: isHeading
        });
      }
    }
    
    return (
      <Text style={{ lineHeight: 22 }}>
        {segments.map((seg, idx) => {
          const textStyles: any[] = [];
          if (seg.heading) {
            textStyles.push({ fontSize: 16, fontWeight: "800", color: colors.onSurface, marginTop: 12, marginBottom: 6 });
          } else {
            textStyles.push({ fontSize: 14, color: colors.onSurfaceSecondary });
          }
          if (seg.bold) {
            textStyles.push({ fontWeight: "700" });
          }
          if (seg.italic) {
            textStyles.push({ fontStyle: "italic" });
          }
          
          return (
            <Text key={idx} style={textStyles}>
              {seg.text}
            </Text>
          );
        })}
      </Text>
    );
  };

  // ─── Fetch Tafsir for Focused Verse Modal ───
  const fetchFocusedTafsir = useCallback((surah: number, ayah: number, tafsirId: number) => {
    setFocusedTafsirLoading(true);
    setFocusedTafsirText("");
    fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}`)
      .then(r => r.json())
      .then(d => {
        if (d.tafsir && d.tafsir.text) {
          setFocusedTafsirText(d.tafsir.text);
        } else {
          setFocusedTafsirText("Tafsir not available for this verse.");
        }
      })
      .catch(() => {
        setFocusedTafsirText("Error loading Tafsir. Please check network connection.");
      })
      .finally(() => {
        setFocusedTafsirLoading(false);
      });
  }, []);

  useEffect(() => {
    if (focusedVerse && focusedVerseTab === "tafsirs") {
      fetchFocusedTafsir(focusedVerse.surahNumber, focusedVerse.ayahNumber, selectedTafsirId);
    }
  }, [focusedVerse, focusedVerseTab, selectedTafsirId, fetchFocusedTafsir]);

  // Helper to dynamically build audio URLs for each reciter type
  const getReciterAudioUrl = (rec: ApiReciter, surah: number, ayah: number, absolute: number) => {
    const surahPad = String(surah).padStart(3, "0");
    const ayahPad = String(ayah).padStart(3, "0");
    const filePad = `${surahPad}${ayahPad}`;

    if (rec.url_type === "everyayah") {
      return `https://everyayah.com/data/${rec.path}/${filePad}.mp3`;
    } else if (rec.url_type === "quranicaudio") {
      return `${rec.path}${surahPad}.mp3`;
    } else if (rec.url_type === "naqaastudio" && rec.path) {
      const reciterKey = rec.path;
      const reciterMap = (naqaaReciters as any)[reciterKey];
      if (reciterMap && reciterMap[surah]) {
        return reciterMap[surah];
      }
      return "";
    } else {
      const codes: Record<number, string> = {
        1: "ar.abdulsamad",
        2: "ar.abdulbasitmurattal",
        3: "ar.abdurrahmaansudais",
        4: "ar.shaatree",
        5: "ar.hanirifai",
        6: "ar.husary",
        7: "ar.alafasy",
        9: "ar.minshawi",
        10: "ar.saoodshuraym",
        12: "ar.husarymuallim",
        168: "ar.minshawimualim",
      };
      const reciterCode = codes[rec.id] || "ar.alafasy";
      const lowBitrateReciters = ["ar.abdulbasitmurattal", "ar.abdurrahmaansudais", "ar.abdulsamad", "ar.husarymujawwad", "ar.minshawimujawwad", "ar.saoodshuraym"];
      const kbps = lowBitrateReciters.includes(reciterCode) ? "64" : "128";
      return `https://cdn.islamic.network/quran/audio/${kbps}/${reciterCode}/${absolute}.mp3`;
    }
  };

  // Modular helper to play verse audio check offline Cache
  const playVerseAudio = async (surah: number, ayah: number, absolute: number) => {
    let localUri = "";
    if (selectedReciter.audio_type === "chapter") {
      localUri = `${(FileSystem as any).documentDirectory}chapter_${selectedReciter.id}_${surah}.mp3`;
    } else {
      localUri = `${(FileSystem as any).documentDirectory}everyayah_${selectedReciter.id}_${surah}_${ayah}.mp3`;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        player.replace({ uri: localUri });
      } else {
        const url = getReciterAudioUrl(selectedReciter, surah, ayah, absolute);
        player.replace({ uri: url });
      }
    } catch {
      const url = getReciterAudioUrl(selectedReciter, surah, ayah, absolute);
      player.replace({ uri: url });
    }
    
    try {
      (player as any).playbackRate = playbackSpeed;
      (player as any).muted = isMuted;
    } catch {}
    player.play();
  };

  // ─── Audio Playback ────────────────────────────────────────────────────────
  const handlePlayAyah = (surah: number, ayah: number, absolute: number) => {
    Haptics.selectionAsync().catch(() => {});
    setShowPlayer(true);
    if (playingAyah?.absolute === absolute) {
      if (player.playing) {
        player.pause();
      } else {
        player.play();
      }
      return;
    }
    setPlayingAyah({ surah, ayah, absolute });
    remainingRepeats.current = repeatCount;
    playVerseAudio(surah, ayah, absolute);
  };

  const handlePlaySurah = (surah: number, ayah: number, absolute: number) => {
    setPlayMode("surah"); handlePlayAyah(surah, ayah, absolute);
  };
  const handlePlaySingle = (surah: number, ayah: number, absolute: number) => {
    setPlayMode("verse"); handlePlayAyah(surah, ayah, absolute);
  };

  const handleNextAyah = () => {
    Haptics.selectionAsync().catch(() => {});
    if (!playingAyah) return;
    const idx = pageVerses.findIndex(v => v.absoluteNumber === playingAyah.absolute);
    if (idx !== -1 && idx < pageVerses.length - 1) {
      const n = pageVerses[idx + 1];
      handlePlayAyah(n.surahNumber, n.ayahNumber, n.absoluteNumber);
    } else {
      if (loopSurah) {
        const firstV = pageVerses[0];
        handlePlayAyah(firstV.surahNumber, firstV.ayahNumber, firstV.absoluteNumber);
      } else if (currentPageNum < TOTAL_PAGES) {
        router.replace(`/quran/read/${currentPageNum + 1}`);
      } else {
        player.pause();
        setPlayingAyah(null);
      }
    }
  };

  const handlePrevAyah = () => {
    Haptics.selectionAsync().catch(() => {});
    if (!playingAyah) return;
    const idx = pageVerses.findIndex(v => v.absoluteNumber === playingAyah.absolute);
    if (idx > 0) {
      const p = pageVerses[idx - 1];
      handlePlayAyah(p.surahNumber, p.ayahNumber, p.absoluteNumber);
    } else if (currentPageNum > 1) {
      router.replace(`/quran/read/${currentPageNum - 1}`);
    }
  };

  // Auto-advance / stop on verse end (respecting repeat settings)
  const [lastTriggered, setLastTriggered] = useState<number | null>(null);
  useEffect(() => {
    if (playingAyah && status.duration > 0 && status.currentTime >= status.duration - 0.5) {
      if (lastTriggered === playingAyah.absolute && Math.abs(status.currentTime - status.duration) > 1.0) {
        return; 
      }
      setLastTriggered(playingAyah.absolute);

      if (remainingRepeats.current > 0) {
        remainingRepeats.current -= 1;
        playVerseAudio(playingAyah.surah, playingAyah.ayah, playingAyah.absolute);
      } else {
        remainingRepeats.current = repeatCount;
        if (playMode === "surah") {
          handleNextAyah();
        } else {
          player.pause();
          setPlayingAyah(null);
        }
      }
    }
  }, [status.currentTime, status.duration, playingAyah, playMode, repeatCount]);

  // ─── Page / Verse Bookmarks ────────────────────────────────────────────────
  const togglePageBookmark = async () => {
    Haptics.selectionAsync().catch(() => {});
    const bms = await AsyncStorage.getItem("islamic_hikmah:bookmarked_pages");
    let list: number[] = bms ? JSON.parse(bms) : [];
    if (list.includes(currentPageNum)) { list = list.filter(p => p !== currentPageNum); setIsPageBookmarked(false); }
    else { list.push(currentPageNum); setIsPageBookmarked(true); }
    await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(list));
  };

  const toggleVerseBookmark = async (surah: number, ayah: number, surahName: string) => {
    Haptics.selectionAsync().catch(() => {});
    const key = `${surah}:${ayah}`;
    const newSet = new Set(verseBookmarks);
    if (newSet.has(key)) {
      await removeQuranBookmark(surah, ayah);
      newSet.delete(key);
    } else {
      await addQuranBookmark({ surahNumber: surah, surahName, ayahNumber: ayah });
      newSet.add(key);
    }
    setVerseBookmarks(newSet);
  };

  // ─── Copy / Share (Feature 2) ─────────────────────────────────────────────
  const handleCopyVerse = async (arabic: string, translation: string, ref: string) => {
    Haptics.selectionAsync().catch(() => {});
    const text = `${arabic}\n\n${translation}\n\n— ${ref}`;
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Verse copied to clipboard");
  };

  const handleShareVerse = async (arabic: string, translation: string, ref: string) => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({ message: `${arabic}\n\n${translation}\n\n— ${ref} (Islamic Hikmah App)` });
    } catch {}
  };

  // ─── Advanced Copy Exec ──────────────────────────────────────────────────
  const executeAdvancedCopy = async (verse: any) => {
    let copyText = "";
    if (copyOptions.arabic) {
      copyText += `${verse.arabicText}\n\n`;
    }
    if (copyOptions.transliteration) {
      copyText += `${verse.transliterationText}\n\n`;
    }
    if (copyOptions.translation) {
      copyText += `${verse.translationText}\n\n`;
    }
    if (copyOptions.reference) {
      copyText += `— Surah Al-${verse.surahName} ${verse.surahNumber}:${verse.ayahNumber}`;
    }
    copyText = copyText.trim();
    await Clipboard.setStringAsync(copyText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert("Success", "Copied selection to clipboard!");
    setShowAdvancedCopy(null);
  };

  // ─── Fetch Compare Translations ──────────────────────────────────────────
  const triggerCompareVerse = (surah: number, ayah: number) => {
    setShowCompareModal({ surah, ayah });
    setCompareLoading(true);
    fetch(`https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?translations=131,22,85,20,95`)
      .then(r => r.json())
      .then(d => {
        setCompareData(d.verse?.translations || []);
      })
      .catch(() => {
        setCompareData([]);
      })
      .finally(() => {
        setCompareLoading(false);
      });
  };

  // ─── Translation toggling ─────────────────────────────────────────────────
  const handleToggleTranslation = async (id: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedTranslationId(id);
    await AsyncStorage.setItem("quran_selected_translation_id", String(id));
    setShowTranslationsList(false); // Single selection closes modal
  };

  // ─── Reciter selection ────────────────────────────────────────────────────
  const selectReciter = async (rec: ApiReciter) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedReciter(rec);
    await AsyncStorage.setItem("quran_selected_reciter_v2", JSON.stringify(rec));
    setActiveSubMenu("none"); setShowOptionsMenu(false);
    if (playingAyah) {
      const url = getReciterAudioUrl(rec, playingAyah.surah, playingAyah.ayah, playingAyah.absolute);
      player.replace({ uri: url }); player.play();
    }
  };

  const selectSpeed = async (speed: number) => {
    Haptics.selectionAsync().catch(() => {});
    setPlaybackSpeed(speed);
    await AsyncStorage.setItem("quran_playback_speed", String(speed));
    try { (player as any).playbackRate = speed; } catch {}
    setActiveSubMenu("none"); setShowOptionsMenu(false);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const cleanHtml = (html: string) => {
    if (!html) return "";
    return html.replace(/<h[1-6][^>]*>/gi, "\n\n").replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<p[^>]*>/gi, "\n\n").replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "").replace(/\n\s*\n/g, "\n\n").trim();
  };

  const groupedTranslations = useMemo(() => {
    const list = allTranslations.filter(t => {
      const q = searchTransQuery.toLowerCase();
      return t.name?.toLowerCase().includes(q) || t.language_name?.toLowerCase().includes(q);
    });
    const groups: Record<string, any[]> = {};
    list.forEach(t => {
      const lang = (t.language_name || "other").charAt(0).toUpperCase() + (t.language_name || "other").slice(1);
      if (!groups[lang]) groups[lang] = [];
      groups[lang].push(t);
    });
    return groups;
  }, [allTranslations, searchTransQuery]);

  // Grouped reciters by style
  const groupedReciters = useMemo(() => {
    const groups: Record<string, ApiReciter[]> = {};
    allReciters.forEach(r => {
      const style = r.style || "Other";
      if (!groups[style]) groups[style] = [];
      groups[style].push(r);
    });
    return groups;
  }, [allReciters]);

  // Surah search filter
  const filteredSurahs = useMemo(() => {
    if (!surahSearchQuery.trim()) return SURAH_LIST;
    const q = surahSearchQuery.toLowerCase();
    return SURAH_LIST.filter(s =>
      s.englishName.toLowerCase().includes(q) || s.name.includes(surahSearchQuery) ||
      String(s.number).includes(q) || s.englishNameTranslation.toLowerCase().includes(q)
    );
  }, [surahSearchQuery]);

  // English tafsir sources only
  const englishTafsirs = useMemo(() => {
    const main = tafsirSources.filter(t => t.language_name === "english");
    return main.length > 0 ? main : [{ id: 169, name: "Tafsir Ibn Kathir", author_name: "Ibn Kathir", slug: "en-tafisr-ibn-kathir", language_name: "english" }];
  }, [tafsirSources]);

  // Progress bar fraction
  const progressFraction = status.duration > 0 ? status.currentTime / status.duration : 0;

  // Download logic
  const handleDownloadSurah = async () => {
    if (pageVerses.length === 0) return;
    setDownloading(true);
    setShowOptionsMenu(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      if (selectedReciter.audio_type === "chapter") {
        const surahNum = pageVerses[0].surahNumber;
        const surahName = pageVerses[0].surahName;
        setDownloadProgress(`Downloading Surah Al-${surahName} recitation...`);
        
        const url = getReciterAudioUrl(selectedReciter, surahNum, 1, 1);
        const filename = `chapter_${selectedReciter.id}_${surahNum}.mp3`;
        const localUri = `${(FileSystem as any).documentDirectory}${filename}`;
        
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (!fileInfo.exists) {
          await FileSystem.downloadAsync(url, localUri);
        }
        
        Alert.alert("Success", `Surah Al-${surahName} recitation successfully cached for offline use.`);
      } else {
        const total = pageVerses.length;
        let count = 0;
        
        for (const v of pageVerses) {
          count++;
          setDownloadProgress(`Downloading verse ${count} of ${total}...`);
          
          const url = getReciterAudioUrl(selectedReciter, v.surahNumber, v.ayahNumber, v.absoluteNumber);
          const filename = `everyayah_${selectedReciter.id}_${v.surahNumber}_${v.ayahNumber}.mp3`;
          const localUri = `${(FileSystem as any).documentDirectory}${filename}`;
          
          const fileInfo = await FileSystem.getInfoAsync(localUri);
          if (!fileInfo.exists) {
            await FileSystem.downloadAsync(url, localUri);
          }
        }
        
        Alert.alert("Success", `Recitation for this page successfully cached for offline use.`);
      }
    } catch (err) {
      console.error("Download failed:", err);
      Alert.alert("Download Failed", "Failed to cache audio offline. Check network connection.");
    } finally {
      setDownloading(false);
      setDownloadProgress("");
    }
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handlePrevPage = () => { if (currentPageNum > 1) router.replace(`/quran/read/${currentPageNum - 1}`); };
  const handleNextPage = () => { if (currentPageNum < TOTAL_PAGES) router.replace(`/quran/read/${currentPageNum + 1}`); };

  // Swipe Navigation
  const handleTouchStart = (e: any) => {
    setTouchStartX(e.nativeEvent.pageX);
    setTouchStartY(e.nativeEvent.pageY);
  };

  const handleTouchEnd = (e: any) => {
    const dx = e.nativeEvent.pageX - touchStartX;
    const dy = e.nativeEvent.pageY - touchStartY;

    if (Math.abs(dx) > 70 && Math.abs(dy) < 40) {
      if (dx < 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
  };

  // Helper for lookup active verse coordinates
  const activeVerseData = useMemo(() => {
    if (!overflowVerse) return null;
    return pageVerses.find(v => v.surahNumber === overflowVerse.surah && v.ayahNumber === overflowVerse.ayah);
  }, [overflowVerse, pageVerses]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>

      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>

        {/* Surah Name + Dropdown */}
        <Pressable onPress={() => { setShowSurahSelector(true); setSurahSearchQuery(""); }} style={styles.surahSelectorBtn}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {currentSurah ? `${currentSurah.number}. ${currentSurah.englishName}` : `Page ${currentPageNum}`}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color={colors.onSurfaceMuted} />
        </Pressable>

        <View style={headerStyle.headerActions}>
          <Pressable onPress={togglePageBookmark} hitSlop={10}>
            <MaterialCommunityIcons name={isPageBookmarked ? "bookmark" : "bookmark-outline"} size={24} color={isPageBookmarked ? colors.brand : colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => { setShowSettings(true); setSettingsTab("arabic"); }} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Page/Juz/Hizb sub-bar */}
      <View style={[styles.locationBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.locationText, { color: colors.onSurfaceMuted }]}>
          📄 Page {currentPageNum}  ·  Juz {pageInfo.juz}  /  Hizb {pageInfo.hizb}
        </Text>
      </View>

      {/* ─── Mode Toggle Pills ──────────────────────────────────────────────── */}
      <View style={[styles.modeSelectorRow, { borderBottomColor: colors.border }]}>
        {(["verseByVerse", "arabic", "translation"] as const).map(m => (
          <Pressable key={m} onPress={() => { setReadingMode(m); AsyncStorage.setItem("quran_reading_mode_pref", m); }}
            style={[styles.modeBtn, readingMode === m && { backgroundColor: colors.brand + "18", borderColor: colors.brand }]}>
            <Text style={[styles.modeBtnText, { color: readingMode === m ? colors.brand : colors.onSurfaceMuted, fontWeight: readingMode === m ? "700" : "500" }]}>
              {m === "verseByVerse" ? "Verse by Verse" : m === "arabic" ? "Arabic" : "Translation"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ─── Main Scroll Content with horizontal swipe gestures ────────────────── */}
      <View style={{ flex: 1 }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Surah Header Card (Image 2 style) */}
        {pageVerses.filter(v => v.ayahNumber === 1).map(verse => (
          <View key={`card-${verse.surahNumber}`} style={[styles.surahCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.cardLayoutRow}>
              
              {/* Left Column: Surah Title */}
              <View style={styles.cardLeftCol}>
                <View style={styles.cardTitleWithIcon}>
                  <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.brand} />
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                    {verse.surahNumber}. Al-{verse.surahName}
                  </Text>
                </View>
                <Text style={[styles.cardSubtitle, { color: colors.onSurfaceMuted }]}>
                  {SURAH_LIST.find(s => s.number === verse.surahNumber)?.englishNameTranslation || ""}
                </Text>
              </View>

              {/* Right Column: Actions (Listen, Info, Translation Dropdown) */}
              <View style={styles.cardRightCol}>
                <View style={styles.cardTopActions}>
                  <Pressable onPress={() => handlePlaySurah(verse.surahNumber, 1, verse.absoluteNumber)} style={[styles.pillBtn, { backgroundColor: colors.brand }]}>
                    <MaterialCommunityIcons name="play" size={16} color="#fff" />
                    <Text style={styles.pillBtnText}>Listen</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowInfo(verse.surahObj || null)} style={[styles.pillBtnOutline, { borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.onSurface} />
                    <Text style={[styles.pillBtnOutlineText, { color: colors.onSurface }]}>Info</Text>
                  </Pressable>
                </View>

                {/* Dropdown Pill Button */}
                <Pressable onPress={() => setShowTranslationsDropdown(!showTranslationsDropdown)}
                  style={[styles.transPillBtnInsideCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.transPillBtnTextInsideCard, { color: colors.onSurface }]}>
                    Translation: {allTranslations.find(t => t.id === selectedTranslationId)?.name?.substring(0, 16) || "Dr. Mustafa Khattab"}...
                  </Text>
                  <MaterialCommunityIcons name={showTranslationsDropdown ? "chevron-up" : "chevron-down"} size={16} color={colors.onSurface} />
                </Pressable>
              </View>

            </View>

            {/* Dropdown menu box rendered in a transparent Modal to prevent overlapping and cropping issues */}
            {showTranslationsDropdown && (
              <Modal visible transparent animationType="fade" onRequestClose={() => setShowTranslationsDropdown(false)}>
                <Pressable style={styles.modalBackdropDismiss} onPress={() => setShowTranslationsDropdown(false)}>
                  <Pressable style={[styles.dialogPopupBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
                    <Text style={[styles.dropdownLabel, { color: colors.onSurfaceMuted, marginBottom: 12 }]}>
                      Select translation:
                    </Text>
                    {[selectedTranslationId].map(tId => {
                      const author = allTranslations.find(t => t.id === tId);
                      const label = author ? author.name : "Dr. Mustafa Khattab";
                      return (
                        <Pressable key={tId} onPress={() => { setShowTranslationsDropdown(false); }}
                          style={styles.dropdownMenuItemRow}>
                          <Text style={[styles.dropdownItemText, { color: colors.brand, fontWeight: "700", flex: 1, marginRight: 8 }]}>
                            {label}
                          </Text>
                          <MaterialCommunityIcons name="check" size={18} color={colors.brand} />
                        </Pressable>
                      );
                    })}
                    <Pressable onPress={() => { setShowTranslationsDropdown(false); setShowTranslationsList(true); }}
                      style={[styles.selectTransBtn, { borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
                      <MaterialCommunityIcons name="cog-outline" size={18} color={colors.brand} />
                      <Text style={[styles.selectTransBtnText, { color: colors.brand }]}>Select Translations</Text>
                    </Pressable>
                  </Pressable>
                </Pressable>
              </Modal>
            )}

          </View>
        ))}

        {/* Bismillah */}
        {pageVerses.some(v => v.ayahNumber === 1 && v.surahNumber !== 9) && (
          <View style={styles.bismillahBox}>
            <Text style={[styles.bismillahAr, { color: colors.onSurface }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
            <Text style={[styles.bismillahEn, { color: colors.onSurfaceMuted }]}>In the Name of Allah—the Most Compassionate, Most Merciful</Text>
          </View>
        )}

        {/* ═══ Arabic Reading Mode ═══ */}
        {readingMode === "arabic" && (
          <View style={styles.arabicFlowBox}>
            <Text style={[styles.arabicFlowText, { fontSize: fontSizeArabic, lineHeight: fontSizeArabic * 1.8, color: colors.onSurface, textAlign: "right" }]}>
              {pageVerses.map(verse => {
                const isHighlighted = playingAyah?.absolute === verse.absoluteNumber && highlightActive;
                const cleaned = verse.ayahNumber === 1 && verse.surahNumber !== 1 && verse.surahNumber !== 9
                  ? verse.arabicText.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰনِ ٱلرَّحِيمِ|بِسْمِ اللَّهِ الرَّحْمَٰনِ الرَّحِيمِ)/, "") : verse.arabicText;
                return (
                  <Text key={verse.absoluteNumber} onPress={() => handlePlaySingle(verse.surahNumber, verse.ayahNumber, verse.absoluteNumber)}
                    style={isHighlighted ? { color: colors.brand, backgroundColor: colors.brand + "15" } : {}}>
                    {quranScript === "tajweed" ? renderArabicText(verse) : cleaned}{" "}
                    <Text style={[styles.ayahMarker, { color: colors.brand }]}>﴿{verse.ayahNumber}﴾ </Text>
                  </Text>
                );
              })}
            </Text>
            <Text style={[styles.pageNum, { color: colors.onSurfaceMuted }]}>{currentPageNum}</Text>
          </View>
        )}

        {/* ═══ Verse-by-Verse Mode ═══ */}
        {readingMode === "verseByVerse" && (
          <View style={{ gap: 0 }}>
            {pageVerses.map(verse => {
              const isPlaying = playingAyah?.absolute === verse.absoluteNumber;
              const vKey = `${verse.surahNumber}-${verse.ayahNumber}`;
              const isBm = verseBookmarks.has(`${verse.surahNumber}:${verse.ayahNumber}`);
              const wbwWords = wbwData[`${verse.surahNumber}:${verse.ayahNumber}`] || [];

              return (
                <View key={verse.absoluteNumber}
                  style={[styles.verseCard, { borderBottomColor: colors.border },
                    isPlaying && highlightActive && { backgroundColor: colors.brand + "08" }]}>

                  {/* Header Row */}
                  <View style={styles.verseHeaderRow}>
                    <View style={styles.verseHeaderLeft}>
                      <View style={[styles.verseBadge, { backgroundColor: colors.brand + "15" }]}>
                        <Text style={[styles.verseBadgeText, { color: colors.brand }]}>{verse.surahNumber}:{verse.ayahNumber}</Text>
                      </View>
                      <Pressable onPress={() => handlePlaySingle(verse.surahNumber, verse.ayahNumber, verse.absoluteNumber)}>
                        <MaterialCommunityIcons name={isPlaying && status.playing ? "pause-circle" : "play-circle-outline"} size={24} color={colors.brand} />
                      </Pressable>
                      <Pressable onPress={() => toggleVerseBookmark(verse.surahNumber, verse.ayahNumber, verse.surahName)}>
                        <MaterialCommunityIcons name={isBm ? "bookmark" : "bookmark-outline"} size={22} color={isBm ? colors.brand : colors.onSurfaceMuted} />
                      </Pressable>
                    </View>
                    <View style={styles.verseHeaderRight}>
                      <Pressable onPress={() => handleCopyVerse(verse.arabicText, verse.translationText, `${verse.surahNumber}:${verse.ayahNumber}`)}>
                        <MaterialCommunityIcons name="content-copy" size={20} color={colors.onSurfaceMuted} />
                      </Pressable>
                      <Pressable onPress={() => handleShareVerse(verse.arabicText, verse.translationText, `Quran ${verse.surahNumber}:${verse.ayahNumber}`)}>
                        <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.onSurfaceMuted} />
                      </Pressable>
                      <Pressable onPress={() => setOverflowVerse({ surah: verse.surahNumber, ayah: verse.ayahNumber })}>
                        <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.onSurfaceMuted} />
                      </Pressable>
                    </View>
                  </View>

                  {/* Arabic Text (or WBW grid if enabled) */}
                  {wbwEnabled && wbwWords.length > 0 ? (
                    <View style={styles.wbwGrid}>
                      {wbwWords.filter(w => w.char_type_name === "word").map((w, i) => (
                        <Pressable key={i} onPress={() => {
                          if (wbwOnClick === "recitation") {
                            Haptics.selectionAsync().catch(() => {});
                            const padS = String(verse.surahNumber).padStart(3, "0");
                            const padA = String(verse.ayahNumber).padStart(3, "0");
                            const padW = String(w.position).padStart(3, "0");
                            const wordUrl = `https://audio.qurancdn.com/wbw/${padS}_${padA}_${padW}.mp3`;
                            player.replace({ uri: wordUrl });
                            player.play();
                          }
                        }} style={[styles.wbwWordBox, { borderColor: colors.border }]}>
                          <Text style={[styles.wbwArabic, { fontSize: fontSizeArabic - 4, color: colors.onSurface }]}>{w.text_uthmani}</Text>
                          {wbwShowTranslitBelow && (
                            <Text style={[styles.wbwTranslit, { fontSize: fontSizeWbw, color: colors.brand }]}>
                              {w.transliteration?.text || WBW_DATA[`${verse.surahNumber}:${verse.ayahNumber}:${w.position}`] || ""}
                            </Text>
                          )}
                          {wbwShowTransBelow && (
                            <Text style={[styles.wbwMeaning, { fontSize: fontSizeWbw, color: colors.onSurfaceMuted }]}>{w.translation?.text || ""}</Text>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  ) : (
                    <Text style={[styles.arabicVbV, { fontSize: fontSizeArabic, color: colors.onSurface }]}>{renderArabicText(verse)}</Text>
                  )}

                  {/* Transliteration */}
                  <Text style={[styles.translitVbV, { fontSize: fontSizeTrans, color: colors.brand }]}>{verse.transliterationText}</Text>

                  {/* Single Translation */}
                  {/* Single Translation (Long press triggers Focus Modal) */}
                  <Pressable
                    onLongPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                      setFocusedVerse(verse);
                      setFocusedVerseTab("tafsirs");
                    }}
                    style={{ gap: 6, marginTop: 4 }}
                  >
                    <Text style={[styles.transAuthorLabel, { color: colors.brand }]}>
                      {(allTranslations.find(t => t.id === selectedTranslationId)?.name || "Translation").toUpperCase()}:
                    </Text>
                    <Text style={[styles.transVbV, { fontSize: fontSizeTrans, color: colors.onSurfaceSecondary }]}>
                      {selectedTranslationId === 131 ? verse.translationText : (translationTexts[vKey]?.[selectedTranslationId] || "Loading...")}
                    </Text>
                  </Pressable>

                  {/* Secondary Actions Row */}
                  <View style={[styles.secondaryRow, { borderTopColor: colors.border }]}>
                    <Pressable onPress={() => setShowTafsir({ surah: verse.surahNumber, ayah: verse.ayahNumber })} style={styles.secondaryBtn}>
                      <MaterialCommunityIcons name="book-open-outline" size={16} color={colors.onSurfaceMuted} />
                      <Text style={[styles.secondaryBtnText, { color: colors.onSurfaceMuted }]}>Tafsirs</Text>
                    </Pressable>
                    <Text style={{ color: colors.border }}>|</Text>
                    <Pressable onPress={() => { setWbwEnabled(!wbwEnabled); AsyncStorage.setItem("quran_wbw_enabled", String(!wbwEnabled)); }} style={styles.secondaryBtn}>
                      <MaterialCommunityIcons name="format-letter-matches" size={16} color={wbwEnabled ? colors.brand : colors.onSurfaceMuted} />
                      <Text style={[styles.secondaryBtnText, { color: wbwEnabled ? colors.brand : colors.onSurfaceMuted }]}>Word by Word</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ═══ Translation Mode ═══ */}
        {readingMode === "translation" && (
          <View style={{ gap: 16 }}>
            {pageVerses.map(verse => (
              <Pressable
                key={verse.absoluteNumber}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  setFocusedVerse(verse);
                  setFocusedVerseTab("tafsirs");
                }}
                style={[styles.verseCard, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.verseBadgeText, { color: colors.brand, marginBottom: 6 }]}>{verse.surahNumber}:{verse.ayahNumber}</Text>
                <Text style={[styles.transVbV, { fontSize: fontSizeTrans + 2, color: colors.onSurface, fontWeight: "500" }]}>{verse.translationText}</Text>
                <Text style={[styles.arabicRef, { color: colors.onSurfaceMuted }]}>{verse.arabicText.substring(0, 40)}...</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>

      {/* ─── Pagination Footer ──────────────────────────────────────────────── */}
      {!showPlayer && (
        <View style={[styles.paginationBar, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <Pressable onPress={handlePrevPage} disabled={currentPageNum === 1} style={[styles.pageNavBtn, currentPageNum === 1 && { opacity: 0.3 }]}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.onSurface} />
            <Text style={[styles.pageNavBtnText, { color: colors.onSurface }]}>Previous</Text>
          </Pressable>
          <Text style={[styles.pageIndicator, { color: colors.onSurface }]}>Page {currentPageNum} / {TOTAL_PAGES}</Text>
          <Pressable onPress={handleNextPage} disabled={currentPageNum === TOTAL_PAGES} style={[styles.pageNavBtn, currentPageNum === TOTAL_PAGES && { opacity: 0.3 }]}>
            <Text style={[styles.pageNavBtnText, { color: colors.onSurface }]}>Next</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      )}

      {/* ─── Audio Player Bar ─────────────────────── */}
      {showPlayer && (
        <View style={[styles.playerBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.brand, width: `${progressFraction * 100}%` as any }]} />
          </View>
          <View style={styles.playerBarContent}>
            <Pressable onPress={() => { setShowOptionsMenu(true); setActiveSubMenu("none"); }} style={styles.playerIcon}>
              <MaterialCommunityIcons name="dots-horizontal" size={26} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => { setIsMuted(!isMuted); try { player.muted = !isMuted; } catch {} }} style={styles.playerIcon}>
              <MaterialCommunityIcons name={isMuted ? "volume-off" : "volume-high"} size={24} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={handlePrevAyah} style={styles.playerIcon}>
              <MaterialCommunityIcons name="skip-previous" size={28} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => { status.playing ? player.pause() : player.play(); }} style={[styles.playBtn, { backgroundColor: colors.brand }]}>
              <MaterialCommunityIcons name={status.playing ? "pause" : "play"} size={24} color="#fff" />
            </Pressable>
            <Pressable onPress={handleNextAyah} style={styles.playerIcon}>
              <MaterialCommunityIcons name="skip-next" size={28} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => { player.pause(); setShowPlayer(false); setPlayingAyah(null); }} style={styles.playerIcon}>
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ MODALS ═══════════════════════════════════════════════════════════ */}

      {/* ─── Surah Selector Modal ───────────────────────────────────────────── */}
      <Modal visible={showSurahSelector} animationType="slide" transparent={false} onRequestClose={() => setShowSurahSelector(false)}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top", "bottom"]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowSurahSelector(false)} hitSlop={10}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Select Surah</Text>
            <Pressable onPress={() => setShowSurahSelector(false)} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.onSurfaceMuted} />
            <TextInput placeholder="Search Surahs..." placeholderTextColor={colors.onSurfaceMuted} value={surahSearchQuery}
              onChangeText={setSurahSearchQuery} style={[styles.searchInput, { color: colors.onSurface }]} />
          </View>
          <FlatList data={filteredSurahs} keyExtractor={i => String(i.number)}
            renderItem={({ item }) => (
              <Pressable onPress={() => { setShowSurahSelector(false); const pg = SURAH_FIRST_PAGE[item.number]; if (pg) router.replace(`/quran/read/${pg}`); }}
                style={[styles.surahRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.surahNumCircle, { backgroundColor: colors.brand + "15" }]}>
                  <Text style={[styles.surahNumText, { color: colors.brand }]}>{item.number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.surahRowName, { color: colors.onSurface }]}>{item.englishName}</Text>
                  <Text style={[styles.surahRowMeta, { color: colors.onSurfaceMuted }]}>{item.englishNameTranslation} · {item.numberOfAyahs} Ayahs · {item.revelationType}</Text>
                </View>
                <Text style={[styles.surahRowArabic, { color: colors.onSurface }]}>{item.name}</Text>
              </Pressable>
            )} />
        </SafeAreaView>
      </Modal>

      {/* ─── Translations List Modal ────────────────────────────────────────── */}
      <Modal visible={showTranslationsList} animationType="slide" transparent={false} onRequestClose={() => setShowTranslationsList(false)}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top", "bottom"]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowTranslationsList(false)} hitSlop={10} style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
              <Text style={[styles.headerTitle, { color: colors.onSurface, marginLeft: 8 }]}>Translations</Text>
            </Pressable>
            <Pressable onPress={() => setShowTranslationsList(false)} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.onSurfaceMuted} />
            <TextInput placeholder="Search Translations" placeholderTextColor={colors.onSurfaceMuted} value={searchTransQuery}
              onChangeText={setSearchTransQuery} style={[styles.searchInput, { color: colors.onSurface }]} />
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
            {Object.keys(groupedTranslations).sort().map(lang => (
              <View key={lang} style={{ marginTop: 16 }}>
                <Text style={[styles.langGroupHeader, { color: colors.brand }]}>{lang}</Text>
                {groupedTranslations[lang].map(trans => {
                  const isChecked = selectedTranslationId === trans.id;
                  return (
                    <Pressable key={trans.id} onPress={() => handleToggleTranslation(trans.id)} style={[styles.transRow, { borderBottomColor: colors.border }]}>
                      <MaterialCommunityIcons name={isChecked ? "radiobox-marked" : "radiobox-blank"} size={22} color={isChecked ? colors.brand : colors.onSurfaceMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.transRowName, { color: colors.onSurface }]}>{trans.name}</Text>
                        <Text style={[styles.transRowAuthor, { color: colors.onSurfaceMuted }]}>Author: {trans.author_name}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ─── Settings Drawer (Quran.com style settings panels incorporated) ── */}
      <Modal visible={showSettings} animationType="slide" transparent onRequestClose={() => setShowSettings(false)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Settings</Text>
              <Pressable onPress={() => setShowSettings(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>

            {/* Tab Selector */}
            <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
              {(["arabic", "translation", "wbw"] as const).map(tab => (
                <Pressable key={tab} onPress={() => setSettingsTab(tab)}
                  style={[styles.tabBtn, settingsTab === tab && { borderBottomColor: colors.brand, borderBottomWidth: 2 }]}>
                  <Text style={[styles.tabBtnText, { color: settingsTab === tab ? colors.brand : colors.onSurfaceMuted }]}>
                    {tab === "arabic" ? "Arabic" : tab === "translation" ? "Translation" : "Word By Word"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ padding: 16 }}>
              {/* Arabic Tab (Image 1) */}
              {settingsTab === "arabic" && (
                <View>
                  {/* Preview Box */}
                  <View style={[styles.previewBox, { borderColor: colors.border }]}>
                    <Text style={{ fontSize: 10, alignSelf: "flex-start", color: colors.onSurfaceMuted, marginBottom: 4 }}>Preview:</Text>
                    <Text style={[styles.previewArabic, { fontSize: fontSizeArabic, color: colors.onSurface }]}>بِسْمِ اللَّهِ الرَّحْمَٰনِ الرَّহِيمِ</Text>
                    <Text style={[styles.previewTrans, { fontSize: fontSizeTrans, color: colors.onSurfaceMuted }]}>In the Name of Allah — the Most Compassionate, Most Merciful</Text>
                  </View>

                  {/* Quran Script pills toggle */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface, marginTop: 8 }]}>Quran Script</Text>
                  <View style={[styles.stepperRow, { marginBottom: 16 }]}>
                    {(["uthmani", "indopak", "tajweed"] as const).map(script => (
                      <Pressable key={script} onPress={async () => { setQuranScript(script); await AsyncStorage.setItem("quran_script", script); }}
                        style={[styles.wbwModeBtn, { borderColor: colors.border, flex: 1, alignItems: "center" }, quranScript === script && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: quranScript === script ? "#fff" : colors.onSurface }}>
                          {script.charAt(0).toUpperCase() + script.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Font style dropdown selector */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Font style</Text>
                  <Pressable onPress={() => setShowFontStyleDropdown(!showFontStyleDropdown)}
                    style={[styles.reciterRow, { borderColor: colors.border, marginBottom: 16 }]}>
                    <Text style={[styles.reciterRowText, { color: colors.onSurface }]}>{fontStyle}</Text>
                    <MaterialCommunityIcons name={showFontStyleDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.onSurfaceMuted} />
                  </Pressable>
                  {showFontStyleDropdown && (
                    <View style={[styles.dropdownBoxInline, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginBottom: 16 }]}>
                      {(["King Fahad Complex", "Madani", "IndoPak"] as const).map(style => (
                        <Pressable key={style} onPress={async () => { setFontStyle(style); setShowFontStyleDropdown(false); await AsyncStorage.setItem("quran_font_style", style); }}
                          style={styles.dropdownInlineItem}>
                          <Text style={{ color: colors.onSurface, fontWeight: fontStyle === style ? "700" : "500" }}>{style}</Text>
                          {fontStyle === style && <MaterialCommunityIcons name="check" size={16} color={colors.brand} />}
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* Copy verse as glyphs toggle switch */}
                  <View style={[styles.toggleRow, { borderBottomColor: colors.border, marginBottom: 16 }]}>
                    <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>Copy verse as glyphs</Text>
                    <Switch value={copyAsGlyphs} onValueChange={async (v) => { setCopyAsGlyphs(v); await AsyncStorage.setItem("quran_copy_glyphs", String(v)); }} />
                  </View>

                  {/* Font size Scale Stepper (Image 1 style) */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Font size</Text>
                  <View style={[styles.stepperRow, { marginBottom: 16 }]}>
                    <Pressable onPress={async () => { const v = Math.max(1, fontSizeArabicScale - 1); setFontSizeArabicScale(v); await AsyncStorage.setItem("quran_font_size_arabic_scale", String(v)); }}
                      style={[styles.stepperBtn, { borderColor: colors.border }]}>
                      <MaterialCommunityIcons name="minus" size={20} color={colors.onSurface} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: colors.onSurface }]}>{fontSizeArabicScale}</Text>
                    <Pressable onPress={async () => { const v = Math.min(10, fontSizeArabicScale + 1); setFontSizeArabicScale(v); await AsyncStorage.setItem("quran_font_size_arabic_scale", String(v)); }}
                      style={[styles.stepperBtn, { borderColor: colors.border }]}>
                      <MaterialCommunityIcons name="plus" size={20} color={colors.onSurface} />
                    </Pressable>
                  </View>

                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Selected Reciter</Text>
                  <Pressable onPress={() => { setShowSettings(false); setShowOptionsMenu(true); setActiveSubMenu("reciter"); }}
                    style={[styles.reciterRow, { borderColor: colors.border }]}>
                    <Text style={[styles.reciterRowText, { color: colors.onSurface }]}>{selectedReciter.reciter_name} — {selectedReciter.style || "Murattal"}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                  </Pressable>

                  <Pressable onPress={async () => { setFontSizeArabicScale(4); setQuranScript("uthmani"); setFontStyle("King Fahad Complex"); setCopyAsGlyphs(false); await AsyncStorage.setItem("quran_font_size_arabic_scale", "4"); }}
                    style={[styles.resetBtn, { borderColor: colors.border, marginTop: 16 }]}>
                    <Text style={[styles.resetBtnText, { color: colors.onSurfaceMuted }]}>Reset</Text>
                  </Pressable>
                </View>
              )}

              {/* Translation Tab (Image 2) */}
              {settingsTab === "translation" && (
                <View>
                  {/* Preview Box */}
                  <View style={[styles.previewBox, { borderColor: colors.border, marginBottom: 16 }]}>
                    <Text style={{ fontSize: 10, alignSelf: "flex-start", color: colors.onSurfaceMuted, marginBottom: 4 }}>Preview:</Text>
                    <Text style={[styles.previewArabic, { fontSize: fontSizeArabic, color: colors.onSurface }]}>بِسْمِ اللَّهِ الرَّحْمَٰনِ الرَّহِيمِ</Text>
                    <Text style={[styles.previewTrans, { fontSize: fontSizeTrans, color: colors.onSurfaceMuted }]}>In the Name of Allah — the Most Compassionate, Most Merciful</Text>
                  </View>

                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Selected Translations</Text>
                  <Pressable onPress={() => { setShowSettings(false); setShowTranslationsList(true); }}
                    style={[styles.reciterRow, { borderColor: colors.border, marginBottom: 16 }]}>
                    <Text style={[styles.reciterRowText, { color: colors.brand }]}>
                      {allTranslations.find(t => t.id === selectedTranslationId)?.name || "Dr. Mustafa Khattab, The Clear Quran"}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.brand} />
                  </Pressable>

                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Font size</Text>
                  <View style={[styles.stepperRow, { marginBottom: 16 }]}>
                    <Pressable onPress={async () => { const v = Math.max(1, fontSizeTransScale - 1); setFontSizeTransScale(v); await AsyncStorage.setItem("quran_font_size_trans_scale", String(v)); }}
                      style={[styles.stepperBtn, { borderColor: colors.border }]}>
                      <MaterialCommunityIcons name="minus" size={20} color={colors.onSurface} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: colors.onSurface }]}>{fontSizeTransScale}</Text>
                    <Pressable onPress={async () => { const v = Math.min(10, fontSizeTransScale + 1); setFontSizeTransScale(v); await AsyncStorage.setItem("quran_font_size_trans_scale", String(v)); }}
                      style={[styles.stepperBtn, { borderColor: colors.border }]}>
                      <MaterialCommunityIcons name="plus" size={20} color={colors.onSurface} />
                    </Pressable>
                  </View>

                  <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>Show Footnote Markers</Text>
                    <Pressable onPress={() => setShowFootnotes(!showFootnotes)}>
                      <MaterialCommunityIcons name={showFootnotes ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={colors.brand} />
                    </Pressable>
                  </View>

                  <Pressable onPress={async () => { setFontSizeTransScale(3); setShowFootnotes(true); await AsyncStorage.setItem("quran_font_size_trans_scale", "3"); }}
                    style={[styles.resetBtn, { borderColor: colors.border, marginTop: 16 }]}>
                    <Text style={[styles.resetBtnText, { color: colors.onSurfaceMuted }]}>Reset</Text>
                  </Pressable>
                </View>
              )}

              {/* WBW Tab (Image 3) */}
              {settingsTab === "wbw" && (
                <View>
                  {/* Preview Box */}
                  <View style={[styles.previewBox, { borderColor: colors.border, marginBottom: 16 }]}>
                    <Text style={{ fontSize: 10, alignSelf: "flex-start", color: colors.onSurfaceMuted, marginBottom: 4 }}>Preview:</Text>
                    <Text style={[styles.previewArabic, { fontSize: fontSizeArabic, color: colors.onSurface }]}>بِسْمِ اللَّهِ الرَّحْمَٰনِ الرَّহِيمِ</Text>
                    <Text style={[styles.previewTrans, { fontSize: fontSizeTrans, color: colors.onSurfaceMuted }]}>In the Name of Allah — the Most Compassionate, Most Merciful</Text>
                  </View>

                  {/* Word By Word Dropdown toggle */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Word By Word</Text>
                  <Pressable onPress={() => setShowWbwDropdown(!showWbwDropdown)}
                    style={[styles.reciterRow, { borderColor: colors.border, marginBottom: 16 }]}>
                    <Text style={[styles.reciterRowText, { color: colors.onSurface }]}>
                      {!wbwEnabled ? "None" : (wbwShowTransBelow && wbwShowTranslitBelow) ? "Both" : wbwShowTransBelow ? "Translation" : "Transliteration"}
                    </Text>
                    <MaterialCommunityIcons name={showWbwDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.onSurfaceMuted} />
                  </Pressable>
                  {showWbwDropdown && (
                    <View style={[styles.dropdownBoxInline, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginBottom: 16 }]}>
                      {([["none", "None"], ["translation", "Translation"], ["transliteration", "Transliteration"], ["both", "Both"]] as const).map(([val, label]) => (
                        <Pressable key={val} onPress={async () => {
                          if (val === "none") {
                            setWbwEnabled(false);
                            await AsyncStorage.setItem("quran_wbw_enabled", "false");
                          } else {
                            setWbwEnabled(true);
                            await AsyncStorage.setItem("quran_wbw_enabled", "true");
                            if (val === "translation") {
                              setWbwShowTransBelow(true);
                              setWbwShowTranslitBelow(false);
                              await AsyncStorage.setItem("quran_wbw_show_trans_below", "true");
                              await AsyncStorage.setItem("quran_wbw_show_translit_below", "false");
                            } else if (val === "transliteration") {
                              setWbwShowTransBelow(false);
                              setWbwShowTranslitBelow(true);
                              await AsyncStorage.setItem("quran_wbw_show_trans_below", "false");
                              await AsyncStorage.setItem("quran_wbw_show_translit_below", "true");
                            } else {
                              setWbwShowTransBelow(true);
                              setWbwShowTranslitBelow(true);
                              await AsyncStorage.setItem("quran_wbw_show_trans_below", "true");
                              await AsyncStorage.setItem("quran_wbw_show_translit_below", "true");
                            }
                          }
                          setShowWbwDropdown(false);
                        }} style={styles.dropdownInlineItem}>
                          <Text style={{ color: colors.onSurface, fontWeight: "500" }}>{label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {/* On Click Option Pills */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>On Click:</Text>
                  <View style={[styles.stepperRow, { marginBottom: 16 }]}>
                    <Pressable onPress={async () => {
                      const next = wbwOnClick === "recitation" ? "none" : "recitation";
                      setWbwOnClick(next);
                      await AsyncStorage.setItem("quran_wbw_on_click", next);
                    }} style={[styles.wbwModeBtn, { borderColor: colors.border }, wbwOnClick === "recitation" && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: wbwOnClick === "recitation" ? "#fff" : colors.onSurface }}>
                        ✓ Recitation
                      </Text>
                    </Pressable>
                  </View>

                  {/* On hold/hover Option Pills */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>On hold/hover:</Text>
                  <View style={[styles.stepperRow, { marginBottom: 16 }]}>
                    <Pressable style={[styles.wbwModeBtn, { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Translation</Text>
                    </Pressable>
                    <Pressable style={[styles.wbwModeBtn, { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>Transliteration</Text>
                    </Pressable>
                  </View>

                  {/* Below word Option Pills */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Below word:</Text>
                  <View style={[styles.stepperRow, { marginBottom: 16 }]}>
                    <Pressable onPress={async () => {
                      const next = !wbwShowTransBelow;
                      setWbwShowTransBelow(next);
                      await AsyncStorage.setItem("quran_wbw_show_trans_below", String(next));
                      if (!next && !wbwShowTranslitBelow) setWbwEnabled(false);
                    }} style={[styles.wbwModeBtn, { borderColor: colors.border }, wbwShowTransBelow && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: wbwShowTransBelow ? "#fff" : colors.onSurface }}>
                        Translation
                      </Text>
                    </Pressable>
                    <Pressable onPress={async () => {
                      const next = !wbwShowTranslitBelow;
                      setWbwShowTranslitBelow(next);
                      await AsyncStorage.setItem("quran_wbw_show_translit_below", String(next));
                      if (!next && !wbwShowTransBelow) setWbwEnabled(false);
                    }} style={[styles.wbwModeBtn, { borderColor: colors.border }, wbwShowTranslitBelow && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: wbwShowTranslitBelow ? "#fff" : colors.onSurface }}>
                        Transliteration
                      </Text>
                    </Pressable>
                  </View>

                  {/* WBW Font Size */}
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>WBW Font Size</Text>
                  <View style={styles.stepperRow}>
                    <Pressable onPress={() => { const v = Math.max(9, fontSizeWbw - 1); setFontSizeWbw(v); }}
                      style={[styles.stepperBtn, { borderColor: colors.border }]}>
                      <MaterialCommunityIcons name="minus" size={20} color={colors.onSurface} />
                    </Pressable>
                    <Text style={[styles.stepperValue, { color: colors.onSurface }]}>{fontSizeWbw}</Text>
                    <Pressable onPress={() => { const v = Math.min(18, fontSizeWbw + 1); setFontSizeWbw(v); }}
                      style={[styles.stepperBtn, { borderColor: colors.border }]}>
                      <MaterialCommunityIcons name="plus" size={20} color={colors.onSurface} />
                    </Pressable>
                  </View>

                  <Pressable onPress={async () => { setWbwEnabled(false); setWbwOnClick("recitation"); setWbwShowTransBelow(true); setWbwShowTranslitBelow(true); await AsyncStorage.setItem("quran_wbw_enabled", "false"); }}
                    style={[styles.resetBtn, { borderColor: colors.border, marginTop: 16 }]}>
                    <Text style={[styles.resetBtnText, { color: colors.onSurfaceMuted }]}>Reset</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>

            <Pressable onPress={() => setShowSettings(false)} style={[styles.doneBtn, { backgroundColor: colors.brand }]}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ─── Options Menu (Audio options) ────────────────────────────────────── */}
      <Modal visible={showOptionsMenu} animationType="slide" transparent onRequestClose={() => setShowOptionsMenu(false)}>
        <View style={styles.bottomSheetOverlay}>
          <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
            {activeSubMenu === "none" && (
              <View>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Options</Text>
                  <Pressable onPress={() => setShowOptionsMenu(false)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
                </View>
                
                <Pressable onPress={handleDownloadSurah} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                  <MaterialCommunityIcons name="download" size={22} color={colors.onSurfaceSecondary} />
                  <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Download Recitation</Text>
                  {downloading && <ActivityIndicator size="small" color={colors.brand} />}
                </Pressable>

                {([["repeat", "repeat", "Manage repeat settings"], ["experience", "flash-outline", "Experience"], ["speed", "speedometer" as any, `Speed (${playbackSpeed}x)`], ["reciter", "account-outline", `Reciter (${selectedReciter.reciter_name})`]] as const).map(([key, icon, label]) => (
                  <Pressable key={key} onPress={() => setActiveSubMenu(key as any)} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                    <MaterialCommunityIcons name={icon as any} size={22} color={colors.onSurfaceSecondary} />
                    <Text style={[styles.menuItemText, { color: colors.onSurface }]}>{label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                  </Pressable>
                ))}
              </View>
            )}
            {activeSubMenu === "repeat" && (
              <View>
                <View style={styles.sheetHeader}>
                  <Pressable onPress={() => setActiveSubMenu("none")} style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.onSurface} />
                    <Text style={[styles.sheetTitle, { color: colors.onSurface, marginLeft: 4 }]}>Repeat Settings</Text>
                  </Pressable>
                </View>
                {[0, 1, 2, 3].map(r => (
                  <Pressable key={r} onPress={() => { setRepeatCount(r); remainingRepeats.current = r; setShowOptionsMenu(false); }} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.menuItemText, { color: colors.onSurface }]}>{r === 0 ? "No Repeat" : `Repeat ${r}x`}</Text>
                    {repeatCount === r && <MaterialCommunityIcons name="check" size={20} color={colors.brand} />}
                  </Pressable>
                ))}
                <Pressable onPress={() => setLoopSurah(!loopSurah)} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Loop Surah</Text>
                  <MaterialCommunityIcons name={loopSurah ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={colors.brand} />
                </Pressable>
              </View>
            )}
            {activeSubMenu === "experience" && (
              <View>
                <View style={styles.sheetHeader}>
                  <Pressable onPress={() => setActiveSubMenu("none")} style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.onSurface} />
                    <Text style={[styles.sheetTitle, { color: colors.onSurface, marginLeft: 4 }]}>Experience</Text>
                  </Pressable>
                </View>
                {([["Highlight Active Verses", highlightActive, setHighlightActive], ["Auto Scroll to Verse", autoScroll, setAutoScroll]] as const).map(([label, val, setter]: any) => (
                  <Pressable key={label} onPress={() => setter(!val)} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.menuItemText, { color: colors.onSurface }]}>{label}</Text>
                    <MaterialCommunityIcons name={val ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={colors.brand} />
                  </Pressable>
                ))}
              </View>
            )}
            {activeSubMenu === "speed" && (
              <View>
                <View style={styles.sheetHeader}>
                  <Pressable onPress={() => setActiveSubMenu("none")} style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.onSurface} />
                    <Text style={[styles.sheetTitle, { color: colors.onSurface, marginLeft: 4 }]}>Playback Speed</Text>
                  </Pressable>
                </View>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                  <Pressable key={s} onPress={() => selectSpeed(s)} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.menuItemText, { color: colors.onSurface }]}>{s === 1.0 ? "1x (Normal)" : `${s}x`}</Text>
                    {playbackSpeed === s && <MaterialCommunityIcons name="check" size={20} color={colors.brand} />}
                  </Pressable>
                ))}
              </View>
            )}
            {activeSubMenu === "reciter" && (
              <View>
                <View style={styles.sheetHeader}>
                  <Pressable onPress={() => setActiveSubMenu("none")} style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.onSurface} />
                    <Text style={[styles.sheetTitle, { color: colors.onSurface, marginLeft: 4 }]}>Select Reciter</Text>
                  </Pressable>
                </View>
                <ScrollView style={{ maxHeight: 350 }}>
                  {Object.keys(groupedReciters).sort().map(style => (
                    <View key={style}>
                      <Text style={[styles.langGroupHeader, { color: colors.brand, paddingHorizontal: 16 }]}>{style}</Text>
                      {groupedReciters[style].map(rec => (
                        <Pressable key={rec.id} onPress={() => selectReciter(rec)} style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.menuItemText, { color: colors.onSurface }]}>{rec.reciter_name}</Text>
                          {selectedReciter.id === rec.id && <MaterialCommunityIcons name="check" size={20} color={colors.brand} />}
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Surah Info Modal (Image 3 Style: Arabic calligraphy, English title, pill tabs, bold headers) ──── */}
      {showInfo && (() => {
        const infoData = (surahInfoDetailed as any)[String(showInfo.number)];
        const ibnAshurText = infoData?.ibn_ashur || "";
        const maududiText = infoData?.en || "";
        const activeText = infoTab === "ibn_ashur" ? ibnAshurText : maududiText;

        return (
          <Modal visible animationType="slide" transparent onRequestClose={() => setShowInfo(null)}>
            <View style={styles.bottomSheetOverlay}>
              <View style={[styles.bottomSheet, { backgroundColor: colors.surface, maxHeight: "90%", paddingHorizontal: 0 }]}>
                
                {/* Header */}
                <View style={[styles.sheetHeader, { paddingHorizontal: 20, marginBottom: 8 }]}>
                  <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Surah Info</Text>
                  <Pressable onPress={() => setShowInfo(null)} hitSlop={10}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                  
                  {/* Arabic Name Calligraphy / Large Font */}
                  <View style={{ alignItems: "center", marginVertical: 12 }}>
                    <Text style={{ fontSize: 36, color: colors.brand, fontFamily: Platform.OS === "ios" ? "Amiri" : "serif" }}>
                      {showInfo.arabicName}
                    </Text>
                    <Text style={{ fontSize: 20, fontWeight: "800", color: colors.onSurface, marginTop: 4 }}>
                      Surah {showInfo.englishName}
                    </Text>
                    
                    {/* Meta info row */}
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                      <Text style={{ fontSize: 13, color: colors.onSurfaceSecondary }}>
                        <Text style={{ fontWeight: "700" }}>Ayahs:</Text> {showInfo.totalAyahs}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.onSurfaceSecondary }}>
                        <Text style={{ fontWeight: "700" }}>Revelation Place:</Text> {showInfo.type === "Meccan" ? "Mecca" : "Medina"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

                  {/* Tab Selector Pills (Image-3 style) */}
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                    <Pressable
                      onPress={() => setInfoTab("ibn_ashur")}
                      style={[{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        alignItems: "center",
                        justifyContent: "center"
                      }, infoTab === "ibn_ashur" ? {
                        backgroundColor: colors.brand,
                        borderColor: colors.brand
                      } : {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border
                      }]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: infoTab === "ibn_ashur" ? "#fff" : colors.onSurface }}>
                        Ibn Ashur
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setInfoTab("maududi")}
                      style={[{
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 20,
                        borderWidth: 1,
                        alignItems: "center",
                        justifyContent: "center"
                      }, infoTab === "maududi" ? {
                        backgroundColor: colors.brand,
                        borderColor: colors.brand
                      } : {
                        backgroundColor: colors.surfaceSecondary,
                        borderColor: colors.border
                      }]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: infoTab === "maududi" ? "#fff" : colors.onSurface }}>
                        A. Maududi
                      </Text>
                    </Pressable>
                  </View>

                  {/* Description Source Adaptation Text */}
                  <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginBottom: 12, fontStyle: "italic" }}>
                    {infoTab === "ibn_ashur" ? "Adapted from Tafsir Ibn Ashur" : "Adapted from Sayyid Abul Ala Maududi - Tafhim al-Qur'an"}
                  </Text>

                  {/* Formatted Html Content */}
                  {parseHtmlToReact(activeText)}

                </ScrollView>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* ─── Focused Verse Details Modal (Image 4) ─────────────────────────── */}
      {focusedVerse && (() => {
        const isBm = verseBookmarks.has(`${focusedVerse.surahNumber}:${focusedVerse.ayahNumber}`);

        return (
          <Modal visible animationType="fade" transparent onRequestClose={() => setFocusedVerse(null)}>
            <Pressable style={styles.modalBackdropDismiss} onPress={() => setFocusedVerse(null)}>
              <Pressable style={[styles.focusedVerseCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
                
                {/* Header row */}
                <View style={[styles.sheetHeader, { marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: colors.brand }}>
                      {focusedVerse.surahNumber}:{focusedVerse.ayahNumber}
                    </Text>
                    <Pressable onPress={() => handlePlaySingle(focusedVerse.surahNumber, focusedVerse.ayahNumber, focusedVerse.absoluteNumber)}>
                      <MaterialCommunityIcons name={playingAyah?.absolute === focusedVerse.absoluteNumber && status.playing ? "pause-circle" : "play-circle-outline"} size={26} color={colors.brand} />
                    </Pressable>
                    <Pressable onPress={() => toggleVerseBookmark(focusedVerse.surahNumber, focusedVerse.ayahNumber, focusedVerse.surahName)}>
                      <MaterialCommunityIcons name={isBm ? "bookmark" : "bookmark-outline"} size={24} color={isBm ? colors.brand : colors.onSurfaceMuted} />
                    </Pressable>
                  </View>
                  
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <Pressable onPress={() => handleCopyVerse(focusedVerse.arabicText, focusedVerse.translationText, `${focusedVerse.surahNumber}:${focusedVerse.ayahNumber}`)}>
                      <MaterialCommunityIcons name="content-copy" size={20} color={colors.onSurfaceSecondary} />
                    </Pressable>
                    <Pressable onPress={() => handleShareVerse(focusedVerse.arabicText, focusedVerse.translationText, `Quran ${focusedVerse.surahNumber}:${focusedVerse.ayahNumber}`)}>
                      <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.onSurfaceSecondary} />
                    </Pressable>
                    <Pressable onPress={() => { setFocusedVerse(null); setShowAdvancedCopy({ surah: focusedVerse.surahNumber, ayah: focusedVerse.ayahNumber }); }}>
                      <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.onSurfaceSecondary} />
                    </Pressable>
                    <Pressable onPress={() => setFocusedVerse(null)} hitSlop={10}>
                      <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                    </Pressable>
                  </View>
                </View>

                {/* Content Area */}
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }} contentContainerStyle={{ paddingBottom: 16 }}>
                  
                  {/* Arabic Text */}
                  <Text style={[styles.arabicVbV, { fontSize: fontSizeArabic, color: colors.onSurface, textAlign: "right", marginVertical: 12, lineHeight: fontSizeArabic * 1.8 }]}>
                    {focusedVerse.arabicText}
                  </Text>
                  
                  {/* Translation */}
                  <Text style={[styles.transVbV, { fontSize: fontSizeTrans, color: colors.onSurfaceSecondary, marginBottom: 16 }]}>
                    {focusedVerse.translationText}
                  </Text>

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

                  {/* Horizontal Scroll Bar for Tabs */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
                    {(["tafsirs", "lessons", "reflections", "answers", "qiraat", "hadith"] as const).map(tab => {
                      const isActive = focusedVerseTab === tab;
                      const label = tab === "qiraat" ? "Qira'at" : tab.charAt(0).toUpperCase() + tab.slice(1);
                      return (
                        <Pressable key={tab} onPress={() => setFocusedVerseTab(tab)}
                          style={[{
                            paddingVertical: 6,
                            paddingHorizontal: 12,
                            borderRadius: 16,
                            borderWidth: 1,
                          }, isActive ? {
                            backgroundColor: colors.brand,
                            borderColor: colors.brand
                          } : {
                            backgroundColor: colors.surfaceSecondary,
                            borderColor: colors.border
                          }]}>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: isActive ? "#fff" : colors.onSurface }}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Active Tab Content */}
                  <View style={{ marginTop: 8 }}>
                    {focusedVerseTab === "tafsirs" && (
                      focusedTafsirLoading ? (
                        <ActivityIndicator color={colors.brand} style={{ marginTop: 12 }} />
                      ) : (
                        <Text style={{ fontSize: 13, lineHeight: 20, color: colors.onSurfaceSecondary }}>
                          {cleanHtml(focusedTafsirText)}
                        </Text>
                      )
                    )}

                    {focusedVerseTab === "lessons" && (
                      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.onSurfaceSecondary }}>
                        {"• Sovereignty & Accountability: Every deed, small or large, has a consequence and recompense.\n• Complete Justice: Ultimate justice belongs to Allah; believers should rely on Him alone.\n• Connection to Prayer: Constantly reinforces dependence on Allah for guidance and our ultimate accountability."}
                      </Text>
                    )}

                    {focusedVerseTab === "reflections" && (
                      <View>
                        <Text style={{ fontSize: 13, lineHeight: 20, color: colors.onSurfaceSecondary, fontStyle: "italic", marginBottom: 8 }}>
                          No community reflections posted yet. Add a personal reflection note below:
                        </Text>
                        <TextInput
                          placeholder="Write a reflection or study note..."
                          placeholderTextColor={colors.onSurfaceMuted}
                          multiline
                          style={{
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 8,
                            padding: 10,
                            fontSize: 13,
                            color: colors.onSurface,
                            height: 60,
                            textAlignVertical: "top"
                          }}
                        />
                      </View>
                    )}

                    {focusedVerseTab === "answers" && (
                      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.onSurfaceSecondary }}>
                        <Text style={{ fontWeight: "700" }}>{"Q: Why is the Day of Judgment referred to as the 'Day of Recompense' (Yawm ad-Din)?"}</Text>{"\n"}
                        <Text style={{ color: colors.brand }}>A:</Text> Because it is the day when every soul will be recompensed for their deeds, whether good or bad, with absolute justice.
                      </Text>
                    )}

                    {focusedVerseTab === "qiraat" && (
                      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.onSurfaceSecondary }}>
                        {"• Hafs reading: Recites 'Māliki' (Owner/Master of the Day of Judgment)\n• Warsh reading: Recites 'Maliki' (King/Sovereign of the Day of Judgment)\n\nBoth recitations are authentic and mutawatir, complementing the depth of the divine meanings."}
                      </Text>
                    )}

                    {focusedVerseTab === "hadith" && (
                      <Text style={{ fontSize: 13, lineHeight: 20, color: colors.onSurfaceSecondary }}>
                        {"• Virtue of Al-Fatihah: The Prophet (ﷺ) said: 'Allah said: I have divided the prayer (Al-Fatihah) into two halves between Me and My servant...' (Sahih Muslim)\n• Greatest Surah: The Prophet (ﷺ) said: 'I will teach you a Surah which is the greatest Surah in the Quran... It is Al-Hamdu lillahi Rabbil-'alamin...'"}
                      </Text>
                    )}
                  </View>

                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}

      {/* ─── Multi-Source Tafsir Modal ──────────────────────────────────────── */}
      {showTafsir && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setShowTafsir(null)}>
          <View style={styles.bottomSheetOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.surface, maxHeight: "80%" }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Tafsir — {showTafsir.surah}:{showTafsir.ayah}</Text>
                <Pressable onPress={() => setShowTafsir(null)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
              </View>
              {/* Tafsir source pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tafsirPillsRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                {englishTafsirs.map(t => (
                  <Pressable key={t.id} onPress={() => { setSelectedTafsirId(t.id); AsyncStorage.setItem("quran_selected_tafsir", String(t.id)); }}
                    style={[styles.tafsirPill, selectedTafsirId === t.id ? { backgroundColor: colors.brand } : { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 }]}>
                    <Text style={[styles.tafsirPillText, { color: selectedTafsirId === t.id ? "#fff" : colors.onSurface }]}>{t.name?.substring(0, 20)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                {tafsirLoading ? <ActivityIndicator color={colors.brand} style={{ marginTop: 20 }} /> : (
                  <Text style={[styles.tafsirBody, { color: colors.onSurfaceSecondary }]}>{tafsirText}</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── Verse Overflow Popover Modal ─── */}
      {overflowVerse && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setOverflowVerse(null)}>
          <Pressable style={styles.bottomSheetOverlay} onPress={() => setOverflowVerse(null)}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: 36 }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Verse Options ({overflowVerse.surah}:{overflowVerse.ayah})</Text>
                <Pressable onPress={() => setOverflowVerse(null)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
              </View>

              {/* Pin & compare */}
              <Pressable onPress={() => { setOverflowVerse(null); triggerCompareVerse(overflowVerse.surah, overflowVerse.ayah); }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="pin-outline" size={22} color={colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Pin & compare</Text>
              </Pressable>

              {/* Advanced Copy */}
              <Pressable onPress={() => { setOverflowVerse(null); setShowAdvancedCopy(overflowVerse); }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={22} color={colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Advanced Copy</Text>
              </Pressable>

              {/* Word By Word */}
              <Pressable onPress={() => { setOverflowVerse(null); setWbwEnabled(!wbwEnabled); AsyncStorage.setItem("quran_wbw_enabled", String(!wbwEnabled)); }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="format-letter-matches" size={22} color={wbwEnabled ? colors.brand : colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: wbwEnabled ? colors.brand : colors.onSurface }]}>Word By Word</Text>
              </Pressable>

              {/* Repeat Verse */}
              <Pressable onPress={() => { setOverflowVerse(null); handlePlaySingle(overflowVerse.surah, overflowVerse.ayah, activeVerseData?.absoluteNumber || 1); setRepeatCount(1); remainingRepeats.current = 1; }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="repeat" size={22} color={colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Repeat Verse</Text>
              </Pressable>

              {/* Translations */}
              <Pressable onPress={() => { setOverflowVerse(null); setShowTranslationsList(true); }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="translate" size={22} color={colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Translations</Text>
              </Pressable>

              {/* Translation Feedback */}
              <Pressable onPress={() => { setOverflowVerse(null); setFeedbackText(""); setShowFeedbackModal(overflowVerse); }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="message-text-outline" size={22} color={colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Translation Feedback</Text>
              </Pressable>

              {/* Embed Widget */}
              <Pressable onPress={() => { setOverflowVerse(null); setShowEmbedModal(overflowVerse); }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="code-tags" size={22} color={colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Embed Widget</Text>
              </Pressable>

              {/* Settings */}
              <Pressable onPress={() => { setOverflowVerse(null); setShowSettings(true); }}
                style={[styles.menuItem, { borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name="cog-outline" size={22} color={colors.onSurfaceSecondary} />
                <Text style={[styles.menuItemText, { color: colors.onSurface }]}>Settings</Text>
              </Pressable>

            </View>
          </Pressable>
        </Modal>
      )}

      {/* ─── Option Modal: Pin & Compare translations ──────────────────────── */}
      {showCompareModal && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setShowCompareModal(null)}>
          <View style={styles.bottomSheetOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.surface, maxHeight: "85%" }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Compare Translations — {showCompareModal.surah}:{showCompareModal.ayah}</Text>
                <Pressable onPress={() => setShowCompareModal(null)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
              </View>
              <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                {compareLoading ? <ActivityIndicator color={colors.brand} /> : (
                  <View style={{ gap: 16 }}>
                    {compareData.map(item => (
                      <View key={item.id} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12 }}>
                        <Text style={[styles.transAuthorLabel, { color: colors.brand }]}>
                          {(allTranslations.find(t => t.id === item.resource_id)?.name || "Translation").toUpperCase()}:
                        </Text>
                        <Text style={[styles.transVbV, { fontSize: fontSizeTrans, color: colors.onSurfaceSecondary }]}>
                          {item.text?.replace(/<[^>]*>/g, "")}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── Option Modal: Advanced Copy checkboxes ─────────────────────────── */}
      {showAdvancedCopy && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setShowAdvancedCopy(null)}>
          <View style={styles.bottomSheetOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: 36 }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Advanced Copy options</Text>
                <Pressable onPress={() => setShowAdvancedCopy(null)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
              </View>

              {([["arabic", "Arabic script text"], ["translation", "Translation text"], ["transliteration", "Transliteration text"], ["reference", "Include verse reference info"]] as const).map(([opt, desc]) => (
                <Pressable key={opt} onPress={() => setCopyOptions({ ...copyOptions, [opt]: !copyOptions[opt] })}
                  style={styles.toggleRow}>
                  <Text style={[styles.toggleLabel, { color: colors.onSurface }]}>{desc}</Text>
                  <MaterialCommunityIcons name={copyOptions[opt] ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={colors.brand} />
                </Pressable>
              ))}

              <Pressable onPress={() => {
                const targetVerse = pageVerses.find(v => v.surahNumber === showAdvancedCopy.surah && v.ayahNumber === showAdvancedCopy.ayah);
                if (targetVerse) executeAdvancedCopy(targetVerse);
              }} style={[styles.doneBtn, { backgroundColor: colors.brand, marginTop: 20 }]}>
                <Text style={styles.doneBtnText}>Copy Selection</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── Option Modal: Translation Feedback ────────────────────────────── */}
      {showFeedbackModal && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setShowFeedbackModal(null)}>
          <View style={styles.bottomSheetOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: 36 }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Translation Feedback ({showFeedbackModal.surah}:{showFeedbackModal.ayah})</Text>
                <Pressable onPress={() => setShowFeedbackModal(null)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
              </View>
              <TextInput
                placeholder="Suggest correction or improvement for this translation..."
                placeholderTextColor={colors.onSurfaceMuted}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline
                numberOfLines={4}
                style={[styles.searchInput, { color: colors.onSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, height: 100, textAlignVertical: "top", marginBottom: 20 }]}
              />
              <Pressable onPress={() => {
                setShowFeedbackModal(null);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                Alert.alert("Feedback submitted", "Thank you! Your suggestion has been recorded for review.");
              }} style={[styles.doneBtn, { backgroundColor: colors.brand }]}>
                <Text style={styles.doneBtnText}>Submit Feedback</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── Option Modal: Embed Widget iframe code ─────────────────────────── */}
      {showEmbedModal && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setShowEmbedModal(null)}>
          <View style={styles.bottomSheetOverlay}>
            <View style={[styles.bottomSheet, { backgroundColor: colors.surface, paddingBottom: 36 }]}>
              <View style={styles.sheetHeader}>
                <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Embed Widget code ({showEmbedModal.surah}:{showEmbedModal.ayah})</Text>
                <Pressable onPress={() => setShowEmbedModal(null)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
              </View>
              <View style={{ backgroundColor: colors.surfaceSecondary, padding: 14, borderRadius: 10, borderStyle: "dashed", borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}>
                <Text selectable style={{ fontSize: 12, color: colors.onSurfaceSecondary, fontFamily: "monospace" }}>
                  {`<iframe src="https://quran.com/${showEmbedModal.surah}/${showEmbedModal.ayah}" width="100%" height="320" frameborder="0"></iframe>`}
                </Text>
              </View>
              <Pressable onPress={async () => {
                const code = `<iframe src="https://quran.com/${showEmbedModal.surah}/${showEmbedModal.ayah}" width="100%" height="320" frameborder="0"></iframe>`;
                await Clipboard.setStringAsync(code);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                Alert.alert("Success", "Embed code copied to clipboard!");
                setShowEmbedModal(null);
              }} style={[styles.doneBtn, { backgroundColor: colors.brand }]}>
                <Text style={styles.doneBtnText}>Copy Embed Code</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── Downloading Progress Overlay Modal ──────────────────────────────── */}
      {downloading && (
        <Modal transparent visible={downloading} animationType="fade">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
            <View style={{ backgroundColor: colors.surface, padding: 24, borderRadius: 16, alignItems: "center", gap: 16, width: "80%" }}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={{ color: colors.onSurface, fontSize: 16, fontWeight: "600", textAlign: "center" }}>
                {downloadProgress || "Downloading recitation..."}
              </Text>
            </View>
          </View>
        </Modal>
      )}

    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const headerStyle = StyleSheet.create({
  headerActions: { flexDirection: "row", gap: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1 },
  surahSelectorBtn: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 200 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  locationBar: { paddingHorizontal: theme.spacing.lg, paddingVertical: 6, borderBottomWidth: 1, alignItems: "center" },
  locationText: { fontSize: 11 },
  modeSelectorRow: { flexDirection: "row", padding: 8, borderBottomWidth: 1, gap: 8 },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "transparent", alignItems: "center" },
  modeBtnText: { fontSize: 12 },
  translationPillRow: { paddingHorizontal: theme.spacing.lg, paddingVertical: 8, borderBottomWidth: 1, zIndex: 10 },
  transPillBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, gap: 6 },
  transPillBtnText: { fontSize: 12, fontWeight: "600" },
  dropdown: { position: "absolute", top: 42, left: theme.spacing.lg, width: 260, borderRadius: 12, borderWidth: 1, padding: 12, elevation: 8, zIndex: 99, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  dropdownLabel: { fontSize: 11, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  dropdownItem: { fontSize: 13, fontWeight: "500", paddingVertical: 4 },
  selectTransBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1 },
  selectTransBtnText: { fontSize: 13, fontWeight: "700" },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: 120 },
  // Surah Card
  surahCard: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1, marginBottom: 20 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSubtitle: { fontSize: 13 },
  cardArabicName: { fontSize: 22, fontWeight: "600" },
  cardDesc: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  cardActionsRow: { flexDirection: "row", gap: 12 },
  pillBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  pillBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pillBtnOutline: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1 },
  pillBtnOutlineText: { fontSize: 13, fontWeight: "700" },
  // Custom Card Layout Row (Image 2 style)
  cardLayoutRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLeftCol: { flex: 1, gap: 4 },
  cardRightCol: { alignItems: "flex-end", gap: 8 },
  cardTopActions: { flexDirection: "row", gap: 8 },
  cardTitleWithIcon: { flexDirection: "row", alignItems: "center", gap: 8 },
  transPillBtnInsideCard: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, gap: 6, marginTop: 4 },
  transPillBtnTextInsideCard: { fontSize: 12, fontWeight: "600" },
  dropdownInsideCard: { position: "absolute", top: 76, right: 0, width: 250, borderRadius: 12, borderWidth: 1, padding: 12, elevation: 8, zIndex: 99, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6 },
  dropdownMenuItemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  dropdownItemText: { fontSize: 13, fontWeight: "500" },
  // Bismillah
  bismillahBox: { alignItems: "center", marginVertical: 20 },
  bismillahAr: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  bismillahEn: { fontSize: 11 },
  // Arabic Flow
  arabicFlowBox: { paddingVertical: 10 },
  arabicFlowText: { fontFamily: Platform.OS === "ios" ? "Amiri" : "serif" },
  ayahMarker: { fontSize: 14, fontWeight: "700" },
  pageNum: { textAlign: "center", fontSize: 12, marginTop: 16, fontWeight: "700" },
  // Verse Cards
  verseCard: { paddingVertical: 16, borderBottomWidth: 1 },
  verseHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  verseHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  verseHeaderRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  verseBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  verseBadgeText: { fontSize: 12, fontWeight: "700" },
  arabicVbV: { textAlign: "right", lineHeight: 46, fontFamily: Platform.OS === "ios" ? "Amiri" : "serif", marginBottom: 8 },
  translitVbV: { lineHeight: 20, fontWeight: "600", marginBottom: 6 },
  transVbV: { lineHeight: 20 },
  transAuthorLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 },
  arabicRef: { fontSize: 12, textAlign: "right", marginTop: 8 },
  secondaryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  secondaryBtnText: { fontSize: 12, fontWeight: "600" },
  // WBW
  wbwGrid: { flexDirection: "row", flexWrap: "wrap-reverse", justifyContent: "flex-end", gap: 8, marginBottom: 8 },
  wbwWordBox: { alignItems: "center", padding: 6, borderRadius: 8, borderWidth: 1, minWidth: 60 },
  wbwArabic: { fontWeight: "600", marginBottom: 2 },
  wbwTranslit: { fontWeight: "600" },
  wbwMeaning: {},
  // Pagination
  paginationBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: 12, borderTopWidth: 1 },
  pageNavBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  pageNavBtnText: { fontSize: 13, fontWeight: "700" },
  pageIndicator: { fontSize: 13, fontWeight: "700" },
  // Player Bar
  playerBar: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  progressTrack: { height: 3, width: "100%" },
  progressFill: { height: 3, borderRadius: 2 },
  playerBarContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: theme.spacing.lg, paddingVertical: 12 },
  playerIcon: { padding: 6 },
  playBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  // Bottom Sheet Overlay
  bottomSheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.lg, paddingBottom: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  // Settings Tabs
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginBottom: 0 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnText: { fontSize: 13, fontWeight: "600" },
  previewBox: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 16 },
  previewArabic: { fontFamily: Platform.OS === "ios" ? "Amiri" : "serif", textAlign: "center", marginBottom: 8 },
  previewTrans: { textAlign: "center" },
  settingLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepperBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepperValue: { fontSize: 16, fontWeight: "700", minWidth: 30, textAlign: "center" },
  reciterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: 14 },
  reciterRowText: { fontSize: 13, fontWeight: "600", flex: 1 },
  resetBtn: { marginTop: 20, alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  resetBtnText: { fontSize: 12, fontWeight: "600" },
  doneBtn: { marginTop: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  doneBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  toggleLabel: { fontSize: 14, fontWeight: "500" },
  wbwModeBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 },
  dropdownBoxInline: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 8 },
  dropdownInlineItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12 },
  // Menu Items
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: "500" },
  // Tafsir
  tafsirPillsRow: { maxHeight: 44, marginBottom: 8 },
  tafsirPill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16 },
  tafsirPillText: { fontSize: 12, fontWeight: "700" },
  tafsirBody: { fontSize: 14, lineHeight: 22 },
  // Surah Selector
  searchBar: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  surahRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  surahNumCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  surahNumText: { fontSize: 13, fontWeight: "700" },
  surahRowName: { fontSize: 14, fontWeight: "700" },
  surahRowMeta: { fontSize: 11, marginTop: 2 },
  surahRowArabic: { fontSize: 16 },
  // Translation List
  langGroupHeader: { fontSize: 14, fontWeight: "800", textTransform: "uppercase", marginBottom: 10, marginTop: 8, letterSpacing: 0.5 },
  transRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  transRowName: { fontSize: 14, fontWeight: "600" },
  transRowAuthor: { fontSize: 11, marginTop: 2 },
  // Info Modal
  infoSurahName: { fontSize: 20, fontWeight: "700" },
  infoMeta: { fontSize: 13, marginTop: 4 },
  infoShortText: { fontSize: 14, lineHeight: 20, marginTop: 12, fontStyle: "italic" },
  infoBody: { fontSize: 13, lineHeight: 20 },
  authorBadgeRow: { flexDirection: "row", marginVertical: 12 },
  authorBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14 },
  authorBadgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  // Modal dialog popups
  modalBackdropDismiss: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialogPopupBox: {
    width: 280,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  focusedVerseCard: {
    width: "92%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    maxHeight: "82%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
});
