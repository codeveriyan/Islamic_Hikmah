import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";
import {
  SEERAH_CHAPTERS,
  SeerahEra,
  ERA_LABELS,
  ERA_COLORS,
  ERA_ICONS,
} from "@/src/data/seerahData";

const STORAGE_KEY = "islamic_hikmah:seerah_read_chapters";

const ERA_ORDER: SeerahEra[] = [
  "pre-islamic",
  "early-life",
  "meccan",
  "medinan",
  "final-years",
];

export default function SeerahIndexScreen() {
  const router = useRouter();
  const { colors, mode } = useTheme();
  const [selectedEra, setSelectedEra] = useState<SeerahEra | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setReadChapters(new Set(JSON.parse(val)));
        } catch {}
      }
    });
  }, []);

  const filtered = useMemo(() => {
    let list = SEERAH_CHAPTERS;
    if (selectedEra !== "all") {
      list = list.filter((c) => c.era === selectedEra);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedEra, searchQuery]);

  const totalRead = readChapters.size;
  const total = SEERAH_CHAPTERS.length;
  const progressPct = total > 0 ? totalRead / total : 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
      edges={["top"]}
    >
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.onSurface}
          />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            Seerah
          </Text>
          <Text style={[styles.headerSub, { color: colors.brand }]}>
            السيرة النبوية
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Hero Banner */}
      <View
        style={[styles.heroBanner, { backgroundColor: colors.surfaceSecondary }]}
      >
        <View style={styles.heroLeft}>
          <Text style={[styles.heroTitle, { color: colors.onSurface }]}>
            Life of the Prophet ﷺ
          </Text>
          <Text style={[styles.heroSub, { color: colors.onSurfaceMuted }]}>
            Ar-Raheeq Al-Makhtum · The Sealed Nectar
          </Text>
          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressTxt, { color: colors.brand }]}>
              {totalRead}/{total} chapters read
            </Text>
          </View>
          <View
            style={[styles.progressBar, { backgroundColor: colors.surfaceTertiary }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.brand,
                  width: `${Math.round(progressPct * 100)}%`,
                },
              ]}
            />
          </View>
        </View>
        <View
          style={[styles.heroIconWrap, { backgroundColor: colors.brand + "18" }]}
        >
          <Text style={styles.heroEmoji}>☪️</Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={[styles.searchWrap, { backgroundColor: colors.surfaceSecondary }]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.onSurfaceMuted}
        />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search chapters..."
          placeholderTextColor={colors.onSurfaceMuted}
          style={[styles.searchInput, { color: colors.onSurface }]}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        )}
      </View>

      {/* Era Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.eraRow}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setSelectedEra("all");
          }}
          style={[
            styles.eraChip,
            {
              backgroundColor:
                selectedEra === "all" ? colors.brand : colors.surfaceSecondary,
            },
          ]}
        >
          <Text
            style={[
              styles.eraChipTxt,
              {
                color:
                  selectedEra === "all" ? colors.onBrandPrimary : colors.onSurfaceMuted,
              },
            ]}
          >
            All ({total})
          </Text>
        </Pressable>
        {ERA_ORDER.map((era) => {
          const count = SEERAH_CHAPTERS.filter((c) => c.era === era).length;
          const active = selectedEra === era;
          return (
            <Pressable
              key={era}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSelectedEra(era);
              }}
              style={[
                styles.eraChip,
                {
                  backgroundColor: active
                    ? ERA_COLORS[era]
                    : colors.surfaceSecondary,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={ERA_ICONS[era] as any}
                size={14}
                color={active ? "#fff" : colors.onSurfaceMuted}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.eraChipTxt,
                  { color: active ? "#fff" : colors.onSurfaceMuted },
                ]}
              >
                {ERA_LABELS[era]} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Chapter List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons
              name="magnify-remove-outline"
              size={48}
              color={colors.onSurfaceMuted}
            />
            <Text style={[styles.emptyTxt, { color: colors.onSurfaceMuted }]}>
              No chapters found
            </Text>
          </View>
        ) : (
          filtered.map((chapter) => {
            const isRead = readChapters.has(chapter.id);
            return (
              <Pressable
                key={chapter.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  router.push(`/seerah/${chapter.id}` as any);
                }}
                style={({ pressed }) => [
                  styles.chapterCard,
                  { backgroundColor: colors.surfaceSecondary },
                  pressed && { opacity: 0.88, transform: [{ scale: 0.98 }] },
                ]}
              >
                {/* Era badge dot */}
                <View
                  style={[
                    styles.eraDot,
                    { backgroundColor: ERA_COLORS[chapter.era] },
                  ]}
                />

                {/* Icon */}
                <View
                  style={[
                    styles.chapterIcon,
                    { backgroundColor: ERA_COLORS[chapter.era] + "18" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={chapter.icon as any}
                    size={22}
                    color={ERA_COLORS[chapter.era]}
                  />
                </View>

                {/* Text */}
                <View style={{ flex: 1 }}>
                  <View style={styles.chapterTitleRow}>
                    <Text
                      style={[
                        styles.chapterTitle,
                        { color: colors.onSurface },
                      ]}
                      numberOfLines={1}
                    >
                      {chapter.title}
                    </Text>
                    {isRead && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color={colors.success}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.chapterArabic,
                      { color: colors.brand },
                    ]}
                  >
                    {chapter.arabicTitle}
                  </Text>
                  <Text
                    style={[styles.chapterDesc, { color: colors.onSurfaceMuted }]}
                    numberOfLines={2}
                  >
                    {chapter.description}
                  </Text>
                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.eraBadge,
                        { backgroundColor: ERA_COLORS[chapter.era] + "18" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.eraBadgeTxt,
                          { color: ERA_COLORS[chapter.era] },
                        ]}
                      >
                        {ERA_LABELS[chapter.era]}
                      </Text>
                    </View>
                    <Text
                      style={[styles.readTime, { color: colors.onSurfaceMuted }]}
                    >
                      · {chapter.readMinutes} min read
                    </Text>
                  </View>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={colors.onSurfaceMuted}
                />
              </Pressable>
            );
          })
        )}
        <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSub: { fontFamily: "Amiri", fontSize: 16, marginTop: 2 },

  heroBanner: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  heroLeft: { flex: 1 },
  heroTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  heroSub: { fontSize: 12, fontStyle: "italic", marginBottom: 10 },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  progressTxt: { fontSize: 12, fontWeight: "700" },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  heroEmoji: { fontSize: 30 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },

  eraRow: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    gap: 8,
  },
  eraChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0,
    flexGrow: 0,
    alignSelf: "flex-start",
  },
  eraChipTxt: { fontSize: 12, fontWeight: "700", flexShrink: 0 },

  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  chapterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: 12,
    position: "relative",
    overflow: "hidden",
  },
  eraDot: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  chapterIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  chapterTitle: { fontSize: 14, fontWeight: "700", flex: 1 },
  chapterArabic: {
    fontFamily: "Amiri",
    fontSize: 13,
    marginBottom: 4,
  },
  chapterDesc: { fontSize: 12, lineHeight: 16, marginBottom: 6 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  eraBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  eraBadgeTxt: { fontSize: 11, fontWeight: "700" },
  readTime: { fontSize: 11 },

  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTxt: { fontSize: 14 },
});
