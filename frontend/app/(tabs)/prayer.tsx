import { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPrayerTimingsCache } from "@/src/storage";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { format12Hour } from "@/src/utils/time";
import { theme } from "@/src/theme";

const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_ICONS: Record<string, string> = {
  Fajr: "weather-partly-cloudy",
  Sunrise: "weather-sunset-up",
  Dhuhr: "weather-sunny",
  Asr: "weather-cloudy",
  Maghrib: "weather-sunset-down",
  Isha: "weather-night",
};

const RING = 72;
const STROKE = 5;
const RADIUS = (RING - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

type QuickLink = { id: string; label: string; icon: string; route: string; color: string };
const QUICK: QuickLink[] = [
  { id: "qibla", label: "Qibla Finder", icon: "compass", route: "/qibla", color: "#047857" },
  { id: "mosque", label: "Mosque Finder", icon: "home-map-marker", route: "/finder?type=mosque", color: "#1D4ED8" },
  { id: "qadha", label: "Qadha Tracker", icon: "clipboard-check", route: "/qadha", color: "#7C3AED" },
  { id: "calendar", label: "Hijri Calendar", icon: "calendar-month", route: "/hijri-calendar", color: "#B45309" },
];

function parseTime(t: string): Date {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function getCountdown(targetDate: Date): string {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return "00:00:00";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PrayerTab() {
  const router = useRouter();
  const { colors, mode } = useTheme();

  const [times, setTimes] = useState<Record<string, string> | null>(null);
  const [city, setCity] = useState("");
  const [nextPrayer, setNextPrayer] = useState<{ name: string; timeStr: string; date: Date } | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState<{ name: string; timeStr: string } | null>(null);
  const [countdown, setCountdown] = useState("--:--:--");
  const [progress, setProgress] = useState(0);
  const [prayedToday, setPrayedToday] = useState<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isFriday = new Date().getDay() === 5;

  const todayKey = (() => {
    const d = new Date();
    return `hikmah:prayed:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  })();

  const togglePrayed = async (name: string) => {
    const next = new Set(prayedToday);
    if (next.has(name)) next.delete(name); else next.add(name);
    setPrayedToday(next);
    await AsyncStorage.setItem(todayKey, JSON.stringify([...next]));
  };

  // Load cached prayer times + today's prayed set
  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const [cache, prayedRaw] = await Promise.all([
          getPrayerTimingsCache(),
          AsyncStorage.getItem(todayKey),
        ]);
        if (cache?.timings) { setTimes(cache.timings); setCity((cache as any).city || ""); }
        if (prayedRaw) setPrayedToday(new Set(JSON.parse(prayedRaw)));
      } catch {}
    })();
  }, [todayKey]));

  // Compute next prayer + start countdown timer
  useEffect(() => {
    if (!times) return;
    const update = () => {
      const now = new Date();
      const parsed = PRAYERS.map((name) => {
        const t = times[name];
        if (!t) return null;
        const [h, m] = t.split(":").map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0);
        return { name, date: d, timeStr: t };
      }).filter(Boolean) as { name: string; date: Date; timeStr: string }[];

      let nextIdx = parsed.findIndex((p) => p.date > now);
      if (nextIdx === -1) nextIdx = 0;
      const next = parsed[nextIdx];
      const curr = parsed[Math.max(0, nextIdx - 1)];
      setNextPrayer(next);
      setCurrentPrayer(curr);

      if (next) {
        setCountdown(getCountdown(next.date));
        const total = next.date.getTime() - (curr?.date.getTime() ?? next.date.getTime() - 3600000);
        const elapsed = now.getTime() - (curr?.date.getTime() ?? now.getTime());
        setProgress(Math.max(0, Math.min(1, elapsed / total)));
      }
    };

    update();
    timerRef.current = setInterval(update, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [times]);

  const strokeDash = CIRC * (1 - progress);
  const bg = mode === "dark" ? colors.surface : "#F8FAFC";
  const cardBg = mode === "dark" ? colors.surfaceSecondary : "#FFFFFF";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top"]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerTitle, { color: colors.onSurface }]}>Prayer Times</Text>
          {city ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.brand} />
              <Text style={[s.headerSub, { color: colors.onSurfaceMuted }]}>{city}</Text>
            </View>
          ) : null}
        </View>
        <AnimatedCard onPress={() => router.push("/prayer-times")} style={s.settingsBtn}>
          <View style={[s.settingsBtnInner, { backgroundColor: colors.brand + "18" }]}>
            <MaterialCommunityIcons name="tune" size={18} color={colors.brand} />
            <Text style={[s.settingsBtnTxt, { color: colors.brand }]}>Settings</Text>
          </View>
        </AnimatedCard>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ── Jumu'ah Banner (Fridays only) ── */}
        {isFriday && (
          <AnimatedCard
            onPress={() => router.push("/articles" as any)}
            style={{ marginBottom: 16, borderRadius: 16, overflow: "hidden" }}
          >
            <LinearGradient
              colors={["#065F46", "#047857"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name="mosque" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: "#fff", fontFamily: "Outfit_600SemiBold" }}>Jumu'ah Mubarak! 🕌</Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", fontFamily: "Figtree_400Regular", marginTop: 2 }}>
                  Don't forget Friday's special Sunnah — recite Surah Al-Kahf
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </AnimatedCard>
        )}

        {/* Hero Next Prayer Card */}
        {times && nextPrayer ? (
          <AnimatedCard onPress={() => router.push("/prayer-times")} style={[s.heroCard, { overflow: "hidden" }]}>
            <LinearGradient
              colors={mode === "dark" ? ["#0B2D25", "#10251F", "#1E3528"] : ["#1B5E20", "#2E7D32"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flex: 1 }}>
              {currentPrayer && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <MaterialCommunityIcons name={PRAYER_ICONS[currentPrayer.name] as any} size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={s.heroCurrentLabel}>Current: {currentPrayer.name}</Text>
                </View>
              )}
              <Text style={s.heroNext}>Next: {nextPrayer.name}</Text>
              <Text style={s.heroTime}>{format12Hour(nextPrayer.timeStr)}</Text>
              <Text style={s.heroCountdown}>{countdown}</Text>
            </View>
            <View style={s.heroRing}>
              <Svg width={RING} height={RING}>
                <Circle cx={RING/2} cy={RING/2} r={RADIUS} stroke="rgba(255,255,255,0.15)" strokeWidth={STROKE} fill="transparent" />
                <Circle
                  cx={RING/2} cy={RING/2} r={RADIUS} stroke="#fff" strokeWidth={STROKE} fill="transparent"
                  strokeDasharray={CIRC} strokeDashoffset={strokeDash}
                  strokeLinecap="round" rotation="-90" origin={`${RING/2},${RING/2}`}
                />
              </Svg>
              <View style={s.heroRingCenter}>
                <Text style={s.heroRingPct}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>
          </AnimatedCard>
        ) : (
          <AnimatedCard onPress={() => router.push("/prayer-times")} style={[s.heroCard, { overflow: "hidden", backgroundColor: colors.surfaceSecondary, justifyContent: "center", alignItems: "center" }]}>
            <MaterialCommunityIcons name="mosque" size={32} color={colors.brand} />
            <Text style={[{ color: colors.onSurfaceMuted, marginTop: 8, fontSize: 14 }]}>Tap to load prayer times</Text>
          </AnimatedCard>
        )}

        {/* Today's Schedule */}
        <Text style={[s.sectionTitle, { color: colors.onSurface }]}>Today's Schedule</Text>
        {times ? (
          <View style={[s.scheduleCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
            {PRAYERS.map((name, idx) => {
              const timeStr = times[name];
              if (!timeStr) return null;
              const isNext = nextPrayer?.name === name;
              const isCurrent = currentPrayer?.name === name;
              return (
                <View
                  key={name}
                  style={[
                    s.scheduleRow,
                    idx < PRAYERS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
                    isNext && { backgroundColor: colors.brand + "12" },
                  ]}
                >
                  <View style={[s.scheduleIcon, { backgroundColor: isNext ? colors.brand + "22" : colors.surfaceSecondary }]}>
                    <MaterialCommunityIcons name={PRAYER_ICONS[name] as any} size={18} color={isNext ? colors.brand : colors.onSurfaceMuted} />
                  </View>
                  <Text style={[s.scheduleName, { color: isNext ? colors.brand : colors.onSurface, fontWeight: isNext ? "700" : "500" }]}>{name}</Text>
                  {isCurrent && <View style={[s.currentBadge, { backgroundColor: colors.brand }]}><Text style={s.currentBadgeTxt}>NOW</Text></View>}
                  {isNext && !isCurrent && <View style={[s.currentBadge, { backgroundColor: "#F59E0B22" }]}><Text style={[s.currentBadgeTxt, { color: colors.warning }]}>NEXT</Text></View>}
                  <Text style={[s.scheduleTime, { color: isNext ? colors.brand : colors.onSurfaceMuted }]}>{format12Hour(timeStr)}</Text>
                  {/* Mark as prayed toggle */}
                  <Pressable
                    onPress={() => togglePrayed(name)}
                    hitSlop={8}
                    style={[
                      s.prayedBtn,
                      prayedToday.has(name)
                        ? { backgroundColor: colors.brand, borderColor: colors.brand }
                        : { backgroundColor: 'transparent', borderColor: colors.border },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={prayedToday.has(name) ? "check" : "check"}
                      size={12}
                      color={prayedToday.has(name) ? '#fff' : colors.onSurfaceMuted}
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={[s.scheduleCard, { backgroundColor: cardBg, borderColor: colors.border, alignItems: "center", padding: 32 }]}>
            <ActivityIndicator color={colors.brand} />
            <Text style={[{ color: colors.onSurfaceMuted, marginTop: 8, fontSize: 13 }]}>Open the app from Home to load prayer times</Text>
          </View>
        )}

        {/* ── Salah Motivation Card ── */}
        <View style={[s.hadithCard, { backgroundColor: cardBg, borderColor: colors.brand + '33' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <MaterialCommunityIcons name="format-quote-open" size={18} color={colors.brand} />
            <Text style={[s.hadithLabel, { color: colors.brand }]}>Hadith on Salah</Text>
          </View>
          <Text style={[s.hadithText, { color: colors.onSurface }]}>
            "The first thing the servant will be held accountable for on the Day of Judgment is the prayer."
          </Text>
          <Text style={[s.hadithSource, { color: colors.onSurfaceMuted }]}>— At-Tirmidhi 413</Text>
        </View>

        {/* Quick Access */}
        <Text style={[s.sectionTitle, { color: colors.onSurface, marginTop: 8 }]}>Quick Access</Text>
        <View style={s.quickGrid}>
          {QUICK.map((item) => (
            <AnimatedCard key={item.id} onPress={() => router.push(item.route as any)} style={[s.quickCard, { backgroundColor: cardBg, borderColor: colors.border }]}>
              <View style={[s.quickIcon, { backgroundColor: item.color + "18" }]}>
                <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={[s.quickLabel, { color: colors.onSurface }]}>{item.label}</Text>
            </AnimatedCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 22, fontFamily: "Outfit_600SemiBold", fontWeight: "700" },
  headerSub: { fontSize: 12, fontFamily: "Figtree_400Regular" },
  settingsBtn: { borderRadius: 10, overflow: "hidden" },
  settingsBtnInner: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  settingsBtnTxt: { fontSize: 13, fontWeight: "700", fontFamily: "Figtree_400Regular" },
  scroll: { padding: theme.spacing.lg },
  heroCard: {
    borderRadius: 20, flexDirection: "row", alignItems: "center",
    padding: 20, marginBottom: 20, minHeight: 130,
  },
  heroCurrentLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Figtree_400Regular" },
  heroNext: { fontSize: 16, color: "rgba(255,255,255,0.85)", fontFamily: "Figtree_400Regular", marginBottom: 2 },
  heroTime: { fontSize: 28, fontFamily: "Outfit_600SemiBold", fontWeight: "800", color: "#fff", marginBottom: 4 },
  heroCountdown: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Figtree_400Regular", letterSpacing: 1.5 },
  heroRing: { width: RING, height: RING, alignItems: "center", justifyContent: "center" },
  heroRingCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  heroRingPct: { fontSize: 13, color: "#fff", fontWeight: "700" },
  sectionTitle: {
    fontSize: 13, fontFamily: "Figtree_400Regular", fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12, marginTop: 4,
  },
  scheduleCard: { borderRadius: theme.radius.lg, borderWidth: 0.5, overflow: "hidden", marginBottom: 20 },
  prayedBtn: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  hadithCard: {
    borderRadius: theme.radius.lg, borderWidth: 1,
    padding: 16, marginBottom: 20,
  },
  hadithLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Figtree_400Regular' },
  hadithText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic', fontFamily: 'Figtree_400Regular', marginBottom: 8 },
  hadithSource: { fontSize: 11, fontFamily: 'Figtree_400Regular', fontWeight: '600' },
  scheduleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  scheduleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  scheduleName: { flex: 1, fontSize: 15, fontFamily: "Figtree_400Regular" },
  scheduleTime: { fontSize: 14, fontFamily: "Figtree_400Regular", fontWeight: "600" },
  currentBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginRight: 4 },
  currentBadgeTxt: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  quickCard: {
    width: (StyleSheet.hairlineWidth * 0 + (292 / 2)) - theme.spacing.md / 2,
    flex: 1, minWidth: 130,
    borderRadius: theme.radius.lg, borderWidth: 0.5,
    padding: 16, alignItems: "center", gap: 10,
  },
  quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 13, fontFamily: "Figtree_400Regular", fontWeight: "600", textAlign: "center" },
});
