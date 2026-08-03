import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Modal, ScrollView, Platform, Alert } from "react-native";
import { SkeletonBone } from "@/src/components/SkeletonLoader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";
import { DEFAULT_GOALS } from "@/src/data/goals";
import { format12Hour } from "@/src/utils/time";
import { calculateLocalPrayerTimes } from "@/src/services/prayerCalculation";
import { AppIconButton } from "@/src/components/ui";
import {
  AppErrorState,
  AppOfflineState,
  AppStatusBanner,
} from "@/src/components/states";
import { 
  resolveUserLocation, 
  getPrayerSettings, 
  getPrayerTimingsCache,
  localDateKey,
  savePrayerTimingsCache,
  savePrayerSettings, 
  PrayerSettings, 
  schedulePrayerNotifications, 
  scheduleGoalNotifications, 
  getActiveGoalIds, 
  getGoalNotifTimes,
  getGoogleCalendarConnected,
  setGoogleCalendarConnected,
  getCompletedGoals,
} from "@/src/storage";

const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Qiyam"];
const PRAYER_ICONS: Record<string, string> = {
  Fajr: "weather-partly-cloudy",
  Sunrise: "weather-sunset-up",
  Dhuhr: "weather-sunny",
  Asr: "weather-cloudy",
  Maghrib: "weather-sunset-down",
  Isha: "weather-night",
  Qiyam: "weather-night",
};

// ─── Removed local duplicate — now imported from @/src/utils/time ───────────


const CALC_METHODS = [
  { id: 3,  name: "Muslim World League (MWL)",                  note: "Fajr 18°, Isha 17°",                    region: "Europe, Far East, parts of US" },
  { id: 1,  name: "University Of Islamic Sciences, Karachi (UISK)", note: "Fajr 18°, Isha 18°",                region: "South Asia & parts of Europe" },
  { id: 2,  name: "North America (ISNA)",                       note: "Fajr 15°, Isha 15°",                    region: "North America" },
  { id: 4,  name: "Umm Al-Qura Committee (UQU)",                note: "Fajr 18.5°, Isha 90 minutes after sunset", region: "Saudi Arabia" },
  { id: 5,  name: "Egyptian General Authority of Survey (EGAS)", note: "Fajr 19.5°, Isha 17.5°",               region: "Africa, Syria, Lebanon, Malaysia" },
  { id: 12, name: "Union of Islamic Organisations of France (UOIF)", note: "Fajr 12°, Isha 12°",               region: "France & parts of Europe" },
  { id: 11, name: "Majlis Ugama Islam Singapura (MUIS)",        note: "Fajr 20°, Isha 18°",                    region: "Singapore" },
  { id: 0,  name: "Shia Ithna-Ashari, Leva Institute, Qum (Jafri)", note: "Fajr 16°, Isha 14°",               region: "Iran, Iraq, Shia communities" },
  { id: 20, name: "Sihat/Kemenag",                              note: "Fajr 20°, Isha 18°",                    region: "Indonesia" },
  { id: 18, name: "Tunisian Ministry of Religious Affairs",      note: "Fajr 18°, Isha 18°",                    region: "Tunisia" },
  { id: 17, name: "JAKIM",                                      note: "Fajr 18°, Isha 18°",                    region: "Malaysia" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia", note: "Fajr 16°, Isha 15°",                 region: "Russia & CIS countries" },
  { id: 19, name: "Algerian Ministry of Religious Affairs and Wakfs", note: "Fajr 18°, Isha 17°",              region: "Algeria" },
  { id: 13, name: "Diyanet İşleri Başkanlığı, Turkey",          note: "Fajr 18°, Isha 17°",                    region: "Turkey & surrounding countries" },
  { id: 7,  name: "Institute of Geophysics, University of Tehran", note: "Fajr 17.7°, Isha 14°",               region: "Iran, some Shia communities" },
  { id: 8,  name: "Gulf Region",                                note: "Fajr 19.5°, Isha 90 minutes after sunset", region: "Kuwait, Qatar, UAE, Bahrain" },
  { id: 9,  name: "Kuwait",                                     note: "Fajr 18°, Isha 17.5°",                  region: "Kuwait" },
  { id: 10, name: "Qatar",                                      note: "Fajr 18°, Isha 90 minutes after sunset", region: "Qatar" },
  { id: 16, name: "Dubai (experimental)",                       note: "Fajr 18.2°, Isha 18.2°",                region: "Dubai, UAE" },
  { id: 21, name: "Morocco",                                    note: "Fajr 19°, Isha 17°",                    region: "Morocco" },
  { id: 15, name: "Moonsighting Committee Worldwide",           note: "Fajr 18°, Isha 18°",                    region: "Worldwide (Moonsighting.com)" },
  { id: 22, name: "Comunidade Islamica de Lisboa",               note: "Fajr 18°, Isha 77 min after Maghrib",   region: "Portugal" },
  { id: 23, name: "Ministry of Awqaf, Jordan",                  note: "Fajr 18°, Isha 18°",                    region: "Jordan" },
];

const JURISTIC_METHODS = [
  { id: 0, name: "Shafi / Maliki / Hanbali", note: "Standard Asr" },
  { id: 1, name: "Hanafi", note: "Later Asr" },
];

export default function PrayerTimesScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const { profile, user, isGuest } = useAuth();
  const { showPremiumModal } = usePremiumModal();
  
  const [times, setTimes] = useState<Record<string, string> | null>(null);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrayerSettings>({ method: 1, juristic: 0, adhanEnabled: {}, offsets: {} });
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showJuristicPicker, setShowJuristicPicker] = useState(false);
  const [showOffsetPicker, setShowOffsetPicker] = useState(false);
  const [now, setNow] = useState(new Date());
  
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    (async () => {
      const connected = await getGoogleCalendarConnected();
      setCalendarConnected(connected);
    })();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const load = async (s?: PrayerSettings) => {
    setLoading(true);
    setErr(null);
    const usedSettings = s || settings;
    try {
      const loc = await resolveUserLocation();
      setCity(loc.city);

      // ── Resilient fetch: 8 s timeout + 2 retries ──────────────────────────
      const fetchWithRetry = async (url: string, retries = 2): Promise<any> => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const r = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            return await r.json();
          } catch (e: any) {
            if (attempt === retries) throw e;
            await new Promise(res => setTimeout(res, 1200 * (attempt + 1)));
          }
        }
      };

      const url = `https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lon}&method=${usedSettings.method}&school=${usedSettings.juristic}`;
      const j = await fetchWithRetry(url);
      const timings = j?.data?.timings || null;
      setTimes(timings);
      if (timings) {
        await savePrayerTimingsCache({
          timings,
          date: localDateKey(),
          latitude: loc.lat,
          longitude: loc.lon,
          method: usedSettings.method,
          juristic: usedSettings.juristic,
          source: "remote",
          savedAt: Date.now(),
        });
        await schedulePrayerNotifications(timings, usedSettings.adhanEnabled);
        // Also keep goal notifications in sync with the latest prayer times
        try {
          const activeIds = await getActiveGoalIds();
          const goalTimes = await getGoalNotifTimes();
          await scheduleGoalNotifications(activeIds, timings, goalTimes);
        } catch (e) {
          console.error("Failed to reschedule goal notifications after prayer refresh:", e);
        }
      }

      let hijriStr = "";
      if (j?.data?.date?.hijri) {
        const h = j.data.date.hijri;
        const day = parseInt(h.day, 10);
        let suffix = "th";
        if (day % 10 === 1 && day !== 11) suffix = "st";
        else if (day % 10 === 2 && day !== 12) suffix = "nd";
        else if (day % 10 === 3 && day !== 13) suffix = "rd";
        hijriStr = `${day}${suffix} ${h.month.en} ${h.year}`;
      } else {
        hijriStr = j?.data?.date?.readable || new Date().toDateString();
      }
      setDate(hijriStr);
    } catch {
      // ── Offline fallback: calculate local prayer times offline ────────────────
      try {
        const loc = await resolveUserLocation().catch(() => null);
        const cached = await getPrayerTimingsCache();
        const isCurrentCache = cached && loc
          && cached.date === localDateKey()
          && cached.method === usedSettings.method
          && cached.juristic === usedSettings.juristic
          && Math.abs(cached.latitude - loc.lat) < 0.02
          && Math.abs(cached.longitude - loc.lon) < 0.02;
        if (isCurrentCache) {
          setTimes(cached.timings);
          setErr("Showing cached prayer times (offline mode).");
        } else {
          const fallbackLocation = loc || { lat: 21.4225, lon: 39.8262, city: "Makkah" };
          const localTimes = calculateLocalPrayerTimes({
            latitude: fallbackLocation.lat,
            longitude: fallbackLocation.lon,
            method: usedSettings.method,
            juristic: usedSettings.juristic,
          });
          setTimes(localTimes);
          await savePrayerTimingsCache({
            timings: localTimes,
            date: localDateKey(),
            latitude: fallbackLocation.lat,
            longitude: fallbackLocation.lon,
            method: usedSettings.method,
            juristic: usedSettings.juristic,
            source: "calculated",
            savedAt: Date.now(),
          });
          await schedulePrayerNotifications(localTimes, usedSettings.adhanEnabled);
          setErr("Estimated offline prayer times. Please verify when online.");
        }
      } catch {
        const localTimes = calculateLocalPrayerTimes({ latitude: 21.4225, longitude: 39.8262 });
        setTimes(localTimes);
      }
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      const s = await getPrayerSettings();
      setSettings(s);
      await load(s);
    })();
  }, []);

  const handleCalendarSync = async () => {
    if (profile?.tier !== "premium" && !profile?.trialActive) {
      showPremiumModal("Prayer Times — Google Calendar Sync");
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
      
      const hijriDate = date;
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

  const getPrayerTime = useCallback((p: string) => {
    if (!times) return "";
    let baseTime = times[p];
    if (p === "Qiyam") baseTime = times["Lastthird"] || times["Midnight"] || "";
    if (!baseTime) return "";
    
    const offsetMin = settings.offsets?.[p] || 0;
    if (offsetMin === 0) return baseTime;
    
    try {
      const [hStr, mStr] = baseTime.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return baseTime;
      
      const dateObj = new Date();
      dateObj.setHours(h, m, 0, 0);
      const adjustedDate = new Date(dateObj.getTime() + offsetMin * 60 * 1000);
      const adjustedH = String(adjustedDate.getHours()).padStart(2, "0");
      const adjustedM = String(adjustedDate.getMinutes()).padStart(2, "0");
      return `${adjustedH}:${adjustedM}`;
    } catch {
      return baseTime;
    }
  }, [times, settings]);


  const nextPrayer = (() => {
    if (!times) return null;
    for (const p of PRAYERS) {
      const timeStr = getPrayerTime(p);
      if (!timeStr) continue;
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      if (d > now) return { name: p, time: timeStr };
    }
    return null;
  })();

  const toggleAdhan = useCallback(async (prayer: string, val: boolean) => {
    if (val && profile?.tier !== "premium" && !profile?.trialActive) {
      showPremiumModal("Adhan Notifications");
      return;
    }
    const newSettings = { ...settings, adhanEnabled: { ...settings.adhanEnabled, [prayer]: val } };
    setSettings(newSettings);
    await savePrayerSettings(newSettings);
    if (times) {
      const res = await schedulePrayerNotifications(times, newSettings.adhanEnabled);
      if (!res.success && res.error === 'permission' && Platform.OS !== 'web') {
        Alert.alert(
          "Notification Permission Required",
          "Notification permissions are currently denied. Please enable them in settings to receive Adhan alerts.",
          [{ text: "OK" }]
        );
      }
    }
  }, [settings, times, profile?.tier]);

  const selectMethod = async (id: number) => {
    const newSettings = { ...settings, method: id };
    setSettings(newSettings);
    await savePrayerSettings(newSettings);
    setShowMethodPicker(false);
    await load(newSettings);
  };

  const selectJuristic = async (id: number) => {
    const newSettings = { ...settings, juristic: id };
    setSettings(newSettings);
    await savePrayerSettings(newSettings);
    setShowJuristicPicker(false);
    await load(newSettings);
  };

  const renderPrayer = useCallback(({ item: p }: { item: string }) => {
    const isCurrent = nextPrayer?.name === p;
    const rawTime = getPrayerTime(p);
    const formattedTime = format12Hour(rawTime);
    const hasAdhan = p !== "Sunrise" && p !== "Qiyam";
    const adhanOn = settings.adhanEnabled[p] ?? true;
    return (
      <View style={[styles.row, { backgroundColor: isCurrent ? colors.brand + "18" : colors.surfaceSecondary }, isCurrent && { borderWidth: 1, borderColor: colors.brand }]}>
        <MaterialCommunityIcons name={PRAYER_ICONS[p] as any} size={22} color={isCurrent ? colors.brand : colors.onSurfaceMuted} />
        <Text style={[styles.rowName, { color: isCurrent ? colors.brand : colors.onSurface }]}>{t(p.toLowerCase())}</Text>
        <Text style={[styles.rowTime, { color: isCurrent ? colors.brand : colors.onSurface }]}>{formattedTime || "--:--"}</Text>
        {isCurrent && <View style={[styles.nextBadge, { backgroundColor: colors.brand }]}><Text style={styles.nextBadgeTxt}>{t("next")}</Text></View>}
        {hasAdhan ? (
          <Pressable onPress={() => toggleAdhan(p, !adhanOn)} hitSlop={8} testID={`toggle-adhan-${p}`}>
            <MaterialCommunityIcons
              name={adhanOn ? "volume-high" : "volume-off"}
              size={20}
              color={adhanOn ? colors.brand : colors.onSurfaceMuted}
            />
          </Pressable>
        ) : (
          <View style={{ width: 20, alignItems: "center" }}>
            <Text style={{ color: colors.onSurfaceMuted, fontSize: 14 }}>•</Text>
          </View>
        )}
      </View>
    );
  }, [times, nextPrayer, settings, colors, getPrayerTime, toggleAdhan]);

  const currentMethod = CALC_METHODS.find(m => m.id === settings.method);
  const currentJuristic = JURISTIC_METHODS.find(j => j.id === settings.juristic);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Hero Header */}
      <LinearGradient colors={["#1E40AF", "#0EA5E9"]} style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.title}>{t("prayerTimes")}</Text>
            <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <Pressable onPress={() => router.push("/qibla" as any)} hitSlop={10}>
                <MaterialCommunityIcons name="compass" size={26} color="#fff" />
              </Pressable>
              <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
                <MaterialCommunityIcons name="home-outline" size={24} color="#fff" />
              </Pressable>
              <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
                <MaterialCommunityIcons name="cog-outline" size={24} color="#fff" />
              </Pressable>
            </View>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroDate}>{date}</Text>
            {nextPrayer ? (
              <View style={styles.nextBox}>
                <Text style={styles.nextName}>{t(nextPrayer.name.toLowerCase())}</Text>
                <Text style={styles.nextTime}>{format12Hour(nextPrayer.time)}</Text>
              </View>
            ) : (
              <View style={styles.nextBox}>
                <Text style={styles.nextLabel}>{t("allPrayersComplete")}</Text>
                <Text style={styles.nextName}>{t("alhamdulillah")}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          {[...Array(6)].map((_, i) => (
            <SkeletonBone key={i} width="100%" height={56} borderRadius={14} />
          ))}
        </View>
      ) : err && !times ? (
        /offline|cached|connection|network/i.test(err) ? (
          <AppOfflineState
            description={err}
            onRetry={() => load()}
            style={styles.errBox}
          />
        ) : (
          <AppErrorState
            description={err}
            onRetry={() => load()}
            style={styles.errBox}
          />
        )
      ) : (
        <FlatList
          data={PRAYERS}
          keyExtractor={p => p}
          renderItem={renderPrayer}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}
          windowSize={5}
          removeClippedSubviews
          ListHeaderComponent={
            err ? (
              <AppStatusBanner
                actionLabel={t("retry")}
                kind="offline"
                message={err}
                onAction={() => load()}
                style={styles.offlineBanner}
                title="Using offline prayer times"
              />
            ) : null
          }
          ListFooterComponent={
            <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
              {/* Prayer Logs Row */}
              <Pressable onPress={() => router.push("/previous-goals")}
                style={[styles.settingRowFull, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <MaterialCommunityIcons name="format-list-bulleted" size={20} color={colors.onSurface} style={{ marginRight: 12 }} />
                  <Text style={[styles.settingLabel, { color: colors.onSurface, fontWeight: "700" }]}>Your Prayer logs are moved here</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>

              {/* Monthly Timetable & Calendar Sync row */}
              <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
                <Pressable onPress={() => router.push("/hijri-calendar")}
                  style={[styles.halfCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.onSurface} style={{ marginRight: 8 }} />
                  <Text style={[styles.halfCardText, { color: colors.onSurface, fontWeight: "700" }]} numberOfLines={1}>Monthly Timetable</Text>
                </Pressable>

                <Pressable onPress={() => router.push("/calendar-sync")}
                  style={[styles.halfCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <View style={{ width: 20, height: 20, marginRight: 8, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 12, height: 12, backgroundColor: '#4285F4', borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 7, fontWeight: 'bold', lineHeight: 8 }}>31</Text>
                    </View>
                  </View>
                  <Text style={[styles.halfCardText, { color: colors.onSurface, fontWeight: "700" }]} numberOfLines={1}>Sync with Calendar</Text>
                </Pressable>
              </View>

              {/* Juristic Method */}
              <Pressable onPress={() => setShowJuristicPicker(true)}
                style={[styles.settingRow, { backgroundColor: colors.surfaceSecondary }]}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>{t("juristicMethod")}</Text>
                  <Text style={[styles.settingValue, { color: colors.onSurfaceMuted }]}>
                    {settings.juristic === 0 ? t("standardSchool") : t("hanafiSchool")}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>

              {/* Calculation Method */}
              <Pressable onPress={() => setShowMethodPicker(true)}
                style={[styles.settingRow, { backgroundColor: colors.surfaceSecondary }]}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>{t("calculationMethod")}</Text>
                  <Text style={[styles.settingValue, { color: colors.onSurfaceMuted }]}>{currentMethod?.name}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>

              {/* Time Correction Adjustment */}
              <Pressable onPress={() => setShowOffsetPicker(true)}
                style={[styles.settingRow, { backgroundColor: colors.surfaceSecondary }]}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Manual Time Correction</Text>
                  <Text style={[styles.settingValue, { color: colors.onSurfaceMuted }]}>
                    Adjust prayer times manually (± minutes)
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
          }
        />
      )}

      {/* Calculation Method Picker Modal */}
      <Modal visible={showMethodPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>{t("calculationMethod")}</Text>
              <AppIconButton
                accessibilityLabel="Close calculation method"
                icon="close"
                onPress={() => setShowMethodPicker(false)}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CALC_METHODS.map((m, idx) => (
                <Pressable key={`${m.id}-${idx}`} onPress={() => selectMethod(m.id)}
                  style={[styles.pickerRow, { backgroundColor: m.id === settings.method ? colors.brand + "18" : "transparent", borderBottomWidth: idx < CALC_METHODS.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerName, { color: m.id === settings.method ? colors.brand : colors.onSurface }]}>{m.name}</Text>
                    <Text style={[styles.pickerNote, { color: colors.onSurfaceMuted }]}>{m.note}</Text>
                  </View>
                  {m.id === settings.method && <MaterialCommunityIcons name="check-circle" size={22} color={colors.brand} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Juristic Method Picker Modal */}
      <Modal visible={showJuristicPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>{t("juristicMethod")}</Text>
              <AppIconButton
                accessibilityLabel="Close juristic method"
                icon="close"
                onPress={() => setShowJuristicPicker(false)}
              />
            </View>
            {JURISTIC_METHODS.map(j => (
              <Pressable key={j.id} onPress={() => selectJuristic(j.id)}
                style={[styles.pickerRow, { backgroundColor: j.id === settings.juristic ? colors.brand + "18" : "transparent" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerName, { color: colors.onSurface }]}>{j.name}</Text>
                  <Text style={[styles.pickerNote, { color: colors.onSurfaceMuted }]}>{j.note}</Text>
                </View>
                {j.id === settings.juristic && <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      {/* Manual Time Correction Modal */}
      <Modal visible={showOffsetPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Manual Time Correction</Text>
              <AppIconButton
                accessibilityLabel="Close manual time correction"
                icon="close"
                onPress={() => setShowOffsetPicker(false)}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
              {["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha", "Qiyam"].map(p => {
                const currentOffset = settings.offsets?.[p] || 0;
                const updateOffset = async (newVal: number) => {
                  const newOffsets = { ...(settings.offsets || {}), [p]: newVal };
                  const newSettings = { ...settings, offsets: newOffsets };
                  setSettings(newSettings);
                  await savePrayerSettings(newSettings);
                  await load(newSettings);
                };
                return (
                  <View key={p} style={[styles.pickerRow, { justifyContent: "space-between", alignItems: "center" }]}>
                    <View>
                      <Text style={[styles.pickerName, { color: colors.onSurface }]}>{t(p.toLowerCase()) || p}</Text>
                      <Text style={[styles.pickerNote, { color: colors.onSurfaceMuted }]}>
                        Current adjustment: {currentOffset > 0 ? `+${currentOffset}` : currentOffset} min
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <AppIconButton
                        accessibilityLabel={`Decrease ${p} adjustment`}
                        icon="minus"
                        onPress={() => updateOffset(currentOffset - 1)}
                        size={20}
                        variant="tonal"
                      />
                      <Text style={{ minWidth: 32, textAlign: "center", color: colors.onSurface, fontWeight: "700" }}>
                        {currentOffset}
                      </Text>
                      <AppIconButton
                        accessibilityLabel={`Increase ${p} adjustment`}
                        icon="plus"
                        onPress={() => updateOffset(currentOffset + 1)}
                        size={20}
                        variant="tonal"
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, position: "relative" },
  title: { position: "absolute", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 18, fontWeight: "700", zIndex: -1 },
  heroContent: { alignItems: "center", paddingVertical: 8 },
  heroDate: { color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: 16, textAlign: "center" },
  heroCity: { color: "rgba(255,255,255,0.75)", marginTop: 2, fontSize: 13, textAlign: "center" },
  nextBox: { alignItems: "center", marginTop: 8 },
  nextLabel: { color: "rgba(255,255,255,0.8)", fontWeight: "600", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" },
  nextName: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4, textAlign: "center" },
  nextTime: { color: "#fff", fontSize: 38, fontWeight: "800", textAlign: "center" },
  row: { flexDirection: "row", alignItems: "center", padding: theme.spacing.lg, borderRadius: theme.radius.lg, gap: theme.spacing.md, height: 72 },
  rowName: { flex: 1, fontSize: 16, fontWeight: "600" },
  rowTime: { fontSize: 17, fontWeight: "700" },
  nextBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  nextBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  errBox: { padding: theme.spacing.xl, alignItems: "center", gap: theme.spacing.md },
  offlineBanner: { marginBottom: theme.spacing.md },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: theme.spacing.lg, borderRadius: theme.radius.lg },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingValue: { fontSize: 13, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.lg, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  pickerRow: { flexDirection: "row", alignItems: "center", padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: 4 },
  pickerName: { fontSize: 15, fontWeight: "600" },
  pickerNote: { fontSize: 12, marginTop: 2 },
  settingRowFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  halfCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
  },
  halfCardText: {
    fontSize: 12,
    flex: 1,
  },
});
