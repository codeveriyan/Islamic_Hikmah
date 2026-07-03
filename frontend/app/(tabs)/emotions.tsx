import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { EMOTIONS } from "@/src/data/emotions";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function EmotionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Play Store Replicated Header */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.onSurface} style={{ opacity: 0.8 }} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Emotions</Text>
        <Pressable onPress={() => alert("Configure your notification or reminders in Settings tab.")} hitSlop={10}>
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} style={{ opacity: 0.8 }} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 64 }} showsVerticalScrollIndicator={false}>
        {/* Centered Feeling Text */}
        <Text style={[styles.feelingText, { color: colors.onSurface }]}>I am feeling ...</Text>

        {/* Rectangular Pastel Grid */}
        <View style={styles.grid}>
          {EMOTIONS.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => router.push(`/dua/${e.id}` as any)}
              style={({ pressed }) => [
                styles.tile,
                pressed && { opacity: 0.85 },
              ]}
              testID={`emotion-${e.id}`}
            >
              <LinearGradient
                colors={e.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileGrad}
              >
                <Text style={styles.label}>{e.label}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  feelingText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  tile: {
    width: "48%",
    height: 72,
    borderRadius: theme.radius.md,
    overflow: "hidden",
  },
  tileGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.md,
    paddingHorizontal: 8,
  },
  label: {
    color: "#1F2937",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
