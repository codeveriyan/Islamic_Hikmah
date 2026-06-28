export type Dhikr = {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  goal: number;
};

export const DHIKRS: Dhikr[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    translation: 'Glory be to Allah',
    goal: 33,
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    translation: 'Praise be to Allah',
    goal: 33,
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest',
    goal: 34,
  },
  {
    id: 'lailaha',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illallah',
    translation: 'There is no god but Allah',
    goal: 100,
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    translation: 'I seek forgiveness of Allah',
    goal: 100,
  },
      {
        id: 'salawat',
        arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
        transliteration: 'Salawat',
        translation: 'O Allah, send blessings upon Muhammad ﷺ',
        goal: 100,
      },
  {
    id: 'subhanwabihamd',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhan Allahi wa bihamdihi',
    translation: 'Glory be to Allah and praise be to Him (light on tongue, heavy on scale)',
    goal: 100,
  },
  {
    id: 'lahawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    translation: 'There is no might nor power except with Allah (a treasure from Paradise)',
    goal: 100,
  },
  {
    id: 'tahlil',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illa-llah wahdahu la sharika lah…',
    translation: 'There is no god but Allah alone, no partner — to Him belongs dominion & praise — He has power over all things.',
    goal: 100,
  },
];
