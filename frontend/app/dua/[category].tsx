import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Platform, Share, Dimensions, FlatList, Vibration, Modal, PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { useArabicFont } from "@/src/hooks/useArabicFont";
import * as Haptics from "expo-haptics";
import { CATEGORIES, getCategory } from "@/src/data/duas";
import { 
  toggleFavourite, 
  getFavourites, 
  Favourite,
  getDhikrBookmarks,
  toggleDhikrBookmark
} from "@/src/storage";
import { transliterateToTamil } from "@/src/transliterator";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function DuaCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { colors, language, fontSize, fontColor } = useTheme();
  const { t } = useTranslation(language);
  const arabicFontFamily = useArabicFont();
  const cat = getCategory(String(category));
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, { translation: string; transliteration?: string }>>({});
  
  // View Modes: 'list' (master) or 'reader' (detail carousel)
  const [viewMode, setViewMode] = useState<'list' | 'reader'>('list');
  const [activeDuaIndex, setActiveDuaIndex] = useState<number>(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [scrollProgress, setScrollProgress] = useState(0);
  const [readerViewportHeight, setReaderViewportHeight] = useState<number | null>(
    Platform.OS === "web" ? Math.max(240, SCREEN_HEIGHT - 205) : null,
  );
  
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
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const webSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const webWheelNavigationAtRef = useRef(0);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
    };
  }, []);

  const currentTime = Platform.OS === "web" ? webCurrentTime : (status?.currentTime || 0);
  const duration = Platform.OS === "web" ? webDuration : (status?.duration || 0);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const [isPlayerBarOpen, setIsPlayerBarOpen] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [loopMode, setLoopMode] = useState<"1x" | "2x" | "3x" | "infinity">("1x");
  const [loopCountRemaining, setLoopCountRemaining] = useState(0);

  const holdSeekTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const rewind5Sec = () => {
    const validCurrent = (typeof currentTime === "number" && Number.isFinite(currentTime)) ? currentTime : 0;
    const targetSeconds = Math.max(0, validCurrent - 5);
    if (Platform.OS === "web") {
      if (webAudioInstance.current && Number.isFinite(webAudioInstance.current.duration)) {
        webAudioInstance.current.currentTime = Math.min(webAudioInstance.current.duration, targetSeconds);
      }
    } else {
      player.seekTo(targetSeconds);
    }
  };

  const fastForward5Sec = () => {
    const validCurrent = (typeof currentTime === "number" && Number.isFinite(currentTime)) ? currentTime : 0;
    if (Platform.OS === "web") {
      if (webAudioInstance.current && Number.isFinite(webAudioInstance.current.duration)) {
        const targetSeconds = Math.min(webAudioInstance.current.duration, validCurrent + 5);
        if (Number.isFinite(targetSeconds)) {
          webAudioInstance.current.currentTime = targetSeconds;
        }
      }
    } else {
      const validDuration = (typeof duration === "number" && Number.isFinite(duration) && duration > 0) ? duration : 9999;
      player.seekTo(Math.min(validDuration, validCurrent + 5));
    }
  };

  const startContinuousRewind = () => {
    rewind5Sec();
    if (holdSeekTimerRef.current) clearInterval(holdSeekTimerRef.current);
    holdSeekTimerRef.current = setInterval(() => {
      rewind5Sec();
    }, 200);
  };

  const startContinuousFastForward = () => {
    fastForward5Sec();
    if (holdSeekTimerRef.current) clearInterval(holdSeekTimerRef.current);
    holdSeekTimerRef.current = setInterval(() => {
      fastForward5Sec();
    }, 200);
  };

  const stopContinuousSeek = () => {
    if (holdSeekTimerRef.current) {
      clearInterval(holdSeekTimerRef.current);
      holdSeekTimerRef.current = null;
    }
  };

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const cycleSpeed = () => {
    const currentIdx = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (Platform.OS === "web") {
      if (webAudioInstance.current) webAudioInstance.current.playbackRate = nextSpeed;
    } else {
      player.setPlaybackRate(nextSpeed);
    }
  };

  const cycleLoopMode = () => {
    if (loopMode === "1x") {
      setLoopMode("2x");
      setLoopCountRemaining(1);
    } else if (loopMode === "2x") {
      setLoopMode("3x");
      setLoopCountRemaining(2);
    } else if (loopMode === "3x") {
      setLoopMode("infinity");
      setIsLooping(true);
    } else {
      setLoopMode("1x");
      setIsLooping(false);
      setLoopCountRemaining(0);
    }
  };

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
    setIsAudioPaused(false);
    setIsPlayerBarOpen(false);
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
    if (fontSize === "small") return 40;
    if (fontSize === "large") return 64;
    return 50; // medium
  };
  const getTranslitSize = () => {
    if (fontSize === "small") return 13;
    if (fontSize === "large") return 20;
    return 16; // medium
  };
  const getTranslitLineHeight = () => {
    if (fontSize === "small") return 23;
    if (fontSize === "large") return 33;
    return 27; // medium
  };
  const getTranslationSize = () => {
    if (fontSize === "small") return 13;
    if (fontSize === "large") return 20;
    return 16; // medium
  };
  const getTranslationLineHeight = () => {
    if (fontSize === "small") return 23;
    if (fontSize === "large") return 33;
    return 27; // medium
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
    getDhikrBookmarks().then((bms) => setBookmarkedIds(new Set(bms.map((b) => b.id))));
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
      scrollTimeoutRef.current = setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: activeDuaIndex, animated: false });
      }, 100);
      
      // If we were playing all, trigger playback
      if (isPlayingAll) {
        playDua(cat.duas[activeDuaIndex]);
      }
    }
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [viewMode]);

  // When index changes via swipe, play if already playing
  useEffect(() => {
    if (viewMode === 'reader' && playingId && cat) {
      playDua(cat.duas[activeDuaIndex]);
    }
  }, [activeDuaIndex]);

  const handleAudioFinished = () => {
    if (loopMode === "infinity") {
      if (cat) playDua(cat.duas[activeDuaIndex]);
      return;
    }
    if (loopCountRemaining > 0) {
      setLoopCountRemaining(prev => prev - 1);
      if (cat) playDua(cat.duas[activeDuaIndex]);
      return;
    }
    
    if (isPlayingAll && cat) {
      if (activeDuaIndex + 1 < cat.duas.length) {
        const nextIdx = activeDuaIndex + 1;
        setActiveDuaIndex(nextIdx);
        flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
      } else {
        setIsPlayingAll(false);
        setPlayingId(null);
      }
    } else {
      setPlayingId(null);
    }
  };

  const playSpeechSynthesis = (text: string, id: string, rate: number = 0.85) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setPlayingId(null);
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // MUST call speak() immediately (within user gesture context).
    // setTimeout breaks the browser's autoplay/gesture policy and silences audio.
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Try to assign Arabic voice if already loaded — don't wait for it
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith("ar")) || null;
    if (arabicVoice) utterance.voice = arabicVoice;

    // Set playing immediately so player bar shows active
    setPlayingId(id);
    setIsAudioPaused(false);

    utterance.onstart = () => {
      setPlayingId(id);
      setIsAudioPaused(false);
    };
    utterance.onend = () => {
      setPlayingId(null);
      handleAudioFinished();
    };
    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e.error);
      setPlayingId(null);
    };

    // Speak immediately — this MUST stay in the user gesture call stack
    window.speechSynthesis.speak(utterance);
  };

  const fallbackToSpeechSynthesis = (text: string, id: string) => {
    playSpeechSynthesis(text, id, playbackSpeed * 0.85);
  };


  const playDua = async (d: any) => {
    setIsPlayerBarOpen(true);

    if (playingId === d.id && !isAudioPaused) {
      // Pause
      if (Platform.OS === "web") {
        if (webAudioInstance.current && !webAudioInstance.current.paused) {
          webAudioInstance.current.pause();
        }
        window.speechSynthesis?.pause();
      } else {
        player.pause();
      }
      setIsAudioPaused(true);
      return;
    }

    if (playingId === d.id && isAudioPaused) {
      // Resume
      if (Platform.OS === "web") {
        if (webAudioInstance.current && webAudioInstance.current.paused) {
          webAudioInstance.current.play().catch(() => {});
        } else {
          window.speechSynthesis?.resume();
        }
      } else {
        player.play();
      }
      setIsAudioPaused(false);
      return;
    }

    // New dua — stop previous
    if (Platform.OS === "web") {
      if (webAudioInstance.current) {
        webAudioInstance.current.pause();
        webAudioInstance.current.src = "";
        webAudioInstance.current = null;
      }
      window.speechSynthesis?.cancel();
    }

    setIsAudioPaused(false);
    const cleanText = d.arabic.replace(/[^\u0600-\u06FF\s]/g, "");

    if (Platform.OS === "web") {
      const audioUrl = d.audio || `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      const audio = new Audio();
      let fallbackStarted = false;

      const startFallback = () => {
        if (fallbackStarted) return;
        fallbackStarted = true;
        if (webAudioInstance.current === audio) {
          webAudioInstance.current = null;
        }
        fallbackToSpeechSynthesis(cleanText, d.id);
      };

      // Restore the previously working browser path: play the actual recording
      // immediately while this function is still inside the user's click/tap.
      (audio as HTMLAudioElement & { referrerPolicy?: string }).referrerPolicy = "no-referrer";
      audio.src = audioUrl;
      audio.playbackRate = playbackSpeed;
      audio.loop = isLooping;
      webAudioInstance.current = audio;
      setWebCurrentTime(0);
      setWebDuration(0);

      audio.onplay = () => {
        setPlayingId(d.id);
        setIsAudioPaused(false);
      };
      audio.onloadedmetadata = () => {
        setWebDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      };
      audio.ontimeupdate = () => {
        setWebCurrentTime(audio.currentTime);
      };
      audio.onended = () => {
        setPlayingId(null);
        handleAudioFinished();
      };
      audio.onerror = () => {
        console.warn("Dua recording failed; using browser speech fallback.");
        startFallback();
      };

      try {
        await audio.play();
      } catch (error) {
        console.warn("Dua recording could not start; using browser speech fallback.", error);
        startFallback();
      }
    } else {
      const audioUrl = d.audio || `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(cleanText.slice(0, 100))}`;
      player.replace({ uri: audioUrl });
      player.loop = isLooping;
      player.setPlaybackRate(playbackSpeed);
      player.play();
      setPlayingId(d.id);
    }
  };

  const seekTrackRef = useRef<View>(null);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);

  const handleSeekFromX = (pageX: number) => {
    if (!progressWidth || progressWidth <= 0) return;
    if (seekTrackRef.current) {
      seekTrackRef.current.measure((fx, fy, width, height, px, py) => {
        if (width > 0) {
          const relativeX = Math.max(0, Math.min(width, pageX - px));
          const pct = relativeX / width;
          setDragPercent(pct * 100);
          
          const validDuration = Platform.OS === "web" 
            ? (webAudioInstance.current && Number.isFinite(webAudioInstance.current.duration) ? webAudioInstance.current.duration : 0)
            : (typeof duration === "number" && Number.isFinite(duration) ? duration : 0);

          if (validDuration > 0) {
            const targetSeconds = pct * validDuration;
            if (Number.isFinite(targetSeconds)) {
              if (Platform.OS === "web") {
                if (webAudioInstance.current) {
                  webAudioInstance.current.currentTime = Math.min(validDuration, Math.max(0, targetSeconds));
                }
              } else {
                player.seekTo(targetSeconds);
              }
            }
          }
        }
      });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDraggingSeek(true);
        handleSeekFromX(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        handleSeekFromX(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: (evt) => {
        handleSeekFromX(evt.nativeEvent.pageX);
        setIsDraggingSeek(false);
        setDragPercent(null);
      },
      onPanResponderTerminate: () => {
        setIsDraggingSeek(false);
        setDragPercent(null);
      },
    })
  ).current;

  const handleSeek = (e: any) => {
    const validDuration = Platform.OS === "web" 
      ? (webAudioInstance.current && Number.isFinite(webAudioInstance.current.duration) ? webAudioInstance.current.duration : 0)
      : (typeof duration === "number" && Number.isFinite(duration) ? duration : 0);

    if (progressWidth > 0 && validDuration > 0) {
      const locationX = e.nativeEvent?.locationX ?? e.nativeEvent?.offsetX ?? 0;
      if (typeof locationX === "number" && Number.isFinite(locationX)) {
        const pct = Math.max(0, Math.min(1, locationX / progressWidth));
        const targetSeconds = pct * validDuration;
        if (Number.isFinite(targetSeconds)) {
          if (Platform.OS === "web") {
            if (webAudioInstance.current) {
              webAudioInstance.current.currentTime = Math.min(validDuration, Math.max(0, targetSeconds));
            }
          } else {
            player.seekTo(targetSeconds);
          }
        }
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
          autoAdvanceTimeoutRef.current = setTimeout(() => {
            if (activeDuaIndex + 1 < cat.duas.length) {
              const nextIdx = activeDuaIndex + 1;
              setActiveDuaIndex(nextIdx);
              flatListRef.current?.scrollToIndex({ index: nextIdx, animated: true });
            }
          }, 800);
          // Cleanup on unmount handled by separate useEffect
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
          cat.duas.map(async (d: any) => {
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

  const onBookmark = async (i: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const d = cat.duas[i];
    const bm = {
      id: `dhikr-${d.id}`,
      duaId: d.id,
      title: d.title,
      subtitle: cat.title,
      arabic: d.arabic,
      translation: d.translation,
      addedAt: Date.now(),
    };
    await toggleDhikrBookmark(bm);
    const bms = await getDhikrBookmarks();
    setBookmarkedIds(new Set(bms.map((b) => b.id)));
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

  const navigateToDua = (nextIndex: number) => {
    if (!cat || nextIndex < 0 || nextIndex >= cat.duas.length || nextIndex === activeDuaIndex) return;
    setActiveDuaIndex(nextIndex);
    flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
  };

  const webHorizontalGestureHandlers = Platform.OS === "web" ? ({
    onPointerDown: (e: any) => {
      const event = e.nativeEvent;
      webSwipeStartRef.current = {
        x: event.clientX ?? event.pageX ?? 0,
        y: event.clientY ?? event.pageY ?? 0,
      };
    },
    onPointerUp: (e: any) => {
      const start = webSwipeStartRef.current;
      webSwipeStartRef.current = null;
      if (!start) return;
      const event = e.nativeEvent;
      const deltaX = (event.clientX ?? event.pageX ?? start.x) - start.x;
      const deltaY = (event.clientY ?? event.pageY ?? start.y) - start.y;
      if (Math.abs(deltaX) < 55 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      navigateToDua(deltaX < 0 ? activeDuaIndex + 1 : activeDuaIndex - 1);
    },
    onPointerCancel: () => {
      webSwipeStartRef.current = null;
    },
    onWheel: (e: any) => {
      const event = e.nativeEvent;
      const deltaX = Number(event.deltaX || 0);
      const shiftedDelta = event.shiftKey ? Number(event.deltaY || 0) : 0;
      const horizontalDelta = Math.abs(deltaX) >= Math.abs(shiftedDelta) ? deltaX : shiftedDelta;
      if (Math.abs(horizontalDelta) < 30 || Date.now() - webWheelNavigationAtRef.current < 450) return;
      webWheelNavigationAtRef.current = Date.now();
      navigateToDua(horizontalDelta > 0 ? activeDuaIndex + 1 : activeDuaIndex - 1);
    },
  } as any) : {};

  const renderDuaCard = ({ item, index }: { item: any; index: number }) => {
    const targetRepeat = item.repeat || 1;
    const currentCount = counts[item.id] !== undefined ? counts[item.id] : targetRepeat;
    const isCompleted = currentCount === 0;

    return (
      <View
        {...webHorizontalGestureHandlers}
        style={[{ width: SCREEN_WIDTH, flex: 1, height: "100%", minHeight: 0, paddingHorizontal: theme.spacing.lg }, Platform.OS === "web" ? ({ overflow: "hidden", minHeight: 0, touchAction: "pan-y" } as any) : null]}
      >
        <ScrollView
          {...webHorizontalGestureHandlers}
          contentContainerStyle={[
            styles.readerCardScroll,
            Platform.OS === "web" ? ({ flexGrow: 0 } as any) : null,
          ]}
          showsVerticalScrollIndicator={true}
          style={[
            { flex: 1, minHeight: 0 },
            Platform.OS === "web" ? ({ flex: "none", flexGrow: 0, flexShrink: 0, height: readerViewportHeight || 500, maxHeight: "none", minHeight: 0, overflowY: "auto", overflowX: "hidden" } as any) : null
          ]}
        >
          <View style={styles.readerContent}>
            <Text style={[styles.arabic, { color: colors.onSurface, fontSize: getArabicSize(), lineHeight: getArabicLineHeight(), fontFamily: arabicFontFamily, letterSpacing: -0.3, marginTop: 10 }]}>
              {item.arabic}
            </Text>
            
            {item.transliteration ? (
              <Text style={[styles.translit, { color: colors.brand, fontSize: getTranslitSize(), lineHeight: getTranslitLineHeight() }]}>
                {language === "ta" ? (translatedTexts[item.id]?.transliteration || transliterateToTamil(item.transliteration)) : (translatedTexts[item.id]?.transliteration || item.transliteration)}
              </Text>
            ) : null}

            <Text style={[styles.translation, { color: getTextColor(), fontSize: getTranslationSize(), lineHeight: getTranslationLineHeight(), letterSpacing: 0.15 }]}>
              {translatedTexts[item.id]?.translation || item.translation}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  };

  const imgSource = CATEGORY_IMAGES[cat.id] || { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" };
  const categorySwitcher = (
    <View style={styles.categorySwitcher}>
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
                {t(item.id)}
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
    const isBookmarked = bookmarkedIds.has(`dhikr-${activeItem.id}`);

    const readerPct = Math.round(((activeDuaIndex + 1) / cat.duas.length) * 100);

    return (
      <View style={[StyleSheet.absoluteFillObject, styles.readerContainer, { backgroundColor: colors.surface }]}>
        <SafeAreaView style={{ flex: 1, minHeight: 0 }} edges={["top", "bottom"]}>
          {/* Vibrant Brand Green Hero Banner Header */}
          <View style={{ backgroundColor: colors.brand, paddingBottom: 16 }}>
            {/* Reading progress bar line */}
            <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.3)", width: "100%" }}>
              <View style={{ height: 3, backgroundColor: "#FFFFFF", width: `${readerPct}%` }} />
            </View>

            {/* Navigation Icons Row */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 10 }}>
              <Pressable onPress={() => setViewMode('list')} hitSlop={10}>
                <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" />
              </Pressable>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10} testID="dua-reader-home">
                  <MaterialCommunityIcons name="home-outline" size={24} color="#FFFFFF" />
                </Pressable>
                <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
                  <MaterialCommunityIcons name="cog-outline" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Active Du'a Title & Pill Progress */}
            <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
              <Text numberOfLines={2} style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF", lineHeight: 28 }}>
                {activeItem.title}
              </Text>
              
              <View style={{ alignSelf: "flex-start", backgroundColor: "#FFFFFF", paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, marginTop: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.brand }}>
                  {activeDuaIndex + 1}/{cat.duas.length} · {readerPct}% {t("readPercent")}
                </Text>
              </View>
            </View>
          </View>

          {/* Image 1 Gap: Top margin added to category switcher */}
          <View style={[styles.readerCategorySwitcher, { marginTop: 10, marginBottom: 6 }]}>
            {categorySwitcher}
          </View>

          {/* Carousel */}
          <FlatList
            ref={flatListRef}
            style={[{ flex: 1, minHeight: 0 }, Platform.OS === "web" ? ({ height: "100%", minHeight: 0, overflow: "hidden" } as any) : null]}
            data={cat.duas}
            renderItem={renderDuaCard}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScrollFlatList}
            scrollEventThrottle={16}
            onLayout={(e) => {
              const height = e.nativeEvent.layout.height;
              if (height > 0 && height !== readerViewportHeight) setReaderViewportHeight(height);
            }}
            getItemLayout={(data, index) => (
              { length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index }
            )}
          />

          {/* Constant Floating Circular Counter Button (Hidden during audio playback) */}
          {!isPlayerBarOpen && (() => {
            const targetRepeat = activeItem.repeat || 1;
            const currentCount = counts[activeItem.id] !== undefined ? counts[activeItem.id] : targetRepeat;
            const isCompleted = currentCount === 0;

            return (
              <View pointerEvents="box-none" style={{ position: "absolute", bottom: 62, left: 0, right: 0, alignItems: "center", zIndex: 100 }}>
                <Pressable
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: isCompleted ? "#10B981" : colors.brand,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 6,
                    elevation: 8,
                    borderWidth: 2,
                    borderColor: "#FFFFFF"
                  }}
                  onPress={() => decrementCounter(activeItem.id, targetRepeat)}
                >
                  {isCompleted ? (
                    <MaterialCommunityIcons name="check" size={30} color="#FFFFFF" />
                  ) : (
                    <Text style={{ fontSize: 24, fontWeight: "800", color: "#FFFFFF" }}>
                      {currentCount}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })()}

          {/* Bottom Toolbar: Default Actions (Image 1) OR Audio Player Toolbar (Image 2 & 3 with Drag Seek & Continuous Seek) */}
          {isPlayerBarOpen ? (
            <View style={{ backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 }}>
              {/* Image 3: Interactive YouTube-Style Drag Seek Bar & Remaining Time Row */}
              {(() => {
                const displayPct = isDraggingSeek && dragPercent !== null ? dragPercent : progressPercent;
                return (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <View 
                      ref={seekTrackRef}
                      {...panResponder.panHandlers}
                      style={{ flex: 1, height: 26, justifyContent: "center", position: "relative", cursor: Platform.OS === "web" ? "pointer" : "default" } as any}
                      onLayout={(e) => setProgressWidth(e.nativeEvent.layout.width)}
                    >
                      {/* Background Track Line */}
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.onSurfaceMuted + "33", width: "100%", overflow: "hidden" }}>
                        {/* Active Filled Progress Line */}
                        <View style={{ height: "100%", width: `${displayPct}%`, backgroundColor: colors.brand, borderRadius: 3 }} />
                      </View>

                      {/* YouTube-Style Circular Green Drag Knob */}
                      <View 
                        style={{
                          position: "absolute",
                          left: `${Math.max(0, Math.min(96, displayPct))}%`,
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: colors.brand,
                          borderWidth: 2,
                          borderColor: "#FFFFFF",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 3,
                          elevation: 4,
                          marginLeft: -8,
                        }}
                      />
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.onSurfaceMuted, minWidth: 44, textAlign: "right" }}>
                      {formatTime(duration ? (duration - currentTime) : 0)}
                    </Text>
                  </View>
                );
              })()}

              {/* Player Controls Row (6 Buttons with Image 2 Continuous 5s Seek on Hold) */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 }}>
                {/* 1. Stop Button (⏹) -> Returns cleanly to Default Mode */}
                <Pressable onPress={stopCurrentAudio} hitSlop={10} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="stop-circle-outline" size={26} color={colors.onSurfaceMuted} />
                </Pressable>

                {/* 2. Rewind 5s Button (⏮) -> Continuous rewind on hold */}
                <Pressable 
                  onPressIn={startContinuousRewind}
                  onPressOut={stopContinuousSeek}
                  onPress={rewind5Sec}
                  hitSlop={10} 
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons name="rewind-5" size={26} color={colors.onSurface} />
                </Pressable>

                {/* 3. Play / Pause Toggle (⏯) */}
                <Pressable 
                  onPress={() => {
                    const activeItem = cat.duas[activeDuaIndex];
                    if (playingId === activeItem.id && !isAudioPaused) {
                      if (Platform.OS === "web") {
                        webAudioInstance.current?.pause();
                        window.speechSynthesis?.cancel();
                      } else {
                        player.pause();
                      }
                      setIsAudioPaused(true);
                    } else {
                      playDua(activeItem);
                    }
                  }} 
                  hitSlop={10}
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons 
                    name={(playingId === activeItem.id && !isAudioPaused) ? "pause-circle" : "play-circle"} 
                    size={40} 
                    color={colors.brand} 
                  />
                </Pressable>

                {/* 4. Fast Forward 5s Button (⏭) -> Continuous fast-forward on hold */}
                <Pressable 
                  onPressIn={startContinuousFastForward}
                  onPressOut={stopContinuousSeek}
                  onPress={fastForward5Sec}
                  hitSlop={10} 
                  style={{ padding: 4 }}
                >
                  <MaterialCommunityIcons name="fast-forward-5" size={26} color={colors.onSurface} />
                </Pressable>

                {/* 5. Playback Speed Button (0.25x -> 2x) */}
                <Pressable 
                  onPress={cycleSpeed}
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, alignItems: "center" }}
                  hitSlop={10}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurface }}>{playbackSpeed}x</Text>
                </Pressable>

                {/* 6. Loop Button (1x, 2x, 3x, ∞) */}
                <Pressable onPress={cycleLoopMode} hitSlop={10} style={{ paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1, borderColor: loopMode !== "1x" ? colors.brand : colors.border, borderRadius: 12, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: loopMode !== "1x" ? colors.brand : colors.onSurfaceMuted }}>
                    {loopMode === "infinity" ? "∞" : loopMode}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            /* Default Actions Toolbar (Image 1) */
            <View style={[styles.actionsToolbar, { backgroundColor: colors.surfaceSecondary }]}>
              <Pressable onPress={() => playDua(activeItem)} style={styles.actionIconBtn}>
                <MaterialCommunityIcons name="play" size={22} color={colors.brand} />
                <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>{t("play") || "Play"}</Text>
              </Pressable>
              <Pressable onPress={() => setShowInfo(!showInfo)} style={styles.actionIconBtn}>
                <MaterialCommunityIcons name="information" size={22} color={colors.brand} />
                <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>{t("info") || "Info"}</Text>
              </Pressable>
              <Pressable onPress={() => onShare(activeItem)} style={styles.actionIconBtn}>
                <MaterialCommunityIcons name="share-variant" size={22} color={colors.brand} />
                <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>{t("share") || "Share"}</Text>
              </Pressable>
              <Pressable onPress={() => onFav(activeDuaIndex)} style={styles.actionIconBtn}>
                <MaterialCommunityIcons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? colors.error : colors.brand} />
                <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>{isFav ? t("liked") : t("like")}</Text>
              </Pressable>
              <Pressable onPress={() => onBookmark(activeDuaIndex)} style={styles.actionIconBtn}>
                <MaterialCommunityIcons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={22} color={isBookmarked ? colors.brand : colors.onSurfaceMuted} />
                <Text style={[styles.actionIconLabel, { color: colors.onSurfaceMuted }]}>{isBookmarked ? "Bookmarked" : "Bookmark"}</Text>
              </Pressable>
            </View>
          )}

          <Modal visible={showInfo} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowInfo(false)}>
            <SafeAreaView style={[styles.infoScreen, { backgroundColor: colors.surface }]} edges={["top", "bottom"]}>
              <View style={[styles.infoScreenHead, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoDrawerTitle, { color: colors.onSurface }]}>Dua Reference & Virtue</Text>
                  <Text style={[styles.infoScreenSub, { color: colors.onSurfaceMuted }]}>{activeItem.title}</Text>
                </View>
                <Pressable onPress={() => setShowInfo(false)} hitSlop={12} style={[styles.infoClose, { backgroundColor: colors.surfaceSecondary }]}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.onSurface} />
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.infoScreenContent} showsVerticalScrollIndicator={false}>
                {activeItem.reference ? (
                  <View style={[styles.infoReferenceCard, { backgroundColor: colors.brand + "12" }]}>
                    <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.brand} />
                    <Text style={[styles.infoDrawerRef, { color: colors.onSurface }]}>{activeItem.reference}</Text>
                  </View>
                ) : null}
                {activeItem.virtue ? (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoSectionTitle, { color: colors.brand }]}>Virtue</Text>
                    <Text style={[styles.infoDrawerText, { color: colors.onSurface }]}>{activeItem.virtue}</Text>
                  </View>
                ) : null}
                {activeItem.explanation ? (
                  <View style={styles.infoSection}>
                    <Text style={[styles.infoSectionTitle, { color: colors.brand }]}>Explanation</Text>
                    <Text style={[styles.infoDrawerText, { color: colors.onSurface }]}>{activeItem.explanation}</Text>
                  </View>
                ) : null}
                {!activeItem.virtue && !activeItem.explanation && (
                  <Text style={[styles.infoDrawerText, { color: colors.onSurface }]}>
                    This supplication is taken from authentic collections. Consistently reciting it brings immense rewards and spiritual protection.
                  </Text>
                )}
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* End of Reader View */}
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
              <Text style={styles.heroTitle}>{(t(cat.id) && t(cat.id) !== cat.id ? t(cat.id) : cat.title)}</Text>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10} testID="dua-home">
                  <MaterialCommunityIcons name="home-outline" size={24} color="#fff" />
                </Pressable>
                <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
                  <MaterialCommunityIcons name="cog-outline" size={24} color="#fff" />
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginRight: 16 }}>
              <Text style={styles.heroSub}>{cat.duas.length} {t("duas")}</Text>
              <Text style={{ fontSize: 11, color: "#fff", fontWeight: "700", opacity: 0.8 }}>
                {Math.round(scrollProgress * 100)}% {t("readPercent")}
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>

      {/* Reading progress bar */}
      <View style={{ height: 3, backgroundColor: colors.surfaceSecondary, width: "100%" }}>
        <View style={{ height: 3, backgroundColor: colors.brand, width: `${Math.round(scrollProgress * 100)}%` }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 100 }}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          const scrollable = contentSize.height - layoutMeasurement.height;
          if (scrollable > 0) {
            setScrollProgress(Math.min(1, contentOffset.y / scrollable));
          }
        }}
      >
        {categorySwitcher}

        {/* PlayStore Replicated Related Articles Row */}
        <Pressable style={[styles.relatedArticlesCard, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <MaterialCommunityIcons name="book-open-outline" size={24} color={colors.brand} />
            <Text style={[styles.relatedArticlesText, { color: colors.onSurface }]}>{t("relatedArticles")}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* Numbered Duas List Items */}
        {cat.duas.map((d: any, i: number) => {
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
          <Text style={[styles.playAllText, { color: colors.onBrandPrimary }]}>{t("playAll")}</Text>
        </Pressable>
        <Pressable style={[styles.favouriteBtn, { borderColor: colors.brand }]} onPress={toggleCategoryFavourite}>
          <MaterialCommunityIcons name="heart-outline" size={20} color={colors.brand} />
          <Text style={[styles.favouriteText, { color: colors.brand }]}>{t("favourite")}</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.surface,
    ...Platform.select({
      web: { height: "100%", overflow: "hidden" } as any
    })
  },
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
  
  readerCardScroll: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  readerContent: { paddingHorizontal: theme.spacing.sm, paddingBottom: 160 },
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
  
  // Full-screen reference reader
  infoScreen: { flex: 1 },
  infoScreenHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  infoScreenSub: { fontSize: 13, marginTop: 3 },
  infoClose: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  infoScreenContent: { padding: 20, paddingBottom: 48 },
  infoReferenceCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, padding: 14, marginBottom: 24 },
  infoSection: { marginBottom: 26 },
  infoSectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 8 },
  infoDrawerTitle: { fontSize: 15, fontWeight: "700" },
  infoDrawerRef: { fontSize: 14, fontWeight: "700", flex: 1 },
  infoDrawerText: { fontSize: 17, lineHeight: 28 },
  
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
