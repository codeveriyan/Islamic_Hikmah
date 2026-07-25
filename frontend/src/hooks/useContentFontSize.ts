import { useTheme } from "@/src/ThemeContext";

/**
 * Returns scaled font-size and line-height values for content screens
 * (Hadith, Seerah, Dua, Quran) based on the user''s global fontSize preference.
 *
 * small  => base 15px   arabic 22px
 * medium => base 17px   arabic 26px   (default)
 * large  => base 19px   arabic 30px
 */
export function useContentFontSize() {
  const { fontSize } = useTheme();

  const scale = fontSize === "small" ? 0 : fontSize === "large" ? 2 : 1;

  // English / Translation body
  const bodySize       = [15, 17, 19][scale];
  const bodyLineHeight = [26, 29, 33][scale];   // ratio >= 1.72x

  // Translation / secondary text
  const transSize       = [14, 16, 18][scale];
  const transLineHeight = [24, 27, 31][scale];  // ratio >= 1.70x

  // Arabic text
  const arabicSize       = [22, 26, 30][scale];
  const arabicLineHeight = [40, 46, 54][scale]; // ratio >= 1.80x

  // Label / caption text (badge, reference, chapter meta)
  const labelSize = [12, 13, 14][scale];

  return {
    bodySize,
    bodyLineHeight,
    transSize,
    transLineHeight,
    arabicSize,
    arabicLineHeight,
    labelSize,
    /** Letter spacing for English body */
    letterSpacing: 0.15,
    /** Arabic text slightly negative spacing for Naskh/IndoPak */
    arabicLetterSpacing: -0.3,
  } as const;
}
