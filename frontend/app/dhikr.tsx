import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { DHIKRS } from "@/src/data/dhikrs";
import { getDhikrCounts, setDhikrCount } from "@/src/storage";

export default function DhikrScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="dhikr-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Tasbih</Text>
        <Pressable onPress={reset} hitSlop={10} testID="reset-btn">
          <MaterialCommunityIcons name="restore" size={24} color={colors.brand} />
        </Pressable>
      </View>

      <View style={styles.dhikrSelect}>
        <Text style={[styles.arabic, { color: colors.brand }]}>{selected.arabic}</Text>
        <Text style={[styles.translit, { color: colors.onSurfaceSecondary }]}>{selected.transliteration}</Text>
        <Text style={[styles.translation, { color: colors.onSurfaceMuted }]}>{selected.translation}</Text>
      </View>

      <Pressable onPress={tap} style={styles.tapWrap} testID="tasbih-tap">
        <View style={[styles.ringOuter, { borderColor: colors.surfaceSecondary }]}>
          <View
            style={[
              styles.ringFill,
              {
                borderTopColor: colors.brand,
                borderRightColor: colors.brand,
                transform: [{ rotate: `${progress * 360}deg` }],
              },
            ]}
          />
          <View style={[styles.ringInner, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.count, { color: colors.onSurface }]}>{count}</Text>
            <Text style={[styles.goal, { color: colors.onSurfaceMuted }]}>of {selected.goal}</Text>
          </View>
        </View>
        <Text style={[styles.tapHint, { color: colors.onSurfaceMuted }]}>Tap anywhere to count</Text>
      </Pressable>

      <View style={styles.presetWrap}>
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
                style={[
                  styles.preset,
                  { backgroundColor: active ? colors.brand : colors.surfaceSecondary },
                ]}
                testID={`preset-${d.id}`}
              >
                <Text
                  style={[
                    styles.presetTxt,
                    { color: active ? colors.onBrandPrimary : colors.onSurfaceMuted },
                  ]}
                >
                  {d.transliteration}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: "700" },
  dhikrSelect: { alignItems: "center", paddingHorizontal: 16, marginTop: 12 },
  arabic: { fontFamily: "Amiri", fontSize: 38, lineHeight: 60 },
  translit: { fontSize: 16, fontStyle: "italic", marginTop: 6 },
  translation: { fontSize: 13, marginTop: 4 },
  tapWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  ringOuter: { width: 240, height: 240, borderRadius: 120, borderWidth: 4, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  ringFill: { position: "absolute", width: 240, height: 240, borderRadius: 120, borderWidth: 4, borderColor: "transparent" },
  ringInner: { width: 200, height: 200, borderRadius: 100, alignItems: "center", justifyContent: "center" },
  count: { fontSize: 72, fontWeight: "800" },
  goal: { fontSize: 14 },
  tapHint: { marginTop: 16 },
  presetWrap: { height: 64, paddingVertical: 8 },
  presetRow: { paddingHorizontal: 16, alignItems: "center", gap: 8 },
  preset: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginRight: 8,
  },
  presetTxt: { fontWeight: "600", fontSize: 13 },
});
