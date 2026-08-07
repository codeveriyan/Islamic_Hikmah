/**
 * HadeethEncEnrichment — Enrichment overlay component for hadith cards.
 *
 * Fetches grading, explanation, hints, word meanings, and attribution from
 * HadeethEnc API and renders them as expandable sections below the hadith text.
 *
 * Usage:
 *   <HadeethEncEnrichment
 *     collectionId="bukhari"
 *     hadithNumber={1}
 *     hadithText="Actions are according to intentions..."
 *     language="en"
 *   />
 */

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/src/ThemeContext";
import {
  getHadithEnrichment,
  HadithEnrichment,
  GRADE_BADGE_COLORS,
  HadithGradeKey,
} from "@/src/services/hadeethEncService";

interface HadeethEncEnrichmentProps {
  collectionId: string;
  hadithNumber: number;
  hadithText: string;
  language?: string;
  /** Compact mode: only show the grade badge inline (for card headers) */
  compact?: boolean;
}

/**
 * Grade badge component — displays the authenticity level with colour coding.
 */
export function GradeBadge({ gradeKey, grade }: { gradeKey: HadithGradeKey; grade: string }) {
  const badgeStyle = GRADE_BADGE_COLORS[gradeKey];
  return (
    <View style={[styles.gradeBadge, { backgroundColor: badgeStyle.bg }]}>
      <MaterialCommunityIcons
        name={
          gradeKey === "sahih" ? "check-decagram" :
          gradeKey === "hasan" ? "check-circle-outline" :
          gradeKey === "daif" ? "alert-circle-outline" :
          gradeKey === "fabricated" ? "close-circle-outline" :
          "help-circle-outline"
        }
        size={12}
        color={badgeStyle.text}
        style={{ marginRight: 3 }}
      />
      <Text style={[styles.gradeBadgeText, { color: badgeStyle.text }]}>
        {badgeStyle.label}
      </Text>
    </View>
  );
}

/**
 * Main enrichment component — fetches and displays grading, explanation,
 * hints, word meanings, and attribution for a hadith.
 */
export default function HadeethEncEnrichment({
  collectionId,
  hadithNumber,
  hadithText,
  language = "en",
  compact = false,
}: HadeethEncEnrichmentProps) {
  const { colors } = useTheme();
  const [enrichment, setEnrichment] = useState<HadithEnrichment | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getHadithEnrichment(collectionId, hadithNumber, hadithText, language)
      .then((result) => {
        if (mounted) {
          setEnrichment(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [collectionId, hadithNumber, hadithText, language]);

  const toggleSection = useCallback((section: string) => {
    Haptics.selectionAsync().catch(() => {});
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }, []);

  // Loading state — show a subtle shimmer
  if (loading) {
    return compact ? null : (
      <View style={styles.loadingRow}>
        <ActivityIndicator size="small" color={colors.onSurfaceMuted} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceMuted }]}>
          Loading enrichment...
        </Text>
      </View>
    );
  }

  // No enrichment available — render nothing
  if (!enrichment) return null;

  // Compact mode: just return the grade badge (for inline use in card headers)
  if (compact) {
    return <GradeBadge gradeKey={enrichment.gradeKey} grade={enrichment.grade} />;
  }

  // Full enrichment view
  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      {/* Attribution line */}
      {enrichment.attribution ? (
        <View style={[styles.attributionRow, { backgroundColor: colors.surfaceSecondary }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={14} color={colors.onSurfaceMuted} />
          <Text style={[styles.attributionText, { color: colors.onSurfaceMuted }]}>
            {enrichment.attribution}
          </Text>
        </View>
      ) : null}

      {/* Reference line */}
      {enrichment.reference ? (
        <View style={styles.referenceRow}>
          <MaterialCommunityIcons name="format-quote-open" size={14} color={colors.onSurfaceMuted} />
          <Text style={[styles.referenceText, { color: colors.onSurfaceMuted }]}>
            {enrichment.reference}
          </Text>
        </View>
      ) : null}

      {/* Explanation section — collapsible */}
      {enrichment.explanation ? (
        <CollapsibleSection
          title="Explanation"
          icon="lightbulb-outline"
          expanded={expandedSections.has("explanation")}
          onToggle={() => toggleSection("explanation")}
          colors={colors}
        >
          <Text style={[styles.explanationText, { color: colors.onSurface }]}>
            {enrichment.explanation}
          </Text>
        </CollapsibleSection>
      ) : null}

      {/* Hints / Key Benefits — collapsible */}
      {enrichment.hints.length > 0 ? (
        <CollapsibleSection
          title="Key Benefits"
          icon="star-outline"
          expanded={expandedSections.has("hints")}
          onToggle={() => toggleSection("hints")}
          colors={colors}
        >
          {enrichment.hints.map((hint, index) => (
            <View key={index} style={styles.hintRow}>
              <Text style={[styles.hintBullet, { color: colors.brand }]}>•</Text>
              <Text style={[styles.hintText, { color: colors.onSurface }]}>{hint}</Text>
            </View>
          ))}
        </CollapsibleSection>
      ) : null}

      {/* Word Meanings — collapsible */}
      {enrichment.wordsMeanings.length > 0 ? (
        <CollapsibleSection
          title="Word Meanings"
          icon="translate"
          expanded={expandedSections.has("words")}
          onToggle={() => toggleSection("words")}
          colors={colors}
        >
          {enrichment.wordsMeanings.map((wm, index) => (
            <View key={index} style={styles.wordRow}>
              <Text style={[styles.wordTerm, { color: colors.brand }]}>{wm.word}</Text>
              <Text style={[styles.wordMeaning, { color: colors.onSurface }]}>{wm.meaning}</Text>
            </View>
          ))}
        </CollapsibleSection>
      ) : null}

      {/* Source attribution footer */}
      <View style={styles.sourceRow}>
        <MaterialCommunityIcons name="shield-check-outline" size={12} color={colors.onSurfaceMuted} />
        <Text style={[styles.sourceText, { color: colors.onSurfaceMuted }]}>
          Source: HadeethEnc.com
        </Text>
      </View>
    </View>
  );
}

// ── Collapsible Section Sub-component ───────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  colors,
  children,
}: {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  colors: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { borderColor: colors.border }]}>
      <Pressable
        onPress={onToggle}
        style={[styles.sectionHeader, { backgroundColor: colors.surfaceSecondary }]}
        hitSlop={4}
      >
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons
            name={icon as any}
            size={16}
            color={colors.brand}
          />
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{title}</Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.onSurfaceMuted}
        />
      </Pressable>
      {expanded && (
        <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
          {children}
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    opacity: 0.6,
  },
  loadingText: {
    fontSize: 12,
  },

  // Grade badge
  gradeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gradeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Attribution
  attributionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  attributionText: {
    fontSize: 12,
    fontWeight: "500",
    fontStyle: "italic",
    flex: 1,
  },

  // Reference
  referenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  referenceText: {
    fontSize: 11,
    fontWeight: "500",
    flex: 1,
  },

  // Collapsible sections
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // Explanation
  explanationText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Hints
  hintRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  hintBullet: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },

  // Word meanings
  wordRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  wordTerm: {
    fontSize: 12,
    fontWeight: "700",
    minWidth: 80,
  },
  wordMeaning: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },

  // Source footer
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 6,
    opacity: 0.5,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
