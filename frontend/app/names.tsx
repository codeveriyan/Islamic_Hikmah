import { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Share, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { ALLAH_NAMES, AllahName } from "@/src/data/names";

const { width } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md * 2) / 3;

export default function AllahNamesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isGrid, setIsGrid] = useState(false);

  const handleShare = async (item: AllahName) => {
    try {
      await Share.share({
        message: `${item.number}. ${item.transliteration} (${item.name})\nMeaning: ${item.meaning}\nShared via Islamic Hikmah 🕌`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderListItem = useCallback(({ item }: { item: AllahName }) => (
    <View style={[styles.listCard, { backgroundColor: colors.surfaceSecondary }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.indexBadge, { backgroundColor: colors.brand + "22" }]}>
          <Text style={[styles.indexText, { color: colors.brand }]}>{item.number}</Text>
        </View>
        <Pressable onPress={() => handleShare(item)} hitSlop={8} style={styles.shareBtn}>
          <MaterialCommunityIcons name="share-variant" size={18} color={colors.onSurfaceMuted} />
        </Pressable>
      </View>
      <View style={styles.cardContent}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.translitText, { color: colors.onSurface }]}>{item.transliteration}</Text>
          <Text style={[styles.meaningText, { color: colors.onSurfaceMuted }]}>{item.meaning}</Text>
        </View>
        <Text style={[styles.arabicText, { color: colors.brand }]}>{item.name}</Text>
      </View>
    </View>
  ), [colors]);

  const renderGridItem = useCallback(({ item }: { item: AllahName }) => (
    <View style={[styles.gridCard, { backgroundColor: colors.surfaceSecondary, width: GRID_ITEM_WIDTH }]}>
      <Text style={[styles.arabicGridText, { color: colors.onSurface }]}>{item.name}</Text>
      <Text style={[styles.translitGridText, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
        {item.transliteration}
      </Text>
    </View>
  ), [colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>99 Names of Allah</Text>
        <Pressable onPress={() => setIsGrid((g) => !g)} hitSlop={10}>
          <MaterialCommunityIcons
            name={isGrid ? "view-list-outline" : "view-grid-outline"}
            size={24}
            color={colors.brand}
          />
        </Pressable>
      </View>

      <FlatList
        key={isGrid ? "grid" : "list"}
        data={ALLAH_NAMES}
        keyExtractor={(item) => String(item.number)}
        renderItem={isGrid ? renderGridItem : renderListItem}
        numColumns={isGrid ? 3 : 1}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: isGrid ? theme.spacing.md : theme.spacing.md,
          paddingBottom: 40,
        }}
        columnWrapperStyle={isGrid ? { gap: theme.spacing.md } : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
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
  },
  title: { fontSize: 20, fontWeight: "700" },
  listCard: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  indexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  indexText: { fontSize: 12, fontWeight: "800" },
  shareBtn: { padding: 4 },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  translitText: { fontSize: 18, fontWeight: "700" },
  meaningText: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  arabicText: { fontFamily: "AmiriBold", fontSize: 28 },
  
  gridCard: {
    height: 100,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xs,
  },
  arabicGridText: { fontFamily: "AmiriBold", fontSize: 22 },
  translitGridText: { fontSize: 11, fontWeight: "700", marginTop: 8 },
});
