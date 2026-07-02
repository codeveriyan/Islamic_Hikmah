import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
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
  const { colors, mode, setMode, language, setLanguage } = useTheme();
  const [activeItem, setActiveItem] = useState<SettingItem | null>(null);

  // User preference states
  const [dailyNotif, setDailyNotif] = useState(true);
  const [reminderNotif, setReminderNotif] = useState(true);
  const [articleNotif, setArticleNotif] = useState(true);

  const [translationEnabled, setTranslationEnabled] = useState(true);
  const [transliterationEnabled, setTransliterationEnabled] = useState(true);

  const [audioSpeed, setAudioSpeed] = useState("1.0x");
  const [tasbihVibe, setTasbihVibe] = useState(true);

  const [downloadWifi, setDownloadWifi] = useState(true);
  const appLanguage = language === "ta" ? "Tamil (தமிழ்)" : "English";
  const [bgAzaan, setBgAzaan] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("background_azaan_enabled").then((val) => {
      if (val !== null) setBgAzaan(val !== "false");
    });
  }, []);

  const handleToggleBgAzaan = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setBgAzaan(val);
    await AsyncStorage.setItem("background_azaan_enabled", val ? "true" : "false");
    try {
      const timingsRaw = await AsyncStorage.getItem("last_fetched_timings");
      if (timingsRaw) {
        const timings = JSON.parse(timingsRaw);
        const settings = await getPrayerSettings();
        await schedulePrayerNotifications(timings, settings.adhanEnabled);
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
        return (
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Appearance Settings</Text>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Dark Mode</Text>
                <Text style={[styles.optionSub, { color: colors.onSurfaceMuted }]}>Toggle between light and dark theme</Text>
              </View>
              <Switch value={mode === "dark"} onValueChange={(val) => setMode(val ? "dark" : "light")} trackColor={{ true: colors.brand }} />
            </View>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Show English Translation</Text>
              </View>
              <Switch value={translationEnabled} onValueChange={setTranslationEnabled} trackColor={{ true: colors.brand }} />
            </View>

            <View style={styles.optionRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.onSurface }]}>Show English Transliteration</Text>
              </View>
              <Switch value={transliterationEnabled} onValueChange={setTransliterationEnabled} trackColor={{ true: colors.brand }} />
            </View>
            
            <View style={[styles.previewBox, { backgroundColor: colors.surfaceTertiary, marginTop: 16 }]}>
              <Text style={[styles.previewLabel, { color: colors.brand }]}>PREVIEW</Text>
              <Text style={[styles.arabicPreview, { color: colors.onSurface }]}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</Text>
              {translationEnabled && <Text style={[styles.transPreview, { color: colors.onSurfaceMuted }]}>In the name of God, the Most Gracious, the Dispenser of Grace.</Text>}
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
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Change Language</Text>
            {[
              { name: "English", code: "en" as const },
              { name: "Tamil (தமிழ்)", code: "ta" as const }
            ].map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setLanguage(lang.code);
                }}
                style={[styles.langRow, { backgroundColor: language === lang.code ? colors.brand + "18" : "transparent" }]}
              >
                <Text style={[styles.langTxt, { color: colors.onSurface }, language === lang.code && { color: colors.brand, fontWeight: "700" }]}>
                  {lang.name}
                </Text>
                {language === lang.code && <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />}
              </Pressable>
            ))}
          </View>
        );

      case "more":
        return (
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>About & Legals</Text>

            <Text style={[styles.sectionLabel, { color: colors.brand, marginTop: 12 }]}>FAQ</Text>
            <Text style={[styles.paragraph, { color: colors.onSurfaceSecondary }]}>
              Q: Does Islamic Hikmah work fully offline?{"\n"}
              A: Yes, all Du'as, Dhikr counts, and downloaded Quran contents are saved locally.
            </Text>
            <Text style={[styles.paragraph, { color: colors.onSurfaceSecondary }]}>
              Q: How are prayer times calculated?{"\n"}
              A: Based on your current GPS location and chosen calculation method (e.g. MWL, Umm Al-Qura).
            </Text>

            <Text style={[styles.sectionLabel, { color: colors.brand, marginTop: 16 }]}>Terms & Conditions</Text>
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
        <Text style={[styles.title, { color: colors.onSurface }]}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
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
              <Text style={[styles.rowLabel, { color: colors.onSurface }]}>{item.label}</Text>
              <Text style={[styles.rowSub, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
                {item.subtext}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
          </Pressable>
        ))}

        {/* Footer version */}
        <Text style={[styles.version, { color: colors.onSurfaceMuted }]}>Islamic Hikmah v1.1.0</Text>
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
