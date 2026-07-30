import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import {
  AppButton,
  AppCheckbox,
  AppChip,
  AppDialog,
  AppIconButton,
  AppSnackbar,
  AppSurface,
  AppSwitch,
  AppTextInput,
} from "@/src/components/ui";
import {
  AppAuthRequiredState,
  AppEmptyState,
  AppErrorState,
  AppLoadingState,
  AppOfflineState,
  AppPermissionState,
  AppPremiumState,
  AppSkeletonState,
  AppStatusBanner,
} from "@/src/components/states";

const stateOptions = [
  "loading",
  "skeleton",
  "empty",
  "offline",
  "error",
  "permission",
  "auth",
  "premium",
] as const;

type StatePreview = (typeof stateOptions)[number];

function PreviewSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
        {title}
      </Text>
      {description ? (
        <Text
          style={[styles.sectionDescription, { color: colors.onSurfaceMuted }]}
        >
          {description}
        </Text>
      ) : null}
      <AppSurface tone="raised" padding="large" style={styles.previewCard}>
        {children}
      </AppSurface>
    </View>
  );
}

export default function UIKitPreviewScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const [email, setEmail] = useState("invalid-address");
  const [notifications, setNotifications] = useState(true);
  const [translation, setTranslation] = useState(false);
  const [selectedChip, setSelectedChip] = useState("Prayer");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [statePreview, setStatePreview] =
    useState<StatePreview>("loading");

  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  const emailError =
    email.length > 0 && !email.includes("@")
      ? "Enter a valid email address."
      : undefined;

  const showPreviewFeedback = () => setSnackbarVisible(true);

  const renderStatePreview = () => {
    switch (statePreview) {
      case "loading":
        return (
          <AppLoadingState
            description="Preparing your personalised content."
            progress={0.68}
            title="Loading your library"
          />
        );
      case "skeleton":
        return <AppSkeletonState rows={4} />;
      case "empty":
        return (
          <AppEmptyState
            actionLabel="Browse content"
            description="Save verses, duas, or articles to find them here."
            onAction={showPreviewFeedback}
            title="No saved items"
          />
        );
      case "offline":
        return (
          <AppOfflineState
            onRetry={showPreviewFeedback}
            onUseOffline={showPreviewFeedback}
          />
        );
      case "error":
        return <AppErrorState onRetry={showPreviewFeedback} />;
      case "permission":
        return (
          <AppPermissionState
            onOpenSettings={showPreviewFeedback}
            onTryAgain={showPreviewFeedback}
            permission="location"
          />
        );
      case "auth":
        return (
          <AppAuthRequiredState
            onContinueAsGuest={showPreviewFeedback}
            onSignIn={showPreviewFeedback}
          />
        );
      case "premium":
        return (
          <AppPremiumState
            featureName="offline recitations"
            onNotNow={showPreviewFeedback}
            onUpgrade={showPreviewFeedback}
          />
        );
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: colors.surface }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <AppIconButton
          accessibilityLabel="Go back"
          icon="chevron-left"
          onPress={() => router.back()}
        />
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.onSurface }]}>
            UI component preview
          </Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>
            Development only
          </Text>
        </View>
        <AppIconButton
          accessibilityLabel={`Use ${mode === "dark" ? "light" : "dark"} mode`}
          icon={mode === "dark" ? "weather-sunny" : "weather-night"}
          onPress={() => setMode(mode === "dark" ? "light" : "dark")}
          variant="tonal"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.onSurfaceSecondary }]}>
          Use this screen to validate each shared primitive in the active
          palette. Changes here do not affect production flows.
        </Text>

        <PreviewSection
          title="Buttons"
          description="Priority, loading, disabled and destructive actions"
        >
          <View style={styles.stack}>
            <AppButton
              fullWidth
              label="Primary action"
              onPress={() => setSnackbarVisible(true)}
            />
            <AppButton
              fullWidth
              label="Secondary action"
              onPress={() => {}}
              variant="secondary"
            />
            <AppButton
              fullWidth
              label="Outlined action"
              onPress={() => {}}
              variant="outlined"
            />
            <View style={styles.inline}>
              <AppButton label="Text action" onPress={() => {}} variant="text" />
              <AppButton
                label="Delete"
                onPress={() => setDialogVisible(true)}
                variant="danger"
              />
            </View>
            <View style={styles.inline}>
              <AppButton label="Loading" loading onPress={() => {}} />
              <AppButton disabled label="Disabled" onPress={() => {}} />
            </View>
          </View>
        </PreviewSection>

        <PreviewSection
          title="Inputs"
          description="Helper, validation and disabled states"
        >
          <View style={styles.stack}>
            <AppTextInput
              autoCapitalize="none"
              errorMessage={emailError}
              keyboardType="email-address"
              label="Email address"
              onChangeText={setEmail}
              value={email}
            />
            <AppTextInput
              helperText="Use at least eight characters."
              label="Password"
              secureTextEntry
            />
            <AppTextInput
              disabled
              label="Disabled input"
              value="Unavailable"
            />
          </View>
        </PreviewSection>

        <PreviewSection
          title="Icon buttons"
          description="Plain, outlined, tonal, primary and destructive"
        >
          <View style={styles.iconRow}>
            <AppIconButton
              accessibilityLabel="Bookmark"
              icon="bookmark-outline"
              onPress={() => {}}
            />
            <AppIconButton
              accessibilityLabel="Share"
              icon="share-variant-outline"
              onPress={() => {}}
              variant="outlined"
            />
            <AppIconButton
              accessibilityLabel="Play"
              icon="play"
              onPress={() => {}}
              variant="tonal"
            />
            <AppIconButton
              accessibilityLabel="Confirm"
              icon="check"
              onPress={() => {}}
              variant="primary"
            />
            <AppIconButton
              accessibilityLabel="Delete"
              icon="delete-outline"
              onPress={() => setDialogVisible(true)}
              variant="danger"
            />
          </View>
        </PreviewSection>

        <PreviewSection
          title="Selection controls"
          description="Switches, checkboxes and filter chips"
        >
          <View style={styles.stack}>
            <AppSwitch
              description="Receive reminders for daily prayer times."
              label="Prayer notifications"
              onValueChange={setNotifications}
              value={notifications}
            />
            <AppSwitch
              description="This control demonstrates its unavailable state."
              disabled
              label="Location-based reminders"
              onValueChange={() => {}}
              value={false}
            />
            <AppCheckbox
              checked={translation}
              description="Display a translation below Arabic verses."
              label="Show translation"
              onValueChange={setTranslation}
            />
            <View style={styles.chipRow}>
              {["Prayer", "Quran", "Duas"].map((label) => (
                <AppChip
                  key={label}
                  label={label}
                  onPress={() => setSelectedChip(label)}
                  selected={selectedChip === label}
                />
              ))}
            </View>
          </View>
        </PreviewSection>

        <PreviewSection
          title="Surfaces"
          description="Three visual hierarchy levels"
        >
          <View style={styles.stack}>
            {(["base", "raised", "overlay"] as const).map((tone) => (
              <AppSurface key={tone} padding="medium" tone={tone}>
                <Text
                  style={[styles.surfaceLabel, { color: colors.onSurface }]}
                >
                  {tone[0].toUpperCase() + tone.slice(1)} surface
                </Text>
                <Text
                  style={[
                    styles.surfaceDescription,
                    { color: colors.onSurfaceMuted },
                  ]}
                >
                  Used to communicate content hierarchy and separation.
                </Text>
              </AppSurface>
            ))}
          </View>
        </PreviewSection>

        <PreviewSection
          title="Overlays"
          description="Dialog and snackbar feedback"
        >
          <View style={styles.stack}>
            <AppButton
              fullWidth
              label="Open confirmation dialog"
              onPress={() => setDialogVisible(true)}
              variant="outlined"
            />
            <AppButton
              fullWidth
              label="Show success message"
              onPress={() => setSnackbarVisible(true)}
              variant="secondary"
            />
          </View>
        </PreviewSection>

        <PreviewSection
          title="Application states"
          description="Loading, empty, connectivity, permission, account and access states"
        >
          <View style={styles.stack}>
            <ScrollView
              contentContainerStyle={styles.stateSelector}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {stateOptions.map((state) => (
                <AppChip
                  key={state}
                  label={state[0].toUpperCase() + state.slice(1)}
                  onPress={() => setStatePreview(state)}
                  selected={statePreview === state}
                />
              ))}
            </ScrollView>
            {renderStatePreview()}
          </View>
        </PreviewSection>

        <PreviewSection
          title="Persistent status"
          description="Non-blocking information that remains visible until resolved"
        >
          <View style={styles.stack}>
            {bannerVisible ? (
              <AppStatusBanner
                actionLabel="Retry"
                kind="offline"
                message="Downloaded Quran content is still available."
                onAction={showPreviewFeedback}
                onDismiss={() => setBannerVisible(false)}
                title="Working offline"
              />
            ) : (
              <AppButton
                label="Restore banner"
                onPress={() => setBannerVisible(true)}
                variant="outlined"
              />
            )}
            <AppStatusBanner
              kind="success"
              message="Prayer notification settings were updated."
              title="Changes saved"
            />
          </View>
        </PreviewSection>
      </ScrollView>

      <AppDialog
        destructive
        cancelLabel="Keep item"
        confirmLabel="Delete item"
        onConfirm={() => setDialogVisible(false)}
        onDismiss={() => setDialogVisible(false)}
        title="Delete saved item?"
        visible={dialogVisible}
      >
        This action cannot be undone.
      </AppDialog>

      <AppSnackbar
        action={{
          label: "Undo",
          onPress: () => setSnackbarVisible(false),
        }}
        kind="success"
        message="Your changes were saved."
        onDismiss={() => setSnackbarVisible(false)}
        visible={snackbarVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontFamily: theme.font.display,
    fontSize: 19,
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: theme.font.text,
    fontSize: 12,
    lineHeight: 16,
  },
  content: {
    width: "100%",
    maxWidth: theme.layout.readableWidth,
    alignSelf: "center",
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  intro: {
    fontFamily: theme.font.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontFamily: theme.font.display,
    fontSize: 20,
    lineHeight: 26,
  },
  sectionDescription: {
    fontFamily: theme.font.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: theme.spacing.md,
  },
  previewCard: {
    width: "100%",
  },
  stack: {
    gap: theme.spacing.md,
  },
  inline: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  iconRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  stateSelector: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  surfaceLabel: {
    fontFamily: theme.font.textSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  surfaceDescription: {
    fontFamily: theme.font.text,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
