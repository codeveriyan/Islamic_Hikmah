import { View, Text, StyleSheet, Pressable, ScrollView, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { theme } from "@/src/theme";

export const HADITH_BOOKS = [
  // --- The Nine Books ---
  { id: "bukhari", name: "Sahih al-Bukhari", compiler: "Imam Bukhari", total: 7563, group: "nine_books", color: "#10B981", source: "fawazahmed", cover: require("../../assets/images/hadith_bukhari_cover.jpg") },
  { id: "muslim", name: "Sahih Muslim", compiler: "Imam Muslim", total: 7563, group: "nine_books", color: "#3B82F6", source: "fawazahmed", cover: require("../../assets/images/hadith_muslim_cover.jpg") },
  { id: "nasai", name: "Sunan an-Nasa'i", compiler: "Imam An-Nasa'i", total: 5758, group: "nine_books", color: "#EC4899", source: "fawazahmed", cover: require("../../assets/images/hadith_nasai_cover.jpg") },
  { id: "abudawud", name: "Sunan Abi Dawud", compiler: "Imam Abu Dawud", total: 5274, group: "nine_books", color: "#F59E0B", source: "fawazahmed", cover: require("../../assets/images/hadith_abudawud_cover.jpg") },
  { id: "tirmidhi", name: "Jami' at-Tirmidhi", compiler: "Imam Al-Tirmidhi", total: 3956, group: "nine_books", color: "#8B5CF6", source: "fawazahmed", cover: require("../../assets/images/hadith_tirmidhi_cover.jpg") },
  { id: "ibnmajah", name: "Sunan Ibn Majah", compiler: "Imam Ibn Majah", total: 4341, group: "nine_books", color: "#EF4444", source: "fawazahmed", cover: require("../../assets/images/hadith_ibnmajah_cover.jpg") },
  { id: "malik", name: "Muwatta Malik", compiler: "Imam Malik", total: 1861, group: "nine_books", color: "#0D9488", source: "fawazahmed", cover: require("../../assets/images/hadith_malik_cover.jpg") },
  { id: "ahmad", name: "Musnad Ahmad", compiler: "Imam Ahmad bin Hanbal", total: 26363, group: "nine_books", color: "#2563EB", source: "ahmedbaset_nine", cover: require("../../assets/images/hadith_ahmad_cover.jpg") },
  { id: "darimi", name: "Sunan ad-Darimi", compiler: "Imam ad-Darimi", total: 3503, group: "nine_books", color: "#D97706", source: "ahmedbaset_nine", cover: require("../../assets/images/hadith_darimi_cover.jpg") },

  // --- Other Primary Collections ---
  { id: "khuzayma", name: "Sahih Ibn Khuzayma", compiler: "Imam Ibn Khuzayma", total: 3079, group: "primary", color: "#7C3AED", source: "fallback", cover: require("../../assets/images/hadith_khuzayma_cover.jpg") },
  { id: "hibban", name: "Sahih Ibn Hibban", compiler: "Imam Ibn Hibban", total: 7491, group: "primary", color: "#DC2626", source: "fallback", cover: require("../../assets/images/hadith_hibban_cover.jpg") },
  { id: "hakim", name: "Mustadrak al-Hakim", compiler: "Imam al-Hakim", total: 8607, group: "primary", color: "#059669", source: "fallback", cover: require("../../assets/images/hadith_hakim_cover.jpg") },
  { id: "razzaq", name: "Musannaf 'Abd ar-Razzaq", compiler: "Imam Abd ar-Razzaq", total: 21033, group: "primary", color: "#0284C7", source: "fallback", cover: require("../../assets/images/hadith_razzaq_cover.jpg") },
  { id: "ibnabishayba", name: "Musannaf Ibn Abi Shayba", compiler: "Imam Ibn Abi Shayba", total: 39011, group: "primary", color: "#DB2777", source: "fallback", cover: require("../../assets/images/hadith_ibnabishayba_cover.jpg") },
  { id: "daraqutni", name: "Sunan ad-Daraqutni", compiler: "Imam ad-Daraqutni", total: 4898, group: "primary", color: "#EA580C", source: "fallback", cover: require("../../assets/images/hadith_daraqutni_cover.jpg") },
  { id: "bayhaqi", name: "As-Sunan al-Kubra li al-Bayhaqi", compiler: "Imam al-Bayhaqi", total: 21812, group: "primary", color: "#6D28D9", source: "fallback", cover: require("../../assets/images/hadith_bayhaqi_cover.jpg") },
  { id: "nasai_kubra", name: "Sunan an-Nasa'i al-Kubra", compiler: "Imam An-Nasa'i", total: 11770, group: "primary", color: "#BE123C", source: "fallback", cover: require("../../assets/images/hadith_nasai_kubra_cover.jpg") },
  { id: "aladab_almufrad", name: "Al-Adab Al-Mufrad", compiler: "Imam Bukhari", total: 1329, group: "primary", color: "#047857", source: "ahmedbaset_other", cover: require("../../assets/images/hadith_aladab_almufrad_cover.jpg") },
  { id: "shamail_muhammadiyah", name: "Ash-Shama'il Al-Muhammadiyah", compiler: "Imam Al-Tirmidhi", total: 415, group: "primary", color: "#1D4ED8", source: "ahmedbaset_other", cover: require("../../assets/images/hadith_shamail_cover.jpg") },

  // --- Selections ---
  { id: "nawawi40", name: "An-Nawawi's 40 Hadith", compiler: "Imam Al-Nawawi", total: 42, group: "selections", color: "#C084FC", source: "ahmedbaset_forties", cover: require("../../assets/images/hadith_nawawi40_cover.jpg") },
  { id: "riyad_assalihin", name: "Riyadh as-Salihin", compiler: "Imam Al-Nawawi", total: 1896, group: "selections", color: "#F59E0B", source: "ahmedbaset_other", cover: require("../../assets/images/hadith_riyad_assalihin_cover.jpg") },
  { id: "bulugh_almaram", name: "Bulugh al-Maram", compiler: "Imam Ibn Hajar al-Asqalani", total: 1568, group: "selections", color: "#818CF8", source: "ahmedbaset_other", cover: require("../../assets/images/hadith_bulugh_almaram_cover.jpg") },
  { id: "mishkat_almasabih", name: "Mishkat al-Masabih", compiler: "Khatib al-Tabrizi", total: 6285, group: "selections", color: "#F87171", source: "ahmedbaset_other", cover: require("../../assets/images/hadith_mishkat_almasabih_cover.jpg") },
  { id: "hisn", name: "Hisn al-Muslim", compiler: "Sa'id bin Ali bin Wahf Al-Qahtani", total: 267, group: "selections", color: "#34D399", source: "fallback", cover: require("../../assets/images/hadith_hisn_cover.png") },
  { id: "qudsi40", name: "40 Hadith Qudsi", compiler: "Imam Al-Nawawi", total: 40, group: "selections", color: "#60A5FA", source: "ahmedbaset_forties", cover: require("../../assets/images/hadith_qudsi40_cover.png") },
  { id: "shahwaliullah40", name: "40 Hadith of Shah Waliullah", compiler: "Shah Waliullah Dehlawi", total: 40, group: "selections", color: "#FBBF24", source: "ahmedbaset_forties", cover: require("../../assets/images/hadith_shahwaliullah40_cover.png") }
];

const DynamicBookCover = ({ name, color }: { name: string; color: string }) => {
  const initials = name
    .split(/\s+/)
    .filter(w => !['al', 'ar', 'as', 'an', 'at', 'ad', 'li', 'de', 'bin', 'of'].includes(w.toLowerCase()))
    .map(w => w[0])
    .join("")
    .substring(0, 3)
    .toUpperCase();

  return (
    <View style={[styles.premiumCover, { backgroundColor: color }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(0,0,0,0.35)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.coverSpine} />
      <View style={styles.coverGoldBorder}>
        <MaterialCommunityIcons name="star-four-points" size={12} color="#D4AF37" style={{ marginBottom: 2 }} />
        <Text style={styles.coverInitials}>{initials}</Text>
        <View style={styles.coverDivider} />
      </View>
    </View>
  );
};

export default function HadithIndexScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  const renderBookItem = (book: typeof HADITH_BOOKS[number]) => {
    // Dynamic localization fallback
    const bookName = t(book.id) !== book.id ? t(book.id) : book.name;
    const bookDetail = t(book.id + "Sub") !== (book.id + "Sub")
      ? t(book.id + "Sub").replace("{total}", String(book.total))
      : `By ${book.compiler} · ${book.total} narrations`;

    return (
      <Pressable
        key={book.id}
        onPress={() => router.push(`/hadith/${book.id}` as any)}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: colors.surfaceSecondary },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
      >
        {book.cover ? (
          <Image 
            source={book.cover} 
            style={styles.bookCoverImage} 
            resizeMode="cover" 
          />
        ) : (
          <DynamicBookCover name={book.name} color={book.color} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.bookName, { color: colors.onSurface }]}>{bookName}</Text>
          <Text style={[styles.bookDetail, { color: colors.onSurfaceMuted }]}>
            {bookDetail}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceMuted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("hadithCollections")}</Text>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10}>
            <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* The Nine Books Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.brand }]}>THE NINE BOOKS</Text>
          <Text style={[styles.sectionTitleAr, { color: colors.onSurfaceMuted }]}>الكتب التسعة</Text>
        </View>
        <View style={styles.list}>
          {HADITH_BOOKS.filter(b => b.group === "nine_books").map(renderBookItem)}
        </View>

        {/* Other Primary Collections Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.brand }]}>OTHER PRIMARY COLLECTIONS</Text>
          <Text style={[styles.sectionTitleAr, { color: colors.onSurfaceMuted }]}>المصادر الأصلية الأخرى</Text>
        </View>
        <View style={styles.list}>
          {HADITH_BOOKS.filter(b => b.group === "primary").map(renderBookItem)}
        </View>

        {/* Selections Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.brand }]}>SELECTIONS</Text>
          <Text style={[styles.sectionTitleAr, { color: colors.onSurfaceMuted }]}>المصادر الثانوية</Text>
        </View>
        <View style={styles.list}>
          {HADITH_BOOKS.filter(b => b.group === "selections").map(renderBookItem)}
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
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: "700" },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: 60 },
  list: { gap: theme.spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: 16,
  },
  bookCoverImage: {
    width: 44,
    height: 58,
    borderRadius: 6,
  },
  premiumCover: {
    width: 44,
    height: 58,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.2,
    elevation: 3,
  },
  coverSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    backgroundColor: '#D4AF37',
    opacity: 0.85,
    zIndex: 2,
  },
  coverGoldBorder: {
    flex: 1,
    margin: 3.5,
    marginLeft: 7, // Leave space for spine
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.5)',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  coverInitials: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  coverDivider: {
    width: 10,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.5)',
    marginTop: 3,
  },
  bookName: { fontSize: 16, fontWeight: "700" },
  bookDetail: { fontSize: 12, marginTop: 4 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sectionTitleAr: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Amiri" : "serif",
  },
});
