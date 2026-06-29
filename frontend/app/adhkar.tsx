import { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { ADHKAR_CATEGORIES, AdhkarItem, AdhkarCategory } from "@/src/data/adhkar";

const ITEM_HEIGHT = 160;

export default function AdhkarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<AdhkarCategory | null>(null);

  const renderItem = useCallback(({ item }: { item: AdhkarItem }) => (
    <View style={[styles.card, { backgroundColor: colors.surfaceSecondary }]}>
      <View style={styles.cardHeader}>
        {item.repeat && item.repeat > 1 && (
          <View style={[styles.repeatBadge, { backgroundColor: colors.brand + "22" }]}>
            <Text style={[styles.repeatTxt, { color: colors.brand }]}>{item.repeat}×</Text>
          </View>
        )}
        {item.note && (
          <Text style={[styles.note, { color: colors.brand }]}>ℹ️ {item.note}</Text>
        )}
      </View>
      <Text style={[styles.arabic, { color: colors.onSurface }]}>{item.arabic}</Text>
      {item.transliteration && (
        <Text style={[styles.translit, { color: colors.onSurfaceSecondary }]}>{item.transliteration}</Text>
      )}
      <Text style={[styles.translation, { color: colors.onSurfaceMuted }]}>{item.translation}</Text>
      {item.reference && (
        <Text style={[styles.reference, { color: colors.brand }]}>— {item.reference}</Text>
      )}
    </View>
  ), [colors]);

  if (selected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => setSelected(null)} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{selected.title}</Text>
            <Text style={[styles.arabicTitle, { color: colors.brand }]}>{selected.arabicTitle}</Text>
          </View>
          <View style={{ width: 28 }} />
        </View>
        <FlatList
          data={selected.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Adhkar & Dua</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.heroBanner, { backgroundColor: colors.brand + "15" }]}>
        <Text style={[styles.heroArabic, { color: colors.brand }]}>أَذْكَارٌ مِنَ الْقُرْآنِ وَالسُّنَّةِ</Text>
        <Text style={[styles.heroSub, { color: colors.onSurfaceMuted }]}>Authentic remembrances from Quran & Sunnah</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {ADHKAR_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => setSelected(cat)}
            style={({ pressed }) => [
              styles.catCard,
              { backgroundColor: colors.surfaceSecondary },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
          >
            <View style={[styles.catIcon, { backgroundColor: cat.color + "22" }]}>
              <MaterialCommunityIcons name={cat.icon as any} size={26} color={cat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.catTitle, { color: colors.onSurface }]}>{cat.title}</Text>
              <Text style={[styles.catArabic, { color: cat.color }]}>{cat.arabicTitle}</Text>
              <Text style={[styles.catCount, { color: colors.onSurfaceMuted }]}>{cat.items.length} adhkar</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { fontSize: 18, fontWeight: "700" },
  arabicTitle: { fontFamily: "Amiri", fontSize: 16 },
  heroBanner: { marginHorizontal: theme.spacing.lg, borderRadius: theme.radius.lg, padding: theme.spacing.lg, alignItems: "center", marginBottom: theme.spacing.md },
  heroArabic: { fontFamily: "Amiri", fontSize: 22, textAlign: "center" },
  heroSub: { fontSize: 12, marginTop: 4, textAlign: "center" },
  grid: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 48 },
  catCard: { flexDirection: "row", alignItems: "center", padding: theme.spacing.lg, borderRadius: theme.radius.lg, gap: theme.spacing.md },
  catIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  catTitle: { fontSize: 16, fontWeight: "700" },
  catArabic: { fontFamily: "Amiri", fontSize: 14, marginTop: 2 },
  catCount: { fontSize: 12, marginTop: 2 },
  card: { padding: theme.spacing.lg, borderRadius: theme.radius.lg },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  repeatBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  repeatTxt: { fontWeight: "700", fontSize: 12 },
  note: { fontSize: 11, flex: 1 },
  arabic: { fontFamily: "Amiri", fontSize: 24, textAlign: "right", lineHeight: 44, marginBottom: 8 },
  translit: { fontSize: 13, fontStyle: "italic", marginBottom: 6 },
  translation: { fontSize: 14, lineHeight: 22 },
  reference: { fontSize: 11, marginTop: 8, fontWeight: "600" },
});