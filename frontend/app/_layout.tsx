import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Notifications from "expo-notifications";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ThemeProvider, useTheme } from "@/src/ThemeContext";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

function ThemedStack() {
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
    </View>
  );
}

export default function RootLayout() {
  const [iconLoaded, iconError] = useIconFonts();
  const [fontsLoaded, fontsError] = useFonts({
    Amiri: require("../assets/fonts/Amiri-Regular.ttf"),
    AmiriBold: require("../assets/fonts/Amiri-Bold.ttf"),
  });

  const player = useAudioPlayer(require("../assets/audio/azaan.mp3"));
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      try {
        const title = notification.request.content.title || "";
        if (title.includes("Prayer Time")) {
          player.play();
        }
      } catch (err) {
        console.warn("Failed to play foreground Adhan audio:", err);
      }
    });
    return () => subscription.remove();
  }, [player]);

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

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStack />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
