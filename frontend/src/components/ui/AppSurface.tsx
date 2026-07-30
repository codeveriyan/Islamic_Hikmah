import React from "react";
import { StyleSheet } from "react-native";
import { Surface, type SurfaceProps } from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export type AppSurfaceTone = "base" | "raised" | "overlay";
export type AppSurfacePadding = "none" | "small" | "medium" | "large";

export type AppSurfaceProps = Omit<SurfaceProps, "elevation"> & {
  tone?: AppSurfaceTone;
  padding?: AppSurfacePadding;
  bordered?: boolean;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
};

const elevationByTone: Record<AppSurfaceTone, 0 | 1 | 3> = {
  base: 0,
  raised: 1,
  overlay: 3,
};

export function AppSurface({
  children,
  tone = "base",
  padding = "medium",
  bordered = true,
  elevation,
  mode,
  style,
  ...rest
}: AppSurfaceProps) {
  const { colors } = useTheme();
  const backgroundColor =
    tone === "base"
      ? colors.surface
      : tone === "raised"
        ? colors.surfaceSecondary
        : colors.surfaceTertiary;

  return (
    <Surface
      {...rest}
      elevation={elevation ?? elevationByTone[tone]}
      mode={mode ?? (tone === "base" ? "flat" : "elevated")}
      style={[
        styles.surface,
        padding === "small"
          ? styles.paddingSmall
          : padding === "medium"
            ? styles.paddingMedium
            : padding === "large"
              ? styles.paddingLarge
              : undefined,
        {
          backgroundColor,
          borderColor: colors.border,
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
    >
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderRadius: theme.radius.md,
  },
  paddingSmall: {
    padding: theme.spacing.sm,
  },
  paddingMedium: {
    padding: theme.spacing.lg,
  },
  paddingLarge: {
    padding: theme.spacing.xl,
  },
});
