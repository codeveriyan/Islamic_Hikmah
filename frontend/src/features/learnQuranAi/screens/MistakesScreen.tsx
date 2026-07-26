import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import { useTheme } from "@/src/ThemeContext";

import { AiScreen, PrototypeNotice } from "../components";
import { aggregateMistakes, getAttempts } from "../storage";
import type { MistakeAggregate } from "../types";

export default function MistakesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [mistakes, setMistakes] = useState<MistakeAggregate[]>([]);

  useFocusEffect(
    useCallback(() => {
      getAttempts().then((attempts) => setMistakes(aggregateMistakes(attempts)));
    }, []),
  );

  return (
    <AiScreen title="Mistake log" subtitle="Words recommended for focused review">
      <PrototypeNotice text="Entries below come from ASR transcript mismatches. They help with word practice but are not Tajweed or makhraj judgements." />

      {mistakes.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.surfaceSecondary }]}>
          <MaterialCommunityIcons name="check-decagram-outline" size={38} color={colors.success} />
          <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>Nothing to review yet</Text>
          <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>
            Complete a recitation attempt and words marked orange or red will appear here.
          </Text>
        </View>
      ) : (
        mistakes.map((mistake, index) => {
          const statusColor = mistake.status === "incorrect" ? colors.error : colors.warning;
          return (
            <View
              key={mistake.key}
              style={[styles.mistake, { backgroundColor: colors.surfaceSecondary, borderColor: `${statusColor}55` }]}
            >
              <View style={[styles.rank, { backgroundColor: `${statusColor}1F` }]}>
                <Text style={[styles.rankText, { color: statusColor }]}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.arabic, { color: colors.onSurface }]}>{mistake.expectedText}</Text>
                <Text style={[styles.reference, { color: colors.onSurfaceMuted }]}>
                  Al-Fatihah {mistake.ayahId} · word {mistake.wordIndex + 1}
                </Text>
              </View>
              <View style={styles.countArea}>
                <Text style={[styles.count, { color: statusColor }]}>{mistake.count}×</Text>
                <Text style={[styles.countLabel, { color: colors.onSurfaceMuted }]}>flagged</Text>
              </View>
              <Pressable
                onPress={() => router.push("/quran/learn-ai/practice" as any)}
                style={[styles.practiceButton, { backgroundColor: colors.brand }]}
              >
                <MaterialCommunityIcons name="replay" size={18} color={colors.onBrandPrimary} />
              </Pressable>
            </View>
          );
        })
      )}
    </AiScreen>
  );
}

const styles = StyleSheet.create({
  empty: { borderRadius: 20, padding: 28, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptyText: { fontSize: 11, lineHeight: 17, textAlign: "center" },
  mistake: { borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  rank: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 12, fontWeight: "900" },
  arabic: { fontFamily: "ScheherazadeNew", fontSize: 23 },
  reference: { fontSize: 9, marginTop: 2 },
  countArea: { alignItems: "center" },
  count: { fontSize: 14, fontWeight: "900" },
  countLabel: { fontSize: 8 },
  practiceButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
});
