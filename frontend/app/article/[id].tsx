import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { ARTICLES } from "@/src/data/articles";

export default function ArticleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const article = ARTICLES.find((a) => a.id === id);
  if (!article) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Image source={{ uri: article.cover }} style={styles.cover} contentFit="cover" />
      <SafeAreaView edges={["top"]} style={styles.backWrap}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10} testID="article-back">
          <MaterialCommunityIcons name="chevron-left" size={26} color="#fff" />
        </Pressable>
      </SafeAreaView>
      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 64 }}>
        <View style={[styles.bodyInner, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cat, { color: colors.brand }]}>{article.category} · {article.readingTime}</Text>
          <Text style={[styles.title, { color: colors.onSurface }]}>{article.title}</Text>
          <Text style={[styles.text, { color: colors.onSurfaceSecondary }]}>{article.body}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  cover: { position: "absolute", top: 0, left: 0, right: 0, height: 260 },
  backWrap: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", margin: theme.spacing.lg },
  body: { flex: 1, marginTop: 220 },
  bodyInner: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: theme.spacing.xl, minHeight: 800 },
  cat: { color: theme.colors.brand, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  title: { color: theme.colors.onSurface, fontSize: 26, fontWeight: "800", marginTop: theme.spacing.md, lineHeight: 34 },
  text: { color: theme.colors.onSurfaceSecondary, marginTop: theme.spacing.lg, lineHeight: 24, fontSize: 15 },
});
