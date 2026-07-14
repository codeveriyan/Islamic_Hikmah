import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Modal, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { ISLAMIC_EVENTS, HIJRI_MONTHS, IslamicEvent } from "@/src/data/islamicEvents";
import { DEFAULT_GOALS, CATEGORY_COLORS, Goal } from "@/src/data/goals";
import { getActiveGoalIds, getCompletedGoals, getGoogleCalendarConnected, setGoogleCalendarConnected } from "@/src/storage";
import { useAuth } from "@/src/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type HijriDay = {
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  gregorianDate: Date;
  isToday: boolean;
  events: IslamicEvent[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad(n: number) { return String(n).padStart(2, "0"); }

function gregorianToString(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Convert a Gregorian date to Hijri using the Aladhan API.
// Returns { day, month, year } in Hijri.
async function fetchHijriDate(gregorian: Date): Promise<{ day: number; month: number; year: number } | null> {
  try {
    const url = `https://api.aladhan.com/v1/gToH/${pad(gregorian.getDate())}-${pad(gregorian.getMonth() + 1)}-${gregorian.getFullYear()}`;
    const res = await fetch(url);
    const json = await res.json();
    const hijri = json?.data?.hijri;
    if (!hijri) return null;
    return {
      day: parseInt(hijri.day, 10),
      month: parseInt(hijri.month.number, 10),
      year: parseInt(hijri.year, 10),
    };
  } catch {
    return null;
  }
}

// Build a full Hijri month grid.
// We determine the first Gregorian day of the Hijri month by fetching Aladhan
// for the 1st day of that Hijri month, then lay out all days in the month.
async function buildHijriMonth(
  hijriYear: number,
  hijriMonth: number
): Promise<HijriDay[]> {
  // Fetch the Gregorian date for Hijri 1st of this month
  const hToGUrl = `https://api.aladhan.com/v1/hToG/01-${pad(hijriMonth)}-${hijriYear}`;
  const res = await fetch(hToGUrl);
  const json = await res.json();
  const greg = json?.data?.gregorian;
  if (!greg) return [];

  const firstGreg = new Date(greg.date); // "DD-MM-YYYY" from API? Let's parse:
  // Aladhan hToG returns gregorian.date as "DD-MM-YYYY"
  const [dd, mm, yyyy] = greg.date.split("-").map(Number);
  const firstGregDate = new Date(yyyy, mm - 1, dd);

  // Hijri months are 29 or 30 days. Fetch the Gregorian date for Hijri 30th.
  // If the API returns a valid date for the 30th, the month has 30 days; otherwise 29.
  let daysInMonth = 29;
  try {
    const h30Url = `https://api.aladhan.com/v1/hToG/30-${pad(hijriMonth)}-${hijriYear}`;
    const r30 = await fetch(h30Url);
    const j30 = await r30.json();
    if (j30?.code === 200 && j30?.data?.gregorian?.date) daysInMonth = 30;
  } catch {}

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventMap = new Map<number, IslamicEvent[]>();
  ISLAMIC_EVENTS.forEach((e) => {
    if (e.hijriMonth === hijriMonth) {
      if (!eventMap.has(e.hijriDay)) eventMap.set(e.hijriDay, []);
      eventMap.get(e.hijriDay)!.push(e);
    }
  });

  const days: HijriDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const gregDate = new Date(firstGregDate);
    gregDate.setDate(firstGregDate.getDate() + (d - 1));
    gregDate.setHours(0, 0, 0, 0);
    days.push({
      hijriDay: d,
      hijriMonth,
      hijriYear,
      gregorianDate: gregDate,
      isToday: gregDate.getTime() === today.getTime(),
      events: eventMap.get(d) ?? [],
    });
  }
  return days;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HijriCalendarScreen() {
  const router = useRouter();
  const { colors, mode , language } = useTheme();
  const { t } = useTranslation(language);
  const { user, isGuest, profile } = useAuth();

  const [currentHijriYear, setCurrentHijriYear] = useState(1446);
  const [currentHijriMonth, setCurrentHijriMonth] = useState(1);
  const [days, setDays] = useState<HijriDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<HijriDay | null>(null);
  const [todayHijri, setTodayHijri] = useState<{ day: number; month: number; year: number } | null>(null);

  // goalsByDate: maps "YYYY-M-D" → completed goal ids for that day
  const [goalsByDate, setGoalsByDate] = useState<Record<string, string[]>>({});
  const [activeGoalIds, setActiveGoalIds] = useState<string[]>([]);
  const [calendarConnected, setCalendarConnected] = useState(false);

  // Load active goal config once
  useEffect(() => {
    getActiveGoalIds().then(setActiveGoalIds);
    getGoogleCalendarConnected().then(value => setCalendarConnected(!!user && !isGuest && value));
  }, [user, isGuest]);


  // Load completed goals for all days in the current month whenever the grid changes
  useEffect(() => {
    if (days.length === 0) return;
    (async () => {
      const GOALS_KEY = 'hikmah:goals-completed:v1';
      const entries: Record<string, string[]> = {};
      await Promise.all(
        days.map(async (day) => {
          const d = day.gregorianDate;
          const key = `${GOALS_KEY}:${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
          const raw = await AsyncStorage.getItem(key);
          if (raw) {
            entries[`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`] = JSON.parse(raw);
          }
        })
      );
      setGoalsByDate(entries);
    })();
  }, [days]);

  // Fetch today's Hijri date on mount to initialize the calendar at the correct month
  useEffect(() => {
    fetchHijriDate(new Date()).then((h) => {
      if (h) {
        setTodayHijri(h);
        setCurrentHijriYear(h.year);
        setCurrentHijriMonth(h.month);
      }
    });
  }, []);

  // Rebuild calendar grid when month/year changes
  useEffect(() => {
    setLoading(true);
    setDays([]);
    buildHijriMonth(currentHijriYear, currentHijriMonth).then((d) => {
      setDays(d);
      setLoading(false);
    });
  }, [currentHijriYear, currentHijriMonth]);

  const goToPrevMonth = useCallback(() => {
    if (currentHijriMonth === 1) {
      setCurrentHijriMonth(12);
      setCurrentHijriYear((y) => y - 1);
    } else {
      setCurrentHijriMonth((m) => m - 1);
    }
  }, [currentHijriMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentHijriMonth === 12) {
      setCurrentHijriMonth(1);
      setCurrentHijriYear((y) => y + 1);
    } else {
      setCurrentHijriMonth((m) => m + 1);
    }
  }, [currentHijriMonth]);

  const goToToday = useCallback(() => {
    if (todayHijri) {
      setCurrentHijriYear(todayHijri.year);
      setCurrentHijriMonth(todayHijri.month);
    }
  }, [todayHijri]);

  // Events for the current month (sorted by day)
  const monthEvents = useMemo(() =>
    ISLAMIC_EVENTS
      .filter((e) => e.hijriMonth === currentHijriMonth)
      .sort((a, b) => a.hijriDay - b.hijriDay),
    [currentHijriMonth]
  );

  // Offset: Islamic week starts on Sunday. getDay() returns 0=Sun.
  // Aladhan week for Hijri months also starts Sunday, so we use getDay() of the first day.
  const firstDayOffset = days.length > 0 ? days[0].gregorianDate.getDay() : 0;

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("hijriCalendar")}</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Pressable onPress={goToToday} hitSlop={10}>
            <Text style={[styles.todayBtn, { color: colors.brand }]}>Today</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Month navigator */}
        <View style={[styles.monthNav, { backgroundColor: colors.surfaceSecondary }]}>
          <Pressable onPress={goToPrevMonth} hitSlop={12} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.brand} />
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.monthName, { color: colors.onSurface }]}>
              {HIJRI_MONTHS[currentHijriMonth - 1]}
            </Text>
            <Text style={[styles.yearText, { color: colors.onSurfaceMuted }]}>
              {currentHijriYear} AH
            </Text>
          </View>
          <Pressable onPress={goToNextMonth} hitSlop={12} style={styles.navBtn}>
            <MaterialCommunityIcons name="chevron-right" size={26} color={colors.brand} />
          </Pressable>
        </View>

        <Pressable onPress={() => router.push("/calendar-sync")}
          style={[styles.settingRowFull, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginHorizontal: theme.spacing.lg, marginBottom: 16 }]}>
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

        {/* Day-of-week labels */}
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((d) => (
            <Text
              key={d}
              style={[
                styles.dayLabel,
                { color: d === "Fri" ? colors.brand : colors.onSurfaceMuted },
              ]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar grid */}
        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.grid}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.cell} />
            ))}

            {days.map((day) => {
              const hasEvent = day.events.length > 0;
              const isFriday = day.gregorianDate.getDay() === 5;
              const eventColor = hasEvent ? day.events[0].color : undefined;
              const d = day.gregorianDate;
              const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
              const dayCompletedGoals = goalsByDate[dateKey] ?? [];
              const hasGoals = dayCompletedGoals.length > 0;

              return (
                <Pressable
                  key={day.hijriDay}
                  onPress={() => setSelectedDay(day)}
                  style={[
                    styles.cell,
                    day.isToday && {
                      backgroundColor: colors.brand,
                      borderRadius: 999,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellDay,
                      {
                        color: day.isToday
                          ? colors.onBrandPrimary
                          : isFriday
                          ? colors.brand
                          : colors.onSurface,
                        fontWeight: day.isToday ? "800" : "500",
                      },
                    ]}
                  >
                    {day.hijriDay}
                  </Text>
                  {/* Gregorian date in small text */}
                  <Text
                    style={[
                      styles.cellGreg,
                      { color: day.isToday ? colors.onBrandPrimary + "BB" : colors.onSurfaceMuted },
                    ]}
                  >
                    {day.gregorianDate.getDate()}
                  </Text>
                  {/* Dots row: Islamic event dot + Goal dot */}
                  <View style={{ flexDirection: "row", gap: 2, marginTop: 1, alignItems: "center" }}>
                    {hasEvent && (
                      <View style={[styles.eventDot, { backgroundColor: eventColor ?? colors.brandSecondary }]} />
                    )}
                    {hasGoals && (
                      <View style={[styles.eventDot, { backgroundColor: "#16a34a" }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* This month's events */}
        {monthEvents.length > 0 && (
          <View style={{ padding: theme.spacing.lg }}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Events this month
            </Text>
            {monthEvents.map((event) => (
              <View
                key={event.id}
                style={[styles.eventCard, { backgroundColor: colors.surfaceSecondary, borderLeftColor: event.color }]}
              >
                <View style={styles.eventCardTop}>
                  <View style={[styles.eventBadge, { backgroundColor: event.color + "22" }]}>
                    <Text style={[styles.eventBadgeText, { color: event.color }]}>
                      {HIJRI_MONTHS[event.hijriMonth - 1]} {event.hijriDay}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.eventTitle, { color: colors.onSurface }]}>
                  {event.title}
                </Text>
                <Text style={[styles.eventDesc, { color: colors.onSurfaceMuted }]}>
                  {event.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Day detail modal */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDay(null)}>
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceSecondary }]}>
            {selectedDay && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalHijri, { color: colors.brand }]}>
                    {HIJRI_MONTHS[selectedDay.hijriMonth - 1]} {selectedDay.hijriDay}, {selectedDay.hijriYear} AH
                  </Text>
                  <Text style={[styles.modalGreg, { color: colors.onSurfaceMuted }]}>
                    {selectedDay.gregorianDate.toLocaleDateString("en-US", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                    })}
                  </Text>
                </View>
                {selectedDay.events.length === 0 ? (
                  <Text style={[styles.noEvent, { color: colors.onSurfaceMuted }]}>
                    No Islamic events on this day.
                  </Text>
                ) : (
                  selectedDay.events.map((e) => (
                    <View key={e.id} style={[styles.modalEvent, { borderLeftColor: e.color }]}>
                      <Text style={[styles.modalEventTitle, { color: colors.onSurface }]}>{e.title}</Text>
                      <Text style={[styles.modalEventDesc, { color: colors.onSurfaceMuted }]}>{e.description}</Text>
                    </View>
                  ))
                )}

                {/* ── Daily Goals Section ── */}
                {(() => {
                  const d = selectedDay.gregorianDate;
                  const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
                  const completedIds = goalsByDate[dateKey] ?? [];
                  const activeGoals = DEFAULT_GOALS.filter(g => activeGoalIds.includes(g.id));
                  if (activeGoals.length === 0) return null;
                  const totalDone = activeGoals.filter(g => completedIds.includes(g.id)).length;
                  return (
                    <View style={styles.goalsSection}>
                      <View style={styles.goalsSectionHeader}>
                        <MaterialCommunityIcons name="check-circle-outline" size={16} color="#16a34a" />
                        <Text style={[styles.goalsSectionTitle, { color: colors.onSurface }]}>
                          Daily Goals
                        </Text>
                        <View style={[styles.goalsBadge, { backgroundColor: "#16a34a22" }]}>
                          <Text style={[styles.goalsBadgeText, { color: "#16a34a" }]}>
                            {totalDone}/{activeGoals.length}
                          </Text>
                        </View>
                      </View>
                      {activeGoals.map(goal => {
                        const done = completedIds.includes(goal.id);
                        const catColor = CATEGORY_COLORS[goal.category] ?? colors.brand;
                        return (
                          <View key={goal.id} style={styles.goalRow}>
                            <MaterialCommunityIcons
                              name={done ? "check-circle" : "circle-outline"}
                              size={18}
                              color={done ? "#16a34a" : colors.onSurfaceMuted}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={[
                                styles.goalTitle,
                                { color: done ? colors.onSurface : colors.onSurfaceMuted,
                                  textDecorationLine: done ? "none" : "none" }
                              ]}>
                                {goal.title}
                              </Text>
                            </View>
                            <View style={[styles.catDot, { backgroundColor: catColor + "33" }]}>
                              <Text style={[styles.catLabel, { color: catColor }]}>
                                {goal.category}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  );
                })()}

                <Pressable onPress={() => setSelectedDay(null)} style={[styles.closeBtn, { backgroundColor: colors.brand }]}>
                  <Text style={[styles.closeBtnTxt, { color: colors.onBrandPrimary }]}>{t("close")}</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const CELL_SIZE = 46;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "700" },
  todayBtn: { fontSize: 14, fontWeight: "700" },
  monthNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: theme.spacing.lg, margin: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  },
  navBtn: { padding: 4 },
  monthName: { fontSize: 20, fontWeight: "800" },
  yearText: { fontSize: 13, marginTop: 2 },
  dayLabels: { flexDirection: "row", paddingHorizontal: theme.spacing.md, marginBottom: 4 },
  dayLabel: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700" },
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: theme.spacing.md,
  },
  cell: {
    width: `${100 / 7}%`, height: CELL_SIZE,
    alignItems: "center", justifyContent: "center",
    paddingVertical: 2,
  },
  cellDay: { fontSize: 15, lineHeight: 18 },
  cellGreg: { fontSize: 9, lineHeight: 11 },
  eventDot: { width: 5, height: 5, borderRadius: 3, marginTop: 1 },
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
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: theme.spacing.md },
  eventCard: {
    borderLeftWidth: 3, borderRadius: theme.radius.md,
    padding: theme.spacing.lg, marginBottom: theme.spacing.md,
  },
  eventCardTop: { marginBottom: 6 },
  eventBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  eventBadgeText: { fontSize: 11, fontWeight: "700" },
  eventTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  eventDesc: { fontSize: 13, lineHeight: 19 },
  modalOverlay: {
    flex: 1, backgroundColor: "#00000088",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  modalCard: { width: "100%", borderRadius: 20, padding: theme.spacing.xl, gap: theme.spacing.md },
  modalHeader: { gap: 4 },
  modalHijri: { fontSize: 17, fontWeight: "800" },
  modalGreg: { fontSize: 13 },
  noEvent: { fontSize: 14, textAlign: "center", paddingVertical: 12 },
  modalEvent: { borderLeftWidth: 3, paddingLeft: 12, gap: 4 },
  modalEventTitle: { fontSize: 15, fontWeight: "700" },
  modalEventDesc: { fontSize: 13, lineHeight: 19 },
  closeBtn: { borderRadius: theme.radius.md, padding: 14, alignItems: "center", marginTop: 8 },
  closeBtnTxt: { fontWeight: "700", fontSize: 15 },
  // Goals in modal
  goalsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(128,128,128,0.2)",
    paddingTop: 12,
    gap: 8,
  },
  goalsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  goalsSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  goalsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  goalsBadgeText: {
    fontSize: 11,
    fontWeight: "800",
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  catDot: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "capitalize",
  },
});
