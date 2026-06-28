import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { theme } from "@/src/theme";
import { CATEGORIES } from "@/src/data/duas";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

const QUICK_ACTIONS = [
  { id: "quran", title: "Quran", icon: "book-open-variant", route: "/quran", color: "#10B981" },
  { id: "dhikr", title: "Tasbih", icon: "circle-double", route: "/dhikr", color: "#C5A880" },
  { id: "prayer", title: "Prayer Times", icon: "clock-time-eight", route: "/prayer-times", color: "#14B8A6" },
  { id: "qibla", title: "Qibla", icon: "compass", route: "/qibla", color: "#F59E0B" },
] as const;

export default function HomeScreen() {
  const [group, setGroup] = useState<"main" | "other">("main");
  const router = useRouter();

  const cats = useMemo(() => CATEGORIES.filter((c) => c.group === group), [group]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header} testID="home-header">
        <Pressable
          onPress={() => router.push("/settings")}
          hitSlop={10}
          testID="open-menu-btn"
        >
          <MaterialCommunityIcons name="menu" size={26} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Ruhani</Text>
        <Pressable
          onPress={() => router.push("/settings")}
          hitSlop={10}
          testID="settings-btn"
        >
          <MaterialCommunityIcons name="cog-outline" size={26} color={theme.colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingHi}>Assalamu Alaikum</Text>
          <Text style={styles.greetingSub}>May Allah grant you peace today</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.quickRow} testID="quick-actions">
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push(a.route as any);
              }}
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}
              testID={`quick-${a.id}`}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: a.color + "22" }]}>
                <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* Segmented control */}
        <View style={styles.segment} testID="home-segment">
          {(["main", "other"] as const).map((g) => {
            const active = group === g;
            return (
              <Pressable
                key={g}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setGroup(g);
                }}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                testID={`segment-${g}`}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {g === "main" ? "Main" : "Other"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Category grid */}
        <View style={styles.grid}>
          {cats.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.push(`/dua/${c.id}` as any);
              }}
              style={({ pressed }) => [
                styles.card,
                { width: CARD_WIDTH },
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              testID={`category-${c.id}`}
            >
              <LinearGradient
                colors={c.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons
                    name={c.icon as any}
                    size={42}
                    color="rgba(255,255,255,0.85)"
                  />
                </View>
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.55)"]}
                  style={styles.cardScrim}
                />
                <Text style={styles.cardTitle}>{c.title}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    color: theme.colors.onSurface,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollContent: { paddingBottom: theme.spacing.xxxl },
  greeting: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  greetingHi: {
    color: theme.colors.brand,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  greetingSub: {
    color: theme.colors.onSurfaceSecondary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  quickBtn: { alignItems: "center", flex: 1 },
  quickIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickLabel: {
    color: theme.colors.onSurfaceSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfaceSecondary,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  segmentBtnActive: { backgroundColor: theme.colors.brandSecondary },
  segmentText: {
    color: theme.colors.onSurfaceMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  segmentTextActive: { color: "#03201F" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    height: 140,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  cardGradient: { flex: 1, padding: theme.spacing.md, justifyContent: "flex-end" },
  cardIcon: {
    position: "absolute",
    right: 8,
    top: 8,
    opacity: 0.6,
  },
  cardScrim: { ...StyleSheet.absoluteFillObject },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
