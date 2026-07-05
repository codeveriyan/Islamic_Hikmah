import { useTheme } from "@/src/ThemeContext";

/**
 * Returns the React Native fontFamily string for the currently selected
 * Arabic font type. Use this in every screen that renders Arabic text so
 * changing the font in Quick Settings propagates everywhere instantly.
 *
 * Usage:
 *   const arabicFontFamily = useArabicFont();
 *   <Text style={{ fontFamily: arabicFontFamily }}>بِسْمِ اللهِ</Text>
 */
export function useArabicFont(): string {
  const { arabicFont } = useTheme();
  switch (arabicFont) {
    case "uthmani": return "ScheherazadeNew";
    case "naskh":   return "NotoNaskhArabic";
    case "indopak":
    default:        return "AmiriBold";
  }
}

/** Standalone helper — use when you have the font type string directly */
export function getFontFamilyForType(type: string): string {
  switch (type) {
    case "uthmani": return "ScheherazadeNew";
    case "naskh":   return "NotoNaskhArabic";
    case "indopak":
    default:        return "AmiriBold";
  }
}
