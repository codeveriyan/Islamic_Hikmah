import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Image, Dimensions, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";

const { width } = Dimensions.get("window");

export default function PillarsOfIslamScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { showPremiumModal } = usePremiumModal();

  // Active modal state
  const [activePillar, setActivePillar] = useState<"shahadah" | "sawm" | null>(null);

  // Sawm Tracker state
  const [fastingLog, setFastingLog] = useState<Record<string, { kept: boolean; energy: string }>>({});
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Complete Shahadah recitation, bundled for reliable offline playback.
  // Source: iSurrender / Wikimedia Commons, CC BY-SA 3.0.
  const player = useAudioPlayer(require("../assets/audio/shahadah.mp3"));
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    // Load Sawm Tracker data
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("sawm_fasting_log");
        if (stored) setFastingLog(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed to load Sawm data:", e);
      }
    })();
  }, []);

  // Stop audio on exit/unmount
  useEffect(() => {
    return () => {
      player.pause();
    };
  }, [player]);

  const handleShareShahadah = async () => {
    try {
      await Share.share({
        message: "Shahadah (Declaration of Faith):\n\nArabic: أشهَدُ أنْ لا إلَهَ إلّا اللهُ وَأشْهَدُ أنَّ مُحَمَّدًا رَسُولُ اللهِ\n\nTransliteration: Ašhadu ’an lā ’ilāha ’illa-Llāh, wa ’ašhadu ’anna Muḥammada(n) rasūlu-Llāh\n\nTranslation: I declare that there is no deity worthy of worship except Allah; and I declare that Muhammad is the Messenger of Allah.\n\nShared via Islamic Hikmah App 🕌",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFast = async (dayNum: number) => {
    Haptics.selectionAsync().catch(() => {});
    const updated = {
      ...fastingLog,
      [dayNum]: {
        kept: !fastingLog[dayNum]?.kept,
        energy: fastingLog[dayNum]?.energy || "normal",
      },
    };
    setFastingLog(updated);
    await AsyncStorage.setItem("sawm_fasting_log", JSON.stringify(updated));
  };

  const handleEnergySelect = async (dayNum: number, level: string) => {
    Haptics.selectionAsync().catch(() => {});
    const updated = {
      ...fastingLog,
      [dayNum]: {
        kept: true,
        energy: level,
      },
    };
    setFastingLog(updated);
    await AsyncStorage.setItem("sawm_fasting_log", JSON.stringify(updated));
  };

  // Format time (seconds to mm:ss)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === undefined) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Audio Seek progress bar click
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const handleSeek = (e: any) => {
    if (progressBarWidth > 0 && status.duration) {
      const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / progressBarWidth));
      const targetSeconds = pct * status.duration;
      player.seekTo(targetSeconds);
    }
  };

  const handlePlayPause = () => {
    Haptics.selectionAsync().catch(() => {});
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Pillars of Islam</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Banner */}
        <View style={[styles.introCard, { backgroundColor: colors.brand + "10", borderColor: colors.brand }]}>
          <MaterialCommunityIcons name="mosque" size={32} color={colors.brand} />
          <Text style={[styles.introTitle, { color: colors.onSurface }]}>The Five Pillars of Islam</Text>
          <Text style={[styles.introText, { color: colors.onSurfaceSecondary }]}>
            {"These are the five core practices that form the foundation of a Muslim's life, representing the framework of worship and commitment to Allah."}
          </Text>
        </View>

        {/* 1. Shahadah Card */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActivePillar("shahadah");
          }}
          style={[styles.pillarCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <View style={styles.pillarIconCircle}>
            <MaterialCommunityIcons name="certificate" size={28} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pillarName, { color: colors.onSurface }]}>1. Shahadah (Faith)</Text>
            <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
              The declaration of faith: Belief in the oneness of Allah and the prophethood of Muhammad (ﷺ).
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* 2. Prayer Card */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push("/prayer-times");
          }}
          style={[styles.pillarCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <View style={styles.pillarIconCircle}>
            <MaterialCommunityIcons name="clock-outline" size={28} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pillarName, { color: colors.onSurface }]}>2. Salah (Prayer)</Text>
            <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
              The five daily prayers facing the Qiblah, purifying the soul and keeping you connected to your Creator.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* 3. Zakat Card */}
        <Pressable
        onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            if (profile?.tier !== "premium" && !profile?.trialActive) {
              showPremiumModal("Zakat Calculator");
              return;
            }
            router.push("/zakat-calculator");
          }}
          style={[styles.pillarCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <View style={styles.pillarIconCircle}>
            <MaterialCommunityIcons name="calculator" size={28} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pillarName, { color: colors.onSurface }]}>3. Zakat (Almsgiving)</Text>
            <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
              The obligatory 2.5% donation of wealth to support the needy, purifying your wealth and helping society.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* 4. Sawm Card */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActivePillar("sawm");
          }}
          style={[styles.pillarCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <View style={styles.pillarIconCircle}>
            <MaterialCommunityIcons name="silverware-clean" size={28} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pillarName, { color: colors.onSurface }]}>4. Sawm (Fasting)</Text>
            <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
              Fasting during the holy month of Ramadan to build self-control, empathy, and spiritual focus.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* 5. Hajj Card */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push("/hajj-umrah-guide");
          }}
          style={[styles.pillarCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <View style={styles.pillarIconCircle}>
            <MaterialCommunityIcons name={"kaaba" as any} size={28} color={colors.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pillarName, { color: colors.onSurface }]}>5. Hajj (Pilgrimage)</Text>
            <Text style={[styles.pillarDesc, { color: colors.onSurfaceMuted }]}>
              The pilgrimage to the holy Kaaba in Mecca, required once in a lifetime for those physically and financially able.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>
      </ScrollView>

      {/* Shahadah Modal */}
      {activePillar === "shahadah" && (
        <Modal visible={true} animationType="slide" transparent onRequestClose={() => setActivePillar(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>1. Shahadah (Declaration of Faith)</Text>
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <Pressable onPress={handleShareShahadah} hitSlop={10}>
                    <MaterialCommunityIcons name="share-variant" size={22} color={colors.onSurface} />
                  </Pressable>
                  <Pressable onPress={() => { player.pause(); setActivePillar(null); }} hitSlop={10}>
                    <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                  </Pressable>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Calligraphy Screenshot Image as requested */}
                <View style={[styles.calligraphyBox, { borderColor: colors.border }]}>
                  <Image
                    source={require("../assets/images/shahadah_calligraphy.png")}
                    style={styles.calligraphyImg}
                  />
                </View>

                {/* Script details */}
                <View style={styles.scriptContainer}>
                  <Text style={[styles.arabicText, { color: colors.onSurface }]}>
                    أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا ٱللَّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ
                  </Text>
                  <Text style={[styles.translitText, { color: colors.brand }]}>
                    ašhadu ’an lā ’ilāha ’illa-Llāh, wa ’ašhadu ’anna Muḥammada(n) rasūlu-Llāh
                  </Text>
                  <Text style={[styles.transText, { color: colors.onSurfaceSecondary }]}>
                    I declare that there is no deity worthy of worship except Allah; and I declare that Muhammad is the Messenger of Allah.
                  </Text>
                </View>

                {/* Audio Recitation Player */}
                <View style={[styles.audioCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.audioLabel, { color: colors.onSurface }]}>Listen to Shahadah Recitation</Text>
                  
                  {/* Progress Bar */}
                  <Pressable 
                    onPress={handleSeek}
                    onLayout={e => setProgressBarWidth(e.nativeEvent.layout.width)}
                    style={[styles.progressBarBg, { backgroundColor: colors.border }]}
                  >
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          backgroundColor: colors.brand,
                          width: status.duration ? `${(status.currentTime / status.duration) * 100}%` : "0%" 
                        }
                      ]} 
                    />
                  </Pressable>

                  <View style={styles.timeRow}>
                    <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>{formatTime(status.currentTime)}</Text>
                    <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>{formatTime(status.duration)}</Text>
                  </View>

                  {/* Play Pause Controls */}
                  <Pressable onPress={handlePlayPause} style={[styles.playBtn, { backgroundColor: colors.brand }]}>
                    <MaterialCommunityIcons 
                      name={status.playing ? "pause" : "play"} 
                      size={28} 
                      color="#fff" 
                    />
                  </Pressable>
                  <Text style={[styles.audioCredit, { color: colors.onSurfaceMuted }]}>
                    Audio: iSurrender / Wikimedia Commons · CC BY-SA 3.0
                  </Text>
                </View>

                <View style={styles.shahadaArticle}>
                  <Text style={[styles.articleHeading, { color: colors.onSurface }]}>Shahada</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>The Shahada means the testimony or Kalimah according to Islam and is the first pillar of Islam. The belief that Allah is our only Lord and Muhammad (SAW) is our prophet is referred to as Shahada. This belief is the first pillar of Islam and turns a person into a Muslim. The declaration that a Muslim reads in Arabic and believes is “La ilaha illallah, Muhammadun rasulullah”. This means that there is no deity worthy of worship except Allah and Muhammad is the Messenger of Allah. Kalimah Shahada is among the best declarations of praise of Allah.</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>The Shahada has two parts. The first part is “La ilaha illallah”, which testifies that there is no deity worthy of worship except Allah. He is One and has no partner. The second part is “Muhammadun rasulullah”; by reciting it, we affirm that Muhammad (SAW) is Allah’s Messenger. The declaration of Allah’s oneness is repeatedly emphasized in the Quran, showing the importance of this belief.</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>Whereas the first part indicates a universal truth, the second part affirms belief in the prophethood of Muhammad (SAW). Belief in Allah’s oneness and His Messenger is essential to Islamic faith. Allah says: “Muhammad is not the father of any one of your men, but is the Messenger of Allah and the seal of the prophets. And Allah has perfect knowledge of all things.” [Quran 33:40]</Text>

                  <Text style={[styles.articleSubheading, { color: colors.onSurface }]}>Importance of Shahada</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>Muslim children begin learning their faith through the recitation of Shahada. It draws them to the path of Allah and encourages them toward obligatory worship. Recitation of and belief in Shahada is both a declaration and an act of worship. When a person wishes to embrace Islam, sincerely reciting the Shahada is the first formal step. Allah says: “Obey Allah and obey the Messenger.” [Quran 5:92]</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>Shahada appears throughout Muslim worship: in the call to prayer, before and during prayer, in Tashahhud, and in remembrance of Allah. Muslims also repeat this declaration after prayer and during morning and evening remembrance. The Messenger of Allah (SAW) taught that among the best supplications proclaimed by him and the prophets before him is: “There is no deity worthy of worship except Allah alone, without partner. To Him belongs all dominion and all praise.” [Jami‘ at-Tirmidhi]</Text>

                  <Text style={[styles.articleSubheading, { color: colors.onSurface }]}>Recitation of Shahada</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>Reciting Shahada sincerely has great reward. It renews faith, reminds Muslims of Allah’s oneness, and helps protect the heart from misguidance. A believer should understand its meaning and live according to what it requires, not merely repeat its words.</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>Shahada is recited on many religious occasions as the clearest declaration of Allah’s oneness and greatness. The Prophet (SAW) said: “The best remembrance is: La ilaha illallah.” [Jami‘ at-Tirmidhi]</Text>
                  <Text style={[styles.articleParagraph, { color: colors.onSurfaceSecondary }]}>It is a form of worship that can be practiced in every situation. It requires no special preparation; it should be pronounced sincerely, understood, and reflected in a Muslim’s beliefs and actions.</Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* Sawm Modal */}
      {activePillar === "sawm" && (
        <Modal visible={true} animationType="slide" transparent onRequestClose={() => setActivePillar(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.onSurface }]}>4. Sawm (Ramadan Fasting)</Text>
                <Pressable onPress={() => setActivePillar(null)} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.modalDesc, { color: colors.onSurfaceSecondary }]}>
                  Sawm is the fourth pillar of Islam, requiring self-purification, spiritual discipline, and reflection by abstaining from food, drink, and invalidating behaviors from dawn (Fajr) to sunset (Maghrib).
                </Text>

                {/* Duas of Fasting */}
                <View style={styles.subSection}>
                  <Text style={[styles.subTitle, { color: colors.onSurface }]}>Fasting Supplications</Text>
                  
                  {/* Suhoor Dua */}
                  <View style={[styles.duaCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.duaLabel, { color: colors.brand }]}>Suhoor Dua (Intention to Fast)</Text>
                    <Text style={[styles.duaArabic, { color: colors.onSurface }]}>
                      وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ
                    </Text>
                    <Text style={[styles.duaTranslit, { color: colors.onSurface }]}>
                      Wa bi-sawmi ghadin nawaiytu min shahri ramadhan.
                    </Text>
                    <Text style={[styles.duaTrans, { color: colors.onSurfaceSecondary }]}>
                      I intend to keep the fast tomorrow in the month of Ramadan.
                    </Text>
                  </View>

                  {/* Iftar Dua */}
                  <View style={[styles.duaCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginTop: 12 }]}>
                    <Text style={[styles.duaLabel, { color: colors.brand }]}>Iftar Dua (Breaking the Fast)</Text>
                    <Text style={[styles.duaArabic, { color: colors.onSurface }]}>
                      اللَّهُمَّ إِنِّي لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ
                    </Text>
                    <Text style={[styles.duaTranslit, { color: colors.onSurface }]}>
                      {"Allahumma inni laka sumtu wa bika amantu wa 'ala rizqika aftartu."}
                    </Text>
                    <Text style={[styles.duaTrans, { color: colors.onSurfaceSecondary }]}>
                      O Allah, I fasted for You, believed in You, and broke my fast with Your sustenance.
                    </Text>
                  </View>
                </View>

                {/* Fasting Rules */}
                <View style={styles.subSection}>
                  <Text style={[styles.subTitle, { color: colors.onSurface }]}>Sunni Fasting Guidelines</Text>
                  <View style={[styles.ruleItem, { borderLeftColor: colors.brand }]}>
                    <Text style={[styles.ruleTitle, { color: colors.onSurface }]}>Essential Conditions</Text>
                    <Text style={[styles.ruleDesc, { color: colors.onSurfaceSecondary }]}>
                      Making intention (Niyyah) before Fajr, and absolute abstention from food, drink, and marital relations.
                    </Text>
                  </View>
                  <View style={[styles.ruleItem, { borderLeftColor: colors.brand, marginTop: 8 }]}>
                    <Text style={[styles.ruleTitle, { color: colors.onSurface }]}>Fasting Invalidators</Text>
                    <Text style={[styles.ruleDesc, { color: colors.onSurfaceSecondary }]}>
                      Eating or drinking intentionally, deliberate vomiting, and marital relations during daylight hours (requires Kaffarah / penalty).
                    </Text>
                  </View>
                </View>

                {/* Interactive Fasting Log Tracker */}
                <View style={styles.subSection}>
                  <Text style={[styles.subTitle, { color: colors.onSurface }]}>Fasting Log Tracker</Text>
                  <Text style={[styles.instructionText, { color: colors.onSurfaceMuted, marginBottom: 8 }]}>
                    Log your daily fasts for the current month. Click a day to toggle fast status.
                  </Text>
                  
                  {/* Days grid */}
                  <View style={styles.daysRow}>
                    {Array.from({ length: 30 }).map((_, i) => {
                      const dayNum = i + 1;
                      const dayLog = fastingLog[dayNum];
                      const isKept = dayLog?.kept;

                      return (
                        <Pressable
                          key={dayNum}
                          onPress={() => handleToggleFast(dayNum)}
                          style={[
                            styles.dayBtn,
                            { 
                              borderColor: colors.border,
                              backgroundColor: isKept ? colors.brand : colors.surfaceSecondary
                            }
                          ]}
                        >
                          <Text style={[styles.dayBtnText, { color: isKept ? "#fff" : colors.onSurface }]}>
                            {dayNum}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
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
  resetText: { fontSize: 15, fontWeight: "600" },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 48,
    gap: 16,
  },
  introCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  introText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pillarCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 14,
  },
  pillarIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillarName: {
    fontSize: 15,
    fontWeight: "700",
  },
  pillarDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  // Modal styles
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
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  calligraphyBox: {
    width: "100%",
    height: 250,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  calligraphyImg: {
    width: 240,
    height: 240,
    resizeMode: "contain",
  },
  scriptContainer: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  arabicText: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 34,
  },
  translitText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 18,
  },
  transText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  audioCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.lg,
    alignItems: "center",
    marginBottom: 24,
  },
  audioLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
  },
  audioCredit: {
    fontSize: 10,
    textAlign: "center",
    marginTop: 12,
  },
  progressBarBg: {
    height: 6,
    width: "100%",
    borderRadius: 3,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 6,
    marginBottom: 16,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  shahadaArticle: {
    paddingHorizontal: 2,
    paddingBottom: 28,
  },
  articleHeading: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 10,
  },
  articleSubheading: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 14,
    marginBottom: 8,
  },
  articleParagraph: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  // Sawm styles
  subSection: {
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  duaCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    padding: 12,
  },
  duaLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  duaArabic: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "right",
    lineHeight: 28,
  },
  duaTranslit: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
  },
  duaTrans: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  ruleItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  ruleDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  instructionText: {
    fontSize: 12,
  },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayBtn: {
    width: (width - theme.spacing.lg * 2 - 24 - 32) / 6,
    height: (width - theme.spacing.lg * 2 - 24 - 32) / 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
