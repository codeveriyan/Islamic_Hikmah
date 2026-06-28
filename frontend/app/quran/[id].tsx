import { useEffect, useRef, useState } from "react";
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

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`).then((r) => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${id}/en.asad`).then((r) => r.json()),
      fetch(`https://api.alquran.cloud/v1/surah/${id}/ar.alafasy`).then((r) => r.json()),
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
  }, [id]);

  useEffect(() => {
    if (status?.didJustFinish) {
      setPlayingIdx(null);
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
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
          {arabic.map((a, i) => {
            const isPlaying = playingIdx === i && status?.playing;
            return (
              <View key={a.number} style={styles.ayah} testID={`ayah-${a.numberInSurah}`}>
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
  ayah: { backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md },
  ayahHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ayahNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.brand + "22", alignItems: "center", justifyContent: "center" },
  ayahNumTxt: { color: theme.colors.brand, fontWeight: "700" },
  arabic: { color: theme.colors.onSurface, fontFamily: "Amiri", fontSize: 26, textAlign: "right", lineHeight: 48, marginTop: theme.spacing.md },
  translation: { color: theme.colors.onSurfaceMuted, marginTop: theme.spacing.md, lineHeight: 22 },
});
