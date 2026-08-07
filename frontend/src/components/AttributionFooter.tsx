/**
 * AttributionFooter — Reusable footer component displaying content source attribution.
 *
 * Required by all three API platforms' terms of use:
 * - HadeethEnc: "Source: HadeethEnc.com"
 * - QuranEnc: "Source: QuranEnc.com"
 * - IslamHouse: "Source: IslamHouse.com"
 *
 * Also serves as a trust signal for users comparing the app to competitors.
 */

import React from "react";
import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";

type SourcePlatform = "hadeethenc" | "quranenc" | "islamhouse";

interface AttributionFooterProps {
  source: SourcePlatform;
  /** Optional: show as a more visible banner instead of subtle footer */
  prominent?: boolean;
}

const SOURCE_CONFIG: Record<SourcePlatform, { name: string; url: string; icon: string; description: string }> = {
  hadeethenc: {
    name: "HadeethEnc.com",
    url: "https://hadeethenc.com",
    icon: "book-open-page-variant-outline",
    description: "Encyclopedia of Translated Prophetic Hadiths",
  },
  quranenc: {
    name: "QuranEnc.com",
    url: "https://quranenc.com",
    icon: "book-open-variant",
    description: "Encyclopedia of the Noble Quran",
  },
  islamhouse: {
    name: "IslamHouse.com",
    url: "https://islamhouse.com",
    icon: "home-outline",
    description: "Islamic Educational Resources",
  },
};

export default function AttributionFooter({ source, prominent = false }: AttributionFooterProps) {
  const { colors } = useTheme();
  const config = SOURCE_CONFIG[source];

  const handlePress = () => {
    Linking.openURL(config.url).catch(() => {});
  };

  if (prominent) {
    return (
      <Pressable
        onPress={handlePress}
        style={[styles.prominentContainer, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
      >
        <MaterialCommunityIcons
          name={config.icon as any}
          size={18}
          color={colors.brand}
        />
        <View style={styles.prominentTextWrap}>
          <Text style={[styles.prominentName, { color: colors.onSurface }]}>
            Source: {config.name}
          </Text>
          <Text style={[styles.prominentDesc, { color: colors.onSurfaceMuted }]}>
            {config.description}
          </Text>
        </View>
        <MaterialCommunityIcons name="open-in-new" size={14} color={colors.onSurfaceMuted} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.subtleContainer} hitSlop={6}>
      <MaterialCommunityIcons
        name="shield-check-outline"
        size={12}
        color={colors.onSurfaceMuted}
      />
      <Text style={[styles.subtleText, { color: colors.onSurfaceMuted }]}>
        Source: {config.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Subtle footer (default)
  subtleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    opacity: 0.5,
  },
  subtleText: {
    fontSize: 10,
    fontWeight: "500",
  },

  // Prominent banner
  prominentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  prominentTextWrap: {
    flex: 1,
  },
  prominentName: {
    fontSize: 12,
    fontWeight: "700",
  },
  prominentDesc: {
    fontSize: 10,
    marginTop: 1,
  },
});
