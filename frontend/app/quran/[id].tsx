import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, FlatList, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { toggleFavourite, getFavourites, addQuranBookmark, removeQuranBookmark, getQuranBookmarks, saveQuranLastRead } from "@/src/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import quranData from "@/src/data/quran/quranData.json";
import { JUZ_DATA, getJuzForAyah } from "@/src/data/juzData";
import { TRANSLATION_MAP } from "@/src/data/quran/translationLanguages";
import transliterationTajweedData from "@/src/data/quran/transliterationTajweed.json";

type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
  audio?: string;
};

type LocalAyah = { numberInSurah: number; arabic: string; translation: string; transliteration: string };
type LocalSurah = { number: number; name: string; arabicName: string; totalAyahs: number; ayahs: LocalAyah[] };

// Bundled offline dataset (Arabic Uthmani text, English translation, transliteration)
// so the Quran can always be read without an internet connection.
const QURAN: LocalSurah[] = quranData as LocalSurah[];

// Single consolidated list of unique Quran reciters.
// These stream continuous surah audio online and support caching for offline play.
const RECITERS = [
  { qdcId: 7,   name: "Mishari Rashid al-Afasy",         style: "Murattal",  hasWordSegments: true  },
  { qdcId: 3,   name: "Abdur-Rahman as-Sudais",          style: "Murattal",  hasWordSegments: true  },
  { qdcId: 2,   name: "AbdulBaset AbdulSamad",           style: "Murattal",  hasWordSegments: true  },
  { qdcId: 6,   name: "Mahmoud Khalil Al-Husary",        style: "Murattal",  hasWordSegments: true  },
  { qdcId: 9,   name: "Mohamed Siddiq al-Minshawi",      style: "Murattal",  hasWordSegments: true  },
  { qdcId: 4,   name: "Abu Bakr al-Shatri",              style: "Murattal",  hasWordSegments: true  },
  { qdcId: 5,   name: "Hani ar-Rifai",                   style: "Murattal",  hasWordSegments: true  },
  { qdcId: 10,  name: "Sa'ud ash-Shuraym",               style: "Murattal",  hasWordSegments: true  },
  { qdcId: 11,  name: "Mohamed al-Tablawi",              style: "Murattal",  hasWordSegments: false },
] as const;

type ReciterQdcId = typeof RECITERS[number]["qdcId"];

export default function SurahDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [arabic, setArabic] = useState<Ayah[]>([]);
  const [trans, setTrans] = useState<Ayah[]>([]);
  const [name, setName] = useState("");
  const [arName, setArName] = useState("");
  const [loading, setLoading] = useState(true);
  const [audioErr, setAudioErr] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [reciterId, setReciterId] = useState<ReciterQdcId>(7); // default: Mishary Alafasy
  const [continuous, setContinuous] = useState(false);
  const [showReciters, setShowReciters] = useState(false);
  // Track download state per (reciterId, surahId): "idle" | "downloading" | "done"
  const [downloadStatus, setDownloadStatus] = useState<Record<string, "idle" | "downloading" | "done">>({});
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [fontType, setFontType] = useState<"indopak" | "uthmani" | "naskh">("indopak");
  const [fontSize, setFontSize] = useState<number>(24);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [showTransliteration, setShowTransliteration] = useState<boolean>(true);
  const [translit, setTranslit] = useState<Ayah[]>([]);
  const [verseTimings, setVerseTimings] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);

  const player = useAudioPlayer(null, { updateInterval: 50 });
  const status = useAudioPlayerStatus(player);
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  // Reading mode — default / sepia / dark (loaded from AsyncStorage, set in Quick Settings)
  const [readingMode, setReadingMode] = useState<"default" | "sepia" | "dark">("default");

  // Scroll progress for lists
  const [scrollProgress, setScrollProgress] = useState(0);

  // Juz modal
  const [showJuzModal, setShowJuzModal] = useState(false);

  // Tafsir modal state
  const [tafsirModalVisible, setTafsirModalVisible] = useState(false);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirContent, setTafsirContent] = useState("");
  const [tafsirRef, setTafsirRef] = useState({ surah: 0, ayah: 0, arabic: "", trans: "" });
  const [activeTafsirId, setActiveTafsirId] = useState<number>(169); // 169 = Ibn Kathir (English), 160 = Al-Jalalayn (English by F. Hamza)

  const openTafsirModal = useCallback(async (ayahNum: number, arabicText: string, transText: string, tafsirIdOverride?: number) => {
    const tafsirId = tafsirIdOverride ?? activeTafsirId;
    setTafsirRef({ surah: Number(id), ayah: ayahNum, arabic: arabicText, trans: transText });
    setTafsirModalVisible(true);
    setTafsirLoading(true);
    setTafsirContent("");

    try {
      const cacheKey = `hikmah:tafsir:${tafsirId}:${id}:${ayahNum}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setTafsirContent(cached);
        setTafsirLoading(false);
        return;
      }

      const response = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${id}:${ayahNum}`);
      const data = await response.json();
      if (data && data.tafsir && data.tafsir.text) {
        // Strip HTML tags from the Tafsir text
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
  }, [id, activeTafsirId]);

  // Grammar Breakdown / Topics Modal States
  const [grammarModalVisible, setGrammarModalVisible] = useState(false);
  const [selectedAyahForGrammar, setSelectedAyahForGrammar] = useState<{ surah: number; ayah: number; text: string; translation: string } | null>(null);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [grammarWords, setGrammarWords] = useState<{ text: string; transliteration: string; translation: string; partOfSpeech?: string }[]>([]);

  const openGrammarModal = useCallback(async (ayahNum: number, arabicText: string, transText: string) => {
    const surahId = Number(id);
    setSelectedAyahForGrammar({ surah: surahId, ayah: ayahNum, text: arabicText, translation: transText });
    setGrammarModalVisible(true);
    setGrammarLoading(true);
    setGrammarWords([]);

    try {
      const cacheKey = `hikmah:grammar:${surahId}:${ayahNum}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setGrammarWords(JSON.parse(cached));
        setGrammarLoading(false);
        return;
      }

      // Fetch word-by-word data from Quran Foundation API v4 (public fallback)
      const response = await fetch(`https://api.quran.com/api/v4/verses/by_key/${surahId}:${ayahNum}?words=true`);
      const data = await response.json();
      if (data && data.verse && data.verse.words) {
        const mapped = data.verse.words
          .filter((w: any) => w.char_type_name === "word")
          .map((w: any) => ({
            text: w.text_uthmani || w.text || "",
            transliteration: w.transliteration?.text || "",
            translation: w.translation?.text || "",
            partOfSpeech: w.line_number ? `Word ${w.position}` : undefined,
          }));
        setGrammarWords(mapped);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(mapped));
      } else {
        setGrammarWords([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGrammarLoading(false);
    }
  }, [id]);

  // Scroll ref for auto-scrolling to highlighted ayah
  const scrollRef = useRef<ScrollView>(null);
  const ayahYPositions = useRef<Record<number, number>>({});


  // Bookmarks
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());

  // Load bookmarks for this surah on mount/surah change
  useEffect(() => {
    const surahId = Number(id);
    getQuranBookmarks().then((bms) => {
      const ayahNums = new Set(
        bms.filter((b) => b.surahNumber === surahId).map((b) => b.ayahNumber)
      );
      setBookmarkedAyahs(ayahNums);
    });
  }, [id]);

  const toggleAyahBookmark = useCallback(async (ayahNumber: number) => {
    const surahId = Number(id);
    const isBookmarked = bookmarkedAyahs.has(ayahNumber);
    if (isBookmarked) {
      await removeQuranBookmark(surahId, ayahNumber);
      setBookmarkedAyahs((prev) => { const s = new Set(prev); s.delete(ayahNumber); return s; });
    } else {
      await addQuranBookmark({ surahNumber: surahId, surahName: name, ayahNumber });
      setBookmarkedAyahs((prev) => new Set(prev).add(ayahNumber));
    }
  }, [id, name, bookmarkedAyahs]);

  // Effect 1: Load Surah text, cached translations, and run translation fetches
  useEffect(() => {
    let active = true;
    setLoading(true);

    const surahId = Number(id);
    const surah = QURAN.find((s) => s.number === surahId);

    if (surah) {
      setName(surah.name);
      setArName(surah.arabicName);
      setArabic(
        surah.ayahs.map((a) => ({ number: a.numberInSurah, numberInSurah: a.numberInSurah, text: a.arabic }))
      );

      const englishTrans = surah.ayahs.map((a) => ({
        number: a.numberInSurah,
        numberInSurah: a.numberInSurah,
        text: a.translation,
      }));

      const englishTranslit = surah.ayahs.map((a) => {
        const key = `${surahId}:${a.numberInSurah}`;
        const highQualityText = (transliterationTajweedData as Record<string, string>)[key] || a.transliteration;
        return {
          number: a.numberInSurah,
          numberInSurah: a.numberInSurah,
          text: highQualityText,
        };
      });

      if (language !== "en") {
        const cacheKey = `islamic_hikmah:quran_trans_${language}_${surahId}`;
        setTrans(englishTrans);
        setTranslit(englishTranslit);

        AsyncStorage.getItem(cacheKey).then((cached) => {
          if (!active) return;
          if (cached) {
            try {
              const { trans: cachedTrans, translit: cachedTranslit } = JSON.parse(cached);
              if (cachedTrans && cachedTranslit) {
                setTrans(cachedTrans);
                setTranslit(cachedTranslit);
                setLoading(false);
                return;
              }
            } catch {
              // ignore malformed cache
            }
          }

          const fetchQuranTranslations = async () => {
            try {
              const transResults: Ayah[] = [...englishTrans];
              const translitResults: Ayah[] = [...englishTranslit];
              const translationId = TRANSLATION_MAP[language as keyof typeof TRANSLATION_MAP];
              if (language === "ta") {
                // Load from local Jan Trust JSON file
                const taJanTrust = require("@/src/data/quran/ta-jan-trust-simple.json");
                transResults.forEach((ayah, idx) => {
                  const key = `${surahId}:${ayah.numberInSurah}`;
                  if (taJanTrust[key]) {
                    transResults[idx] = { ...ayah, text: taJanTrust[key].t };
                  }
                });
              } else if (translationId) {
                // Fetch directly from Quran.com API v4
                const response = await fetch(`https://api.quran.com/api/v4/quran/translations/${translationId}?chapter_number=${surahId}`);
                if (!active) return;
                
                if (response.ok) {
                  const data = await response.json();
                  if (data && data.translations && data.translations.length > 0) {
                    data.translations.forEach((item: any, idx: number) => {
                      if (transResults[idx]) {
                        // Strip HTML tags (like footnotes, e.g. <sup>)
                        const cleanText = item.text.replace(/<[^>]*>/g, "").trim();
                        transResults[idx] = { ...transResults[idx], text: cleanText };
                      }
                    });
                  }
                } else {
                  throw new Error(`Failed to fetch from Quran.com translation ID ${translationId}`);
                }
              } else {
                // Fallback to Google Translate chunk logic if not mapped
                const chunkSize = 20;
                const chunkCount = Math.ceil(englishTrans.length / chunkSize);

                const translateChunk = async (chunkIdx: number) => {
                  if (!active) return;
                  const startIdx = chunkIdx * chunkSize;
                  const endIdx = Math.min(startIdx + chunkSize, englishTrans.length);
                  const transSlice = englishTrans.slice(startIdx, endIdx);
                  const translitSlice = englishTranslit.slice(startIdx, endIdx);

                  const transCombined = transSlice.map((a) => a.text).join(" || ");
                  const translitCombined = translitSlice.map((a) => a.text).join(" || ");

                  const [resTrans, resTranslit] = await Promise.all([
                    fetch(
                      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(transCombined)}`
                    ).then((r) => r.json()),
                    fetch(
                      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(translitCombined)}`
                    ).then((r) => r.json()),
                  ]);

                  const translatedTransStr = resTrans?.[0]?.map((x: any) => x[0]).join("") || transCombined;
                  let translatedTransParts = translatedTransStr.split(/\s*\|\|\s*/);

                  if (translatedTransParts.length !== transSlice.length) {
                    translatedTransParts = await Promise.all(
                      transSlice.map(async (ayah) => {
                        try {
                          const r = await fetch(
                            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(ayah.text)}`
                          );
                          const d = await r.json();
                          return d?.[0]?.map((x: any) => x[0]).join("") || ayah.text;
                        } catch {
                          return ayah.text;
                        }
                      })
                    );
                  }

                  const translatedTranslitStr = resTranslit?.[0]?.map((x: any) => x[0]).join("") || translitCombined;
                  let translatedTranslitParts = translatedTranslitStr.split(/\s*\|\|\s*/);

                  if (translatedTranslitParts.length !== translitSlice.length) {
                    translatedTranslitParts = await Promise.all(
                      translitSlice.map(async (ayah) => {
                        try {
                          const r = await fetch(
                            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(ayah.text)}`
                          );
                          const d = await r.json();
                          return d?.[0]?.map((x: any) => x[0]).join("") || ayah.text;
                        } catch {
                          return ayah.text;
                        }
                      })
                    );
                  }

                  for (let offset = 0; offset < transSlice.length; offset++) {
                    const globalIdx = startIdx + offset;
                    if (translatedTransParts[offset]) {
                      transResults[globalIdx] = { ...transResults[globalIdx], text: translatedTransParts[offset].trim() };
                    }
                    if (translatedTranslitParts[offset]) {
                      translitResults[globalIdx] = { ...translitResults[globalIdx], text: translatedTranslitParts[offset].trim() };
                    }
                  }
                };

                await Promise.all(
                  Array.from({ length: chunkCount }, (_, i) => translateChunk(i))
                );
              }

              if (!active) return;
              setTrans(transResults);
              setTranslit(translitResults);
              setLoading(false);

              AsyncStorage.setItem(
                cacheKey,
                JSON.stringify({ trans: transResults, translit: translitResults })
              ).catch(() => {});
            } catch (e) {
              console.error("Failed to translate Quran:", e);
              if (active) setLoading(false);
            }
          };

          fetchQuranTranslations();
        });
      } else {
        setTrans(englishTrans);
        setTranslit(englishTranslit);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id, language]);

  // Returns the local filesystem path for a downloaded surah audio file.
  const getOfflinePath = (qId: number, sId: number) =>
    `${FileSystem.documentDirectory}hikmah_audio/${qId}_surah_${sId}.mp3`;

  // Enable global background audio playback on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch((err) => {
      console.warn("Failed to set audio mode:", err);
    });
  }, []);

  // Effect 2: Eagerly fetch continuous recitation audio URL and word timings from Quran.com QDC API.
  // Checks for a locally cached (downloaded) file first and uses it if available.
  // Caches timings locally so playing downloaded files works offline!
  useEffect(() => {
    let active = true;
    setAudioLoading(true);
    setAudioErr(false);

    const surahId = Number(id);
    const url = `https://api.qurancdn.com/api/qdc/audio/reciters/${reciterId}/audio_files?chapter=${surahId}&segments=true`;

    const isWeb = !FileSystem.documentDirectory;
    const localPath = isWeb ? "" : getOfflinePath(reciterId, surahId);
    const dlKey = `${reciterId}_${surahId}`;
    const cacheKeyTimings = `hikmah:timings:${reciterId}:${surahId}`;

    (async () => {
      // 1. Check if we have a locally downloaded file already (only on native)
      if (!isWeb) {
        try {
          const info = await FileSystem.getInfoAsync(localPath);
          if (info.exists && info.size && info.size > 0) {
            setDownloadStatus((s) => ({ ...s, [dlKey]: "done" }));
          }
        } catch {}
      }

      // 2. Try fetching the timing metadata & audio URL from the API
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("QDC API error");
        const data = await res.json();
        if (!active) return;
        const file = data.audio_files?.[0];
        if (file && file.audio_url) {
          // Use the local file if it exists, otherwise use the streaming URL
          let effectiveUrl = file.audio_url;
          if (!isWeb) {
            try {
              const localInfo = await FileSystem.getInfoAsync(localPath);
              if (localInfo.exists && (localInfo as any).size > 0) {
                effectiveUrl = localPath;
              }
            } catch {}
          }
          setAudioUrl(effectiveUrl);

          const timings = file.verse_timings || [];
          setVerseTimings(timings);
          setAudioErr(false);

          // Cache timings for offline use
          await AsyncStorage.setItem(cacheKeyTimings, JSON.stringify(timings));
        } else {
          setAudioUrl(null);
          setVerseTimings([]);
          setAudioErr(true);
        }
      } catch (err) {
        if (!active) return;
        console.log("Offline or fetch failed, checking local storage for:", dlKey);
        // Load cached timings & local file for offline playback (only on native)
        if (!isWeb) {
          try {
            const localInfo = await FileSystem.getInfoAsync(localPath);
            const cachedTimings = await AsyncStorage.getItem(cacheKeyTimings);
            if (localInfo.exists && cachedTimings) {
              setAudioUrl(localPath);
              setVerseTimings(JSON.parse(cachedTimings));
              setAudioErr(false);
              if (active) setAudioLoading(false);
              return;
            }
          } catch {}
        }
        setAudioUrl(null);
        setVerseTimings([]);
        setAudioErr(true);
      } finally {
        if (active) setAudioLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, reciterId]);

  // Download the current surah audio for offline use
  const downloadSurah = useCallback(async () => {
    const isWeb = !FileSystem.documentDirectory;
    if (isWeb) {
      Alert.alert("Not Supported", "Downloads are only supported on iOS and Android devices.");
      return;
    }
    if (!audioUrl || audioUrl.startsWith(FileSystem.documentDirectory || "file://")) return;
    const surahId = Number(id);
    const localPath = getOfflinePath(reciterId, surahId);
    const dlKey = `${reciterId}_${surahId}`;

    // Ensure the directory exists
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}hikmah_audio/`,
      { intermediates: true }
    );

    setDownloadStatus((s) => ({ ...s, [dlKey]: "downloading" }));
    setDownloadProgress((p) => ({ ...p, [dlKey]: 0 }));

    const downloadResumable = FileSystem.createDownloadResumable(
      audioUrl,
      localPath,
      {},
      (progress) => {
        const pct = progress.totalBytesExpectedToWrite > 0
          ? Math.round((progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100)
          : 0;
        setDownloadProgress((p) => ({ ...p, [dlKey]: pct }));
      }
    );

    try {
      const result = await downloadResumable.downloadAsync();
      if (result?.uri) {
        setDownloadStatus((s) => ({ ...s, [dlKey]: "done" }));
        setAudioUrl(result.uri);
        Alert.alert("Downloaded!", `${name} (${RECITERS.find(r => r.qdcId === reciterId)?.name}) saved for offline use.`);
      }
    } catch (err) {
      console.error("Download failed:", err);
      setDownloadStatus((s) => ({ ...s, [dlKey]: "idle" }));
      Alert.alert("Download Failed", "Please check your connection and try again.");
    }
  }, [audioUrl, id, reciterId, name]);

  const isFocused = useIsFocused();

  useEffect(() => {
    getFavourites().then((fs) => setFavIds(new Set(fs.map((f) => f.id))));
  }, []);

  useEffect(() => {
    if (isFocused) {
      // Load preferences
      AsyncStorage.getItem("islamic_hikmah:quran_font_type").then((val) => {
        if (val) setFontType(val as any);
      });
      AsyncStorage.getItem("islamic_hikmah:quran_font_size").then((val) => {
        if (val) setFontSize(Number(val));
      });
      AsyncStorage.getItem("islamic_hikmah:quran_show_translation").then((val) => {
        if (val !== null) setShowTranslation(val === "true");
      });
      AsyncStorage.getItem("islamic_hikmah:quran_show_transliteration").then((val) => {
        if (val !== null) setShowTransliteration(val === "true");
      });
      AsyncStorage.getItem("islamic_hikmah:quran_reading_mode").then((val) => {
        if (val) setReadingMode(val as any);
      });
    }
  }, [isFocused]);

  const continuousRef = useRef(false);
  const playingIdxRef = useRef<number | null>(null);
  const stopAtMsRef = useRef<number | null>(null);
  const loadedUriRef = useRef<string | null>(null);
  const lastPlayTriggeredRef = useRef<number>(0);

  // Keep refs in sync with state so effects always see current values
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);
  useEffect(() => { playingIdxRef.current = playingIdx; }, [playingIdx]);

  // Handle auto-scroll to the active verse
  useEffect(() => {
    if (playingIdx !== null && ayahYPositions.current[playingIdx] !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, ayahYPositions.current[playingIdx] - 100), animated: true });
    }
  }, [playingIdx]);

  // Handle natural audio finish
  useEffect(() => {
    if (status?.didJustFinish) {
      setPlayingIdx(null);
      setActiveWordIdx(null);
      setContinuous(false);
      stopAtMsRef.current = null;
    }
  }, [status?.didJustFinish]);

  // Listen to playback position (currentTime * 1000 ms) for highlighting & auto-pause
  useEffect(() => {
    if (!status?.playing || !status?.currentTime || verseTimings.length === 0) return;

    // Ignore updates for a short duration after triggering a play/seek to avoid race conditions
    if (Date.now() - lastPlayTriggeredRef.current < 800) {
      return;
    }

    const ms = status.currentTime * 1000;

    // Single verse play auto-pause check
    if (!continuousRef.current && stopAtMsRef.current !== null) {
      if (ms >= stopAtMsRef.current) {
        try { player.pause(); } catch {}
        stopAtMsRef.current = null;
        setPlayingIdx(null);
        setActiveWordIdx(null);
        return;
      }
    }

    // Find active verse timing
    const activeVerseIdx = verseTimings.findIndex(
      (vt) => ms >= vt.timestamp_from && ms <= vt.timestamp_to
    );

    if (activeVerseIdx !== -1) {
      if (playingIdxRef.current !== activeVerseIdx) {
        setPlayingIdx(activeVerseIdx);
      }

      // Find active word segment
      const vt = verseTimings[activeVerseIdx];
      if (vt && vt.segments) {
        const activeSegment = vt.segments.find(
          (seg: [number, number, number]) => ms >= seg[1] && ms <= seg[2]
        );
        if (activeSegment) {
          const wIdx = activeSegment[0]; // 1-based word index
          if (activeWordIdx !== wIdx) {
            setActiveWordIdx(wIdx);
          }
        } else {
          setActiveWordIdx(null);
        }
      } else {
        setActiveWordIdx(null);
      }
    } else {
      setActiveWordIdx(null);
    }
  }, [status?.currentTime, verseTimings, player]);

  const [audioLoading, setAudioLoading] = useState(false);

  const playAyah = useCallback((i: number) => {
    if (!audioUrl || verseTimings.length === 0) return;
    const vt = verseTimings[i];
    if (!vt) return;

    const startSeconds = vt.timestamp_from / 1000;

    if (playingIdx === i) {
      if (status?.playing) {
        try { player.pause(); } catch {}
      } else {
        try { player.play(); } catch {}
      }
      return;
    }

    setPlayingIdx(i);
    setActiveWordIdx(null);
    setContinuous(false);
    stopAtMsRef.current = vt.timestamp_to;
    lastPlayTriggeredRef.current = Date.now();

    try {
      if (loadedUriRef.current !== audioUrl) {
        player.replace({ uri: audioUrl });
        loadedUriRef.current = audioUrl;
      }
      player.seekTo(startSeconds);
      player.play();
    } catch (err) {
      console.error("Player playback error:", err);
    }

    // Save last read position
    const surahId = Number(id);
    const surahData = QURAN.find((s) => s.number === surahId);
    if (surahData) {
      saveQuranLastRead({
        surahNumber: surahId,
        surahName: surahData.name,
        ayahNumber: i + 1,
      }).catch(() => {});
    }
  }, [audioUrl, verseTimings, playingIdx, status, player, id]);

  const playAll = useCallback(() => {
    if (!audioUrl || verseTimings.length === 0) return;

    const startSeconds = (verseTimings[0]?.timestamp_from || 0) / 1000;
    setPlayingIdx(0);
    setActiveWordIdx(null);
    setContinuous(true);
    stopAtMsRef.current = null;
    lastPlayTriggeredRef.current = Date.now();

    try {
      if (loadedUriRef.current !== audioUrl) {
        player.replace({ uri: audioUrl });
        loadedUriRef.current = audioUrl;
      }
      player.seekTo(startSeconds);
      player.play();
    } catch (err) {
      console.error("Play all error:", err);
    }
  }, [audioUrl, verseTimings, player]);

  const stopAll = useCallback(() => {
    try { player.pause(); } catch {}
    setPlayingIdx(null);
    setActiveWordIdx(null);
    setContinuous(false);
    stopAtMsRef.current = null;
  }, [player]);

  const onFavAyah = useCallback(async (i: number, a: Ayah) => {
    const favId = `ayah-${id}-${a.numberInSurah}`;
    await toggleFavourite({
      id: favId,
      type: "ayah",
      title: `${name} · ${a.numberInSurah}`,
      arabic: a.text,
      translation: trans[i]?.text,
      addedAt: Date.now(),
    });
    const fs = await getFavourites();
    setFavIds(new Set(fs.map((f) => f.id)));
  }, [id, name, trans]);

  const currentReciter = RECITERS.find((r) => r.qdcId === reciterId);
  const currentReciterName = currentReciter
    ? `${currentReciter.name} · ${currentReciter.style}`
    : "Unknown Reciter";
  const currentModeLabel = "Online Streaming";

  // Reading mode color palette
  const READING_COLORS = {
    default: { bg: colors.surface, card: colors.surfaceSecondary, arabic: colors.onSurface, trans: colors.onSurfaceMuted, translit: colors.brand },
    sepia:   { bg: "#F5ECD7", card: "#EDE0C4", arabic: "#2C1A0E", trans: "#6B4423", translit: "#8B5E2A" },
    dark:    { bg: "#0D2137", card: "#112840", arabic: "#FFFFFF", trans: "#8BAFC8", translit: "#C5A880" },
  };
  const rc = READING_COLORS[readingMode];

  // Current Juz for display in header
  const currentJuz = arabic.length > 0 ? getJuzForAyah(Number(id), 1) : null;

  const readPct = Math.round(scrollProgress * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: rc.bg }]} edges={["top"]}>
      {/* Scroll progress bar */}
      <View style={{ height: 3, backgroundColor: rc.bg === "#F5ECD7" ? "#D4C4A8" : "rgba(255,255,255,0.1)", width: "100%" }}>
        <View style={{ height: 3, backgroundColor: colors.brand, width: `${readPct}%` }} />
      </View>

      <View style={[styles.header, { backgroundColor: rc.bg }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="surah-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={rc.arabic} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: rc.arabic }]}>{name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.subtitle, { color: colors.brand }]}>{arName}</Text>
            <Text style={{ fontSize: 10, color: colors.brand, fontWeight: "700" }}>· {readPct}% read</Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {/* Juz badge — tap to open Juz navigator */}
          {currentJuz && (
            <Pressable
              onPress={() => setShowJuzModal(true)}
              style={{ backgroundColor: colors.brand + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}
            >
              <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "700" }}>Juz {currentJuz}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.push("/")} hitSlop={10} testID="quran-home">
            <MaterialCommunityIcons name="home-outline" size={24} color={rc.arabic} />
          </Pressable>
          <Pressable onPress={() => router.push("/quran/bookmarks" as any)} hitSlop={10} testID="quran-bookmarks">
            <MaterialCommunityIcons name="bookmark-multiple-outline" size={24} color={rc.arabic} />
          </Pressable>
          <Pressable onPress={() => setShowReciters((s) => !s)} hitSlop={10} testID="reciter-toggle">
            <MaterialCommunityIcons name="account-music" size={26} color={colors.brand} />
          </Pressable>
          <Pressable onPress={() => router.push("/quran/personalise")} hitSlop={10} style={{ padding: 2 }}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={rc.arabic} />
          </Pressable>
        </View>
      </View>

      {showReciters ? (
        <View style={[styles.reciterBox, { backgroundColor: colors.surfaceSecondary }]} testID="reciter-list">
          <Text style={[styles.reciterHead, { color: colors.onSurfaceMuted }]}>Choose Qari</Text>
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {RECITERS.map((r) => {
              const dlKey = `${r.qdcId}_${Number(id)}`;
              const dlState = downloadStatus[dlKey] || "idle";
              const isSelected = reciterId === r.qdcId;
              return (
                <Pressable
                  key={`qdc-${r.qdcId}`}
                  onPress={() => {
                    setReciterId(r.qdcId as ReciterQdcId);
                    setShowReciters(false);
                    stopAll();
                  }}
                  style={[styles.reciterItem, isSelected && { backgroundColor: colors.brand + "15", borderRadius: 8 }]}
                  testID={`reciter-qdc-${r.qdcId}`}
                >
                  <MaterialCommunityIcons
                    name={isSelected ? "check-circle" : "circle-outline"}
                    size={20}
                    color={isSelected ? colors.brand : colors.onSurfaceMuted}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reciterName, { color: colors.onSurface }]}>{r.name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 }}>
                      <View style={{ backgroundColor: colors.brand + "22", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 10, color: colors.brand, fontWeight: "600" }}>{r.style}</Text>
                      </View>
                      {r.hasWordSegments && (
                        <View style={{ backgroundColor: "#16a34a22", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ fontSize: 10, color: "#16a34a", fontWeight: "600" }}>Word Sync</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {isSelected && !!FileSystem.documentDirectory && (
                    <Pressable
                      onPress={(e) => { e.stopPropagation?.(); downloadSurah(); }}
                      hitSlop={8}
                      style={{
                        width: 30, height: 30, borderRadius: 15,
                        backgroundColor: dlState === "done" ? "#16a34a22" : colors.brand + "22",
                        alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {dlState === "downloading" ? (
                        <ActivityIndicator size="small" color={colors.brand} />
                      ) : dlState === "done" ? (
                        <MaterialCommunityIcons name="check" size={15} color="#16a34a" />
                      ) : (
                        <MaterialCommunityIcons name="download" size={15} color={colors.brand} />
                      )}
                    </Pressable>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.currentReciter}>
          <MaterialCommunityIcons name="microphone" size={14} color={colors.onSurfaceMuted} />
          <Text style={[styles.currentReciterTxt, { color: colors.onSurfaceMuted }]}>
            {currentReciterName}
          </Text>
        </View>
      )}

      <View style={styles.playAllRow}>
        <Pressable
          onPress={continuous ? stopAll : playAll}
          style={[styles.playAllBtn, {
            backgroundColor: audioErr ? colors.onSurfaceMuted : colors.brand,
          }]}
          disabled={audioErr || audioLoading}
          testID="play-all-btn"
        >
          {audioLoading ? (
            <ActivityIndicator size="small" color={colors.onBrandPrimary} />
          ) : (
            <MaterialCommunityIcons
              name={continuous ? "stop" : "play"}
              size={20}
              color={colors.onBrandPrimary}
            />
          )}
          <Text style={[styles.playAllTxt, { color: colors.onBrandPrimary }]}>
            {audioLoading
              ? "Loading audio…"
              : continuous
              ? "Stop"
              : "Play Full Surah"}
          </Text>
        </Pressable>
        {/* Download button for offline use */}
        {!!FileSystem.documentDirectory && !audioErr && audioUrl && !audioUrl.startsWith(FileSystem.documentDirectory ?? "file://") && (
          <Pressable
            onPress={downloadSurah}
            disabled={downloadStatus[`${reciterId}_${Number(id)}`] === "downloading"}
            style={[
              styles.playAllBtn,
              {
                backgroundColor: downloadStatus[`${reciterId}_${Number(id)}`] === "done"
                  ? "#16a34a"
                  : colors.surfaceSecondary,
                flex: 0,
                paddingHorizontal: 12,
              },
            ]}
          >
            {downloadStatus[`${reciterId}_${Number(id)}`] === "downloading" ? (
              <>
                <ActivityIndicator size="small" color={colors.brand} />
                <Text style={{ fontSize: 11, color: colors.brand, marginLeft: 4 }}>
                  {(downloadProgress ?? {})[`${reciterId}_${Number(id)}`] || 0}%
                </Text>
              </>
            ) : downloadStatus[`${reciterId}_${Number(id)}`] === "done" ? (
              <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="download" size={18} color={colors.brand} />
            )}
          </Pressable>
        )}
        {audioErr ? (
          <Text style={[styles.bgHint, { color: theme.colors.error }]}>⚠️ Audio unavailable</Text>
        ) : (
          <Text style={[styles.bgHint, { color: colors.onSurfaceMuted }]}>
            {!!FileSystem.documentDirectory && audioUrl?.startsWith(FileSystem.documentDirectory ?? "file://") ? "📥 Playing Offline" : "🔊 Online Stream"}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}
          style={{ backgroundColor: rc.bg }}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
            const scrollable = contentSize.height - layoutMeasurement.height;
            if (scrollable > 0) {
              setScrollProgress(Math.min(1, contentOffset.y / scrollable));
            }
          }}
        >
          {arabic.map((a, i) => {
            const isPlaying = playingIdx === i && status?.playing;
            const isHighlighted = playingIdx === i; // highlight even when paused mid-ayah
            const favId = `ayah-${id}-${a.numberInSurah}`;
            const isFav = favIds.has(favId);
            return (
              <View
                key={a.number}
                onLayout={(e) => { ayahYPositions.current[i] = e.nativeEvent.layout.y; }}
                style={[
                  styles.ayah,
                  { backgroundColor: isHighlighted ? colors.brand + "22" : rc.card },
                  isHighlighted && { borderWidth: 2, borderColor: colors.brand },
                ]}
                testID={`ayah-${a.numberInSurah}`}
              >
                <View style={styles.ayahHead}>
                  <View style={[styles.ayahNum, { backgroundColor: isHighlighted ? colors.brand : colors.brand + "22" }]}>
                    <Text style={[styles.ayahNumTxt, { color: isHighlighted ? "#fff" : colors.brand }]}>{a.numberInSurah}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Pressable onPress={() => playAyah(i)} hitSlop={10} disabled={audioErr} testID={`play-${a.numberInSurah}`}>
                      <MaterialCommunityIcons
                        name={isPlaying ? "pause-circle" : "play-circle"}
                        size={28}
                        color={audioErr ? colors.onSurfaceMuted : colors.brand}
                      />
                    </Pressable>
                    <Pressable
                      onPress={async () => {
                        await toggleAyahBookmark(a.numberInSurah);
                        await saveQuranLastRead({ surahNumber: Number(id), surahName: name, ayahNumber: a.numberInSurah });
                      }}
                      hitSlop={10}
                      testID={`bookmark-ayah-${a.numberInSurah}`}
                    >
                      <MaterialCommunityIcons
                        name={bookmarkedAyahs.has(a.numberInSurah) ? "bookmark" : "bookmark-outline"}
                        size={24}
                        color={bookmarkedAyahs.has(a.numberInSurah) ? colors.brand : colors.onSurfaceMuted}
                      />
                    </Pressable>
                    <Pressable onPress={() => onFavAyah(i, a)} hitSlop={10} testID={`fav-ayah-${a.numberInSurah}`}>
                      <MaterialCommunityIcons
                        name={isFav ? "heart" : "heart-outline"}
                        size={24}
                        color={isFav ? theme.colors.error : colors.onSurfaceMuted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => openTafsirModal(a.numberInSurah, a.text, trans[i]?.text || "")}
                      hitSlop={10}
                      testID={`tafsir-ayah-${a.numberInSurah}`}
                    >
                      <MaterialCommunityIcons
                        name="comment-text-outline"
                        size={24}
                        color={colors.onSurfaceMuted}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => openGrammarModal(a.numberInSurah, a.text, trans[i]?.text || "")}
                      hitSlop={10}
                      testID={`grammar-ayah-${a.numberInSurah}`}
                    >
                      <MaterialCommunityIcons
                        name="alpha-w-box-outline"
                        size={24}
                        color={colors.brand}
                      />
                    </Pressable>
                  </View>
                </View>
                <Text
                  style={[
                    styles.arabic,
                    {
                      color: rc.arabic,
                      fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "ScheherazadeNew" : "NotoNaskhArabic",
                      fontSize: fontSize,
                      lineHeight: fontSize * 1.8,
                    },
                  ]}
                >
                  {(() => {
                    const words = a.text.trim().split(/\s+/);
                    return words.map((word, wordIndex) => {
                      const isWordHighlighted = isHighlighted && activeWordIdx === (wordIndex + 1);
                      return (
                        <Text
                          key={wordIndex}
                          style={[
                            isWordHighlighted && {
                              color: colors.brand,
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {word}{" "}
                        </Text>
                      );
                    });
                  })()}
                </Text>
                {showTransliteration && (
                  <Text style={[styles.translit, { color: rc.translit }]}>
                    {translit[i]?.text}
                  </Text>
                )}
                {showTranslation && (
                  <Text style={[styles.translation, { color: rc.trans }]}>{trans[i]?.text}</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Juz Navigator Modal ─────────────────────────────────────── */}
      <Modal
        visible={showJuzModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJuzModal(false)}
      >
        <Pressable style={{ flex: 1, backgroundColor: "#00000066" }} onPress={() => setShowJuzModal(false)}>
          <View style={[styles.juzModal, { backgroundColor: rc.bg }]}>
            <View style={styles.juzModalHeader}>
              <Text style={[styles.juzModalTitle, { color: rc.arabic }]}>Jump to Juz</Text>
              <Pressable onPress={() => setShowJuzModal(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={22} color={rc.arabic} />
              </Pressable>
            </View>
            <FlatList
              data={JUZ_DATA}
              keyExtractor={(j) => String(j.juz)}
              numColumns={3}
              contentContainerStyle={{ padding: 12, gap: 8 }}
              columnWrapperStyle={{ gap: 8, marginBottom: 8 }}
              renderItem={({ item: j }) => {
                const isCurrent = currentJuz === j.juz;
                return (
                  <Pressable
                    onPress={() => {
                      setShowJuzModal(false);
                      router.push(`/quran/${j.surahNumber}` as any);
                    }}
                    style={[
                      styles.juzCell,
                      { backgroundColor: isCurrent ? colors.brand : rc.card,
                        borderColor: isCurrent ? colors.brand : colors.border },
                    ]}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "800", color: isCurrent ? "#fff" : colors.brand }}>
                      {j.juz}
                    </Text>
                    <Text style={{ fontSize: 10, color: isCurrent ? "#ffffffCC" : rc.trans, marginTop: 2, textAlign: "center" }}>
                      {j.nameEn}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Tafsir Modal (with dynamic selector tabs) */}
      <Modal
        visible={tafsirModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTafsirModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.tafsirModalContent, { backgroundColor: rc.bg, borderColor: colors.border }]}>
            <View style={styles.tafsirModalHeader}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Pressable
                  onPress={() => {
                    setActiveTafsirId(169);
                    openTafsirModal(tafsirRef.ayah, tafsirRef.arabic, tafsirRef.trans, 169);
                  }}
                  style={{
                    borderBottomWidth: activeTafsirId === 169 ? 2 : 0,
                    borderBottomColor: colors.brand,
                    paddingBottom: 4,
                  }}
                >
                  <Text style={[styles.tafsirModalTitle, { color: activeTafsirId === 169 ? colors.brand : rc.trans, fontSize: 15 }]}>
                    Ibn Kathir
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setActiveTafsirId(160);
                    openTafsirModal(tafsirRef.ayah, tafsirRef.arabic, tafsirRef.trans, 160);
                  }}
                  style={{
                    borderBottomWidth: activeTafsirId === 160 ? 2 : 0,
                    borderBottomColor: colors.brand,
                    paddingBottom: 4,
                  }}
                >
                  <Text style={[styles.tafsirModalTitle, { color: activeTafsirId === 160 ? colors.brand : rc.trans, fontSize: 15 }]}>
                    Al-Jalalayn
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={() => setTafsirModalVisible(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={rc.trans} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 13, color: colors.brand, fontWeight: "700", marginBottom: 8 }}>
                Surah {id} · Ayah {tafsirRef.ayah}
              </Text>
              <Text style={{ fontFamily: "AmiriBold", fontSize: 22, color: rc.arabic, textAlign: "right", marginBottom: 12, lineHeight: 36 }}>
                {tafsirRef.arabic}
              </Text>
              <Text style={{ fontSize: 14, color: rc.trans, marginBottom: 16, lineHeight: 22 }}>
                {tafsirRef.trans}
              </Text>

              <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

              {tafsirLoading ? (
                <ActivityIndicator color={colors.brand} style={{ marginVertical: 32 }} />
              ) : (
                <Text style={{ fontSize: 14, color: rc.arabic, lineHeight: 22, textAlign: "justify" }}>
                  {tafsirContent}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Grammar Breakdown / Word-by-Word & Verse Topics Modal */}
      <Modal
        visible={grammarModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGrammarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.tafsirModalContent, { backgroundColor: rc.bg, borderColor: colors.border }]}>
            <View style={styles.tafsirModalHeader}>
              <Text style={[styles.tafsirModalTitle, { color: colors.brand, fontSize: 17 }]}>
                Word Breakdown & Grammar
              </Text>
              <Pressable onPress={() => setGrammarModalVisible(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={rc.trans} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
              {selectedAyahForGrammar && (
                <>
                  <Text style={{ fontSize: 12, color: colors.brand, fontWeight: "700", marginBottom: 6 }}>
                    Surah {id} · Ayah {selectedAyahForGrammar.ayah}
                  </Text>
                  
                  {/* Thematic Topic Tags for this specific Verse */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {(() => {
                      const surahId = Number(id);
                      // Pull relevant tags dynamically from thematic datasets
                      const tags: string[] = [];
                      if (surahId === 1) tags.push("Tawhid (Monotheism)", "Supplication", "Guidance");
                      else if (surahId === 2) {
                        const aNum = selectedAyahForGrammar.ayah;
                        if (aNum === 255) tags.push("Ayat al-Kursi", "Allah's Attributes", "Protection");
                        else if (aNum >= 183 && aNum <= 187) tags.push("Fasting (Sawm)", "Ramadan", "Obedience");
                        else if (aNum >= 275) tags.push("Prohibition of Interest (Riba)", "Justice", "Finance");
                        else tags.push("Guidance", "Righteousness", "Faith");
                      } else {
                        // General contextual tags
                        tags.push("Faith (Iman)", "Reflection");
                      }
                      
                      return tags.map((tag, tIdx) => (
                        <View key={tIdx} style={{ backgroundColor: colors.brand + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                          <Text style={{ fontSize: 10, color: colors.brand, fontWeight: "600" }}>#{tag}</Text>
                        </View>
                      ));
                    })()}
                  </View>

                  <Text style={{ fontFamily: "AmiriBold", fontSize: 21, color: rc.arabic, textAlign: "right", marginBottom: 8, lineHeight: 34 }}>
                    {selectedAyahForGrammar.text}
                  </Text>
                  <Text style={{ fontSize: 13, color: rc.trans, marginBottom: 16, lineHeight: 20 }}>
                    {selectedAyahForGrammar.translation}
                  </Text>
                </>
              )}

              <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16 }} />

              {grammarLoading ? (
                <ActivityIndicator color={colors.brand} style={{ marginVertical: 32 }} />
              ) : (
                <View style={{ gap: 12 }}>
                  {grammarWords.map((w, wIdx) => (
                    <View
                      key={wIdx}
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: 10,
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: 8,
                      }}
                    >
                      {/* Arabic word token */}
                      <Text style={{ fontFamily: "AmiriBold", fontSize: 20, color: rc.arabic, width: "30%", textAlign: "right" }}>
                        {w.text}
                      </Text>

                      {/* Transliteration and English Meaning */}
                      <View style={{ width: "65%", alignItems: "flex-start" }}>
                        <Text style={{ fontSize: 13, color: colors.brand, fontWeight: "700" }}>
                          {w.transliteration}
                        </Text>
                        <Text style={{ fontSize: 13, color: rc.trans, marginTop: 2 }}>
                          {w.translation}
                        </Text>
                        {w.partOfSpeech && (
                          <Text style={{ fontSize: 10, color: colors.onSurfaceMuted, marginTop: 4, fontStyle: "italic" }}>
                            {w.partOfSpeech}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                  {grammarWords.length === 0 && (
                    <Text style={{ color: rc.trans, textAlign: "center", fontStyle: "italic", marginTop: 12 }}>
                      Morphological grammar data offline or unavailable for this verse.
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontFamily: "Amiri", fontSize: 18 },
  reciterBox: { marginHorizontal: theme.spacing.lg, borderRadius: theme.radius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  reciterHead: { fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, paddingHorizontal: 8 },
  reciterItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  reciterName: { fontSize: 14, fontWeight: "600" },
  bitrateRow: { flexDirection: "row", gap: 8, paddingHorizontal: 8, marginTop: 4 },
  bitrateBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  bitrateTxt: { fontWeight: "700", fontSize: 12 },
  currentReciter: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: theme.spacing.lg, paddingBottom: 6 },
  currentReciterTxt: { fontSize: 12, fontWeight: "600" },
  playAllRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  playAllBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill },
  playAllTxt: { fontWeight: "700" },
  bgHint: { fontSize: 11, flexShrink: 1, textAlign: "right" },
  ayah: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md },
  ayahHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ayahNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  ayahNumTxt: { fontWeight: "700" },
  arabic: { fontFamily: "NotoNaskhArabic", fontSize: 26, textAlign: "right", lineHeight: 48, marginTop: theme.spacing.md },
  translation: { marginTop: theme.spacing.md, lineHeight: 22 },
  translit: { fontSize: 14, fontStyle: "normal", lineHeight: 22, marginTop: 8 },
  juzModal: { position: "absolute", bottom: 0, left: 0, right: 0, maxHeight: "70%", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32 },
  juzModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#33445566" },
  juzModalTitle: { fontSize: 17, fontWeight: "700" },
  juzCell: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  tafsirModalContent: {
    width: "100%",
    height: "80%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  tafsirModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tafsirModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
});
