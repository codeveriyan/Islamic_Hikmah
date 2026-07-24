export type HadithChapter = {
  id: string;
  name: string;
  arabicName?: string;
  first: number;
  last: number;
};

export const HADITH_CHAPTERS: Record<string, HadithChapter[]> = {
  "malik": [
    {
        "id": "1",
        "name": "The Times of Prayer",
        "arabicName": "كِتَابُ وُقُوتِ الصَّلَاةِ",
        "first": 1,
        "last": 31
    },
    {
        "id": "2",
        "name": "Purity",
        "arabicName": "كِتَابُ الطَّهَارَةِ",
        "first": 32,
        "last": 146
    },
    {
        "id": "3",
        "name": "Prayer",
        "arabicName": "كِتَابُ الصَّلَاةِ",
        "first": 147,
        "last": 221
    },
    {
        "id": "4",
        "name": "Forgetfulness in Prayer",
        "arabicName": "كِتَابُ السَّهْوِ",
        "first": 222,
        "last": 224
    },
    {
        "id": "5",
        "name": "Jumu'a",
        "arabicName": "كِتَابُ الْجُمُعَةِ",
        "first": 225,
        "last": 247
    },
    {
        "id": "6",
        "name": "Prayer in Ramadan",
        "arabicName": "كِتَابُ الصَّلَاةِ فِي رَمَضَانَ",
        "first": 248,
        "last": 255
    },
    {
        "id": "7",
        "name": "Tahajjud",
        "arabicName": "Tahajjud",
        "first": 256,
        "last": 288
    },
    {
        "id": "8",
        "name": "Prayer in Congregation",
        "arabicName": "كِتَابُ صَلَاةِ اللَّيْلِ",
        "first": 289,
        "last": 327
    },
    {
        "id": "9",
        "name": "Shortening the Prayer",
        "arabicName": "كِتَابُ صَلَاةِ الْجَمَاعَةِ",
        "first": 328,
        "last": 431
    },
    {
        "id": "10",
        "name": "The Two 'Ids",
        "arabicName": "كِتَابُ قَصْرِ الصَّلَاةِ فِي السَّفَرِ",
        "first": 432,
        "last": 445
    },
    {
        "id": "11",
        "name": "The Fear Prayer",
        "arabicName": "كِتَابُ صَلَاةِ الْخَوْفِ",
        "first": 446,
        "last": 450
    },
    {
        "id": "12",
        "name": "The Eclipse Prayer",
        "arabicName": "كِتَابُ صَلَاةِ الْكُسُوفِ",
        "first": 451,
        "last": 454
    },
    {
        "id": "13",
        "name": "Asking for Rain",
        "arabicName": "كِتَابُ الِاسْتِسْقَاءِ",
        "first": 455,
        "last": 460
    },
    {
        "id": "14",
        "name": "The Qibla",
        "arabicName": "كِتَابُ الْقِبْلَةِ",
        "first": 461,
        "last": 476
    },
    {
        "id": "15",
        "name": "The Qur'an",
        "arabicName": "كِتَابُ الْقُرْآنِ",
        "first": 477,
        "last": 528
    },
    {
        "id": "16",
        "name": "Burials",
        "arabicName": "كِتَابُ الْجَنَائِزِ",
        "first": 529,
        "last": 587
    },
    {
        "id": "17",
        "name": "Zakat",
        "arabicName": "كِتَابُ الزَّكَاةِ",
        "first": 588,
        "last": 650
    },
    {
        "id": "18",
        "name": "Fasting",
        "arabicName": "كِتَابُ الصِّيَامِ",
        "first": 651,
        "last": 716
    },
    {
        "id": "19",
        "name": "I'tikaf in Ramadan",
        "arabicName": "كِتَابُ الِاعْتِكَافِ",
        "first": 717,
        "last": 734
    },
    {
        "id": "20",
        "name": "Hajj",
        "arabicName": "كِتَابُ الْحَجِّ",
        "first": 735,
        "last": 1001
    },
    {
        "id": "21",
        "name": "Jihad",
        "arabicName": "كِتَابُ الْجِهَادِ",
        "first": 1002,
        "last": 1055
    },
    {
        "id": "22",
        "name": "Vows and Oaths",
        "arabicName": "كِتَابُ النُّذُورِ وَالْأَيْمَانِ",
        "first": 1056,
        "last": 1074
    },
    {
        "id": "23",
        "name": "Sacrificial Animals",
        "arabicName": "كِتَابُ الضَّحَايَا",
        "first": 1075,
        "last": 1087
    },
    {
        "id": "24",
        "name": "Slaughtering Animals",
        "arabicName": "كِتَابُ الذَّبَائِحِ",
        "first": 1088,
        "last": 1097
    },
    {
        "id": "25",
        "name": "Game",
        "arabicName": "كِتَابُ الصَّيْدِ",
        "first": 1098,
        "last": 1116
    },
    {
        "id": "26",
        "name": "The 'Aqiqa",
        "arabicName": "كِتَابُ الْعَقِيقَةِ",
        "first": 1117,
        "last": 1123
    },
    {
        "id": "27",
        "name": "Fara'id",
        "arabicName": "كِتَابُ الْفَرَائِضِ",
        "first": 1124,
        "last": 1147
    },
    {
        "id": "28",
        "name": "Marriage",
        "arabicName": "كِتَابُ النِّكَاحِ",
        "first": 1148,
        "last": 1208
    },
    {
        "id": "29",
        "name": "Divorce",
        "arabicName": "كِتَابُ الطَّلَاقِ",
        "first": 1209,
        "last": 1328
    },
    {
        "id": "30",
        "name": "Suckling",
        "arabicName": "كِتَابُ الرَّضَاعِ",
        "first": 1329,
        "last": 1346
    },
    {
        "id": "31",
        "name": "Business Transactions",
        "arabicName": "كِتَابُ الْبُيُوعِ",
        "first": 1347,
        "last": 1449
    },
    {
        "id": "32",
        "name": "Qirad",
        "arabicName": "كِتَابُ الْقِرَاضِ",
        "first": 1450,
        "last": 1465
    },
    {
        "id": "33",
        "name": "Sharecropping",
        "arabicName": "كِتَابُ الْمُسَاقَاةِ",
        "first": 1466,
        "last": 1468
    },
    {
        "id": "34",
        "name": "Renting Land",
        "arabicName": "كِتَابُ كِرَاءِ الْأَرْضِ",
        "first": 1469,
        "last": 1473
    },
    {
        "id": "35",
        "name": "Pre-emption in Property",
        "arabicName": "كِتَابُ الشُّفْعَةِ",
        "first": 1474,
        "last": 1478
    },
    {
        "id": "36",
        "name": "Judgements",
        "arabicName": "كِتَابُ الْأَقْضِيَةِ",
        "first": 1479,
        "last": 1550
    },
    {
        "id": "37",
        "name": "Wills and Testaments",
        "arabicName": "كِتَابُ الْوَصِيَّةِ",
        "first": 1551,
        "last": 1563
    },
    {
        "id": "38",
        "name": "Setting Free and Wala'",
        "arabicName": "كِتَابُ الْعِتْقِ وَالْوَلَاءِ",
        "first": 1564,
        "last": 1591
    },
    {
        "id": "39",
        "name": "The Mukatab",
        "arabicName": "كِتَابُ الْمُكَاتَبِ",
        "first": 1592,
        "last": 1606
    },
    {
        "id": "40",
        "name": "Hudud",
        "arabicName": "كِتَابُ الحُدُودِ",
        "first": 1607,
        "last": 1614
    },
    {
        "id": "41",
        "name": "The Mudabbar",
        "arabicName": "كتاب المدبر",
        "first": 1615,
        "last": 1651
    },
    {
        "id": "42",
        "name": "Drinks",
        "arabicName": "كِتَابُ الْأَشْرِبَةِ",
        "first": 1652,
        "last": 1671
    },
    {
        "id": "43",
        "name": "Blood-Money",
        "arabicName": "كِتَابُ الْعُقُولِ",
        "first": 1672,
        "last": 1716
    },
    {
        "id": "44",
        "name": "The Oath of Qasama",
        "arabicName": "كِتَابُ الْقَسَامَةِ",
        "first": 1717,
        "last": 1722
    },
    {
        "id": "45",
        "name": "Madina",
        "arabicName": "كتاب الْمَدِينَةِ",
        "first": 1723,
        "last": 1747
    },
    {
        "id": "46",
        "name": "The Decree",
        "arabicName": "كِتَابُ الْقَدَرِ",
        "first": 1748,
        "last": 1757
    },
    {
        "id": "47",
        "name": "Good Character",
        "arabicName": "كِتَابُ حُسْنِ الْخَلُقِ",
        "first": 1758,
        "last": 1775
    },
    {
        "id": "48",
        "name": "Dress",
        "arabicName": "كِتَابُ اللِّبَاسِ",
        "first": 1776,
        "last": 1795
    },
    {
        "id": "49",
        "name": "The Description of the Prophet (ﷺ)",
        "arabicName": "كِتَابُ صِفَةِ النَّبِيِّ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
        "first": 1796,
        "last": 1837
    },
    {
        "id": "50",
        "name": "The Evil Eye",
        "arabicName": "كِتَابُ الْعَيْنِ",
        "first": 1838,
        "last": 1856
    },
    {
        "id": "51",
        "name": "Hair",
        "arabicName": "كتابُ الشَّعَرِ",
        "first": 1857,
        "last": 1873
    },
    {
        "id": "52",
        "name": "Visions",
        "arabicName": "كِتَابُ الرُّؤْيَا",
        "first": 1874,
        "last": 1881
    },
    {
        "id": "53",
        "name": "Greetings",
        "arabicName": "كِتَابُ السَّلَامَ",
        "first": 1882,
        "last": 1889
    },
    {
        "id": "54",
        "name": "General Subjects",
        "arabicName": "كِتَابُ الِاسْتِئْذَانِ",
        "first": 1890,
        "last": 1934
    },
    {
        "id": "55",
        "name": "The Oath of Allegiance",
        "arabicName": "كِتَابُ الْبَيْعَةِ",
        "first": 1935,
        "last": 1937
    },
    {
        "id": "56",
        "name": "Speech",
        "arabicName": "كِتَابُ الْكَلَامِ",
        "first": 1938,
        "last": 1965
    },
    {
        "id": "57",
        "name": "Jahannam",
        "arabicName": "كِتَابُ جَهَنَّمَ",
        "first": 1966,
        "last": 1967
    },
    {
        "id": "58",
        "name": "Sadaqa",
        "arabicName": "كِتَابُ الصَّدَقَةِ",
        "first": 1968,
        "last": 1982
    },
    {
        "id": "59",
        "name": "Knowledge",
        "arabicName": "كِتَابُ الْعِلْمِ",
        "first": 1983,
        "last": 1983
    },
    {
        "id": "60",
        "name": "The Supplication of the Unjustly Wronged",
        "arabicName": "كِتَابُ دَعْوَةِ الْمَظْلُومِ",
        "first": 1984,
        "last": 1984
    },
    {
        "id": "61",
        "name": "The Names of the Prophet (ﷺ)",
        "arabicName": "كتاب أسماء النبى صلى الله عليه وسلم",
        "first": 1985,
        "last": 1985
    }
],

  "bukhari": [
    {
        "id": "1",
        "name": "Revelation",
        "arabicName": "كِتَابُ بَدْءُ الْوَحْيِ",
        "first": 1,
        "last": 7
    },
    {
        "id": "2",
        "name": "Belief",
        "arabicName": "كِتَابُ الْإِيمَانِ",
        "first": 8,
        "last": 58
    },
    {
        "id": "3",
        "name": "Knowledge",
        "arabicName": "كِتَابُ الْعِلْمِ",
        "first": 59,
        "last": 134
    },
    {
        "id": "4",
        "name": "Ablutions (Wudu')",
        "arabicName": "كِتَابُ الوُضُوءِ",
        "first": 135,
        "last": 248
    },
    {
        "id": "5",
        "name": "Bathing (Ghusl)",
        "arabicName": "كِتَابُ الْغُسْلِ",
        "first": 249,
        "last": 293
    },
    {
        "id": "6",
        "name": "Menstrual Periods",
        "arabicName": "كِتَابُ الْحَيضِ",
        "first": 294,
        "last": 330
    },
    {
        "id": "7",
        "name": "Rubbing hands and feet with dust (Tayammum)",
        "arabicName": "كِتَابُ التَّيَمُّمِ",
        "first": 331,
        "last": 345
    },
    {
        "id": "8",
        "name": "Prayers (Salat)",
        "arabicName": "كِتَابُ الصَّلاَةِ",
        "first": 346,
        "last": 512
    },
    {
        "id": "9",
        "name": "Times of the Prayers",
        "arabicName": "كِتَابُ مَوَاقِيتِ الصَّلاَة",
        "first": 513,
        "last": 590
    },
    {
        "id": "10",
        "name": "Call to Prayers (Adhaan)",
        "arabicName": "كِتَابُ الْأَذَانِ",
        "first": 591,
        "last": 856
    },
    {
        "id": "11",
        "name": "Friday Prayer",
        "arabicName": "كِتَابُ الْجُمُعَةِ",
        "first": 857,
        "last": 921
    },
    {
        "id": "12",
        "name": "Fear Prayer",
        "arabicName": "أَبْوَابُ صَلاَةِ الْخَوْفِ",
        "first": 922,
        "last": 927
    },
    {
        "id": "13",
        "name": "The Two Festivals (Eids)",
        "arabicName": "أَبْوَابُ الْعِيدَيْنِ",
        "first": 928,
        "last": 964
    },
    {
        "id": "14",
        "name": "Witr Prayer",
        "arabicName": "أَبْوَابُ الْوِتْرِ",
        "first": 965,
        "last": 979
    },
    {
        "id": "15",
        "name": "Invoking Allah for Rain (Istisqaa)",
        "arabicName": "أَبْوَابُ الِْاسْتِسْقَاءِ",
        "first": 980,
        "last": 1013
    },
    {
        "id": "16",
        "name": "Eclipses",
        "arabicName": "أَبْوَابُ الْكُسُوفِ",
        "first": 1014,
        "last": 1037
    },
    {
        "id": "17",
        "name": "Prostration During Recital of Qur'an",
        "arabicName": "أَبْوَابُ سُجُودِ الْقُرْآنِ",
        "first": 1038,
        "last": 1050
    },
    {
        "id": "18",
        "name": "Shortening the Prayers (At-Taqseer)",
        "arabicName": "أَبْوَابُ تَقْصِيرِ الصَّلاَة",
        "first": 1051,
        "last": 1089
    },
    {
        "id": "19",
        "name": "Prayer at Night (Tahajjud)",
        "arabicName": "كِتَابُ التَّهَجُّدِ",
        "first": 1090,
        "last": 1152
    },
    {
        "id": "20",
        "name": "Virtues of Prayer at Masjid Makkah and Madinah",
        "arabicName": "كِتَابُ فَضْلِ الصَّلَاةِ فِي مَسْجِدِ مَكَّة وَالْمَدِينَةِ",
        "first": 1153,
        "last": 1161
    },
    {
        "id": "21",
        "name": "Actions while Praying",
        "arabicName": "أَبْوَابُ الْعَمَلِ فِي الصَّلاَةِ",
        "first": 1162,
        "last": 1188
    },
    {
        "id": "22",
        "name": "Forgetfulness in Prayer",
        "arabicName": "أَبْوَابُ مَا جَاءَ فِي السَّهْوِ",
        "first": 1189,
        "last": 1202
    },
    {
        "id": "23",
        "name": "Funerals (Al-Janaa'iz)",
        "arabicName": "كِتَابُ الْجَنَائِزِ",
        "first": 1203,
        "last": 1351
    },
    {
        "id": "24",
        "name": "Obligatory Charity Tax (Zakat)",
        "arabicName": "كِتَابُ الزَّكَاةِ",
        "first": 1352,
        "last": 1464
    },
    {
        "id": "25",
        "name": "Hajj (Pilgrimage)",
        "arabicName": "كِتَابُ الحَجِّ",
        "first": 1465,
        "last": 1711
    },
    {
        "id": "26",
        "name": "`Umrah (Minor pilgrimage)",
        "arabicName": "أَبْوَابُ العُمْرَةِ",
        "first": 1712,
        "last": 1743
    },
    {
        "id": "27",
        "name": "Pilgrims Prevented from Completing the Pilgrimage",
        "arabicName": "أَبْوَابُ المُحْصَرِ",
        "first": 1744,
        "last": 1758
    },
    {
        "id": "28",
        "name": "Penalty of Hunting while on Pilgrimage",
        "arabicName": "كِتَابُ جَزَاءِ الصَّيْدِ",
        "first": 1759,
        "last": 1804
    },
    {
        "id": "29",
        "name": "Virtues of Madinah",
        "arabicName": "كِتَابُ فَضَائِلِ الْمَدِينَةِ",
        "first": 1805,
        "last": 1828
    },
    {
        "id": "30",
        "name": "Fasting",
        "arabicName": "كِتَابُ الصَّوْمِ",
        "first": 1829,
        "last": 1940
    },
    {
        "id": "31",
        "name": "Praying at Night in Ramadaan (Taraweeh)",
        "arabicName": "كِتَابُ صَلاَةِ التَّرَاوِيحِ",
        "first": 1941,
        "last": 1946
    },
    {
        "id": "32",
        "name": "Virtues of the Night of Qadr",
        "arabicName": "كِتَابُ فَضْلِ لَيْلَةِ القَدْرِ",
        "first": 1947,
        "last": 1957
    },
    {
        "id": "33",
        "name": "Retiring to a Mosque for Remembrance of Allah (I'tikaf)",
        "arabicName": "كِتَابُ الِاعْتِكَافِ",
        "first": 1958,
        "last": 1978
    },
    {
        "id": "34",
        "name": "Sales and Trade",
        "arabicName": "كِتَابُ البُيُوعِ",
        "first": 1979,
        "last": 2162
    },
    {
        "id": "35",
        "name": "Sales in which a Price is paid for Goods to be Delivered Later (As-Salam)",
        "arabicName": "كِتَابُ السَّلَمِ",
        "first": 2163,
        "last": 2178
    },
    {
        "id": "36",
        "name": "Shuf'a",
        "arabicName": "كِتَابُ الشُّفْعَةِ",
        "first": 2179,
        "last": 2181
    },
    {
        "id": "37",
        "name": "Hiring",
        "arabicName": "كِتَابُ الإِجَارَة",
        "first": 2182,
        "last": 2206
    },
    {
        "id": "38",
        "name": "Transference of a Debt from One Person to Another (Al-Hawaala)",
        "arabicName": "كِتَابُ الحَوَالاَتِ",
        "first": 2207,
        "last": 2209
    },
    {
        "id": "39",
        "name": "Kafalah",
        "arabicName": "كِتَابُ الْكَفَالَةِ",
        "first": 2210,
        "last": 2218
    },
    {
        "id": "40",
        "name": "Representation, Authorization, Business by Proxy",
        "arabicName": "كِتَابُ الوَكَالَةِ",
        "first": 2219,
        "last": 2236
    },
    {
        "id": "41",
        "name": "Agriculture",
        "arabicName": "كِتَابُ الْمُزَارَعَةِ",
        "first": 2237,
        "last": 2264
    },
    {
        "id": "42",
        "name": "Distribution of Water",
        "arabicName": "كِتَابُ الْمُسَاقَاةِ",
        "first": 2265,
        "last": 2295
    },
    {
        "id": "43",
        "name": "Loans, Payment of Loans, Freezing of Property, Bankruptcy",
        "arabicName": "كِتَابُ فِي الِاسْتِقْرَاضِ وَأَدَاءِ الدُّيُونِ وَالْحَجْرِ وَالتَّفْلِيسِ",
        "first": 2296,
        "last": 2319
    },
    {
        "id": "44",
        "name": "Khusoomaat",
        "arabicName": "كِتَابُ الْخُصُومَاتِ",
        "first": 2320,
        "last": 2334
    },
    {
        "id": "45",
        "name": "Lost Things Picked up by Someone (Luqatah)",
        "arabicName": "كِتَابُ فِي اللُّقَطَةِ",
        "first": 2335,
        "last": 2349
    },
    {
        "id": "46",
        "name": "Oppressions",
        "arabicName": "كِتَابُ الْمَظَالِمِ وَالْغَصْبِ",
        "first": 2350,
        "last": 2392
    },
    {
        "id": "47",
        "name": "Partnership",
        "arabicName": "كِتَابُ الشَّرِكَةِ",
        "first": 2393,
        "last": 2414
    },
    {
        "id": "48",
        "name": "Mortgaging",
        "arabicName": "كِتَابُ الرَّهْنِ",
        "first": 2415,
        "last": 2422
    },
    {
        "id": "49",
        "name": "Manumission of Slaves",
        "arabicName": "كِتَابُ الْعِتْقِ",
        "first": 2423,
        "last": 2464
    },
    {
        "id": "50",
        "name": "Makaatib",
        "arabicName": "كِتَابُ الْمَكَاتِبِ",
        "first": 2465,
        "last": 2470
    },
    {
        "id": "51",
        "name": "Gifts",
        "arabicName": "كِتَابُ الْهِبَةِ وَفَضْلِهَا وَالتَّحْرِيضِ عَلَيْهَا",
        "first": 2471,
        "last": 2538
    },
    {
        "id": "52",
        "name": "Witnesses",
        "arabicName": "كِتَابُ الشَّهَادَاتِ",
        "first": 2539,
        "last": 2588
    },
    {
        "id": "53",
        "name": "Peacemaking",
        "arabicName": "كِتَابُ الصُّلْحِ",
        "first": 2589,
        "last": 2608
    },
    {
        "id": "54",
        "name": "Conditions",
        "arabicName": "كِتَابُ الشُّرُوطِ",
        "first": 2609,
        "last": 2632
    },
    {
        "id": "55",
        "name": "Wills and Testaments (Wasaayaa)",
        "arabicName": "كِتَابُ الْوَصَايَا",
        "first": 2633,
        "last": 2676
    },
    {
        "id": "56",
        "name": "Fighting for the Cause of Allah (Jihaad)",
        "arabicName": "كِتَابُ الْجِهَادِ وَالسِّيَرِ",
        "first": 2677,
        "last": 2971
    },
    {
        "id": "57",
        "name": "One-fifth of Booty to the Cause of Allah (Khumus)",
        "arabicName": "كِتَابُ فَرْضِ الْخُمُسِ",
        "first": 2972,
        "last": 3034
    },
    {
        "id": "58",
        "name": "Jizyah and Mawaada'ah",
        "arabicName": "كِتَابُ الْجِزْيَةِ",
        "first": 3035,
        "last": 3064
    },
    {
        "id": "59",
        "name": "Beginning of Creation",
        "arabicName": "كِتَابُ بَدْءِ الْخَلْقِ",
        "first": 3065,
        "last": 3195
    },
    {
        "id": "60",
        "name": "Prophets",
        "arabicName": "كِتَابُ أَحَادِيثِ الْأَنْبِيَاءِ",
        "first": 3196,
        "last": 3349
    },
    {
        "id": "61",
        "name": "Virtues and Merits of the Prophet (pbuh) and his Companions",
        "arabicName": "كِتَابُ الْمَنَاقِبِ",
        "first": 3350,
        "last": 3500
    },
    {
        "id": "62",
        "name": "Companions of the Prophet",
        "arabicName": "كِتَابُ أَصْحَابِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ",
        "first": 3501,
        "last": 3622
    },
    {
        "id": "63",
        "name": "Merits of the Helpers in Madinah (Ansaar)",
        "arabicName": "كِتَابُ مَنَاقِبِ الأَنْصَارِ",
        "first": 3623,
        "last": 3795
    },
    {
        "id": "64",
        "name": "Military Expeditions led by the Prophet (pbuh) (Al-Maghaazi)",
        "arabicName": "كِتَابُ الْمَغَازِي",
        "first": 3796,
        "last": 4283
    },
    {
        "id": "65",
        "name": "Prophetic Commentary on the Qur'an (Tafseer of the Prophet (pbuh))",
        "arabicName": "كِتَاب تَفْسِيرِ الْقُرْآنِ",
        "first": 4284,
        "last": 4781
    },
    {
        "id": "66",
        "name": "Virtues of the Qur'an",
        "arabicName": "كِتَابُ فَضَائِلِ الْقُرْآنِ",
        "first": 4782,
        "last": 4868
    },
    {
        "id": "67",
        "name": "Wedlock, Marriage (Nikaah)",
        "arabicName": "كِتَابُ النِّكَاحِ",
        "first": 4869,
        "last": 5051
    },
    {
        "id": "68",
        "name": "Divorce",
        "arabicName": "كِتَابُ الطَّلاَقِ",
        "first": 5052,
        "last": 5146
    },
    {
        "id": "69",
        "name": "Supporting the Family",
        "arabicName": "كِتَابُ النَّفَقَاتِ",
        "first": 5147,
        "last": 5168
    },
    {
        "id": "70",
        "name": "Food, Meals",
        "arabicName": "كِتَابُ الْأَطْعِمَةِ",
        "first": 5169,
        "last": 5263
    },
    {
        "id": "71",
        "name": "Sacrifice on Occasion of Birth (`Aqiqa)",
        "arabicName": "كِتَابُ الْعَقِيقَةِ",
        "first": 5264,
        "last": 5273
    },
    {
        "id": "72",
        "name": "Hunting, Slaughtering",
        "arabicName": "كِتَابُ الذَّبَائِحِ وَالصَّيْدِ",
        "first": 5274,
        "last": 5343
    },
    {
        "id": "73",
        "name": "Al-Adha Festival Sacrifice (Adaahi)",
        "arabicName": "كِتَابُ الْأَضَاحِي",
        "first": 5344,
        "last": 5373
    },
    {
        "id": "74",
        "name": "Drinks",
        "arabicName": "كِتَابُ الْأَشْرِبَةِ",
        "first": 5374,
        "last": 5438
    },
    {
        "id": "75",
        "name": "Patients",
        "arabicName": "كِتَابُ الْمَرْضَى",
        "first": 5439,
        "last": 5476
    },
    {
        "id": "76",
        "name": "Medicine",
        "arabicName": "كِتَابُ الطِّبِّ",
        "first": 5477,
        "last": 5569
    },
    {
        "id": "77",
        "name": "Dress",
        "arabicName": "كِتَابُ اللِّبَاسِ",
        "first": 5570,
        "last": 5754
    },
    {
        "id": "78",
        "name": "Good Manners and Form (Al-Adab)",
        "arabicName": "كِتَابُ الْأَدَبِ",
        "first": 5755,
        "last": 6004
    },
    {
        "id": "79",
        "name": "Asking Permission",
        "arabicName": "كِتَابُ الِْاسْتِئْذَانِ",
        "first": 6005,
        "last": 6079
    },
    {
        "id": "80",
        "name": "Invocations",
        "arabicName": "كِتَابُ الدَّعَوَاتِ",
        "first": 6080,
        "last": 6185
    },
    {
        "id": "81",
        "name": "To make the Heart Tender (Ar-Riqaq)",
        "arabicName": "كِتَابُ الرِّقَاقِ",
        "first": 6186,
        "last": 6366
    },
    {
        "id": "82",
        "name": "Divine Will (Al-Qadar)",
        "arabicName": "كِتَابُ الْقَدَرِ",
        "first": 6367,
        "last": 6392
    },
    {
        "id": "83",
        "name": "Oaths and Vows",
        "arabicName": "كِتَاب الْأَيْمَانِ وَالنُّذُورِ",
        "first": 6393,
        "last": 6476
    },
    {
        "id": "84",
        "name": "Expiation for Unfulfilled Oaths",
        "arabicName": "كِتَابُ كَفَّارَاتِ الأَيْمَانِ",
        "first": 6477,
        "last": 6491
    },
    {
        "id": "85",
        "name": "Laws of Inheritance (Al-Faraa'id)",
        "arabicName": "كِتَابُ الفَرَائِضِ",
        "first": 6492,
        "last": 6538
    },
    {
        "id": "86",
        "name": "Limits and Punishments set by Allah (Hudood)",
        "arabicName": "كِتَابُ الحُدُودِ",
        "first": 6539,
        "last": 6620
    },
    {
        "id": "87",
        "name": "Blood Money (Ad-Diyat)",
        "arabicName": "كِتَابُ الدِّيَاتِ",
        "first": 6621,
        "last": 6675
    },
    {
        "id": "88",
        "name": "Apostates",
        "arabicName": "كِتَابُ اسْتِتَابَةِ الْمُرْتَدِّينَ وَالْمُعَانِدِينَ وَقِتَالِهِمْ",
        "first": 6676,
        "last": 6696
    },
    {
        "id": "89",
        "name": "(Statements made under) Coercion",
        "arabicName": "كِتَابُ الإِكْرَاهِ",
        "first": 6697,
        "last": 6709
    },
    {
        "id": "90",
        "name": "Tricks",
        "arabicName": "كِتَابُ الْحِيَلِ",
        "first": 6710,
        "last": 6737
    },
    {
        "id": "91",
        "name": "Interpretation of Dreams",
        "arabicName": "كِتَابُ التَّعْبِيرِ",
        "first": 6738,
        "last": 6798
    },
    {
        "id": "92",
        "name": "Afflictions and the End of the World",
        "arabicName": "كِتَابُ الْفِتَنِ",
        "first": 6799,
        "last": 6881
    },
    {
        "id": "93",
        "name": "Judgments (Ahkaam)",
        "arabicName": "كِتَابُ الأَحْكَامِ",
        "first": 6882,
        "last": 6965
    },
    {
        "id": "94",
        "name": "Wishes",
        "arabicName": "كِتَابُ التَّمَنِّي",
        "first": 6966,
        "last": 6985
    },
    {
        "id": "95",
        "name": "Accepting Information Given by a Truthful Person",
        "arabicName": "كِتَابُ أَخْبَارُ الْآحَادِ",
        "first": 6986,
        "last": 7006
    },
    {
        "id": "96",
        "name": "Holding Fast to the Qur'an and Sunnah",
        "arabicName": "كِتَابُ الِاعْتِصَامِ بِالْكِتَابِ وَالسُّنَّةِ",
        "first": 7007,
        "last": 7103
    },
    {
        "id": "97",
        "name": "Oneness, Uniqueness of Allah (Tawheed)",
        "arabicName": "كِتَابُ التَّوْحِيدِ",
        "first": 7104,
        "last": 7291
    }
],
  "muslim": [
    {
        "id": "1",
        "name": "Introduction",
        "arabicName": "المُقدِّمة",
        "first": 1,
        "last": 92
    },
    {
        "id": "2",
        "name": "The Book of Faith",
        "arabicName": "كِتَابُ الْإِيمَانَ",
        "first": 93,
        "last": 533
    },
    {
        "id": "3",
        "name": "The Book of Purification",
        "arabicName": "كِتَابِ الطَّهَارَةِ",
        "first": 534,
        "last": 677
    },
    {
        "id": "4",
        "name": "The Book of Menstruation",
        "arabicName": "كِتَابُ الْحَيْضِ",
        "first": 678,
        "last": 834
    },
    {
        "id": "5",
        "name": "The Book of Prayers",
        "arabicName": "كِتَابُ الصَّلَاةِ",
        "first": 835,
        "last": 1156
    },
    {
        "id": "6",
        "name": "The Book of Mosques and Places of Prayer",
        "arabicName": "كِتَابُ الْمَسَاجِدِ وَمَوَاضِعِ الصَّلَاةَ",
        "first": 1157,
        "last": 1561
    },
    {
        "id": "7",
        "name": "The Book of Prayer - Travellers",
        "arabicName": "كِتَابُ صَلَاةِ الْمُسَافِرِينَ وَقَصْرِهَا",
        "first": 1562,
        "last": 1939
    },
    {
        "id": "8",
        "name": "The Book of Prayer - Friday",
        "arabicName": "كِتَابُ الْجُمُعَةِ",
        "first": 1940,
        "last": 2032
    },
    {
        "id": "9",
        "name": "The Book of Prayer - Two Eids",
        "arabicName": "كِتَابُ صَلَاةِ الْعِيدَيْنِ",
        "first": 2033,
        "last": 2056
    },
    {
        "id": "10",
        "name": "The Book of Prayer - Rain",
        "arabicName": "كِتَابُ صَلَاةِ الِاسْتِسْقَاءِ",
        "first": 2057,
        "last": 2075
    },
    {
        "id": "11",
        "name": "The Book of Prayer - Eclipses",
        "arabicName": "كِتَابُ الْكُسُوفِ",
        "first": 2076,
        "last": 2106
    },
    {
        "id": "12",
        "name": "The Book of Prayer - Funerals",
        "arabicName": "كِتَابُ الْجَنَائِزِ",
        "first": 2107,
        "last": 2244
    },
    {
        "id": "13",
        "name": "The Book of Zakat",
        "arabicName": "كِتَاب الزَّكَاةِ",
        "first": 2245,
        "last": 2475
    },
    {
        "id": "14",
        "name": "The Book of Fasting",
        "arabicName": "كِتَاب الصِّيَامِ",
        "first": 2476,
        "last": 2760
    },
    {
        "id": "15",
        "name": "The Book of I'tikaf",
        "arabicName": "كِتَابُ الِاعْتِكَافِ",
        "first": 2761,
        "last": 2771
    },
    {
        "id": "16",
        "name": "The Book of Pilgrimage",
        "arabicName": "كِتَابُ الْحَجِّ",
        "first": 2772,
        "last": 3372
    },
    {
        "id": "17",
        "name": "The Book of Marriage",
        "arabicName": "كِتَابُ النِّكَاحِ",
        "first": 3373,
        "last": 3542
    },
    {
        "id": "18",
        "name": "The Book of Suckling",
        "arabicName": "كِتَابُ الرِّضَاعِ",
        "first": 3543,
        "last": 3626
    },
    {
        "id": "19",
        "name": "The Book of Divorce",
        "arabicName": "كِتَابُ الطَّلَاقِ",
        "first": 3627,
        "last": 3713
    },
    {
        "id": "20",
        "name": "The Book of Invoking Curses",
        "arabicName": "كِتَابُ اللِّعَانِ",
        "first": 3714,
        "last": 3740
    },
    {
        "id": "21",
        "name": "The Book of Emancipating Slaves",
        "arabicName": "كِتَابُ الْعِتْقِ",
        "first": 3741,
        "last": 3770
    },
    {
        "id": "22",
        "name": "The Book of Transactions",
        "arabicName": "كِتَابُ الْبُيُوعِ",
        "first": 3771,
        "last": 3930
    },
    {
        "id": "23",
        "name": "The Book of Masaaqah",
        "arabicName": "كِتَابُ الْمُسَاقَاةِ",
        "first": 3931,
        "last": 4108
    },
    {
        "id": "24",
        "name": "The Book of the Rules of Inheritance",
        "arabicName": "كِتَابُ الْفَرَائِضِ",
        "first": 4109,
        "last": 4131
    },
    {
        "id": "25",
        "name": "The Book of Gifts",
        "arabicName": "كِتَابُ الْهِبَاتِ",
        "first": 4132,
        "last": 4172
    },
    {
        "id": "26",
        "name": "The Book of Wills",
        "arabicName": "كِتَابُ الْوَصِيَّةِ",
        "first": 4173,
        "last": 4203
    },
    {
        "id": "27",
        "name": "The Book of Vows",
        "arabicName": "كتاب النَّذْرِ",
        "first": 4204,
        "last": 4221
    },
    {
        "id": "28",
        "name": "The Book of Oaths",
        "arabicName": "كِتَابُ الْأَيْمَانِ",
        "first": 4222,
        "last": 4310
    },
    {
        "id": "29",
        "name": "The Book of Oaths, Muharibin, Qasas, and Diyat",
        "arabicName": "كِتَابُ الْقَسَامَةِ وَالْمُحَارِبِينَ وَالْقِصَاصِ وَالدِّيَاتِ",
        "first": 4311,
        "last": 4366
    },
    {
        "id": "30",
        "name": "The Book of Legal Punishments",
        "arabicName": "كِتَابُ الْحُدُودِ",
        "first": 4367,
        "last": 4438
    },
    {
        "id": "31",
        "name": "The Book of Judicial Decisions",
        "arabicName": "كِتَابُ الْأَقْضِيَةِ",
        "first": 4439,
        "last": 4466
    },
    {
        "id": "32",
        "name": "The Book of Lost Property",
        "arabicName": "كِتَابُ اللُّقَطَةِ",
        "first": 4467,
        "last": 4486
    },
    {
        "id": "33",
        "name": "The Book of Jihad and Expeditions",
        "arabicName": "كِتَابُ الْجِهَادِ وَالسِّيَرِ",
        "first": 4487,
        "last": 4668
    },
    {
        "id": "34",
        "name": "The Book on Government",
        "arabicName": "كِتَابُ الْإِمَارَةِ",
        "first": 4669,
        "last": 4934
    },
    {
        "id": "35",
        "name": "The Book of Hunting, Slaughter, and what may be Eaten",
        "arabicName": "كِتَابُ الصَّيْدِ وَالذَّبَائِحِ وَمَا يُؤْكَلُ مِنَ الْحَيَوَانِ",
        "first": 4935,
        "last": 5026
    },
    {
        "id": "36",
        "name": "The Book of Sacrifices",
        "arabicName": "كتاب الْأَضَاحِيِّ",
        "first": 5027,
        "last": 5088
    },
    {
        "id": "37",
        "name": "The Book of Drinks",
        "arabicName": "كتاب الْأَشْرِبَةِ",
        "first": 5089,
        "last": 5346
    },
    {
        "id": "38",
        "name": "The Book of Clothes and Adornment",
        "arabicName": "كتاب اللِّبَاسِ وَالزِّينَةِ",
        "first": 5347,
        "last": 5539
    },
    {
        "id": "39",
        "name": "The Book of Manners and Etiquette",
        "arabicName": "كتاب الْآدَابِ",
        "first": 5540,
        "last": 5599
    },
    {
        "id": "40",
        "name": "The Book of Greetings",
        "arabicName": "كتاب السَّلَامِ",
        "first": 5600,
        "last": 5811
    },
    {
        "id": "41",
        "name": "The Book Concerning the Use of Correct Words",
        "arabicName": "كتاب الْأَلْفَاظِ مِنَ الْأَدَبِ وَغَيْرِهَا",
        "first": 5812,
        "last": 5834
    },
    {
        "id": "42",
        "name": "The Book of Poetry",
        "arabicName": "كتاب الشِّعْرِ",
        "first": 5835,
        "last": 5845
    },
    {
        "id": "43",
        "name": "The Book of Dreams",
        "arabicName": "كتاب الرُّؤْيَا",
        "first": 5846,
        "last": 5886
    },
    {
        "id": "44",
        "name": "The Book of Virtues",
        "arabicName": "كتاب الْفَضَائِلِ",
        "first": 5887,
        "last": 6112
    },
    {
        "id": "45",
        "name": "The Book of the Merits of the Companions",
        "arabicName": "كتاب فَضَائِلِ الصَّحَابَةِ رَضِيَ اللَّهُ تَعَالَى عَنْهُمْ",
        "first": 6113,
        "last": 6440
    },
    {
        "id": "46",
        "name": "The Book of Virtue, Enjoining Good Manners, and Joining of the Ties of Kinship",
        "arabicName": "كتاب الْبِرِّ وَالصِّلَةِ وَالْآدَابِ",
        "first": 6441,
        "last": 6657
    },
    {
        "id": "47",
        "name": "The Book of Destiny",
        "arabicName": "كتاب الْقَدَرِ",
        "first": 6658,
        "last": 6709
    },
    {
        "id": "48",
        "name": "The Book of Knowledge",
        "arabicName": "كتاب الْعِلْمِ",
        "first": 6710,
        "last": 6739
    },
    {
        "id": "49",
        "name": "The Book Pertaining to the Remembrance of Allah, Supplication, Repentance and Seeking Forgiveness",
        "arabicName": "كتاب الذِّكْرِ وَالدُّعَاءِ وَالتَّوْبَةِ وَالِاسْتِغْفَارِ",
        "first": 6740,
        "last": 6866
    },
    {
        "id": "50",
        "name": "The Book of Heart-Melting Traditions",
        "arabicName": "كِتَابُ الرِّقَاقِ",
        "first": 6867,
        "last": 6881
    },
    {
        "id": "51",
        "name": "The Book of Repentance",
        "arabicName": "كتاب التَّوْبَةِ",
        "first": 6882,
        "last": 6949
    },
    {
        "id": "52",
        "name": "Characteristics of The Hypocrites And Rulings Concerning Them",
        "arabicName": "كِتَابُ صِفَاتِ الْمُنَافِقِينَ وَأَحْكَامِهِمْ",
        "first": 6950,
        "last": 6970
    },
    {
        "id": "53",
        "name": "Characteristics of the Day of Judgment, Paradise, and Hell",
        "arabicName": "كتاب صِفَةِ الْقِيَامَةِ وَالْجَنَّةِ وَالنَّارِ",
        "first": 6971,
        "last": 7052
    },
    {
        "id": "54",
        "name": "The Book of Paradise, its Description, its Bounties and its Inhabitants",
        "arabicName": "كتاب الْجَنَّةِ وَصِفَةِ نَعِيمِهَا وَأَهْلِهَا",
        "first": 7053,
        "last": 7155
    },
    {
        "id": "55",
        "name": "The Book of Tribulations and Portents of the Last Hour",
        "arabicName": "كتاب الْفِتَنِ وَأَشْرَاطِ السَّاعَةِ",
        "first": 7156,
        "last": 7334
    },
    {
        "id": "56",
        "name": "The Book of Zuhd and Softening of Hearts",
        "arabicName": "كِتَابُ الزُّهْدِ وَالرَّقَائِقِ",
        "first": 7335,
        "last": 7430
    },
    {
        "id": "57",
        "name": "The Book of Commentary on the Qur'an",
        "arabicName": "كتاب التَّفْسِيرِ",
        "first": 7431,
        "last": 7470
    }
],
  "nasai": [
    {
        "id": "1",
        "name": "The Book of Purification",
        "arabicName": "Purification",
        "first": 1,
        "last": 326
    },
    {
        "id": "2",
        "name": "The Book of Water",
        "arabicName": "Water",
        "first": 327,
        "last": 349
    },
    {
        "id": "3",
        "name": "The Book of Menstruation and Istihadah",
        "arabicName": "Menstruation and Istihadah",
        "first": 350,
        "last": 397
    },
    {
        "id": "4",
        "name": "The Book of Ghusl & Tayammum",
        "arabicName": "Ghusl &amp; Tayammum",
        "first": 398,
        "last": 450
    },
    {
        "id": "5",
        "name": "The Book of Salah",
        "arabicName": "Salah",
        "first": 451,
        "last": 496
    },
    {
        "id": "6",
        "name": "The Book of the Times (of Prayer)",
        "arabicName": "Times (of Prayer)",
        "first": 497,
        "last": 631
    },
    {
        "id": "7",
        "name": "The Book of the Adhan (The Call to Prayer)",
        "arabicName": "Adhan (The Call to Prayer)",
        "first": 632,
        "last": 694
    },
    {
        "id": "8",
        "name": "The Book of the Masjids",
        "arabicName": "Masjids",
        "first": 695,
        "last": 748
    },
    {
        "id": "9",
        "name": "The Book of the Qiblah",
        "arabicName": "Qiblah",
        "first": 749,
        "last": 783
    },
    {
        "id": "10",
        "name": "The Book of Leading the Prayer (Al-Imamah)",
        "arabicName": "Leading the Prayer (Al-Imamah)",
        "first": 784,
        "last": 882
    },
    {
        "id": "11",
        "name": "The Book of the Commencement of the Prayer",
        "arabicName": "Commencement of the Prayer",
        "first": 883,
        "last": 1035
    },
    {
        "id": "12",
        "name": "The Book of The At-Tatbiq (Clasping One's Hands Together)",
        "arabicName": "At-Tatbiq (Clasping One&#x27;s Hands Together)",
        "first": 1036,
        "last": 1185
    },
    {
        "id": "13",
        "name": "The Book of Forgetfulness (In Prayer)",
        "arabicName": "Forgetfulness (In Prayer)",
        "first": 1186,
        "last": 1373
    },
    {
        "id": "14",
        "name": "The Book of Jumu'ah (Friday Prayer)",
        "arabicName": "Jumu&#x27;ah (Friday Prayer)",
        "first": 1374,
        "last": 1442
    },
    {
        "id": "15",
        "name": "The Book of Shortening the Prayer When Traveling",
        "arabicName": "Shortening the Prayer When Traveling",
        "first": 1443,
        "last": 1468
    },
    {
        "id": "16",
        "name": "The Book of Eclipses",
        "arabicName": "Eclipses",
        "first": 1469,
        "last": 1513
    },
    {
        "id": "17",
        "name": "The Book of Praying for Rain (Al-Istisqa')",
        "arabicName": "Praying for Rain (Al-Istisqa&#x27;)",
        "first": 1514,
        "last": 1538
    },
    {
        "id": "18",
        "name": "The Book of the Fear Prayer",
        "arabicName": "Fear Prayer",
        "first": 1539,
        "last": 1565
    },
    {
        "id": "19",
        "name": "The Book of the Prayer for the Two 'Eids",
        "arabicName": "Prayer for the Two &#x27;Eids",
        "first": 1566,
        "last": 1607
    },
    {
        "id": "20",
        "name": "The Book of Qiyam Al-Lail and Voluntary Prayers During the Day",
        "arabicName": "Qiyam Al-Lail and Voluntary Prayers During the Day",
        "first": 1608,
        "last": 1827
    },
    {
        "id": "21",
        "name": "The Book of Funerals",
        "arabicName": "Funerals",
        "first": 1828,
        "last": 2100
    },
    {
        "id": "22",
        "name": "The Book of Fasting",
        "arabicName": "Fasting",
        "first": 2101,
        "last": 2445
    },
    {
        "id": "23",
        "name": "The Book of Zakah",
        "arabicName": "Zakah",
        "first": 2446,
        "last": 2629
    },
    {
        "id": "24",
        "name": "The Book of Hajj",
        "arabicName": "Hajj",
        "first": 2630,
        "last": 3096
    },
    {
        "id": "25",
        "name": "The Book of Jihad",
        "arabicName": "Jihad",
        "first": 3097,
        "last": 3207
    },
    {
        "id": "26",
        "name": "The Book of Marriage",
        "arabicName": "Marriage",
        "first": 3208,
        "last": 3400
    },
    {
        "id": "27",
        "name": "The Book of Divorce",
        "arabicName": "Divorce",
        "first": 3401,
        "last": 3574
    },
    {
        "id": "28",
        "name": "The Book of Horses, Races and Shooting",
        "arabicName": "Horses, Races and Shooting",
        "first": 3575,
        "last": 3607
    },
    {
        "id": "29",
        "name": "The Book of Endowments",
        "arabicName": "Endowments",
        "first": 3608,
        "last": 3624
    },
    {
        "id": "30",
        "name": "The Book of Wills",
        "arabicName": "Wills",
        "first": 3625,
        "last": 3685
    },
    {
        "id": "31",
        "name": "The Book of Presents",
        "arabicName": "Presents",
        "first": 3686,
        "last": 3701
    },
    {
        "id": "32",
        "name": "The Book of Gifts",
        "arabicName": "Gifts",
        "first": 3702,
        "last": 3719
    },
    {
        "id": "33",
        "name": "The Book of ar-Ruqba",
        "arabicName": "ar-Ruqba",
        "first": 3720,
        "last": 3733
    },
    {
        "id": "34",
        "name": "The Book of 'Umra",
        "arabicName": "Umra",
        "first": 3734,
        "last": 3775
    },
    {
        "id": "35",
        "name": "The Book of Oaths and Vows",
        "arabicName": "Oaths and Vows",
        "first": 3776,
        "last": 3871
    },
    {
        "id": "36",
        "name": "The Book of the Kind Treatment of Women",
        "arabicName": "The Kind Treatment of Women",
        "first": 3872,
        "last": 3898
    },
    {
        "id": "37",
        "name": "The Book of Fighting [The Prohibition of Bloodshed]",
        "arabicName": "Fighting [The Prohibition of Bloodshed]",
        "first": 3899,
        "last": 4065
    },
    {
        "id": "38",
        "name": "The Book of Distribution of Al-Fay'",
        "arabicName": "The Book of Distribution of Al-Fay&#x27;",
        "first": 4066,
        "last": 4081
    },
    {
        "id": "39",
        "name": "The Book of al-Bay'ah",
        "arabicName": "al-Bay&#x27;ah",
        "first": 4082,
        "last": 4144
    },
    {
        "id": "40",
        "name": "The Book of al-'Aqiqah",
        "arabicName": "al-&#x27;Aqiqah",
        "first": 4145,
        "last": 4154
    },
    {
        "id": "41",
        "name": "The Book of al-Fara' and al-'Atirah",
        "arabicName": "al-Fara&#x27; and al-&#x27;Atirah",
        "first": 4155,
        "last": 4195
    },
    {
        "id": "42",
        "name": "The Book of Hunting and Slaughtering",
        "arabicName": "Hunting and Slaughtering",
        "first": 4196,
        "last": 4293
    },
    {
        "id": "43",
        "name": "The Book of ad-Dahaya (Sacrifices)",
        "arabicName": "ad-Dahaya (Sacrifices)",
        "first": 4294,
        "last": 4381
    },
    {
        "id": "44",
        "name": "The Book of Financial Transactions",
        "arabicName": "Financial Transactions",
        "first": 4382,
        "last": 4638
    },
    {
        "id": "45",
        "name": "The Book of Oaths (qasamah), Retaliation and Blood Money",
        "arabicName": "Oaths (qasamah), Retaliation and Blood Money",
        "first": 4639,
        "last": 4802
    },
    {
        "id": "46",
        "name": "The Book of Cutting off the Hand of the Thief",
        "arabicName": "Cutting off the Hand of the Thief",
        "first": 4803,
        "last": 4916
    },
    {
        "id": "47",
        "name": "The Book Of Faith and its Signs",
        "arabicName": "Faith and its Signs",
        "first": 4917,
        "last": 4971
    },
    {
        "id": "48",
        "name": "The Book of Adornment",
        "arabicName": "Adornment",
        "first": 4972,
        "last": 5310
    },
    {
        "id": "49",
        "name": "The Book of the Etiquette of Judges",
        "arabicName": "Etiquette of Judges",
        "first": 5311,
        "last": 5359
    },
    {
        "id": "50",
        "name": "The Book of Seeking Refuge with Allah",
        "arabicName": "Seeking Refuge with Allah",
        "first": 5360,
        "last": 5471
    },
    {
        "id": "51",
        "name": "The Book of Drinks",
        "arabicName": "Drinks",
        "first": 5472,
        "last": 5691
    },
    {
        "id": "52",
        "name": "The Book of Agriculture",
        "arabicName": "Agriculture",
        "first": 5692,
        "last": 5774
    }
],
  "abudawud": [
    {
        "id": "1",
        "name": "Purification (Kitab Al-Taharah)",
        "arabicName": "كِتَاب الطَّهَارَةِ",
        "first": 1,
        "last": 390
    },
    {
        "id": "2",
        "name": "Prayer (Kitab Al-Salat)",
        "arabicName": "كِتَاب الصَّلَاةِ",
        "first": 391,
        "last": 1161
    },
    {
        "id": "3",
        "name": "The Book Of The Prayer For Rain (Kitab al-Istisqa')",
        "arabicName": "Prayer For Rain",
        "first": 1162,
        "last": 1198
    },
    {
        "id": "4",
        "name": "Prayer (Kitab Al-Salat): Detailed Rules of Law about the Prayer during Journey",
        "arabicName": "Rules of Law about the Prayer during Journey",
        "first": 1199,
        "last": 1250
    },
    {
        "id": "5",
        "name": "Prayer (Kitab Al-Salat): Voluntary Prayers",
        "arabicName": "Voluntary Prayers",
        "first": 1251,
        "last": 1371
    },
    {
        "id": "6",
        "name": "Prayer (Kitab Al-Salat): Detailed Injunctions about Ramadan",
        "arabicName": "Detailed Injunctions about Ramadan",
        "first": 1372,
        "last": 1401
    },
    {
        "id": "7",
        "name": "Prayer (Kitab Al-Salat): Prostration while reciting the Qur'an",
        "arabicName": "Prostration while reciting the Qur&#x27;an",
        "first": 1402,
        "last": 1416
    },
    {
        "id": "8",
        "name": "Prayer (Kitab Al-Salat): Detailed Injunctions about Witr",
        "arabicName": "Detailed Injunctions about Witr",
        "first": 1417,
        "last": 1556
    },
    {
        "id": "9",
        "name": "Zakat (Kitab Al-Zakat)",
        "arabicName": "كِتَاب الزَّكَاةِ",
        "first": 1557,
        "last": 1701
    },
    {
        "id": "10",
        "name": "The Book of Lost and Found Items",
        "arabicName": "Lost and Found Items",
        "first": 1702,
        "last": 1721
    },
    {
        "id": "11",
        "name": "The Rites of Hajj (Kitab Al-Manasik Wa'l-Hajj)",
        "arabicName": "The Rites of Hajj",
        "first": 1722,
        "last": 2046
    },
    {
        "id": "12",
        "name": "Marriage (Kitab Al-Nikah)",
        "arabicName": "Marriage",
        "first": 2047,
        "last": 2175
    },
    {
        "id": "13",
        "name": "Divorce (Kitab Al-Talaq)",
        "arabicName": "Divorce",
        "first": 2176,
        "last": 2313
    },
    {
        "id": "14",
        "name": "Fasting (Kitab Al-Siyam)",
        "arabicName": "Fasting",
        "first": 2314,
        "last": 2477
    },
    {
        "id": "15",
        "name": "Jihad (Kitab Al-Jihad)",
        "arabicName": "Jihad",
        "first": 2478,
        "last": 2788
    },
    {
        "id": "16",
        "name": "Sacrifice (Kitab Al-Dahaya)",
        "arabicName": "Sacrifice",
        "first": 2789,
        "last": 2844
    },
    {
        "id": "17",
        "name": "Game (Kitab Al-Said)",
        "arabicName": "Game",
        "first": 2845,
        "last": 2862
    },
    {
        "id": "18",
        "name": "Wills (Kitab Al-Wasaya)",
        "arabicName": "Wills",
        "first": 2863,
        "last": 2885
    },
    {
        "id": "19",
        "name": "Shares of Inheritance (Kitab Al-Fara'id)",
        "arabicName": "Shares of Inheritance",
        "first": 2886,
        "last": 2928
    },
    {
        "id": "20",
        "name": "Tribute, Spoils, and Rulership (Kitab Al-Kharaj, Wal-Fai' Wal-Imarah)",
        "arabicName": "Tribute, Spoils, and Rulership",
        "first": 2929,
        "last": 3089
    },
    {
        "id": "21",
        "name": "Funerals (Kitab Al-Jana'iz)",
        "arabicName": "Funerals",
        "first": 3090,
        "last": 3242
    },
    {
        "id": "22",
        "name": "Oaths and Vows (Kitab Al-Aiman Wa Al-Nudhur)",
        "arabicName": "Oaths and Vows",
        "first": 3243,
        "last": 3326
    },
    {
        "id": "23",
        "name": "Commercial Transactions (Kitab Al-Buyu)",
        "arabicName": "Commercial Transactions",
        "first": 3327,
        "last": 3416
    },
    {
        "id": "24",
        "name": "Wages (Kitab Al-Ijarah)",
        "arabicName": "Wages",
        "first": 3417,
        "last": 3571
    },
    {
        "id": "25",
        "name": "The Office of the Judge (Kitab Al-Aqdiyah)",
        "arabicName": "The Office of the Judge",
        "first": 3572,
        "last": 3641
    },
    {
        "id": "26",
        "name": "Knowledge (Kitab Al-Ilm)",
        "arabicName": "Knowledge",
        "first": 3642,
        "last": 3669
    },
    {
        "id": "27",
        "name": "Drinks (Kitab Al-Ashribah)",
        "arabicName": "Drinks",
        "first": 3670,
        "last": 3736
    },
    {
        "id": "28",
        "name": "Foods (Kitab Al-At'imah)",
        "arabicName": "Foods",
        "first": 3737,
        "last": 3855
    },
    {
        "id": "29",
        "name": "Medicine (Kitab Al-Tibb)",
        "arabicName": "Medicine",
        "first": 3856,
        "last": 3904
    },
    {
        "id": "30",
        "name": "Divination and Omens (Kitab Al-Kahanah Wa Al-Tatayyur)",
        "arabicName": "Divination and Omens",
        "first": 3905,
        "last": 3926
    },
    {
        "id": "31",
        "name": "The Book of Manumission of Slaves",
        "arabicName": "Manumission of Slaves",
        "first": 3927,
        "last": 3969
    },
    {
        "id": "32",
        "name": "Dialects and Readings of the Qur'an (Kitab Al-Huruf Wa Al-Qira'at)",
        "arabicName": "Dialects and Readings of the Qur&#x27;an",
        "first": 3970,
        "last": 4009
    },
    {
        "id": "33",
        "name": "Hot Baths (Kitab Al-Hammam)",
        "arabicName": "Hot Baths",
        "first": 4010,
        "last": 4020
    },
    {
        "id": "34",
        "name": "Clothing (Kitab Al-Libas)",
        "arabicName": "Clothing",
        "first": 4021,
        "last": 4159
    },
    {
        "id": "35",
        "name": "Combing the Hair (Kitab Al-Tarajjul)",
        "arabicName": "Combing the Hair",
        "first": 4160,
        "last": 4214
    },
    {
        "id": "36",
        "name": "Signet-Rings (Kitab Al-Khatam)",
        "arabicName": "Signet-Rings",
        "first": 4215,
        "last": 4240
    },
    {
        "id": "37",
        "name": "Trials and Fierce Battles (Kitab Al-Fitan Wa Al-Malahim)",
        "arabicName": "Trials and Fierce Battles",
        "first": 4241,
        "last": 4279
    },
    {
        "id": "38",
        "name": "The Promised Deliverer (Kitab Al-Mahdi)",
        "arabicName": "The Promised Deliverer",
        "first": 4280,
        "last": 4292
    },
    {
        "id": "39",
        "name": "Battles (Kitab Al-Malahim)",
        "arabicName": "Battles",
        "first": 4293,
        "last": 4352
    },
    {
        "id": "40",
        "name": "Prescribed Punishments (Kitab Al-Hudud)",
        "arabicName": "Prescribed Punishments",
        "first": 4353,
        "last": 4495
    },
    {
        "id": "41",
        "name": "Types of Blood-Wit (Kitab Al-Diyat)",
        "arabicName": "Types of Blood-Wit",
        "first": 4496,
        "last": 4597
    },
    {
        "id": "42",
        "name": "Model Behavior of the Prophet (Kitab Al-Sunnah)",
        "arabicName": "Model Behavior of the Prophet",
        "first": 4598,
        "last": 4774
    },
    {
        "id": "43",
        "name": "General Behavior (Kitab Al-Adab)",
        "arabicName": "General Behavior",
        "first": 4775,
        "last": 5276
    }
],
  "tirmidhi": [
    {
        "id": "1",
        "name": "The Book on Purification",
        "arabicName": "كِتَاب الطَّهَارَةِ",
        "first": 1,
        "last": 148
    },
    {
        "id": "2",
        "name": "The Book on Salat (Prayer)",
        "arabicName": "كِتَاب الصَّلَاةِ",
        "first": 149,
        "last": 452
    },
    {
        "id": "3",
        "name": "The Book on Al-Witr",
        "arabicName": "أَبْوَابُ الْوِتْرِ",
        "first": 453,
        "last": 487
    },
    {
        "id": "4",
        "name": "The Book on the Day of Friday",
        "arabicName": "كِتَاب الْجُمُعَةِ عَنْ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
        "first": 488,
        "last": 529
    },
    {
        "id": "5",
        "name": "The Book on the Two Eids",
        "arabicName": "أَبْوَابُ الْعِيدَيْنِ عَنْ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
        "first": 530,
        "last": 543
    },
    {
        "id": "6",
        "name": "The Book on Traveling",
        "arabicName": "أَبْوَابُ السَّفَرِ",
        "first": 544,
        "last": 616
    },
    {
        "id": "7",
        "name": "The Book on Zakat",
        "arabicName": "كِتَابُ الزَّكَاةِ",
        "first": 617,
        "last": 681
    },
    {
        "id": "8",
        "name": "The Book on Fasting",
        "arabicName": "كتاب الزكاة عن رسول الله صلى الله عليه وسلم",
        "first": 682,
        "last": 808
    },
    {
        "id": "9",
        "name": "The Book on Hajj",
        "arabicName": "كِتَابُ الحَجِّ",
        "first": 809,
        "last": 966
    },
    {
        "id": "10",
        "name": "The Book on Jana''iz (Funerals)",
        "arabicName": "كِتَابُ الْجَنَائِزِ",
        "first": 967,
        "last": 1081
    },
    {
        "id": "11",
        "name": "The Book on Marriage",
        "arabicName": "كِتَابُ النِّكَاحِ",
        "first": 1082,
        "last": 1148
    },
    {
        "id": "12",
        "name": "The Book on Suckling",
        "arabicName": "كِتَابُ الرِّضَاعِ",
        "first": 1149,
        "last": 1177
    },
    {
        "id": "13",
        "name": "The Book on Divorce and Li'an",
        "arabicName": "كِتَابُ الطلاق واللعان",
        "first": 1178,
        "last": 1208
    },
    {
        "id": "14",
        "name": "The Book on Business",
        "arabicName": "كِتَابُ البُيُوعِ",
        "first": 1209,
        "last": 1333
    },
    {
        "id": "15",
        "name": "The Chapters On Judgements From The Messenger of Allah",
        "arabicName": "كِتَابُ الأَحْكَامِ",
        "first": 1334,
        "last": 1399
    },
    {
        "id": "16",
        "name": "The Book on Blood Money",
        "arabicName": "كِتَابُ الدِّيَاتِ",
        "first": 1400,
        "last": 1438
    },
    {
        "id": "17",
        "name": "The Book on Legal Punishments (Al-Hudud)",
        "arabicName": "كِتَابُ الحُدُودِ",
        "first": 1439,
        "last": 1485
    },
    {
        "id": "18",
        "name": "The Book on Hunting",
        "arabicName": "كِتَابُ الصَّيْدِ وَ الذَّبَائِحِ",
        "first": 1486,
        "last": 1521
    },
    {
        "id": "19",
        "name": "The Book on Sacrifices",
        "arabicName": "كتاب الْأَضَاحِيِّ",
        "first": 1522,
        "last": 1557
    },
    {
        "id": "20",
        "name": "The Book on Vows and Oaths",
        "arabicName": "أبواب النذور والأيمان",
        "first": 1558,
        "last": 1583
    },
    {
        "id": "21",
        "name": "The Book on Military Expeditions",
        "arabicName": "أبواب السِّيَرِ",
        "first": 1584,
        "last": 1666
    },
    {
        "id": "22",
        "name": "The Book on Virtues of Jihad",
        "arabicName": "أبواب فضائل الجهاد",
        "first": 1667,
        "last": 1718
    },
    {
        "id": "23",
        "name": "The Book on Jihad",
        "arabicName": "كِتَابُ الْجِهَادِ",
        "first": 1719,
        "last": 1771
    },
    {
        "id": "24",
        "name": "The Book on Clothing",
        "arabicName": "كِتَابُ اللِّبَاسِ",
        "first": 1772,
        "last": 1847
    },
    {
        "id": "25",
        "name": "The Book on Food",
        "arabicName": "كِتَابُ الْأَطْعِمَةِ",
        "first": 1848,
        "last": 1925
    },
    {
        "id": "26",
        "name": "The Book on Drinks",
        "arabicName": "كِتَابُ الْأَشْرِبَةِ",
        "first": 1926,
        "last": 1962
    },
    {
        "id": "27",
        "name": "Chapters on Righteousness And Maintaining Good Relations With Relatives",
        "arabicName": "أبواب البر والصلة",
        "first": 1963,
        "last": 2103
    },
    {
        "id": "28",
        "name": "Chapters on Medicine",
        "arabicName": "كِتَابُ الطِّبِّ",
        "first": 2104,
        "last": 2168
    },
    {
        "id": "29",
        "name": "Chapters On Inheritance",
        "arabicName": "كِتَابُ الفَرَائِضِ",
        "first": 2169,
        "last": 2197
    },
    {
        "id": "30",
        "name": "Chapters On Wasaya (Wills and Testament)",
        "arabicName": "أبواب الوصايا",
        "first": 2198,
        "last": 2206
    },
    {
        "id": "31",
        "name": "Chapters On Wala' And Gifts",
        "arabicName": "أبواب الولاء والهبة",
        "first": 2207,
        "last": 2215
    },
    {
        "id": "32",
        "name": "Chapters On Al-Qadar",
        "arabicName": "كِتَابُ الْقَدَرِ",
        "first": 2216,
        "last": 2246
    },
    {
        "id": "33",
        "name": "Chapters On Al-Fitan",
        "arabicName": "أبواب الفتن",
        "first": 2247,
        "last": 2358
    },
    {
        "id": "34",
        "name": "Chapters On Dreams",
        "arabicName": "كتاب الرُّؤْيَا",
        "first": 2359,
        "last": 2383
    },
    {
        "id": "35",
        "name": "Chapters On Witnesses",
        "arabicName": "كِتَابُ الشَّهَادَاتِ",
        "first": 2384,
        "last": 2392
    },
    {
        "id": "36",
        "name": "Chapters On Zuhd",
        "arabicName": "أبواب الزهد",
        "first": 2393,
        "last": 2504
    },
    {
        "id": "37",
        "name": "Chapters on the description of the Day of Judgement, Ar-Riqaq, and Al-Wara'",
        "arabicName": "أبواب صفة القيامة والرقائق والورع",
        "first": 2505,
        "last": 2620
    },
    {
        "id": "38",
        "name": "Chapters on the description of Paradise",
        "arabicName": "أبواب صفة الجنة",
        "first": 2621,
        "last": 2679
    },
    {
        "id": "39",
        "name": "The Book on the Description of Hellfire",
        "arabicName": "أبواب صفة جهنم",
        "first": 2680,
        "last": 2716
    },
    {
        "id": "40",
        "name": "The Book on Faith",
        "arabicName": "كِتَابُ الْأَيْمَانِ",
        "first": 2717,
        "last": 2755
    },
    {
        "id": "41",
        "name": "Chapters on Knowledge",
        "arabicName": "كِتَابُ الْعِلْمِ",
        "first": 2756,
        "last": 2798
    },
    {
        "id": "42",
        "name": "Chapters on Seeking Permission",
        "arabicName": "أبواب الاستئذان والآداب",
        "first": 2799,
        "last": 2846
    },
    {
        "id": "43",
        "name": "Chapters on Manners",
        "arabicName": "أبواب الأدب",
        "first": 2847,
        "last": 2988
    },
    {
        "id": "44",
        "name": "Chapters on Parables",
        "arabicName": "أبواب الأدب",
        "first": 2989,
        "last": 3005
    },
    {
        "id": "45",
        "name": "Chapters on The Virtues of the Qur'an",
        "arabicName": "كِتَابُ فَضَائِلِ الْقُرْآنِ",
        "first": 3006,
        "last": 3068
    },
    {
        "id": "46",
        "name": "Chapters on Recitation",
        "arabicName": "أبواب القراءات",
        "first": 3069,
        "last": 3095
    },
    {
        "id": "47",
        "name": "Chapters on Tafsir",
        "arabicName": "أبواب تفسير القرآن",
        "first": 3096,
        "last": 3587
    },
    {
        "id": "48",
        "name": "Chapters on Supplication",
        "arabicName": "أبواب الدعوات",
        "first": 3588,
        "last": 3831
    },
    {
        "id": "49",
        "name": "Chapters on Virtues",
        "arabicName": "أبواب المناقب",
        "first": 3832,
        "last": 4209
    }
],
  "ibnmajah": [
    {
        "id": "1",
        "name": "The Book of the Sunnah",
        "arabicName": "الْمُقَدِّمَةُ",
        "first": 1,
        "last": 266
    },
    {
        "id": "2",
        "name": "The Book of Purification and its Sunnah",
        "arabicName": "كِتَابُ الطَّهَارَةِ وَسُنَنِهَا",
        "first": 267,
        "last": 666
    },
    {
        "id": "3",
        "name": "The Book of the Prayer",
        "arabicName": "كِتَابُ الصَّلَاةِ",
        "first": 667,
        "last": 705
    },
    {
        "id": "4",
        "name": "The Book of the Adhan and the Sunnah Regarding It",
        "arabicName": "كِتَابُ الْأَذَانِ ، وَالسُّنَّةُ فِيهِ",
        "first": 706,
        "last": 734
    },
    {
        "id": "5",
        "name": "The Book On The Mosques And The Congregations",
        "arabicName": "كِتَابُ الْمَسَاجِدِ وَالْجَمَاعَاتِ",
        "first": 735,
        "last": 802
    },
    {
        "id": "6",
        "name": "Establishing the Prayer and the Sunnah Regarding Them",
        "arabicName": "كِتَابُ إِقَامَةِ الصَّلَاةِ ، وَالسُّنَّةُ فِيهَا",
        "first": 803,
        "last": 1432
    },
    {
        "id": "7",
        "name": "Chapters Regarding Funerals",
        "arabicName": "كِتَابُ الْجَنَائِزِ",
        "first": 1433,
        "last": 1637
    },
    {
        "id": "8",
        "name": "Fasting",
        "arabicName": "كِتَابُ الصِّيَامِ",
        "first": 1638,
        "last": 1782
    },
    {
        "id": "9",
        "name": "The Chapters Regarding Zakat",
        "arabicName": "كِتَابُ الزَّكَاةِ",
        "first": 1783,
        "last": 1844
    },
    {
        "id": "10",
        "name": "The Chapters on Marriage",
        "arabicName": "كِتَابُ النِّكَاحِ",
        "first": 1845,
        "last": 2019
    },
    {
        "id": "11",
        "name": "The Chapters on Divorce",
        "arabicName": "كِتَابُ الطَّلَاقِ",
        "first": 2020,
        "last": 2093
    },
    {
        "id": "12",
        "name": "The Chapters on Expiation",
        "arabicName": "كِتَابُ الْكَفَّارَاتِ",
        "first": 2094,
        "last": 2145
    },
    {
        "id": "13",
        "name": "The Chapters on Business Transactions",
        "arabicName": "كِتَابُ التِّجَارَاتِ",
        "first": 2146,
        "last": 2321
    },
    {
        "id": "14",
        "name": "The Chapters on Rulings",
        "arabicName": "كِتَابُ الْأَحْكَامِ",
        "first": 2322,
        "last": 2388
    },
    {
        "id": "15",
        "name": "The Chapters on Gifts",
        "arabicName": "كِتَابُ الْهِبَاتِ",
        "first": 2389,
        "last": 2403
    },
    {
        "id": "16",
        "name": "The Chapters on Charity",
        "arabicName": "كِتَابُ الصَّدَقَاتِ",
        "first": 2404,
        "last": 2453
    },
    {
        "id": "17",
        "name": "The Chapters on Pawning",
        "arabicName": "كِتَابُ الرُّهُونِ",
        "first": 2454,
        "last": 2510
    },
    {
        "id": "18",
        "name": "The Chapters on Pre-emption",
        "arabicName": "كِتَابُ الشُّفْعَةِ",
        "first": 2511,
        "last": 2521
    },
    {
        "id": "19",
        "name": "The Chapters on Lost Property",
        "arabicName": "كِتَابُ اللُّقَطَةِ",
        "first": 2522,
        "last": 2531
    },
    {
        "id": "20",
        "name": "The Chapters on Manumission (of Slaves)",
        "arabicName": "كِتَابُ الْعِتْقِ",
        "first": 2532,
        "last": 2553
    },
    {
        "id": "21",
        "name": "The Chapters on Legal Punishments",
        "arabicName": "كِتَابُ الْحُدُودِ",
        "first": 2554,
        "last": 2636
    },
    {
        "id": "22",
        "name": "The Chapters on Blood Money",
        "arabicName": "كِتَابُ الدِّيَاتِ",
        "first": 2637,
        "last": 2722
    },
    {
        "id": "23",
        "name": "The Chapters on Wills",
        "arabicName": "كِتَابُ الْوَصَايَا",
        "first": 2723,
        "last": 2747
    },
    {
        "id": "24",
        "name": "Chapters on Shares of Inheritance",
        "arabicName": "كِتَابُ الْفَرَائِضِ",
        "first": 2748,
        "last": 2782
    },
    {
        "id": "25",
        "name": "The Chapters on Jihad",
        "arabicName": "كِتَابُ الْجِهَادِ",
        "first": 2783,
        "last": 2916
    },
    {
        "id": "26",
        "name": "Chapters on Hajj Rituals",
        "arabicName": "كِتَابُ الْمَنَاسِكِ",
        "first": 2917,
        "last": 3163
    },
    {
        "id": "27",
        "name": "Chapters on Sacrifices",
        "arabicName": "كِتَابُ الْأَضَاحِيِّ",
        "first": 3164,
        "last": 3206
    },
    {
        "id": "28",
        "name": "Chapters on Slaughtering",
        "arabicName": "كِتَابُ الذَّبَائِحِ",
        "first": 3207,
        "last": 3245
    },
    {
        "id": "29",
        "name": "Chapters on Hunting",
        "arabicName": "كِتَابُ الصَّيْدِ",
        "first": 3246,
        "last": 3298
    },
    {
        "id": "30",
        "name": "Chapters on Food",
        "arabicName": "كِتَابُ الْأَطْعِمَةِ",
        "first": 3299,
        "last": 3420
    },
    {
        "id": "31",
        "name": "Chapters on Drinks",
        "arabicName": "كِتَابُ الْأَشْرِبَةِ",
        "first": 3421,
        "last": 3486
    },
    {
        "id": "32",
        "name": "Chapters on Medicine",
        "arabicName": "كِتَابُ الطِّبِّ",
        "first": 3487,
        "last": 3600
    },
    {
        "id": "33",
        "name": "Chapters on Dress",
        "arabicName": "كِتَابُ اللِّبَاسِ",
        "first": 3601,
        "last": 3709
    },
    {
        "id": "34",
        "name": "Etiquette",
        "arabicName": "كِتَابُ الْأَدَبِ",
        "first": 3710,
        "last": 3880
    },
    {
        "id": "35",
        "name": "Supplication",
        "arabicName": "كِتَابُ الدُّعَاءِ",
        "first": 3881,
        "last": 3946
    },
    {
        "id": "36",
        "name": "Interpretation of Dreams",
        "arabicName": "كِتَابُ تَعْبِيرِ الرُّؤْيَا",
        "first": 3947,
        "last": 3980
    },
    {
        "id": "37",
        "name": "Tribulations",
        "arabicName": "كِتَابُ الْفِتَنِ",
        "first": 3981,
        "last": 4155
    },
    {
        "id": "38",
        "name": "Zuhd",
        "arabicName": "كِتَابُ الزُّهْدِ",
        "first": 4156,
        "last": 4402
    }
],
  "ahmad": [
    {
        "id": "1",
        "name": "Musnad Abu Bakr",
        "arabicName": "مُسْنَدُ أَبِي بَكْرٍ الصِّدِّيقِ رَضِيَ اللَّهُ عَنْهُ",
        "first": 1,
        "last": 81
    },
    {
        "id": "2",
        "name": "Musnad Umar ibn Khattab",
        "arabicName": "مُسْنَدِ عُمَرَ بْنِ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ",
        "first": 82,
        "last": 390
    },
    {
        "id": "3",
        "name": "The Hadeeth of Saqeefah",
        "arabicName": "حَدِيثُ السَّقِيفَةِ",
        "first": 391,
        "last": 399
    },
    {
        "id": "4",
        "name": "Musnad Uthman ibn Affan",
        "arabicName": "مُسْنَدُ عُثْمَانَ بْنِ عَفَّانَ رَضِيَ اللَّهُ عَنْهُ",
        "first": 400,
        "last": 561
    },
    {
        "id": "5",
        "name": "Musnad 'Ali Ibn Abi Talib",
        "arabicName": "وَمِنْ مُسْنَدِ عَلِيِّ بْنِ أَبِي طَالِبٍ رَضِيَ اللَّهُ عَنْهُ",
        "first": 562,
        "last": 1380
    },
    {
        "id": "6",
        "name": "Musnad of Abu Muhammad Talhah bin 'Ubaidullah",
        "arabicName": "مُسْنَدُ أَبِي مُحَمَّدٍ طَلْحَةَ بْنِ عُبَيْدِ اللَّهِ رَضِيَ اللَّهُ تَعَالَى عَنْهُ",
        "first": 1381,
        "last": 1404
    },
    {
        "id": "7",
        "name": "The Musnad of az-Zubair bin al-'Awwam",
        "arabicName": "مُسْنَدُ الزُّبَيْرِ بْنِ الْعَوَّامِ رَضِيَ اللَّهُ عَنْهُ",
        "first": 1405,
        "last": 1438
    },
    {
        "id": "8",
        "name": "Musnad Abu Ishaq Sa'd bin Abi Waqqas",
        "arabicName": "9",
        "first": 1439,
        "last": 1624
    },
    {
        "id": "9",
        "name": "Musnad of Sa'eed bin Zaid bin 'Amr bin Nufail",
        "arabicName": "10",
        "first": 1625,
        "last": 1654
    },
    {
        "id": "10",
        "name": "Musnad of 'Abdur-Rahman bin 'Awf az-Zuhri",
        "arabicName": "11",
        "first": 1655,
        "last": 1689
    },
    {
        "id": "11",
        "name": "Hadeeth of Abu 'Ubaidah bin al-Jarrah, whose name was 'Amir bin Abdullah",
        "arabicName": "12",
        "first": 1690,
        "last": 1701
    },
    {
        "id": "12",
        "name": "The Hadeeth of 'Abdur-Rahman bin Abi Bakr",
        "arabicName": "13",
        "first": 1702,
        "last": 1713
    },
    {
        "id": "13",
        "name": "Hadeeth of Zaid bin Kharijah",
        "arabicName": "14",
        "first": 1714,
        "last": 1714
    },
    {
        "id": "14",
        "name": "The Hadeeth of al-Harith bin Khazamah",
        "arabicName": "15",
        "first": 1715,
        "last": 1715
    },
    {
        "id": "15",
        "name": "Hadeeth of Sa'd, the freed slave of Abu Bakr",
        "arabicName": "16",
        "first": 1716,
        "last": 1717
    },
    {
        "id": "16",
        "name": "The Musnad of Ahlul-Bayt & Hadeeth of al-Hasan bin 'Ali bin Abu Talib",
        "arabicName": "17",
        "first": 1718,
        "last": 1729
    },
    {
        "id": "17",
        "name": "The hadeeth of Al-Husain bin 'Ali",
        "arabicName": "18",
        "first": 1730,
        "last": 1737
    },
    {
        "id": "18",
        "name": "Hadeeth of 'Aqeel bin Abi Talib",
        "arabicName": "19",
        "first": 1738,
        "last": 1739
    },
    {
        "id": "19",
        "name": "Hadeeth of Ja'far bin Abi Talib & It is Hadeeth of al-Hijrah (migration)",
        "arabicName": "20",
        "first": 1740,
        "last": 1740
    },
    {
        "id": "20",
        "name": "Hadeeth of 'Abdullah bin Ja'far bin Abi Talib",
        "arabicName": "21",
        "first": 1741,
        "last": 1762
    },
    {
        "id": "21",
        "name": "Musnad Bani Hashim (Hadeeth of al-'Abbas bin 'Abdul-Muttalib from the  Prophet)",
        "arabicName": "22",
        "first": 1763,
        "last": 1789
    },
    {
        "id": "22",
        "name": "Musnad of al-Fadl bin 'Abbas & narrating from the Prophet",
        "arabicName": "23",
        "first": 1790,
        "last": 1833
    },
    {
        "id": "23",
        "name": "Hadeeth of Tammam bin al-'Abbas bin 'Abdul-Muttalib from the Prophet",
        "arabicName": "24",
        "first": 1834,
        "last": 1835
    },
    {
        "id": "24",
        "name": "Hadeeth of 'Ubaidullah bin al-'Abbas & from the Prophet",
        "arabicName": "25",
        "first": 1836,
        "last": 1836
    },
    {
        "id": "25",
        "name": "Musnad of 'Abdullah bin al-'Abbas bin 'Abdul-Muttalib from the Prophet",
        "arabicName": "26",
        "first": 1837,
        "last": 3525
    }
],
  "aladab_almufrad": [
    {
        "id": "1",
        "name": "Parents",
        "arabicName": "كتاب الْوَالِدَيْنِ",
        "first": 1,
        "last": 46
    },
    {
        "id": "2",
        "name": "Ties of Kinship",
        "arabicName": "Ties of Kinship",
        "first": 47,
        "last": 73
    },
    {
        "id": "3",
        "name": "Mawlas",
        "arabicName": "Mawlas",
        "first": 74,
        "last": 75
    },
    {
        "id": "4",
        "name": "Looking After Girls",
        "arabicName": "Looking After Girls",
        "first": 76,
        "last": 83
    },
    {
        "id": "5",
        "name": "Looking After Children",
        "arabicName": "Looking After Children",
        "first": 84,
        "last": 100
    },
    {
        "id": "6",
        "name": "Neighbours",
        "arabicName": "Neighbours",
        "first": 101,
        "last": 128
    },
    {
        "id": "7",
        "name": "Generosity and Orphans",
        "arabicName": "Generosity and Orphans",
        "first": 129,
        "last": 142
    },
    {
        "id": "8",
        "name": "Children Dying",
        "arabicName": "Children Dying",
        "first": 143,
        "last": 155
    },
    {
        "id": "9",
        "name": "Being a Master",
        "arabicName": "Being a Master",
        "first": 156,
        "last": 211
    },
    {
        "id": "10",
        "name": "Responsibility",
        "arabicName": "Responsibility",
        "first": 212,
        "last": 220
    },
    {
        "id": "11",
        "name": "Correctness",
        "arabicName": "Correctness",
        "first": 221,
        "last": 237
    },
    {
        "id": "12",
        "name": "Dealing with people cheerfully",
        "arabicName": "Dealing with people cheerfully",
        "first": 238,
        "last": 255
    },
    {
        "id": "13",
        "name": "Consulation",
        "arabicName": "Consulation",
        "first": 256,
        "last": 259
    },
    {
        "id": "14",
        "name": "Dealings with people and good character",
        "arabicName": "Dealings with people and good character",
        "first": 260,
        "last": 308
    },
    {
        "id": "15",
        "name": "Cursing and Defamation",
        "arabicName": "Cursing and Defamation",
        "first": 309,
        "last": 332
    },
    {
        "id": "16",
        "name": "Praising People",
        "arabicName": "Praising People",
        "first": 333,
        "last": 343
    },
    {
        "id": "17",
        "name": "Visiting and Guests",
        "arabicName": "Visiting and Guests",
        "first": 344,
        "last": 352
    },
    {
        "id": "18",
        "name": "The Elderly",
        "arabicName": "The Elderly",
        "first": 353,
        "last": 361
    },
    {
        "id": "19",
        "name": "Children",
        "arabicName": "Children",
        "first": 362,
        "last": 371
    },
    {
        "id": "20",
        "name": "Mercy",
        "arabicName": "Mercy",
        "first": 372,
        "last": 384
    },
    {
        "id": "21",
        "name": "Social Behaviour",
        "arabicName": "Social Behaviour",
        "first": 385,
        "last": 396
    },
    {
        "id": "22",
        "name": "Separation",
        "arabicName": "Separation",
        "first": 397,
        "last": 414
    },
    {
        "id": "23",
        "name": "Advice",
        "arabicName": "Advice",
        "first": 415,
        "last": 418
    },
    {
        "id": "24",
        "name": "Defamation",
        "arabicName": "Defamation",
        "first": 419,
        "last": 441
    },
    {
        "id": "25",
        "name": "Extravagance in Building",
        "arabicName": "Extravagance in Building",
        "first": 442,
        "last": 461
    },
    {
        "id": "26",
        "name": "Compassion",
        "arabicName": "Compassion",
        "first": 462,
        "last": 475
    },
    {
        "id": "27",
        "name": "Attending to this world",
        "arabicName": "Attending to this world",
        "first": 476,
        "last": 482
    },
    {
        "id": "28",
        "name": "Injustice",
        "arabicName": "Injustice",
        "first": 483,
        "last": 490
    },
    {
        "id": "30",
        "name": "General Behaviour",
        "arabicName": "General Behaviour",
        "first": 491,
        "last": 556
    },
    {
        "id": "32",
        "name": "Guests and Spending",
        "arabicName": "Guests and Spending",
        "first": 557,
        "last": 564
    },
    {
        "id": "33",
        "name": "Speech",
        "arabicName": "Speech",
        "first": 565,
        "last": 621
    },
    {
        "id": "34",
        "name": "Names",
        "arabicName": "Names",
        "first": 622,
        "last": 652
    },
    {
        "id": "35",
        "name": "Kunyas",
        "arabicName": "Kunyas",
        "first": 653,
        "last": 666
    },
    {
        "id": "36",
        "name": "Poetry",
        "arabicName": "Poetry",
        "first": 667,
        "last": 685
    },
    {
        "id": "37",
        "name": "Words",
        "arabicName": "Words",
        "first": 686,
        "last": 698
    },
    {
        "id": "38",
        "name": "General Behaviour",
        "arabicName": "General Behaviour",
        "first": 699,
        "last": 717
    },
    {
        "id": "39",
        "name": "Omens",
        "arabicName": "Omens",
        "first": 718,
        "last": 729
    },
    {
        "id": "40",
        "name": "Sneezing and Yawning",
        "arabicName": "Sneezing and Yawning",
        "first": 730,
        "last": 762
    },
    {
        "id": "41",
        "name": "Gestures",
        "arabicName": "Gestures",
        "first": 763,
        "last": 775
    },
    {
        "id": "42",
        "name": "Greeting",
        "arabicName": "Greeting",
        "first": 776,
        "last": 862
    },
    {
        "id": "43",
        "name": "Asking Permission to Enter",
        "arabicName": "Asking Permission to Enter",
        "first": 863,
        "last": 912
    },
    {
        "id": "44",
        "name": "People of the Book",
        "arabicName": "People of the Book",
        "first": 913,
        "last": 928
    },
    {
        "id": "45",
        "name": "Letters and greetings",
        "arabicName": "Letters and greetings",
        "first": 929,
        "last": 947
    },
    {
        "id": "46",
        "name": "Gatherings",
        "arabicName": "Gatherings",
        "first": 948,
        "last": 965
    },
    {
        "id": "47",
        "name": "Behaviour with people",
        "arabicName": "Behaviour with people",
        "first": 966,
        "last": 987
    },
    {
        "id": "48",
        "name": "Sitting and lying down",
        "arabicName": "Sitting and lying down",
        "first": 988,
        "last": 1011
    },
    {
        "id": "49",
        "name": "Mornings and evenings",
        "arabicName": "Mornings and evenings",
        "first": 1012,
        "last": 1017
    },
    {
        "id": "50",
        "name": "Sleeping and going to bed",
        "arabicName": "Sleeping and going to bed",
        "first": 1018,
        "last": 1044
    },
    {
        "id": "51",
        "name": "Animals",
        "arabicName": "Animals",
        "first": 1045,
        "last": 1050
    },
    {
        "id": "52",
        "name": "Midday Naps",
        "arabicName": "Midday Naps",
        "first": 1051,
        "last": 1056
    },
    {
        "id": "53",
        "name": "Circumcision",
        "arabicName": "Circumcision",
        "first": 1057,
        "last": 1071
    },
    {
        "id": "54",
        "name": "Betting and similar pastimes",
        "arabicName": "Betting and similar pastimes",
        "first": 1072,
        "last": 1094
    },
    {
        "id": "55",
        "name": "Various",
        "arabicName": "Various",
        "first": 1095,
        "last": 1117
    },
    {
        "id": "56",
        "name": "Aspects of Behaviour",
        "arabicName": "Aspects of Behaviour",
        "first": 1118,
        "last": 1129
    },
    {
        "id": "57",
        "name": "Anger",
        "arabicName": "Anger",
        "first": 1130,
        "last": 1136
    }
],
  "shamail_muhammadiyah": [
    {
      "id": "1",
      "name": "The Noble Features Of Rasoolullah",
      "arabicName": "باب ما جاء في خلق رسول الله صلى الله عليه وسلم",
      "first": 1,
      "last": 15
    },
    {
      "id": "2",
      "name": "Seal Of Nubuwwah (Prophethood) Of Rasoolullah",
      "arabicName": "باب ما جاء في خاتم النبوة",
      "first": 16,
      "last": 23
    },
    {
      "id": "3",
      "name": "The Mubarak Hair Of Rasoolullah",
      "arabicName": "-باب ما جاء في شعر رسول الله صلى الله عليه وسلم",
      "first": 24,
      "last": 31
    },
    {
      "id": "4",
      "name": "The Combing Of The Hair Of Rasoolullah",
      "arabicName": "باب ما جاء في ترجل رسول الله صلى الله عليه وسلم",
      "first": 32,
      "last": 36
    },
    {
      "id": "5",
      "name": "Appearing Of The White Hair Of Rasoolullah",
      "arabicName": "باب ما جاء في شيب رسول الله صلى الله عليه وسلم",
      "first": 37,
      "last": 44
    },
    {
      "id": "6",
      "name": "Rasoolullah Using a Dye",
      "arabicName": "باب ما جاء في خضاب رسول الله صلى الله عليه وسلم",
      "first": 45,
      "last": 49
    },
    {
      "id": "7",
      "name": "Kuhl Of Rasoolullah ",
      "arabicName": "باب ما جاء في كُحل رسول الله صلى الله عليه وسلم",
      "first": 50,
      "last": 54
    },
    {
      "id": "-8",
      "name": "The Standard of Living of Rasoolullah",
      "arabicName": "باب ماجاء في عيش رسول الله صلى الله عليه وسلم",
      "first": 368,
      "last": 369
    },
    {
      "id": "8",
      "name": "The Dressing Of Rasoolullah",
      "arabicName": "باب ما جاء في لباس رسول الله صلى الله عليه وسلم",
      "first": 55,
      "last": 71
    },
    {
      "id": "9",
      "name": "The Khuff (Leather Socks) Of Rasoolullah",
      "arabicName": "باب ما جاء في خف رسول الله صلى الله عليه وسلم",
      "first": 72,
      "last": 73
    },
    {
      "id": "10",
      "name": "The Shoes Of Rasoolullah",
      "arabicName": "باب ماجاء في نعل رسول الله صلى الله عليه وسلم",
      "first": 74,
      "last": 85
    },
    {
      "id": "11",
      "name": "The Mubarak Ring Of Rasoolullah",
      "arabicName": "باب ما جاء في ذكر خاتم رسول الله صلى الله عليه وسلم",
      "first": 86,
      "last": 93
    },
    {
      "id": "12",
      "name": "Stating That Rasoolullah Wore The Ring On His Right Hand",
      "arabicName": "باب ماجاء في تختم رسول الله صلى الله عليه وسلم",
      "first": 94,
      "last": 103
    },
    {
      "id": "13",
      "name": "The Sword Of Rasoolullah",
      "arabicName": "باب ماجاء في صفة سَيْفِ رَسُولِ اللهِ صلى الله عليه وسلم",
      "first": 104,
      "last": 107
    },
    {
      "id": "14",
      "name": "The Armor Of Rasoolullah",
      "arabicName": "باب ماجاء في صفة درع رَسُولِ اللهِصلى الله عليه وسلم",
      "first": 109,
      "last": 110
    },
    {
      "id": "15",
      "name": "The Helmet Of Rasoolullah",
      "arabicName": "باب ما جاء في صفة مغفر رسول الله صلى الله عليه وسلم",
      "first": 111,
      "last": 112
    },
    {
      "id": "16",
      "name": "The Turban Of Rasoolullah",
      "arabicName": "باب ما جاء في عمامة رسول الله صلى الله عليه وسلم",
      "first": 113,
      "last": 117
    },
    {
      "id": "17",
      "name": "The Lungi Of Rasoolullah",
      "arabicName": "باب ما جاء في صفة إزار رسول الله صلى الله عليه وسلم",
      "first": 118,
      "last": 121
    },
    {
      "id": "18",
      "name": "The Walking Of Rasoolullah",
      "arabicName": "باب ما جاء في مشية رسول الله صلى الله عليه وسلم",
      "first": 122,
      "last": 124
    },
    {
      "id": "19",
      "name": "The Qinaa Of Rasoolullah",
      "arabicName": "باب ما جاء في تقنع رسول الله صلى الله عليه وسلم",
      "first": 125,
      "last": 125
    },
    {
      "id": "20",
      "name": "The Sitting Of Rasoolullah",
      "arabicName": "باب ما جاء في جلسته صلى الله عليه وسلم",
      "first": 126,
      "last": 128
    },
    {
      "id": "21",
      "name": "The Pillow Of Rasoolullah",
      "arabicName": "باب ما جاء في تكأة رسول الله صلى الله عليه وسلم",
      "first": 129,
      "last": 133
    },
    {
      "id": "22",
      "name": "Rasoolullah Leaning On Something Other Than a Pillow",
      "arabicName": "باب ما جاء في اتكاء رسول الله صلى الله عليه وسلم",
      "first": 134,
      "last": 135
    },
    {
      "id": "23",
      "name": "Description Of The Eating Of Rasoolullah",
      "arabicName": "باب ما جاء في أكل رسول الله صلى الله عليه وسلم",
      "first": 136,
      "last": 141
    },
    {
      "id": "24",
      "name": "The Bread Of Rasoolullah",
      "arabicName": "باب ما جاء في صفة خبز رسول الله صلى الله عليه وسلم",
      "first": 142,
      "last": 149
    },
    {
      "id": "25",
      "name": "What Rasoolullah Would Eat with Bread",
      "arabicName": "ما جاء في إدام رسول الله صلى الله عليه وسلم",
      "first": 150,
      "last": 183
    },
    {
      "id": "26",
      "name": "Rasoolullah Performing Wudu At The Time Of Eating",
      "arabicName": "باب ما جاء في صفة وضوء رسول الله صلى الله عليه وسلم عند الطعام",
      "first": 184,
      "last": 186
    },
    {
      "id": "27",
      "name": "The Words That Of Rasoolullah Said Before and After Eating",
      "arabicName": "باب ما جاء في قول رسول الله صلى الله عليه وسلم قبل الطعام وعند الفراغ منه",
      "first": 187,
      "last": 193
    },
    {
      "id": "28",
      "name": "The Cup Of Rasoolullah",
      "arabicName": "باب ما جاء في قدح رسول الله صلى الله عليه وسلم",
      "first": 194,
      "last": 195
    },
    {
      "id": "29",
      "name": "The Fruits Eaten By Rasoolullah",
      "arabicName": "باب ما جاء في صفة فاكهة رسول الله صلى الله عليه وسلم",
      "first": 196,
      "last": 202
    },
    {
      "id": "30",
      "name": "Description Of The Things Rasoolullah Drank",
      "arabicName": "باب ما جاء في صفة شراب رسول الله صلى الله عليه وسلم",
      "first": 203,
      "last": 204
    },
    {
      "id": "31",
      "name": "Hadith Describing The Manner Rasoolullah Drank",
      "arabicName": "باب ما جاء في شرب رسول الله صلى الله عليه وسلم",
      "first": 205,
      "last": 214
    },
    {
      "id": "32",
      "name": "Rasoolullah Using 'Itr",
      "arabicName": "باب ما جاء في تعطررسول الله صلى الله عليه وسلم",
      "first": 215,
      "last": 221
    },
    {
      "id": "33",
      "name": "The Speech Of rasoolullah",
      "arabicName": "باب كيف كان كلام رسول الله صلى الله عليه وسلم",
      "first": 222,
      "last": 224
    },
    {
      "id": "34",
      "name": "The Laughing Of Rasoolullah",
      "arabicName": "باب ما جاء في ضحك رسول الله صلى الله عليه وسلم",
      "first": 225,
      "last": 233
    },
    {
      "id": "35",
      "name": "Description Of The Joking Of Rasoolullah",
      "arabicName": "باب ما جاء في صفة مزاح رسول الله صلى الله عليه وسلم",
      "first": 234,
      "last": 239
    },
    {
      "id": "36",
      "name": "Description Of The Saying Of Rasoolullah On Poetry",
      "arabicName": "باب ما جاء في صفة كلام رسول الله صلى الله عليه وسلم في الشعر",
      "first": 240,
      "last": 249
    },
    {
      "id": "37",
      "name": "Story Telling Of Rasoolullah At Night",
      "arabicName": "باب ما جاء في كلام رسول الله صلى الله عليه وسلم في السمر",
      "first": 251,
      "last": 251
    },
    {
      "id": "38",
      "name": "Hadith of Umm Zar`",
      "arabicName": "حديث أم زرع",
      "first": 252,
      "last": 252
    },
    {
      "id": "39",
      "name": "The Sleeping Of Rasoolullah",
      "arabicName": "باب في صفة نوم رسول الله صلى الله عليه وسلم في السمر",
      "first": 253,
      "last": 259
    },
    {
      "id": "40",
      "name": "Worship And Devotion Of Rasoolullah",
      "arabicName": "باب ما جاء في عبادة النبي صلى الله عليه وسلم",
      "first": 260,
      "last": 286
    },
    {
      "id": "41",
      "name": "Salaatut Duha (Chaast Prayers)",
      "arabicName": "باب صلاة الضحى",
      "first": 287,
      "last": 295
    },
    {
      "id": "42",
      "name": "Sayyidina Rasoolullah Performing Nawaafil At Home",
      "arabicName": "باب صلاة التطوع في البيت",
      "first": 296,
      "last": 296
    },
    {
      "id": "43",
      "name": "The Fasting Of Sayyidina Rasoolullah",
      "arabicName": "باب ماجاء في صوم رسول الله صلى الله عليه وسلم",
      "first": 297,
      "last": 312
    },
    {
      "id": "44",
      "name": "The Recital Of Sayyidina Rasoolullah",
      "arabicName": "باب ماجاء في قراءة رسول الله صلى الله عليه وسلم",
      "first": 313,
      "last": 320
    },
    {
      "id": "45",
      "name": "The Weeping Of Sayyidina Rasoolullah",
      "arabicName": "باب ماجاء في بكاء رسول الله صلى الله عليه وسلم",
      "first": 321,
      "last": 326
    },
    {
      "id": "46",
      "name": "Narrations Of The Bed Of Sayyidina Rasoolullah",
      "arabicName": "باب ماجاء في فراش رسول الله صلى الله عليه وسلم",
      "first": 327,
      "last": 328
    },
    {
      "id": "47",
      "name": "The Humbleness Of Sayyidina Rasoolullah",
      "arabicName": "باب ماجاء في تواضع رسول الله صلى الله عليه وسلم",
      "first": 329,
      "last": 341
    },
    {
      "id": "48",
      "name": "Noble Character And Habits Of Sayyidina Rasoolullah",
      "arabicName": "باب ماجاء في خلق رسول الله صلى الله عليه وسلم",
      "first": 342,
      "last": 356
    },
    {
      "id": "49",
      "name": "Modesty Of Sayyidina Rasoolullah",
      "arabicName": "باب ماجاء في حياء رسول الله صلى الله عليه وسلم",
      "first": 357,
      "last": 358
    }
  ],
  "riyad_assalihin": [
    {
      "id": "1",
      "name": "The Book of Good Manners",
      "arabicName": "كتاب الأدب",
      "first": 680,
      "last": 726
    },
    {
      "id": "introduction",
      "name": "The Book of Miscellany",
      "arabicName": "كتاب المقدمات",
      "first": 1,
      "last": 679
    },
    {
      "id": "2",
      "name": "The Book About the Etiquette of Eating",
      "arabicName": "كتـــــاب أدب الطعام",
      "first": 727,
      "last": 777
    },
    {
      "id": "3",
      "name": "The Book of Dress",
      "arabicName": "كتــــاب اللباس",
      "first": 778,
      "last": 812
    },
    {
      "id": "4",
      "name": "The Book of the Etiquette of Sleeping, Lying and Sitting etc",
      "arabicName": "كتاب آداب النوم",
      "first": 813,
      "last": 843
    },
    {
      "id": "5",
      "name": "The Book of Greetings",
      "arabicName": "كتاب السلام",
      "first": 844,
      "last": 893
    },
    {
      "id": "6",
      "name": "The Book of Visiting the Sick",
      "arabicName": "كتاب عيادة المريض وتشييع الميت والصلاة عليه وحضور دفنه المكث عند قبره بعد دفنه",
      "first": 894,
      "last": 955
    },
    {
      "id": "7",
      "name": "The Book of Etiquette of Traveling",
      "arabicName": "كتاب آداب السفر",
      "first": 956,
      "last": 990
    },
    {
      "id": "8",
      "name": "The Book of Virtues",
      "arabicName": "كتاب الفضائل",
      "first": 991,
      "last": 1267
    },
    {
      "id": "9",
      "name": "The Book of I'tikaf",
      "arabicName": "كتاب الاعتكاف",
      "first": 1268,
      "last": 1270
    },
    {
      "id": "10",
      "name": "The Book of Hajj",
      "arabicName": "كتاب الحج",
      "first": 1271,
      "last": 1284
    },
    {
      "id": "11",
      "name": "The Book of Jihad",
      "arabicName": "كتاب الجهاد",
      "first": 1285,
      "last": 1375
    },
    {
      "id": "12",
      "name": "The Book of Knowledge",
      "arabicName": "كتاب العلم",
      "first": 1376,
      "last": 1392
    },
    {
      "id": "13",
      "name": "The Book of Praise and Gratitude to Allah",
      "arabicName": "كتاب حمد الله تعالى وشكره",
      "first": 1393,
      "last": 1396
    },
    {
      "id": "14",
      "name": "The Book of Supplicating Allah to Exalt the Mention of Allah's Messenger",
      "arabicName": "كتاب الصلاة على رسول الله صلى الله عليه وسلم",
      "first": 1397,
      "last": 1407
    },
    {
      "id": "15",
      "name": "The Book of the Remembrance of Allah",
      "arabicName": "كتاب الأذكار",
      "first": 1408,
      "last": 1464
    },
    {
      "id": "16",
      "name": "The Book of Du'a (Supplications)",
      "arabicName": "كتاب الدعوات",
      "first": 1465,
      "last": 1510
    },
    {
      "id": "17",
      "name": "The Book of the Prohibited actions",
      "arabicName": "كتاب الأمور المنهي عنها",
      "first": 1511,
      "last": 1807
    },
    {
      "id": "18",
      "name": "The Book of Miscellaneous ahadith of Significant Values",
      "arabicName": "كتاب المنثورات والملح",
      "first": 1808,
      "last": 1868
    },
    {
      "id": "19",
      "name": "The Book of Forgiveness",
      "arabicName": "كتاب الاستغفار ",
      "first": 1869,
      "last": 1896
    }
  ],
  "bulugh_almaram": [
    {
        "id": "1",
        "name": "The Book of Purification",
        "arabicName": "كتاب الطهارة",
        "first": 1,
        "last": 180
    },
    {
        "id": "3",
        "name": "Funerals",
        "arabicName": "كِتَابُ الْجَنَائِزِ",
        "first": 181,
        "last": 246
    },
    {
        "id": "4",
        "name": "The Book of Zakah",
        "arabicName": "كِتَابُ الزَّكَاةِ",
        "first": 247,
        "last": 297
    },
    {
        "id": "5",
        "name": "Fasting",
        "arabicName": "كِتَابُ الصيام",
        "first": 298,
        "last": 355
    },
    {
        "id": "6",
        "name": "Hajj",
        "arabicName": "كِتَابُ الحَجِّ",
        "first": 356,
        "last": 429
    },
    {
        "id": "9",
        "name": "Crimes (Qisas or Retaliation)",
        "arabicName": "كِتَابُ الجنايات",
        "first": 430,
        "last": 476
    },
    {
        "id": "10",
        "name": "Hudud",
        "arabicName": "كِتَابُ الحُدُودِ",
        "first": 477,
        "last": 534
    },
    {
        "id": "11",
        "name": "Jihad",
        "arabicName": "كِتَابُ الْجِهَادِ",
        "first": 535,
        "last": 597
    },
    {
        "id": "12",
        "name": "Food",
        "arabicName": "كِتَابُ الْأَطْعِمَةِ",
        "first": 598,
        "last": 642
    },
    {
        "id": "13",
        "name": "Oaths and Vows",
        "arabicName": "كِتَاب الْأَيْمَانِ وَالنُّذُورِ",
        "first": 643,
        "last": 665
    },
    {
        "id": "14",
        "name": "Judgments",
        "arabicName": "كِتَابُ القضاء",
        "first": 666,
        "last": 701
    },
    {
        "id": "15",
        "name": "Emancipation",
        "arabicName": "كِتَابُ الْعِتْقِ",
        "first": 702,
        "last": 721
    }
],
  "mishkat_almasabih": [
  {
    "id": "1",
    "name": "Faith",
    "arabicName": "كتاب الإيمان",
    "first": 2,
    "last": 197
  },
  {
    "id": "intro",
    "name": "Author's Introduction",
    "arabicName": "مقدمة المؤلف",
    "first": 1,
    "last": 1
  },
  {
    "id": "2",
    "name": "Knowledge",
    "arabicName": "كتاب العلم",
    "first": 198,
    "last": 280
  },
  {
    "id": "3",
    "name": "Purification",
    "arabicName": "كتاب الطهارة",
    "first": 281,
    "last": 562
  },
  {
    "id": "4",
    "name": "Prayer",
    "arabicName": "كتاب الصلاة",
    "first": 564,
    "last": 1522
  },
  {
    "id": "5",
    "name": "Funerals",
    "arabicName": "كتاب الجنائز",
    "first": 1523,
    "last": 1771
  },
  {
    "id": "6",
    "name": "Zakat",
    "arabicName": "كتاب الزكاة",
    "first": 1772,
    "last": 1955
  },
  {
    "id": "7",
    "name": "Fasting",
    "arabicName": "كتاب الصوم",
    "first": 1956,
    "last": 2108
  },
  {
    "id": "8",
    "name": "The Excellent Qualities of the Qur'an",
    "arabicName": "كتاب فضائل القرآن",
    "first": 2109,
    "last": 2222
  },
  {
    "id": "9",
    "name": "Supplications",
    "arabicName": "كتاب الدعوات",
    "first": 2223,
    "last": 2504
  },
  {
    "id": "10",
    "name": "The Rites of Pilgrimage",
    "arabicName": "كتاب المناسك",
    "first": 2505,
    "last": 2758
  },
  {
    "id": "11",
    "name": "Business Transactions",
    "arabicName": "كتاب البيوع",
    "first": 2759,
    "last": 3040
  },
  {
    "id": "12",
    "name": "Inheritance and Wills",
    "arabicName": "كتاب الفرائض والوصايا",
    "first": 3041,
    "last": 3079
  },
  {
    "id": "13",
    "name": "Marriage",
    "arabicName": "كتاب النكاح",
    "first": 3080,
    "last": 3381
  },
  {
    "id": "14",
    "name": "Emancipation",
    "arabicName": "كتاب العتق",
    "first": 3382,
    "last": 3405
  },
  {
    "id": "15",
    "name": "Oaths and Vows",
    "arabicName": "كتاب الأيمان والنذور",
    "first": 3406,
    "last": 3445
  },
  {
    "id": "16",
    "name": "Retaliation",
    "arabicName": "كتاب القصاص",
    "first": 3446,
    "last": 3554
  },
  {
    "id": "17",
    "name": "Prescribed Punishments",
    "arabicName": "كتاب الحدود",
    "first": 3555,
    "last": 3660
  },
  {
    "id": "18",
    "name": "The Offices of Commander and Qadi",
    "arabicName": "كتاب الإمارة والقضاء",
    "first": 3661,
    "last": 3786
  },
  {
    "id": "19",
    "name": "Jihad",
    "arabicName": "كتاب الجهاد",
    "first": 3787,
    "last": 4063
  },
  {
    "id": "20",
    "name": "Game and Animals Which May Be Slaughtered",
    "arabicName": "كتاب الصيد والذبائح",
    "first": 4064,
    "last": 4158
  },
  {
    "id": "21",
    "name": "Foods",
    "arabicName": "كتاب الأطعمة",
    "first": 4159,
    "last": 4303
  },
  {
    "id": "22",
    "name": "Clothing",
    "arabicName": "كتاب اللباس",
    "first": 4304,
    "last": 4513
  },
  {
    "id": "23",
    "name": "Medicine and Spells",
    "arabicName": "كتاب الطب والرقى",
    "first": 4514,
    "last": 4605
  },
  {
    "id": "24",
    "name": "Visions",
    "arabicName": "كتاب الرؤيا",
    "first": 4606,
    "last": 4627
  },
  {
    "id": "25",
    "name": "General Manners",
    "arabicName": "كتاب الأدب",
    "first": 4628,
    "last": 5378
  },
  {
    "id": "27",
    "name": "Fitan",
    "arabicName": "كتاب الفتن",
    "first": 5379,
    "last": 5520
  },
  {
    "id": "28",
    "name": "Events of the Day of Resurrection and the Beginning of Creation",
    "arabicName": "كتاب أحوال القيامة وبدء الخلق",
    "first": 5521,
    "last": 5738
  },
  {
    "id": "29",
    "name": "Excellent Qualities and Description of the Prophet",
    "arabicName": "كتاب الفضائل والشمايل",
    "first": 5739,
    "last": 6295
  }
],
  "qudsi40": [
    {
      "id": "1",
      "name": "Forty Hadith of an-Nawawi",
      "arabicName": "الأربعون النووية",
      "first": 1,
      "last": 42
    },
    {
      "id": "2",
      "name": "Forty Hadith Qudsi",
      "arabicName": "الحديث القدسي",
      "first": 1,
      "last": 40
    },
    {
      "id": "3",
      "name": "Forty Hadith of Shah Waliullah Dehlawi",
      "arabicName": "أربعون شاه ولي الله الدهلوي",
      "first": 1,
      "last": 40
    }
  ],
  "hisn": [
    {
      "id": "introduction",
      "name": "Introduction",
      "arabicName": "المقدمة",
      "first": 0,
      "last": 0
    },
    {
      "id": "1",
      "name": "Fortress of the Muslim (Hisn al-Muslim)",
      "arabicName": "حصن المسلم",
      "first": 1,
      "last": 267
    }
  ]
};
