import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "islamic-hikmah:theme:v1";

const dark = {
  mode: "dark" as Mode,
  // Rich deep navy blue — matches the reference "A Life With Allah" app style.
  // NOT pure black (#000) or near-black (#0B1120) — a warm deep blue makes
  // Arabic text far easier to read and feels more premium.
  surface: "#0D2137",           // main background — deep navy
  surfaceSecondary: "#112840",  // card backgrounds — slightly lighter navy
  surfaceTertiary: "#163351",   // borders, dividers — mid navy
  onSurface: "#FFFFFF",         // primary text — pure white for max contrast
  onSurfaceMuted: "#8BAFC8",    // secondary text — muted blue-white
  onSurfaceSecondary: "#C8DFF0",// body text — light blue-white
  border: "#1A3A55",            // subtle borders
  brand: "#C5A880",             // gold accent (kept)
  onBrandPrimary: "#0D2137",    // text on gold buttons
  brandSecondary: "#14B8A6",    // teal accent (kept)
  error: "#EF4444",
  success: "#10B981",
};

const light = {
  mode: "light" as Mode,
  // Pure white background with crisp near-black text — clean and readable.
  surface: "#FFFFFF",           // pure white main background
  surfaceSecondary: "#F5F7FA",  // very light grey for cards
  surfaceTertiary: "#E8EDF2",   // slightly darker for dividers
  onSurface: "#0F172A",         // near-black text — maximum contrast
  onSurfaceMuted: "#4B5563",    // secondary text — dark grey
  onSurfaceSecondary: "#1E293B",// body text — dark slate
  border: "#E2E8F0",            // light grey borders
  brand: "#A07C4F",             // warm gold accent
  onBrandPrimary: "#FFFFFF",    // white text on gold
  brandSecondary: "#0F766E",    // teal accent
  error: "#DC2626",
  success: "#059669",
};

type Mode = "light" | "dark";
type LangCode = "en" | "ta" | "hi" | "ur" | "te" | "kn" | "ml";
type FontSize = "small" | "medium" | "large";
type FontColor = "default" | "gold" | "green" | "sepia";
export type ArabicFontType = "indopak" | "uthmani" | "naskh";

type Ctx = {
  mode: Mode;
  colors: typeof dark;
  setMode: (m: Mode) => void;
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  fontColor: FontColor;
  setFontColor: (color: FontColor) => void;
  arabicFont: ArabicFontType;
  setArabicFont: (f: ArabicFontType) => void;
};

const ThemeCtx = createContext<Ctx>({
  mode: "dark",
  colors: dark,
  setMode: () => {},
  language: "en",
  setLanguage: () => {},
  fontSize: "medium",
  setFontSize: () => {},
  fontColor: "default",
  setFontColor: () => {},
  arabicFont: "indopak",
  setArabicFont: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>("dark");
  const [language, setLanguageState] = useState<LangCode>("en");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [fontColor, setFontColorState] = useState<FontColor>("default");
  const [arabicFont, setArabicFontState] = useState<ArabicFontType>("indopak");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === "light" || v === "dark") setModeState(v);
    });
    AsyncStorage.getItem("islamic_hikmah:language_preference").then((l) => {
      if (l) setLanguageState(l as LangCode);
    });
    AsyncStorage.getItem("islamic_hikmah:font_size_pref").then((s) => {
      if (s) setFontSizeState(s as FontSize);
    });
    AsyncStorage.getItem("islamic_hikmah:font_color_pref").then((c) => {
      if (c) setFontColorState(c as FontColor);
    });
    AsyncStorage.getItem("islamic_hikmah:quran_font_type").then((f) => {
      if (f) setArabicFontState(f as ArabicFontType);
    });
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m);
  };

  const setLanguage = (lang: LangCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem("islamic_hikmah:language_preference", lang);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    AsyncStorage.setItem("islamic_hikmah:font_size_pref", size);
  };

  const setFontColor = (color: FontColor) => {
    setFontColorState(color);
    AsyncStorage.setItem("islamic_hikmah:font_color_pref", color);
  };

  const setArabicFont = (f: ArabicFontType) => {
    setArabicFontState(f);
    AsyncStorage.setItem("islamic_hikmah:quran_font_type", f);
  };

  const colors = mode === "dark" ? dark : light;
  return (
    <ThemeCtx.Provider value={{ mode, colors, setMode, language, setLanguage, fontSize, setFontSize, fontColor, setFontColor, arabicFont, setArabicFont }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => useContext(ThemeCtx);
