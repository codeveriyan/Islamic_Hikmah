import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, Modal, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useTranslation } from "@/src/localization";
import { theme } from "@/src/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LANGUAGES } from "@/src/data/quran/translationLanguages";

type FontOption = {
  id: "indopak" | "uthmani" | "naskh";
  label: string;
  description: string;
  preview: string;
};

const FONTS: FontOption[] = [
  {
    id: "indopak",
    label: "Indo Pak",
    description: "Traditional South Asian print style",
    preview: "بِسْمِ اللهِ الرَّحْمُٰنِ الرَّحِيْمِ",
  },
  {
    id: "uthmani",
    label: "Uthmani",
    description: "Official Saudi mushaf script (Scheherazade)",
    preview: "بِسْمِ اللَهِ الرَّحْمَٰنِ الرَّحِيمِ",
  },
  {
    id: "naskh",
    label: "Naskh Arabic",
    description: "Clean modern Arabic — best for duas",
    preview: "بِسْمِ اللَهِ الرَّحْمَنِ الرَّحِيمِ",
  },
];

export default function PersonaliseScreen() {
  const router = useRouter();
  const { colors, language, setLanguage, arabicFont, setArabicFont } = useTheme();
  const { t } = useTranslation(language);

  // Settings states
  const [fontType, setFontType] = useState<"indopak" | "uthmani" | "naskh">(arabicFont);
  const [fontSize, setFontSize] = useState<number>(24);
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [showTransliteration, setShowTransliteration] = useState<boolean>(true);
  const [tajweedEnabled, setTajweedEnabled] = useState<boolean>(true);
  const [readingMode, setReadingMode] = useState<"default" | "sepia" | "dark">("default");

  // Dialog state
  const [modalVisible, setModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);

  // Load preferences
  useEffect(() => {
    AsyncStorage.getItem("islamic_hikmah:quran_font_type").then((val) => {
      if (val) setFontType(val as any);
    });
    AsyncStorage.getItem("islamic_hikmah:quran_font_size").then((val) => {
      if (val) setFontSize(Number(val));
    });
    AsyncStorage.getItem("islamic_hikmah:quran_show_translation").then((val) => {
      if (val !== null) setShowTranslation(val === "true");
    });
    AsyncStorage.getItem("islamic_hikmah:quran_show_transliteration").then((val) => {
      if (val !== null) setShowTransliteration(val === "true");
    });
    AsyncStorage.getItem("islamic_hikmah:quran_reading_mode").then((val) => {
      if (val) setReadingMode(val as any);
    });
  }, []);

  const saveFontType = async (type: "indopak" | "uthmani" | "naskh") => {
    setFontType(type);
    setArabicFont(type); // propagates to ALL screens via ThemeContext
    await AsyncStorage.setItem("islamic_hikmah:quran_font_type", type);
  };

  const saveFontSize = async (size: number) => {
    setFontSize(size);
    await AsyncStorage.setItem("islamic_hikmah:quran_font_size", String(size));
  };

  const saveTranslation = async (val: boolean) => {
    setShowTranslation(val);
    await AsyncStorage.setItem("islamic_hikmah:quran_show_translation", String(val));
  };

  const saveTransliteration = async (val: boolean) => {
    setShowTransliteration(val);
    await AsyncStorage.setItem("islamic_hikmah:quran_show_transliteration", String(val));
  };

  const saveReadingMode = async (val: "default" | "sepia" | "dark") => {
    setReadingMode(val);
    await AsyncStorage.setItem("islamic_hikmah:quran_reading_mode", val);
  };

  const getFontFamily = (type: string) => {
    if (type === "indopak") return "AmiriBold";
    if (type === "uthmani") return "ScheherazadeNew";
    return "NotoNaskhArabic";
  };

  const activeFontLabel = FONTS.find((f) => f.id === fontType)?.label || "Indo Pak";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.brand }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onBrandPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onBrandPrimary }]}>Quick Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Live Preview Container */}
      <View style={[styles.previewArea, {
        backgroundColor:
          readingMode === "sepia" ? "#F5ECD7" :
          readingMode === "dark"  ? "#0D2137" :
          colors.surfaceSecondary,
      }]}>
        <Text
          style={[
            styles.arabicPreview,
            {
              fontFamily: getFontFamily(fontType),
              fontSize: fontSize,
              color: colors.onSurface,
            },
          ]}
        >
          {FONTS.find((f) => f.id === fontType)?.preview}
        </Text>
        {showTransliteration && (
          <Text style={[styles.translitPreview, { color: colors.brand }]}>
            Bismillaahir Rahmaanir Raheem.
          </Text>
        )}
        {showTranslation && (
          <Text style={[styles.translationPreview, { color: colors.onSurfaceSecondary }]}>
            In the name of Allah, the Entirely Merciful, the Especially Merciful.
          </Text>
        )}
      </View>

      {/* Options Listing */}
      <View style={styles.optionsWrap}>
        {/* Font Type Selector Trigger */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setModalVisible(true);
          }}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="format-font" size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Font type</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.rowVal, { color: colors.brand }]}>{activeFontLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurfaceMuted} />
          </View>
        </Pressable>

        {/* Font Size Adjuster Row */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="format-size" size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Font size ({fontSize}px)</Text>
          </View>
          <View style={styles.sizeControls}>
            <Pressable
              onPress={() => fontSize > 16 && saveFontSize(fontSize - 2)}
              style={[styles.sizeBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Text style={[styles.sizeBtnTxt, { color: colors.onSurface }]}>A-</Text>
            </Pressable>
            <Pressable
              onPress={() => fontSize < 44 && saveFontSize(fontSize + 2)}
              style={[styles.sizeBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Text style={[styles.sizeBtnTxt, { color: colors.onSurface }]}>A+</Text>
            </Pressable>
          </View>
        </View>

        {/* Reading Mode — Default / Sepia / Dark */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="brightness-6" size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Reading Mode</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            {(["default", "sepia", "dark"] as const).map((m) => {
              const labels = { default: "Default", sepia: "Sepia", dark: "Dark" };
              const bg = { default: colors.surfaceSecondary, sepia: "#F5ECD7", dark: "#0D2137" };
              const tc = { default: colors.onSurface, sepia: "#5C3D1E", dark: "#C8DFF0" };
              return (
                <Pressable
                  key={m}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{}); saveReadingMode(m); }}
                  style={{
                    paddingHorizontal: 10, paddingVertical: 5,
                    borderRadius: 8,
                    backgroundColor: bg[m],
                    borderWidth: readingMode === m ? 2 : 1,
                    borderColor: readingMode === m ? colors.brand : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: readingMode === m ? "700" : "500", color: tc[m] }}>
                    {labels[m]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Translation Language Selector */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setLangModalVisible(true);
          }}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="translate" size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Translation Language</Text>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.rowVal, { color: colors.brand }]}>
              {LANGUAGES.find((l) => l.id === language)?.label ?? "English"}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurfaceMuted} />
          </View>
        </Pressable>

        {/* Translation Toggle */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="book-open-variant" size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{t("translation")}</Text>
          </View>
          <Switch
            value={showTranslation}
            onValueChange={saveTranslation}
            trackColor={{ false: "#E2E8F0", true: colors.brand }}
            thumbColor="#FFF"
          />
        </View>

        {/* Transliteration Toggle */}
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="format-text" size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{t("transliteration")}</Text>
            <Pressable
              onPress={() => alert("English transliteration displays Arabic characters phonetically.")}
              style={{ marginLeft: 6 }}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color={colors.onSurfaceMuted} />
            </Pressable>
          </View>
          <Switch
            value={showTransliteration}
            onValueChange={saveTransliteration}
            trackColor={{ false: "#E2E8F0", true: colors.brand }}
            thumbColor="#FFF"
          />
        </View>

        {/* Report Feedback Row */}
        <Pressable
          onPress={() => alert("Thank you for your feedback! If you notice any typos, please report to support@islamichikmah.com.")}
          style={[styles.row, { borderBottomColor: colors.border }]}
        >
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="alert-circle-outline" size={22} color={colors.brandSecondary} />
            <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Report typo / issue</Text>
          </View>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.onSurfaceMuted} />
        </Pressable>

        {/* More Settings — navigates to the full app Settings page */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push("/settings");
          }}
          style={[
            styles.row,
            {
              borderBottomColor: "transparent",
              backgroundColor: colors.brand + "12",
              borderRadius: theme.radius.lg,
              marginTop: 8,
            },
          ]}
        >
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.brand} />
            <Text style={[styles.rowLabel, { color: colors.brand, fontWeight: "700" }]}>
              More Settings
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.brand} />
        </Pressable>
      </View>

      {/* Font Selection Dialog Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Font type</Text>
            {FONTS.map((font) => (
              <Pressable
                key={font.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  saveFontType(font.id);
                  setModalVisible(false);
                }}
                style={[
                  styles.modalItem,
                  fontType === font.id && { backgroundColor: "rgba(16, 185, 129, 0.08)" },
                ]}
              >
                {/* Arabic preview rendered in each font's own typeface */}
                <Text
                  style={{
                    fontFamily: getFontFamily(font.id),
                    color: fontType === font.id ? colors.brand : colors.onSurface,
                    fontSize: 20,
                    lineHeight: 36,
                    textAlign: "right",
                    flexShrink: 1,
                  }}
                >
                  {font.preview}
                </Text>
                {/* Font name + description */}
                <View style={{ marginLeft: 12, flex: 1, justifyContent: "center" }}>
                  <Text
                    style={[
                      styles.modalLabelText,
                      {
                        color: fontType === font.id ? colors.brand : colors.onSurface,
                        fontWeight: fontType === font.id ? "700" : "500",
                      },
                    ]}
                  >
                    {font.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }}>
                    {font.description}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Translation Language Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={langModalVisible}
        onRequestClose={() => setLangModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setLangModalVisible(false)}>
          <View style={[styles.modalContent, { paddingBottom: 8 }]}>
            <Text style={styles.modalTitle}>Translation Language</Text>
            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLanguage(lang.id);
                  setLangModalVisible(false);
                }}
                style={[
                  styles.modalItem,
                  language === lang.id && { backgroundColor: colors.brand + "14" },
                ]}
              >
                <Text style={{ fontSize: 22, marginRight: 10 }}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.modalLabelText,
                    {
                      flex: 1,
                      color: language === lang.id ? colors.brand : colors.onSurface,
                      fontWeight: language === lang.id ? "700" : "500",
                    },
                  ]}
                >
                  {lang.label}
                </Text>
                {language === lang.id && (
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />
                )}
              </Pressable>
            ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700" },
  previewArea: {
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  arabicPreview: {
    textAlign: "center",
    lineHeight: 48,
    marginBottom: theme.spacing.md,
  },
  translitPreview: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  translationPreview: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  optionsWrap: {
    padding: theme.spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowVal: {
    fontSize: 14,
    fontWeight: "700",
  },
  sizeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sizeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  sizeBtnTxt: {
    fontSize: 13,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: theme.spacing.md,
    paddingHorizontal: 12,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 4,
  },
  modalArabicText: {
    fontSize: 22,
  },
  modalLabelText: {
    fontSize: 15,
  },
});
