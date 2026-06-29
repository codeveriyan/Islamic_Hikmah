import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";

type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
};

const ITEM_HEIGHT = 72;

export default function QuranIndex() {
  const router = useRouter();
  const { colors } = useTheme();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("https://api.alquran.cloud/v1/surah")
      .then((r) => r.json())
      .then((d) => setSurahs(d.data || []))
      .catch(() => setSurahs([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = surahs.filter((s) =>
    [s.englishName, s.englishNameTranslation, s.name, String(s.number)]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase())
  );

  // FIX 1: useCallback for renderItem - prevents recreation on every render
  const renderSurah = useCallback(({ item }: { item: Surah }) => (
    <Pressable
      onPress={() => router.push(`/quran/${item.number}` as any)}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceSecondary }, pressed && { opacity: 0.8 }]}
      testID={`surah-${item.number}`}
    >
      <View style={[styles.numBadge, { backgroundColor: colors.brand + "22" }]}>
        <Text style={[styles.numTxt, { color: colors.brand }]}>{item.number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.onSurface }]}>{item.englishName}</Text>
        <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]}>
          {item.englishNameTranslation} · {item.numberOfAyahs} ayahs · {item.revelationType}
        </Text>
      </View>
      <Text style={[styles.arabicName, { color: colors.brand }]}>{item.name}</Text>
    </Pressable>
  ), [colors, router]);

  // FIX 1: getItemLayout for instant scrolling - no need to measure each item
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_HEIGHT + theme.spacing.sm,
    offset: (ITEM_HEIGHT + theme.spacing.sm) * index,
    index,
  }), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="quran-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>The Quran</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search Surah by name or number"
          placeholderTextColor={theme.colors.onSurfaceMuted}
          style={[styles.search, { color: colors.onSurface }]}
          testID="surah-search"
        />
        {q.length > 0 && (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.onSurfaceMuted} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        // FIX 1: Full FlatList optimization
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.number)}
          renderItem={renderSurah}
          getItemLayout={getItemLayout}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}
          windowSize={10}
          maxToRenderPerBatch={15}
          initialNumToRender={20}
          removeClippedSubviews={true}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { fontSize: 20, fontWeight: "700" },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: theme.spacing.lg, paddingHorizontal: 14, borderRadius: theme.radius.pill, gap: 8, marginBottom: 8 },
  search: { flex: 1, paddingVertical: 12, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", padding: theme.spacing.lg, borderRadius: theme.radius.lg, gap: theme.spacing.md, height: ITEM_HEIGHT },
  numBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  numTxt: { fontWeight: "700" },
  rowTitle: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  arabicName: { fontFamily: "Amiri", fontSize: 22 },
});
