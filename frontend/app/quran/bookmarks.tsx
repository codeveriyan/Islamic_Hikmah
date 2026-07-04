import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import {
  getQuranBookmarks,
  removeQuranBookmark,
  getQuranLastRead,
  QuranBookmark,
  QuranLastRead,
} from "@/src/storage";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function QuranBookmarksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>([]);
  const [lastRead, setLastRead] = useState<QuranLastRead | null>(null);

  const load = useCallback(() => {
    getQuranBookmarks().then(setBookmarks);
    getQuranLastRead().then(setLastRead);
  }, []);

  useEffect(() => { load(); }, []);

  const handleDelete = useCallback((b: QuranBookmark) => {
    Alert.alert(
      "Remove Bookmark",
      `Remove bookmark for ${b.surahName} · Ayah ${b.ayahNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            await removeQuranBookmark(b.surahNumber, b.ayahNumber);
            load();
          },
        },
      ]
    );
  }, [load]);

  const goToSurah = useCallback((surahNumber: number) => {
    router.push(`/quran/${surahNumber}` as any);
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Quran Bookmarks</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={bookmarks}
        keyExtractor={(b) => `${b.surahNumber}-${b.ayahNumber}`}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}
        ListHeaderComponent={
          <>
            {/* Last Read Banner */}
            {lastRead && (
              <Pressable
                onPress={() => goToSurah(lastRead.surahNumber)}
                style={[styles.lastReadCard, { backgroundColor: colors.brand + "18", borderColor: colors.brand + "44" }]}
              >
                <View style={styles.lastReadLeft}>
                  <MaterialCommunityIcons name="book-open-variant" size={28} color={colors.brand} />
                  <View>
                    <Text style={[styles.lastReadLabel, { color: colors.onSurfaceMuted }]}>
                      Continue Reading
                    </Text>
                    <Text style={[styles.lastReadSurah, { color: colors.onSurface }]}>
                      {lastRead.surahName}
                    </Text>
                    <Text style={[styles.lastReadAyah, { color: colors.brand }]}>
                      Ayah {lastRead.ayahNumber} · {timeAgo(lastRead.readAt)}
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.brand} />
              </Pressable>
            )}

            {bookmarks.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>
                SAVED BOOKMARKS
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bookmark-off-outline" size={60} color={colors.onSurfaceMuted} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No bookmarks yet</Text>
            <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
              Tap the 🔖 icon on any ayah while reading to save your place.
            </Text>
            <Pressable
              onPress={() => router.push("/quran" as any)}
              style={[styles.openQuranBtn, { backgroundColor: colors.brand }]}
            >
              <Text style={[styles.openQuranTxt, { color: colors.onBrandPrimary }]}>Open Quran</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: b }) => (
          <Pressable
            onPress={() => goToSurah(b.surahNumber)}
            style={[styles.card, { backgroundColor: colors.surfaceSecondary }]}
          >
            <View style={[styles.cardIcon, { backgroundColor: colors.brand + "22" }]}>
              <MaterialCommunityIcons name="bookmark" size={20} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardSurah, { color: colors.onSurface }]}>
                {b.surahName}
              </Text>
              <Text style={[styles.cardAyah, { color: colors.brand }]}>
                Ayah {b.ayahNumber}
              </Text>
              <Text style={[styles.cardTime, { color: colors.onSurfaceMuted }]}>
                Saved {timeAgo(b.savedAt)}
              </Text>
            </View>
            <Pressable
              onPress={() => handleDelete(b)}
              hitSlop={10}
              style={{ padding: 4 }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.onSurfaceMuted} />
            </Pressable>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "700" },
  lastReadCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: theme.spacing.lg, borderRadius: theme.radius.lg, borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  lastReadLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  lastReadLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 2 },
  lastReadSurah: { fontSize: 16, fontWeight: "700" },
  lastReadAyah: { fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 12 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: theme.spacing.lg, borderRadius: theme.radius.lg,
  },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardSurah: { fontSize: 15, fontWeight: "700" },
  cardAyah: { fontSize: 13, marginTop: 2 },
  cardTime: { fontSize: 11, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  openQuranBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: theme.radius.pill },
  openQuranTxt: { fontWeight: "700", fontSize: 15 },
});
