import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { EMOTIONS } from "@/src/data/emotions";

export default function EmotionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.push("/menu")} hitSlop={10} testID="emotions-menu">
          <MaterialCommunityIcons name="menu" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Emotions</Text>
        <Pressable onPress={() => router.push("/settings")} hitSlop={10} testID="emotions-settings">
          <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 32 }}>
        <Text style={[styles.prompt, { color: colors.onSurface }]}>I am feeling ...</Text>
        <View style={styles.grid}>
          {EMOTIONS.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => router.push(`/emotion/${e.id}` as any)}
              style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "700" },
  prompt: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  tile: { width: "47%", aspectRatio: 1.4, borderRadius: theme.radius.lg, overflow: "hidden" },
  tileGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius.lg,
  },
  label: { color: "#333", fontSize: 15, fontWeight: "700" },
  sugg: { marginTop: theme.spacing.xl },
  suggTitle: { fontSize: 18, fontWeight: "700" },
  suggSub: { marginTop: 4, marginBottom: theme.spacing.md },
  suggCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
  },
  suggCardTitle: { fontSize: 13, fontWeight: "700" },
  suggArabic: {
    fontFamily: "NotoNaskhArabic",
    fontSize: 20,
    textAlign: "right",
    marginTop: 10,
    lineHeight: 32,
  },
  suggTrans: { marginTop: 8, fontSize: 13, lineHeight: 18 },
});
