import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Switch, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { getReminders, saveReminders, Reminder } from "@/src/storage";

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
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const r = await Notifications.requestPermissionsAsync();
    return r.status === "granted";
  };

  const scheduleAll = async (list: Reminder[]) => {
    if (Platform.OS === "web") return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const r of list) {
      if (!r.enabled) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: "Islamic Hikmah Reminder", body: r.title, sound: true },
        trigger: { hour: r.hour, minute: r.minute, repeats: true } as any,
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
          style={styles.addBtn}
          testID="add-reminder-btn"
        >
          <MaterialCommunityIcons name="plus" size={22} color={theme.colors.onBrandPrimary} />
        </Pressable>
      </View>

      {adding ? (
        <View style={styles.addPanel} testID="add-reminder-panel">
          <TextInput
            placeholder="What to remember? (e.g. Read Surah Mulk)"
            placeholderTextColor={theme.colors.onSurfaceMuted}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            testID="reminder-title-input"
          />
          <View style={styles.timeRow}>
            <TextInput
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.input, styles.timeInput]}
              testID="reminder-hour-input"
            />
            <Text style={styles.colon}>:</Text>
            <TextInput
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
              style={[styles.input, styles.timeInput]}
              testID="reminder-minute-input"
            />
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={() => setAdding(false)}
              style={[styles.actionBtn, { backgroundColor: theme.colors.surfaceTertiary }]}
              testID="reminder-cancel-btn"
            >
              <Text style={[styles.actionTxt, { color: theme.colors.onSurface }]}>{t("cancel")}</Text>
            </Pressable>
            <Pressable
              onPress={addReminder}
              style={[styles.actionBtn, { backgroundColor: theme.colors.brand }]}
              testID="reminder-save-btn"
            >
              <Text style={[styles.actionTxt, { color: theme.colors.onBrandPrimary }]}>{t("save")}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {items.length === 0 && !adding ? (
        <View style={styles.empty} testID="rem-empty">
          <MaterialCommunityIcons name="bell-ring-outline" size={64} color={theme.colors.brand} />
          <Text style={styles.emptyTitle}>No reminders</Text>
          <Text style={styles.emptyText}>Set daily reminders for adhkar, Quran reading, or any Du{`'`}a habit.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}
          renderItem={({ item }) => (
            <View style={styles.card} testID={`reminder-${item.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>
                  {String(item.hour).padStart(2, "0")}:{String(item.minute).padStart(2, "0")}
                </Text>
              </View>
              <Switch
                value={item.enabled}
                onValueChange={() => toggle(item.id)}
                trackColor={{ true: theme.colors.brandSecondary, false: theme.colors.surfaceTertiary }}
                testID={`switch-${item.id}`}
              />
              <Pressable onPress={() => remove(item.id)} hitSlop={10} testID={`delete-${item.id}`}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.error} />
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
  input: { backgroundColor: theme.colors.surfaceTertiary, color: theme.colors.onSurface, padding: 12, borderRadius: theme.radius.md, fontSize: 15 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.sm },
  timeInput: { width: 70, textAlign: "center", fontSize: 22, fontWeight: "700" },
  colon: { color: theme.colors.onSurface, fontSize: 28, fontWeight: "700" },
  actions: { flexDirection: "row", gap: theme.spacing.md, marginTop: theme.spacing.sm },
  actionBtn: { flex: 1, padding: 14, borderRadius: theme.radius.md, alignItems: "center" },
  actionTxt: { fontWeight: "700" },
});
