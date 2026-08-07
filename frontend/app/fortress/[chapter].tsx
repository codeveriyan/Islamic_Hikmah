import { useMemo, useState, useEffect } from "react";
import { FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import data from "@/src/data/hisnulMuslim.json";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { useTheme } from "@/src/ThemeContext";
import { ActionBar } from "@/src/components/ui/ActionBar";
import { theme } from "@/src/theme";

const FORTRESS_FAVS_KEY = "hikmah:fortress-favs:v1";
const FORTRESS_BMS_KEY = "hikmah:fortress-bms:v1";

export default function FortressChapterScreen() {
  const router = useRouter();
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const { colors, mode } = useTheme();
  const arabicFontFamily = useArabicFont();

  const [fontSize, setFontSize] = useState<number>(25);
  const [isFav, setIsFav] = useState<boolean>(false);
  const [isBm, setIsBm] = useState<boolean>(false);

  const current = useMemo(
    () => data.chapters.find((item) => item.number === Number(chapter)),
    [chapter],
  );

  useEffect(() => {
    if (!current) return;
    (async () => {
      try {
        const [favsRaw, bmsRaw] = await Promise.all([
          AsyncStorage.getItem(FORTRESS_FAVS_KEY),
          AsyncStorage.getItem(FORTRESS_BMS_KEY),
        ]);
        if (favsRaw) {
          const favs: number[] = JSON.parse(favsRaw);
          setIsFav(favs.includes(current.number));
        }
        if (bmsRaw) {
          const bms: number[] = JSON.parse(bmsRaw);
          setIsBm(bms.includes(current.number));
        }
      } catch {}
    })();
  }, [current]);

  const toggleFav = async () => {
    if (!current) return;
    Haptics.selectionAsync();
    const next = !isFav;
    setIsFav(next);
    try {
      const favsRaw = await AsyncStorage.getItem(FORTRESS_FAVS_KEY);
      let favs: number[] = favsRaw ? JSON.parse(favsRaw) : [];
      if (next) {
        if (!favs.includes(current.number)) favs.push(current.number);
      } else {
        favs = favs.filter((id) => id !== current.number);
      }
      await AsyncStorage.setItem(FORTRESS_FAVS_KEY, JSON.stringify(favs));
    } catch {}
  };

  const toggleBm = async () => {
    if (!current) return;
    Haptics.selectionAsync();
    const next = !isBm;
    setIsBm(next);
    try {
      const bmsRaw = await AsyncStorage.getItem(FORTRESS_BMS_KEY);
      let bms: number[] = bmsRaw ? JSON.parse(bmsRaw) : [];
      if (next) {
        if (!bms.includes(current.number)) bms.push(current.number);
      } else {
        bms = bms.filter((id) => id !== current.number);
      }
      await AsyncStorage.setItem(FORTRESS_BMS_KEY, JSON.stringify(bms));
    } catch {}
  };

  const cycleFontSize = () => {
    Haptics.selectionAsync();
    setFontSize((prev) => (prev >= 35 ? 22 : prev + 4));
  };

  const shareChapter = () => {
    if (!current) return;
    Haptics.selectionAsync();
    const allText = current.duas
      .map(
        (d, idx) =>
          `Du'a ${idx + 1}:\n${d.arabic}\n\n${d.transliteration}\n\n${d.translation}`,
      )
      .join("\n\n─────────────────\n\n");
    Share.share({
      message: `${current.title} (Hisnul Muslim · Chapter ${current.number})\n\n${allText}`,
    });
  };

  if (!current) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.notFound, { color: colors.onSurface }]}>Chapter not found.</Text>
      </SafeAreaView>
    );
  }

  const btnBg = mode === "dark" ? "rgba(255,255,255,0.08)" : "#F1F5F9";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.onSurface }]}>{current.title}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>Chapter {current.number} · {current.duas.length} du&apos;as</Text>
        </View>
        <ActionBar
          isFav={isFav}
          toggleFav={toggleFav}
          isBm={isBm}
          toggleBm={toggleBm}
          onShare={shareChapter}
          onTextSize={cycleFontSize}
        />
      </View>


      <FlatList
        data={current.duas}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.duaCard, { backgroundColor: mode === "dark" ? "#000000" : "#FFFFFF", borderColor: "transparent" }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: colors.brand + "20" }]}>
                <Text style={[styles.badgeText, { color: colors.brand }]}>Du&apos;a {index + 1}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => Share.share({
                  message: `${current.title}\n\n${item.arabic}\n\n${item.transliteration}\n\n${item.translation}\n\nHisnul Muslim · Chapter ${current.number}`,
                })}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            {!!item.arabic && (
              <Text style={[styles.arabic, { color: colors.onSurface, fontFamily: arabicFontFamily, fontSize, lineHeight: fontSize * 1.7 }]}>{item.arabic}</Text>
            )}
            {!!item.transliteration && (
              <Text style={[styles.transliteration, { color: colors.brand }]}>{item.transliteration}</Text>
            )}
            {!!item.translation && (
              <Text style={[styles.translation, { color: colors.onSurfaceSecondary }]}>{item.translation}</Text>
            )}
            {item.repeat > 1 && (
              <View style={[styles.repeat, { borderColor: colors.border }]}>
                <MaterialCommunityIcons name="repeat" size={15} color={colors.onSurfaceMuted} />
                <Text style={[styles.repeatText, { color: colors.onSurfaceMuted }]}>Repeat {item.repeat} times</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: 12, gap: 10 },
  title: { maxWidth: "95%", fontSize: 17, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 2 },
  actionBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: 4,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ttIcon: {
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "Figtree_400Regular",
  },
  list: { padding: theme.spacing.lg, paddingBottom: 48, gap: 14 },
  duaCard: { padding: 18, borderRadius: theme.radius.lg, borderWidth: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "800" },
  arabic: { textAlign: "right", writingDirection: "rtl" },
  transliteration: { fontSize: 14, lineHeight: 22, fontStyle: "italic", marginTop: 16 },
  translation: { fontSize: 15, lineHeight: 24, marginTop: 12 },
  repeat: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 14 },
  repeatText: { fontSize: 11, fontWeight: "700" },
  notFound: { padding: 24, textAlign: "center" },
});
