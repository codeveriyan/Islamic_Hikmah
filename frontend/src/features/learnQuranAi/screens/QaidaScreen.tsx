import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "@/src/ThemeContext";

import { AiScreen, ProgressBar, PrototypeNotice } from "../components";
import { QAIDA_LESSONS } from "../data";
import { getCompletedQaidaLessons, markQaidaLessonComplete } from "../storage";

export default function QaidaScreen() {
  const { colors } = useTheme();
  const [completed, setCompleted] = useState<string[]>([]);
  const [openLessonId, setOpenLessonId] = useState<string | null>(QAIDA_LESSONS[0]?.id ?? null);

  useEffect(() => {
    getCompletedQaidaLessons().then(setCompleted);
  }, []);

  const completeLesson = async (lessonId: string) => {
    setCompleted(await markQaidaLessonComplete(lessonId));
  };

  const percentage = Math.round(completed.length / QAIDA_LESSONS.length * 100);

  return (
    <AiScreen title="Interactive Qaida" subtitle="Foundation course pilot">
      <PrototypeNotice text="These prototype lessons demonstrate the learning flow. Curriculum order, wording and teacher audio require qualified Quran-teacher review before release." />

      <View style={[styles.summary, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={[styles.summaryTitle, { color: colors.onSurface }]}>Foundation progress</Text>
            <Text style={[styles.summarySub, { color: colors.onSurfaceMuted }]}>
              {completed.length} of {QAIDA_LESSONS.length} pilot lessons
            </Text>
          </View>
          <Text style={[styles.percentage, { color: colors.brand }]}>{percentage}%</Text>
        </View>
        <ProgressBar value={percentage} />
      </View>

      {QAIDA_LESSONS.map((lesson) => {
        const isOpen = lesson.id === openLessonId;
        const isComplete = completed.includes(lesson.id);
        return (
          <View
            key={lesson.id}
            style={[styles.lesson, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <Pressable
              onPress={() => setOpenLessonId(isOpen ? null : lesson.id)}
              style={styles.lessonHeader}
            >
              <View style={[
                styles.orderCircle,
                { backgroundColor: isComplete ? colors.success : `${colors.brand}1F` },
              ]}>
                {isComplete ? (
                  <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.orderText, { color: colors.brand }]}>{lesson.order}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lessonTitle, { color: colors.onSurface }]}>{lesson.title}</Text>
                <Text style={[styles.lessonSub, { color: colors.onSurfaceMuted }]}>{lesson.subtitle}</Text>
              </View>
              <MaterialCommunityIcons
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={22}
                color={colors.onSurfaceMuted}
              />
            </Pressable>

            {isOpen ? (
              <View style={[styles.lessonBody, { borderTopColor: colors.border }]}>
                <Text style={[styles.objectiveLabel, { color: colors.brand }]}>LEARNING OBJECTIVE</Text>
                <Text style={[styles.objective, { color: colors.onSurfaceSecondary }]}>{lesson.objective}</Text>
                <View style={styles.examples}>
                  {lesson.examples.map((example) => (
                    <View key={example} style={[styles.example, { backgroundColor: colors.surfaceTertiary }]}>
                      <Text style={[styles.exampleText, { color: colors.onSurface }]}>{example}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.lessonMeta}>
                  <Text style={[styles.metaText, { color: colors.onSurfaceMuted }]}>
                    {lesson.estimatedMinutes} min
                  </Text>
                  <View style={[styles.reviewBadge, { backgroundColor: `${colors.warning}1F` }]}>
                    <Text style={[styles.reviewText, { color: colors.warning }]}>TEACHER REVIEW PENDING</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <View style={[styles.audioPending, { borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="volume-off" size={18} color={colors.onSurfaceMuted} />
                    <Text style={[styles.audioPendingText, { color: colors.onSurfaceMuted }]}>Reviewed audio pending</Text>
                  </View>
                  <Pressable
                    disabled={isComplete}
                    onPress={() => completeLesson(lesson.id)}
                    style={[
                      styles.completeButton,
                      { backgroundColor: isComplete ? colors.surfaceTertiary : colors.brand },
                    ]}
                  >
                    <Text style={[
                      styles.completeText,
                      { color: isComplete ? colors.onSurfaceMuted : colors.onBrandPrimary },
                    ]}>
                      {isComplete ? "Completed" : "Mark pilot complete"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </AiScreen>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 18, padding: 16, gap: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryTitle: { fontSize: 15, fontWeight: "800" },
  summarySub: { fontSize: 11, marginTop: 3 },
  percentage: { fontSize: 22, fontWeight: "900" },
  lesson: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  lessonHeader: { padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  orderCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  orderText: { fontSize: 14, fontWeight: "900" },
  lessonTitle: { fontSize: 15, fontWeight: "800" },
  lessonSub: { fontSize: 11, marginTop: 3 },
  lessonBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  objectiveLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  objective: { fontSize: 13, lineHeight: 19 },
  examples: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  example: { minWidth: 66, minHeight: 66, borderRadius: 16, padding: 10, alignItems: "center", justifyContent: "center" },
  exampleText: { fontFamily: "NotoNaskhArabic", fontSize: 28 },
  lessonMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaText: { fontSize: 11, fontWeight: "700" },
  reviewBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  reviewText: { fontSize: 8, fontWeight: "900" },
  actions: { gap: 8 },
  audioPending: { borderWidth: 1, borderRadius: 12, padding: 11, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  audioPendingText: { fontSize: 11, fontWeight: "700" },
  completeButton: { borderRadius: 12, padding: 12, alignItems: "center" },
  completeText: { fontSize: 12, fontWeight: "900" },
});

