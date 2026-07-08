import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated, ImageBackground, Platform, Modal, Switch, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "@/src/localization";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Svg, { Circle } from "react-native-svg";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { DEFAULT_GOALS, CATEGORY_COLORS, Goal } from "@/src/data/goals";
import {
  resolveUserLocation, getCompletedGoals, toggleGoal,
  getActiveGoalIds, getPrayerSettings, updateStickyPrayerNotification,
  getMenstrualModeActive, setMenstrualModeActive,
  getGoogleCalendarConnected, setGoogleCalendarConnected,
  getGoogleCalendarDismissed, setGoogleCalendarDismissed,
  getDailyDhikrCounts, saveDailyDhikrCounts,
  getPrayerCompletions, savePrayerCompletions,
} from "@/src/storage";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;
const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];


const CATEGORY_IMAGES: Record<string, any> = {
  ummah: require("@/assets/images/ummah_background.png"),
  morning: { uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80" },
  evening: { uri: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop&q=80" },
  sleep: { uri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80" },
  tahajjud: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  salah: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  "after-salah": { uri: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=500&auto=format&fit=crop&q=80" },
  istikharah: { uri: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=80" },
  gatherings: { uri: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80" },
  difficulties: { uri: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=500&auto=format&fit=crop&q=80" },
  iman: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  hajj: { uri: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=500&auto=format&fit=crop&q=80" },
  travel: { uri: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=80" },
  money: { uri: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80" },
  social: { uri: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=80" },
  marriage: { uri: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&auto=format&fit=crop&q=80" },
  death: { uri: "https://images.unsplash.com/photo-1453791052107-5c843da62d97?w=500&auto=format&fit=crop&q=80" },
  nature: { uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&auto=format&fit=crop&q=80" },
  ramadan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  ruqyah: { uri: "https://images.unsplash.com/photo-1552089123-2d26226fc2b7?w=500&auto=format&fit=crop&q=80" },
  "daily-life": { uri: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80" },
  adhan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  wudu: { uri: "https://images.unsplash.com/photo-1548813730-e8f20cc74a4a?w=500&auto=format&fit=crop&q=80" },
  masjid: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  sickness: { uri: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80" },
  forgiveness: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
};

// Countdown ring size
const RING = 80;
const STROKE = 6;
const RADIUS = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const QUICK_ACTIONS = [
  { id: "nobleQuran", icon: "book-open-variant", route: "/quran", color: "#10B981" },
  { id: "hadithCollections", icon: "book-open", route: "/hadith", color: "#F59E0B" },
  { id: "seerah", icon: "account-star", route: "/seerah", color: "#EC4899" },
  { id: "tasbihCounter", icon: "circle-double", route: "/dhikr", color: "#C5A880" },
  { id: "namesOfAllah", icon: "mosque", route: "/names", color: "#14B8A6" },
  { id: "qiblaFinder", icon: "compass-outline", route: "/qibla", color: "#8B5CF6" },
  { id: "duas", icon: "hands-pray", route: "/dua-hub", color: "#06B6D4" },
  { id: "hijriCalendar", icon: "calendar-month", route: "/hijri-calendar", color: "#F43F5E" },
  { id: "mosqueFinder", icon: "map-marker-radius", route: "/finder?type=mosque", color: "#4F46E5" },
  { id: "halalFoodFinder", icon: "food-fork-drink", route: "/finder?type=halal", color: "#16A34A" },
] as const;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return { salaam: "Assalamu Alaikum", sub: "May your night be blessed" };
  if (hour < 12) return { salaam: "Assalamu Alaikum", sub: "Good morning, may Allah bless your day" };
  if (hour < 15) return { salaam: "Assalamu Alaikum", sub: "Good afternoon, remember your Dhuhr prayer" };
  if (hour < 18) return { salaam: "Assalamu Alaikum", sub: "Good afternoon, Asr time approaches" };
  if (hour < 20) return { salaam: "Assalamu Alaikum", sub: "Good evening, don't forget Maghrib" };
  return { salaam: "Assalamu Alaikum", sub: "Good evening, may your night be peaceful" };
}

function format12Hour(timeStr: string): string {
  if (!timeStr) return "";
  const clean = timeStr.split(" ")[0];
  const parts = clean.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1].substring(0, 2);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

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
    // Added +1 day offset to align arithmetic calendar with standard Umm al-Qura calendar
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

function parseTime(t: string): Date {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function getPrayerPeriods(times: Record<string, string>) {
  const now = new Date();
  
  // Parse all times into Dates for comparison
  const parsed = PRAYERS.map((name) => {
    const t = times[name];
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return { name, date: d, timeStr: t };
  }).filter(Boolean) as { name: string; date: Date; timeStr: string }[];

  if (parsed.length === 0) return null;

  // Find next prayer (first one where date > now)
  let nextIdx = parsed.findIndex((p) => p.date > now);
  
  let current, next;
  
  if (nextIdx === -1) {
    // All prayers for today have passed.
    // Current is Isha.
    current = parsed[parsed.length - 1];
    // Next is Fajr tomorrow.
    const tomorrowFajr = new Date(parsed[0].date);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    next = {
      name: "Fajr",
      date: tomorrowFajr,
      timeStr: parsed[0].timeStr
    };
  } else if (nextIdx === 0) {
    // Before Fajr.
    // Current is Isha yesterday.
    const yesterdayIsha = new Date(parsed[parsed.length - 1].date);
    yesterdayIsha.setDate(yesterdayIsha.getDate() - 1);
    current = {
      name: "Isha",
      date: yesterdayIsha,
      timeStr: parsed[parsed.length - 1].timeStr
    };
    next = parsed[0];
  } else {
    current = parsed[nextIdx - 1];
    next = parsed[nextIdx];
  }

  // Adjust for the 15-minute Sunrise duration:
  // If the current period is Sunrise, it only lasts 15 minutes.
  // During these 15 minutes, the next target is "Sunrise" end.
  // After 15 minutes, the next target becomes Dhuhr.
  if (current.name === "Sunrise") {
    const sunriseEndTime = new Date(current.date.getTime() + 15 * 60 * 1000);
    if (now < sunriseEndTime) {
      next = {
        name: "Sunrise",
        date: sunriseEndTime,
        timeStr: ""
      };
    }
  }

  return { current, next };
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const greeting = useMemo(() => getGreeting(), []);
  const hijri = useMemo(() => getHijriDate(), []);

  // Prayer times & countdown
  const [times, setTimes] = useState<Record<string, string> | null>(null);
  const [city, setCity] = useState("");
  const [countdown, setCountdown] = useState("--:--:--");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastNotifMin = useRef<number | null>(null);

  // Goals
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);

  // Calendar card states
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarDismissed, setCalendarDismissed] = useState(false);
  // Menstrual mode
  const [menstrualMode, setMenstrualMode] = useState(false);
  // Dhikr counts
  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>({});
  // Prayer completions
  const [prayerCompletions, setPrayerCompletions] = useState<Record<string, boolean>>({
    Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false
  });
  // Prayers Modal
  const [prayersModalVisible, setPrayersModalVisible] = useState(false);

  // Load prayer times
  useEffect(() => {
    (async () => {
      try {
        const loc = await resolveUserLocation();
        setCity(loc.city);
        const settings = await getPrayerSettings();
        const url = `https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lon}&method=${settings.method}&school=${settings.juristic}`;
        const r = await fetch(url);
        const j = await r.json();
        setTimes(j?.data?.timings || null);
      } catch (e) {
        console.error("Failed to load home page timings:", e);
      }
    })();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!times) return;
    const tick = () => {
      const now = new Date();
      const periods = getPrayerPeriods(times);
      if (!periods) return;
      const next = periods.next;
      const diff = next.date.getTime() - now.getTime();
      if (diff <= 0) { setCountdown("00:00:00"); setProgress(1); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`-${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      // Calculate progress of the current period
      const current = periods.current;
      const total = next.date.getTime() - current.date.getTime();
      const elapsed = now.getTime() - current.date.getTime();
      setProgress(Math.min(Math.max(elapsed / total, 0), 1));

      // Throttle sticky notifications to once per minute (on minute changes)
      const currentMinute = now.getMinutes();
      if (lastNotifMin.current !== currentMinute) {
        lastNotifMin.current = currentMinute;
        updateStickyPrayerNotification(times).catch((e) => console.error(e));
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [times]);

  // Load goals and new settings
  useEffect(() => {
    (async () => {
      const [comp, ids, menstrual, calConnected, calDismissed, dCounts, pCompletions] = await Promise.all([
        getCompletedGoals(),
        getActiveGoalIds(),
        getMenstrualModeActive(),
        getGoogleCalendarConnected(),
        getGoogleCalendarDismissed(),
        getDailyDhikrCounts(),
        getPrayerCompletions(),
      ]);
      setCompleted(comp);
      setActiveIds(ids);
      setMenstrualMode(menstrual);
      setCalendarConnected(calConnected);
      setCalendarDismissed(calDismissed);
      setDhikrCounts(dCounts || {});
      setPrayerCompletions(pCompletions || { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false });
    })();
  }, []);

  const activeGoals = useMemo(() => {
    const today = new Date().getDay();
    return DEFAULT_GOALS.filter(g => {
      if (!activeIds.includes(g.id)) return false;
      // Skip obligatory prayers if menstrual mode is active
      if (menstrualMode && ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(g.id)) return false;
      if (g.repeat === 'weekly') return g.weekDay === today;
      return true;
    });
  }, [activeIds, menstrualMode]);

  const upcomingGoals = useMemo(() => {
    return DEFAULT_GOALS.filter(g => {
      if (!activeIds.includes(g.id)) return false;
      if (g.repeat === 'weekly') {
        const today = new Date().getDay();
        return g.weekDay !== today;
      }
      return false;
    });
  }, [activeIds]);

  const prayerPeriods = useMemo(() => times ? getPrayerPeriods(times) : null, [times]);

  // Goal counts by category
  const goalCounts = useMemo(() => {
    const counts: Record<string, { total: number; done: number }> = {
      prayer: { total: 0, done: 0 },
      quran: { total: 0, done: 0 },
      dhikr: { total: 0, done: 0 },
      other: { total: 0, done: 0 },
    };
    activeGoals.forEach(g => {
      if (["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(g.id)) {
        const prayerName = g.id.charAt(0).toUpperCase() + g.id.slice(1);
        counts.prayer.total++;
        if (prayerCompletions[prayerName]) counts.prayer.done++;
      } else {
        counts[g.category].total++;
        if (completed.includes(g.id)) counts[g.category].done++;
      }
    });
    return counts;
  }, [activeGoals, completed, prayerCompletions]);

  const totalDone = useMemo(() => {
    let done = 0;
    Object.values(goalCounts).forEach(c => {
      done += c.done;
    });
    return done;
  }, [goalCounts]);

  const totalGoals = useMemo(() => {
    let total = 0;
    Object.values(goalCounts).forEach(c => {
      total += c.total;
    });
    return total;
  }, [goalCounts]);

  const overallProgress = totalGoals > 0 ? totalDone / totalGoals : 0;

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const strokeDash = (1 - progress) * CIRC;

  const handleGoalTap = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await toggleGoal(id);
    const comp = await getCompletedGoals();
    setCompleted(comp);
  }, []);

  const togglePrayerCompletion = async (prayerName: string) => {
    Haptics.selectionAsync().catch(() => {});
    const goalId = prayerName.toLowerCase();
    await toggleGoal(goalId);
    
    const [comp, pCompletions] = await Promise.all([
      getCompletedGoals(),
      getPrayerCompletions()
    ]);
    
    const updatedPrayers = { ...pCompletions, [prayerName]: !pCompletions[prayerName] };
    setPrayerCompletions(updatedPrayers);
    await savePrayerCompletions(updatedPrayers);
    setCompleted(comp);
  };

  const handleMenstrualModeToggle = async (value: boolean) => {
    Haptics.selectionAsync().catch(() => {});
    setMenstrualMode(value);
    await setMenstrualModeActive(value);
  };

  const handleDhikrTap = async (goalId: string) => {
    Haptics.selectionAsync().catch(() => {});
    const currentCount = dhikrCounts[goalId] || 0;
    let nextCount = currentCount + 1;
    if (nextCount > 3) {
      nextCount = 0;
    }
    
    const updatedCounts = { ...dhikrCounts, [goalId]: nextCount };
    setDhikrCounts(updatedCounts);
    await saveDhikrCounts(updatedCounts);
    
    const isCompleted = completed.includes(goalId);
    if (nextCount === 3 && !isCompleted) {
      await toggleGoal(goalId);
    } else if (nextCount === 0 && isCompleted) {
      await toggleGoal(goalId);
    }
    
    const comp = await getCompletedGoals();
    setCompleted(comp);
  };

  const handleCalendarDismiss = async () => {
    Haptics.selectionAsync().catch(() => {});
    setCalendarDismissed(true);
    await setGoogleCalendarDismissed(true);
  };

  const handleCalendarSync = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const nextConnected = !calendarConnected;
    setCalendarConnected(nextConnected);
    await setGoogleCalendarConnected(nextConnected);
    Alert.alert(
      nextConnected ? "Sync Successful" : "Disconnected",
      nextConnected
        ? "Your Google Calendar has been connected. Prayer times will now sync automatically."
        : "Google Calendar sync disabled."
    );
  };

  const handleSuggestedGoal = (action: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (action === "dhikr") {
      router.push("/goal-settings" as any);
    } else {
      Alert.alert("Sadqa Logged", "May Allah accept your charity today! ❤️");
    }
  };

  const activePrayerToDisplay = useMemo(() => {
    if (!times) return "Asr";
    const periods = getPrayerPeriods(times);
    if (!periods) return "Asr";
    let name = periods.next?.name || periods.current?.name || "Asr";
    if (name === "Sunrise") name = "Dhuhr";
    return name;
  }, [times]);

  const renderInlineGoalItem = (goal: Goal) => {
    const catColor = CATEGORY_COLORS[goal.category] || colors.brand;
    const isDhikr = goal.category === 'dhikr';
    const dhikrCount = dhikrCounts[goal.id] || 0;
    const isCompleted = completed.includes(goal.id);
    const titleText = isDhikr ? `${goal.title} (${dhikrCount}/3)` : goal.title;
    
    return (
      <View key={goal.id} style={[styles.goalRowItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Pressable 
          onPress={() => isDhikr ? handleDhikrTap(goal.id) : handleGoalTap(goal.id)}
          style={styles.goalCheckArea}
        >
          <View style={[styles.goalCircleCheck, { borderColor: isCompleted ? catColor : colors.onSurfaceMuted, backgroundColor: isCompleted ? catColor : "transparent" }]}>
            {isCompleted && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
          </View>
        </Pressable>
        
        <Pressable 
          onPress={() => isDhikr ? handleDhikrTap(goal.id) : handleGoalTap(goal.id)}
          style={{ flex: 1 }}
        >
          <Text style={[styles.goalItemTitle, { color: colors.onSurface, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
            {titleText}
          </Text>
          {goal.subtitle && !goal.arabic && (
            <Text style={[styles.goalItemSub, { color: colors.onSurfaceMuted }]}>{goal.subtitle}</Text>
          )}
          {goal.arabic && (
            <Text style={[styles.goalItemArabic, { color: colors.brand }]}>{goal.arabic}</Text>
          )}
        </Pressable>
        
        <Pressable 
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            Alert.alert("Goal Options", "Options for " + goal.title, [
              { text: "Log Reminder", onPress: () => router.push("/goal-settings" as any) },
              { text: "Skip Today", style: "destructive" },
              { text: "Cancel", style: "cancel" }
            ]);
          }}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.onSurfaceMuted} />
        </Pressable>
      </View>
    );
  };

  const renderUpcomingGoalItem = (goal: Goal) => {
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDay = weekdays[goal.weekDay ?? 0];
    const subText = `Repeats weekly on ${targetDay}`;
    return (
      <View key={goal.id} style={[styles.goalRowItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, opacity: 0.6 }]}>
        <View style={styles.goalCheckArea}>
          <View style={[styles.goalCircleCheck, { borderColor: colors.onSurfaceMuted, backgroundColor: "transparent" }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.goalItemTitle, { color: colors.onSurface }]}>
            {goal.title}
          </Text>
          <Text style={[styles.goalItemSub, { color: colors.onSurfaceMuted }]}>{subText}</Text>
        </View>
        <Pressable 
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            Alert.alert("Upcoming Goal", `This goal is scheduled for ${targetDay}s.`);
          }}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.onSurfaceMuted} />
        </Pressable>
      </View>
    );
  };

  const renderSuggestedGoalItem = (title: string, action: 'dhikr' | 'sadqa') => {
    return (
      <Pressable 
        key={action}
        onPress={() => handleSuggestedGoal(action)}
        style={({ pressed }) => [
          styles.goalRowItem, 
          { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          pressed && { opacity: 0.8 }
        ]}
      >
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={[styles.goalItemTitle, { color: colors.onSurface }]}>
            {title}
          </Text>
        </View>
        <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.brand} style={{ marginRight: 4 }} />
      </Pressable>
    );
  };

  const renderCollapsedPrayerRow = () => {
    const isCompleted = prayerCompletions[activePrayerToDisplay];
    const catColor = CATEGORY_COLORS.prayer;
    
    return (
      <View key="collapsed-prayer" style={[styles.goalRowItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Pressable 
          onPress={() => togglePrayerCompletion(activePrayerToDisplay)}
          style={styles.goalCheckArea}
        >
          <View style={[styles.goalCircleCheck, { borderColor: isCompleted ? catColor : colors.onSurfaceMuted, backgroundColor: isCompleted ? catColor : "transparent" }]}>
            {isCompleted && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
          </View>
        </Pressable>
        
        <Pressable 
          onPress={() => setPrayersModalVisible(true)}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.goalItemTitle, { color: colors.onSurface, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
              Offer {activePrayerToDisplay}
            </Text>
            <Text style={[styles.goalItemSub, { color: colors.onSurfaceMuted }]}>Tap to show all</Text>
          </View>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurfaceMuted} style={{ marginRight: 8 }} />
        </Pressable>
        
        <Pressable 
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            Alert.alert("Prayer Options", "Options for " + activePrayerToDisplay, [
              { text: "Log Reminder", onPress: () => router.push("/goal-settings" as any) },
              { text: "Skip Today", style: "destructive" },
              { text: "Cancel", style: "cancel" }
            ]);
          }}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.onSurfaceMuted} />
        </Pressable>
      </View>
    );
  };

  const handleQuickAction = useCallback((route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as any);
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/menu")} hitSlop={10}>
          <MaterialCommunityIcons name="menu" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.brand }]}>الحكمة الإسلامية</Text>
          {hijri ? (
            <Pressable onPress={() => router.push("/hijri-calendar" as any)} hitSlop={6}>
              <Text style={[styles.hijriDate, { color: colors.onSurfaceMuted }]}>{hijri}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable onPress={() => router.push("/search" as any)} hitSlop={10} testID="home-search">
            <MaterialCommunityIcons name="magnify" size={26} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={26} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} removeClippedSubviews>

        {city ? (
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={colors.brand} />
            <Text style={[styles.locationTxt, { color: colors.onSurface }]}>{city}</Text>
          </View>
        ) : null}

        {/* Prayer Countdown Card */}
        {prayerPeriods && (
          <Pressable onPress={() => router.push("/prayer-times")} style={[styles.prayerCard, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prayerLabel, { color: colors.onSurfaceMuted }]}>{t("currentPrayer")}</Text>
              <Text style={[styles.prayerName, { color: colors.onSurface }]}>{t(prayerPeriods.current.name.toLowerCase())}</Text>
              <Text style={[styles.prayerTime, { color: colors.brand }]}>{format12Hour(prayerPeriods.current.timeStr)}</Text>
              <Text style={[styles.viewAll, { color: colors.brand }]}>{t("viewAllPrayers")}</Text>
            </View>
            {/* Countdown Ring */}
            <View style={styles.ringWrap}>
              <Svg width={RING} height={RING}>
                <Circle cx={RING/2} cy={RING/2} r={RADIUS} stroke={colors.surfaceSecondary} strokeWidth={STROKE} fill="transparent" />
                <Circle
                  cx={RING/2} cy={RING/2} r={RADIUS}
                  stroke={colors.brand} strokeWidth={STROKE} fill="transparent"
                  strokeDasharray={CIRC} strokeDashoffset={strokeDash}
                  strokeLinecap="round" rotation="-90" origin={`${RING/2},${RING/2}`}
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={[styles.nextLabel, { color: colors.onSurfaceMuted }]}>
                  {t(prayerPeriods.next.name.toLowerCase())}
                </Text>
                <Text style={[styles.countdown, { color: colors.onSurface }]}>{countdown}</Text>
              </View>
            </View>
          </Pressable>
        )}

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable key={a.id} onPress={() => handleQuickAction(a.route)}
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}>
              <View style={[styles.quickIconWrap, { backgroundColor: a.color + "22" }]}>
                <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.onSurfaceSecondary }]}>{t(a.id)}</Text>
            </Pressable>
          ))}
        </View>

        {/* Connection & Daily Goals Section */}
        
        {/* Google Calendar Card */}
        {!calendarDismissed && (
          <View style={[styles.calendarCard, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={styles.calendarHeader}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={[styles.calendarTitle, { color: colors.onSurface }]}>
                  Connect your Google calendar with Athan to sync Prayer times.
                </Text>
              </View>
              <Pressable onPress={handleCalendarDismiss} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            <Pressable 
              onPress={handleCalendarSync}
              style={[styles.calendarBtn, { backgroundColor: calendarConnected ? colors.onSurfaceMuted : colors.brand }]}
            >
              <Text style={styles.calendarBtnTxt}>
                {calendarConnected ? "Disconnect" : "Start syncing"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Daily Goals Summary */}
        <View style={[styles.goalsCard, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.goalsHeader}>
            <Text style={[styles.goalsTitle, { color: colors.onSurface }]}>
              Complete {totalGoals} goals today
            </Text>
          </View>

          {/* Overall progress bar */}
          <View style={[styles.progressBg, { backgroundColor: colors.surface }]}>
            <View style={[styles.progressFill, { width: `${overallProgress * 100}%`, backgroundColor: colors.brand }]} />
          </View>

          {/* Category pills */}
          <View style={styles.catPills}>
            <View style={styles.pill}>
              <View style={[styles.pillDot, { backgroundColor: CATEGORY_COLORS.prayer }]} />
              <Text style={[styles.pillTxt, { color: colors.onSurfaceMuted }]}>
                {goalCounts.prayer.done}/{goalCounts.prayer.total} Prayers
              </Text>
            </View>
            <View style={styles.pill}>
              <View style={[styles.pillDot, { backgroundColor: CATEGORY_COLORS.quran }]} />
              <Text style={[styles.pillTxt, { color: colors.onSurfaceMuted }]}>
                {goalCounts.quran.done}/{goalCounts.quran.total} Quran
              </Text>
            </View>
            <View style={styles.pill}>
              <View style={[styles.pillDot, { backgroundColor: CATEGORY_COLORS.dhikr }]} />
              <Text style={[styles.pillTxt, { color: colors.onSurfaceMuted }]}>
                {goalCounts.dhikr.done}/{goalCounts.dhikr.total} Dhikr
              </Text>
            </View>
            <View style={styles.pill}>
              <View style={[styles.pillDot, { backgroundColor: CATEGORY_COLORS.other }]} />
              <Text style={[styles.pillTxt, { color: colors.onSurfaceMuted }]}>
                {goalCounts.other.done}/{goalCounts.other.total} Other
              </Text>
            </View>
          </View>
        </View>

        {/* Goal Checklist Container */}
        <View style={styles.goalsListContainer}>
          {/* Obligatory Prayers Row (if active and not excused) */}
          {!menstrualMode && activeIds.some(id => ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(id)) && (
            renderCollapsedPrayerRow()
          )}
          
          {/* Other active goals today */}
          {activeGoals
            .filter(g => !["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(g.id))
            .map(g => renderInlineGoalItem(g))}
            
          {/* Upcoming Section */}
          {upcomingGoals.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitleHeader, { color: colors.onSurface }]}>Upcoming</Text>
              {upcomingGoals.map(g => renderUpcomingGoalItem(g))}
            </View>
          )}
          
          {/* Suggested Goals Section */}
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitleHeader, { color: colors.onSurface }]}>Suggested goals</Text>
            {renderSuggestedGoalItem("Add New Dhikr", "dhikr")}
            {renderSuggestedGoalItem("Give Sadqa", "sadqa")}
          </View>
          
          {/* Bottom Navigation Buttons */}
          <View style={styles.bottomButtonsRow}>
            <Pressable 
              onPress={() => router.push("/previous-goals")}
              style={[styles.bottomOutlineBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.bottomBtnText, { color: colors.onSurface }]}>View Previous Goals</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => router.push("/goal-settings")}
              style={[styles.bottomOutlineBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.bottomBtnText, { color: colors.onSurface }]}>Goal Settings</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>

      {/* All Prayers Modal */}
      <Modal
        visible={prayersModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrayersModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPrayersModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>All Prayers</Text>
              <Pressable onPress={() => setPrayersModalVisible(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            
            <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false}>
              {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((pName) => {
                const isDone = prayerCompletions[pName];
                return (
                  <Pressable 
                    key={pName} 
                    onPress={() => togglePrayerCompletion(pName)}
                    style={[styles.modalPrayerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.modalPrayerLabel, { color: colors.onSurface }]}>{pName}</Text>
                    <View style={[styles.goalCircleCheck, { borderColor: isDone ? CATEGORY_COLORS.prayer : colors.onSurfaceMuted, backgroundColor: isDone ? CATEGORY_COLORS.prayer : "transparent" }]}>
                      {isDone && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
              
              {/* Menstrual Mode Section */}
              <View style={[styles.menstrualCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.menstrualTitle, { color: colors.onSurface }]}>Menstrual Mode</Text>
                  <Text style={[styles.menstrualSub, { color: colors.onSurfaceMuted }]}>
                    Menstrual mode will excuse your Prayers until you turn it off at the end of your period.
                  </Text>
                </View>
                <Switch 
                  value={menstrualMode}
                  onValueChange={handleMenstrualModeToggle}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={Platform.OS === 'ios' ? undefined : colors.surfaceSecondary}
                />
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  headerTitle: { fontFamily: "AmiriBold", fontSize: 24, letterSpacing: 0.5 },
  hijriDate: { fontSize: 11, marginTop: 2 },
  scrollContent: { paddingBottom: theme.spacing.xxxl },
  greeting: { paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  greetingHi: { fontSize: 13, fontWeight: "600" },
  cityTxt: { fontSize: 12, marginTop: 4 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: theme.spacing.lg,
    marginTop: 10,
    marginBottom: 6,
  },
  locationTxt: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Prayer countdown card
  prayerCard: { marginHorizontal: theme.spacing.lg, borderRadius: theme.radius.lg, padding: theme.spacing.lg, flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.lg },
  prayerLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  prayerName: { fontSize: 28, fontWeight: "800", marginTop: 2 },
  prayerTime: { fontSize: 20, fontWeight: "700" },
  viewAll: { fontSize: 13, fontWeight: "600", marginTop: 8 },
  ringWrap: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  nextLabel: { fontSize: 9, fontWeight: "600" },
  countdown: { fontSize: 11, fontWeight: "800", marginTop: 2 },

  // Quick actions
  quickRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md },
  quickBtn: { alignItems: "center", width: "30%", marginBottom: 12 },
  quickIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: "600" },

  // Goals card
  goalsCard: { marginHorizontal: theme.spacing.lg, borderRadius: theme.radius.lg, padding: theme.spacing.lg, marginBottom: theme.spacing.lg },
  goalsHeader: { marginBottom: theme.spacing.sm },
  goalsTitle: { fontSize: 16, fontWeight: "700" },
  progressBg: { height: 6, borderRadius: 3, marginBottom: theme.spacing.sm },
  progressFill: { height: 6, borderRadius: 3 },
  catPills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: theme.spacing.md },
  pill: { flexDirection: "row", alignItems: "center", gap: 4 },
  pillDot: { width: 8, height: 8, borderRadius: 4 },
  pillTxt: { fontSize: 11 },
  goalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12, borderBottomWidth: 1 },
  goalCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  goalTitle: { fontSize: 15, fontWeight: "600" },
  goalSub: { fontSize: 12, marginTop: 2 },
  goalArabic: { fontSize: 12, fontFamily: "Amiri", marginTop: 2 },
  viewMoreBtn: { paddingTop: 12, alignItems: "center" },
  viewMoreTxt: { fontWeight: "600", fontSize: 14 },

  // Duas grid
  segment: { flexDirection: "row", marginHorizontal: theme.spacing.lg, borderRadius: theme.radius.pill, padding: 4, marginBottom: theme.spacing.lg },
  segmentBtn: { flex: 1, paddingVertical: 12, borderRadius: theme.radius.pill, alignItems: "center" },
  segmentText: { fontWeight: "600", fontSize: 14 },
  segmentTextActive: { color: "#03201F" },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: theme.spacing.lg, gap: theme.spacing.md },
  card: { height: 140, borderRadius: theme.radius.lg, overflow: "hidden" },
  cardImage: { flex: 1, justifyContent: "flex-end" },
  cardScrim: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", padding: theme.spacing.sm },
  cardLabelContainer: {
    backgroundColor: "rgba(15, 23, 42, 0.82)", // dark navy translucent overlay
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardTitle: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textAlign: "center" },
  
  // Google Calendar Card
  calendarCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
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
  
  // Goal checklist items
  goalsListContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  goalRowItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  goalCheckArea: {
    paddingRight: 12,
  },
  goalCircleCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  goalItemTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  goalItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  goalItemArabic: {
    fontSize: 12,
    fontFamily: "Amiri",
    marginTop: 2,
  },
  sectionTitleHeader: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
  },
  bottomButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginTop: 20,
    marginBottom: 10,
  },
  bottomOutlineBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  
  // Prayers Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: "80%",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalPrayerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalPrayerLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  menstrualCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  menstrualTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  menstrualSub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});
