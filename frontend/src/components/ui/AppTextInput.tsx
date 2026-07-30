import React, { forwardRef } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import {
  HelperText,
  TextInput,
  type TextInputProps,
} from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export type AppTextInputProps = Omit<
  TextInputProps,
  | "activeOutlineColor"
  | "error"
  | "mode"
  | "outlineColor"
  | "ref"
  | "textColor"
>
  & {
    errorMessage?: string;
    helperText?: string;
    mode?: "flat" | "outlined";
    containerStyle?: StyleProp<ViewStyle>;
    leadingIcon?: React.ComponentProps<typeof TextInput.Icon>["icon"];
    trailingIcon?: React.ComponentProps<typeof TextInput.Icon>["icon"];
    onTrailingIconPress?: () => void;
    trailingIconAccessibilityLabel?: string;
  };

type AppTextInputRef = React.ComponentRef<typeof TextInput>;

export const AppTextInput = forwardRef<AppTextInputRef, AppTextInputProps>(
  (
    {
      errorMessage,
      helperText,
      mode = "outlined",
      containerStyle,
      leadingIcon,
      trailingIcon,
      onTrailingIconPress,
      trailingIconAccessibilityLabel,
      contentStyle,
      left,
      outlineStyle,
      right,
      style,
      ...rest
    },
    ref
  ) => {
    const { colors } = useTheme();
    const supportingText = errorMessage || helperText;

    return (
      <View style={containerStyle}>
        <TextInput
          {...rest}
          ref={ref as React.ComponentProps<typeof TextInput>["ref"]}
          activeOutlineColor={errorMessage ? colors.error : colors.brand}
          contentStyle={[styles.content, contentStyle]}
          cursorColor={colors.brand}
          error={Boolean(errorMessage)}
          left={
            left ??
            (leadingIcon ? <TextInput.Icon icon={leadingIcon} /> : undefined)
          }
          mode={mode}
          outlineColor={errorMessage ? colors.error : colors.border}
          outlineStyle={[styles.outline, outlineStyle]}
          placeholderTextColor={colors.onSurfaceMuted}
          selectionColor={`${colors.brand}55`}
          right={
            right ??
            (trailingIcon ? (
              <TextInput.Icon
                accessibilityLabel={trailingIconAccessibilityLabel}
                icon={trailingIcon}
                onPress={onTrailingIconPress}
              />
            ) : undefined)
          }
          style={[
            styles.input,
            { backgroundColor: colors.surfaceSecondary },
            style,
          ]}
          textColor={colors.onSurface}
        />
        {supportingText ? (
          <HelperText
            type={errorMessage ? "error" : "info"}
            visible
            style={[
              styles.helper,
              { color: errorMessage ? colors.error : colors.onSurfaceMuted },
            ]}
          >
            {supportingText}
          </HelperText>
        ) : null}
      </View>
    );
  }
);

AppTextInput.displayName = "AppTextInput";

const styles = StyleSheet.create({
  input: {
    minHeight: 56,
    fontFamily: theme.font.text,
    fontSize: 16,
  },
  content: {
    fontFamily: theme.font.text,
  },
  outline: {
    borderRadius: theme.radius.md,
  },
  helper: {
    paddingHorizontal: theme.spacing.sm,
    fontFamily: theme.font.text,
  },
});
