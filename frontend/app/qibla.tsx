import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Platform,
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/ThemeContext';
import { useTranslation } from '@/src/localization';
import { theme } from '@/src/theme';

const { width, height } = Dimensions.get('window');

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const KAABA_COORDS: LocationCoords = {
  latitude: 21.4225,
  longitude: 39.8262,
};

const DIAL_SKINS = [
  { id: 'gold', name: 'Imperial Gold', ringColor: '#d4af37', bg: '#171512', accent: '#f1c40f', needleColorLight: '#ffe066', needleColorDark: '#d4af37', caseGradient: ['#ffe066', '#d4af37', '#aa8000', '#554000'] },
  { id: 'teal', name: 'Vintage Emerald', ringColor: '#1abc9c', bg: '#0d3436', accent: '#00d4aa', needleColorLight: '#2ecc71', needleColorDark: '#27ae60', caseGradient: ['#00d4aa', '#1abc9c', '#148f77', '#0e5a4c'] },
  { id: 'metal', name: 'Silver Tech', ringColor: '#bdc3c7', bg: '#2c3e50', accent: '#ecf0f1', needleColorLight: '#e74c3c', needleColorDark: '#c0392b', caseGradient: ['#ffffff', '#bdc3c7', '#7f8c8d', '#34495e'] },
  { id: 'obsidian', name: 'Obsidian Cyber', ringColor: '#3498db', bg: '#101114', accent: '#5dade2', needleColorLight: '#3498db', needleColorDark: '#2980b9', caseGradient: ['#5dade2', '#3498db', '#1f618d', '#154360'] },
];

export default function QiblaScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  const [heading, setHeading] = useState<number>(0);
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>('Calculating...');

  // Toggle modes: 'compass' | 'map'
  const [mode, setMode] = useState<'compass' | 'map'>('compass');
  const [activeSkin, setActiveSkin] = useState(DIAL_SKINS[0]);

  // Bubble level tilt state
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isSensorsAvailable, setIsSensorsAvailable] = useState(false);

  const headingAnim = useRef(new Animated.Value(0)).current;
  const watchHeadingRef = useRef<any>(null);
  const watchLocationRef = useRef<any>(null);
  const lastHapticRef = useRef<number>(0);

  // Animated values for 3D tilt dampening
  const tiltXAnim = useRef(new Animated.Value(0)).current;
  const tiltYAnim = useRef(new Animated.Value(0)).current;

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

        // Heading listener
        try {
          if (Platform.OS !== 'web') {
            watchHeadingRef.current = await Location.watchHeadingAsync(headingData => {
              const rawHeading = headingData.trueHeading !== -1 ? headingData.trueHeading : headingData.magHeading;
              setHeading(rawHeading);

              Animated.timing(headingAnim, {
                toValue: rawHeading,
                duration: 250,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start();
            });
          }
        } catch (err) {
          console.warn("watchHeadingAsync is not supported:", err);
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
              Animated.spring(tiltXAnim, {
                toValue: data.x,
                tension: 20,
                friction: 8,
                useNativeDriver: true,
              }).start();

              Animated.spring(tiltYAnim, {
                toValue: data.y,
                tension: 20,
                friction: 8,
                useNativeDriver: true,
              }).start();
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
    };
  }, []);

  // Calculate relative angle (Qibla - Device Heading)
  const relativeAngle = (qiblaDirection - heading + 360) % 360;

  // Convert heading to rotation (inverse for animation)
  const rotateAnim = headingAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '-360deg'],
    extrapolate: 'clamp',
  });

  // Calculate dynamic 3D tilt translations & rotations
  const rotateX = tiltYAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['15deg', '-15deg'],
    extrapolate: 'clamp',
  });

  const rotateY = tiltXAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
    extrapolate: 'clamp',
  });

  const translateX = tiltXAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-6, 6],
    extrapolate: 'clamp',
  });

  const translateY = tiltYAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [6, -6],
    extrapolate: 'clamp',
  });

  const isAligned = relativeAngle < 5 || relativeAngle > 355;
  const isFlat = Math.abs(tilt.x) < 0.15 && Math.abs(tilt.y) < 0.15;

  // Trigger haptic click when aligning perfectly
  useEffect(() => {
    if (isAligned && isFlat) {
      const now = Date.now();
      if (now - lastHapticRef.current > 1500) {
        Haptics.notificationAsync(Haps => Haptics.NotificationFeedbackType.Success).catch(() => {});
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.title, { color: colors.onSurface }]}>Qibla Finder</Text>
          <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginTop: 2 }}>📍 {locationName}</Text>
        </View>
        
        {/* Toggle Mode Button */}
        <Pressable 
          onPress={() => setMode(mode === 'compass' ? 'map' : 'compass')} 
          style={[styles.modeToggle, { backgroundColor: colors.surfaceSecondary }]}
        >
          <MaterialCommunityIcons 
            name={mode === 'compass' ? "map-legend" : "compass-outline"} 
            size={22} 
            color={colors.brand} 
          />
        </Pressable>
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
                <Text style={{ fontSize: 13, color: colors.onSurfaceMuted }}>{distanceToKaaba.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // Compass view
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Tilt Calibration Alert */}
          {isSensorsAvailable && !isFlat && (
            <View style={styles.tiltWarning}>
              <MaterialCommunityIcons name="phone-rotate-landscape" size={16} color="#f59e0b" />
              <Text style={styles.tiltWarningText}>⚠️ Hold device flat for compass accuracy</Text>
            </View>
          )}

          {/* Compass layout container */}
          <View style={styles.compassContainer}>
            
            {/* 3D Outer Beveled Casing */}
            <LinearGradient
              colors={activeSkin.caseGradient}
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
                    {
                      transform: [
                        { perspective: 500 },
                        { rotateX: rotateX },
                        { rotateY: rotateY },
                        { translateX: translateX },
                        { translateY: translateY },
                      ],
                    },
                  ]}
                >
                  {/* Rotating Dial Disk */}
                  <Animated.View
                    style={[
                      styles.rotatingDialDisk,
                      {
                        backgroundColor: activeSkin.bg,
                        borderColor: isAligned && isFlat ? '#2ecc71' : activeSkin.ringColor,
                        transform: [{ rotate: rotateAnim }],
                      },
                    ]}
                  >
                    {/* Concentric texture circles for physical detailing */}
                    <View style={styles.concentricCircle} />
                    <View style={[styles.concentricCircle, { width: 140, height: 140 }]} />
                    <View style={[styles.concentricCircle, { width: 80, height: 80 }]} />

                    {/* Rotating Cardinal Directions */}
                    <View style={styles.rotatingCardinals}>
                      <Text style={[styles.cardinal, { position: 'absolute', top: 10, color: isAligned && isFlat ? '#2ecc71' : activeSkin.accent, fontSize: 16 }]}>N</Text>
                      <Text style={[styles.cardinal, { position: 'absolute', right: 10, color: 'rgba(255,255,255,0.4)' }]}>E</Text>
                      <Text style={[styles.cardinal, { position: 'absolute', bottom: 10, color: 'rgba(255,255,255,0.4)' }]}>S</Text>
                      <Text style={[styles.cardinal, { position: 'absolute', left: 10, color: 'rgba(255,255,255,0.4)' }]}>W</Text>
                    </View>

                    {/* 3D Kaaba target icon on the dial ring at Mecca angle */}
                    <View
                      style={[
                        styles.rotatingKaabaMarker,
                        {
                          transform: [
                            { rotate: `${qiblaDirection}deg` },
                            { translateY: -82 } 
                          ]
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 18, transform: [{ rotate: `-${qiblaDirection}deg` }] }}>🕋</Text>
                    </View>

                    {/* Compass Ticks */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
                      const isCardinal = deg % 90 === 0;
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
                                backgroundColor: isCardinal ? activeSkin.accent : 'rgba(255,255,255,0.25)',
                                height: isCardinal ? 10 : 6,
                              }
                            ]}
                          />
                        </View>
                      );
                    })}

                    {/* Degree text readouts */}
                    {[0, 90, 180, 270].map(deg => {
                      const r = 68;
                      const x = r * Math.sin((deg * Math.PI) / 180);
                      const y = -r * Math.cos((deg * Math.PI) / 180);
                      return (
                        <Text
                          key={`text-${deg}`}
                          style={[
                            styles.degreeText,
                            {
                              position: 'absolute',
                              left: 95 + x,
                              top: 95 + y,
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
                            backgroundColor: isFlat ? '#2ecc71' : '#f59e0b'
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
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                {distanceToKaaba.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
              </Text>
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
                  onPress={() => setActiveSkin(skin)}
                  style={[
                    styles.skinCard,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    activeSkin.id === skin.id && { borderColor: colors.brand, borderWidth: 2 }
                  ]}
                >
                  <View style={[styles.skinColorDot, { backgroundColor: skin.ringColor }]} />
                  <Text style={[styles.skinName, { color: colors.onSurface }]}>{skin.name}</Text>
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
  container: {
    flex: 1,
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
    color: '#f59e0b',
    fontWeight: '600',
    marginLeft: 6,
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    minHeight: 270,
  },
  
  // Realistic 3D Casing & Layers
  caseOuterBorder: {
    width: 250,
    height: 250,
    borderRadius: 125,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 16,
  },
  caseInnerChamber: {
    flex: 1,
    borderRadius: 117,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.8)',
  },
  topPointer: {
    position: 'absolute',
    top: 6,
    zIndex: 40,
  },
  tiltedChamber: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rotatingDialDisk: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3.5,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  concentricCircle: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
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
    height: 184,
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
    height: 200,
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
    backgroundColor: '#d4af37',
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
    backgroundColor: '#d4af37',
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
