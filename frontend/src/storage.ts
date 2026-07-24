import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

const FAV_KEY = 'hikmah:favourites:v1';
const DHIKR_KEY = 'hikmah:dhikr-counts:v1';
const REMIND_KEY = 'hikmah:reminders:v1';
const PRAY_LOC = 'hikmah:prayer-location:v1';
const DHIKR_HISTORY_KEY = 'hikmah:dhikr-history:v1';
const PRAYER_TIMINGS_CACHE_KEY = 'hikmah:prayer-timings-cache:v2';

export const localDateKey = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export type PrayerTimingsCache = {
  timings: Record<string, string>;
  date: string;
  latitude: number;
  longitude: number;
  method: number;
  juristic: number;
  source: 'remote' | 'calculated';
  savedAt: number;
};

export async function savePrayerTimingsCache(cache: PrayerTimingsCache) {
  await AsyncStorage.multiSet([
    [PRAYER_TIMINGS_CACHE_KEY, JSON.stringify(cache)],
    // Kept for existing goal and notification settings readers during migration.
    ['last_fetched_timings', JSON.stringify(cache.timings)],
  ]);
}

export async function getPrayerTimingsCache(): Promise<PrayerTimingsCache | null> {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_TIMINGS_CACHE_KEY);
    return raw ? JSON.parse(raw) as PrayerTimingsCache : null;
  } catch {
    return null;
  }
}

export type Favourite = {
  id: string;
  type: 'dua' | 'ayah' | 'hadith' | 'seerah';
  title: string;
  subtitle?: string;
  arabic?: string;
  translation?: string;
  addedAt: number;
};

export async function getFavourites(): Promise<Favourite[]> {
  const raw = await AsyncStorage.getItem(FAV_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleFavourite(fav: Favourite): Promise<boolean> {
  const list = await getFavourites();
  const idx = list.findIndex((f) => f.id === fav.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...fav, addedAt: Date.now() });
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify(list));
  return true;
}

export async function isFavourite(id: string): Promise<boolean> {
  const list = await getFavourites();
  return list.some((f) => f.id === id);
}

export async function getDhikrCounts(): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(DHIKR_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function setDhikrCount(id: string, count: number) {
  const all = await getDhikrCounts();
  all[id] = count;
  await AsyncStorage.setItem(DHIKR_KEY, JSON.stringify(all));
}

// --- Dhikr Daily History & Streak -------------------------------------------
export type DhikrDay = { date: string; total: number };

export async function getDhikrHistory(): Promise<DhikrDay[]> {
  const raw = await AsyncStorage.getItem(DHIKR_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function recordDhikrSession(count: number): Promise<void> {
  if (count <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const history = await getDhikrHistory();
  const idx = history.findIndex(d => d.date === today);
  if (idx >= 0) { history[idx].total += count; }
  else { history.unshift({ date: today, total: count }); }
  await AsyncStorage.setItem(DHIKR_HISTORY_KEY, JSON.stringify(history.slice(0, 90)));
}

export async function getDhikrStreak(): Promise<{ streak: number; todayTotal: number; weekHistory: DhikrDay[] }> {
  const history = await getDhikrHistory();
  const today = new Date().toISOString().slice(0, 10);
  const weekHistory: DhikrDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const found = history.find(h => h.date === dateStr);
    weekHistory.push({ date: dateStr, total: found?.total ?? 0 });
  }
  const todayTotal = weekHistory[6]?.total ?? 0;
  const active = history.filter(d => d.total > 0).sort((a, b) => b.date.localeCompare(a.date));
  if (!active.length) return { streak: 0, todayTotal, weekHistory };
  const latest = active[0].date;
  const yd = new Date(); yd.setDate(yd.getDate() - 1);
  const ydStr = yd.toISOString().slice(0, 10);
  if (latest !== today && latest !== ydStr) return { streak: 0, todayTotal, weekHistory };
  let streak = 0; let check = new Date(latest);
  for (const entry of active) {
    const diff = Math.round((check.getTime() - new Date(entry.date).getTime()) / 86400000);
    if (diff > 1) break; streak++; check = new Date(entry.date);
  }
  return { streak, todayTotal, weekHistory };
}

export type Reminder = { id: string; title: string; hour: number; minute: number; enabled: boolean };

export async function getReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(REMIND_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveReminders(items: Reminder[]) {
  await AsyncStorage.setItem(REMIND_KEY, JSON.stringify(items));
}

export async function getSavedLocation(): Promise<{ lat: number; lon: number; city?: string } | null> {
  const raw = await AsyncStorage.getItem(PRAY_LOC);
  return raw ? JSON.parse(raw) : null;
}

export async function setSavedLocation(loc: { lat: number; lon: number; city?: string }) {
  await AsyncStorage.setItem(PRAY_LOC, JSON.stringify(loc));
}
export async function resolveUserLocation(options: { preferCurrent?: boolean; requireCurrent?: boolean } = {}): Promise<{ lat: number; lon: number; city: string }> {
  let loc: any = null;
  try {
    loc = await getSavedLocation();
  } catch {}

  const getCityName = async (lat: number, lon: number): Promise<string> => {
    try {
      if (Platform.OS === "web") {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const geoData = await geoRes.json();
        return geoData?.city || geoData?.locality || geoData?.principalSubdivision || "";
      } else {
        const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        return rev?.[0]?.city || rev?.[0]?.region || "";
      }
    } catch {
      return "";
    }
  };

  if (!options.preferCurrent && loc && loc.lat && loc.lon) {
    if (loc.city) {
      return loc as { lat: number; lon: number; city: string };
    }
    const cityName = await getCityName(loc.lat, loc.lon);
    if (cityName) {
      const updated = { ...loc, city: cityName };
      await setSavedLocation(updated);
      return updated;
    }
    return { ...loc, city: "London" };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const cityName = await getCityName(p.coords.latitude, p.coords.longitude);
      const newLoc = { lat: p.coords.latitude, lon: p.coords.longitude, city: cityName || "London" };
      await setSavedLocation(newLoc);
      return newLoc;
    }
  } catch {}

  try {
    const ipRes = await fetch("https://freeipapi.com/api/json");
    const ipData = await ipRes.json();
    if (ipData && ipData.latitude && ipData.longitude) {
      const cityName = ipData.cityName || ipData.regionName || ipData.countryName || "London";
      const newLoc = { lat: ipData.latitude, lon: ipData.longitude, city: cityName };
      await setSavedLocation(newLoc);
      return newLoc;
    }
  } catch {}

  if (options.requireCurrent) {
    throw new Error("Current location is unavailable. Enable location permission and try again.");
  }

  if (loc && loc.lat && loc.lon) {
    return { ...loc, city: loc.city || "Saved location" };
  }

  const defaultLoc = { lat: 21.3891, lon: 39.8579, city: "Mecca" };
  await setSavedLocation(defaultLoc);
  return defaultLoc;
}

// Goals Storage
const GOALS_KEY = 'hikmah:goals-completed:v1';
const GOALS_CONFIG_KEY = 'hikmah:goals-config:v1';

function todayKey() {
  const d = new Date();
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getEffectiveDate(): Date {
  const d = new Date();
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  return d;
}

export async function getCompletedGoals(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(`${GOALS_KEY}:${todayKey()}`);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleGoal(id: string): Promise<boolean> {
  const list = await getCompletedGoals();
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(id);
  await AsyncStorage.setItem(`${GOALS_KEY}:${todayKey()}`, JSON.stringify(list));
  return idx < 0;
}

export async function getActiveGoalIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(GOALS_CONFIG_KEY);
  if (raw) {
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {}
  }
  return [
    'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
    'quran-5min', 'surah-mulk',
    'morning-adhkar', 'evening-adhkar', 'sleep-adhkar', 'dhikr-after-salah', 'istighfar-100'
  ];
}

export async function saveActiveGoalIds(ids: string[]) {
  await AsyncStorage.setItem(GOALS_CONFIG_KEY, JSON.stringify(ids));
}

function getDateKeyForOffset(daysOffset: number) {
  const d = new Date();
  if (d.getHours() < 4) {
    d.setDate(d.getDate() - 1);
  }
  d.setDate(d.getDate() - daysOffset);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export async function getRecentGoalHistory(days: number): Promise<{ date: Date; completedIds: string[] }[]> {
  const history: { date: Date; completedIds: string[] }[] = [];
  for (let i = 1; i <= days; i++) {
    const key = getDateKeyForOffset(i);
    const raw = await AsyncStorage.getItem(`${GOALS_KEY}:${key}`);
    const completedIds: string[] = raw ? JSON.parse(raw) : [];

    // Also merge prayer completions if stored separately
    try {
      const rawPrayerComp = await AsyncStorage.getItem(`hikmah:prayer-completions:v1:${key}`);
      if (rawPrayerComp) {
        const pComp = JSON.parse(rawPrayerComp);
        const prayerMap: Record<string, string> = {
          Fajr: "fajr",
          Dhuhr: "dhuhr",
          Asr: "asr",
          Maghrib: "maghrib",
          Isha: "isha",
        };
        Object.entries(pComp).forEach(([pName, done]) => {
          if (done && prayerMap[pName] && !completedIds.includes(prayerMap[pName])) {
            completedIds.push(prayerMap[pName]);
          }
        });
      }
    } catch {}
    
    const date = new Date();
    if (date.getHours() < 4) {
      date.setDate(date.getDate() - 1);
    }
    date.setDate(date.getDate() - i);
    
    history.push({
      date,
      completedIds,
    });
  }
  return history;
}

// Prayer Settings Storage
const PRAYER_SETTINGS_KEY = 'hikmah:prayer-settings:v1';

export type PrayerSettings = {
  method: number;
  juristic: number; // 0=Shafi, 1=Hanafi
  adhanEnabled: Record<string, boolean>;
  offsets?: Record<string, number>; // manual tuning offsets in minutes
};

export async function getPrayerSettings(): Promise<PrayerSettings> {
  const raw = await AsyncStorage.getItem(PRAYER_SETTINGS_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!parsed.offsets) {
      parsed.offsets = { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0, Qiyam: 0 };
    }
    return parsed;
  }
  return {
    method: 1,
    juristic: 0,
    adhanEnabled: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
    offsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0, Qiyam: 0 },
  };
}

export async function savePrayerSettings(s: PrayerSettings) {
  await AsyncStorage.setItem(PRAYER_SETTINGS_KEY, JSON.stringify(s));
}

// --- Shared Notification Helpers -------------------------------------------
const PRAYER_NOTIF_KEY = 'scheduled_prayer_notifications';

export const cancelPrevPrayerNotifications = async () => {
  try {
    const raw = await AsyncStorage.getItem(PRAYER_NOTIF_KEY);
    if (raw) {
      const ids = JSON.parse(raw) as string[];
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }
    }
    // Remove alerts created by older app versions too. Those versions did not
    // always persist every identifier, which is why duplicate Adhan alerts
    // could survive a refresh or an app relaunch.
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled
      .filter(notification => {
        const title = notification.content.title || "";
        return notification.content.data?.notificationKind === "prayer-adhan" ||
          /(Fajr|Dhuhr|Asr|Maghrib|Isha) Prayer Time$/.test(title);
      })
      .map(notification => Notifications.cancelScheduledNotificationAsync(notification.identifier).catch(() => {})));
    await AsyncStorage.removeItem(PRAYER_NOTIF_KEY);
  } catch (e) {
    console.error("Error cancelling prayer notifications:", e);
  }
};

export const schedulePrayerNotifications = async (timings: Record<string, string>, adhanEnabled: Record<string, boolean>): Promise<{ success: boolean; error?: 'permission' | 'failed' }> => {
  if (Platform.OS === "web") return { success: true };
  try {
    await cancelPrevPrayerNotifications();
    
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const res = await Notifications.requestPermissionsAsync();
      if (res.status !== "granted") {
        return { success: false, error: 'permission' };
      }
    }
    
    // Check if background Azaan is enabled (defaults to true)
    const bgAzaanRaw = await AsyncStorage.getItem("background_azaan_enabled");
    const bgAzaanEnabled = bgAzaanRaw !== "false";
    
    // Set up channel for high importance and custom Adhan sound on Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('prayer-times', {
        name: 'Prayer Time Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: bgAzaanEnabled ? 'azaan' : undefined,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const newIds: string[] = [];
    const activePrayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const settings = await getPrayerSettings();
    const offsets = settings.offsets || {};
    
    for (const p of activePrayers) {
      const isEnabled = adhanEnabled[p] ?? true;
      if (!isEnabled) continue;
      
      const timeStr = timings[p];
      if (!timeStr) continue;
      
      const [hStr, mStr] = timeStr.split(":");
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);
      
      if (isNaN(h) || isNaN(m)) continue;

      // Apply manual offset adjustments
      const offsetMin = offsets[p] || 0;
      if (offsetMin !== 0) {
        const dateObj = new Date();
        dateObj.setHours(h, m, 0, 0);
        const adjustedDate = new Date(dateObj.getTime() + offsetMin * 60 * 1000);
        h = adjustedDate.getHours();
        m = adjustedDate.getMinutes();
      }
      
      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `${p} Prayer Time`,
            body: `It is time for ${p} prayer.`,
            sound: bgAzaanEnabled ? (Platform.OS === "android" ? "azaan" : "azaan.wav") : true,
            data: { notificationKind: "prayer-adhan", prayer: p },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h,
            minute: m,
            channelId: 'prayer-times',
          },
        });
        newIds.push(id);
      } catch (e) {
        console.error(`Failed to schedule notification for ${p}:`, e);
      }
    }
    
    await AsyncStorage.setItem(PRAYER_NOTIF_KEY, JSON.stringify(newIds));
    
    const hasEnabled = activePrayers.some(p => adhanEnabled[p] ?? true);
    if (hasEnabled && newIds.length === 0) {
      return { success: false, error: 'failed' };
    }
    return { success: true };
  } catch (e) {
    console.error("Critical error in schedulePrayerNotifications:", e);
    return { success: false, error: 'failed' };
  }
};

export const setupNotificationCategories = async () => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setNotificationCategoryAsync('prayer-actions', [
      {
        identifier: 'Tracker',
        buttonTitle: 'Tracker',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'Azkar',
        buttonTitle: 'Azkar',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'Qibla',
        buttonTitle: 'Qibla',
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (e) {
    console.error("Failed to setup notification categories:", e);
  }
};

export const updateStickyPrayerNotification = async (timings: Record<string, string>) => {
  if (Platform.OS !== 'android') return;

  try {
    // 1. Calculate next prayer details
    const now = new Date();
    const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    const parsed = PRAYERS.map((name) => {
      const t = timings[name];
      if (!t) return null;
      const [h, m] = t.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return { name, date: d, timeStr: t };
    }).filter(Boolean) as { name: string; date: Date; timeStr: string }[];

    if (parsed.length === 0) return;

    let nextIdx = parsed.findIndex((p) => p.date > now);
    let nextPrayer;
    if (nextIdx === -1) {
      const tomorrowFajr = new Date(parsed[0].date);
      tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
      nextPrayer = { name: "Fajr", date: tomorrowFajr, timeStr: parsed[0].timeStr };
    } else {
      nextPrayer = parsed[nextIdx];
    }

    const diffMs = nextPrayer.date.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);

    const format12H = (tStr: string) => {
      const [hStr, mStr] = tStr.split(":");
      let hrs = parseInt(hStr, 10);
      const ampm = hrs >= 12 ? "PM" : "AM";
      hrs = hrs % 12 || 12;
      return `${hrs}:${mStr} ${ampm}`;
    };

    const time12 = format12H(nextPrayer.timeStr);

    // Setup channel for Android to be silent during updates
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sticky-prayer', {
        name: 'Sticky Prayer Notification',
        importance: Notifications.AndroidImportance.LOW,
        showBadge: false,
        enableVibrate: false,
      });
    }

    await setupNotificationCategories();

    const stickyIdKey = "ruhani:sticky-notif-id:v1";
    const prevId = await AsyncStorage.getItem(stickyIdKey);
    if (prevId) {
      await Notifications.dismissNotificationAsync(prevId).catch(() => {});
    }
    // A persistent notification is delivered immediately. Clean up every
    // previous card, not just the last stored ID, to repair legacy duplicates.
    const presented = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(presented
      .filter(notification =>
        notification.request.content.data?.notificationKind === "sticky-prayer" ||
        (notification.request.content.title || "").startsWith("Next Prayer:")
      )
      .map(notification => Notifications.dismissNotificationAsync(notification.request.identifier).catch(() => {})));

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Next Prayer: ${nextPrayer.name}`,
        body: `${time12}   (starts in ${hours}h ${minutes}m)`,
        categoryIdentifier: 'prayer-actions',
        ongoing: true,
        sticky: true,
        priority: 'low',
        color: '#C5A880',
        channelId: 'sticky-prayer',
        data: { notificationKind: "sticky-prayer" },
      } as any,
      trigger: null,
    });

    if (notifId) {
      await AsyncStorage.setItem(stickyIdKey, notifId);
    }
  } catch (e) {
    console.error("Error presenting sticky notification:", e);
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Goal Notifications
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const GOAL_NOTIF_KEY = 'hikmah:goal-notif-ids:v1';
const GOAL_NOTIF_TIMES_KEY = 'hikmah:goal-notif-times:v1';

/**
 * Per-goal notification times. Prayer goals use actual prayer timings;
 * the rest have user-configurable defaults stored here.
 */
export type GoalNotifTimes = {
  // Non-prayer goal times (24h: { hour, minute })
  'quran-5min': { hour: number; minute: number };
  'surah-mulk': { hour: number; minute: number };
  'surah-kahaf': { hour: number; minute: number };
  'morning-adhkar': { hour: number; minute: number };
  'evening-adhkar': { hour: number; minute: number };
  'sleep-adhkar': { hour: number; minute: number };
  'fast-monday': { hour: number; minute: number };   // reminder sent Sunday evening
  'fast-thursday': { hour: number; minute: number }; // reminder sent Wednesday evening
  'nafl': { hour: number; minute: number };
  'tahajjud': { hour: number; minute: number };
};

export const DEFAULT_GOAL_NOTIF_TIMES: GoalNotifTimes = {
  'quran-5min':     { hour: 7,  minute: 0  },   // After Fajr
  'surah-mulk':     { hour: 21, minute: 30 },   // Evening before sleep
  'surah-kahaf':    { hour: 8,  minute: 0  },   // Friday morning
  'morning-adhkar': { hour: 6,  minute: 30 },   // After Fajr
  'evening-adhkar': { hour: 17, minute: 30 },   // Before Maghrib
  'sleep-adhkar':   { hour: 22, minute: 0  },   // Bedtime
  'fast-monday':    { hour: 20, minute: 0  },   // Sunday night reminder
  'fast-thursday':  { hour: 20, minute: 0  },   // Wednesday night reminder
  'nafl':           { hour: 12, minute: 30 },   // Midday
  'tahajjud':       { hour: 3,  minute: 30 },   // Night prayer
};

export async function getGoalNotifTimes(): Promise<GoalNotifTimes> {
  try {
    const raw = await AsyncStorage.getItem(GOAL_NOTIF_TIMES_KEY);
    if (raw) return { ...DEFAULT_GOAL_NOTIF_TIMES, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_GOAL_NOTIF_TIMES };
}

export async function saveGoalNotifTimes(times: Partial<GoalNotifTimes>): Promise<void> {
  const current = await getGoalNotifTimes();
  await AsyncStorage.setItem(GOAL_NOTIF_TIMES_KEY, JSON.stringify({ ...current, ...times }));
}

export async function cancelGoalNotifications(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(GOAL_NOTIF_KEY);
    if (raw) {
      const ids = JSON.parse(raw) as string[];
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }
    }
    await AsyncStorage.removeItem(GOAL_NOTIF_KEY);
  } catch (e) {
    console.error('Error cancelling goal notifications:', e);
  }
}

type PrayerTimings = Record<string, string>;

const GOAL_NOTIF_CONTENT: Record<string, { title: string; body: string }> = {
  'fajr':           { title: 'ðŸŒ… Fajr Prayer Time',         body: 'It\'s time for Fajr. Rise and pray.' },
  'dhuhr':          { title: 'â˜€ï¸ Dhuhr Prayer Time',        body: 'Dhuhr time has come. Take a moment to pray.' },
  'asr':            { title: 'ðŸŒ¤ Asr Prayer Time',           body: 'Don\'t delay your Asr prayer.' },
  'maghrib':        { title: 'ðŸŒ‡ Maghrib Prayer Time',       body: 'Maghrib time is here. Pray before it ends.' },
  'isha':           { title: 'ðŸŒ™ Isha Prayer Time',          body: 'Isha time has arrived. End your day with prayer.' },
  'tahajjud':       { title: 'âœ¨ Tahajjud Time',             body: 'Rise for Tahajjud â€” the best night prayer.' },
  'nafl':           { title: 'ðŸ¤² Nafl Prayer Reminder',      body: 'Earn extra reward with a Nafl prayer today.' },
  'quran-5min':     { title: 'ðŸ“– Quran Reading Time',        body: 'Read Quran for just 5 minutes â€” even a little goes far.' },
  'surah-mulk':     { title: 'ðŸŒ™ Recite Surah Al-Mulk',     body: 'Recite Surah Al-Mulk before you sleep tonight.' },
  'surah-kahaf':    { title: 'ðŸ“— Jumu\'ah: Surah Al-Kahf',  body: 'Today is Friday â€” recite Surah Al-Kahf.' },
  'morning-adhkar': { title: 'ðŸŒ„ Morning Adhkar Time',       body: 'Start your day with the morning remembrances.' },
  'evening-adhkar': { title: 'ðŸŒ† Evening Adhkar Time',       body: 'Take a moment for the evening adhkar now.' },
  'sleep-adhkar':   { title: 'ðŸ˜´ Sleep Adhkar Reminder',     body: 'Read your sleep adhkar before you rest.' },
  'fast-monday':    { title: 'ðŸŒ™ Sunnah Fast Tomorrow (Mon)',body: 'Prepare your intention â€” Monday fast starts at Fajr.' },
  'fast-thursday':  { title: 'ðŸŒ™ Sunnah Fast Tomorrow (Thu)',body: 'Prepare your intention â€” Thursday fast starts at Fajr.' },
};

/**
 * Schedule daily/weekly goal notifications for all active goals.
 * - Prayer goals fire at the actual prayer time from `prayerTimings`
 * - All other goals fire at the user-configured time from `GoalNotifTimes`
 * - Weekly goals (fast-monday, fast-thursday, surah-kahaf) use WEEKLY trigger
 *
 * Call this whenever:
 *   (a) active goal list changes (goals.tsx toggle)
 *   (b) prayer timings are refreshed (prayer-times.tsx)
 *   (c) user edits a goal notification time (goal-notif-settings.tsx)
 */
export async function scheduleGoalNotifications(
  activeGoalIds: string[],
  prayerTimings: PrayerTimings,
  goalTimes?: GoalNotifTimes
): Promise<{ success: boolean; error?: 'permission' | 'failed' }> {
  if (Platform.OS === 'web') return { success: true };
  try {
    await cancelGoalNotifications();

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    if (res.status !== 'granted') return { success: false, error: 'permission' };
  }

  const times = goalTimes ?? await getGoalNotifTimes();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('goal-reminders', {
      name: 'Goal & Habit Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200, 100, 200],
      sound: undefined,
    });
  }

  const PRAYER_MAP: Record<string, string> = {
    'fajr': 'Fajr', 'dhuhr': 'Dhuhr', 'asr': 'Asr',
    'maghrib': 'Maghrib', 'isha': 'Isha',
  };

  // Weekly goals: day of week they fire (0=Sun)
  // fast-monday reminder fires Sunday(0), fast-thursday fires Wednesday(3)
  // surah-kahaf fires Friday(5)
  const WEEKLY_MAP: Record<string, { dayOfWeek: number; timeKey: keyof GoalNotifTimes }> = {
    'fast-monday':   { dayOfWeek: 0, timeKey: 'fast-monday' },
    'fast-thursday': { dayOfWeek: 3, timeKey: 'fast-thursday' },
    'surah-kahaf':   { dayOfWeek: 5, timeKey: 'surah-kahaf' },
  };

  // Load settings to respect switches
  const logReminderVal = await AsyncStorage.getItem("hikmah:settings:log-reminder");
  const isLogReminderEnabled = logReminderVal === null ? true : logReminderVal === "true";

  const quranReminderVal = await AsyncStorage.getItem("hikmah:settings:quran-reminder");
  const isQuranReminderEnabled = quranReminderVal === null ? true : quranReminderVal === "true";

  const dhikrReminderVal = await AsyncStorage.getItem("hikmah:settings:dhikr-reminder");
  const isDhikrReminderEnabled = dhikrReminderVal === null ? true : dhikrReminderVal === "true";

  const scheduleReminderVal = await AsyncStorage.getItem("hikmah:settings:schedule-reminder") || "08:00 PM";
  let quranHour = 20;
  let quranMinute = 0;
  const [timeStrPart, ampm] = scheduleReminderVal.split(" ");
  if (timeStrPart) {
    const [h, m] = timeStrPart.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      quranHour = ampm === "PM" && h < 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
      quranMinute = m;
    }
  }

  const selectedAdhkarRaw = await AsyncStorage.getItem("hikmah:settings:selected-adhkar");
  const selectedAdhkarLimit = selectedAdhkarRaw ? parseInt(selectedAdhkarRaw, 10) : 3;
  const dhikrIdsOrder = ['morning-adhkar', 'evening-adhkar', 'sleep-adhkar', 'dhikr-after-salah', 'istighfar-100'];

  const newIds: string[] = [];

  for (const goalId of activeGoalIds) {
    // Prayer goals are for tracking completion, not a second alert source.
    // The dedicated Adhan scheduler above is the single owner of all five
    // prayer-time notifications.
    if (PRAYER_MAP[goalId]) continue;

    const content = GOAL_NOTIF_CONTENT[goalId];
    if (!content) continue;

    // Check filters
    if (PRAYER_MAP[goalId]) {
      if (!isLogReminderEnabled) continue;
    }

    if (goalId === 'quran-5min' || goalId === 'surah-mulk' || goalId === 'surah-kahaf') {
      if (!isQuranReminderEnabled) continue;
    }

    if (dhikrIdsOrder.includes(goalId)) {
      if (!isDhikrReminderEnabled) continue;
      const idx = dhikrIdsOrder.indexOf(goalId);
      if (idx >= selectedAdhkarLimit) continue;
    }

    try {
      // â”€â”€ Prayer goals: use actual prayer timing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (PRAYER_MAP[goalId]) {
        const prayerKey = PRAYER_MAP[goalId];
        const timeStr = prayerTimings[prayerKey];
        if (!timeStr) continue;
        const [h, m] = timeStr.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) continue;

        const id = await Notifications.scheduleNotificationAsync({
          content: { ...content, sound: undefined },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: h,
            minute: m,
            channelId: 'goal-reminders',
          },
        });
        newIds.push(id);
        continue;
      }

      // Custom Quran Recitation schedule
      if (goalId === 'quran-5min') {
        const id = await Notifications.scheduleNotificationAsync({
          content: { ...content, sound: undefined },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: quranHour,
            minute: quranMinute,
            channelId: 'goal-reminders',
          },
        });
        newIds.push(id);
        continue;
      }

      // â”€â”€ Tahajjud/Nafl: use configured times (daily) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (goalId === 'tahajjud' || goalId === 'nafl') {
        const t = times[goalId as keyof GoalNotifTimes];
        const id = await Notifications.scheduleNotificationAsync({
          content: { ...content, sound: undefined },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: t.hour,
            minute: t.minute,
            channelId: 'goal-reminders',
          },
        });
        newIds.push(id);
        continue;
      }

      // â”€â”€ Weekly goals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (WEEKLY_MAP[goalId]) {
        const { dayOfWeek, timeKey } = WEEKLY_MAP[goalId];
        const t = times[timeKey];
        const id = await Notifications.scheduleNotificationAsync({
          content: { ...content, sound: undefined },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dayOfWeek + 1, // expo-notifications: 1=Sun â€¦ 7=Sat
            hour: t.hour,
            minute: t.minute,
            channelId: 'goal-reminders',
          },
        });
        newIds.push(id);
        continue;
      }

      // â”€â”€ Daily non-prayer goals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const timeKey = goalId as keyof GoalNotifTimes;
      if (times[timeKey]) {
        const t = times[timeKey];
        const id = await Notifications.scheduleNotificationAsync({
          content: { ...content, sound: undefined },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: t.hour,
            minute: t.minute,
            channelId: 'goal-reminders',
          },
        });
        newIds.push(id);
      }
    } catch (e) {
      console.error(`Failed to schedule goal notification for ${goalId}:`, e);
    }
  }

  await AsyncStorage.setItem(GOAL_NOTIF_KEY, JSON.stringify(newIds));

  // â”€â”€ Day-transition notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // 3:45 AM â€” gentle nudge to finish yesterday's goals before cutoff
  try {
    const nudgeId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'â° Last chance for yesterday\'s goals!',
        body: 'It\'s 3:45 AM â€” you have 15 minutes to update yesterday\'s goals before the new day starts.',
        sound: undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 3,
        minute: 45,
        channelId: 'goal-reminders',
      },
    });
    newIds.push(nudgeId);
  } catch (e) {
    console.warn('Failed to schedule 3:45 AM nudge notification:', e);
  }

  // 4:00 AM â€” new day starts, goals reset
  try {
    const newDayId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ðŸŒ… New day has begun!',
        body: 'Bismillah! Yesterday\'s goals have been saved. Start your new day with intention. ðŸ¤²',
        sound: undefined,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 4,
        minute: 0,
        channelId: 'goal-reminders',
      },
    });
    newIds.push(newDayId);
  } catch (e) {
    console.warn('Failed to schedule 4:00 AM new-day notification:', e);
  }

  // Save updated ids (including the two new transition notifications)
  await AsyncStorage.setItem(GOAL_NOTIF_KEY, JSON.stringify(newIds));

  return { success: true };
  } catch (e) {
    console.error("Critical error in scheduleGoalNotifications:", e);
    return { success: false, error: 'failed' };
  }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Quran Bookmarks & Last Read Position
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const QURAN_BOOKMARKS_KEY = 'hikmah:quran-bookmarks:v1';
const QURAN_LAST_READ_KEY = 'hikmah:quran-last-read:v1';

export type QuranBookmark = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  note?: string;
  savedAt: number; // timestamp
};

export type QuranLastRead = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  readAt: number;
};

export async function getQuranBookmarks(): Promise<QuranBookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(QURAN_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addQuranBookmark(b: Omit<QuranBookmark, 'savedAt'>): Promise<void> {
  const existing = await getQuranBookmarks();
  // Remove duplicate if same surah+ayah already bookmarked
  const filtered = existing.filter(
    (e) => !(e.surahNumber === b.surahNumber && e.ayahNumber === b.ayahNumber)
  );
  filtered.unshift({ ...b, savedAt: Date.now() });
  await AsyncStorage.setItem(QURAN_BOOKMARKS_KEY, JSON.stringify(filtered));
}

export async function removeQuranBookmark(surahNumber: number, ayahNumber: number): Promise<void> {
  const existing = await getQuranBookmarks();
  const filtered = existing.filter(
    (e) => !(e.surahNumber === surahNumber && e.ayahNumber === ayahNumber)
  );
  await AsyncStorage.setItem(QURAN_BOOKMARKS_KEY, JSON.stringify(filtered));
}

export async function updateQuranBookmarkNote(surahNumber: number, ayahNumber: number, note: string): Promise<void> {
  const existing = await getQuranBookmarks();
  const updated = existing.map((e) => {
    if (e.surahNumber === surahNumber && e.ayahNumber === ayahNumber) {
      return { ...e, note };
    }
    return e;
  });
  await AsyncStorage.setItem(QURAN_BOOKMARKS_KEY, JSON.stringify(updated));
}

export async function isQuranBookmarked(surahNumber: number, ayahNumber: number): Promise<boolean> {
  const existing = await getQuranBookmarks();
  return existing.some((e) => e.surahNumber === surahNumber && e.ayahNumber === ayahNumber);
}

export async function getQuranLastRead(): Promise<QuranLastRead | null> {
  try {
    const raw = await AsyncStorage.getItem(QURAN_LAST_READ_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function saveQuranLastRead(lr: Omit<QuranLastRead, 'readAt'>): Promise<void> {
  await AsyncStorage.setItem(QURAN_LAST_READ_KEY, JSON.stringify({ ...lr, readAt: Date.now() }));
}

// â”€â”€ Menstrual Mode & Calendar Settings Storage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MENSTRUAL_MODE_KEY = 'hikmah:menstrual-mode:v1';
const CALENDAR_CONNECTED_KEY = 'hikmah:calendar-connected:v1';
const CALENDAR_DISMISSED_KEY = 'hikmah:calendar-dismissed:v1';
const DHIKR_COUNTS_KEY = 'hikmah:dhikr-counts:v1';
const PRAYER_COMPLETIONS_KEY = 'hikmah:prayer-completions:v1';

export async function getMenstrualModeActive(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(MENSTRUAL_MODE_KEY);
    return raw === 'true';
  } catch { return false; }
}

export async function setMenstrualModeActive(active: boolean): Promise<void> {
  await AsyncStorage.setItem(MENSTRUAL_MODE_KEY, active ? 'true' : 'false');
}

export async function getGoogleCalendarConnected(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CALENDAR_CONNECTED_KEY);
    return raw === 'true';
  } catch { return false; }
}

export async function setGoogleCalendarConnected(connected: boolean): Promise<void> {
  await AsyncStorage.setItem(CALENDAR_CONNECTED_KEY, connected ? 'true' : 'false');
}

export async function getGoogleCalendarDismissed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CALENDAR_DISMISSED_KEY);
    return raw === 'true';
  } catch { return false; }
}

export async function setGoogleCalendarDismissed(dismissed: boolean): Promise<void> {
  await AsyncStorage.setItem(CALENDAR_DISMISSED_KEY, dismissed ? 'true' : 'false');
}

export async function getDailyDhikrCounts(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(`${DHIKR_COUNTS_KEY}:${todayKey()}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export async function saveDailyDhikrCounts(counts: Record<string, number>): Promise<void> {
  await AsyncStorage.setItem(`${DHIKR_COUNTS_KEY}:${todayKey()}`, JSON.stringify(counts));
}

export async function getPrayerCompletions(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(`${PRAYER_COMPLETIONS_KEY}:${todayKey()}`);
    return raw ? JSON.parse(raw) : { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false };
  } catch {
    return { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false };
  }
}

export async function savePrayerCompletions(completions: Record<string, boolean>): Promise<void> {
  await AsyncStorage.setItem(`${PRAYER_COMPLETIONS_KEY}:${todayKey()}`, JSON.stringify(completions));
}

// Hadith & Seerah Bookmarks
const HADITH_BOOKMARKS_KEY = 'hikmah:hadith-bookmarks:v1';
const SEERAH_BOOKMARKS_KEY = 'hikmah:seerah-bookmarks:v1';

export type HadithBookmark = {
  id: string; // "hadith-bukhari-1"
  bookId: string;
  hadithnumber: number;
  text: string;
  arabicText?: string;
  addedAt: number;
};

export type SeerahBookmark = {
  id: string; // "seerah-arabian-peninsula"
  chapterId: string;
  title: string;
  arabicTitle?: string;
  content: string;
  addedAt: number;
};

export async function getHadithBookmarks(): Promise<HadithBookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(HADITH_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function toggleHadithBookmark(bm: HadithBookmark): Promise<boolean> {
  const list = await getHadithBookmarks();
  const idx = list.findIndex((b) => b.id === bm.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await AsyncStorage.setItem(HADITH_BOOKMARKS_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...bm, addedAt: Date.now() });
  await AsyncStorage.setItem(HADITH_BOOKMARKS_KEY, JSON.stringify(list));
  return true;
}

export async function isHadithBookmarked(id: string): Promise<boolean> {
  const list = await getHadithBookmarks();
  return list.some((b) => b.id === id);
}

export async function getSeerahBookmarks(): Promise<SeerahBookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(SEERAH_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function toggleSeerahBookmark(bm: SeerahBookmark): Promise<boolean> {
  const list = await getSeerahBookmarks();
  const idx = list.findIndex((b) => b.id === bm.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await AsyncStorage.setItem(SEERAH_BOOKMARKS_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...bm, addedAt: Date.now() });
  await AsyncStorage.setItem(SEERAH_BOOKMARKS_KEY, JSON.stringify(list));
  return true;
}

export async function isSeerahBookmarked(id: string): Promise<boolean> {
  const list = await getSeerahBookmarks();
  return list.some((b) => b.id === id);
}

// Dhikr Bookmarks
const DHIKR_BOOKMARKS_KEY = 'hikmah:dhikr-bookmarks:v1';

export type DhikrBookmark = {
  id: string; // e.g. "dhikr-duaId"
  duaId: string;
  title: string;
  subtitle?: string;
  arabic?: string;
  translation?: string;
  addedAt: number;
};

export async function getDhikrBookmarks(): Promise<DhikrBookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(DHIKR_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function toggleDhikrBookmark(bm: DhikrBookmark): Promise<boolean> {
  const list = await getDhikrBookmarks();
  const idx = list.findIndex((b) => b.id === bm.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await AsyncStorage.setItem(DHIKR_BOOKMARKS_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...bm, addedAt: Date.now() });
  await AsyncStorage.setItem(DHIKR_BOOKMARKS_KEY, JSON.stringify(list));
  return true;
}

export async function isDhikrBookmarked(id: string): Promise<boolean> {
  const list = await getDhikrBookmarks();
  return list.some((b) => b.id === id);
}

// ─── Qadha Prayer Tracker Storage ─────────────────────────────────────────────
const QADHA_KEY = 'hikmah:qadha:v1';

export type QadhaCounts = {
  Fajr: number;
  Dhuhr: number;
  Asr: number;
  Maghrib: number;
  Isha: number;
  Witr: number;
};

const DEFAULT_QADHA: QadhaCounts = {
  Fajr: 0,
  Dhuhr: 0,
  Asr: 0,
  Maghrib: 0,
  Isha: 0,
  Witr: 0,
};

export async function getQadhaCounts(): Promise<QadhaCounts> {
  try {
    const raw = await AsyncStorage.getItem(QADHA_KEY);
    return raw ? { ...DEFAULT_QADHA, ...JSON.parse(raw) } : DEFAULT_QADHA;
  } catch {
    return DEFAULT_QADHA;
  }
}

export async function saveQadhaCounts(counts: QadhaCounts): Promise<void> {
  await AsyncStorage.setItem(QADHA_KEY, JSON.stringify(counts));
}

// ─── Ramadan Fasting Tracker Storage ───────────────────────────────────────────
const RAMADAN_KEY = 'hikmah:ramadan:v1';

export type FastingLog = {
  date: string;
  fasted: boolean;
  notes?: string;
};

export async function getRamadanLogs(): Promise<FastingLog[]> {
  try {
    const raw = await AsyncStorage.getItem(RAMADAN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveRamadanLog(date: string, fasted: boolean, notes?: string): Promise<void> {
  const logs = await getRamadanLogs();
  const idx = logs.findIndex(l => l.date === date);
  if (idx >= 0) {
    logs[idx] = { date, fasted, notes };
  } else {
    logs.unshift({ date, fasted, notes });
  }
  await AsyncStorage.setItem(RAMADAN_KEY, JSON.stringify(logs));
}
