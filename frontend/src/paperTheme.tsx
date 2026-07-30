import React, { useMemo } from "react";
import {
  MD3DarkTheme,
  MD3LightTheme,
  PaperProvider,
  configureFonts,
  type MD3Theme,
} from "react-native-paper";

import { type AppColors, useTheme } from "@/src/ThemeContext";

const paperFonts = configureFonts({
  config: {
    displayLarge: {
      fontFamily: "Outfit_800ExtraBold",
      fontWeight: "800",
    },
    displayMedium: {
      fontFamily: "Outfit_700Bold",
      fontWeight: "700",
    },
    displaySmall: {
      fontFamily: "Outfit_700Bold",
      fontWeight: "700",
    },
    headlineLarge: {
      fontFamily: "Outfit_700Bold",
      fontWeight: "700",
    },
    headlineMedium: {
      fontFamily: "Outfit_700Bold",
      fontWeight: "700",
    },
    headlineSmall: {
      fontFamily: "Outfit_600SemiBold",
      fontWeight: "600",
    },
    titleLarge: {
      fontFamily: "Outfit_600SemiBold",
      fontWeight: "600",
    },
    titleMedium: {
      fontFamily: "Figtree_600SemiBold",
      fontWeight: "600",
    },
    titleSmall: {
      fontFamily: "Figtree_600SemiBold",
      fontWeight: "600",
    },
    bodyLarge: {
      fontFamily: "Figtree_400Regular",
      fontWeight: "400",
    },
    bodyMedium: {
      fontFamily: "Figtree_400Regular",
      fontWeight: "400",
    },
    bodySmall: {
      fontFamily: "Figtree_400Regular",
      fontWeight: "400",
    },
    labelLarge: {
      fontFamily: "Figtree_600SemiBold",
      fontWeight: "600",
    },
    labelMedium: {
      fontFamily: "Figtree_500Medium",
      fontWeight: "500",
    },
    labelSmall: {
      fontFamily: "Figtree_500Medium",
      fontWeight: "500",
    },
  },
});

export const createPaperTheme = (appColors: AppColors): MD3Theme => {
  const baseTheme =
    appColors.mode === "dark" ? MD3DarkTheme : MD3LightTheme;
  const onError = appColors.mode === "dark" ? "#3A0611" : "#FFFFFF";

  return {
    ...baseTheme,
    dark: appColors.mode === "dark",
    roundness: 12,
    colors: {
      ...baseTheme.colors,
      primary: appColors.brand,
      onPrimary: appColors.onBrandPrimary,
      primaryContainer: appColors.brandSecondary,
      onPrimaryContainer: appColors.onSurface,
      secondary: appColors.brandSecondary,
      onSecondary: appColors.onBrandPrimary,
      secondaryContainer: appColors.surfaceTertiary,
      onSecondaryContainer: appColors.onSurface,
      tertiary: appColors.gold,
      onTertiary: "#211B00",
      tertiaryContainer: appColors.surfaceTertiary,
      onTertiaryContainer: appColors.gold,
      background: appColors.surface,
      onBackground: appColors.onSurface,
      surface: appColors.surface,
      surfaceVariant: appColors.surfaceSecondary,
      onSurface: appColors.onSurface,
      onSurfaceVariant: appColors.onSurfaceSecondary,
      surfaceDisabled: appColors.surfaceTertiary,
      onSurfaceDisabled: appColors.onSurfaceMuted,
      outline: appColors.border,
      outlineVariant: appColors.border,
      error: appColors.error,
      onError,
      errorContainer: appColors.surfaceTertiary,
      onErrorContainer: appColors.error,
      inverseSurface: appColors.onSurface,
      inverseOnSurface: appColors.surface,
      inversePrimary: appColors.brandSecondary,
      shadow: "#000000",
      scrim: "#000000",
      backdrop: "rgba(0, 0, 0, 0.48)",
      elevation: {
        level0: "transparent",
        level1: appColors.surfaceSecondary,
        level2: appColors.surfaceSecondary,
        level3: appColors.surfaceTertiary,
        level4: appColors.surfaceTertiary,
        level5: appColors.surfaceTertiary,
      },
    },
    fonts: paperFonts,
  };
};

/**
 * Adapts the app's persisted theme selection to React Native Paper without
 * introducing a second theme source of truth.
 */
export function AppPaperProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  const paperTheme = useMemo(() => createPaperTheme(colors), [colors]);

  return <PaperProvider theme={paperTheme}>{children}</PaperProvider>;
}
