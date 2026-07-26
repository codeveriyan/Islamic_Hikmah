import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/src/ThemeContext";

export function AiScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.onSurfaceMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function FeatureCard({
  icon,
  title,
  subtitle,
  color,
  onPress,
  badge,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  badge?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${color}1F` }]}>
        <MaterialCommunityIcons name={icon as any} size={25} color={color} />
      </View>
      <View style={styles.cardText}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.onSurface }]}>{title}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: `${color}1F` }]}>
              <Text style={[styles.badgeText, { color }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.onSurfaceMuted }]}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
    </Pressable>
  );
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const { colors } = useTheme();
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${bounded}%`, backgroundColor: color || colors.brand },
        ]}
      />
    </View>
  );
}

export function PrototypeNotice({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: `${colors.warning}16`, borderColor: `${colors.warning}55` }]}>
      <MaterialCommunityIcons name="flask-outline" size={20} color={colors.warning} />
      <Text style={[styles.noticeText, { color: colors.onSurfaceSecondary }]}>{text}</Text>
    </View>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 48, gap: 14 },
  card: {
    minHeight: 90,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: { flex: 1, gap: 5 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSubtitle: { fontSize: 12, lineHeight: 17 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  progressTrack: { height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  notice: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  sectionHeading: { fontSize: 17, fontWeight: "800", marginTop: 6 },
});

