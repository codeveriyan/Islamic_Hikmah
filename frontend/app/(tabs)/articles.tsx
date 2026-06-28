import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { ARTICLES } from "@/src/data/articles";

export default function ArticlesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.onSurface }]}>Articles</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>Read & reflect</Text>
      </View>
      <FlatList
        data={ARTICLES}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/article/${item.id}` as any)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            testID={`article-${item.id}`}
          >
            <Image source={{ uri: item.cover }} style={styles.cover} contentFit="cover" />
            <View style={styles.cardBody}>
              <Text style={styles.cat}>{item.category} · {item.readingTime}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.excerpt} numberOfLines={2}>{item.excerpt}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md },
  title: { color: theme.colors.onSurface, fontSize: 28, fontWeight: "700" },
  subtitle: { color: theme.colors.onSurfaceMuted, marginTop: 4 },
  card: {
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  cover: { width: "100%", height: 160 },
  cardBody: { padding: theme.spacing.lg },
  cat: { color: theme.colors.brand, fontSize: 11, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  cardTitle: { color: theme.colors.onSurface, fontSize: 17, fontWeight: "700", marginTop: 6 },
  excerpt: { color: theme.colors.onSurfaceMuted, marginTop: 6, lineHeight: 19 },
});
