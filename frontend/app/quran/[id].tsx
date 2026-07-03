import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { toggleFavourite, getFavourites } from "@/src/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useIsFocused } from "@react-navigation/native";
import quranData from "@/src/data/quran/quranData.json";

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

const getGlobalAyahNumber = (surahNumber: number, ayahNumberInSurah: number): number => {
  let globalNum = 0;
  for (let s = 1; s < surahNumber; s++) {
    const surah = QURAN.find((item) => item.number === s);
    if (surah) {
      globalNum += surah.totalAyahs;
    }
  }
  return globalNum + ayahNumberInSurah;
};

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

  // Speed and repeats states
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [repeatTimes, setRepeatTimes] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(1);

  const flatListRef = useRef<FlatList>(null);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const { colors, language } = useTheme();

  // Speed sync effect
  useEffect(() => {
    if (player) {
      player.setPlaybackRate(playbackSpeed);
    }
  }, [playbackSpeed, playingIdx]);

  // Auto-scroll effect
  useEffect(() => {
    if (playingIdx !== null && flatListRef.current) {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: playingIdx,
            animated: true,
            viewPosition: 0.3,
          });
        } catch {}
      }, 100);
    }
  }, [playingIdx]);

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

          // Fetch translations dynamically if not cached
          const fetchQuranTranslations = async () => {
            try {
              const chunkSize = 20;
              const transResults: Ayah[] = [...englishTrans];
              const translitResults: Ayah[] = [...englishTranslit];

              const chunkCount = Math.ceil(englishTrans.length / chunkSize);
              for (let chunkIdx = 0; chunkIdx < chunkCount; chunkIdx++) {
                if (!active) return;
                const startIdx = chunkIdx * chunkSize;
                const endIdx = Math.min(startIdx + chunkSize, englishTrans.length);

                const transSlice = englishTrans.slice(startIdx, endIdx);
                const translitSlice = englishTranslit.slice(startIdx, endIdx);

                const transCombined = transSlice.map(a => a.text).join(" || ");
                const translitCombined = translitSlice.map(a => a.text).join(" || ");

                // Translate Translation
                const resTrans = await fetch(
                  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(transCombined)}`
                );
                const dataTrans = await resTrans.json();
                const translatedTransStr = dataTrans?.[0]?.map((x: any) => x[0]).join("") || transCombined;
                let translatedTransParts = translatedTransStr.split(/\s*\|\|\s*/);

                // Validation: Mismatched delimiters fallback to individual ayah translation
                if (translatedTransParts.length !== transSlice.length) {
                  translatedTransParts = [];
                  for (const ayah of transSlice) {
                    if (!active) return;
                    try {
                      const res = await fetch(
                        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(ayah.text)}`
                      );
                      const data = await res.json();
                      const txt = data?.[0]?.map((x: any) => x[0]).join("") || ayah.text;
                      translatedTransParts.push(txt);
                    } catch {
                      translatedTransParts.push(ayah.text);
                    }
                  }
                }

                // Translate Transliteration
                const resTranslit = await fetch(
                  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(translitCombined)}`
                );
                const dataTranslit = await resTranslit.json();
                const translatedTranslitStr = dataTranslit?.[0]?.map((x: any) => x[0]).join("") || translitCombined;
                let translatedTranslitParts = translatedTranslitStr.split(/\s*\|\|\s*/);

                // Validation: Mismatched delimiters fallback to individual transliteration translation
                if (translatedTranslitParts.length !== translitSlice.length) {
                  translatedTranslitParts = [];
                  for (const ayah of translitSlice) {
                    if (!active) return;
                    try {
                      const res = await fetch(
                        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(ayah.text)}`
                      );
                      const data = await res.json();
                      const txt = data?.[0]?.map((x: any) => x[0]).join("") || ayah.text;
                      translatedTranslitParts.push(txt);
                    } catch {
                      translatedTranslitParts.push(ayah.text);
                    }
                  }
                }

                for (let offset = 0; offset < transSlice.length; offset++) {
                  const globalIdx = startIdx + offset;
                  if (translatedTransParts[offset]) {
                    transResults[globalIdx] = {
                      ...transResults[globalIdx],
                      text: translatedTransParts[offset].trim()
                    };
                  }
                  if (translatedTranslitParts[offset]) {
                    translitResults[globalIdx] = {
                      ...translitResults[globalIdx],
                      text: translatedTranslitParts[offset].trim()
                    };
                  }
                }
              }

              if (!active) return;
              setTrans(transResults);
              setTranslit(translitResults);
              setLoading(false);

              // Save to cache
              AsyncStorage.setItem(cacheKey, JSON.stringify({
                trans: transResults,
                translit: translitResults
              })).catch(() => {});

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

  // Effect 2: Load audio recitation streams from local direct CDN URL generation
  useEffect(() => {
    const surahId = Number(id);
    const surah = QURAN.find((s) => s.number === surahId);
    if (surah) {
      const generatedAudio = surah.ayahs.map((a) => {
        const globalNum = getGlobalAyahNumber(surahId, a.numberInSurah);
        const bitrate = (reciter === "ar.abdulbasitmurattal" || reciter === "ar.abdulbasitmurattal") ? 192 : 128;
        return {
          number: a.numberInSurah,
          numberInSurah: a.numberInSurah,
          text: a.arabic,
          audio: `https://cdn.islamic.network/quran/audio/${bitrate}/${reciter}/${globalNum}.mp3`,
        };
      });
      setAudio(generatedAudio);
      setAudioErr(false);
    } else {
      setAudio([]);
      setAudioErr(true);
    }
  }, [id, reciter]);

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
    }
  }, [isFocused]);

  useEffect(() => {
    if (status?.didJustFinish) {
      if (playingIdx !== null) {
        if (currentRepeat < repeatTimes) {
          const url = audio[playingIdx]?.audio;
          if (url) {
            setCurrentRepeat((c) => c + 1);
            player.replace({ uri: url });
            player.setPlaybackRate(playbackSpeed);
            player.play();
            return;
          }
        }
        if (continuous && playingIdx + 1 < audio.length) {
          const next = playingIdx + 1;
          const url = audio[next]?.audio;
          if (url) {
            setCurrentRepeat(1);
            player.replace({ uri: url });
            player.setPlaybackRate(playbackSpeed);
            player.play();
            setPlayingIdx(next);
            return;
          }
        }
      }
      setPlayingIdx(null);
      setContinuous(false);
      setCurrentRepeat(1);
    }
  }, [status?.didJustFinish, playingIdx, currentRepeat, repeatTimes, continuous, audio, player, playbackSpeed]);

  const playAyah = (i: number) => {
    const url = audio[i]?.audio;
    if (!url) return;
    if (playingIdx === i && status?.playing) {
      player.pause();
      setPlayingIdx(null);
      return;
    }
    player.replace({ uri: url });
    player.setPlaybackRate(playbackSpeed);
    player.play();
    setPlayingIdx(i);
    setCurrentRepeat(1);
  };

  const playAll = () => {
    if (audio.length === 0 || !audio[0]?.audio) return;
    setContinuous(true);
    const url = audio[0]?.audio;
    if (!url) return;
    player.replace({ uri: url });
    player.setPlaybackRate(playbackSpeed);
    player.play();
    setPlayingIdx(0);
    setCurrentRepeat(1);
  };

  const stopAll = () => {
    player.pause();
    setContinuous(false);
    setPlayingIdx(null);
    setCurrentRepeat(1);
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="surah-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{name}</Text>
          <Text style={[styles.subtitle, { color: colors.brand }]}>{arName}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => setShowReciters((s) => !s)} hitSlop={10} testID="reciter-toggle">
            <MaterialCommunityIcons name="account-music" size={26} color={colors.brand} />
          </Pressable>
          <Pressable onPress={() => router.push("/quran/personalise")} hitSlop={10} style={{ padding: 2 }}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            onPress={continuous ? stopAll : playAll}
            style={[styles.playAllBtn, { backgroundColor: audioErr ? colors.onSurfaceMuted : colors.brand }]}
            disabled={audioErr}
            testID="play-all-btn"
          >
            <MaterialCommunityIcons
              name={continuous ? "stop" : "play"}
              size={20}
              color={colors.onBrandPrimary}
            />
            <Text style={[styles.playAllTxt, { color: colors.onBrandPrimary }]}>
              {continuous ? "Stop" : "Play Surah"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setPlaybackSpeed((s) => (s === 1.0 ? 1.25 : s === 1.25 ? 1.5 : 1.0));
            }}
            style={[styles.badgeBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Text style={[styles.badgeTxt, { color: colors.brand }]}>{playbackSpeed}x</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setRepeatTimes((r) => (r === 1 ? 2 : r === 2 ? 3 : 1));
            }}
            style={[styles.badgeBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <Text style={[styles.badgeTxt, { color: colors.brand }]}>🔂 {repeatTimes}x</Text>
          </Pressable>
        </View>
        {audioErr ? (
          <Text style={[styles.bgHint, { color: theme.colors.error }]}>⚠️ Audio unavailable</Text>
        ) : (
          <Text style={[styles.bgHint, { color: colors.onSurfaceMuted }]}>🔊 Background Play</Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={arabic}
          keyExtractor={(a) => String(a.number)}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}
          getItemLayout={(data, index) => (
            { length: 180, offset: 180 * index, index }
          )}
          renderItem={({ item: a, index: i }) => {
            const isPlaying = playingIdx === i && status?.playing;
            const favId = `ayah-${id}-${a.numberInSurah}`;
            const isFav = favIds.has(favId);
            return (
              <View
                style={[
                  styles.ayah,
                  { backgroundColor: colors.surfaceSecondary },
                  isPlaying && { borderWidth: 1, borderColor: colors.brand },
                ]}
                testID={`ayah-${a.numberInSurah}`}
              >
                <View style={styles.ayahHead}>
                  <View style={[styles.ayahNum, { backgroundColor: colors.brand + "22" }]}>
                    <Text style={[styles.ayahNumTxt, { color: colors.brand }]}>{a.numberInSurah}</Text>
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
                      onPress={() => onFavAyah(i, a)}
                      hitSlop={10}
                      testID={`fav-ayah-${a.numberInSurah}`}
                    >
                      <MaterialCommunityIcons
                        name={isFav ? "heart" : "heart-outline"}
                        size={24}
                        color={isFav ? theme.colors.error : colors.onSurfaceMuted}
                      />
                    </Pressable>
                  </View>
                </View>
                <Text
                  style={[
                    styles.arabic,
                    {
                      color: colors.onSurface,
                      fontFamily: fontType === "indopak" ? "AmiriBold" : fontType === "uthmani" ? "Amiri" : "System",
                      fontSize: fontSize,
                      lineHeight: fontSize * 1.8,
                    },
                  ]}
                >
                  {a.text}
                </Text>
                {showTransliteration && (
                  <Text style={[styles.translit, { color: colors.brand }]}>
                    {translit[i]?.text}
                  </Text>
                )}
                {showTranslation && (
                  <Text style={[styles.translation, { color: colors.onSurfaceMuted }]}>{trans[i]?.text}</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  badgeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTxt: {
    fontSize: 12,
    fontWeight: "700",
  },
  bgHint: { fontSize: 11, flexShrink: 1, textAlign: "right" },
  ayah: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md },
  ayahHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ayahNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  ayahNumTxt: { fontWeight: "700" },
  arabic: { fontFamily: "Amiri", fontSize: 26, textAlign: "right", lineHeight: 48, marginTop: theme.spacing.md },
  translation: { marginTop: theme.spacing.md, lineHeight: 22 },
  translit: { fontSize: 14, fontStyle: "normal", lineHeight: 22, marginTop: 8 },
});
