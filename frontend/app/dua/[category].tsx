import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Platform, Share, Dimensions, FlatList, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import { CATEGORIES, getCategory } from "@/src/data/duas";
import { toggleFavourite, getFavourites, Favourite } from "@/src/storage";
import { transliterateToTamil } from "@/src/transliterator";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DuaCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { colors, language, fontSize, fontColor } = useTheme();
  const arabicFontFamily = useArabicFont();
  const cat = getCategory(String(category));
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, { translation: string; transliteration?: string }>>({});
  
  // View Modes: 'list' (master) or 'reader' (detail carousel)
  const [viewMode, setViewMode] = useState<'list' | 'reader'>('list');
  const [activeDuaIndex, setActiveDuaIndex] = useState<number>(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  
  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLooping, setIsLooping] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [progressWidth, setProgressWidth] = useState(0);
  
  const [webCurrentTime, setWebCurrentTime] = useState(0);
  const [webDuration, setWebDuration] = useState(0);
  
  // Detail Overlay
  const [showInfo, setShowInfo] = useState(false);

  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const webAudioInstance = useRef<HTMLAudioElement | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const currentTime = Platform.OS === "web" ? webCurrentTime : (status?.currentTime || 0);
  const duration = Platform.OS === "web" ? webDuration : (status?.duration || 0);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const stopCurrentAudio = () => {
    if (Platform.OS === "web") {
      webAudioInstance.current?.pause();
      window.speechSynthesis?.cancel();
    } else {
      try {
        player.pause();
      } catch {}
    }
    setPlayingId(null);
    setIsPlayingAll(false);
  };

  const switchCategory = (nextCategoryId: string) => {
    if (!cat || nextCategoryId === cat.id) return;
    stopCurrentAudio();
    setShowInfo(false);
    setActiveDuaIndex(0);
    setViewMode("list");
    setCounts({});
    router.replace(`/dua/${nextCategoryId}` as any);
  };

  // Font Size Styles
  const getArabicSize = () => {
    if (fontSize === "small") return 22;
    if (fontSize === "large") return 36;
    return 28; // medium
  };
  const getArabicLineHeight = () => {
    if (fontSize === "small") return 38;
    if (fontSize === "large") return 58;
    return 48; // medium
  };
  const getTranslitSize = () => {
    if (fontSize === "small") return 13;
    if (fontSize === "large") return 20;
    return 16; // medium
  };
  const getTranslitLineHeight = () => {
    if (fontSize === "small") return 21;
    if (fontSize === "large") return 31;
    return 25; // medium
  };
  const getTranslationSize = () => {
    if (fontSize === "small") return 13;
    if (fontSize === "large") return 20;
    return 16; // medium
  };
  const getTranslationLineHeight = () => {
    if (fontSize === "small") return 21;
    if (fontSize === "large") return 31;
    return 25; // medium
  };

  // Font Color Styles
  const getTextColor = () => {
    if (fontColor === "gold") return "#D97706";
    if (fontColor === "green") return "#10B981";
    if (fontColor === "sepia") return "#B45309";
    return colors.onSurfaceSecondary;
  };

  useEffect(() => {
    getFavourites().then((fs) => setFavIds(new Set(fs.map((f) => f.id))));
  }, []);

  // Sync finished audio triggers
  useEffect(() => {
    if (status?.didJustFinish) {
      handleAudioFinished();
    }
  }, [status?.didJustFinish]);

  useEffect(() => {
    return () => {
      if (Platform.OS === "web") {
        if (webAudioInstance.current) {
          webAudioInstance.current.pause();
        }
        window.speechSynthesis?.cancel();
      } else {
        // expo-audio's own internal effect (registered by useAudioPlayer above)
        // releases the native player on unmount. Effect cleanups run in the
        // same top-to-bottom order as they were declared, so that release can
        // fire before this cleanup does — leaving `player` pointing at an
        // already-released native shared object. Calling any method on it at
        // that point throws "Cannot use shared object that was already
        // released" and crashes the app. Swallow that specific race safely.
        try {
          player.pause();
        } catch (e) {
          // Player was already released by expo-audio's own teardown — safe to ignore.
        }
      }
    };
  }, [player]);

  // Handle loop native properties change
  useEffect(() => {
    if (Platform.OS === "web") {
      if (webAudioInstance.current) {
        webAudioInstance.current.loop = isLooping;
      }
    } else {
      player.loop = isLooping;
    }
  }, [isLooping]);

  // Handle scroll index sync when switching into reader mode
  useEffect(() => {
    if (viewMode === 'reader' && cat) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: activeDuaIndex, animated: false });
      }, 100);
      
      // If we were playing all, trigger playback
      if (isPlayingAll) {
        playDua(cat.duas[activeDuaIndex]);
      }
    }
  }, [viewMode]);

  // When index changes via swipe, play if already playing
  useEffect(() => {
    if (viewMode === 'reader' && playingId && cat) {
      playDua(cat.duas[activeDuaIndex]);
    }
  }, [activeDuaIndex]);

  const handleAudioFinished = () => {
    if (isLooping) return;
    
    if (isPlayingAll && cat) {
      if (activeDuaIndex + 1 < cat.duas.length) {
        const nextIdx = activeDuaIndex + 1;
        setActiveDuaIndex(nextIdx);
        flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
        // Let effect handle autoplay
      } else {
        setIsPlayingAll(false);
        setPlayingId(null);
      }
    } else {
      setPlayingId(null);
    }
  };

  const fallbackToSpeechSynthesis = (text: string, id: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar";
      utterance.rate = 0.8;
      
      const voices = window.speechSynthesis.getVoices();
      const arabicVoice = voices.find((v: any) => v.lang.startsWith("ar"));
      if (arabicVoice) utterance.voice = arabicVoice;
      
      utterance.onstart = () => setPlayingId(id);
      utterance.onend = () => {
        setPlayingId(null);
        handleAudioFinished();
      };
      utterance.onerror = () => setPlayingId(null);
      
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingId(null);
    }
  };

  const playDua = async (d: any) => {
    if (playingId === d.id) {
      if (Platform.OS === "web") {
        if (webAudioInstance.current) {
          webAudioInstance.current.pause();
        }
        window.speechSynthesis?.cancel();
      } else {
        player.pause();
      }
      setPlayingId(null);
      return;
    }

    const cleanText = d.arabic.replace(/[^\u0600-\u06FF\s]/g, "");
    const audioUrl = d.audio || `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

    if (Platform.OS === "web") {
      if (webAudioInstance.current) {
        webAudioInstance.current.pause();
      }
      window.speechSynthesis?.cancel();
      
      try {
        const audio = new Audio();
        (audio as any).referrerPolicy = "no-referrer";
        audio.src = audioUrl;
        audio.playbackRate = playbackSpeed;
        audio.loop = isLooping;
        webAudioInstance.current = audio;

        audio.onplay = () => {
          setPlayingId(d.id);
        };
        audio.onended = () => {
          setPlayingId(null);
          handleAudioFinished();
        };
        audio.onerror = () => {
          console.warn("Audio element failed, falling back to SpeechSynthesis");
          fallbackToSpeechSynthesis(cleanText, d.id);
        };

        audio.ontimeupdate = () => {
          setWebCurrentTime(audio.currentTime);
        };
        audio.onloadedmetadata = () => {
          setWebDuration(audio.duration);
        };

        await audio.play();
      } catch (err) {
        console.warn("Audio play promise rejected, trying SpeechSynthesis fallback:", err);
        fallbackToSpeechSynthesis(cleanText, d.id);
      }
    } else {
      player.replace({ uri: audioUrl });
      player.loop = isLooping;
      player.setPlaybackRate(playbackSpeed);
      player.play();
      setPlayingId(d.id);
    }
  };

  const handleSeek = (e: any) => {
    if (progressWidth > 0 && duration) {
      const pct = Math.max(0, Math.min(1, e.nativeEvent.locationX / progressWidth));
      const targetSeconds = pct * duration;
      if (Platform.OS === "web") {
        if (webAudioInstance.current) {
          webAudioInstance.current.currentTime = targetSeconds;
        }
      } else {
        player.seekTo(targetSeconds);
      }
    }
  };

  const decrementCounter = (id: string, targetRepeat: number) => {
    if (!cat) return;
    setCounts(prev => {
      const current = prev[id] !== undefined ? prev[id] : targetRepeat;
      if (current > 0) {
        const next = current - 1;
        if (next === 0) {
          if (Platform.OS !== "web") {
            try {
              Vibration.vibrate(100);
            } catch (e) {}
          }
          // Auto advance to the next dua after 800ms
          setTimeout(() => {
            if (activeDuaIndex + 1 < cat.duas.length) {
              const nextIdx = activeDuaIndex + 1;
              setActiveDuaIndex(nextIdx);
              flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
            }
          }, 800);
        }
        return { ...prev, [id]: next };
      } else {
        return { ...prev, [id]: targetRepeat };
      }
    });
  };

  const onShare = async (item: any) => {
    try {
      const shareText = `${item.title}\n\n${item.arabic}\n\n${item.translation}\n\nReference: ${item.reference || "Dhikr & Dua"}`;
      await Share.share({ message: shareText });
    } catch (e) {
      console.warn("Share failed:", e);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === undefined) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Translations hook
  useEffect(() => {
    if (!language || language === "en" || !cat) {
      setTranslatedTexts({});
      return;
    }
    const fetchTranslations = async () => {
      const newTranslations: Record<string, { translation: string; transliteration?: string }> = {};
      try {
        await Promise.all(
          cat.duas.map(async (d) => {
            const resTrans = await fetch(
              `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(d.translation)}`
            );
            const dataTrans = await resTrans.json();
            const translation = dataTrans?.[0]?.map((x: any) => x[0]).join("") || d.translation;

            let transliteration = d.transliteration;
            if (d.transliteration) {
              const resLit = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${language}&dt=t&q=${encodeURIComponent(d.transliteration)}`
              );
              const dataLit = await resLit.json();
              transliteration = dataLit?.[0]?.map((x: any) => x[0]).join("") || d.transliteration;
            }

            newTranslations[d.id] = { translation, transliteration };
          })
        );
        setTranslatedTexts(newTranslations);
      } catch (e) {
        console.error("Failed to translate Duas:", e);
      }
    };
    fetchTranslations();
  }, [category, language]);

  if (!cat) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: "#fff", padding: 24 }}>Category not found.</Text>
      </SafeAreaView>
    );
  }

  const onFav = async (i: number) => {
    const d = cat.duas[i];
    const fav: Favourite = {
      id: d.id,
      type: "dua",
      title: d.title,
      subtitle: cat.title,
      arabic: d.arabic,
      translation: d.translation,
      addedAt: Date.now(),
    };
    await toggleFavourite(fav);
    const fs = await getFavourites();
    setFavIds(new Set(fs.map((f) => f.id)));
  };

  const playAll = () => {
    setIsPlayingAll(true);
    setActiveDuaIndex(0);
    setViewMode('reader');
  };

  const toggleCategoryFavourite = async () => {
    if (cat.duas.length > 0) {
      await onFav(0);
    }
  };

  const onScrollFlatList = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const width = e.nativeEvent.layoutMeasurement.width || SCREEN_WIDTH;
    if (width > 0) {
      const index = Math.round(offsetX / width);
      if (index >= 0 && index < cat.duas.length && index !== activeDuaIndex) {
        setActiveDuaIndex(index);
      }
    }
  };

  const renderDuaCard = ({ item, index }: { item: any; index: number }) => {
    const targetRepeat = item.repeat || 1;
    const currentCount = counts[item.id] !== undefined ? counts[item.id] : targetRepeat;
    const isCompleted = currentCount === 0;

    return (
      <View style={{ width: SCREEN_WIDTH, padding: theme.spacing.lg }}>
        <ScrollView contentContainerStyle={styles.readerCardScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.readerCard, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.arabic, { color: colors.onSurface, fontSize: getArabicSize(), lineHeight: getArabicLineHeight(), fontFamily: arabicFontFamily }]}>
              {item.arabic}
            </Text>
            
            {item.transliteration ? (
              <Text style={[styles.translit, { color: colors.brand, fontSize: getTranslitSize(), lineHeight: getTranslitLineHeight() }]}>
                {language === "ta" ? (translatedTexts[item.id]?.transliteration || transliterateToTamil(item.transliteration)) : (translatedTexts[item.id]?.transliteration || item.transliteration)}
              </Text>
            ) : null}

            <Text style={[styles.translation, { color: getTextColor(), fontSize: getTranslationSize(), lineHeight: getTranslationLineHeight() }]}>
              {translatedTexts[item.id]?.translation || item.translation}
            </Text>

            {/* Large Circular Count Tracker */}
            <View style={styles.counterContainer}>
              <Pressable
                style={[
                  styles.circularCounter,
                  { 
                    borderColor: isCompleted ? "#10B981" : colors.brand, 
                    backgroundColor: isCompleted ? "#10B9811A" : colors.surface 
                  }
                ]}
                onPress={() => decrementCounter(item.id, targetRepeat)}
              >
                {isCompleted ? (
                  <MaterialCommunityIcons name="check" size={32} color="#10B981" />
                ) : (
                  <Text style={[styles.counterText, { color: colors.brand }]}>{currentCount}</Text>
                )}
              </Pressable>
              <Text style={[styles.counterSubText, { color: colors.onSurfaceMuted }]}>
                {isCompleted ? "Completed" : `Target: ${targetRepeat} times`}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  const imgSource = CATEGORY_IMAGES[cat.id] || { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" };
  const categorySwitcher = (
    <View style={styles.categorySwitcher}>
      <Text style={[styles.categorySwitcherTitle, { color: colors.onSurfaceMuted }]}>Dua Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChipsRow}
      >
        {CATEGORIES.map((item) => {
          const isActive = item.id === cat.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => switchCategory(item.id)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isActive ? colors.brand : colors.surfaceSecondary,
                  borderColor: isActive ? colors.brand : colors.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={16}
                color={isActive ? colors.onBrandPrimary : colors.brand}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.categoryChipText,
                  { color: isActive ? colors.onBrandPrimary : colors.onSurface },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.categoryChipCount,
                  { color: isActive ? colors.onBrandPrimary : colors.onSurfaceMuted },
                ]}
              >
                {item.duas.length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (viewMode === 'reader') {
    const activeItem = cat.duas[activeDuaIndex];
    const isFav = favIds.has(activeItem.id);

    return (
      <View style={[StyleSheet.absoluteFillObject, styles.readerContainer, { backgroundColor: colors.surface }]}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={styles.readerHeader}>
            <Pressable onPress={() => setViewMode('list')} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
            </Pressable>
            <Text style={[styles.readerHeaderTitle, { color: colors.onSurface }]}>{cat.title}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={[styles.pageIndicator, { backgroundColor: colors.brand + "22" }]}>
                <Text style={[styles.pageIndicatorText, { color: colors.brand }]}>{activeDuaIndex + 1} / {cat.duas.length}</Text>
              </View>
              <Pressable onPress={() => router.push("/")} hitSlop={10} testID="dua-reader-home">
                <MaterialCommunityIcons name="home-outline" size={22} color={colors.onSurface} />
              </Pressable>
            </View>
          </View>

          <View style={styles.readerCategorySwitcher}>
            {categorySwitcher}
          </View>

          {/* Carousel */}
          <FlatList
            ref={flatListRef}
            data={cat.duas}
            renderItem={renderDuaCard}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollFlatList}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => (
              { length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index }
            )}
          />

          {/* Bottom Detail Actions Toolbar */}
          <View style={[styles.actionsToolbar, { backgroundColor: colors.surfaceSecondary }]}>
            <Pressable onPress={() => playDua(activeItem)} style={styles.actionIconBtn}>
              <MaterialCommunityIcons name={playingId === activeItem.id ? "pause" : "play"} size={22} color={colors.brand} />
              <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>Play</Text>
            </Pressable>
            <Pressable onPress={() => setShowInfo(!showInfo)} style={styles.actionIconBtn}>
              <MaterialCommunityIcons name="information" size={22} color={colors.brand} />
              <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>Info</Text>
            </Pressable>
            <Pressable onPress={() => onShare(activeItem)} style={styles.actionIconBtn}>
              <MaterialCommunityIcons name="share-variant" size={22} color={colors.brand} />
              <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>Share</Text>
            </Pressable>
            <Pressable onPress={() => onFav(activeDuaIndex)} style={styles.actionIconBtn}>
              <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? theme.colors.error : colors.brand} />
              <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>{isFav ? "Liked" : "Like"}</Text>
            </Pressable>
          </View>

          {/* Info Modal/Drawer */}
          {showInfo && (
            <View style={[styles.infoDrawer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <View style={styles.infoDrawerHead}>
                <Text style={[styles.infoDrawerTitle, { color: colors.onSurface }]}>Dua Reference & Virtue</Text>
                <Pressable onPress={() => setShowInfo(false)} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceMuted} />
                </Pressable>
              </View>
              <ScrollView style={styles.infoDrawerScroll} showsVerticalScrollIndicator={false}>
                {activeItem.reference ? (
                  <Text style={[styles.infoDrawerRef, { color: colors.onSurfaceMuted, marginBottom: 8 }]}>
                    📖 Reference: {activeItem.reference}
                  </Text>
                ) : null}
                
                {activeItem.virtue ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontWeight: "700", color: colors.brand, marginBottom: 4, fontSize: 13 }}>Virtue:</Text>
                    <Text style={[styles.infoDrawerText, { color: colors.onSurface }]}>{activeItem.virtue}</Text>
                  </View>
                ) : null}

                {activeItem.explanation ? (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontWeight: "700", color: colors.brand, marginBottom: 4, fontSize: 13 }}>Explanation:</Text>
                    <Text style={[styles.infoDrawerText, { color: colors.onSurface }]}>{activeItem.explanation}</Text>
                  </View>
                ) : null}

                {!activeItem.virtue && !activeItem.explanation && (
                  <Text style={[styles.infoDrawerText, { color: colors.onSurface }]}>
                    This supplication is taken from authentic collections. Consistently reciting it brings immense rewards and spiritual protection.
                  </Text>
                )}
              </ScrollView>
            </View>
          )}

          {/* Bottom Audio Control Bar */}
          <View style={styles.audioControlBar}>
            {/* Seek Bar */}
            <View style={styles.progressBarRow}>
              <Text style={[styles.progressTimeText, { color: colors.onSurfaceMuted }]}>{formatTime(currentTime)}</Text>
              <View 
                style={[styles.progressBarTrack, { backgroundColor: colors.onSurfaceMuted + "22" }]}
                onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
              >
                <Pressable style={StyleSheet.absoluteFill} onPress={handleSeek}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.brand }]} />
                </Pressable>
              </View>
              <Text style={[styles.progressTimeText, { color: colors.onSurfaceMuted }]}>{formatTime(duration)}</Text>
            </View>

            {/* Row buttons */}
            <View style={styles.audioButtonsRow}>
              <Pressable onPress={() => setIsLooping(!isLooping)} hitSlop={10}>
                <MaterialCommunityIcons 
                  name={isLooping ? "repeat-once" : "repeat"} 
                  size={24} 
                  color={isLooping ? colors.brand : colors.onSurfaceMuted} 
                />
              </Pressable>

              <Pressable 
                onPress={() => {
                  if (activeDuaIndex > 0) {
                    const prevIdx = activeDuaIndex - 1;
                    setActiveDuaIndex(prevIdx);
                    flatListRef.current?.scrollToIndex({ index: prevIdx, animated: true });
                  }
                }}
                disabled={activeDuaIndex === 0}
                style={{ opacity: activeDuaIndex === 0 ? 0.3 : 1 }}
                hitSlop={10}
              >
                <MaterialCommunityIcons name="skip-previous" size={28} color={colors.onSurface} />
              </Pressable>

              <Pressable onPress={() => playDua(activeItem)} hitSlop={10}>
                <MaterialCommunityIcons 
                  name={playingId === activeItem.id ? "pause-circle" : "play-circle"} 
                  size={56} 
                  color={colors.brand} 
                />
              </Pressable>

              <Pressable 
                onPress={() => {
                  if (activeDuaIndex + 1 < cat.duas.length) {
                    const nextIdx = activeDuaIndex + 1;
                    setActiveDuaIndex(nextIdx);
                    flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
                  }
                }}
                disabled={activeDuaIndex === cat.duas.length - 1}
                style={{ opacity: activeDuaIndex === cat.duas.length - 1 ? 0.3 : 1 }}
                hitSlop={10}
              >
                <MaterialCommunityIcons name="skip-next" size={28} color={colors.onSurface} />
              </Pressable>

              <Pressable 
                onPress={() => {
                  let nextSpeed = 1;
                  if (playbackSpeed === 1) nextSpeed = 1.25;
                  else if (playbackSpeed === 1.25) nextSpeed = 1.5;
                  else if (playbackSpeed === 1.5) nextSpeed = 2;
                  else nextSpeed = 1;
                  
                  setPlaybackSpeed(nextSpeed);
                  if (Platform.OS === "web") {
                    if (webAudioInstance.current) {
                      webAudioInstance.current.playbackRate = nextSpeed;
                    }
                  } else {
                    player.setPlaybackRate(nextSpeed);
                  }
                }}
                style={[styles.speedSelector, { borderColor: colors.border }]}
                hitSlop={10}
              >
                <Text style={[styles.speedSelectorText, { color: colors.onSurface }]}>{playbackSpeed}x</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Otherwise list view
  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ImageBackground source={imgSource} resizeMode="cover" style={styles.heroImage} imageStyle={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <LinearGradient colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.75)"]} style={styles.heroScrim}>
          <SafeAreaView edges={["top"]}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} hitSlop={10} testID="back-btn">
                <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
              </Pressable>
              <Text style={styles.heroTitle}>{cat.title}</Text>
              <Pressable onPress={() => router.push("/")} hitSlop={10} testID="dua-home">
                <MaterialCommunityIcons name="home-outline" size={24} color="#fff" />
              </Pressable>
            </View>
            <Text style={styles.heroSub}>{cat.duas.length} Du{`'`}a{cat.duas.length === 1 ? "" : "s"}</Text>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 100 }}>
        {categorySwitcher}

        {/* PlayStore Replicated Related Articles Row */}
        <Pressable style={[styles.relatedArticlesCard, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <MaterialCommunityIcons name="book-open-outline" size={24} color={colors.brand} />
            <Text style={[styles.relatedArticlesText, { color: colors.onSurface }]}>Related Articles</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* Numbered Duas List Items */}
        {cat.duas.map((d, i) => {
          return (
            <Pressable 
              key={d.id} 
              style={[styles.listItem, { backgroundColor: colors.surfaceSecondary }]} 
              onPress={() => {
                setActiveDuaIndex(i);
                setViewMode('reader');
              }}
              testID={`dua-${d.id}`}
            >
              <View style={[styles.listItemNumberContainer, { backgroundColor: colors.brand + "15" }]}>
                <Text style={[styles.listItemNumber, { color: colors.brand }]}>{i + 1}</Text>
              </View>
              <Text style={[styles.listItemTitle, { color: colors.onSurface, flex: 1 }]}>{d.title}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Replicated Play Store Sticky Bottom Bar */}
      <View style={[styles.stickyBottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable style={[styles.playAllBtn, { backgroundColor: colors.brand }]} onPress={playAll} testID="play-all-btn">
          <MaterialCommunityIcons name="play" size={20} color={colors.onBrandPrimary} />
          <Text style={[styles.playAllText, { color: colors.onBrandPrimary }]}>Play All</Text>
        </Pressable>
        <Pressable style={[styles.favouriteBtn, { borderColor: colors.brand }]} onPress={toggleCategoryFavourite}>
          <MaterialCommunityIcons name="heart-outline" size={20} color={colors.brand} />
          <Text style={[styles.favouriteText, { color: colors.brand }]}>Favourite</Text>
        </Pressable>
      </View>
    </View>
  );
}

const CATEGORY_IMAGES: Record<string, any> = {
  ummah: require("@/assets/images/ummah_background.png"),
  morning: { uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80" },
  evening: { uri: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop&q=80" },
  sleep: { uri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80" },
  tahajjud: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  salah: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  "after-salah": { uri: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=500&auto=format&fit=crop&q=80" },
  istikharah: { uri: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=80" },
  gatherings: { uri: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80" },
  difficulties: { uri: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=500&auto=format&fit=crop&q=80" },
  iman: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  hajj: { uri: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=500&auto=format&fit=crop&q=80" },
  travel: { uri: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=80" },
  money: { uri: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80" },
  social: { uri: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=80" },
  marriage: { uri: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&auto=format&fit=crop&q=80" },
  death: { uri: "https://images.unsplash.com/photo-1453791052107-5c843da62d97?w=500&auto=format&fit=crop&q=80" },
  nature: { uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&auto=format&fit=crop&q=80" },
  ramadan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  ruqyah: { uri: "https://images.unsplash.com/photo-1552089123-2d26226fc2b7?w=500&auto=format&fit=crop&q=80" },
  "daily-life": { uri: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80" },
  adhan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  wudu: { uri: "https://images.unsplash.com/photo-1548813730-e8f20cc74a4a?w=500&auto=format&fit=crop&q=80" },
  masjid: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  heroImage: { width: "100%" },
  heroScrim: { paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  heroSub: { color: "rgba(255,255,255,0.85)", paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.sm },

  // Category switcher
  categorySwitcher: { marginBottom: 16 },
  readerCategorySwitcher: { paddingHorizontal: theme.spacing.lg },
  categorySwitcherTitle: { fontSize: 12, fontWeight: "800", marginBottom: 8, textTransform: "uppercase" },
  categoryChipsRow: { gap: 8, paddingRight: theme.spacing.lg },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: "700", maxWidth: 140 },
  categoryChipCount: { fontSize: 11, fontWeight: "800" },
  
  // List style (play store)
  relatedArticlesCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderRadius: theme.radius.md, marginBottom: 16 },
  relatedArticlesText: { fontSize: 15, fontWeight: "600" },
  listItem: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: theme.radius.md, marginBottom: 10, gap: 12 },
  listItemNumberContainer: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  listItemNumber: { fontSize: 15, fontWeight: "700" },
  listItemTitle: { fontSize: 16, fontWeight: "600" },
  
  // Sticky Bottom Bar
  stickyBottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", padding: 16, gap: 12, borderTopWidth: 1 },
  playAllBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: theme.radius.pill },
  playAllText: { fontSize: 16, fontWeight: "700" },
  favouriteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: theme.radius.pill, borderWidth: 1 },
  favouriteText: { fontSize: 16, fontWeight: "700" },
  
  // Reader style
  readerContainer: { flex: 1 },
  readerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  readerHeaderTitle: { fontSize: 18, fontWeight: "700", flex: 1, marginLeft: 12 },
  pageIndicator: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pageIndicatorText: { fontSize: 13, fontWeight: "700" },
  
  readerCardScroll: { flexGrow: 1, justifyContent: "center" },
  readerCard: { borderRadius: theme.radius.lg, padding: theme.spacing.lg, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
  arabic: { fontFamily: "NotoNaskhArabic", textAlign: "right", marginTop: theme.spacing.md },
  translit: { fontStyle: "italic", marginTop: theme.spacing.md, lineHeight: 21 },
  translation: { marginTop: theme.spacing.sm, lineHeight: 22 },
  
  // Tap Counter
  counterContainer: { alignItems: "center", marginTop: 28, gap: 8 },
  circularCounter: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  counterText: { fontSize: 32, fontWeight: "700" },
  counterSubText: { fontSize: 13, fontWeight: "600" },
  
  // Bottom toolbar (Play, Info, Share, Like)
  actionsToolbar: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  actionIconBtn: { alignItems: "center", gap: 4, width: 60 },
  actionIconLabel: { fontSize: 11, fontWeight: "600" },
  
  // Info Drawer
  infoDrawer: { position: "absolute", bottom: 150, left: 16, right: 16, padding: 16, borderRadius: 16, borderWidth: 1, maxHeight: 180, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  infoDrawerHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  infoDrawerTitle: { fontSize: 15, fontWeight: "700" },
  infoDrawerScroll: { flex: 1 },
  infoDrawerRef: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  infoDrawerText: { fontSize: 14, lineHeight: 20 },
  
  // Audio Control Bar
  audioControlBar: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  progressBarRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  progressTimeText: { fontSize: 12, minWidth: 32, textAlign: "center" },
  progressBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden", position: "relative" },
  progressBarFill: { height: "100%" },
  
  audioButtonsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10 },
  speedSelector: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, minWidth: 44, alignItems: "center" },
  speedSelectorText: { fontSize: 12, fontWeight: "700" },
});
