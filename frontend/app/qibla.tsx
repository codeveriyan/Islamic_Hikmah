import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated, Easing, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { getSavedLocation, setSavedLocation } from "@/src/storage";

const KAABA = { lat: 21.4225, lon: 39.8262 };

// Great-circle bearing from (lat, lon) to the Kaaba.
// Returns 0–360° clockwise from true North.
function bearingTo(lat: number, lon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA.lat);
  const Δλ = toRad(KAABA.lon - lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export default function QiblaScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [qibla, setQibla] = useState<number | null>(null);
  const [heading, setHeading] = useState(0);
  const [city, setCity] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Location.watchHeadingAsync returns a subscription — store it here so we
  // can cancel it on unmount or retry.
  const headingSub = useRef<Location.LocationSubscription | null>(null);

  // Smooth rotation via Animated so the arrow doesn't snap.
  const animatedRotation = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  const smoothRotateTo = (targetDeg: number) => {
    let delta = targetDeg - currentRotation.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    const newTarget = currentRotation.current + delta;
    currentRotation.current = newTarget;
    Animated.timing(animatedRotation, {
      toValue: newTarget,
      duration: 250,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const setupQibla = async () => {
    setLoading(true);
    setErr(null);

    // Cancel any previous heading subscription before starting a new one
    if (headingSub.current) {
      headingSub.current.remove();
      headingSub.current = null;
    }

    try {
      // 1. Get / request location permission
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== "granted") {
        setErr("Location permission is needed to calculate the Qibla direction.");
        setLoading(false);
        return;
      }

      // 2. Resolve coordinates (cache first, then GPS)
      let loc = await getSavedLocation();
      if (!loc) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        let cityName = "";
        try {
          const rev = await Location.reverseGeocodeAsync(pos.coords);
          cityName = rev?.[0]?.city || rev?.[0]?.region || "";
        } catch {}
        loc = { lat: pos.coords.latitude, lon: pos.coords.longitude, city: cityName };
        await setSavedLocation(loc);
      }

      // Self-heal: fill missing city name without re-fetching coordinates
      if (!loc.city) {
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
      const qiblaDir = bearingTo(loc.lat, loc.lon);
      setQibla(qiblaDir);

      // 3. Start the platform's fused compass heading.
      //
      //    Location.watchHeadingAsync() uses the OS-level sensor fusion pipeline
      //    (magnetometer + accelerometer + gyroscope on Android; Core Motion on iOS)
      //    which gives a tilt-compensated, declination-corrected heading.
      //
      //    The raw Magnetometer API used previously returned uncorrected magnetic
      //    field values — these vary with device tilt and magnetic declination,
      //    which caused the arrow to point in the wrong direction.
      //
      //    `magHeading`  = compass bearing before declination correction (degrees)
      //    `trueHeading` = compass bearing after declination correction (degrees)
      //                    — available when GPS is active; fall back to magHeading.
      headingSub.current = await Location.watchHeadingAsync((h) => {
        // Use true heading when available (requires GPS fix), otherwise magnetic heading.
        const compassHeading =
          h.trueHeading != null && h.trueHeading >= 0
            ? h.trueHeading
            : h.magHeading;

        setHeading(compassHeading);
        // Arrow target = how many degrees clockwise from the current phone
        // orientation the user needs to rotate to face the Kaaba.
        const arrowTarget = (qiblaDir - compassHeading + 360) % 360;
        smoothRotateTo(arrowTarget);
      });

      setErr(null);
    } catch (e) {
      console.error("Qibla setup error:", e);
      setErr("Compass unavailable on this device.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setupQibla();
    return () => {
      headingSub.current?.remove();
    };
  }, []);

  // Derived display values
  const arrowRot = qibla !== null ? (qibla - heading + 360) % 360 : 0;
  const aligned = qibla !== null && (arrowRot < 5 || arrowRot > 355);

  const spin = animatedRotation.interpolate({
    inputRange: [-720, 720],
    outputRange: ["-720deg", "720deg"],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="qibla-back">
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Qibla Direction</Text>
        <Pressable onPress={() => router.push("/settings")} hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
          </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.brand} style={{ marginTop: 40 }} />
      ) : err ? (
        <View style={styles.errWrap}>
          <MaterialCommunityIcons name="compass-off" size={64} color={theme.colors.onSurfaceMuted} />
          <Text style={[styles.err, { color: colors.onSurfaceMuted }]}>{err}</Text>
          <Pressable
            onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === "granted") {
                await setupQibla();
              } else {
                setErr(
                  "Location permission is required for Qibla direction. Please enable it in your phone Settings."
                );
              }
            }}
            style={[styles.retryBtn, { backgroundColor: colors.brand }]}
          >
            <Text style={[styles.retryTxt, { color: colors.onBrandPrimary }]}>
              Grant Location Access
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.center}>
          {/* Status badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: aligned ? "#10B98122" : colors.brand + "22" },
            ]}
          >
            <MaterialCommunityIcons
              name={aligned ? "check-circle" : "rotate-3d-variant"}
              size={18}
              color={aligned ? theme.colors.success : theme.colors.brand}
            />
            <Text
              style={[
                styles.status,
                { color: aligned ? theme.colors.success : theme.colors.brand },
              ]}
            >
              {aligned ? "Facing the Kaaba ✓" : "Rotate to face Qibla"}
            </Text>
          </View>

          {/* Compass ring */}
          <View
            style={[
              styles.compassOuter,
              { borderColor: aligned ? theme.colors.success : colors.border },
            ]}
          >
            <View style={styles.compassMiddle}>
              {/* Cardinal labels — fixed to the ring (not rotating) */}
              <Text style={[styles.cardinal, styles.cardN, { color: colors.onSurface }]}>N</Text>
              <Text style={[styles.cardinal, styles.cardS, { color: colors.onSurfaceMuted }]}>S</Text>
              <Text style={[styles.cardinal, styles.cardE, { color: colors.onSurfaceMuted }]}>E</Text>
              <Text style={[styles.cardinal, styles.cardW, { color: colors.onSurfaceMuted }]}>W</Text>

              {/* Qibla arrow — rotates to point toward Kaaba */}
              <Animated.View style={[styles.arrowWrap, { transform: [{ rotate: spin }] }]}>
                <MaterialCommunityIcons
                  name="navigation"
                  size={100}
                  color={aligned ? theme.colors.success : theme.colors.brand}
                />
              </Animated.View>

              {/* Kaaba icon at centre */}
              <View style={styles.kaabaCenter}>
                <Text style={styles.kaabaEmoji}>🕋</Text>
              </View>
            </View>
          </View>

          {/* Numeric readout */}
          <Text style={[styles.deg, { color: colors.onSurface }]}>
            {Math.round(arrowRot)}°
          </Text>
          <Text style={[styles.info, { color: colors.onSurfaceSecondary }]}>
            Qibla bearing: {qibla?.toFixed(1)}° from North
          </Text>
          {city ? (
            <Text style={[styles.cityTxt, { color: colors.onSurfaceMuted }]}>📍 {city}</Text>
          ) : null}
          <Text style={[styles.hint, { color: colors.onSurfaceMuted }]}>
            Hold phone flat and away from metal objects for best accuracy
          </Text>
        </View>
      )}
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
    paddingVertical: theme.spacing.md,
  },
  title: { fontSize: 18, fontWeight: "700" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    marginBottom: theme.spacing.xl,
  },
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
  cardinal: {
    position: "absolute",
    fontWeight: "700",
    fontSize: 14,
  },
  cardN: { top: 8 },
  cardS: { bottom: 8 },
  cardE: { right: 8 },
  cardW: { left: 8 },
  arrowWrap: { position: "absolute" },
  kaabaCenter: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  kaabaEmoji: { fontSize: 20 },
  deg: { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  info: { fontSize: 14, marginTop: 4 },
  cityTxt: { fontSize: 12, marginTop: 4, fontWeight: "600" },
  hint: { marginTop: 16, textAlign: "center", fontSize: 13, paddingHorizontal: 24 },
  errWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  err: { textAlign: "center", fontSize: 15 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
    marginTop: 8,
  },
  retryTxt: { fontWeight: "700" },
});
