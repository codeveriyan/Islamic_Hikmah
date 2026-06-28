import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { theme } from "@/src/theme";
import { DHIKRS } from "@/src/data/dhikrs";
import { getDhikrCounts, setDhikrCount } from "@/src/storage";

export default function DhikrScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(DHIKRS[0]);
  const [count, setCount] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getDhikrCounts().then((c) => {
      setCounts(c);
      setCount(c[selected.id] || 0);
    });
  }, []);

  useEffect(() => {
    setCount(counts[selected.id] || 0);
  }, [selected.id]);

  const tap = async () => {
    const next = count + 1;
    setCount(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (next === selected.goal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    const newCounts = { ...counts, [selected.id]: next };
    setCounts(newCounts);
    await setDhikrCount(selected.id, next);
  };

  const reset = async () => {
    setCount(0);
    const newCounts = { ...counts, [selected.id]: 0 };
    setCounts(newCounts);
    await setDhikrCount(selected.id, 0);
  };

  const progress = Math.min(count / selected.goal, 1);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="dhikr-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Tasbih</Text>
        <Pressable onPress={reset} hitSlop={10} testID="reset-btn">
          <MaterialCommunityIcons name="restore" size={24} color={theme.colors.brand} />
        </Pressable>
      </View>

      <View style={styles.dhikrSelect}>
        <Text style={styles.arabic}>{selected.arabic}</Text>
        <Text style={styles.translit}>{selected.transliteration}</Text>
        <Text style={styles.translation}>{selected.translation}</Text>
      </View>

      <Pressable onPress={tap} style={styles.tapWrap} testID="tasbih-tap">
        <View style={styles.ringOuter}>
          <View
            style={[
              styles.ringFill,
              { transform: [{ rotate: `${progress * 360}deg` }] },
            ]}
          />
          <View style={styles.ringInner}>
            <Text style={styles.count}>{count}</Text>
            <Text style={styles.goal}>of {selected.goal}</Text>
          </View>
        </View>
        <Text style={styles.tapHint}>Tap anywhere to count</Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetRow}
      >
        {DHIKRS.map((d) => {
          const active = d.id === selected.id;
          return (
            <Pressable
              key={d.id}
              onPress={() => setSelected(d)}
              style={[styles.preset, active && styles.presetActive]}
              testID={`preset-${d.id}`}
            >
              <Text style={[styles.presetTxt, active && styles.presetTxtActive]}>
                {d.transliteration}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { color: theme.colors.onSurface, fontSize: 18, fontWeight: "700" },
  dhikrSelect: { alignItems: "center", paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.md },
  arabic: { color: theme.colors.brand, fontFamily: "Amiri", fontSize: 38, lineHeight: 60 },
  translit: { color: theme.colors.onSurfaceSecondary, fontSize: 16, fontStyle: "italic", marginTop: 6 },
  translation: { color: theme.colors.onSurfaceMuted, fontSize: 13, marginTop: 4 },
  tapWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  ringOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ringFill: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: "transparent",
    borderTopColor: theme.colors.brand,
    borderRightColor: theme.colors.brand,
  },
  ringInner: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  count: { color: theme.colors.onSurface, fontSize: 72, fontWeight: "800" },
  goal: { color: theme.colors.onSurfaceMuted, fontSize: 14 },
  tapHint: { color: theme.colors.onSurfaceMuted, marginTop: theme.spacing.lg },
  presetRow: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, gap: theme.spacing.sm },
  preset: { paddingHorizontal: theme.spacing.lg, paddingVertical: 10, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surfaceSecondary, marginRight: theme.spacing.sm },
  presetActive: { backgroundColor: theme.colors.brand },
  presetTxt: { color: theme.colors.onSurfaceMuted, fontWeight: "600" },
  presetTxtActive: { color: theme.colors.onBrandPrimary },
});
