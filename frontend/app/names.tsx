import { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Share, Dimensions, ScrollView, Modal } from "react-native";
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
  const [selectedName, setSelectedName] = useState<AllahName | null>(null);

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
      // Use the reliable Github raw CDN for name audios
      const audioUrl = `https://raw.githubusercontent.com/soachishti/Asma-ul-Husna/master/audio/${item.number}.mp3`;
      
      player.replace({ uri: audioUrl });
      player.play();
    } catch (err) {
      console.error("Failed to play name audio:", err);
    } finally {
      setTimeout(() => {
        setPlayingNumber(current => current === item.number ? null : current);
      }, 4000);
    }
  }, [player]);

  const renderListItem = useCallback(({ item }: { item: AllahName }) => {
    const isPlaying = playingNumber === item.number;
    return (
      <Pressable 
        onPress={() => playNameAudio(item)}
        onLongPress={() => setSelectedName(item)}
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
            <Pressable onPress={() => setSelectedName(item)} hitSlop={8} style={styles.shareBtn}>
              <MaterialCommunityIcons name="information-outline" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
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
        onLongPress={() => setSelectedName(item)}
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

      {/* Name Details Modal */}
      <Modal
        visible={selectedName !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedName(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedName(null)}>
          <View 
            style={[
              styles.modalContent, 
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }
            ]}
          >
            {selectedName && (
              <View style={{ width: "100%" }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                    Name #{selectedName.number} Details
                  </Text>
                  <Pressable onPress={() => setSelectedName(null)} hitSlop={10}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailCard}>
                    <Text style={[styles.detailArabic, { color: colors.brand }]}>
                      {selectedName.name}
                    </Text>
                    <Text style={[styles.detailTranslit, { color: colors.onSurface }]}>
                      {selectedName.transliteration}
                    </Text>
                    <Text style={[styles.detailMeaning, { color: colors.onSurfaceMuted }]}>
                      {selectedName.meaning}
                    </Text>
                  </View>

                  {selectedName.explanation ? (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.brand }]}>Meaning &amp; Explanation</Text>
                      <Text style={[styles.sectionBody, { color: colors.onSurface }]}>
                        {selectedName.explanation}
                      </Text>
                    </View>
                  ) : null}

                  {selectedName.benefit ? (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.brand }]}>Benefits of Recitation</Text>
                      <Text style={[styles.sectionBody, { color: colors.onSurface }]}>
                        {selectedName.benefit}
                      </Text>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: "80%",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalScrollView: {
    width: "100%",
  },
  detailCard: {
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  detailArabic: {
    fontFamily: "AmiriBold",
    fontSize: 48,
    textAlign: "center",
    marginBottom: 8,
  },
  detailTranslit: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  detailMeaning: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "justify",
  },
});
