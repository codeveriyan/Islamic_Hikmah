import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  TextInput,
  Dimensions,
  Animated,
  LayoutAnimation,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { theme } from "@/src/theme";
import { QURAN_VOCABULARY, QuranWord, THEME_LABELS } from "@/src/data/quran/quranVocabulary";
import { SURAH_LIST } from "@/src/data/surahList";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Local Storage Keys
const MASTERED_WORDS_KEY = "hikmah:quran-vocab:mastered";
const STREAK_KEY = "hikmah:quran-vocab:streak";
const LAST_STUDY_KEY = "hikmah:quran-vocab:last-study";

export default function LearnQuranView() {
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  // Screen modes: 'dashboard' | 'flashcards' | 'quiz' | 'themes' | 'surahs'
  const [mode, setMode] = useState<"dashboard" | "flashcards" | "quiz" | "themes" | "surahs">("dashboard");

  // User Stats
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);

  // Selected filters
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    word: QuranWord;
    options: string[];
    correctAnswer: string;
    selectedAnswer: string | null;
  }>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Load User Stats on mount
  useEffect(() => {
    AsyncStorage.getItem(MASTERED_WORDS_KEY).then((raw) => {
      if (raw) setMasteredIds(JSON.parse(raw));
    });

    AsyncStorage.getItem(STREAK_KEY).then((val) => {
      if (val) setStreak(Number(val));
    });

    // Check streak decay
    AsyncStorage.getItem(LAST_STUDY_KEY).then((val) => {
      if (val) {
        const lastStudy = new Date(val);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - lastStudy.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 1.5) {
          setStreak(0);
          AsyncStorage.setItem(STREAK_KEY, "0");
        }
      }
    });
  }, []);

  // Track Streak on action
  const recordActivity = useCallback(async () => {
    const todayStr = new Date().toDateString();
    const lastStr = await AsyncStorage.getItem(LAST_STUDY_KEY);

    if (lastStr !== todayStr) {
      let newStreak = streak;
      if (!lastStr) {
        newStreak = 1;
      } else {
        const lastDate = new Date(lastStr);
        const today = new Date();
        const diffDays = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 1.2) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
      setStreak(newStreak);
      await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
      await AsyncStorage.setItem(LAST_STUDY_KEY, todayStr);
    }
  }, [streak]);

  // Derived vocab list based on selected theme/surah filters
  const studyList = useMemo(() => {
    let list = QURAN_VOCABULARY;
    if (selectedTheme) {
      list = list.filter((w) => w.category === selectedTheme);
    }
    if (selectedSurah) {
      list = list.filter((w) => w.surahNum === selectedSurah);
    }
    return list;
  }, [selectedTheme, selectedSurah]);

  // Unmastered vocabulary for active study list
  const activeStudyList = useMemo(() => {
    return studyList.filter((w) => !masteredIds.includes(w.id));
  }, [studyList, masteredIds]);

  // Handle flashcard action (spaced repetition swipe approximation)
  const handleCardFeedback = useCallback(async (known: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsFlipped(false);
    await recordActivity();

    if (known) {
      // Mark as mastered
      const activeWord = activeStudyList[currentCardIndex];
      if (activeWord) {
        const nextMastered = [...masteredIds, activeWord.id];
        setMasteredIds(nextMastered);
        await AsyncStorage.setItem(MASTERED_WORDS_KEY, JSON.stringify(nextMastered));
      }
    }

    if (currentCardIndex + 1 < activeStudyList.length) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      // End of cards
      setMode("dashboard");
      setCurrentCardIndex(0);
      alert("Congratulations! You've finished this vocabulary review deck! 🎉");
    }
  }, [activeStudyList, currentCardIndex, masteredIds, recordActivity]);

  // Start Quiz
  const startQuiz = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const pool = QURAN_VOCABULARY;
    if (pool.length < 4) {
      alert("Study more words first!");
      return;
    }

    // Shuffle and pick up to 10 questions
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, 10);
    const questions = shuffled.map((word) => {
      // Generate multiple choice options
      const correct = word.english;
      const incorrect = pool
        .filter((w) => w.id !== word.id)
        .map((w) => w.english)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const options = [correct, ...incorrect].sort(() => 0.5 - Math.random());
      return {
        word,
        options,
        correctAnswer: correct,
        selectedAnswer: null,
      };
    });

    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setMode("quiz");
  }, []);

  // Answer Quiz question
  const submitAnswer = useCallback((answer: string) => {
    if (quizQuestions[currentQuestionIndex].selectedAnswer !== null) return; // already answered

    const isCorrect = answer === quizQuestions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setQuizScore((prev) => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }

    // Save answer
    setQuizQuestions((prev) => {
      const next = [...prev];
      next[currentQuestionIndex].selectedAnswer = answer;
      return next;
    });

    // Auto navigate or finish after slight delay
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      if (currentQuestionIndex + 1 < quizQuestions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setQuizFinished(true);
        recordActivity();
      }
    }, 1500);
  }, [currentQuestionIndex, quizQuestions, recordActivity]);

  // Reset mastered progress
  const resetProgress = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setMasteredIds([]);
    setStreak(0);
    AsyncStorage.removeItem(MASTERED_WORDS_KEY);
    AsyncStorage.removeItem(STREAK_KEY);
    AsyncStorage.removeItem(LAST_STUDY_KEY);
    alert("Vocabulary progress reset successfully!");
  }, []);

  // ─── DASHBOARD MODE ────────────────────────────────────────────────────────
  if (mode === "dashboard") {
    const totalVocab = QURAN_VOCABULARY.length;
    const progressPct = Math.round((masteredIds.length / totalVocab) * 100) || 0;

    return (
      <ScrollView contentContainerStyle={styles.dashboardContainer} showsVerticalScrollIndicator={false}>
        {/* Streak & Mastery Stats Widget */}
        <View style={[styles.statsCard, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={styles.statsHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="fire" size={24} color="#EA580C" />
              <Text style={[styles.streakText, { color: colors.onSurface }]}>{streak} Day Streak</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.brand + "18" }]}>
              <Text style={[styles.badgeText, { color: colors.brand }]}>Daily Active</Text>
            </View>
          </View>

          <Text style={[styles.dashboardSubText, { color: colors.onSurfaceMuted }]}>
            Study 5 minutes daily to unlock Quranic comprehension!
          </Text>

          {/* Progress bar */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.onSurface }}>Vocab Mastery</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.brand }}>
                {masteredIds.length} / {totalVocab} words ({progressPct}%)
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: colors.brand }]} />
            </View>
          </View>
        </View>

        {/* Primary Learning Mode Actions */}
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => {
              if (activeStudyList.length === 0) {
                alert("You have mastered all available words! Reset progress to start again.");
                return;
              }
              setSelectedTheme(null);
              setSelectedSurah(null);
              setCurrentCardIndex(0);
              setIsFlipped(false);
              setMode("flashcards");
            }}
            style={[styles.actionButton, { backgroundColor: colors.brand }]}
          >
            <MaterialCommunityIcons name="cards-playing-outline" size={24} color={colors.onBrandPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.onBrandPrimary }]}>Spaced Study</Text>
          </Pressable>

          <Pressable
            onPress={startQuiz}
            style={[styles.actionButton, { backgroundColor: colors.brandSecondary }]}
          >
            <MaterialCommunityIcons name="sword" size={24} color={colors.onBrandPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.onBrandPrimary }]}>Vocabulary Quiz</Text>
          </Pressable>
        </View>

        {/* Theme categories selection */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Study by Topic</Text>
        <View style={styles.themesContainer}>
          {Object.keys(THEME_LABELS).map((catKey) => {
            const meta = THEME_LABELS[catKey];
            const wordsCount = QURAN_VOCABULARY.filter((w) => w.category === catKey).length;
            const masteredCount = QURAN_VOCABULARY.filter((w) => w.category === catKey && masteredIds.includes(w.id)).length;
            return (
              <Pressable
                key={catKey}
                onPress={() => {
                  setSelectedTheme(catKey);
                  setSelectedSurah(null);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                  setMode("flashcards");
                }}
                style={({ pressed }) => [
                  styles.themeCard,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.themeIconCircle, { backgroundColor: meta.color + "20" }]}>
                  <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.themeTitleText, { color: colors.onSurface }]}>{meta.label}</Text>
                  <Text style={[styles.themeSubText, { color: colors.onSurfaceMuted }]}>
                    {masteredCount} of {wordsCount} mastered
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            );
          })}
        </View>

        {/* Study by Surah selection */}
        <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Study by Surah</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.surahChipsRow}>
          {[1, 2, 3, 24, 33, 48, 114].map((surahNum) => {
            const name = SURAH_LIST.find((s) => s.number === surahNum)?.englishName ?? `Surah ${surahNum}`;
            const count = QURAN_VOCABULARY.filter((w) => w.surahNum === surahNum).length;
            if (count === 0) return null;
            return (
              <Pressable
                key={surahNum}
                onPress={() => {
                  setSelectedSurah(surahNum);
                  setSelectedTheme(null);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                  setMode("flashcards");
                }}
                style={({ pressed }) => [
                  styles.surahChip,
                  { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: colors.brand }}>{name}</Text>
                <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>{count} words</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Reset progress btn */}
        <Pressable onPress={resetProgress} style={styles.resetBtn}>
          <Text style={{ color: colors.onSurfaceMuted, fontSize: 12, textDecorationLine: "underline" }}>
            Reset Vocabulary Progress
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ─── FLASHCARDS MODE ───────────────────────────────────────────────────────
  if (mode === "flashcards") {
    const word = activeStudyList[currentCardIndex];

    if (!word) {
      return (
        <View style={styles.centeredView}>
          <MaterialCommunityIcons name="check-decagram" size={64} color={colors.brand} />
          <Text style={[styles.mainText, { color: colors.onSurface }]}>All Mastered!</Text>
          <Text style={[styles.subText, { color: colors.onSurfaceMuted }]}>
            You have mastered all the words in this deck.
          </Text>
          <Pressable onPress={() => setMode("dashboard")} style={[styles.btn, { backgroundColor: colors.brand }]}>
            <Text style={{ color: "#FFF", fontWeight: "700" }}>Back to Dashboard</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.flashcardView}>
        {/* Header bar */}
        <View style={styles.modeHeader}>
          <Pressable onPress={() => setMode("dashboard")} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.modeTitle, { color: colors.onSurface }]}>
            {selectedTheme ? THEME_LABELS[selectedTheme]?.label : selectedSurah ? "Surah Vocab" : "Daily Spaced Deck"}
          </Text>
          <Text style={{ fontSize: 13, color: colors.onSurfaceMuted }}>
            {currentCardIndex + 1} / {activeStudyList.length}
          </Text>
        </View>

        {/* Thin progress bar */}
        <View style={{ height: 3, backgroundColor: colors.surfaceSecondary, width: "100%" }}>
          <View style={{ height: 3, backgroundColor: colors.brand, width: `${((currentCardIndex + 1) / activeStudyList.length) * 100}%` }} />
        </View>

        {/* Flashcard container */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setIsFlipped((f) => !f);
          }}
          style={({ pressed }) => [
            styles.flashcardContainer,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
            pressed && { transform: [{ scale: 0.99 }] },
          ]}
        >
          {!isFlipped ? (
            // Front of Card
            <View style={styles.cardSide}>
              <Text style={[styles.frequencyText, { color: colors.brand }]}>
                🔥 Appears {word.frequency} times
              </Text>
              <Text style={[styles.arabicMainWord, { color: colors.onSurface }]}>{word.arabic}</Text>
              <Text style={[styles.flipPrompt, { color: colors.onSurfaceMuted }]}>
                Tap to view translation & examples 💡
              </Text>
            </View>
          ) : (
            // Back of Card
            <ScrollView contentContainerStyle={styles.cardSideBack} showsVerticalScrollIndicator={false}>
              <Text style={[styles.frequencyText, { color: colors.brand }]}>
                Appears {word.frequency} times · Root: {word.root}
              </Text>
              <Text style={[styles.translationText, { color: colors.onSurface }]}>{word.english}</Text>

              {/* Context example */}
              <View style={[styles.exampleBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.exampleLabel, { color: colors.brand }]}>CONTEXT EXAMPLE</Text>
                <Text style={[styles.exampleArabic, { color: colors.onSurface }]}>{word.exampleVerse}</Text>
                <Text style={[styles.exampleTranslation, { color: colors.onSurfaceSecondary }]}>
                  {word.exampleTranslation}
                </Text>
                <Text style={[styles.exampleReference, { color: colors.onSurfaceMuted }]}>
                  Surah {word.surahNum}, Ayah {word.ayahNum}
                </Text>
              </View>
            </ScrollView>
          )}
        </Pressable>

        {/* Spaced repetition swiping buttons */}
        <View style={styles.cardActionsRow}>
          <Pressable
            onPress={() => handleCardFeedback(false)}
            style={[styles.feedbackBtn, { backgroundColor: colors.surfaceSecondary, borderColor: "#EF4444" }]}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={24} color="#EF4444" />
            <Text style={[styles.feedbackBtnTxt, { color: "#EF4444" }]}>Study Again</Text>
          </Pressable>
          <Pressable
            onPress={() => handleCardFeedback(true)}
            style={[styles.feedbackBtn, { backgroundColor: colors.brand }]}
          >
            <MaterialCommunityIcons name="check-circle" size={24} color={colors.onBrandPrimary} />
            <Text style={[styles.feedbackBtnTxt, { color: colors.onBrandPrimary }]}>Know It!</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── QUIZ MODE ─────────────────────────────────────────────────────────────
  if (mode === "quiz") {
    const question = quizQuestions[currentQuestionIndex];

    if (quizFinished) {
      const scorePct = Math.round((quizScore / quizQuestions.length) * 100) || 0;
      return (
        <View style={styles.centeredView}>
          <MaterialCommunityIcons name="trophy" size={72} color="#D97706" />
          <Text style={[styles.mainText, { color: colors.onSurface }]}>Quiz Completed!</Text>
          <Text style={[styles.scoreText, { color: colors.brand }]}>
            You scored {quizScore} of {quizQuestions.length} ({scorePct}%)
          </Text>
          <Text style={[styles.subText, { color: colors.onSurfaceMuted }]}>
            Spaced repetition logs updated. Keep up the streak!
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <Pressable onPress={() => setMode("dashboard")} style={[styles.btn, { backgroundColor: colors.surfaceSecondary }]}>
              <Text style={{ color: colors.onSurface, fontWeight: "700" }}>Dashboard</Text>
            </Pressable>
            <Pressable onPress={startQuiz} style={[styles.btn, { backgroundColor: colors.brand }]}>
              <Text style={{ color: "#FFF", fontWeight: "700" }}>Retry Quiz</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (!question) return null;

    return (
      <View style={styles.quizView}>
        {/* Header */}
        <View style={styles.modeHeader}>
          <Pressable onPress={() => setMode("dashboard")} hitSlop={10}>
            <MaterialCommunityIcons name="close" size={28} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.modeTitle, { color: colors.onSurface }]}>Vocabulary Quiz</Text>
          <Text style={{ fontSize: 13, color: colors.onSurfaceMuted }}>
            {currentQuestionIndex + 1} / {quizQuestions.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={{ height: 3, backgroundColor: colors.surfaceSecondary, width: "100%" }}>
          <View style={{ height: 3, backgroundColor: colors.brandSecondary, width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }} />
        </View>

        {/* Question Panel */}
        <View style={[styles.questionCard, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.questionLabel, { color: colors.brandSecondary }]}>WHAT IS THE MEANING OF THIS WORD?</Text>
          <Text style={[styles.arabicMainWord, { color: colors.onSurface, marginVertical: 24 }]}>
            {question.word.arabic}
          </Text>
          <Text style={[styles.questionSub, { color: colors.onSurfaceMuted }]}>
            Appears {question.word.frequency} times in the Quran
          </Text>
        </View>

        {/* Multi-choice Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((opt) => {
            const isSelected = question.selectedAnswer === opt;
            const isCorrect = opt === question.correctAnswer;
            const showFeedback = question.selectedAnswer !== null;

            let optBg = colors.surfaceSecondary;
            let optBorder = colors.border;
            let optTxt = colors.onSurface;

            if (showFeedback) {
              if (isCorrect) {
                optBg = "#D1FAE5";
                optBorder = "#10B981";
                optTxt = "#065F46";
              } else if (isSelected) {
                optBg = "#FEE2E2";
                optBorder = "#EF4444";
                optTxt = "#991B1B";
              }
            } else if (isSelected) {
              optBg = colors.brandSecondary + "22";
              optBorder = colors.brandSecondary;
            }

            return (
              <Pressable
                key={opt}
                onPress={() => submitAnswer(opt)}
                disabled={showFeedback}
                style={[styles.optionBtn, { backgroundColor: optBg, borderColor: optBorder }]}
              >
                <Text style={[styles.optionText, { color: optTxt }]}>{opt}</Text>
                {showFeedback && isCorrect && (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
                )}
                {showFeedback && isSelected && !isCorrect && (
                  <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return null;
}

const styles: any = StyleSheet.create({
  dashboardContainer: {
    padding: theme.spacing.lg,
    paddingBottom: 48,
    gap: 16,
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "800",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dashboardSubText: {
    fontSize: 12,
    lineHeight: 18,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  themesContainer: {
    gap: 8,
  },
  themeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  themeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  themeTitleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  themeSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  surahChipsRow: {
    gap: 8,
    paddingRight: 16,
  },
  surahChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },
  resetBtn: {
    alignItems: "center",
    marginTop: 24,
    padding: 12,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  mainText: {
    fontSize: 22,
    fontWeight: "800",
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "800",
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  flashcardView: {
    flex: 1,
  },
  modeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  flashcardContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardSide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  cardSideBack: {
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: "700",
  },
  arabicMainWord: {
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
  },
  flipPrompt: {
    fontSize: 12,
    marginTop: 24,
  },
  translationText: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  exampleBox: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 12,
  },
  exampleLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  exampleArabic: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
  },
  exampleTranslation: {
    fontSize: 13,
    lineHeight: 20,
  },
  exampleReference: {
    fontSize: 10,
    textAlign: "right",
  },
  cardActionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  feedbackBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  feedbackBtnTxt: {
    fontSize: 14,
    fontWeight: "700",
  },
  quizView: {
    flex: 1,
    paddingBottom: 24,
  },
  questionCard: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  questionSub: {
    fontSize: 12,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
