export interface DawahSection {
  id: string;
  partNumber: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  topics: {
    title: string;
    description: string;
    quranVerses?: { text: string; reference: string }[];
    hadiths?: { text: string; reference: string }[];
    quotes?: { author: string; role: string; quote: string }[];
    prophets?: { name: string; description: string }[];
    miracles?: { name: string; description: string; reference?: string }[];
    books?: { name: string; description: string }[];
  }[];
}

export const DAWAH_HERO = {
  title: "Why Islam and Following it Correctly",
  sourceUrl: "https://sabbir.com/",
  arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  subtitle: "Islamic Knowledge • Resources • Application",
  hadithHeader: {
    arabic: "الْمُسْلِمُ أَخُو الْمُسْلِمِ",
    english: "“A Muslim is the brother of a Muslim.”",
    source: "(Bukhārī & Muslim)",
  },
  introduction: {
    title: "Conditions for Getting the Best Out of This Article",
    points: [
      "You are sincerely seeking the truth about why we, as human beings, are here.",
      "You do not approach this with bias or hatred, thinking Islam is just an 'Arab' religion—it is for all of humanity.",
      "If you are looking for a religion that simply fits your desires, then invent your own and live in delusion. But if you are looking for the truth about our purpose in life, then here is your answer.",
    ],
  },
};

export const DAWAH_PARTS: DawahSection[] = [
  {
    id: "part1-existence-of-god",
    partNumber: 1,
    title: "1. Existence of God",
    subtitle: "Reason, Reflection & Signs of Creation",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    imageAlt: "Majestic starry cosmos and universe pointing to a Creator",
    summary: "We are the most intelligent beings we know in existence. Unlike animals, we have the ability to reason, reflect, and ask deeper questions: Why are we here? What is our purpose? The signs within ourselves and the universe point clearly to a Creator.",
    topics: [
      {
        title: "Why God Exists",
        description: "Five rational and universal observations proving the existence of a Higher Creator:",
        miracles: [
          { name: "1. Order of the Universe", description: "The sun, moon, stars, and planets all move with precision. The balance of nature cannot come from chaos; it points to an Intelligent Designer.", reference: "Qur'an 3:190" },
          { name: "2. Cause and Effect", description: "Everything that begins has a cause. The universe had a beginning, so it must have an Eternal Cause outside of space and time.", reference: "Qur'an 52:35" },
          { name: "3. Complexity of Life (DNA)", description: "Every cell carries a detailed genetic code. Code requires intelligence; random chance cannot generate genetic information.", reference: "Qur'an 51:21" },
          { name: "4. Universal Moral Compass", description: "Every human recognizes right and wrong beyond human laws. This objective moral sense must come from a Supreme Source of Justice.", reference: "Qur'an 91:8" },
          { name: "5. Human Nature (Fitrah)", description: "Across all cultures, humans naturally seek a higher power. This inner longing to worship is built into human design.", reference: "Qur'an 30:30" },
        ],
        quranVerses: [
          { text: "Indeed, in the creation of the heavens and the earth, and the alternation of the night and the day, are signs for those of understanding.", reference: "Qur'an 3:190" },
          { text: "Were they created by nothing, or were they themselves the creators?", reference: "Qur'an 52:35" },
          { text: "And in yourselves, then will you not see?", reference: "Qur'an 51:21" },
          { text: "And He (Allah) inspired the soul with its wickedness and its righteousness.", reference: "Qur'an 91:8" },
          { text: "So direct your face toward the religion, inclining to truth. [Adhere to] the nature (fitrah) of Allah upon which He has created people.", reference: "Qur'an 30:30" },
        ],
      },
      {
        title: "Scientific & Historical Testimonies",
        description: "What famous scientists and thinkers concluded about God:",
        quotes: [
          { author: "Albert Einstein", role: "Physicist", quote: "The more I study science, the more I believe in God. Science without religion is lame, religion without science is blind." },
          { author: "Isaac Newton", role: "Father of Classical Physics", quote: "This most beautiful system of the sun, planets, and comets could only proceed from the counsel and dominion of an intelligent and powerful Being." },
          { author: "Louis Pasteur", role: "Founder of Microbiology", quote: "A little science estranges a man from God; a lot of science brings him back." },
          { author: "Werner Heisenberg", role: "Father of Quantum Physics", quote: "The first gulp from the glass of natural sciences will turn you into an atheist, but at the bottom of the glass God is waiting for you." },
          { author: "Francis Collins", role: "Leader of Human Genome Project", quote: "When you have seen some of the amazing complexity of the human genome, you can't help but see the hand of God." },
          { author: "Blaise Pascal", role: "Mathematician & Philosopher", quote: "There is a God-shaped vacuum in the heart of every man which cannot be filled by any created thing, but only by God the Creator." },
          { author: "Max Planck", role: "Father of Quantum Theory", quote: "Religion and science demand for their foundation faith in God. For believers, God stands at the beginning of their thinking; for physicists, at the end of it." },
        ],
      },
    ],
  },
  {
    id: "part2-why-god-created-us",
    partNumber: 2,
    title: "2. Why Did God Create Us and What Did He Tell Us?",
    subtitle: "Purpose of Creation, The Name Allah & All Prophets",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80",
    imageAlt: "Peaceful morning landscape reflecting divine purpose and nature",
    summary: "God created life and death as a test to see who lives righteously. Allah is the unique, non-plural name of the One Creator who sent messengers to every nation throughout history.",
    topics: [
      {
        title: "God as the Creator & Purpose of Life",
        description: "The Qur'an clarifies that we were created to worship God alone and live righteously:",
        quranVerses: [
          { text: "And I did not create the jinn and mankind except to worship Me.", reference: "Qur'an 51:56" },
          { text: "It is Allah who created the heavens and the earth and whatever is between them...", reference: "Qur'an 32:4" },
        ],
      },
      {
        title: "Who is Allah? Why Muslims Use the Name Allah",
        description: "'Allah' is simply the Arabic word for God, used by Muslims, Arab Jews, and Arab Christians. Unlike 'god' (which can be pluralized into 'gods' or gendered into 'goddess'), 'Allah' has no gender or plural. It refers exclusively to the One Supreme Creator.",
        quranVerses: [
          { text: "And your God is one God. There is no deity [worthy of worship] except Him, the Entirely Merciful, the Especially Merciful.", reference: "Qur'an 2:163" },
          { text: "Indeed, I am Allah. There is no deity except Me, so worship Me and establish prayer for My remembrance.", reference: "Qur'an 20:14" },
        ],
      },
      {
        title: "What is a Muslim?",
        description: "The word 'Muslim' means 'one who submits to God'. It is not a cultural label or nationality, but a state of surrendering to the One Creator. Thus, Moses, Jesus, Abraham, and all true followers of God were Muslims in submission.",
        quranVerses: [
          { text: "Indeed, the religion in the sight of Allah is Islam.", reference: "Qur'an 3:19" },
          { text: "And whoever submits his face to Allah while being a doer of good, then he has grasped the most trustworthy handhold.", reference: "Qur'an 31:22" },
        ],
      },
      {
        title: "All 25 Prophets Mentioned in the Qur'an",
        description: "God sent messengers to every nation with the same timeless core message: worship Allah alone and avoid false gods (16:36).",
        prophets: [
          { name: "Adam", description: "The first human and prophet; taught his children to worship Allah alone." },
          { name: "Nuh (Noah)", description: "Warned his people for centuries; built the Ark during the great flood." },
          { name: "Hud", description: "Sent to the people of 'Ad, who were destroyed for their arrogance." },
          { name: "Salih", description: "Sent to Thamud; they killed the miraculous she-camel and faced judgment." },
          { name: "Ibrahim (Abraham)", description: "Father of prophets; rejected idol worship; rebuilt the Kaaba with Ishmael." },
          { name: "Lut (Lot)", description: "Warned his nation against gross immorality and societal corruption." },
          { name: "Isma'il (Ishmael)", description: "Son of Abraham; known for patience and dedication; co-built the Kaaba." },
          { name: "Ishaq (Isaac)", description: "Son of Abraham; father of Jacob; continued monotheistic guidance." },
          { name: "Ya'qub (Jacob)", description: "Son of Isaac; also called Israel; father of the 12 tribes." },
          { name: "Yusuf (Joseph)", description: "Son of Jacob; rose from slave and prisoner to ruler in Egypt." },
          { name: "Shu'ayb", description: "Sent to Midian; warned against corruption and cheating in commercial trade." },
          { name: "Musa (Moses)", description: "Sent to Pharaoh and the Israelites; received the Torah; split the Sea." },
          { name: "Harun (Aaron)", description: "Brother of Moses; supported him in delivering God's message." },
          { name: "Dawud (David)", description: "King and prophet; received the Psalms (Zabur); defeated Goliath." },
          { name: "Sulaiman (Solomon)", description: "Son of David; blessed with immense wisdom and domain over wind and jinn." },
          { name: "Ilyas (Elias)", description: "Called his people away from Baal worship back to God." },
          { name: "Al-Yasa' (Elisha)", description: "Successor of Ilyas; continued preaching pure monotheism." },
          { name: "Yunus (Jonah)", description: "Sent to Nineveh; swallowed by a whale and delivered after sincere prayer." },
          { name: "Ayyub (Job)", description: "Standard of patience through severe health, wealth, and family trials." },
          { name: "Dhul-Kifl (Ezekiel)", description: "Righteous and patient leader who judged with steadfast justice." },
          { name: "Zakariya (Zachariah)", description: "Father of John; prayed in old age for a pious heir." },
          { name: "Yahya (John the Baptist)", description: "Son of Zachariah; renowned for purity, asceticism, and wisdom." },
          { name: "Isa (Jesus)", description: "Born miraculously to Mary; performed miracles by Allah's leave; brought the Injil." },
          { name: "Muhammad ﷺ", description: "The final messenger; sent with the Qur'an as guidance for all humanity until the end of time." },
        ],
      },
    ],
  },
  {
    id: "part3-muhammad-and-quran",
    partNumber: 3,
    title: "3. Muhammad ﷺ: The Final Messenger & The Miraculous Qur'an",
    subtitle: "Finality of Prophethood & Preservation of Revelation",
    imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&auto=format&fit=crop&q=80",
    imageAlt: "Illuminated Quran manuscript in warm light",
    summary: "Prophet Muhammad ﷺ completed the chain of messengers. He was sent with the Qur'an—the final, unchanged, and living revelation preserved for all generations.",
    topics: [
      {
        title: "The Final Messenger ﷺ",
        description: "Prophet Muhammad ﷺ was chosen from the line of Ishmael to deliver the universal final message:",
        quranVerses: [
          { text: "Muhammad is not the father of [any] one of your men, but he is the Messenger of Allah and the last of the prophets.", reference: "Qur'an 33:40" },
          { text: "And We have not sent you, [O Muhammad], except as a mercy to the worlds.", reference: "Qur'an 21:107" },
        ],
      },
      {
        title: "The Qur'an: God's Preserved Book",
        description: "Why the Qur'an stands unique among all human and religious texts:",
        miracles: [
          { name: "Linguistic Miracle", description: "Its rhythm, eloquence, and literary structure challenge all of creation to produce even a single surah like it.", reference: "Qur'an 2:23" },
          { name: "Scientific Accuracy", description: "Accurately details embryonic development (23:14), ocean barriers (55:19), mountains as pegs (16:15), and the expanding universe (51:47) centuries before modern science." },
          { name: "Historical Prophecies", description: "Accurately predicted the Roman victory over Persia within 9 years (30:2-4) and the physical preservation of Pharaoh's body (10:92)." },
          { name: "Unbroken Preservation", description: "Memorized cover-to-cover by millions of Huffaz worldwide in its original 7th-century Arabic text down to every vowel mark.", reference: "Qur'an 15:9" },
          { name: "Transformative Power", description: "Transformed Arabia from warring tribes into a beacon of science, justice, and ethics within a single generation." },
        ],
        quranVerses: [
          { text: "Indeed, it is We who sent down the Qur'an, and indeed, We will be its guardian.", reference: "Qur'an 15:9" },
          { text: "And We have certainly made the Qur'an easy to remember. So is there anyone who will be mindful?", reference: "Qur'an 54:17" },
        ],
      },
    ],
  },
  {
    id: "part4-following-sunnah-correctly",
    partNumber: 4,
    title: "4. Following the Sunnah – Following Islam Correctly",
    subtitle: "Authentic Hadiths, Salaf Generation & Sincerity",
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&auto=format&fit=crop&q=80",
    imageAlt: "Illuminated grand mosque minarets and dome at dusk",
    summary: "Islam is preserved through the Qur'an and the authentic Sunnah as practiced by the Prophet ﷺ, his Companions (Sahabah), and the early generations (Salaf).",
    topics: [
      {
        title: "What is the Sunnah & Hadith?",
        description: "The Sunnah is the practical model of the Qur'an in action. Hadiths are the verified records of the Prophet's words and actions, preserved through strict chains of narrators (Isnād).",
        books: [
          { name: "Sahih al-Bukhari", description: "The most authentic book after the Qur'an compiled by Imam Al-Bukhari." },
          { name: "Sahih Muslim", description: "Rigorous collection of authentic narrations compiled by Imam Muslim." },
          { name: "Sunan Abu Dawood", description: "Focuses on legal rulings and daily prophetic Sunnah." },
          { name: "Jami' at-Tirmidhi", description: "Includes detailed Hadith grades and scholarly commentary." },
          { name: "Sunan an-Nasa'i", description: "Renowned for strict authentication requirements." },
          { name: "Sunan Ibn Majah", description: "Completes the Kutub al-Sittah (Six Major Hadith Collections)." },
        ],
        hadiths: [
          { text: "I have left among you two things; you will never go astray as long as you hold fast to them: the Book of Allah and my Sunnah.", reference: "Muwatta Malik 3:897" },
          { text: "Hold fast to my Sunnah and the Sunnah of the rightly guided caliphs after me... Beware of newly invented matters, for every innovation is misguidance.", reference: "Abu Dawood 4607, Tirmidhi 2676" },
        ],
      },
      {
        title: "Following the Early Generations (Salaf as-Salih)",
        description: "The Prophet ﷺ praised the first three generations as the purest practice of Islam:",
        hadiths: [
          { text: "The best of people are my generation, then those who come after them, then those who come after them.", reference: "Bukhari 2652, Muslim 2533" },
          { text: "My ummah will split into 73 sects... all in the Fire except one: That which I and my Companions are upon.", reference: "Abu Dawood 4597, Tirmidhi 2641" },
        ],
      },
      {
        title: "Role of Authentic Scholars & The Danger of Fame",
        description: "True scholars dedicate their lives to silent study and fear of Allah. The Prophet ﷺ warned that performing deeds for fame or clout leads to destruction:",
        hadiths: [
          { text: "The scholars are the inheritors of the prophets.", reference: "Abu Dawood 3641" },
          { text: "The first against whom judgment will be pronounced on Resurrection Day include a man who acquired knowledge and recited Qur'an so people would call him learned... Allah will say: 'You have lied. You did it so people would call you learned.' Then he will be dragged into the Fire.", reference: "Sahih Muslim 1905" },
        ],
        quranVerses: [
          { text: "So ask the people of knowledge if you do not know.", reference: "Qur'an 16:43" },
        ],
      },
    ],
  },
];
