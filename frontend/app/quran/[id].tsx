import { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { toggleFavourite, getFavourites } from "@/src/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

  useEffect(() => {
    setLoading(true);
    setAudioErr(false);

    // Arabic text, transliteration, and English translation always come from the
    // bundled offline dataset — no network required to read the Quran.
    const surahId = Number(id);
    const surah = QURAN.find((s) => s.number === surahId);

    if (surah) {
      setName(surah.name);
      setArName(surah.arabicName);
      setArabic(
        surah.ayahs.map((a) => ({ number: a.numberInSurah, numberInSurah: a.numberInSurah, text: a.arabic }))
      );
      setTranslit(
        surah.ayahs.map((a) => ({ number: a.numberInSurah, numberInSurah: a.numberInSurah, text: a.transliteration }))
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
          if (cached) {
            try {
              const { trans: cachedTrans, translit: cachedTranslit } = JSON.parse(cached);
              if (cachedTrans && cachedTranslit) {
                setTrans(cachedTrans);
                setTranslit(cachedTranslit);
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
                const translatedTransParts = translatedTransStr.split(/\s*\|\|\s*/);

                // Translate Transliteration
                const resTranslit = await fetch(
                  `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(translitCombined)}`
                );
                const dataTranslit = await resTranslit.json();
                const translatedTranslitStr = dataTranslit?.[0]?.map((x: any) => x[0]).join("") || translitCombined;
                const translatedTranslitParts = translatedTranslitStr.split(/\s*\|\|\s*/);

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

              setTrans(transResults);
              setTranslit(translitResults);
              
              // Save to cache
              AsyncStorage.setItem(cacheKey, JSON.stringify({
                trans: transResults,
                translit: translitResults
              })).catch(() => {});

            } catch (e) {
              console.error("Failed to translate Quran:", e);
            }
          };

          fetchQuranTranslations();
        });
      } else {
        setTrans(englishTrans);
        setTranslit(englishTranslit);
      }
    }

    setLoading(false);

    // Audio recitation is streamed from the network — this is the one part of the
    // Quran screen that genuinely needs a connection, since bundling every reciter's
    // full audio would make the app enormous. Text reading works with no network.
    fetch(`https://api.alquran.cloud/v1/surah/${id}/${reciter}`)
      .then((r) => r.json())
      .then((au) => {
        const ayahs = au.data?.ayahs || [];
        setAudio(ayahs);
        setAudioErr(ayahs.length === 0 || !ayahs[0]?.audio);
      })
      .catch(() => setAudioErr(true));
  }, [id, reciter, language]);

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
      if (continuous && playingIdx !== null && playingIdx + 1 < audio.length) {
        const next = playingIdx + 1;
        const url = audio[next]?.audio;
        if (url) {
          player.replace({ uri: url });
          player.play();
          setPlayingIdx(next);
          return;
        }
      }
      setPlayingIdx(null);
      setContinuous(false);
    }
  }, [status?.didJustFinish]);

  const playAyah = (i: number) => {
    const url = audio[i]?.audio;
    if (!url) return;
    if (playingIdx === i && status?.playing) {
      player.pause();
      setPlayingIdx(null);
      return;
    }
    player.replace({ uri: url });
    player.play();
    setPlayingIdx(i);
  };

  const playAll = () => {
    if (audio.length === 0 || !audio[0]?.audio) return;
    setContinuous(true);
    const url = audio[0]?.audio;
    if (!url) return;
    player.replace({ uri: url });
    player.play();
    setPlayingIdx(0);
  };

  const stopAll = () => {
    player.pause();
    setContinuous(false);
    setPlayingIdx(null);
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
            {continuous ? "Stop" : "Play Full Surah"}
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
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
          {arabic.map((a, i) => {
            const isPlaying = playingIdx === i && status?.playing;
            const favId = `ayah-${id}-${a.numberInSurah}`;
            const isFav = favIds.has(favId);
            return (
              <View
                key={a.number}
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
          })}
        </ScrollView>
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
  bgHint: { fontSize: 11, flexShrink: 1, textAlign: "right" },
  ayah: { padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md },
  ayahHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ayahNum: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  ayahNumTxt: { fontWeight: "700" },
  arabic: { fontFamily: "Amiri", fontSize: 26, textAlign: "right", lineHeight: 48, marginTop: theme.spacing.md },
  translation: { marginTop: theme.spacing.md, lineHeight: 22 },
  translit: { fontSize: 14, fontStyle: "normal", lineHeight: 22, marginTop: 8 },
});
