import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { getIslamHouseItems, IslamHouseItemShort } from "@/src/services/islamHouseService";
import { useTranslation } from "@/src/localization";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const numColumns = width > 768 ? 3 : 2;
const cardSpacing = 16;
const cardWidth = (width - 32 - cardSpacing * (numColumns - 1)) / numColumns;

const TABS = [
  { id: "showall", label: "All", icon: "infinity" },
  { id: "book", label: "Books", icon: "book-open-page-variant" },
  { id: "audio", label: "Audio", icon: "headphones" },
  { id: "video", label: "Video", icon: "play-circle" },
  { id: "article", label: "Articles", icon: "newspaper" },
  { id: "fatwa", label: "Fatwas", icon: "scale-balance" },
];

export default function LibraryIndexScreen() {
  const router = useRouter();
  const { colors, mode, language } = useTheme();
  const { t } = useTranslation(language);

  const [activeTab, setActiveTab] = useState("showall");
  const [items, setItems] = useState<IslamHouseItemShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadItems = async (type: string, pageNum: number, append = false) => {
    try {
      if (append) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }
      else setLoading(true);

      const res = await getIslamHouseItems(language, type, pageNum, 20);

      if (append) {
        setItems(prev => [...prev, ...res.data]);
      } else {
        setItems(res.data);
      }

      setHasMore(res.meta.current_page < res.meta.last_page);
    } catch (e) {
      console.error(e);
    } finally {
      if (append) {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      }
      else setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    loadItems(activeTab, 1, false);
  }, [activeTab, language]);

  const loadMore = () => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadItems(activeTab, nextPage, true);
  };

  const renderItem = ({ item }: { item: IslamHouseItemShort }) => {
    let icon = "file-document-outline";
    if (item.type === "book") icon = "book-open-page-variant";
    if (item.type === "audio") icon = "headphones";
    if (item.type === "video") icon = "play-circle";
    if (item.type === "article") icon = "newspaper";
    if (item.type === "fatwa") icon = "scale-balance";

    return (
      <Pressable
        style={[styles.card, { backgroundColor: mode === "dark" ? colors.surfaceSecondary : "#FFFFFF", borderColor: colors.border, width: cardWidth }]}
        onPress={() => router.push(`/library/${item.id}` as any)}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.brand + "15" }]}>
          <MaterialCommunityIcons name={icon as any} size={28} color={colors.brand} />
        </View>
        <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.author_title && (
          <Text style={[styles.author, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
            {item.author_title}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ marginRight: 16 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Islamic Library</Text>
          <Text style={[styles.headerSub, { color: colors.onSurfaceMuted }]}>
            Powered by IslamHouse.com
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ paddingVertical: 12 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(t) => t.id}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const isActive = activeTab === item.id;
            return (
              <Pressable
                onPress={() => setActiveTab(item.id)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: isActive ? colors.brand : "transparent",
                    borderColor: isActive ? colors.brand : colors.border,
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={16}
                  color={isActive ? "#FFF" : colors.onSurfaceMuted}
                />
                <Text style={[
                  styles.tabText,
                  { color: isActive ? "#FFF" : colors.onSurfaceMuted }
                ]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* List */}
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 16, gap: cardSpacing, paddingBottom: 100 }}
          columnWrapperStyle={{ gap: cardSpacing }}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.brand} style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", fontFamily: "Figtree_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "Figtree_400Regular", marginTop: 2 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabText: { fontSize: 14, fontWeight: "600", fontFamily: "Figtree_600SemiBold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Figtree_600SemiBold",
    textAlign: "center",
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    fontFamily: "Figtree_400Regular",
    textAlign: "center",
  },
});
