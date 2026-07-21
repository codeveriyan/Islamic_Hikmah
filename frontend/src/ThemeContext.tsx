import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LangCode } from "@/src/data/quran/translationLanguages";

export type Mode = "light" | "dark";
type FontSize = "small" | "medium" | "large";
type FontColor = "default" | "gold" | "green" | "sepia";
export type ArabicFontType = "indopak" | "uthmani" | "naskh";
export type AppThemeId = "classic" | "emerald" | "midnight" | "royal" | "desert" | "rose";

export type AppColors = {
  mode: Mode;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  onSurface: string;
  onSurfaceMuted: string;
  onSurfaceSecondary: string;
  border: string;
  brand: string;
  onBrandPrimary: string;
  brandSecondary: string;
  error: string;
  success: string;
};

type PalettePair = { light: AppColors; dark: AppColors };

const palette = (mode: Mode, values: Omit<AppColors, "mode">): AppColors => ({ mode, ...values });

export const APP_THEMES: Record<AppThemeId, { name: string; description: string; preview: [string, string, string]; colors: PalettePair }> = {
  classic: {
    name: "Classic",
    description: "Clean teal",
    preview: ["#008069", "#F0F2F5", "#0B141A"],
    colors: {
      light: palette("light", { surface: "#FFFFFF", surfaceSecondary: "#F0F2F5", surfaceTertiary: "#E9EDEF", onSurface: "#111B21", onSurfaceMuted: "#667781", onSurfaceSecondary: "#3B4A54", border: "#DFE5E7", brand: "#008069", onBrandPrimary: "#FFFFFF", brandSecondary: "#075E54", error: "#EA0038", success: "#008069" }),
      dark: palette("dark", { surface: "#0B141A", surfaceSecondary: "#111B21", surfaceTertiary: "#202C33", onSurface: "#E9EDEF", onSurfaceMuted: "#8696A0", onSurfaceSecondary: "#D1D7DB", border: "#222E35", brand: "#00A884", onBrandPrimary: "#062B24", brandSecondary: "#005C4B", error: "#F15C6D", success: "#00A884" }),
    },
  },
  emerald: {
    name: "Emerald",
    description: "Mosque green",
    preview: ["#047857", "#ECFDF5", "#052E2B"],
    colors: {
      light: palette("light", { surface: "#F7FFFB", surfaceSecondary: "#EAF8F1", surfaceTertiary: "#D7F0E4", onSurface: "#10251D", onSurfaceMuted: "#5D756B", onSurfaceSecondary: "#304C40", border: "#CBE6D9", brand: "#047857", onBrandPrimary: "#FFFFFF", brandSecondary: "#065F46", error: "#C2414D", success: "#047857" }),
      dark: palette("dark", { surface: "#061C18", surfaceSecondary: "#0B2923", surfaceTertiary: "#123A31", onSurface: "#ECFDF5", onSurfaceMuted: "#8DB5A5", onSurfaceSecondary: "#C1E4D6", border: "#17483B", brand: "#34D399", onBrandPrimary: "#052E24", brandSecondary: "#0F766E", error: "#FB7185", success: "#34D399" }),
    },
  },
  midnight: {
    name: "Midnight",
    description: "Deep blue",
    preview: ["#2563EB", "#EFF6FF", "#081426"],
    colors: {
      light: palette("light", { surface: "#F8FAFF", surfaceSecondary: "#EDF3FC", surfaceTertiary: "#DFE8F7", onSurface: "#132238", onSurfaceMuted: "#617087", onSurfaceSecondary: "#344967", border: "#D2DEEF", brand: "#2563EB", onBrandPrimary: "#FFFFFF", brandSecondary: "#1D4ED8", error: "#DC3652", success: "#0F9F75" }),
      dark: palette("dark", { surface: "#07111F", surfaceSecondary: "#0D1B2E", surfaceTertiary: "#172943", onSurface: "#EDF5FF", onSurfaceMuted: "#8EA4C1", onSurfaceSecondary: "#C7D8ED", border: "#1D3351", brand: "#60A5FA", onBrandPrimary: "#08172A", brandSecondary: "#1E40AF", error: "#FB7185", success: "#34D399" }),
    },
  },
  royal: {
    name: "Royal",
    description: "Purple & gold",
    preview: ["#7C3AED", "#FAF5FF", "#1D102E"],
    colors: {
      light: palette("light", { surface: "#FFFBFF", surfaceSecondary: "#F5EEFB", surfaceTertiary: "#EADDF5", onSurface: "#281B33", onSurfaceMuted: "#766582", onSurfaceSecondary: "#4D3B5A", border: "#E2D2ED", brand: "#7C3AED", onBrandPrimary: "#FFFFFF", brandSecondary: "#5B21B6", error: "#CF3F59", success: "#148466" }),
      dark: palette("dark", { surface: "#160C22", surfaceSecondary: "#211130", surfaceTertiary: "#332047", onSurface: "#FAF5FF", onSurfaceMuted: "#B5A1C3", onSurfaceSecondary: "#E1D2EB", border: "#422A59", brand: "#C084FC", onBrandPrimary: "#251034", brandSecondary: "#7E22CE", error: "#FB7185", success: "#4ADE80" }),
    },
  },
  desert: {
    name: "Desert",
    description: "Warm sand",
    preview: ["#B45309", "#FFF8E7", "#2A1B10"],
    colors: {
      light: palette("light", { surface: "#FFFCF5", surfaceSecondary: "#F8EEDB", surfaceTertiary: "#EFDDBD", onSurface: "#33251A", onSurfaceMuted: "#806D5B", onSurfaceSecondary: "#574435", border: "#E6D2AF", brand: "#B45309", onBrandPrimary: "#FFFFFF", brandSecondary: "#92400E", error: "#C83E4D", success: "#42855B" }),
      dark: palette("dark", { surface: "#1E140D", surfaceSecondary: "#2A1D13", surfaceTertiary: "#3D2A1B", onSurface: "#FFF7E8", onSurfaceMuted: "#BDA58C", onSurfaceSecondary: "#E7D3BA", border: "#503720", brand: "#FBBF24", onBrandPrimary: "#382309", brandSecondary: "#B45309", error: "#FB7185", success: "#86C995" }),
    },
  },
  rose: {
    name: "Rose",
    description: "Soft burgundy",
    preview: ["#BE185D", "#FFF1F5", "#2A101D"],
    colors: {
      light: palette("light", { surface: "#FFFAFC", surfaceSecondary: "#FCECF2", surfaceTertiary: "#F5DCE6", onSurface: "#321B25", onSurfaceMuted: "#80616E", onSurfaceSecondary: "#593A47", border: "#EDCFDB", brand: "#BE185D", onBrandPrimary: "#FFFFFF", brandSecondary: "#9D174D", error: "#D42D4D", success: "#27866A" }),
      dark: palette("dark", { surface: "#210D16", surfaceSecondary: "#2E121F", surfaceTertiary: "#431B2D", onSurface: "#FFF1F5", onSurfaceMuted: "#C39AAA", onSurfaceSecondary: "#E9C9D5", border: "#56243A", brand: "#F472B6", onBrandPrimary: "#35101F", brandSecondary: "#9D174D", error: "#FB7185", success: "#4ADE80" }),
    },
  },
};

type Ctx = {
  mode: Mode;
  colors: AppColors;
  setMode: (mode: Mode) => void;
  themeId: AppThemeId;
  setThemeId: (theme: AppThemeId) => void;
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  fontColor: FontColor;
  setFontColor: (color: FontColor) => void;
  arabicFont: ArabicFontType;
  setArabicFont: (font: ArabicFontType) => void;
};

const ThemeCtx = createContext<Ctx>({
  mode: "dark", colors: APP_THEMES.classic.colors.dark, setMode: () => {},
  themeId: "classic", setThemeId: () => {}, language: "en", setLanguage: () => {},
  fontSize: "medium", setFontSize: () => {}, fontColor: "default", setFontColor: () => {},
  arabicFont: "indopak", setArabicFont: () => {},
});

const MODE_KEY = "hikmah:theme:mode:v1";
const PALETTE_KEY = "hikmah:theme:palette:v1";
const LANG_KEY = "hikmah:theme:language:v1";
const FONT_SIZE_KEY = "hikmah:theme:font_size:v1";
const FONT_COLOR_KEY = "hikmah:theme:font_color:v1";
const ARABIC_FONT_KEY = "hikmah:theme:arabic_font:v1";

const getItemWithFallback = async (key: string, legacyKeys: string[]) => {
  try {
    let val = await AsyncStorage.getItem(key);
    if (!val) {
      for (const legacyKey of legacyKeys) {
        val = await AsyncStorage.getItem(legacyKey);
        if (val) {
          await AsyncStorage.setItem(key, val);
          break;
        }
      }
    }
    return val;
  } catch {
    return null;
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>("dark");
  const [themeId, setThemeIdState] = useState<AppThemeId>("classic");
  const [language, setLanguageState] = useState<LangCode>("en");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [fontColor, setFontColorState] = useState<FontColor>("default");
  const [arabicFont, setArabicFontState] = useState<ArabicFontType>("indopak");
  // Prevent rendering children until prefs are loaded — eliminates the dark→user-theme flash
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    // Load all preferences with legacy fallback in one parallel batch before first paint
    Promise.all([
      getItemWithFallback(MODE_KEY, ["islamic-hikmah:theme:v1"]),
      getItemWithFallback(PALETTE_KEY, ["islamic-hikmah:palette:v1"]),
      getItemWithFallback(LANG_KEY, ["islamic_hikmah:language_preference", "islamic-hikmah:language"]),
      getItemWithFallback(FONT_SIZE_KEY, ["islamic_hikmah:font_size_pref"]),
      getItemWithFallback(FONT_COLOR_KEY, ["islamic_hikmah:font_color_pref"]),
      getItemWithFallback(ARABIC_FONT_KEY, ["islamic_hikmah:quran_font_type"]),
    ]).then(([modeVal, paletteVal, langVal, fontSizeVal, fontColorVal, arabicFontVal]) => {
      if (modeVal === "light" || modeVal === "dark") setModeState(modeVal);
      if (paletteVal && paletteVal in APP_THEMES) setThemeIdState(paletteVal as AppThemeId);
      if (langVal) setLanguageState(langVal as LangCode);
      if (fontSizeVal) setFontSizeState(fontSizeVal as FontSize);
      if (fontColorVal) setFontColorState(fontColorVal as FontColor);
      if (arabicFontVal) setArabicFontState(arabicFontVal as ArabicFontType);
    }).catch(() => {
      // If AsyncStorage fails, render with defaults
    }).finally(() => {
      setPrefsLoaded(true);
    });
  }, []);

  const setMode = (value: Mode) => { setModeState(value); AsyncStorage.setItem(MODE_KEY, value); };
  const setThemeId = (value: AppThemeId) => { setThemeIdState(value); AsyncStorage.setItem(PALETTE_KEY, value); };
  const setLanguage = (value: LangCode) => { 
    setLanguageState(value); 
    AsyncStorage.setItem(LANG_KEY, value); 
    AsyncStorage.setItem("hikmah:quran_translation_lang", value); 
  };
  const setFontSize = (value: FontSize) => { setFontSizeState(value); AsyncStorage.setItem(FONT_SIZE_KEY, value); };
  const setFontColor = (value: FontColor) => { setFontColorState(value); AsyncStorage.setItem(FONT_COLOR_KEY, value); };
  const setArabicFont = (value: ArabicFontType) => { setArabicFontState(value); AsyncStorage.setItem(ARABIC_FONT_KEY, value); };
  const colors = useMemo(() => APP_THEMES[themeId].colors[mode], [themeId, mode]);

  // Render nothing until prefs load — splash screen is already visible during this gap
  if (!prefsLoaded) return null;

  return (
    <ThemeCtx.Provider value={{ mode, colors, setMode, themeId, setThemeId, language, setLanguage, fontSize, setFontSize, fontColor, setFontColor, arabicFont, setArabicFont }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => useContext(ThemeCtx);
