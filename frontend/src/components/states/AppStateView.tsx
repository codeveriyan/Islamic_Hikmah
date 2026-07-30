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
  AppSurface,
  type AppButtonVariant,
} from "@/src/components/ui";

export type AppStateTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "error"
  | "premium";

export type AppStateIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export type AppStateAction = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: AppButtonVariant;
};

export type AppStateViewProps = {
  icon: AppStateIconName;
  title: string;
  description?: string;
  tone?: AppStateTone;
  primaryAction?: AppStateAction;
  secondaryAction?: AppStateAction;
  compact?: boolean;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type SharedPresetProps = {
  title?: string;
  description?: string;
  compact?: boolean;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const accentForTone = (
  tone: AppStateTone,
  colors: ReturnType<typeof useTheme>["colors"]
) => {
  switch (tone) {
    case "brand":
      return colors.brand;
    case "success":
      return colors.success;
    case "warning":
      return colors.warning;
    case "error":
      return colors.error;
    case "premium":
      return colors.gold;
    default:
      return colors.onSurfaceMuted;
  }
};

export function AppStateView({
  icon,
  title,
  description,
  tone = "brand",
  primaryAction,
  secondaryAction,
  compact = false,
  fill = false,
  style,
  testID,
}: AppStateViewProps) {
  const { colors } = useTheme();
  const accent = accentForTone(tone, colors);

  return (
    <AppSurface
      bordered
      padding={compact ? "medium" : "large"}
      style={[styles.surface, fill ? styles.fill : undefined, style]}
      testID={testID}
      tone="raised"
    >
      <View
        accessibilityLiveRegion="polite"
        style={[styles.content, compact ? styles.contentCompact : undefined]}
      >
        <View
          style={[
            styles.iconContainer,
            compact ? styles.iconContainerCompact : undefined,
            { backgroundColor: `${accent}18`, borderColor: `${accent}38` },
          ]}
        >
          <MaterialCommunityIcons
            color={accent}
            name={icon}
            size={compact ? 28 : 38}
          />
        </View>

        <View style={styles.copy}>
          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              compact ? styles.titleCompact : undefined,
              { color: colors.onSurface },
            ]}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={[
                styles.description,
                { color: colors.onSurfaceMuted },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>

        {primaryAction || secondaryAction ? (
          <View style={styles.actions}>
            {primaryAction ? (
              <AppButton
                fullWidth
                label={primaryAction.label}
                loading={primaryAction.loading}
                onPress={primaryAction.onPress}
                variant={primaryAction.variant ?? "primary"}
              />
            ) : null}
            {secondaryAction ? (
              <AppButton
                fullWidth
                label={secondaryAction.label}
                loading={secondaryAction.loading}
                onPress={secondaryAction.onPress}
                variant={secondaryAction.variant ?? "outlined"}
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </AppSurface>
  );
}

export type AppEmptyStateProps = SharedPresetProps & {
  icon?: AppStateIconName;
  actionLabel?: string;
  onAction?: () => void;
};

export function AppEmptyState({
  icon = "inbox-outline",
  title = "Nothing here yet",
  description = "Content will appear here when it becomes available.",
  actionLabel,
  onAction,
  ...rest
}: AppEmptyStateProps) {
  return (
    <AppStateView
      {...rest}
      description={description}
      icon={icon}
      primaryAction={
        actionLabel && onAction
          ? { label: actionLabel, onPress: onAction }
          : undefined
      }
      title={title}
      tone="neutral"
    />
  );
}

export type AppOfflineStateProps = SharedPresetProps & {
  onRetry?: () => void;
  onUseOffline?: () => void;
};

export function AppOfflineState({
  title = "You are offline",
  description = "Check your connection and try again. Downloaded content remains available.",
  onRetry,
  onUseOffline,
  ...rest
}: AppOfflineStateProps) {
  return (
    <AppStateView
      {...rest}
      description={description}
      icon="wifi-off"
      primaryAction={
        onRetry ? { label: "Try again", onPress: onRetry } : undefined
      }
      secondaryAction={
        onUseOffline
          ? { label: "Use offline content", onPress: onUseOffline }
          : undefined
      }
      title={title}
      tone="warning"
    />
  );
}

export type AppErrorStateProps = SharedPresetProps & {
  onRetry?: () => void;
};

export function AppErrorState({
  title = "Something went wrong",
  description = "We could not complete this request. Please try again.",
  onRetry,
  ...rest
}: AppErrorStateProps) {
  return (
    <AppStateView
      {...rest}
      description={description}
      icon="alert-circle-outline"
      primaryAction={
        onRetry
          ? {
              label: "Try again",
              onPress: onRetry,
              variant: "danger",
            }
          : undefined
      }
      title={title}
      tone="error"
    />
  );
}

export type AppPermissionKind =
  | "location"
  | "notifications"
  | "camera"
  | "microphone";

export type AppPermissionStateProps = SharedPresetProps & {
  permission: AppPermissionKind;
  onOpenSettings?: () => void;
  onTryAgain?: () => void;
};

const permissionContent: Record<
  AppPermissionKind,
  {
    icon: AppStateIconName;
    title: string;
    description: string;
  }
> = {
  location: {
    icon: "map-marker-off-outline",
    title: "Location access is off",
    description:
      "Enable location access to calculate accurate prayer times and Qibla direction.",
  },
  notifications: {
    icon: "bell-off-outline",
    title: "Notifications are off",
    description:
      "Enable notifications to receive prayer, adhkar, and goal reminders.",
  },
  camera: {
    icon: "camera-off-outline",
    title: "Camera access is off",
    description:
      "Enable camera access to scan products and use camera-assisted features.",
  },
  microphone: {
    icon: "microphone-off",
    title: "Microphone access is off",
    description:
      "Enable microphone access to use recitation and voice-assisted features.",
  },
};

export function AppPermissionState({
  permission,
  title,
  description,
  onOpenSettings,
  onTryAgain,
  ...rest
}: AppPermissionStateProps) {
  const content = permissionContent[permission];

  return (
    <AppStateView
      {...rest}
      description={description ?? content.description}
      icon={content.icon}
      primaryAction={
        onOpenSettings
          ? { label: "Open settings", onPress: onOpenSettings }
          : undefined
      }
      secondaryAction={
        onTryAgain ? { label: "Try again", onPress: onTryAgain } : undefined
      }
      title={title ?? content.title}
      tone="warning"
    />
  );
}

export type AppAuthRequiredStateProps = SharedPresetProps & {
  onSignIn?: () => void;
  onContinueAsGuest?: () => void;
};

export function AppAuthRequiredState({
  title = "Sign in to continue",
  description = "Create an account or sign in to sync your progress securely across devices.",
  onSignIn,
  onContinueAsGuest,
  ...rest
}: AppAuthRequiredStateProps) {
  return (
    <AppStateView
      {...rest}
      description={description}
      icon="account-lock-outline"
      primaryAction={
        onSignIn ? { label: "Sign in", onPress: onSignIn } : undefined
      }
      secondaryAction={
        onContinueAsGuest
          ? { label: "Continue as guest", onPress: onContinueAsGuest }
          : undefined
      }
      title={title}
      tone="brand"
    />
  );
}

export type AppPremiumStateProps = SharedPresetProps & {
  featureName?: string;
  onUpgrade?: () => void;
  onNotNow?: () => void;
};

export function AppPremiumState({
  featureName,
  title = featureName ? `Unlock ${featureName}` : "Premium feature",
  description = "Upgrade to access this feature and support the continued development of Islamic Hikmah.",
  onUpgrade,
  onNotNow,
  ...rest
}: AppPremiumStateProps) {
  return (
    <AppStateView
      {...rest}
      description={description}
      icon="crown-outline"
      primaryAction={
        onUpgrade ? { label: "View premium", onPress: onUpgrade } : undefined
      }
      secondaryAction={
        onNotNow ? { label: "Not now", onPress: onNotNow } : undefined
      }
      title={title}
      tone="premium"
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
  },
  fill: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.lg,
  },
  contentCompact: {
    paddingVertical: theme.spacing.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 40,
    borderWidth: 1,
    marginBottom: theme.spacing.lg,
  },
  iconContainerCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: theme.spacing.md,
  },
  copy: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  title: {
    fontFamily: theme.font.display,
    fontSize: 22,
    lineHeight: 28,
    textAlign: "center",
  },
  titleCompact: {
    fontSize: 19,
    lineHeight: 24,
  },
  description: {
    fontFamily: theme.font.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  actions: {
    width: "100%",
    maxWidth: 320,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
});
