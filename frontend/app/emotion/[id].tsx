import { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { EMOTIONS } from "@/src/data/emotions";
import { CATEGORIES } from "@/src/data/duas";

export default function EmotionDuasScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const emotion = EMOTIONS.find((e) => e.id === id);
  const allDuas = useMemo(
    () => CATEGORIES.flatMap((c) => c.duas.map((d) => ({ ...d, categoryId: c.id }))),
    []
  );
  const suggestions = useMemo(
    () => (emotion ? allDuas.filter((d) => emotion.duaIds.includes(d.id)) : []),
    [emotion, allDuas]
  );

  if (!emotion) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={{ color: colors.onSurface, textAlign: "center", marginTop: 40 }}>
          Emotion not found.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            Feeling {emotion.label}
          </Text>
        </View>
        {/* Quick Settings */}
        <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      {/* Emotion description banner */}
      <View style={[styles.banner, { backgroundColor: colors.brand + "18", borderColor: colors.brand + "44" }]}>
        <Text style={[styles.bannerText, { color: colors.onSurface }]}>{emotion.description}</Text>
      </View>

      {/* Dua list */}
      <FlatList
        data={suggestions}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="hands-pray" size={48} color={colors.onSurfaceMuted} />
            <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
              No specific duas found for this emotion.
            </Text>
          </View>
        }
        renderItem={({ item: d }) => (
          <Pressable
            onPress={() => router.push(`/dua/${d.categoryId}` as any)}
            style={[styles.card, { backgroundColor: colors.surfaceSecondary }]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.cardTitle, { color: colors.brand }]}>{d.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={colors.onSurfaceMuted} />
            </View>
            <Text
              style={[styles.arabic, { color: colors.onSurface }]}
              numberOfLines={3}
            >
              {d.arabic}
            </Text>
            <Text
              style={[styles.translation, { color: colors.onSurfaceMuted }]}
              numberOfLines={3}
            >
              {d.translation}
            </Text>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: "700" },
  banner: {
    margin: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  bannerText: { fontSize: 14, lineHeight: 20 },
  card: { padding: theme.spacing.lg, borderRadius: theme.radius.lg },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  arabic: {
    fontFamily: "NotoNaskhArabic",
    fontSize: 22, textAlign: "right",
    lineHeight: 36, marginBottom: 8,
  },
  translation: { fontSize: 13, lineHeight: 18 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center" },
});
