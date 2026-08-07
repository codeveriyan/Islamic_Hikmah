import { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { CATEGORIES } from "@/src/data/duas";
import { SURAH_LIST } from "@/src/data/surahList";
import { AppIconButton, AppTextInput } from "@/src/components/ui";
import { AppEmptyState } from "@/src/components/states";

import { searchHadeeths } from "@/src/services/hadeethEncService";
import { searchIslamHouseItems } from "@/src/services/islamHouseService";
import { searchFatawa } from "@/src/services/fatawaService";

type ResultType = "surah" | "dua" | "hadith" | "islamhouse" | "fatwa";

type Result = {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  route: string;
};

type FilterType = "All" | "Quran" | "Hadith" | "Library" | "Fatawa" | "Duas";

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
  subtitle: s.name,
  route: `/quran/${s.number}`,
}));

const LOCAL_ITEMS = [...ALL_SURAHS, ...ALL_DUAS];

const TYPE_ICON: Record<ResultType, string> = {
  surah: "book-open-page-variant",
  dua: "hand-heart",
  hadith: "book-open-variant",
  islamhouse: "library-shelves",
  fatwa: "scale-balance",
};

const TYPE_COLOR: Record<ResultType, string> = {
  surah: "#6366F1",
  dua: "#10B981",
  hadith: "#8B5CF6",
  islamhouse: "#F59E0B",
  fatwa: "#EF4444",
};

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const [hadithResults, setHadithResults] = useState<Result[]>([]);
  const [libraryResults, setLibraryResults] = useState<Result[]>([]);
  const [fatawaResults, setFatawaResults] = useState<Result[]>([]);

  const [isLoadingHadith, setIsLoadingHadith] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isLoadingFatawa, setIsLoadingFatawa] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setHadithResults([]);
      setLibraryResults([]);
      setFatawaResults([]);
      return;
    }

    let isMounted = true;

    const fetchHadith = async () => {
      setIsLoadingHadith(true);
      try {
        const res = await searchHadeeths("en", debouncedQuery, 1, 5);
        if (isMounted) {
          setHadithResults(
            res.data.map((h) => ({
              id: `hadith-${h.id}`,
              type: "hadith",
              title: h.title,
              subtitle: "Hadith",
              route: `/hadith/topics?id=${encodeURIComponent(h.id)}`,
            }))
          );
        }
      } catch (e) {
        if (isMounted) setHadithResults([]);
      } finally {
        if (isMounted) setIsLoadingHadith(false);
      }
    };

    const fetchLibrary = async () => {
      setIsLoadingLibrary(true);
      try {
        const res = await searchIslamHouseItems("en", debouncedQuery, "showall", 1, 5);
        if (isMounted) {
          setLibraryResults(
            res.data.map((item) => ({
              id: `islamhouse-${item.id}`,
              type: "islamhouse",
              title: item.title,
              subtitle: "Library Item",
              route: `/library/${item.id}`,
            }))
          );
        }
      } catch (e) {
        if (isMounted) setLibraryResults([]);
      } finally {
        if (isMounted) setIsLoadingLibrary(false);
      }
    };

    const fetchFatawa = async () => {
      setIsLoadingFatawa(true);
      try {
        const res = await searchFatawa({ q: debouncedQuery, limit: 5 });
        if (isMounted) {
          setFatawaResults(
            res.results.map((f) => ({
              id: `fatwa-${f.id}`,
              type: "fatwa",
              title: f.title,
              subtitle: f.question_summary || "Fatwa",
              route: `/fatawa?id=${encodeURIComponent(String(f.id))}&q=${encodeURIComponent(debouncedQuery)}`,
            }))
          );
        }
      } catch (e) {
        if (isMounted) setFatawaResults([]);
      } finally {
        if (isMounted) setIsLoadingFatawa(false);
      }
    };

    if (activeFilter === "All" || activeFilter === "Hadith") fetchHadith();
    if (activeFilter === "All" || activeFilter === "Library") fetchLibrary();
    if (activeFilter === "All" || activeFilter === "Fatawa") fetchFatawa();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, activeFilter]);

  const localResults = useMemo<Result[]>(() => {
    if (!debouncedQuery) return [];
    return LOCAL_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(debouncedQuery) ||
        item.subtitle.toLowerCase().includes(debouncedQuery)
    ).slice(0, 5);
  }, [debouncedQuery]);

  const surahResults = useMemo(() => localResults.filter((r) => r.type === "surah"), [localResults]);
  const duaResults = useMemo(() => localResults.filter((r) => r.type === "dua"), [localResults]);

  const sections = useMemo(() => {
    if (!debouncedQuery) return [];
    const sec: { title: string; data: Result[]; loading: boolean }[] = [];

    if (activeFilter === "All" || activeFilter === "Quran") {
      if (surahResults.length > 0) sec.push({ title: "Quran", data: surahResults, loading: false });
    }
    if (activeFilter === "All" || activeFilter === "Duas") {
      if (duaResults.length > 0) sec.push({ title: "Duas", data: duaResults, loading: false });
    }
    if (activeFilter === "All" || activeFilter === "Hadith") {
      if (hadithResults.length > 0 || isLoadingHadith) sec.push({ title: "Hadith", data: hadithResults.slice(0, 5), loading: isLoadingHadith });
    }
    if (activeFilter === "All" || activeFilter === "Library") {
      if (libraryResults.length > 0 || isLoadingLibrary) sec.push({ title: "Library", data: libraryResults.slice(0, 5), loading: isLoadingLibrary });
    }
    if (activeFilter === "All" || activeFilter === "Fatawa") {
      if (fatawaResults.length > 0 || isLoadingFatawa) sec.push({ title: "Fatawa", data: fatawaResults.slice(0, 5), loading: isLoadingFatawa });
    }
    return sec;
  }, [debouncedQuery, surahResults, duaResults, hadithResults, libraryResults, fatawaResults, isLoadingHadith, isLoadingLibrary, isLoadingFatawa, activeFilter]);

  const handleSelect = (item: Result) => {
    router.push(item.route as any);
  };

  const FILTERS: FilterType[] = ["All", "Quran", "Hadith", "Library", "Fatawa", "Duas"];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <AppIconButton
          accessibilityLabel="Go back"
          icon="chevron-left"
          onPress={() => router.back()}
        />
        <Text style={[styles.title, { color: colors.onSurface }]}>Search</Text>
        <View style={{ width: 44 }} />
      </View>

      <AppTextInput
        autoFocus
        containerStyle={styles.searchContainer}
        label="Search"
        leadingIcon="magnify"
        value={query}
        onChangeText={setQuery}
        placeholder="Search everything…"
        onTrailingIconPress={() => setQuery("")}
        outlineStyle={styles.searchOutline}
        returnKeyType="search"
        trailingIcon={query.length > 0 ? "close-circle" : undefined}
        trailingIconAccessibilityLabel="Clear search"
      />

      <View style={{ height: 50, marginBottom: theme.spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              style={[
                styles.filterChip,
                activeFilter === f ? { backgroundColor: colors.brand } : { backgroundColor: colors.surfaceSecondary }
              ]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f ? { color: "#FFF" } : { color: colors.onSurface }]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {query.trim().length === 0 ? (
        <View style={styles.empty}>
          <AppEmptyState
            compact
            description="Enter a search term to begin."
            icon="magnify"
            title="Search the app"
          />
        </View>
      ) : sections.length === 0 && !isLoadingHadith && !isLoadingLibrary && !isLoadingFatawa && debouncedQuery.length > 0 ? (
        <View style={styles.empty}>
          <AppEmptyState
            actionLabel={query.length > 15 ? "Ask a Scholar ✨" : "Clear search"}
            compact
            description={query.length > 15 ? "We couldn't find an exact match. You can ask this as a new question." : "Try another spelling or a broader search."}
            icon={query.length > 15 ? "scale-balance" : "file-search-outline"}
            onAction={() => query.length > 15 ? router.push(`/fatawa?q=${encodeURIComponent(query)}`) : setQuery("")}
            title={`No results for "${query}"`}
          />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 40 }}
          renderItem={({ item: section }) => (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{section.title}</Text>
                {section.loading && <ActivityIndicator size="small" color={colors.brand} style={{ marginLeft: 8 }} />}
              </View>
              {section.data.length === 0 && !section.loading ? (
                <Text style={{ color: colors.onSurfaceMuted, marginLeft: 4, marginBottom: 12 }}>No results.</Text>
              ) : (
                section.data.map((item) => (
                  <Pressable
                    key={item.id}
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
                ))
              )}
            </View>
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
  searchContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  searchOutline: {
    borderRadius: theme.radius.pill,
  },
  filtersContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontWeight: "600",
    fontSize: 14,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 60,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
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
