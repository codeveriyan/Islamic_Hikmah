import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Dimensions, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { CATEGORIES } from "@/src/data/duas";
import { AnimatedPressable } from "@/src/components/AnimatedPressable";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

// The category data already carries a semantic icon and a two-colour theme.
// Rendering those together keeps every card relevant without depending on
// unrelated stock photography or unlicensed third-party artwork.
const FALLBACK_ICON = "view-grid-outline" as const;
const CATEGORY_IMAGES: Record<string, number> = {
  morning: require("@/assets/images/dua-categories/morning.webp"),
  evening: require("@/assets/images/dua-categories/evening.webp"),
  sleep: require("@/assets/images/dua-categories/sleep.webp"),
  tahajjud: require("@/assets/images/dua-categories/tahajjud.webp"),
  salah: require("@/assets/images/dua-categories/salah.webp"),
  "after-salah": require("@/assets/images/dua-categories/after-salah.webp"),
  ruqyah: require("@/assets/images/dua-categories/ruqyah.webp"),
  praises: require("@/assets/images/dua-categories/praises.webp"),
  salawat: require("@/assets/images/dua-categories/salawat.webp"),
  quranic: require("@/assets/images/dua-categories/quranic.webp"),
  "sunnah-duas": require("@/assets/images/dua-categories/sunnah-duas.webp"),
  "names-of-allah": require("@/assets/images/dua-categories/names-of-allah.webp"),
  istighfar: require("@/assets/images/dua-categories/istighfar.webp"),
  "waking-up": require("@/assets/images/dua-categories/waking-up.webp"),
  nightmares: require("@/assets/images/dua-categories/nightmares.webp"),
  clothes: require("@/assets/images/dua-categories/clothes.webp"),
  "lavatory-wudu": require("@/assets/images/dua-categories/lavatory-wudu.webp"),
  home: require("@/assets/images/dua-categories/home.webp"),
  "adhan-masjid": require("@/assets/images/dua-categories/adhan-masjid.webp"),
  istikharah: require("@/assets/images/dua-categories/istikharah.webp"),
  gatherings: require("@/assets/images/dua-categories/gatherings.webp"),
  "food-drink": require("@/assets/images/dua-categories/food-drink.webp"),
  travel: require("@/assets/images/dua-categories/travel.webp"),
  death: require("@/assets/images/dua-categories/death.webp"),
  nature: require("@/assets/images/dua-categories/nature.webp"),
  social: require("@/assets/images/dua-categories/social.webp"),
  iman: require("@/assets/images/dua-categories/iman.webp"),
  difficulties: require("@/assets/images/dua-categories/difficulties.webp"),
  hajj: require("@/assets/images/dua-categories/hajj.webp"),
  money: require("@/assets/images/dua-categories/money.webp"),
  marriage: require("@/assets/images/dua-categories/marriage.webp"),
  ummah: require("@/assets/images/dua-categories/ummah.webp"),
};

export default function DuaHubScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const [group, setGroup] = useState<"main" | "other">("main");

  const categories = CATEGORIES.filter((c) => c.group === group);

  const handleCategoryPress = useCallback((id: string) => {
    Haptics.selectionAsync().catch(() => {});
    if (id === "names-of-allah") {
      router.push("/names" as any);
    } else {
      router.push(`/dua/${id}` as any);
    }
  }, [router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>{t("duas") || "Du'as"}</Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={{ gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item: c }) => {
          const iconName = c.id === "hajj" ? "mosque" : (c.icon || FALLBACK_ICON);
          const categoryImage = CATEGORY_IMAGES[c.id];
          return (
            <AnimatedPressable
              onPress={() => handleCategoryPress(c.id)}
              style={[styles.card, { width: CARD_WIDTH }]}
            >
              {categoryImage ? (
                <View style={styles.cardVisual}>
                  <Image source={categoryImage} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
                  <LinearGradient colors={["rgba(15,23,42,0.02)", "rgba(15,23,42,0.42)"]} style={styles.imageOverlay} />
                </View>
              ) : (
                <LinearGradient colors={[...c.gradient]} style={styles.cardVisual}>
                  <View style={styles.decorativeOrbLarge} />
                  <View style={styles.decorativeOrbSmall} />
                  <View style={styles.iconHalo}>
                    <MaterialCommunityIcons name={iconName as keyof typeof MaterialCommunityIcons.glyphMap} size={42} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              )}
              <View style={[styles.cardLabelContainer, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.cardTitle, { color: colors.onSurface }]} numberOfLines={2}>
                  {((t(c.id) && t(c.id) !== c.id ? t(c.id) : c.title) || c.title)}
                </Text>
              </View>
            </AnimatedPressable>
          );
        }}
        ListHeaderComponent={() => (<>
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


      </>
      )}
    />
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
  fortressCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  fortressIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  fortressTitle: { fontSize: 17, fontWeight: "800" },
  fortressSub: { fontSize: 12, marginTop: 4 },
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
    height: 174,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.surfaceSecondary,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  cardVisual: {
    height: 122,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeOrbLarge: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -76,
    right: -42,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  decorativeOrbSmall: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    bottom: -48,
    left: -24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  iconHalo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
  },
  cardLabelContainer: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
