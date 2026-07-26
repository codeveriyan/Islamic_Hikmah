import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { useTheme } from "@/src/ThemeContext";

import { AiScreen, ProgressBar, PrototypeNotice, SectionHeading } from "../components";
import { getAttempts, getLearningSnapshot } from "../storage";
import type { LearningSnapshot, StoredAttempt } from "../types";

const EMPTY: LearningSnapshot = {
  attempts: 0,
  averageScore: 0,
  practicedAyahs: 0,
  completedQaidaLessons: 0,
  totalQaidaLessons: 3,
  wordsNeedingPractice: 0,
};

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
}

export default function ProgressScreen() {
  const { colors } = useTheme();
  const [snapshot, setSnapshot] = useState(EMPTY);
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getLearningSnapshot(), getAttempts()]).then(([nextSnapshot, nextAttempts]) => {
        setSnapshot(nextSnapshot);
        setAttempts(nextAttempts);
      });
    }, []),
  );

  const qaidaPercentage = Math.round(
    snapshot.completedQaidaLessons / Math.max(1, snapshot.totalQaidaLessons) * 100,
  );

  return (
    <AiScreen title="Progress insights" subtitle="ASR attempts stored on this device">
      <PrototypeNotice text="These insights use ASR word-match attempts on this device. They are not Tajweed mastery scores; cross-device server sync is still pending." />

      <View style={styles.statsGrid}>
        {[
          { icon: "microphone", value: snapshot.attempts, label: "Attempts", color: "#10B981" },
          { icon: "chart-line", value: snapshot.averageScore ? `${snapshot.averageScore}%` : "—", label: "Average", color: "#8B5CF6" },
          { icon: "book-open-page-variant", value: snapshot.practicedAyahs, label: "Ayahs", color: "#0EA5E9" },
          { icon: "alert-decagram-outline", value: snapshot.wordsNeedingPractice, label: "Review", color: "#F97316" },
        ].map((stat) => (
          <View key={stat.label} style={[styles.stat, { backgroundColor: colors.surfaceSecondary }]}>
            <MaterialCommunityIcons name={stat.icon as any} size={21} color={stat.color} />
            <Text style={[styles.statValue, { color: colors.onSurface }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.onSurfaceMuted }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.progressCard, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={[styles.progressTitle, { color: colors.onSurface }]}>Qaida foundation</Text>
            <Text style={[styles.progressSub, { color: colors.onSurfaceMuted }]}>Pilot lessons completed</Text>
          </View>
          <Text style={[styles.progressValue, { color: colors.brand }]}>{qaidaPercentage}%</Text>
        </View>
        <ProgressBar value={qaidaPercentage} />
      </View>

      <SectionHeading>Recent practice</SectionHeading>
      {attempts.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surfaceSecondary }]}>
          <MaterialCommunityIcons name="chart-box-outline" size={34} color={colors.onSurfaceMuted} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>No practice yet</Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
            Record an ayah in the Recitation Coach to populate this timeline.
          </Text>
        </View>
      ) : (
        attempts.slice(0, 12).map((attempt) => (
          <View key={attempt.attemptId} style={[styles.attempt, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[
              styles.scoreCircle,
              { backgroundColor: attempt.overallScore >= 80 ? `${colors.success}1F` : `${colors.warning}1F` },
            ]}>
              <Text style={{
                color: attempt.overallScore >= 80 ? colors.success : colors.warning,
                fontWeight: "900",
              }}>
                {attempt.overallScore}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.attemptTitle, { color: colors.onSurface }]}>
                Al-Fatihah · Ayah {attempt.ayahId}
              </Text>
              <Text style={[styles.attemptSub, { color: colors.onSurfaceMuted }]}>
                {attempt.practiceMode === "word" ? "Focused word retry" : "Full ayah"} · {formatDate(attempt.createdAt)}
              </Text>
            </View>
            <View style={[styles.sourceBadge, { backgroundColor: `${colors.warning}1A` }]}>
              <Text style={[styles.sourceText, { color: colors.warning }]}>{attempt.source}</Text>
            </View>
          </View>
        ))
      )}
    </AiScreen>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "48%", flexGrow: 1, borderRadius: 17, padding: 14, gap: 5 },
  statValue: { fontSize: 23, fontWeight: "900" },
  statLabel: { fontSize: 10, fontWeight: "700" },
  progressCard: { borderRadius: 18, padding: 16, gap: 13 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressTitle: { fontSize: 15, fontWeight: "800" },
  progressSub: { fontSize: 10, marginTop: 3 },
  progressValue: { fontSize: 22, fontWeight: "900" },
  empty: { borderRadius: 18, padding: 24, alignItems: "center", gap: 7 },
  emptyTitle: { fontSize: 15, fontWeight: "800" },
  emptyText: { fontSize: 11, lineHeight: 17, textAlign: "center" },
  attempt: { borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  scoreCircle: { width: 43, height: 43, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  attemptTitle: { fontSize: 13, fontWeight: "800" },
  attemptSub: { fontSize: 10, marginTop: 3 },
  sourceBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  sourceText: { fontSize: 8, fontWeight: "900", textTransform: "uppercase" },
});
