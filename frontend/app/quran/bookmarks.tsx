import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import {
  getQuranBookmarks,
  removeQuranBookmark,
  QuranBookmark,
} from "@/src/storage";
import { SURAH_LIST } from "@/src/data/surahList";
import pageMapping from "@/src/data/quran/pageMapping.json";

import { JUZ_DATA } from "@/src/data/juzData";

const JUZ_START_PAGES = JUZ_DATA.map((j) => j.juz === 1 ? 1 : (pageMapping as any[]).find((p) => p.ayahs.some((a: any) => a.surah === j.surahNumber && a.ayah === j.ayahNumber))?.page || 1);


// ─── Page-bookmark stored separately under key 'islamic_hikmah:bookmarked_pages' ─
type PageBookmark = { page: number; timestamp?: number };

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getSurahStartPage(surahNum: number): number {
  const pg = pageMapping.find((p) => p.ayahs.some((a: any) => a.surah === surahNum));
  return pg ? pg.page : 1;
}

function getJuzForPage(page: number): number {
  for (let i = JUZ_START_PAGES.length - 1; i >= 0; i--) {
    if (page >= JUZ_START_PAGES[i]) return i + 1;
  }
  return 1;
}

type BookmarkTab = "ayaat" | "surah" | "juz";

export default function QuranBookmarksScreen() {
  const router = useRouter();
  const { colors , language } = useTheme();
  const { t } = useTranslation(language);
  const isFocused = useIsFocused();

  const [tab, setTab] = useState<BookmarkTab>("ayaat");
  const [searchQ, setSearchQ] = useState("");

  // Ayah-level bookmarks (long-press in listen mode)
  const [ayahBMs, setAyahBMs] = useState<QuranBookmark[]>([]);
  // Page-level bookmarks (long-press in read/mushaf mode)
  const [pageBMs, setPageBMs] = useState<PageBookmark[]>([]);

  const load = useCallback(async () => {
    const [a, raw] = await Promise.all([
      getQuranBookmarks(),
      AsyncStorage.getItem("islamic_hikmah:bookmarked_pages"),
    ]);
    setAyahBMs(a);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as any[];
        setPageBMs(
          parsed.map((x) =>
            typeof x === "number" ? { page: x, timestamp: Date.now() } : x
          )
        );
      } catch {
        setPageBMs([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isFocused) load();
  }, [isFocused]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const deleteAyahBM = (b: QuranBookmark) => {
    Alert.alert(
      "Remove Bookmark",
      `Remove bookmark for ${b.surahName} · Ayah ${b.ayahNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            await removeQuranBookmark(b.surahNumber, b.ayahNumber);
            load();
          },
        },
      ]
    );
  };

  const deletePageBM = async (page: number) => {
    const updated = pageBMs.filter((b) => b.page !== page);
    setPageBMs(updated);
    await AsyncStorage.setItem(
      "islamic_hikmah:bookmarked_pages",
      JSON.stringify(updated)
    );
  };

  // ── Filtered data ──────────────────────────────────────────────────────────
  const q = searchQ.toLowerCase().trim();

  // SURAH tab: deduplicate bookmarked pages → show which Surah they belong to
  const surahBMs = (() => {
    const seen = new Set<number>();
    const result: { surahNumber: number; surahName: string; arabicName: string; totalAyahs: number; page: number; timestamp: number }[] = [];
    [...pageBMs].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).forEach((pb) => {
      const pageMap = pageMapping.find((p) => p.page === pb.page);
      if (!pageMap) return;
      const firstSurahNum: number = pageMap.ayahs[0]?.surah ?? 0;
      if (!firstSurahNum || seen.has(firstSurahNum)) return;
      seen.add(firstSurahNum);
      const surahMeta = SURAH_LIST.find((s) => s.number === firstSurahNum);
      result.push({
        surahNumber: firstSurahNum,
        surahName: surahMeta?.englishName ?? `Surah ${firstSurahNum}`,
        arabicName: surahMeta?.name ?? "",
        totalAyahs: surahMeta?.numberOfAyahs ?? 0,
        page: pb.page,
        timestamp: pb.timestamp ?? Date.now(),
      });
    });
    return result.filter((s) =>
      !q || s.surahName.toLowerCase().includes(q) || String(s.surahNumber).includes(q)
    );
  })();

  // JUZ tab: deduplicate bookmarked pages → show which Juz they belong to
  const juzBMs = (() => {
    const seen = new Set<number>();
    const result: { juz: number; name: string; page: number; timestamp: number }[] = [];
    [...pageBMs].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).forEach((pb) => {
      const juz = getJuzForPage(pb.page);
      if (seen.has(juz)) return;
      seen.add(juz);
      const jEntry = JUZ_DATA.find((entry) => entry.juz === juz);
      result.push({ juz, name: jEntry?.nameEn ?? `Juz ${juz}`, page: pb.page, timestamp: pb.timestamp ?? Date.now() });
    });
    return result.filter((j) =>
      !q || `juz ${j.juz}`.includes(q) || j.name.toLowerCase().includes(q)
    );
  })();

  const filteredAyah = ayahBMs.filter((b) =>
    !q ||
    b.surahName.toLowerCase().includes(q) ||
    String(b.surahNumber).includes(q) ||
    String(b.ayahNumber).includes(q)
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  const TAB_LABELS: { key: BookmarkTab; label: string }[] = [
    { key: "ayaat", label: "AYAAT" },
    { key: "surah", label: "SURAH" },
    { key: "juz", label: "JUZ" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.brand + "44" }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Bookmarks</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable hitSlop={10}>
            <MaterialCommunityIcons name="magnify" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceSecondary }]}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.onSurfaceMuted} />
        <TextInput
          value={searchQ}
          onChangeText={setSearchQ}
          placeholder="Search bookmarks..."
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.searchInput, { color: colors.onSurface }]}
        />
        {searchQ.length > 0 && (
          <Pressable onPress={() => setSearchQ("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={16} color={colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.brand }]}>
        {TAB_LABELS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setTab(t.key);
            }}
            style={[
              styles.tabBtn,
              tab === t.key && { borderBottomColor: colors.brand, borderBottomWidth: 3 },
            ]}
          >
            <Text
              style={[
                styles.tabTxt,
                { color: tab === t.key ? colors.brand : colors.onSurfaceMuted },
                tab === t.key && { fontWeight: "800" },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Tab Content */}
      {tab === "ayaat" && (
        <FlatList
          data={filteredAyah}
          keyExtractor={(b) => `${b.surahNumber}-${b.ayahNumber}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState message="No verse bookmarks yet.\nLong-press any verse while reading to bookmark it." />}
          renderItem={({ item: b }) => (
            <Pressable
              onPress={() => router.push(`/quran/${b.surahNumber}` as any)}
              style={[styles.card, { backgroundColor: colors.surfaceSecondary }]}
            >
              <View style={[styles.numCircle, { borderColor: colors.brand + "66" }]}>
                <Text style={[styles.numTxt, { color: colors.brand }]}>{b.surahNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{b.surahName}</Text>
                <Text style={[styles.cardSub, { color: colors.onSurfaceMuted }]}>
                  Ayah {b.ayahNumber} · {timeAgo(b.savedAt)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <MaterialCommunityIcons name="bookmark" size={22} color={colors.brand} />
                <Pressable onPress={() => deleteAyahBM(b)} hitSlop={10}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.onSurfaceMuted} />
                </Pressable>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {tab === "surah" && (
        <FlatList
          data={surahBMs}
          keyExtractor={(s) => String(s.surahNumber)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState message="No surah bookmarks yet.\nLong-press a verse in Read mode to bookmark a page." />}
          renderItem={({ item: s }) => (
            <Pressable
              onPress={() => router.push(`/quran/read/${s.page}` as any)}
              style={[styles.card, { backgroundColor: colors.surfaceSecondary }]}
            >
              <View style={[styles.numCircle, { borderColor: colors.brand + "66" }]}>
                <Text style={[styles.numTxt, { color: colors.brand }]}>{s.surahNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{s.surahName}</Text>
                <Text style={[styles.cardSub, { color: colors.onSurfaceMuted }]}>
                  {s.arabicName ? `${s.arabicName} · ` : ""}{s.totalAyahs} ayahs
                </Text>
              </View>
              <MaterialCommunityIcons name="bookmark" size={22} color={colors.brand} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {tab === "juz" && (
        <FlatList
          data={juzBMs}
          keyExtractor={(j) => String(j.juz)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState message="No juz bookmarks yet.\nBookmark pages while reading to see juz here." />}
          renderItem={({ item: j }) => {
            const jEntry = JUZ_DATA.find((entry) => entry.juz === j.juz);
            return (
              <Pressable
                onPress={() => router.push(`/quran/read/${j.page}` as any)}
                style={[styles.card, { backgroundColor: colors.surfaceSecondary }]}
              >
                <View style={[styles.numCircle, { borderColor: colors.brand + "66" }]}>
                  <Text style={[styles.numTxt, { color: colors.brand }]}>{j.juz}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Juz {j.juz} — {jEntry?.nameEn}</Text>
                  <Text style={[styles.cardSub, { color: colors.onSurfaceMuted }]}>{jEntry?.name}</Text>
                </View>
                <MaterialCommunityIcons name="bookmark" size={22} color={colors.brand} />
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="bookmark-off-outline" size={56} color="#C5A88066" />
      <Text style={styles.emptyTxt}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "800" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.lg,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14 },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabTxt: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 48,
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: 14,
  },
  numCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  numTxt: { fontWeight: "800", fontSize: 15 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 12, marginTop: 3 },
  empty: { alignItems: "center", paddingTop: 60, gap: 14, paddingHorizontal: 32 },
  emptyTxt: {
    color: "#C5A88099",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
