import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, View, AppState, Pressable, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Notifications from "expo-notifications";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  const status = useAudioPlayerStatus(player);
  const router = useRouter();

  // AppState listener to stop Adhan when app goes to background / screen lock
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        try {
          if (player.playing) {
            player.pause();
          }
        } catch (e) {}
      }
    });
    return () => sub.remove();
  }, [player]);

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

  const isPlaying = status?.playing || false;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <View style={{ flex: 1 }}>
            <ThemedStack />
            {isPlaying && (
              <View
                style={{
                  position: "absolute",
                  bottom: 50,
                  left: 20,
                  right: 20,
                  backgroundColor: "#1E293B",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 8,
                  zIndex: 99999,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons name="volume-high" size={24} color="#10B981" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>Adhan is playing</Text>
                </View>
                <Pressable
                  onPress={() => {
                    try {
                      player.pause();
                    } catch (e) {}
                  }}
                  style={{
                    backgroundColor: "#EF4444",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 13 }}>Stop</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
