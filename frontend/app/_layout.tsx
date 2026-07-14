import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AppState, LogBox, Pressable, Text, View, Image, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ThemeProvider, useTheme } from "@/src/ThemeContext";
import { AuthProvider } from "@/src/AuthContext";
import { PremiumModalProvider } from "@/src/PremiumModalContext";
import PremiumModal from "@/src/components/PremiumModal";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Check if the notification triggered in the past (e.g. expired or delayed)
    const date = notification.date; // Unix timestamp
    const diffMs = Math.abs(Date.now() - date);
    const hasExpired = diffMs > 60000; // if it triggered more than 60 seconds ago, it is expired

    const title = notification.request.content.title || "";
    const isPrayerTime = title.includes("Prayer Time");

    // If it is a prayer time notification and it has expired, do not show alert or play sound
    if (isPrayerTime && hasExpired) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: false,
        shouldShowList: false,
      };
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

LogBox.ignoreAllLogs(true);

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
    // Request notification permissions on app startup
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

          // Do not play if notification is expired/delayed
          const diffMs = Math.abs(Date.now() - notification.date);
          if (diffMs > 60000) return;

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <PremiumModalProvider>
              <ThemedStack azaanPlaying={!!playerStatus?.playing} onStopAzaan={stopAzaan} />
              <PremiumModal />
            </PremiumModalProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
