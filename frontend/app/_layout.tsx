import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, Component } from "react";
import { AppState, LogBox, Pressable, Text, View, Image, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ThemeProvider, useTheme } from "@/src/ThemeContext";
import { AuthProvider, useAuth } from "@/src/AuthContext";
import { db } from "@/src/firebase";
import { doc, setDoc } from "firebase/firestore";
import { PremiumModalProvider } from "@/src/PremiumModalContext";
import PremiumModal from "@/src/components/PremiumModal";

async function checkPrayerNotificationExpired(notification: Notifications.Notification): Promise<boolean> {
  try {
    const title = notification.request.content.title || "";
    const data = notification.request.content.data;
    const prayer = data?.prayer || (title.match(/^(Fajr|Dhuhr|Asr|Maghrib|Isha)/)?.[1]);
    
    // Timestamp check: > 60 seconds delayed means expired
    const diffMs = Math.abs(Date.now() - notification.date);
    if (diffMs > 60000) return true;

    if (!prayer) return false;

    // Check cached prayer timings for end of prayer window
    const rawCache = await AsyncStorage.getItem("hikmah:prayer-timings-cache:v1");
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      const timings = parsed?.timings;
      if (timings) {
        const now = new Date();
        const parseTimeToday = (timeStr: string) => {
          const [h, m] = timeStr.split(":").map(Number);
          const d = new Date();
          d.setHours(h, m, 0, 0);
          return d;
        };

        if (prayer === "Fajr" && timings.Sunrise) {
          const sunriseTime = parseTimeToday(timings.Sunrise);
          if (now >= sunriseTime) return true; // Fajr prayer time ends at Sunrise!
        } else if (prayer === "Dhuhr" && timings.Asr) {
          const asrTime = parseTimeToday(timings.Asr);
          if (now >= asrTime) return true;
        } else if (prayer === "Asr" && timings.Maghrib) {
          const maghribTime = parseTimeToday(timings.Maghrib);
          if (now >= maghribTime) return true;
        } else if (prayer === "Maghrib" && timings.Isha) {
          const ishaTime = parseTimeToday(timings.Isha);
          if (now >= ishaTime) return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const title = notification.request.content.title || "";
    const isPrayerTime = title.includes("Prayer Time");
    const isStickyPrayerCard = notification.request.content.data?.notificationKind === "sticky-prayer";

    if (isStickyPrayerCard) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: true,
      };
    }

    if (isPrayerTime) {
      const expired = await checkPrayerNotificationExpired(notification);
      if (expired) {
        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        };
      }
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

// Only suppress known noisy-but-harmless warnings in dev; never silence all logs in production
if (__DEV__) {
  LogBox.ignoreLogs([
    'Possible Unhandled Promise Rejection',
    'Non-serializable values were found in the navigation state',
  ]);
}

// ─── React Error Boundary ─────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null }
class ErrorBoundary extends Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0B141A' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: '#8696A0', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: '#00A884', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 99 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function PushTokenRegistrar() {
  const { user } = useAuth();
  useEffect(() => {
    if (Platform.OS === "web" || !user?.uid) return;
    const register = async () => {
      const permissions = await Notifications.getPermissionsAsync();
      if (permissions.status !== "granted") return;
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) return;
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      await setDoc(doc(db, "pushTokens", user.uid), {
        token: token.data,
        updatedAt: Date.now(),
        platform: Platform.OS,
        projectId,
      }, { merge: true });
    };
    register().catch(error => console.warn("Failed to register push token:", error));
  }, [user?.uid]);
  return null;
}

SplashScreen.preventAutoHideAsync();

function ThemedStack({ azaanPlaying, onStopAzaan }: { azaanPlaying: boolean; onStopAzaan: () => void }) {
  const { colors, mode } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
        }}
      />
      {azaanPlaying ? (
        <Pressable
          onPress={onStopAzaan}
          style={{
            position: "absolute",
            bottom: 32,
            left: 24,
            right: 24,
            backgroundColor: colors.brand,
            borderRadius: 999,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="volume-off" size={20} color={colors.onBrandPrimary} />
          <Text style={{ color: colors.onBrandPrimary, fontWeight: "700", fontSize: 15 }}>
            Tap to stop Azaan
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  const [iconLoaded, iconError] = useIconFonts();
  const [fontsLoaded, fontsError] = useFonts({
    Amiri: require("../assets/fonts/Amiri-Regular.ttf"),
    AmiriBold: require("../assets/fonts/Amiri-Bold.ttf"),
    // ScheherazadeNew — SIL Open Font License, purpose-built for Quranic Uthmani script.
    // Used for the "Uthmani" font option. Far better harakat and ligature support than Amiri.
    ScheherazadeNew: require("../assets/fonts/ScheherazadeNew-Regular.ttf"),
    // NotoNaskhArabic — Google Noto font family, covers full Arabic Unicode range cleanly.
    // Used for the "Naskh" font option. Clear, modern, great for all-purpose Arabic text
    // including duas and hadith where a less stylised font is preferable.
    NotoNaskhArabic: require("../assets/fonts/NotoNaskhArabic-Regular.ttf"),
  });

  const player = useAudioPlayer(require("../assets/audio/azaan.mp3"));
  const playerStatus = useAudioPlayerStatus(player);
  const router = useRouter();
  useEffect(() => {
    // Request notification permissions and register push token to Firestore
    const requestPermissions = async () => {
      if (Platform.OS === 'web') return;
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          await Notifications.requestPermissionsAsync();
        }
      } catch (e) {
        console.warn("Failed to request notifications permissions on launch:", e);
      }
    };
    requestPermissions();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async (notification) => {
      try {
        const title = notification.request.content.title || "";
        if (title.includes("Prayer Time")) {
          // Respect background azaan preference in foreground too
          const bgAzaanRaw = await AsyncStorage.getItem("background_azaan_enabled");
          const bgAzaanEnabled = bgAzaanRaw !== "false";
          if (!bgAzaanEnabled) return;

          // Do not play if notification is expired or prayer time window ended
          const isExpired = await checkPrayerNotificationExpired(notification);
          if (isExpired) return;

          player.play();
        }
      } catch (err) {
        console.warn("Failed to play foreground Adhan audio:", err);
      }
    });
    return () => subscription.remove();
  }, [player]);

  // Stop the foreground Azaan playback as soon as the user leaves the app
  // (home button / app switcher / lock screen), same behavior as a phone alarm.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        try {
          if (player.playing) player.pause();
        } catch {}
      }
    });
    return () => sub.remove();
  }, [player]);

  const stopAzaan = () => {
    try {
      player.pause();
      player.seekTo(0);
    } catch {}
  };

  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const actionId = response.actionIdentifier;
        if (actionId === "Tracker" || actionId === "quran") {
          router.push("/goals" as any);
        } else if (actionId === "Azkar" || actionId === "hadith") {
          router.push("/adhkar" as any);
        } else if (actionId === "Qibla" || actionId === "tasbih") {
          router.push("/qibla" as any);
        }
      } catch (err) {
        console.warn("Error processing notification action:", err);
      }
    });
    return () => responseSub.remove();
  }, [router]);

  const ready = (iconLoaded || iconError) && (fontsLoaded || fontsError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
    // Enable background audio playback for Quran recitation
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
    } as any).catch(() => {});
  }, [ready]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <LinearGradient
          colors={["#0a3722", "#0f5132", "#a68832", "#cbb154"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Image 
          source={require("../assets/images/icon.png")} 
          style={{ width: 140, height: 140, borderRadius: 28 }} 
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <AuthProvider>
              <PushTokenRegistrar />
              <PremiumModalProvider>
                <ThemedStack azaanPlaying={!!playerStatus?.playing} onStopAzaan={stopAzaan} />
                <PremiumModal />
              </PremiumModalProvider>
            </AuthProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
