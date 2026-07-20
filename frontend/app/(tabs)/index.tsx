import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated, ImageBackground, Image, Platform, Modal, Switch, Alert, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "@/src/localization";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";
import { DEFAULT_GOALS, CATEGORY_COLORS, Goal } from "@/src/data/goals";
import {
  resolveUserLocation, getCompletedGoals, toggleGoal,
  getActiveGoalIds, getPrayerSettings, schedulePrayerNotifications, updateStickyPrayerNotification,
  getMenstrualModeActive, setMenstrualModeActive,
  getGoogleCalendarConnected, setGoogleCalendarConnected,
  getGoogleCalendarDismissed, setGoogleCalendarDismissed,
  getDailyDhikrCounts, saveDailyDhikrCounts,
  getPrayerCompletions, savePrayerCompletions,
  saveActiveGoalIds, getGoalNotifTimes, scheduleGoalNotifications,
} from "@/src/storage";

const { width, height } = Dimensions.get("window");
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
  { id: "pillarsOfIslam",    label: "5 Pillars of Islam",      route: "/pillars-of-islam",      emoji: "☪️" },
  { id: "nobleQuran",        label: "Al-Qur'aan",             route: "/quran",                  image: require("@/assets/images/quran_icon.png") },
  { id: "hadithCollections", label: "Hadith Collections",      route: "/hadith",                 emoji: "📚" },
  { id: "seerah",            label: "Seerah",                  route: "/seerah",                 emoji: "🌙" },
  { id: "duas",              label: "Du'as",                   route: "/dua-hub",               emoji: "🤲" },
  { id: "namesOfAllah",      label: "Asma Al-Husna",          route: "/names",                  emoji: "🕌" },
  { id: "qiblaFinder",       label: "Qibla Finder",            route: "/qibla",                  emoji: "🕋" },
  { id: "hijriCalendar",     label: "Islamic Calendar",        route: "/hijri-calendar",         emoji: "📅" },
  { id: "tasbihCounter",     label: "Tasbih Counter",          route: "/dhikr",                  emoji: "📿" },
  { id: "mosqueFinder",      label: "Masjid Finder",           route: "/finder?type=mosque",     image: require("@/assets/images/masjid_finder_icon.png") },
  { id: "halalFoodFinder",   label: "Halal Food Finder",       route: "/finder?type=halal",      emoji: "🍽️", premium: true },
  { id: "halalFoodScanner",  label: "Halal Product Scanner",   route: "/halal-scanner",          emoji: "🔎",  premium: true },
];

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
  const { profile, user, isGuest } = useAuth();
  const { showPremiumModal } = usePremiumModal();
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
  const [customGoals, setCustomGoals] = useState<Goal[]>([]);

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
  
  // Custom Daily Adhkars selection modal states
  const [dhikrModalVisible, setDhikrModalVisible] = useState(false);
  const [selectedAdhkarCount, setSelectedAdhkarCount] = useState(3);

  // Action sheet for 3 dots goal menu
  const [activeActionGoal, setActiveActionGoal] = useState<Goal | null>(null);

  // Custom goal states
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<"prayer" | "quran" | "dhikr" | "other">("other");

  // Confetti particles for completion celebration
  const [allCompletedModalVisible, setAllCompletedModalVisible] = useState(false);
  const lastProgress = useRef(0);
  const confettiParticles = useRef(Array(45).fill(0).map(() => ({
    x: Math.random() * width,
    y: new Animated.Value(-100),
    rotate: new Animated.Value(0),
    scale: Math.random() * 0.7 + 0.3,
    color: ["#FF5A5F", "#3b82f6", "#10b981", "#fbbf24", "#8b5cf6", "#f43f5e", "#06b6d4"][Math.floor(Math.random() * 7)],
    shape: Math.random() > 0.5 ? "rect" : "circle",
    drift: Math.random() * 80 - 40
  }))).current;

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
        const fetchedTimings = j?.data?.timings || null;
        setTimes(fetchedTimings);
        // Reconcile once on launch: cancel orphaned legacy schedules, then
        // retain exactly one daily Adhan alert for each enabled prayer.
        if (fetchedTimings) {
          await schedulePrayerNotifications(fetchedTimings, settings.adhanEnabled);
        }
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

  // Load goals and new settings on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [comp, ids, menstrual, calConnected, calDismissed, dCounts, pCompletions, sa, customRaw] = await Promise.all([
          getCompletedGoals(),
          getActiveGoalIds(),
          getMenstrualModeActive(),
          getGoogleCalendarConnected(),
          getGoogleCalendarDismissed(),
          getDailyDhikrCounts(),
          getPrayerCompletions(),
          AsyncStorage.getItem("hikmah:settings:selected-adhkar"),
          AsyncStorage.getItem("hikmah:custom-goals:v1"),
        ]);
        setCompleted(comp);
        setActiveIds(ids);
        setMenstrualMode(menstrual);
        setCalendarConnected(calConnected);
        setCalendarDismissed(calDismissed);
        setDhikrCounts(dCounts || {});
        setPrayerCompletions(pCompletions || { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false });
        if (sa !== null) setSelectedAdhkarCount(parseInt(sa, 10));
        
        const loadedCustom = customRaw ? JSON.parse(customRaw) : [];
        setCustomGoals(loadedCustom);
      })();
    }, [])
  );

  const allGoals = useMemo(() => {
    return [...DEFAULT_GOALS, ...customGoals];
  }, [customGoals]);

  const activeGoals = useMemo(() => {
    const today = new Date().getDay();
    const dhikrIdsOrder = ['morning-adhkar', 'evening-adhkar', 'sleep-adhkar', 'dhikr-after-salah', 'istighfar-100'];
    return allGoals.filter(g => {
      if (!activeIds.includes(g.id)) return false;
      if (g.repeat === 'weekly') return g.weekDay === today;
      
      // Filter adhkars by selectedAdhkarCount limit
      if (dhikrIdsOrder.includes(g.id)) {
        const idx = dhikrIdsOrder.indexOf(g.id);
        if (idx >= selectedAdhkarCount) return false;
      }
      return true;
    });
  }, [allGoals, activeIds, selectedAdhkarCount]);

  const upcomingGoals = useMemo(() => {
    const dhikrIdsOrder = ['morning-adhkar', 'evening-adhkar', 'sleep-adhkar', 'dhikr-after-salah', 'istighfar-100'];
    return allGoals.filter(g => {
      if (!activeIds.includes(g.id)) return false;
      
      // Filter adhkars by selectedAdhkarCount limit
      if (dhikrIdsOrder.includes(g.id)) {
        const idx = dhikrIdsOrder.indexOf(g.id);
        if (idx >= selectedAdhkarCount) return false;
      }

      if (g.repeat === 'weekly') {
        const today = new Date().getDay();
        return g.weekDay !== today;
      }
      return false;
    });
  }, [allGoals, activeIds, selectedAdhkarCount]);

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
        if (menstrualMode || prayerCompletions[prayerName]) counts.prayer.done++;
      } else {
        counts[g.category].total++;
        if (completed.includes(g.id)) counts[g.category].done++;
      }
    });
    return counts;
  }, [activeGoals, completed, prayerCompletions, menstrualMode]);

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

  const removeGoalFromHome = async (goalId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const isPrayer = ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(goalId.toLowerCase());
    const updatedIds = isPrayer 
      ? activeIds.filter(id => !["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(id))
      : activeIds.filter(id => id !== goalId);
      
    setActiveIds(updatedIds);
    await saveActiveGoalIds(updatedIds);
    
    if (times) {
      try {
        const goalTimes = await getGoalNotifTimes();
        await scheduleGoalNotifications(updatedIds, times, goalTimes);
      } catch (e) {
        console.error("Failed to reschedule goal notifications after removing goal:", e);
      }
    }
  };

  const runConfettiAnimation = () => {
    confettiParticles.forEach((p) => {
      p.y.setValue(-100);
      p.rotate.setValue(0);
    });

    const animations = confettiParticles.map((p) => {
      const delay = Math.random() * 1000;
      const duration = 2500 + Math.random() * 2000;
      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: height + 50,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotate, {
          toValue: 1,
          duration: duration,
          delay: delay,
          useNativeDriver: true,
        })
      ]);
    });

    Animated.parallel(animations).start();
  };

  useEffect(() => {
    if (allCompletedModalVisible) {
      runConfettiAnimation();
      const timer = setTimeout(() => {
        setAllCompletedModalVisible(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [allCompletedModalVisible]);

  const handleAddCustomGoal = async () => {
    if (!newGoalTitle.trim()) {
      Alert.alert("Title Required", "Please enter a title for your custom goal.");
      return;
    }
    const newGoal = {
      id: "custom-" + Date.now(),
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      repeat: "daily" as const
    };
    
    try {
      const updatedCustom = [...customGoals, newGoal];
      setCustomGoals(updatedCustom);
      await AsyncStorage.setItem("hikmah:custom-goals:v1", JSON.stringify(updatedCustom));
      
      const updatedActive = [...activeIds, newGoal.id];
      setActiveIds(updatedActive);
      await saveActiveGoalIds(updatedActive);
      
      setNewGoalTitle("");
      setNewGoalCategory("other");
      setShowAddCustomModal(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Goal Created", "Custom goal has been created and added to your homepage.");
    } catch (e) {
      console.error("Failed to add custom goal:", e);
    }
  };

  const toggleCustomGoalActive = async (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    const updatedActive = activeIds.includes(id) 
      ? activeIds.filter(activeId => activeId !== id)
      : [...activeIds, id];
    setActiveIds(updatedActive);
    await saveActiveGoalIds(updatedActive);
  };

  useEffect(() => {
    if (overallProgress === 1 && lastProgress.current < 1 && totalGoals > 0) {
      setAllCompletedModalVisible(true);
    }
    lastProgress.current = overallProgress;
  }, [overallProgress, totalGoals]);

  const handleDhikrTap = async (goalId: string) => {
    Haptics.selectionAsync().catch(() => {});
    const currentCount = dhikrCounts[goalId] || 0;
    let nextCount = currentCount + 1;
    if (nextCount > 3) {
      nextCount = 0;
    }
    
    const updatedCounts = { ...dhikrCounts, [goalId]: nextCount };
    setDhikrCounts(updatedCounts);
    await saveDailyDhikrCounts(updatedCounts);
    
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
    if (profile?.tier !== "premium" && !profile?.trialActive) {
      showPremiumModal("Google Calendar Sync");
      return;
    }
    if (!user || isGuest) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Alert.alert("Login required", "Sign in with your account credentials before connecting Google Calendar.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/auth/login") },
      ]);
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
    // Build calendar event description from today's active goals
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
      `Your daily goals have been synced to Google Calendar with today's Hijri date. Goals are now saved in both your Hijri calendar and Google Calendar!`
    );
  };

  const addDhikrToGoals = async (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const currentActive = await getActiveGoalIds();
    let nextActive;
    if (!currentActive.includes(id)) {
      nextActive = [...currentActive, id];
      Alert.alert("Goal Added 🌟", "Added to your everyday goals!");
    } else {
      nextActive = currentActive.filter(activeId => activeId !== id);
      Alert.alert("Goal Removed 🛑", "Removed from your everyday goals!");
    }
    await saveActiveGoalIds(nextActive);
    setActiveIds(nextActive);
    
    // Auto-reschedule notifications
    if (times) {
      try {
        const goalTimes = await getGoalNotifTimes();
        await scheduleGoalNotifications(nextActive, times, goalTimes);
      } catch (e) {
        console.error("Failed to reschedule goal notifications after toggling dhikr:", e);
      }
    }
  };

  const addSadqaToGoals = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const id = "give-sadqa";
    const currentActive = await getActiveGoalIds();
    if (!currentActive.includes(id)) {
      const nextActive = [...currentActive, id];
      await saveActiveGoalIds(nextActive);
      setActiveIds(nextActive);
      
      // Auto-reschedule notifications
      if (times) {
        try {
          const goalTimes = await getGoalNotifTimes();
          await scheduleGoalNotifications(nextActive, times, goalTimes);
        } catch (e) {
          console.error("Failed to reschedule goal notifications after adding sadqa:", e);
        }
      }
      Alert.alert("Goal Added 🌟", "Give Sadqa / Charity has been added to your everyday goals!");
    } else {
      Alert.alert("Already Added", "This goal is already in your everyday goals.");
    }
  };

  const handleSuggestedGoal = (action: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (action === "dhikr") {
      setDhikrModalVisible(true);
    } else {
      addSadqaToGoals();
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
    const isSpecialAdhkar = ['morning-adhkar', 'evening-adhkar', 'sleep-adhkar'].includes(goal.id);
    const isDhikr = goal.category === 'dhikr' && !isSpecialAdhkar;
    const dhikrCount = dhikrCounts[goal.id] || 0;
    const isCompleted = completed.includes(goal.id);
    const titleText = isDhikr ? `${goal.title} (${dhikrCount}/3)` : goal.title;
    
    return (
      <View key={goal.id} style={[styles.goalRowItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Pressable 
          onPress={() => isDhikr ? handleDhikrTap(goal.id) : handleGoalTap(goal.id)}
          style={styles.goalCheckArea}
        >
          <View style={[styles.goalCircleCheck, { borderColor: catColor, backgroundColor: isCompleted ? catColor : "transparent" }]}>
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
          {goal.arabic && !isSpecialAdhkar && (
            <Text style={[styles.goalItemArabic, { color: colors.brand }]}>{goal.arabic}</Text>
          )}
        </Pressable>
        
        <Pressable 
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActiveActionGoal(goal);
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
    const isCompleted = menstrualMode ? true : prayerCompletions[activePrayerToDisplay];
    const catColor = CATEGORY_COLORS.prayer;
    
    return (
      <View key="collapsed-prayer" style={[styles.goalRowItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Pressable 
          onPress={() => {
            if (menstrualMode) return;
            togglePrayerCompletion(activePrayerToDisplay);
          }}
          style={styles.goalCheckArea}
        >
          <View style={[styles.goalCircleCheck, { borderColor: catColor, backgroundColor: isCompleted ? catColor : "transparent" }]}>
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
            setActiveActionGoal({
              id: activePrayerToDisplay,
              title: "Offer " + activePrayerToDisplay,
              category: "prayer"
            });
          }}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.onSurfaceMuted} />
        </Pressable>
      </View>
    );
  };

  const handleQuickAction = useCallback((a: typeof QUICK_ACTIONS[0]) => {
    Haptics.selectionAsync().catch(() => {});
    // Intercept premium-gated cards for free users
    if ((a as any).premium && profile?.tier !== "premium" && !profile?.trialActive) {
      showPremiumModal(a.label);
      return;
    }
    router.push(a.route as any);
  }, [router, profile, showPremiumModal]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <LinearGradient
        colors={colors.mode === "dark" ? ["#061713", "#0B241E", colors.surface] : ["#F8F4E8", "#EEF8F1", colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/menu")} hitSlop={10} style={{ flexDirection: "row", alignItems: "center" }}>
          <MaterialCommunityIcons name="menu" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.brand }]}>Islamic Hikmah</Text>
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
          <Pressable onPress={() => router.push("/profile" as any)} hitSlop={10} style={{ width: 26, height: 26, borderRadius: 13, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={{ width: 26, height: 26, borderRadius: 13 }} />
            ) : (
              <MaterialCommunityIcons name="account-circle-outline" size={26} color={colors.onSurface} />
            )}
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
          <Pressable onPress={() => router.push("/prayer-times")} style={styles.prayerCard}>
            <LinearGradient
              colors={colors.mode === "dark" ? ["#0B2D25", "#10251F", "#1E3528"] : ["#FFFFFF", "#F3FAF2", "#FFF7E0"]}
              style={StyleSheet.absoluteFillObject}
            />
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
            <Pressable key={a.id} onPress={() => handleQuickAction(a)}
              style={({ pressed }) => [styles.quickBtn, pressed && { opacity: 0.7 }]}>
              <View style={styles.quickIconOnly}>
                {"image" in a && a.image ? (
                  <Image 
                    source={a.image} 
                    style={[
                      styles.quickIconImage, 
                      a.id === "nobleQuran" && { width: 56, height: 56 }
                    ]} 
                  />
                ) : (
                  <Text style={styles.quickEmoji}>{"emoji" in a ? a.emoji : ""}</Text>
                )}
                {/* Premium lock badge */}
                {(a as any).premium && profile?.tier !== "premium" && !profile?.trialActive && (
                  <View style={styles.quickLockBadge}>
                    <Text style={styles.quickLockEmoji}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.quickLabel, { color: colors.onSurfaceSecondary }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Connection & Daily Goals Section */}
        


        {/* Daily Goals Summary */}
        <View style={styles.goalsCard}>
          <LinearGradient
            colors={colors.mode === "dark" ? ["#10231F", "#0E1B18"] : ["#FFFFFF", "#F8FBF7"]}
            style={StyleSheet.absoluteFillObject}
          />
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
          {activeIds.some(id => ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(id)) && (
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
            {!activeIds.includes("give-sadqa") && renderSuggestedGoalItem("Give Sadqa", "sadqa")}
          </View>
          
          {/* Bottom Navigation Buttons */}
          <View style={styles.bottomButtonsRow}>
            <Pressable 
              onPress={() => {
                if (profile?.tier !== "premium" && !profile?.trialActive) {
                  showPremiumModal("Previous Goals");
                } else {
                  router.push("/previous-goals");
                }
              }}
              style={[styles.bottomOutlineBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.bottomBtnText, { color: colors.onSurface }]}>View Previous Goals</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => {
                if (profile?.tier !== "premium" && !profile?.trialActive) {
                  showPremiumModal("Goal Settings");
                } else {
                  router.push("/goal-settings");
                }
              }}
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
                const isDone = menstrualMode ? true : prayerCompletions[pName];
                return (
                  <Pressable 
                    key={pName} 
                    onPress={() => {
                      if (menstrualMode) return;
                      togglePrayerCompletion(pName);
                    }}
                    style={[styles.modalPrayerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.modalPrayerLabel, { color: colors.onSurface }]}>{pName}</Text>
                    <View style={[styles.goalCircleCheck, { borderColor: CATEGORY_COLORS.prayer, backgroundColor: isDone ? CATEGORY_COLORS.prayer : "transparent" }]}>
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

      {/* Add New Dhikr Modal */}
      <Modal
        visible={dhikrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDhikrModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDhikrModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Add New Dhikr</Text>
              <Pressable onPress={() => setDhikrModalVisible(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            
            <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false}>
              {[
                { id: 'morning-adhkar', title: 'Morning Adhkar', subtitle: 'Recited after Fajr', category: 'dhikr' },
                { id: 'evening-adhkar', title: 'Evening Adhkar', subtitle: 'Recited after Asr', category: 'dhikr' },
                { id: 'sleep-adhkar', title: 'Sleep Adhkar', subtitle: 'Recited before sleeping', category: 'dhikr' },
                { id: 'dhikr-after-salah', title: 'Dhikr After Salah', subtitle: 'Recited after prayers', category: 'dhikr' },
                { id: 'istighfar-100', title: 'Istighfar (100 times)', subtitle: 'For forgiveness', category: 'dhikr' },
              ].map((item) => {
                const isAdded = activeIds.includes(item.id);
                const catColor = CATEGORY_COLORS[item.category] || colors.brand;
                return (
                  <Pressable 
                    key={item.id} 
                    onPress={() => {
                      addDhikrToGoals(item.id);
                      setDhikrModalVisible(false);
                    }}
                    style={[styles.modalPrayerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalPrayerLabel, { color: colors.onSurface }]}>{item.title}</Text>
                      <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>{item.subtitle}</Text>
                    </View>
                    <View style={[styles.goalCircleCheck, { borderColor: catColor, backgroundColor: isAdded ? catColor : "transparent" }]}>
                      {isAdded && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}

              {/* Custom Goals List */}
              {customGoals.map((item) => {
                const isAdded = activeIds.includes(item.id);
                const catColor = CATEGORY_COLORS[item.category] || colors.brand;
                return (
                  <Pressable 
                    key={item.id} 
                    onPress={() => {
                      toggleCustomGoalActive(item.id);
                      setDhikrModalVisible(false);
                    }}
                    style={[styles.modalPrayerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modalPrayerLabel, { color: colors.onSurface }]}>{item.title}</Text>
                      <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>Custom • Category: {item.category}</Text>
                    </View>
                    <View style={[styles.goalCircleCheck, { borderColor: catColor, backgroundColor: isAdded ? catColor : "transparent" }]}>
                      {isAdded && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => {
                  setDhikrModalVisible(false);
                  setShowAddCustomModal(true);
                }}
                style={[styles.addCustomBtn, { backgroundColor: colors.brand, marginTop: 12 }]}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.onBrandPrimary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.onBrandPrimary, fontWeight: "700" }}>Create Custom Goal</Text>
              </Pressable>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
      {/* Add Custom Goal Modal */}
      <Modal
        visible={showAddCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Create Custom Goal</Text>
              <Pressable onPress={() => setShowAddCustomModal(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
            
            <View style={{ gap: 16, marginTop: 8, width: "100%" }}>
              <View>
                <Text style={{ fontSize: 13, color: colors.onSurfaceMuted, marginBottom: 6 }}>Goal Title</Text>
                <TextInput
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                  placeholder="e.g. Read Tafseer, Visit Family..."
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.input, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
              
              <View>
                <Text style={{ fontSize: 13, color: colors.onSurfaceMuted, marginBottom: 6 }}>Category</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {(["prayer", "quran", "dhikr", "other"] as const).map((cat) => {
                    const isSel = newGoalCategory === cat;
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setNewGoalCategory(cat);
                        }}
                        style={[
                          styles.catSelectBtn, 
                          { borderColor: colors.border, backgroundColor: isSel ? colors.brand : colors.surface }
                        ]}
                      >
                        <Text style={{ fontSize: 13, color: isSel ? colors.onBrandPrimary : colors.onSurface, fontWeight: isSel ? "700" : "400" }}>
                          {cat.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              
              <Pressable 
                onPress={handleAddCustomGoal}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.brand, marginTop: 12 }]}
              >
                <Text style={{ color: colors.onBrandPrimary, fontWeight: "700", fontSize: 15 }}>Create & Add Goal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal ActionSheet Modal */}
      <Modal
        visible={activeActionGoal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveActionGoal(null)}
      >
        <Pressable style={styles.actionSheetOverlay} onPress={() => setActiveActionGoal(null)}>
          <View style={[styles.actionSheetContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Pressable 
              onPress={() => {
                if (activeActionGoal) {
                  setActiveActionGoal(null);
                  router.push("/goal-settings");
                }
              }}
              style={[styles.actionSheetOpt, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.actionSheetText, { color: colors.onSurface }]}>Edit goal</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => {
                if (activeActionGoal) {
                  const id = activeActionGoal.id;
                  setActiveActionGoal(null);
                  removeGoalFromHome(id);
                }
              }}
              style={[styles.actionSheetOpt, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.actionSheetText, { color: colors.error }]}>Remove</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => setActiveActionGoal(null)}
              style={styles.actionSheetOpt}
            >
              <Text style={[styles.actionSheetText, { color: colors.onSurface, fontWeight: "700" }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Confetti Celebration Overlay Modal */}
      <Modal
        visible={allCompletedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAllCompletedModalVisible(false)}
      >
        <Pressable 
          style={StyleSheet.absoluteFillObject} 
          onPress={() => setAllCompletedModalVisible(false)}
        >
          <View style={[styles.congratsOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
            {/* Render Confetti Particles */}
            {confettiParticles.map((p, idx) => {
              const rotation = p.rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${360 + Math.random() * 360}deg`]
              });
              const translateX = p.rotate.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.drift]
              });
              return (
                <Animated.View
                  key={idx}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: p.x,
                    width: p.shape === "rect" ? 14 : 9,
                    height: 9,
                    borderRadius: p.shape === "circle" ? 4.5 : 2,
                    backgroundColor: p.color,
                    transform: [
                      { translateY: p.y },
                      { translateX: translateX },
                      { rotate: rotation },
                      { scale: p.scale }
                    ],
                    zIndex: 9999,
                  }}
                />
              );
            })}

            {/* Celebratory Text */}
            <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 42, color: "#FFFFFF", fontWeight: "bold", textAlign: "center", marginBottom: 14, fontFamily: "AmiriBold" }}>
                سبحان الله!
              </Text>
              <Text style={{ fontSize: 24, color: "#FFFFFF", fontWeight: "800", textAlign: "center", lineHeight: 34 }}>
                You've completed{"\n"}all your goals for today.
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  goldHalo: {
    position: "absolute",
    top: 70,
    right: -90,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: 0.2 },
  hijriDate: { fontSize: 11, marginTop: 2 },
  scrollContent: { paddingBottom: 120 },
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
  prayerCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: 24,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  prayerCardGlow: {
    position: "absolute",
    right: -42,
    top: -58,
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: "rgba(212,175,55,0.16)",
  },
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
  quickBtn: { alignItems: "center", width: "30%", marginBottom: 16 },
  quickIconOnly: {
    width: 64,
    height: 64,
    marginBottom: 7,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  quickLockBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLockEmoji: {
    fontSize: 11,
  },
  quickIconImage: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  quickEmoji: {
    fontSize: 42,
    textShadowColor: "rgba(0,0,0,0.22)",
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 7,
  },
  quickLabel: { fontSize: 11, fontWeight: "800", textAlign: "center", lineHeight: 15 },

  // Goals card
  goalsCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: 24,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 7,
  },
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
  addCustomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 4,
    width: "100%",
  },
  catSelectBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  modalSubmitBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 24,
    width: "100%",
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  actionSheetContent: {
    width: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: theme.spacing.lg,
    paddingBottom: 24,
    borderWidth: 1,
  },
  actionSheetOpt: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  actionSheetText: {
    fontSize: 16,
    fontWeight: "500",
  },
  congratsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  congratsContent: {
    width: width * 0.85,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  congratsSub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  congratsBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  congratsBtnTxt: {
    fontSize: 15,
    fontWeight: "700",
  },
  balloonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  congratsBalloon: {
    position: "absolute",
    bottom: -100,
  },
});
