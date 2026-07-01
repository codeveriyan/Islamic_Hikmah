import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SURAH_START_PAGES } from "@/src/data/surahPages";
import { SURAH_LIST } from "@/src/data/surahList";

type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

const ITEM_HEIGHT = 72;
const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182, 
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382, 
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

export default function QuranIndex() {
  const router = useRouter();
  const { colors } = useTheme();
  const [surahs, setSurahs] = useState<Surah[]>(SURAH_LIST);
  const [loading, setLoading] = useState(false);
  
  // Tabs: "read" vs "listen"
  const [activeTab, setActiveTab] = useState<"read" | "listen">("read");
  
  // Read Sub-tabs: "surah" | "juz" | "bookmark"
  const [readSubTab, setReadSubTab] = useState<"surah" | "juz" | "bookmark">("surah");

  const [q, setQ] = useState("");
  const [lastReadPage, setLastReadPage] = useState<number>(1);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);



  // Load last read & bookmarks on focus/render
  useEffect(() => {
    AsyncStorage.getItem("islamic_hikmah:last_read_page").then((val) => {
      if (val) setLastReadPage(Number(val));
    });
    AsyncStorage.getItem("islamic_hikmah:bookmarked_pages").then((raw) => {
      if (raw) setBookmarkedPages(JSON.parse(raw));
    });
  }, [activeTab]);

  const filteredSurahs = surahs.filter((s) =>
    [s.englishName, s.englishNameTranslation, s.name, String(s.number)]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  // Render Surah item for listening
  const renderListenSurah = useCallback(({ item }: { item: Surah }) => (
    <Pressable
      onPress={() => router.push(`/quran/${item.number}` as any)}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
      testID={`surah-listen-${item.number}`}
    >
      <View style={[styles.numBadge, { backgroundColor: colors.brand + "22" }]}>
        <Text style={[styles.numTxt, { color: colors.brand }]}>{item.number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{item.englishName}</Text>
        <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
          {item.englishNameTranslation} · {item.numberOfAyahs} ayahs · {item.revelationType}
        </Text>
      </View>
      <Text style={[styles.arabicName, { color: colors.brand }]}>{item.name}</Text>
    </Pressable>
  ), [colors, router]);

  // Render Surah item for reading (Traditional Majeed styling)
  const renderReadSurah = useCallback(({ item }: { item: Surah }) => {
    const startPage = SURAH_START_PAGES[item.number] || 1;
    return (
      <Pressable
        onPress={() => router.push(`/quran/read/${startPage}` as any)}
        style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
        testID={`surah-read-${item.number}`}
      >
        <View style={styles.badgeWrapper}>
          <MaterialCommunityIcons name="octagram" size={42} color={colors.brand + "22"} />
          <Text style={[styles.badgeText, { color: colors.brand }]}>{item.number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{item.englishName}</Text>
          <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
            Page {startPage} · {item.numberOfAyahs} ayahs
          </Text>
        </View>
        <Text style={[styles.arabicNameRead, { color: colors.onSurface }]}>{item.name}</Text>
      </Pressable>
    );
  }, [colors, router]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT + theme.spacing.sm,
    offset: (ITEM_HEIGHT + theme.spacing.sm) * index,
    index,
  }), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="quran-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>The Noble Quran</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Read vs Listen Tab Segment Control */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Pressable
          onPress={() => setActiveTab("read")}
          style={[styles.segmentBtn, activeTab === "read" && [styles.segmentBtnActive, { backgroundColor: colors.brand }]]}
        >
          <MaterialCommunityIcons
            name="book-open-variant"
            size={18}
            color={activeTab === "read" ? colors.onBrandPrimary : colors.onSurfaceMuted}
          />
          <Text style={[styles.segmentTxt, { color: activeTab === "read" ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>
            Read Quran
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("listen")}
          style={[styles.segmentBtn, activeTab === "listen" && [styles.segmentBtnActive, { backgroundColor: colors.brand }]]}
        >
          <MaterialCommunityIcons
            name="volume-high"
            size={18}
            color={activeTab === "listen" ? colors.onBrandPrimary : colors.onSurfaceMuted}
          />
          <Text style={[styles.segmentTxt, { color: activeTab === "listen" ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>
            Listen Quran
          </Text>
        </Pressable>
      </View>

      {/* Main search page input */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={activeTab === "read" ? "Search Page or Surah" : "Search Surah name..."}
          placeholderTextColor={theme.colors.onSurfaceMuted}
          style={[styles.search, { color: colors.onSurface }]}
          testID="surah-search"
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : activeTab === "listen" ? (
        // Listen Quran List
        <FlatList
          data={filteredSurahs}
          keyExtractor={(s) => String(s.number)}
          renderItem={renderListenSurah}
          getItemLayout={getItemLayout}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        // Read Quran Section
        <View style={{ flex: 1 }}>
          {/* Resume Last Read Banner */}
          <View style={[styles.resumeBanner, { backgroundColor: colors.brandSecondary + "15" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <MaterialCommunityIcons name="book-open-outline" size={28} color={colors.brandSecondary} />
              <View>
                <Text style={[styles.resumeTitle, { color: colors.onSurface }]}>Page No. {lastReadPage}</Text>
                <Text style={[styles.resumeSub, { color: colors.onSurfaceMuted }]}>Continue your recitation</Text>
              </View>
            </View>
            <Pressable
              onPress={() => router.push(`/quran/read/${lastReadPage}` as any)}
              style={[styles.resumeBtn, { backgroundColor: colors.brandSecondary }]}
            >
              <Text style={[styles.resumeBtnTxt, { color: colors.onBrandPrimary }]}>Resume</Text>
            </Pressable>
          </View>

          {/* Sub Tab Controls: Surah | Juz | Bookmark */}
          <View style={styles.subTabRow}>
            {(["surah", "juz", "bookmark"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setReadSubTab(tab)}
                style={[
                  styles.subTabBtn,
                  readSubTab === tab && { borderBottomColor: colors.brand, borderBottomWidth: 3 },
                ]}
              >
                <Text
                  style={[
                    styles.subTabTxt,
                    { color: readSubTab === tab ? colors.brand : colors.onSurfaceMuted },
                    readSubTab === tab && { fontWeight: "700" },
                  ]}
                >
                  {tab.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Render sub-tab content */}
          {readSubTab === "surah" && (
            <FlatList
              data={filteredSurahs}
              keyExtractor={(s) => String(s.number)}
              renderItem={renderReadSurah}
              getItemLayout={getItemLayout}
              contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingVertical: 12, gap: theme.spacing.sm, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {readSubTab === "juz" && (
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}>
              {Array.from({ length: 30 }, (_, index) => {
                const juzNum = index + 1;
                const startPage = JUZ_START_PAGES[index];
                return (
                  <Pressable
                    key={juzNum}
                    onPress={() => router.push(`/quran/read/${startPage}` as any)}
                    style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
                  >
                    <View style={[styles.numBadge, { backgroundColor: colors.brandSecondary + "22" }]}>
                      <Text style={[styles.numTxt, { color: colors.brandSecondary }]}>{juzNum}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Juz {juzNum}</Text>
                      <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>Starts at Page {startPage}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {readSubTab === "bookmark" && (
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}>
              {bookmarkedPages.length === 0 ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <MaterialCommunityIcons name="bookmark-outline" size={48} color={colors.onSurfaceMuted} />
                  <Text style={[styles.noFavTxt, { color: colors.onSurfaceMuted }]}>No bookmarked pages yet.</Text>
                </View>
              ) : (
                bookmarkedPages.map((pageNum) => (
                  <Pressable
                    key={pageNum}
                    onPress={() => router.push(`/quran/read/${pageNum}` as any)}
                    style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
                  >
                    <View style={[styles.numBadge, { backgroundColor: colors.brand + "22" }]}>
                      <Text style={[styles.numTxt, { color: colors.brand }]}>📖</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Page {pageNum}</Text>
                      <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>Tap to open page</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { fontSize: 20, fontWeight: "700" },
  segmentContainer: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.lg,
    padding: 4,
    borderRadius: 12,
    marginBottom: theme.spacing.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  segmentTxt: { fontSize: 13, fontWeight: "700" },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: theme.spacing.lg, paddingHorizontal: 14, borderRadius: theme.radius.pill, gap: 8, marginBottom: 12 },
  search: { flex: 1, paddingVertical: 12, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", padding: theme.spacing.lg, borderRadius: theme.radius.lg, gap: theme.spacing.md, height: ITEM_HEIGHT },
  numBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  numTxt: { fontWeight: "700" },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  arabicName: { fontFamily: "Amiri", fontSize: 22 },
  arabicNameRead: { fontSize: 16, fontWeight: "700" },
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
  },
  resumeTitle: { fontSize: 15, fontWeight: "700" },
  resumeSub: { fontSize: 11, marginTop: 2 },
  resumeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  resumeBtnTxt: { fontSize: 12, fontWeight: "700" },
  subTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  subTabTxt: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  badgeWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    position: "absolute",
    fontSize: 12,
    fontWeight: "800",
  },
  noFavTxt: { fontSize: 13, marginTop: 8 },
});
