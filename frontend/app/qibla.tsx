import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated, Easing } from "react-native";
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

  // FIX 3: Smooth animation using Animated API with useNativeDriver
  const animatedRotation = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  const smoothRotateTo = (targetDeg: number) => {
    let delta = targetDeg - currentRotation.current;
    // Normalize to shortest path
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const newTarget = currentRotation.current + delta;
    currentRotation.current = newTarget;

    Animated.timing(animatedRotation, {
      toValue: newTarget,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true, // FIX 1: Native driver for smooth 60fps animation
    }).start();
  };

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
        const qiblaDir = bearingTo(loc.lat, loc.lon);
        setQibla(qiblaDir);

        Magnetometer.setUpdateInterval(100);
        sub = Magnetometer.addListener((d) => {
          // FIX 3: Improved angle calculation
          let angle = Math.atan2(d.y, d.x) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          setHeading(angle);
          // Smooth rotation to qibla direction relative to heading
          const arrowTarget = (qiblaDir - angle + 360) % 360;
          smoothRotateTo(arrowTarget);
        });
      } catch {
        setErr("Compass unavailable on this device.");
      } finally {
        setLoading(false);
      }
    })();
    return () => sub?.remove();
  }, []);

  const arrowRot = qibla !== null ? (qibla - heading + 360) % 360 : 0;
  const aligned = qibla !== null && (arrowRot < 8 || arrowRot > 352);

  const spin = animatedRotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="qibla-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Qibla Direction</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : err ? (
        <View style={styles.errWrap}>
          <MaterialCommunityIcons name="compass-off" size={64} color={theme.colors.onSurfaceMuted} />
          <Text style={styles.err}>{err}</Text>
        </View>
      ) : (
        <View style={styles.center}>
          {/* Status */}
          <View style={[styles.statusBadge, { backgroundColor: aligned ? "#10B98122" : colors.brand + "22" }]}>
            <MaterialCommunityIcons
              name={aligned ? "check-circle" : "rotate-3d-variant"}
              size={18}
              color={aligned ? theme.colors.success : theme.colors.brand}
            />
            <Text style={[styles.status, { color: aligned ? theme.colors.success : theme.colors.brand }]}>
              {aligned ? "Facing the Kaaba ✓" : "Rotate to face Qibla"}
            </Text>
          </View>

          {/* FIX 3: Smooth animated compass */}
          <View style={[styles.compassOuter, { borderColor: aligned ? theme.colors.success : colors.border }]}>
            <View style={styles.compassMiddle}>
              {/* Cardinal directions */}
              <Text style={[styles.cardinal, styles.cardN]}>N</Text>
              <Text style={[styles.cardinal, styles.cardS]}>S</Text>
              <Text style={[styles.cardinal, styles.cardE]}>E</Text>
              <Text style={[styles.cardinal, styles.cardW]}>W</Text>

              {/* Smooth animated arrow */}
              <Animated.View style={[styles.arrowWrap, { transform: [{ rotate: spin }] }]}>
                <MaterialCommunityIcons
                  name="navigation"
                  size={100}
                  color={aligned ? theme.colors.success : theme.colors.brand}
                />
              </Animated.View>

              {/* Kaaba icon center */}
              <View style={styles.kaabaCenter}>
                <Text style={styles.kaabaEmoji}>🕋</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.deg, { color: colors.onSurface }]}>
            {Math.round(arrowRot)}°
          </Text>
          <Text style={[styles.info, { color: colors.onSurfaceSecondary }]}>
            Qibla bearing: {qibla?.toFixed(1)}° from North
          </Text>
          <Text style={[styles.hint, { color: colors.onSurfaceMuted }]}>
            Hold phone flat & away from metal for best accuracy
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  title: { fontSize: 18, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: theme.spacing.lg },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, marginBottom: theme.spacing.xl },
  status: { fontSize: 16, fontWeight: "700" },
  compassOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  compassMiddle: {
    width: 260,
    height: 260,
    borderRadius: 130,
    alignItems: "center",
    justifyContent: "center",
  },
  cardinal: { position: "absolute", color: theme.colors.onSurfaceMuted, fontWeight: "700", fontSize: 14 },
  cardN: { top: 8 },
  cardS: { bottom: 8 },
  cardE: { right: 8 },
  cardW: { left: 8 },
  arrowWrap: { position: "absolute" },
  kaabaCenter: { position: "absolute", width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.surface, alignItems: "center", justifyContent: "center" },
  kaabaEmoji: { fontSize: 20 },
  deg: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  info: { fontSize: 14, marginTop: 4 },
  hint: { marginTop: 16, textAlign: "center", fontSize: 13, paddingHorizontal: 24 },
  errWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  err: { color: theme.colors.onSurfaceMuted, textAlign: "center", fontSize: 15 },
});
