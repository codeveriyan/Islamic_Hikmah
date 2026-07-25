import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";

type QuickActionItem = {
  id: string;
  label: string;
  route: string;
  emoji?: string;
  image?: any;
  premium?: boolean;
};

type QuickActionsGridProps = {
  actions: QuickActionItem[];
  onActionPress: (action: QuickActionItem) => void;
};

export const QuickActionsGrid = React.memo(function QuickActionsGrid({
  actions,
  onActionPress,
}: QuickActionsGridProps) {
  const { colors, mode } = useTheme();

  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <AnimatedCard
          key={action.id}
          onPress={() => onActionPress(action)}
          style={[
            styles.actionCard,
            {
              backgroundColor: mode === "dark" ? colors.surfaceSecondary : "#FFFFFF",
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            {action.image ? (
              <Image source={action.image} style={styles.iconImage} resizeMode="contain" />
            ) : (
              <Text style={styles.emojiText}>{action.emoji}</Text>
            )}
            {action.premium && (
              <View style={styles.proBadge}>
                <MaterialCommunityIcons name="crown" size={10} color="#D4AF37" />
              </View>
            )}
          </View>
          <Text style={[styles.label, { color: colors.onSurface }]} numberOfLines={2}>
            {action.label}
          </Text>
        </AnimatedCard>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: "22%",
    aspectRatio: 0.95,
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    gap: 6,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  emojiText: {
    fontSize: 26,
  },
  proBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "rgba(212,175,55,0.18)",
    borderRadius: 6,
    padding: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },
});
