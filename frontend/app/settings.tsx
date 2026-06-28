import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";

const ROWS = [
  { id: "quran", label: "The Quran", icon: "book-open-variant", route: "/quran" },
  { id: "dhikr", label: "Tasbih Counter", icon: "circle-double", route: "/dhikr" },
  { id: "prayer", label: "Prayer Times", icon: "clock-time-eight", route: "/prayer-times" },
  { id: "qibla", label: "Qibla Direction", icon: "compass", route: "/qibla" },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="settings-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Menu</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text style={styles.section}>Quick Access</Text>
        {ROWS.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push(r.route as any)}
            style={styles.row}
            testID={`settings-${r.id}`}
          >
            <MaterialCommunityIcons name={r.icon as any} size={22} color={theme.colors.brand} />
            <Text style={styles.rowLabel}>{r.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.onSurfaceMuted} />
          </Pressable>
        ))}

        <Text style={[styles.section, { marginTop: theme.spacing.xl }]}>About</Text>
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>Ruhani</Text>
          <Text style={styles.aboutTxt}>
            A spiritual companion for daily Du'as, Dhikr, Quran, and prayer.
          </Text>
          <Text style={styles.aboutVer}>v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { color: theme.colors.onSurface, fontSize: 20, fontWeight: "700" },
  section: { color: theme.colors.onSurfaceMuted, textTransform: "uppercase", fontSize: 12, letterSpacing: 1, fontWeight: "700", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg },
  rowLabel: { flex: 1, color: theme.colors.onSurface, fontSize: 15, fontWeight: "600" },
  about: { backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg },
  aboutTitle: { color: theme.colors.brand, fontSize: 18, fontWeight: "800" },
  aboutTxt: { color: theme.colors.onSurfaceSecondary, marginTop: 8, lineHeight: 21 },
  aboutVer: { color: theme.colors.onSurfaceMuted, marginTop: 12, fontSize: 12 },
});
