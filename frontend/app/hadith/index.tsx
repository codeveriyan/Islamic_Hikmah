import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { theme } from "@/src/theme";

export const HADITH_BOOKS = [
  { id: "bukhari", name: "Sahih al-Bukhari", compiler: "Imam Bukhari", total: 7563, color: "#10B981", cover: require("../../assets/images/hadith_bukhari_cover.jpg") },
  { id: "muslim", name: "Sahih Muslim", compiler: "Imam Muslim", total: 7563, color: "#3B82F6", cover: require("../../assets/images/hadith_muslim_cover.jpg") },
  { id: "nasai", name: "Sunan an-Nasa'i", compiler: "Imam An-Nasa'i", total: 5758, color: "#EC4899", cover: require("../../assets/images/hadith_nasai_cover.jpg") },
  { id: "abudawud", name: "Sunan Abi Dawud", compiler: "Imam Abu Dawud", total: 5274, color: "#F59E0B", cover: require("../../assets/images/hadith_abudawud_cover.jpg") },
  { id: "tirmidhi", name: "Jami' at-Tirmidhi", compiler: "Imam Al-Tirmidhi", total: 3956, color: "#8B5CF6", cover: require("../../assets/images/hadith_tirmidhi_cover.jpg") },
  { id: "ibnmajah", name: "Sunan Ibn Majah", compiler: "Imam Ibn Majah", total: 4341, color: "#EF4444", cover: require("../../assets/images/hadith_ibnmajah_cover.jpg") },
] as const;

export default function HadithIndexScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("hadithCollections")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { backgroundColor: colors.brand + "12" }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={32} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.onSurface }]}>{t("alKutubAlSittah")}</Text>
            <Text style={[styles.bannerSub, { color: colors.onSurfaceMuted }]}>
              {t("alKutubAlSittahSub")}
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {HADITH_BOOKS.map((book) => (
            <Pressable
              key={book.id}
              onPress={() => router.push(`/hadith/${book.id}` as any)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.surfaceSecondary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Image 
                source={book.cover} 
                style={styles.bookCoverImage} 
                resizeMode="cover" 
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bookName, { color: colors.onSurface }]}>{t(book.id)}</Text>
                <Text style={[styles.bookDetail, { color: colors.onSurfaceMuted }]}>
                  {t(book.id + "Sub").replace("{total}", String(book.total))}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceMuted} />
            </Pressable>
          ))}
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
  scrollContent: { padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 40 },
  banner: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: "center",
    gap: 16,
  },
  bannerTitle: { fontSize: 16, fontWeight: "700" },
  bannerSub: { fontSize: 12, marginTop: 4, lineHeight: 18 },
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
  bookName: { fontSize: 16, fontWeight: "700" },
  bookDetail: { fontSize: 12, marginTop: 4 },
});
