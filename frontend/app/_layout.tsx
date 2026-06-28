import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [iconLoaded, iconError] = useIconFonts();
  const [fontsLoaded, fontsError] = useFonts({
    Amiri: "https://cdn.jsdelivr.net/gh/google/fonts/ofl/amiri/Amiri-Regular.ttf",
    AmiriBold: "https://cdn.jsdelivr.net/gh/google/fonts/ofl/amiri/Amiri-Bold.ttf",
  });

  const ready = (iconLoaded || iconError) && (fontsLoaded || fontsError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#0B1120" }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: "#0B1120" }}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B1120" } }} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
