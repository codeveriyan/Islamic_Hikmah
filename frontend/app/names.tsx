import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Share, Dimensions, ScrollView, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { theme } from "@/src/theme";
import { ALLAH_NAMES, AllahName } from "@/src/data/names";

const { width } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md * 2) / 3;

function formatTime(secs: number) {
  if (isNaN(secs) || secs === undefined || secs === null) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AllahNamesScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const [isGrid, setIsGrid] = useState(false);
  const [playingNumber, setPlayingNumber] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState<AllahName | null>(null);

  // Play All state (Single MP3 track of Mishary Rashid Alafasy)
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const currentTime = status?.currentTime || 0;
  const duration = status?.duration || 0;
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

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

  // Play individual Name audio (raw CDN MP3 files)
  const playNameAudio = useCallback(async (item: AllahName) => {
    Haptics.selectionAsync().catch(() => {});
    if (isPlayingAll) {
      // Stop full track if active
      setIsPlayingAll(false);
    }
    try {
      setPlayingNumber(item.number);
      const audioUrl = `https://raw.githubusercontent.com/soachishti/Asma-ul-Husna/master/audio/${item.number}.mp3`;
      
      player.replace({ uri: audioUrl });
      player.play();
    } catch (err) {
      console.error("Failed to play name audio:", err);
    }
  }, [player, isPlayingAll]);

  // Play full 99 names track (Alafasy)
  const startPlayAll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPlayingNumber(null);
    setIsPlayingAll(true);
    try {
      player.replace(require("../assets/audio/asma_ul_husna.mp3"));
      player.play();
    } catch (err) {
      console.error("Failed to play full Asma ul Husna audio:", err);
    }
  }, [player]);

  const pausePlayAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    player.pause();
  }, [player]);

  const resumePlayAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    player.play();
  }, [player]);

  const stopPlayAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setIsPlayingAll(false);
    player.pause();
  }, [player]);

  const handleSeek = (e: any) => {
    if (progressBarWidth > 0 && duration) {
      const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / progressBarWidth));
      const targetSeconds = pct * duration;
      player.seekTo(targetSeconds);
    }
  };

  const skipForward = useCallback(() => {
    if (duration > 0) {
      const nextTime = Math.min(duration, currentTime + 10);
      player.seekTo(nextTime);
    }
  }, [currentTime, duration, player]);

  const skipBackward = useCallback(() => {
    const prevTime = Math.max(0, currentTime - 10);
    player.seekTo(prevTime);
  }, [currentTime, player]);

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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Asma Al-Husna</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Pressable onPress={() => setIsGrid((g) => !g)} hitSlop={10}>
            <MaterialCommunityIcons
              name={isGrid ? "view-list-outline" : "view-grid-outline"}
              size={24}
              color={colors.brand}
            />
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Play Asma Al Husna Banner */}
      {!isPlayingAll && (
        <Pressable 
          onPress={startPlayAll}
          style={({ pressed }) => [
            styles.playAllBanner,
            { backgroundColor: colors.brand + "18", borderColor: colors.brand + "33" },
            pressed && { opacity: 0.85 }
          ]}
        >
          <View style={[styles.playIconCircle, { backgroundColor: colors.brand }]}>
            <MaterialCommunityIcons name="play" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.playBannerTitle, { color: colors.onSurface }]}>Play Asma Al Husna</Text>
            <Text style={[styles.playBannerSub, { color: colors.onSurfaceMuted }]}>Listen to all 99 Names of Allah recited in one go</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.brand} />
        </Pressable>
      )}

      {/* Names List */}
      <FlatList
        ref={flatListRef}
        key={isGrid ? "grid" : "list"}
        data={ALLAH_NAMES}
        keyExtractor={(item) => String(item.number)}
        renderItem={isGrid ? renderGridItem : renderListItem}
        numColumns={isGrid ? 3 : 1}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: isPlayingAll ? 130 : 40,
        }}
        columnWrapperStyle={isGrid ? { gap: theme.spacing.md } : null}
        showsVerticalScrollIndicator={false}
      />

      {/* ─── Premium Floating Music Player Bar (Full track) ─── */}
      {isPlayingAll && (
        <View style={[styles.floatingPlayer, { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border }]}>
          {/* Progress seekable timeline bar */}
          <Pressable 
            onPress={handleSeek}
            onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
            style={styles.playerProgressBg}
          >
            <View style={[styles.playerProgressFill, { backgroundColor: colors.brand, width: `${progressPercentage}%` }]} />
          </Pressable>

          <View style={styles.playerContent}>
            {/* Left track info */}
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.playerTitle, { color: colors.onSurface }]} numberOfLines={1}>
                Asma-ul-Husna Recitation
              </Text>
              <Text style={[styles.playerSubtitle, { color: colors.brand }]} numberOfLines={1}>
                Sheikh Mishary Rashid Alafasy
              </Text>
              <Text style={[styles.playerTimeText, { color: colors.onSurfaceMuted }]}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </View>

            {/* Player Controls */}
            <View style={styles.playerControls}>
              <Pressable onPress={skipBackward} style={styles.controlBtn} hitSlop={6}>
                <MaterialCommunityIcons name="rewind" size={28} color={colors.onSurface} />
              </Pressable>

              <Pressable 
                onPress={player.playing ? pausePlayAll : resumePlayAll} 
                style={[styles.playerPlayBtn, { backgroundColor: colors.brand }]}
                hitSlop={6}
              >
                <MaterialCommunityIcons name={player.playing ? "pause" : "play"} size={26} color="#FFF" />
              </Pressable>

              <Pressable onPress={skipForward} style={styles.controlBtn} hitSlop={6}>
                <MaterialCommunityIcons name="fast-forward" size={28} color={colors.onSurface} />
              </Pressable>

              <Pressable onPress={stopPlayAll} style={[styles.controlBtn, { marginLeft: 4 }]} hitSlop={6}>
                <MaterialCommunityIcons name="close-circle-outline" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

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
  playAllBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 12,
    marginBottom: theme.spacing.sm,
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playBannerTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  playBannerSub: {
    fontSize: 11,
    marginTop: 2,
  },
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

  // Floating Player
  floatingPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingTop: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  playerProgressBg: {
    height: 4,
    backgroundColor: "rgba(128,128,128,0.15)",
    borderRadius: 2,
    marginBottom: 8,
  },
  playerProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  playerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  playerTimeText: {
    fontSize: 11,
    marginTop: 3,
  },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlBtn: {
    padding: 4,
  },
  playerPlayBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

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
