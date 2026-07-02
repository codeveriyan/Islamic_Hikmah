import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { getCategory } from "@/src/data/duas";
import { toggleFavourite, getFavourites, Favourite } from "@/src/storage";
import { transliterateToTamil } from "@/src/transliterator";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

export default function DuaCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { colors, language } = useTheme();
  const cat = getCategory(String(category));
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  
  const [playingId, setPlayingId] = useState<string | null>(null);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const webAudioInstance = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    getFavourites().then((fs) => setFavIds(new Set(fs.map((f) => f.id))));
  }, []);

  useEffect(() => {
    if (status?.didJustFinish) {
      setPlayingId(null);
    }
  }, [status?.didJustFinish]);

  useEffect(() => {
    return () => {
      if (Platform.OS === "web") {
        if (webAudioInstance.current) {
          webAudioInstance.current.pause();
        }
        window.speechSynthesis?.cancel();
      } else {
        player.pause();
      }
    };
  }, [player]);

  const fallbackToSpeechSynthesis = (text: string, id: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar";
      utterance.rate = 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find((v: any) => v.lang.startsWith("ar"));
      if (arabicVoice) utterance.voice = arabicVoice;
      
      utterance.onstart = () => setPlayingId(id);
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingId(null);
    }
  };

  const playDua = async (d: any) => {
    if (playingId === d.id) {
      if (Platform.OS === "web") {
        if (webAudioInstance.current) {
          webAudioInstance.current.pause();
        }
        window.speechSynthesis?.cancel();
      } else {
        player.pause();
      }
      setPlayingId(null);
      return;
    }

    const cleanText = d.arabic.replace(/[^\u0600-\u06FF\s]/g, "");

    if (Platform.OS === "web") {
      if (webAudioInstance.current) {
        webAudioInstance.current.pause();
      }
      window.speechSynthesis?.cancel();
      
      try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
        const audio = new Audio();
        (audio as any).referrerPolicy = "no-referrer";
        audio.src = url;
        webAudioInstance.current = audio;

        audio.onplay = () => {
          setPlayingId(d.id);
        };
        audio.onended = () => {
          setPlayingId(null);
        };
        audio.onerror = () => {
          console.warn("Audio element failed, falling back to SpeechSynthesis");
          fallbackToSpeechSynthesis(cleanText, d.id);
        };

        await audio.play();
      } catch (err) {
        console.warn("Audio play promise rejected, trying SpeechSynthesis fallback:", err);
        fallbackToSpeechSynthesis(cleanText, d.id);
      }
    } else {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      player.replace({ uri: url });
      player.play();
      setPlayingId(d.id);
    }
  };

  useEffect(() => {
    if (language !== "ta" || !cat) {
      setTranslatedTexts({});
      return;
    }
    const fetchTranslations = async () => {
      const newTranslations: Record<string, string> = {};
      try {
        await Promise.all(
          cat.duas.map(async (d) => {
            const res = await fetch(
              `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ta&dt=t&q=${encodeURIComponent(d.translation)}`
            );
            const data = await res.json();
            const translatedPart = data?.[0]?.map((x: any) => x[0]).join("") || d.translation;
            newTranslations[d.id] = translatedPart;
          })
        );
        setTranslatedTexts(newTranslations);
      } catch (e) {
        console.error("Failed to translate Duas:", e);
      }
    };
    fetchTranslations();
  }, [category, language]);

  if (!cat) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "#fff", padding: 24 }}>Category not found.</Text>
      </SafeAreaView>
    );
  }

  const onFav = async (i: number) => {
    const d = cat.duas[i];
    const fav: Favourite = {
      id: d.id,
      type: "dua",
      title: d.title,
      subtitle: cat.title,
      arabic: d.arabic,
      translation: d.translation,
      addedAt: Date.now(),
    };
    await toggleFavourite(fav);
    const fs = await getFavourites();
    setFavIds(new Set(fs.map((f) => f.id)));
  };

  const imgSource = CATEGORY_IMAGES[cat.id] || { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ImageBackground source={imgSource} style={styles.heroImage} imageStyle={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <LinearGradient colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]} style={styles.heroScrim}>
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} hitSlop={10} testID="back-btn">
                <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.heroTitle}>{cat.title}</Text>
              <View style={{ width: 28 }} />
            </View>
            <Text style={styles.heroSub}>{cat.duas.length} Du{`'`}a{cat.duas.length === 1 ? "" : "s"}</Text>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        {cat.duas.map((d, i) => {
          const isFav = favIds.has(d.id);
          return (
            <View key={d.id} style={[styles.card, { backgroundColor: colors.surfaceSecondary }]} testID={`dua-${d.id}`}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: colors.brand, flex: 1 }]}>{d.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Pressable onPress={() => playDua(d)} hitSlop={10} testID={`play-${d.id}`}>
                    <MaterialCommunityIcons
                      name={playingId === d.id ? "pause-circle" : "play-circle"}
                      size={22}
                      color={colors.brand}
                    />
                  </Pressable>
                  <Pressable onPress={() => onFav(i)} hitSlop={10} testID={`fav-${d.id}`}>
                    <MaterialCommunityIcons
                      name={isFav ? "heart" : "heart-outline"}
                      size={22}
                      color={isFav ? theme.colors.error : colors.onSurfaceMuted}
                    />
                  </Pressable>
                </View>
              </View>
              <Text style={[styles.arabic, { color: colors.onSurface }]}>{d.arabic}</Text>
              {d.transliteration ? (
                <Text style={[styles.translit, { color: colors.brand }]}>
                  {language === "ta" ? transliterateToTamil(d.transliteration) : d.transliteration}
                </Text>
              ) : null}
              <Text style={[styles.translation, { color: colors.onSurfaceSecondary }]}>
                {translatedTexts[d.id] || d.translation}
              </Text>
              <View style={styles.footRow}>
                {d.reference ? <Text style={[styles.ref, { color: colors.onSurfaceMuted }]}>📖 {d.reference}</Text> : <View />}
                {d.repeat ? (
                  <View style={[styles.repeatPill, { backgroundColor: colors.brandSecondary + "33" }]}>
                    <Text style={[styles.repeatText, { color: colors.brandSecondary }]}>×{d.repeat}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CATEGORY_IMAGES: Record<string, any> = {
  ummah: require("@/assets/images/ummah_background.png"),
  morning: { uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80" },
  evening: { uri: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop&q=80" },
  sleep: { uri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80" },
  tahajjud: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  salah: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  "after-salah": { uri: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=500&auto=format&fit=crop&q=80" },
  istikharah: { uri: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=80" },
  gatherings: { uri: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80" },
  difficulties: { uri: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=500&auto=format&fit=crop&q=80" },
  iman: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  hajj: { uri: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=500&auto=format&fit=crop&q=80" },
  travel: { uri: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=80" },
  money: { uri: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80" },
  social: { uri: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=80" },
  marriage: { uri: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&auto=format&fit=crop&q=80" },
  death: { uri: "https://images.unsplash.com/photo-1453791052107-5c843da62d97?w=500&auto=format&fit=crop&q=80" },
  nature: { uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&auto=format&fit=crop&q=80" },
  ramadan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  ruqyah: { uri: "https://images.unsplash.com/photo-1552089123-2d26226fc2b7?w=500&auto=format&fit=crop&q=80" },
  "daily-life": { uri: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80" },
  adhan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  wudu: { uri: "https://images.unsplash.com/photo-1548813730-e8f20cc74a4a?w=500&auto=format&fit=crop&q=80" },
  masjid: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  heroImage: { width: "100%" },
  heroScrim: { paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.85)", paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm },
  card: { borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", flex: 1 },
  arabic: { fontFamily: "Amiri", fontSize: 26, textAlign: "right", lineHeight: 44, marginTop: theme.spacing.md },
  translit: { fontStyle: "italic", marginTop: theme.spacing.md, lineHeight: 21 },
  translation: { marginTop: theme.spacing.sm, lineHeight: 22 },
  footRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.md },
  ref: { fontSize: 12 },
  repeatPill: { borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  repeatText: { fontWeight: "700" },
});
