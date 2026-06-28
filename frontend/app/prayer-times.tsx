import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { getSavedLocation, setSavedLocation } from "@/src/storage";

const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

export default function PrayerTimesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [times, setTimes] = useState<Record<string, string> | null>(null);
  const [city, setCity] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      let loc = await getSavedLocation();
      if (!loc) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErr("Location permission needed for accurate prayer times.");
          setLoading(false);
          return;
        }
        const p = await Location.getCurrentPositionAsync({});
        let cityName = "";
        try {
          const rev = await Location.reverseGeocodeAsync(p.coords);
          cityName = rev?.[0]?.city || rev?.[0]?.region || "";
        } catch {}
        loc = { lat: p.coords.latitude, lon: p.coords.longitude, city: cityName };
        await setSavedLocation(loc);
      }
      setCity(loc.city || "");
      const url = `https://api.aladhan.com/v1/timings?latitude=${loc.lat}&longitude=${loc.lon}&method=2`;
      const r = await fetch(url);
      const j = await r.json();
      setTimes(j?.data?.timings || null);
    } catch (e) {
      setErr("Could not load prayer times.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const nextPrayer = (() => {
    if (!times) return null;
    for (const p of PRAYERS) {
      const t = times[p];
      if (!t) continue;
      const [h, m] = t.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (d > now) return { name: p, time: t, date: d };
    }
    return null;
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <LinearGradient colors={["#1E40AF", "#0EA5E9"]} style={styles.hero}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10} testID="pt-back">
              <MaterialCommunityIcons name="chevron-left" size={28} color="#fff" />
            </Pressable>
            <Text style={styles.title}>Prayer Times</Text>
            <Pressable onPress={() => router.push("/qibla" as any)} hitSlop={10} testID="open-qibla">
              <MaterialCommunityIcons name="compass" size={26} color="#fff" />
            </Pressable>
          </View>
          {nextPrayer ? (
            <View style={styles.next}>
              <Text style={styles.nextLabel}>Next Prayer</Text>
              <Text style={styles.nextName}>{nextPrayer.name}</Text>
              <Text style={styles.nextTime}>{nextPrayer.time}</Text>
              <Text style={styles.nextCity}>📍 {city || "Your location"}</Text>
            </View>
          ) : null}
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 32 }} />
      ) : err ? (
        <View style={styles.errBox} testID="pt-error">
          <Text style={styles.errTxt}>{err}</Text>
          <Pressable onPress={load} style={styles.retry} testID="pt-retry">
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: theme.spacing.lg }}>
          {PRAYERS.map((p) => (
            <View key={p} style={styles.row} testID={`prayer-${p.toLowerCase()}`}>
              <Text style={styles.rowName}>{p}</Text>
              <Text style={styles.rowTime}>{times?.[p] || "--:--"}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  hero: { paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  next: { alignItems: "center", paddingVertical: theme.spacing.lg },
  nextLabel: { color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  nextName: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 6 },
  nextTime: { color: "#fff", fontSize: 44, fontWeight: "800" },
  nextCity: { color: "rgba(255,255,255,0.85)", marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", padding: theme.spacing.lg, backgroundColor: theme.colors.surfaceSecondary, borderRadius: theme.radius.lg, marginBottom: theme.spacing.sm },
  rowName: { color: theme.colors.onSurface, fontSize: 16, fontWeight: "600" },
  rowTime: { color: theme.colors.brand, fontSize: 18, fontWeight: "700" },
  errBox: { padding: theme.spacing.xl, alignItems: "center" },
  errTxt: { color: theme.colors.onSurfaceMuted, textAlign: "center" },
  retry: { marginTop: theme.spacing.md, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: theme.colors.brand, borderRadius: theme.radius.pill },
  retryTxt: { color: theme.colors.onBrandPrimary, fontWeight: "700" },
});
