import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Share,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { getQadhaCounts, saveQadhaCounts, QadhaCounts } from "@/src/storage";

const PRAYER_NAMES: (keyof QadhaCounts)[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
  "Witr",
];

const PRAYER_ICONS: Record<keyof QadhaCounts, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Fajr: "weather-partly-cloudy",
  Dhuhr: "weather-sunny",
  Asr: "weather-cloudy",
  Maghrib: "weather-sunset-down",
  Isha: "weather-night",
  Witr: "star-crescent",
};

export default function QadhaTrackerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [counts, setCounts] = useState<QadhaCounts>({
    Fajr: 0,
    Dhuhr: 0,
    Asr: 0,
    Maghrib: 0,
    Isha: 0,
    Witr: 0,
  });
  const [editingPrayer, setEditingPrayer] = useState<keyof QadhaCounts | null>(null);
  const [inputVal, setInputVal] = useState("");
  const [includeWitr, setIncludeWitr] = useState(true);

  useEffect(() => {
    Promise.all([getQadhaCounts(), AsyncStorage.getItem("hikmah:qadha:include-witr:v1")]).then(([savedCounts, witr]) => {
      setCounts(savedCounts);
      setIncludeWitr(witr !== "false");
    }).catch(() => {});
  }, []);

  const updateCount = async (prayer: keyof QadhaCounts, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const next = Math.max(0, counts[prayer] + delta);
    const updated = { ...counts, [prayer]: next };
    setCounts(updated);
    await saveQadhaCounts(updated);
  };

  const handleSaveInput = async () => {
    if (!editingPrayer) return;
    const num = parseInt(inputVal.trim(), 10);
    if (!isNaN(num) && num >= 0) {
      const updated = { ...counts, [editingPrayer]: num };
      setCounts(updated);
      await saveQadhaCounts(updated);
    }
    setEditingPrayer(null);
    setInputVal("");
  };

  const visiblePrayers = includeWitr ? PRAYER_NAMES : PRAYER_NAMES.filter(name => name !== "Witr");
  const totalRemaining = visiblePrayers.reduce((total, prayer) => total + counts[prayer], 0);
  const exportBackup = async () => {
    const backup = { version: 1, exportedAt: new Date().toISOString(), includeWitr, counts };
    await Share.share({ title: "Qadha tracker backup", message: JSON.stringify(backup, null, 2) });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Qadha Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.notice, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.onSurfaceMuted} />
          <Text style={[styles.noticeText, { color: colors.onSurfaceMuted }]}>Personal tracker only. Qadha practices vary; consult a trusted scholar for guidance.</Text>
        </View>
        {/* Total Banner */}
        <LinearGradient
          colors={[colors.brand, colors.brandSecondary || colors.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalCard}
        >
          <MaterialCommunityIcons name="book-clock-outline" size={36} color={colors.onBrandPrimary} />
          <Text style={[styles.totalCount, { color: colors.onBrandPrimary }]}>
            {totalRemaining.toLocaleString()}
          </Text>
          <Text style={[styles.totalLabel, { color: colors.onBrandPrimary, opacity: 0.9 }]}>
            Total Missed Prayers Remaining
          </Text>
          <Text style={[styles.totalDesc, { color: colors.onBrandPrimary, opacity: 0.8 }]}>
            May Allah make your journey light and grant you perseverance.
          </Text>
        </LinearGradient>

        {/* Individual Prayer Cards */}
        <View style={styles.cardsGrid}>
          {visiblePrayers.map((prayer) => {
            const count = counts[prayer];
            return (
              <View
                key={prayer}
                style={[
                  styles.prayerCard,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.prayerIconWrap, { backgroundColor: colors.brand + "15" }]}>
                    <MaterialCommunityIcons name={PRAYER_ICONS[prayer]} size={20} color={colors.brand} />
                  </View>
                  <Text style={[styles.prayerName, { color: colors.onSurface }]}>{prayer}</Text>
                  <Pressable
                    onPress={() => {
                      setEditingPrayer(prayer);
                      setInputVal(String(count));
                    }}
                    accessibilityLabel={`Edit count for ${prayer}`}
                    accessibilityRole="button"
                    style={styles.editBtn}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.onSurfaceMuted} />
                  </Pressable>
                </View>

                <Text style={[styles.countText, { color: count > 0 ? colors.brand : colors.onSurfaceMuted }]}>
                  {count}
                </Text>

                <View style={styles.controlsRow}>
                  <Pressable
                    onPress={() => updateCount(prayer, -1)}
                    disabled={count <= 0}
                    accessibilityLabel={`Decrease ${prayer} count`}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      (pressed || count <= 0) && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={[styles.btnTxt, { color: colors.onSurface }]}>-1</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateCount(prayer, 1)}
                    accessibilityLabel={`Increase ${prayer} count by 1`}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: colors.brand },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={[styles.btnTxt, { color: colors.onBrandPrimary }]}>+1</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => updateCount(prayer, 10)}
                    accessibilityLabel={`Increase ${prayer} count by 10`}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.btn,
                      { backgroundColor: colors.brand + "22", borderColor: colors.brand },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <Text style={[styles.btnTxt, { color: colors.brand }]}>+10</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
        <View style={[styles.optionsCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.optionTitle, { color: colors.onSurface }]}>Include Witr</Text>
          <Switch value={includeWitr} onValueChange={value => { setIncludeWitr(value); AsyncStorage.setItem("hikmah:qadha:include-witr:v1", String(value)); }} />
        </View>
        <Pressable onPress={exportBackup} style={[styles.exportBtn, { borderColor: colors.brand }]}>
          <MaterialCommunityIcons name="export-variant" size={18} color={colors.brand} />
          <Text style={{ color: colors.brand, fontWeight: "700" }}>Export private backup</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editingPrayer} transparent animationType="fade" onRequestClose={() => setEditingPrayer(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              Set {editingPrayer} Count
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.surface, color: colors.onSurface, borderColor: colors.border }]}
              value={inputVal}
              onChangeText={setInputVal}
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditingPrayer(null)} style={styles.cancelBtn}>
                <Text style={{ color: colors.onSurfaceMuted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveInput} style={[styles.saveBtn, { backgroundColor: colors.brand }]}>
                <Text style={{ color: colors.onBrandPrimary, fontWeight: "700" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  notice: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: "row", gap: 8, alignItems: "flex-start" },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  optionsCard: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionTitle: { fontSize: 15, fontWeight: "700" },
  exportBtn: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  totalCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  totalCount: {
    fontSize: 42,
    fontWeight: "900",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalDesc: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  cardsGrid: {
    gap: 16,
  },
  prayerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  prayerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  editBtn: {
    padding: 6,
  },
  countText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 14,
  },
  controlsRow: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBox: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
});
