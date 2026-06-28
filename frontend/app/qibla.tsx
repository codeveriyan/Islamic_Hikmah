import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { getSavedLocation, setSavedLocation } from "@/src/storage";

const KAABA = { lat: 21.4225, lon: 39.8262 };

function bearingTo(lat: number, lon: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lon - lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export default function QiblaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [heading, setHeading] = useState(0);
  const [qibla, setQibla] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sub: any;
    (async () => {
      try {
        let loc = await getSavedLocation();
        if (!loc) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setErr("Location permission needed for Qibla direction.");
            setLoading(false);
            return;
          }
          const p = await Location.getCurrentPositionAsync({});
          loc = { lat: p.coords.latitude, lon: p.coords.longitude };
          await setSavedLocation(loc);
        }
        setQibla(bearingTo(loc.lat, loc.lon));
        Magnetometer.setUpdateInterval(150);
        sub = Magnetometer.addListener((d) => {
          let angle = Math.atan2(d.y, d.x) * (180 / Math.PI);
          angle = angle - 90;
          if (angle < 0) angle += 360;
          setHeading(angle);
        });
      } catch {
        setErr("Compass unavailable on this device.");
      } finally {
        setLoading(false);
      }
    })();
    return () => sub?.remove();
  }, []);

  const arrowRot = qibla !== null ? qibla - heading : 0;
  const aligned = qibla !== null && Math.abs(((arrowRot % 360) + 360) % 360) < 8;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="qibla-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.onSurface} />
        </Pressable>
        <Text style={styles.title}>Qibla</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : err ? (
        <Text style={styles.err}>{err}</Text>
      ) : (
        <View style={styles.center}>
          <Text style={[styles.status, { color: aligned ? theme.colors.success : theme.colors.brand }]}>
            {aligned ? "✓ Facing the Kaaba" : "Rotate to align"}
          </Text>
          <View style={styles.compass}>
            <View style={[styles.arrow, { transform: [{ rotate: `${arrowRot}deg` }] }]}>
              <MaterialCommunityIcons name="navigation" size={120} color={aligned ? theme.colors.success : theme.colors.brand} />
            </View>
            <Text style={styles.deg}>{Math.round(((arrowRot % 360) + 360) % 360)}°</Text>
          </View>
          <Text style={styles.info}>Qibla bearing: {qibla?.toFixed(1)}° from North</Text>
          <Text style={styles.hint}>Hold phone flat & away from metal for best accuracy.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { color: theme.colors.onSurface, fontSize: 18, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.lg },
  compass: { width: 260, height: 260, borderRadius: 130, backgroundColor: theme.colors.surfaceSecondary, alignItems: "center", justifyContent: "center", marginVertical: theme.spacing.xl },
  arrow: { position: "absolute" },
  deg: { position: "absolute", color: theme.colors.onSurface, fontSize: 22, fontWeight: "800", bottom: 24 },
  status: { fontSize: 18, fontWeight: "700" },
  info: { color: theme.colors.onSurfaceSecondary, marginTop: 8 },
  hint: { color: theme.colors.onSurfaceMuted, marginTop: 20, textAlign: "center" },
  err: { color: theme.colors.onSurfaceMuted, padding: 24, textAlign: "center" },
});
