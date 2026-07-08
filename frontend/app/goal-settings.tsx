import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

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
    } catch (e) {
      console.error("Failed to save setting:", e);
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
    Alert.alert(
      "Recitation Duration",
      "Choose daily recitation goal duration:",
      [
        { text: "5 minutes", onPress: () => { setRecitationDuration(5); saveSetting(STORAGE_KEYS.recitationDuration, "5"); } },
        { text: "10 minutes", onPress: () => { setRecitationDuration(10); saveSetting(STORAGE_KEYS.recitationDuration, "10"); } },
        { text: "15 minutes", onPress: () => { setRecitationDuration(15); saveSetting(STORAGE_KEYS.recitationDuration, "15"); } },
        { text: "30 minutes", onPress: () => { setRecitationDuration(30); saveSetting(STORAGE_KEYS.recitationDuration, "30"); } },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleScheduleChange = () => {
    if (hapticEffect) {
      Haptics.selectionAsync().catch(() => {});
    }
    Alert.alert(
      "Schedule Reminder",
      "Choose reminder time:",
      [
        { text: "06:00 PM", onPress: () => { setScheduleReminder("06:00 PM"); saveSetting(STORAGE_KEYS.scheduleReminder, "06:00 PM"); } },
        { text: "08:00 PM", onPress: () => { setScheduleReminder("08:00 PM"); saveSetting(STORAGE_KEYS.scheduleReminder, "08:00 PM"); } },
        { text: "09:00 PM", onPress: () => { setScheduleReminder("09:00 PM"); saveSetting(STORAGE_KEYS.scheduleReminder, "09:00 PM"); } },
        { text: "10:00 PM", onPress: () => { setScheduleReminder("10:00 PM"); saveSetting(STORAGE_KEYS.scheduleReminder, "10:00 PM"); } },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleAdhkarChange = () => {
    if (hapticEffect) {
      Haptics.selectionAsync().catch(() => {});
    }
    Alert.alert(
      "Select Daily Adhkar",
      "Choose number of daily Adhkar goals:",
      [
        { text: "1 Adhkar", onPress: () => { setSelectedAdhkar(1); saveSetting(STORAGE_KEYS.selectedAdhkar, "1"); } },
        { text: "3 Adhkar", onPress: () => { setSelectedAdhkar(3); saveSetting(STORAGE_KEYS.selectedAdhkar, "3"); } },
        { text: "5 Adhkar", onPress: () => { setSelectedAdhkar(5); saveSetting(STORAGE_KEYS.selectedAdhkar, "5"); } },
        { text: "Cancel", style: "cancel" },
      ]
    );
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
});
