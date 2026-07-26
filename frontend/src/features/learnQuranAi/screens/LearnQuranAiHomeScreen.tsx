import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { useAuth } from "@/src/AuthContext";
import { useTheme } from "@/src/ThemeContext";

import {
  AiScreen,
  FeatureCard,
  ProgressBar,
  PrototypeNotice,
  SectionHeading,
} from "../components";
import { LEARNER_LEVELS } from "../data";
import {
  getLearnerLevel,
  getLearningSnapshot,
  saveLearnerLevel,
} from "../storage";
import type { LearnerLevel, LearningSnapshot } from "../types";

const EMPTY_SNAPSHOT: LearningSnapshot = {
  attempts: 0,
  averageScore: 0,
  practicedAyahs: 0,
  completedQaidaLessons: 0,
  totalQaidaLessons: 3,
  wordsNeedingPractice: 0,
};

export default function LearnQuranAiHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, isGuest } = useAuth();
  const [snapshot, setSnapshot] = useState(EMPTY_SNAPSHOT);
  const [level, setLevel] = useState<LearnerLevel | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getLearningSnapshot(), getLearnerLevel()]).then(([nextSnapshot, nextLevel]) => {
        setSnapshot(nextSnapshot);
        setLevel(nextLevel);
      });
    }, []),
  );

  const chooseLevel = async (nextLevel: LearnerLevel) => {
    setLevel(nextLevel);
    await saveLearnerLevel(nextLevel);
  };

  const qaidaProgress = snapshot.totalQaidaLessons
    ? Math.round(snapshot.completedQaidaLessons / snapshot.totalQaidaLessons * 100)
    : 0;

  return (
    <AiScreen title="Learn Quran through AI" subtitle="Guided Qaida and recitation practice">
      <View style={[styles.hero, { backgroundColor: colors.brandSecondary }]}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="creation" size={26} color="#FFFFFF" />
        </View>
        <Text style={styles.heroEyebrow}>YOUR LEARNING PATH</Text>
        <Text style={styles.heroTitle}>
          Assalamu alaikum{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}
        </Text>
        <Text style={styles.heroText}>
          Continue with short, focused lessons and review the words that need the most practice.
        </Text>
        <Pressable
          onPress={() => router.push("/quran/learn-ai/practice" as any)}
          style={styles.continueButton}
        >
          <MaterialCommunityIcons name="microphone" size={19} color={colors.brandSecondary} />
          <Text style={[styles.continueText, { color: colors.brandSecondary }]}>Start recitation practice</Text>
        </Pressable>
      </View>

      <PrototypeNotice
        text="The recording and upload flow is ready for testing. Scoring now fails closed—no score or mistake is created until a Quran-recitation model passes the accuracy benchmark."
      />

      {isGuest ? (
        <View style={[styles.guestBanner, { backgroundColor: `${colors.warning}16` }]}>
          <MaterialCommunityIcons name="account-alert-outline" size={21} color={colors.warning} />
          <Text style={[styles.guestText, { color: colors.onSurfaceSecondary }]}>
            Guest progress stays on this device. Sign in later to enable protected server scoring and cross-device sync.
          </Text>
        </View>
      ) : null}

      {!level ? (
        <>
          <SectionHeading>Choose your starting level</SectionHeading>
          <Text style={[styles.supporting, { color: colors.onSurfaceMuted }]}>
            This can be changed later and helps us order your practice.
          </Text>
          {LEARNER_LEVELS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => chooseLevel(item.id)}
              style={[styles.levelRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
            >
              <View style={[styles.levelDot, { borderColor: colors.brand }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.levelTitle, { color: colors.onSurface }]}>{item.title}</Text>
                <Text style={[styles.levelSubtitle, { color: colors.onSurfaceMuted }]}>{item.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </>
      ) : (
        <View style={[styles.levelSelected, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.levelLabel, { color: colors.brand }]}>CURRENT LEVEL</Text>
            <Text style={[styles.levelTitle, { color: colors.onSurface }]}>
              {LEARNER_LEVELS.find((item) => item.id === level)?.title}
            </Text>
          </View>
          <Pressable onPress={() => setLevel(null)}>
            <Text style={[styles.changeText, { color: colors.brand }]}>Change</Text>
          </Pressable>
        </View>
      )}

      <SectionHeading>Your progress</SectionHeading>
      <View style={styles.statsRow}>
        {[
          { value: snapshot.averageScore ? `${snapshot.averageScore}%` : "—", label: "Accuracy" },
          { value: String(snapshot.practicedAyahs), label: "Ayahs" },
          { value: String(snapshot.wordsNeedingPractice), label: "Review" },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.statValue, { color: colors.brand }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.qaidaProgress, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.onSurface }]}>Qaida foundation</Text>
          <Text style={[styles.progressValue, { color: colors.brand }]}>
            {snapshot.completedQaidaLessons}/{snapshot.totalQaidaLessons}
          </Text>
        </View>
        <ProgressBar value={qaidaProgress} />
      </View>

      <SectionHeading>Learning tools</SectionHeading>
      <FeatureCard
        icon="book-education-outline"
        title="Interactive Qaida"
        subtitle="Letters, vowel marks and joined forms in a guided path."
        color="#0EA5E9"
        badge="Pilot"
        onPress={() => router.push("/quran/learn-ai/qaida" as any)}
      />
      <FeatureCard
        icon="microphone-message"
        title="AI Recitation Coach"
        subtitle="Record Al-Fatihah and receive Quran ASR word matching."
        color="#10B981"
        badge="ASR pilot"
        onPress={() => router.push("/quran/learn-ai/practice" as any)}
      />
      <FeatureCard
        icon="chart-timeline-variant-shimmer"
        title="Progress insights"
        subtitle="See attempts, accuracy, completed lessons and practice activity."
        color="#8B5CF6"
        onPress={() => router.push("/quran/learn-ai/progress" as any)}
      />
      <FeatureCard
        icon="alert-decagram-outline"
        title="Mistake log"
        subtitle="Review the words most often marked for improvement."
        color="#F97316"
        onPress={() => router.push("/quran/learn-ai/mistakes" as any)}
      />
      <FeatureCard
        icon="book-open-variant"
        title="Tajweed lessons"
        subtitle="Study rules with simple explanations and Quranic examples."
        color="#EC4899"
        badge="Draft"
        onPress={() => router.push("/quran/learn-ai/tajweed" as any)}
      />
      <FeatureCard
        icon="account-voice"
        title="Articulation lab"
        subtitle="Learn where difficult Arabic letters are formed."
        color="#14B8A6"
        badge="Draft"
        onPress={() => router.push("/quran/learn-ai/articulation" as any)}
      />
    </AiScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 20, minHeight: 230 },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroEyebrow: { color: "rgba(255,255,255,0.72)", fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  heroTitle: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", marginTop: 7 },
  heroText: { color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 19, marginTop: 8 },
  continueButton: {
    alignSelf: "flex-start",
    marginTop: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  continueText: { fontSize: 12, fontWeight: "900" },
  guestBanner: { borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 9 },
  guestText: { flex: 1, fontSize: 12, lineHeight: 18 },
  supporting: { fontSize: 12, marginTop: -8 },
  levelRow: { borderWidth: 1, borderRadius: 15, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  levelDot: { width: 18, height: 18, borderWidth: 2, borderRadius: 9 },
  levelTitle: { fontSize: 14, fontWeight: "800" },
  levelSubtitle: { fontSize: 11, marginTop: 3 },
  levelSelected: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center" },
  levelLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1, marginBottom: 4 },
  changeText: { fontSize: 12, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 9 },
  statCard: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "700", marginTop: 3 },
  qaidaProgress: { borderRadius: 16, padding: 14, gap: 10 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between" },
  progressTitle: { fontSize: 13, fontWeight: "800" },
  progressValue: { fontSize: 12, fontWeight: "900" },
});
