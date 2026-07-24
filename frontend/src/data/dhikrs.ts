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

export type SelectableAdhkar = {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation?: string;
  category: string;
};

export const SELECTABLE_ADHKAAR: SelectableAdhkar[] = [
  {
    id: 'morning-adhkar',
    title: 'Morning Remembrance',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
    transliteration: 'Subhanal-lahi wabihamdih, AAdada khalqihi warida nafsih, wazinata AAarshih, wamidaada kalimaatih',
    translation: 'Glory and praise be to Allah, as much as the number of His creation, as much as pleases Him, as much as the weight of His Throne, and as much as the ink of His words.',
    category: 'dhikr'
  },
  {
    id: 'evening-adhkar',
    title: 'Evening Remembrance',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: 'aAAoothu bikalimatil-lahit-tammati min sharri ma khalaq',
    translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    category: 'dhikr'
  },
  {
    id: 'strengthen-imaan',
    title: 'Strengthen your Imaan',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا وَبِالإِسْلاَمِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا',
    transliteration: 'Radeetu billahi rabban wabil-islami deenan wabiMuhammadin nabiyya',
    translation: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad ﷺ as my Prophet.',
    category: 'dhikr'
  },
  {
    id: 'for-forgiveness',
    title: 'For forgiveness',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullaaha wa \'atoobu \'ilayhi',
    translation: 'I seek forgiveness from Allah and repent to Him.',
    category: 'dhikr'
  },
  {
    id: 'for-thanking-allah',
    title: 'For thanking Allah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdu lillaahi',
    translation: 'Praise be to Allah.',
    category: 'dhikr'
  },
  {
    id: 'for-glorifying-allah',
    title: 'For Glorifying Allah',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    translation: 'Allah is the Greatest.',
    category: 'dhikr'
  },
  {
    id: 'sleep-adhkar',
    title: 'Sleep Remembrance',
    arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ',
    transliteration: 'Bismika Rabbi wada\'tu janbi wa bika arfa\'uh',
    translation: 'In Your name, my Lord, I lay down my side and in Your name I raise it up.',
    category: 'dhikr'
  },
  {
    id: 'dhikr-after-salah',
    title: 'Dhikr After Salah',
    arabic: 'الأذكار بعد الصلاة',
    transliteration: 'Al-Adhkar ba\'d as-Salah',
    translation: 'Remembrance recited after obligatory prayers.',
    category: 'dhikr'
  },
  {
    id: 'istighfar-100',
    title: 'Istighfar (100 times)',
    arabic: 'استغفار ١٠٠ مرة',
    transliteration: 'Astaghfirullah x100',
    translation: 'Recite Istighfar 100 times daily.',
    category: 'dhikr'
  }
];
