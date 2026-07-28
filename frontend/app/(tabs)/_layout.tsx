import { Tabs } from "expo-router";
import { StyleSheet, View, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { AnimatedPressable } from "@/src/components/AnimatedPressable";

// ─── Animated Tab Icon ────────────────────────────────────────────────────────
function TabIcon({
  icon,
  iconFocused,
  color,
  focused,
}: {
  icon: string;
  iconFocused: string;
  color: string;
  focused: boolean;
}) {
  const scale = useSharedValue(focused ? 1.18 : 1);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    width: interpolate(dotOpacity.value, [0, 1], [0, 4]),
  }));

  // C1 fix: drive animations from useEffect, never during render
  useEffect(() => {
    scale.value = withSpring(focused ? 1.18 : 1, { damping: 12, stiffness: 260 });
    dotOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  return (
    <View style={{ alignItems: "center", gap: 4 }}>
      <Animated.View style={animStyle}>
        <MaterialCommunityIcons
          name={(focused ? iconFocused : icon) as any}
          size={24}
          color={color}
        />
      </Animated.View>
      <Animated.View
        style={[
          dotStyle,
          { height: 4, borderRadius: 2, backgroundColor: color },
        ]}
      />
    </View>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  const { colors, mode, language } = useTheme();
  const { t } = useTranslation(language);

  const tabBarBg =
    mode === "dark"
      ? "rgba(11,20,26,0.97)"
      : "rgba(255,255,255,0.97)";
  const borderColor =
    mode === "dark"
      ? "rgba(255,255,255,0.06)"
      : "rgba(0,0,0,0.08)";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.onSurfaceMuted,
        tabBarShowLabel: true,
        tabBarButton: (props) => (
          <AnimatedPressable
            {...props}
            activeScale={0.92}
            style={[props.style, { flex: 1 }]}
          />
        ),
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: borderColor,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === "ios" ? 82 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 10,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: mode === "dark" ? 0.5 : 0.08,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: "Figtree_400Regular",
          fontWeight: "700",
          marginTop: 0,
        },
      }}
    >
      {/* ── VISIBLE TABS ─────────────────────────────────────────────── */}

      {/* 1. Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("home") || "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="home-variant-outline" iconFocused="home-variant" color={color} focused={focused} />
          ),
          tabBarButtonTestID: "tab-home",
        }}
      />

      {/* 2. Quran */}
      <Tabs.Screen
        name="quran"
        options={{
          title: "Quran",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="book-open-outline" iconFocused="book-open" color={color} focused={focused} />
          ),
          tabBarButtonTestID: "tab-quran",
        }}
      />

      {/* 3. Prayer */}
      <Tabs.Screen
        name="prayer"
        options={{
          title: "Prayer",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="mosque" iconFocused="mosque" color={color} focused={focused} />
          ),
          tabBarButtonTestID: "tab-prayer",
        }}
      />

      {/* 4. Discover */}
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="compass-outline" iconFocused="compass" color={color} focused={focused} />
          ),
          tabBarButtonTestID: "tab-discover",
        }}
      />

      {/* 5. Me */}
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="account-circle-outline" iconFocused="account-circle" color={color} focused={focused} />
          ),
          tabBarButtonTestID: "tab-me",
        }}
      />

      {/* ── HIDDEN LEGACY TABS (routes stay valid) ───────────────────── */}
      <Tabs.Screen
        name="favourites"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="articles"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="emotions"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="reminder"
        options={{ href: null }}
      />
    </Tabs>
  );
}
