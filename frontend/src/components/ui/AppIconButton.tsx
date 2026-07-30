import React from "react";
import { StyleSheet } from "react-native";
import { IconButton, type IconButtonProps } from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";

export type AppIconButtonVariant =
  | "plain"
  | "outlined"
  | "tonal"
  | "primary"
  | "danger";

export type AppIconButtonProps = Omit<
  IconButtonProps,
  "accessibilityLabel" | "containerColor" | "iconColor" | "mode"
> & {
  accessibilityLabel: string;
  variant?: AppIconButtonVariant;
};

export function AppIconButton({
  variant = "plain",
  accessibilityLabel,
  contentStyle,
  size = 22,
  style,
  ...rest
}: AppIconButtonProps) {
  const { colors, mode } = useTheme();
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  const paperMode =
    variant === "outlined"
      ? "outlined"
      : variant === "plain"
        ? undefined
        : "contained-tonal";

  const containerColor = isPrimary
    ? colors.brand
    : isDanger
      ? colors.error
      : variant === "tonal"
        ? colors.surfaceTertiary
        : undefined;
  const iconColor = isPrimary
    ? colors.onBrandPrimary
    : isDanger
      ? mode === "dark"
        ? "#3A0611"
        : "#FFFFFF"
      : colors.onSurface;

  return (
    <IconButton
      {...rest}
      accessibilityLabel={accessibilityLabel}
      containerColor={containerColor}
      contentStyle={[styles.content, contentStyle]}
      iconColor={iconColor}
      mode={paperMode}
      rippleColor={`${isDanger ? colors.error : colors.brand}24`}
      size={size}
      style={[styles.button, style]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    margin: 0,
  },
  content: {
    width: 44,
    height: 44,
  },
});
