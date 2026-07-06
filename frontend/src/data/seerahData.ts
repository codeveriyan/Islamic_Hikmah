export type SeerahEra =
  | "pre-islamic"
  | "early-life"
  | "meccan"
  | "medinan"
  | "final-years";

export type SeerahChapter = {
  id: string;
  era: SeerahEra;
  order: number;
  title: string;
  arabicTitle: string;
  icon: string;
  description: string;
  readMinutes: number;
  content: string;
};

export const ERA_LABELS: Record<SeerahEra, string> = {
  "pre-islamic": "Pre-Islamic Arabia",
  "early-life": "Early Life",
  meccan: "Meccan Period",
  medinan: "Medinan Period",
  "final-years": "Final Years",
};

export const ERA_COLORS: Record<SeerahEra, string> = {
  "pre-islamic": "#92400E",
  "early-life": "#065F46",
  meccan: "#1E40AF",
  medinan: "#7C3AED",
  "final-years": "#B45309",
};

export const ERA_ICONS: Record<SeerahEra, string> = {
  "pre-islamic": "earth",
  "early-life": "baby-face-outline",
  meccan: "star-crescent",
  medinan: "city-variant-outline",
  "final-years": "weather-sunset",
};

export const SEERAH_CHAPTERS: SeerahChapter[] = [
  // ────────────────────────────────────────────────────────────────
  // ERA 1 — PRE-ISLAMIC ARABIA
  // ────────────────────────────────────────────────────────────────
  {
    id: "arabian-peninsula",
    era: "pre-islamic",
    order: 1,
    title: "The Arabian Peninsula",
    arabicTitle: "شبه الجزيرة العربية",
    icon: "earth",
    description: "The geography, tribes, and culture of Arabia before Islam.",
    readMinutes: 6,
    content: `Arabia — the land that would give birth to the final Prophet ﷺ — occupies the southwestern corner of Asia. It is a vast peninsula of roughly one million square miles, surrounded by the Red Sea to the west, the Arabian Gulf to the east, and the Indian Ocean to the south.

**The Land**

The interior is largely desert — the Rub' al-Khali (Empty Quarter) in the south is among the world's largest continuous sand deserts. Yet the Hejaz region along the western coast includes mountains and fertile valleys. Makkah, the spiritual heart of the world, sits in one such valley between barren, rocky mountains.

**The People — Arabs and Their Origins**

The Arabs are divided into two major branches:

1. **Al-'Arab al-Ba'idah** (the Perished Arabs) — ancient tribes like 'Ad, Thamud, Tasm and Jadis who flourished and then perished due to their transgression against Allah.

2. **Al-'Arab al-Baqiyah** (the Surviving Arabs):
   - *Qahtaniyyeen* (Qahtanites) — descendants of Qahtan (Biblical Joktan), who settled in Yemen
   - *'Adnaniyyeen* (Adnanites) — descendants of Isma'il ibn Ibrahim ﷺ, the ancestors of the Prophet Muhammad ﷺ

**The Tribes of Makkah**

The Quraysh were the dominant tribe of Makkah, responsible for the service of the Ka'bah and the leadership of Makkah. The Prophet ﷺ was from the noblest clan of the Quraysh — Banu Hashim.

**The Religion of Pre-Islamic Arabia**

The Arabian Peninsula before Islam was a land steeped in ignorance — the age known as Jahiliyyah. Though the Arabs were descendants of Ibrahim ﷺ and Isma'il ﷺ, over centuries they had turned away from pure monotheism:

- Idolatry was widespread. The Ka'bah, which Ibrahim ﷺ had built as a house of worship to Allah alone, was surrounded by 360 idols.
- The greatest idols were Hubal (inside the Ka'bah), Lat, Uzza, and Manat.
- Despite this, traces of Hanifiyyah (the original religion of Ibrahim) remained among a few individuals.

**Social Conditions**

Arab society was tribal in nature. The tribe was the basic unit — loyalty to one's tribe was paramount. Blood feuds could last generations. Women were often treated as property; the practice of burying infant daughters alive (wa'd al-banat) was prevalent in some areas.

Yet the Arabs also had noble qualities — extraordinary hospitality (karam), eloquence in poetry, fierce courage, and a deep sense of honour. Allah would purify and channel these qualities through the message of Islam.

**Economic Life**

Trade was the lifeblood of Arabian economy. Makkah sat at the crossroads of major trade routes. The Quraysh led two great trade caravans each year — one to Syria in summer and one to Yemen in winter, mentioned in Surah Quraysh: "For the accustomed security of the Quraysh — their accustomed security [in] the caravan of winter and summer." (Quran 106:1-2)

**The Stage Is Set**

Into this world — torn between the superpowers of Byzantium (Rome) and Persia, plagued by idolatry, inequality, and injustice — Allah would send the final and greatest of all Prophets, Muhammad ibn Abdullah ﷺ, as a mercy to all of mankind.`,
  },
  {
    id: "lineage-of-the-prophet",
    era: "pre-islamic",
    order: 2,
    title: "The Noble Lineage",
    arabicTitle: "النسب الشريف",
    icon: "family-tree",
    description: "The pure and noble ancestry of the Prophet Muhammad ﷺ.",
    readMinutes: 4,
    content: `Allah chose the noblest of lineages for His final Messenger. The Prophet Muhammad ﷺ said: "Allah chose Kinanah from the children of Isma'il, He chose Quraysh from Kinanah, He chose Banu Hashim from Quraysh, and He chose me from Banu Hashim." (Muslim)

**The Full Lineage**

Muhammad ibn Abdullah ibn Abdul-Muttalib ibn Hashim ibn Abd Manaf ibn Qusayy ibn Kilab ibn Murrah ibn Ka'b ibn Lu'ayy ibn Ghalib ibn Fihr (Quraysh) ibn Malik ibn an-Nadr ibn Kinanah... continuing back to Isma'il ibn Ibrahim ﷺ.

**Key Ancestors**

**Qusayy ibn Kilab** — approximately 400 CE, he was the first Qurayshi leader to consolidate authority over Makkah. He united the Quraysh and established their guardianship of the Ka'bah. He built the Dar al-Nadwa (Council House) and instituted the key positions of Makkah: the custodianship of the Ka'bah (Sidanah), the watering of pilgrims (Siqayah), and the feeding of pilgrims (Rifadah).

**Abd Manaf** — Qusayy's son, who further strengthened Qurayshi prestige.

**Hashim** — After whom the Banu Hashim clan is named. He was famous for his generosity and established the two great trading caravans. He was the great-grandfather of the Prophet ﷺ. Hashim died in Gaza, Palestine, on one of his trading journeys.

**Abdul-Muttalib** — The grandfather of the Prophet ﷺ. He was a towering figure in Makkah. He rediscovered the Well of Zamzam through a dream. He made a vow that if he had ten sons who grew to manhood, he would sacrifice one of them to Allah — leading to the famous story of Abdullah's near-sacrifice. He died when the Prophet ﷺ was eight years old.

**Abdullah** — The father of the Prophet ﷺ. He was the most beloved of Abdul-Muttalib's sons. He married Aminah bint Wahb from Banu Zuhrah. He died either before the Prophet's birth (the more accepted view) or shortly after, on a trading journey to Madinah, leaving no inheritance except his slave girl Barakah (Umm Ayman) and a few camels.

**Aminah bint Wahb** — The mother of the Prophet ﷺ. She was from Banu Zuhrah of the Quraysh, a woman of status and virtue. She died when the Prophet ﷺ was six years old, on the return journey from visiting relatives in Yathrib (Madinah).

**A Lineage of Light**

The Prophet ﷺ described his lineage as passing through the finest of each generation: "I was sent from the best generations of the children of Adam, generation after generation, until I was sent from the generation I am from." (Bukhari)

This noble lineage was not mere ancestry — it was a preparation. Allah ensured that the vessel carrying the final message would be the purest of vessels.`,
  },

  // ────────────────────────────────────────────────────────────────
  // ERA 2 — EARLY LIFE
  // ────────────────────────────────────────────────────────────────
  {
    id: "birth-of-the-prophet",
    era: "early-life",
    order: 3,
    title: "The Birth of the Prophet ﷺ",
    arabicTitle: "مولد النبي ﷺ",
    icon: "star",
    description:
      "The miraculous circumstances surrounding the birth of Muhammad ﷺ.",
    readMinutes: 5,
    content: `The Prophet Muhammad ﷺ was born in Makkah on Monday, the 12th of Rabi' al-Awwal in the Year of the Elephant — corresponding to approximately 570 CE.

**The Year of the Elephant**

The year of his birth is named for a remarkable event. Abraha, the Abyssinian Christian ruler of Yemen, led a massive army including war elephants toward Makkah to destroy the Ka'bah. Allah repelled them with flocks of birds (ababeel) that pelted the army with stones of baked clay, destroying them utterly — as recorded in Surah al-Fil (The Elephant) in the Quran. This was a divine sign preceding the birth of the greatest of all Prophets.

**Miraculous Signs**

His mother Aminah reported that when she was pregnant, she saw a light emerge from her that illuminated the castles of Busra in Syria. The Prophet ﷺ later said: "I am the supplication of my father Ibrahim, and the good tidings of 'Isa ibn Maryam (Jesus)." (Ahmad)

**His Birth**

He was born an orphan — his father Abdullah had passed away before his birth. His grandfather Abdul-Muttalib came and took the newborn, carried him to the Ka'bah, gave thanks to Allah, and named him Muhammad — a name previously almost unknown among the Arabs, meaning "the praised one."

**Suckling and Early Childhood**

Following Arab custom, the newborn was sent to the desert for nursing. A woman named Halimah al-Sa'diyya from the Banu Sa'd tribe took him into her care. From the moment Muhammad ﷺ arrived in Halimah's household, blessings multiplied — her previously dry she-camel gave abundant milk, their barren land became fertile, and her family prospered.

**The Opening of the Chest (Shaqq al-Sadr)**

While living with the Banu Sa'd, when the Prophet ﷺ was approximately four years old, two angels appeared and opened his chest. They extracted his heart, removed a black clot from it (representing the share of Shaytan), and washed his heart with Zamzam water in a golden vessel before returning it. After this event, Halimah returned Muhammad ﷺ to his mother Aminah, fearing for his safety.

**The Death of His Mother**

When the Prophet ﷺ was six years old, his mother Aminah took him to Yathrib (Madinah) to visit her relatives and the grave of his father Abdullah. On the return journey, she fell ill and passed away at a place called Al-Abwa'. He was now fully an orphan.

**Under His Grandfather's Care**

After the death of his mother, Abdul-Muttalib took charge of the young Muhammad ﷺ with extraordinary love and tenderness. The old chief would make a special seat for the boy next to him and treat him with honour that surprised even his own sons. But this companionship was brief — Abdul-Muttalib died when the Prophet ﷺ was eight years old.

**Under His Uncle Abu Talib**

According to Abdul-Muttalib's instructions, the young Muhammad ﷺ was entrusted to his uncle Abu Talib, who became his guardian and protector. Abu Talib treated him as his own son and remained his protector — though never accepting Islam — until his death.

**The Journey to Syria**

When the Prophet ﷺ was around twelve years old, he accompanied Abu Talib on a trading journey to Syria. In Busra, a Christian monk named Bahira recognized signs of prophethood upon the boy and warned Abu Talib to protect him from the Jews, saying, "Take your nephew back, for by Allah, if they see him and know about him what I know, they will do him evil."`,
  },
  {
    id: "youth-and-character",
    era: "early-life",
    order: 4,
    title: "Youth, Character & Marriage",
    arabicTitle: "الشباب والخُلُق والزواج",
    icon: "account-heart",
    description:
      "The exemplary character of the young Muhammad ﷺ and his marriage to Khadijah.",
    readMinutes: 6,
    content: `Even before prophethood, Muhammad ﷺ was known throughout Makkah for his extraordinary character. He was called "Al-Amin" — the Trustworthy — and "Al-Sadiq" — the Truthful.

**His Character Before Prophethood**

Allah had prepared His final Prophet with the finest qualities:

- **Truthfulness**: He never spoke a lie his entire life. Even his enemies — who would later fiercely oppose him — never accused him of lying.
- **Trustworthiness**: People of Makkah entrusted him with their valuables. Even on the night of the Hijrah, he asked Ali to remain behind to return people's deposits.
- **Generosity**: He was known for his giving nature.
- **Gentleness and Mercy**: He had a deep compassion for the weak and poor.
- **Intelligence and Wisdom**: He was thoughtful and measured in all affairs.

**Hilf al-Fudul (League of the Virtuous)**

Around age fifteen, Muhammad ﷺ participated in an alliance formed by several Qurayshi clans to protect the rights of the oppressed and ensure fair dealings in Makkah. After prophethood, he said: "I witnessed a pact of justice in the house of Abdullah ibn Jud'an... Had I been invited to it during Islam, I would have responded." (Bayhaqi)

**Herding Sheep**

Like many prophets before him, the young Muhammad ﷺ herded sheep for the people of Makkah. This life — patient, watchful, responsible for the welfare of those in his care — was Allah's preparation for shepherding an entire ummah.

**Khadijah bint Khuwaylid رضي الله عنها**

Khadijah was a wealthy, noble widow of Makkah known for her own virtue and intelligence. She would hire men to trade on her behalf. Having heard of Muhammad's impeccable honesty, she hired him to lead her caravan to Syria.

Her servant Maysarah accompanied the trip and returned with glowing reports of the young man's character, honesty, and the blessings that seemed to follow him. A cloud reportedly shaded him from the sun during the journey.

Khadijah, deeply impressed, proposed marriage to Muhammad ﷺ through an intermediary. He was twenty-five years old; she was forty. He accepted, and they were married — a union that would become a model of love, respect, and partnership.

**Their Children**

Together, they had six children:
- **Al-Qasim** — who died in infancy (the Prophet ﷺ was often called Abu al-Qasim)
- **Zaynab, Ruqayyah, Umm Kulthum, Fatimah** — four daughters
- **Abdullah** — also called at-Tayyib and at-Tahir, who also died in infancy

**Khadijah's Role**

For twenty-five years, until her death, Khadijah was the Prophet's only wife. She was his greatest supporter, his comfort in trial, and the first person to believe in him. After her death, the Prophet ﷺ continued to honour her memory throughout his life. He once said: "She believed in me when people disbelieved me, she trusted me when people considered me a liar, she provided for me when people deprived me, and Allah blessed me with children through her." (Ahmad)

**The Rebuilding of the Ka'bah**

When the Prophet ﷺ was approximately thirty-five years old, the Quraysh rebuilt the Ka'bah after it had been damaged by floods. A dispute arose: which clan would have the honour of placing the Black Stone (al-Hajar al-Aswad) back in its corner? They agreed to let the first person to enter the sanctuary decide. That person was Muhammad ﷺ.

He placed the Black Stone on a cloth, asked a representative from each clan to hold a corner, and together they lifted it to its position — he then placed the Stone with his own blessed hands. This wisdom averted what could have been a bloody conflict.`,
  },

  // ────────────────────────────────────────────────────────────────
  // ERA 3 — MECCAN PERIOD
  // ────────────────────────────────────────────────────────────────
  {
    id: "first-revelation",
    era: "meccan",
    order: 5,
    title: "The First Revelation",
    arabicTitle: "نزول الوحي",
    icon: "book-open-variant",
    description:
      "The night that changed history — the descent of the first revelation in the Cave of Hira.",
    readMinutes: 5,
    content: `As he approached forty, Muhammad ﷺ increasingly sought solitude and contemplation. He would retreat to the Cave of Hira on Mount Nur, a mountain two miles from Makkah, spending days alone in worship and reflection. Khadijah would send food and water with him.

**The Night of 21 Ramadan, 610 CE**

During one of these retreats, in the month of Ramadan, the Archangel Jibril (Gabriel) ﷺ appeared to him.

Jibril embraced him tightly and said: *"Iqra!"* (Read! / Recite!)

Muhammad ﷺ replied: *"Ma ana bi-qari"* (I do not read / I am not one who reads.)

Jibril embraced him again tightly and released him: *"Iqra!"*

Again: *"Ma ana bi-qari."*

A third embrace, then:

**"Iqra' bismi rabbika alladhi khalaq — Khalaqa l-insana min 'alaq — Iqra' wa rabbuka l-akram — Alladhi 'allama bil-qalam — 'Allama l-insana ma lam ya'lam."**

*"Read in the name of your Lord who created — Created man from a clinging substance — Read, and your Lord is the Most Generous — Who taught by the pen — Taught man that which he knew not."* (Quran 96:1-5)

These were the first five verses of the Quran ever revealed — the beginning of a revelation that would continue for twenty-three years.

**The Return to Khadijah**

The Prophet ﷺ returned home trembling, deeply shaken by the experience. He said to Khadijah: *"Zammiluni, zammiluni"* (Cover me, cover me).

She wrapped him in a cloak until the trembling subsided, then he told her everything that had happened and said, "I fear for myself."

Khadijah — in one of the most beautiful moments in Islamic history — responded with profound faith and wisdom:

*"By Allah, Allah will never disgrace you. You maintain the ties of kinship, you speak the truth, you bear the burdens of others, you help the destitute, you honour your guests, and you help those stricken by calamity."* (Bukhari)

She then took him to her cousin Waraqah ibn Nawfal, an elderly scholar who had studied the previous scriptures. Waraqah, upon hearing the account, said: "This is the Namus (the Angel of Revelation) whom Allah sent to Musa (Moses). I wish I were young! I wish I could be alive when your people drive you out."

"Will they drive me out?" Muhammad ﷺ asked.

"Yes! No man has ever come with what you have come with except that he was opposed and persecuted. If I live to see that day, I will support you with all my strength."

**The Pause in Revelation (Fatrah)**

After the first revelation, there was a pause — a period of silence from Jibril ﷺ. This caused great distress to the Prophet ﷺ. Then the second revelation came, from Surah al-Muddaththir: *"O you who covers himself — Rise and warn. And your Lord glorify. And your garments purify. And impurity avoid."* (74:1-5)

This marked the beginning of his mission — to warn, to call, to purify.

**The Significance of Iqra**

The command to read — in a society where the Prophet ﷺ himself was unlettered — pointed to something profound. The message of Islam would be a message of knowledge, learning, and the pen. The very first word of revelation was a command to engage with knowledge in the name of the Creator.`,
  },
  {
    id: "early-islam",
    era: "meccan",
    order: 6,
    title: "The Early Muslims",
    arabicTitle: "السابقون الأولون",
    icon: "account-group",
    description:
      "The first converts to Islam and the beginning of the secret call.",
    readMinutes: 5,
    content: `The Prophet ﷺ began calling to Islam in secret, starting with those closest to him.

**The First Believers**

1. **Khadijah bint Khuwaylid رضي الله عنها** — The first person to accept Islam. She was the first to believe without a moment's hesitation.

2. **Ali ibn Abi Talib رضي الله عنه** — The first child to accept Islam. He was around ten years old and was living in the Prophet's household.

3. **Zayd ibn Harithah رضي الله عنه** — The Prophet's freed slave and adopted son. The first freed slave to accept Islam.

4. **Abu Bakr al-Siddiq رضي الله عنه** — The first free adult male to accept Islam. His immediate acceptance was not surprising — he was already the Prophet's closest friend and knew his character better than anyone. Abu Bakr's faith was so strong that when he was told the Prophet ﷺ had received revelation, he said, "If he says so, then it is true." (Ibn Hisham). He immediately began calling others.

**The Conversions Through Abu Bakr**

Through Abu Bakr's efforts, several of the greatest companions accepted Islam:
- Uthman ibn Affan
- Zubayr ibn al-Awwam
- Abd al-Rahman ibn Awf
- Sa'd ibn Abi Waqqas
- Talha ibn Ubaydullah

These five, along with Abu Bakr, were among the ten companions given the glad tidings of Paradise.

**Three Years of Secret Da'wah**

For three years, the Prophet ﷺ called to Islam privately. Muslims would gather at the House of Al-Arqam ibn Abi al-Arqam near the hill of Safa to learn, pray, and support one another.

During this period, remarkable souls embraced Islam:
- **Bilal ibn Rabah** — An Abyssinian slave, who would later become the first muezzin of Islam.
- **Ammar ibn Yasir and his family** — Among the first to suffer open persecution.
- **Sumayyah bint Khayyat** — Ammar's mother, the first martyr in Islam, killed by Abu Jahl.

**The First Public Call**

After three years, Allah commanded: *"Proclaim what you have been commanded and turn away from the polytheists."* (15:94)

The Prophet ﷺ climbed Mount Safa and called out: *"Ya Sabaha!"* — the cry used to warn of danger. The Quraysh gathered. He asked them: "If I told you that an army is about to attack you from behind these mountains, would you believe me?"

"Yes," they said, "for we have never known you to lie."

He then announced: "I am a warner to you before a severe punishment."

His uncle Abu Lahab shouted: *"Tabban lak!"* (Perish! May you be ruined!) — and walked away. Shortly after, Surah al-Masad was revealed about Abu Lahab and his wife.

This was the beginning of open, public opposition to Islam.`,
  },
  {
    id: "persecution-of-muslims",
    era: "meccan",
    order: 7,
    title: "The Persecution of Muslims",
    arabicTitle: "اضطهاد المسلمين",
    icon: "shield-cross",
    description:
      "The trials and tortures endured by the early Muslims at the hands of the Quraysh.",
    readMinutes: 6,
    content: `As the message of Islam spread, the Quraysh — whose power, prestige, and livelihood were tied to the idols of the Ka'bah — became increasingly hostile. Their persecution was ruthless and sustained.

**Why the Quraysh Opposed Islam**

Islam threatened the foundations of their society:
- **Economic**: The Ka'bah and its idols drew pilgrims from all over Arabia, enriching Makkah.
- **Political**: Their leadership was based on tribal hierarchy that Islam dismantled.
- **Social**: Islam's message of equality challenged their aristocratic structure.
- **Personal Pride**: They could not accept that one of their own claimed prophethood.

**Methods of Persecution**

The Quraysh used every means available:
- **Ridicule and mockery**: They called the Prophet a sorcerer, a poet, a madman.
- **Economic boycott**: Muslim merchants were cut off.
- **Physical torture**: Particularly targeting those without tribal protection — slaves and the poor.
- **Psychological torture**: Social isolation and slander.

**The Martyrs**

**Sumayyah bint Khayyat** — An elderly slave woman, Sumayyah and her husband Yasir were brutally tortured daily. One day, Abu Jahl stabbed Sumayyah with a spear, making her the first martyr in Islam. The Prophet ﷺ would pass by them and say: *"Be patient, O family of Yasir! Your appointment is Paradise."*

**Bilal ibn Rabah** — His master Umayyah ibn Khalaf would drag him into the scorching desert heat, place a heavy rock on his chest, and demand he deny Muhammad ﷺ. Bilal would say only: *"Ahad! Ahad!"* (One! One! — referring to Allah). Abu Bakr purchased Bilal's freedom and freed him.

**Khabbab ibn al-Aratt** — He was beaten, his hair was grabbed, and hot coal was placed under his back until the coals were extinguished by his own flesh.

**The Migration to Abyssinia (615 CE)**

Unable to bear the persecution, the Prophet ﷺ advised his companions to migrate to Abyssinia (Ethiopia), ruled by the just Christian king Negus (al-Najashi). A group of about 15 Muslims made the first migration. A larger group of 83 men and 18 women followed.

The Quraysh sent two envoys — Amr ibn al-'As and Abdullah ibn Abi Rabia — to convince the Negus to return the Muslims. The Negus heard both sides. The Muslims' spokesman Ja'far ibn Abi Talib recited the opening verses of Surah Maryam (19) — about the Virgin Mary. The Negus wept until his beard was wet and said: "The difference between what we believe about Jesus and what you say is no greater than this line" — and drew a line on the ground. He refused to hand over the Muslims.

**The Year of Sorrow (619 CE)**

In the tenth year of prophethood, two devastating losses struck the Prophet ﷺ within weeks of each other:

- **Khadijah رضي الله عنها died** — The Prophet ﷺ lost his greatest supporter and beloved wife of 25 years.
- **Abu Talib died** — His uncle and protector, who, despite never accepting Islam, had shielded the Prophet from the worst of Qurayshi violence.

Without Abu Talib's protection, the Prophet ﷺ became increasingly vulnerable. Abu Lahab, who succeeded as clan chief, withdrew the clan's protection. The Prophet ﷺ was pelted with stones when he tried to seek support in Ta'if — and Allah sent the Angel of the Mountains offering to crush the people of Ta'if between two mountains. The Prophet ﷺ refused, saying: *"I hope that Allah will bring from their descendants people who will worship Allah alone."*

It was in this period of profound grief that Allah granted His beloved Prophet the miraculous Night Journey and Ascension.`,
  },
  {
    id: "isra-and-miraj",
    era: "meccan",
    order: 8,
    title: "The Night Journey & Ascension",
    arabicTitle: "الإسراء والمعراج",
    icon: "star-shooting",
    description:
      "The miraculous journey from Makkah to Jerusalem and the ascension through the heavens.",
    readMinutes: 7,
    content: `Among the most extraordinary events in prophetic history, al-Isra' wal-Mi'raj — the Night Journey and Ascension — was a divine gift to the Prophet ﷺ at the darkest moment of his mission.

Allah says: *"Exalted is He who took His Servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa, whose surroundings We have blessed, to show him of Our signs."* (Quran 17:1)

**Al-Isra' — The Night Journey**

The Prophet ﷺ was taken on the back of al-Buraq — a white, luminous creature larger than a donkey but smaller than a mule — from the Masjid al-Haram in Makkah to al-Masjid al-Aqsa in Jerusalem, in an instant.

In Jerusalem, he was received by the previous prophets. He led them in prayer — as their Imam — a sign that he was the seal and greatest of all prophets. He was then offered vessels of wine, milk, and honey. He chose the milk — Jibril said: *"You chose the fitrah (natural disposition). Had you chosen wine, your ummah would have gone astray."*

**Al-Mi'raj — The Ascension**

From Jerusalem, the Prophet ﷺ was taken up through the seven heavens by Jibril ﷺ:

- **1st Heaven**: He met Adam ﷺ, who wept over his righteous and unrighteous children.
- **2nd Heaven**: He met Yahya (John the Baptist) ﷺ and 'Isa (Jesus) ﷺ — cousins in lineage.
- **3rd Heaven**: He met Yusuf (Joseph) ﷺ, who was given half of all beauty.
- **4th Heaven**: He met Idris ﷺ.
- **5th Heaven**: He met Harun (Aaron) ﷺ.
- **6th Heaven**: He met Musa (Moses) ﷺ, who wept at seeing the Prophet ﷺ, saying his ummah would enter Paradise in greater numbers than Musa's.
- **7th Heaven**: He met Ibrahim ﷺ, leaning against al-Bayt al-Ma'mur (the Celestial House of Worship, which 70,000 angels visit each day, never returning).

**Sidrat al-Muntaha (The Lote Tree of the Utmost Boundary)**

Jibril ﷺ could go no further. The Prophet ﷺ was taken beyond — to a place where Jibril ﷺ said his wings would be scorched if he proceeded. The Prophet ﷺ came within "two bow lengths or nearer" to his Lord. (Quran 53:9)

**The Gift of Prayer**

In this meeting, Allah prescribed fifty daily prayers on the Prophet's ummah. On the descent, Musa ﷺ urged the Prophet to return and negotiate a reduction, knowing the weakness of human beings. The Prophet ﷺ went back and forth, until the prayers were reduced to five — yet Allah declared they would carry the reward of fifty. *"My command does not change."*

**The Reaction in Makkah**

When the Prophet ﷺ described his journey, many disbelievers ridiculed him. Even some who had claimed to be Muslim apostasized. But Abu Bakr, upon hearing the account, immediately said: *"If he says so, then I believe him"* — earning him the title "Al-Siddiq" (the Great Truthbearer).

The Quraysh demanded proof. The Prophet ﷺ described al-Masjid al-Aqsa in precise detail — detail confirmed by those who had visited Jerusalem.

**The Pledges of 'Aqabah**

During the Hajj season, the Prophet ﷺ met groups of men from Yathrib (Madinah) who had been softened by hearing about Islam from Jewish neighbours. At al-'Aqabah near Mina:

- **First Pledge (621 CE)**: Twelve men pledged not to associate partners with Allah, not to steal, fornicate, kill their children, slander, or disobey the Prophet ﷺ in good.
- **Second Pledge (622 CE)**: Seventy-three men and two women pledged to protect the Prophet as they would their own families. This opened the door to Hijrah.`,
  },
  {
    id: "hijrah",
    era: "meccan",
    order: 9,
    title: "The Great Migration (Hijrah)",
    arabicTitle: "الهجرة المباركة",
    icon: "map-marker-path",
    description:
      "The historic migration of the Prophet ﷺ and his companions from Makkah to Madinah.",
    readMinutes: 7,
    content: `The Hijrah — the migration from Makkah to Madinah in 622 CE — marks such a pivotal moment in Islamic history that Umar ibn al-Khattab رضي الله عنه established it as the beginning of the Islamic calendar.

**The Quraysh Plot to Kill the Prophet**

As the Muslims began migrating to Madinah, the Quraysh convened an emergency council in Dar al-Nadwa. They agreed on a plan: one man from each major tribe would simultaneously strike the Prophet ﷺ, so that the blood guilt would be spread among all tribes and Banu Hashim could not seek revenge from any single tribe.

Jibril ﷺ came to the Prophet ﷺ and revealed the plot. Allah permitted the Hijrah.

**The Night of Migration**

The Prophet ﷺ asked Abu Bakr رضي الله عنه to accompany him. He had Ali رضي الله عنه sleep in his bed wearing his green cloak, to deceive the assassins gathered outside.

*"And when those who disbelieved plotted against you to restrain you or kill you or evict you — they plot and Allah plans, and Allah is the best of planners."* (Quran 8:30)

The Prophet ﷺ and Abu Bakr slipped out of the house as the men waited outside. The Prophet ﷺ recited from Surah Ya-Sin and Allah veiled their sight — they saw nothing as he walked right past them.

**The Cave of Thawr**

They took an unexpected southern route — opposite to Madinah — to confuse their pursuers. They hid for three days in the Cave of Thawr. The Quraysh offered a reward of 100 camels for their capture. Trackers followed their trail to the cave entrance.

Abu Bakr رضي الله عنه whispered in fear: *"O Messenger of Allah! If any of them looks at their feet, they will see us."*

The Prophet ﷺ replied with complete serenity: *"What do you think of two when Allah is their third?"* (Bukhari)

*"If you do not aid the Prophet — Allah has already aided him... then Allah sent down His tranquility upon him and supported him with soldiers you did not see."* (Quran 9:40)

A spider had spun its web over the cave entrance. A dove had nested there. The trackers, seeing these signs of undisturbed nature, concluded no one had entered and turned back.

**The Journey to Madinah**

After three days, they set out with their guide Abdullah ibn Urayqit. They travelled an unfamiliar coastal route. On the way, they passed by the tent of Umm Ma'bad al-Khuza'iyya. She was a generous woman who offered hospitality to travellers but had nothing to offer — her flocks were depleted. The Prophet ﷺ asked her permission and milked her barren she-goat, which miraculously gave abundant milk.

**Arrival in Quba (8 Rabi' al-Awwal / September 622 CE)**

After a journey of approximately 12 days, the Prophet ﷺ arrived at Quba, a village on the outskirts of Madinah. He stayed there for several days and established the first mosque in Islam — Masjid Quba, about which Allah said: *"A mosque founded on righteousness from the first day is more worthy for you to stand in."* (Quran 9:108)

**Arrival in Madinah**

The Prophet ﷺ mounted his camel al-Qaswa and entered Madinah. The people of Madinah — the Ansar — came out to receive him with overwhelming joy. Men, women, and children lined the streets. The women sang: *"The full moon has risen over us from the direction of Thaniyyat al-Wada' — gratitude is binding upon us, as long as one calls to Allah."*

The Prophet ﷺ let his camel roam freely and said he would stay wherever she stopped. She stopped at an open ground belonging to two orphan boys of Banu al-Najjar. The Prophet ﷺ purchased the land and built his mosque — al-Masjid al-Nabawi — there.

The Hijrah was complete. A new chapter of Islam — the Medinan chapter — had begun.`,
  },

  // ────────────────────────────────────────────────────────────────
  // ERA 4 — MEDINAN PERIOD
  // ────────────────────────────────────────────────────────────────
  {
    id: "building-madinah",
    era: "medinan",
    order: 10,
    title: "Building the New Society",
    arabicTitle: "بناء المجتمع الجديد",
    icon: "city-variant",
    description:
      "The Prophet ﷺ establishes a mosque, brotherhood, and constitution in Madinah.",
    readMinutes: 6,
    content: `Arriving in Madinah, the Prophet ﷺ immediately set about constructing the foundations of a new society — a society based on faith, justice, and brotherhood.

**Al-Masjid al-Nabawi — The Prophet's Mosque**

The mosque was built on the land purchased from two orphan boys. The Prophet ﷺ himself participated in the construction, carrying bricks alongside his companions. He was heard chanting: *"O Allah, there is no life but the life of the Hereafter — so forgive the Ansar and the Muhajirin."* It was built of palm trunks, mud bricks, and palm leaf roofing.

The mosque was not only a place of worship — it was the political and social center of the new Muslim community: a school, a court, a place for consultation, and a refuge for the poor (the People of the Suffah who lived in its courtyard).

**Al-Mu'akhah — The Brotherhood**

The Muhajirin (migrants from Makkah) had arrived with little — leaving behind their wealth, properties, and extended families. The Ansar (helpers of Madinah) had opened their hearts and homes.

The Prophet ﷺ paired each Muhajir with an Ansar as brothers. This was not merely symbolic — the Ansar offered to literally share their wealth, even offering one of their wives as a spouse if the Muhajir wished. The generosity was extraordinary. Anas ibn Malik's brother Abd al-Rahman ibn Awf was paired with Sa'd ibn al-Rabi'. Sa'd offered to split everything. Abd al-Rahman said: "May Allah bless you in your family and property. Just show me the market."

**The Constitution of Madinah (Sahifat al-Madinah)**

The Prophet ﷺ drafted a remarkable document — the world's first written constitution — between the Muslim emigrants, the Ansar, and the Jewish tribes of Madinah. Key provisions included:
- Muslims form one Ummah (community)
- The rights and duties of each tribe and religion are defined
- No one shall make peace or war without the Prophet's agreement
- The Jews shall have their own religion and the Muslims theirs
- All parties shall defend Madinah if attacked
- The Prophet ﷺ is the final arbiter in disputes

**The Adhan — The Call to Prayer**

As the community gathered for prayers, a means of calling people was needed. Abdullah ibn Zayd al-Ansari رضي الله عنه had a dream in which he heard the words of the adhan. Umar ibn al-Khattab رضي الله عنه had a similar dream. The Prophet ﷺ approved the adhan.

He called Bilal ibn Rabah رضي الله عنه — whose powerful, beautiful voice would ring across Madinah five times each day — and the world's most famous call to prayer was established. The sound of "Allahu Akbar" ascending from the mosque would echo through history.

**The Qibla Changes**

For seventeen months in Madinah, Muslims prayed facing Jerusalem. Then came the command to change the direction to the Ka'bah in Makkah: *"Turn your face toward al-Masjid al-Haram. And wherever you are, turn your faces toward it."* (Quran 2:144)

The Prophet ﷺ turned mid-prayer from Jerusalem toward Makkah — the mosque where this happened is called Masjid al-Qiblatayn (the Mosque of Two Qiblahs).`,
  },
  {
    id: "battle-of-badr",
    era: "medinan",
    order: 11,
    title: "The Battle of Badr",
    arabicTitle: "غزوة بدر",
    icon: "sword-cross",
    description:
      "The first major battle of Islam — the turning point at the wells of Badr.",
    readMinutes: 8,
    content: `The Battle of Badr — fought on 17 Ramadan, 2 AH (624 CE) — was the first major military confrontation between the Muslims and the Quraysh. It was called by Allah *"Yawm al-Furqan"* — the Day of Criterion, the day that distinguished truth from falsehood.

**The Background**

The Quraysh's enmity toward the Muslims had not diminished. They had expelled the Muslims, seized their properties, and continued to persecute those who remained in Makkah. The Muslims in Madinah were permitted to fight: *"Permission to fight has been given to those who are being fought, because they were wronged."* (Quran 22:39)

**The Trigger: Abu Sufyan's Caravan**

The Prophet ﷺ learned that a massive Qurayshi trade caravan — carrying enormous wealth — was returning from Syria under Abu Sufyan. He set out with 313 companions to intercept it.

Abu Sufyan sent emergency word to Makkah. A Qurayshi army of approximately 950-1,000 men — fully armed, with 700 camels and 100 horses — marched out to protect the caravan. Abu Sufyan managed to divert the caravan away safely, but the Qurayshi leaders insisted on proceeding — to show the Arabs that Makkah would not be intimidated.

**The Two Forces Meet at Badr**

The wells of Badr, a day's journey southwest of Madinah, were the meeting point. The Prophet ﷺ consulted his companions — the Muhajirin and Ansar both enthusiastically pledged support. The Prophet ﷺ was deeply moved by their response.

The Muslims were: 313 men, 2 horses, 70 camels.
The Quraysh were: ~950 men, 100 horses, 700 camels.

**The Night Before**

Allah sent rain — which hardened the ground under the Muslims' feet while softening it for the Quraysh. Allah sent sleep upon the Muslims as a mercy and sign of assurance. The Prophet ﷺ prayed through the night with intense supplication: *"O Allah! If this small band is destroyed today, there will be none left to worship You on earth."*

**The Battle**

The battle began with individual combat (mubara'ah) — three Qurayshi champions challenged Muslims. The Prophet ﷺ sent Hamzah, Ali, and Ubaydah ibn al-Harith — and all three Qurayshi champions were killed.

Then the armies clashed. The Prophet ﷺ took a handful of dust and threw it toward the Quraysh, saying *"May the faces be disfigured!"* — and Allah caused every Qurayshi fighter to feel dust in their face. The Quran says: *"You did not throw when you threw — but Allah threw."* (8:17)

Allah sent 1,000 angels in successive ranks to fight alongside the believers. *"And Allah's victory is not but from Allah, the Exalted in Might, the Wise."* (3:126)

The battle was a complete rout. The Quraysh fled in disarray.

**The Outcome**

- **Muslims**: 14 martyred (6 Muhajirin, 8 Ansar)
- **Quraysh**: 70 killed, 70 captured

Among the Qurayshi dead were their greatest leaders: Abu Jahl — the "Pharaoh of this ummah" — killed by two young Ansar boys (Mu'adh and Mu'awwidh, sons of Afra). Umayyah ibn Khalaf — who had tortured Bilal — was killed by Bilal himself.

**The Prisoners**

The Prophet ﷺ showed remarkable mercy to prisoners. He instructed the companions to treat them well. The ransom for literate prisoners was to teach ten Muslim children to read and write — literacy for freedom.

**The Significance of Badr**

Badr established Islam's credibility as a political force. The Quraysh had lost their greatest leaders. The Muslims' faith was deepened — they had seen the help of Allah with their own eyes. The Quran devoted an entire surah (Al-Anfal) to this battle and its lessons.`,
  },
  {
    id: "battle-of-uhud",
    era: "medinan",
    order: 12,
    title: "The Battle of Uhud",
    arabicTitle: "غزوة أحد",
    icon: "mountain",
    description:
      "The trial at Mount Uhud — a lesson in obedience and steadfastness.",
    readMinutes: 7,
    content: `The Battle of Uhud — fought in Shawwal, 3 AH (625 CE) — was the second major battle and a profound test for the Muslim community. Unlike Badr, it ended with Muslim casualties and hard lessons.

**The Quraysh Regroup**

After the humiliation of Badr, the Quraysh — led by Abu Sufyan — spent a year preparing revenge. They assembled 3,000 warriors, 700 armoured fighters, 200 horses, and 3,000 camels. Women including Hind bint Utbah (whose father and brother had died at Badr) came along to urge the men to fight.

**The Muslim Consultation**

The Prophet ﷺ had a dream of cows being slaughtered and his sword being notched — he interpreted this as Muslim casualties. He preferred to defend from within Madinah, but many enthusiastic young companions urged going out to meet the enemy. He agreed and led out approximately 1,000 men. On the way, the hypocrite Abdullah ibn Ubayy withdrew with 300 men, claiming the Prophet had rejected their advice.

The Muslims reached Uhud with approximately 700 men.

**The Archers' Position**

The Prophet ﷺ positioned 50 archers on the slopes of Mount Uhud under Abdullah ibn Jubayr رضي الله عنه. He gave them a crucial command: *"Protect our backs! Even if you see us being defeated and torn apart by birds, do NOT leave your position until I send for you."*

**The Battle Begins**

The Muslims fought fiercely. Hamzah ibn Abd al-Muttalib — the Prophet's uncle, known as the "Lion of Allah" — fought with breathtaking courage. The Qurayshi lines broke and they began to flee.

The archers on the hill saw the victory and — forgetting the Prophet's explicit command — descended to collect spoils. Abdullah ibn Jubayr pleaded with them to stay: he and less than ten men remained.

**The Qurayshi Counterattack**

Khalid ibn al-Walid (who would later accept Islam and become Islam's greatest general) commanded the Qurayshi cavalry. Seeing the archers' position empty, he led his cavalry around the mountain in a flanking maneuver and attacked the Muslims from behind.

The tide turned. In the confusion, a rumour spread: "Muhammad is killed!" Many Muslims fled in panic. The Quran later addressed their flight directly.

**The Wounding of the Prophet ﷺ**

The Prophet ﷺ was not killed — but he was wounded. A stone struck him, breaking his helmet and cutting his face. He was hit in the mouth, breaking one of his teeth. He fell into a trench. Malik ibn Sinan drank the blood from his wound out of love.

As enemies closed in, a group of companions formed a human shield around him. Umm Amarah (Nusaybah bint Ka'ab) — a woman — fought to defend the Prophet ﷺ with sword and bow, receiving thirteen wounds. The Prophet ﷺ said he looked wherever he looked on that day and saw her fighting to defend him.

**Hamzah's Martyrdom رضي الله عنه**

Hamzah رضي الله عنه was killed by the slave Wahshi, hired by Hind to avenge her father. After the battle, Hind mutilated Hamzah's body and tore out his liver. When the Prophet ﷺ saw the state of his uncle's body, he wept bitterly. He declared Hamzah "the master of all martyrs."

**The Lessons of Uhud**

*"And already had Allah fulfilled His promise to you when you were killing them by His permission until when you lost courage and fell to disputing about the order, and disobeyed after He had shown you that which you love."* (Quran 3:152)

Uhud was not a defeat — it was a purification and a test. It taught:
- Obedience to the Prophet ﷺ is non-negotiable
- Love of worldly spoils can destroy victories
- Trials are part of faith — "And We will surely test you with something of fear and hunger and a loss of wealth and lives and fruits." (2:155)
- The true nature of the hypocrites was exposed`,
  },
  {
    id: "battle-of-khandaq",
    era: "medinan",
    order: 13,
    title: "The Battle of the Trench",
    arabicTitle: "غزوة الخندق",
    icon: "shovel",
    description:
      "The Confederates' siege of Madinah and the brilliant strategy of the trench.",
    readMinutes: 7,
    content: `The Battle of the Trench (Khandaq) — also called the Battle of the Confederates (al-Ahzab) — was fought in Shawwal, 5 AH (627 CE). It was the greatest threat the Muslim community had faced, and Allah defeated it without a single major engagement.

**The Confederacy Assembles**

Banu Nadir (a Jewish tribe expelled from Madinah for treachery) partnered with Makkah to raise a coalition army against the Muslims. The Quraysh contributed 4,000 fighters under Abu Sufyan. The Ghatafan tribe contributed 6,000. Various allied tribes joined. In total, approximately 10,000 warriors — a force unprecedented in Arabian history — marched on Madinah.

When word reached the Prophet ﷺ, he consulted his companions. Salman al-Farisi (Persian companion) suggested a Persian defensive strategy: dig a trench across the northern approach to Madinah where the terrain was otherwise open.

**Digging the Trench**

The Prophet ﷺ and his approximately 3,000 companions dug in cold winter conditions, completing the trench in six days. The Prophet ﷺ dug alongside his companions, carrying soil and singing with them.

During the digging, they struck a massive rock that couldn't be broken. The Prophet ﷺ took a pick and struck it three times — each strike sent a flash of light. He said the three flashes showed him Syria, Persia, and Yemen — empires that Islam would conquer. The companions laughed — how could they conquer empires when they were digging in poverty to defend their city?

Food was scarce. Jabir ibn Abdullah رضي الله عنه slaughtered a small goat and cooked a little barley flour for the Prophet ﷺ. The Prophet ﷺ brought everyone — potentially a thousand men — to eat from it. They ate until full and still the pot remained. This was among his miracles.

**The Siege**

The Confederates arrived to find a trench they had not anticipated. They tried repeatedly to cross but the trench blocked the cavalry. The siege dragged on for approximately 20-27 days in bitter cold.

Inside the city, fear was real. The Banu Qurayza (a Jewish tribe in Madinah) broke their treaty and allied with the Confederates — threatening the Muslims from within. Allah described the state of the believers: *"When they came upon you from above you and from below you, and when eyes shifted, and hearts reached the throats..."* (Quran 33:10)

**The Breaking of the Coalition**

The Prophet ﷺ sent Nu'aym ibn Mas'ud (who had secretly accepted Islam) to sow discord among the Confederates. He told each faction that the others might surrender them. This created mutual suspicion.

Then Allah sent a ferocious wind that tore up the Confederates' tents, overturned their cooking pots, and extinguished their fires. Abu Sufyan, unable to see the future, declared: *"O Quraysh! By God, we are not in a place where we can survive. The horses and camels are dying, Banu Qurayza have betrayed us, the wind has destroyed us — return!"*

The entire coalition — 10,000 men — melted away without a decisive battle.

*"And Allah repelled those who disbelieved, in their rage, not having obtained any good. And sufficient was Allah for the believers in battle, and ever is Allah Powerful and Exalted in Might."* (Quran 33:25)

**The Reckoning with Banu Qurayza**

Immediately after the Confederates withdrew, Jibril ﷺ came to the Prophet ﷺ: *"Have you put down your weapons? We angels have not put ours down. March against Banu Qurayza."*

After a siege, Banu Qurayza surrendered. They accepted Sa'd ibn Mu'adh — their former ally — as judge. Sa'd ruled according to the Torah (which prescribed death for treachery in time of war). Their men were executed, their women and children taken as captives. Sa'd died shortly after from wounds sustained at Khandaq; the Prophet ﷺ said: *"The throne of the Merciful shook at his death."*`,
  },
  {
    id: "treaty-of-hudaybiyyah",
    era: "medinan",
    order: 14,
    title: "The Treaty of Hudaybiyyah",
    arabicTitle: "صلح الحديبية",
    icon: "handshake",
    description:
      "The apparent setback that was truly a manifest victory — the wisdom of Hudaybiyyah.",
    readMinutes: 6,
    content: `The Treaty of Hudaybiyyah (6 AH / 628 CE) appeared to the companions to be a humiliating compromise — yet Allah called it *"a manifest victory."* Its consequences proved this divine assessment profound.

**The Vision and the Journey**

The Prophet ﷺ had a dream of entering al-Masjid al-Haram and performing Umrah. He set out with approximately 1,400 companions in pilgrimage garb (ihram), carrying no weapons beyond traveller's swords, accompanied by 70 sacrificial camels.

The Quraysh viewed this as a political challenge. They dispatched forces and sent delegations. Al-Qaswa — the Prophet's she-camel — knelt down upon reaching Hudaybiyyah, near Makkah. When the companions said she was being stubborn, the Prophet ﷺ said: *"She has not become stubborn — that is not her nature. Rather, she was stopped by the One who stopped the elephant."*

**Negotiations**

The Prophet ﷺ sent Uthman ibn Affan رضي الله عنه as his envoy to the Quraysh. A rumour spread that Uthman had been killed. The Prophet ﷺ gathered his companions under a tree and took their pledge to fight to the death — the Bay'at al-Ridwan (Pledge of the Tree). Allah said: *"Certainly was Allah pleased with the believers when they pledged allegiance to you under the tree."* (Quran 48:18)

Uthman returned safely and negotiations resumed. A final Qurayshi envoy, Suhayl ibn Amr, arrived.

**The Treaty Terms**

The terms appeared deeply unfavourable to the Muslims:
1. Muslims would return this year without performing Umrah
2. A ten-year peace between the two parties
3. Any Qurayshi who came to the Muslims would be returned to Makkah; any Muslim who went to the Quraysh would not be returned
4. Tribes could freely ally with either party
5. The following year, Muslims could come to Makkah for three days of Umrah

Umar ibn al-Khattab رضي الله عنه was outraged. He went to Abu Bakr: *"Is he not Allah's Messenger? Are we not Muslims? Are they not polytheists?"* He later said: "I did not stop seeking forgiveness for that day until I hoped it had been expiated."

The Prophet ﷺ asked Ali رضي الله عنه to write the document. When Ali wrote "Muhammad, Messenger of Allah" — Suhayl refused this wording (for it acknowledged prophethood). The Prophet ﷺ told Ali to erase it. Ali could not bring himself to erase the title. The Prophet ﷺ himself erased it, demonstrating magnificent wisdom.

**The Wisdom Behind the Treaty**

Allah immediately revealed: *"Indeed, We have given you a manifest conquest."* (Quran 48:1)

Why was this a victory?
- **Peace enabled the message to spread freely**: Within two years of the treaty, more people accepted Islam than in all the years before.
- **The Quraysh had implicitly recognized Muslim legitimacy** by negotiating as equals.
- **The Dawah expanded**: Previously, people had been afraid to communicate with Muslims. Now tribes could freely interact, and Islam spread rapidly.
- **The Prophet ﷺ performed Umrah the following year** (Umrah al-Qadaa') — 2,000 companions entered Makkah peacefully, and many Makkans watched. Bilal stood atop the Ka'bah and gave the adhan.

**Abu Jandal and Abu Basir**

During the signing, Suhayl's own son, Abu Jandal, escaped his chains in Makkah and came to the Prophet ﷺ, dragging his shackles. The Prophet ﷺ said to Suhayl: *"Grant him to us."* Suhayl refused — the treaty required returning such people. The Prophet ﷺ told Abu Jandal to be patient and that Allah would make a way.

Later, another Muslim, Abu Basir, escaped to the Prophet ﷺ but was again returned. On the way back, he killed his escort and returned to Hudaybiyyah. The Prophet ﷺ could not shelter him per the treaty. Abu Basir gathered other escaped Muslims at the coast and began intercepting Qurayshi trade caravans. This pressure eventually led the Quraysh to ask that the clause be annulled — and the Muslims were welcomed back.`,
  },
  {
    id: "conquest-of-makkah",
    era: "medinan",
    order: 15,
    title: "The Conquest of Makkah",
    arabicTitle: "فتح مكة",
    icon: "kaaba",
    description:
      "The triumphant, merciful return to Makkah — the greatest victory.",
    readMinutes: 8,
    content: `The Conquest of Makkah (Fath Makkah) in Ramadan, 8 AH (630 CE) stands as one of the most extraordinary events in human history — a bloodless conquest, a demonstration of mercy unprecedented for its time, and the fulfilment of Allah's promise.

**The Breaking of the Treaty**

Banu Bakr — allies of the Quraysh — attacked Banu Khuza'ah — allies of the Muslims — violating the Treaty of Hudaybiyyah. The Quraysh provided weapons and some of them participated. The Khuza'ah sent their leader Amr ibn Salim to Madinah to appeal to the Prophet ﷺ.

The Prophet ﷺ immediately began preparations. He prayed: *"O Allah! Blind and deafen the spies and scouts of the Quraysh so they do not see our preparations until we take them by surprise in their own land."*

**The March**

An army of 10,000 Muslims set out from Madinah — the largest Muslim force assembled. The Prophet ﷺ commanded extreme secrecy. Fires were lit at night in every direction to conceal the direction of march. Abbas ibn Abd al-Muttalib (the Prophet's uncle, who had recently accepted Islam) met them on the way — and joined the march.

Abu Sufyan, sensing something was wrong, went out to investigate. Abbas met him and brought him to the Prophet ﷺ under his protection. During the night, Abu Sufyan saw the vast Muslim army passing — 10,000 torches lighting the desert. Abbas urged him: *"Accept Islam."*

In the morning, Abu Sufyan faced the Prophet ﷺ. The Prophet ﷺ said: *"Is it not time for you to testify that there is no god but Allah?"*

Abu Sufyan accepted Islam.

Abbas said: *"O Messenger of Allah, Abu Sufyan is a man who loves prestige — honour him."*

The Prophet ﷺ said: *"Whoever enters the house of Abu Sufyan is safe. Whoever closes his door is safe. Whoever enters the masjid is safe."*

**The Entry into Makkah**

The Muslim army entered Makkah in four columns. The Prophet ﷺ gave strict orders: no one is to be harmed unless they fight first. Only a handful of individuals were specifically excluded from the general amnesty — these were the most notorious enemies of Islam.

Sa'd ibn Ubadah, carrying the banner, called out: "Today is a day of war!" The Prophet ﷺ immediately replaced him and sent Ali with the banner, saying: *"Today is a day of mercy."*

The Prophet ﷺ entered Makkah on his camel al-Qaswa, his head bowed in humility before Allah, reciting Surah al-Fath. The city that had expelled him, that had plotted his assassination, that had persecuted his followers for thirteen years — was now conquered. Yet he entered in profound gratitude, not triumph.

**At the Ka'bah**

The Prophet ﷺ circumambulated the Ka'bah on his camel and struck each idol with his bow, reciting: *"Truth has come, and falsehood has departed. Indeed, falsehood is [by nature] ever bound to depart."* (Quran 17:81)

360 idols fell. The Ka'bah was purified. Bilal رضي الله عنه climbed to the top of the Ka'bah and gave the adhan — the same man who had been tortured on the streets of Makkah.

**The General Amnesty**

The Quraysh gathered expecting the worst. They had murdered Muslims, tortured them, driven them from their homes, killed their loved ones. The Prophet ﷺ stood before them and said:

*"O people of Quraysh! What do you think I will do with you?"*

They said: "Good — you are a noble brother and the son of a noble brother."

The Prophet ﷺ replied: *"Go — for you are free."*

This was unprecedented in the history of warfare. The entire city of Makkah was freed without condition.

Almost all of Makkah accepted Islam that day.

**Hind's Acceptance**

Even Hind bint Utbah — who had ordered the mutilation of Hamzah and eaten his liver at Uhud — came before the Prophet ﷺ (veiled, not yet recognized). When she accepted Islam and unveiled herself, the companions were stunned. The Prophet ﷺ accepted her Islam.

**The Significance**

Makkah — the birthplace of the Prophet ﷺ, the city of the Ka'bah, the spiritual center of the world — was now in Muslim hands. The conquest was the most dramatic proof of Allah's promise: *"Unquestionably, the party of Allah — they will be the predominant."* (Quran 5:56)`,
  },

  // ────────────────────────────────────────────────────────────────
  // ERA 5 — FINAL YEARS
  // ────────────────────────────────────────────────────────────────
  {
    id: "farewell-pilgrimage",
    era: "final-years",
    order: 16,
    title: "The Farewell Pilgrimage",
    arabicTitle: "حجة الوداع",
    icon: "pillar",
    description:
      "The historic final Hajj of the Prophet ﷺ and his eternal farewell sermon.",
    readMinutes: 8,
    content: `In Dhu al-Qi'dah of 10 AH (March 632 CE), the Prophet ﷺ announced his intention to perform Hajj — his first and last complete pilgrimage. Approximately 90,000-124,000 companions gathered from across the Arabian Peninsula to join him.

**Setting Out**

The Prophet ﷺ left Madinah on the 25th of Dhu al-Qi'dah. He entered ihram at Dhu al-Hulayfa (Abyar Ali) with the talbiyah on his lips: *"Labbayk Allahumma Labbayk — Labbayka la sharika laka Labbayk — Innal hamda wan-ni'mata laka wal-mulk — La sharika lak."*

He reached Makkah on the 4th of Dhu al-Hijjah, performed Tawaf and Sa'y, and waited for the main Hajj rites.

**On the 8th of Dhu al-Hijjah (Yawm al-Tarwiyah)**

He set out for Mina with the enormous company of companions, spending the night there.

**The 9th of Dhu al-Hijjah — The Day of Arafat**

He rode to the plain of Arafat and stood on the hillock of Jabal al-Rahmah. It was midday. The sun blazed overhead. The vast sea of humanity stretched in every direction — the largest human gathering the world had ever seen.

He addressed them.

**The Farewell Sermon (Khutbat al-Wada)**

*"O people! Listen to my words carefully, for I do not know whether, after this year, I shall ever be amongst you again."*

The Prophet ﷺ then delivered one of the most important addresses in human history:

**On Life and Property**: *"Your lives and your property shall be inviolate until you meet your Lord. The safety of your lives and of your property shall be as inviolate as this holy day and holy month."*

**On the Abolition of Riba (Interest)**: *"All usurious interest is cancelled. You will have only your principal. Wrong not and you will not be wronged."*

**On the Rights of Women**: *"O people! It is true that you have certain rights with regard to your women, but they also have rights over you. Remember that you have taken them as your wives only under Allah's trust and with His permission."*

**On Brotherhood**: *"All mankind is from Adam and Eve. An Arab has no superiority over a non-Arab, nor does a non-Arab have any superiority over an Arab; also a white person has no superiority over a Black person, nor does a Black person have superiority over a white person — except by piety and good action."*

**On the Quran and Sunnah**: *"I am leaving you with two things. If you hold fast to them, you will never go astray: the Book of Allah and the Sunnah of His Prophet."*

**The Last Revelation**

At Arafat, the final verse of the Quran was revealed: *"This day I have perfected for you your religion and completed My favour upon you and have approved for you Islam as religion."* (Quran 5:3)

Umar wept. When asked why, he said: *"Completion comes only after perfection — and after perfection comes loss."*

**His Final Question**

*"O people! Have I conveyed the message?"*

They replied: *"Yes, O Allah's Messenger!"*

He raised his finger to the sky and said: *"O Allah, bear witness! O Allah, bear witness! O Allah, bear witness!"*

**The Completion of Hajj**

He completed all the rites of Hajj — spending the night at Muzdalifah, stoning the Jamarat, sacrificing 63 camels (one for each year of his life), having his head shaved, performing Tawaf al-Ifadah, and drinking from Zamzam.

He returned to Madinah — never to leave it again.

Those who had accompanied him knew they had witnessed something of eternal significance. They did not know they had seen the Prophet ﷺ for the last time at Hajj.`,
  },
  {
    id: "death-of-prophet",
    era: "final-years",
    order: 17,
    title: "The Passing of the Prophet ﷺ",
    arabicTitle: "وفاة النبي ﷺ",
    icon: "heart-broken",
    description:
      "The final illness and passing of the greatest human being to walk the earth.",
    readMinutes: 8,
    content: `In the months following the Farewell Pilgrimage, the Prophet ﷺ showed signs that signalled the approaching end of his earthly life. He visited the graves of the martyrs of Uhud and prayed for them. He spoke more of the Hereafter. He said: *"I wish I had met my brothers."* His companions said: *"Are we not your brothers?"* He replied: *"You are my companions. My brothers are those who have not yet come."*

**The Beginning of Illness**

At the end of Safar or beginning of Rabi' al-Awwal of 11 AH (May-June 632 CE), the Prophet ﷺ began to feel unwell. He had severe headaches and a high fever. He continued to lead prayers and visit the sick companions, but the illness intensified.

**Moving to Aisha's Room رضي الله عنها**

With the permission of his wives, the Prophet ﷺ moved to the room of Aisha رضي الله عنها to receive care. He would sometimes ask his wives to pour water over his head to reduce the fever. Despite the illness, he continued attending the mosque for as long as he could.

**The Last Days**

One Thursday, the Prophet ﷺ said: *"Bring me pen and paper so I may write for you something that will prevent you from going astray."* Umar ibn al-Khattab said there was no need — "The Quran is sufficient for us." A dispute broke out and the Prophet ﷺ, distressed, told them to leave.

On the Friday and Saturday of his final week, the Prophet ﷺ could no longer stand. He asked Abu Bakr رضي الله عنه to lead the prayers. This was widely understood as indicating his successor.

**Monday — The Final Morning**

On Monday morning, 12 Rabi' al-Awwal, 11 AH (8 June 632 CE), the companions gathered for Fajr prayer. Abu Bakr was leading. The curtain of Aisha's room — which opened to the mosque — was drawn aside. The Prophet ﷺ appeared, looking into the mosque at his beloved companions, smiling. His face shone with a radiant light.

The companions, overcome with joy, thought he had recovered. Abu Bakr stepped back to allow him to lead. The Prophet ﷺ signalled for Abu Bakr to continue, then drew the curtain closed.

He returned to Aisha's room and lay with his head in her lap. His hand was in a vessel of water; he would dip it and wipe his face, saying: *"La ilaha illallah — Indeed death has agonies."*

He began raising his finger and looking upward, saying: *"With the highest companions. With the highest companions. With the highest companions."* — referring to the companionship of the prophets and righteous in the highest heaven.

**His Final Words**

Aisha رضي الله عنها reported that his last words were: *"O Allah, with the highest companions."* — and then his blessed head became heavy in her arms.

He had passed to his Lord. The greatest human being who ever lived was gone.

**The Reaction of the Companions**

The news spread through Madinah like a thunderbolt. Umar ibn al-Khattab رضي الله عنه — the great, the strong — stood with his sword drawn, declaring: "Whoever says Muhammad has died, I will cut off his head! He has only gone to his Lord as Musa went..."

Abu Bakr رضي الله عنه entered, kissed the Prophet's forehead and said: *"May my father and mother be sacrificed for you — you were beautiful in life and beautiful in death. By Allah, Allah will never cause you to die twice."*

Then he went to the mosque and addressed the people: *"O people! Whoever was worshipping Muhammad — Muhammad is dead. And whoever was worshipping Allah — Allah is Alive and does not die."*

He recited: *"Muhammad is not but a messenger. Messengers before him have passed on. If he dies or is killed, will you turn back on your heels? And whoever turns back on his heels will never harm Allah at all; but Allah will reward the grateful."* (Quran 3:144)

At these words, Umar's sword fell from his hand and he collapsed to the ground. Every companion felt the weight of that verse as if they were hearing it for the first time.

**The Burial**

The Prophet ﷺ was buried in the room where he passed away — in the room of Aisha رضي الله عنها — which is now enclosed within al-Masjid al-Nabawi. He said: *"Prophets are buried where they die."*

**What He Left Behind**

The Prophet ﷺ left behind no wealth, no palace, no treasure — only his armour was pledged against a debt of food for his family. What he left was something far greater: *"I have left among you two things — you will not go astray as long as you hold fast to them: the Book of Allah and the Sunnah of His Prophet."*

He left behind a community that would spread from Spain to China within a century. He left behind a message that 1.8 billion people today call their own. He left behind a character — witnessed by thousands — that stands as the finest example of human excellence.

*"And We have not sent you, except as a mercy to the worlds."* (Quran 21:107)

Sall-Allahu alayhi wa sallam — May Allah's peace and blessings be upon him, forever.`,
  },
  {
    id: "character-of-prophet",
    era: "final-years",
    order: 18,
    title: "The Character of the Prophet ﷺ",
    arabicTitle: "أخلاق النبي ﷺ",
    icon: "star-circle",
    description:
      "A portrait of the Prophet's ﷺ character, appearance, and daily life.",
    readMinutes: 7,
    content: `Allah described His beloved Prophet with a single verse that encompasses everything: *"And indeed, you are of a great moral character."* (Quran 68:4)

Aisha رضي الله عنها was asked about his character. She replied: *"His character was the Quran."*

**His Appearance**

The Prophet ﷺ was of medium height — neither tall nor short. His face was like the full moon — bright and radiant. His forehead was broad. His eyebrows were arched and joined slightly in the middle. His eyes were large and black with a reddish tinge, and long eyelashes. His nose was slightly aquiline. His mouth was wide, with brilliant white teeth. His beard was thick and black.

His hair reached his earlobes; sometimes he wore it longer to his shoulders. He was neither fat nor thin. His body was strong, with broad shoulders. There was a seal of prophethood between his shoulder blades — a raised mark the size of a dove's egg.

He smelled better than musk even without perfume. Whoever shook his hand felt the fragrance remaining for days.

**His Smile**

The Prophet ﷺ smiled constantly. Abdullah ibn al-Harith رضي الله عنه said: "I never saw anyone smile more than the Messenger of Allah." His smile was his characteristic — but he never laughed loudly.

**His Walk**

He walked as if descending from a height — with purpose and ease. He walked quickly and leaned slightly forward. Those who walked with him had to hurry to keep up.

**His Humility**

Despite being the leader of a growing ummah, the Prophet ﷺ lived with extraordinary simplicity:
- He sat on the ground and ate on the ground
- He sewed his own sandals and patched his own clothes
- He helped his wives with household chores
- He would milk the goat himself
- He would say: *"I am only a servant — I eat as a servant eats and sit as a servant sits."*
- He refused people standing for him out of respect
- He would visit the sick, attend funerals, walk to the furthest parts of Madinah

**His Generosity**

Jabir رضي الله عنه said: "The Messenger of Allah was never asked for anything and said 'no.'" His generosity was like the wind — abundant, constant, touching everything.

**His Mercy**

The Prophet ﷺ wept for his nation. He wept over graves. He wept for orphans. He wept in prayer. He once came out to lead prayer and was holding his granddaughter Umamah on his shoulder — when he bowed, he placed her down; when he rose, he picked her up again. He said: *"Whosoever does not show mercy will not be shown mercy."*

When a man came to him and said his child had died, the Prophet ﷺ wept. His companions said: "You weep, O Messenger of Allah?" He replied: *"This is mercy, which Allah places in the hearts of His servants — and Allah shows mercy to those of His servants who show mercy."*

**His Justice**

He was inflexibly just — even against those he loved. When asked to intercede for a woman of the Quraysh who had stolen, he said: *"By Allah, if Fatimah the daughter of Muhammad were to steal, I would cut off her hand."*

**His Love for His Companions**

He remembered people by name. He would ask about those who were absent. He would visit the sick even from the furthest part of Madinah. When Anas ibn Malik served him from childhood, the Prophet ﷺ treated him as family. Anas said: "He never said to anything I did 'why did you do this,' nor to anything I did not do 'why did you not do this.'"

**His Night Worship**

At night, after the household slept, the Prophet ﷺ would rise and pray — sometimes until his feet became swollen. When Aisha رضي الله عنها asked why he prayed so much when Allah had forgiven all his sins, he said: *"Should I not be a grateful servant?"*

**His Legacy**

He is the best of creation, the Imam of the Prophets, the beloved of Allah, and the greatest mercy to mankind. To follow him is to follow guidance. To love him is to love what Allah loves. To send peace upon him is to receive ten blessings from Allah in return.

*"Say: If you love Allah, then follow me — Allah will love you and forgive your sins."* (Quran 3:31)

Allahumma salli 'ala Muhammadin wa 'ala ali Muhammadin kama sallayta 'ala Ibrahima wa 'ala ali Ibrahim — wa barik 'ala Muhammadin wa 'ala ali Muhammadin kama barakta 'ala Ibrahima wa 'ala ali Ibrahim — fil 'alamina innaka Hamidun Majid.`,
  },
];
