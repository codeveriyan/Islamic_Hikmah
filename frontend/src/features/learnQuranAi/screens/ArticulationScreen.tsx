import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useTheme } from "@/src/ThemeContext";

import { AiScreen, PrototypeNotice, SectionHeading } from "../components";
import { ARTICULATION_GUIDES } from "../data";

export default function ArticulationScreen() {
  const { colors } = useTheme();
  const [selectedLetter, setSelectedLetter] = useState(ARTICULATION_GUIDES[0].letter);
  const guide = ARTICULATION_GUIDES.find((item) => item.letter === selectedLetter) ?? ARTICULATION_GUIDES[0];

  return (
    <AiScreen title="Articulation lab" subtitle="Makhraj guide prototype">
      <PrototypeNotice text="Guidance text and future mouth/tongue illustrations must be reviewed by a qualified teacher. Automated makhraj scoring is not enabled." />

      <View style={styles.letters}>
        {ARTICULATION_GUIDES.map((item) => (
          <Pressable
            key={item.letter}
            onPress={() => setSelectedLetter(item.letter)}
            style={[
              styles.letterButton,
              {
                backgroundColor: item.letter === selectedLetter ? colors.brand : colors.surfaceSecondary,
                borderColor: item.letter === selectedLetter ? colors.brand : colors.border,
              },
            ]}
          >
            <Text style={[
              styles.letter,
              { color: item.letter === selectedLetter ? colors.onBrandPrimary : colors.onSurface },
            ]}>
              {item.letter}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.guideCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <View style={[styles.letterHero, { backgroundColor: `${colors.brand}1F` }]}>
          <Text style={[styles.heroLetter, { color: colors.brand }]}>{guide.letter}</Text>
        </View>
        <Text style={[styles.name, { color: colors.onSurface }]}>{guide.name}</Text>
        <View style={[styles.makhrajBadge, { backgroundColor: `${colors.brand}17` }]}>
          <MaterialCommunityIcons name="account-voice" size={17} color={colors.brand} />
          <Text style={[styles.makhraj, { color: colors.brand }]}>{guide.makhraj}</Text>
        </View>

        <SectionHeading>How to form the sound</SectionHeading>
        <Text style={[styles.body, { color: colors.onSurfaceSecondary }]}>{guide.guidance}</Text>

        <SectionHeading>Do not confuse it with</SectionHeading>
        <Text style={[styles.body, { color: colors.onSurfaceSecondary }]}>{guide.contrast}</Text>

        <View style={[styles.visualPending, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="gesture-tap" size={32} color={colors.onSurfaceMuted} />
          <Text style={[styles.pendingTitle, { color: colors.onSurface }]}>Articulation visual pending</Text>
          <Text style={[styles.pendingText, { color: colors.onSurfaceMuted }]}>
            A teacher-approved mouth and tongue illustration will appear here.
          </Text>
        </View>
      </View>
    </AiScreen>
  );
}

const styles = StyleSheet.create({
  letters: { flexDirection: "row", gap: 10 },
  letterButton: { flex: 1, height: 58, borderRadius: 17, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  letter: { fontFamily: "NotoNaskhArabic", fontSize: 29 },
  guideCard: { borderWidth: 1, borderRadius: 22, padding: 18, alignItems: "center", gap: 12 },
  letterHero: { width: 100, height: 100, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  heroLetter: { fontFamily: "NotoNaskhArabic", fontSize: 58 },
  name: { fontSize: 21, fontWeight: "900" },
  makhrajBadge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, flexDirection: "row", alignItems: "center", gap: 6 },
  makhraj: { fontSize: 10, fontWeight: "800" },
  body: { fontSize: 13, lineHeight: 20, alignSelf: "stretch" },
  visualPending: { borderWidth: 1, borderStyle: "dashed", borderRadius: 18, padding: 24, alignSelf: "stretch", alignItems: "center", gap: 6, marginTop: 4 },
  pendingTitle: { fontSize: 13, fontWeight: "800" },
  pendingText: { fontSize: 10, lineHeight: 15, textAlign: "center" },
});

