import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getPrayerTimingsCache } from "@/src/storage";

const WIDGET_DATA_KEY = "hikmah:widget:next_prayer:v1";

export type WidgetPrayerData = {
  currentPrayer: string;
  nextPrayer: string;
  nextPrayerTime: string;
  countdownMinutes: number;
  city: string;
  updatedAt: number;
};

/**
 * Updates shared storage for Android & iOS Home Screen Widgets.
 * Can be called after prayer times update or periodically on minute ticks.
 */
export async function updateHomeScreenWidgetData(): Promise<WidgetPrayerData | null> {
  try {
    const cache = await getPrayerTimingsCache();
    if (!cache?.timings) return null;

    const timings = cache.timings;
    const now = new Date();
    const parseTime = (tStr: string) => {
      const [h, m] = tStr.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    };

    const prayerOrder = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
    let nextPrayer = "Fajr";
    let nextPrayerDate = parseTime(timings.Fajr || "05:00");
    let currentPrayer = "Isha";

    if (now > nextPrayerDate) {
      // Check subsequent prayers today
      let found = false;
      for (let i = 0; i < prayerOrder.length; i++) {
        const p = prayerOrder[i];
        if (!timings[p]) continue;
        const pDate = parseTime(timings[p]);
        if (now < pDate) {
          nextPrayer = p;
          nextPrayerDate = pDate;
          currentPrayer = i > 0 ? prayerOrder[i - 1] : "Isha";
          found = true;
          break;
        }
      }
      if (!found) {
        // Next prayer is tomorrow's Fajr
        nextPrayer = "Fajr";
        nextPrayerDate = parseTime(timings.Fajr || "05:00");
        nextPrayerDate.setDate(nextPrayerDate.getDate() + 1);
        currentPrayer = "Isha";
      }
    }

    const diffMs = Math.max(0, nextPrayerDate.getTime() - now.getTime());
    const countdownMinutes = Math.floor(diffMs / 60000);

    const data: WidgetPrayerData = {
      currentPrayer,
      nextPrayer,
      nextPrayerTime: timings[nextPrayer] || "",
      countdownMinutes,
      city: (cache as any).city || "Local",
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
    if (__DEV__) console.log("[WidgetService] Widget data updated:", data);
    return data;
  } catch (err) {
    if (__DEV__) console.warn("[WidgetService] Failed to update widget data:", err);
    return null;
  }
}

export async function getHomeScreenWidgetData(): Promise<WidgetPrayerData | null> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
