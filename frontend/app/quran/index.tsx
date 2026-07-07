import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import pageMapping from "@/src/data/quran/pageMapping.json";
import { SURAH_LIST } from "@/src/data/surahList";
import { JUZ_DATA } from "@/src/data/juzData";
import {
  getQuranBookmarks,
  removeQuranBookmark,
  getQuranLastRead,
  QuranBookmark,
  QuranLastRead,
  updateQuranBookmarkNote,
} from "@/src/storage";
import { SURAH_INFO_DATA, SurahInfo } from "@/src/data/surahInfoData";
import surahInfoDetailed from "@/src/data/quran/surahInfoDetailed.json";

// ─── Types ────────────────────────────────────────────────────────────────────
type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

type PageBookmark = { page: number; timestamp?: number };

// ─── Constants ────────────────────────────────────────────────────────────────
const ITEM_HEIGHT = 72;

const JUZ_START_PAGES = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582,
];

// Keys for listen-mode last played (separate from read-mode last page)
const LISTEN_LAST_KEY = "hikmah:quran-last-read:v1"; // same as getQuranLastRead
// Keys for listen-mode bookmarks (verse-level, from [id].tsx long-press)
// These are already stored under QURAN_BOOKMARKS_KEY via addQuranBookmark

// Keys for read-mode bookmarks (page-level from mushaf)
const READ_BM_KEY = "islamic_hikmah:bookmarked_pages";
const READ_LAST_KEY = "islamic_hikmah:last_read_page";

function getJuzForPage(page: number): number {
  for (let i = JUZ_START_PAGES.length - 1; i >= 0; i--) {
    if (page >= JUZ_START_PAGES[i]) return i + 1;
  }
  return 1;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

import LearnQuranView from "./learn";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuranIndex() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const isFocused = useIsFocused();

  const [loading] = useState(false);

  // Top tabs
  const [activeTab, setActiveTab] = useState<"read" | "listen" | "learn">("read");

  // Surah Info Modal state
  const [selectedSurahForInfo, setSelectedSurahForInfo] = useState<Surah | null>(null);

  // Read sub-tabs
  const [readSubTab, setReadSubTab] = useState<"surah" | "juz" | "bookmark">("surah");
  // Listen sub-tabs
  const [listenSubTab, setListenSubTab] = useState<"surah" | "juz" | "bookmark">("surah");

  // Bookmark inner tabs (shared, but data is separate)
  const [readBmTab, setReadBmTab] = useState<"ayaat" | "surah" | "juz">("surah");
  const [listenBmTab, setListenBmTab] = useState<"ayaat" | "surah" | "juz">("ayaat");

  const [q, setQ] = useState("");

  // READ mode state
  const [lastReadPage, setLastReadPage] = useState<number>(1);
  const [pageBMs, setPageBMs] = useState<PageBookmark[]>([]);

  // LISTEN mode state — last played from audio mode
  const [lastPlayed, setLastPlayed] = useState<QuranLastRead | null>(null);
  // Verse bookmarks from listen mode (ayah-level, from long-press in [id].tsx)
  const [ayahBMs, setAyahBMs] = useState<QuranBookmark[]>([]);

  // Notes Modal state for verse bookmarks
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<QuranBookmark | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const editAyahNote = useCallback((b: QuranBookmark) => {
    setEditingBookmark(b);
    setNoteInput(b.note || "");
    setNoteModalVisible(true);
  }, []);

  const saveNote = useCallback(async () => {
    if (!editingBookmark) return;
    try {
      await updateQuranBookmarkNote(editingBookmark.surahNumber, editingBookmark.ayahNumber, noteInput);
      setNoteModalVisible(false);
      // Reload bookmarks
      getQuranBookmarks().then(setAyahBMs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  }, [editingBookmark, noteInput]);

  // Surah start page helper
  const surahStartPages = useCallback((surahNum: number): number => {
    const firstPage = (pageMapping as any[]).find((p) => p.ayahs.some((a: any) => a.surah === surahNum));
    return firstPage ? firstPage.page : 1;
  }, []);

  // ── Load on focus ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFocused) return;
    // Read mode data
    AsyncStorage.getItem(READ_LAST_KEY).then((val) => {
      if (val) setLastReadPage(Number(val));
    });
    AsyncStorage.getItem(READ_BM_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as any[];
        setPageBMs(
          parsed.map((item) =>
            typeof item === "number" ? { page: item, timestamp: Date.now() } : item
          )
        );
      } catch { setPageBMs([]); }
    });
    // Listen mode data
    getQuranLastRead().then(setLastPlayed);
    getQuranBookmarks().then(setAyahBMs);
  }, [isFocused]);

  // ── Filtered lists ───────────────────────────────────────────────────────
  const filteredSurahs = useMemo(
    () =>
      (SURAH_LIST as Surah[]).filter((s) =>
        [s.englishName, s.englishNameTranslation, s.name, String(s.number)]
          .join(" ").toLowerCase().includes(q.toLowerCase())
      ),
    [q]
  );

  // ── Bookmark derived data ────────────────────────────────────────────────
  const bq = q.toLowerCase().trim();

  // READ BOOKMARK - SURAH tab: page bookmarks → unique surahs
  const readSurahBMs = useMemo(() => {
    const seen = new Set<number>();
    const result: { surahNumber: number; surahName: string; arabicName: string; totalAyahs: number; page: number; timestamp: number }[] = [];
    [...pageBMs].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).forEach((pb) => {
      const pageMap = (pageMapping as any[]).find((p) => p.page === pb.page);
      if (!pageMap) return;
      const firstSurahNum: number = pageMap.ayahs[0]?.surah ?? 0;
      if (!firstSurahNum || seen.has(firstSurahNum)) return;
      seen.add(firstSurahNum);
      const meta = (SURAH_LIST as any[]).find((s) => s.number === firstSurahNum);
      result.push({
        surahNumber: firstSurahNum,
        surahName: meta?.englishName ?? `Surah ${firstSurahNum}`,
        arabicName: meta?.name ?? "",
        totalAyahs: meta?.numberOfAyahs ?? 0,
        page: pb.page,
        timestamp: pb.timestamp ?? Date.now(),
      });
    });
    return result.filter((s) => !bq || s.surahName.toLowerCase().includes(bq) || String(s.surahNumber).includes(bq));
  }, [pageBMs, bq]);

  // READ BOOKMARK - JUZ tab: page bookmarks → unique juz
  const readJuzBMs = useMemo(() => {
    const seen = new Set<number>();
    const result: { juz: number; nameEn: string; nameAr: string; page: number; timestamp: number }[] = [];
    [...pageBMs].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0)).forEach((pb) => {
      const juzNum = getJuzForPage(pb.page);
      if (seen.has(juzNum)) return;
      seen.add(juzNum);
      const juzEntry = JUZ_DATA.find((j) => j.juz === juzNum);
      result.push({ juz: juzNum, nameEn: juzEntry?.nameEn ?? `Juz ${juzNum}`, nameAr: juzEntry?.name ?? "", page: pb.page, timestamp: pb.timestamp ?? Date.now() });
    });
    return result.filter((j) => !bq || `juz ${j.juz}`.includes(bq) || j.nameEn.toLowerCase().includes(bq));
  }, [pageBMs, bq]);

  // LISTEN BOOKMARK - AYAAT tab
  const filteredAyahBMs = useMemo(
    () => ayahBMs.filter((b) => !bq || b.surahName.toLowerCase().includes(bq) || String(b.surahNumber).includes(bq) || String(b.ayahNumber).includes(bq)),
    [ayahBMs, bq]
  );

  // LISTEN BOOKMARK - SURAH tab (unique surahs from ayah bookmarks)
  const listenSurahBMs = useMemo(() => {
    const seen = new Set<number>();
    return ayahBMs.filter((b) => {
      if (seen.has(b.surahNumber)) return false;
      seen.add(b.surahNumber);
      return !bq || b.surahName.toLowerCase().includes(bq) || String(b.surahNumber).includes(bq);
    });
  }, [ayahBMs, bq]);

  // LISTEN BOOKMARK - JUZ tab (unique juz from ayah bookmarks)
  const listenJuzBMs = useMemo(() => {
    const seen = new Set<number>();
    return ayahBMs.filter((b) => {
      const juzEntry = JUZ_DATA.slice().reverse().find((j) => j.surahNumber <= b.surahNumber);
      const juzNum = juzEntry?.juz ?? 1;
      if (seen.has(juzNum)) return false;
      seen.add(juzNum);
      return true;
    }).map((b) => {
      const juzEntry = JUZ_DATA.slice().reverse().find((j) => j.surahNumber <= b.surahNumber);
      return { ...b, juz: juzEntry?.juz ?? 1, juzNameEn: juzEntry?.nameEn ?? "", juzNameAr: juzEntry?.name ?? "" };
    });
  }, [ayahBMs, bq]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const deleteAyahBM = useCallback((b: QuranBookmark) => {
    Alert.alert(
      "Remove Bookmark",
      `Remove bookmark for ${b.surahName} · Ayah ${b.ayahNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          await removeQuranBookmark(b.surahNumber, b.ayahNumber);
          getQuranBookmarks().then(setAyahBMs);
        }},
      ]
    );
  }, []);

  const deletePageBM = useCallback(async (page: number) => {
    const updated = pageBMs.filter((b) => b.page !== page);
    setPageBMs(updated);
    await AsyncStorage.setItem(READ_BM_KEY, JSON.stringify(updated));
  }, [pageBMs]);

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderListenSurah = useCallback(({ item }: { item: Surah }) => (
    <Pressable
      onPress={() => router.push(`/quran/${item.number}` as any)}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        setSelectedSurahForInfo(item);
      }}
      delayLongPress={350}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
      testID={`surah-listen-${item.number}`}
    >
      <View style={[styles.numBadge, { backgroundColor: colors.brand + "22" }]}>
        <Text style={[styles.numTxt, { color: colors.brand }]}>{item.number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{item.englishName}</Text>
        <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
          {item.englishNameTranslation} · {item.numberOfAyahs} {t("ayaat")} · {item.revelationType}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={[styles.arabicName, { color: colors.brand }]}>{item.name}</Text>
        <Text style={{ fontSize: 9, color: colors.onSurfaceMuted }}>Hold for Info</Text>
      </View>
    </Pressable>
  ), [colors, router, t]);

  const renderReadSurah = useCallback(({ item }: { item: Surah }) => {
    const startPage = surahStartPages(item.number);
    return (
      <Pressable
        onPress={() => router.push(`/quran/read/${startPage}` as any)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setSelectedSurahForInfo(item);
        }}
        delayLongPress={350}
        style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
        testID={`surah-read-${item.number}`}
      >
        <View style={styles.badgeWrapper}>
          <MaterialCommunityIcons name="octagram" size={42} color={colors.brand + "22"} />
          <Text style={[styles.badgeText, { color: colors.brand }]}>{item.number}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{item.englishName}</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSelectedSurahForInfo(item);
              }}
              style={{ padding: 2 }}
              hitSlop={10}
            >
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.brand} />
            </Pressable>
          </View>
          <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
            {t("pageNo").replace("No. ", "").replace("{page}", String(startPage))} · {item.numberOfAyahs} {t("ayaat")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={[styles.arabicNameRead, { color: colors.onSurface }]}>{item.name}</Text>
          <Text style={{ fontSize: 9, color: colors.onSurfaceMuted }}>Hold for Info</Text>
        </View>
      </Pressable>
    );
  }, [colors, router, surahStartPages, t]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT + theme.spacing.sm,
    offset: (ITEM_HEIGHT + theme.spacing.sm) * index,
    index,
  }), []);

  // ── Shared sub-tab bar renderer ───────────────────────────────────────────
  const SubTabBar = ({ value, onChange }: { value: string; onChange: (v: any) => void }) => (
    <View style={styles.subTabRow}>
      {(["surah", "juz", "bookmark"] as const).map((tab) => (
        <Pressable
          key={tab}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onChange(tab); }}
          style={[styles.subTabBtn, value === tab && { borderBottomColor: colors.brand, borderBottomWidth: 3 }]}
        >
          <Text style={[styles.subTabTxt, { color: value === tab ? colors.brand : colors.onSurfaceMuted }, value === tab && { fontWeight: "700" }]}>
            {t(tab).toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // ── Inline Bookmark Section ───────────────────────────────────────────────
  const InlineBookmarks = ({
    bmTab, setBmTab, surahBMs, juzBMs, ayahBMs, mode,
  }: {
    bmTab: "ayaat" | "surah" | "juz";
    setBmTab: (v: "ayaat" | "surah" | "juz") => void;
    surahBMs: any[];
    juzBMs: any[];
    ayahBMs: QuranBookmark[];
    mode: "read" | "listen";
  }) => (
    <View style={{ flex: 1 }}>
      <View style={[styles.bmTabRow, { borderBottomColor: colors.brand + "44" }]}>
        {(["ayaat", "surah", "juz"] as const).map((tabKey) => (
          <Pressable
            key={tabKey}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); setBmTab(tabKey); }}
            style={[styles.bmTabBtn, bmTab === tabKey && { borderBottomColor: colors.brand, borderBottomWidth: 3 }]}
          >
            <Text style={[styles.bmTabTxt, { color: bmTab === tabKey ? colors.brand : colors.onSurfaceMuted }, bmTab === tabKey && { fontWeight: "800" }]}>
              {t(tabKey).toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {bmTab === "ayaat" && (
        <FlatList
          data={ayahBMs}
          keyExtractor={(b) => `${b.surahNumber}-${b.ayahNumber}`}
          contentContainerStyle={styles.bmList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<BmEmpty message={"No verse bookmarks yet.\nLong-press any verse while listening to bookmark it."} colors={colors} />}
          renderItem={({ item: b }) => (
            <Pressable
              onPress={() => router.push(`/quran/${b.surahNumber}` as any)}
              style={[styles.bmCard, { backgroundColor: colors.surfaceSecondary }]}
            >
              <View style={[styles.numCircle, { borderColor: colors.brand + "66" }]}>
                <Text style={[styles.circleTxt, { color: colors.brand }]}>{b.surahNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{b.surahName}</Text>
                <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>Ayah {b.ayahNumber} · {timeAgo(b.savedAt)}</Text>
                {b.note ? (
                  <Text style={{ fontSize: 12, color: colors.brandSecondary, fontStyle: "italic", marginTop: 4 }}>
                    {"\""}{b.note}{"\""}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Pressable onPress={() => editAyahNote(b)} hitSlop={10}>
                  <MaterialCommunityIcons name="note-edit-outline" size={18} color={colors.brand} />
                </Pressable>
                <Pressable onPress={() => deleteAyahBM(b)} hitSlop={10}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.onSurfaceMuted} />
                </Pressable>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {bmTab === "surah" && (
        <FlatList
          data={surahBMs}
          keyExtractor={(s) => String(s.surahNumber ?? s.number)}
          contentContainerStyle={styles.bmList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<BmEmpty message={"No surah bookmarks yet.\nBookmark verses to see surahs here."} colors={colors} />}
          renderItem={({ item: s }) => (
            <Pressable
              onPress={() => mode === "read" ? router.push(`/quran/read/${s.page}` as any) : router.push(`/quran/${s.surahNumber}` as any)}
              style={[styles.bmCard, { backgroundColor: colors.surfaceSecondary }]}
            >
              <View style={[styles.numCircle, { borderColor: colors.brand + "66" }]}>
                <Text style={[styles.circleTxt, { color: colors.brand }]}>{s.surahNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{s.surahName}</Text>
                <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
                  {s.arabicName ? `${s.arabicName} · ` : ""}{s.totalAyahs} ayahs
                </Text>
              </View>
              <MaterialCommunityIcons name="bookmark" size={20} color={colors.brand} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}

      {bmTab === "juz" && (
        <FlatList
          data={juzBMs}
          keyExtractor={(j) => String(j.juz)}
          contentContainerStyle={styles.bmList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<BmEmpty message={"No juz bookmarks yet.\nBookmark verses to see juz here."} colors={colors} />}
          renderItem={({ item: j }) => (
            <Pressable
              onPress={() => mode === "read" ? router.push(`/quran/read/${j.page}` as any) : router.push(`/quran/${j.surahNumber ?? 1}` as any)}
              style={[styles.bmCard, { backgroundColor: colors.surfaceSecondary }]}
            >
              <View style={[styles.numCircle, { borderColor: colors.brandSecondary + "66" }]}>
                <Text style={[styles.circleTxt, { color: colors.brandSecondary }]}>{j.juz}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{t("juz")} {j.juz} — {j.nameEn ?? j.juzNameEn}</Text>
                <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>{j.nameAr ?? j.juzNameAr}</Text>
              </View>
              <MaterialCommunityIcons name="bookmark" size={20} color={colors.brand} />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );

  // ─── JSX ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="quran-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("nobleQuran")}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Read vs Listen vs Learn Segment */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Pressable
          onPress={() => setActiveTab("read")}
          style={[styles.segmentBtn, activeTab === "read" && [styles.segmentBtnActive, { backgroundColor: colors.brand }]]}
        >
          <MaterialCommunityIcons name="book-open-variant" size={16} color={activeTab === "read" ? colors.onBrandPrimary : colors.onSurfaceMuted} />
          <Text style={[styles.segmentTxt, { color: activeTab === "read" ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>{t("read")}</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("listen")}
          style={[styles.segmentBtn, activeTab === "listen" && [styles.segmentBtnActive, { backgroundColor: colors.brand }]]}
        >
          <MaterialCommunityIcons name="volume-high" size={16} color={activeTab === "listen" ? colors.onBrandPrimary : colors.onSurfaceMuted} />
          <Text style={[styles.segmentTxt, { color: activeTab === "listen" ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>{t("listen")}</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("learn")}
          style={[styles.segmentBtn, activeTab === "learn" && [styles.segmentBtnActive, { backgroundColor: colors.brand }]]}
        >
          <MaterialCommunityIcons name="brain" size={16} color={activeTab === "learn" ? colors.onBrandPrimary : colors.onSurfaceMuted} />
          <Text style={[styles.segmentTxt, { color: activeTab === "learn" ? colors.onBrandPrimary : colors.onSurfaceMuted }]}>{t("learn")}</Text>
        </Pressable>
      </View>

      {/* Search */}
      {activeTab !== "learn" && (
        <View style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceMuted} />
          <TextInput
            value={q} onChangeText={setQ}
            placeholder={activeTab === "read" ? t("searchPageOrSurah") : t("searchSurahName")}
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
      )}

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : activeTab === "learn" ? (
        <LearnQuranView />
      ) : activeTab === "listen" ? (
        // ══════════════════════════════════════════════════════════════════════
        // LISTEN MODE
        // ══════════════════════════════════════════════════════════════════════
        <View style={{ flex: 1 }}>
          {/* Listen Resume Banner */}
          <Pressable
            onPress={() => lastPlayed ? router.push(`/quran/${lastPlayed.surahNumber}` as any) : null}
            style={[styles.resumeBanner, { backgroundColor: colors.brand + "15", opacity: lastPlayed ? 1 : 0.5 }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <MaterialCommunityIcons name="play-circle" size={28} color={colors.brand} />
              <View>
                {lastPlayed ? (
                  <>
                    <Text style={[styles.resumeTitle, { color: colors.onSurface }]}>{lastPlayed.surahName} · Ayah {lastPlayed.ayahNumber}</Text>
                    <Text style={[styles.resumeSub, { color: colors.onSurfaceMuted }]}>{t("resumeListening")} · {timeAgo(lastPlayed.readAt)}</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.resumeTitle, { color: colors.onSurface }]}>{t("noRecentAudio")}</Text>
                    <Text style={[styles.resumeSub, { color: colors.onSurfaceMuted }]}>{t("startListeningTrack")}</Text>
                  </>
                )}
              </View>
            </View>
            {lastPlayed && (
              <View style={[styles.resumeBtn, { backgroundColor: colors.brand }]}>
                <Text style={[styles.resumeBtnTxt, { color: colors.onBrandPrimary }]}>{t("resume")}</Text>
              </View>
            )}
          </Pressable>

          {/* Listen sub-tabs */}
          <SubTabBar value={listenSubTab} onChange={setListenSubTab} />

          {/* Listen SURAH */}
          {listenSubTab === "surah" && (
            <FlatList
              data={filteredSurahs}
              keyExtractor={(s) => String(s.number)}
              renderItem={renderListenSurah}
              getItemLayout={getItemLayout}
              contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Listen JUZ — navigate to first surah of the juz */}
          {listenSubTab === "juz" && (
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}>
              {JUZ_DATA.map((juz) => (
                <Pressable
                  key={juz.juz}
                  onPress={() => router.push(`/quran/${juz.surahNumber}` as any)}
                  style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.numBadge, { backgroundColor: colors.brandSecondary + "22" }]}>
                    <Text style={[styles.numTxt, { color: colors.brandSecondary }]}>{juz.juz}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{t("juz")} {juz.juz} — {juz.nameEn}</Text>
                    <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
                      {juz.name} · {t("surah")} {juz.surahNumber}, Ayah {juz.ayahNumber}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Listen BOOKMARK — inline AYAAT/SURAH/JUZ */}
          {listenSubTab === "bookmark" && (
            <InlineBookmarks
              bmTab={listenBmTab}
              setBmTab={setListenBmTab}
              surahBMs={listenSurahBMs.map((b) => ({ surahNumber: b.surahNumber, surahName: b.surahName, arabicName: "", totalAyahs: 0 }))}
              juzBMs={listenJuzBMs.map((j) => ({ juz: j.juz, nameEn: j.juzNameEn, nameAr: j.juzNameAr, surahNumber: j.surahNumber }))}
              ayahBMs={filteredAyahBMs}
              mode="listen"
            />
          )}
        </View>
      ) : (
        // ══════════════════════════════════════════════════════════════════════
        // READ MODE
        // ══════════════════════════════════════════════════════════════════════
        <View style={{ flex: 1 }}>
          {/* Read Resume Banner */}
          <Pressable
            onPress={() => router.push(`/quran/read/${lastReadPage}` as any)}
            style={[styles.resumeBanner, { backgroundColor: colors.brandSecondary + "15" }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <MaterialCommunityIcons name="book-open-outline" size={28} color={colors.brandSecondary} />
              <View>
                <Text style={[styles.resumeTitle, { color: colors.onSurface }]}>{t("pageNo").replace("{page}", String(lastReadPage))}</Text>
                <Text style={[styles.resumeSub, { color: colors.onSurfaceMuted }]}>{t("continueRecitation")}</Text>
              </View>
            </View>
            <View style={[styles.resumeBtn, { backgroundColor: colors.brandSecondary }]}>
              <Text style={[styles.resumeBtnTxt, { color: colors.onBrandPrimary }]}>{t("resume")}</Text>
            </View>
          </Pressable>

          {/* Read sub-tabs */}
          <SubTabBar value={readSubTab} onChange={setReadSubTab} />

          {/* Read SURAH */}
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

          {/* Read JUZ */}
          {readSubTab === "juz" && (
            <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}>
              {JUZ_DATA.map((juz) => (
                <Pressable
                  key={juz.juz}
                  onPress={() => router.push(`/quran/read/${JUZ_START_PAGES[juz.juz - 1]}` as any)}
                  style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
                >
                  <View style={[styles.numBadge, { backgroundColor: colors.brandSecondary + "22" }]}>
                    <Text style={[styles.numTxt, { color: colors.brandSecondary }]}>{juz.juz}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: colors.onSurface }]}>Juz {juz.juz} — {juz.nameEn}</Text>
                    <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
                      {juz.name} · Starts at Page {JUZ_START_PAGES[juz.juz - 1]}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Read BOOKMARK — inline AYAAT/SURAH/JUZ */}
          {readSubTab === "bookmark" && (
            <InlineBookmarks
              bmTab={readBmTab}
              setBmTab={setReadBmTab}
              surahBMs={readSurahBMs}
              juzBMs={readJuzBMs}
              ayahBMs={filteredAyahBMs}
              mode="read"
            />
          )}
        </View>
      )}

      {/* Personal Note Edit Modal */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.noteModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.noteModalHeader}>
              <Text style={[styles.noteModalTitle, { color: colors.onSurface }]}>Verse Reflection Note</Text>
              <Pressable onPress={() => setNoteModalVisible(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>

            {editingBookmark && (
              <Text style={{ fontSize: 13, color: colors.brand, fontWeight: "700", marginBottom: 12 }}>
                {editingBookmark.surahName} · Ayah {editingBookmark.ayahNumber}
              </Text>
            )}

            <TextInput
              value={noteInput}
              onChangeText={setNoteInput}
              placeholder="Write your reflections, notes, or lessons from this verse..."
              placeholderTextColor={colors.onSurfaceMuted}
              multiline
              numberOfLines={4}
              style={[
                styles.noteInputText,
                {
                  color: colors.onSurface,
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                },
              ]}
            />

            <View style={styles.noteModalActions}>
              <Pressable
                onPress={() => setNoteModalVisible(false)}
                style={[styles.noteBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={saveNote}
                style={[styles.noteBtn, { backgroundColor: colors.brand }]}
              >
                <Text style={{ color: colors.onBrandPrimary, fontWeight: "700" }}>Save Note</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Surah Information Modal (Tier-1 Enhancement) */}
      <Modal
        visible={selectedSurahForInfo !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSurahForInfo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.infoModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoModalHeader}>
              <View>
                <Text style={[styles.infoModalTitle, { color: colors.onSurface }]}>
                  {selectedSurahForInfo?.englishName}
                </Text>
                <Text style={{ fontSize: 13, color: colors.brand, fontWeight: "600" }}>
                  {selectedSurahForInfo?.englishNameTranslation}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedSurahForInfo(null)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>

            {selectedSurahForInfo && (() => {
              const info = SURAH_INFO_DATA[selectedSurahForInfo.number] || {
                placeOfRevelation: selectedSurahForInfo.revelationType === "Meccan" ? "Makkah" : "Madinah",
                revelationOrder: 0,
                mainThemes: ["Monotheism", "Prophethood", "Hereafter"],
                keyTopics: ["Guidance", "Faith", "Stories of the Prophets"]
              };

              return (
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
                  {/* Quick stats row */}
                  <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.brand} />
                      <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>Revealed In</Text>
                      <Text style={[styles.statValue, { color: colors.onSurface }]}>
                        {info.placeOfRevelation}
                      </Text>
                    </View>

                    <View style={[styles.statBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <MaterialCommunityIcons name="format-list-numbered" size={20} color={colors.brand} />
                      <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>Revelation Order</Text>
                      <Text style={[styles.statValue, { color: colors.onSurface }]}>
                        #{info.revelationOrder || "N/A"}
                      </Text>
                    </View>

                    <View style={[styles.statBox, { backgroundColor: colors.surfaceSecondary }]}>
                      <MaterialCommunityIcons name="book-open-page-variant" size={20} color={colors.brand} />
                      <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>Total Verses</Text>
                      <Text style={[styles.statValue, { color: colors.onSurface }]}>
                        {selectedSurahForInfo.numberOfAyahs}
                      </Text>
                    </View>
                  </View>

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20 }} />

                  {/* Main Themes */}
                  <Text style={[styles.sectionTitle, { color: colors.brand }]}>Main Themes</Text>
                  {info.mainThemes.map((themeStr, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <MaterialCommunityIcons name="star-four-points" size={14} color={colors.brand} style={{ marginTop: 3 }} />
                      <Text style={[styles.bulletText, { color: colors.onSurfaceSecondary }]}>{themeStr}</Text>
                    </View>
                  ))}

                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20 }} />

                  {/* Key Topics */}
                  <Text style={[styles.sectionTitle, { color: colors.brand }]}>Key Topics covered</Text>
                  {info.keyTopics.map((topic, index) => (
                    <View key={index} style={styles.bulletItem}>
                      <MaterialCommunityIcons name="circle-medium" size={16} color={colors.brand} style={{ marginTop: 2 }} />
                      <Text style={[styles.bulletText, { color: colors.onSurfaceSecondary }]}>{topic}</Text>
                    </View>
                  ))}

                  {(() => {
                    const detailedLangs = ["en", "id", "it", "ml", "ta", "ur"];
                    let activeDetailedLang = detailedLangs.includes(language) ? language : "en";
                    if (activeDetailedLang === "ta" && selectedSurahForInfo?.number !== 3) {
                      activeDetailedLang = "en";
                    }
                    const detailedText = selectedSurahForInfo
                      ? (surahInfoDetailed as any)[String(selectedSurahForInfo.number)]?.[activeDetailedLang] || ""
                      : "";

                    if (!detailedText) return null;
                    return (
                      <>
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 20 }} />
                        <Text style={[styles.sectionTitle, { color: colors.brand }]}>Surah History & Context</Text>
                        {parseHtmlToElements(detailedText, colors)}
                      </>
                    );
                  })()}
                </ScrollView>
              );
            })()}

            <Pressable
              onPress={() => setSelectedSurahForInfo(null)}
              style={[styles.infoBtnClose, { backgroundColor: colors.brand }]}
            >
              <Text style={{ color: colors.onBrandPrimary, fontWeight: "700" }}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Empty state component ─────────────────────────────────────────────────────
function BmEmpty({ message, colors }: { message: string; colors: any }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 48, gap: 10, paddingHorizontal: 32 }}>
      <MaterialCommunityIcons name="bookmark-off-outline" size={52} color={colors.onSurfaceMuted} />
      <Text style={{ color: colors.onSurfaceMuted, fontSize: 13, textAlign: "center", lineHeight: 20 }}>{message}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
  },
  title: { fontSize: 20, fontWeight: "700" },
  segmentContainer: {
    flexDirection: "row", marginHorizontal: theme.spacing.lg,
    padding: 4, borderRadius: 12, marginBottom: theme.spacing.md,
  },
  segmentBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 8,
  },
  segmentBtnActive: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  segmentTxt: { fontSize: 13, fontWeight: "700" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", marginHorizontal: theme.spacing.lg,
    paddingHorizontal: 14, borderRadius: 12, gap: 8, marginBottom: 12,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 14 },
  resumeBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: theme.spacing.lg, padding: theme.spacing.md,
    borderRadius: theme.radius.lg, marginBottom: theme.spacing.md,
  },
  resumeTitle: { fontSize: 15, fontWeight: "700" },
  resumeSub: { fontSize: 11, marginTop: 2 },
  resumeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  resumeBtnTxt: { fontSize: 12, fontWeight: "700" },
  subTabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(255, 255, 255, 0.08)" },
  subTabBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  subTabTxt: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  bmTabRow: { flexDirection: "row", borderBottomWidth: 1 },
  bmTabBtn: { flex: 1, paddingVertical: 13, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  bmTabTxt: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  bmList: { padding: theme.spacing.lg, paddingBottom: 48 },
  bmCard: {
    flexDirection: "row", alignItems: "center", padding: theme.spacing.md,
    borderRadius: theme.radius.lg, gap: 12,
  },
  numCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  circleTxt: { fontWeight: "800", fontSize: 14 },
  row: {
    flexDirection: "row", alignItems: "center", padding: theme.spacing.lg,
    borderRadius: theme.radius.lg, gap: theme.spacing.md, height: ITEM_HEIGHT,
  },
  numBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  numTxt: { fontWeight: "700" },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  arabicName: { fontFamily: "Amiri", fontSize: 22 },
  arabicNameRead: { fontSize: 16, fontWeight: "700" },
  badgeWrapper: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  badgeText: { position: "absolute", fontSize: 12, fontWeight: "800" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noteModalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  noteModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  noteInputText: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  noteModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  noteBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoModalContent: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  infoModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  bulletItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  infoBtnClose: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
});

function parseHtmlToElements(html: string, colors: any) {
  if (!html) return null;

  // Clean HTML: Keep only allowed tags, strip attributes, and remove unhandled tags completely
  let cleaned = html.replace(/<(\/?[a-zA-Z0-9]+)([^>]*)>/g, (match, tag) => {
    const normTag = tag.toLowerCase();
    if (normTag === "h2" || normTag === "p" || normTag === "strong" || normTag === "br") {
      return `<${normTag}>`;
    }
    if (normTag === "/h2" || normTag === "/p" || normTag === "/strong") {
      return `<${normTag}>`;
    }
    return "";
  });

  // Split into paragraphs by <p> tags and headings by <h2> tags
  const blocks = cleaned.split(/(<\/?[pP]>|<\/?[hH]2>|<br\s*\/?>)/g);
  
  const elements: React.ReactNode[] = [];
  let currentBlockType: "p" | "h2" | "br" = "p";
  
  blocks.forEach((block, blockIdx) => {
    const cleanBlock = block.trim();
    if (!cleanBlock) return;
    
    const tag = cleanBlock.toLowerCase();
    if (tag === "<p>") {
      currentBlockType = "p";
      return;
    }
    if (tag === "</p>") {
      return;
    }
    if (tag === "<h2>") {
      currentBlockType = "h2";
      return;
    }
    if (tag === "</h2>") {
      return;
    }
    if (tag === "<br>" || tag === "<br/>" || tag === "<br />") {
      elements.push(<View key={`br-${blockIdx}`} style={{ height: 8 }} />);
      return;
    }
    
    // Within this block, parse <strong> tags
    const spans = cleanBlock.split(/(<\/?[sS][tT][rR][oO][nN][gG]>)/g);
    let isStrong = false;
    const blockChildren: React.ReactNode[] = [];
    
    spans.forEach((span, spanIdx) => {
      const spanTag = span.toLowerCase();
      if (spanTag === "<strong>") {
        isStrong = true;
        return;
      }
      if (spanTag === "</strong>") {
        isStrong = false;
        return;
      }
      
      // Decode HTML entities
      const text = span
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
        
      blockChildren.push(
        <Text
          key={`span-${spanIdx}`}
          style={[
            isStrong && { fontWeight: "700", color: colors.onSurface },
          ]}
        >
          {text}
        </Text>
      );
    });
    
    if (currentBlockType === "h2") {
      elements.push(
        <Text
          key={`h2-${blockIdx}`}
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: colors.brand,
            marginTop: 18,
            marginBottom: 8,
            fontFamily: "System",
          }}
        >
          {blockChildren}
        </Text>
      );
    } else {
      elements.push(
        <Text
          key={`p-${blockIdx}`}
          style={{
            fontSize: 14,
            lineHeight: 22,
            color: colors.onSurfaceSecondary,
            marginBottom: 12,
            fontFamily: "System",
          }}
        >
          {blockChildren}
        </Text>
      );
    }
  });
  
  return <View style={{ marginTop: 10 }}>{elements}</View>;
}
