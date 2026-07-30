import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Switch, type SwitchProps } from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export type AppSwitchProps = Omit<
  SwitchProps,
  "color" | "onValueChange" | "style" | "value"
> & {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  containerStyle?: StyleProp<ViewStyle>;
  switchStyle?: StyleProp<ViewStyle>;
};

export function AppSwitch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  containerStyle,
  switchStyle,
  accessibilityLabel,
  ...rest
}: AppSwitchProps) {
  const { colors } = useTheme();
  const control = (
    <Switch
      {...rest}
      accessibilityLabel={accessibilityLabel ?? label}
      color={colors.brand}
      disabled={disabled}
      onValueChange={onValueChange}
      style={switchStyle}
      value={value}
    />
  );

  if (!label && !description) return control;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [
        styles.row,
        {
          borderColor: colors.border,
          opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
        },
        containerStyle,
      ]}
    >
      <View style={styles.copy}>
        {label ? (
          <Text style={[styles.label, { color: colors.onSurface }]}>
            {label}
          </Text>
        ) : null}
        {description ? (
          <Text
            style={[styles.description, { color: colors.onSurfaceMuted }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <View pointerEvents="none">{control}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
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
