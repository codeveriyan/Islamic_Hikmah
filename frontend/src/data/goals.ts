// Daily Goals Data
export type Goal = {
  id: string;
  title: string;
  subtitle?: string;
  arabic?: string;
  category: 'prayer' | 'quran' | 'dhikr' | 'other';
  repeat?: 'daily' | 'weekly';
  weekDay?: number; // 0=Sun, 1=Mon... for weekly goals
};

export const DEFAULT_GOALS: Goal[] = [
  { id: 'fajr', title: 'Offer Fajr', category: 'prayer', repeat: 'daily' },
  { id: 'dhuhr', title: 'Offer Dhuhr', category: 'prayer', repeat: 'daily' },
  { id: 'asr', title: 'Offer Asr', category: 'prayer', repeat: 'daily' },
  { id: 'maghrib', title: 'Offer Maghrib', category: 'prayer', repeat: 'daily' },
  { id: 'isha', title: 'Offer Isha', category: 'prayer', repeat: 'daily' },
  { id: 'quran-5min', title: 'Read Quran (5 Minutes)', subtitle: 'Daily recitation', category: 'quran', repeat: 'daily' },
  { id: 'surah-mulk', title: 'Recite Surah Mulk', subtitle: 'Before sleeping', category: 'quran', repeat: 'daily' },
  { id: 'morning-adhkar', title: 'Morning Adhkar', arabic: 'أذكار الصباح', category: 'dhikr', repeat: 'daily' },
  { id: 'evening-adhkar', title: 'Evening Adhkar', arabic: 'أذكار المساء', category: 'dhikr', repeat: 'daily' },
  { id: 'sleep-adhkar', title: 'Sleep Adhkar', arabic: 'أذكار النوم', category: 'dhikr', repeat: 'daily' },
  { id: 'fast-monday', title: 'Fast on Monday', subtitle: 'Repeats weekly', category: 'other', repeat: 'weekly', weekDay: 1 },
  { id: 'fast-thursday', title: 'Fast on Thursday', subtitle: 'Repeats weekly', category: 'other', repeat: 'weekly', weekDay: 4 },
  { id: 'surah-kahaf', title: 'Recite Surah Kahaf', subtitle: 'Every Friday', category: 'quran', repeat: 'weekly', weekDay: 5 },
  { id: 'tahajjud', title: 'Offer Tahajjud', subtitle: 'Night prayer', category: 'prayer', repeat: 'daily' },
  { id: 'nafl', title: 'Offer Nafl Prayer', category: 'prayer', repeat: 'daily' },
];

export const CATEGORY_COLORS: Record<string, string> = {
  prayer: '#10B981',
  quran: '#6366F1',
  dhikr: '#F59E0B',
  other: '#14B8A6',
};
