import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { DHIKRS } from "@/src/data/dhikrs";
import { getDhikrCounts, setDhikrCount } from "@/src/storage";
import { theme } from "@/src/theme";
import Svg, { Circle } from "react-native-svg";

const RING_SIZE = 240;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function DhikrScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selected, setSelected] = useState(DHIKRS[0]);
  const [count, setCount] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // FIX 4: Proper SVG arc progress ring instead of CSS rotation hack
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getDhikrCounts().then((c) => {
      setCounts(c);
      setCount(c[selected.id] || 0);
      const prog = Math.min((c[selected.id] || 0) / selected.goal, 1);
      progressAnim.setValue(prog);
    });
  }, []);

  useEffect(() => {
    const curr = counts[selected.id] || 0;
    setCount(curr);
    const prog = Math.min(curr / selected.goal, 1);
    Animated.timing(progressAnim, {
      toValue: prog,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // SVG doesn't support native driver
    }).start();
  }, [selected.id]);

  const tap = async () => {
    const next = count + 1;
    setCount(next);

    // FIX 1: useNativeDriver for scale bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (next === selected.goal) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }

    const prog = Math.min(next / selected.goal, 1);
    Animated.timing(progressAnim, {
      toValue: prog,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    const newCounts = { ...counts, [selected.id]: next };
    setCounts(newCounts);
    await setDhikrCount(selected.id, next);
  };

  const reset = async () => {
    setCount(0);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    const newCounts = { ...counts, [selected.id]: 0 };
    setCounts(newCounts);
    await setDhikrCount(selected.id, 0);
  };

  const isComplete = count >= selected.goal;
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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

      {/* FIX 4: Proper SVG progress ring */}
      <Pressable onPress={tap} style={styles.tapWrap} testID="tasbih-tap">
        <Animated.View style={[styles.ringContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background ring */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={colors.surfaceSecondary}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
            />
            {/* Progress arc */}
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={isComplete ? theme.colors.success : colors.brand}
              strokeWidth={STROKE_WIDTH}
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>

          {/* Center content */}
          <View style={styles.ringCenter}>
            <Text style={[styles.count, { color: isComplete ? theme.colors.success : colors.onSurface }]}>
              {count}
            </Text>
            <Text style={[styles.goal, { color: colors.onSurfaceMuted }]}>of {selected.goal}</Text>
            {isComplete && (
              <Text style={styles.completeEmoji}>✨</Text>
            )}
          </View>
        </Animated.View>
        <Text style={[styles.tapHint, { color: colors.onSurfaceMuted }]}>
          {isComplete ? "Goal reached! Tap to continue" : "Tap anywhere to count"}
        </Text>
      </Pressable>

      <View style={styles.presetWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetRow}
        >
          {DHIKRS.map((d) => {
            const active = d.id === selected.id;
            const dCount = counts[d.id] || 0;
            const dComplete = dCount >= d.goal;
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
                  {d.transliteration} {dComplete ? "✓" : ""}
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
  dhikrSelect: { alignItems: "center", paddingHorizontal: 16, marginTop: 8 },
  arabic: { fontFamily: "Amiri", fontSize: 38, lineHeight: 60 },
  translit: { fontSize: 16, fontStyle: "italic", marginTop: 6 },
  translation: { fontSize: 13, marginTop: 4 },
  tapWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  ringContainer: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  count: { fontSize: 64, fontWeight: "800", lineHeight: 72 },
  goal: { fontSize: 14 },
  completeEmoji: { fontSize: 24, marginTop: 4 },
  tapHint: { marginTop: 16, fontSize: 14 },
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
