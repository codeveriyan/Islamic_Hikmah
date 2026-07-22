import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";

export default function TabsLayout() {
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandSecondary,
        tabBarInactiveTintColor: colors.onSurfaceMuted,
        tabBarStyle: {
          position: "relative",
          backgroundColor: colors.mode === "dark" ? "rgba(15,36,31,0.96)" : "rgba(255,255,255,0.96)",
          borderColor: colors.mode === "dark" ? "rgba(212,175,55,0.22)" : "rgba(16,128,105,0.16)",
          borderWidth: 0,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 0,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home") || "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: t("favourites"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-favourites",
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: t("publications"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="text-box" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-articles",
        }}
      />
      <Tabs.Screen
        name="emotions"
        options={{
          title: t("emotions"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="emoticon" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-emotions",
        }}
      />
      <Tabs.Screen
        name="reminder"
        options={{
          title: t("reminders"),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-reminder",
        }}
      />
    </Tabs>
  );
}
