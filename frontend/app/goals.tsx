import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { DEFAULT_GOALS, CATEGORY_COLORS, Goal } from "@/src/data/goals";
import {
  getActiveGoalIds,
  saveActiveGoalIds,
  scheduleGoalNotifications,
  getGoalNotifTimes,
} from "@/src/storage";

const CATEGORY_LABELS: Record<string, string> = {
  prayer: "Prayers",
  quran: "Quran",
  dhikr: "Dhikr & Adhkar",
  other: "Other Good Deeds",
};

export default function GoalsSettingsScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getActiveGoalIds().then((ids) => {
      setActiveIds(ids);
      setLoaded(true);
    });
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      Haptics.selectionAsync().catch(() => {});
      setActiveIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];

        // Save and reschedule goal notifications
        saveActiveGoalIds(next).then(async () => {
          try {
            const timingsRaw = await AsyncStorage.getItem("last_fetched_timings");
            const prayerTimings = timingsRaw ? JSON.parse(timingsRaw) : {};
            const goalTimes = await getGoalNotifTimes();
            const result = await scheduleGoalNotifications(next, prayerTimings, goalTimes);
            if (!result.success && result.error === "permission") {
              Alert.alert(
                "Notifications Disabled",
                "Enable notifications in your phone settings to receive goal reminders.",
                [{ text: "OK" }]
              );
            }
          } catch (e) {
            console.error("Failed to reschedule goal notifications:", e);
          }
        });

        return next;
      });
    },
    []
  );

  const grouped = useMemo(() => {
    const groups: Record<string, Goal[]> = { prayer: [], quran: [], dhikr: [], other: [] };
    DEFAULT_GOALS.forEach((g) => groups[g.category].push(g));
    return groups;
  }, []);

  if (!loaded) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("goalSettings")}</Text>
        {/* Bell icon navigates to notification time settings */}
        <Pressable onPress={() => router.push("/goal-notif-settings")} hitSlop={10}>
          <MaterialCommunityIcons name="bell-cog-outline" size={24} color={colors.brand} />
        </Pressable>
      </View>

      <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
        {t("goalSettingsSub")}
      </Text>

      <FlatList
        data={Object.keys(grouped)}
        keyExtractor={(c) => c}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}
        renderItem={({ item: category }) => (
          <View style={{ marginBottom: theme.spacing.xl }}>
            <View style={styles.catHeader}>
              <View style={[styles.catDot, { backgroundColor: CATEGORY_COLORS[category] }]} />
              <Text style={[styles.catLabel, { color: colors.onSurface }]}>
                {t(category === "prayer" ? "prayers" : category === "quran" ? "quran" : category === "dhikr" ? "dhikrAdhkar" : "otherDeeds")}
              </Text>
            </View>
            {grouped[category].map((goal) => {
              const active = activeIds.includes(goal.id);
              const localizedTitle = t(goal.id) !== goal.id ? t(goal.id) : goal.title;
              const localizedSub = goal.subtitle ? (t(goal.id + "Sub") !== goal.id + "Sub" ? t(goal.id + "Sub") : goal.subtitle) : undefined;
              return (
                <Pressable
                  key={goal.id}
                  onPress={() => toggle(goal.id)}
                  style={[styles.goalRow, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalTitle, { color: colors.onSurface }]}>
                      {localizedTitle}
                    </Text>
                    {localizedSub && (
                      <Text style={[styles.goalSub, { color: colors.onSurfaceMuted }]}>
                        {localizedSub}
                      </Text>
                    )}
                  </View>
                  {/* Bell indicator — shows when goal is active */}
                  {active && (
                    <MaterialCommunityIcons
                      name="bell-check-outline"
                      size={16}
                      color={CATEGORY_COLORS[category]}
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: active
                          ? CATEGORY_COLORS[category]
                          : colors.onSurfaceMuted,
                        backgroundColor: active ? CATEGORY_COLORS[category] : "transparent",
                      },
                    ]}
                  >
                    {active && (
                      <MaterialCommunityIcons name="check" size={14} color="#fff" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
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
  title: { fontSize: 18, fontWeight: "700" },
  subtitle: { fontSize: 13, paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catLabel: { fontSize: 15, fontWeight: "700" },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: 8,
  },
  goalTitle: { fontSize: 15, fontWeight: "600" },
  goalSub: { fontSize: 12, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
