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
import { DEFAULT_GOALS, Goal } from "@/src/data/goals";
import {
  getActiveGoalIds,
  getCompletedGoals,
  getGoogleCalendarConnected,
  setGoogleCalendarConnected,
  getRecentGoalHistory,
} from "@/src/storage";

type PreviousDay = {
  date: Date;
  dateLabel: string;
  completedRatio: string;
  completedIds: string[];
};

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
  const { profile, user, isGuest } = useAuth();
  
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [previousDays, setPreviousDays] = useState<PreviousDay[]>([]);
  const isCredentialUser = !!user && !isGuest;

  useEffect(() => {
    (async () => {
      const [connected, history, activeIds] = await Promise.all([
        getGoogleCalendarConnected(), getRecentGoalHistory(7), getActiveGoalIds()
      ]);
      setCalendarConnected(isCredentialUser && connected);
      setPreviousDays((history as { date: Date; completedIds: string[] }[]).map(({ date, completedIds }: { date: Date; completedIds: string[] }, index: number) => ({
        date,
        completedIds,
        dateLabel: index === 0 ? `Yesterday, ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
        completedRatio: `${completedIds.filter((id: string) => activeIds.includes(id)).length}/${activeIds.length} goals completed`,
      })));
    })();
  }, [isCredentialUser]);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleCalendarSync = async () => {
    if (!isCredentialUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert("Login required", "Sign in with your account credentials before connecting Google Calendar.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: handleLogin },
      ]);
      return;
    }

    if (calendarConnected) {
      Haptics.selectionAsync().catch(() => {});
      Alert.alert(
        "Disconnect Google Calendar 🗓️",
        "Are you sure you want to disconnect Google Calendar from syncing with your Islamic Calendar?",
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
      setCalendarConnected(true);
      await setGoogleCalendarConnected(true);
    } catch (e) {
      console.warn("Calendar sync error:", e);
      Alert.alert("Unable to open Google Calendar", "Please check your connection and try again.");
      return;
    }

    Alert.alert(
      "Sync Successful 🌙",
      `Your daily goals have been synced to Google Calendar with today's Hijri date. Goals are now saved in both your Islamic Calendar and Google Calendar!`
    );
  };

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [customGoals, setCustomGoals] = useState<Goal[]>([]);
  const [activeGoalIdsList, setActiveGoalIdsList] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const rawCustom = await AsyncStorage.getItem("hikmah:custom-goals:v1");
        if (rawCustom) setCustomGoals(JSON.parse(rawCustom));
        const aIds = await getActiveGoalIds();
        setActiveGoalIdsList(aIds);
      } catch {}
    })();
  }, []);

  const allGoals = [...DEFAULT_GOALS, ...customGoals];

  const handleDayPress = (day: PreviousDay) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const dateKey = day.date.toISOString();
    setExpandedDate(prev => prev === dateKey ? null : dateKey);
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
        {!isCredentialUser ? (
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
              <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginTop: 4 }}>Logged in as {profile?.email || profile?.name}</Text>
            </View>
          </View>
        )}

        {/* Google Calendar Card */}
        <Pressable onPress={() => router.push("/calendar-sync")}
          style={[styles.settingRowFull, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginBottom: 20 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <View style={{ width: 22, height: 22, marginRight: 12, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 14, height: 14, backgroundColor: '#4285F4', borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 8, fontWeight: 'bold', lineHeight: 9 }}>31</Text>
              </View>
            </View>
            <Text style={[styles.settingLabel, { color: colors.onSurface, fontWeight: "700" }]}>Sync with Calendar</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* Section Header */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Goals</Text>

        {/* Previous Days List */}
        <View style={[styles.listContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          {previousDays.map((day, idx) => {
            const isLast = idx === previousDays.length - 1;
            const dateKey = day.date.toISOString();
            const isExpanded = expandedDate === dateKey;
            const hasCompleted = day.completedIds.length > 0;
            const dayActiveGoals = allGoals.filter(g => activeGoalIdsList.includes(g.id));
            const activeListToRender = dayActiveGoals.length > 0 ? dayActiveGoals : DEFAULT_GOALS.slice(0, 12);

            return (
              <View key={dateKey} style={{ borderBottomColor: colors.border, borderBottomWidth: isLast && !isExpanded ? 0 : 1 }}>
                <Pressable
                  onPress={() => handleDayPress(day)}
                  style={({ pressed }) => [
                    styles.dayRow,
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <View style={styles.dayIconCheck}>
                    {hasCompleted ? (
                      <MaterialCommunityIcons name="check-circle" size={24} color={colors.brand} />
                    ) : (
                      <View style={[styles.circleBadge, { borderColor: colors.onSurfaceMuted }]} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dayTitle, { color: colors.onSurface }]}>{day.dateLabel}</Text>
                    <Text style={[styles.daySub, { color: colors.onSurfaceMuted }]}>{day.completedRatio}</Text>
                  </View>
                  <MaterialCommunityIcons 
                    name={isExpanded ? "chevron-up" : "chevron-right"} 
                    size={20} 
                    color={colors.onSurfaceMuted} 
                  />
                </Pressable>

                {/* Expanded Goal Checklist Breakdown */}
                {isExpanded && (
                  <View style={{ backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.brand, marginBottom: 4 }}>
                      Goal Breakdown ({day.completedIds.length}/{activeListToRender.length} Completed)
                    </Text>

                    {activeListToRender.map(g => {
                      const isDone = day.completedIds.includes(g.id);
                      return (
                        <View key={g.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
                          <MaterialCommunityIcons 
                            name={isDone ? "check-circle" : "checkbox-blank-circle-outline"} 
                            size={18} 
                            color={isDone ? colors.brand : colors.onSurfaceMuted} 
                          />
                          <Text style={{ fontSize: 13, color: isDone ? colors.onSurface : colors.onSurfaceMuted, textDecorationLine: isDone ? "none" : "none", flex: 1 }}>
                            {g.title}
                          </Text>
                          {g.arabic ? (
                            <Text style={{ fontSize: 12, color: colors.brand, fontFamily: "Amiri" }}>{g.arabic}</Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
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
  settingRowFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
});
