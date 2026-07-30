import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import {
  AppButton,
  AppIconButton,
  AppSurface,
} from "@/src/components/ui";
import type {
  AppStateIconName,
  AppStateTone,
} from "@/src/components/states/AppStateView";

export type AppStatusBannerKind =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "offline";

export type AppStatusBannerProps = {
  message: string;
  title?: string;
  kind?: AppStatusBannerKind;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const bannerConfig: Record<
  AppStatusBannerKind,
  { icon: AppStateIconName; tone: AppStateTone }
> = {
  info: { icon: "information-outline", tone: "brand" },
  success: { icon: "check-circle-outline", tone: "success" },
  warning: { icon: "alert-outline", tone: "warning" },
  error: { icon: "alert-circle-outline", tone: "error" },
  offline: { icon: "wifi-off", tone: "warning" },
};

export function AppStatusBanner({
  message,
  title,
  kind = "info",
  actionLabel,
  onAction,
  onDismiss,
  style,
  testID,
}: AppStatusBannerProps) {
  const { colors } = useTheme();
  const config = bannerConfig[kind];
  const accent =
    config.tone === "success"
      ? colors.success
      : config.tone === "warning"
        ? colors.warning
        : config.tone === "error"
          ? colors.error
          : colors.brand;

  return (
    <AppSurface
      accessibilityLiveRegion="polite"
      accessibilityRole={kind === "error" ? "alert" : "summary"}
      padding="medium"
      style={[
        styles.surface,
        { borderColor: `${accent}55`, backgroundColor: `${accent}10` },
        style,
      ]}
      testID={testID}
      tone="raised"
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: `${accent}18` }]}>
          <MaterialCommunityIcons
            color={accent}
            name={config.icon}
            size={22}
          />
        </View>
        <View style={styles.copy}>
          {title ? (
            <Text style={[styles.title, { color: colors.onSurface }]}>
              {title}
            </Text>
          ) : null}
          <Text style={[styles.message, { color: colors.onSurfaceSecondary }]}>
            {message}
          </Text>
          {actionLabel && onAction ? (
            <AppButton
              compact
              label={actionLabel}
              onPress={onAction}
              style={styles.action}
              variant="text"
            />
          ) : null}
        </View>
        {onDismiss ? (
          <AppIconButton
            accessibilityLabel="Dismiss message"
            icon="close"
            onPress={onDismiss}
          />
        ) : null}
      </View>
    </AppSurface>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minHeight: 40,
    justifyContent: "center",
  },
  title: {
    fontFamily: theme.font.textSemiBold,
    fontSize: 14,
    lineHeight: 19,
  },
  message: {
    fontFamily: theme.font.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },
  action: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xs,
    marginLeft: -theme.spacing.sm,
  },
});
