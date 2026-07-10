import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LangCode } from "@/src/data/quran/translationLanguages";

const KEY = "islamic-hikmah:theme:v1";

const dark = {
  mode: "dark" as Mode,
  // WhatsApp Dark theme colors
  surface: "#0b141a",           // main background — WhatsApp dark background
  surfaceSecondary: "#111b21",  // card backgrounds — WhatsApp bubble/card dark
  surfaceTertiary: "#202c33",   // borders, dividers
  onSurface: "#e9edef",         // primary text — high contrast off-white
  onSurfaceMuted: "#8696a0",    // secondary text — WhatsApp muted grey
  onSurfaceSecondary: "#d1d7db",// body text — light grey
  border: "#222e35",            // borders
  brand: "#00a884",             // WhatsApp teal-green brand accent
  onBrandPrimary: "#0b141a",    // text on brand buttons
  brandSecondary: "#005c4b",    // dark green secondary
  error: "#f15c6d",
  success: "#00a884",
};

const light = {
  mode: "light" as Mode,
  // WhatsApp Light theme colors
  surface: "#ffffff",           // main background
  surfaceSecondary: "#f0f2f5",  // cards background
  surfaceTertiary: "#e9edef",   // dividers/borders
  onSurface: "#111b21",         // deep slate/black text
  onSurfaceMuted: "#667781",    // muted text
  onSurfaceSecondary: "#3b4a54",// body text
  border: "#dfe5e7",            // light borders
  brand: "#008069",             // WhatsApp green accent
  onBrandPrimary: "#ffffff",    // white text on brand buttons
  brandSecondary: "#075e54",    // deep dark green
  error: "#ea0038",
  success: "#008069",
};

type Mode = "light" | "dark";
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
    AsyncStorage.setItem("islamic_hikmah:quran_translation_lang", lang);
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
