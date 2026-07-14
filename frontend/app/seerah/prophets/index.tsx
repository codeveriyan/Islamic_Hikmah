import { View, Text, StyleSheet, FlatList, Pressable, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { prophetStories } from "@/src/data/prophets";

export default function ProphetsIndexScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Stories of the Prophets</Text>
          <Text style={[styles.headerSub, { color: colors.brand }]}>قصص الأنبياء</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Banner */}
      <View style={[styles.heroBanner, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.heroLeft}>
          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>The Best of Stories</Text>
          <Text style={[styles.heroSub, { color: colors.onSurfaceMuted }]}>
            "We relate to you, [O Muhammad], the best of stories in what We have revealed to you of this Qur'an..."
          </Text>
        </View>
        <View style={[styles.heroIconWrap, { backgroundColor: colors.brand + "18" }]}>
          <MaterialCommunityIcons name="book-open-variant" size={32} color={colors.brand} />
        </View>
      </View>

      {/* List */}
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        data={prophetStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item: story, index }) => (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push(`/seerah/prophets/${story.id}`);
            }}
            style={({ pressed }) => [
              styles.storyCard,
              { backgroundColor: colors.surfaceSecondary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.numberWrap, { backgroundColor: colors.brand + "15" }]}>
              <Text style={[styles.numberTxt, { color: colors.brand }]}>{index + 1}</Text>
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={[styles.storyName, { color: colors.onSurface }]} numberOfLines={1}>
                {story.name}
              </Text>
              <Text style={[styles.storyTitle, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                {story.title}
              </Text>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceMuted} />
          </Pressable>
        )}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
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
  backBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontFamily: "Amiri", fontSize: 16, marginTop: 2 },
  heroBanner: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  heroLeft: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  heroSub: { fontSize: 13, fontStyle: "italic", lineHeight: 18 },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: 12,
  },
  storyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  numberWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  numberTxt: {
    fontSize: 18,
    fontWeight: "800",
  },
  storyName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  storyTitle: {
    fontSize: 14,
  },
});
