import { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { BABY_NAMES } from "@/src/data/baby-names";

export default function BabyNamesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const arabicFontFamily = useArabicFont();

  const [namesGender, setNamesGender] = useState<"all" | "male" | "female">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNames = useMemo(() => {
    return BABY_NAMES.filter((name) => {
      const matchesGender = namesGender === "all" || name.gender === namesGender;
      const matchesSearch =
        name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        name.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGender && matchesSearch;
    });
  }, [namesGender, searchQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Islamic Baby Names</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.onSurface }]}
            placeholder="Search by name or meaning..."
            placeholderTextColor={colors.onSurfaceMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={10}>
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>

        {/* Gender Filter Pills */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          {(["all", "male", "female"] as const).map((g) => (
            <Pressable
              key={g}
              onPress={() => setNamesGender(g)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: namesGender === g ? colors.brand : colors.surfaceSecondary,
                borderWidth: 1, borderColor: namesGender === g ? colors.brand : colors.border,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: namesGender === g ? "#FFF" : colors.onSurfaceSecondary }}>
                {g === "all" ? "All Names" : g === "male" ? "👦 Male" : "👧 Female"}
              </Text>
            </Pressable>
          ))}
        </View>

        <FlatList
          data={filteredNames}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.listCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, padding: 14 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface }}>{item.name}</Text>
                  <Text style={{ fontFamily: arabicFontFamily || "NotoNaskhArabic", fontSize: 22, color: colors.brand }}>{item.arabic}</Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.onSurfaceSecondary }}>{item.meaning}</Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  listCard: {
    borderWidth: 1,
    borderRadius: 12,
  },
});
