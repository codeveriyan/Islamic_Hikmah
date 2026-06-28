import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brandSecondary,
        tabBarInactiveTintColor: theme.colors.onSurfaceMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceSecondary,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 78,
          paddingTop: 6,
          paddingBottom: 16,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-variant" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-home",
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-favourites",
        }}
      />
      <Tabs.Screen
        name="articles"
        options={{
          title: "Articles",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="text-box" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-articles",
        }}
      />
      <Tabs.Screen
        name="emotions"
        options={{
          title: "Emotions",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="emoticon" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-emotions",
        }}
      />
      <Tabs.Screen
        name="reminder"
        options={{
          title: "Reminder",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell" size={size} color={color} />
          ),
          tabBarButtonTestID: "tab-reminder",
        }}
      />
    </Tabs>
  );
}
