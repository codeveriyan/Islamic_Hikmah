/**
 * AnimatedPressable
 * Drop-in replacement for Pressable with Reanimated spring-scale on press.
 * Usage: <AnimatedPressable onPress={fn} style={styles.card}>...</AnimatedPressable>
 */
import React, { useCallback } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  activeScale?: number;
  children?: React.ReactNode;
};

export const AnimatedPressable = React.memo(function AnimatedPressable({
  style,
  children,
  springConfig,
  activeScale = 0.96,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const cfg = {
    damping: springConfig?.damping ?? 15,
    stiffness: springConfig?.stiffness ?? 200,
    mass: springConfig?.mass ?? 0.8,
  };

  const handlePressIn = useCallback(
    (e: any) => {
      scale.value = withSpring(activeScale, cfg);
      onPressIn?.(e);
    },
    [scale, activeScale, cfg, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      scale.value = withSpring(1, cfg);
      onPressOut?.(e);
    },
    [scale, cfg, onPressOut]
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressableBase
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
});
