import { Platform } from "react-native";


const configuredApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_HADITH_API_BASE_URL;

const webApiBaseUrl =
  process.env.EXPO_PUBLIC_WEB_API_BASE_URL ||
  (__DEV__ ? "http://localhost:8000" : configuredApiBaseUrl);

// A phone must use the computer's LAN address, while a browser running on the
// same computer should not depend on a Wi-Fi address that can change.
export const API_BASE_URL = (
  Platform.OS === "web" ? webApiBaseUrl : configuredApiBaseUrl
)?.replace(/\/$/, "");
