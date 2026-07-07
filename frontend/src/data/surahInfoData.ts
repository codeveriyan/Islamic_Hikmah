export type SurahInfo = {
  number: number;
  placeOfRevelation: string;
  revelationOrder: number;
  mainThemes: string[];
  keyTopics: string[];
};

export const SURAH_INFO_DATA: Record<number, SurahInfo> = {
  1: {
    number: 1,
    placeOfRevelation: "Makkah",
    revelationOrder: 5,
    mainThemes: ["Praise & gratitude to Allah", "Allah's mercy & sovereignty", "Guidance & seeking the straight path"],
    keyTopics: ["Sovereignty of Allah", "Day of Judgment", "Worship & seeking help", "Path of the righteous vs the astray"]
  },
  2: {
    number: 2,
    placeOfRevelation: "Madinah",
    revelationOrder: 87,
    mainThemes: ["Guidance for mankind", "Covenant with Bani Isra'il", "Laws & social guidelines for Muslims"],
    keyTopics: ["Story of Adam's creation", "Change of Qiblah direction", "Ramadan fasting rules", "Ayat al-Kursi", "Charity & prohibition of interest"]
  },
  3: {
    number: 3,
    placeOfRevelation: "Madinah",
    revelationOrder: 89,
    mainThemes: ["The oneness of Allah", "Belief in previous prophets", "Steadfastness in faith"],
    keyTopics: ["Miraculous birth of Isa (Jesus)", "Battle of Uhud guidance", "Charity and sacrifice", "Nature of true faith"]
  },
  4: {
    number: 4,
    placeOfRevelation: "Madinah",
    revelationOrder: 92,
    mainThemes: ["Social justice & equality", "Family rules & inheritance laws", "Rights of the vulnerable"],
    keyTopics: ["Orphans & women's rights", "Inheritance distributions", "Marriage guidelines", "Hypocrisy warning"]
  },
  5: {
    number: 5,
    placeOfRevelation: "Madinah",
    revelationOrder: 112,
    mainThemes: ["Fulfilment of covenants", "Dietary guidelines & purity", "Legal codes & relationships with other faiths"],
    keyTopics: ["Halal and Haram food criteria", "Wudu and Tayammum rules", "Story of Cain and Abel", "Mission of Isa (Jesus)"]
  },
  6: {
    number: 6,
    placeOfRevelation: "Makkah",
    revelationOrder: 55,
    mainThemes: ["Monotheism (Tawhid)", "Refutation of polytheism", "Allah's signs in nature"],
    keyTopics: ["Arguments against idolatry", "Prophet Ibrahim's logic", "Universal moral commandments", "Allah's creative power"]
  },
  7: {
    number: 7,
    placeOfRevelation: "Makkah",
    revelationOrder: 39,
    mainThemes: ["History of guidance & prophets", "The struggle between truth & falsehood", "Warning against Satan's whispers"],
    keyTopics: ["Story of Adam & Satan's expulsion", "Stories of Nuh, Hud, Salih, Lut & Shuaib", "Mission of Musa & Pharaoh", "Al-A'raf (The Heights) concept"]
  },
  8: {
    number: 8,
    placeOfRevelation: "Madinah",
    revelationOrder: 88,
    mainThemes: ["Rules of engagement & war spoils", "Steadfastness during battles", "Divine help during struggles"],
    keyTopics: ["Battle of Badr details", "Distribution of spoils", "Importance of unity & patience", "Treatment of prisoners of war"]
  },
  9: {
    number: 9,
    placeOfRevelation: "Madinah",
    revelationOrder: 113,
    mainThemes: ["Dissolution of treaty with pagans", "Hypocrisy exposed", "Compulsory charity (Zakah) rules"],
    keyTopics: ["Battle of Tabuk details", "The three who remained behind", "Definition of true believers", "Exposing the hypocrites' plots"]
  },
  10: {
    number: 10,
    placeOfRevelation: "Makkah",
    revelationOrder: 51,
    mainThemes: ["Truthfulness of the Quran", "Belief in Resurrection", "Prophets Nuh and Yunus story"],
    keyTopics: ["Signs of Allah in the universe", "Warning to those who deny", "Prophet Yunus's people success", "Quran as a cure and mercy"]
  },
  11: {
    number: 11,
    placeOfRevelation: "Makkah",
    revelationOrder: 52,
    mainThemes: ["Accountability of actions", "Patience and steadfastness", "Divine justice and destruction of tyrants"],
    keyTopics: ["Detailed stories of Nuh's Ark", "Prophets Hud, Salih, Ibrahim, Lut & Shuaib", "Final destiny of the righteous vs wicked"]
  },
  12: {
    number: 12,
    placeOfRevelation: "Makkah",
    revelationOrder: 53,
    mainThemes: ["Allah's perfect plan & decree", "Trust in Allah during trials", "Beautiful patience (Sabr Jamil)"],
    keyTopics: ["Detailed story of Yusuf (Joseph)", "Dreams and interpretation", "Trial of temptation", "Reconciliation with family"]
  },
  13: {
    number: 13,
    placeOfRevelation: "Makkah",
    revelationOrder: 96,
    mainThemes: ["Allah's power in creation", "The truth of revelation", "Heart's peace in remembrance"],
    keyTopics: ["Thunder glorifying Allah", "Real vs false deities", "Remembrance of Allah (Dhikr)", "Change comes from within"]
  },
  14: {
    number: 14,
    placeOfRevelation: "Makkah",
    revelationOrder: 72,
    mainThemes: ["Purpose of Quran (Light from darkness)", "Prophets' unified message", "Gratitude vs ingratitude"],
    keyTopics: ["Prophet Ibrahim's prayer for Makkah", "Fate of the ungrateful nations", "Description of Day of Judgment", "Satan's speech to followers"]
  },
  15: {
    number: 15,
    placeOfRevelation: "Makkah",
    revelationOrder: 54,
    mainThemes: ["Protection of the Quran", "Allah's sustenance for all", "People of Hijr (Thamud)"],
    keyTopics: ["Guardianship of the Quran", "Stoning of devils with meteors", "Expulsion of Iblis", "Seven oft-repeated verses"]
  },
  16: {
    number: 16,
    placeOfRevelation: "Makkah",
    revelationOrder: 70,
    mainThemes: ["Allah's blessings & favors", "Monotheism & creation", "Wisdom & good advice"],
    keyTopics: ["The Honeybee's inspiration", "Sustenance & animal blessings", "Sabbath guidelines", "Calling to Islam with wisdom"]
  },
  17: {
    number: 17,
    placeOfRevelation: "Makkah",
    revelationOrder: 50,
    mainThemes: ["Night Journey (Isra')", "Universal moral guidelines", "Honoring parents"],
    keyTopics: ["Al-Isra' wal-Mi'raj", "Respecting parents & elders", "Rights of relatives & poor", "Prohibition of pride & arrogance"]
  },
  18: {
    number: 18,
    placeOfRevelation: "Makkah",
    revelationOrder: 69,
    mainThemes: ["Trials of faith, wealth & knowledge", "Protection from trials", "True success"],
    keyTopics: ["Story of the Cave Sleepers", "Story of the Two Garden Owners", "Prophet Musa & Khidr journey", "Dhul-Qarnayn & Gog/Magog"]
  },
  19: {
    number: 19,
    placeOfRevelation: "Makkah",
    revelationOrder: 44,
    mainThemes: ["Allah's mercy to His prophets", "Miraculous birth of Isa", "Refutation of divine progeny claim"],
    keyTopics: ["Birth of Yahya (John)", "Mary's story & birth of Jesus", "Jesus speaking in cradle", "Prophets Ibrahim, Musa & Idris"]
  },
  20: {
    number: 20,
    placeOfRevelation: "Makkah",
    revelationOrder: 45,
    mainThemes: ["Comfort for the Prophet ﷺ", "Story of Musa & Pharaoh", "Steadfastness of the magicians"],
    keyTopics: ["Musa at the burning bush", "Magicians accepting Islam", "Samiri and the golden calf", "Warnings about the Day of Judgment"]
  },
  21: {
    number: 21,
    placeOfRevelation: "Makkah",
    revelationOrder: 73,
    mainThemes: ["Unity of prophets' message", "Inevitability of resurrection", "The universe's creation"],
    keyTopics: ["Big Bang concept (splitting of heavens)", "Stories of Ibrahim, Lut, Nuh, Dawud, Sulayman, Ayyub & Yunus", "Prophet Muhammad as Mercy to worlds"]
  },
  22: {
    number: 22,
    placeOfRevelation: "Madinah",
    revelationOrder: 103,
    mainThemes: ["Permission to fight oppression", "Hajj rituals & significance", "Sovereignty of Allah"],
    keyTopics: ["The Day of Judgment tremors", "Sanctioning defensive warfare", "Spiritual goals of Hajj", "Prostrating to Allah by all creation"]
  },
  23: {
    number: 23,
    placeOfRevelation: "Makkah",
    revelationOrder: 74,
    mainThemes: ["Qualities of true believers", "Human development in womb", "Struggles of previous prophets"],
    keyTopics: ["Success criteria for believers", "Biological stages of human embryo", "Noah's Ark and flood", "Refutation of polytheism"]
  },
  24: {
    number: 24,
    placeOfRevelation: "Madinah",
    revelationOrder: 102,
    mainThemes: ["Social ethics & modesty", "Rules of entry & privacy", "Allah is the Light of Heavens & Earth"],
    keyTopics: ["False slander against Aisha (ra)", "Hijab & modesty for men/women", "Verse of Light (Ayat-un-Nur)", "True light vs shadows of disbelief"]
  },
  25: {
    number: 25,
    placeOfRevelation: "Makkah",
    revelationOrder: 42,
    mainThemes: ["Quran as Criterion", "Prophet ﷺ is human", "Qualities of 'Servants of Most Merciful'"],
    keyTopics: ["The Quran separating truth/falsehood", "Polytheists' objections to Prophet", "Signs of Ibrahim & Nuh", "Characteristics of Ibad-ur-Rahman"]
  },
  26: {
    number: 26,
    placeOfRevelation: "Makkah",
    revelationOrder: 47,
    mainThemes: ["Divine origins of Quran", "Struggles of Prophets", "Warning to poets who lead astray"],
    keyTopics: ["Musa's stick turning to snake", "Stories of Ibrahim, Nuh, Hud, Salih, Lut & Shuaib", "Poets who speak but do not act"]
  },
  27: {
    number: 27,
    placeOfRevelation: "Makkah",
    revelationOrder: 48,
    mainThemes: ["Revelation & guidance", "Gifts given to prophets", "Struggle against arrogance"],
    keyTopics: ["Dawud and Sulayman's kingdom", "Queen of Sheba (Bilqis) story", "The Ants and Hoopoe bird", "Miracle of the camel of Salih"]
  },
  28: {
    number: 28,
    placeOfRevelation: "Makkah",
    revelationOrder: 49,
    mainThemes: ["Trust in Allah's promise", "Destruction of tyrants", "True source of wealth"],
    keyTopics: ["Musa's mother putting him in river", "Musa's marriage in Madyan", "Defeat of Qarun (Korah)", "Guidance belongs to Allah"]
  },
  29: {
    number: 29,
    placeOfRevelation: "Makkah",
    revelationOrder: 85,
    mainThemes: ["Trial of faith & patience", "Parental duties in Islam", "Stories of the spiders & web"],
    keyTopics: ["Belief tested by trials", "Struggle of Ibrahim with fire", "Noah's 950 years preaching", "Parable of the weak Spider's Web"]
  },
  30: {
    number: 30,
    placeOfRevelation: "Makkah",
    revelationOrder: 84,
    mainThemes: ["Prophecy of Roman victory", "Allah's signs in marriage/nature", "Rejection of interest (Riba)"],
    keyTopics: ["Defeat & victory of Byzantine Empire", "Marriage as source of peace", "Warning against corruption (Fasad)", "Prohibition of interest"]
  },
  31: {
    number: 31,
    placeOfRevelation: "Makkah",
    revelationOrder: 57,
    mainThemes: ["Wisdom of Luqman", "Admonition to children", "Allah's vast knowledge"],
    keyTopics: ["Luqman's advice to his son", "Avoid Shirk (Polytheism)", "Respecting parents", "The five keys to unseen things"]
  },
  32: {
    number: 32,
    placeOfRevelation: "Makkah",
    revelationOrder: 75,
    mainThemes: ["Truthfulness of Resurrection", "Worship in the night", "Fate of believers vs sinners"],
    keyTopics: ["Heavens and earth creation", "Night prayers (Tahajjud)", "Submission to Allah's command", "The spirit blown into Adam"]
  },
  33: {
    number: 33,
    placeOfRevelation: "Madinah",
    revelationOrder: 90,
    mainThemes: ["Battle of Allies (Ahzab)", "Status of Prophet's wives", "Islamic social laws"],
    keyTopics: ["Miraculous wind at Ahzab Battle", "Status of Ummahat-ul-Mu'minin", "Abolishing pre-Islamic adoption customs", "Finality of Prophethood"]
  },
  34: {
    number: 34,
    placeOfRevelation: "Makkah",
    revelationOrder: 58,
    mainThemes: ["Allah's absolute control", "David and Solomon's blessings", "People of Saba (Sheba) collapse"],
    keyTopics: ["Mountains and birds singing with Dawud", "Jinns working for Sulayman", "The Flood of Arim (Saba)", "Satan's deception warning"]
  },
  35: {
    number: 35,
    placeOfRevelation: "Makkah",
    revelationOrder: 43,
    mainThemes: ["Allah's creative power", "Creation of Angels", "True source of honor"],
    keyTopics: ["Angels with wings", "Wind & rain blessings", "Difference between light & dark", "Allah's independence and man's need"]
  },
  36: {
    number: 36,
    placeOfRevelation: "Makkah",
    revelationOrder: 41,
    mainThemes: ["Prophethood of Muhammad ﷺ", "People of the Town warning", "Signs of nature & resurrection"],
    keyTopics: ["Three prophets sent to a town", "Story of Habib the Believer", "Day & night cycles", "Description of Heaven and Hell"]
  },
  37: {
    number: 37,
    placeOfRevelation: "Makkah",
    revelationOrder: 56,
    mainThemes: ["Monotheism arguments", "Submission to Allah", "Stories of the prophets"],
    keyTopics: ["Ranks of Angels", "Ibrahim's sacrifice of his son", "Musa, Harun, Ilyas & Lut stories", "Prophet Yunus swallowed by whale"]
  },
  38: {
    number: 38,
    placeOfRevelation: "Makkah",
    revelationOrder: 38,
    mainThemes: ["Sincerity in faith", "Arrogance leading to ruin", "Dialogue of creation in heaven"],
    keyTopics: ["Prophets Dawud & Sulayman", "Trial of Prophet Ayyub's illness", "Adam's creation & Iblis's refusal", "The promise of Satan to mislead"]
  },
  39: {
    number: 39,
    placeOfRevelation: "Makkah",
    revelationOrder: 59,
    mainThemes: ["Pure sincerity in worship", "Forgiveness of all sins", "Triumph of the believers"],
    keyTopics: ["Parable of masters with conflicting commands", "Don't despair of Allah's mercy", "The trumpet blast of Judgment Day", "Believers entered into Jannah"]
  },
  40: {
    number: 40,
    placeOfRevelation: "Makkah",
    revelationOrder: 60,
    mainThemes: ["Forgiveness & punishment", "Believers of Pharaoh's house", "Call to supplicate Allah"],
    keyTopics: ["Angels carrying the Throne praying for believers", "Dialogue between Musa and Pharaoh", "Supplication is worship", "Consequence of pride"]
  },
  114: {
    number: 114,
    placeOfRevelation: "Makkah",
    revelationOrder: 21,
    mainThemes: ["Protection from Satan's whispers", "Sovereignty of Allah"],
    keyTopics: ["Whispers of devils", "Seeking refuge in the Lord of mankind", "Evil of human and Jinn tempters"]
  }
};
