import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { useAuth } from "@/src/AuthContext";
import { DEFAULT_GOALS } from "@/src/data/goals";
import {
  getActiveGoalIds,
  getCompletedGoals,
  getGoogleCalendarConnected,
  setGoogleCalendarConnected,
} from "@/src/storage";

type PreviousDay = {
  dateLabel: string;
  completedRatio: string;
};

const PREVIOUS_DAYS_MOCK: PreviousDay[] = [
  { dateLabel: "Yesterday, Jul 7", completedRatio: "0/12 goals completed" },
  { dateLabel: "Monday, Jul 6", completedRatio: "0/13 goals completed" },
  { dateLabel: "Sunday, Jul 5", completedRatio: "0/12 goals completed" },
  { dateLabel: "Saturday, Jul 4", completedRatio: "0/12 goals completed" },
  { dateLabel: "Friday, Jul 3", completedRatio: "0/10 goals completed" },
  { dateLabel: "Thursday, Jul 2", completedRatio: "0/12 goals completed" },
];

function getHijriDate() {
  try {
    const date = new Date();
    let g_y = date.getFullYear();
    let g_m = date.getMonth();
    let g_d = date.getDate();
    
    let myDate = new Date(Date.UTC(g_y, g_m, g_d, 12, 0, 0));
    
    let y = myDate.getUTCFullYear();
    let m = myDate.getUTCMonth() + 1;
    let d = myDate.getUTCDate();
    
    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    let A = Math.floor(y / 100);
    let B = 2 - A + Math.floor(A / 4);
    let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + 1;
    
    let epoch = 1948439.5; 
    let diff = jd - epoch;
    let cycle = Math.floor(diff / 10631);
    let rem = diff % 10631;
    
    let h_y = 30 * cycle + 1;
    const leap_years = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    
    for (let i = 1; i <= 30; i++) {
      const is_leap = leap_years.includes(i);
      const length = is_leap ? 355 : 354;
      if (rem < length) {
        h_y = 30 * cycle + i;
        break;
      }
      rem -= length;
    }
    
    const month_lengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    const current_year_in_cycle = (h_y - 1) % 30 + 1;
    if (leap_years.includes(current_year_in_cycle)) {
      month_lengths[11] = 30;
    }
    
    let h_m = 1;
    for (let i = 0; i < 12; i++) {
      if (rem < month_lengths[i]) {
        h_m = i + 1;
        break;
      }
      rem -= month_lengths[i];
    }
    
    let h_d = Math.floor(rem) + 1;
    
    const monthNames = [
      "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
      "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ];
    
    const mName = monthNames[h_m - 1] || "Muharram";
    
    let suffix = "th";
    if (h_d % 10 === 1 && h_d !== 11) suffix = "st";
    else if (h_d % 10 === 2 && h_d !== 12) suffix = "nd";
    else if (h_d % 10 === 3 && h_d !== 13) suffix = "rd";
    
    return `${h_d}${suffix} ${mName} ${h_y} AH`;
  } catch {
    return "";
  }
}

export default function PreviousGoalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    (async () => {
      const connected = await getGoogleCalendarConnected();
      setCalendarConnected(connected);
    })();
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    Alert.alert("Success", "Logged in successfully to sync progress!");
  };

  const handleCalendarSync = async () => {
    if (profile?.tier !== "premium") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      router.push("/premium");
      return;
    }

    if (calendarConnected) {
      Haptics.selectionAsync().catch(() => {});
      Alert.alert(
        "Disconnect Google Calendar 🗓️",
        "Are you sure you want to disconnect Google Calendar from syncing with your Hijri Calendar?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disconnect",
            style: "destructive",
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              setCalendarConnected(false);
              await setGoogleCalendarConnected(false);
            }
          }
        ]
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCalendarConnected(true);
    await setGoogleCalendarConnected(true);

    try {
      const activeIds = await getActiveGoalIds();
      const completedIds = await getCompletedGoals();
      const activeGoals = DEFAULT_GOALS.filter(g => activeIds.includes(g.id));
      
      const hijriDate = getHijriDate();
      const today = new Date();
      const dateLabel = today.toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      const goalLines = activeGoals.map(g => {
        const done = completedIds.includes(g.id);
        return `${done ? "✅" : "⬜"} ${g.title}`;
      }).join("\n");

      const eventTitle = encodeURIComponent(`Islamic Hikmah: Daily Goals — ${hijriDate}`);
      const eventDetails = encodeURIComponent(
        `📅 ${dateLabel}\n🕌 Hijri: ${hijriDate}\n\n🎯 Today's Goals:\n${goalLines}\n\nSynced from Islamic Hikmah App`
      );
      const startDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
      const endDate = startDate;
      const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${eventDetails}&dates=${startDate}/${endDate}&allday=true`;

      const { Linking } = require("react-native");
      await Linking.openURL(calUrl);
    } catch (e) {
      console.warn("Calendar sync error:", e);
    }

    Alert.alert(
      "Sync Successful 🌙",
      `Your daily goals have been synced to Google Calendar with today's Hijri date. Goals are now saved in both your Hijri calendar and Google Calendar!`
    );
  };

  const handleDayPress = (day: PreviousDay) => {
    Alert.alert(
      day.dateLabel,
      `You completed ${day.completedRatio.split(" ")[0]} goals on this day.`
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Previous Goals</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 48 }}>
        {/* Login Sync Banner */}
        {!isLoggedIn ? (
          <View style={[styles.loginCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
              <MaterialCommunityIcons name="account" size={32} color={colors.onSurfaceMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.loginText, { color: colors.onSurface }]}>Login to sync your daily progress</Text>
              <Pressable 
                onPress={handleLogin}
                style={[styles.loginBtn, { borderColor: colors.onSurface }]}
              >
                <Text style={[styles.loginBtnText, { color: colors.onSurface }]}>Login</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.loginCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.brand + "22" }]}>
              <MaterialCommunityIcons name="account-check" size={32} color={colors.brand} />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.loginText, { color: colors.onSurface }]}>Connected &amp; Syncing Progress</Text>
              <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginTop: 4 }}>Logged in as Guest</Text>
            </View>
          </View>
        )}

        {/* Google Calendar Card */}
        <View style={[styles.calendarCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.calendarHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.calendarTitle, { color: colors.onSurface }]}>
                Connect your Google Calendar with Hijri Calendar to sync complete goals.
              </Text>
            </View>
          </View>
          <Pressable 
            onPress={handleCalendarSync}
            style={[
              styles.calendarBtn, 
              { backgroundColor: calendarConnected ? "#22c55e" : colors.brand }
            ]}
          >
            <Text style={styles.calendarBtnTxt}>
              {calendarConnected ? "Connected" : "Start sync"}
            </Text>
          </Pressable>
        </View>

        {/* Section Header */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Goals</Text>

        {/* Previous Days List */}
        <View style={[styles.listContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {PREVIOUS_DAYS_MOCK.map((day, idx) => {
            const isLast = idx === PREVIOUS_DAYS_MOCK.length - 1;
            return (
              <Pressable
                key={day.dateLabel}
                onPress={() => handleDayPress(day)}
                style={({ pressed }) => [
                  styles.dayRow,
                  { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : 1 },
                  pressed && { opacity: 0.7 }
                ]}
              >
                <View style={styles.dayIconCheck}>
                  <View style={[styles.circleBadge, { borderColor: colors.onSurfaceMuted }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dayTitle, { color: colors.onSurface }]}>{day.dateLabel}</Text>
                  <Text style={[styles.daySub, { color: colors.onSurfaceMuted }]}>{day.completedRatio}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: { fontSize: 18, fontWeight: "700" },
  loginCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  loginBtn: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  listContainer: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  dayIconCheck: {
    marginRight: 16,
  },
  circleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  daySub: {
    fontSize: 12,
    marginTop: 4,
  },
  calendarCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: 24,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  calendarBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  calendarBtnTxt: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
