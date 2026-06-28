export type DuaItem = {
  id: string;
  title: string;
  arabic: string;
  transliteration?: string;
  translation: string;
  reference?: string;
  repeat?: number;
};

export type DuaCategory = {
  id: string;
  title: string;
  group: 'main' | 'other';
  gradient: readonly [string, string];
  icon: string;
  image?: string;
  duas: DuaItem[];
};

export const CATEGORIES: DuaCategory[] = [
  {
    id: 'ummah',
    title: "Du'as for the Ummah",
    group: 'main',
    gradient: ['#C2410C', '#F59E0B'],
    icon: 'mosque',
    duas: [
      {
        id: 'ummah-1',
        title: 'For unity of the Ummah',
        arabic: 'اللَّهُمَّ أَلِّفْ بَيْنَ قُلُوبِنَا، وَأَصْلِحْ ذَاتَ بَيْنِنَا، وَاهْدِنَا سُبُلَ السَّلَامِ',
        transliteration: "Allahumma allif bayna qulubina, wa aslih dhata bayni-na, wahdina subula-s-salam",
        translation: 'O Allah, unite our hearts, set right our affairs, and guide us to the paths of peace.',
        reference: 'Abu Dawud',
      },
      {
        id: 'ummah-2',
        title: 'For the oppressed',
        arabic: 'اللَّهُمَّ انْصُرْ إِخْوَانَنَا الْمُسْتَضْعَفِينَ فِي كُلِّ مَكَانٍ',
        transliteration: "Allahumma-nsur ikhwanana al-mustad'afina fi kulli makan",
        translation: 'O Allah, help our oppressed brothers and sisters everywhere.',
      },
    ],
  },
  {
    id: 'morning',
    title: 'Morning',
    group: 'main',
    gradient: ['#0EA5E9', '#FBBF24'],
    icon: 'weather-sunny',
    duas: [
      {
        id: 'morning-1',
        title: 'Upon waking',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
        transliteration: "Alhamdu lillahi alladhi ahyana ba'da ma amatana wa ilayhi-n-nushur",
        translation: 'Praise be to Allah Who gave us life after death and to Him is the resurrection.',
        reference: 'Bukhari',
      },
      {
        id: 'morning-2',
        title: 'Morning remembrance',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',
        transliteration: 'Asbahna wa asbaha-l-mulku lillah, wal-hamdu lillah',
        translation: 'We have entered the morning and the kingdom belongs to Allah, all praise is for Allah.',
        reference: 'Muslim',
      },
      {
        id: 'morning-3',
        title: 'Sayyid al-Istighfar',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ',
        transliteration: "Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana 'abduka",
        translation: 'O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant.',
        reference: 'Bukhari',
      },
    ],
  },
  {
    id: 'evening',
    title: 'Evening',
    group: 'main',
    gradient: ['#DC2626', '#F97316'],
    icon: 'weather-sunset',
    duas: [
      {
        id: 'evening-1',
        title: 'Evening remembrance',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ',
        transliteration: 'Amsayna wa amsa-l-mulku lillah, wal-hamdu lillah',
        translation: 'We have entered the evening and the kingdom belongs to Allah, praise be to Allah.',
        reference: 'Muslim',
      },
      {
        id: 'evening-2',
        title: 'Protection in evening',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ',
        transliteration: "Bismillah-illadhi la yadurru ma'as-mihi shay'un fil-ardi wa la fis-sama",
        translation: 'In the name of Allah, with Whose name nothing on earth or in heaven can cause harm.',
        reference: 'Tirmidhi',
        repeat: 3,
      },
    ],
  },
  {
    id: 'sleep',
    title: 'Before Sleep',
    group: 'main',
    gradient: ['#1E40AF', '#312E81'],
    icon: 'moon-waning-crescent',
    duas: [
      {
        id: 'sleep-1',
        title: 'Before sleeping',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: 'Bismika Allahumma amutu wa ahya',
        translation: 'In Your name, O Allah, I die and I live.',
        reference: 'Bukhari',
      },
      {
        id: 'sleep-2',
        title: 'Surah al-Ikhlas reflection',
        arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        transliteration: 'Qul huwa Allahu ahad',
        translation: 'Say: He is Allah, the One.',
        reference: 'Surah Al-Ikhlas',
        repeat: 3,
      },
    ],
  },
  {
    id: 'tahajjud',
    title: 'Tahajjud',
    group: 'main',
    gradient: ['#4338CA', '#7C3AED'],
    icon: 'star-four-points',
    duas: [
      {
        id: 'tahajjud-1',
        title: 'Opening of Tahajjud',
        arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَوَاتِ وَالْأَرْضِ',
        transliteration: 'Allahumma laka-l-hamdu anta nuru-s-samawati wal-ard',
        translation: 'O Allah, all praise is for You; You are the Light of the heavens and earth.',
        reference: 'Bukhari',
      },
    ],
  },
  {
    id: 'salah',
    title: 'Salah',
    group: 'main',
    gradient: ['#047857', '#10B981'],
    icon: 'hands-pray',
    duas: [
      {
        id: 'salah-1',
        title: 'Opening Dua',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، وَتَبَارَكَ اسْمُكَ، وَتَعَالَى جَدُّكَ',
        transliteration: 'Subhanaka Allahumma wa bihamdika, wa tabaraka-smuka, wa ta`ala jadduk',
        translation: 'Glory be to You, O Allah, and praise; blessed is Your Name and exalted is Your Majesty.',
      },
    ],
  },
  {
    id: 'after-salah',
    title: 'After Salah',
    group: 'main',
    gradient: ['#0891B2', '#06B6D4'],
    icon: 'check-decagram',
    duas: [
      {
        id: 'after-1',
        title: 'After Salam',
        arabic: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah, Astaghfirullah, Astaghfirullah',
        translation: 'I seek the forgiveness of Allah (×3).',
        reference: 'Muslim',
        repeat: 3,
      },
    ],
  },
  {
    id: 'istikharah',
    title: 'Istikharah',
    group: 'other',
    gradient: ['#15803D', '#65A30D'],
    icon: 'compass',
    duas: [
      {
        id: 'isti-1',
        title: 'Istikharah Dua',
        arabic: 'اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ وَأَسْتَقْدِرُكَ بِقُدْرَتِكَ',
        transliteration: 'Allahumma inni astakhiruka bi-ilmika wa astaqdiruka bi-qudratik',
        translation: 'O Allah, I seek Your guidance by Your knowledge and Your power.',
        reference: 'Bukhari',
      },
    ],
  },
  {
    id: 'gatherings',
    title: 'Gatherings',
    group: 'other',
    gradient: ['#0E7490', '#22D3EE'],
    icon: 'account-group',
    duas: [
      {
        id: 'gather-1',
        title: 'Closing a gathering',
        arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ',
        transliteration: 'Subhanaka Allahumma wa bihamdika, ashhadu an la ilaha illa anta, astaghfiruka wa atubu ilayk',
        translation: 'Glory be to You, O Allah, I bear witness that none deserves worship but You; I seek Your forgiveness and turn to You.',
      },
    ],
  },
  {
    id: 'difficulties',
    title: 'Difficulties & Happiness',
    group: 'other',
    gradient: ['#1D4ED8', '#60A5FA'],
    icon: 'emoticon-happy',
    duas: [
      {
        id: 'diff-1',
        title: 'In times of distress',
        arabic: 'لَا إِلَهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ، لَا إِلَهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'La ilaha illa-llah-ul-`adheem-ul-haleem, la ilaha illa-llahu rabb-ul-`arsh-il-`adheem',
        translation: 'There is none worthy of worship but Allah, the Mighty, the Forbearing.',
        reference: 'Bukhari',
      },
    ],
  },
  {
    id: 'iman',
    title: 'Protection of Iman',
    group: 'other',
    gradient: ['#0369A1', '#0EA5E9'],
    icon: 'shield-star',
    duas: [
      {
        id: 'iman-1',
        title: 'Steadfastness',
        arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
        transliteration: 'Ya muqalliba-l-qulub, thabbit qalbi `ala dinik',
        translation: 'O Turner of the hearts, keep my heart firm on Your religion.',
        reference: 'Tirmidhi',
      },
    ],
  },
  {
    id: 'hajj',
    title: 'Hajj & Umrah',
    group: 'other',
    gradient: ['#047857', '#34D399'],
    icon: 'mosque',
    duas: [
      {
        id: 'hajj-1',
        title: 'Talbiyah',
        arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ',
        transliteration: 'Labbayka Allahumma labbayk, labbayka la sharika laka labbayk',
        translation: 'Here I am O Allah, here I am. Here I am, You have no partner, here I am.',
        reference: 'Bukhari',
      },
    ],
  },
  {
    id: 'travel',
    title: 'Travel',
    group: 'other',
    gradient: ['#B91C1C', '#F87171'],
    icon: 'airplane',
    duas: [
      {
        id: 'travel-1',
        title: 'Beginning a journey',
        arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ',
        transliteration: "Subhana-lladhi sakhkhara lana hadha wa ma kunna lahu muqrinin",
        translation: 'Glory be to Him Who has subjected this to us; we could never have it (otherwise).',
        reference: 'Quran 43:13',
      },
    ],
  },
  {
    id: 'money',
    title: 'Money & Shopping',
    group: 'other',
    gradient: ['#EA580C', '#FDBA74'],
    icon: 'cash-multiple',
    duas: [
      {
        id: 'money-1',
        title: 'For lawful sustenance',
        arabic: 'اللَّهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
        transliteration: 'Allahumma ikfini bi-halalika `an haramik, wa aghnini bi-fadlika `amman siwak',
        translation: 'O Allah, suffice me with what You have made lawful, free from what You have made unlawful, and enrich me by Your grace.',
        reference: 'Tirmidhi',
      },
    ],
  },
  {
    id: 'social',
    title: 'Social Interactions',
    group: 'other',
    gradient: ['#0F766E', '#5EEAD4'],
    icon: 'message-text',
    duas: [
      {
        id: 'social-1',
        title: 'For good character',
        arabic: 'اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي',
        transliteration: 'Allahumma kama hassanta khalqi fa-hassin khuluqi',
        translation: 'O Allah, as You have beautified my appearance, beautify my character.',
        reference: 'Ahmad',
      },
    ],
  },
  {
    id: 'marriage',
    title: 'Marriage & Children',
    group: 'other',
    gradient: ['#BE185D', '#F472B6'],
    icon: 'heart-multiple',
    duas: [
      {
        id: 'mar-1',
        title: 'For righteous offspring',
        arabic: 'رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ',
        transliteration: 'Rabbi hab li mina-s-salihin',
        translation: 'My Lord, grant me a child from among the righteous.',
        reference: 'Quran 37:100',
      },
    ],
  },
  {
    id: 'death',
    title: 'Death',
    group: 'other',
    gradient: ['#9333EA', '#F9A8D4'],
    icon: 'leaf',
    duas: [
      {
        id: 'death-1',
        title: 'For the deceased',
        arabic: 'اللَّهُمَّ اغْفِرْ لَهُ وَارْحَمْهُ وَعَافِهِ وَاعْفُ عَنْهُ',
        transliteration: 'Allahumma-ghfir lahu warhamhu wa `afihi wa`fu `anh',
        translation: 'O Allah, forgive him, have mercy on him, give him strength, and pardon him.',
        reference: 'Muslim',
      },
    ],
  },
  {
    id: 'nature',
    title: 'Nature',
    group: 'other',
    gradient: ['#6D28D9', '#06B6D4'],
    icon: 'pine-tree',
    duas: [
      {
        id: 'nature-1',
        title: 'When it rains',
        arabic: 'اللَّهُمَّ صَيِّبًا نَافِعًا',
        transliteration: 'Allahumma sayyiban nafi`a',
        translation: 'O Allah, (let it be) a beneficial rain.',
        reference: 'Bukhari',
      },
    ],
  },
  {
    id: 'ramadan',
    title: 'Ramadan',
    group: 'other',
    gradient: ['#EA580C', '#FCD34D'],
    icon: 'moon-waning-crescent',
    duas: [
      {
        id: 'ram-1',
        title: 'Breaking fast',
        arabic: 'ذَهَبَ الظَّمَأُ، وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
        transliteration: 'Dhahaba-z-zama, wa-btallat-il-`uruq, wa thabata-l-ajru in sha Allah',
        translation: 'Thirst is gone, the veins are moistened, and the reward is confirmed if Allah wills.',
        reference: 'Abu Dawud',
      },
      {
        id: 'ram-2',
        title: 'Laylat al-Qadr',
        arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
        transliteration: "Allahumma innaka `afuwwun tuhibbu-l-`afwa fa`fu `anni",
        translation: 'O Allah, You are Pardoning and You love pardon, so pardon me.',
        reference: 'Tirmidhi',
      },
    ],
  },
];

export const getCategory = (id: string) => CATEGORIES.find((c) => c.id === id);
