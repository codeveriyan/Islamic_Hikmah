/**
 * Daily Content Service
 *
 * Provides "Hadith of the Day" and "Verse of the Day" functionality.
 * Fetches a daily piece of content from HadeethEnc/QuranEnc APIs,
 * schedules push notifications via Expo Notifications.
 *
 * Content selection: deterministic based on day-of-year so all users
 * see the same content on the same day (community feeling).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getHadeethDetail } from "./hadeethEncService";
import { getSurahTranslation, getStoredTranslationKey } from "./quranEncService";

// ── Types ───────────────────────────────────────────────────────────────────────

export interface DailyHadith {
  title: string;
  text: string;
  grade: string;
  reference: string;
  hadeethEncId: string;
  date: string; // YYYY-MM-DD
}

export interface DailyVerse {
  surah: number;
  surahName: string;
  ayah: number;
  arabic: string;
  translation: string;
  date: string;
}

// ── Config ──────────────────────────────────────────────────────────────────────

const DAILY_HADITH_KEY = "hikmah:daily:hadith";
const DAILY_VERSE_KEY = "hikmah:daily:verse";
const DAILY_HADITH_ENABLED_KEY = "hikmah:daily:hadith:enabled";
const DAILY_VERSE_ENABLED_KEY = "hikmah:daily:verse:enabled";
const DAILY_HADITH_TIME_KEY = "hikmah:daily:hadith:time";
const DAILY_VERSE_TIME_KEY = "hikmah:daily:verse:time";

const NOTIFICATION_CHANNEL_ID = "daily_content";

export class DailyNotificationError extends Error {
  constructor(public readonly code: "permission" | "schedule", message: string) {
    super(message);
    this.name = "DailyNotificationError";
  }
}

// Surah names for display
const SURAH_NAMES = [
  "", "Al-Fatihah", "Al-Baqarah", "Ali 'Imran", "An-Nisa", "Al-Ma'idah",
  "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus", "Hud", "Yusuf",
  "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam",
  "Taha", "Al-Anbya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan",
  "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman",
  "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad",
  "Az-Zumar", "Ghafir", "Fussilat", "Ash-Shuraa", "Az-Zukhruf", "Ad-Dukhan",
  "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah",
  "Al-Hadid", "Al-Mujadila", "Al-Hashr", "Al-Mumtahanah", "As-Saf",
  "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim",
  "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn",
  "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat",
  "An-Naba", "An-Nazi'at", "'Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin",
  "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr",
  "Al-Balad", "Ash-Shams", "Al-Layl", "Ad-Duhaa", "Ash-Sharh", "At-Tin",
  "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh",
  "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas",
  "Al-Falaq", "An-Nas",
];

// ── Helpers ─────────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ── Daily Hadith ────────────────────────────────────────────────────────────────

/**
 * Fetch the daily hadith. Uses a deterministic selection based on day-of-year.
 * Results are cached for the day.
 */
export async function fetchDailyHadith(language: string = "en"): Promise<DailyHadith | null> {
  const today = getTodayString();

  // Check if we already have today's hadith cached
  try {
    const raw = await AsyncStorage.getItem(DAILY_HADITH_KEY);
    if (raw) {
      const cached: DailyHadith = JSON.parse(raw);
      if (cached.date === today) return cached;
    }
  } catch {}

  try {
    // Use day-of-year to pick a hadith ID deterministically
    // HadeethEnc has thousands of hadiths — use modulo to cycle through
    const dayNum = getDayOfYear();
    // Hadith IDs in HadeethEnc start from 1 and are sequential
    // Use a reasonable range — HadeethEnc has ~4000+ hadiths
    const hadithId = String((dayNum % 3000) + 1);

    const detail = await getHadeethDetail(language, hadithId);

    const dailyHadith: DailyHadith = {
      title: detail.title,
      text: detail.hadeeth,
      grade: detail.grade,
      reference: detail.reference,
      hadeethEncId: detail.id,
      date: today,
    };

    await AsyncStorage.setItem(DAILY_HADITH_KEY, JSON.stringify(dailyHadith));
    return dailyHadith;
  } catch (error) {
    if (__DEV__) console.warn("[DailyContent] Failed to fetch daily hadith:", error);
    return null;
  }
}

// ── Daily Verse ─────────────────────────────────────────────────────────────────

/**
 * Fetch the daily verse. Uses day-of-year to deterministically pick a surah and ayah.
 */
export async function fetchDailyVerse(language: string = "en"): Promise<DailyVerse | null> {
  const today = getTodayString();

  // Check cache
  try {
    const raw = await AsyncStorage.getItem(DAILY_VERSE_KEY);
    if (raw) {
      const cached: DailyVerse = JSON.parse(raw);
      if (cached.date === today) return cached;
    }
  } catch {}

  try {
    const dayNum = getDayOfYear();
    // Map the day number to a small set of popular surahs and a valid ayah.
    // For simplicity, use a smaller set of popular short surahs for daily verse
    const popularSurahs = [1, 2, 3, 36, 55, 56, 67, 78, 87, 89, 91, 93, 94, 95, 97, 103, 112, 113, 114];
    const surahNum = popularSurahs[dayNum % popularSurahs.length];
    const ayahNum = (dayNum % 7) + 1; // Pick an ayah from 1-7

    // Use QuranEnc if user has a preference, otherwise use a default
    const translationKey = (await getStoredTranslationKey()) || "english_saheeh";

    const verses = await getSurahTranslation(translationKey, surahNum);
    const targetAyah = Math.min(ayahNum, verses.length);
    const verse = verses[targetAyah - 1];

    if (!verse) return null;

    const dailyVerse: DailyVerse = {
      surah: surahNum,
      surahName: SURAH_NAMES[surahNum] || `Surah ${surahNum}`,
      ayah: parseInt(verse.aya) || targetAyah,
      arabic: verse.arabic_text,
      translation: verse.translation,
      date: today,
    };

    await AsyncStorage.setItem(DAILY_VERSE_KEY, JSON.stringify(dailyVerse));
    return dailyVerse;
  } catch (error) {
    if (__DEV__) console.warn("[DailyContent] Failed to fetch daily verse:", error);
    return null;
  }
}

// ── Notification Scheduling ─────────────────────────────────────────────────────

/**
 * Schedule daily hadith notification.
 * @param hour - Hour of day (0-23) to send the notification
 * @param minute - Minute (0-59)
 */
export async function scheduleDailyHadithNotification(
  hour: number = 8,
  minute: number = 0
): Promise<void> {
  await ensureNotificationPermission();
  await ensureNotificationChannel();
  // Cancel any existing daily hadith notifications
  await cancelDailyHadithNotification();

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📖 Hadith of the Day",
        body: "Tap to read today's hadith with explanation",
        data: { type: "daily_hadith" },
        categoryIdentifier: "daily_hadith",
        ...(Platform.OS === "android" ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (error) {
    throw new DailyNotificationError("schedule", error instanceof Error ? error.message : "Could not schedule notification.");
  }

  await AsyncStorage.setItem(DAILY_HADITH_ENABLED_KEY, "true");
  await AsyncStorage.setItem(DAILY_HADITH_TIME_KEY, JSON.stringify({ hour, minute }));
}

/**
 * Schedule daily verse notification.
 */
export async function scheduleDailyVerseNotification(
  hour: number = 7,
  minute: number = 0
): Promise<void> {
  await ensureNotificationPermission();
  await ensureNotificationChannel();
  await cancelDailyVerseNotification();

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🕌 Verse of the Day",
        body: "Tap to read today's Quranic verse",
        data: { type: "daily_verse" },
        categoryIdentifier: "daily_verse",
        ...(Platform.OS === "android" ? { channelId: NOTIFICATION_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch (error) {
    throw new DailyNotificationError("schedule", error instanceof Error ? error.message : "Could not schedule notification.");
  }

  await AsyncStorage.setItem(DAILY_VERSE_ENABLED_KEY, "true");
  await AsyncStorage.setItem(DAILY_VERSE_TIME_KEY, JSON.stringify({ hour, minute }));
}

async function ensureNotificationPermission(): Promise<void> {
  if (Platform.OS === "web") {
    throw new DailyNotificationError("permission", "Daily notifications are not available on the web.");
  }

  try {
    let permissions = await Notifications.getPermissionsAsync();
    if (!permissions.granted && permissions.canAskAgain) {
      permissions = await Notifications.requestPermissionsAsync();
    }
    if (!permissions.granted) {
      throw new DailyNotificationError("permission", "Notification permission was not granted.");
    }
  } catch (error) {
    if (error instanceof DailyNotificationError) throw error;
    throw new DailyNotificationError("permission", "Could not check notification permission.");
  }
}

async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: "Daily content",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (error) {
    throw new DailyNotificationError("schedule", error instanceof Error ? error.message : "Could not configure notifications.");
  }
}

/**
 * Cancel daily hadith notification.
 */
export async function cancelDailyHadithNotification(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === "daily_hadith") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
  await AsyncStorage.setItem(DAILY_HADITH_ENABLED_KEY, "false");
}

/**
 * Cancel daily verse notification.
 */
export async function cancelDailyVerseNotification(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === "daily_verse") {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
  await AsyncStorage.setItem(DAILY_VERSE_ENABLED_KEY, "false");
}

/**
 * Check if daily hadith notifications are enabled.
 */
export async function isDailyHadithEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DAILY_HADITH_ENABLED_KEY)) === "true";
  } catch {
    return false;
  }
}

/**
 * Check if daily verse notifications are enabled.
 */
export async function isDailyVerseEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DAILY_VERSE_ENABLED_KEY)) === "true";
  } catch {
    return false;
  }
}

/**
 * Get the stored notification time.
 */
export async function getDailyHadithTime(): Promise<{ hour: number; minute: number }> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_HADITH_TIME_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { hour: 8, minute: 0 };
}

export async function getDailyVerseTime(): Promise<{ hour: number; minute: number }> {
  try {
    const raw = await AsyncStorage.getItem(DAILY_VERSE_TIME_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { hour: 7, minute: 0 };
}
