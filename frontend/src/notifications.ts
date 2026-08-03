import { isRunningInExpoGo } from "expo";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModulePromise: Promise<NotificationsModule> | null = null;

/**
 * Expo Go SDK 53+ cannot load Android remote-push registration. Keep the
 * notification package out of the startup module graph so Expo Go can still
 * run the rest of the app normally. Development builds and standalone apps
 * load the package on demand.
 */
export async function getNotifications(): Promise<NotificationsModule | null> {
  if (isRunningInExpoGo()) return null;
  notificationsModulePromise ??= import("expo-notifications");
  return notificationsModulePromise;
}
