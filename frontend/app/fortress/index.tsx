import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import data from "@/src/data/hisnulMuslim.json";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export default function FortressIndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const chapters = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.chapters;
    return data.chapters.filter((chapter) =>
      chapter.title.toLowerCase().includes(normalized) || String(chapter.number) === normalized,
    );
  }, [query]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Fortress of the Muslim</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>132 chapters · 267 du&apos;as</Text>
        </View>
        <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
          <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search chapters"
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.search, { color: colors.onSurface }]}
        />
        {!!query && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={chapters}
        keyExtractor={(item) => String(item.number)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/fortress/${item.number}` as any)}
            style={({ pressed }) => [
              styles.chapterCard,
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
              pressed && { opacity: 0.88 },
            ]}
          >
            <View style={[styles.numberBadge, { backgroundColor: colors.brand + "20" }]}>
              <Text style={[styles.numberText, { color: colors.brand }]}>{item.number}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chapterTitle, { color: colors.onSurface }]}>{item.title}</Text>
              <Text style={[styles.duaCount, { color: colors.onSurfaceMuted }]}>
                {item.duas.length} {item.duas.length === 1 ? "du'a" : "du'as"}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceMuted} />
          </Pressable>
        )}
        ListEmptyComponent={(
          <Text style={[styles.empty, { color: colors.onSurfaceMuted }]}>No chapters found.</Text>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: 12, gap: 10 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 2 },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: theme.spacing.lg, marginBottom: 12, paddingHorizontal: 14, borderRadius: theme.radius.pill, borderWidth: 1 },
  search: { flex: 1, paddingVertical: 12, fontSize: 14 },
  list: { paddingHorizontal: theme.spacing.lg, paddingBottom: 48, gap: 10 },
  chapterCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: theme.radius.lg, borderWidth: 1 },
  numberBadge: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  numberText: { fontSize: 14, fontWeight: "800" },
  chapterTitle: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  duaCount: { fontSize: 12, marginTop: 3 },
  empty: { textAlign: "center", marginTop: 48 },
});
