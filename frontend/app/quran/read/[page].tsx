import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, ActivityIndicator, Image, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { SURAH_START_PAGES } from "@/src/data/surahPages";

const { width, height } = Dimensions.get("window");
const TOTAL_PAGES = 604;

// Build reverse map: page number → surah number (uses the surah that starts on or before this page)
const PAGE_TO_SURAH: Record<number, number> = (() => {
  const entries = Object.entries(SURAH_START_PAGES)
    .map(([surah, page]) => ({ surah: Number(surah), page: Number(page) }))
    .sort((a, b) => a.page - b.page);
  const map: Record<number, number> = {};
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    let currentSurah = entries[0].surah;
    for (const { surah, page } of entries) {
      if (page <= p) currentSurah = surah;
      else break;
    }
    map[p] = currentSurah;
  }
  return map;
})();

const QuranPageItem = ({
  item, isNightMode, colors, width, height,
}: {
  item: number; isNightMode: boolean; colors: any;
  width: number; height: number;
}) => {
  const [itemLoading, setItemLoading] = useState(true);
  const pageStr = String(item).padStart(3, "0");
  const imageUrl = `https://quran.islam-db.com/public/data/pages/quranpages_1024/images/page${pageStr}.png`;
  const pageHeight = height - 160;

  return (
    <View style={{ width, height: pageHeight, backgroundColor: isNightMode ? "#1A1A2E" : "#FAFAF7" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        maximumZoomScale={4}
        minimumZoomScale={1}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bouncesZoom
      >
        <View style={{ width, height: pageHeight, alignItems: "center", justifyContent: "center" }}>
          {itemLoading && (
            <ActivityIndicator size="large" color={colors.brand} style={StyleSheet.absoluteFillObject} />
          )}
          <Image
            source={{ uri: imageUrl }}
            style={{ width: width - 8, height: pageHeight - 8, resizeMode: "contain" }}
            onLoadStart={() => setItemLoading(true)}
            onLoadEnd={() => setItemLoading(false)}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default function QuranReadScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [currentPage, setCurrentPage] = useState(Number(page) || 1);
  const [isNightMode, setIsNightMode] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const initialDist = useRef<number | null>(null);
  const baseScale = useRef<number>(1);

  useEffect(() => {
    AsyncStorage.getItem("islamic_hikmah:bookmarked_pages").then((raw) => {
      if (raw) setBookmarks(JSON.parse(raw));
    });
    AsyncStorage.getItem("islamic_hikmah:read_night_mode").then((val) => {
      if (val !== null) setIsNightMode(val === "true");
    });
  }, []);

  const saveLastRead = async (pageNum: number) => {
    try { await AsyncStorage.setItem("islamic_hikmah:last_read_page", String(pageNum)); } catch {}
  };

  const toggleBookmark = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    let updated = [...bookmarks];
    if (updated.includes(currentPage)) {
      updated = updated.filter((p) => p !== currentPage);
    } else {
      updated.push(currentPage);
    }
    setBookmarks(updated);
    await AsyncStorage.setItem("islamic_hikmah:bookmarked_pages", JSON.stringify(updated));
  };

  const toggleNightMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const val = !isNightMode;
    setIsNightMode(val);
    await AsyncStorage.setItem("islamic_hikmah:read_night_mode", String(val));
  };

  // Navigate to the Listen Quran screen for the surah on this page
  const openRecitation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const surahNumber = PAGE_TO_SURAH[currentPage] ?? 1;
    router.push(`/quran/${surahNumber}` as any);
  }, [currentPage, router]);

  const onScroll = useCallback((e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const pageNum = Math.round(offset / width) + 1;
    if (pageNum >= 1 && pageNum <= TOTAL_PAGES && pageNum !== currentPage) {
      setCurrentPage(pageNum);
      saveLastRead(pageNum);
    }
  }, [currentPage]);

  const isBookmarked = bookmarks.includes(currentPage);
  const pagesData = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

  const renderPage = useCallback(({ item }: { item: number }) => (
    <QuranPageItem
      item={item} isNightMode={isNightMode} colors={colors}
      width={width} height={height}
    />
  ), [isNightMode, colors]);

  const handleTouchStart = (e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches?.length === 2) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      initialDist.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: any) => {
    const touches = e.nativeEvent.touches;
    if (touches?.length === 2 && initialDist.current !== null) {
      const dx = touches[0].pageX - touches[1].pageX;
      const dy = touches[0].pageY - touches[1].pageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchEnd = () => { initialDist.current = null; };

  const iconColor = isNightMode ? "#FFF" : "#5C4E3C";

  return (
    <View style={[styles.container, { backgroundColor: isNightMode ? "#1A1A2E" : "#FAFAF7" }]}>
      {/* Header */}
      <View style={[styles.header, {
        borderBottomColor: isNightMode ? "#1E293B" : "#E2E8F0",
        backgroundColor: isNightMode ? "#000000" : "#FFFFFF",
      }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={iconColor} />
        </Pressable>
        <Text style={[styles.title, { color: iconColor }]}>
          Page {currentPage} of {TOTAL_PAGES}
        </Text>
        <Text style={{ color: iconColor, fontSize: 11, opacity: 0.6 }}>Pinch to zoom</Text>
      </View>

      {/* Page swiper */}
      <View style={{ flex: 1 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <FlatList
          ref={flatListRef}
          horizontal pagingEnabled
          data={pagesData}
          keyExtractor={(item) => String(item)}
          renderItem={renderPage}
          onScroll={onScroll}
          scrollEventThrottle={16}
          initialScrollIndex={currentPage - 1}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, {
        backgroundColor: isNightMode ? "#000000" : "#FFFFFF",
        borderTopColor: isNightMode ? "#1E293B" : "#E2E8F0",
      }]}>
        {/* Night mode toggle */}
        <Pressable onPress={toggleNightMode} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isNightMode ? "weather-night" : "weather-sunny"}
            size={24} color={isNightMode ? colors.brand : iconColor}
          />
        </Pressable>

        {/* Recitation — navigates to Listen Quran for the surah on this page */}
        <Pressable onPress={openRecitation} style={styles.barBtn}>
          <MaterialCommunityIcons name="volume-high" size={24} color={iconColor} />
          <Text style={{ color: iconColor, fontSize: 9, marginTop: 2, fontWeight: "600" }}>
            Listen
          </Text>
        </Pressable>

        {/* Bookmark this page */}
        <Pressable onPress={toggleBookmark} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24} color={isBookmarked ? colors.brand : iconColor}
          />
        </Pressable>

        {/* Quick Settings */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/quran/personalise");
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color={iconColor} />
          <Text style={{ color: iconColor, fontSize: 9, marginTop: 2, fontWeight: "600" }}>
            Settings
          </Text>
        </Pressable>
      </View>
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
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontWeight: "700" },
  pageContainer: {
    flex: 1,
    paddingVertical: 12,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 14,
    borderTopWidth: 1,
    paddingBottom: 28,
  },
  barBtn: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
