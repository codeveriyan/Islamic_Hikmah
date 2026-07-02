import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "islamic-hikmah:theme:v1";

const dark = {
  mode: "dark" as Mode,
  surface: "#0B1120",
  surfaceSecondary: "#151E32",
  surfaceTertiary: "#1E293B",
  onSurface: "#F8FAFC",
  onSurfaceMuted: "#94A3B8",
  onSurfaceSecondary: "#E2E8F0",
  border: "#1E293B",
  brand: "#C5A880",
  onBrandPrimary: "#1A150D",
  brandSecondary: "#14B8A6",
  error: "#EF4444",
  success: "#10B981",
};

const light = {
  mode: "light" as Mode,
  surface: "#F8FAFC",
  surfaceSecondary: "#FFFFFF",
  surfaceTertiary: "#E2E8F0",
  onSurface: "#0B1120",
  onSurfaceMuted: "#64748B",
  onSurfaceSecondary: "#334155",
  border: "#E2E8F0",
  brand: "#A07C4F",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#0F766E",
  error: "#DC2626",
  success: "#059669",
};

type Mode = "light" | "dark";
type LangCode = "en" | "ta" | "hi" | "ur" | "te" | "kn" | "ml";
type FontSize = "small" | "medium" | "large";
type FontColor = "default" | "gold" | "green" | "sepia";

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
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>("dark");
  const [language, setLanguageState] = useState<LangCode>("en");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [fontColor, setFontColorState] = useState<FontColor>("default");

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

  const colors = mode === "dark" ? dark : light;
  return (
    <ThemeCtx.Provider value={{ mode, colors, setMode, language, setLanguage, fontSize, setFontSize, fontColor, setFontColor }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => useContext(ThemeCtx);
