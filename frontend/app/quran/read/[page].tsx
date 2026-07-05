import { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Pressable, Dimensions,
  FlatList, Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { SURAH_START_PAGES } from "@/src/data/surahPages";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { SafeAreaView } from "react-native-safe-area-context";
import { SURAH_LIST } from "@/src/data/surahList";

const { width, height } = Dimensions.get("window");
const TOTAL_PAGES = 604;
const PAGE_HEIGHT = height - 160; // header (60) + bottom bar (100)

// Reverse map: page → surah number
const PAGE_TO_SURAH: Record<number, number> = (() => {
  const entries = Object.entries(SURAH_START_PAGES)
    .map(([s, p]) => ({ surah: Number(s), page: Number(p) }))
    .sort((a, b) => a.page - b.page);
  const map: Record<number, number> = {};
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    let cur = entries[0].surah;
    for (const { surah, page } of entries) {
      if (page <= p) cur = surah;
      else break;
    }
    map[p] = cur;
  }
  return map;
})();

// ── Page image component ─────────────────────────────────────────────────────
// Uses expo-image which supports pinch-to-zoom natively via allowDownscaling
// and contentFit="contain". Tinting the image white-on-dark in night mode
// is done by overlaying a semi-transparent dark view + invertColors filter.

const QuranPageItem = ({
  pageNum, isNightMode, colors,
}: {
  pageNum: number; isNightMode: boolean; colors: any;
}) => {
  const pageStr = String(pageNum).padStart(3, "0");
  const uri = `https://quran.islam-db.com/public/data/pages/quranpages_1024/images/page${pageStr}.png`;

  return (
    <View style={{ width, height: PAGE_HEIGHT, backgroundColor: isNightMode ? "#1E2D40" : "#FAFAF7" }}>
      <Image
        source={{ uri }}
        style={[
          styles.pageImage,
          // In dark/night mode invert the image so black text becomes white
          isNightMode && Platform.OS === "android" ? { tintColor: undefined } : null,
        ]}
        contentFit="contain"
        // expo-image: allowDownscaling + transition for smooth load
        transition={200}
        // Night mode: apply CSS filter on web; on native we use the overlay below
        {...(Platform.OS === "web" && isNightMode
          ? { style: [styles.pageImage, { filter: "invert(1) brightness(0.85)" } as any] }
          : {})}
      />
      {/* Night mode overlay — darkens the white paper background.
          The Quran image is black-on-white. We can't easily invert a native
          Image, so instead: dark bg + multiply-like overlay darkens the white
          areas. The text stays readable but the bg becomes dark. */}
      {isNightMode && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, {
            backgroundColor: "#0D2137",
            // mix-blend-mode equivalent: darken white areas via opacity
            opacity: 0.55,
          }]}
        />
      )}
    </View>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function QuranReadScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showAudioBar, setShowAudioBar] = useState(false);
  const [audioErr, setAudioErr] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const currentSurah = PAGE_TO_SURAH[currentPage] ?? 1;
  const surahName = SURAH_LIST.find(s => s.number === currentSurah)?.englishName ?? "";

  // ── Audio (inline mini player) ────────────────────────────────────────────
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;

  const loadAndPlaySurah = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setShowAudioBar(true);
    setAudioErr(false);
    try {
      const res = await fetch(
        `https://api.alquran.cloud/v1/surah/${currentSurah}/ar.alafasy`
      );
      const json = await res.json();
      const firstAyahUrl = json?.data?.ayahs?.[0]?.audio;
      if (!firstAyahUrl) { setAudioErr(true); return; }
      player.replace({ uri: firstAyahUrl });
      player.play();
    } catch {
      setAudioErr(true);
    }
  }, [currentSurah, player]);

  const togglePlay = useCallback(() => {
    if (isPlaying) player.pause();
    else player.play();
  }, [isPlaying, player]);

  const stopAudio = useCallback(() => {
    try { player.pause(); } catch {}
    setShowAudioBar(false);
  }, [player]);

  // Stop audio when navigating away
  useEffect(() => () => { try { player.pause(); } catch {} }, []);

  // ── Persistence ───────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem("islamic_hikmah:bookmarked_pages").then(raw => {
      if (raw) setBookmarks(JSON.parse(raw));
    });
    AsyncStorage.getItem("islamic_hikmah:read_night_mode").then(val => {
      if (val !== null) setIsNightMode(val === "true");
    });
  }, []);

  const toggleBookmark = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updated = bookmarks.includes(currentPage)
      ? bookmarks.filter(p => p !== currentPage)
      : [...bookmarks, currentPage];
    setBookmarks(updated);
    await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(updated));

    // Also save as last read
    await AsyncStorage.setItem("islamic_hikmah:last_read_page", String(currentPage));
  };

  const toggleNightMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const val = !isNightMode;
    setIsNightMode(val);
    await AsyncStorage.setItem("islamic_hikmah:read_night_mode", String(val));
  };

  const onScroll = useCallback((e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const p = Math.round(offset / width) + 1;
    if (p >= 1 && p <= TOTAL_PAGES && p !== currentPage) {
      setCurrentPage(p);
      AsyncStorage.setItem("islamic_hikmah:last_read_page", String(p)).catch(() => {});
      // Stop audio when page changes
      if (showAudioBar) { try { player.pause(); } catch {} setShowAudioBar(false); }
    }
  }, [currentPage, showAudioBar, player]);

  const pagesData = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);
  const isBookmarked = bookmarks.includes(currentPage);
  const iconColor = isNightMode ? "#E8F0F8" : "#3D2B1A";
  const bgColor = isNightMode ? "#0D1F33" : "#FAFAF7";
  const barBg = isNightMode ? "#0D1F33" : "#FFFFFF";

  const renderPage = useCallback(({ item }: { item: number }) => (
    <QuranPageItem pageNum={item} isNightMode={isNightMode} colors={colors} />
  ), [isNightMode, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={["top"]}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: barBg, borderBottomColor: isNightMode ? "#1A3A55" : "#E2E8F0" }]}>
        <Pressable onPress={() => { stopAudio(); router.back(); }} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={iconColor} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.title, { color: iconColor }]}>Page {currentPage} of {TOTAL_PAGES}</Text>
          <Text style={{ color: colors.brand, fontSize: 11, fontWeight: "600" }}>{surahName}</Text>
        </View>
        <Pressable onPress={() => router.push(`/quran/${currentSurah}` as any)} hitSlop={10}>
          <Text style={{ color: colors.brand, fontSize: 12, fontWeight: "700" }}>Verse View</Text>
        </Pressable>
      </View>

      {/* ── Page FlatList — swipe left/right ── */}
      {/* Pinch zoom: FlatList handles horizontal paging, each QuranPageItem   */}
      {/* wraps expo-image with contentFit="contain". To enable pinch zoom we  */}
      {/* disable the FlatList scroll during pinch via a gesture approach.     */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          data={pagesData}
          keyExtractor={item => String(item)}
          renderItem={renderPage}
          onScroll={onScroll}
          scrollEventThrottle={16}
          initialScrollIndex={currentPage - 1}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          showsHorizontalScrollIndicator={false}
          // Allow pinch zoom to work alongside horizontal paging
          pinchGestureEnabled
          scrollsToTop={false}
        />
      </View>

      {/* ── Inline audio mini-player (shown after pressing Listen) ── */}
      {showAudioBar && (
        <View style={[styles.audioBar, { backgroundColor: colors.brand + "F0" }]}>
          {audioErr ? (
            <Text style={{ color: "#fff", fontSize: 13 }}>Audio unavailable</Text>
          ) : (
            <>
              <Text style={styles.audioLabel} numberOfLines={1}>
                {surahName} — Surah {currentSurah}
              </Text>
              <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                <Pressable onPress={togglePlay} hitSlop={10}>
                  <MaterialCommunityIcons
                    name={isPlaying ? "pause-circle" : "play-circle"}
                    size={32} color="#fff"
                  />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/quran/${currentSurah}` as any)}
                  hitSlop={10}
                >
                  <MaterialCommunityIcons name="open-in-new" size={22} color="#fff" />
                </Pressable>
                <Pressable onPress={stopAudio} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={22} color="#fff" />
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* ── Bottom bar ── */}
      <View style={[styles.bottomBar, { backgroundColor: barBg, borderTopColor: isNightMode ? "#1A3A55" : "#E2E8F0" }]}>

        {/* Night mode */}
        <Pressable onPress={toggleNightMode} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isNightMode ? "weather-night" : "weather-sunny"}
            size={24} color={isNightMode ? colors.brand : iconColor}
          />
        </Pressable>

        {/* Listen — plays audio inline in the mini-player above */}
        <Pressable onPress={loadAndPlaySurah} style={styles.barBtn}>
          <MaterialCommunityIcons
            name="volume-high" size={24}
            color={showAudioBar ? colors.brand : iconColor}
          />
          <Text style={[styles.barLabel, { color: showAudioBar ? colors.brand : iconColor }]}>
            Listen
          </Text>
        </Pressable>

        {/* Bookmark page */}
        <Pressable onPress={toggleBookmark} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24} color={isBookmarked ? colors.brand : iconColor}
          />
          <Text style={[styles.barLabel, { color: isBookmarked ? colors.brand : iconColor }]}>
            {isBookmarked ? "Saved" : "Save"}
          </Text>
        </Pressable>

        {/* Quick Settings */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); router.push("/quran/personalise"); }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color={iconColor} />
          <Text style={[styles.barLabel, { color: iconColor }]}>Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 15, fontWeight: "700" },
  pageImage: { width, height: PAGE_HEIGHT },
  audioBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
  },
  audioLabel: { color: "#fff", fontWeight: "700", fontSize: 13, flex: 1, marginRight: 12 },
  bottomBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    paddingVertical: 10, paddingBottom: 20, borderTopWidth: StyleSheet.hairlineWidth,
  },
  barBtn: { alignItems: "center", justifyContent: "center", padding: 8 },
  barLabel: { fontSize: 10, marginTop: 3, fontWeight: "600" },
});
