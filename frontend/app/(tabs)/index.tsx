import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated, ImageBackground, Image, Modal, Alert, RefreshControl, FlatList, InteractionManager,
} from "react-native";
import Reanimated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "@/src/localization";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format12Hour } from "@/src/utils/time";

import { theme } from "@/src/theme";
import { getElevation } from "@/src/elevation";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { PrayerCardSkeleton } from "@/src/components/SkeletonLoader";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";
import { DEFAULT_GOALS, CATEGORY_COLORS, Goal } from "@/src/data/goals";
import { SURAH_LIST } from "@/src/data/surahList";
import { SELECTABLE_ADHKAAR, DHIKRS } from "@/src/data/dhikrs";
// Note: duas.ts (608 KB) is lazily required inside a deferred effect to keep it off the startup import graph and first paint
import {
  resolveUserLocation, getCompletedGoals, toggleGoal,
  getActiveGoalIds, getPrayerSettings, schedulePrayerNotifications, updateStickyPrayerNotification,
  getMenstrualModeActive, setMenstrualModeActive,
  getGoogleCalendarConnected, setGoogleCalendarConnected,
  getGoogleCalendarDismissed, setGoogleCalendarDismissed,
  getDailyDhikrCounts, saveDailyDhikrCounts,
  getPrayerCompletions, savePrayerCompletions,
  saveActiveGoalIds, getGoalNotifTimes, scheduleGoalNotifications,
  getPrayerTimingsCache,
} from "@/src/storage";
import { useTabBarVisibility } from "@/src/TabBarVisibilityContext";
import { Image as ExpoImage } from "expo-image";
import {
  AppIconButton,
  AppSwitch,
  AppTextInput,
} from "@/src/components/ui";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

import { PRAYERS, RING, STROKE, RADIUS, CIRC, fetchIslamicEvents, getNextIslamicEvent, QUICK_ACTIONS, HOME_QUICK_ACTIONS, getGreeting, getHijriDate, getPrayerPeriods } from "@/src/data/homeScreenHelpers";
import { styles } from "@/src/data/homeScreenStyles";
import { HomeScreenModals } from "@/src/components/HomeScreenModals";

// ── Isolated prayer countdown ring ────────────────────────────────────────────────
// The 1-second tick lives in this small memoized component so each interval
// update re-renders ONLY the ring — not the entire ~3,000-line Home screen.
// The sticky prayer notification update (throttled to once/minute) lives here too.
const PrayerCountdownRing = memo(function PrayerCountdownRing({ times }: { times: Record<string, string> | null }) {
  const { language, colors } = useTheme();
  const { t } = useTranslation(language);
  const [countdown, setCountdown] = useState("--:--:--");
  const [progress, setProgress] = useState(0);
  const lastNotifMin = useRef<number | null>(null);

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
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [times]);

  const periods = times ? getPrayerPeriods(times) : null;
  if (!periods) return null;
  const strokeDash = (1 - progress) * CIRC;

  return (
    <View style={styles.ringWrap}>
      <Svg width={RING} height={RING}>
        <Circle cx={RING/2} cy={RING/2} r={RADIUS} stroke={colors.brand} strokeWidth={STROKE} fill="transparent" opacity={0.85} />
        <Circle
          cx={RING/2} cy={RING/2} r={RADIUS}
          stroke="#FFFFFF" strokeWidth={STROKE} fill="transparent"
          strokeDasharray={CIRC} strokeDashoffset={strokeDash}
          strokeLinecap="round" rotation="-90" origin={`${RING/2},${RING/2}`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.75)" }}>
          {t(periods.next.name.toLowerCase())}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "900", color: "#FFFFFF", marginTop: 2 }}>
          {countdown}
        </Text>
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const { profile, user, isGuest } = useAuth();
  const { showPremiumModal } = usePremiumModal();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const { scrollHandler } = useTabBarVisibility();
  // Prayer times & countdown
  const [times, setTimes] = useState<Record<string, string> | null>(null);
  const [city, setCity] = useState("");

  const prayerPeriods = useMemo(() => times ? getPrayerPeriods(times) : null, [times]);
  const greeting = useMemo(() => getGreeting(prayerPeriods?.current?.name), [prayerPeriods?.current?.name]);
  const hijri = useMemo(() => getHijriDate(), []);
  const nextIslamicEvent = useMemo(() => getNextIslamicEvent([]), []);
  const [dynamicIslamicEvent, setDynamicIslamicEvent] = useState(nextIslamicEvent);
  useEffect(() => {
    // Deferred: cache/network event lookup runs after the open transition
    const task = InteractionManager.runAfterInteractions(() => {
      fetchIslamicEvents().then(events => {
        const next = getNextIslamicEvent(events);
        if (next) setDynamicIslamicEvent(next);
      }).catch(() => {});
    });
    return () => task.cancel();
  }, []);

  // Time-aware greeting gradient + Arabic phrase
  const greetingGrad = useMemo((): [string, string] => {
    const h = new Date().getHours();
    if (h < 5) return ["#0D1B2A", "#1B2838"];
    if (h < 12) return ["#0B2D25", "#065F46"];
    if (h < 16) return ["#1E3A5F", "#1B6CA8"];
    if (h < 20) return ["#3B1F63", "#6D28D9"];
    return ["#0D1B2A", "#1B2838"];
  }, []);
  const arabicGreeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return { arabic: "اللَّيْلُ مُبَارَكٌ", english: "Blessed night" };
    if (h < 12) return { arabic: "صَبَاحُ الْخَيْرِ", english: greeting.sub };
    if (h < 17) return { arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا", english: greeting.sub };
    if (h < 20) return { arabic: "مَسَاءُ الْخَيْرِ", english: greeting.sub };
    return { arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا", english: "Blessed evening" };
  }, [greeting]);

  // Goals
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeIds, setActiveIds] = useState<string[]>([]);
  const [customGoals, setCustomGoals] = useState<Goal[]>([]);
  const [expandPrayersInline, setExpandPrayersInline] = useState(false);

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
  const [quickActionOrder, setQuickActionOrder] = useState<string[]>(HOME_QUICK_ACTIONS.map(action => action.id));
  const [reorderFrom, setReorderFrom] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  // Quran last-read (Continue Reading widget)
  const [lastReadQuran, setLastReadQuran] = useState<{ surahNumber: number; surahName: string; ayahNumber?: number } | null>(null);
  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const loc = await resolveUserLocation();
      setCity(loc.city);
      const settings = await getPrayerSettings();
      const url = `https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lon}&method=${settings.method}&school=${settings.juristic}`;
      const r = await fetch(url);
      const j = await r.json();
      if (j?.data?.timings) setTimes(j.data.timings);
    } catch {
      // On refresh failure, keep showing whatever is already on screen
      if (__DEV__) console.warn('[Home] Refresh fetch failed — keeping current times');
    }
    setRefreshing(false);
  }, []);
  const orderedQuickActions = useMemo(() => {
    const actionsById = new Map(HOME_QUICK_ACTIONS.map(action => [action.id, action]));
    const saved = quickActionOrder.map(id => actionsById.get(id)).filter(Boolean) as any[];
    return [...saved, ...HOME_QUICK_ACTIONS.filter(action => !quickActionOrder.includes(action.id))];
  }, [quickActionOrder]);

  // Action sheet for 3 dots goal menu
  const [activeActionGoal, setActiveActionGoal] = useState<Goal | null>(null);

  // Custom goal states
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<"prayer" | "quran" | "dhikr" | "other">("other");
  const [surahSearch, setSurahSearch] = useState("");
  const [dhikrSearch, setDhikrSearch] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("hikmah:home-quick-action-order:v1").then(raw => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) setQuickActionOrder(saved.filter((id): id is string => typeof id === "string"));
      } catch {}
    }).catch(() => {});
  }, []);

  // Confetti particles for completion celebration
  const [allCompletedModalVisible, setAllCompletedModalVisible] = useState(false);
  const lastDoneCount = useRef(0);
  const confettiParticles = useRef(Array(65).fill(0).map(() => ({
    x: Math.random() * width,
    y: new Animated.Value(-100),
    rotate: new Animated.Value(0),
    scale: Math.random() * 0.7 + 0.3,
    color: ["#FF5A5F", "#3b82f6", "#10b981", "#fbbf24", "#8b5cf6", "#f43f5e", "#06b6d4", "#eab308"][Math.floor(Math.random() * 8)],
    shape: Math.random() > 0.5 ? "rect" : "circle",
    drift: Math.random() * 100 - 50
  }))).current;

  // Load prayer times — network first, cache fallback for offline/travel
  // Deferred until after the open transition so first paint is never blocked.
  useEffect(() => {
    const prayerLoadTask = InteractionManager.runAfterInteractions(() => {
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
          schedulePrayerNotifications(fetchedTimings, settings.adhanEnabled).catch((e) => console.error(e));
        }
      } catch (e) {
        if (__DEV__) console.warn('[Home] Aladhan fetch failed — loading from cache:', e);
        // A3: Offline fallback — show cached timings so the prayer card is never blank
        const cached = await getPrayerTimingsCache();
        if (cached?.timings) {
          setTimes(cached.timings);
          if ((cached as any).city) setCity((cached as any).city);
        }
      }
    })();
    });
    return () => prayerLoadTask.cancel();
  }, []);

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

        // Auto-reconcile dhikr goals if activeIds is missing them
        const defaultDhikrIds = ['morning-adhkar', 'evening-adhkar', 'sleep-adhkar', 'dhikr-after-salah', 'istighfar-100'];
        let validIds = ids;
        if (!ids.some(id => defaultDhikrIds.includes(id))) {
          validIds = Array.from(new Set([...ids, ...defaultDhikrIds]));
          saveActiveGoalIds(validIds);
        }
        setActiveIds(validIds);

        setMenstrualMode(menstrual);
        setCalendarConnected(calConnected);
        setCalendarDismissed(calDismissed);
        setDhikrCounts(dCounts || {});
        setPrayerCompletions(pCompletions || { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false });

        const parsedCount = sa !== null ? parseInt(sa, 10) : 5;
        setSelectedAdhkarCount(isNaN(parsedCount) || parsedCount <= 0 ? 5 : parsedCount);

        const loadedCustom = customRaw ? JSON.parse(customRaw) : [];
        setCustomGoals(loadedCustom);

        // Load last-read Quran position for Continue Reading widget
        try {
          const lrqRaw = await AsyncStorage.getItem("hikmah:quran-last-read:v1");
          if (lrqRaw) {
            const parsed = JSON.parse(lrqRaw);
            if (parsed?.surahNumber) setLastReadQuran(parsed);
          }
        } catch {}
      })();
    }, [])
  );

  const allGoals = useMemo(() => {
    return [...DEFAULT_GOALS, ...customGoals];
  }, [customGoals]);

  // duas.ts is 608 KB — parse + build the combined list only AFTER the open
  // transition completes, so the first paint of Home is never blocked by it.
  const [allDhikrAndDuaOptions, setAllDhikrAndDuaOptions] = useState<{ id: string; title: string; arabic: string; transliteration?: string; translation?: string; categoryTag: string }[]>([]);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { CATEGORIES: DUA_CATEGORIES } = require('@/src/data/duas');
      const list: { id: string; title: string; arabic: string; transliteration?: string; translation?: string; categoryTag: string }[] = [];
      const seenIds = new Set<string>();

      SELECTABLE_ADHKAAR.forEach(item => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          list.push({
            id: item.id,
            title: item.title,
            arabic: item.arabic,
            transliteration: item.transliteration,
            translation: item.translation,
            categoryTag: "Daily Adhkar"
          });
        }
      });

      DUA_CATEGORIES.forEach((cat: any) => {
        cat.duas.forEach((d: any) => {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            list.push({
              id: d.id,
              title: d.title,
              arabic: d.arabic,
              transliteration: d.transliteration,
              translation: d.translation,
              categoryTag: cat.title
            });
          }
        });
      });

      DHIKRS.forEach(d => {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          list.push({
            id: d.id,
            title: d.transliteration,
            arabic: d.arabic,
            transliteration: d.transliteration,
            translation: d.translation,
            categoryTag: "Dhikr"
          });
        }
      });

      setAllDhikrAndDuaOptions(list);
    });
    return () => task.cancel();
  }, []);

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
        if (menstrualMode || prayerCompletions[prayerName] || completed.includes(g.id)) counts.prayer.done++;
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
    if (totalGoals > 0 && totalDone >= totalGoals && lastDoneCount.current < totalGoals) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setAllCompletedModalVisible(true);
    }
    lastDoneCount.current = totalDone;
  }, [totalDone, totalGoals]);

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

  const isGoalEnabledAtCurrentTime = useCallback((goalId: string): { enabled: boolean; reason?: string } => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMin;
    const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu

    const getPrayerTimeInfo = (pName: string, fallbackH: number, fallbackM: number = 0) => {
      if (times && times[pName]) {
        const [h, m] = times[pName].split(":").map(Number);
        return { minutes: h * 60 + m, formatted: format12Hour(times[pName]) };
      }
      const formatted = `${fallbackH > 12 ? fallbackH - 12 : fallbackH}:${String(fallbackM).padStart(2, "0")} ${fallbackH >= 12 ? "PM" : "AM"}`;
      return { minutes: fallbackH * 60 + fallbackM, formatted };
    };

    // 1. Monday & Thursday Fasting locks
    if (goalId === "fast-monday" || goalId.includes("fast-monday")) {
      if (currentDay !== 1) return { enabled: false, reason: "Available on Mondays" };
    }
    if (goalId === "fast-thursday" || goalId.includes("fast-thursday")) {
      if (currentDay !== 4) return { enabled: false, reason: "Available on Thursdays" };
    }

    // 2. Obligatory Prayers locks
    if (["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(goalId)) {
      const pName = goalId.charAt(0).toUpperCase() + goalId.slice(1);
      const pInfo = getPrayerTimeInfo(pName, pName === "Fajr" ? 4 : pName === "Dhuhr" ? 12 : pName === "Asr" ? 15 : pName === "Maghrib" ? 18 : 19, 30);
      if (currentTimeVal < pInfo.minutes) {
        return { enabled: false, reason: `Starts at ${pInfo.formatted}` };
      }
    }

    // 3. Tahajjud Prayer (Qiyam time)
    if (goalId === "tahajjud" || goalId.includes("tahajjud")) {
      const fajrInfo = getPrayerTimeInfo("Fajr", 4, 30);
      const qiyamInfo = times?.Lastthird
        ? { minutes: times.Lastthird.split(":").map(Number)[0] * 60 + times.Lastthird.split(":").map(Number)[1], formatted: format12Hour(times.Lastthird) }
        : { minutes: 1 * 60, formatted: "01:00 AM" };
      const isQiyamTime = (currentTimeVal >= qiyamInfo.minutes || currentTimeVal < fajrInfo.minutes) && (currentHour >= 23 || currentHour < 6);
      if (!isQiyamTime) {
        return { enabled: false, reason: `Available at Qiyam (${qiyamInfo.formatted})` };
      }
    }

    // 4. Dynamic prayer-time window logic for Adhkars and Surah Mulk
    if (goalId === "morning-adhkar") {
      const fajrInfo = getPrayerTimeInfo("Fajr", 4, 30);
      if (currentTimeVal < fajrInfo.minutes) {
        return { enabled: false, reason: `Available after Fajr (${fajrInfo.formatted})` };
      }
    }
    if (goalId === "evening-adhkar") {
      const asrInfo = getPrayerTimeInfo("Asr", 16, 0);
      if (currentTimeVal < asrInfo.minutes) {
        return { enabled: false, reason: `Available after Asr (${asrInfo.formatted})` };
      }
    }
    if (goalId === "sleep-adhkar") {
      const ishaInfo = getPrayerTimeInfo("Isha", 19, 30);
      if (currentTimeVal < ishaInfo.minutes) {
        return { enabled: false, reason: `Available after Isha (${ishaInfo.formatted})` };
      }
    }
    if (goalId === "surah-mulk") {
      const ishaInfo = getPrayerTimeInfo("Isha", 19, 30);
      if (currentTimeVal < ishaInfo.minutes) {
        return { enabled: false, reason: `Available after Isha (${ishaInfo.formatted})` };
      }
    }

    const isCompleted = completed.includes(goalId) || (["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(goalId) && prayerCompletions[goalId.charAt(0).toUpperCase() + goalId.slice(1)]);
    if (isCompleted || menstrualMode) return { enabled: true };

    return { enabled: true };
  }, [completed, prayerCompletions, menstrualMode, times]);

  const handleGoalLongPress = useCallback(async (goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (["morning-adhkar", "evening-adhkar", "sleep-adhkar", "dhikr-after-salah", "istighfar-100", "strengthen-imaan", "for-forgiveness", "for-thanking-allah", "for-glorifying-allah"].includes(goalId)) {
      router.push("/adhkar");
    } else if (goalId === "surah-mulk" || goalId.includes("surah-67")) {
      router.push("/quran/67");
    } else if (goalId === "surah-kahaf" || goalId.includes("surah-18")) {
      router.push("/quran/18");
    } else if (goalId.startsWith("custom-surah-")) {
      const parts = goalId.split("-");
      const surahNum = parts[2];
      if (surahNum) router.push(`/quran/${surahNum}`);
      else router.push("/quran/read/1");
    } else if (goalId === "quran-5min") {
      try {
        const lastPage = await AsyncStorage.getItem("hikmah:last_quran_page");
        if (lastPage && !isNaN(Number(lastPage))) {
          router.push(`/quran/read/${lastPage}`);
        } else {
          router.push("/quran/read/1");
        }
      } catch {
        router.push("/quran/read/1");
      }
    }
  }, [router]);

  const renderInlineGoalItem = (goal: Goal) => {
    const timeStatus = isGoalEnabledAtCurrentTime(goal.id);
    const isLocked = !timeStatus.enabled;
    const catColor = CATEGORY_COLORS[goal.category] || colors.brand;
    const isSpecialAdhkar = ['morning-adhkar', 'evening-adhkar', 'sleep-adhkar'].includes(goal.id);
    const isDhikr = goal.category === 'dhikr' && !isSpecialAdhkar;
    const dhikrCount = dhikrCounts[goal.id] || 0;
    const isCompleted = completed.includes(goal.id) || (["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(goal.id) && prayerCompletions[goal.id.charAt(0).toUpperCase() + goal.id.slice(1)]);
    const titleText = isDhikr ? `${goal.title} (${dhikrCount}/3)` : goal.title;

    const handlePressGoal = () => {
      if (isLocked) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        Alert.alert("Goal Not Active Yet", `${goal.title} is locked. ${timeStatus.reason}.`);
        return;
      }
      if (["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(goal.id)) {
        const pName = goal.id.charAt(0).toUpperCase() + goal.id.slice(1);
        togglePrayerCompletion(pName);
      } else if (isDhikr) {
        handleDhikrTap(goal.id);
      } else {
        handleGoalTap(goal.id);
      }
    };

    return (
      <View key={goal.id} style={[styles.goalRowItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, opacity: isLocked ? 0.55 : 1 }]}>
        <Pressable
          onPress={handlePressGoal}
          onLongPress={() => handleGoalLongPress(goal.id)}
          style={styles.goalCheckArea}
        >
          <View style={[styles.goalCircleCheck, { borderColor: isLocked ? colors.onSurfaceMuted : catColor, backgroundColor: isCompleted ? catColor : "transparent" }]}>
            {isCompleted ? (
              <MaterialCommunityIcons name="check" size={14} color="#fff" />
            ) : isLocked ? (
              <MaterialCommunityIcons name="lock-outline" size={12} color={colors.onSurfaceMuted} />
            ) : null}
          </View>
        </Pressable>

        <Pressable
          onPress={handlePressGoal}
          onLongPress={() => handleGoalLongPress(goal.id)}
          style={{ flex: 1 }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text style={[styles.goalItemTitle, { color: isLocked ? colors.onSurfaceMuted : colors.onSurface, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
              {titleText}
            </Text>
            {isLocked && timeStatus.reason && (
              <View style={{ backgroundColor: colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, color: colors.onSurfaceMuted, fontWeight: "600" }}>{timeStatus.reason}</Text>
              </View>
            )}
          </View>
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
    const pId = activePrayerToDisplay.toLowerCase();
    const timeStatus = isGoalEnabledAtCurrentTime(pId);
    const isLocked = !timeStatus.enabled;
    const catColor = CATEGORY_COLORS.prayer;

    return (
      <View key="collapsed-prayer" style={[styles.goalRowItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, opacity: isLocked ? 0.6 : 1 }]}>
        <Pressable
          onPress={() => {
            if (menstrualMode) return;
            if (isLocked) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              Alert.alert("Prayer Time Not Started", `${activePrayerToDisplay} prayer starts at ${timeStatus.reason?.replace("Starts at ", "")}.`);
              return;
            }
            togglePrayerCompletion(activePrayerToDisplay);
          }}
          style={styles.goalCheckArea}
        >
          <View style={[styles.goalCircleCheck, { borderColor: catColor, backgroundColor: isCompleted ? catColor : "transparent" }]}>
            {isCompleted ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : isLocked ? <MaterialCommunityIcons name="lock-outline" size={12} color={colors.onSurfaceMuted} /> : null}
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setExpandPrayersInline(!expandPrayersInline);
          }}
          style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.goalItemTitle, { color: colors.onSurface, textDecorationLine: isCompleted ? 'line-through' : 'none' }]}>
              Offer {activePrayerToDisplay}
            </Text>
            <Text style={[styles.goalItemSub, { color: colors.onSurfaceMuted }]}>
              {expandPrayersInline ? "Tap to collapse" : "Tap to show all 5 prayers"}
            </Text>
          </View>
          <MaterialCommunityIcons name={expandPrayersInline ? "chevron-up" : "chevron-down"} size={20} color={colors.onSurfaceMuted} style={{ marginRight: 8 }} />
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

  const handleQuickActionPress = (action: any) => {
    if (!reorderFrom) {
      handleQuickAction(action);
      return;
    }
    if (reorderFrom === action.id) {
      setReorderFrom(null);
      return;
    }
    setQuickActionOrder(current => {
      const from = current.indexOf(reorderFrom);
      const to = current.indexOf(action.id);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      AsyncStorage.setItem("hikmah:home-quick-action-order:v1", JSON.stringify(next)).catch(() => {});
      return next;
    });
    setReorderFrom(null);
  };

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

      <Reanimated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#00A884"
            colors={["#00A884"]}
            progressBackgroundColor={"#0B2D25"}
          />
        }
      >


        {/* ── Unified Combined Hero Banner (User Greeting + Prayer Times + Countdown Ring) ── */}
        <AnimatedCard
          onPress={() => router.push('/prayer-times')}
          style={{
            marginHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            borderRadius: theme.radius.xl,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: colors.mode === "dark" ? "rgba(0,168,132,0.3)" : "rgba(6,95,70,0.18)",
            ...getElevation(5),
          }}
        >
          <LinearGradient
            colors={colors.mode === "dark" ? ["#0B2D25", "#0A382C", "#10251F"] : ["#065F46", "#047857", "#0F766E"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={{ padding: 18 }}>
            {/* Top User Greeting */}
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", fontFamily: "Figtree_400Regular" }}>
                {arabicGreeting.english}
              </Text>
              <Text style={{ fontSize: 18, color: "#FFFFFF", fontFamily: "Outfit_600SemiBold", fontWeight: "800", marginTop: 2 }}>
                {profile?.name || "Guest User"}
              </Text>
            </View>

            {/* Bottom Current Prayer & Countdown Ring Row */}
            {prayerPeriods ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 26, fontWeight: "900", color: "#FFFFFF" }}>
                    {t(prayerPeriods.current.name.toLowerCase())}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: colors.brand, marginTop: 1 }}>
                    {format12Hour(prayerPeriods.current.timeStr)}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.85)", marginTop: 6 }}>
                    {t("viewAllPrayers")} →
                  </Text>
                </View>

                {/* Countdown Ring on the RIGHT SIDE — isolated memoized component so
                    its 1-second timer re-renders only the ring, not the whole screen */}
                <PrayerCountdownRing times={times} />
              </View>
            ) : null}
          </View>
        </AnimatedCard>

        {/* ── Islamic Event Countdown ── */}
        {dynamicIslamicEvent && (
          <AnimatedCard
            onPress={() => router.push('/articles' as any)}
            style={{ marginHorizontal: 20, marginBottom: 16, borderRadius: theme.radius.lg, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={dynamicIslamicEvent.grad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}
            >
              <View style={{
                width: 52, height: 52, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 26 }}>{dynamicIslamicEvent.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', fontFamily: 'Figtree_400Regular' }}>Coming Soon</Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', fontFamily: 'Outfit_600SemiBold', marginTop: 3 }}>{dynamicIslamicEvent.name}</Text>
              </View>
              <View style={{
                alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
              }}>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', fontFamily: 'Outfit_600SemiBold', lineHeight: 32 }}>{dynamicIslamicEvent.daysLeft}</Text>
                <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 0.5 }}>DAYS</Text>
              </View>
            </LinearGradient>
          </AnimatedCard>
        )}

        {/* ── Quick Actions — single curated grid (restraint pass: no swipeable pages) ── */}
        <View style={styles.quickGrid}>
          {orderedQuickActions.map((a) => (
            <AnimatedCard key={a.id} onPress={() => handleQuickActionPress(a)} onLongPress={() => setReorderFrom(a.id)} delayLongPress={350}
              style={[styles.quickBtn, reorderFrom === a.id && { opacity: 0.45 }, { overflow: "hidden" }]}>
              <View style={styles.quickIconOnly}>
                {"image" in a && a.image ? (
                  <ExpoImage
                    source={a.image}
                    contentFit="contain"
                    style={styles.quickIconImage}
                  />
                ) : (
                  <Text style={styles.quickEmoji}>{"emoji" in a ? a.emoji : "✨"}</Text>
                )}
                {/* Premium lock badge */}
                {(a as any).premium && profile?.tier !== "premium" && !profile?.trialActive && (
                  <View style={styles.quickLockBadge}>
                    <Text style={styles.quickLockEmoji}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.quickLabel, { color: colors.onSurfaceSecondary }]}>{a.label}</Text>
            </AnimatedCard>
          ))}
        </View>
        {reorderFrom ? (
          <Text style={[styles.quickReorderHint, { color: colors.onSurfaceMuted }]}>Tap another icon to swap its position</Text>
        ) : null}

        {/* Connection & Daily Goals Section */}



        {/* Daily Goals Summary */}
        <View style={styles.goalsCard}>
          <LinearGradient
            colors={colors.mode === "dark" ? ["#10231F", "#0E1B18"] : ["#FFFFFF", "#F8FBF7"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.goalsHeader, { flexDirection: 'row', alignItems: 'center' }]}>
            {/* Left: title + subtitle + progress bar */}
            <View style={{ flex: 1, marginRight: 14 }}>
              <Text style={[styles.goalsTitle, { color: colors.onSurface }]}>Today's Goals</Text>
              <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, fontFamily: 'Figtree_400Regular', marginTop: 3 }}>
                {totalDone} of {totalGoals} completed
              </Text>
              <View style={[styles.progressBg, { backgroundColor: colors.surface, marginTop: 10 }]}>
                <View style={[styles.progressFill, { width: `${overallProgress * 100}%`, backgroundColor: colors.brand }]} />
              </View>
            </View>
            {/* Right: SVG Progress Ring */}
            <View style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={68} height={68}>
                <Circle cx={34} cy={34} r={27} stroke={colors.brand + '22'} strokeWidth={6} fill="transparent" />
                <Circle
                  cx={34} cy={34} r={27}
                  stroke={colors.brand} strokeWidth={6} fill="transparent"
                  strokeDasharray={2 * Math.PI * 27}
                  strokeDashoffset={(1 - overallProgress) * 2 * Math.PI * 27}
                  strokeLinecap="round" rotation="-90" origin="34,34"
                />
              </Svg>
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.brand }}>{Math.round(overallProgress * 100)}%</Text>
              </View>
            </View>
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
          {/* Obligatory Prayers Section (if active and not excused) */}
          {activeIds.some(id => ["fajr", "dhuhr", "asr", "maghrib", "isha"].includes(id)) && (
            expandPrayersInline ? (
              <View style={{ gap: 8, marginBottom: 8 }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setExpandPrayersInline(false);
                  }}
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, paddingVertical: 4 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.brand }}>
                    Obligatory Prayers (5)
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>Collapse</Text>
                    <MaterialCommunityIcons name="chevron-up" size={16} color={colors.onSurfaceMuted} />
                  </View>
                </Pressable>

                {["fajr", "dhuhr", "asr", "maghrib", "isha"].map(pId => {
                  const goal = activeGoals.find(g => g.id === pId) || {
                    id: pId,
                    title: `Offer ${pId.charAt(0).toUpperCase() + pId.slice(1)}`,
                    category: "prayer" as const,
                  };
                  return renderInlineGoalItem(goal as Goal);
                })}
              </View>
            ) : (
              renderCollapsedPrayerRow()
            )
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

      </Reanimated.ScrollView>
      <HomeScreenModals
          activeActionGoal={activeActionGoal}
          activeIds={activeIds}
          allCompletedModalVisible={allCompletedModalVisible}
          allDhikrAndDuaOptions={allDhikrAndDuaOptions}
          colors={colors}
          confettiParticles={confettiParticles}
          customGoals={customGoals}
          dhikrModalVisible={dhikrModalVisible}
          dhikrSearch={dhikrSearch}
          handleAddCustomGoal={handleAddCustomGoal}
          handleMenstrualModeToggle={handleMenstrualModeToggle}
          menstrualMode={menstrualMode}
          newGoalCategory={newGoalCategory}
          newGoalTitle={newGoalTitle}
          prayerCompletions={prayerCompletions}
          prayersModalVisible={prayersModalVisible}
          removeGoalFromHome={removeGoalFromHome}
          router={router}
          setActiveActionGoal={setActiveActionGoal}
          setActiveIds={setActiveIds}
          setAllCompletedModalVisible={setAllCompletedModalVisible}
          setCustomGoals={setCustomGoals}
          setDhikrModalVisible={setDhikrModalVisible}
          setDhikrSearch={setDhikrSearch}
          setNewGoalCategory={setNewGoalCategory}
          setNewGoalTitle={setNewGoalTitle}
          setPrayersModalVisible={setPrayersModalVisible}
          setShowAddCustomModal={setShowAddCustomModal}
          setSurahSearch={setSurahSearch}
          showAddCustomModal={showAddCustomModal}
          styles={styles}
          surahSearch={surahSearch}
          togglePrayerCompletion={togglePrayerCompletion}
      />
    </SafeAreaView>
  );
}
