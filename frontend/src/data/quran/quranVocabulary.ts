export type QuranWord = {
  id: string;
  arabic: string;
  english: string;
  root: string;
  frequency: number;
  category: 'theology' | 'nature' | 'hereafter' | 'prophets' | 'actions' | 'common';
  exampleVerse: string;
  exampleTranslation: string;
  surahNum: number;
  ayahNum: number;
};

export const QURAN_VOCABULARY: QuranWord[] = [
  // theology
  {
    id: "1",
    arabic: "ٱللَّه",
    english: "Allah (God)",
    root: "أ - ل - ه",
    frequency: 2699,
    category: "theology",
    exampleVerse: "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
    exampleTranslation: "[All] praise is [due] to Allah, Lord of the worlds",
    surahNum: 1,
    ayahNum: 2
  },
  {
    id: "2",
    arabic: "رَبّ",
    english: "Lord / Sustainer",
    root: "ر - ب - ب",
    frequency: 975,
    category: "theology",
    exampleVerse: "ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ",
    exampleTranslation: "[All] praise is [due] to Allah, Lord of the worlds",
    surahNum: 1,
    ayahNum: 2
  },
  {
    id: "3",
    arabic: "إِلَٰه",
    english: "God / Deity",
    root: "أ - ل - ه",
    frequency: 147,
    category: "theology",
    exampleVerse: "لَآ إِلَٰهَ إِلَّا هُوَ ٱلۡحَيُّ ٱلۡقَيُّومُ",
    exampleTranslation: "There is no deity except Him, the Ever-Living, the Sustainer of existence",
    surahNum: 2,
    ayahNum: 255
  },
  {
    id: "4",
    arabic: "مَلَك",
    english: "Angel",
    root: "م - ل - ك",
    frequency: 88,
    category: "theology",
    exampleVerse: "وَإِذۡ قَالَ رَبُّكَ لِلۡمَلَٰٓئِكَةِ إِنِّي جَاعِلٌ فِي ٱلۡأَرۡضِ خَلِيفَةٗ",
    exampleTranslation: "And when your Lord said to the angels, 'Indeed, I will make upon the earth a successive authority'",
    surahNum: 2,
    ayahNum: 30
  },
  {
    id: "5",
    arabic: "صَلَوٰة",
    english: "Prayer",
    root: "ص - ل - و",
    frequency: 83,
    category: "theology",
    exampleVerse: "ٱلَّذِينَ يُؤۡمِنُونَ بِٱلۡغَيۡبِ وَيُقِيمُونَ ٱلصَّلَٰوةَ",
    exampleTranslation: "Who believe in the unseen, establish prayer",
    surahNum: 2,
    ayahNum: 3
  },
  {
    id: "6",
    arabic: "عَلِيم",
    english: "All-Knowing",
    root: "ع - ل - م",
    frequency: 162,
    category: "theology",
    exampleVerse: "وَٱللَّهُ بِكُلِّ شَيۡءٍ عَلِيمٌ",
    exampleTranslation: "And Allah is Knowing of all things",
    surahNum: 2,
    ayahNum: 282
  },
  {
    id: "7",
    arabic: "رَحْمَٰن",
    english: "The Most Gracious",
    root: "ر - ح - م",
    frequency: 57,
    category: "theology",
    exampleVerse: "ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ",
    exampleTranslation: "The Most Gracious, the Most Merciful",
    surahNum: 1,
    ayahNum: 3
  },
  {
    id: "8",
    arabic: "تَقۡوَىٰ",
    english: "Piety / God-consciousness",
    root: "و - ق - ي",
    frequency: 15,
    category: "theology",
    exampleVerse: "وَتَعَاوَنُوا عَلَى ٱلۡبِرِّ وَٱلتَّقۡوَىٰ",
    exampleTranslation: "And cooperate in righteousness and piety",
    surahNum: 5,
    ayahNum: 2
  },
  {
    id: "9",
    arabic: "غَفُور",
    english: "All-Forgiving",
    root: "غ - ف - ر",
    frequency: 91,
    category: "theology",
    exampleVerse: "إِنَّ ٱللَّهَ غَفُورٌ رَّحِيمٌ",
    exampleTranslation: "Indeed, Allah is Forgiving and Merciful",
    surahNum: 2,
    ayahNum: 173
  },
  {
    id: "10",
    arabic: "دِين",
    english: "Religion / Way of Life",
    root: "د - ي - ن",
    frequency: 92,
    category: "theology",
    exampleVerse: "لَكُمۡ دِينُكُمۡ وَلِيَ دِينِ",
    exampleTranslation: "For you is your religion, and for me is my religion",
    surahNum: 109,
    ayahNum: 6
  },

  // nature
  {
    id: "21",
    arabic: "أَرَض",
    english: "Earth / Land",
    root: "أ - ر - ض",
    frequency: 461,
    category: "nature",
    exampleVerse: "لَهُۥ مَا فِي ٱلسَّمَٰوَٰتِ وَمَا فِي ٱلۡأَرۡضِ",
    exampleTranslation: "To Him belongs whatever is in the heavens and whatever is on the earth.",
    surahNum: 2,
    ayahNum: 255
  },
  {
    id: "22",
    arabic: "سَمَاء",
    english: "Sky / Heaven",
    root: "س - م - و",
    frequency: 310,
    category: "nature",
    exampleVerse: "ٱلَّذِي جَعَلَ لَكُمُ ٱلۡأَرۡضَ فِرَٰشٗا وَٱلسَّمَآءَ بِنَآءٗ",
    exampleTranslation: "[He] who made for you the earth a bed [spread out] and the sky a ceiling",
    surahNum: 2,
    ayahNum: 22
  },
  {
    id: "23",
    arabic: "مَاء",
    english: "Water",
    root: "م - و - ه",
    frequency: 63,
    category: "nature",
    exampleVerse: "وَأَنزَلَ مِنَ ٱلسَّمَآءِ مَآءٗ فَأَخۡرَجَ بِهِۦ مِنَ ٱلثَّمَرَٰتِ رِزۡقٗا لَّكُمۡ",
    exampleTranslation: "and sent down from the sky, rain and brought forth thereby fruits as provision for you",
    surahNum: 2,
    ayahNum: 22
  },
  {
    id: "24",
    arabic: "نُور",
    english: "Light",
    root: "ن - و - ر",
    frequency: 43,
    category: "nature",
    exampleVerse: "ٱللَّهُ نُورُ ٱلسَّمَٰوَٰتِ وَٱلۡأَرۡضِ",
    exampleTranslation: "Allah is the Light of the heavens and the earth",
    surahNum: 24,
    ayahNum: 35
  },
  {
    id: "25",
    arabic: "شَمۡس",
    english: "Sun",
    root: "ش - م - س",
    frequency: 33,
    category: "nature",
    exampleVerse: "وَٱلشَّمۡسِ وَضُحَىٰهَا",
    exampleTranslation: "By the sun and its brightness",
    surahNum: 91,
    ayahNum: 1
  },
  {
    id: "26",
    arabic: "قَمَر",
    english: "Moon",
    root: "ق - م - ر",
    frequency: 26,
    category: "nature",
    exampleVerse: "وَٱلۡقَمَرِ إِذَا تَلَىٰهَا",
    exampleTranslation: "And [by] the moon when it follows it",
    surahNum: 91,
    ayahNum: 2
  },
  {
    id: "27",
    arabic: "لَيۡل",
    english: "Night",
    root: "ل - ي - ل",
    frequency: 92,
    category: "nature",
    exampleVerse: "وَٱلَّيۡلِ إِذَا يَغۡشَىٰهَا",
    exampleTranslation: "And [by] the night when it covers it",
    surahNum: 91,
    ayahNum: 4
  },
  {
    id: "28",
    arabic: "نَهَار",
    english: "Daylight",
    root: "ن - ه - ر",
    frequency: 57,
    category: "nature",
    exampleVerse: "وَٱلنَّهَارِ إِذَا جَلَّىٰهَا",
    exampleTranslation: "And [by] the day when it displays it",
    surahNum: 91,
    ayahNum: 3
  },
  {
    id: "29",
    arabic: "بَحۡر",
    english: "Sea / River",
    root: "ب - ح - ر",
    frequency: 41,
    category: "nature",
    exampleVerse: "مَرَجَ ٱلۡبَحۡرَيۡنِ يَلۡتَقِيَانِ",
    exampleTranslation: "He released the two seas, meeting [side by side]",
    surahNum: 55,
    ayahNum: 19
  },
  {
    id: "30",
    arabic: "جَبَل",
    english: "Mountain",
    root: "ج - ب - ل",
    frequency: 39,
    category: "nature",
    exampleVerse: "وَإِلَى ٱلۡجِبَالِ كَيۡفَ نُصِبَتۡ",
    exampleTranslation: "And at the mountains - how they are erected",
    surahNum: 88,
    ayahNum: 19
  },

  // hereafter
  {
    id: "41",
    arabic: "يَوْم",
    english: "Day",
    root: "ي - و - م",
    frequency: 405,
    category: "hereafter",
    exampleVerse: "مَٰلِكِ يَوْمِ ٱلدِّينِ",
    exampleTranslation: "Sovereign of the Day of Recompense",
    surahNum: 1,
    ayahNum: 4
  },
  {
    id: "42",
    arabic: "جَنَّة",
    english: "Paradise / Garden",
    root: "ج - ن -ن",
    frequency: 147,
    category: "hereafter",
    exampleVerse: "وَبَشِّرِ ٱلَّذِينَ ءَامَنُوا وَعَمِلُوا ٱلصَّٰلِحَٰتِ أَنَّ لَهُمۡ جَنَّٰتٍ",
    exampleTranslation: "And give good tidings to those who believe and do righteous deeds that they will have gardens",
    surahNum: 2,
    ayahNum: 25
  },
  {
    id: "43",
    arabic: "نَار",
    english: "Fire / Hellfire",
    root: "ن - و - ر",
    frequency: 145,
    category: "hereafter",
    exampleVerse: "فَٱتَّقُوا ٱلنَّارَ ٱلَّتِي وَقُودُهَا ٱلنَّاسُ وَٱلۡحِجَارَةُ",
    exampleTranslation: "then fear the Fire, whose fuel is men and stones",
    surahNum: 2,
    ayahNum: 24
  },
  {
    id: "44",
    arabic: "آخِرَة",
    english: "Hereafter",
    root: "أ - خ - ر",
    frequency: 115,
    category: "hereafter",
    exampleVerse: "وَبِٱلۡأَخِرَةِ هُمۡ يُوقِنُونَ",
    exampleTranslation: "and of the Hereafter they are certain [in faith]",
    surahNum: 2,
    ayahNum: 4
  },
  {
    id: "45",
    arabic: "مَوْت",
    english: "Death",
    root: "م - و - ت",
    frequency: 165,
    category: "hereafter",
    exampleVerse: "كُلُّ نَفۡسٍ ذَآئِقَةُ ٱلۡمَوْتِ",
    exampleTranslation: "Every soul will taste death",
    surahNum: 3,
    ayahNum: 185
  },
  {
    id: "46",
    arabic: "حَيَاة",
    english: "Life",
    root: "ح - ي - ي",
    frequency: 76,
    category: "hereafter",
    exampleVerse: "وَمَا ٱلۡحَيَٰوةُ ٱلدُّنۡيَآ إِلَّا لَعِبٌ وَلَهۡوٌ",
    exampleTranslation: "And the worldly life is not but amusement and diversion",
    surahNum: 6,
    ayahNum: 32
  },
  {
    id: "47",
    arabic: "قِيَامَة",
    english: "Resurrection",
    root: "ق - و - م",
    frequency: 70,
    category: "hereafter",
    exampleVerse: "لَآ أُقۡسِمُ بِيَوْمِ ٱلۡقِيَٰمَةِ",
    exampleTranslation: "I swear by the Day of Resurrection",
    surahNum: 75,
    ayahNum: 1
  },
  {
    id: "48",
    arabic: "حِسَاب",
    english: "Account / Recompense",
    root: "ح - س - ب",
    frequency: 39,
    category: "hereafter",
    exampleVerse: "إِنَّ ٱلَّذِينَ يَضِلُّونَ عَن سَبِيلِ ٱللَّهِ لَهُمۡ عَذَابٌ شَدِيدُۢ بِمَا نَسُوا يَوْمَ ٱلۡحِسَابِ",
    exampleTranslation: "Indeed, those who go astray from the way of Allah will have a severe punishment for having forgotten the Day of Account",
    surahNum: 38,
    ayahNum: 26
  },
  {
    id: "49",
    arabic: "جَهَنَّم",
    english: "Hell",
    root: "ج - ه - ن - م",
    frequency: 77,
    category: "hereafter",
    exampleVerse: "إِنَّ جَهَنَّمَ كَانَتۡ مِرۡصَادٗا",
    exampleTranslation: "Indeed, Hell has been lying in wait",
    surahNum: 78,
    ayahNum: 21
  },
  {
    id: "50",
    arabic: "سَاعَة",
    english: "The Hour (Day of Judgment)",
    root: "س - و - ع",
    frequency: 48,
    category: "hereafter",
    exampleVerse: "إِنَّ ٱلسَّاعَةَ ءَاتِيَةٌ أَعَادُ أُخۡفِيهَا",
    exampleTranslation: "Indeed, the Hour is coming - I almost conceal it",
    surahNum: 20,
    ayahNum: 15
  },

  // prophets
  {
    id: "61",
    arabic: "رَسُول",
    english: "Messenger",
    root: "ر - س - ل",
    frequency: 332,
    category: "prophets",
    exampleVerse: "مُّحَمَّدٌ رَّسُولُ ٱللَّهِ",
    exampleTranslation: "Muhammad is the Messenger of Allah",
    surahNum: 48,
    ayahNum: 29
  },
  {
    id: "62",
    arabic: "نَبِيّ",
    english: "Prophet",
    root: "ن - ب - أ",
    frequency: 75,
    category: "prophets",
    exampleVerse: "مَّا كَانَ مُحَمَّدٌ أَبَآ أَحَدٍ مِّن رِّجَالِكُمۡ وَلَٰكِن رَّسُولَ ٱللَّهِ وَخَاتَمَ ٱلنَّبِيِّۦنَ",
    exampleTranslation: "Muhammad is not the father of [any] one of your men, but [he is] the Messenger of Allah and last of the prophets",
    surahNum: 33,
    ayahNum: 40
  },
  {
    id: "63",
    arabic: "كِتَاب",
    english: "Book / Scripture",
    root: "ك - t - ب",
    frequency: 261,
    category: "prophets",
    exampleVerse: "ذَٰلِكَ ٱلۡكِتَٰبُ لَا رَيۡبَۛ فِيهِۛ هُدٗى لِّلۡمُتَّقِينَ",
    exampleTranslation: "This is the Book about which there is no doubt, a guidance for those conscious of Allah",
    surahNum: 2,
    ayahNum: 2
  },
  {
    id: "64",
    arabic: "آيَة",
    english: "Sign / Verse",
    root: "أ - ي - ي",
    frequency: 382,
    category: "prophets",
    exampleVerse: "تِلۡكَ ءَايَٰتُ ٱللَّهِ نَتۡلُوهَا عَلَيۡكَ بِٱلۡحَقِّ",
    exampleTranslation: "These are the verses of Allah which We recite to you in truth",
    surahNum: 2,
    ayahNum: 252
  },
  {
    id: "65",
    arabic: "قَوْم",
    english: "People / Nation",
    root: "ق - و - م",
    frequency: 383,
    category: "prophets",
    exampleVerse: "يَٰقَوْمِ ٱعۡبُدُوا ٱللَّهَ مَا لَكُم مِّنۡ إِلَٰهٍ غَيۡرُهُۥ",
    exampleTranslation: "O my people, worship Allah; you have no deity other than Him",
    surahNum: 7,
    ayahNum: 59
  },
  {
    id: "66",
    arabic: "مُحَمَّد",
    english: "Muhammad",
    root: "ح - م - د",
    frequency: 4,
    category: "prophets",
    exampleVerse: "وَمَا مُحَمَّدٌ إِلَّا رَسُولٌ قَدۡ خَلَتۡ مِن قَبۡلِهِ ٱلرُّسُلُ",
    exampleTranslation: "Muhammad is not but a messenger. [Other] messengers have passed on before him",
    surahNum: 3,
    ayahNum: 144
  },
  {
    id: "67",
    arabic: "إِبۡرَٰهِيم",
    english: "Abraham",
    root: "Hebrew",
    frequency: 69,
    category: "prophets",
    exampleVerse: "إِذۡ قَالَ إِبۡرَٰهِيمُ رَبِّ ٱجۡعَلۡ هَٰذَا بَلَدًا ءَامِنًا",
    exampleTranslation: "And when Abraham said, 'My Lord, make this a secure city'",
    surahNum: 2,
    ayahNum: 126
  },
  {
    id: "68",
    arabic: "مُوسَىٰ",
    english: "Moses",
    root: "Hebrew",
    frequency: 136,
    category: "prophets",
    exampleVerse: "وَإِذۡ ءَاتَيۡنَا مُوسَى ٱلكِتَٰبَ وَٱلفُرۡقَانَ",
    exampleTranslation: "And [recall] when We gave Moses the Scripture and criterion",
    surahNum: 2,
    ayahNum: 53
  },
  {
    id: "69",
    arabic: "عِيسَىٰ",
    english: "Jesus",
    root: "Hebrew",
    frequency: 25,
    category: "prophets",
    exampleVerse: "قَالَ إِنِّي عَبۡدُ ٱللَّهِ ءَاتَىٰنِيَ ٱلۡكِتَٰبَ وَجَعَلَنِي نَبِيّٗا",
    exampleTranslation: "[Jesus] said, 'Indeed, I am the servant of Allah. He has given me the Scripture and made me a prophet'",
    surahNum: 19,
    ayahNum: 30
  },

  // actions
  {
    id: "81",
    arabic: "قَالَ",
    english: "He said",
    root: "ق - و - ل",
    frequency: 1726,
    category: "actions",
    exampleVerse: "قَالَ إِنِّيٓ أَعۡلَمُ مَا لَا تَعۡلَمُونَ",
    exampleTranslation: "He said, 'Indeed, I know that which you do not know.'",
    surahNum: 2,
    ayahNum: 3
  },
  {
    id: "82",
    arabic: "آمَنَ",
    english: "He believed",
    root: "أ - م - ن",
    frequency: 537,
    category: "actions",
    exampleVerse: "ٱلَّذِينَ يُؤۡمِنُونَ بِٱلۡغَيۡبِ",
    exampleTranslation: "Who believe in the unseen",
    surahNum: 2,
    ayahNum: 3
  },
  {
    id: "83",
    arabic: "عَمِيلَ",
    english: "He did / worked",
    root: "ع - م - ل",
    frequency: 318,
    category: "actions",
    exampleVerse: "وَعَمِلُوا ٱلصَّٰلِحَٰتِ",
    exampleTranslation: "and done righteous deeds",
    surahNum: 2,
    ayahNum: 25
  },
  {
    id: "84",
    arabic: "عَلِمَ",
    english: "He knew",
    root: "ع - ل - م",
    frequency: 518,
    category: "actions",
    exampleVerse: "عَلِمَ ٱللَّهُ أَنَّكُمۡ سَتَذۡكُرُونَهُنَّ",
    exampleTranslation: "Allah knows that you will remember them",
    surahNum: 2,
    ayahNum: 235
  },
  {
    id: "85",
    arabic: "جَعَلَ",
    english: "He made / placed",
    root: "ج - ع - ل",
    frequency: 346,
    category: "actions",
    exampleVerse: "وَجَعَلۡنَا نَهَارًا مَعَاشٗا",
    exampleTranslation: "And made the day for livelihood",
    surahNum: 78,
    ayahNum: 11
  },
  {
    id: "86",
    arabic: "كَفَرَ",
    english: "He disbelieved",
    root: "ك - ف - ر",
    frequency: 289,
    category: "actions",
    exampleVerse: "إِنَّ ٱلَّذِينَ كَفَرُوا سَوَآءٌ عَلَيۡهِمۡ",
    exampleTranslation: "Indeed, those who disbelieve - it is all the same for them",
    surahNum: 2,
    ayahNum: 6
  },
  {
    id: "87",
    arabic: "خَلَقَ",
    english: "He created",
    root: "خ - ل - ق",
    frequency: 248,
    category: "actions",
    exampleVerse: "خَلَقَ ٱلۡإِنسَٰنَ مِنۡ عَلَقٍ",
    exampleTranslation: "Created man from a clinging substance",
    surahNum: 96,
    ayahNum: 2
  },
  {
    id: "88",
    arabic: "هَدَى",
    english: "He guided",
    root: "ه - د - ي",
    frequency: 163,
    category: "actions",
    exampleVerse: "ٱهۡدِنَا ٱلصِّرَٰطَ ٱلۡمُسۡتَقِيمَ",
    exampleTranslation: "Guide us to the straight path",
    surahNum: 1,
    ayahNum: 6
  },
  {
    id: "89",
    arabic: "سَمِعَ",
    english: "He heard",
    root: "س - م - ع",
    frequency: 185,
    category: "actions",
    exampleVerse: "سَمِعَ ٱللَّهُ لِمَنۡ حَمِدَهُۥ",
    exampleTranslation: "Allah hears the one who praises Him",
    surahNum: 1,
    ayahNum: 1 // reference template
  },
  {
    id: "90",
    arabic: "دَعَا",
    english: "He called / prayed",
    root: "د - ع - و",
    frequency: 117,
    category: "actions",
    exampleVerse: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌۖ أُجِيبُ دَعۡوَةَ ٱلدَّاعِ",
    exampleTranslation: "And when My servants ask you concerning Me, indeed I am near. I respond to the invocation of the supplicant",
    surahNum: 2,
    ayahNum: 186
  },

  // common
  {
    id: "101",
    arabic: "قَلْب",
    english: "Heart",
    root: "ق - ل - ب",
    frequency: 132,
    category: "common",
    exampleVerse: "فِي قُلُوبِهِم مَّرَضٌ فَزَادَهُمُ ٱللَّهُ مَرَضٗا",
    exampleTranslation: "In their hearts is disease, so Allah has increased their disease",
    surahNum: 2,
    ayahNum: 10
  },
  {
    id: "102",
    arabic: "نَفْس",
    english: "Self / Soul",
    root: "ن - ف - س",
    frequency: 298,
    category: "common",
    exampleVerse: "يَٰٓأَيَّتُهَا ٱلنَّفۡسُ ٱلۡمُطۡمَئِنَّةُ",
    exampleTranslation: "[To the righteous it will be said], 'O reassured soul'",
    surahNum: 89,
    ayahNum: 27
  },
  {
    id: "103",
    arabic: "رَحْمَة",
    english: "Mercy",
    root: "ر - ح - م",
    frequency: 114,
    category: "common",
    exampleVerse: "وَٱكۡتُبۡ لَنَا فِي هَٰذِهِ ٱلدُّنۡيَا حَسَنَةٗ وَفِي ٱلۡأَخِرَةِ إِنَّا هُدۡنَآ إِلَيۡكَۚ قَالَ عَذَابِيٓ أُصِيبُ بِهِۦ مَنۡ أَشَآءُۖ وَرَحۡمَتِي وَسِعَتۡ كُلَّ شَيۡءٍ",
    exampleTranslation: "and My mercy encompasses all things",
    surahNum: 7,
    ayahNum: 156
  },
  {
    id: "104",
    arabic: "حَقّ",
    english: "Truth / Right",
    root: "ح - ق - ق",
    frequency: 247,
    category: "common",
    exampleVerse: "وَقُلۡ جَآءَ ٱلۡحَقُّ وَزَهَقَ ٱلۡبَٰطِلُ",
    exampleTranslation: "And say, 'Truth has come, and falsehood has departed'",
    surahNum: 17,
    ayahNum: 81
  },
  {
    id: "105",
    arabic: "خَيۡر",
    english: "Good / Better",
    root: "خ - ي - ر",
    frequency: 188,
    category: "common",
    exampleVerse: "فَٱسۡتَبِقُوا ٱلۡخَيۡرَٰتِ",
    exampleTranslation: "so race to [all that is] good",
    surahNum: 2,
    ayahNum: 148
  },
  {
    id: "106",
    arabic: "شَرّ",
    english: "Evil / Bad",
    root: "ش - ر - ر",
    frequency: 31,
    category: "common",
    exampleVerse: "وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
    exampleTranslation: "And from the evil of an envier when he envies",
    surahNum: 113,
    ayahNum: 5
  },
  {
    id: "107",
    arabic: "نَاس",
    english: "People / Mankind",
    root: "ن - و - س",
    frequency: 241,
    category: "common",
    exampleVerse: "قُلۡ أَعُوذُ بِرَبِّ ٱلنَّاسِ",
    exampleTranslation: "Say, 'I seek refuge in the Lord of mankind'",
    surahNum: 114,
    ayahNum: 1
  },
  {
    id: "108",
    arabic: "عِلم",
    english: "Knowledge",
    root: "ع - ل - م",
    frequency: 105,
    category: "common",
    exampleVerse: "وَقُل رَّبِّ زِدۡنِي عِلۡمٗا",
    exampleTranslation: "and say, 'My Lord, increase me in knowledge.'",
    surahNum: 20,
    ayahNum: 114
  },
  {
    id: "109",
    arabic: "حَكِيم",
    english: "Wise",
    root: "ح - ك - م",
    frequency: 97,
    category: "common",
    exampleVerse: "إِنَّكَ أَنتَ ٱلۡعَلِيمُ ٱلۡحَكِيمُ",
    exampleTranslation: "Indeed, it is You who is the Knowing, the Wise",
    surahNum: 2,
    ayahNum: 32
  },
  {
    id: "110",
    arabic: "كَبِير",
    english: "Great / Big / Large",
    root: "ك - ب - ر",
    frequency: 46,
    category: "common",
    exampleVerse: "إِنَّ هَٰذَا لَفِي ٱلصُّحُفِ ٱلۡأُولَىٰ",
    exampleTranslation: "Indeed, this is in the former scriptures", // placeholder
    surahNum: 87,
    ayahNum: 18
  }
];

export const THEME_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  theology: { label: "Theology & Belief", icon: "mosque", color: "#C5A880" },
  nature: { label: "Nature & Creation", icon: "tree", color: "#10B981" },
  hereafter: { label: "Hereafter & Judgment", icon: "clock-outline", color: "#EF4444" },
  prophets: { label: "Prophets & History", icon: "book-open-variant", color: "#3B82F6" },
  actions: { label: "Actions & Deeds", icon: "run", color: "#8B5CF6" },
  common: { label: "Common Vocabulary", icon: "text", color: "#6B7280" },
};
