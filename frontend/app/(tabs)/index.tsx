import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated,
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
  getSavedLocation, setSavedLocation, getCompletedGoals, toggleGoal,
  getActiveGoalIds, getPrayerSettings,
} from "@/src/storage";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;
const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

// Countdown ring size
const RING = 80;
const STROKE = 6;
const RADIUS = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

const QUICK_ACTIONS = [
  { id: "quran", title: "Quran", icon: "book-open-variant", route: "/quran", color: "#10B981" },
  { id: "dhikr", title: "Tasbih", icon: "circle-double", route: "/dhikr", color: "#C5A880" },
  { id: "prayer", title: "Prayer Times", icon: "clock-time-eight", route: "/prayer-times", color: "#14B8A6" },
  { id: "goals", title: "Goals", icon: "checkbox-marked-circle-outline", route: "/goals", color: "#8B5CF6" },
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
    const str = new Intl.DateTimeFormat('en-TN-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
    const clean = str.replace(" AH", "").trim();
    const parts = clean.split(" ");
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      if (!isNaN(day)) {
        let suffix = "th";
        if (day % 10 === 1 && day !== 11) suffix = "st";
        else if (day % 10 === 2 && day !== 12) suffix = "nd";
        else if (day % 10 === 3 && day !== 13) suffix = "rd";
        return `${day}${suffix} ${parts[1]} ${parts[2]}`;
      }
    }
    return clean;
  } catch { return ""; }
}

function parseTime(t: string): Date {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function getNextPrayer(times: Record<string, string>) {
  const now = new Date();
  for (const p of PRAYERS) {
    if (!times[p]) continue;
    const d = parseTime(times[p]);
    if (d > now) return { name: p, time: times[p], date: d };
  }
  // All done — next is Fajr tomorrow
  const fajr = parseTime(times["Fajr"] || "00:00");
  fajr.setDate(fajr.getDate() + 1);
  return { name: "Fajr", time: times["Fajr"] || "--:--", date: fajr };
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

  // Goals
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);

  const cats = useMemo(() => CATEGORIES.filter((c) => c.group === group), [group]);

  // Load prayer times
  useEffect(() => {
    (async () => {
      let loc = await getSavedLocation();
      if (!loc) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const p = await Location.getCurrentPositionAsync({});
        let cityName = "";
        try {
          const rev = await Location.reverseGeocodeAsync(p.coords);
          cityName = rev?.[0]?.city || rev?.[0]?.region || "";
        } catch {}
        loc = { lat: p.coords.latitude, lon: p.coords.longitude, city: cityName };
        await setSavedLocation(loc);
      } else if (!loc.city) {
        try {
          const rev = await Location.reverseGeocodeAsync({ latitude: loc.lat, longitude: loc.lon });
          const cityName = rev?.[0]?.city || rev?.[0]?.region || "";
          if (cityName) {
            loc = { ...loc, city: cityName };
            await setSavedLocation(loc);
          }
        } catch {}
      }
      setCity(loc.city || "");
      const settings = await getPrayerSettings();
      const url = `https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lon}&method=${settings.method}&school=${settings.juristic}`;
      const r = await fetch(url);
      const j = await r.json();
      setTimes(j?.data?.timings || null);
    })();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!times) return;
    const tick = () => {
      const now = new Date();
      const next = getNextPrayer(times);
      const diff = next.date.getTime() - now.getTime();
      if (diff <= 0) { setCountdown("00:00:00"); setProgress(1); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      // Progress = time elapsed since last prayer / total duration to next
      const elapsed = 6 * 3600000 - diff; // approx
      setProgress(Math.min(Math.max(elapsed / (6 * 3600000), 0), 1));
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

  const nextPrayer = useMemo(() => times ? getNextPrayer(times) : null, [times]);

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
          {hijri ? <Text style={[styles.hijriDate, { color: colors.onSurfaceMuted }]}>{hijri}</Text> : null}
        </View>
        <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
          <MaterialCommunityIcons name="cog-outline" size={26} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} removeClippedSubviews>

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={[styles.greetingHi, { color: colors.brand }]}>{greeting.salaam}</Text>
          <Text style={[styles.greetingSub, { color: colors.onSurfaceSecondary }]}>{greeting.sub}</Text>
          {city ? <Text style={[styles.cityTxt, { color: colors.onSurfaceMuted }]}>📍 {city}</Text> : null}
        </View>

        {/* Prayer Countdown Card */}
        {nextPrayer && (
          <Pressable onPress={() => router.push("/prayer-times")} style={[styles.prayerCard, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.prayerLabel, { color: colors.onSurfaceMuted }]}>Current Prayer</Text>
              <Text style={[styles.prayerName, { color: colors.onSurface }]}>{nextPrayer.name}</Text>
              <Text style={[styles.prayerTime, { color: colors.brand }]}>{format12Hour(nextPrayer.time)}</Text>
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
                  {PRAYERS[Math.min(PRAYERS.indexOf(nextPrayer.name) + 1, PRAYERS.length - 1)] || "Fajr"}
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
          {cats.map((c) => (
            <Pressable key={c.id} onPress={() => handleCategoryPress(c.id)}
              style={({ pressed }) => [styles.card, { width: CARD_WIDTH }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
              <LinearGradient colors={c.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name={c.icon as any} size={42} color="rgba(255,255,255,0.85)" />
                </View>
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.55)"]} style={styles.cardScrim} />
                <Text style={styles.cardTitle}>{c.title}</Text>
              </LinearGradient>
            </Pressable>
          ))}
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
  greetingSub: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  cityTxt: { fontSize: 12, marginTop: 4 },

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
  quickRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg },
  quickBtn: { alignItems: "center", flex: 1 },
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
  cardGradient: { flex: 1, padding: theme.spacing.md, justifyContent: "flex-end" },
  cardIcon: { position: "absolute", right: 8, top: 8, opacity: 0.6 },
  cardScrim: { ...StyleSheet.absoluteFillObject },
  cardTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});
