import { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

// Types
type GuideItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  coverUrl: string;
  description: string;
  content: {
    steps?: { title: string; desc: string }[];
    duas?: { arabic: string; transliteration: string; translation: string; context?: string }[];
    packing?: string[];
  };
};

type JourneyStage = {
  id: string;
  title: string;
  status: string;
  icon: string;
  items: {
    title: string;
    description: string;
    imageUrl: string;
    sunnahInstructions?: string; // Sunni specific Shariah guideline
  }[];
};

// Sunni Shariah-compliant detailed guides
const GUIDE_ITEMS: GuideItem[] = [
  {
    id: "intro",
    title: "Introduction To Hajj & Umrah",
    subtitle: "Sunni jurisprudence & the virtues of pilgrimage.",
    icon: "book-open-variant",
    coverUrl: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?q=80&w=400&auto=format&fit=crop",
    description: "In Sunni Islam, Hajj is a primary pillar of faith, and Umrah is a highly rewarded Sunnah Mu'akkadah (confirmed Sunnah). This guide follows authentic practices approved by major Sunni Madhahib (Hanafi, Shafi'i, Maliki, Hanbali) following the Quran and the Sunnah of Prophet Muhammad (ﷺ).",
    content: {
      steps: [
        { title: "Virtues of Pilgrimage", desc: "The Prophet (ﷺ) said: 'Perform Hajj and Umrah consecutively, for they remove poverty and sin just as the bellows remove impurity from iron, gold, and silver.' (Tirmidhi). An accepted Hajj yields no reward less than Jannah." },
        { title: "The Three Methods of Hajj", desc: "1. Hajj al-Tamattu': Performing Umrah during the Hajj months, exiting Ihram, then entering a new Ihram for Hajj on 8th Dhul-Hijjah. (Most recommended by the Prophet for his companions).\n2. Hajj al-Qiran: Performing both Hajj and Umrah under a single Ihram without exiting it in between.\n3. Hajj al-Ifrad: Entering Ihram solely for Hajj." },
        { title: "Pillars (Arkan) vs. Obligatory Acts (Wajibath)", desc: "In Sunni fiqh, missing a Pillar (Rukn) invalidates the pilgrimage entirely (e.g. Arafah or Tawaf al-Ifadah). Missing an Obligatory Act (Wajib) does not invalidate it, but requires a penalty offering (Dam / sacrifice) to rectify." }
      ]
    }
  },
  {
    id: "umrah",
    title: "Detailed Umrah Guide",
    subtitle: "Complete walkthrough of the minor pilgrimage.",
    icon: "mosque",
    coverUrl: "https://images.unsplash.com/photo-1565552155433-d8c9735d4f1d?q=80&w=400&auto=format&fit=crop",
    description: "Umrah consists of four essential Sunni pillars: entering Ihram, performing Tawaf, performing Sa'i, and cutting/shaving the hair.",
    content: {
      steps: [
        { title: "1. Pure Preparation & Ihram", desc: "Before crossing the Miqat boundary, perform Ghusl (Sunnah), trim nails, clip moustache. Men wrap in two clean, unstitched white sheets. Women wear modest, full clothing leaving face and hands free. Pray 2 Rakah of Sunnat-ul-Ihram (non-makruh time) and state your Niyyah." },
        { title: "2. The Talbiyah Recitation", desc: "Recite the Talbiyah aloud (men) or silently (women) constantly: 'Labbayk Allahumma Labbayk...' until you catch sight of the Kaaba." },
        { title: "3. Tawaf al-Umrah (7 Rounds)", desc: "Enter Masjid al-Haram with right foot saying Masjid entrance dua. For men, perform Idtiba (uncovering right shoulder) and Ramal (brisk walk in first 3 rounds). Circle counter-clockwise starting at Black Stone, pointing and saying 'Allahu Akbar' (Istilam). Finish 7 rounds, pray 2 Rakah behind Maqam Ibrahim (or anywhere in Haram), then drink Zamzam water." },
        { title: "4. Sa'i between Safa & Marwah", desc: "Proceed to Mount Safa. Face the Kaaba, raise hands, make dua. Walk to Marwah. Men run between the green-lighted pillars. 7 trips total (Safa to Marwah is 1; Marwah to Safa is 2). Make abundant dua." },
        { title: "5. Halq (Shaving) or Taqsir (Trimming)", desc: "Exit Ihram. Men should shave their heads completely (highly recommended) or trim hair evenly all around. Women trim a fingertip-length (approx. 1 inch) from the end of their hair braid. All Ihram prohibitions are now lifted." }
      ],
      duas: [
        {
          arabic: "اللَّهُمَّ إِنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي وَتَقَبَّلْهَا مِنِّي",
          transliteration: "Allahumma inni uridu-l-'umrata fayassirha li wa taqabbalha minni",
          translation: "O Allah, I intend to perform Umrah, so make it easy for me and accept it from me.",
          context: "Intention for Umrah at the Miqat"
        }
      ]
    }
  },
  {
    id: "hajj",
    title: "Detailed Hajj Guide",
    subtitle: "Day-by-day Sunni fiqh procedures for Hajj.",
    icon: "walk",
    coverUrl: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop",
    description: "Follow the precise path of Prophet Muhammad (ﷺ) during the 'Farewell Hajj'. Hajj runs from 8th to 13th of Dhul-Hijjah.",
    content: {
      steps: [
        { title: "8th Dhul-Hijjah: Day of Tarwiyah (Mina)", desc: "Enter Ihram from Makkah, make Hajj intention. Proceed to Mina before Zuhr. Spend the night in Mina. Perform Zuhr, Asr, Maghrib, Isha, and Fajr prayers. Each prayer is shortened (Qasr) to 2 Rakahs but NOT combined, following the Sunnah." },
        { title: "9th Dhul-Hijjah: Day of Arafah (The Peak)", desc: "After Fajr, proceed to Arafah. Stand in prayer (Wuquf) from Zuhr until sunset. Listen to the sermon. Pray Zuhr and Asr shortened and combined (Jam'a) during Zuhr time. Dedicate this day to begging Allah for forgiveness." },
        { title: "9th Night: Muzdalifah", desc: "After sunset, move quietly to Muzdalifah. Pray Maghrib and Isha combined & shortened during Isha time. Sleep under the open sky. Collect 49 or 70 pebbles for stoning." },
        { title: "10th Dhul-Hijjah: Day of Eid (Yawm-un-Nahr)", desc: "After Fajr in Muzdalifah, go to Mina. 1) Stone Jamarat al-Aqabah (the big pillar) with 7 pebbles saying 'Allahu Akbar' with each. 2) Slaughter sacrificial animal (Hady). 3) Men shave (Halq) or trim (Taqsir) hair. Exit partial Ihram (Tahal-lul al-Asghar). 4) Go to Mecca for Tawaf al-Ifadah & Sa'i, exiting Ihram fully (Tahal-lul al-Akbar)." },
        { title: "11th - 13th Dhul-Hijjah: Tashriq Days (Mina)", desc: "Stay in Mina. Each day after Zawal (midday), stone all three Jamarats starting from the small, then medium, and lastly big pillar with 7 pebbles each (21 total daily). You may leave on 12th after stoning before sunset, or stay till 13th (best)." },
        { title: "Farewell: Tawaf al-Wada", desc: "Before leaving Mecca for your home country, perform the Farewell Tawaf (7 rounds around Kaaba) as your final contact with the Haram." }
      ]
    }
  },
  {
    id: "ihram",
    title: "Ihram Rules & Prohibitions",
    subtitle: "Sacred state of physical & spiritual boundary.",
    icon: "tshirt-crew-outline",
    coverUrl: "https://images.unsplash.com/photo-1580927757835-23c0bf1ca1f8?q=80&w=400&auto=format&fit=crop",
    description: "Entering Ihram is the first pillar of both Hajj and Umrah. It has strict rules that must be respected to avoid penalties (Dam).",
    content: {
      steps: [
        { title: "Step-by-Step Entering Ihram", desc: "1. Trim nails, shave pubic hair, shape beard/moustache.\n2. Take a full Ghusl (bath) with niyyah of purification.\n3. Wrap the two unstitched white towels (men) or wear simple modest clothes (women).\n4. Pray 2 Rakah of Nafl with head covered (remove cap after prayer).\n5. Uncover head, state intention for Hajj or Umrah, and recite Talbiyah thrice." },
        { title: "Forbidden in Ihram (For Men)", desc: "1. Wearing stitched garments (underwear, shirts, trousers, socks, hats).\n2. Covering the head or face.\n3. Wearing closed shoes that cover the top ankle bones." },
        { title: "Forbidden in Ihram (For All)", desc: "1. Cutting/shaving hair or trimming nails.\n2. Using perfume, scented soaps, deodorants, or wet wipes.\n3. Harming/killing animals or hunting.\n4. Sexual relations, kissing, or proposal of marriage.\n5. Cutting trees or green plants inside the Haram boundary.\n6. Engaging in arguments, foul language, or fighting." }
      ]
    }
  },
  {
    id: "dua",
    title: "Authentic Duas Guide",
    subtitle: "Prophetic supplications with translations.",
    icon: "hands-pray",
    coverUrl: "https://images.unsplash.com/photo-1609599006353-e629b1d306b8?q=80&w=400&auto=format&fit=crop",
    description: "Reciting authentic, Shariah-compliant supplications helps you follow the Sunnah during Tawaf, Sa'i, and Arafah.",
    content: {
      duas: [
        {
          arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْك، لَبَّيْكَ لاَ شَرِيكَ لَكَ لَبَّيْك، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْك، لاَ شَرِيكَ لَك",
          transliteration: "Labbayk Allahumma Labbayk, Labbayka la sharika laka Labbayk. Innal-hamda wan-ni'mata laka wal-mulk, la sharika lak.",
          translation: "Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise and grace are Yours, and all sovereignty. You have no partner.",
          context: "The Talbiyah (recite constantly while in Ihram)"
        },
        {
          arabic: "بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ اللَّهُمَّ إِيمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ",
          transliteration: "Bismillahi wa Allahu Akbar, Allahumma imanan bika wa tasdiqan bikitabika",
          translation: "In the name of Allah, Allah is the Greatest. O Allah, out of faith in You and belief in Your Book.",
          context: "Recited at the Black Stone (Hajr-e-Aswad) to begin each round of Tawaf"
        },
        {
          arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
          transliteration: "Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan waqina 'adhaban-nar.",
          translation: "Our Lord, grant us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
          context: "Sunnah dua recited between Rukn al-Yamani (Yemeni Corner) and Hajr-e-Aswad during Tawaf"
        }
      ]
    }
  },
  {
    id: "essentials",
    title: "Sunni Packing Essentials",
    subtitle: "Categorized packing list for travel & rituals.",
    icon: "clipboard-check-outline",
    coverUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=400&auto=format&fit=crop",
    description: "Prepare your packing checklist carefully to maintain the state of purity and physical health during long walks.",
    content: {
      packing: [
        "Unstitched Ihram sheets (2 sets for men)",
        "Unscented soap, shampoo, and sunscreen (for Ihram periods)",
        "Comfortable open sandals (ankles/upper foot bones must be visible for men)",
        "Pocket-sized Sunni Dua Book and prayer counter",
        "Waist belt or neck pouch with secure pockets for passport/cash",
        "Light sleeping mat or inflatable cushion for Muzdalifah open night",
        "Vaseline/unscented moisturizing lotion (to prevent thigh chafing during walking)",
        "Mini umbrella (preferably white to reflect solar heat)",
        "Refillable water bottle & hydration salts (ORS)"
      ]
    }
  }
];

// Detailed Hajj Journey stages (Screenshot 3)
const HAJJ_JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "meeqat",
    title: "1. Pre-Hajj (Entering Miqat)",
    status: "Pilgrims purify themselves and assume the sacred state of Ihram.",
    icon: "airplane",
    items: [
      {
        title: "Abar Ali (Dhu'l - Hulayfah)",
        description: "Dhu'l-Hulayfah is the Miqat boundary for pilgrims traveling from Madinah. It features a beautiful mosque where pilgrims perform Ghusl and assume Ihram.",
        imageUrl: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Perform Ghusl, wear Ihram sheets, apply perfume to body (not garments), pray 2 Rakah of Nafl, and make intention."
      },
      {
        title: "Yalamlam",
        description: "The Miqat boundary for pilgrims arriving from Yemen, India, Pakistan, Malaysia, and other countries arriving via sea/air routes from the south.",
        imageUrl: "https://images.unsplash.com/photo-1565552155433-d8c9735d4f1d?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Pilgrims on flights must assume Ihram before or when the pilot announces they are crossing the Yalamlam boundary line."
      }
    ]
  },
  {
    id: "mina",
    title: "2. 8th Dhul-Hijjah: Mina Valley",
    status: "Spent in prayer and devotion in the tent city of Mina.",
    icon: "masjid",
    items: [
      {
        title: "Mina Tent Accommodations",
        description: "Arrive at Mina before Zuhr prayer. Remain here performing prayers (Zuhr, Asr, Maghrib, Isha, and Fajr).",
        imageUrl: "https://images.unsplash.com/photo-1580927757835-23c0bf1ca1f8?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Shorten (Qasr) the 4-Rakah prayers to 2 Rakahs, but do NOT combine them. Spend time in dhikr, Quran recitation, and Talbiyah."
      }
    ]
  },
  {
    id: "arafah",
    title: "3. 9th Dhul-Hijjah: Plains of Arafah",
    status: "The pinnacle of Hajj. Hajj is not valid without standing at Arafah.",
    icon: "terrain",
    items: [
      {
        title: "Wuquf (Standing in Prayer)",
        description: "Proceed to Arafah after sunrise on the 9th. Stand in supplication and remember Allah from midday (Zawal) until sunset.",
        imageUrl: "https://images.unsplash.com/photo-1609599006353-e629b1d306b8?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Pray Zuhr and Asr combined and shortened at Zuhr time. Face Qiblah, raise hands, make sincere emotional dua. Do not leave Arafah before sunset."
      }
    ]
  },
  {
    id: "muzdalifah",
    title: "4. 9th Night: Muzdalifah",
    status: "Sleeping under the open sky and gathering stoning pebbles.",
    icon: "weather-night",
    items: [
      {
        title: "Open Sky Rest & Pebble Gathering",
        description: "Proceed to Muzdalifah immediately after sunset without praying Maghrib at Arafah. Pray Maghrib and Isha together here. Spend the night resting.",
        imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Wajib: Pray Maghrib (3 Rakahs) and Isha (2 Rakahs) combined during Isha time. Gather at least 49 small pebbles (size of chickpeas) for stoning."
      }
    ]
  },
  {
    id: "jamarat_eid",
    title: "5. 10th Dhul-Hijjah: Eid Day Rituals",
    status: "The busiest day of Hajj: Stoning, sacrifice, cutting hair, and Tawaf.",
    icon: "cards-diamond-outline",
    items: [
      {
        title: "Ramy of Jamarat al-Aqabah",
        description: "Return to Mina from Muzdalifah before sunrise. Stone the big pillar (Jamarat al-Aqabah) with 7 pebbles, saying 'Allahu Akbar' with each throw.",
        imageUrl: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Stop reciting Talbiyah when you throw the first pebble. Throw pebbles one by one. Do not throw shoes or large rocks."
      },
      {
        title: "Hady (Sacrifice) & Halq (Shaving)",
        description: "Offer a sacrificial animal (Qurbani) and shave the head (men) or trim a fingertip-length of hair (women).",
        imageUrl: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Shaving the head (Halq) is highly superior for men compared to trimming. You can now change out of Ihram sheets into normal clothes."
      },
      {
        title: "Tawaf al-Ifadah (Kaaba)",
        description: "Go to Mecca to perform Tawaf al-Ifadah (7 rounds around Kaaba) and Sa'i. This removes all Ihram restrictions completely.",
        imageUrl: "https://images.unsplash.com/photo-1565552155433-d8c9735d4f1d?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "This Tawaf is a core pillar. Once done, marital relations are permitted again (Tahal-lul al-Akbar)."
      }
    ]
  }
];

// Detailed Umrah Journey stages
const UMRAH_JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "u_meeqat",
    title: "1. Miqat Boundary & Ihram",
    status: "Purification, dressing, and making the sacred intention.",
    icon: "airplane",
    items: [
      {
        title: "Assume state of Ihram",
        description: "Cleanse yourself, perform Ghusl, wear unstitched sheets (men) or modest loose clothing (women). State intention for Umrah.",
        imageUrl: "https://images.unsplash.com/photo-1580927757835-23c0bf1ca1f8?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Pray 2 Rakah of Nafl before stating intention. Begin reciting Talbiyah immediately after making Niyyah."
      }
    ]
  },
  {
    id: "u_entering",
    title: "2. Entering Masjid al-Haram",
    status: "Approach the holy sanctuary with humility and respect.",
    icon: "mosque",
    items: [
      {
        title: "First Sight of the Kaaba",
        description: "Enter the Masjid with your right foot first. Lower your gaze until you see the Kaaba, then stop and make sincere dua.",
        imageUrl: "https://images.unsplash.com/photo-1591604021695-0c69b7c05981?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Recite the Masjid entrance dua. According to Prophet's companions, the first dua made upon seeing the Kaaba is accepted."
      }
    ]
  },
  {
    id: "u_tawaf",
    title: "3. Tawaf al-Umrah (7 Rounds)",
    status: "Circumambulating the Kaaba starting from the Black Stone.",
    icon: "sync",
    items: [
      {
        title: "Performing the 7 Circuits",
        description: "Circle the Kaaba 7 times counter-clockwise. Perform Idtiba (uncovering right shoulder) and Ramal (brisk pace in first 3 rounds for men).",
        imageUrl: "https://images.unsplash.com/photo-1565552155433-d8c9735d4f1d?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Point right hand toward Black Stone at the beginning of each round saying 'Allahu Akbar' (Istilam). Recite 'Rabbana atina...' between Yemeni corner and Black Stone."
      },
      {
        title: "Maqam Ibrahim & Zamzam",
        description: "After finishing Tawaf, cover your shoulder. Pray 2 Rakahs behind the Station of Abraham and drink Zamzam water.",
        imageUrl: "https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Recite Surah al-Kafirun in the 1st Rakah and Surah al-Ikhlas in the 2nd Rakah. Drink Zamzam standing while facing Qiblah."
      }
    ]
  },
  {
    id: "u_sai",
    title: "4. Sa'i (Walking between Safa & Marwah)",
    status: "7 rounds between the two historic hills.",
    icon: "walk",
    items: [
      {
        title: "Walking the Path of Hajar",
        description: "Proceed to Mount Safa. Walk between Safa and Marwah 7 times (ending at Marwah).",
        imageUrl: "https://images.unsplash.com/photo-1609599006353-e629b1d306b8?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Face the Kaaba at Safa and Marwah, raise hands and recite duas. Men should jog briskly between the green lights."
      }
    ]
  },
  {
    id: "u_cutting",
    title: "5. Hair Cutting (Halq / Taqsir)",
    status: "Exiting the state of Ihram to complete Umrah.",
    icon: "content-cut",
    items: [
      {
        title: "Shaving or Trimming Hair",
        description: "Men shave head or cut hair evenly. Women trim fingertip-length from hair ends.",
        imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=400&auto=format&fit=crop",
        sunnahInstructions: "Sunnah: Shaving (Halq) is highly recommended for men. Prophet (ﷺ) prayed thrice for those who shave and once for those who trim."
      }
    ]
  }
];

export default function HajjUmrahGuideScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // Tab State: Guides, Journey, Makkah Live
  const [activeTab, setActiveTab] = useState<"guides" | "journey" | "live">("guides");

  // Journey selection: Hajj Journey vs. Umrah Journey
  const [journeyType, setJourneyType] = useState<"hajj" | "umrah">("hajj");

  // Modal State for Guide items details
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null);

  // Checkbox state for Essentials
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const currentJourneyStages = journeyType === "hajj" ? HAJJ_JOURNEY_STAGES : UMRAH_JOURNEY_STAGES;

  // Cross-Platform WebView fallback for Makkah Live
  const renderMakkahLive = () => {
    const videoUrl = "https://www.youtube.com/embed/live_stream?channel=UCos52azQNBgW63_9uDJoPDA&autoplay=1&mute=1";
    const externalUrl = "https://www.youtube.com/channel/UCos52azQNBgW63_9uDJoPDA/live";

    const handleOpenExternal = () => {
      const { Linking } = require("react-native");
      Linking.openURL(externalUrl).catch((err: any) => console.warn("Failed to open URL:", err));
    };

    if (Platform.OS === "web") {
      return (
        <View style={styles.webVideoContainer}>
          <iframe
            src={videoUrl}
            style={{ width: "100%", height: 380, borderRadius: 12, border: "none" }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
          <Text style={[styles.videoTitle, { color: colors.onSurface }]}>KSA Quran TV - Makkah Kaaba Live 🕋</Text>
          <Text style={[styles.videoDesc, { color: colors.onSurfaceMuted, marginBottom: 12 }]}>
            Watch the live broadcast direct from Masjid al-Haram, Mecca, Saudi Arabia. Live audio and visual feed.
          </Text>
          <Pressable 
            onPress={handleOpenExternal} 
            style={[styles.actionBtn, { backgroundColor: colors.brand, alignSelf: "flex-start", marginTop: 8 }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Open in YouTube (Live Stream)</Text>
          </Pressable>
        </View>
      );
    }

    let WebViewComp: any = null;
    try {
      WebViewComp = require("react-native-webview").WebView;
    } catch {
      // WebView not available
    }

    if (WebViewComp) {
      return (
        <View style={{ height: 440, borderRadius: 12, overflow: "hidden", marginVertical: 12 }}>
          <WebViewComp
            source={{ uri: videoUrl }}
            style={{ flex: 1 }}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
          />
          <Text style={[styles.videoTitle, { color: colors.onSurface, padding: 12 }]}>KSA Quran TV - Makkah Kaaba Live 🕋</Text>
          <Pressable 
            onPress={handleOpenExternal} 
            style={[styles.actionBtn, { backgroundColor: colors.brand, marginHorizontal: 12, marginBottom: 12 }]}
          >
            <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center" }}>Open in YouTube App</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.fallbackContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="video-vintage" size={48} color={colors.brand} />
        <Text style={[styles.fallbackTitle, { color: colors.onSurface }]}>Makkah Live Stream</Text>
        <Text style={[styles.fallbackDesc, { color: colors.onSurfaceMuted }]}>
          Watch live feed from Masjid al-Haram. Use our web version or external player to watch:
        </Text>
        <Pressable 
          onPress={handleOpenExternal} 
          style={[styles.actionBtn, { backgroundColor: colors.brand }]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Open YouTube Live Stream</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Hajj &amp; Umrah</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setActiveTab("guides")}
          style={[styles.tab, activeTab === "guides" && { borderBottomColor: colors.brand }]}
        >
          <Text style={[styles.tabText, { color: activeTab === "guides" ? colors.brand : colors.onSurfaceMuted, fontWeight: activeTab === "guides" ? "700" : "500" }]}>
            Guides
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("journey")}
          style={[styles.tab, activeTab === "journey" && { borderBottomColor: colors.brand }]}
        >
          <Text style={[styles.tabText, { color: activeTab === "journey" ? colors.brand : colors.onSurfaceMuted, fontWeight: activeTab === "journey" ? "700" : "500" }]}>
            Journey Timeline
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("live")}
          style={[styles.tab, activeTab === "live" && { borderBottomColor: colors.brand }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[styles.tabText, { color: activeTab === "live" ? colors.brand : colors.onSurfaceMuted, fontWeight: activeTab === "live" ? "700" : "500" }]}>
              Makkah Live
            </Text>
            <View style={styles.liveDot} />
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Tab 1: Guides Grid */}
        {activeTab === "guides" && (
          <View style={styles.gridContainer}>
            {GUIDE_ITEMS.map(guide => (
              <Pressable
                key={guide.id}
                onPress={() => setSelectedGuide(guide)}
                style={[styles.gridCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              >
                <Image source={{ uri: guide.coverUrl }} style={styles.cardImage} />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={1}>
                    {guide.title}
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
                    {guide.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Tab 2: Hajj & Umrah Journey Timeline */}
        {activeTab === "journey" && (
          <View>
            {/* Toggle between Hajj and Umrah Journey */}
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setJourneyType("hajj")}
                style={[styles.toggleBtn, journeyType === "hajj" && { backgroundColor: colors.brand }]}
              >
                <Text style={[styles.toggleBtnText, { color: journeyType === "hajj" ? "#fff" : colors.onSurface }]}>Hajj Journey</Text>
              </Pressable>
              <Pressable
                onPress={() => setJourneyType("umrah")}
                style={[styles.toggleBtn, journeyType === "umrah" && { backgroundColor: colors.brand }]}
              >
                <Text style={[styles.toggleBtnText, { color: journeyType === "umrah" ? "#fff" : colors.onSurface }]}>Umrah Journey</Text>
              </Pressable>
            </View>

            <View style={styles.timelineContainer}>
              {currentJourneyStages.map((stage, sIdx) => {
                const isLastStage = sIdx === currentJourneyStages.length - 1;
                return (
                  <View key={stage.id} style={styles.timelineStage}>
                    {/* Left Line & Icon */}
                    <View style={styles.timelineLeft}>
                      <View style={[styles.timelineIconBg, { backgroundColor: colors.brand }]}>
                        <MaterialCommunityIcons name={stage.icon as any} size={18} color="#fff" />
                      </View>
                      {!isLastStage && <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />}
                    </View>

                    {/* Right Content */}
                    <View style={styles.timelineRight}>
                      <Text style={[styles.stageTitle, { color: colors.brand }]}>{stage.title}</Text>
                      <Text style={[styles.stageStatus, { color: colors.onSurfaceMuted }]}>{stage.status}</Text>
                      
                      {/* Sub cards */}
                      {stage.items.map((item, itemIdx) => (
                        <View key={itemIdx} style={[styles.journeyItemCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                          <Image source={{ uri: item.imageUrl }} style={styles.journeyImage} />
                          <View style={styles.journeyItemInfo}>
                            <Text style={[styles.journeyItemTitle, { color: colors.onSurface }]}>{item.title}</Text>
                            <Text style={[styles.journeyItemDesc, { color: colors.onSurfaceSecondary }]}>{item.description}</Text>
                            {item.sunnahInstructions && (
                              <View style={[styles.instructionBox, { backgroundColor: colors.surface }]}>
                                <Text style={[styles.instructionLabel, { color: colors.brand }]}>Sunnah / Shariah Guide:</Text>
                                <Text style={[styles.instructionText, { color: colors.onSurfaceSecondary }]}>{item.sunnahInstructions}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Tab 3: Makkah Live */}
        {activeTab === "live" && (
          <View style={styles.liveContainer}>
            {renderMakkahLive()}
          </View>
        )}

      </ScrollView>

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <Modal
          visible={!!selectedGuide}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedGuide(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>{selectedGuide.title}</Text>
                <Pressable onPress={() => setSelectedGuide(null)} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: "80%" }}>
                <Image source={{ uri: selectedGuide.coverUrl }} style={styles.modalCover} />
                <Text style={[styles.modalDesc, { color: colors.onSurfaceSecondary }]}>
                  {selectedGuide.description}
                </Text>

                {/* Steps List */}
                {selectedGuide.content.steps && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>Ritual Steps &amp; Procedure</Text>
                    {selectedGuide.content.steps.map((step, idx) => (
                      <View key={idx} style={[styles.stepItem, { borderLeftColor: colors.brand }]}>
                        <Text style={[styles.stepItemTitle, { color: colors.onSurface }]}>{step.title}</Text>
                        <Text style={[styles.stepItemDesc, { color: colors.onSurfaceSecondary }]}>{step.desc}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Duas */}
                {selectedGuide.content.duas && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>Key Supplications (Duas)</Text>
                    {selectedGuide.content.duas.map((dua, idx) => (
                      <View key={idx} style={[styles.duaBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                        <Text style={[styles.duaArabic, { color: colors.onSurface }]}>{dua.arabic}</Text>
                        <Text style={[styles.duaTranslit, { color: colors.brand }]}>{dua.transliteration}</Text>
                        <Text style={[styles.duaTrans, { color: colors.onSurfaceSecondary }]}>{dua.translation}</Text>
                        {dua.context && (
                          <Text style={[styles.duaContext, { color: colors.onSurfaceMuted }]}>Context: {dua.context}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Packing List */}
                {selectedGuide.content.packing && (
                  <View style={styles.modalSection}>
                    <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>Packing Checklist</Text>
                    {selectedGuide.content.packing.map((pack, idx) => {
                      const isChecked = !!checkedItems[pack];
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => toggleCheck(pack)}
                          style={styles.packingCheckRow}
                        >
                          <MaterialCommunityIcons
                            name={isChecked ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={22}
                            color={isChecked ? colors.brand : colors.onSurfaceMuted}
                          />
                          <Text style={[styles.packingCheckText, { color: colors.onSurface, textDecorationLine: isChecked ? "line-through" : "none" }]}>
                            {pack}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: { fontSize: 18, fontWeight: "700" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#ef4444",
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 48,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  gridCard: {
    width: "47%",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  cardImage: {
    width: "100%",
    height: 110,
    resizeMode: "cover",
  },
  cardInfo: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineStage: {
    flexDirection: "row",
    marginBottom: 24,
  },
  timelineLeft: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  timelineRight: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  stageStatus: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12,
  },
  journeyItemCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  journeyImage: {
    width: "100%",
    height: 150,
    resizeMode: "cover",
  },
  journeyItemInfo: {
    padding: 12,
  },
  journeyItemTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  journeyItemDesc: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  instructionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#ECC97A",
  },
  instructionLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  instructionText: {
    fontSize: 11,
    lineHeight: 16,
  },
  liveContainer: {
    paddingVertical: 8,
  },
  webVideoContainer: {
    width: "100%",
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 12,
  },
  videoDesc: {
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  fallbackContainer: {
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  fallbackDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  modalCover: {
    width: "100%",
    height: 180,
    borderRadius: theme.radius.md,
    marginBottom: 16,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    marginBottom: 16,
  },
  stepItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  stepItemDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  duaBox: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  duaArabic: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: "right",
    fontWeight: "600",
  },
  duaTranslit: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 18,
  },
  duaTrans: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  duaContext: {
    fontSize: 10,
    marginTop: 6,
    fontStyle: "italic",
  },
  packingCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  packingCheckText: {
    fontSize: 13,
  },
});
