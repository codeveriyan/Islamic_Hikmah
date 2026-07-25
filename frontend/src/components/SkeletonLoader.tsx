import React, { useEffect } from "react";
import { View, ViewStyle, StyleProp, DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/ThemeContext";

type BoneProps = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * A single shimmer bone — use like a placeholder for text or images.
 * The shimmer sweeps left-to-right in a 1.4s loop.
 */
export function SkeletonBone({ width = "100%", height = 16, borderRadius = 8, style }: BoneProps) {
  const { colors, mode } = useTheme();
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [mode === "dark" ? 0.25 : 0.45, mode === "dark" ? 0.55 : 0.85]),
  }));

  const base = mode === "dark" ? colors.surfaceTertiary : colors.surfaceSecondary;
  const highlight = mode === "dark" ? "#ffffff18" : "#ffffff90";

  return (
    <Animated.View style={[{ width, height, borderRadius, overflow: "hidden", backgroundColor: base }, style, animStyle]}>
      <LinearGradient
        colors={[base, highlight, base] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

/** Pre-built skeleton for a hadith card */
export function HadithCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 20, gap: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBone width={60} height={24} borderRadius={8} />
        <SkeletonBone width={80} height={20} borderRadius={8} />
      </View>
      <SkeletonBone width="90%" height={22} borderRadius={6} />
      <SkeletonBone width="100%" height={16} borderRadius={6} />
      <SkeletonBone width="100%" height={16} borderRadius={6} />
      <SkeletonBone width="75%" height={16} borderRadius={6} />
    </View>
  );
}

/** Pre-built skeleton for the prayer card on the home screen */
export function PrayerCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ marginHorizontal: 16, borderRadius: 20, backgroundColor: colors.surfaceSecondary, padding: 20, gap: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ gap: 8 }}>
          <SkeletonBone width={120} height={14} />
          <SkeletonBone width={80} height={32} borderRadius={10} />
          <SkeletonBone width={100} height={14} />
        </View>
        <SkeletonBone width={80} height={80} borderRadius={40} />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBone key={i} width={56} height={56} borderRadius={12} />
        ))}
      </View>
    </View>
  );
}

/** Pre-built skeleton for a Quran surah list item */
export function SurahItemSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
      <SkeletonBone width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBone width="60%" height={14} />
        <SkeletonBone width="40%" height={12} />
      </View>
      <SkeletonBone width={60} height={24} borderRadius={6} />
    </View>
  );
}

/** Shows N skeleton items of a given type */
export function SkeletonList({ count, type }: { count: number; type: "hadith" | "surah" }) {
  const items = Array.from({ length: count }, (_, i) => i);
  if (type === "hadith") return <>{items.map((i) => <HadithCardSkeleton key={i} />)}</>;
  return <>{items.map((i) => <SurahItemSkeleton key={i} />)}</>;
}
