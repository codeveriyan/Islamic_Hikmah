import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Switch, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { APP_THEMES, AppThemeId, useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPrayerSettings, schedulePrayerNotifications } from "@/src/storage";

type SettingItem = {
  id: string;
  label: string;
  subtext: string;
  icon: string;
};

const ITEMS: SettingItem[] = [
  {
    id: "notifications",
    label: "Notifications",
    subtext: "Daily Notifications, Reminder Notification, Article Notification, Notification Time",
    icon: "bell-outline",
  },
  {
    id: "appearance",
    label: "Appearance",
    subtext: "Theme, Arabic Font, Translation, Transliteration, Text Size & Preview",
    icon: "monitor",
  },
  {
    id: "audio",
    label: "Audio",
    subtext: "Audio Speed, Reciter, Download All Audio, Tasbih Counter Vibration",
    icon: "volume-high",
  },
  {
    id: "system",
    label: "System",
    subtext: "Download Over Wi-Fi, Check For Updates",
    icon: "cog-outline",
  },
  {
    id: "language",
    label: "Language",
    subtext: "Change the language across the app",
    icon: "translate",
  },
  {
    id: "more",
    label: "More",
    subtext: "FAQ, Tutorial Terms & Condition",
    icon: "file-document-outline",
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode, themeId, setThemeId, language, setLanguage, fontSize, setFontSize, fontColor, setFontColor } = useTheme();
  const { t } = useTranslation(language);
  const [activeItem, setActiveItem] = useState<SettingItem | null>(null);

  // User preference states
  const [dailyNotif, setDailyNotif] = useState(true);
  const [reminderNotif, setReminderNotif] = useState(true);
  const [articleNotif, setArticleNotif] = useState(true);

  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [transliterationEnabled, setTransliterationEnabled] = useState(true);
  const [transliterationType, setTransliterationType] = useState<"tajweed" | "syllables" | "wbw">("tajweed");

  const [audioSpeed, setAudioSpeed] = useState("1.0x");
  const [tasbihVibe, setTasbihVibe] = useState(true);

  const [downloadWifi, setDownloadWifi] = useState(true);

  const getLanguageName = (code: string) => {
    switch (code) {
      case "ta": return "Tamil (தமிழ்)";
      case "hi": return "Hindi (हिन्दी)";
      case "ur": return "Urdu (اردو)";
      case "te": return "Telugu (తెలుగు)";
      case "kn": return "Kannada (ಕನ್ನಡ)";
      case "ml": return "Malayalam (മലയാളം)";
      case "bn": return "Bengali (বাংলা)";
      case "gu": return "Gujarati (ગુજરાતી)";
      case "mr": return "Marathi (मराठी)";
      case "pa": return "Punjabi (ਪੰਜਾਬੀ)";
      case "ar": return "Arabic (العربية)";
      case "fr": return "French (Français)";
      case "es": return "Spanish (Español)";
      case "tr": return "Turkish (Türkçe)";
      case "id": return "Indonesian (Bahasa Indonesia)";
      case "ru": return "Russian (Русский)";
      case "fa": return "Persian / Farsi (فارسی)";
      case "ha": return "Hausa (هَوُسَ)";
      case "so": return "Somali (Soomaali)";
      case "ms": return "Malay (Bahasa Melayu)";
      case "uz": return "Uzbek (Oʻzbekcha)";
      case "yo": return "Yoruba (Yorùbá)";
      case "ps": return "Pashto (پښتو)";
      default: return "English";
    }
  };
  const [bgAzaan, setBgAzaan] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("background_azaan_enabled").then((val) => {
      if (val !== null) setBgAzaan(val !== "false");
    });
    AsyncStorage.getItem("islamic_hikmah:quran_show_translation").then((val) => {
      if (val !== null) setTranslationEnabled(val === "true");
    });
    AsyncStorage.getItem("islamic_hikmah:quran_show_transliteration").then((val) => {
      if (val !== null) setTransliterationEnabled(val === "true");
    });
    AsyncStorage.getItem("islamic_hikmah:transliteration_type").then((val) => {
      if (val === "syllables" || val === "wbw" || val === "tajweed") {
        setTransliterationType(val as any);
      }
    });
  }, []);

  const handleToggleTranslation = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTranslationEnabled(val);
    await AsyncStorage.setItem("islamic_hikmah:quran_show_translation", String(val));
  };

  const handleToggleTransliteration = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTransliterationEnabled(val);
    await AsyncStorage.setItem("islamic_hikmah:quran_show_transliteration", String(val));
  };

  const handleTransliterationTypeChange = async (type: "tajweed" | "syllables" | "wbw") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTransliterationType(type);
    await AsyncStorage.setItem("islamic_hikmah:transliteration_type", type);
  };

  const handleToggleBgAzaan = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBgAzaan(val);
    await AsyncStorage.setItem("background_azaan_enabled", val ? "true" : "false");
    try {
      const timingsRaw = await AsyncStorage.getItem("last_fetched_timings");
      if (timingsRaw) {
        const timings = JSON.parse(timingsRaw);
        const settings = await getPrayerSettings();
        const res = await schedulePrayerNotifications(timings, settings.adhanEnabled);
        if (!res.success && res.error === 'permission' && Platform.OS !== 'web') {
          Alert.alert(
            "Notification Permission Required",
            "Notification permissions are currently denied. Please enable them in settings to receive Adhan alerts.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (e) {
      console.error("Failed to reschedule background azaan:", e);
    }
  };

  const handleItemPress = (item: SettingItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveItem(item);
  };

  const renderModalContent = () => {
    if (!activeItem) return null;

    switch (activeItem.id) {
      case "notifications":
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Notification Settings</Text>
            
            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Daily Adhkar Alerts</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Receive morning/evening reminders</Text>
              </View>
              <Switch value={dailyNotif} onValueChange={setDailyNotif} trackColor={{ true: colors.brand }} />
            </View>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Reminder Notifications</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Custom habit goals notifications</Text>
              </View>
              <Switch value={reminderNotif} onValueChange={setReminderNotif} trackColor={{ true: colors.brand }} />
            </View>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>New Articles Alerts</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Notify when new articles are posted</Text>
              </View>
              <Switch value={articleNotif} onValueChange={setArticleNotif} trackColor={{ true: colors.brand }} />
            </View>

            <Pressable onPress={() => { setActiveItem(null); router.push("/reminder"); }} style={[styles.btn, { backgroundColor: colors.brand, marginTop: 24 }]}>
              <Text style={[styles.btnTxt, { color: colors.onBrandPrimary }]}>Configure Reminder Times</Text>
            </Pressable>
          </View>
        );

      case "appearance":
        const getPreviewTransSize = () => {
          if (fontSize === "small") return 12;
          if (fontSize === "large") return 18;
          return 14;
        };
        const getPreviewArabicSize = () => {
          if (fontSize === "small") return 20;
          if (fontSize === "large") return 32;
          return 26;
        };
        const getPreviewTextColor = () => {
          if (fontColor === "gold") return "#D97706";
          if (fontColor === "green") return "#10B981";
          if (fontColor === "sepia") return "#B45309";
          return colors.onSurfaceSecondary;
        };

        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Appearance Settings</Text>

            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>App Theme</Text>
            <View style={styles.themeGrid}>
              {(Object.keys(APP_THEMES) as AppThemeId[]).map((id) => {
                const item = APP_THEMES[id];
                const selected = themeId === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setThemeId(id);
                    }}
                    style={[
                      styles.themeCard,
                      { backgroundColor: colors.surfaceTertiary, borderColor: selected ? colors.brand : colors.border },
                      selected && { borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.themeSwatches}>
                      {item.preview.map((swatch) => <View key={swatch} style={[styles.themeSwatch, { backgroundColor: swatch }]} />)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.themeName, { color: colors.onSurface }]}>{item.name}</Text>
                      <Text style={[styles.themeDescription, { color: colors.onSurfaceMuted }]}>{item.description}</Text>
                    </View>
                    {selected && <MaterialCommunityIcons name="check-circle" size={19} color={colors.brand} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Dark Mode</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Toggle between light and dark theme</Text>
              </View>
              <Switch value={mode === "dark"} onValueChange={(val) => setMode(val ? "dark" : "light")} trackColor={{ true: colors.brand }} />
            </View>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Show Translation</Text>
              </View>
              <Switch value={translationEnabled} onValueChange={handleToggleTranslation} trackColor={{ true: colors.brand }} />
            </View>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Show Transliteration</Text>
              </View>
              <Switch value={transliterationEnabled} onValueChange={handleToggleTransliteration} trackColor={{ true: colors.brand }} />
            </View>

            {transliterationEnabled && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted, marginBottom: 8 }]}>Transliteration Style</Text>
                <View style={styles.speedRow}>
                  {[
                    { label: "Tajweed", value: "tajweed" as const },
                    { label: "Syllable", value: "syllables" as const },
                    { label: "Word-by-Word", value: "wbw" as const }
                  ].map((item) => (
                    <Pressable
                      key={item.value}
                      onPress={() => handleTransliterationTypeChange(item.value)}
                      style={[
                        styles.speedBtn,
                        { backgroundColor: transliterationType === item.value ? colors.brand : colors.surfaceTertiary }
                      ]}
                    >
                      <Text
                        style={[
                          styles.speedTxt,
                          { color: transliterationType === item.value ? colors.onBrandPrimary : colors.onSurface }
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted, marginTop: 16 }]}>Font Size</Text>
            <View style={[styles.speedRow, { marginBottom: 12 }]}>
              {(["small", "medium", "large"] as const).map((size) => (
                <Pressable
                  key={size}
                  onPress={() => setFontSize(size)}
                  style={[styles.speedBtn, { backgroundColor: fontSize === size ? colors.brand : colors.surfaceTertiary }]}
                >
                  <Text style={[styles.speedTxt, { color: fontSize === size ? colors.onBrandPrimary : colors.onSurface, textTransform: "capitalize" }]}>
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted }]}>Font Color</Text>
            <View style={[styles.speedRow, { marginBottom: 16 }]}>
              {(["default", "gold", "green", "sepia"] as const).map((col) => (
                <Pressable
                  key={col}
                  onPress={() => setFontColor(col)}
                  style={[styles.speedBtn, { backgroundColor: fontColor === col ? colors.brand : colors.surfaceTertiary }]}
                >
                  <Text style={[styles.speedTxt, { color: fontColor === col ? colors.onBrandPrimary : colors.onSurface, textTransform: "capitalize" }]}>
                    {col}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <View style={[styles.previewBox, { backgroundColor: colors.surfaceTertiary, marginTop: 8 }]}>
              <Text style={[styles.previewLabel, { color: colors.brand }]}>PREVIEW</Text>
              <Text style={[styles.arabicPreview, { color: colors.onSurface, fontSize: getPreviewArabicSize() }]}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
              {translationEnabled && (
                <Text style={[styles.transPreview, { color: getPreviewTextColor(), fontSize: getPreviewTransSize() }]}>
                  In the name of God, the Most Gracious, the Dispenser of Grace.
                </Text>
              )}
              {transliterationEnabled && (
                <Text style={[styles.transPreview, { color: colors.brand, fontSize: getPreviewTransSize(), marginTop: 6 }]}>
                  {transliterationType === "syllables"
                    ? "bis-mil  la-hhir  rah-man-nir  raheem"
                    : transliterationType === "wbw"
                    ? "bis'mi l-lahi l-raḥmāni l-raḥīmi"
                    : "Bismil laahir Rahmaanir Raheem"}
                </Text>
              )}
            </View>
          </View>
        );

      case "audio":
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Audio Settings</Text>

            <Text style={[styles.sectionLabel, { color: colors.onSurfaceMuted, marginTop: 12 }]}>Recitation Speed</Text>
            <View style={styles.speedRow}>
              {["0.8x", "1.0x", "1.25x", "1.5x"].map((speed) => (
                <Pressable
                  key={speed}
                  onPress={() => setAudioSpeed(speed)}
                  style={[styles.speedBtn, { backgroundColor: audioSpeed === speed ? colors.brand : colors.surfaceTertiary }]}
                >
                  <Text style={[styles.speedTxt, { color: audioSpeed === speed ? colors.onBrandPrimary : colors.onSurface }]}>
                    {speed}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.optionRow, { marginTop: 24 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Tasbih Vibration</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Haptic feedback on Tasbih counter tap</Text>
              </View>
              <Switch value={tasbihVibe} onValueChange={setTasbihVibe} trackColor={{ true: colors.brand }} />
            </View>

            <View style={[styles.optionRow, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Play Azaan in Background</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Play full Azaan alarm when app is closed</Text>
              </View>
              <Switch value={bgAzaan} onValueChange={handleToggleBgAzaan} trackColor={{ true: colors.brand }} />
            </View>

            <Pressable onPress={() => setActiveItem(null)} style={[styles.btn, { backgroundColor: colors.brand, marginTop: 24 }]}>
              <Text style={[styles.btnTxt, { color: colors.onBrandPrimary }]}>Save Preferences</Text>
            </Pressable>
          </View>
        );

      case "system":
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>System Settings</Text>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Download Over Wi-Fi Only</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Saves mobile data for Quran recitations</Text>
              </View>
              <Switch value={downloadWifi} onValueChange={setDownloadWifi} trackColor={{ true: colors.brand }} />
            </View>

            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                alert("App is up to date! v1.1.0");
              }}
              style={[styles.rowButton, { backgroundColor: colors.surfaceTertiary, marginTop: 16 }]}
            >
              <MaterialCommunityIcons name="cloud-check-outline" size={22} color={colors.brand} />
              <Text style={[styles.rowButtonTxt, { color: colors.onSurface }]}>Check For Updates</Text>
            </Pressable>
          </View>
        );

      case "language":
        return (
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface, marginBottom: 12 }]}>Change Language</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ width: "100%" }}>
              {[
                { name: "English", code: "en" as const },
                { name: "Arabic (العربية)", code: "ar" as const },
                { name: "Bengali (বাংলা)", code: "bn" as const },
                { name: "French (Français)", code: "fr" as const },
                { name: "Gujarati (ગુજરાતી)", code: "gu" as const },
                { name: "Hausa (هَوُسَ)", code: "ha" as const },
                { name: "Hindi (हिन्दी)", code: "hi" as const },
                { name: "Indonesian (Bahasa Indonesia)", code: "id" as const },
                { name: "Kannada (ಕನ್ನಡ)", code: "kn" as const },
                { name: "Malayalam (മലയാളം)", code: "ml" as const },
                { name: "Malay (Bahasa Melayu)", code: "ms" as const },
                { name: "Marathi (मраठी)", code: "mr" as const },
                { name: "Pashto (پښتو)", code: "ps" as const },
                { name: "Persian / Farsi (فارسی)", code: "fa" as const },
                { name: "Punjabi (ਪੰਜਾਬੀ)", code: "pa" as const },
                { name: "Russian (Русский)", code: "ru" as const },
                { name: "Somali (Soomaali)", code: "so" as const },
                { name: "Spanish (Español)", code: "es" as const },
                { name: "Tamil (தமிழ்)", code: "ta" as const },
                { name: "Telugu (తెలుగు)", code: "te" as const },
                { name: "Turkish (Türkçe)", code: "tr" as const },
                { name: "Urdu (اردو)", code: "ur" as const },
                { name: "Uzbek (Oʻzbekcha)", code: "uz" as const },
                { name: "Yoruba (Yorùbá)", code: "yo" as const }
              ].map((lang) => (
                <Pressable
                  key={lang.code}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setLanguage(lang.code as any);
                  }}
                  style={[styles.langRow, { backgroundColor: language === lang.code ? colors.brand + "18" : "transparent" }]}
                >
                  <Text style={[styles.langTxt, { color: colors.onSurface }, language === lang.code && { color: colors.brand, fontWeight: "700" }]}>
                    {lang.name}
                  </Text>
                  {language === lang.code && <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        );

      case "more":
        return (
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>About & Legals</Text>

            <Text style={[styles.sectionLabel, { color: colors.brand, marginTop: 12 }]}>FAQ</Text>
            <Text style={[styles.paragraph, { color: colors.onSurfaceSecondary }]}>
              Q: Does Islamic Hikmah work fully offline?{"\n"}
              A: Yes, all Du&apos;as, Dhikr counts, and downloaded Quran contents are saved locally.
            </Text>
            <Text style={[styles.paragraph, { color: colors.onSurfaceSecondary }]}>
              Q: How are prayer times calculated?{"\n"}
              A: Based on your current GPS location and chosen calculation method (e.g. MWL, Umm Al-Qura).
            </Text>

            <Text style={[styles.sectionLabel, { color: colors.brand, marginTop: 16 }]}>Terms &amp; Conditions</Text>
            <Text style={[styles.paragraph, { color: colors.onSurfaceMuted, fontSize: 12 }]}>
              Islamic Hikmah is provided for educational and spiritual purposes. We do not store or collect any location or personal data on external servers.
            </Text>

            <Pressable onPress={() => setActiveItem(null)} style={[styles.btn, { backgroundColor: colors.brand, marginTop: 24 }]}>
              <Text style={[styles.btnTxt, { color: colors.onBrandPrimary }]}>Close</Text>
            </Pressable>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="settings-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>{t("settings")}</Text>
        <Pressable onPress={() => router.replace("/(tabs)")} hitSlop={10} testID="settings-home">
          <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        {/* Quick Settings Section */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: colors.brand, marginBottom: 12 }}>
            Quick Settings
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {/* 1. Dark Mode */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setMode(mode === "dark" ? "light" : "dark");
              }}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.surfaceSecondary,
                padding: 12,
                borderRadius: theme.radius.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name={mode === "dark" ? "weather-night" : "weather-sunny"} size={20} color={colors.brand} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>Dark Mode</Text>
              </View>
              <Switch
                value={mode === "dark"}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setMode(mode === "dark" ? "light" : "dark");
                }}
                trackColor={{ true: colors.brand }}
              />
            </Pressable>

            {/* 2. Background Azaan */}
            <Pressable
              onPress={() => handleToggleBgAzaan(!bgAzaan)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.surfaceSecondary,
                padding: 12,
                borderRadius: theme.radius.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="bell-ring-outline" size={20} color={colors.brand} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>Adhan Alert</Text>
              </View>
              <Switch
                value={bgAzaan}
                onValueChange={(v) => handleToggleBgAzaan(v)}
                trackColor={{ true: colors.brand }}
              />
            </Pressable>

            {/* 3. Show Translation */}
            <Pressable
              onPress={() => handleToggleTranslation(!translationEnabled)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.surfaceSecondary,
                padding: 12,
                borderRadius: theme.radius.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="translate" size={20} color={colors.brand} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>Translation</Text>
              </View>
              <Switch
                value={translationEnabled}
                onValueChange={(v) => handleToggleTranslation(v)}
                trackColor={{ true: colors.brand }}
              />
            </Pressable>

            {/* 4. Show Transliteration */}
            <Pressable
              onPress={() => handleToggleTransliteration(!transliterationEnabled)}
              style={{
                flex: 1,
                minWidth: "45%",
                backgroundColor: colors.surfaceSecondary,
                padding: 12,
                borderRadius: theme.radius.md,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="card-text-outline" size={20} color={colors.brand} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>Translit</Text>
              </View>
              <Switch
                value={transliterationEnabled}
                onValueChange={(v) => handleToggleTransliteration(v)}
                trackColor={{ true: colors.brand }}
              />
            </Pressable>

            <View style={{
              flexBasis: "100%", backgroundColor: colors.surfaceSecondary, padding: 12,
              borderRadius: theme.radius.md, borderWidth: 1, borderColor: colors.border,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <MaterialCommunityIcons name="format-size" size={20} color={colors.brand} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.onSurface }}>Reading size</Text>
                <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginLeft: "auto" }}>Qur&apos;an, Du&apos;as, Hadith & Seerah</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {(["small", "medium", "large"] as const).map((size) => (
                  <Pressable key={size} onPress={() => setFontSize(size)}
                    style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10,
                      backgroundColor: fontSize === size ? colors.brand : colors.surface,
                      borderWidth: 1, borderColor: fontSize === size ? colors.brand : colors.border }}>
                    <Text style={{ color: fontSize === size ? colors.onBrandPrimary : colors.onSurface, fontWeight: "700", textTransform: "capitalize" }}>{size}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, color: colors.brand, marginBottom: 4 }}>
          Detailed Settings
        </Text>

        {ITEMS.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleItemPress(item)}
            style={[styles.row, { backgroundColor: colors.surfaceSecondary }]}
            testID={`settings-item-${item.id}`}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.brand + "18" }]}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{t(item.id)}</Text>
              <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
                {t(item.id + "Sub")}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
          </Pressable>
        ))}

        {/* Footer version */}
        <Text style={[styles.version, { color: colors.onSurfaceMuted }]}>{t("appVersion")}</Text>
      </ScrollView>

      {/* Sub-option Sheet Modal */}
      <Modal
        visible={activeItem !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveItem(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setActiveItem(null)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIndicator, { backgroundColor: colors.onSurfaceMuted + "40" }]} />
              <Pressable onPress={() => setActiveItem(null)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { fontSize: 20, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, backgroundColor: theme.colors.surfaceSecondary, padding: theme.spacing.lg, borderRadius: theme.radius.lg },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 16, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  version: { textAlign: "center", marginTop: theme.spacing.xl, fontSize: 12 },
  
  // Sheet Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: theme.spacing.lg, paddingBottom: 40, maxHeight: "85%" },
  modalHeader: { alignItems: "center", paddingVertical: 12 },
  modalIndicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 8 },
  closeBtn: { alignSelf: "flex-end", position: "absolute", top: 8, right: 0, padding: 8 },
  modalContent: { paddingVertical: 12 },
  modalTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)" },
  optionLabel: { fontSize: 15, fontWeight: "600" },
  optionSub: { fontSize: 12, marginTop: 4 },
  btn: { padding: 14, borderRadius: theme.radius.md, alignItems: "center", justifyContent: "center" },
  btnTxt: { fontWeight: "700", fontSize: 15 },
  
  // Preview block
  previewBox: { padding: theme.spacing.md, borderRadius: theme.radius.md },
  previewLabel: { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginBottom: 4 },
  arabicPreview: { fontSize: 22, fontFamily: "Amiri", textAlign: "right", marginVertical: 8 },
  transPreview: { fontSize: 12, fontStyle: "italic", lineHeight: 18 },
  themeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 16 },
  themeCard: { width: "48%", minHeight: 74, borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: "row", alignItems: "center", gap: 9 },
  themeSwatches: { width: 24, height: 48, borderRadius: 8, overflow: "hidden" },
  themeSwatch: { flex: 1 },
  themeName: { fontSize: 13, fontWeight: "800" },
  themeDescription: { fontSize: 10, marginTop: 3 },

  // Audio options
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  speedRow: { flexDirection: "row", gap: 8 },
  speedBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  speedTxt: { fontSize: 13, fontWeight: "700" },

  // System options
  rowButton: { flexDirection: "row", alignItems: "center", gap: 12, padding: theme.spacing.md, borderRadius: theme.radius.md },
  rowButtonTxt: { fontSize: 15, fontWeight: "600" },

  // Lang options
  langRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 12, borderRadius: theme.radius.md, marginBottom: 4 },
  langTxt: { fontSize: 15, fontWeight: "600" },

  // More options
  paragraph: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
});
