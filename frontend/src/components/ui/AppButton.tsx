import React from "react";
import { StyleSheet } from "react-native";
import { Button, type ButtonProps } from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export type AppButtonVariant =
  | "primary"
  | "secondary"
  | "outlined"
  | "text"
  | "danger";

export type AppButtonProps = Omit<
  ButtonProps,
  "buttonColor" | "children" | "loading" | "mode" | "textColor"
> & {
  label: React.ReactNode;
  variant?: AppButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
};

const paperModeByVariant: Record<
  AppButtonVariant,
  NonNullable<ButtonProps["mode"]>
> = {
  primary: "contained",
  secondary: "contained-tonal",
  outlined: "outlined",
  text: "text",
  danger: "contained",
};

export function AppButton({
  label,
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  accessibilityLabel,
  contentStyle,
  labelStyle,
  style,
  ...rest
}: AppButtonProps) {
  const { colors, mode } = useTheme();
  const isDanger = variant === "danger";
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";

  const buttonColor = isDanger
    ? colors.error
    : isPrimary
      ? colors.brand
      : isSecondary
        ? colors.surfaceTertiary
        : undefined;
  const textColor = isDanger
    ? mode === "dark"
      ? "#3A0611"
      : "#FFFFFF"
    : isPrimary
      ? colors.onBrandPrimary
      : isSecondary
        ? colors.onSurface
        : colors.brand;

  return (
    <Button
      {...rest}
      accessibilityLabel={
        accessibilityLabel ??
        (typeof label === "string" ? label : undefined)
      }
      buttonColor={buttonColor}
      contentStyle={[styles.content, contentStyle]}
      disabled={disabled || loading}
      labelStyle={[styles.label, labelStyle]}
      loading={loading}
      mode={paperModeByVariant[variant]}
      rippleColor={`${isDanger ? colors.error : colors.brand}24`}
      style={[styles.button, fullWidth ? styles.fullWidth : undefined, style]}
      textColor={textColor}
      uppercase={false}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.radius.pill,
  },
  fullWidth: {
    width: "100%",
  },
  content: {
    minHeight: 48,
    paddingHorizontal: 8,
  },
  label: {
    fontFamily: theme.font.textSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
});
