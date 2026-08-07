/**
 * ShareImageCard — Generate and share beautiful verse/hadith image cards.
 *
 * Renders a styled card with Arabic text + translation and captures it
 * as an image using react-native-view-shot, then shares via expo-sharing.
 *
 * Templates:
 *  - story: 9:16 (Instagram Stories, WhatsApp Status)
 *  - square: 1:1 (Instagram posts, WhatsApp chat)
 *  - wallpaper: 9:19 (Phone wallpaper)
 *
 * Usage:
 *   <ShareImageCard
 *     type="verse"
 *     arabic="بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
 *     translation="In the name of Allah..."
 *     reference="Surah Al-Fatihah: 1"
 *   />
 */

import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import ViewShot from "react-native-view-shot";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ── Types ───────────────────────────────────────────────────────────────────────

export type ShareTemplate = "story" | "square" | "wallpaper";

interface ShareImageCardProps {
  type: "verse" | "hadith" | "dua";
  arabic: string;
  translation: string;
  reference: string;
  grade?: string;
  /** If true, show the share modal immediately */
  visible?: boolean;
  onClose?: () => void;
}

// ── Template Dimensions ─────────────────────────────────────────────────────────

const TEMPLATE_CONFIG: Record<ShareTemplate, { aspectRatio: number; label: string; icon: string }> = {
  story:     { aspectRatio: 9 / 16, label: "Story",     icon: "cellphone" },
  square:    { aspectRatio: 1,      label: "Square",    icon: "square-outline" },
  wallpaper: { aspectRatio: 9 / 19, label: "Wallpaper", icon: "cellphone-screenshot" },
};

// ── Gradient Themes ─────────────────────────────────────────────────────────────

const GRADIENT_THEMES: { name: string; colors: [string, string, string] }[] = [
  { name: "Emerald",  colors: ["#064E3B", "#065F46", "#047857"] },
  { name: "Midnight", colors: ["#0F172A", "#1E293B", "#334155"] },
  { name: "Royal",    colors: ["#312E81", "#3730A3", "#4338CA"] },
  { name: "Rose",     colors: ["#4C0519", "#881337", "#9F1239"] },
  { name: "Desert",   colors: ["#451A03", "#78350F", "#92400E"] },
  { name: "Ocean",    colors: ["#042F2E", "#134E4A", "#115E59"] },
];

// ── Component ───────────────────────────────────────────────────────────────────

export default function ShareImageCard({
  type,
  arabic,
  translation,
  reference,
  grade,
  visible = false,
  onClose,
}: ShareImageCardProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [template, setTemplate] = useState<ShareTemplate>("story");
  const [gradientIndex, setGradientIndex] = useState(0);
  const [sharing, setSharing] = useState(false);

  const currentGradient = GRADIENT_THEMES[gradientIndex];
  const templateConfig = TEMPLATE_CONFIG[template];
  const cardWidth = SCREEN_WIDTH - 48;
  const cardHeight = cardWidth / templateConfig.aspectRatio;

  const handleShare = useCallback(async () => {
    if (!viewShotRef.current?.capture) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSharing(true);

    try {
      const uri = await viewShotRef.current.capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: `Share ${type === "verse" ? "Verse" : type === "hadith" ? "Hadith" : "Dua"}`,
          UTI: "public.png",
        });
      }
    } catch (error) {
      if (__DEV__) console.warn("[ShareImageCard] Share failed:", error);
    } finally {
      setSharing(false);
    }
  }, [type]);

  const cycleGradient = () => {
    Haptics.selectionAsync().catch(() => {});
    setGradientIndex((prev) => (prev + 1) % GRADIENT_THEMES.length);
  };

  // Truncate text if too long for the card
  const maxArabicLen = template === "square" ? 200 : 400;
  const maxTransLen = template === "square" ? 250 : 500;
  const displayArabic = arabic.length > maxArabicLen ? arabic.slice(0, maxArabicLen) + "…" : arabic;
  const displayTrans = translation.length > maxTransLen ? translation.slice(0, maxTransLen) + "…" : translation;

  const typeIcon = type === "verse" ? "book-open-variant" : type === "hadith" ? "book-open-page-variant" : "hands-pray";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Share as Image</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Preview Card */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1.0 }}
            style={styles.viewShotWrap}
          >
            <LinearGradient
              colors={currentGradient.colors}
              style={[styles.card, { width: cardWidth, height: Math.min(cardHeight, 520) }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Decorative top element */}
              <View style={styles.decorTop}>
                <Text style={styles.bismillah}>﷽</Text>
              </View>

              {/* Arabic text */}
              <Text style={styles.arabicText} numberOfLines={template === "square" ? 6 : 10}>
                {displayArabic}
              </Text>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <MaterialCommunityIcons name={typeIcon as any} size={16} color="rgba(255,255,255,0.5)" />
                <View style={styles.dividerLine} />
              </View>

              {/* Translation */}
              <Text style={styles.translationText} numberOfLines={template === "square" ? 6 : 10}>
                &quot;{displayTrans}&quot;
              </Text>

              {/* Reference */}
              <Text style={styles.referenceText}>
                — {reference} —
              </Text>

              {/* Grade badge (for hadiths) */}
              {grade ? (
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeText}>{grade}</Text>
                </View>
              ) : null}

              {/* Branding footer */}
              <View style={styles.brandingFooter}>
                <Text style={styles.brandingText}>Islamic Hikmah</Text>
                <Text style={styles.brandingIcon}>☪</Text>
              </View>
            </LinearGradient>
          </ViewShot>

          {/* Template Selector */}
          <View style={styles.controlsRow}>
            {(Object.keys(TEMPLATE_CONFIG) as ShareTemplate[]).map((key) => (
              <Pressable
                key={key}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); setTemplate(key); }}
                style={[
                  styles.templateBtn,
                  template === key && styles.templateBtnActive,
                ]}
              >
                <MaterialCommunityIcons
                  name={TEMPLATE_CONFIG[key].icon as any}
                  size={18}
                  color={template === key ? "#FFFFFF" : "rgba(255,255,255,0.5)"}
                />
                <Text style={[
                  styles.templateLabel,
                  { color: template === key ? "#FFFFFF" : "rgba(255,255,255,0.5)" },
                ]}>
                  {TEMPLATE_CONFIG[key].label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Color Theme Selector */}
          <Pressable onPress={cycleGradient} style={styles.colorBtn}>
            <MaterialCommunityIcons name="palette-outline" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={styles.colorLabel}>{currentGradient.name}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
          </Pressable>

          {/* Share Button */}
          <Pressable
            onPress={handleShare}
            style={[styles.shareBtn, sharing && { opacity: 0.6 }]}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>Share</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: SCREEN_WIDTH - 24,
    maxHeight: "90%",
    alignItems: "center",
    gap: 14,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 12,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  // ViewShot wrapper
  viewShotWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },

  // Card
  card: {
    borderRadius: 16,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
  },

  // Decorative
  decorTop: {
    marginBottom: 4,
  },
  bismillah: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 28,
    fontFamily: Platform.OS === "ios" ? "AmiriQuran" : "serif",
  },

  // Arabic text
  arabicText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: Platform.OS === "ios" ? "NotoNaskhArabic" : "serif",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: 0.5,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "80%",
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  // Translation
  translationText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // Reference
  referenceText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // Grade
  gradeBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gradeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "700",
  },

  // Branding
  brandingFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    opacity: 0.4,
  },
  brandingText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  brandingIcon: {
    color: "#FFFFFF",
    fontSize: 12,
  },

  // Controls
  controlsRow: {
    flexDirection: "row",
    gap: 12,
  },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  templateBtnActive: {
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  templateLabel: {
    fontSize: 12,
    fontWeight: "600",
  },

  colorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  colorLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "500",
  },

  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    width: "80%",
  },
  shareBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
