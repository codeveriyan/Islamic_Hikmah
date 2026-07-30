import React from "react";
import { StyleSheet } from "react-native";
import {
  Dialog,
  Portal,
  Text,
  type DialogProps,
} from "react-native-paper";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { AppButton } from "@/src/components/ui/AppButton";

export type AppDialogProps = Omit<DialogProps, "children"> & {
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  confirmLoading?: boolean;
  destructive?: boolean;
};

export function AppDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  cancelLabel = "Cancel",
  confirmLoading = false,
  destructive = false,
  onDismiss,
  style,
  ...rest
}: AppDialogProps) {
  const { colors } = useTheme();

  return (
    <Portal>
      <Dialog
        {...rest}
        onDismiss={onDismiss}
        style={[
          styles.dialog,
          { backgroundColor: colors.surfaceSecondary },
          style,
        ]}
      >
        <Dialog.Title style={[styles.title, { color: colors.onSurface }]}>
          {title}
        </Dialog.Title>
        <Dialog.Content>
          {typeof children === "string" ? (
            <Text
              variant="bodyMedium"
              style={[styles.body, { color: colors.onSurfaceSecondary }]}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Dialog.Content>
        {confirmLabel && onConfirm ? (
          <Dialog.Actions style={styles.actions}>
            {onDismiss ? (
              <AppButton
                compact
                label={cancelLabel}
                onPress={onDismiss}
                variant="text"
              />
            ) : null}
            <AppButton
              compact
              label={confirmLabel}
              loading={confirmLoading}
              onPress={onConfirm}
              variant={destructive ? "danger" : "primary"}
            />
          </Dialog.Actions>
        ) : null}
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: theme.radius.lg,
  },
  title: {
    fontFamily: theme.font.display,
  },
  body: {
    fontFamily: theme.font.text,
  },
  actions: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
});
