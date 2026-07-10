import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Platform, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { 
  getActiveGoalIds, 
  getGoalNotifTimes, 
  scheduleGoalNotifications 
} from "@/src/storage";

const STORAGE_KEYS = {
  logReminder: "hikmah:settings:log-reminder",
  recitationDuration: "hikmah:settings:recitation-duration",
  quranReminder: "hikmah:settings:quran-reminder",
  scheduleReminder: "hikmah:settings:schedule-reminder",
  selectedAdhkar: "hikmah:settings:selected-adhkar",
  dhikrReminder: "hikmah:settings:dhikr-reminder",
  hapticEffect: "hikmah:settings:haptic-effect",
};

export default function GoalSettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // Settings states
  const [logReminder, setLogReminder] = useState(true);
  const [recitationDuration, setRecitationDuration] = useState(5);
  const [quranReminder, setQuranReminder] = useState(true);
  const [scheduleReminder, setScheduleReminder] = useState("08:00 PM");
  const [selectedAdhkar, setSelectedAdhkar] = useState(3);
  const [dhikrReminder, setDhikrReminder] = useState(true);
  const [hapticEffect, setHapticEffect] = useState(true);
  const [activePicker, setActivePicker] = useState<"duration" | "schedule" | "adhkar" | null>(null);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      try {
        const [lr, rd, qr, sr, sa, dr, he] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.logReminder),
          AsyncStorage.getItem(STORAGE_KEYS.recitationDuration),
          AsyncStorage.getItem(STORAGE_KEYS.quranReminder),
          AsyncStorage.getItem(STORAGE_KEYS.scheduleReminder),
          AsyncStorage.getItem(STORAGE_KEYS.selectedAdhkar),
          AsyncStorage.getItem(STORAGE_KEYS.dhikrReminder),
          AsyncStorage.getItem(STORAGE_KEYS.hapticEffect),
        ]);

        if (lr !== null) setLogReminder(lr === "true");
        if (rd !== null) setRecitationDuration(parseInt(rd, 10));
        if (qr !== null) setQuranReminder(qr === "true");
        if (sr !== null) setScheduleReminder(sr);
        if (sa !== null) setSelectedAdhkar(parseInt(sa, 10));
        if (dr !== null) setDhikrReminder(dr === "true");
        if (he !== null) setHapticEffect(he === "true");
      } catch (e) {
        console.error("Failed to load goal settings:", e);
      }
    })();
  }, []);

  // Save helpers
  const saveSetting = async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      
      // Auto-reschedule notifications to apply setting changes instantly
      const activeIds = await getActiveGoalIds();
      const timingsRaw = await AsyncStorage.getItem("last_fetched_timings");
      const prayerTimings = timingsRaw ? JSON.parse(timingsRaw) : {};
      const goalTimes = await getGoalNotifTimes();
      await scheduleGoalNotifications(activeIds, prayerTimings, goalTimes);
    } catch (e) {
      console.error("Failed to save setting and reschedule:", e);
    }
  };

  const handleToggle = (setting: string, val: boolean) => {
    if (hapticEffect) {
      Haptics.selectionAsync().catch(() => {});
    }
    switch (setting) {
      case "logReminder":
        setLogReminder(val);
        saveSetting(STORAGE_KEYS.logReminder, String(val));
        break;
      case "quranReminder":
        setQuranReminder(val);
        saveSetting(STORAGE_KEYS.quranReminder, String(val));
        break;
      case "dhikrReminder":
        setDhikrReminder(val);
        saveSetting(STORAGE_KEYS.dhikrReminder, String(val));
        break;
      case "hapticEffect":
        setHapticEffect(val);
        saveSetting(STORAGE_KEYS.hapticEffect, String(val));
        break;
    }
  };

  const handleDurationChange = () => {
    if (hapticEffect) {
      Haptics.selectionAsync().catch(() => {});
    }
    setActivePicker("duration");
  };

  const handleScheduleChange = () => {
    if (hapticEffect) {
      Haptics.selectionAsync().catch(() => {});
    }
    setActivePicker("schedule");
  };

  const handleAdhkarChange = () => {
    if (hapticEffect) {
      Haptics.selectionAsync().catch(() => {});
    }
    setActivePicker("adhkar");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Daily Goals</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* PRAYER SECTION */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>PRAYER</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.row}>
            <Text style={[styles.rowText, { color: colors.onSurface }]}>Log reminder</Text>
            <Switch
              value={logReminder}
              onValueChange={(val) => handleToggle("logReminder", val)}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={Platform.OS === "ios" ? undefined : colors.surfaceSecondary}
            />
          </View>
        </View>

        {/* AL-QURAN SECTION */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>AL-QURAN</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Pressable 
            onPress={handleDurationChange}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.rowText, { color: colors.onSurface }]}>Recitation duration</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.valueText, { color: colors.onSurfaceMuted }]}>{recitationDuration} mins</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
            </View>
          </Pressable>
          
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.rowText, { color: colors.onSurface }]}>Al-Quran reminder</Text>
            <Switch
              value={quranReminder}
              onValueChange={(val) => handleToggle("quranReminder", val)}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={Platform.OS === "ios" ? undefined : colors.surfaceSecondary}
            />
          </View>

          <Pressable 
            onPress={handleScheduleChange}
            style={({ pressed }) => [styles.row, { borderTopWidth: 1, borderTopColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.rowText, { color: colors.onSurface }]}>Schedule reminder</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.valueText, { color: colors.onSurfaceMuted }]}>{scheduleReminder}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
            </View>
          </Pressable>
        </View>

        {/* TASBIH SECTION */}
        <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>TASBIH</Text>
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Pressable 
            onPress={handleAdhkarChange}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.rowText, { color: colors.onSurface }]}>Select Daily Adhkar</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={[styles.valueText, { color: colors.onSurfaceMuted }]}>{selectedAdhkar} selected</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
            </View>
          </Pressable>
          
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.rowText, { color: colors.onSurface }]}>Dhikr reminder</Text>
            <Switch
              value={dhikrReminder}
              onValueChange={(val) => handleToggle("dhikrReminder", val)}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={Platform.OS === "ios" ? undefined : colors.surfaceSecondary}
            />
          </View>

          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <Text style={[styles.rowText, { color: colors.onSurface }]}>Haptic effect</Text>
            <Switch
              value={hapticEffect}
              onValueChange={(val) => handleToggle("hapticEffect", val)}
              trackColor={{ false: colors.border, true: colors.brand }}
              thumbColor={Platform.OS === "ios" ? undefined : colors.surfaceSecondary}
            />
          </View>
        </View>
      </ScrollView>

      {/* Custom dropdown picker modal */}
      <Modal
        visible={activePicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setActivePicker(null)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                {activePicker === "duration" 
                  ? "Recitation Duration" 
                  : activePicker === "schedule" 
                  ? "Schedule Reminder" 
                  : "Select Daily Adhkar"}
              </Text>
              <Pressable onPress={() => setActivePicker(null)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            
            <View style={{ width: "100%", gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
              {activePicker === "duration" && [
                { val: 5, label: "5 minutes" },
                { val: 10, label: "10 minutes" },
                { val: 15, label: "15 minutes" },
                { val: 30, label: "30 minutes" },
              ].map((opt) => {
                const isActive = recitationDuration === opt.val;
                return (
                  <Pressable
                    key={opt.val}
                    onPress={() => {
                      if (hapticEffect) Haptics.selectionAsync().catch(() => {});
                      setRecitationDuration(opt.val);
                      saveSetting(STORAGE_KEYS.recitationDuration, String(opt.val));
                      setActivePicker(null);
                    }}
                    style={[styles.modalRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.modalRowLabel, { color: colors.onSurface, fontWeight: isActive ? "700" : "400" }]}>
                      {opt.label}
                    </Text>
                    {isActive && <MaterialCommunityIcons name="check" size={18} color={colors.brand} />}
                  </Pressable>
                );
              })}

              {activePicker === "schedule" && [
                "06:00 PM",
                "08:00 PM",
                "09:00 PM",
                "10:00 PM",
              ].map((opt) => {
                const isActive = scheduleReminder === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      if (hapticEffect) Haptics.selectionAsync().catch(() => {});
                      setScheduleReminder(opt);
                      saveSetting(STORAGE_KEYS.scheduleReminder, opt);
                      setActivePicker(null);
                    }}
                    style={[styles.modalRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.modalRowLabel, { color: colors.onSurface, fontWeight: isActive ? "700" : "400" }]}>
                      {opt}
                    </Text>
                    {isActive && <MaterialCommunityIcons name="check" size={18} color={colors.brand} />}
                  </Pressable>
                );
              })}

              {activePicker === "adhkar" && [
                { val: 1, label: "1 Adhkar" },
                { val: 3, label: "3 Adhkars" },
                { val: 5, label: "5 Adhkars" },
              ].map((opt) => {
                const isActive = selectedAdhkar === opt.val;
                return (
                  <Pressable
                    key={opt.val}
                    onPress={() => {
                      if (hapticEffect) Haptics.selectionAsync().catch(() => {});
                      setSelectedAdhkar(opt.val);
                      saveSetting(STORAGE_KEYS.selectedAdhkar, String(opt.val));
                      setActivePicker(null);
                    }}
                    style={[styles.modalRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.modalRowLabel, { color: colors.onSurface, fontWeight: isActive ? "700" : "400" }]}>
                      {opt.label}
                    </Text>
                    {isActive && <MaterialCommunityIcons name="check" size={18} color={colors.brand} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Modal>
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
  },
  rowText: {
    fontSize: 15,
    fontWeight: "600",
  },
  valueText: {
    fontSize: 14,
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  modalRowLabel: {
    fontSize: 14,
  },
});
