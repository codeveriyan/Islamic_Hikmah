import { ScrollView, View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { theme } from "@/src/theme";

type Ayah = { arabic: string; translation: string; ref: string; gradient: [string, string] };
const AYAHS: Ayah[] = [
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translation: "Indeed, with hardship comes ease.", ref: "Qur'an 94:6", gradient: ["#065F46", "#047857"] },
  { arabic: "وَاللَّهُ يُحِبُّ الْمُحْسِنِينَ", translation: "And Allah loves the doers of good.", ref: "Qur'an 3:134", gradient: ["#1E3A5F", "#1D4ED8"] },
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", translation: "So remember Me; I will remember you.", ref: "Qur'an 2:152", gradient: ["#4C1D95", "#7C3AED"] },
  { arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", translation: "And say: My Lord, increase me in knowledge.", ref: "Qur'an 20:114", gradient: ["#78350F", "#B45309"] },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translation: "Indeed, Allah is with the patient.", ref: "Qur'an 2:153", gradient: ["#134E4A", "#0F766E"] },
  { arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", translation: "And whoever relies on Allah — He is sufficient for him.", ref: "Qur'an 65:3", gradient: ["#1E1B4B", "#312E81"] },
  { arabic: "خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ", translation: "Show forgiveness and enjoin what is right.", ref: "Qur'an 7:199", gradient: ["#0F4C75", "#1B6CA8"] },
];

const { width } = Dimensions.get("window");
const CARD_W = (width - theme.spacing.lg * 2 - theme.spacing.md) / 2;

type FeatureCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  gradient: [string, string];
};

const FEATURED: FeatureCard[] = [
  {
    id: "fatawa",
    title: "Fatawa Answers",
    subtitle: "Scholarly Q&A Summaries",
    icon: "scale-balance",
    route: "/fatawa",
    gradient: ["#005C4B", "#00A884"],
  },
  {
    id: "hadith",
    title: "Hadith Collections",
    subtitle: "14 authentic books",
    icon: "book-open-variant",
    route: "/hadith",
    gradient: ["#065F46", "#047857"],
  },
  {
    id: "seerah",
    title: "Seerah",
    subtitle: "Life of the Prophet ﷺ",
    icon: "star-crescent",
    route: "/seerah",
    gradient: ["#1E3A5F", "#1D4ED8"],
  },
  {
    id: "dawah",
    title: "Dawah",
    subtitle: "Why Islam?",
    icon: "earth",
    route: "/dawah",
    gradient: ["#78350F", "#B45309"],
  },
  {
    id: "names",
    title: "Asma Al-Husna",
    subtitle: "99 Names of Allah",
    icon: "flower",
    route: "/names",
    gradient: ["#4C1D95", "#7C3AED"],
  },
  {
    id: "duas",
    title: "Du'a Hub",
    subtitle: "Supplications & Adhkar",
    icon: "hands-pray",
    route: "/dua-hub",
    gradient: ["#0F4C75", "#1B6CA8"],
  },
  {
    id: "pillars",
    title: "5 Pillars",
    subtitle: "Foundations of Islam",
    icon: "pillar",
    route: "/pillars-of-islam",
    gradient: ["#134E4A", "#0F766E"],
  },
];

type QuickLink = {
  id: string;
  label: string;
  icon: string;
  route: string;
};

const QUICK_LINKS: QuickLink[] = [
  { id: "fatawa", label: "Fatawa Answers", icon: "scale-balance", route: "/fatawa" },
  { id: "ramadan", label: "Ramadan Guide", icon: "moon-waning-crescent", route: "/ramadan" },
  { id: "hajj", label: "Hajj & Umrah", icon: "map-marker-path", route: "/hajj-umrah-guide" },
  { id: "zakat", label: "Zakat Calculator", icon: "calculator", route: "/zakat-calculator" },
  { id: "articles", label: "Articles", icon: "newspaper", route: "/articles" },
  { id: "fortress", label: "Fortress of Muslim", icon: "shield-star", route: "/adhkar" },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();

  const bg = mode === "dark" ? colors.surface : "#F8FAFC";
  const cardBg = mode === "dark" ? colors.surfaceSecondary : "#FFFFFF";

  // Deterministic daily ayah rotation
  const todayAyah = useMemo(() => {
    const d = new Date();
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
    return AYAHS[dayOfYear % AYAHS.length];
  }, []);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["top"]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.headerTitle, { color: colors.onSurface }]}>Discover Islam</Text>
          <Text style={[s.headerSub, { color: colors.onSurfaceMuted }]}>
            Explore authentic Islamic knowledge
          </Text>
        </View>
        <Pressable onPress={() => router.push("/search" as any)} hitSlop={10}>
          <MaterialCommunityIcons name="magnify" size={26} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── Ayah of the Day Hero ── */}
        <AnimatedCard
          onPress={() => router.push("/quran" as any)}
          style={{ marginBottom: 20, borderRadius: 20, overflow: "hidden" }}
        >
          <LinearGradient
            colors={todayAyah.gradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ padding: 20 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <MaterialCommunityIcons name="star-crescent" size={16} color="rgba(255,255,255,0.75)" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.75)", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: "Figtree_400Regular" }}>Ayah of the Day</Text>
            </View>
            <Text style={{ fontFamily: "NotoNaskhArabic", fontSize: 22, color: "#fff", textAlign: "right", lineHeight: 38, marginBottom: 14 }}>
              {todayAyah.arabic}
            </Text>
            <View style={{ height: 0.5, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 14 }} />
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", fontStyle: "italic", lineHeight: 22, fontFamily: "Figtree_400Regular", marginBottom: 8 }}>
              "{todayAyah.translation}"
            </Text>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Figtree_400Regular", fontWeight: "700" }}>
              — {todayAyah.ref}
            </Text>
          </LinearGradient>
        </AnimatedCard>

        {/* Section: Featured */}
        <Text style={[s.sectionTitle, { color: colors.onSurface }]}>Islamic Learning</Text>

        <View style={s.grid}>
          {FEATURED.map((item) => (
            <AnimatedCard
              key={item.id}
              onPress={() => router.push(item.route as any)}
              style={[s.featureCard, { width: CARD_W }]}
            >
              <LinearGradient
                colors={item.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.cardGradient}
              >
                <View style={s.cardIconWrap}>
                  <MaterialCommunityIcons name={item.icon as any} size={30} color="#fff" />
                </View>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardSub}>{item.subtitle}</Text>
              </LinearGradient>
            </AnimatedCard>
          ))}
        </View>

        {/* Section: Quick Links */}
        <Text style={[s.sectionTitle, { color: colors.onSurface, marginTop: 8 }]}>More Resources</Text>

        <View style={[s.quickList, { backgroundColor: cardBg, borderColor: colors.border }]}>
          {QUICK_LINKS.map((item, idx) => (
            <AnimatedCard
              key={item.id}
              onPress={() => router.push(item.route as any)}
              style={[
                s.quickRow,
                idx < QUICK_LINKS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
              ]}
            >
              <View style={[s.quickIcon, { backgroundColor: colors.brand + "18" }]}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.brand} />
              </View>
              <Text style={[s.quickLabel, { color: colors.onSurface }]}>{item.label}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
            </AnimatedCard>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "700",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Figtree_400Regular",
    marginTop: 2,
  },
  scroll: { padding: theme.spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Figtree_400Regular",
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  featureCard: {
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    height: 140,
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Figtree_400Regular",
  },
  quickList: {
    borderRadius: theme.radius.lg,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Figtree_400Regular",
    fontWeight: "500",
  },
});
