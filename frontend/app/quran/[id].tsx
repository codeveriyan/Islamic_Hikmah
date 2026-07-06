import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal, FlatList, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { toggleFavourite, getFavourites, addQuranBookmark, removeQuranBookmark, getQuranBookmarks, saveQuranLastRead } from "@/src/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import quranData from "@/src/data/quran/quranData.json";
import { JUZ_DATA, getJuzForAyah } from "@/src/data/juzData";

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

// FIX: Only verified-working alquran.cloud audio editions.
// "ar.saadalghamdi" is NOT a real edition on this API — that's why it silently failed.
// Replaced with other confirmed-working reciters instead.
const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Sheikh Sudais" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary" },
  { id: "ar.minshawi", name: "Mohamed Siddiq Al-Minshawi" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit (Murattal)" },
] as const;

// Compute the global 1-based Quran ayah number for a given surah + ayah-in-surah.
// Uses the local bundled dataset so no network call is needed.
const getGlobalAyahNumber = (surahNumber: number, ayahNumberInSurah: number): number => {
  let globalNum = 0;
  for (let s = 1; s < surahNumber; s++) {
    const surah = QURAN.find((item) => item.number === s);
    if (surah) globalNum += surah.totalAyahs;
  }
  return globalNum + ayahNumberInSurah;
};

// Return the correct CDN bitrate for a given reciter.
// Sudais and Abdul Basit are only available at 192 kbps; all others at 128 kbps.
const getReciterBitrate = (reciterId: string): number =>
  (reciterId === "ar.abdurrahmaansudais" || reciterId === "ar.abdulbasitmurattal") ? 192 : 128;

export default function SurahDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [arabic, setArabic] = useState<Ayah[]>([]);
  const [trans, setTrans] = useState<Ayah[]>([]);
  const [audio, setAudio] = useState<Ayah[]>([]);
  const [name, setName] = useState("");
  const [arName, setArName] = useState("");
  const [loading, setLoading] = useState(true);
  const [audioErr, setAudioErr] = useState(false);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [reciter, setReciter] = useState<string>("ar.alafasy");
  const [continuous, setContinuous] = useState(false);
  const [showReciters, setShowReciters] = useState(false);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [fontType, setFontType] = useState<"indopak" | "uthmani" | "naskh">("indopak");
  const [fontSize, setFontSize] = useState<number>(24);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [showTransliteration, setShowTransliteration] = useState<boolean>(true);
  const [translit, setTranslit] = useState<Ayah[]>([]);

  const player = useAudioPlayer(null);
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

  const openTafsirModal = useCallback(async (ayahNum: number, arabicText: string, transText: string) => {
    setTafsirRef({ surah: Number(id), ayah: ayahNum, arabic: arabicText, trans: transText });
    setTafsirModalVisible(true);
    setTafsirLoading(true);
    setTafsirContent("");

    try {
      const cacheKey = `hikmah:tafsir:${id}:${ayahNum}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setTafsirContent(cached);
        setTafsirLoading(false);
        return;
      }

      const response = await fetch(`https://api.quran.com/api/v4/tafsirs/169/by_ayah/${id}:${ayahNum}`);
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
  }, [id]);

  // Scroll ref for auto-scrolling to highlighted ayah
  const scrollRef = useRef<ScrollView>(null);
  const ayahYPositions = useRef<Record<number, number>>({});

  const [audioRequested, setAudioRequested] = useState(false);

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
    setAudioRequested(false); // reset audio state on surah change

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

      const englishTranslit = surah.ayahs.map((a) => ({
        number: a.numberInSurah,
        numberInSurah: a.numberInSurah,
        text: a.transliteration,
      }));

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

          // Fetch translations dynamically if not cached.
          // All chunks are fired in PARALLEL (Promise.all) instead of sequentially,
          // so a 286-ayah surah goes from ~30 sequential calls to 15 parallel pairs.
          const fetchQuranTranslations = async () => {
            try {
              const chunkSize = 20;
              const transResults: Ayah[] = [...englishTrans];
              const translitResults: Ayah[] = [...englishTranslit];
              const chunkCount = Math.ceil(englishTrans.length / chunkSize);

              const translateChunk = async (chunkIdx: number) => {
                if (!active) return;
                const startIdx = chunkIdx * chunkSize;
                const endIdx = Math.min(startIdx + chunkSize, englishTrans.length);
                const transSlice = englishTrans.slice(startIdx, endIdx);
                const translitSlice = englishTranslit.slice(startIdx, endIdx);

                const transCombined = transSlice.map((a) => a.text).join(" || ");
                const translitCombined = translitSlice.map((a) => a.text).join(" || ");

                // Fire both fetches for this chunk simultaneously
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

              // Run all chunks in parallel
              await Promise.all(
                Array.from({ length: chunkCount }, (_, i) => translateChunk(i))
              );

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

  // Effect 2: Generate audio URLs locally using the Islamic Network CDN.
  // Previously this fetched the full surah metadata from api.alquran.cloud on every
  // screen open, adding a 1-3 s network round-trip before any audio was playable.
  // Now we compute the CDN URL directly from the bundled QURAN dataset — instant,
  // offline-friendly, and 100% identical to what the API would have returned.
  useEffect(() => {
    if (!audioRequested) return;
    const surahId = Number(id);
    const surah = QURAN.find((s) => s.number === surahId);
    if (surah) {
      const bitrate = getReciterBitrate(reciter);
      const generatedAudio = surah.ayahs.map((a) => ({
        number: a.numberInSurah,
        numberInSurah: a.numberInSurah,
        text: a.arabic,
        audio: `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${getGlobalAyahNumber(surahId, a.numberInSurah)}.mp3`,
      }));
      setAudio(generatedAudio);
      setAudioErr(false);
    } else {
      setAudio([]);
      setAudioErr(true);
    }
  }, [id, reciter, audioRequested]);

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

  // ── Dual-player pre-buffer system ──────────────────────────────────────────
  // Root cause of the gaps: player.replace() on every ayah transition destroys
  // the current audio session, starts a new network request, waits for buffering,
  // and only then plays — creating a 0.5–2s dead silence between ayahs.
  //
  // Fix: use TWO expo-audio players (A and B). While player A plays ayah N,
  // player B silently pre-loads ayah N+1. When A finishes, we immediately start
  // B (which is already buffered) and use A to pre-load N+2. The swap is
  // instant since the next URL is already in the native audio buffer.
  //
  // playerRef tracks which of the two players is currently "active".
  const playerB = useAudioPlayer(null);
  const statusB = useAudioPlayerStatus(playerB);

  // 0 = player (A) is active, 1 = playerB (B) is active
  const activePlayerRef = useRef<0 | 1>(0);
  const continuousRef = useRef(false);
  const playingIdxRef = useRef<number | null>(null);
  const audioRef = useRef<Ayah[]>([]);

  // Keep refs in sync with state so effect closures always see current values
  useEffect(() => { continuousRef.current = continuous; }, [continuous]);
  useEffect(() => { playingIdxRef.current = playingIdx; }, [playingIdx]);
  useEffect(() => { audioRef.current = audio; }, [audio]);

  // Pre-load the next ayah URL into the inactive player while the current plays
  const preloadNext = useCallback((currentIdx: number) => {
    const nextIdx = currentIdx + 1;
    const nextUrl = audioRef.current[nextIdx]?.audio;
    if (!nextUrl) return;
    const inactive = activePlayerRef.current === 0 ? playerB : player;
    try {
      inactive.replace({ uri: nextUrl });
      // Don't call play() — just buffer it silently
    } catch {}
  }, [player, playerB]);

  // Handle finish for player A
  useEffect(() => {
    if (!status?.didJustFinish) return;
    if (!continuousRef.current) { setPlayingIdx(null); return; }
    const current = playingIdxRef.current;
    if (current === null) return;
    const next = current + 1;
    if (next >= audioRef.current.length) {
      setPlayingIdx(null);
      setContinuous(false);
      return;
    }
    // Player B was pre-buffering next ayah — swap and play it immediately
    activePlayerRef.current = 1;
    try { playerB.play(); } catch {}
    setPlayingIdx(next);
    // Pre-load next+1 into player A
    preloadNext(next);
  }, [status?.didJustFinish]);

  // Handle finish for player B
  useEffect(() => {
    if (!statusB?.didJustFinish) return;
    if (!continuousRef.current) { setPlayingIdx(null); return; }
    const current = playingIdxRef.current;
    if (current === null) return;
    const next = current + 1;
    if (next >= audioRef.current.length) {
      setPlayingIdx(null);
      setContinuous(false);
      return;
    }
    // Player A was pre-buffering next ayah — swap and play it immediately
    activePlayerRef.current = 0;
    try { player.play(); } catch {}
    setPlayingIdx(next);
    // Pre-load next+1 into player B
    preloadNext(next);
  }, [statusB?.didJustFinish]);

  // Auto-scroll to the currently playing ayah
  useEffect(() => {
    if (playingIdx !== null && ayahYPositions.current[playingIdx] !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, ayahYPositions.current[playingIdx] - 100), animated: true });
    }
  }, [playingIdx]);

  const [audioLoading, setAudioLoading] = useState(false);

  // Get whichever player is currently active
  const activePlayer = useCallback(
    () => (activePlayerRef.current === 0 ? player : playerB),
    [player, playerB]
  );

  const playAyah = useCallback((i: number) => {
    // If audio not yet loaded, trigger the fetch first
    if (!audioRequested) {
      setAudioLoading(true);
      setAudioRequested(true);
      setPendingPlayIdx(i);
      return;
    }
    const url = audio[i]?.audio;
    if (!url) return;
    // Toggle pause/resume if same ayah
    if (playingIdx === i) {
      const ap = activePlayer();
      if (status?.playing || statusB?.playing) { try { ap.pause(); } catch {} }
      else { try { ap.play(); } catch {} }
      return;
    }
    // New ayah — use player A, reset active ref
    activePlayerRef.current = 0;
    try {
      player.replace({ uri: url });
      player.play();
    } catch {}
    setPlayingIdx(i);
    setContinuous(false);
    // Pre-buffer next ayah into player B immediately
    preloadNext(i);
    // Save last played position for Resume
    const surahId = Number(id);
    const surahData = QURAN.find((s) => s.number === surahId);
    if (surahData) {
      saveQuranLastRead({
        surahNumber: surahId,
        surahName: surahData.name,
        ayahNumber: audio[i]?.numberInSurah ?? (i + 1),
      }).catch(() => {});
    }
  }, [audioRequested, audio, playingIdx, status, statusB, player, playerB, preloadNext, id]);

  const [pendingPlayIdx, setPendingPlayIdx] = useState<number | null>(null);

  // Once audio loads after a deferred request, auto-play the pending index
  useEffect(() => {
    if (audio.length > 0 && pendingPlayIdx !== null) {
      setAudioLoading(false);
      const url = audio[pendingPlayIdx]?.audio;
      if (url) {
        activePlayerRef.current = 0;
        try {
          player.replace({ uri: url });
          player.play();
        } catch {}
        setPlayingIdx(pendingPlayIdx);
        // Pre-buffer the next ayah if in continuous mode
        preloadNext(pendingPlayIdx);
      }
      setPendingPlayIdx(null);
    }
  }, [audio]);

  const playAll = useCallback(() => {
    if (!audioRequested) {
      setAudioLoading(true);
      setAudioRequested(true);
      setPendingPlayIdx(0);
      setContinuous(true);
      return;
    }
    if (audio.length === 0 || !audio[0]?.audio) return;
    // Start from ayah 0 on player A
    activePlayerRef.current = 0;
    try {
      player.replace({ uri: audio[0].audio });
      player.play();
    } catch {}
    setPlayingIdx(0);
    setContinuous(true);
    // Immediately pre-buffer ayah 1 into player B
    preloadNext(0);
  }, [audioRequested, audio, player, preloadNext]);

  const stopAll = useCallback(() => {
    try { player.pause(); } catch {}
    try { playerB.pause(); } catch {}
    setPlayingIdx(null);
    setContinuous(false);
  }, [player, playerB]);

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

  const currentReciterName = RECITERS.find((r) => r.id === reciter)?.name;

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
          {RECITERS.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                setReciter(r.id);
                setShowReciters(false);
                stopAll();
              }}
              style={[styles.reciterItem, reciter === r.id && { backgroundColor: colors.brand + "15", borderRadius: 8 }]}
              testID={`reciter-${r.id}`}
            >
              <MaterialCommunityIcons
                name={reciter === r.id ? "check-circle" : "circle-outline"}
                size={20}
                color={reciter === r.id ? colors.brand : colors.onSurfaceMuted}
              />
              <Text style={[styles.reciterName, { color: colors.onSurface }]}>{r.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.currentReciter}>
          <MaterialCommunityIcons name="microphone" size={14} color={colors.onSurfaceMuted} />
          <Text style={[styles.currentReciterTxt, { color: colors.onSurfaceMuted }]}>{currentReciterName}</Text>
        </View>
      )}

      <View style={styles.playAllRow}>
        <Pressable
          onPress={continuous ? stopAll : playAll}
          style={[styles.playAllBtn, { backgroundColor: audioErr ? colors.onSurfaceMuted : colors.brand }]}
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
            {audioLoading ? "Loading audio…" : continuous ? "Stop" : "Play Full Surah"}
          </Text>
        </Pressable>
        {audioErr ? (
          <Text style={[styles.bgHint, { color: theme.colors.error }]}>⚠️ Audio unavailable for this Qari</Text>
        ) : (
          <Text style={[styles.bgHint, { color: colors.onSurfaceMuted }]}>🔊 Plays in background</Text>
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
                  {a.text}
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

      {/* Tafsir Ibn Kathir Modal */}
      <Modal
        visible={tafsirModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTafsirModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.tafsirModalContent, { backgroundColor: rc.bg, borderColor: colors.border }]}>
            <View style={styles.tafsirModalHeader}>
              <Text style={[styles.tafsirModalTitle, { color: rc.arabic }]}>Tafsir Ibn Kathir</Text>
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
