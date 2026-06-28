import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { theme } from "@/src/theme";
import { toggleFavourite } from "@/src/storage";

type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
  audio?: string;
};

const RECITERS = [
  { id: "ar.alafasy", name: "Mishary Rashid Alafasy" },
  { id: "ar.abdurrahmaansudais", name: "Sheikh Sudais" },
  { id: "ar.saadalghamdi", name: "Saad Al-Ghamdi" },
  { id: "ar.husary", name: "Mahmoud Khalil Al-Husary" },
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
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [reciter, setReciter] = useState<string>("ar.alafasy");
  const [continuous, setContinuous] = useState(false);
  const [showReciters, setShowReciters] = useState(false);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`).then((r) => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${id}/en.asad`).then((r) => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${id}/${reciter}`).then((r) => r.json()),
    ])
      .then(([a, t, au]) => {
        setArabic(a.data?.ayahs || []);
        setTrans(t.data?.ayahs || []);
        setAudio(au.data?.ayahs || []);
        setName(a.data?.englishName || "");
        setArName(a.data?.name || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, reciter]);

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
    if (audio.length === 0) return;
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

  const currentReciterName = RECITERS.find((r) => r.id === reciter)?.name;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="surah-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>{arName}</Text>
        </View>
        <Pressable onPress={() => setShowReciters((s) => !s)} hitSlop={10} testID="reciter-toggle">
          <MaterialCommunityIcons name="account-music" size={26} color={theme.colors.brand} />
        </Pressable>
      </View>

      {showReciters ? (
        <View style={styles.reciterBox} testID="reciter-list">
          <Text style={styles.reciterHead}>Choose Qari</Text>
          {RECITERS.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => {
                setReciter(r.id);
                setShowReciters(false);
                stopAll();
              }}
              style={[styles.reciterItem, reciter === r.id && styles.reciterActive]}
              testID={`reciter-${r.id}`}
            >
              <MaterialCommunityIcons
                name={reciter === r.id ? "check-circle" : "circle-outline"}
                size={20}
                color={reciter === r.id ? theme.colors.brand : theme.colors.onSurfaceMuted}
              />
              <Text style={styles.reciterName}>{r.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.currentReciter}>
          <MaterialCommunityIcons name="microphone" size={14} color={theme.colors.onSurfaceMuted} />
          <Text style={styles.currentReciterTxt}>{currentReciterName}</Text>
        </View>
      )}

      <View style={styles.playAllRow}>
        <Pressable
          onPress={continuous ? stopAll : playAll}
          style={styles.playAllBtn}
          testID="play-all-btn"
        >
          <MaterialCommunityIcons
            name={continuous ? "stop" : "play"}
            size={20}
            color={theme.colors.onBrandPrimary}
          />
          <Text style={styles.playAllTxt}>
            {continuous ? "Stop" : "Play Full Surah"}
          </Text>
        </Pressable>
        <Text style={styles.bgHint}>🔊 Plays in background</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
          {arabic.map((a, i) => {
            const isPlaying = playingIdx === i && status?.playing;
            return (
              <View key={a.number} style={[styles.ayah, isPlaying && styles.ayahActive]} testID={`ayah-${a.numberInSurah}`}>
                <View style={styles.ayahHead}>
                  <View style={styles.ayahNum}>
                    <Text style={styles.ayahNumTxt}>{a.numberInSurah}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Pressable onPress={() => playAyah(i)} hitSlop={10} testID={`play-${a.numberInSurah}`}>
                      <MaterialCommunityIcons
                        name={isPlaying ? "pause-circle" : "play-circle"}
                        size={28}
                        color={theme.colors.brand}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        toggleFavourite({
                          id: `ayah-${id}-${a.numberInSurah}`,
                          type: "ayah",
                          title: `${name} · ${a.numberInSurah}`,
                          arabic: a.text,
                          translation: trans[i]?.text,
                          addedAt: Date.now(),
                        })
                      }
                      hitSlop={10}
                      testID={`fav-ayah-${a.numberInSurah}`}
                    >
                      <MaterialCommunityIcons name="heart-outline" size={24} color={theme.colors.onSurfaceMuted} />
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.arabic}>{a.text}</Text>
                <Text style={styles.translation}>{trans[i]?.text}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { color: theme.colors.onSurface, fontSize: 18, fontWeight: "700" },
  subtitle: { color: theme.colors.brand, fontFamily: "Amiri", fontSize: 18 },
  reciterBox: { marginHorizontal: theme.spacing.lg, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.lg, padding: theme.spacing.md, marginBottom: theme.spacing.sm },
  reciterHead: { color: theme.colors.onSurfaceMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, paddingHorizontal: 8 },
  reciterItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  reciterActive: { backgroundColor: theme.colors.brand + "15", borderRadius: 8 },
  reciterName: { color: theme.colors.onSurface, fontSize: 14, fontWeight: "600" },
  currentReciter: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: theme.spacing.lg, paddingBottom: 6 },
  currentReciterTxt: { color: theme.colors.onSurfaceMuted, fontSize: 12, fontWeight: "600" },
  playAllRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  playAllBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.colors.brand, paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.radius.pill },
  playAllTxt: { color: theme.colors.onBrandPrimary, fontWeight: "700" },
  bgHint: { color: theme.colors.onSurfaceMuted, fontSize: 11 },
  ayah: { backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md },
  ayahActive: { borderWidth: 1, borderColor: theme.colors.brand },
  ayahHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ayahNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.brand + "22", alignItems: "center", justifyContent: "center" },
  ayahNumTxt: { color: theme.colors.brand, fontWeight: "700" },
  arabic: { color: theme.colors.onSurface, fontFamily: "Amiri", fontSize: 26, textAlign: "right", lineHeight: 48, marginTop: theme.spacing.md },
  translation: { color: theme.colors.onSurfaceMuted, marginTop: theme.spacing.md, lineHeight: 22 },
});
