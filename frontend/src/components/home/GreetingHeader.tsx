import React from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";

type GreetingHeaderProps = {
  profile: any;
  hijriDate?: string;
  arabicGreeting: { arabic: string; english: string };
  greetingGrad: [string, string];
  onMenuPress: () => void;
  onSearchPress: () => void;
  onProfilePress: () => void;
  onSettingsPress: () => void;
  onHijriPress: () => void;
};

export const GreetingHeader = React.memo(function GreetingHeader({
  profile,
  hijriDate,
  arabicGreeting,
  greetingGrad,
  onMenuPress,
  onSearchPress,
  onProfilePress,
  onSettingsPress,
  onHijriPress,
}: GreetingHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={onMenuPress} hitSlop={10} style={styles.iconBtn}>
          <MaterialCommunityIcons name="menu" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.brand }]}>Islamic Hikmah</Text>
          {hijriDate ? (
            <Pressable onPress={onHijriPress} hitSlop={6}>
              <Text style={[styles.hijriDate, { color: colors.onSurfaceMuted }]}>
                {hijriDate}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.rightIcons}>
          <Pressable onPress={onSearchPress} hitSlop={10}>
            <MaterialCommunityIcons name="magnify" size={26} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={onProfilePress} hitSlop={10} style={styles.avatarWrap}>
            {profile?.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.avatarImg} />
            ) : (
              <MaterialCommunityIcons name="account-circle-outline" size={26} color={colors.onSurface} />
            )}
          </Pressable>
          <Pressable onPress={onSettingsPress} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={26} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      {/* Greeting Banner */}
      <View style={styles.greetingBanner}>
        <LinearGradient
          colors={greetingGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.greetingContent}>
          <Text style={styles.arabicTxt}>{arabicGreeting.arabic}</Text>
          <Text style={styles.englishTxt}>{arabicGreeting.english}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Outfit_600SemiBold",
  },
  hijriDate: {
    fontSize: 12,
    marginTop: 2,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  greetingBanner: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    overflow: "hidden",
  },
  greetingContent: {
    alignItems: "center",
  },
  arabicTxt: {
    fontSize: 22,
    color: "#FFFFFF",
    fontFamily: "NotoNaskhArabic",
    marginBottom: 4,
  },
  englishTxt: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
  },
});
