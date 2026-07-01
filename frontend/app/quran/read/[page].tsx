import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Dimensions, FlatList, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
const TOTAL_PAGES = 604;

const QuranPageItem = ({
  item,
  isNightMode,
  colors,
  width,
  height,
}: {
  item: number;
  isNightMode: boolean;
  colors: any;
  width: number;
  height: number;
}) => {
  const [itemLoading, setItemLoading] = useState(true);
  const pageStr = String(item).padStart(3, "0");
  const imageUrl = `https://quran.islam-db.com/public/data/pages/quranpages_1024/images/page${pageStr}.png`;

  return (
    <View style={[styles.pageContainer, { width, height: height - 180 }]}>
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.pageImage,
          isNightMode && {
            opacity: 0.8,
          },
        ]}
        resizeMode="contain"
        onLoadStart={() => setItemLoading(true)}
        onLoadEnd={() => setItemLoading(false)}
      />
      {itemLoading && (
        <ActivityIndicator
          size="large"
          color={colors.brand}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      {isNightMode && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.15)", pointerEvents: "none" }]} />}
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

  // Load last read & bookmarks
  useEffect(() => {
    AsyncStorage.getItem("islamic_hikmah:bookmarked_pages").then((raw) => {
      if (raw) setBookmarks(JSON.parse(raw));
    });
    AsyncStorage.getItem("islamic_hikmah:read_night_mode").then((val) => {
      if (val !== null) setIsNightMode(val === "true");
    });
  }, []);

  const saveLastRead = async (pageNum: number) => {
    try {
      await AsyncStorage.setItem("islamic_hikmah:last_read_page", String(pageNum));
    } catch {}
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

  const onScroll = useCallback((e: any) => {
    const offset = e.nativeEvent.contentOffset.x;
    const pageNum = Math.round(offset / width) + 1;
    if (pageNum >= 1 && pageNum <= TOTAL_PAGES && pageNum !== currentPage) {
      setCurrentPage(pageNum);
      saveLastRead(pageNum);
    }
  }, [currentPage]);

  const getPaddedPage = (num: number) => {
    return String(num).padStart(3, "0");
  };

  const isBookmarked = bookmarks.includes(currentPage);

  // Generate list data: Array of pages [1..604]
  const pagesData = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1);

  const renderPage = useCallback(({ item }: { item: number }) => (
    <QuranPageItem
      item={item}
      isNightMode={isNightMode}
      colors={colors}
      width={width}
      height={height}
    />
  ), [isNightMode, colors]);

  return (
    <View style={[styles.container, { backgroundColor: isNightMode ? "#090D16" : "#FAF6F0" }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: isNightMode ? "#1E293B" : "#E2E8F0" }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={isNightMode ? "#FFF" : "#333"} />
        </Pressable>
        <Text style={[styles.title, { color: isNightMode ? "#FFF" : "#333" }]}>
          Page {currentPage} of {TOTAL_PAGES}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Page swiper */}
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          data={pagesData}
          keyExtractor={(item) => String(item)}
          renderItem={renderPage}
          onScroll={onScroll}
          scrollEventThrottle={16}
          initialScrollIndex={currentPage - 1}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Bottom control bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: isNightMode ? "#111827" : "#E6DFD5",
            borderTopColor: isNightMode ? "#1F2937" : "#D1C7BD",
          },
        ]}
      >
        <Pressable onPress={toggleNightMode} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isNightMode ? "weather-night" : "weather-sunny"}
            size={24}
            color={isNightMode ? colors.brand : "#5C4E3C"}
          />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            alert("Recitation audio playing starts automatically. Make sure default Listen Quran is used for complete multi-qari continuous audio recitation.");
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="volume-high" size={24} color={isNightMode ? "#FFF" : "#5C4E3C"} />
        </Pressable>

        <Pressable onPress={toggleBookmark} style={styles.barBtn}>
          <MaterialCommunityIcons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={isBookmarked ? colors.brand : isNightMode ? "#FFF" : "#5C4E3C"}
          />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/quran/personalise");
          }}
          style={styles.barBtn}
        >
          <MaterialCommunityIcons name="cog-outline" size={24} color={isNightMode ? "#FFF" : "#5C4E3C"} />
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  pageImage: {
    width: "100%",
    height: "100%",
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
