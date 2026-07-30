import React from "react";
import { StyleSheet } from "react-native";
import {
  Portal,
  Snackbar,
  type SnackbarProps,
} from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export type AppSnackbarKind = "default" | "success" | "warning" | "error";

export type AppSnackbarProps = Omit<
  SnackbarProps,
  "action" | "children" | "theme"
> & {
  message: React.ReactNode;
  kind?: AppSnackbarKind;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function AppSnackbar({
  message,
  kind = "default",
  action,
  onDismiss,
  style,
  wrapperStyle,
  ...rest
}: AppSnackbarProps) {
  const { colors, mode } = useTheme();
  const backgroundColor =
    kind === "success"
      ? colors.success
      : kind === "warning"
        ? colors.warning
        : kind === "error"
          ? colors.error
          : colors.onSurface;
  const foregroundColor =
    kind === "default"
      ? colors.surface
      : mode === "dark"
        ? "#102019"
        : "#FFFFFF";

  return (
    <Portal>
      <Snackbar
        {...rest}
        action={
          action
            ? {
                ...action,
                textColor: foregroundColor,
              }
            : undefined
        }
        icon="close"
        iconAccessibilityLabel="Dismiss message"
        onDismiss={onDismiss}
        onIconPress={onDismiss}
        style={[styles.snackbar, { backgroundColor }, style]}
        theme={{
          colors: {
            inverseSurface: backgroundColor,
            inverseOnSurface: foregroundColor,
            inversePrimary: foregroundColor,
          },
        }}
        wrapperStyle={[styles.wrapper, wrapperStyle]}
      >
        {message}
      </Snackbar>
    </Portal>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    bottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  snackbar: {
    borderRadius: theme.radius.md,
  },
});
