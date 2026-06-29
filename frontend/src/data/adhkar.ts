// ============================================================
// ADHKAR DATA — From Daily Adhkar PDF (Life With Allah)
// Organized by category for Islamic Hikmah app
// ============================================================

export type AdhkarItem = {
  id: string;
  arabic: string;
  transliteration?: string;
  translation: string;
  reference?: string;
  repeat?: number;
  note?: string;
};

export type AdhkarCategory = {
  id: string;
  title: string;
  arabicTitle: string;
  icon: string;
  color: string;
  items: AdhkarItem[];
};

// ============================================================
// 1. MORNING & EVENING ADHKAR (Read Both Times)
// ============================================================
export const MORNING_EVENING_ADHKAR: AdhkarItem[] = [
  {
    id: 'me-1',
    arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    transliteration: 'Allahu la ilaha illa huwal-Hayyul-Qayyum... (Ayat al-Kursi)',
    translation: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of all existence... (Ayat al-Kursi 2:255)',
    reference: 'Hakim',
    repeat: 1,
  },
  {
    id: 'me-2',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ... قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... قُلْ أَعُوذُ بِرَبِّ النَّاسِ...',
    transliteration: 'Qul Huwallahu Ahad... Qul Audhu bi Rabbil Falaq... Qul Audhu bi Rabbin-Nas...',
    translation: 'Surah Ikhlas, Surah Falaq, Surah Nas',
    reference: 'Tirmidhi',
    repeat: 3,
  },
  {
    id: 'me-3',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي، فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: "Allahumma anta Rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu, a'udhu bika min sharri ma sana'tu, abu'u laka bini'matika 'alayya wa abu'u bidhanbi, faghfirli fa innahu la yaghfirudh-dhunuba illa anta",
    translation: 'O Allah, You are my Lord. There is no god but You. You created me and I am Your slave. I am faithful to my covenant and my promise to You as much as I can. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I acknowledge my sin, so forgive me, for none forgives sins but You.',
    reference: 'Bukhari',
    note: 'Sayyid al-Istighfar — whoever says this with certainty in the morning and dies before evening is from the people of Paradise.',
    repeat: 1,
  },
  {
    id: 'me-4',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ، وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
    transliteration: "Allahumma inni a'udhu bika minal-hammi wal-huzni, wa a'udhu bika minal-'ajzi wal-kasali, wa a'udhu bika minal-jubni wal-bukhli, wa a'udhu bika min ghalabatid-dayni wa qahrir-rijal",
    translation: 'O Allah, I seek refuge in You from grief and sadness, from weakness and laziness, from miserliness and cowardice, from being overcome by debt and from being overpowered by men.',
    reference: 'Abu Dawud',
    repeat: 1,
  },
  {
    id: 'me-5',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي',
    transliteration: "Allahumma inni as'alukal-'afiyata fid-dunya wal-akhirah, Allahumma inni as'alukal-'afwa wal-'afiyata fi dini wa dunyaya wa ahli wa mali, Allahummastir 'awrati wa amin raw'ati, Allahumma-hfadhni min bayni yadayya wa min khalfi wa 'an yamini wa 'an shimali wa min fawqi, wa a'udhu bi'adhamatika an ughtala min tahti",
    translation: 'O Allah, I ask You for well-being in this world and the Hereafter. O Allah, I ask You for forgiveness and well-being in my religion, my worldly affairs, my family and my property. O Allah, cover my faults and calm my fears. O Allah, guard me from in front and behind, from my right and left, and from above me. I seek refuge in Your greatness from being struck down from beneath me.',
    reference: 'Abu Dawud',
    repeat: 1,
  },
  {
    id: 'me-6',
    arabic: 'اللَّهُمَّ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ، عَالِمَ الْغَيْبِ وَالشَّهَادَةِ، رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ',
    transliteration: "Allahumma Fatiras-samawati wal-ardi, 'Alimal-ghaybi wash-shahadati, Rabba kulli shay'in wa malikahu, ashhadu an la ilaha illa anta, a'udhu bika min sharri nafsi wa min sharrishhaytani wa shirkih",
    translation: 'O Allah, Originator of the heavens and the earth, Knower of the unseen and the seen, Lord of everything and its Owner, I bear witness that there is no god but You. I seek refuge in You from the evil of my own self and from the evil of Shaytan and his trap.',
    reference: 'Tirmidhi',
    repeat: 1,
  },
  {
    id: 'me-7',
    arabic: 'يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
    transliteration: "Ya Hayyu Ya Qayyum, bi rahmatika astaghithu, aslih li sha'ni kullahu, wa la takilni ila nafsi tarfata 'ayn",
    translation: 'O Ever-Living, O Sustainer of all existence, by Your mercy I seek assistance. Rectify all of my affairs and do not leave me to myself even for the blink of an eye.',
    reference: "Nasa'i",
    repeat: 1,
  },
  {
    id: 'me-15',
    arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ',
    transliteration: "Allahumma 'afini fi badani, Allahumma 'afini fi sam'i, Allahumma 'afini fi basari, la ilaha illa anta, Allahumma inni a'udhu bika minal-kufri wal-faqri, wa a'udhu bika min 'adhabił-qabri, la ilaha illa anta",
    translation: 'O Allah, grant well-being to my body. O Allah, grant well-being to my hearing. O Allah, grant well-being to my sight. There is no god but You. O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. There is no god but You.',
    reference: 'Ahmad',
    repeat: 3,
  },
  {
    id: 'me-16',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: "Hasbi-Allahu la ilaha illa Huwa, 'alayhi tawakkaltu, wa Huwa Rabbul-'Arshil-'Azim",
    translation: 'Allah is sufficient for me. There is no god but He. In Him I put my trust, and He is the Lord of the Mighty Throne.',
    reference: 'Ibn al-Sunni',
    repeat: 7,
  },
  {
    id: 'me-17',
    arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ نَبِيًّا',
    transliteration: 'Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin nabiyyan',
    translation: 'I am pleased with Allah as my Lord, Islam as my religion, and Muhammad ﷺ as my Prophet.',
    reference: 'Ahmad',
    repeat: 3,
  },
  {
    id: 'me-18',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil-ardi wa la fis-sama'i wa Huwas-Sami'ul-'Alim",
    translation: 'In the name of Allah with Whose name nothing can cause harm in the earth or in the heavens, and He is the All-Hearing, the All-Knowing.',
    reference: 'Tirmidhi',
    repeat: 3,
    note: 'Nothing will harm you.',
  },
  {
    id: 'me-19',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliteration: 'Subhana-Allahi wa bihamdih',
    translation: 'Glory be to Allah and praise be to Him.',
    reference: 'Muslim',
    repeat: 100,
  },
  {
    id: 'me-20',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa Huwa 'ala kulli shay'in Qadir",
    translation: 'There is no god but Allah alone, with no partner. To Him belongs dominion and all praise. He is Powerful over all things.',
    reference: 'Bukhari, Nasai',
    repeat: 100,
  },
  {
    id: 'me-21',
    arabic: 'سُبْحَانَ اللَّهِ، الْحَمْدُ لِلَّهِ، اللَّهُ أَكْبَرُ',
    transliteration: 'SubhanAllah, Alhamdulillah, Allahu Akbar',
    translation: 'Glory be to Allah. Praise be to Allah. Allah is the Greatest.',
    reference: "Nasa'i",
    repeat: 100,
  },
  {
    id: 'me-22',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: 'Allahumma salli ala Muhammadin wa ala ali Muhammad',
    translation: 'O Allah, send blessings upon Muhammad and upon the family of Muhammad.',
    reference: 'Tabarani',
    repeat: 10,
    note: '10 blessings from Allah, 10 sins erased, 10 stages raised.',
  },
  {
    id: 'me-23',
    arabic: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullaha wa atubu ilayh',
    translation: 'I seek forgiveness from Allah and repent to Him.',
    reference: 'Tabarani',
    repeat: 100,
    note: 'Morning only.',
  },
  {
    id: 'me-24',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
    transliteration: "Subhana-Allahi wa bihamdih, 'adada khalqih, wa rida nafsih, wa zinata 'arshih, wa midada kalimatih",
    translation: 'Glory be to Allah and praise be to Him: as many times as the number of His creation, to the extent of His pleasure, to the weight of His Throne, and to the ink of His words.',
    reference: 'Muslim',
    repeat: 3,
    note: 'Morning only.',
  },
  {
    id: 'me-25',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'udhu bikalimatil-lahit-tammati min sharri ma khalaq",
    translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
    reference: 'Tirmidhi',
    repeat: 3,
    note: 'Evening only. You will be protected from insect stings.',
  },
];

// ============================================================
// 2. MORNING ONLY ADHKAR
// ============================================================
export const MORNING_ONLY_ADHKAR: AdhkarItem[] = [
  {
    id: 'mo-8',
    arabic: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    transliteration: "Allahumma ma asbaha bi min ni'matin aw bi ahadin min khalqika, faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr",
    translation: 'O Allah, whatever blessing I or any of Your creation have entered upon this morning is from You alone, without partner. To You belongs all praise and thanks.',
    reference: 'Abu Dawud',
    repeat: 1,
    note: 'Whoever says this in the morning has given thanks for the day.',
  },
  {
    id: 'mo-9',
    arabic: 'أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ',
    transliteration: "Asbahna 'ala fitratil-Islam, wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina Muhammadin, wa 'ala millati abina Ibrahima hanifam-muslimaw-wama kana minal-mushrikin",
    translation: 'We have started this morning upon the natural religion of Islam, upon the word of sincerity, upon the religion of our Prophet Muhammad, and upon the way of our father Ibrahim, who was a Muslim and was not of the polytheists.',
    reference: 'Ahmad',
    repeat: 1,
  },
  {
    id: 'mo-10',
    arabic: 'أَصْبَحْتُ أُثْنِي عَلَيْكَ حَمْدًا، وَأَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ',
    transliteration: "Asbahtu uthni 'alayka hamdan, wa ashhadu an la ilaha illallah",
    translation: 'I have started this morning praising You and bearing witness that none has the right to be worshipped but Allah.',
    reference: "Nasa'i",
    repeat: 3,
  },
  {
    id: 'mo-13',
    arabic: 'اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ، وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ، وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
    transliteration: "Allahumma inni asbahtu ushhiduka, wa ushhidu hamalata 'arshika, wa mala'ikataka, wa jami'a khalqika, annaka antallahu la ilaha illa anta wahdaka la sharika lak, wa anna Muhammadan 'abduka wa rasuluk",
    translation: 'O Allah, I have started this morning calling You as a witness, and calling the bearers of Your Throne, Your angels and all of creation to witness, that indeed You are Allah, there is no god but You alone, without partner, and that Muhammad is Your slave and messenger.',
    reference: 'Abu Dawud',
    repeat: 4,
    note: 'Allah will save you from Hellfire.',
  },
  {
    id: 'mo-14',
    arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
    transliteration: 'Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaikan-nushur',
    translation: 'O Allah, by You we have entered the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.',
    reference: 'Al-Adab al-Mufrad',
    repeat: 1,
  },
];

// ============================================================
// 3. EVENING ONLY ADHKAR
// ============================================================
export const EVENING_ONLY_ADHKAR: AdhkarItem[] = [
  {
    id: 'eo-8',
    arabic: 'اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    transliteration: "Allahumma ma amsa bi min ni'matin aw bi ahadin min khalqika, faminka wahdaka la sharika lak, falakal-hamdu wa lakash-shukr",
    translation: 'O Allah, whatever blessing I or any of Your creation have entered upon this evening is from You alone, without partner. To You belongs all praise and thanks.',
    reference: 'Abu Dawud',
    repeat: 1,
  },
  {
    id: 'eo-9',
    arabic: 'أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا',
    transliteration: "Amsayna 'ala fitratil-Islam, wa 'ala kalimatil-ikhlas, wa 'ala dini nabiyyina Muhammadin, wa 'ala millati abina Ibrahima hanifam-muslima",
    translation: 'We have entered the evening upon the natural religion of Islam, the word of sincerity, the religion of our Prophet Muhammad, and the way of our father Ibrahim who was a Muslim.',
    reference: 'Ahmad',
    repeat: 1,
  },
];

// ============================================================
// 4. BEFORE SLEEPING ADHKAR
// ============================================================
export const SLEEP_ADHKAR: AdhkarItem[] = [
  {
    id: 'sl-1',
    arabic: 'الم تَنزِيلُ... (سورة السجدة) وَتَبَارَكَ الَّذِي... (سورة الملك)',
    transliteration: 'Surah As-Sajdah (32) & Surah Al-Mulk (67)',
    translation: 'Surah As-Sajdah and Surah Al-Mulk',
    reference: 'Tirmidhi',
    repeat: 1,
  },
  {
    id: 'sl-2',
    arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ... (آية الكرسي)',
    transliteration: 'Ayat al-Kursi (2:255)',
    translation: 'Ayat al-Kursi — protection from Shaytan throughout the night.',
    reference: 'Bukhari',
    repeat: 1,
  },
  {
    id: 'sl-3',
    arabic: 'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ... (آخر سورة البقرة 2:285-6)',
    transliteration: 'Last two verses of Surah al-Baqarah (2:285-6)',
    translation: 'The last two verses of Surah Al-Baqarah — they will suffice you.',
    reference: 'Bukhari',
    repeat: 1,
  },
  {
    id: 'sl-4',
    arabic: 'قُلْ يَا أَيُّهَا الْكَافِرُونَ... (سورة الكافرون)',
    transliteration: 'Surah Al-Kafirun (109)',
    translation: 'Surah Al-Kafirun — protection from shirk.',
    reference: 'Tirmidhi',
    repeat: 1,
  },
  {
    id: 'sl-5',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ... قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... قُلْ أَعُوذُ بِرَبِّ النَّاسِ...',
    transliteration: 'Surah Ikhlas, Falaq & Nas',
    translation: 'Recite into your hands, blow into them, and wipe over your body beginning from the head — do this three times.',
    reference: 'Bukhari',
    repeat: 3,
  },
  {
    id: 'sl-6',
    arabic: 'سُبْحَانَ اللَّهِ (33×)، الْحَمْدُ لِلَّهِ (33×)، اللَّهُ أَكْبَرُ (34×)',
    transliteration: 'SubhanAllah 33x, Alhamdulillah 33x, Allahu Akbar 34x',
    translation: 'Glory be to Allah (33), Praise be to Allah (33), Allah is Greatest (34)',
    reference: 'Bukhari',
    repeat: 1,
  },
  {
    id: 'sl-7',
    arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    transliteration: "Bismika Rabbi wada'tu janbi, wa bika arfa'uh, fa in amsakta nafsi farhamha, wa in arsaltaha fahfadhha bima tahfadhu bihi 'ibadakas-salihin",
    translation: 'In Your name, my Lord, I lay myself down, and in Your name I rise. If You take my soul, have mercy on it. If You release it, protect it as You protect Your righteous servants.',
    reference: 'Bukhari',
    repeat: 1,
  },
  {
    id: 'sl-8',
    arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
    transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
    translation: 'O Allah, protect me from Your punishment on the Day You resurrect Your servants.',
    reference: 'Abu Dawud',
    repeat: 3,
  },
  {
    id: 'sl-14',
    arabic: 'بِسْمِ اللَّهِ وَضَعْتُ جَنْبِي، اللَّهُمَّ اغْفِرْ لِي ذَنْبِي، وَأَخْسِئْ شَيْطَانِي، وَفُكَّ رِهَانِي، وَاجْعَلْنِي فِي النَّدِيِّ الْأَعْلَى',
    transliteration: "Bismillahi wada'tu janbi, Allahumma-ghfir li dhanbi, wa akhsi' shaytani, wa fukka rihani, waj'alni fin-nadiyal-a'la",
    translation: 'In the name of Allah I lay down my side. O Allah, forgive my sins, drive away my Shaytan, free my soul, and place me in the highest assembly.',
    reference: 'Abu Dawud',
    repeat: 1,
  },
  {
    id: 'sl-18',
    arabic: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِيَ إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَى مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
    transliteration: "Allahumma aslamtu nafsi ilayk, wa fawwadtu amri ilayk, wa wajjahtu wajhiya ilayk, wa alja'tu dhahri ilayk, raghbatan wa rahbatan ilayk, la malja'a wa la manja minka illa ilayk, amantu bikitabikal-ladhi anzalt, wa binabiyyikal-ladhi arsalt",
    translation: 'O Allah, I have submitted myself to You, entrusted my affairs to You, turned my face to You and placed my back against You out of desire for You and fear of You. There is no refuge or escape from You except to You. I believe in Your Book that You have revealed and in Your Prophet whom You have sent.',
    reference: 'Bukhari',
    repeat: 1,
    note: 'Make this the last thing you say before sleeping.',
  },
];

// ============================================================
// 5. ADHKAR AFTER SALAH
// ============================================================
export const AFTER_SALAH_ADHKAR: AdhkarItem[] = [
  {
    id: 'as-1',
    arabic: 'أَسْتَغْفِرُ اللَّهَ (3×)، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: "Astaghfirullah (3x), Allahumma antas-Salamu wa minkas-Salam, tabarakta ya Dhal-Jalali wal-Ikram",
    translation: 'I seek forgiveness from Allah (3x). O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honour.',
    reference: 'Muslim',
    repeat: 1,
  },
  {
    id: 'as-2',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ وَلَا مُعْطِيَ لِمَا مَنَعْتَ وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa Huwa 'ala kulli shay'in Qadir. Allahumma la mani'a lima a'tayta wa la mu'tiya lima mana'ta wa la yanfa'u dhal-jaddi minkal-jadd",
    translation: 'There is no god but Allah alone, with no partner. To Him belongs dominion and all praise. He has power over all things. O Allah, there is none who can withhold what You give and none who can give what You withhold, and the wealth of a wealthy person cannot benefit them against You.',
    reference: 'Bukhari',
    repeat: 1,
  },
  {
    id: 'as-3',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، لَا إِلَهَ إِلَّا اللَّهُ، وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ، لَا إِلَهَ إِلَّا اللَّهُ مُخْلِصِينَ لَهُ الدِّينَ وَلَوْ كَرِهَ الْكَافِرُونَ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa Huwa 'ala kulli shay'in Qadir. La hawla wa la quwwata illa billah. La ilaha illallah, wa la na'budu illa iyyah, lahun-ni'matu wa lahul-fadlu wa lahuth-thana'ul-hasan. La ilaha illallah mukhlisina lahud-dina wa law karihal-kafirun",
    translation: 'There is no god but Allah alone, with no partner. To Him belongs dominion and all praise. He has power over all things. There is no might or power except with Allah. There is no god but Allah. We worship none but Him. To Him belongs all blessing, all grace, and all beautiful praise. There is no god but Allah, being sincere to Him in religion even if the disbelievers hate it.',
    reference: 'Muslim',
    repeat: 1,
  },
  {
    id: 'as-4',
    arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    transliteration: "Allahumma a'inni 'ala dhikrika wa shukrika wa husni 'ibadatik",
    translation: 'O Allah, help me to remember You, to give thanks to You, and to worship You well.',
    reference: 'Abu Dawud',
    repeat: 1,
  },
  {
    id: 'as-5',
    arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْبُخْلِ، وَأَعُوذُ بِكَ مِنَ الْجُبْنِ، وَأَعُوذُ بِكَ مِنْ أَنْ أُرَدَّ إِلَى أَرْذَلِ الْعُمُرِ، وَأَعُوذُ بِكَ مِنْ فِتْنَةِ الدُّنْيَا وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ',
    transliteration: "Allahumma inni a'udhu bika minal-bukhli, wa a'udhu bika minal-jubni, wa a'udhu bika min an uradda ila ardhalil-'umuri, wa a'udhu bika min fitnatid-dunya, wa a'udhu bika min 'adhabił-qabr",
    translation: 'O Allah, I seek refuge in You from miserliness, from cowardice, from being returned to a decrepit old age, from the trials of this world, and from the punishment of the grave.',
    reference: 'Ibn Hibban',
    repeat: 1,
  },
  {
    id: 'as-6',
    arabic: 'سُبْحَانَ اللَّهِ (33×)، الْحَمْدُ لِلَّهِ (33×)، اللَّهُ أَكْبَرُ (33×)، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ (1×)',
    transliteration: "SubhanAllah (33x), Alhamdulillah (33x), Allahu Akbar (33x), La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa Huwa 'ala kulli shay'in Qadir (1x)",
    translation: 'SubhanAllah 33 times, Alhamdulillah 33 times, Allahu Akbar 33 times, then complete 100 with La ilaha illallah.',
    reference: 'Muslim',
    repeat: 1,
    note: 'Sins will be forgiven even if they are as the foam of the sea.',
  },
  {
    id: 'as-7',
    arabic: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ... (آية الكرسي)',
    transliteration: 'Ayat al-Kursi after every salah',
    translation: 'Whoever recites Ayat al-Kursi after every salah will enter Paradise.',
    reference: "Nasa'i",
    repeat: 1,
  },
  {
    id: 'as-fajr-maghrib-9',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, yuhyi wa yumitu wa Huwa 'ala kulli shay'in Qadir",
    translation: 'There is no god but Allah alone, with no partner. To Him belongs all dominion and praise. He gives life and death and He has power over all things.',
    reference: 'Ahmad',
    repeat: 10,
    note: 'After Fajr and Maghrib — a shield against all evil.',
  },
  {
    id: 'as-fajr-11',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا',
    transliteration: "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan tayyiban, wa 'amalan mutaqabbala",
    translation: 'O Allah, I ask You for beneficial knowledge, good provision, and acceptable deeds.',
    reference: 'Ibn Majah',
    repeat: 1,
    note: 'After Fajr salah only.',
  },
];

// ============================================================
// 6. ADHKAR FOR OTHER ACTIONS
// ============================================================
export const OTHER_ACTIONS_ADHKAR: AdhkarItem[] = [
  {
    id: 'oa-wake',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي عَافَانِي فِي جَسَدِي، وَرَدَّ عَلَيَّ رُوحِي، وَأَذِنَ لِي بِذِكْرِهِ',
    transliteration: "Alhamdulillahil-ladhi 'afani fi jasadi, wa radda 'alayya ruhi, wa adhina li bidhikrih",
    translation: 'All praise is for Allah Who gave health to my body, returned my soul to me, and allowed me to remember Him.',
    reference: 'Tirmidhi',
    note: 'Upon waking from sleep',
    repeat: 1,
  },
  {
    id: 'oa-lavatory-enter',
    arabic: 'بِسْمِ اللَّهِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ',
    transliteration: "Bismillah. Allahumma inni a'udhu bika minal-khubuti wal-khaba'ith",
    translation: 'In the name of Allah. O Allah, I seek refuge in You from evil and from the evil ones.',
    reference: 'Bukhari',
    note: 'Before entering the lavatory',
    repeat: 1,
  },
  {
    id: 'oa-lavatory-exit',
    arabic: 'غُفْرَانَكَ',
    transliteration: 'Ghufranaka',
    translation: 'I seek Your forgiveness.',
    reference: 'Abu Dawud',
    note: 'After coming out of the lavatory',
    repeat: 1,
  },
  {
    id: 'oa-wudu-after',
    arabic: 'أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ',
    transliteration: "Ashhadu an la ilaha illallahu wahdahu la sharika lah, wa ashhadu anna Muhammadan 'abduhu wa rasuluh. Allahummaj'alni minat-tawwabina waj'alni minal-mutatahhirin",
    translation: 'I bear witness that there is no god but Allah alone, with no partner, and I bear witness that Muhammad is His slave and messenger. O Allah, make me of those who repent and make me of those who purify themselves.',
    reference: 'Tirmidhi',
    note: 'After completing wudu — the 8 gates of Paradise will be opened for him.',
    repeat: 1,
  },
  {
    id: 'oa-house-enter',
    arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلِجِ، وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا',
    transliteration: "Allahumma inni as'aluka khayral-mawliji wa khayral-makhraj. Bismillahi walajna, wa bismillahi kharajna, wa 'alallahi Rabbina tawakkalna",
    translation: 'O Allah, I ask You for the good of entering and the good of leaving. In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we rely.',
    reference: 'Abu Dawud',
    note: 'When entering the house',
    repeat: 1,
  },
  {
    id: 'oa-house-leave',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: "Bismillahi tawakkaltu 'alallahi, la hawla wa la quwwata illa billah",
    translation: 'In the name of Allah, I rely on Allah. There is no might or power except with Allah.',
    reference: 'Abu Dawud',
    note: 'When leaving the house — you will be guided, protected and the devils will stay away.',
    repeat: 1,
  },
  {
    id: 'oa-eat-before',
    arabic: 'بِسْمِ اللَّهِ',
    transliteration: 'Bismillah',
    translation: 'In the name of Allah.',
    reference: 'Tirmidhi',
    note: 'Before eating',
    repeat: 1,
  },
  {
    id: 'oa-eat-after-1',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا، وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: "Alhamdulillahil-ladhi at'amani hadha, wa razaqanihi min ghayri hawlim-minni wa la quwwah",
    translation: 'Praise be to Allah Who fed me this and provided me with it without any might or power on my part.',
    reference: 'Tirmidhi',
    note: 'After eating — previous sins will be forgiven.',
    repeat: 1,
  },
  {
    id: 'oa-clothes-after',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا الثَّوْبَ، وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ',
    transliteration: "Alhamdulillahil-ladhi kasani hadha-th-thawba, wa razaqanihi min ghayri hawlim-minni wa la quwwah",
    translation: 'Praise be to Allah Who clothed me with this and provided it for me without any might or power on my part.',
    reference: 'Abu Dawud',
    note: 'After wearing clothes — previous sins will be forgiven.',
    repeat: 1,
  },
  {
    id: 'oa-masjid-enter',
    arabic: 'أَعُوذُ بِاللَّهِ الْعَظِيمِ، وَبِوَجْهِهِ الْكَرِيمِ، وَسُلْطَانِهِ الْقَدِيمِ، مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللَّهِ، اللَّهُمَّ اغْفِرْ لِي ذُنُوبِي وَافْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: "A'udhu billahil-'Adhim, wa biwajhihil-Karim, wa sultanihil-Qadim, minash-Shaytanir-Rajim. Bismillah, was-salatu was-salamu 'ala Rasulillah, Allahumma-ghfir li dhunubi waftah li abwaba rahmatik",
    translation: 'I seek refuge in Allah the Great, in His noble face, and in His eternal sovereignty, from the accursed Shaytan. In the name of Allah. Peace and blessings be upon the Messenger of Allah. O Allah, forgive my sins and open the doors of Your mercy for me.',
    reference: 'Ibn Majah, Ibn al-Sunni',
    note: 'When entering the masjid',
    repeat: 1,
  },
  {
    id: 'oa-adhan',
    arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ',
    transliteration: "Allahumma Rabba hadhihid-da'watit-tammati was-salatil-qa'imah, ati Muhammadanil-wasilata wal-fadilata wab'athhu maqamam-mahmudanil-ladhi wa'adtah",
    translation: 'O Allah, Lord of this perfect call and the prayer to be offered, grant Muhammad the privilege and also the eminence, and resurrect him to the praised position that You have promised him.',
    reference: 'Bukhari',
    note: 'After the adhan is complete',
    repeat: 1,
  },
];

// ============================================================
// 7. RUQYAH ADHKAR
// ============================================================
export const RUQYAH_ADHKAR: AdhkarItem[] = [
  {
    id: 'rq-1',
    arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    transliteration: "A'udhu bikalimatil-lahit-tammati min sharri ma khalaq",
    translation: 'I seek protection in Allah\'s perfect words from the evil of whatever He has created.',
    reference: 'Muslim',
    repeat: 1,
  },
  {
    id: 'rq-2',
    arabic: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ، عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
    transliteration: "Hasbi-Allahu la ilaha illa Huwa, 'alayhi tawakkaltu, wa Huwa Rabbul-'Arshil-'Azim (9:129)",
    translation: 'Allah is sufficient for me. There is no god but He. In Him I put my trust, and He is the Lord of the Mighty Throne.',
    reference: 'Abu Dawud',
    repeat: 7,
  },
  {
    id: 'rq-3',
    arabic: 'بِسْمِ اللَّهِ (3×)، أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ',
    transliteration: "Bismillah (3x), a'udhu billahi wa qudratihi min sharri ma ajidu wa uhadhir",
    translation: 'In the name of Allah (3x). I seek refuge in Allah and in His power from the evil of what I feel and from what I fear.',
    reference: 'Muslim',
    repeat: 7,
    note: 'Place your hand on the part of the body in pain and say this 7 times.',
  },
  {
    id: 'rq-4',
    arabic: 'أَسْأَلُ اللَّهَ الْعَظِيمَ، رَبَّ الْعَرْشِ الْعَظِيمِ، أَنْ يَشْفِيَكَ',
    transliteration: "As'alullaahal-'Azeema, Rabbal-'Arshil-'Azeemi an yashfiyak",
    translation: 'I ask Allah the Magnificent, Lord of the Magnificent Throne, to cure you.',
    reference: 'Tirmidhi',
    repeat: 7,
    note: 'Allah will cure them of their sickness.',
  },
  {
    id: 'rq-5',
    arabic: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ، شِفَاءً لَا يُغَادِرُ سَقَمًا',
    transliteration: "Allahumma Rabban-nas, adhhibilba's, ishfi antas-shafi, la shifa'a illa shifa'uka, shifa'al-la yughadiru saqama",
    translation: 'O Allah, Lord of mankind, remove this disease. Cure, for You are the One who cures. There is no cure except Your cure. A cure that leaves behind no sickness.',
    reference: 'Bukhari',
    repeat: 1,
  },
];

// ============================================================
// 8. GENERAL ADHKAR (Read Frequently)
// ============================================================
export const GENERAL_ADHKAR: AdhkarItem[] = [
  {
    id: 'ga-1',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: "La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa Huwa 'ala kulli shay'in Qadir",
    translation: 'There is no god but Allah alone, with no partner. To Him belongs dominion and all praise. He has power over all things.',
    reference: "Muwatta'",
    note: 'The best statement uttered by all the Prophets.',
    repeat: 100,
  },
  {
    id: 'ga-2',
    arabic: 'سُبْحَانَ اللَّهِ، الْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ، اللَّهُ أَكْبَرُ',
    transliteration: 'SubhanAllah, Alhamdulillah, La ilaha illallah, Allahu Akbar',
    translation: 'Glory be to Allah. Praise be to Allah. There is no god but Allah. Allah is the Greatest.',
    reference: 'Ahmad',
    note: 'The best words after the Quran. They wipe away sins.',
    repeat: 100,
  },
  {
    id: 'ga-3',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'SubhanAllahi wa bihamdih, SubhanAllahil-Adhim',
    translation: 'Glory be to Allah and praise be to Him. Glory be to Allah the Magnificent.',
    reference: 'Bukhari',
    note: 'Light on the tongue, heavy on the scale, beloved to the All-Merciful.',
    repeat: 100,
  },
  {
    id: 'ga-4',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliteration: 'La hawla wa la quwwata illa billah',
    translation: 'There is no might or power except with Allah.',
    reference: 'Bukhari',
    note: 'A treasure from the treasures of Paradise.',
  },
  {
    id: 'ga-5',
    arabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
    transliteration: 'Ya Dhal-Jalali wal-Ikram',
    translation: 'O Possessor of Majesty and Honour.',
    reference: 'Tirmidhi',
    note: 'Supplicate frequently with this.',
  },
  {
    id: 'ga-6',
    arabic: 'يَا حَيُّ يَا قَيُّومُ، بِرَحْمَتِكَ أَسْتَغِيثُ',
    transliteration: 'Ya Hayyu Ya Qayyum, bi rahmatika astaghith',
    translation: 'O Ever-Living, O Sustainer of all existence, by Your mercy I seek assistance.',
    reference: 'Tirmidhi',
    note: 'What the Prophet ﷺ would say when distressed.',
  },
  {
    id: 'ga-7',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    transliteration: "Allahumma salli 'ala Muhammadin wa 'ala ali Muhammad",
    translation: 'O Allah, send blessings upon Muhammad and upon the family of Muhammad.',
    reference: 'Tabarani',
    note: '10 blessings from Allah, 10 sins erased, 10 stages raised.',
    repeat: 10,
  },
  {
    id: 'ga-8',
    arabic: 'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: "La ilaha illa anta subhanaka inni kuntu minadh-dhalimin",
    translation: 'There is no god but You, glory be to You. Indeed, I have been of the wrongdoers.',
    reference: "Nasa'i",
    note: 'For difficult times. Allah answers prayers when supplicated with it.',
  },
  {
    id: 'ga-9',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ',
    transliteration: "Astaghfirullaahal-'Azeema alladhi la ilaha illa Huwal-Hayyul-Qayyumu wa atubu ilaih",
    translation: 'I seek forgiveness from Allah the Magnificent, there is no god but He, the Ever-Living, the Sustainer of all existence, and I repent to Him.',
    reference: 'Tirmidhi',
    note: 'All sins will be forgiven.',
  },
];

// ============================================================
// CATEGORIES EXPORT
// ============================================================
export const ADHKAR_CATEGORIES: AdhkarCategory[] = [
  {
    id: 'morning-evening',
    title: 'Morning & Evening',
    arabicTitle: 'أذكار الصباح والمساء',
    icon: 'weather-sunset',
    color: '#F59E0B',
    items: [...MORNING_EVENING_ADHKAR],
  },
  {
    id: 'morning',
    title: 'Morning Only',
    arabicTitle: 'أذكار الصباح',
    icon: 'weather-sunny',
    color: '#F97316',
    items: MORNING_ONLY_ADHKAR,
  },
  {
    id: 'evening',
    title: 'Evening Only',
    arabicTitle: 'أذكار المساء',
    icon: 'weather-night',
    color: '#6366F1',
    items: EVENING_ONLY_ADHKAR,
  },
  {
    id: 'sleep',
    title: 'Before Sleeping',
    arabicTitle: 'الأذكار قبل النوم',
    icon: 'sleep',
    color: '#8B5CF6',
    items: SLEEP_ADHKAR,
  },
  {
    id: 'after-salah',
    title: 'After Salah',
    arabicTitle: 'الأذكار بعد الصلاة',
    icon: 'mosque',
    color: '#10B981',
    items: AFTER_SALAH_ADHKAR,
  },
  {
    id: 'other-actions',
    title: 'Daily Actions',
    arabicTitle: 'الأذكار لأعمال أخرى',
    icon: 'calendar-today',
    color: '#14B8A6',
    items: OTHER_ACTIONS_ADHKAR,
  },
  {
    id: 'ruqyah',
    title: 'Ruqyah',
    arabicTitle: 'الرقية الشرعية',
    icon: 'shield-cross',
    color: '#EF4444',
    items: RUQYAH_ADHKAR,
  },
  {
    id: 'general',
    title: 'General Adhkar',
    arabicTitle: 'الأذكار العامة',
    icon: 'heart',
    color: '#C5A880',
    items: GENERAL_ADHKAR,
  },
];
