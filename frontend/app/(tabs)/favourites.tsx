import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { getFavourites, toggleFavourite, Favourite } from "@/src/storage";

export default function FavouritesScreen() {
  const [items, setItems] = useState<Favourite[]>([]);
  const router = useRouter();
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      getFavourites().then(setItems);
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Favourites</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>{items.length} saved</Text>
      </View>
      {items.length === 0 ? (
        <View style={styles.empty} testID="fav-empty">
          <MaterialCommunityIcons name="heart-outline" size={64} color={theme.colors.brand} />
          <Text style={styles.emptyTitle}>No favourites yet</Text>
          <Text style={styles.emptyText}>
            Tap the heart icon on any Du{`'`}a or Ayah to save it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.card} testID={`fav-${item.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardKind}>{item.type === "dua" ? "Du'a" : "Ayah"}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.arabic ? (
                  <Text style={styles.arabic} numberOfLines={2}>
                    {item.arabic}
                  </Text>
                ) : null}
                {item.translation ? (
                  <Text style={styles.translation} numberOfLines={2}>
                    {item.translation}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={async () => {
                  await toggleFavourite(item);
                  setItems(await getFavourites());
                }}
                hitSlop={10}
                testID={`unfav-${item.id}`}
              >
                <MaterialCommunityIcons name="heart" size={22} color={theme.colors.error} />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.lg },
  title: { color: theme.colors.onSurface, fontSize: 28, fontWeight: "700" },
  subtitle: { color: theme.colors.onSurfaceMuted, marginTop: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyTitle: { color: theme.colors.onSurface, fontSize: 18, fontWeight: "700", marginTop: 16 },
  emptyText: { color: theme.colors.onSurfaceMuted, textAlign: "center", marginTop: 8, lineHeight: 20 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: theme.colors.surfaceSecondary,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.md,
  },
  cardKind: { color: theme.colors.brand, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  cardTitle: { color: theme.colors.onSurface, fontSize: 15, fontWeight: "700", marginTop: 4 },
  arabic: { color: theme.colors.onSurfaceSecondary, fontFamily: "Amiri", fontSize: 18, marginTop: 8, textAlign: "right" },
  translation: { color: theme.colors.onSurfaceMuted, marginTop: 6, fontSize: 13, lineHeight: 18 },
});
