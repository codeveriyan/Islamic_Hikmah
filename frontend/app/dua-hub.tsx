import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { CATEGORIES } from "@/src/data/duas";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

const CATEGORY_IMAGES: Record<string, any> = {
  ummah: require("@/assets/images/ummah_background.png"),
  morning: { uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80" },
  evening: { uri: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=500&auto=format&fit=crop&q=80" },
  sleep: { uri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&auto=format&fit=crop&q=80" },
  tahajjud: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  salah: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  "after-salah": { uri: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=500&auto=format&fit=crop&q=80" },
  istikharah: { uri: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=500&auto=format&fit=crop&q=80" },
  gatherings: { uri: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=80" },
  difficulties: { uri: "https://images.unsplash.com/photo-1428908728789-d2de25dbd4e2?w=500&auto=format&fit=crop&q=80" },
  iman: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
  hajj: { uri: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=500&auto=format&fit=crop&q=80" },
  travel: { uri: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=80" },
  money: { uri: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&auto=format&fit=crop&q=80" },
  social: { uri: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=500&auto=format&fit=crop&q=80" },
  marriage: { uri: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=500&auto=format&fit=crop&q=80" },
  death: { uri: "https://images.unsplash.com/photo-1453791052107-5c843da62d97?w=500&auto=format&fit=crop&q=80" },
  nature: { uri: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&auto=format&fit=crop&q=80" },
  ramadan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  ruqyah: { uri: "https://images.unsplash.com/photo-1552089123-2d26226fc2b7?w=500&auto=format&fit=crop&q=80" },
  "daily-life": { uri: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80" },
  adhan: { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" },
  wudu: { uri: "https://images.unsplash.com/photo-1548813730-e8f20cc74a4a?w=500&auto=format&fit=crop&q=80" },
  masjid: { uri: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80" },
  sickness: { uri: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80" },
  forgiveness: { uri: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=500&auto=format&fit=crop&q=80" },
};

export default function DuaHubScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const [group, setGroup] = useState<"main" | "other">("main");

  const categories = CATEGORIES.filter((c) => c.group === group);

  const handleCategoryPress = useCallback((id: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.push(`/dua/${id}` as any);
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>{t("duas") || "Du'as"}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Intro Hero banner */}
        <View style={[styles.heroCard, { backgroundColor: colors.surfaceSecondary }]}>
          <View style={[styles.heroIconWrap, { backgroundColor: "#06B6D422" }]}>
            <MaterialCommunityIcons name="hands-pray" size={32} color="#06B6D4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
              {t("duas") || "Du'as"}
            </Text>
            <Text style={[styles.heroSub, { color: colors.onSurfaceMuted }]}>
              Explore supplications and dhikr for your daily life
            </Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary }]}>
          {(["main", "other"] as const).map((g) => {
            const active = group === g;
            return (
              <Pressable
                key={g}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setGroup(g);
                }}
                style={[styles.segmentBtn, active && { backgroundColor: colors.brandSecondary }]}
              >
                <Text style={[styles.segmentText, { color: colors.onSurfaceMuted }, active && styles.segmentTextActive]}>
                  {g === "main" ? t("mainDuas") : t("otherDuas")}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Grid Categories */}
        <View style={styles.grid}>
          {categories.map((c) => {
            const imgSource = CATEGORY_IMAGES[c.id] || { uri: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=500&auto=format&fit=crop&q=80" };
            return (
              <Pressable
                key={c.id}
                onPress={() => handleCategoryPress(c.id)}
                style={({ pressed }) => [
                  styles.card,
                  { width: CARD_WIDTH },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }
                ]}
              >
                <ImageBackground source={imgSource} resizeMode="cover" style={styles.cardImage} imageStyle={{ borderRadius: theme.radius.lg }}>
                  <LinearGradient colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.7)"]} style={styles.cardScrim}>
                    <View style={styles.cardLabelContainer}>
                      <Text style={styles.cardTitle}>{t(c.id).toUpperCase()}</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxxl,
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  heroSub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  segment: {
    flexDirection: "row",
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    padding: 4,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    alignItems: "center",
  },
  segmentText: {
    fontWeight: "600",
    fontSize: 14,
  },
  segmentTextActive: {
    color: "#03201F",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  card: {
    height: 140,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  cardImage: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: theme.spacing.sm,
  },
  cardLabelContainer: {
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textAlign: "center",
  },
});
