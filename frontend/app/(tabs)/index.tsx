import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated, ImageBackground, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Svg, { Circle } from "react-native-svg";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { CATEGORIES } from "@/src/data/duas";
import { DEFAULT_GOALS, CATEGORY_COLORS } from "@/src/data/goals";
import {
  resolveUserLocation, getCompletedGoals, toggleGoal,
  getActiveGoalIds, getPrayerSettings, updateStickyPrayerNotification,
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
  { id: "quran", title: "Quran", icon: "book-open-variant", route: "/quran", color: "#10B981" },
  { id: "hadith", title: "Hadith", icon: "book-open", route: "/hadith", color: "#F59E0B" },
  { id: "goals", title: "Goals", icon: "checkbox-marked-circle-outline", route: "/goals", color: "#EC4899" },
  { id: "dhikr", title: "Tasbih", icon: "circle-double", route: "/dhikr", color: "#C5A880" },
  { id: "names", title: "99 Names", icon: "mosque", route: "/names", color: "#14B8A6" },
  { id: "prayer", title: "Prayer Times", icon: "clock-time-eight", route: "/prayer-times", color: "#8B5CF6" },
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
  const [group, setGroup] = useState<"main" | "other">("main");
  const router = useRouter();
  const { colors } = useTheme();
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

  const cats = useMemo(() => CATEGORIES.filter((c) => c.group === group), [group]);

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

  // Load goals
  useEffect(() => {
    (async () => {
      const [comp, ids] = await Promise.all([getCompletedGoals(), getActiveGoalIds()]);
      setCompleted(comp);
      setActiveIds(ids);
    })();
  }, []);

  const activeGoals = useMemo(() => {
    const today = new Date().getDay();
    return DEFAULT_GOALS.filter(g => {
      if (!activeIds.includes(g.id)) return false;
      if (g.repeat === 'weekly') return g.weekDay === today;
      return true;
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
      counts[g.category].total++;
      if (completed.includes(g.id)) counts[g.category].done++;
    });
    return counts;
  }, [activeGoals, completed]);

  const totalDone = useMemo(() => activeGoals.filter(g => completed.includes(g.id)).length, [activeGoals, completed]);
  const totalGoals = activeGoals.length;
  const overallProgress = totalGoals > 0 ? totalDone / totalGoals : 0;

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const strokeDash = (1 - progress) * CIRC;

  const handleGoalTap = useCallback(async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await toggleGoal(id);
    const comp = await getCompletedGoals();
    setCompleted(comp);
  }, []);

  const handleQuickAction = useCallback((route: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(route as any);
  }, [router]);

  const handleCategoryPress = useCallback((id: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/dua/${id}` as any);
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
              <Text style={[styles.prayerLabel, { color: colors.onSurfaceMuted }]}>Current Prayer</Text>
              <Text style={[styles.prayerName, { color: colors.onSurface }]}>{prayerPeriods.current.name}</Text>
              <Text style={[styles.prayerTime, { color: colors.brand }]}>{format12Hour(prayerPeriods.current.timeStr)}</Text>
              <Text style={[styles.viewAll, { color: colors.brand }]}>View All Prayers →</Text>
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
                  {prayerPeriods.next.name}
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
              <Text style={[styles.quickLabel, { color: colors.onSurfaceSecondary }]}>{a.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* Daily Goals */}
        <View style={[styles.goalsCard, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.goalsHeader}>
            <Text style={[styles.goalsTitle, { color: colors.onSurface }]}>
              Complete {totalGoals} goals today
            </Text>
            <Pressable onPress={() => router.push("/goals" as any)} hitSlop={8}>
              <Text style={[styles.goalsSettings, { color: colors.brand }]}>Settings</Text>
            </Pressable>
          </View>

          {/* Overall progress bar */}
          <View style={[styles.progressBg, { backgroundColor: colors.surface }]}>
            <View style={[styles.progressFill, { width: `${overallProgress * 100}%`, backgroundColor: colors.brand }]} />
          </View>

          {/* Category pills */}
          <View style={styles.catPills}>
            {Object.entries(goalCounts).map(([cat, { total, done }]) => total > 0 ? (
              <View key={cat} style={styles.pill}>
                <View style={[styles.pillDot, { backgroundColor: CATEGORY_COLORS[cat] }]} />
                <Text style={[styles.pillTxt, { color: colors.onSurfaceMuted }]}>
                  {done}/{total} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </View>
            ) : null)}
          </View>

        </View>

        {/* Dua Categories */}
        <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary }]}>
          {(["main", "other"] as const).map((g) => {
            const active = group === g;
            return (
              <Pressable key={g} onPress={() => setGroup(g)}
                style={[styles.segmentBtn, active && { backgroundColor: colors.brandSecondary }]}>
                <Text style={[styles.segmentText, { color: colors.onSurfaceMuted }, active && styles.segmentTextActive]}>
                  {g === "main" ? "Main Duas" : "Other Duas"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.grid}>
          {cats.map((c) => {
            const imgSource = CATEGORY_IMAGES[c.id] || { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" };
            return (
              <Pressable key={c.id} onPress={() => handleCategoryPress(c.id)}
                style={({ pressed }) => [styles.card, { width: CARD_WIDTH }, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }]}
              >
                <ImageBackground source={imgSource} resizeMode="cover" style={styles.cardImage} imageStyle={{ borderRadius: theme.radius.lg }}>
                  <LinearGradient colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.7)"]} style={styles.cardScrim}>
                    <View style={styles.cardLabelContainer}>
                      <Text style={styles.cardTitle}>{c.title.toUpperCase()}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
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
  goalsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.sm },
  goalsTitle: { fontSize: 16, fontWeight: "700" },
  goalsSettings: { fontSize: 13, fontWeight: "600" },
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
});
