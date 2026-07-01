import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

export const HADITH_BOOKS = [
  { id: "bukhari", name: "Sahih al-Bukhari", compiler: "Imam Bukhari", total: 7563, color: "#10B981" },
  { id: "muslim", name: "Sahih Muslim", compiler: "Imam Muslim", total: 7563, color: "#3B82F6" },
  { id: "nasai", name: "Sunan an-Nasa'i", compiler: "Imam An-Nasa'i", total: 5758, color: "#EC4899" },
  { id: "abudawud", name: "Sunan Abi Dawud", compiler: "Imam Abu Dawud", total: 5274, color: "#F59E0B" },
  { id: "tirmidhi", name: "Jami' at-Tirmidhi", compiler: "Imam Al-Tirmidhi", total: 3956, color: "#8B5CF6" },
  { id: "ibnmajah", name: "Sunan Ibn Majah", compiler: "Imam Ibn Majah", total: 4341, color: "#EF4444" },
] as const;

export default function HadithIndexScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Hadith Collections</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.banner, { backgroundColor: colors.brand + "12" }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={32} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: colors.onSurface }]}>Al-Kutub al-Sittah</Text>
            <Text style={[styles.bannerSub, { color: colors.onSurfaceMuted }]}>
              The six canonical Hadith compilations of authentic prophetic narrations.
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
              <View style={[styles.iconWrap, { backgroundColor: book.color + "18" }]}>
                <MaterialCommunityIcons name="book" size={24} color={book.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bookName, { color: colors.onSurface }]}>{book.name}</Text>
                <Text style={[styles.bookDetail, { color: colors.onSurfaceMuted }]}>
                  By {book.compiler} · {book.total} narrations
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
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bookName: { fontSize: 16, fontWeight: "700" },
  bookDetail: { fontSize: 12, marginTop: 4 },
});
