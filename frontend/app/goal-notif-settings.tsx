import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import {
  getGoalNotifTimes,
  saveGoalNotifTimes,
  scheduleGoalNotifications,
  getActiveGoalIds,
  GoalNotifTimes,
} from "@/src/storage";
import {
  AppDialog,
  AppIconButton,
  AppTextInput,
} from "@/src/components/ui";
import { AppLoadingState } from "@/src/components/states";

type GoalTimeEntry = {
  id: keyof GoalNotifTimes;
  label: string;
  icon: string;
  color: string;
  note?: string;
};

const GOAL_TIME_ENTRIES: GoalTimeEntry[] = [
  { id: "morning-adhkar", label: "Morning Adhkar",          icon: "weather-sunny",       color: '#F59E0B', note: "After Fajr" },
  { id: "evening-adhkar", label: "Evening Adhkar",          icon: "weather-sunset",      color: '#F59E0B', note: "Before Maghrib" },
  { id: "sleep-adhkar",   label: "Sleep Adhkar",            icon: "moon-waning-crescent",color: '#F59E0B', note: "Before bed" },
  { id: "quran-5min",     label: "Read Quran (5 min)",      icon: "book-open-variant",   color: "#6366F1" },
  { id: "surah-mulk",     label: "Recite Surah Al-Mulk",   icon: "moon-waning-crescent",color: "#6366F1", note: "Before sleeping" },
  { id: "surah-kahaf",    label: "Recite Surah Al-Kahf",   icon: "calendar-week",       color: "#6366F1", note: "Fridays only" },
  { id: "tahajjud",       label: "Tahajjud Prayer",         icon: "star-crescent",       color: "#10B981", note: "Late night" },
  { id: "nafl",           label: "Nafl Prayer",             icon: "hands-pray",          color: "#10B981" },
  { id: "fast-monday",    label: "Fast on Monday",          icon: "food-off",            color: "#14B8A6", note: "Reminder on Sunday evening" },
  { id: "fast-thursday",  label: "Fast on Thursday",        icon: "food-off",            color: "#14B8A6", note: "Reminder on Wednesday evening" },
];

const PRAYER_INFO = [
  { label: "Fajr",    note: "Fires at actual Fajr time (auto)" },
  { label: "Dhuhr",   note: "Fires at actual Dhuhr time (auto)" },
  { label: "Asr",     note: "Fires at actual Asr time (auto)" },
  { label: "Maghrib", note: "Fires at actual Maghrib time (auto)" },
  { label: "Isha",    note: "Fires at actual Isha time (auto)" },
];

function fmt12(hour: number, minute: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${String(minute).padStart(2, "0")} ${ampm}`;
}

export default function GoalNotifSettingsScreen() {
  const router = useRouter();
  const { colors , language } = useTheme();
  const { t } = useTranslation(language);
  const [times, setTimes] = useState<GoalNotifTimes | null>(null);
  const [editing, setEditing] = useState<keyof GoalNotifTimes | null>(null);
  const [inputH, setInputH] = useState("06");
  const [inputM, setInputM] = useState("00");

  useEffect(() => {
    getGoalNotifTimes().then(setTimes);
  }, []);

  const openEdit = useCallback(
    (id: keyof GoalNotifTimes) => {
      if (!times) return;
      Haptics.selectionAsync().catch(() => {});
      const t = times[id];
      setInputH(String(t.hour).padStart(2, "0"));
      setInputM(String(t.minute).padStart(2, "0"));
      setEditing(id);
    },
    [times]
  );

  const saveEdit = useCallback(async () => {
    if (!editing || !times) return;
    const h = Math.max(0, Math.min(23, parseInt(inputH || "0", 10)));
    const m = Math.max(0, Math.min(59, parseInt(inputM || "0", 10)));
    const updated = { ...times, [editing]: { hour: h, minute: m } };
    setTimes(updated);
    await saveGoalNotifTimes({ [editing]: { hour: h, minute: m } });
    setEditing(null);

    // Reschedule with the new time
    try {
      const activeIds = await getActiveGoalIds();
      const timingsRaw = await AsyncStorage.getItem("last_fetched_timings");
      const prayerTimings = timingsRaw ? JSON.parse(timingsRaw) : {};
      await scheduleGoalNotifications(activeIds, prayerTimings, updated);
    } catch (e) {
      console.error("Failed to reschedule after time edit:", e);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [editing, times, inputH, inputM]);

  if (!times) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.container, { backgroundColor: colors.surface }]}
      >
        <View style={styles.loadingWrap}>
          <AppLoadingState
            description="Reading your saved reminder schedule."
            title="Loading notification times"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <AppIconButton
          accessibilityLabel="Go back"
          icon="chevron-left"
          onPress={() => router.back()}
        />
        <Text style={[styles.title, { color: colors.onSurface }]}>Goal Notification Times</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        {/* Prayer times — auto, read-only */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>
          PRAYER GOALS — AUTOMATIC
        </Text>
        {PRAYER_INFO.map((p) => (
          <View key={p.label} style={[styles.row, { backgroundColor: colors.surfaceSecondary }]}>
            <MaterialCommunityIcons name="mosque" size={20} color="#10B981" style={styles.rowIcon} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{p.label}</Text>
              <Text style={[styles.rowNote, { color: colors.onSurfaceMuted }]}>{p.note}</Text>
            </View>
            <MaterialCommunityIcons name="lock-outline" size={16} color={colors.onSurfaceMuted} />
          </View>
        ))}

        {/* Configurable goal times */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted, marginTop: 24 }]}>
          OTHER GOALS — TAP TO EDIT TIME
        </Text>
        {GOAL_TIME_ENTRIES.map((entry) => {
          const t = times[entry.id];
          return (
            <Pressable
              key={entry.id}
              onPress={() => openEdit(entry.id)}
              style={[styles.row, { backgroundColor: colors.surfaceSecondary }]}
            >
              <MaterialCommunityIcons
                name={entry.icon as any}
                size={20}
                color={entry.color}
                style={styles.rowIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{entry.label}</Text>
                {entry.note && (
                  <Text style={[styles.rowNote, { color: colors.onSurfaceMuted }]}>{entry.note}</Text>
                )}
              </View>
              <View style={[styles.timeBadge, { backgroundColor: colors.brand + "22" }]}>
                <Text style={[styles.timeText, { color: colors.brand }]}>
                  {fmt12(t.hour, t.minute)}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={16}
                color={colors.onSurfaceMuted}
                style={{ marginLeft: 8 }}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <AppDialog
        cancelLabel={t("cancel")}
        confirmLabel={t("save")}
        onConfirm={saveEdit}
        onDismiss={() => setEditing(null)}
        title="Set notification time"
        visible={Boolean(editing)}
      >
        <View style={styles.dialogContent}>
          <Text style={[styles.modalSub, { color: colors.onSurfaceMuted }]}>
            {GOAL_TIME_ENTRIES.find((entry) => entry.id === editing)?.label}
          </Text>
          <View style={styles.timeRow}>
            <AppTextInput
              containerStyle={styles.timeInputContainer}
              keyboardType="number-pad"
              label="Hour"
              maxLength={2}
              onChangeText={setInputH}
              value={inputH}
            />
            <Text style={[styles.colon, { color: colors.onSurface }]}>:</Text>
            <AppTextInput
              containerStyle={styles.timeInputContainer}
              keyboardType="number-pad"
              label="Minute"
              maxLength={2}
              onChangeText={setInputM}
              value={inputM}
            />
          </View>
          <Text style={[styles.hint, { color: colors.onSurfaceMuted }]}>
            24-hour format (00–23 : 00–59)
          </Text>
        </View>
      </AppDialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: { fontSize: 17, fontWeight: "700" },
  sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: 8,
  },
  rowIcon: { marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowNote: { fontSize: 11, marginTop: 2 },
  timeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  timeText: { fontSize: 13, fontWeight: "700" },
  dialogContent: {
    gap: theme.spacing.md,
  },
  modalSub: { fontSize: 13, textAlign: "center", marginTop: -4 },
  timeRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginVertical: 8 },
  timeInputContainer: {
    width: 104,
  },
  colon: { fontSize: 32, fontWeight: "700" },
  hint: { fontSize: 11, textAlign: "center", marginTop: -4 },
});
