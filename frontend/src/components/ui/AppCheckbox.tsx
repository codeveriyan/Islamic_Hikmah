import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Checkbox, type CheckboxProps } from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export type AppCheckboxProps = Omit<
  CheckboxProps,
  "color" | "onPress" | "status" | "uncheckedColor"
> & {
  checked: boolean;
  onValueChange: (checked: boolean) => void;
  label: React.ReactNode;
  accessibilityLabel?: string;
  description?: string;
  indeterminate?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppCheckbox({
  checked,
  onValueChange,
  label,
  accessibilityLabel,
  description,
  indeterminate = false,
  disabled = false,
  containerStyle,
  ...rest
}: AppCheckboxProps) {
  const { colors } = useTheme();
  const status = indeterminate
    ? "indeterminate"
    : checked
      ? "checked"
      : "unchecked";

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ??
        (typeof label === "string" ? label : undefined)
      }
      accessibilityRole="checkbox"
      accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!checked)}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: colors.border,
          opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
        },
        containerStyle,
      ]}
    >
      <View pointerEvents="none">
        <Checkbox
          {...rest}
          color={colors.brand}
          disabled={disabled}
          status={status}
          uncheckedColor={colors.onSurfaceMuted}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>
        {description ? (
          <Text
            style={[styles.description, { color: colors.onSurfaceMuted }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontFamily: theme.font.textMedium,
    fontSize: 15,
    lineHeight: 20,
  },
  description: {
    fontFamily: theme.font.text,
    fontSize: 13,
    lineHeight: 18,
  },
});
