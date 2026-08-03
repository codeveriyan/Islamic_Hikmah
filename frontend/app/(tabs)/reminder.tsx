import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { getReminders, saveReminders, Reminder } from "@/src/storage";
import {
  AppButton,
  AppSwitch,
  AppTextInput,
} from "@/src/components/ui";
import { AppEmptyState } from "@/src/components/states";
import { getNotifications } from "@/src/notifications";

export default function ReminderScreen() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [hour, setHour] = useState("06");
  const [minute, setMinute] = useState("00");
  const { colors , language } = useTheme();
  const { t } = useTranslation(language);

  useFocusEffect(
    useCallback(() => {
      getReminders().then(setItems);
    }, [])
  );

  const persist = async (next: Reminder[]) => {
    setItems(next);
    await saveReminders(next);
  };

  const ensurePerm = async () => {
    if (Platform.OS === "web") return true;
    const Notifications = await getNotifications();
    if (!Notifications) return false;
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const r = await Notifications.requestPermissionsAsync();
    return r.status === "granted";
  };

  const scheduleAll = async (list: Reminder[]) => {
    if (Platform.OS === "web") return;
    const Notifications = await getNotifications();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const r of list) {
      if (!r.enabled) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: "Islamic Hikmah Reminder", body: r.title, sound: Platform.OS === 'ios' ? true : undefined },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: r.hour,
          minute: r.minute,
        } as any,
      });
    }
  };

  const addReminder = async () => {
    const h = Math.max(0, Math.min(23, parseInt(hour || "0", 10)));
    const m = Math.max(0, Math.min(59, parseInt(minute || "0", 10)));
    if (!title.trim()) return;
    const ok = await ensurePerm();
    const next: Reminder[] = [
      ...items,
      { id: `r-${Date.now()}`, title: title.trim(), hour: h, minute: m, enabled: ok },
    ];
    await persist(next);
    if (ok) await scheduleAll(next);
    setTitle("");
    setHour("06");
    setMinute("00");
    setAdding(false);
  };

  const toggle = async (id: string) => {
    const next = items.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    await persist(next);
    await scheduleAll(next);
  };

  const remove = async (id: string) => {
    const next = items.filter((r) => r.id !== id);
    await persist(next);
    await scheduleAll(next);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.onSurface }]}>{t("reminders")}</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>Daily Dhikr & Du{`'`}a alerts</Text>
        </View>
        <Pressable
          onPress={() => setAdding(true)}
          style={[styles.addBtn, { backgroundColor: colors.brand }]}
          testID="add-reminder-btn"
        >
          <MaterialCommunityIcons name="plus" size={22} color={colors.onBrandPrimary} />
        </Pressable>
      </View>

      {adding ? (
        <View style={[styles.addPanel, { backgroundColor: colors.surfaceSecondary }]} testID="add-reminder-panel">
          <AppTextInput
            placeholder="What to remember? (e.g. Read Surah Mulk)"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
              testID="reminder-title-input"
            />
          <View style={styles.timeRow}>
            <AppTextInput
              label="Hour"
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
              containerStyle={styles.timeInputContainer}
              style={styles.timeInput}
              testID="reminder-hour-input"
            />
            <Text style={[styles.colon, { color: colors.onSurface }]}>:</Text>
            <AppTextInput
              label="Minute"
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
              containerStyle={styles.timeInputContainer}
              style={styles.timeInput}
              testID="reminder-minute-input"
            />
          </View>
          <View style={styles.actions}>
            <AppButton
              label={t("cancel")}
              onPress={() => setAdding(false)}
              style={styles.actionBtn}
              testID="reminder-cancel-btn"
              variant="outlined"
            />
            <AppButton
              label={t("save")}
              onPress={addReminder}
              style={styles.actionBtn}
              testID="reminder-save-btn"
            />
          </View>
        </View>
      ) : null}

      {items.length === 0 && !adding ? (
        <AppEmptyState
          description={`Set daily reminders for Adhkar, Quran reading, or any Du'a habit. Tap + to add one.`}
          title="No reminders set"
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: colors.surfaceSecondary }]} testID={`reminder-${item.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{item.title}</Text>
                <Text style={[styles.cardTime, { color: colors.brand }]}>
                  {String(item.hour).padStart(2, "0")}:{String(item.minute).padStart(2, "0")}
                </Text>
              </View>
              <AppSwitch
                accessibilityLabel={`${item.title} reminder`}
                value={item.enabled}
                onValueChange={() => toggle(item.id)}
                testID={`switch-${item.id}`}
              />
              <Pressable onPress={() => remove(item.id)} hitSlop={10} testID={`delete-${item.id}`}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  title: { color: theme.colors.onSurface, fontSize: 28, fontWeight: "700" },
  subtitle: { color: theme.colors.onSurfaceMuted, marginTop: 4 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.brand, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  emptyTitle: { color: theme.colors.onSurface, fontSize: 18, fontWeight: "700", marginTop: 16 },
  emptyText: { color: theme.colors.onSurfaceMuted, textAlign: "center", marginTop: 8, lineHeight: 20 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg, gap: theme.spacing.md },
  cardTitle: { color: theme.colors.onSurface, fontSize: 15, fontWeight: "600" },
  cardTime: { color: theme.colors.brand, fontSize: 22, fontWeight: "700", marginTop: 2 },
  addPanel: { marginHorizontal: theme.spacing.lg, padding: theme.spacing.lg, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md, gap: theme.spacing.md },
  input: { fontSize: 15 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  timeInputContainer: { width: 88 },
  timeInput: { textAlign: "center", fontSize: 22, fontWeight: "700" },
  colon: { color: theme.colors.onSurface, fontSize: 28, fontWeight: "700" },
  actions: { flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.sm },
  actionBtn: { flex: 1 },
});
