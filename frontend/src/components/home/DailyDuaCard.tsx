import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";

type DailyDuaCardProps = {
  dailyDua: {
    title: string;
    arabic: string;
    translation: string;
    transliteration?: string;
    reference?: string;
  };
  onPlayAudio?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
};

export const DailyDuaCard = React.memo(function DailyDuaCard({
  dailyDua,
  onCopy,
  onShare,
}: DailyDuaCardProps) {
  const { colors, mode } = useTheme();

  return (
    <AnimatedCard
      style={[
        styles.card,
        {
          backgroundColor: mode === "dark" ? colors.surfaceSecondary : "#FFFFFF",
          borderColor: colors.border,
        },
      ]}
    >
      <LinearGradient
        colors={mode === "dark" ? ["#0B2D25", "#10251F"] : ["#F0FDF4", "#DCFCE7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={colors.brand} />
          <Text style={[styles.badgeText, { color: colors.brand }]}>DAILY DU'A</Text>
        </View>
        <View style={styles.actions}>
          {onCopy && (
            <Pressable onPress={onCopy} hitSlop={8}>
              <MaterialCommunityIcons name="content-copy" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
          )}
          {onShare && (
            <Pressable onPress={onShare} hitSlop={8}>
              <MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <Text style={[styles.title, { color: colors.onSurface }]}>{dailyDua.title}</Text>
      <Text style={[styles.arabic, { color: colors.brand }]}>{dailyDua.arabic}</Text>
      {dailyDua.transliteration ? (
        <Text style={[styles.translit, { color: colors.onSurfaceMuted }]}>
          {dailyDua.transliteration}
        </Text>
      ) : null}
      <Text style={[styles.translation, { color: colors.onSurfaceSecondary }]}>
        {dailyDua.translation}
      </Text>
      {dailyDua.reference ? (
        <Text style={[styles.reference, { color: colors.onSurfaceMuted }]}>
          {dailyDua.reference}
        </Text>
      ) : null}
    </AnimatedCard>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,168,132,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  arabic: {
    fontSize: 22,
    textAlign: "right",
    lineHeight: 38,
    fontFamily: "NotoNaskhArabic",
    marginBottom: 8,
  },
  translit: {
    fontSize: 13,
    fontStyle: "italic",
    marginBottom: 6,
  },
  translation: {
    fontSize: 14,
    lineHeight: 22,
  },
  reference: {
    fontSize: 12,
    marginTop: 8,
  },
});
