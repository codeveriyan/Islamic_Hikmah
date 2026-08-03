import { useCallback, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { theme } from "@/src/theme";
import { useTabBarVisibility } from "@/src/TabBarVisibilityContext";

// ── 30-Juz data (juz number + first surah number + short name) ──────────────
const JUZ_DATA: { juz: number; surah: number; name: string }[] = [
  { juz: 1, surah: 1, name: "Al-Fatiha" },   { juz: 2, surah: 2, name: "Al-Baqarah" },
  { juz: 3, surah: 2, name: "Al-Baqarah" },  { juz: 4, surah: 3, name: "Al-'Imran" },
  { juz: 5, surah: 4, name: "An-Nisa" },     { juz: 6, surah: 4, name: "An-Nisa" },
  { juz: 7, surah: 5, name: "Al-Ma'idah" },  { juz: 8, surah: 6, name: "Al-An'am" },
  { juz: 9, surah: 7, name: "Al-A'raf" },    { juz: 10, surah: 8, name: "Al-Anfal" },
  { juz: 11, surah: 9, name: "At-Tawbah" },  { juz: 12, surah: 11, name: "Hud" },
  { juz: 13, surah: 12, name: "Yusuf" },     { juz: 14, surah: 15, name: "Al-Hijr" },
  { juz: 15, surah: 17, name: "Al-Isra'" },  { juz: 16, surah: 18, name: "Al-Kahf" },
  { juz: 17, surah: 21, name: "Al-Anbiya" }, { juz: 18, surah: 23, name: "Al-Mu'minun" },
  { juz: 19, surah: 25, name: "Al-Furqan" }, { juz: 20, surah: 27, name: "An-Naml" },
  { juz: 21, surah: 29, name: "Al-Ankabut" },{ juz: 22, surah: 33, name: "Al-Ahzab" },
  { juz: 23, surah: 36, name: "Ya-Sin" },    { juz: 24, surah: 39, name: "Az-Zumar" },
  { juz: 25, surah: 41, name: "Fussilat" },  { juz: 26, surah: 46, name: "Al-Ahqaf" },
  { juz: 27, surah: 51, name: "Ad-Dhariyat" },{ juz: 28, surah: 58, name: "Al-Mujadila" },
  { juz: 29, surah: 67, name: "Al-Mulk" },   { juz: 30, surah: 78, name: "An-Naba'" },
];

// Colour for each juz cell (cool to warm)
const juzColor = (juz: number): string => {
  const hue = Math.round(160 - (juz / 30) * 100); // 160 (teal) → 60 (amber)
  return `hsl(${hue}, 60%, 38%)`;
};

type LastRead = {
  surahNumber: number;
  surahName: string;
  ayahNumber?: number;
};

type ModeCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  gradient: [string, string];
};

const MODES: ModeCard[] = [
  {
    id: "read",
    title: "Read Quran",
    subtitle: "114 Surahs · Translations · Word-by-Word",
    icon: "book-open-page-variant",
    route: "/quran",
    gradient: ["#065F46", "#047857"],
  },
  {
    id: "listen",
    title: "Listen & Follow",
    subtitle: "Recitation · Verse Highlighting · Audio",
    icon: "headphones",
    route: "/quran?mode=listen",
    gradient: ["#1E3A5F", "#1D4ED8"],
  },
  {
    id: "mushaf",
    title: "Mushaf View",
    subtitle: "Traditional page-by-page Quran",
    icon: "file-document",
    route: "/quran/read/1",
    gradient: ["#4C1D95", "#6D28D9"],
  },
  {
    id: "learn",
    title: "AI Voice Coach",
    subtitle: "Pronunciation · Real-time Feedback",
    icon: "microphone",
    route: "/quran/learn-ai",
    gradient: ["#059669", "#10B981"],
  },
  {
    id: "identify",
    title: "Identify Recitation",
    subtitle: "Match Surah & Ayah from a recording",
    icon: "waveform",
    route: "/quran/identify",
    gradient: ["#0F766E", "#0D9488"],
  },
];

const QUICK: { id: string; label: string; icon: string; route: string }[] = [
  { id: "bookmarks", label: "My Bookmarks", icon: "bookmark-multiple", route: "/quran/bookmarks" },
  { id: "juz", label: "Browse by Juz", icon: "view-grid", route: "/quran" },
  { id: "personalise", label: "Font & Display", icon: "format-font", route: "/quran/personalise" },
  { id: "search", label: "Search the Quran", icon: "magnify", route: "/search" },
];

export default function QuranTab() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width: viewportWidth } = useWindowDimensions();
  const { onScroll, onScrollEndDrag, onMomentumScrollEnd } = useTabBarVisibility();

  const [lastRead, setLastRead] = useState<LastRead | null>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("last_read_v2").then((val) => {
        if (val) {
          try {
            setLastRead(JSON.parse(val));
          } catch {}
        }
      });
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceSecondary || "#0B141A" }]} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Al-Qur'an Al-Kareem</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
            Read, Listen & Understand the Noble Quran
          </Text>
        </View>

        {/* Modes Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Explore Modes</Text>
          <View style={styles.modesGrid}>
            {MODES.map((item) => (
              <AnimatedCard
                key={item.id}
                onPress={() => router.push(item.route as any)}
                style={styles.modeCard}
              >
                <LinearGradient colors={item.gradient} style={styles.gradientCard}>
                  <MaterialCommunityIcons name={item.icon as any} size={28} color="#FFFFFF" />
                  <Text style={styles.modeTitle}>{item.title}</Text>
                  <Text style={styles.modeSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </AnimatedCard>
            ))}
          </View>
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Quick Access</Text>
          <View style={styles.quickGrid}>
            {QUICK.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  styles.quickItem,
                  { backgroundColor: colors.surface || "#111B21", borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.brand || "#00A884"} />
                <Text style={[styles.quickLabel, { color: colors.onSurface }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modesGrid: {
    gap: 12,
  },
  modeCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gradientCard: {
    padding: 18,
    borderRadius: 16,
    gap: 6,
  },
  modeTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  modeSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  quickItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: "47%",
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
