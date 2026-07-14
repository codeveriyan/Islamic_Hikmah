export interface DhikrItem {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  audioUrl: string;
  hadith: string;
  source: string;
  category: 'short' | 'medium' | 'long';
  recommended_count: number;
}

export const DHIKR_DATA: DhikrItem[] = [
  {
    id: 'bismillah',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    meaning: 'In the name of Allah',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/1.%20bismillah.mp3',
    hadith: 'Every major endeavor that is not begun with the name of Allah remains cut off from blessings.',
    source: 'Sunan Abi Dawud',
    category: 'short',
    recommended_count: 1
  },
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'Subhanallah',
    meaning: 'Glory be to Allah',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/2.%20subhanallah.mp3',
    hadith: 'Whoever says Subhanallah 100 times, a thousand good deeds will be recorded for him or a thousand sins will be wiped out.',
    source: 'Sahih Muslim 2698',
    category: 'short',
    recommended_count: 33
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All praise is due to Allah',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/3.%20alhamdulilah.mp3',
    hadith: 'And Alhamdulillah (all praise and gratitude belong to Allah) fills the scale of good deeds.',
    source: 'Sahih Muslim 223',
    category: 'short',
    recommended_count: 33
  },
  {
    id: 'allahuakbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is Greatest',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/4.%20allahu%20akbar.mp3',
    hadith: 'Reciting Allahu Akbar 33 times after prayer is a means of gaining great rewards and forgiveness of sins.',
    source: 'Sahih Bukhari',
    category: 'short',
    recommended_count: 34
  },
  {
    id: 'lailaha',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illallah',
    meaning: 'There is no god but Allah',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/5.%20La%20ilaha%20illallah.mp3',
    hadith: 'The best remembrance (Dhikr) is La ilaha illallah.',
    source: 'Sunan at-Tirmidhi 3383',
    category: 'short',
    recommended_count: 100
  },
  {
    id: 'subhanallahi_bihamdih',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhan-Allahi wa bihamdih',
    meaning: 'Glory be to Allah and His is the praise',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/6.%20Subhan-Allahi%20wa%20bihamdih.mp3',
    hadith: 'Whoever says Subhan-Allahi wa bihamdih 100 times a day, his sins will be forgiven even if they were as vast as the foam of the sea.',
    source: 'Sahih Bukhari 6405',
    category: 'short',
    recommended_count: 100
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliteration: 'Astaghfirullah',
    meaning: 'I seek forgiveness from Allah',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/7.%20Astaghfirullah.mp3',
    hadith: 'Whoever says Astaghfirullah, Allah will make for him a way out of every distress and a relief from every anxiety.',
    source: 'Sunan Abi Dawud',
    category: 'short',
    recommended_count: 100
  },
  {
    id: 'subhanallah_bihamdihi_azim',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'Subhan-Allahi wa bihamdihi, Subhan-Allahil-Azim',
    meaning: 'Glory be to Allah and His is the praise, Glory be to Allah the Almighty',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/8.%20Subhan-Allahi%20wa%20bihamdihi%2C%20Subhan-Allahil-Azim.mp3',
    hadith: 'Two phrases are light on the tongue, heavy on the scale, and beloved to the Most Merciful: Subhan-Allahi wa bihamdihi, Subhan-Allahil-Azim.',
    source: 'Sahih Bukhari 6682',
    category: 'medium',
    recommended_count: 100
  },
  {
    id: 'ya_hayyu_ya_qayyum',
    arabic: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ',
    transliteration: 'Ya hayyu ya qayyum bi-rahmatika astagheeth',
    meaning: 'O Ever-Living, O Self-Sustaining Sustainer, in Your mercy I seek relief',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/9.%20Ya%20hayyu%20ya%20qayyum%20bi-rahmatika%20astagheeth.mp3',
    hadith: 'Whenever the Prophet (ﷺ) was distressed, he would supplicate: Ya hayyu ya qayyum bi-rahmatika astagheeth.',
    source: 'Sunan at-Tirmidhi 3524',
    category: 'medium',
    recommended_count: 33
  },
  {
    id: 'four_phrases',
    arabic: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
    transliteration: 'Subhan-Allah, wal-hamdu-lillah, wa la ilaha illallah, wa Allahu Akbar',
    meaning: 'Glory be to Allah, all praise is due to Allah, there is no god but Allah, and Allah is the Greatest',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/10.%20Subhan-Allah%20wal-hamdu-lillah%20wa%20la%20ilaha%20illallah%20wa%20Allahu%20Akbar.mp3',
    hadith: 'The Prophet (ﷺ) said: That I say Subhan-Allah, wal-hamdu-lillah, wa la ilaha illallah, wa Allahu Akbar is more beloved to me than anything over which the sun rises.',
    source: 'Sahih Muslim 2695',
    category: 'medium',
    recommended_count: 33
  },
  {
    id: 'lahawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    meaning: 'There is no power or might except with Allah',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/11.%20La%20hawla%20wa%20la%20quwwata%20illa%20billah.mp3',
    hadith: 'Say La hawla wa la quwwata illa billah, for it is one of the treasures of Paradise.',
    source: 'Sahih Bukhari 6384',
    category: 'medium',
    recommended_count: 100
  },
  {
    id: 'subhanallah_bihamdihi_astaghfirullah',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Subhan-Allahi wa bihamdihi, Astaghfirullah wa atubu ilaih',
    meaning: "Glory be to Allah and His is the praise, I seek Allah's forgiveness and repent to Him",
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/12.%20Subhan-Allahi%20wa%20bihamdihi%2C%20Astaghfirullah%20wa%20atubu%20ilaih.mp3',
    hadith: 'Aisha reported that before his death, the Messenger of Allah (ﷺ) used to frequently say: Subhan-Allahi wa bihamdihi, Astaghfirullah wa atubu ilaih.',
    source: 'Sahih Muslim 484',
    category: 'medium',
    recommended_count: 100
  },
  {
    id: 'rabbighfirli',
    arabic: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الْغَفُورُ',
    transliteration: 'Rabbighfirli watub alayya innaka antat-Tawwabul-Ghafur',
    meaning: 'My Lord, forgive me and accept my repentance, surely You are the Accepter of Repentance, the Forgiving',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/13.%20Rabbighfirli%20watub%20alayya%20innaka%20antat-Tawwabul-Ghafur.mp3',
    hadith: 'We used to count the Messenger of Allah (ﷺ) saying 100 times in a single sitting: Rabbighfirli watub alayya innaka antat-Tawwabul-Ghafur.',
    source: 'Sunan Abi Dawud 1516',
    category: 'medium',
    recommended_count: 100
  },
  {
    id: 'supplication_five',
    arabic: 'اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَاجْبُرْنِي وَاهْدِنِي وَارْزُقْنِي',
    transliteration: 'Allahumm-aghfir li, warhamni, wajburni, wahdini, warzuqni',
    meaning: 'O Allah, forgive me, have mercy on me, mend my situation, guide me, and grant me sustenance',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/14.%20Allahumm-aghfir%20li%20warhamni%20wajburni%20wahdini%20warzuqni.mp3',
    hadith: 'When a person embraced Islam, the Prophet (ﷺ) would teach him these words to supplicate with.',
    source: 'Sahih Muslim',
    category: 'long',
    recommended_count: 33
  },
  {
    id: 'lailaha_wahdahu',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illallah wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu, wa huwa ala kulli shai-in qadeer',
    meaning: 'There is no god but Allah alone, without partner. His is the sovereignty and His is the praise, and He has power over all things',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/15.%20La%20ilaha%20illallah%20wahdahu%20la%20sharika%20lahu.mp3',
    hadith: 'Whoever recites this 100 times in a day will have a reward equal to freeing ten slaves, 100 good deeds will be recorded, 100 sins wiped out, and it will be a shield for him from Shaytan.',
    source: 'Sahih Bukhari 3293',
    category: 'long',
    recommended_count: 100
  },
  {
    id: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: 'Allahumma Salli ala Muhammadin wa ala aali Muhammadin',
    meaning: 'O Allah, send blessings upon Muhammad and upon the family of Muhammad',
    audioUrl: 'https://quranaudio.myislam.org/audio/tasbih%20counter/16.%20Allahumma%20Salli%20ala%20Muhammadin%20wa%20ala%20aali%20Muhammadin.mp3',
    hadith: 'Whoever sends blessings upon me once, Allah will send blessings upon him tenfold.',
    source: 'Sahih Muslim 384',
    category: 'long',
    recommended_count: 100
  }
];
