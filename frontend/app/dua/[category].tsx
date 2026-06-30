import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { getCategory } from "@/src/data/duas";
import { toggleFavourite, getFavourites, Favourite } from "@/src/storage";

export default function DuaCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const cat = getCategory(String(category));
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getFavourites().then((fs) => setFavIds(new Set(fs.map((f) => f.id))));
  }, []);

  if (!cat) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "#fff", padding: 24 }}>Category not found.</Text>
      </SafeAreaView>
    );
  }

  const onFav = async (i: number) => {
    const d = cat.duas[i];
    const fav: Favourite = {
      id: d.id,
      type: "dua",
      title: d.title,
      subtitle: cat.title,
      arabic: d.arabic,
      translation: d.translation,
      addedAt: Date.now(),
    };
    await toggleFavourite(fav);
    const fs = await getFavourites();
    setFavIds(new Set(fs.map((f) => f.id)));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient colors={cat.gradient} style={styles.heroGrad}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={10} testID="back-btn">
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.heroTitle}>{cat.title}</Text>
            <View style={{ width: 28 }} />
          </View>
          <Text style={styles.heroSub}>{cat.duas.length} Du{`'`}a{cat.duas.length === 1 ? "" : "s"}</Text>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        {cat.duas.map((d, i) => {
          const isFav = favIds.has(d.id);
          return (
            <View key={d.id} style={[styles.card, { backgroundColor: colors.surfaceSecondary }]} testID={`dua-${d.id}`}>
              <View style={styles.cardHead}>
                <Text style={[styles.cardTitle, { color: colors.brand }]}>{d.title}</Text>
                <Pressable onPress={() => onFav(i)} hitSlop={10} testID={`fav-${d.id}`}>
                  <MaterialCommunityIcons
                    name={isFav ? "heart" : "heart-outline"}
                    size={22}
                    color={isFav ? theme.colors.error : colors.onSurfaceMuted}
                  />
                </Pressable>
              </View>
              <Text style={[styles.arabic, { color: colors.onSurface }]}>{d.arabic}</Text>
              {d.transliteration ? (
                <Text style={[styles.translit, { color: colors.brand }]}>{d.transliteration}</Text>
              ) : null}
              <Text style={[styles.translation, { color: colors.onSurfaceSecondary }]}>{d.translation}</Text>
              <View style={styles.footRow}>
                {d.reference ? <Text style={[styles.ref, { color: colors.onSurfaceMuted }]}>📖 {d.reference}</Text> : <View />}
                {d.repeat ? (
                  <View style={[styles.repeatPill, { backgroundColor: colors.brandSecondary + "33" }]}>
                    <Text style={[styles.repeatText, { color: colors.brandSecondary }]}>×{d.repeat}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  heroGrad: { paddingBottom: 24, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.85)", paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm },
  card: { borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  cardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", flex: 1 },
  arabic: { fontFamily: "Amiri", fontSize: 26, textAlign: "right", lineHeight: 44, marginTop: theme.spacing.md },
  translit: { fontStyle: "italic", marginTop: theme.spacing.md, lineHeight: 21 },
  translation: { marginTop: theme.spacing.sm, lineHeight: 22 },
  footRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing.md },
  ref: { fontSize: 12 },
  repeatPill: { borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  repeatText: { fontWeight: "700" },
});
