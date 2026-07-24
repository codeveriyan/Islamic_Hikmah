export type HadithIntro = {
  arabicTitle: string;
  description: string;
};

export const HADITH_INTRODUCTIONS: Record<string, HadithIntro> = {
  bukhari: {
    arabicTitle: "صحيح البخاري",
    description: "Sahih al-Bukhari is the most authentic book of Hadith compiled by Imam Muhammad ibn Ismail al-Bukhari (d. 256 AH). It contains 7,563 Hadiths meticulously verified over 16 years. It is recognized by Islamic scholars as the most authentic book after the Holy Quran."
  },
  muslim: {
    arabicTitle: "صحيح مسلم",
    description: "Sahih Muslim is the second most authentic Hadith collection, compiled by Imam Muslim ibn al-Hajjaj (d. 261 AH). It contains over 7,500 Hadiths organized with extraordinary thematic rigor and chain verification."
  },
  nasai: {
    arabicTitle: "سنن النسائي",
    description: "Sunan an-Nasa'i is one of the Six Major Hadith collections (Al-Kutub al-Sittah), compiled by Imam Ahmad ibn Shu'ayb an-Nasa'i (d. 303 AH). Renowned for its strict criteria in narrator authentication and focus on legal rulings (Fiqh)."
  },
  abudawud: {
    arabicTitle: "سنن أبي داود",
    description: "Sunan Abi Dawud is compiled by Imam Abu Dawud Sulayman ibn al-Ash'ath (d. 275 AH). It focuses specifically on Ahkam (legal narrations) used by jurists across Islamic jurisprudence."
  },
  tirmidhi: {
    arabicTitle: "جامع الترمذي",
    description: "Jami' at-Tirmidhi is compiled by Imam Abu Isa Muhammad at-Tirmidhi (d. 279 AH). Renowned for categorizing Hadith gradings (Sahih, Hasan, Da'if) and explaining the positions of early jurists."
  },
  ibnmajah: {
    arabicTitle: "سنن ابن ماجه",
    description: "Sunan Ibn Majah is compiled by Imam Ibn Majah Abu Abdillah Muhammad (d. 273 AH). It is celebrated for its exceptional organization, concise chapter headings, and valuable unique narrations (Zawa'id)."
  },
  malik: {
    arabicTitle: "موطأ مالك",
    description: "Muwatta Malik is the earliest surviving written compilation of Islamic law and Hadith, authored by Imam Malik ibn Anas (d. 179 AH), founder of the Maliki school. Imam ash-Shafi'i declared it the most authentic book on earth during his era."
  },
  ahmad: {
    arabicTitle: "مسند أحمد بن حنبل",
    description: "Musnad Ahmad bin Hanbal is one of the largest Hadith encyclopedias ever compiled, by Imam Ahmad bin Hanbal (d. 241 AH). It contains over 26,000 narrations arranged by Companion narrators (Musnad format)."
  },
  darimi: {
    arabicTitle: "سنن الدارمي",
    description: "Sunan ad-Darimi is compiled by Imam Abu Muhammad ad-Darimi (d. 255 AH). Known for its clarity, reliability of narrators, and profound introductory chapters on the virtue of Islamic knowledge."
  },
  khuzayma: {
    arabicTitle: "صحيح ابن خزيمة",
    description: "Sahih Ibn Khuzayma is a prominent collection compiled by the Great Hafiz Imam Ibn Khuzayma (d. 311 AH). Celebrated for its stringent criteria in authenticating Hadith."
  },
  hibban: {
    arabicTitle: "صحيح ابن حبان",
    description: "Sahih Ibn Hibban is compiled by Imam Abu Hatim Ibn Hibban al-Busti (d. 354 AH). Organized uniquely by commands, prohibitions, information, and actions."
  },
  hakim: {
    arabicTitle: "المستدرك على الصحيحين",
    description: "Al-Mustadrak 'ala al-Sahihayn is compiled by Imam al-Hakim al-Nishapuri (d. 405 AH). It contains authentic Hadiths that met the criteria of Bukhari and Muslim but were omitted from their primary books."
  },
  razzaq: {
    arabicTitle: "مصنف عبد الرزاق",
    description: "Musannaf 'Abd ar-Razzaq is an invaluable early compilation by Imam Abd ar-Razzaq as-San'ani (d. 211 AH), preserving Hadiths, Companion rulings (Athar), and Tabi'in legal opinions."
  },
  ibnabishayba: {
    arabicTitle: "مصنف ابن أبي شيبة",
    description: "Musannaf Ibn Abi Shayba is a monumental Hadith and Athar collection by Imam Ibn Abi Shayba (d. 235 AH), teacher of Bukhari and Muslim, organized topically across Islamic jurisprudence."
  },
  daraqutni: {
    arabicTitle: "سنن الدارقطني",
    description: "Sunan ad-Daraqutni is compiled by the master critic Imam Ali ibn Umar ad-Daraqutni (d. 385 AH), focusing on intricate legal narrations and subtle chain defects (Ilal)."
  },
  bayhaqi: {
    arabicTitle: "السنن الكبرى للبيهقي",
    description: "As-Sunan al-Kubra is the masterwork of Imam Abu Bakr al-Bayhaqi (d. 458 AH), compiling comprehensive legal proofs for Shafi'i jurisprudence across ten volumes."
  },
  nasai_kubra: {
    arabicTitle: "السنن الكبرى للنسائي",
    description: "Sunan an-Nasa'i al-Kubra is the expansive original compilation by Imam an-Nasa'i, from which his famous Sunan as-Sughra (Al-Mujtaba) was selected."
  },
  aladab_almufrad: {
    arabicTitle: "الأدب المفرد",
    description: "Al-Adab Al-Mufrad is a dedicated masterpiece by Imam al-Bukhari on Islamic manners, noble character, family relations, neighborliness, and daily etiquette."
  },
  shamail_muhammadiyah: {
    arabicTitle: "الشمائل المحمدية",
    description: "Ash-Shama'il Al-Muhammadiyah is compiled by Imam at-Tirmidhi. It provides a heartwarming, detailed description of the physical appearance, character, speech, dress, and daily life of the Prophet Muhammad (ﷺ)."
  },
  nawawi40: {
    arabicTitle: "الأربعون النووية",
    description: "An-Nawawi's 40 Hadith is a world-renowned selection compiled by Imam Yahya ibn Sharaf an-Nawawi (d. 676 AH), encompassing the foundational principles of Islamic faith and morals."
  },
  riyad_assalihin: {
    arabicTitle: "رياض الصالحين",
    description: "Riyad as-Salihin is a selection of hadith compiled by Imam Yahya ibn Sharaf an-Nawawi. It is one of the most widely known and read books of hadith all over the world, containing approximately 1,900 carefully chosen hadith on ethics, manners, worship, knowledge, and other topics compiled from the Six Books of hadith. It is practical and accessible to Muslims of all levels."
  },
  bulugh_almaram: {
    arabicTitle: "بلوغ المرام من أدلة الأحكام",
    description: "Bulugh al-Maram is compiled by Hafiz Ibn Hajar al-Asqalani (d. 852 AH). It is a quintessential primer containing 1,568 Hadiths forming the primary evidences for Islamic jurisprudence (Fiqh)."
  },
  mishkat_almasabih: {
    arabicTitle: "مشكاة المصابيح",
    description: "Mishkat al-Masabih is an expanded compilation by Khatib al-Tabrizi (d. 741 AH) based on Al-Baghawi's Masabih al-Sunnah, organizing authentic Hadiths into clear thematic categories."
  },
  hisn: {
    arabicTitle: "حصن المسلم",
    description: "Hisn al-Muslim (Fortress of the Muslim) is compiled by Sheikh Sa'id bin Ali bin Wahf Al-Qahtani. It contains essential authentic supplications (Duas) and remembrances (Adhkar) for daily life."
  },
  qudsi40: {
    arabicTitle: "الأربعين القدسية",
    description: "40 Hadith Qudsi is a collection of Sacred Hadiths where the Prophet (ﷺ) relays direct revelation from Allah, focusing on divine mercy, worship, repentance, and spiritual reflection."
  },
  shahwaliullah40: {
    arabicTitle: "الأربعون شاه ولي الله",
    description: "40 Hadith of Shah Waliullah Dehlawi (d. 1176 AH) is a concise collection of short, memorable Hadiths with brief sanad (chains of narration), ideal for memorization and spiritual study."
  }
};
