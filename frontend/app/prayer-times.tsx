import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Switch, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { getSavedLocation, setSavedLocation, getPrayerSettings, savePrayerSettings, PrayerSettings } from "@/src/storage";

const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_ICONS: Record<string, string> = {
  Fajr: "weather-sunset-up", Sunrise: "white-balance-sunny", Dhuhr: "sun-clock",
  Asr: "weather-sunny", Maghrib: "weather-sunset-down", Isha: "weather-night",
};

const CALC_METHODS = [
  { id: 1, name: "Karachi / MWL", note: "South Asia & parts of Europe" },
  { id: 2, name: "ISNA", note: "North America" },
  { id: 3, name: "Muslim World League", note: "Europe, Far East, parts of US" },
  { id: 4, name: "Umm Al-Qura", note: "Saudi Arabia" },
  { id: 5, name: "Egyptian", note: "Africa, Syria, Lebanon, Malaysia" },
  { id: 7, name: "Tehran", note: "Iran, some Shia communities" },
  { id: 8, name: "Gulf Region", note: "Kuwait, Qatar, UAE, Bahrain" },
  { id: 13, name: "Diyanet (Turkey)", note: "Turkey & surrounding countries" },
];

const JURISTIC_METHODS = [
  { id: 0, name: "Shafi / Maliki / Hanbali", note: "Standard Asr" },
  { id: 1, name: "Hanafi", note: "Later Asr" },
];

export default function PrayerTimesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [times, setTimes] = useState<Record<string, string> | null>(null);
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrayerSettings>({ method: 1, juristic: 0, adhanEnabled: {} });
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [showJuristicPicker, setShowJuristicPicker] = useState(false);

  const load = async (s?: PrayerSettings) => {
    setLoading(true);
    setErr(null);
    try {
      const usedSettings = s || settings;
      let loc = await getSavedLocation();
      if (!loc) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setErr("Location permission needed."); setLoading(false); return; }
        const p = await Location.getCurrentPositionAsync({});
        let cityName = "";
        try { const rev = await Location.reverseGeocodeAsync(p.coords); cityName = rev?.[0]?.city || rev?.[0]?.region || ""; } catch {}
        loc = { lat: p.coords.latitude, lon: p.coords.longitude, city: cityName };
        await setSavedLocation(loc);
      } else if (!loc.city) {
        // Self-heal: cached location is missing the city (e.g. saved earlier without geocoding)
        try {
          const rev = await Location.reverseGeocodeAsync({ latitude: loc.lat, longitude: loc.lon });
          const cityName = rev?.[0]?.city || rev?.[0]?.region || "";
          if (cityName) {
            loc = { ...loc, city: cityName };
            await setSavedLocation(loc);
          }
        } catch {}
      }
      setCity(loc.city || "");
      const url = `https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lon}&method=${usedSettings.method}&school=${usedSettings.juristic}`;
      const r = await fetch(url);
      const j = await r.json();
      setTimes(j?.data?.timings || null);
      const d = j?.data?.date?.readable || new Date().toDateString();
      setDate(d);
    } catch { setErr("Could not load prayer times. Check your internet connection."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      const s = await getPrayerSettings();
      setSettings(s);
      await load(s);
    })();
  }, []);

  const now = new Date();
  const nextPrayer = (() => {
    if (!times) return null;
    for (const p of PRAYERS) {
      if (!times[p]) continue;
      const [h, m] = times[p].split(":").map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      if (d > now) return { name: p, time: times[p] };
    }
    return null;
  })();

  const toggleAdhan = useCallback(async (prayer: string, val: boolean) => {
    const newSettings = { ...settings, adhanEnabled: { ...settings.adhanEnabled, [prayer]: val } };
    setSettings(newSettings);
    await savePrayerSettings(newSettings);
  }, [settings]);

  const selectMethod = async (id: number) => {
    const newSettings = { ...settings, method: id };
    setSettings(newSettings);
    await savePrayerSettings(newSettings);
    setShowMethodPicker(false);
    await load(newSettings);
  };

  const selectJuristic = async (id: number) => {
    const newSettings = { ...settings, juristic: id };
    setSettings(newSettings);
    await savePrayerSettings(newSettings);
    setShowJuristicPicker(false);
    await load(newSettings);
  };

  const renderPrayer = useCallback(({ item: p }: { item: string }) => {
    const isCurrent = nextPrayer?.name === p;
    const adhanOn = settings.adhanEnabled[p] ?? true;
    return (
      <View style={[styles.row, { backgroundColor: isCurrent ? colors.brand + "18" : colors.surfaceSecondary }, isCurrent && { borderWidth: 1, borderColor: colors.brand }]}>
        <MaterialCommunityIcons name={PRAYER_ICONS[p] as any} size={22} color={isCurrent ? colors.brand : colors.onSurfaceMuted} />
        <Text style={[styles.rowName, { color: isCurrent ? colors.brand : colors.onSurface }]}>{p}</Text>
        <Text style={[styles.rowTime, { color: isCurrent ? colors.brand : colors.onSurface }]}>{times?.[p] || "--:--"}</Text>
        {isCurrent && <View style={[styles.nextBadge, { backgroundColor: colors.brand }]}><Text style={styles.nextBadgeTxt}>NEXT</Text></View>}
        {p !== "Sunrise" && (
          <Pressable onPress={() => toggleAdhan(p, !adhanOn)} hitSlop={8}>
            <MaterialCommunityIcons
              name={adhanOn ? "volume-high" : "volume-off"}
              size={20}
              color={adhanOn ? colors.brand : colors.onSurfaceMuted}
            />
          </Pressable>
        )}
      </View>
    );
  }, [times, nextPrayer, settings, colors]);

  const currentMethod = CALC_METHODS.find(m => m.id === settings.method);
  const currentJuristic = JURISTIC_METHODS.find(j => j.id === settings.juristic);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Hero Header */}
      <LinearGradient colors={["#1E40AF", "#0EA5E9"]} style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Prayer Times</Text>
            <Pressable onPress={() => router.push("/qibla" as any)} hitSlop={10}>
              <MaterialCommunityIcons name="compass" size={26} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroDate}>{date}</Text>
            {city ? <Text style={styles.heroCity}>📍 {city}</Text> : null}
            {nextPrayer ? (
              <View style={styles.nextBox}>
                <Text style={styles.nextLabel}>Next Prayer</Text>
                <Text style={styles.nextName}>{nextPrayer.name}</Text>
                <Text style={styles.nextTime}>{nextPrayer.time}</Text>
              </View>
            ) : (
              <View style={styles.nextBox}>
                <Text style={styles.nextLabel}>All prayers complete</Text>
                <Text style={styles.nextName}>Alhamdulillah 🌙</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 32 }} />
      ) : err ? (
        <View style={styles.errBox}>
          <MaterialCommunityIcons name="wifi-off" size={48} color={theme.colors.onSurfaceMuted} />
          <Text style={[styles.errTxt, { color: colors.onSurfaceMuted }]}>{err}</Text>
          <Pressable onPress={() => load()} style={[styles.retry, { backgroundColor: colors.brand }]}>
            <Text style={[styles.retryTxt, { color: colors.onBrandPrimary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={PRAYERS}
          keyExtractor={p => p}
          renderItem={renderPrayer}
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.sm, paddingBottom: 32 }}
          getItemLayout={(_, i) => ({ length: 72, offset: 72 * i, index: i })}
          windowSize={5}
          removeClippedSubviews
          ListFooterComponent={
            <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
              {/* Juristic Method */}
              <Pressable onPress={() => setShowJuristicPicker(true)}
                style={[styles.settingRow, { backgroundColor: colors.surfaceSecondary }]}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Juristic Method</Text>
                  <Text style={[styles.settingValue, { color: colors.onSurfaceMuted }]}>{currentJuristic?.name}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>

              {/* Calculation Method */}
              <Pressable onPress={() => setShowMethodPicker(true)}
                style={[styles.settingRow, { backgroundColor: colors.surfaceSecondary }]}>
                <View>
                  <Text style={[styles.settingLabel, { color: colors.onSurface }]}>Calculation Method</Text>
                  <Text style={[styles.settingValue, { color: colors.onSurfaceMuted }]}>{currentMethod?.name}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
              </Pressable>
            </View>
          }
        />
      )}

      {/* Calculation Method Picker Modal */}
      <Modal visible={showMethodPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Calculation Method</Text>
              <Pressable onPress={() => setShowMethodPicker(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>
            <ScrollView>
              {CALC_METHODS.map(m => (
                <Pressable key={m.id} onPress={() => selectMethod(m.id)}
                  style={[styles.pickerRow, { backgroundColor: m.id === settings.method ? colors.brand + "18" : "transparent" }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pickerName, { color: colors.onSurface }]}>{m.name}</Text>
                    <Text style={[styles.pickerNote, { color: colors.onSurfaceMuted }]}>{m.note}</Text>
                  </View>
                  {m.id === settings.method && <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Juristic Method Picker Modal */}
      <Modal visible={showJuristicPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Juristic Method</Text>
              <Pressable onPress={() => setShowJuristicPicker(false)} hitSlop={10}>
                <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
              </Pressable>
            </View>
            {JURISTIC_METHODS.map(j => (
              <Pressable key={j.id} onPress={() => selectJuristic(j.id)}
                style={[styles.pickerRow, { backgroundColor: j.id === settings.juristic ? colors.brand + "18" : "transparent" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerName, { color: colors.onSurface }]}>{j.name}</Text>
                  <Text style={[styles.pickerNote, { color: colors.onSurfaceMuted }]}>{j.note}</Text>
                </View>
                {j.id === settings.juristic && <MaterialCommunityIcons name="check-circle" size={20} color={colors.brand} />}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  heroContent: { alignItems: "center", paddingVertical: 8 },
  heroDate: { color: "rgba(255,255,255,0.9)", fontWeight: "700", fontSize: 16 },
  heroCity: { color: "rgba(255,255,255,0.75)", marginTop: 2, fontSize: 13 },
  nextBox: { alignItems: "center", marginTop: 8 },
  nextLabel: { color: "rgba(255,255,255,0.8)", fontWeight: "600", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  nextName: { color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 4 },
  nextTime: { color: "#fff", fontSize: 38, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", padding: theme.spacing.lg, borderRadius: theme.radius.lg, gap: theme.spacing.md, height: 72 },
  rowName: { flex: 1, fontSize: 16, fontWeight: "600" },
  rowTime: { fontSize: 17, fontWeight: "700" },
  nextBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  nextBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  errBox: { padding: theme.spacing.xl, alignItems: "center", gap: theme.spacing.md },
  errTxt: { textAlign: "center" },
  retry: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: theme.radius.pill },
  retryTxt: { fontWeight: "700" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: theme.spacing.lg, borderRadius: theme.radius.lg },
  settingLabel: { fontSize: 16, fontWeight: "600" },
  settingValue: { fontSize: 13, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: theme.spacing.lg, maxHeight: "70%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.lg },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  pickerRow: { flexDirection: "row", alignItems: "center", padding: theme.spacing.lg, borderRadius: theme.radius.lg, marginBottom: 4 },
  pickerName: { fontSize: 15, fontWeight: "600" },
  pickerNote: { fontSize: 12, marginTop: 2 },
});
