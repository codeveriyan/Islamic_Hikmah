import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";

type HeroPrayerCardProps = {
  nextPrayer: { name: string; timeStr: string } | null;
  countdown: string;
  city?: string;
  progress: number;
  onPress: () => void;
};

export const HeroPrayerCard = React.memo(function HeroPrayerCard({
  nextPrayer,
  countdown,
  city,
  progress,
  onPress,
}: HeroPrayerCardProps) {
  const { colors, mode } = useTheme();

  if (!nextPrayer) return null;

  return (
    <AnimatedCard onPress={onPress} style={styles.card}>
      <LinearGradient
        colors={mode === "dark" ? ["#0B2D25", "#10251F", "#1E3528"] : ["#1B5E20", "#2E7D32"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.nextBadge}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#A7F3D0" />
            <Text style={styles.nextText}>NEXT PRAYER</Text>
          </View>
          {city ? (
            <View style={styles.locationWrap}>
              <MaterialCommunityIcons name="map-marker-outline" size={13} color="rgba(255,255,255,0.7)" />
              <Text style={styles.cityText}>{city}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.prayerInfo}>
          <Text style={styles.prayerName}>{nextPrayer.name}</Text>
          <Text style={styles.prayerTime}>{nextPrayer.timeStr}</Text>
        </View>

        <View style={styles.countdownRow}>
          <Text style={styles.countdownValue}>{countdown}</Text>
          <Text style={styles.countdownLabel}>remaining</Text>
        </View>

        {/* Progress track */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
        </View>
      </View>
    </AnimatedCard>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  nextBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nextText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A7F3D0",
    letterSpacing: 0.8,
  },
  locationWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cityText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  prayerInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  prayerName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Outfit_600SemiBold",
  },
  prayerTime: {
    fontSize: 22,
    fontWeight: "700",
    color: "#A7F3D0",
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 14,
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  countdownLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34D399",
    borderRadius: 2,
  },
});
