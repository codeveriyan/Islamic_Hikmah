import { useCallback, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { theme } from "@/src/theme";

const { width } = Dimensions.get("window");

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
    route: "/quran",
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
    title: "Learn Quran",
    subtitle: "Tajweed rules · Pronunciation",
    icon: "school",
    route: "/quran",
    gradient: ["#7C2D12", "#C2410C"],
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
  const { colors, mode } = useTheme();
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [todayPages, setTodayPages] = useState(0);
  const [weekPages, setWeekPages] = useState<number[]>(Array(7).fill(0));

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }, []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem("hikmah:quran-last-read:v1");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.surahNumber) setLastRead(parsed as LastRead);
          }
          // Load reading stats
          const today = new Date();
          const keys = Array.from({ length: 7 }, (_, i) => {
            const d2 = new Date(today);
            d2.setDate(d2.getDate() - (6 - i));
            return `hikmah:quran-pages:${d2.getFullYear()}-${d2.getMonth() + 1}-${d2.getDate()}`;
          });
          const vals = await AsyncStorage.multiGet(keys);
          const pages = vals.map(([, v]) => (v ? parseInt(v, 10) : 0));
          setWeekPages(pages);
          setTodayPages(pages[6] ?? 0);
        } catch {}
      })();
    }, [todayStr])
  );

  const bg = mode === "dark" ? colors.surface : "#F8FAFC";
  const cardBg = mode === "dark" ? colors.surfaceSecondary : "#FFFFFF";

  const handleSearch = () => {
    if (searchQ.trim()) {
      router.push(`/search` as any);
    }
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top"]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerTitle, { color: colors.onSurface }]}>Al-Qur'an</Text>
          <Text style={[s.headerSub, { color: colors.onSurfaceMuted }]}>القرآن الكريم</Text>
        </View>
        <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Search Bar */}
        <View style={[s.searchBar, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
          <TextInput
            value={searchQ}
            onChangeText={setSearchQ}
            onSubmitEditing={handleSearch}
            placeholder="Search surahs, ayahs, topics..."
            placeholderTextColor={colors.onSurfaceMuted}
            style={[s.searchInput, { color: colors.onSurface }]}
            returnKeyType="search"
          />
        </View>

        {/* Continue Reading Card */}
        {lastRead && (
          <>
            <Text style={[s.sectionTitle, { color: colors.onSurface }]}>Continue Reading</Text>
            <AnimatedCard
              onPress={() => router.push(`/quran/${lastRead.surahNumber}` as any)}
              style={[s.continueCard, { overflow: "hidden" }]}
            >
              <LinearGradient
                colors={mode === "dark" ? ["#0B2D25", "#163B2E"] : ["#065F46", "#047857"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={s.continueIcon}>
                <MaterialCommunityIcons name="book-open-variant" size={28} color="rgba(255,255,255,0.9)" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.continueLabel}>Last Read</Text>
                <Text style={s.continueName}>{lastRead.surahName}</Text>
                {lastRead.ayahNumber && (
                  <Text style={s.continueAyah}>Ayah {lastRead.ayahNumber}</Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.8)" />
            </AnimatedCard>
          </>
        )}

        {/* Reading Modes */}
        <Text style={[s.sectionTitle, { color: colors.onSurface }]}>Choose a Mode</Text>
        <View style={s.modesGrid}>
          {MODES.map((m) => (
            <AnimatedCard
              key={m.id}
              onPress={() => router.push(m.route as any)}
              style={[s.modeCard, { overflow: "hidden" }]}
            >
              <LinearGradient
                colors={m.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.modeGradient}
              >
                <View style={s.modeIconWrap}>
                  <MaterialCommunityIcons name={m.icon as any} size={26} color="#fff" />
                </View>
                <Text style={s.modeTitle}>{m.title}</Text>
                <Text style={s.modeSub}>{m.subtitle}</Text>
              </LinearGradient>
            </AnimatedCard>
          ))}
        </View>

        {/* ── Reading Progress Card ── */}
        <View style={[s.readingCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
          <View style={s.readingTop}>
            <View>
              <Text style={[s.readingLabel, { color: colors.onSurfaceMuted }]}>TODAY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={[s.readingNum, { color: todayPages > 0 ? colors.brand : colors.onSurface }]}>{todayPages}</Text>
                <Text style={[s.readingUnit, { color: colors.onSurfaceMuted }]}>pages</Text>
              </View>
            </View>
            <View style={[s.readingDivider, { backgroundColor: colors.border }]} />
            <View>
              <Text style={[s.readingLabel, { color: colors.onSurfaceMuted }]}>THIS WEEK</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={[s.readingNum, { color: colors.onSurface }]}>{weekPages.reduce((a, b) => a + b, 0)}</Text>
                <Text style={[s.readingUnit, { color: colors.onSurfaceMuted }]}>pages</Text>
              </View>
            </View>
            <View style={[s.readingDivider, { backgroundColor: colors.border }]} />
            {/* 7-bar chart */}
            <View style={s.barChart}>
              {weekPages.map((p, idx) => {
                const maxP = Math.max(...weekPages, 1);
                const pct = p / maxP;
                return (
                  <View key={idx} style={s.barCol}>
                    <View style={s.barTrack}>
                      <View style={[s.barFill, { height: `${Math.max(pct * 100, 4)}%`, backgroundColor: idx === 6 ? colors.brand : colors.brand + '55' }]} />
                    </View>
                    <Text style={[s.barDay, { color: colors.onSurfaceMuted }]}>{['M','T','W','T','F','S','S'][idx]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── 30-Juz Navigator ── */}
        <Text style={[s.sectionTitle, { color: colors.onSurface, marginTop: 8 }]}>Navigate by Juz</Text>
        <View style={s.juzGrid}>
          {JUZ_DATA.map(({ juz, surah }) => (
            <AnimatedCard
              key={juz}
              onPress={() => router.push(`/quran/${surah}` as any)}
              style={[s.juzCell, { backgroundColor: juzColor(juz) }]}
            >
              <Text style={s.juzNum}>{juz}</Text>
            </AnimatedCard>
          ))}
        </View>

        {/* Quick Access */}
        <Text style={[s.sectionTitle, { color: colors.onSurface, marginTop: 8 }]}>Quick Access</Text>
        <View style={[s.quickList, { backgroundColor: cardBg, borderColor: colors.border }]}>
          {QUICK.map((item, idx) => (
            <AnimatedCard
              key={item.id}
              onPress={() => router.push(item.route as any)}
              style={[
                s.quickRow,
                idx < QUICK.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
              ]}
            >
              <View style={[s.quickIcon, { backgroundColor: colors.brand + "18" }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.brand} />
              </View>
              <Text style={[s.quickLabel, { color: colors.onSurface }]}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
            </AnimatedCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  readingCard: {
    borderRadius: theme.radius.lg, borderWidth: 0.5,
    padding: 14, marginBottom: 20,
  },
  readingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  readingLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4, fontFamily: 'Figtree_400Regular' },
  readingNum: { fontSize: 26, fontWeight: '800', fontFamily: 'Outfit_600SemiBold' },
  readingUnit: { fontSize: 11, fontFamily: 'Figtree_400Regular', marginBottom: 2 },
  readingDivider: { width: 0.5, height: 44, marginHorizontal: 14, alignSelf: 'center' },
  barChart: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 48, paddingLeft: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 3 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 3, overflow: 'hidden', backgroundColor: 'transparent' },
  barFill: { width: '100%', borderRadius: 3, minHeight: 2 },
  barDay: { fontSize: 8, fontWeight: '600' },
  juzGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  juzCell: {
    width: (width - theme.spacing.lg * 2 - 6 * 5) / 6,
    height: (width - theme.spacing.lg * 2 - 6 * 5) / 6,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  juzNum: { fontSize: 13, fontWeight: '800', color: '#fff', fontFamily: 'Outfit_600SemiBold' },
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 22, fontFamily: "Outfit_600SemiBold", fontWeight: "700" },
  headerSub: { fontSize: 13, fontFamily: "Figtree_400Regular", marginTop: 1 },
  scroll: { padding: theme.spacing.lg },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14,
    borderWidth: 0.5, marginBottom: 20,
  },
  searchInput: {
    flex: 1, fontSize: 15, fontFamily: "Figtree_400Regular",
  },
  sectionTitle: {
    fontSize: 13, fontFamily: "Figtree_400Regular", fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12, marginTop: 4,
  },
  continueCard: {
    flexDirection: "row", alignItems: "center", borderRadius: 16,
    padding: 18, gap: 14, marginBottom: 20,
  },
  continueIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  continueLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "Figtree_400Regular" },
  continueName: { fontSize: 18, color: "#fff", fontFamily: "Outfit_600SemiBold", fontWeight: "700" },
  continueAyah: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Figtree_400Regular", marginTop: 2 },
  modesGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md, marginBottom: 4 },
  modeCard: { width: "47%", borderRadius: theme.radius.lg, minHeight: 130 },
  modeGradient: { flex: 1, padding: 16, borderRadius: theme.radius.lg, justifyContent: "flex-end", minHeight: 130 },
  modeIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  modeTitle: { fontSize: 13, fontFamily: "Outfit_600SemiBold", fontWeight: "700", color: "#fff", marginBottom: 3 },
  modeSub: { fontSize: 10, color: "rgba(255,255,255,0.72)", fontFamily: "Figtree_400Regular", lineHeight: 14 },
  quickList: { borderRadius: theme.radius.lg, borderWidth: 0.5, overflow: "hidden" },
  quickRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  quickIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickLabel: { flex: 1, fontSize: 15, fontFamily: "Figtree_400Regular", fontWeight: "500" },
});
