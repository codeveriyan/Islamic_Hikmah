import React from "react";
import { StyleSheet } from "react-native";
import { Chip, type ChipProps } from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export type AppChipProps = Omit<ChipProps, "children" | "selectedColor"> & {
  label: React.ReactNode;
};

export function AppChip({
  label,
  accessibilityLabel,
  selected = false,
  showSelectedCheck = false,
  style,
  textStyle,
  ...rest
}: AppChipProps) {
  const { colors } = useTheme();

  return (
    <Chip
      {...rest}
      accessibilityLabel={
        accessibilityLabel ??
        (typeof label === "string" ? label : undefined)
      }
      selected={selected}
      selectedColor={colors.brand}
      showSelectedCheck={showSelectedCheck}
      showSelectedOverlay
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.surfaceTertiary
            : colors.surfaceSecondary,
          borderColor: selected ? colors.brand : colors.border,
        },
        style,
      ]}
      textStyle={[
        styles.label,
        { color: selected ? colors.brand : colors.onSurface },
        textStyle,
      ]}
    >
      {label}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
  },
  label: {
    fontFamily: theme.font.textMedium,
    fontSize: 14,
  },
});
