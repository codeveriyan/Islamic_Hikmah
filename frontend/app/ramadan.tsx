import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { resolveUserLocation, saveRamadanLog, getRamadanLogs, FastingLog, getPrayerSettings, getPrayerTimingsCache, localDateKey } from "@/src/storage";
import { calculateLocalPrayerTimes } from "@/src/services/prayerCalculation";
import { format12Hour } from "@/src/utils/time";

export default function RamadanScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [suhoorTime, setSuhoorTime] = useState("04:30");
  const [iftarTime, setIftarTime] = useState("18:45");
  const [city, setCity] = useState("Local");
  const [fastingLogs, setFastingLogs] = useState<FastingLog[]>([]);
  const [todayFasted, setTodayFasted] = useState(false);

  // UmmahAPI 30-day Ramadan Timetable state
  const [ramadanSchedule, setRamadanSchedule] = useState<Array<{
    day: number;
    date: string;
    day_name: string;
    hijri_date: string;
    third: string;
    suhoor_ends: string;
    iftar: string;
  }>>([]);
  const [showSchedule, setShowSchedule] = useState(false);

  const todayStr = useMemo(() => localDateKey(), []);
  const hijriMonth = useMemo(() => {
    const month = new Intl.DateTimeFormat("en-u-ca-islamic", { month: "numeric" }).format(new Date());
    return Number(month);
  }, []);
  const isRamadan = hijriMonth === 9;

  useEffect(() => {
    (async () => {
      try {
        const [loc, settings, cached] = await Promise.all([resolveUserLocation(), getPrayerSettings(), getPrayerTimingsCache()]);
        setCity(loc.city || "Local");
        const cacheMatches = cached && cached.date === todayStr && cached.method === settings.method
          && cached.juristic === settings.juristic && Math.abs(cached.latitude - loc.lat) < 0.02
          && Math.abs(cached.longitude - loc.lon) < 0.02;
        const times = cacheMatches ? cached.timings : calculateLocalPrayerTimes({
          latitude: loc.lat, longitude: loc.lon, method: settings.method, juristic: settings.juristic,
        });
        setSuhoorTime(times.Fajr);
        setIftarTime(times.Maghrib);

        // Fetch UmmahAPI 30-Day Ramadan Timetable
        try {
          const currentYear = new Date().getFullYear();
          const rRes = await fetch(`https://www.ummahapi.com/api/ramadan/${currentYear}?lat=${loc.lat}&lng=${loc.lon}`);
          if (rRes.ok) {
            const rData = await rRes.json();
            if (rData?.data?.days && Array.isArray(rData.data.days)) {
              setRamadanSchedule(rData.data.days);
            }
          }
        } catch (rErr) {
          console.warn("UmmahAPI Ramadan timetable fetch error:", rErr);
        }

      } catch {
        // Fallback default times
      }
      const logs = await getRamadanLogs();
      setFastingLogs(logs);
      const todayEntry = logs.find((l) => l.date === todayStr);
      if (todayEntry) setTodayFasted(todayEntry.fasted);
    })();
  }, [todayStr]);

  const toggleTodayFast = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setTodayFasted(value);
    await saveRamadanLog(todayStr, value);
    const updated = await getRamadanLogs();
    setFastingLogs(updated);
  };

  const totalFastedDays = fastingLogs.filter((l) => l.fasted).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Ramadan Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient
          colors={["#1B4332", "#2D6A4F", "#D4AF37"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <MaterialCommunityIcons name="moon-waning-crescent" size={40} color="#FFD700" />
          <Text style={styles.heroTitle}>{isRamadan ? "Ramadan Companion" : "Fasting Companion"}</Text>
          <Text style={styles.heroSub}>
            {isRamadan ? "Track your Suhoor, Iftar, and daily fasting goals" : "Track voluntary fasting and prepare for Ramadan"} in {city}.
          </Text>
        </LinearGradient>

        {/* Timings Section */}
        <View style={styles.timingsRow}>
          <View style={[styles.timingBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="weather-sunset-up" size={24} color="#F59E0B" />
            <Text style={[styles.timingLabel, { color: colors.onSurfaceMuted }]}>Suhoor (Fajr)</Text>
            <Text style={[styles.timingVal, { color: colors.onSurface }]}>{format12Hour(suhoorTime)}</Text>
          </View>

          <View style={[styles.timingBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="weather-sunset-down" size={24} color="#EF4444" />
            <Text style={[styles.timingLabel, { color: colors.onSurfaceMuted }]}>Iftar (Maghrib)</Text>
            <Text style={[styles.timingVal, { color: colors.onSurface }]}>{format12Hour(iftarTime)}</Text>
          </View>
        </View>

        {/* Today Fasting Toggle Card */}
        <View style={[styles.fastCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.fastInfo}>
            <MaterialCommunityIcons
              name={todayFasted ? "check-circle" : "circle-outline"}
              size={28}
              color={todayFasted ? colors.brand : colors.onSurfaceMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fastTitle, { color: colors.onSurface }]}>{isRamadan ? "Fasting Today" : "Voluntary Fast Today"}</Text>
              <Text style={[styles.fastSub, { color: colors.onSurfaceMuted }]}>
                {todayFasted ? "May Allah accept your fast! ✨" : "Mark your fast for today"}
              </Text>
            </View>
          </View>
          <Switch
            value={todayFasted}
            onValueChange={toggleTodayFast}
            trackColor={{ false: colors.border, true: colors.brand }}
          />
        </View>

        {/* Fasting Streak Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.summaryTitle, { color: colors.onSurface }]}>Fasting Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.brand }]}>{totalFastedDays}</Text>
              <Text style={[styles.summaryLabel, { color: colors.onSurfaceMuted }]}>Days Fasted</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: colors.onSurface }]}>{isRamadan ? "30" : "—"}</Text>
              <Text style={[styles.summaryLabel, { color: colors.onSurfaceMuted }]}>{isRamadan ? "Ramadan target" : "Personal target"}</Text>
            </View>
          </View>
        </View>

        {/* 30-Day Ramadan Timetable Trigger Button */}
        {ramadanSchedule.length > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setShowSchedule(true);
            }}
            style={[styles.summaryCard, { backgroundColor: colors.brand + "15", borderColor: colors.brand }]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <MaterialCommunityIcons name="calendar-clock" size={24} color={colors.brand} />
                <View>
                  <Text style={[styles.summaryTitle, { color: colors.brand }]}>Full 30-Day Ramadan Timetable</Text>
                  <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginTop: 2 }}>
                    View complete Suhoor & Iftar schedule for {city}
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.brand} />
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* 30-Day Ramadan Timetable Modal */}
      <Modal
        visible={showSchedule}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSchedule(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
          <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.onSurface }]}>30-Day Ramadan Timetable</Text>
            <Pressable onPress={() => setShowSchedule(false)} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
            </Pressable>
          </View>

          <FlatList
            data={ramadanSchedule}
            keyExtractor={(item) => String(item.day)}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            renderItem={({ item }) => (
              <View style={[styles.fastCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, padding: 14 }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: colors.brand }}>
                      Day {item.day} · {item.day_name}
                    </Text>
                    <View style={{ backgroundColor: colors.brand + "22", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, color: colors.brand, fontWeight: "700" }}>{item.hijri_date}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginBottom: 8 }}>{item.third}</Text>
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Text style={{ fontSize: 13, color: colors.onSurface, fontWeight: "600" }}>
                      🌅 Suhoor: <Text style={{ color: colors.brand }}>{format12Hour(item.suhoor_ends)}</Text>
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.onSurface, fontWeight: "600" }}>
                      🌇 Iftar: <Text style={{ color: "#EF4444" }}>{format12Hour(item.iftar)}</Text>
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  timingsRow: {
    flexDirection: "row",
    gap: 16,
  },
  timingBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  timingLabel: {
    fontSize: 13,
  },
  timingVal: {
    fontSize: 18,
    fontWeight: "800",
  },
  fastCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fastInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  fastTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  fastSub: {
    fontSize: 12,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  summaryNum: {
    fontSize: 28,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 36,
  },
});
