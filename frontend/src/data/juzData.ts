// Standard 30 Juz (Para) division of the Quran.
// Each entry: the Juz number, its Arabic name, and the surah+ayah it starts at.
// Source: standard Uthmani Mushaf division used in Medina printing.

export type JuzEntry = {
  juz: number;
  name: string;          // Arabic name e.g. "الم"
  nameEn: string;        // Opening words in English transliteration
  surahNumber: number;   // Surah where this juz starts
  ayahNumber: number;    // Ayah within that surah where this juz starts
};

export const JUZ_DATA: JuzEntry[] = [
  { juz: 1,  name: "الم",           nameEn: "Alif Lam Meem",        surahNumber: 1,  ayahNumber: 1  },
  { juz: 2,  name: "سَيَقُولُ",      nameEn: "Sayaqool",             surahNumber: 2,  ayahNumber: 142 },
  { juz: 3,  name: "تِلْكَ الرُّسُلُ", nameEn: "Tilka ar-Rusul",     surahNumber: 2,  ayahNumber: 253 },
  { juz: 4,  name: "لَنْ تَنَالُوا", nameEn: "Lan Tanaloo",          surahNumber: 3,  ayahNumber: 92  },
  { juz: 5,  name: "وَالْمُحْصَنَاتُ", nameEn: "Wal Mohsanat",       surahNumber: 4,  ayahNumber: 24  },
  { juz: 6,  name: "لَا يُحِبُّ اللّهُ", nameEn: "La Yuhibbullah",   surahNumber: 4,  ayahNumber: 148 },
  { juz: 7,  name: "وَإِذَا سَمِعُوا", nameEn: "Wa Iza Sami'oo",    surahNumber: 5,  ayahNumber: 82  },
  { juz: 8,  name: "وَلَوْ أَنَّنَا", nameEn: "Wa Lau Annana",       surahNumber: 6,  ayahNumber: 111 },
  { juz: 9,  name: "قَالَ الْمَلَأُ", nameEn: "Qalal Mala'u",        surahNumber: 7,  ayahNumber: 88  },
  { juz: 10, name: "وَاعْلَمُوا",    nameEn: "Wa A'lamu",            surahNumber: 8,  ayahNumber: 41  },
  { juz: 11, name: "يَعْتَذِرُونَ",  nameEn: "Ya'tazeroon",          surahNumber: 9,  ayahNumber: 93  },
  { juz: 12, name: "وَمَا مِنْ دَابَّةٍ", nameEn: "Wa Ma Min Dabbah", surahNumber: 11, ayahNumber: 6  },
  { juz: 13, name: "وَمَا أُبَرِّئُ", nameEn: "Wa Ma Ubarri'u",      surahNumber: 12, ayahNumber: 53  },
  { juz: 14, name: "رُبَمَا",        nameEn: "Rubama",               surahNumber: 15, ayahNumber: 1   },
  { juz: 15, name: "سُبْحَانَ الَّذِي", nameEn: "Subhanallazi",      surahNumber: 17, ayahNumber: 1   },
  { juz: 16, name: "قَالَ أَلَمْ",   nameEn: "Qal Alam",            surahNumber: 18, ayahNumber: 75  },
  { juz: 17, name: "اقْتَرَبَ",      nameEn: "Iqtaraba",            surahNumber: 21, ayahNumber: 1   },
  { juz: 18, name: "قَدْ أَفْلَحَ",  nameEn: "Qad Aflaha",          surahNumber: 23, ayahNumber: 1   },
  { juz: 19, name: "وَقَالَ الَّذِينَ", nameEn: "Wa Qalallazina",    surahNumber: 25, ayahNumber: 21  },
  { juz: 20, name: "أَمَّنْ خَلَقَ", nameEn: "Amman Khalaq",        surahNumber: 27, ayahNumber: 60  },
  { juz: 21, name: "اتْلُ مَا أُوحِيَ", nameEn: "Utlu Ma Oohiya",   surahNumber: 29, ayahNumber: 46  },
  { juz: 22, name: "وَمَنْ يَقْنُتْ", nameEn: "Wa Manyaqnut",       surahNumber: 33, ayahNumber: 31  },
  { juz: 23, name: "وَمَا لِيَ",     nameEn: "Wa Mali",             surahNumber: 36, ayahNumber: 28  },
  { juz: 24, name: "فَمَنْ أَظْلَمُ", nameEn: "Faman Azlamu",       surahNumber: 39, ayahNumber: 32  },
  { juz: 25, name: "إِلَيْهِ يُرَدُّ", nameEn: "Ilayhi Yuraddu",    surahNumber: 41, ayahNumber: 47  },
  { juz: 26, name: "حم",             nameEn: "Ha Meem",             surahNumber: 46, ayahNumber: 1   },
  { juz: 27, name: "قَالَ فَمَا خَطْبُكُمْ", nameEn: "Qala Fama Khatbukum", surahNumber: 51, ayahNumber: 31 },
  { juz: 28, name: "قَدْ سَمِعَ اللَّهُ", nameEn: "Qad Sami'allah", surahNumber: 58, ayahNumber: 1   },
  { juz: 29, name: "تَبَارَكَ الَّذِي", nameEn: "Tabarakallazi",    surahNumber: 67, ayahNumber: 1   },
  { juz: 30, name: "عَمَّ",          nameEn: "Amma",                surahNumber: 78, ayahNumber: 1   },
];

// Given a surah number and ayah number, return which Juz it falls in
export function getJuzForAyah(surahNumber: number, ayahNumber: number): number {
  let juz = 1;
  for (let i = 0; i < JUZ_DATA.length; i++) {
    const entry = JUZ_DATA[i];
    if (
      entry.surahNumber < surahNumber ||
      (entry.surahNumber === surahNumber && entry.ayahNumber <= ayahNumber)
    ) {
      juz = entry.juz;
    } else {
      break;
    }
  }
  return juz;
}
