import { View, Text, StyleSheet, Pressable, ScrollView, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";

import { useTranslation } from "@/src/localization";

const ITEMS = [
  { id: "tasbihCounter", icon: "circle-double", route: "/dhikr" },
  { id: "nobleQuran", icon: "book-open-variant", route: "/quran" },
  { id: "hadithCollections", icon: "book-open", route: "/hadith" },
  { id: "namesOfAllah", icon: "mosque", route: "/names" },
  { id: "qiblaFinder", icon: "compass", route: "/qibla" },
  { id: "hijriCalendar", icon: "calendar-month", route: "/hijri-calendar" },
  { id: "favourites", icon: "heart", route: "/(tabs)/favourites" },
  { id: "publications", icon: "newspaper-variant", route: "/(tabs)/articles" },
  { id: "emotions", icon: "emoticon", route: "/(tabs)/emotions" },
  { id: "reminders", icon: "bell", route: "/(tabs)/reminder" },
] as const;

export default function MenuScreen() {
  const router = useRouter();
  const { colors, mode, setMode, language } = useTheme();
  const { t } = useTranslation(language);

  const share = async () => {
    try {
      await Share.share({ message: "Check out Islamic Hikmah — Knowledge, Guidance, Worship 🕌" });
    } catch {}
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={[styles.hero, { backgroundColor: colors.surfaceSecondary }]}>
        <View style={styles.closeRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} testID="menu-close">
            <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
        <Text style={[styles.calligraphy, { color: colors.brand }]}>الحكمة الإسلامية</Text>
        <Text style={[styles.appName, { color: colors.onSurface }]}>Islamic Hikmah</Text>
        <Text style={[styles.tagline, { color: colors.brandSecondary }]}>Knowledge · Guidance · Worship</Text>
        <Text style={[styles.version, { color: colors.onSurfaceMuted }]}>v 1.1.0</Text>
      </View>

      <View style={[styles.themeRow]}>
        <Pressable
          onPress={() => setMode("light")}
          style={[
            styles.themeBtn,
            { backgroundColor: mode === "light" ? colors.brand : colors.surfaceSecondary },
          ]}
          testID="theme-light"
        >
          <MaterialCommunityIcons name="lightbulb-on" size={18} color={mode === "light" ? colors.onBrandPrimary : colors.onSurface} />
          <Text style={[styles.themeTxt, { color: mode === "light" ? colors.onBrandPrimary : colors.onSurface }]}>{t("lightMode").toUpperCase() || "LIGHT MODE"}</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("dark")}
          style={[
            styles.themeBtnSmall,
            { backgroundColor: mode === "dark" ? colors.brand : colors.surfaceSecondary },
          ]}
          testID="theme-dark"
        >
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color={mode === "dark" ? colors.onBrandPrimary : colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {ITEMS.map((it) => (
          <Pressable
            key={it.id}
            onPress={() => {
              router.back();
              setTimeout(() => router.push(it.route as any), 50);
            }}
            style={[styles.row, { borderBottomColor: colors.border }]}
            testID={`menu-${it.id}`}
          >
            <MaterialCommunityIcons name={it.icon as any} size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{t(it.id)}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
          </Pressable>
        ))}
        <Pressable onPress={share} style={[styles.row, { borderBottomColor: colors.border }]} testID="menu-share">
          <MaterialCommunityIcons name="share-variant" size={22} color={colors.brandSecondary} />
          <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Share Our App</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
        </Pressable>
        <View style={styles.about}>
          <Text style={[styles.aboutTitle, { color: colors.brand }]}>About Islamic Hikmah</Text>
          <Text style={[styles.aboutTxt, { color: colors.onSurfaceMuted }]}>
            A companion for Du{`'`}a, Dhikr, and Quran — built with love for the Ummah.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, alignItems: "center" },
  closeRow: { alignSelf: "flex-end", padding: 16 },
  calligraphy: { fontFamily: "AmiriBold", fontSize: 44, marginTop: -4 },
  appName: { fontSize: 24, fontWeight: "800", marginTop: 8, letterSpacing: 0.5 },
  tagline: { fontSize: 13, fontWeight: "600", marginTop: 4, letterSpacing: 1 },
  version: { fontSize: 12, marginTop: 6 },
  themeRow: { flexDirection: "row", gap: 12, padding: 16 },
  themeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  themeBtnSmall: { width: 56, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  themeTxt: { fontWeight: "700", letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  about: { padding: 20, marginTop: 12 },
  aboutTitle: { fontSize: 16, fontWeight: "800" },
  aboutTxt: { marginTop: 6, lineHeight: 20 },
});
