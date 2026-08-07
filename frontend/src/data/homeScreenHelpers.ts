import AsyncStorage from "@react-native-async-storage/async-storage";

// Extracted from frontend/app/(tabs)/index.tsx to keep the main screen file
// smaller. Pure data/constants and pure helper functions only — no component
// state or JSX. Behavior is unchanged from the original inline definitions.

export const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

export const CATEGORY_IMAGES: Record<string, any> = {
  ummah: require("@/assets/images/ummah_background.png"),
  morning: { uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80" },
  evening: { uri: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop&q=80" },
  sleep: { uri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80" },
  tahajjud: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  salah: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  "after-salah": { uri: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=500&auto=format&fit=crop&q=80" },
  istikharah: { uri: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=80" },
  gatherings: { uri: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80" },
  difficulties: { uri: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=500&auto=format&fit=crop&q=80" },
  iman: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  hajj: { uri: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=500&auto=format&fit=crop&q=80" },
  travel: { uri: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=80" },
  money: { uri: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80" },
  social: { uri: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=80" },
  marriage: { uri: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&auto=format&fit=crop&q=80" },
  death: { uri: "https://images.unsplash.com/photo-1453791052107-5c843da62d97?w=500&auto=format&fit=crop&q=80" },
  nature: { uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&auto=format&fit=crop&q=80" },
  ramadan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  ruqyah: { uri: "https://images.unsplash.com/photo-1552089123-2d26226fc2b7?w=500&auto=format&fit=crop&q=80" },
  "daily-life": { uri: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80" },
  adhan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  wudu: { uri: "https://images.unsplash.com/photo-1548813730-e8f20cc74a4a?w=500&auto=format&fit=crop&q=80" },
  masjid: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  sickness: { uri: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80" },
  forgiveness: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
};

// Countdown ring size
export const RING = 112;
export const STROKE = 7;
export const RADIUS = (RING - STROKE) / 2;
export const CIRC = 2 * Math.PI * RADIUS;

// ── Islamic Event Calendar (approximate Gregorian dates for 2025–2026) ─────────
// B3: Islamic events — fetched from Aladhan API, cached 30 days.
// No longer hardcoded so they stay accurate beyond 2026.
export const ISLAMIC_EVENTS_CACHE_KEY = 'hikmah:islamic-events-cache:v1';
export const EVENTS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Known Hijri events to look for in the Aladhan calendar response
export const HIJRI_EVENT_KEYWORDS: { keyword: string; emoji: string; grad: [string, string] }[] = [
  { keyword: 'Ramadan',      emoji: '🌙', grad: ['#0F2D5A', '#1D4ED8'] },
  { keyword: 'Eid al-Fitr',  emoji: '🌙', grad: ['#065F46', '#10B981'] },
  { keyword: 'Eid al-Adha',  emoji: '🕌', grad: ['#78350F', '#B45309'] },
  { keyword: 'Dhul Hijjah',  emoji: '🕋', grad: ['#78350F', '#B45309'] },
  { keyword: 'Mawlid',       emoji: '💚', grad: ['#065F46', '#047857'] },
  { keyword: 'Laylat al-Qadr', emoji: '⭐', grad: ['#4C1D95', '#7C3AED'] },
  { keyword: 'New Year',     emoji: '⭐', grad: ['#4C1D95', '#7C3AED'] },
  { keyword: 'Ashura',       emoji: '📿', grad: ['#1E3A5F', '#2563EB'] },
];

export async function fetchIslamicEvents(): Promise<{ name: string; date: Date; emoji: string; grad: [string, string] }[]> {
  try {
    const raw = await AsyncStorage.getItem(ISLAMIC_EVENTS_CACHE_KEY);
    if (raw) {
      const { events, cachedAt } = JSON.parse(raw);
      if (Date.now() - cachedAt < EVENTS_TTL_MS) {
        return events.map((e: any) => ({ ...e, date: new Date(e.date) }));
      }
    }
  } catch {}

  try {
    const year = new Date().getFullYear();
    const res = await fetch(`https://api.aladhan.com/v1/calendar/${year}?annual=true`);
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    const found: { name: string; date: Date; emoji: string; grad: [string, string] }[] = [];
    const seen = new Set<string>();
    for (const month of Object.values(json.data || {}) as any[]) {
      for (const day of month) {
        const dateStr = day.gregorian?.date; // DD-MM-YYYY
        const holidays: string[] = day.hijri?.holidays || [];
        for (const holiday of holidays) {
          const match = HIJRI_EVENT_KEYWORDS.find(k => holiday.toLowerCase().includes(k.keyword.toLowerCase()));
          if (match && dateStr && !seen.has(holiday)) {
            seen.add(holiday);
            const [d, m, y] = dateStr.split('-').map(Number);
            found.push({ name: holiday, date: new Date(y, m - 1, d), emoji: match.emoji, grad: match.grad });
          }
        }
      }
    }
    if (found.length) {
      await AsyncStorage.setItem(ISLAMIC_EVENTS_CACHE_KEY, JSON.stringify({ events: found, cachedAt: Date.now() }));
      return found;
    }
  } catch {}

  // Static fallback for the current cycle — only used if API is unreachable
  return [
    { name: 'Ramadan 1447',     date: new Date('2026-02-17'), emoji: '🌙', grad: ['#0F2D5A', '#1D4ED8'] },
    { name: 'Eid al-Fitr 1447', date: new Date('2026-03-20'), emoji: '🌙', grad: ['#065F46', '#10B981'] },
    { name: 'Eid al-Adha 1447', date: new Date('2026-05-27'), emoji: '🕌', grad: ['#78350F', '#B45309'] },
  ];
}

export function getNextIslamicEvent(events: { name: string; date: Date; emoji: string; grad: [string, string] }[]) {
  const now = new Date();
  const future = events.filter(e => e.date > now).sort((a, b) => a.date.getTime() - b.date.getTime());
  if (!future.length) return null;
  const next = future[0];
  const daysLeft = Math.ceil((next.date.getTime() - now.getTime()) / 86400000);
  return { ...next, daysLeft };
}

export const QUICK_ACTIONS = [
  { id: "pillarsOfIslam",    label: "5 Pillars of Islam",      route: "/pillars-of-islam",      emoji: "☪️" },
  { id: "dawah",             label: "Dawah (Why Islam)",       route: "/dawah",                  emoji: "📖" },
  { id: "nobleQuran",        label: "Al-Qur'aan",             route: "/quran",                  image: require("@/assets/images/quran_icon.png") },
  { id: "hadithCollections", label: "Hadith Collections",      route: "/hadith",                 emoji: "📚" },
  { id: "fatawaAnswers",     label: "Fatawa Answers",          route: "/fatawa",                 emoji: "⚖️" },
  { id: "seerah",            label: "Seerah",                  route: "/seerah",                 emoji: "🌙" },
  { id: "duas",              label: "Du'as",                   route: "/dua-hub",               emoji: "🤲" },
  { id: "fortressMuslim",    label: "Fortress of Muslim",      route: "/fortress",              emoji: "🛡️" },
  { id: "namesOfAllah",      label: "Asma Al-Husna",          route: "/names",                  emoji: "✨" },
  { id: "babyNames",         label: "Baby Names",             route: "/baby-names",             emoji: "👶" },
  { id: "qiblaDirection",    label: "Qiblah Direction",        route: "/qibla",                  emoji: "🧭" },
  { id: "zakatCalculator",   label: "Zakat Calculator",        route: "/zakat-calculator",       emoji: "💰" },
  { id: "views360",          label: "360° Views",             route: "/views360",               emoji: "🌐" },
  { id: "identifyRecitation", label: "Recitation ID",         route: "/quran/identify",         emoji: "🎙️" },
  { id: "qadhaTracker",      label: "Qadha Tracker",           route: "/qadha",                  emoji: "📝" },
  { id: "ramadanCompanion",  label: "Ramadan Mode",            route: "/ramadan",                emoji: "✨" },
  { id: "hijriCalendar",     label: "Islamic Calendar",        route: "/hijri-calendar",         emoji: "📅" },
  { id: "tasbihCounter",     label: "Tasbih Counter",          route: "/dhikr",                  emoji: "📿" },
  { id: "mosqueFinder",      label: "Masjid Finder",           route: "/finder?type=mosque",     image: require("@/assets/images/masjid_finder_icon.png") },
  { id: "halalFoodFinder",   label: "Halal Food Finder",       route: "/finder?type=halal",      emoji: "🍽️", premium: true },
  { id: "halalFoodScanner",  label: "Halal Product Scanner",   route: "/halal-scanner",          emoji: "🔎",  premium: true },
];

// Restraint pass: the Home screen now shows only the most-used shortcuts as a
// compact single grid (no swipeable pages, no dots indicator). The full
// QUICK_ACTIONS list above stays available for other surfaces if needed.
export const HOME_QUICK_ACTIONS = QUICK_ACTIONS.filter((a) =>
  [
    "nobleQuran",
    "hadithCollections",
    "duas",
    "namesOfAllah",
    "babyNames",
    "qiblaDirection",
    "zakatCalculator",
    "hijriCalendar",
    "tasbihCounter",
    "mosqueFinder",
  ].includes(a.id)
);

export function getGreeting(prayerName?: string) {
  const hour = new Date().getHours();
  let timePrefix = "Good morning";
  if (hour >= 12 && hour < 17) timePrefix = "Good afternoon";
  else if (hour >= 17 && hour < 21) timePrefix = "Good evening";
  else if (hour >= 21 || hour < 5) timePrefix = "Good night";

  if (prayerName) {
    const pName = prayerName.trim();
    return {
      salaam: "Assalamu Alaikum",
      sub: `${timePrefix}, it is now ${pName} time`,
    };
  }

  if (hour < 5) return { salaam: "Assalamu Alaikum", sub: "May your night be blessed" };
  if (hour < 12) return { salaam: "Assalamu Alaikum", sub: "Good morning, may Allah bless your day" };
  if (hour < 17) return { salaam: "Assalamu Alaikum", sub: "Good afternoon, remember your prayers" };
  if (hour < 21) return { salaam: "Assalamu Alaikum", sub: "Good evening, may your evening be blessed" };
  return { salaam: "Assalamu Alaikum", sub: "Good night, may your sleep be peaceful" };
}

// format12Hour imported from @/src/utils/time


export function getHijriDate() {
  try {
    const date = new Date();
    let g_y = date.getFullYear();
    let g_m = date.getMonth();
    let g_d = date.getDate();

    let myDate = new Date(Date.UTC(g_y, g_m, g_d, 12, 0, 0));

    let y = myDate.getUTCFullYear();
    let m = myDate.getUTCMonth() + 1;
    let d = myDate.getUTCDate();

    if (m <= 2) {
      y -= 1;
      m += 12;
    }
    let A = Math.floor(y / 100);
    let B = 2 - A + Math.floor(A / 4);
    // Added +1 day offset to align arithmetic calendar with standard Umm al-Qura calendar
    let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 + 1;

    let epoch = 1948439.5;
    let diff = jd - epoch;
    let cycle = Math.floor(diff / 10631);
    let rem = diff % 10631;

    let h_y = 30 * cycle + 1;
    const leap_years = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];

    for (let i = 1; i <= 30; i++) {
      const is_leap = leap_years.includes(i);
      const length = is_leap ? 355 : 354;
      if (rem < length) {
        h_y = 30 * cycle + i;
        break;
      }
      rem -= length;
    }

    const month_lengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    const current_year_in_cycle = (h_y - 1) % 30 + 1;
    if (leap_years.includes(current_year_in_cycle)) {
      month_lengths[11] = 30;
    }

    let h_m = 1;
    for (let i = 0; i < 12; i++) {
      if (rem < month_lengths[i]) {
        h_m = i + 1;
        break;
      }
      rem -= month_lengths[i];
    }

    let h_d = Math.floor(rem) + 1;

    const monthNames = [
      "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
      "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
      "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
    ];

    const mName = monthNames[h_m - 1] || "Muharram";

    let suffix = "th";
    if (h_d % 10 === 1 && h_d !== 11) suffix = "st";
    else if (h_d % 10 === 2 && h_d !== 12) suffix = "nd";
    else if (h_d % 10 === 3 && h_d !== 13) suffix = "rd";

    return `${h_d}${suffix} ${mName} ${h_y} AH`;
  } catch {
    return "";
  }
}

export function parseTime(t: string): Date {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export function getPrayerPeriods(times: Record<string, string>) {
  const now = new Date();

  // Parse all times into Dates for comparison
  const parsed = PRAYERS.map((name) => {
    const t = times[name];
    if (!t) return null;
    const [h, m] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return { name, date: d, timeStr: t };
  }).filter(Boolean) as { name: string; date: Date; timeStr: string }[];

  if (parsed.length === 0) return null;

  // Find next prayer (first one where date > now)
  let nextIdx = parsed.findIndex((p) => p.date > now);

  let current, next;

  if (nextIdx === -1) {
    // All prayers for today have passed.
    // Current is Isha.
    current = parsed[parsed.length - 1];
    // Next is Fajr tomorrow.
    const tomorrowFajr = new Date(parsed[0].date);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    next = {
      name: "Fajr",
      date: tomorrowFajr,
      timeStr: parsed[0].timeStr
    };
  } else if (nextIdx === 0) {
    // Before Fajr.
    // Current is Isha yesterday.
    const yesterdayIsha = new Date(parsed[parsed.length - 1].date);
    yesterdayIsha.setDate(yesterdayIsha.getDate() - 1);
    current = {
      name: "Isha",
      date: yesterdayIsha,
      timeStr: parsed[parsed.length - 1].timeStr
    };
    next = parsed[0];
  } else {
    current = parsed[nextIdx - 1];
    next = parsed[nextIdx];
  }

  // Adjust for the 15-minute Sunrise duration:
  // If the current period is Sunrise, it only lasts 15 minutes.
  // During these 15 minutes, the next target is "Sunrise" end.
  // After 15 minutes, the next target becomes Dhuhr.
  if (current.name === "Sunrise") {
    const sunriseEndTime = new Date(current.date.getTime() + 15 * 60 * 1000);
    if (now < sunriseEndTime) {
      next = {
        name: "Sunrise",
        date: sunriseEndTime,
        timeStr: ""
      };
    }
  }

  return { current, next };
}
