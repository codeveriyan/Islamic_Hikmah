import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

const FAV_KEY = 'ruhani:favourites:v1';
const DHIKR_KEY = 'ruhani:dhikr-counts:v1';
const REMIND_KEY = 'ruhani:reminders:v1';
const PRAY_LOC = 'ruhani:prayer-location:v1';

export type Favourite = {
  id: string;
  type: 'dua' | 'ayah';
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

export type Reminder = {
  id: string;
  title: string;
  hour: number;
  minute: number;
  enabled: boolean;
};

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

export async function resolveUserLocation(): Promise<{ lat: number; lon: number; city: string }> {
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

  if (loc && loc.lat && loc.lon) {
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

  const defaultLoc = { lat: 21.3891, lon: 39.8579, city: "Mecca" };
  await setSavedLocation(defaultLoc);
  return defaultLoc;
}

// ── Goals Storage ──────────────────────────────────────────
const GOALS_KEY = 'hikmah:goals-completed:v1';
const GOALS_CONFIG_KEY = 'hikmah:goals-config:v1';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
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
  if (raw) return JSON.parse(raw);
  // Default: first 10 goals active
  return ['fajr','dhuhr','asr','maghrib','isha','quran-5min','morning-adhkar','evening-adhkar','sleep-adhkar','fast-monday'];
}

export async function saveActiveGoalIds(ids: string[]) {
  await AsyncStorage.setItem(GOALS_CONFIG_KEY, JSON.stringify(ids));
}

// ── Prayer Settings Storage ────────────────────────────────
const PRAYER_SETTINGS_KEY = 'hikmah:prayer-settings:v1';

export type PrayerSettings = {
  method: number;
  juristic: number; // 0=Shafi, 1=Hanafi
  adhanEnabled: Record<string, boolean>;
};

export async function getPrayerSettings(): Promise<PrayerSettings> {
  const raw = await AsyncStorage.getItem(PRAYER_SETTINGS_KEY);
  if (raw) return JSON.parse(raw);
  return {
    method: 1,
    juristic: 0,
    adhanEnabled: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
  };
}

export async function savePrayerSettings(s: PrayerSettings) {
  await AsyncStorage.setItem(PRAYER_SETTINGS_KEY, JSON.stringify(s));
}

// ── Shared Notification Helpers ─────────────────────────────
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
    await AsyncStorage.removeItem(PRAYER_NOTIF_KEY);
  } catch (e) {
    console.error("Error cancelling prayer notifications:", e);
  }
};

export const schedulePrayerNotifications = async (timings: Record<string, string>, adhanEnabled: Record<string, boolean>): Promise<{ success: boolean; error?: 'permission' | 'failed' }> => {
  if (Platform.OS === "web") return { success: true };
  
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
  
  for (const p of activePrayers) {
    const isEnabled = adhanEnabled[p] ?? true;
    if (!isEnabled) continue;
    
    const timeStr = timings[p];
    if (!timeStr) continue;
    
    const [hStr, mStr] = timeStr.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    
    if (isNaN(h) || isNaN(m)) continue;
    
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${p} Prayer Time`,
          body: `It is time for ${p} prayer.`,
          sound: bgAzaanEnabled ? (Platform.OS === "android" ? "azaan" : "azaan.wav") : true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: m,
          channelId: 'prayer-times',
        } as any,
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
  if (Platform.OS === 'web') return;

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

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Next Prayer: ${nextPrayer.name}`,
        body: `${time12}   (starts in ${hours}h ${minutes}m)`,
        categoryIdentifier: 'prayer-actions',
        ongoing: true,
        sticky: true,
        priority: 'low',
        color: '#C5A880',
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
