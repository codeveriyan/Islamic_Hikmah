import { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { CATEGORIES } from "@/src/data/duas";
import { SURAH_LIST } from "@/src/data/surahList";

type Result = {
  id: string;
  type: "dua" | "surah";
  title: string;
  subtitle: string;
  route: string;
};

// Flatten all duas from all categories into a searchable list
const ALL_DUAS: Result[] = CATEGORIES.flatMap((cat) =>
  cat.duas.map((d) => ({
    id: `dua-${d.id}`,
    type: "dua" as const,
    title: d.title,
    subtitle: cat.title,
    route: `/dua/${cat.id}`,
  }))
);

const ALL_SURAHS: Result[] = SURAH_LIST.map((s) => ({
  id: `surah-${s.number}`,
  type: "surah" as const,
  title: `${s.number}. ${s.englishName}`,
  subtitle: s.name,   // Arabic name e.g. سُورَةُ ٱلْفَاتِحَةِ
  route: `/quran/${s.number}`,
}));

const ALL_ITEMS = [...ALL_SURAHS, ...ALL_DUAS];

const TYPE_ICON: Record<Result["type"], string> = {
  dua: "hand-heart",
  surah: "book-open-page-variant",
};

const TYPE_COLOR: Record<Result["type"], string> = {
  dua: "#10B981",
  surah: "#6366F1",
};

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q)
    ).slice(0, 40);
  }, [query]);

  const handleSelect = (item: Result) => {
    router.push(item.route as any);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
      edges={["top"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.onSurface}
          />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Search</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Search bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={colors.onSurfaceMuted}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search surahs, duas…"
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.input, { color: colors.onSurface }]}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        )}
      </View>

      {/* Results */}
      {query.trim().length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="magnify"
            size={56}
            color={colors.onSurfaceMuted}
          />
          <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
            Search surahs and duas
          </Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="file-search-outline"
            size={56}
            color={colors.onSurfaceMuted}
          />
          <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSelect(item)}
              style={[
                styles.resultRow,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: TYPE_COLOR[item.type] + "22" },
                ]}
              >
                <MaterialCommunityIcons
                  name={TYPE_ICON[item.type] as any}
                  size={20}
                  color={TYPE_COLOR[item.type]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.resultTitle, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.resultSub, { color: colors.onSurfaceMuted }]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.onSurfaceMuted}
              />
            </Pressable>
          )}
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
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: { fontSize: 18, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    gap: 10,
  },
  input: { flex: 1, fontSize: 16 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 60,
  },
  emptyText: { fontSize: 15 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: 8,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 15, fontWeight: "600" },
  resultSub: { fontSize: 12, marginTop: 2 },
});
