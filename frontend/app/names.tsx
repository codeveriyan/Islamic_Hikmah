import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, Share, Dimensions, ScrollView, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { theme } from "@/src/theme";
import { ALLAH_NAMES, AllahName } from "@/src/data/names";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";

const { width } = Dimensions.get("window");
const GRID_ITEM_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md * 2) / 3;

function formatTime(secs: number) {
  if (isNaN(secs) || secs === undefined || secs === null) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AllahNamesScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const arabicFontFamily = useArabicFont();
  const { profile } = useAuth();
  const { showPremiumModal } = usePremiumModal();

  // Tab State: 'intro' | 'allah' | 'islamic_names'
  const [activeTab, setActiveTab] = useState<"intro" | "allah" | "islamic_names">("intro");
  const [isGrid, setIsGrid] = useState(true);
  const [playingNumber, setPlayingNumber] = useState<number | null>(null);
  const [selectedName, setSelectedName] = useState<AllahName | null>(null);

  // UmmahAPI Islamic Names state
  const [islamicNames, setIslamicNames] = useState<Array<{
    id: number;
    name: string;
    arabic: string;
    gender: string;
    meaning: string;
    origin: string;
    root?: string;
    note?: string;
  }>>([]);
  const [namesSearch, setNamesSearch] = useState("");
  const [namesGender, setNamesGender] = useState<"all" | "male" | "female">("all");
  const [namesLoading, setNamesLoading] = useState(false);

  // Fetch live Islamic Names from UmmahAPI
  useEffect(() => {
    if (activeTab !== "islamic_names") return;
    setNamesLoading(true);
    let url = `https://www.ummahapi.com/api/names?limit=210`;
    if (namesGender !== "all") url += `&gender=${namesGender}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.names && Array.isArray(json.data.names)) {
          setIslamicNames(json.data.names);
        }
      })
      .catch((err) => console.warn("UmmahAPI names fetch error:", err))
      .finally(() => setNamesLoading(false));
  }, [activeTab, namesGender]);

  // Play All state (Single MP3 track of Mishary Rashid Alafasy)
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [progressBarWidth, setProgressBarWidth] = useState(0);

  const currentTime = status?.currentTime || 0;
  const duration = status?.duration || 0;
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch (e) {}
    };
  }, [player]);

  const handleShare = async (item: AllahName) => {
    try {
      await Share.share({
        message: `${item.number}. ${item.transliteration} (${item.name})\nMeaning: ${item.meaning}\nExplanation: ${item.explanation}\nShared via Islamic Hikmah 🕌`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Reset playingNumber when playback finishes
  useEffect(() => {
    if (playingNumber !== null && !status?.playing && status?.currentTime > 0) {
      setPlayingNumber(null);
    }
  }, [status?.playing, status?.currentTime, playingNumber]);

  // Play individual Name audio (fast jsDelivr CDN)
  const playNameAudio = useCallback(async (item: AllahName) => {
    Haptics.selectionAsync().catch(() => {});
    if (profile?.tier !== "premium" && !profile?.trialActive) {
      showPremiumModal("Asma Al-Husna Audio");
      return;
    }
    if (isPlayingAll) {
      setIsPlayingAll(false);
    }
    try {
      setPlayingNumber(item.number);
      const audioUrl = `https://cdn.jsdelivr.net/gh/soachishti/Asma-ul-Husna@master/audio/${item.number}.mp3`;
      player.replace({ uri: audioUrl });
      player.play();
    } catch (err) {
      console.error("Failed to play name audio:", err);
    }
  }, [player, isPlayingAll, profile?.tier]);

  // Play full 99 names track (Alafasy)
  const startPlayAll = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (profile?.tier !== "premium" && !profile?.trialActive) {
      showPremiumModal("Play All 99 Names");
      return;
    }
    setPlayingNumber(null);
    setIsPlayingAll(true);
    try {
      player.replace(require("../assets/audio/asma_ul_husna.mp3"));
      player.play();
    } catch (err) {
      console.error("Failed to play full Asma ul Husna audio:", err);
    }
  }, [player, profile?.tier]);

  const pausePlayAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    try {
      player.pause();
    } catch (e) {}
  }, [player]);

  const resumePlayAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    try {
      player.play();
    } catch (e) {}
  }, [player]);

  const stopPlayAll = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setIsPlayingAll(false);
    try {
      player.pause();
    } catch (e) {}
  }, [player]);

  const handleSeek = (e: any) => {
    if (progressBarWidth > 0 && duration) {
      const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / progressBarWidth));
      const targetSeconds = pct * duration;
      try {
        player.seekTo(targetSeconds);
      } catch (e) {}
    }
  };

  const skipForward = useCallback(() => {
    if (duration > 0) {
      const nextTime = Math.min(duration, currentTime + 10);
      try {
        player.seekTo(nextTime);
      } catch (e) {}
    }
  }, [currentTime, duration, player]);

  const skipBackward = useCallback(() => {
    const prevTime = Math.max(0, currentTime - 10);
    try {
      player.seekTo(prevTime);
    } catch (e) {}
  }, [currentTime, player]);

  const renderListItem = useCallback(({ item }: { item: AllahName }) => {
    const isPlaying = playingNumber === item.number;
    return (
      <Pressable 
        onPress={() => setSelectedName(item)}
        style={({ pressed }) => [
          styles.listCard, 
          { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, borderWidth: 1 },
          isPlaying && { borderColor: colors.brand, borderWidth: 1.5 },
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.indexBadge, { backgroundColor: colors.brand }]}>
            <Text style={styles.indexText}>{item.number}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {/* Outline Play Icon Button */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                playNameAudio(item);
              }}
              style={({ pressed }) => [
                styles.playIconOnlyBtn,
                pressed && { opacity: 0.6 }
              ]}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name={isPlaying ? "volume-high" : "play-outline"}
                size={20}
                color={colors.brand}
              />
            </Pressable>

            <Pressable onPress={() => handleShare(item)} hitSlop={8} style={styles.shareBtn}>
              <MaterialCommunityIcons name="share-variant" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.translitText, { color: colors.onSurface }]}>{item.transliteration}</Text>
            <Text style={[styles.meaningText, { color: colors.onSurfaceMuted }]}>{item.meaning}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[styles.arabicText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>{item.name}</Text>
          </View>
        </View>
      </Pressable>
    );
  }, [colors, playingNumber, playNameAudio, arabicFontFamily]);

  const renderGridItem = useCallback(({ item }: { item: AllahName }) => {
    const isPlaying = playingNumber === item.number;
    return (
      <Pressable 
        onPress={() => setSelectedName(item)}
        style={({ pressed }) => [
          styles.gridCard, 
          { backgroundColor: colors.surfaceSecondary, width: GRID_ITEM_WIDTH, borderColor: colors.border, borderWidth: 1 },
          isPlaying && { borderWidth: 1.5, borderColor: colors.brand },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
        ]}
      >
        <View style={styles.gridCardLeft}>
          <View style={[styles.indexBadge, { backgroundColor: colors.brand }]}>
            <Text style={styles.indexText}>{item.number}</Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              playNameAudio(item);
            }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.playIconOnlyBtn,
              pressed && { opacity: 0.6 }
            ]}
          >
            <MaterialCommunityIcons
              name={isPlaying ? "volume-high" : "play-outline"}
              size={20}
              color={colors.brand}
            />
          </Pressable>
        </View>

        <View style={styles.gridCardMiddle}>
          <Text style={[styles.translitGridText, { color: colors.onSurface }]} numberOfLines={1}>
            {item.transliteration}
          </Text>
          <Text style={[styles.meaningGridText, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
            {item.meaning}
          </Text>
        </View>

        <View style={styles.gridCardRight}>
          <Text style={[styles.arabicGridText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
            {item.name}
          </Text>
        </View>
      </Pressable>
    );
  }, [colors, playingNumber, playNameAudio, arabicFontFamily, GRID_ITEM_WIDTH]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Asma Al-Husna</Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          {activeTab === "allah" && (
            <Pressable onPress={() => setIsGrid((g) => !g)} hitSlop={10}>
              <MaterialCommunityIcons
                name={isGrid ? "view-list-outline" : "view-grid-outline"}
                size={24}
                color={colors.brand}
              />
            </Pressable>
          )}
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Tab Selector: Intro | 99 Names of Allah | Islamic Baby Names */}
      <View style={{ flexDirection: "row", marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.surfaceSecondary, borderRadius: 12, padding: 4 }}>
        <Pressable
          onPress={() => setActiveTab("intro")}
          style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8, backgroundColor: activeTab === "intro" ? colors.brand : "transparent" }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === "intro" ? "#FFF" : colors.onSurfaceMuted }}>
            📖 Overview
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("allah")}
          style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8, backgroundColor: activeTab === "allah" ? colors.brand : "transparent" }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === "allah" ? "#FFF" : colors.onSurfaceMuted }}>
            ✨ 99 Names
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("islamic_names")}
          style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8, backgroundColor: activeTab === "islamic_names" ? colors.brand : "transparent" }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === "islamic_names" ? "#FFF" : colors.onSurfaceMuted }}>
            👶 Baby Names
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: INTRODUCTION / FOUNDATION OVERVIEW */}
      {activeTab === "intro" ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* Hero Banner Card */}
          <View style={[styles.introHeroCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.introHeroTitleAra, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
              وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا
            </Text>
            <Text style={[styles.introHeroTitleEng, { color: colors.onSurface }]}>
              Al-Asma' Al-Husna
            </Text>
            <Text style={[styles.introHeroSub, { color: colors.onSurfaceMuted }]}>
              The Most Beautiful Names &amp; Attributes of Allah
            </Text>
          </View>

          {/* Section 1: What are the 99 names of Allah? */}
          <View style={[styles.introSectionCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="book-open-page-variant" size={22} color={colors.brand} />
              <Text style={[styles.introSectionHeader, { color: colors.onSurface }]}>
                What are the 99 names of Allah?
              </Text>
            </View>
            
            <Text style={[styles.introParagraph, { color: colors.onSurface }]}>
              <Text style={{ fontWeight: "700" }}>Al-asma' al-husna</Text>, "the most beautiful names," is the Quranic term for the divine names that describe Allah's attributes. The foundational verse is <Text style={{ fontWeight: "700" }}>al-A'raf 7:180</Text>:
            </Text>

            {/* Quran Verse Callout */}
            <View style={[styles.verseCallout, { backgroundColor: colors.brand + "10", borderColor: colors.brand + "30" }]}>
              <Text style={[styles.verseArabicText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا وَذَرُوا الَّذِينَ يُلْحِدُونَ فِي أَسْمَائِهِ
              </Text>
              <Text style={[styles.verseEnglishText, { color: colors.onSurface }]}>
                "And to Allah belong the best names, so invoke Him by them. And leave [the company of] those who practice deviation concerning His names." <Text style={{ fontStyle: "italic", color: colors.onSurfaceMuted }}>(Sahih International)</Text>
              </Text>
            </View>

            <Text style={[styles.introParagraph, { color: colors.onSurface, marginTop: 10 }]}>
              The Prophet (peace be upon him) reported a specific count of ninety-nine in Sahih al-Bukhari. However, <Text style={{ fontWeight: "700" }}>Ibn Kathir</Text>, in his tafsir of 7:180, clarifies that Allah's names are not limited to ninety-nine: the hadith specifies a count whose enumeration carries a particular reward, while broader Quranic and Sunnah evidence shows divine attributes beyond any fixed list.
            </Text>
          </View>

          {/* Section 2: Where the names appear in the Quran */}
          <View style={[styles.introSectionCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="book-cross" size={22} color={colors.brand} />
              <Text style={[styles.introSectionHeader, { color: colors.onSurface }]}>
                Where the names appear in the Quran
              </Text>
            </View>

            <Text style={[styles.introParagraph, { color: colors.onSurface }]}>
              Four ayat anchor the doctrine of al-asma' al-husna directly, each adding a different emphasis:
            </Text>

            {/* Ayat 1 */}
            <View style={[styles.ayatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ayatRefTag, { color: colors.brand }]}>al-A'raf 7:180</Text>
              <Text style={[styles.ayatArabicText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا
              </Text>
              <Text style={[styles.ayatEngText, { color: colors.onSurface }]}>
                "And to Allah belong the best names, so invoke Him by them."
              </Text>
              <Text style={[styles.ayatCommentary, { color: colors.onSurfaceMuted }]}>
                The foundational command: call upon Allah using His own names, and warn against ilhad (deviation).
              </Text>
            </View>

            {/* Ayat 2 */}
            <View style={[styles.ayatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ayatRefTag, { color: colors.brand }]}>al-Isra 17:110</Text>
              <Text style={[styles.ayatArabicText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                قُلِ ادْعُوا اللَّهَ أَوِ ادْعُوا الرَّحْمَٰنَ ۖ أَيًّا مَّا تَدْعُوا فَلَهُ الْأَسْمَاءُ الْحُسْنَىٰ
              </Text>
              <Text style={[styles.ayatEngText, { color: colors.onSurface }]}>
                "Say, 'Call upon Allah or call upon the Most Merciful (Ar-Rahman). Whichever [name] you call, to Him belong the best names.'"
              </Text>
              <Text style={[styles.ayatCommentary, { color: colors.onSurfaceMuted }]}>
                Establishes that different names address the same single Lord.
              </Text>
            </View>

            {/* Ayat 3 */}
            <View style={[styles.ayatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ayatRefTag, { color: colors.brand }]}>Ta-Ha 20:8</Text>
              <Text style={[styles.ayatArabicText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ
              </Text>
              <Text style={[styles.ayatEngText, { color: colors.onSurface }]}>
                "Allah, there is no deity except Him. To Him belong the best names."
              </Text>
              <Text style={[styles.ayatCommentary, { color: colors.onSurfaceMuted }]}>
                Ties the names to the central declaration of tawhid.
              </Text>
            </View>

            {/* Ayat 4 */}
            <View style={[styles.ayatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.ayatRefTag, { color: colors.brand }]}>al-Hashr 59:24</Text>
              <Text style={[styles.ayatArabicText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ
              </Text>
              <Text style={[styles.ayatEngText, { color: colors.onSurface }]}>
                "He is Allah, the Creator, the Inventor, the Fashioner. To Him belong the best names."
              </Text>
              <Text style={[styles.ayatCommentary, { color: colors.onSurfaceMuted }]}>
                Lists three names back-to-back: al-Khaliq, al-Bari', al-Musawwir.
              </Text>
            </View>

            <Text style={[styles.introParagraph, { color: colors.onSurfaceMuted, fontSize: 12, marginTop: 6 }]}>
              Of the four, al-Hashr 59:22-24 carries the densest cluster of divine names in the Quran and serves as the central textual basis cited by classical scholars compiling their own catalogs.
            </Text>
          </View>

          {/* Section 3: The hadith of the 99 names */}
          <View style={[styles.introSectionCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.brand} />
              <Text style={[styles.introSectionHeader, { color: colors.onSurface }]}>
                The Hadith of the 99 Names
              </Text>
            </View>

            <Text style={[styles.introParagraph, { color: colors.onSurface }]}>
              The textual basis for the count of ninety-nine sits in two of the most authentic collections, <Text style={{ fontWeight: "700" }}>Sahih al-Bukhari</Text> and <Text style={{ fontWeight: "700" }}>Sahih Muslim</Text>, both narrated through Abu Hurairah (may Allah be pleased with him). The hadith appears in Sahih al-Bukhari under Kitab al-Da'awat (the Book of Invocations), where the chapter heading itself reads <Text style={{ fontStyle: "italic" }}>"Allah has one hundred Names less one."</Text>
            </Text>

            {/* Bukhari Hadith Box */}
            <View style={[styles.hadithCallout, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.hadithArabicText, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                لِلَّهِ تِسْعَةٌ وَتِسْعُونَ اسْمًا، مِائَةٌ إِلاَّ وَاحِدًا، لاَ يَحْفَظُهَا أَحَدٌ إِلاَّ دَخَلَ الْجَنَّةَ، وَهْوَ وَتْرٌ يُحِبُّ الْوَتْرَ
              </Text>
              <Text style={[styles.hadithEngText, { color: colors.onSurface }]}>
                "Allah has ninety-nine Names, i.e., one hundred minus one, and whoever believes in their meanings and acts accordingly, will enter Paradise; and Allah is witr (one) and loves 'the witr' (i.e., odd numbers)."
              </Text>
              <Text style={[styles.hadithSource, { color: colors.brand }]}>
                Sahih al-Bukhari 6410 (Book 80, Hadith 105)
              </Text>
            </View>

            {/* Muslim Hadith Box */}
            <View style={[styles.hadithCallout, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.hadithEngText, { color: colors.onSurface }]}>
                "There are ninety-nine names of Allah; he who commits them to memory would get into Paradise. Verily, Allah is Odd (He is one, and it is an odd number) and He loves odd number."
              </Text>
              <Text style={[styles.hadithSource, { color: colors.brand }]}>
                Sahih Muslim 2677a (Book 48, Hadith 5)
              </Text>
            </View>

            {/* Ibn al-Qayyim Explanation */}
            <View style={[styles.scholarlyBox, { backgroundColor: colors.brand + "10", borderColor: colors.brand + "30" }]}>
              <Text style={[styles.scholarlyHeader, { color: colors.brand }]}>
                Level of Ihsa' (إحصاء) — Explanation by Ibn al-Qayyim:
              </Text>
              <Text style={[styles.scholarlyBody, { color: colors.onSurface }]}>
                The verb the scholars examine most closely is <Text style={{ fontWeight: "700" }}>ihsa' (إحصاء)</Text>, often rendered as "memorize" or "enumerate." Ibn al-Qayyim explained ihsa' across three levels:
              </Text>
              <Text style={[styles.scholarlyList, { color: colors.onSurface }]}>
                1. Memorizing the wording of the names.{"\n"}
                2. Understanding their deep meanings.{"\n"}
                3. Calling upon Allah by them in du'a and living according to their guidance.
              </Text>
              <Text style={[styles.scholarlyFooter, { color: colors.onSurfaceMuted }]}>
                Rote repetition without comprehension does not satisfy what the hadith asks for.
              </Text>
            </View>

            {/* Tirmidhi Grading Note */}
            <Text style={[styles.introParagraph, { color: colors.onSurface, marginTop: 10 }]}>
              The famous enumerated list of 99 names that appears in nearly every printed poster and web resource traces to a single hadith in <Text style={{ fontWeight: "700" }}>Jami` at-Tirmidhi (Tirmidhi 3507)</Text>. Al-Tirmidhi himself classified that narration as <Text style={{ fontStyle: "italic" }}>gharib</Text> (rare/unusual), and Darussalam grades it <Text style={{ fontStyle: "italic" }}>da'if</Text> (weak). The count of ninety-nine in Bukhari and Muslim is sound; the specific enumeration that follows it is a later compilation.
            </Text>
          </View>

          {/* Action Button */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setActiveTab("allah");
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.brand },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
          >
            <Text style={styles.actionBtnTxt}>
              ✨ Explore All 99 Names of Allah
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
          </Pressable>

        </ScrollView>
      ) : activeTab === "islamic_names" ? (
        /* TAB 3: ISLAMIC BABY NAMES DIRECTORY */
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          {/* Gender Filter Pills */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            {(["all", "male", "female"] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => setNamesGender(g)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: namesGender === g ? colors.brand : colors.surfaceSecondary,
                  borderWidth: 1, borderColor: namesGender === g ? colors.brand : colors.border,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "700", color: namesGender === g ? "#FFF" : colors.onSurfaceSecondary }}>
                  {g === "all" ? "All Names" : g === "male" ? "👦 Male" : "👧 Female"}
                </Text>
              </Pressable>
            ))}
          </View>

          {namesLoading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={islamicNames}
              keyExtractor={(item) => String(item.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
              renderItem={({ item }) => (
                <View style={[styles.listCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, padding: 14 }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.onSurface }}>{item.name}</Text>
                      <Text style={{ fontFamily: "AmiriBold", fontSize: 22, color: colors.brand }}>{item.arabic}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.onSurfaceSecondary, marginBottom: 4 }}>{item.meaning}</Text>
                    {item.note ? (
                      <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, fontStyle: "italic" }}>{item.note}</Text>
                    ) : null}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        /* TAB 2: 99 NAMES OF ALLAH GRID / LIST */
        <>
          {/* Play Asma Al Husna Banner */}
          {!isPlayingAll && (
            <Pressable 
              onPress={startPlayAll}
              style={({ pressed }) => [
                styles.playAllBanner,
                { backgroundColor: colors.brand + "18", borderColor: colors.brand + "33" },
                pressed && { opacity: 0.85 }
              ]}
            >
              <View style={[styles.playIconCircle, { backgroundColor: colors.brand }]}>
                <MaterialCommunityIcons name="play" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.playBannerTitle, { color: colors.onSurface }]}>Play Asma Al Husna</Text>
                <Text style={[styles.playBannerSub, { color: colors.onSurfaceMuted }]}>Listen to all 99 Names of Allah recited in one go</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.brand} />
            </Pressable>
          )}

          {/* Names List */}
          <FlatList
            ref={flatListRef}
            key={isGrid ? "grid" : "list"}
            data={ALLAH_NAMES}
            keyExtractor={(item) => String(item.number)}
            renderItem={isGrid ? renderGridItem : renderListItem}
            numColumns={isGrid ? 3 : 1}
            contentContainerStyle={{
              padding: theme.spacing.lg,
              gap: theme.spacing.md,
              paddingBottom: isPlayingAll ? 130 : 40,
            }}
            columnWrapperStyle={isGrid ? { gap: theme.spacing.md } : null}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* ─── Premium Floating Music Player Bar (Full track) ─── */}
      {isPlayingAll && (
        <View style={[styles.floatingPlayer, { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border }]}>
          <Pressable 
            onPress={handleSeek}
            onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
            style={styles.playerProgressBg}
          >
            <View style={[styles.playerProgressFill, { backgroundColor: colors.brand, width: `${progressPercentage}%` }]} />
          </Pressable>

          <View style={styles.playerContent}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.playerTitle, { color: colors.onSurface }]} numberOfLines={1}>
                Asma-ul-Husna Recitation
              </Text>
              <Text style={[styles.playerSubtitle, { color: colors.brand }]} numberOfLines={1}>
                Sheikh Mishary Rashid Alafasy
              </Text>
              <Text style={[styles.playerTimeText, { color: colors.onSurfaceMuted }]}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </View>

            <View style={styles.playerControls}>
              <Pressable onPress={skipBackward} style={styles.controlBtn} hitSlop={6}>
                <MaterialCommunityIcons name="rewind" size={28} color={colors.onSurface} />
              </Pressable>

              <Pressable 
                onPress={player.playing ? pausePlayAll : resumePlayAll} 
                style={[styles.playerPlayBtn, { backgroundColor: colors.brand }]}
                hitSlop={6}
              >
                <MaterialCommunityIcons name={player.playing ? "pause" : "play"} size={26} color="#FFF" />
              </Pressable>

              <Pressable onPress={skipForward} style={styles.controlBtn} hitSlop={6}>
                <MaterialCommunityIcons name="fast-forward" size={28} color={colors.onSurface} />
              </Pressable>

              <Pressable onPress={stopPlayAll} style={[styles.controlBtn, { marginLeft: 4 }]} hitSlop={6}>
                <MaterialCommunityIcons name="close-circle-outline" size={24} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Name Details Modal */}
      <Modal
        visible={selectedName !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedName(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedName(null)}>
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.modalContent, 
              { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }
            ]}
          >
            {selectedName && (
              <View style={{ flex: 1, width: "100%" }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
                    Name #{selectedName.number} Details
                  </Text>
                  <Pressable onPress={() => setSelectedName(null)} hitSlop={10}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceMuted} />
                  </Pressable>
                </View>

                <ScrollView 
                  style={styles.modalScrollView} 
                  contentContainerStyle={{ paddingBottom: 30 }}
                  showsVerticalScrollIndicator={true}
                >
                  <View style={styles.detailCard}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center" }}>
                      <Text style={[styles.detailArabic, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                        {selectedName.name}
                      </Text>

                      {/* Small Play Button in Modal Header */}
                      <Pressable
                        onPress={() => playNameAudio(selectedName)}
                        style={({ pressed }) => [
                          styles.smallPlayBtn,
                          { backgroundColor: playingNumber === selectedName.number ? colors.brand : colors.brand + "22" },
                          pressed && { opacity: 0.8 }
                        ]}
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons
                          name={playingNumber === selectedName.number ? "volume-high" : "play"}
                          size={16}
                          color={playingNumber === selectedName.number ? "#FFF" : colors.brand}
                        />
                      </Pressable>
                    </View>

                    <Text style={[styles.detailTranslit, { color: colors.onSurface }]}>
                      {selectedName.transliteration}
                    </Text>
                    <Text style={[styles.detailMeaning, { color: colors.brand }]}>
                      {selectedName.meaning}
                    </Text>
                  </View>

                  {/* About Section */}
                  {selectedName.about ? (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.brand }]}>About &amp; Meaning</Text>
                      <Text style={[styles.sectionBody, { color: colors.onSurface }]}>
                        {selectedName.about}
                      </Text>
                    </View>
                  ) : null}

                  {/* Quranic Verses Section */}
                  {selectedName.quranicVerses && selectedName.quranicVerses.length > 0 ? (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.brand }]}>
                        {selectedName.transliteration} in the Quran
                      </Text>
                      {selectedName.quranicVerses.map((v, idx) => (
                        <View key={idx} style={[styles.modalVerseBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                          <Text style={[styles.modalVerseArabic, { color: colors.brand, fontFamily: arabicFontFamily || "NotoNaskhArabic" }]}>
                            {v.arabic}
                          </Text>
                          <Text style={[styles.modalVerseEng, { color: colors.onSurface }]}>
                            "{v.english}"
                          </Text>
                          <Text style={[styles.modalVerseRef, { color: colors.onSurfaceMuted }]}>
                            — {v.reference}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {/* Summary & Attribute */}
                  {selectedName.explanation ? (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.brand }]}>Attributes &amp; Explanation</Text>
                      <Text style={[styles.sectionBody, { color: colors.onSurface }]}>
                        {selectedName.explanation}
                      </Text>
                    </View>
                  ) : null}

                  {/* Benefits & Spiritual Virtues */}
                  {selectedName.benefit ? (
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.brand }]}>Benefits &amp; Spiritual Virtues</Text>
                      <Text style={[styles.sectionBody, { color: colors.onSurface }]}>
                        {selectedName.benefit}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    onPress={() => {
                      const itemToPlay = selectedName;
                      playNameAudio(itemToPlay);
                    }}
                    style={[styles.modalAudioBtn, { backgroundColor: colors.brand }]}
                  >
                    <MaterialCommunityIcons name="play-circle-outline" size={20} color="#FFF" />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFF" }}>
                      Listen to Pronunciation
                    </Text>
                  </Pressable>
                </ScrollView>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  title: { fontSize: 20, fontWeight: "800" },
  playAllBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: theme.spacing.md,
  },
  playIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  playBannerTitle: { fontSize: 15, fontWeight: "800" },
  playBannerSub: { fontSize: 12, marginTop: 2 },
  listCard: {
    padding: theme.spacing.md,
    borderRadius: 16,
    gap: theme.spacing.xs,
  },
  gridCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    height: 105,
    gap: 12,
  },
  gridCardLeft: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  gridCardMiddle: {
    flex: 1,
    justifyContent: "center",
  },
  gridCardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  indexBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  indexText: { fontSize: 14, fontWeight: "800", color: "#FFF" },
  playIconOnlyBtn: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBtn: { padding: 4 },
  smallPlayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  smallGridPlayBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  translitText: { fontSize: 16, fontWeight: "800" },
  meaningText: { fontSize: 13, marginTop: 2 },
  arabicText: { fontSize: 26, fontWeight: "700" },
  arabicGridText: { fontSize: 26, fontWeight: "700", textAlign: "right" },
  translitGridText: { fontSize: 15, fontWeight: "800" },
  meaningGridText: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  floatingPlayer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  playerProgressBg: {
    height: 4,
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    borderRadius: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  playerProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playerTitle: { fontSize: 14, fontWeight: "800" },
  playerSubtitle: { fontSize: 12, fontWeight: "600", marginTop: 1 },
  playerTimeText: { fontSize: 11, marginTop: 2 },
  playerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlBtn: { padding: 4 },
  playerPlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalContent: {
    width: "90%",
    maxWidth: 820,
    height: "85%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    overflow: "hidden",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalScrollView: { flex: 1 },
  detailCard: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    gap: 6,
  },
  detailArabic: { fontSize: 52, fontWeight: "700" },
  detailTranslit: { fontSize: 26, fontWeight: "800", marginTop: 6 },
  detailMeaning: { fontSize: 18, fontWeight: "700" },
  section: {
    marginTop: theme.spacing.lg,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  sectionBody: { fontSize: 15, lineHeight: 25 },
  modalAudioBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  introHeroCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 16,
  },
  introHeroTitleAra: {
    fontSize: 26,
    lineHeight: 40,
    textAlign: "center",
    marginBottom: 6,
  },
  introHeroTitleEng: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 2,
  },
  introHeroSub: {
    fontSize: 13,
    fontWeight: "600",
  },
  introSectionCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  introSectionHeader: {
    fontSize: 17,
    fontWeight: "800",
  },
  introParagraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  verseCallout: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  verseArabicText: {
    fontSize: 20,
    lineHeight: 34,
    textAlign: "right",
  },
  verseEnglishText: {
    fontSize: 13,
    lineHeight: 20,
  },
  ayatCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  ayatRefTag: {
    fontSize: 12,
    fontWeight: "800",
  },
  ayatArabicText: {
    fontSize: 19,
    lineHeight: 32,
    textAlign: "right",
  },
  ayatEngText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  ayatCommentary: {
    fontSize: 12,
    lineHeight: 18,
  },
  hadithCallout: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  hadithArabicText: {
    fontSize: 19,
    lineHeight: 32,
    textAlign: "right",
  },
  hadithEngText: {
    fontSize: 13,
    lineHeight: 20,
  },
  hadithSource: {
    fontSize: 12,
    fontWeight: "700",
  },
  scholarlyBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  scholarlyHeader: {
    fontSize: 13,
    fontWeight: "800",
  },
  scholarlyBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  scholarlyList: {
    fontSize: 13,
    lineHeight: 22,
    paddingLeft: 4,
  },
  scholarlyFooter: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  actionBtnTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFF",
  },
  modalVerseBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    gap: 8,
  },
  modalVerseArabic: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: "right",
  },
  modalVerseEng: {
    fontSize: 14,
    lineHeight: 22,
  },
  modalVerseRef: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
});
