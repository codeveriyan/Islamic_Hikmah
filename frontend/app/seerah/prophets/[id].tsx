import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { prophetStories } from "@/src/data/prophets";

export default function ProphetDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, mode } = useTheme();

  const story = prophetStories.find((s) => s.id === id);

  if (!story) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.onSurfaceMuted }}>Story not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>{story.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Banner */}
        <View style={styles.titleSection}>
          <Text style={[styles.storyTitle, { color: colors.brand }]}>{story.title}</Text>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          {story.content.map((paragraph, index) => (
            <Text key={index} style={[styles.paragraph, { color: colors.onSurface }]}>
              {paragraph}
            </Text>
          ))}
        </View>

        {/* Lessons Section */}
        <View style={[styles.lessonsCard, { backgroundColor: colors.brand + "10", borderColor: colors.brand + "30" }]}>
          <View style={styles.lessonsHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.brand} />
            <Text style={[styles.lessonsTitle, { color: colors.brand }]}>Lessons & Reflections</Text>
          </View>
          {story.lessons.map((lesson, index) => (
            <View key={index} style={styles.lessonItem}>
              <MaterialCommunityIcons name="circle-medium" size={16} color={colors.brand} style={{ marginTop: 2 }} />
              <Text style={[styles.lessonText, { color: colors.onSurface }]}>{lesson}</Text>
            </View>
          ))}
        </View>
        
        <View style={{ height: 60 }} />
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  titleSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  contentSection: {
    marginBottom: 32,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
  },
  lessonsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  lessonsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  lessonsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  lessonText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
