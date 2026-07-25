import { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

type EmptyStateProps = {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Additional decorative icons shown in the orbit ring (max 4) */
  orbitIcons?: string[];
  delay?: number;
};

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  orbitIcons,
  delay = 0,
}: EmptyStateProps) {
  const { colors, mode } = useTheme();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  const scale = useSharedValue(0.88);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 18, stiffness: 200 })
    );
    scale.value = withDelay(
      delay,
      withSpring(1, { damping: 16, stiffness: 220 })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const bg = mode === "dark" ? colors.surface : "#F8FAFC";
  const ringColor = mode === "dark" ? "rgba(0,168,132,0.12)" : "rgba(4,120,87,0.08)";
  const ringInner = mode === "dark" ? "rgba(0,168,132,0.2)" : "rgba(4,120,87,0.14)";

  return (
    <Animated.View style={[s.container, containerStyle]}>
      {/* Orbit ring with decorative icons */}
      <View style={[s.outerRing, { borderColor: ringColor }]}>
        <View style={[s.innerRing, { borderColor: ringInner }]}>
          {/* Centre icon */}
          <View style={[s.iconWrap, { backgroundColor: colors.brand + "18" }]}>
            <MaterialCommunityIcons name={icon as any} size={40} color={colors.brand} />
          </View>
        </View>
        {/* Orbit decorative icons */}
        {orbitIcons?.slice(0, 4).map((oi, idx) => {
          const angle = (idx / (orbitIcons.length > 4 ? 4 : orbitIcons.length)) * 2 * Math.PI - Math.PI / 2;
          const r = 74;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          return (
            <View
              key={idx}
              style={[
                s.orbitIcon,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  transform: [{ translateX: x }, { translateY: y }],
                },
              ]}
            >
              <MaterialCommunityIcons name={oi as any} size={16} color={colors.onSurfaceMuted} />
            </View>
          );
        })}
      </View>

      {/* Text */}
      <Text style={[s.title, { color: colors.onSurface }]}>{title}</Text>
      {subtitle ? (
        <Text style={[s.subtitle, { color: colors.onSurfaceMuted }]}>{subtitle}</Text>
      ) : null}

      {/* Action button */}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [s.btn, { backgroundColor: colors.brand, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[s.btnTxt, { color: "#fff" }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: theme.spacing.xl,
  },
  outerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    position: "relative",
  },
  innerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitIcon: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Figtree_400Regular",
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  btnTxt: {
    fontSize: 15,
    fontFamily: "Figtree_400Regular",
    fontWeight: "700",
  },
});
