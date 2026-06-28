import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { theme } from "@/src/theme";
import { EMOTIONS } from "@/src/data/emotions";
import { CATEGORIES } from "@/src/data/duas";

export default function EmotionsScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();
  const cur = EMOTIONS.find((e) => e.id === selected);
  const allDuas = CATEGORIES.flatMap((c) => c.duas.map((d) => ({ ...d, categoryId: c.id })));
  const suggestions = cur ? allDuas.filter((d) => cur.duaIds.includes(d.id)) : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>How do you feel?</Text>
        <Text style={styles.subtitle}>Find Du'as for your heart's state</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 32 }}>
        <View style={styles.grid}>
          {EMOTIONS.map((e) => {
            const active = selected === e.id;
            return (
              <Pressable
                key={e.id}
                onPress={() => setSelected(e.id)}
                style={({ pressed }) => [
                  styles.tile,
                  pressed && { opacity: 0.85 },
                ]}
                testID={`emotion-${e.id}`}
              >
                <LinearGradient
                  colors={e.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.tileGrad, active && { borderWidth: 2, borderColor: "#fff" }]}
                >
                  <Text style={styles.emoji}>{e.emoji}</Text>
                  <Text style={styles.label}>{e.label}</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {cur ? (
          <View style={styles.sugg}>
            <Text style={styles.suggTitle}>Suggested Du'as</Text>
            <Text style={styles.suggSub}>{cur.description}</Text>
            {suggestions.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => router.push(`/dua/${d.categoryId}` as any)}
                style={styles.suggCard}
                testID={`suggestion-${d.id}`}
              >
                <Text style={styles.suggCardTitle}>{d.title}</Text>
                <Text style={styles.suggArabic} numberOfLines={2}>{d.arabic}</Text>
                <Text style={styles.suggTrans} numberOfLines={2}>{d.translation}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md },
  title: { color: theme.colors.onSurface, fontSize: 26, fontWeight: "700" },
  subtitle: { color: theme.colors.onSurfaceMuted, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.md },
  tile: { width: "47%", aspectRatio: 1, borderRadius: theme.radius.lg, overflow: "hidden" },
  tileGrad: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: theme.radius.lg },
  emoji: { fontSize: 40 },
  label: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 8 },
  sugg: { marginTop: theme.spacing.xl },
  suggTitle: { color: theme.colors.onSurface, fontSize: 18, fontWeight: "700" },
  suggSub: { color: theme.colors.onSurfaceMuted, marginTop: 4, marginBottom: theme.spacing.md },
  suggCard: { backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: theme.spacing.md },
  suggCardTitle: { color: theme.colors.brand, fontSize: 13, fontWeight: "700" },
  suggArabic: { color: theme.colors.onSurface, fontFamily: "Amiri", fontSize: 20, textAlign: "right", marginTop: 10, lineHeight: 32 },
  suggTrans: { color: theme.colors.onSurfaceMuted, marginTop: 8, fontSize: 13, lineHeight: 18 },
});
