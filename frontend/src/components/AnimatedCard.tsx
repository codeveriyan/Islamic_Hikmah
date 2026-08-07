import React from "react";
import { Pressable, ViewStyle, StyleProp, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  SPRING_PRESS,
  TIMING_FAST,
  TIMING_BASE,
  getSpringConfig,
  getTimingConfig,
  useReducedMotion,
} from "@/src/motion";

type Props = Omit<PressableProps, "children" | "style"> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

/**
 * Drop-in replacement for <Pressable> with Reanimated 3 spring physics.
 * Works exactly like Pressable but adds spring scale + opacity bounce.
 * Nested Pressables are NOT blocked — this wraps using the Animated.Pressable pattern.
 *
 * Animation feel comes from the shared tokens in `@/src/motion`, and presses
 * respect the OS "Reduce Motion" accessibility setting automatically.
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
  ...pressableProps
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const reduceMotion = useReducedMotion();

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
          scale.value = withSpring(pressedScale, getSpringConfig(SPRING_PRESS, reduceMotion));
          opacity.value = withTiming(0.88, getTimingConfig(TIMING_FAST, reduceMotion));
        }}
        onPressOut={() => {
          scale.value = withSpring(1, getSpringConfig(SPRING_PRESS, reduceMotion));
          opacity.value = withTiming(1, getTimingConfig(TIMING_BASE, reduceMotion));
        }}
        disabled={disabled}
        delayLongPress={delayLongPress}
        hitSlop={hitSlop}
        testID={testID}
        style={{ flex: 1 }}
        {...pressableProps}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
