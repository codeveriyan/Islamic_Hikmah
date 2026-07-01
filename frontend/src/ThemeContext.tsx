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
type Ctx = {
  mode: Mode;
  colors: typeof dark;
  setMode: (m: Mode) => void;
  language: "en" | "ta";
  setLanguage: (lang: "en" | "ta") => void;
};

const ThemeCtx = createContext<Ctx>({
  mode: "dark",
  colors: dark,
  setMode: () => {},
  language: "en",
  setLanguage: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<Mode>("dark");
  const [language, setLanguageState] = useState<"en" | "ta">("en");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v === "light" || v === "dark") setModeState(v);
    });
    AsyncStorage.getItem("islamic_hikmah:language_preference").then((l) => {
      if (l === "en" || l === "ta") setLanguageState(l as "en" | "ta");
    });
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    AsyncStorage.setItem(KEY, m);
  };

  const setLanguage = (lang: "en" | "ta") => {
    setLanguageState(lang);
    AsyncStorage.setItem("islamic_hikmah:language_preference", lang);
  };

  const colors = mode === "dark" ? dark : light;
  return (
    <ThemeCtx.Provider value={{ mode, colors, setMode, language, setLanguage }}>
      {children}
    </ThemeCtx.Provider>
  );
};

export const useTheme = () => useContext(ThemeCtx);
