import React from "react";
import { Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const SPRING_CONFIG = { damping: 15, stiffness: 300, mass: 0.6 };

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
  disabled?: boolean;
  delayLongPress?: number;
  hitSlop?: number;
  testID?: string;
};

/**
 * Drop-in replacement for <Pressable> with Reanimated 3 spring physics.
 * Works exactly like Pressable but adds spring scale + opacity bounce.
 * Nested Pressables are NOT blocked — this wraps using the Animated.Pressable pattern.
 */
export function AnimatedCard({
  children,
  onPress,
  onLongPress,
  style,
  pressedScale = 0.96,
  disabled = false,
  delayLongPress = 350,
  hitSlop,
  testID,
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animStyle, style]}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => {
          if (disabled) return;
          scale.value = withSpring(pressedScale, SPRING_CONFIG);
          opacity.value = withTiming(0.88, { duration: 80 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_CONFIG);
          opacity.value = withTiming(1, { duration: 120 });
        }}
        disabled={disabled}
        delayLongPress={delayLongPress}
        hitSlop={hitSlop}
        testID={testID}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
