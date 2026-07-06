import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { theme } from "@/src/theme";
import {
  SEERAH_CHAPTERS,
  ERA_LABELS,
  ERA_COLORS,
} from "@/src/data/seerahData";

const STORAGE_KEY = "islamic_hikmah:seerah_read_chapters";

export default function SeerahChapterScreen() {
  const { chapter: chapterId } = useLocalSearchParams<{ chapter: string }>();
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const scrollRef = useRef<ScrollView>(null);

  const [readChapters, setReadChapters] = useState<Set<string>>(new Set());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);
  const [scrollViewHeight, setScrollViewHeight] = useState(1);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  const chapterIndex = SEERAH_CHAPTERS.findIndex((c) => c.id === chapterId);
  const chapter = SEERAH_CHAPTERS[chapterIndex];
  const prevChapter = chapterIndex > 0 ? SEERAH_CHAPTERS[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < SEERAH_CHAPTERS.length - 1
      ? SEERAH_CHAPTERS[chapterIndex + 1]
      : null;

  const isRead = readChapters.has(chapter?.id ?? "");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val) {
        try {
          setReadChapters(new Set(JSON.parse(val)));
        } catch {}
      }
    });
  }, []);

  const handleMarkRead = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (!chapter) return;
    const next = new Set(readChapters);
    if (isRead) {
      next.delete(chapter.id);
    } else {
      next.add(chapter.id);
    }
    setReadChapters(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  };

  const handleShare = async () => {
    if (!chapter) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const excerpt = chapter.content.slice(0, 300).replace(/\*\*/g, "").trim();
    await Share.share({
      message: `📖 ${chapter.title}\n${chapter.arabicTitle}\n\n${excerpt}...\n\nShared via Islamic Hikmah 🕌`,
    });
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    if (scrollable > 0) {
      setScrollProgress(Math.min(1, contentOffset.y / scrollable));
    }
  };

  const navigateTo = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.replace(`/seerah/${id}` as any);
  };

  const fontSizeMap = { small: 14, medium: 16, large: 19 };
  const lineHeightMap = { small: 22, medium: 26, large: 30 };
  const contentFontSize = fontSizeMap[fontSize];
  const contentLineHeight = lineHeightMap[fontSize];

  // Simple markdown-like bold rendering
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <Text
            key={i}
            style={{ fontWeight: "800", color: colors.onSurface }}
          >
            {part.slice(2, -2)}
          </Text>
        );
      }
      return (
        <Text key={i} style={{ color: colors.onSurfaceSecondary }}>
          {part}
        </Text>
      );
    });
  };

  const renderParagraphs = (text: string) => {
    const paragraphs = text.split(/\n\n+/);
    return paragraphs.map((para, idx) => {
      const isBullet = para.trim().startsWith("- ");
      if (isBullet) {
        const lines = para.split("\n").filter((l) => l.trim());
        return (
          <View key={idx} style={{ marginBottom: 14 }}>
            {lines.map((line, li) => (
              <View
                key={li}
                style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}
              >
                <Text
                  style={{
                    color: colors.brand,
                    fontSize: contentFontSize,
                    lineHeight: contentLineHeight,
                    marginTop: 2,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: contentFontSize,
                    lineHeight: contentLineHeight,
                  }}
                >
                  {renderContent(line.replace(/^-\s*/, ""))}
                </Text>
              </View>
            ))}
          </View>
        );
      }
      return (
        <Text
          key={idx}
          style={[
            styles.paragraph,
            {
              fontSize: contentFontSize,
              lineHeight: contentLineHeight,
            },
          ]}
        >
          {renderContent(para.trim())}
        </Text>
      );
    });
  };

  if (!chapter) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.surface }]}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ padding: 20 }}
          hitSlop={12}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.onSurface}
          />
        </Pressable>
        <Text style={{ color: colors.onSurface, padding: 20 }}>
          {t("chapterNotFound")}
        </Text>
      </SafeAreaView>
    );
  }

  const eraColor = ERA_COLORS[chapter.era];
  const progressPct = Math.round(scrollProgress * 100);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surface }]}
      edges={["top"]}
    >
      {/* Reading progress bar */}
      <View
        style={[styles.progressBarOuter, { backgroundColor: colors.surfaceTertiary }]}
      >
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: eraColor, width: `${progressPct}%` },
          ]}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.onSurface}
          />
        </Pressable>

        <View style={styles.headerActions}>
          {/* Font size */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setFontSize((s) =>
                s === "small" ? "medium" : s === "medium" ? "large" : "small"
              );
            }}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons
              name="format-size"
              size={18}
              color={colors.brand}
            />
          </Pressable>

          {/* Share */}
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={18}
              color={colors.onSurfaceMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* Chapter Info Banner */}
      <View
        style={[
          styles.chapterBanner,
          { backgroundColor: eraColor + "14", borderColor: eraColor + "33" },
        ]}
      >
        <View
          style={[styles.chapterIconWrap, { backgroundColor: eraColor + "22" }]}
        >
          <MaterialCommunityIcons
            name={chapter.icon as any}
            size={26}
            color={eraColor}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={[styles.eraBadge, { backgroundColor: eraColor + "22" }]}
          >
            <Text style={[styles.eraBadgeTxt, { color: eraColor }]}>
              {ERA_LABELS[chapter.era]}
            </Text>
          </View>
          <Text style={[styles.chapterTitle, { color: colors.onSurface }]}>
            {chapter.title}
          </Text>
          <Text style={[styles.chapterArabic, { color: colors.brand }]}>
            {chapter.arabicTitle}
          </Text>
          <Text style={[styles.chapterMeta, { color: colors.onSurfaceMuted }]}>
            {t("chapterNo").replace("{no}", String(chapter.order))} · {t("minRead").replace("{min}", String(chapter.readMinutes))}
            {progressPct > 0 ? ` · ${progressPct}% ${t("readPercent")}` : ""}
          </Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        contentContainerStyle={styles.contentContainer}
      >
        {renderParagraphs(chapter.content)}

        {/* Mark as Read button */}
        <Pressable
          onPress={handleMarkRead}
          style={[
            styles.markReadBtn,
            {
              backgroundColor: isRead
                ? colors.success + "18"
                : colors.surfaceSecondary,
              borderColor: isRead ? colors.success : colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={isRead ? "check-circle" : "circle-outline"}
            size={20}
            color={isRead ? colors.success : colors.onSurfaceMuted}
          />
          <Text
            style={[
              styles.markReadTxt,
              { color: isRead ? colors.success : colors.onSurfaceMuted },
            ]}
          >
            {isRead ? t("markedAsRead") : t("markAsRead")}
          </Text>
        </Pressable>

        {/* Navigation */}
        <View style={styles.navRow}>
          {prevChapter ? (
            <Pressable
              onPress={() => navigateTo(prevChapter.id)}
              style={[styles.navBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={20}
                color={colors.brand}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.navLabel, { color: colors.onSurfaceMuted }]}
                >
                  {t("previous")}
                </Text>
                <Text
                  style={[styles.navTitle, { color: colors.onSurface }]}
                  numberOfLines={1}
                >
                  {prevChapter.title}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {nextChapter ? (
            <Pressable
              onPress={() => navigateTo(nextChapter.id)}
              style={[
                styles.navBtn,
                styles.navBtnRight,
                { backgroundColor: colors.brand },
              ]}
            >
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.navLabel, { color: colors.onBrandPrimary + "CC" }]}>
                  {t("next2")}
                </Text>
                <Text
                  style={[styles.navTitle, { color: colors.onBrandPrimary }]}
                  numberOfLines={1}
                >
                  {nextChapter.title}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colors.onBrandPrimary}
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.navBtn,
                styles.navBtnRight,
                { backgroundColor: colors.success + "18", borderColor: colors.success + "33" },
              ]}
            >
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.navLabel, { color: colors.success }]}>
                  {t("completed")}
                </Text>
                <Text style={[styles.navTitle, { color: colors.success }]}>
                  {t("endOfSeerah")}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="check-all"
                size={20}
                color={colors.success}
              />
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBarOuter: {
    height: 3,
    width: "100%",
  },
  progressBarFill: { height: 3 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  chapterBanner: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  chapterIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  eraBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  eraBadgeTxt: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  chapterTitle: { fontSize: 17, fontWeight: "800", marginBottom: 2 },
  chapterArabic: { fontFamily: "Amiri", fontSize: 16, marginBottom: 4 },
  chapterMeta: { fontSize: 12 },

  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 24,
  },
  paragraph: {
    marginBottom: 16,
  },

  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 16,
  },
  markReadTxt: { fontWeight: "700", fontSize: 15 },

  navRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  navBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: 8,
  },
  navBtnRight: {
    justifyContent: "flex-end",
  },
  navLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  navTitle: { fontSize: 13, fontWeight: "700", marginTop: 2 },
});
