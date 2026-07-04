// Islamic events by Hijri month and day.
// These are fixed Hijri dates — they shift in the Gregorian calendar every year.
// Conversion is done at runtime using the Aladhan Hijri-to-Gregorian API.

export type IslamicEvent = {
  id: string;
  hijriMonth: number; // 1–12
  hijriDay: number;
  title: string;
  description: string;
  type: "obligatory" | "recommended" | "historical" | "commemoration";
  color: string;
};

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  // Muharram (1)
  {
    id: "new-year",
    hijriMonth: 1, hijriDay: 1,
    title: "Islamic New Year",
    description: "The first day of Muharram marks the beginning of the new Hijri year.",
    type: "historical", color: "#6366F1",
  },
  {
    id: "ashura",
    hijriMonth: 1, hijriDay: 10,
    title: "Day of Ashura",
    description: "A day of fasting. Allah saved Musa (AS) from Pharaoh on this day. The Prophet (SAW) fasted and encouraged fasting on this day.",
    type: "recommended", color: "#10B981",
  },

  // Rabi al-Awwal (3)
  {
    id: "mawlid",
    hijriMonth: 3, hijriDay: 12,
    title: "Mawlid al-Nabi ﷺ",
    description: "The birth of Prophet Muhammad ﷺ. A day to increase salawat and reflect on his blessed life.",
    type: "historical", color: "#F59E0B",
  },

  // Rajab (7)
  {
    id: "isra-miraj",
    hijriMonth: 7, hijriDay: 27,
    title: "Isra wal Miraj",
    description: "The night journey of the Prophet ﷺ from Makkah to Jerusalem and his ascension through the heavens.",
    type: "historical", color: "#8B5CF6",
  },

  // Sha'ban (8)
  {
    id: "shaban-15",
    hijriMonth: 8, hijriDay: 15,
    title: "Laylat al-Bara'ah",
    description: "The 15th night of Sha'ban. Many scholars recommend spending it in worship and seeking forgiveness.",
    type: "recommended", color: "#14B8A6",
  },
  {
    id: "ramadan-start-eve",
    hijriMonth: 8, hijriDay: 29,
    title: "Eve of Ramadan",
    description: "Look for the crescent moon tonight — Ramadan begins tomorrow if sighted.",
    type: "obligatory", color: "#F59E0B",
  },

  // Ramadan (9)
  {
    id: "ramadan-1",
    hijriMonth: 9, hijriDay: 1,
    title: "First Day of Ramadan",
    description: "The blessed month of fasting begins. May Allah accept our fasts and worship.",
    type: "obligatory", color: "#F59E0B",
  },
  {
    id: "laylat-qadr-21",
    hijriMonth: 9, hijriDay: 21,
    title: "Seek Laylat al-Qadr",
    description: "The last ten nights begin. Increase worship — Laylat al-Qadr is better than a thousand months.",
    type: "obligatory", color: "#EF4444",
  },
  {
    id: "laylat-qadr-27",
    hijriMonth: 9, hijriDay: 27,
    title: "27th Night — Laylat al-Qadr",
    description: "The night most commonly associated with Laylat al-Qadr. Spend it in prayer, Quran and dua.",
    type: "obligatory", color: "#EF4444",
  },
  {
    id: "ramadan-last",
    hijriMonth: 9, hijriDay: 29,
    title: "Last Day of Ramadan",
    description: "Pay Zakat al-Fitr today before Eid prayer tomorrow. May Allah accept all our worship.",
    type: "obligatory", color: "#F59E0B",
  },

  // Shawwal (10)
  {
    id: "eid-fitr",
    hijriMonth: 10, hijriDay: 1,
    title: "Eid al-Fitr 🎉",
    description: "The festival of breaking the fast. Offer Eid prayer, give sadaqah and celebrate with family.",
    type: "obligatory", color: "#10B981",
  },
  {
    id: "shawwal-6",
    hijriMonth: 10, hijriDay: 6,
    title: "6 Days of Shawwal",
    description: "Fast any 6 days of Shawwal after Eid — it is as if you fasted the entire year.",
    type: "recommended", color: "#10B981",
  },

  // Dhul Hijjah (12)
  {
    id: "dhul-hijjah-1",
    hijriMonth: 12, hijriDay: 1,
    title: "First Ten Days of Dhul Hijjah",
    description: "The Prophet ﷺ said: 'No good deeds are better than what is done in these ten days.' Increase fasting, dhikr and good deeds.",
    type: "recommended", color: "#C5A880",
  },
  {
    id: "arafah",
    hijriMonth: 12, hijriDay: 9,
    title: "Day of Arafah",
    description: "The greatest day of the year. Fast this day — it expiates sins of the past and coming year. Pilgrims stand on the plain of Arafah.",
    type: "recommended", color: "#EF4444",
  },
  {
    id: "eid-adha",
    hijriMonth: 12, hijriDay: 10,
    title: "Eid al-Adha 🐑",
    description: "The festival of sacrifice. Offer Eid prayer and sacrifice an animal in remembrance of Ibrahim (AS).",
    type: "obligatory", color: "#10B981",
  },
  {
    id: "tashriq-1",
    hijriMonth: 12, hijriDay: 11,
    title: "Days of Tashriq",
    description: "The 11th, 12th and 13th of Dhul Hijjah are days of eating, drinking and remembering Allah.",
    type: "historical", color: "#C5A880",
  },
];

export const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah",
];

export const EVENT_TYPE_LABELS = {
  obligatory: "Obligatory",
  recommended: "Recommended",
  historical: "Historical",
  commemoration: "Commemoration",
};
