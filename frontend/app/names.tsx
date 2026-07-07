import { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Share, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { theme } from "@/src/theme";
import { ALLAH_NAMES, AllahName } from "@/src/data/names";

const { width } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md * 2) / 3;

export default function AllahNamesScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const [isGrid, setIsGrid] = useState(false);
  const [playingNumber, setPlayingNumber] = useState<number | null>(null);

  const player = useAudioPlayer(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

  const handleShare = async (item: AllahName) => {
    try {
      await Share.share({
        message: `${item.number}. ${item.transliteration} (${item.name})\nMeaning: ${item.meaning}\nShared via Islamic Hikmah 🕌`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const playNameAudio = useCallback(async (item: AllahName) => {
    Haptics.selectionAsync().catch(() => {});
    try {
      setPlayingNumber(item.number);
      // Format number to 3 digits (001, 002, etc.) to fetch from standard 99 names audio CDN
      const paddedNum = String(item.number).padStart(3, "0");
      const audioUrl = `https://www.alhabib.info/99-names-allah/audio/allah-99-names-${paddedNum}.mp3`;
      
      player.replace({ uri: audioUrl });
      player.play();
    } catch (err) {
      console.error("Failed to play name audio:", err);
    } finally {
      setTimeout(() => setPlayingNumber(null), 3000);
    }
  }, [player]);

  const renderListItem = useCallback(({ item }: { item: AllahName }) => {
    const isPlaying = playingNumber === item.number;
    return (
      <Pressable 
        onPress={() => playNameAudio(item)}
        style={({ pressed }) => [
          styles.listCard, 
          { backgroundColor: colors.surfaceSecondary },
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.indexBadge, { backgroundColor: isPlaying ? colors.brand + "44" : colors.brand + "22" }]}>
            <Text style={[styles.indexText, { color: colors.brand }]}>{item.number}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {isPlaying && <MaterialCommunityIcons name="volume-high" size={18} color={colors.brand} />}
            <Pressable onPress={() => handleShare(item)} hitSlop={8} style={styles.shareBtn}>
              <MaterialCommunityIcons name="share-variant" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.translitText, { color: colors.onSurface }]}>{item.transliteration}</Text>
            <Text style={[styles.meaningText, { color: colors.onSurfaceMuted }]}>{item.meaning}</Text>
          </View>
          <Text style={[styles.arabicText, { color: colors.brand }]}>{item.name}</Text>
        </View>
      </Pressable>
    );
  }, [colors, playingNumber, playNameAudio]);

  const renderGridItem = useCallback(({ item }: { item: AllahName }) => {
    const isPlaying = playingNumber === item.number;
    return (
      <Pressable 
        onPress={() => playNameAudio(item)}
        style={({ pressed }) => [
          styles.gridCard, 
          { backgroundColor: colors.surfaceSecondary, width: GRID_ITEM_WIDTH },
          isPlaying && { borderWidth: 1, borderColor: colors.brand },
          pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }
        ]}
      >
        <Text style={[styles.arabicGridText, { color: isPlaying ? colors.brand : colors.onSurface }]}>{item.name}</Text>
        <Text style={[styles.translitGridText, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
          {item.transliteration}
        </Text>
      </Pressable>
    );
  }, [colors, playingNumber, playNameAudio]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Asma Al-Husna</Text>
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
          gap: theme.spacing.md,
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
