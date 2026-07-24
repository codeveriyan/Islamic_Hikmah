import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  StatusBar,
  Platform,
  ActivityIndicator,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import { prophetStories } from "@/src/data/prophets";
import { toggleFavourite, getFavourites, toggleSeerahBookmark, getSeerahBookmarks } from "@/src/storage";

const RTL_LANGUAGES = ["ar", "ur", "fa", "ha", "ps"];

const ARABIC_NAMES: Record<string, string> = {
  adam: "قصة نبي الله آدم عليه السلام",
  idris: "قصة نبي الله إدريس عليه السلام",
  nuh: "قصة نبي الله نوح عليه السلام",
  hud: "قصة نبي الله هود عليه السلام",
  salih: "قصة نبي الله صالح عليه السلام",
  ibrahim: "قصة نبي الله إبراهيم عليه السلام",
  ismail: "قصة نبي الله إسماعيل عليه السلام",
  ishaq: "قصة نبي الله إسحاق عليه السلام",
  yaqub: "قصة نبي الله يعقوب عليه السلام",
  lut: "قصة نبي الله لوط عليه السلام",
  shuaib: "قصة نبي الله شعيب عليه السلام",
  yusuf: "قصة نبي الله يوسف عليه السلام",
  ayyub: "قصة نبي الله أيوب عليه السلام",
  "dhul-kifl": "قصة نبي الله ذو الكفل عليه السلام",
  yunus: "قصة نبي الله يونس عليه السلام",
  musa: "قصة نبي الله موسى وهارون عليهما السلام",
  hizqeel: "قصة نبي الله حزقيل عليه السلام",
  elyas: "قصة نبي الله إلياس عليه السلام",
  shammil: "قصة نبي الله اشمويل عليه السلام",
  dawud: "قصة نبي الله داوود عليه السلام",
  sulaiman: "قصة نبي الله سليمان عليه السلام",
  shia: "قصة نبي الله إشعياء عليه السلام",
  aramaya: "قصة نبي الله إرميا عليه السلام",
  daniel: "قصة نبي الله دانيال عليه السلام",
  uzair: "قصة نبي الله عزير عليه السلام",
  zakariyah: "قصة نبي الله زكريا عليه السلام",
  yahya: "قصة نبي الله يحيى عليه السلام",
  isa: "قصة نبي الله عيسى عليه السلام",
  muhammad: "قصة سيدنا محمد صلى الله عليه وسلم",
};

export default function ProphetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, mode, language } = useTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Quick Action Toolbar & Typography States
  const [isFav, setIsFav] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large" | "xlarge">("medium");
  const [scrollProgress, setScrollProgress] = useState(0);

  // Translation State
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedParagraphs, setTranslatedParagraphs] = useState<string[] | null>(null);
  const translationCache = useRef<Record<string, string[]>>({});

  const story = prophetStories.find((s) => s.id === id);

  // Load Saved Favourites & Bookmarks
  const loadSavedStates = useCallback(() => {
    if (!id || !story) return;
    const favId = `prophet-${id}`;
    Promise.all([getFavourites(), getSeerahBookmarks()]).then(([favs, bms]) => {
      setIsFav(favs.some((f) => f.id === favId));
      setIsBookmarked(bms.some((b) => b.id === id));
    });
  }, [id, story]);

  useEffect(() => {
    loadSavedStates();
  }, [loadSavedStates]);

  const handleToggleFavourite = async () => {
    if (!story || !id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const favId = `prophet-${id}`;
    await toggleFavourite({
      id: favId,
      type: "seerah",
      title: story.name,
      arabic: ARABIC_NAMES[id] || "",
      translation: story.title,
      addedAt: Date.now(),
    });
    loadSavedStates();
  };

  const handleToggleBookmark = async () => {
    if (!story || !id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await toggleSeerahBookmark({
      id: id,
      chapterId: id,
      title: story.name,
      arabicTitle: ARABIC_NAMES[id] || "",
      content: story.title,
      addedAt: Date.now(),
    });
    loadSavedStates();
  };

  const handleShare = async () => {
    if (!story) return;
    Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({
        title: story.name,
        message: `${story.name} - ${story.title}\n\nRead full story on Islamic Hikmah App!`,
      });
    } catch (e) {
      console.log("Share error:", e);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Translate story vertically when settings language !== 'en'
  useEffect(() => {
    if (!story || language === "en") {
      setTranslatedParagraphs(null);
      setIsTranslating(false);
      return;
    }

    if (translationCache.current[language]) {
      setTranslatedParagraphs(translationCache.current[language]);
      setIsTranslating(false);
      return;
    }

    let isMounted = true;
    setIsTranslating(true);

    const translateFullStory = async () => {
      try {
        const originalParas = story.content;
        const result: string[] = [];

        // Fast parallel batch translation of 10 paragraphs per batch
        const batchSize = 10;
        for (let i = 0; i < originalParas.length; i += batchSize) {
          const chunk = originalParas.slice(i, i + batchSize);
          
          const batchPromises = chunk.map(async (para) => {
            let prefix = "";
            let textToTranslate = para;
            if (para.startsWith("HEADING:")) {
              prefix = "HEADING:";
              textToTranslate = para.replace("HEADING:", "").trim();
            } else if (para.startsWith("QURAN:")) {
              prefix = "QURAN:";
              textToTranslate = para.replace("QURAN:", "").trim();
            } else if (para.startsWith("TEXT:")) {
              prefix = "TEXT:";
              textToTranslate = para.replace("TEXT:", "").trim();
            }

            try {
              const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${language}&dt=t&q=${encodeURIComponent(textToTranslate)}`;
              const res = await fetch(url);
              const data = await res.json();
              if (data && data[0]) {
                return prefix + data[0].map((x: any) => x[0]).join("");
              }
            } catch (e) {
              console.log("Translation segment error:", e);
            }
            return para;
          });

          const translatedBatch = await Promise.all(batchPromises);
          if (!isMounted) return;
          result.push(...translatedBatch);

          // Update state progressively so text appears smoothly as it translates
          setTranslatedParagraphs([...result, ...originalParas.slice(result.length)]);
        }

        if (isMounted) {
          translationCache.current[language] = result;
          setTranslatedParagraphs(result);
        }
      } catch (err) {
        console.error("Full translation error:", err);
      } finally {
        if (isMounted) setIsTranslating(false);
      }
    };

    translateFullStory();

    return () => {
      isMounted = false;
    };
  }, [story, language]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const totalScrollableHeight = contentSize.height - layoutMeasurement.height;
    if (totalScrollableHeight > 0) {
      const currentScroll = Math.max(0, Math.min(contentOffset.y, totalScrollableHeight));
      setScrollProgress(currentScroll / totalScrollableHeight);
    }
  };

  const startTTS = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const textToRead = `${story?.name}. ${story?.title}. ` + story?.content.slice(0, 10).join(" ");
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    Haptics.selectionAsync().catch(() => {});
    if (!story) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsLoading(false);
      return;
    }

    if (story.audioUrl && Platform.OS === "web") {
      setIsLoading(true);
      const audio = new Audio(story.audioUrl);
      
      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
      };
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);

      audio.onerror = () => {
        startTTS();
      };

      audioRef.current = audio;
      audio.play().catch(() => {
        startTTS();
      });
    } else {
      startTTS();
    }
  };

  const fontSizeMap = { small: 14, medium: 16, large: 19, xlarge: 23 };
  const lineHeightMap = { small: 22, medium: 26, large: 31, xlarge: 36 };
  const contentFontSize = fontSizeMap[fontSize];
  const contentLineHeight = lineHeightMap[fontSize];

  if (!story) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.onSurfaceMuted }}>Story not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const estimatedReadMin = Math.ceil(story.content.length * 0.4);
  const readingProgressPct = Math.round(scrollProgress * 100);
  const displayParagraphs = translatedParagraphs || story.content;
  const isRTL = RTL_LANGUAGES.includes(language);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />

      {/* Top Vertical Reading Progress Bar */}
      <View style={[styles.progressBarOuter, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={[styles.progressBarFill, { backgroundColor: colors.brand, width: `${readingProgressPct}%` }]} />
      </View>

      {/* Header with Quick Action Buttons (Image-1 Interface) */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>

        {/* Quick Action Toolbar (Image-1) */}
        <View style={styles.headerActions}>
          {/* Tt (Font Size Toggle) */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setFontSize((s) => (s === "small" ? "medium" : s === "medium" ? "large" : s === "large" ? "xlarge" : "small"));
            }}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name="format-size" size={18} color={colors.brand} />
          </Pressable>

          {/* Heart Favourite */}
          <Pressable
            onPress={handleToggleFavourite}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={18} color={isFav ? colors.error : colors.onSurfaceMuted} />
          </Pressable>

          {/* Bookmark */}
          <Pressable
            onPress={handleToggleBookmark}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={18} color={isBookmarked ? colors.brand : colors.onSurfaceMuted} />
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name="share-variant" size={18} color={colors.onSurfaceMuted} />
          </Pressable>

          {/* Home */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push("/");
            }}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name="home-outline" size={18} color={colors.onSurfaceMuted} />
          </Pressable>

          {/* Settings */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push("/settings");
            }}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.onSurfaceMuted} />
          </Pressable>
        </View>
      </View>

      {/* Main Vertical Continuous Scroll View */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Card Header (Image-2 Interface) */}
        <View style={[styles.heroCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={styles.heroCardTopRow}>
            <View style={styles.heroCardLeft}>
              <View style={[styles.heroIconBadge, { backgroundColor: colors.brand + "18" }]}>
                <MaterialCommunityIcons name="earth" size={20} color={colors.brand} />
              </View>
              <View style={[styles.eraPill, { backgroundColor: colors.brand + "15" }]}>
                <Text style={[styles.eraPillTxt, { color: colors.brand }]}>PROPHET SEERAH</Text>
              </View>
            </View>

            {/* Arabic Name (Right-Aligned) */}
            {ARABIC_NAMES[id || ""] && (
              <Text style={[styles.arabicHeaderTxt, { color: colors.brand }]}>
                {ARABIC_NAMES[id || ""]}
              </Text>
            )}
          </View>

          <Text style={[styles.heroCardTitle, { color: colors.onSurface }]}>
            {story.name}
          </Text>

          <Text style={[styles.heroCardSub, { color: colors.onSurfaceMuted }]}>
            Chapter {story.order} • {estimatedReadMin} min read • {readingProgressPct}% read
          </Text>

          {language !== "en" && (
            <View style={[styles.langBadge, { backgroundColor: colors.brand + "18", marginTop: 10, alignSelf: "flex-start" }]}>
              {isTranslating ? (
                <ActivityIndicator size="small" color={colors.brand} />
              ) : (
                <MaterialCommunityIcons name="translate" size={14} color={colors.brand} />
              )}
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.brand }}>
                {isTranslating ? `Translating into ${language.toUpperCase()}...` : `Language: ${language.toUpperCase()}`}
              </Text>
            </View>
          )}
        </View>

        {/* Audio Player Card */}
        {story.audioUrl && (
          <View style={[styles.audioCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Pressable onPress={toggleAudio} style={[styles.playBtn, { backgroundColor: colors.brand }]}>
              <MaterialCommunityIcons 
                name={isLoading ? "loading" : isPlaying ? "pause" : "play"} 
                size={26} 
                color={colors.onBrandPrimary} 
              />
            </Pressable>
            
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.audioTitle, { color: colors.onSurface }]}>Audio Story Recitation</Text>
              <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>
                {isLoading ? "Loading audio..." : isPlaying ? "Playing narration..." : "Tap play to listen to story narration"}
              </Text>
            </View>
          </View>
        )}

        {/* Vertical Story Content Section */}
        <View style={styles.contentSection}>
          {displayParagraphs.map((paragraph, index) => {
            if (paragraph.startsWith("HEADING:")) {
              const headingText = paragraph.replace("HEADING:", "").trim();
              return (
                <Text
                  key={index}
                  style={[
                    styles.sectionHeading,
                    {
                      color: colors.brand,
                      fontSize: contentFontSize + 3,
                      lineHeight: contentLineHeight + 4,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {headingText}
                </Text>
              );
            }
            if (paragraph.startsWith("QURAN:")) {
              const quranText = paragraph.replace("QURAN:", "").trim();
              return (
                <View key={index} style={[styles.quranBox, { backgroundColor: colors.brand + "0F", borderColor: colors.brand }]}>
                  <MaterialCommunityIcons name="format-quote-open" size={20} color={colors.brand} style={{ marginBottom: 4 }} />
                  <Text
                    style={[
                      styles.quranText,
                      {
                        color: colors.onSurface,
                        fontSize: contentFontSize - 1,
                        lineHeight: contentLineHeight,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {quranText}
                  </Text>
                </View>
              );
            }
            const cleanText = paragraph.replace("TEXT:", "").trim();
            return (
              <Text
                key={index}
                style={[
                  styles.paragraph,
                  {
                    color: colors.onSurface,
                    fontSize: contentFontSize,
                    lineHeight: contentLineHeight,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
              >
                {cleanText}
              </Text>
            );
          })}
        </View>

        {/* Lessons Section */}
        <View style={[styles.lessonsCard, { backgroundColor: colors.brand + "10", borderColor: colors.brand + "30" }]}>
          <View style={styles.lessonsHeader}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={colors.brand} />
            <Text style={[styles.lessonsTitle, { color: colors.brand }]}>Lessons &amp; Reflections</Text>
          </View>
          {story.lessons.map((lesson, index) => (
            <View key={index} style={styles.lessonItem}>
              <MaterialCommunityIcons name="circle-medium" size={16} color={colors.brand} style={{ marginTop: 2 }} />
              <Text style={[styles.lessonText, { color: colors.onSurface }]}>{lesson}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBarOuter: {
    height: 3,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  backBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  heroCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  eraPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eraPillTxt: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  arabicHeaderTxt: {
    fontFamily: "Amiri",
    fontSize: 16,
    fontWeight: "700",
  },
  heroCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroCardSub: {
    fontSize: 13,
  },
  langBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  contentSection: {
    marginBottom: 32,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: "800",
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  quranBox: {
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginVertical: 12,
  },
  quranText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 25,
  },
  lessonsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  lessonsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  lessonsTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  lessonText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
