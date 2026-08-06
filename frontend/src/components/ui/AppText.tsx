import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

type TypographyRole = keyof typeof theme.typography; // "display" | "headline" | "title" | "body" | "label"
type TypographySize = "lg" | "md" | "sm";

export type AppTextVariant = `${TypographyRole}-${TypographySize}`;

export type AppTextWeight = "regular" | "medium" | "semibold" | "bold";

export type AppTextProps = Omit<TextProps, "style"> & {
  /** Type-scale role + size, e.g. "headline-md", "body-sm". Defaults to "body-md". */
  variant?: AppTextVariant;
  /** Overrides the default onSurface color for this role. */
  color?: string;
  /** Overrides the default font weight mapping for this role. */
  weight?: AppTextWeight;
  /** Renders using the Arabic display font instead of the Latin font. */
  arabic?: boolean;
  style?: TextProps["style"];
};

const fontFamilyByRoleAndWeight: Record<TypographyRole, Record<AppTextWeight, string>> = {
  display: {
    regular: theme.font.display,
    medium: theme.font.display,
    semibold: theme.font.display,
    bold: theme.font.displayBold,
  },
  headline: {
    regular: theme.font.display,
    medium: theme.font.display,
    semibold: theme.font.display,
    bold: theme.font.displayBold,
  },
  title: {
    regular: theme.font.textMedium,
    medium: theme.font.textMedium,
    semibold: theme.font.textSemiBold,
    bold: theme.font.textBold,
  },
  body: {
    regular: theme.font.text,
    medium: theme.font.textMedium,
    semibold: theme.font.textSemiBold,
    bold: theme.font.textBold,
  },
  label: {
    regular: theme.font.textMedium,
    medium: theme.font.textMedium,
    semibold: theme.font.textSemiBold,
    bold: theme.font.textBold,
  },
};

const defaultWeightByRole: Record<TypographyRole, AppTextWeight> = {
  display: "bold",
  headline: "semibold",
  title: "semibold",
  body: "regular",
  label: "semibold",
};

/**
 * Shared text component wired to the Material 3 Expressive type scale in
 * `theme.typography`. Use `variant="body-md"`, `variant="title-lg"`, etc.
 * instead of hand-picking `fontSize`/`fontFamily` per call site, so
 * screen-to-screen typography stays consistent and themeable.
 *
 * @example
 * <AppText variant="headline-md">Today's Goals</AppText>
 * <AppText variant="body-sm" color={colors.onSurfaceMuted}>3 of 5 completed</AppText>
 * <AppText variant="title-lg" arabic>بِسْمِ اللَّهِ</AppText>
 */
export function AppText({
  variant = "body-md",
  color,
  weight,
  arabic = false,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const [role, size] = variant.split("-") as [TypographyRole, TypographySize];
  const resolvedWeight = weight ?? defaultWeightByRole[role];
  const fontSize = theme.typography[role][size];

  const textStyle: TextStyle = {
    fontSize,
    lineHeight: Math.round(fontSize * 1.25),
    fontFamily: arabic ? theme.font.arabic : fontFamilyByRoleAndWeight[role][resolvedWeight],
    color: color ?? colors.onSurface,
  };

  return <Text {...rest} style={[textStyle, style]} />;
}
