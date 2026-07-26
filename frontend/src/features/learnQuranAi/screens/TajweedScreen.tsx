import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "@/src/ThemeContext";

import { AiScreen, PrototypeNotice } from "../components";
import { TAJWEED_LESSONS } from "../data";

export default function TajweedScreen() {
  const { colors } = useTheme();
  const [selectedId, setSelectedId] = useState(TAJWEED_LESSONS[0].id);

  return (
    <AiScreen title="Tajweed lessons" subtitle="Rule explanations and examples">
      <PrototypeNotice text="This is a content and interaction draft. A qualified Tajweed teacher must approve every definition, example, exception and audio recording before publication." />

      {TAJWEED_LESSONS.map((lesson) => {
        const selected = selectedId === lesson.id;
        return (
          <Pressable
            key={lesson.id}
            onPress={() => setSelectedId(lesson.id)}
            style={[
              styles.lesson,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: selected ? lesson.color : colors.border,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: `${lesson.color}20` }]}>
              <MaterialCommunityIcons name="book-open-variant" size={21} color={lesson.color} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.onSurface }]}>{lesson.title}</Text>
                <Text style={[styles.arabicTitle, { color: lesson.color }]}>{lesson.arabicTitle}</Text>
              </View>
              <Text style={[styles.summary, { color: colors.onSurfaceMuted }]}>{lesson.summary}</Text>
              {selected ? (
                <View style={[styles.example, { backgroundColor: colors.surfaceTertiary }]}>
                  <View>
                    <Text style={[styles.exampleLabel, { color: lesson.color }]}>EXAMPLE</Text>
                    <Text style={[styles.exampleArabic, { color: colors.onSurface }]}>{lesson.example}</Text>
                  </View>
                  <View style={[styles.audioPending, { borderColor: colors.border }]}>
                    <MaterialCommunityIcons name="volume-off" size={17} color={colors.onSurfaceMuted} />
                    <Text style={[styles.audioText, { color: colors.onSurfaceMuted }]}>Reviewed audio pending</Text>
                  </View>
                </View>
              ) : null}
            </View>
            <MaterialCommunityIcons
              name={selected ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        );
      })}
    </AiScreen>
  );
}

const styles = StyleSheet.create({
  lesson: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 11 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 15, fontWeight: "800" },
  arabicTitle: { fontFamily: "NotoNaskhArabic", fontSize: 17 },
  summary: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  example: { marginTop: 12, borderRadius: 14, padding: 12, gap: 10 },
  exampleLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  exampleArabic: { fontFamily: "ScheherazadeNew", fontSize: 29, marginTop: 3 },
  audioPending: { borderWidth: 1, borderRadius: 10, padding: 9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  audioText: { fontSize: 9, fontWeight: "700" },
});

