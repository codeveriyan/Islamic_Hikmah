import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ActivityIndicator, ProgressBar } from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { AppSurface } from "@/src/components/ui";
import { SkeletonBone } from "@/src/components/SkeletonLoader";

export type AppLoadingStateProps = {
  title?: string;
  description?: string;
  progress?: number;
  showPercentage?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppLoadingState({
  title = "Loading",
  description,
  progress,
  showPercentage = true,
  compact = false,
  style,
  testID,
}: AppLoadingStateProps) {
  const { colors } = useTheme();
  const normalizedProgress =
    progress === undefined ? undefined : Math.min(1, Math.max(0, progress));

  return (
    <AppSurface
      padding={compact ? "medium" : "large"}
      style={[styles.surface, style]}
      testID={testID}
      tone="raised"
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="progressbar"
        accessibilityValue={
          normalizedProgress === undefined
            ? undefined
            : {
                min: 0,
                max: 100,
                now: Math.round(normalizedProgress * 100),
              }
        }
        style={[
          styles.content,
          compact ? styles.contentCompact : undefined,
        ]}
      >
        {normalizedProgress === undefined ? (
          <ActivityIndicator
            animating
            color={colors.brand}
            size={compact ? 28 : 40}
          />
        ) : (
          <View style={styles.progressWrap}>
            <ProgressBar
              color={colors.brand}
              progress={normalizedProgress}
              style={[
                styles.progress,
                { backgroundColor: colors.surfaceTertiary },
              ]}
            />
            {showPercentage ? (
              <Text style={[styles.percentage, { color: colors.brand }]}>
                {Math.round(normalizedProgress * 100)}%
              </Text>
            ) : null}
          </View>
        )}
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        {description ? (
          <Text
            style={[styles.description, { color: colors.onSurfaceMuted }]}
          >
            {description}
          </Text>
        ) : null}
      </View>
    </AppSurface>
  );
}

export type AppSkeletonStateProps = {
  rows?: number;
  showAvatar?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppSkeletonState({
  rows = 3,
  showAvatar = true,
  compact = false,
  style,
  testID,
}: AppSkeletonStateProps) {
  const skeletonRows = Array.from(
    { length: Math.min(8, Math.max(1, rows)) },
    (_, index) => index
  );

  return (
    <AppSurface
      accessibilityLabel="Loading content"
      padding={compact ? "medium" : "large"}
      style={[styles.surface, style]}
      testID={testID}
      tone="raised"
    >
      <View style={styles.skeletonHeader}>
        {showAvatar ? (
          <SkeletonBone
            borderRadius={compact ? 20 : 28}
            height={compact ? 40 : 56}
            width={compact ? 40 : 56}
          />
        ) : null}
        <View style={styles.skeletonHeaderCopy}>
          <SkeletonBone height={16} width="55%" />
          <SkeletonBone height={12} width="35%" />
        </View>
      </View>
      <View style={styles.skeletonRows}>
        {skeletonRows.map((row) => (
          <SkeletonBone
            key={row}
            height={compact ? 12 : 14}
            width={row === skeletonRows.length - 1 ? "68%" : "100%"}
          />
        ))}
      </View>
    </AppSurface>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
  },
  content: {
    alignItems: "center",
    paddingVertical: theme.spacing.lg,
  },
  contentCompact: {
    paddingVertical: theme.spacing.sm,
  },
  progressWrap: {
    width: "100%",
    maxWidth: 360,
    alignItems: "flex-end",
  },
  progress: {
    width: "100%",
    height: 8,
    borderRadius: theme.radius.pill,
  },
  percentage: {
    fontFamily: theme.font.textSemiBold,
    fontSize: 12,
    lineHeight: 16,
    marginTop: theme.spacing.xs,
  },
  title: {
    fontFamily: theme.font.display,
    fontSize: 19,
    lineHeight: 24,
    textAlign: "center",
    marginTop: theme.spacing.lg,
  },
  description: {
    maxWidth: 360,
    fontFamily: theme.font.text,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  skeletonHeaderCopy: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  skeletonRows: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
});
