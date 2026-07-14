import { useMemo } from "react";
import { FlatList, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import data from "@/src/data/hisnulMuslim.json";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export default function FortressChapterScreen() {
  const router = useRouter();
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const { colors } = useTheme();
  const arabicFontFamily = useArabicFont();
  const current = useMemo(
    () => data.chapters.find((item) => item.number === Number(chapter)),
    [chapter],
  );

  if (!current) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.notFound, { color: colors.onSurface }]}>Chapter not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.onSurface }]}>{current.title}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>Chapter {current.number} · {current.duas.length} du&apos;as</Text>
        </View>
        <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
          <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <FlatList
        data={current.duas}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={[styles.duaCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: colors.brand + "20" }]}>
                <Text style={[styles.badgeText, { color: colors.brand }]}>Du&apos;a {index + 1}</Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => Share.share({
                  message: `${current.title}\n\n${item.arabic}\n\n${item.transliteration}\n\n${item.translation}\n\nHisnul Muslim · Chapter ${current.number}`,
                })}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            {!!item.arabic && (
              <Text style={[styles.arabic, { color: colors.onSurface, fontFamily: arabicFontFamily }]}>{item.arabic}</Text>
            )}
            {!!item.transliteration && (
              <Text style={[styles.transliteration, { color: colors.brand }]}>{item.transliteration}</Text>
            )}
            {!!item.translation && (
              <Text style={[styles.translation, { color: colors.onSurfaceSecondary }]}>{item.translation}</Text>
            )}
            {item.repeat > 1 && (
              <View style={[styles.repeat, { borderColor: colors.border }]}>
                <MaterialCommunityIcons name="repeat" size={15} color={colors.onSurfaceMuted} />
                <Text style={[styles.repeatText, { color: colors.onSurfaceMuted }]}>Repeat {item.repeat} times</Text>
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: 12, gap: 10 },
  title: { maxWidth: "95%", fontSize: 17, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 2 },
  list: { padding: theme.spacing.lg, paddingBottom: 48, gap: 14 },
  duaCard: { padding: 18, borderRadius: theme.radius.lg, borderWidth: 1 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "800" },
  arabic: { fontSize: 25, lineHeight: 44, textAlign: "right", writingDirection: "rtl" },
  transliteration: { fontSize: 14, lineHeight: 22, fontStyle: "italic", marginTop: 16 },
  translation: { fontSize: 15, lineHeight: 24, marginTop: 12 },
  repeat: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, marginTop: 14 },
  repeatText: { fontSize: 11, fontWeight: "700" },
  notFound: { padding: 24, textAlign: "center" },
});
