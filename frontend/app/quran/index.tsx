import { useEffect, useState } from "react";
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="quran-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>The Quran</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.onSurfaceMuted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search Surah"
          placeholderTextColor={theme.colors.onSurfaceMuted}
          style={styles.search}
          testID="surah-search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => String(s.number)}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/quran/${item.number}` as any)}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
              testID={`surah-${item.number}`}
            >
              <View style={styles.numBadge}>
                <Text style={styles.numTxt}>{item.number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.englishName}</Text>
                <Text style={styles.rowSub}>
                  {item.englishNameTranslation} · {item.numberOfAyahs} ayahs · {item.revelationType}
                </Text>
              </View>
              <Text style={styles.arabicName}>{item.name}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { color: theme.colors.onSurface, fontSize: 20, fontWeight: "700" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surfaceSecondary, marginHorizontal: theme.spacing.lg, paddingHorizontal: 14, borderRadius: theme.radius.pill, gap: 8 },
  search: { flex: 1, color: theme.colors.onSurface, paddingVertical: 12, fontSize: 14 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg, gap: theme.spacing.md },
  numBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.brand + "22", alignItems: "center", justifyContent: "center" },
  numTxt: { color: theme.colors.brand, fontWeight: "700" },
  rowTitle: { color: theme.colors.onSurface, fontSize: 16, fontWeight: "700" },
  rowSub: { color: theme.colors.onSurfaceMuted, fontSize: 12, marginTop: 2 },
  arabicName: { color: theme.colors.brand, fontFamily: "Amiri", fontSize: 22 },
});
