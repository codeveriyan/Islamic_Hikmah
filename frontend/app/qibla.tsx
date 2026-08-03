import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Platform,
  ScrollView,
  Alert,
  Image,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Line, Path, Rect } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/ThemeContext';
import { useTranslation } from '@/src/localization';
import { theme } from '@/src/theme';
import { useAuth } from '@/src/AuthContext';
import { usePremiumModal } from '@/src/PremiumModalContext';

const { width, height } = Dimensions.get('window');
const PANORAMA_VIEW_HEIGHT = Math.min(Math.max(height * 0.58, 420), 620);
const PANORAMA_IMAGE_WIDTH = Math.max(width, PANORAMA_VIEW_HEIGHT * 2);

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const KAABA_COORDS: LocationCoords = {
  latitude: 21.4225,
  longitude: 39.8262,
};

const DIAL_SKINS = [
  { id: 'hikmah', name: 'Brass Classic', ringColor: '#b87333', bg: '#efe4a8', accent: '#3a2418', needleColorLight: '#3b2430', needleColorDark: '#1d1118', caseGradient: ['#fff0b8', '#c9822e', '#8a4a1f', '#3b1f12'] },
  { id: 'emerald', name: 'Emerald Noor', ringColor: '#00c896', bg: '#062520', accent: '#9fffe0', needleColorLight: '#2ecc71', needleColorDark: '#008f70', caseGradient: ['#8fffe0', '#00c896', '#007a62', '#031713'] },
  { id: 'moon', name: 'Moon Silver', ringColor: '#bdc3c7', bg: '#17242b', accent: '#ecf0f1', needleColorLight: '#f1d36b', needleColorDark: '#D4AF37', caseGradient: ['#ffffff', '#bdc3c7', '#6b7b82', '#17242b'] },
  { id: 'obsidian', name: 'Obsidian', ringColor: '#3498db', bg: '#101114', accent: '#5dade2', needleColorLight: '#00c896', needleColorDark: '#008f70', caseGradient: ['#5dade2', '#3498db', '#1f618d', '#061713'] },
];

function KaabaOverlayIcon({ size = 170, color = '#050505' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 120" accessibilityLabel="Kaaba direction marker">
      <Rect x="20" y="38" width="60" height="54" rx="6" fill="none" stroke={color} strokeWidth="8" />
      <Path d="M35 58 L50 45 L65 58 V77 H35 Z" fill="none" stroke={color} strokeWidth="8" strokeLinejoin="round" />
      <Line x1="28" y1="27" x2="28" y2="38" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <Line x1="42" y1="27" x2="42" y2="38" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <Line x1="58" y1="27" x2="58" y2="38" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <Line x1="72" y1="27" x2="72" y2="38" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <Line x1="28" y1="92" x2="28" y2="103" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <Line x1="42" y1="92" x2="42" y2="103" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <Line x1="58" y1="92" x2="58" y2="103" stroke={color} strokeWidth="8" strokeLinecap="round" />
      <Line x1="72" y1="92" x2="72" y2="103" stroke={color} strokeWidth="8" strokeLinecap="round" />
    </Svg>
  );
}

export default function QiblaScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const { profile } = useAuth();
  const { showPremiumModal } = usePremiumModal();

  const [heading, setHeading] = useState<number>(0);
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('Calculating...');

  // Display modes: compass, live camera AR, swipeable 360° panorama, and map.
  const [mode, setMode] = useState<'compass' | 'ar' | 'view360' | 'map'>('compass');
  const [activeSkin, setActiveSkin] = useState(DIAL_SKINS[0]);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [panoramaOffset, setPanoramaOffset] = useState(-PANORAMA_IMAGE_WIDTH);
  const [panoramaLive, setPanoramaLive] = useState(true);

  // Bubble level tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isSensorsAvailable, setIsSensorsAvailable] = useState(false);

  const headingAnim = useSharedValue(0);
  const tiltXAnim = useSharedValue(0);
  const tiltYAnim = useSharedValue(0);

  const watchHeadingRef = useRef<any>(null);
  const watchLocationRef = useRef<any>(null);
  const magnetometerRef = useRef<any>(null);
  const lastHapticRef = useRef<number>(0);
  const [needsCalibration, setNeedsCalibration] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const panoramaOffsetRef = useRef(-PANORAMA_IMAGE_WIDTH);
  const panoramaGestureStartRef = useRef(-PANORAMA_IMAGE_WIDTH);
  const panoramaPointerStartRef = useRef<number | null>(null);

  const updatePanoramaOffset = useCallback((nextOffset: number) => {
    const minOffset = -(PANORAMA_IMAGE_WIDTH * 2);
    const next = Math.max(minOffset, Math.min(0, nextOffset));
    panoramaOffsetRef.current = next;
    setPanoramaOffset(next);
  }, []);

  const syncPanoramaToHeading = useCallback(() => {
    updatePanoramaOffset(-PANORAMA_IMAGE_WIDTH - (heading / 360) * PANORAMA_IMAGE_WIDTH);
  }, [heading, updatePanoramaOffset]);

  useEffect(() => {
    if (mode === 'view360' && panoramaLive) {
      syncPanoramaToHeading();
    }
  }, [mode, panoramaLive, syncPanoramaToHeading]);

  const panoramaPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 4,
      onPanResponderGrant: () => {
        setPanoramaLive(false);
        panoramaGestureStartRef.current = panoramaOffsetRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        updatePanoramaOffset(panoramaGestureStartRef.current + gestureState.dx);
      },
      onPanResponderRelease: () => {
        panoramaGestureStartRef.current = panoramaOffsetRef.current;
      },
    })
  ).current;

  const getPointerX = (event: any) => event?.clientX ?? event?.nativeEvent?.pageX ?? 0;
  const handlePanoramaPointerDown = (event: any) => {
    setPanoramaLive(false);
    panoramaPointerStartRef.current = getPointerX(event);
    panoramaGestureStartRef.current = panoramaOffsetRef.current;
  };
  const handlePanoramaPointerMove = (event: any) => {
    if (panoramaPointerStartRef.current === null) return;
    updatePanoramaOffset(
      panoramaGestureStartRef.current + getPointerX(event) - panoramaPointerStartRef.current
    );
  };
  const handlePanoramaPointerUp = () => {
    panoramaPointerStartRef.current = null;
    panoramaGestureStartRef.current = panoramaOffsetRef.current;
  };

  // Calculate distance to Kaaba in kilometers using Haversine
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate Qibla direction angle
  const calculateQibla = (userLat: number, userLon: number): number => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const lat1 = toRad(userLat);
    const lon1 = toRad(userLon);
    const lat2 = toRad(KAABA_COORDS.latitude);
    const lon2 = toRad(KAABA_COORDS.longitude);

    const dLon = lon2 - lon1;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = toDeg(Math.atan2(y, x));
    bearing = (bearing + 360) % 360;

    return bearing;
  };

  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (result && result.length > 0) {
        const address = result[0];
        const location = address.city || address.region || address.country || 'Your Location';
        setLocationName(location);
      }
    } catch (err) {
      setLocationName('Location');
    }
  };

  // Listen to sensors & GPS
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords: LocationCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(coords);
        setAccuracy(location.coords.accuracy);
        reverseGeocode(coords.latitude, coords.longitude);

        const qibla = calculateQibla(coords.latitude, coords.longitude);
        setQiblaDirection(qibla);

        setLoading(false);

        // Heading listener with Magnetometer fallback
        try {
          if (Platform.OS !== 'web') {
            watchHeadingRef.current = await Location.watchHeadingAsync(headingData => {
              const rawHeading = headingData.trueHeading !== -1 ? headingData.trueHeading : headingData.magHeading;
              setHeading(rawHeading);

              headingAnim.value = withTiming(rawHeading, { duration: 250 });
            });
          }
        } catch (err) {
          console.warn("watchHeadingAsync fallback to Magnetometer:", err);
          if (Platform.OS !== 'web') {
            setNeedsCalibration(true);
            Magnetometer.setUpdateInterval(100);
            magnetometerRef.current = Magnetometer.addListener(data => {
              let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
              if (angle < 0) angle += 360;
              setHeading(angle);
              headingAnim.value = withTiming(angle, { duration: 250 });
            });
          }
        }

        // Watch location
        watchLocationRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 150,
          },
          loc => {
            const newCoords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserLocation(newCoords);
            setAccuracy(loc.coords.accuracy);
            reverseGeocode(newCoords.latitude, newCoords.longitude);

            const newQibla = calculateQibla(newCoords.latitude, newCoords.longitude);
            setQiblaDirection(newQibla);
          }
        );
      } catch (err) {
        console.error(err);
        setError('Unable to get location. Please enable location services.');
        setLoading(false);
      }
    };

    initializeLocation();

    // Tilt Level listener
    let accelSubscription: any;
    if (Platform.OS !== 'web') {
      Accelerometer.isAvailableAsync().then(available => {
        setIsSensorsAvailable(available);
        if (available) {
          Accelerometer.setUpdateInterval(100);
          try {
            accelSubscription = Accelerometer.addListener(data => {
              setTilt({ x: data.x, y: data.y });

              // Animate tilt values smoothly for dampening
              tiltXAnim.value = withSpring(data.x, { damping: 15, stiffness: 120 });
              tiltYAnim.value = withSpring(data.y, { damping: 15, stiffness: 120 });
            });
          } catch (e) {
            console.warn("Accelerometer listener error:", e);
          }
        }
      }).catch(err => {
        console.warn("Accelerometer isAvailable error:", err);
      });
    }

    return () => {
      try {
        if (watchHeadingRef.current) {
          if (typeof watchHeadingRef.current.remove === 'function') {
            watchHeadingRef.current.remove();
          } else if (typeof watchHeadingRef.current === 'function') {
            (watchHeadingRef.current as any)();
          }
        }
      } catch (e) {
        console.warn(e);
      }
      try {
        if (watchLocationRef.current) {
          if (typeof watchLocationRef.current.remove === 'function') {
            watchLocationRef.current.remove();
          } else if (typeof watchLocationRef.current === 'function') {
            (watchLocationRef.current as any)();
          }
        }
      } catch (e) {
        console.warn(e);
      }
      if (accelSubscription && typeof accelSubscription.remove === 'function') {
        accelSubscription.remove();
      }
      magnetometerRef.current?.remove?.();
      magnetometerRef.current = null;
    };
  }, []);

  // Calculate relative angle (Qibla - Device Heading)
  const relativeAngle = (qiblaDirection - heading + 360) % 360;
  const signedRelativeAngle = relativeAngle > 180 ? relativeAngle - 360 : relativeAngle;
  const signedRelativeRadians = (signedRelativeAngle * Math.PI) / 180;
  const arTargetLeft = Math.max(
    16,
    Math.min(width - 176, width / 2 + Math.sin(signedRelativeRadians) * Math.min(width * 0.34, 260) - 80)
  );
  const arTargetTop = Math.max(
    170,
    Math.min(height - 340, height * 0.48 - Math.cos(signedRelativeRadians) * 34)
  );

  // Reanimated 3D tilt style
  const tiltedChamberStyle = useAnimatedStyle(() => {
    const rx = interpolate(tiltYAnim.value, [-1, 1], [15, -15]) + "deg";
    const ry = interpolate(tiltXAnim.value, [-1, 1], [-15, 15]) + "deg";
    const tx = interpolate(tiltXAnim.value, [-1, 1], [-6, 6]);
    const ty = interpolate(tiltYAnim.value, [-1, 1], [6, -6]);
    return {
      transform: [
        { perspective: 500 },
        { rotateX: rx },
        { rotateY: ry },
        { translateX: tx },
        { translateY: ty },
      ],
    };
  });

  // Reanimated dial rotation style
  const dialRotationStyle = useAnimatedStyle(() => {
    const rot = interpolate(headingAnim.value, [0, 360], [0, -360]) + "deg";
    return {
      transform: [{ rotate: rot }],
    };
  });

  const isAligned = relativeAngle < 5 || relativeAngle > 355;
  const isFlat = Math.abs(tilt.x) < 0.15 && Math.abs(tilt.y) < 0.15;
  const isLightDial = activeSkin.id === 'hikmah' || activeSkin.id === 'moon';
  const dialInk = isLightDial ? '#3a2418' : 'rgba(255,255,255,0.74)';
  const dialMuted = isLightDial ? 'rgba(58,36,24,0.55)' : 'rgba(255,255,255,0.32)';

  useEffect(() => {
    if (isAligned && isFlat) {
      const now = Date.now();
      if (now - lastHapticRef.current > 1500) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        lastHapticRef.current = now;
      }
    }
  }, [isAligned, isFlat]);

  // Kaaba Distance calculation
  const distanceToKaaba = userLocation
    ? calculateDistance(userLocation.latitude, userLocation.longitude, KAABA_COORDS.latitude, KAABA_COORDS.longitude)
    : 0;

  // Live OSM Leaflet Map HTML
  const mapHtml = userLocation ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
      <style>
        html, body, #map { height: 100%; margin: 0; padding: 0; background-color: #101820; }
        .leaflet-bar { border: none !important; }
      </style>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const userLat = ${userLocation.latitude};
        const userLon = ${userLocation.longitude};
        const kaabaLat = 21.4225;
        const kaabaLon = 39.8262;

        const map = L.map('map', { zoomControl: false }).setView([userLat, userLon], 4);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const kaabaIcon = L.divIcon({
          html: '<div style="font-size: 26px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));">🕋</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const userIcon = L.divIcon({
          html: '<div style="font-size: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">📍</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        L.marker([userLat, userLon], {icon: userIcon}).addTo(map);
        L.marker([kaabaLat, kaabaLon], {icon: kaabaIcon}).addTo(map).bindPopup("Mecca (Kaaba)");

        // Draw line representing Qibla direction
        const qiblaLine = L.polyline([[userLat, userLon], [kaabaLat, kaabaLon]], {
          color: '#1abc9c',
          weight: 4,
          dashArray: '5, 8',
          opacity: 0.85
        }).addTo(map);

        const bounds = L.latLngBounds([[userLat, userLon], [kaabaLat, kaabaLon]]);
        map.fitBounds(bounds, { padding: [40, 40] });
      </script>
    </body>
    </html>
  ` : '';

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceMuted }]}>Locating GPS Coordinates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#e74c3c" />
          <Text style={[styles.errorText, { color: colors.onSurface }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              setError(null);
            }}
            style={[styles.retryButton, { borderColor: colors.brand }]}
          >
            <Text style={{ color: colors.brand, fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#061713' }]} edges={['top']}>
      <LinearGradient
        colors={['#061713', '#0b2a23', colors.surface]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.backgroundHalo} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Qibla Finder</Text>
          <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginTop: 2 }}>📍 {locationName}</Text>
        </View>
        
        {/* Toggle Mode Button & Nav Buttons */}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Pressable 
            onPress={() => setMode(mode === 'map' ? 'compass' : 'map')}
            style={[styles.modeToggle, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons 
              name={mode === 'map' ? "compass-outline" : "map-legend"}
              size={22} 
              color={colors.brand} 
            />
          </Pressable>
          <Pressable 
            onPress={() => router.replace("/(tabs)")} 
            hitSlop={10} 
            style={[styles.modeToggle, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name="home-outline" size={20} color={colors.onSurface} />
          </Pressable>
          <Pressable 
            onPress={() => router.push("/settings")} 
            hitSlop={10} 
            style={[styles.modeToggle, { backgroundColor: colors.surfaceSecondary }]}
          >
            <MaterialCommunityIcons name="cog-outline" size={20} color={colors.onSurface} />
          </Pressable>
        </View>
      </View>
      {needsCalibration && mode === 'compass' && (
        <Pressable
          onPress={() => Alert.alert("Calibrate your compass", "Move your phone in a figure-eight motion and keep it away from metal or magnetic cases. The fallback compass is less accurate until calibrated.")}
          style={[styles.calibrationBanner, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name="compass-outline" size={18} color={colors.brand} />
          <Text style={{ flex: 1, color: colors.onSurface, fontSize: 12 }}>Compass calibration recommended</Text>
          <MaterialCommunityIcons name="information-outline" size={18} color={colors.onSurfaceMuted} />
        </Pressable>
      )}

      <View style={[styles.modeSelector, { backgroundColor: 'rgba(0,0,0,0.24)', borderColor: colors.border }]}>
        {[
          { id: 'compass', label: 'Compass', icon: 'compass-outline' },
          { id: 'ar', label: 'Live AR', icon: 'camera-outline' },
          { id: 'view360', label: '360°', icon: 'image-filter-hdr' },
          { id: 'map', label: 'Map', icon: 'map-outline' },
        ].map(item => (
          <Pressable
            key={item.id}
            onPress={() => setMode(item.id as 'compass' | 'ar' | 'view360' | 'map')}
            style={[
              styles.modeSelectorItem,
              mode === item.id && { backgroundColor: colors.brand },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={17}
              color={mode === item.id ? '#061713' : colors.onSurfaceMuted}
            />
            <Text style={[styles.modeSelectorLabel, { color: mode === item.id ? '#061713' : colors.onSurfaceMuted }]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'map' ? (
        // Live OSM Map View
        <View style={{ flex: 1 }}>
          {Platform.OS === 'web' ? (
            <iframe
              srcDoc={mapHtml}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Qibla Map View"
            />
          ) : (
            <WebView
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={{ flex: 1 }}
              domStorageEnabled={true}
              javaScriptEnabled={true}
            />
          )}
          {/* Map Info Card overlay */}
          <View style={[styles.mapOverlayCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 24 }}>🕋</Text>
              <View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurface }}>Kaaba Distance</Text>
                {profile?.tier === 'premium' || profile?.trialActive ? (
                  <Text style={{ fontSize: 13, color: colors.onSurfaceMuted }}>{distanceToKaaba.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</Text>
                ) : (
                  <TouchableOpacity onPress={() => showPremiumModal('Kaaba Distance')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialCommunityIcons name="lock" size={13} color={colors.brand} />
                    <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '600' }}>Premium</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      ) : mode === 'ar' ? (
        <View style={styles.featureMode}>
          <View style={styles.arScene}>
            {cameraEnabled && cameraPermission?.granted ? (
              <CameraView style={StyleSheet.absoluteFillObject} facing="back" />
            ) : (
              <LinearGradient
                colors={['#101817', '#061713']}
                style={StyleSheet.absoluteFillObject}
              />
            )}

            <View style={styles.arCompassBubble} pointerEvents="none">
              <View style={[styles.arCompassWedge, { transform: [{ rotate: `${relativeAngle}deg` }] }]} />
              <View style={styles.arCompassDot} />
              <Text style={styles.arCompassNorth}>N</Text>
            </View>

            <View style={styles.arDistanceCard} pointerEvents="none">
              <Text style={styles.arDistanceTitle}>Kaaba's Direction</Text>
              <Text style={styles.arDistanceValue}>
                {distanceToKaaba.toLocaleString(undefined, { maximumFractionDigits: 0 })} km away
              </Text>
            </View>

            <View style={[styles.arKaabaMarker, { left: arTargetLeft, top: arTargetTop }]} pointerEvents="none">
              <KaabaOverlayIcon size={160} />
            </View>

            <View style={styles.arInstructionPill} pointerEvents="none">
              <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#fff" />
              <Text style={styles.arInstructionText}>
                {isAligned ? 'You are facing the Qibla' : `Turn ${Math.round(Math.abs(signedRelativeAngle))}° ${signedRelativeAngle < 0 ? 'left' : 'right'}`}
              </Text>
            </View>

            {cameraPermission && !cameraPermission.granted && (
              <View style={styles.cameraPermissionCard}>
                <MaterialCommunityIcons name="camera-off-outline" size={34} color="#fff" />
                <Text style={styles.cameraPermissionTitle}>Camera access is needed for Live AR</Text>
                <Text style={styles.cameraPermissionText}>Allow camera access to see the Qibla marker over your surroundings.</Text>
                <Pressable
                  onPress={() => requestCameraPermission()}
                  style={styles.cameraPermissionButton}
                >
                  <Text style={styles.cameraPermissionButtonText}>Allow camera</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => setCameraEnabled(value => !value)}
              style={styles.cameraToggle}
              accessibilityRole="switch"
              accessibilityState={{ checked: cameraEnabled }}
              accessibilityLabel="Toggle live camera"
            >
              <MaterialCommunityIcons
                name={cameraEnabled ? 'video-outline' : 'video-off-outline'}
                size={22}
                color="#fff"
              />
              <View style={[styles.cameraToggleTrack, cameraEnabled && styles.cameraToggleTrackOn]}>
                <View style={[styles.cameraToggleThumb, cameraEnabled && styles.cameraToggleThumbOn]} />
              </View>
            </Pressable>
          </View>
        </View>
      ) : mode === 'view360' ? (
        <View style={styles.featureMode}>
          <View style={styles.viewerHeader}>
            <View>
              <Text style={[styles.viewerTitle, { color: colors.onSurface }]}>Kaaba 360° View</Text>
              <Text style={[styles.viewerSubtitle, { color: colors.onSurfaceMuted }]}>Swipe to look around the Grand Mosque</Text>
            </View>
            <View style={styles.viewerHeaderActions}>
              <Pressable
                onPress={() => {
                  const nextLiveState = !panoramaLive;
                  setPanoramaLive(nextLiveState);
                  if (nextLiveState) syncPanoramaToHeading();
                }}
                style={[styles.viewerLiveControl, panoramaLive && styles.viewerLiveControlActive]}
                accessibilityRole="switch"
                accessibilityState={{ checked: panoramaLive }}
                accessibilityLabel="Follow device orientation in 360 view"
              >
                <MaterialCommunityIcons name={panoramaLive ? 'motion-sensor' : 'gesture-swipe'} size={16} color={panoramaLive ? '#061713' : colors.onSurfaceMuted} />
                <Text style={[styles.viewerLiveText, { color: panoramaLive ? '#061713' : colors.onSurfaceMuted }]}>
                  {panoramaLive ? 'Live orientation' : 'Drag view'}
                </Text>
              </Pressable>
              <View style={styles.viewerBearingBadge}>
                <MaterialCommunityIcons name="compass-outline" size={17} color="#061713" />
                <Text style={styles.viewerBearingText}>{Math.round(qiblaDirection)}° Qibla</Text>
              </View>
            </View>
          </View>

          <View
            style={[styles.panoramaViewport, { height: PANORAMA_VIEW_HEIGHT }]}
            {...panoramaPanResponder.panHandlers}
            {...(Platform.OS === 'web' ? {
              onPointerDown: handlePanoramaPointerDown,
              onPointerMove: handlePanoramaPointerMove,
              onPointerUp: handlePanoramaPointerUp,
              onPointerCancel: handlePanoramaPointerUp,
              onPointerLeave: handlePanoramaPointerUp,
            } as any : {})}
          >
            <View
              style={[
                styles.panoramaStrip,
                {
                  width: PANORAMA_IMAGE_WIDTH * 3,
                  height: PANORAMA_VIEW_HEIGHT,
                  transform: [{ translateX: panoramaOffset }],
                },
              ]}
            >
              {[0, 1, 2].map(index => (
                <Image
                  key={`kaaba-panorama-${index}`}
                  source={require('../assets/images/360/panos/hijr_ismail.jpg')}
                  style={{ width: PANORAMA_IMAGE_WIDTH, height: PANORAMA_VIEW_HEIGHT }}
                  resizeMode="cover"
                  accessibilityLabel="Kaaba 360 degree panorama"
                />
              ))}
            </View>

            <LinearGradient
              pointerEvents="none"
              colors={['rgba(0,0,0,0.42)', 'transparent', 'rgba(0,0,0,0.28)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.viewerCompassBubble} pointerEvents="none">
              <View style={[styles.arCompassWedge, { transform: [{ rotate: `${relativeAngle}deg` }] }]} />
              <View style={styles.arCompassDot} />
            </View>
            <View
              style={[
                styles.viewerTargetMarker,
                { left: arTargetLeft, top: Math.max(120, PANORAMA_VIEW_HEIGHT * 0.42) },
              ]}
              pointerEvents="none"
            >
              <KaabaOverlayIcon size={132} />
            </View>
            <View style={styles.panoramaHint} pointerEvents="none">
              <MaterialCommunityIcons name="gesture-swipe-horizontal" size={18} color="#fff" />
              <Text style={styles.panoramaHintText}>Swipe left or right to explore</Text>
            </View>
          </View>

          <View style={[styles.viewerInfoCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.viewerInfoIcon}>
              <KaabaOverlayIcon size={48} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.viewerInfoTitle, { color: colors.onSurface }]}>Qibla bearing {Math.round(qiblaDirection)}°</Text>
              <Text style={[styles.viewerInfoText, { color: colors.onSurfaceMuted }]}>The marker follows your current device heading. Keep location and compass permissions enabled for the most accurate alignment.</Text>
            </View>
          </View>
        </View>
      ) : (
        // Compass view
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Tilt Calibration Alert */}
          {isSensorsAvailable && !isFlat && (
            <View style={styles.tiltWarning}>
              <MaterialCommunityIcons name="phone-rotate-landscape" size={16} color={colors.warning} />
              <Text style={styles.tiltWarningText}>⚠️ Hold device flat for compass accuracy</Text>
            </View>
          )}

          {/* Compass layout container */}
          <View style={styles.compassContainer}>
            
            {/* 3D Outer Beveled Casing */}
            <LinearGradient
              colors={activeSkin.caseGradient as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.caseOuterBorder}
            >
              {/* Inner metallic drop shadows and casing depth */}
              <LinearGradient
                colors={['#000', '#1c1b18', '#38352e']}
                style={styles.caseInnerChamber}
              >
                {/* 12 o'clock fixed top pointer inside the static casing */}
                <View style={styles.topPointer}>
                  <MaterialCommunityIcons name="triangle" size={14} color={isAligned && isFlat ? '#2ecc71' : '#e74c3c'} />
                </View>

                {/* 3D Tilted Compass Chamber (Animates based on phone tilt for deep parallax) */}
                <Animated.View
                  style={[
                    styles.tiltedChamber,
                    tiltedChamberStyle,
                  ]}
                >
                  {/* Rotating Dial Disk */}
                  <Animated.View
                    style={[
                      styles.rotatingDialDisk,
                      {
                        backgroundColor: activeSkin.bg,
                        borderColor: isAligned && isFlat ? '#2ecc71' : activeSkin.ringColor,
                      },
                      dialRotationStyle,
                    ]}
                  >
                    {/* Concentric texture circles for physical detailing */}
                    <View style={styles.concentricCircle} />
                    <View style={[styles.concentricCircle, { width: 140, height: 140 }]} />
                    <View style={[styles.concentricCircle, { width: 80, height: 80 }]} />
                    <LinearGradient
                      colors={isLightDial ? ['rgba(255,255,255,0.48)', 'rgba(185,116,40,0.08)', 'rgba(58,36,24,0.08)'] : ['rgba(255,255,255,0.14)', 'transparent']}
                      style={styles.dialPatina}
                    />
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                      <View key={`rose-${deg}`} style={[styles.roseArm, { transform: [{ rotate: `${deg}deg` }] }]}>
                        <View style={[styles.roseArmFill, { borderBottomColor: deg % 90 === 0 ? dialInk : dialMuted }]} />
                      </View>
                    ))}

                    {/* Rotating Cardinal Directions */}
                    <View style={styles.rotatingCardinals}>
                      <Text style={[styles.cardinal, { position: 'absolute', top: 10, color: isAligned && isFlat ? '#2ecc71' : activeSkin.accent, fontSize: 19 }]}>N</Text>
                      <Text style={[styles.cardinal, { position: 'absolute', right: 10, color: dialInk }]}>E</Text>
                      <Text style={[styles.cardinal, { position: 'absolute', bottom: 10, color: dialInk }]}>S</Text>
                      <Text style={[styles.cardinal, { position: 'absolute', left: 10, color: dialInk }]}>W</Text>
                    </View>

                    {/* 3D Kaaba target icon on the dial ring at Mecca angle */}
                    <View
                      style={[
                        styles.rotatingKaabaMarker,
                        {
                          transform: [
                            { rotate: `${qiblaDirection}deg` },
                            { translateY: -98 } 
                          ]
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 18, transform: [{ rotate: `-${qiblaDirection}deg` }] }}>🕋</Text>
                    </View>

                    {/* Compass Ticks */}
                    {Array.from({ length: 72 }, (_, i) => i * 5).map(deg => {
                      const isCardinal = deg % 90 === 0;
                      const isMajor = deg % 30 === 0;
                      return (
                        <View
                          key={deg}
                          style={[
                            styles.degreeMarker,
                            {
                              transform: [{ rotate: `${deg}deg` }],
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.markerLine,
                              { 
                                backgroundColor: isCardinal ? activeSkin.accent : isMajor ? dialInk : dialMuted,
                                height: isCardinal ? 15 : isMajor ? 11 : 6,
                              }
                            ]}
                          />
                        </View>
                      );
                    })}

                    {/* Degree text readouts */}
                    {[0, 90, 180, 270].map(deg => {
                      const r = 82;
                      const x = r * Math.sin((deg * Math.PI) / 180);
                      const y = -r * Math.cos((deg * Math.PI) / 180);
                      return (
                        <Text
                          key={`text-${deg}`}
                          style={[
                            styles.degreeText,
                            {
                              position: 'absolute',
                              left: 111 + x,
                              top: 111 + y,
                              transform: [{ translateX: -10 }, { translateY: -6 }],
                              color: 'rgba(255,255,255,0.3)',
                            },
                          ]}
                        >
                          {deg}°
                        </Text>
                      );
                    })}
                  </Animated.View>

                  {/* 3D Beveled Needle (Points to Mecca relative to dial/phone rotation) */}
                  <Animated.View
                    style={[
                      styles.needleWrapper,
                      {
                        transform: [{ rotate: `${relativeAngle}deg` }],
                      },
                    ]}
                  >
                    {/* Beveled Top Needle half pointers */}
                    <View style={styles.needlePair}>
                      <View style={[styles.needleHalfLeft, { borderBottomColor: isAligned && isFlat ? '#2ecc71' : activeSkin.needleColorLight }]} />
                      <View style={[styles.needleHalfRight, { borderBottomColor: isAligned && isFlat ? '#27ae60' : activeSkin.needleColorDark }]} />
                    </View>
                    {/* Beveled Bottom balance pointers */}
                    <View style={[styles.needlePair, { transform: [{ rotate: '180deg' }] }]}>
                      <View style={[styles.needleHalfLeft, { borderBottomColor: '#7f8c8d', borderBottomWidth: 40, borderLeftWidth: 6 }]} />
                      <View style={[styles.needleHalfRight, { borderBottomColor: '#34495e', borderBottomWidth: 40, borderRightWidth: 6 }]} />
                    </View>

                    {/* Kaaba pointer target text at the needle tip */}
                    <View style={styles.floatingMeccaIndicator}>
                      <Text style={{ fontSize: 16 }}>🕋</Text>
                    </View>
                  </Animated.View>

                  {/* Central Cap & Bubble level */}
                  {isSensorsAvailable ? (
                    <View style={styles.centerBrassCap}>
                      <View style={styles.bubbleLevelRing}>
                        <View style={[
                          styles.bubbleIndicatorDot, 
                          {
                            transform: [
                              { translateX: Math.max(-10, Math.min(10, tilt.x * 20)) },
                              { translateY: Math.max(-10, Math.min(10, -tilt.y * 20)) }
                            ],
                            backgroundColor: isFlat ? '#2ecc71' : colors.warning
                          }
                        ]} />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.staticCenterPivot} />
                  )}

                </Animated.View>

                {/* Hyper-realistic Glass Dome Reflection shine cover overlay */}
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.22)', 'rgba(255, 255, 255, 0.05)', 'transparent']}
                  style={styles.glassReflectionGlare}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.8, y: 0.8 }}
                />
              </LinearGradient>
            </LinearGradient>

          </View>

          {/* Direction Banner */}
          <View style={[
            styles.directionGuide, 
            { 
              backgroundColor: isAligned && isFlat ? 'rgba(46, 204, 113, 0.12)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: isAligned && isFlat ? '#2ecc71' : colors.border
            }
          ]}>
            <Text style={[styles.guideText, { color: isAligned && isFlat ? '#2ecc71' : colors.onSurface }]}>
              {isAligned && isFlat ? '🎯 Aligned with Kaaba! Face this direction' : 'Turn device to align 3D green needle'}
            </Text>
          </View>

          {/* Location details card */}
          <View style={styles.infoContainer}>
            <View style={[styles.infoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Distance to Mecca</Text>
              {profile?.tier === 'premium' || profile?.trialActive ? (
                <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                  {distanceToKaaba.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
                </Text>
              ) : (
                <TouchableOpacity onPress={() => showPremiumModal('Kaaba Distance')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="lock" size={14} color={colors.brand} />
                  <Text style={{ color: colors.brand, fontSize: 12, fontWeight: '600' }}>Premium</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.infoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Qibla Angle</Text>
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>{Math.round(qiblaDirection)}°</Text>
            </View>
          </View>

          {/* Skins selector row */}
          <View style={styles.skinSection}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Compass Skins</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skinScroll}>
              {DIAL_SKINS.map(skin => (
                <TouchableOpacity
                  key={skin.id}
                  onPress={() => {
                    if (skin.id !== 'hikmah' && profile?.tier !== 'premium' && !profile?.trialActive) {
                      showPremiumModal('Compass Skins');
                      return;
                    }
                    setActiveSkin(skin);
                  }}
                  style={[
                    styles.skinCard,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    activeSkin.id === skin.id && { borderColor: colors.brand, borderWidth: 2 }
                  ]}
                >
                  <View style={[styles.skinPreview, { backgroundColor: skin.bg, borderColor: skin.ringColor }]}>
                    <Text style={[styles.skinNorth, { color: skin.accent }]}>N</Text>
                    <View style={[styles.skinNeedle, { backgroundColor: skin.needleColorLight }]} />
                    <View style={[styles.skinHub, { backgroundColor: skin.ringColor }]} />
                  </View>
                  <Text style={[styles.skinName, { color: colors.onSurface }]}>{skin.name}</Text>
                  {skin.id !== 'hikmah' && profile?.tier !== 'premium' && (
                    <MaterialCommunityIcons name="lock" size={12} color={colors.brand} style={{ position: 'absolute', top: 4, right: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  calibrationBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, borderWidth: 1, borderRadius: 12 },
  container: {
    flex: 1,
  },
  backgroundHalo: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    top: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.12)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: '700' },
  modeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 6,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
  },
  modeSelectorItem: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  modeSelectorLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  featureMode: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
  arScene: {
    flex: 1,
    minHeight: 500,
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#061713',
    position: 'relative',
  },
  arCompassBubble: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(230,230,230,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arCompassWedge: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderRightWidth: 34,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'rgba(65, 133, 235, 0.78)',
    left: 22,
    top: 27,
  },
  arCompassDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4b3e',
  },
  arCompassNorth: {
    position: 'absolute',
    top: 5,
    color: 'rgba(0,0,0,0.72)',
    fontSize: 10,
    fontWeight: '800',
  },
  arDistanceCard: {
    position: 'absolute',
    top: 28,
    alignSelf: 'center',
    minWidth: 196,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
  },
  arDistanceTitle: {
    color: '#f7f4e9',
    fontSize: 16,
    fontWeight: '800',
  },
  arDistanceValue: {
    color: '#f7f4e9',
    fontSize: 14,
    marginTop: 2,
  },
  arKaabaMarker: {
    position: 'absolute',
    width: 160,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 7,
  },
  arInstructionPill: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 92,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  arInstructionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  cameraPermissionCard: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: '32%',
    padding: 22,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.84)',
    alignItems: 'center',
  },
  cameraPermissionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 10,
  },
  cameraPermissionText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  cameraPermissionButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#8fe38d',
  },
  cameraPermissionButtonText: {
    color: '#061713',
    fontSize: 13,
    fontWeight: '800',
  },
  cameraToggle: {
    position: 'absolute',
    bottom: 20,
    left: 18,
    minWidth: 112,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraToggleTrack: {
    width: 44,
    height: 25,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  cameraToggleTrackOn: {
    backgroundColor: '#8fe38d',
  },
  cameraToggleThumb: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#a7b0aa',
    alignSelf: 'flex-start',
  },
  cameraToggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#07572f',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  viewerHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  viewerLiveControl: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  viewerLiveControlActive: {
    borderColor: '#8fe38d',
    backgroundColor: '#8fe38d',
  },
  viewerLiveText: {
    fontSize: 10,
    fontWeight: '800',
  },
  viewerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  viewerBearingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#8fe38d',
  },
  viewerBearingText: {
    color: '#061713',
    fontSize: 11,
    fontWeight: '800',
  },
  panoramaViewport: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 22,
    backgroundColor: '#101817',
    position: 'relative',
  },
  panoramaStrip: {
    flexDirection: 'row',
  },
  viewerCompassBubble: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(230,230,230,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerTargetMarker: {
    position: 'absolute',
    width: 132,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panoramaHint: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.66)',
  },
  panoramaHintText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  viewerInfoCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewerInfoIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: 'rgba(143,227,141,0.12)',
  },
  viewerInfoTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  viewerInfoText: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  tiltWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  tiltWarningText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
    marginLeft: 6,
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    minHeight: 300,
  },
  
  // Realistic 3D Casing & Layers
  caseOuterBorder: {
    width: Math.min(width - 54, 304),
    height: Math.min(width - 54, 304),
    borderRadius: 152,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
  },
  caseInnerChamber: {
    flex: 1,
    borderRadius: 142,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.8)',
  },
  topPointer: {
    position: 'absolute',
    top: 6,
    zIndex: 40,
  },
  tiltedChamber: {
    width: 232,
    height: 232,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rotatingDialDisk: {
    width: 232,
    height: 232,
    borderRadius: 116,
    borderWidth: 4,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  dialPatina: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 116,
  },
  roseArm: {
    position: 'absolute',
    width: 32,
    height: 166,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  roseArmFill: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 70,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    opacity: 0.72,
  },
  concentricCircle: {
    position: 'absolute',
    width: 198,
    height: 198,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(58,36,24,0.18)',
  },
  rotatingCardinals: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardinal: {
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  rotatingKaabaMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    zIndex: 15,
  },
  degreeMarker: {
    position: 'absolute',
    width: 2,
    height: 214,
    alignItems: 'center',
  },
  markerLine: {
    width: 1.5,
  },
  degreeText: {
    fontSize: 8,
    fontWeight: '600',
  },

  // 3D Beveled Compass Needle
  needleWrapper: {
    position: 'absolute',
    width: 30,
    height: 232,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  needlePair: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'flex-end',
    position: 'absolute',
    top: 30, // anchors it properly
  },
  needleHalfLeft: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 0,
    borderBottomWidth: 70,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  needleHalfRight: {
    width: 0,
    height: 0,
    borderLeftWidth: 0,
    borderRightWidth: 6,
    borderBottomWidth: 70,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  floatingMeccaIndicator: {
    position: 'absolute',
    top: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Central Pivot & level
  centerBrassCap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D4AF37',
    borderWidth: 2,
    borderColor: '#ffe066',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 30,
  },
  bubbleLevelRing: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  staticCenterPivot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D4AF37',
    borderWidth: 2,
    borderColor: '#ffe066',
    zIndex: 30,
  },

  // Reflection glare overlay
  glassReflectionGlare: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 50,
    pointerEvents: 'none',
  },

  directionGuide: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  guideText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  skinSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  skinScroll: {
    gap: 10,
  },
  skinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  skinColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  skinPreview: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  skinNorth: { position: 'absolute', top: 3, fontSize: 9, fontWeight: '900' },
  skinNeedle: { width: 3, height: 32, borderRadius: 2, transform: [{ rotate: '20deg' }] },
  skinHub: { position: 'absolute', width: 9, height: 9, borderRadius: 5 },
  skinName: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapOverlayCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
});
