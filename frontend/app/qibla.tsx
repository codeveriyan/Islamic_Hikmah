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
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/ThemeContext';
import { useTranslation } from '@/src/localization';
import { getSavedLocation, setSavedLocation } from '@/src/storage';

const { width } = Dimensions.get('window');

// Muslim Pro color scheme
const COLORS = {
  primary: '#1abc9c', // Teal
  dark: '#0d3436', // Very dark teal/navy
  surface: '#0f5856', // Deep teal
  lightBg: '#1e3c3a', // Light dark teal
  accent: '#00d4aa', // Bright teal accent
  white: '#ffffff',
  text: '#ecf0f1', // Light gray text
  muted: '#95a5a6', // Muted text
  error: '#e74c3c',
  success: '#27ae60',
};

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const KAABA_COORDS: LocationCoords = {
  latitude: 21.4225,
  longitude: 39.8262,
};

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

  const headingAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const watchHeadingRef = useRef<any>(null);
  const watchLocationRef = useRef<any>(null);

  // Calculate Qibla direction using haversine formula
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

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        // Get saved coordinates to avoid slow GPS lock on startup
        let savedLoc = await getSavedLocation();
        let coords: LocationCoords;

        if (savedLoc && savedLoc.lat && savedLoc.lon) {
          coords = {
            latitude: savedLoc.lat,
            longitude: savedLoc.lon,
          };
          setUserLocation(coords);
          setLocationName(savedLoc.city || 'Your Location');
          const qibla = calculateQibla(coords.latitude, coords.longitude);
          setQiblaDirection(qibla);
          setLoading(false);
        }

        // Fetch precise coordinates asynchronously
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        coords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        setUserLocation(coords);
        setAccuracy(location.coords.accuracy);

        // Cache coordinates
        await setSavedLocation({
          lat: coords.latitude,
          lon: coords.longitude,
          city: savedLoc?.city || '',
        });

        // Reverse geocode to get location name
        reverseGeocode(coords.latitude, coords.longitude);

        const qibla = calculateQibla(coords.latitude, coords.longitude);
        setQiblaDirection(qibla);
        setLoading(false);

        // Watch heading changes safely
        watchHeadingRef.current = await Location.watchHeadingAsync(headingData => {
          const rawHeading = headingData.trueHeading !== -1 ? headingData.trueHeading : headingData.magHeading;
          setHeading(rawHeading);

          // Animate to new heading smoothly
          Animated.timing(headingAnim, {
            toValue: rawHeading,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();

          // Scale pulse on heading change
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.03,
              duration: 80,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 80,
              useNativeDriver: true,
            }),
          ]).start();
        });

        // Watch location changes
        watchLocationRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 150,
          },
          location => {
            const newCoords: LocationCoords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setUserLocation(newCoords);
            setAccuracy(location.coords.accuracy);

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
        console.warn("Error removing heading watch:", e);
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
        console.warn("Error removing location watch:", e);
      }
    };
  }, []);

  // Calculate relative angle (Qibla - Device Heading)
  const relativeAngle = (qiblaDirection - heading + 360) % 360;

  // Convert heading to rotation
  const rotateAnim = headingAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '-360deg'],
    extrapolate: 'clamp',
  });

  // Direction guide text
  const getDirectionGuide = (): { text: string; icon: string; color: string } => {
    if (relativeAngle < 5 || relativeAngle > 355) {
      return { text: '🎯 Perfect! Face straight ahead', icon: 'check-circle', color: COLORS.success };
    } else if (relativeAngle <= 180) {
      return { text: `↻ Turn ${Math.round(relativeAngle)}° to your right`, icon: 'arrow-right-bold-circle', color: COLORS.accent };
    } else {
      return { text: `↺ Turn ${Math.round(360 - relativeAngle)}° to your left`, icon: 'arrow-left-bold-circle', color: COLORS.accent };
    }
  };

  const directionGuide = getDirectionGuide();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={[COLORS.dark, COLORS.surface, COLORS.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Initializing Qibla Compass...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={[COLORS.dark, COLORS.surface, COLORS.dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.centerContent}>
            <MaterialCommunityIcons name="alert-circle" size={60} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                setError(null);
              }}
              style={styles.retryButton}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.dark, COLORS.surface, COLORS.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backHeader}>
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.white} />
            </Pressable>
            <Text style={styles.headerTitleText}>Qibla</Text>
            <View style={{ width: 28 }} />
          </View>
          <Text style={styles.locationName}>{locationName}</Text>
        </View>

        {/* Main Compass Container */}
        <View style={styles.compassContainer}>
          {/* Compass Ring Background with gradient */}
          <LinearGradient
            colors={['rgba(26, 188, 156, 0.15)', 'rgba(0, 212, 170, 0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.compassGradientRing}
          >
            <View style={styles.compassRing}>
              {/* Cardinal Directions */}
              <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
              <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
              <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
              <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>

              {/* Rotating Compass */}
              <Animated.View
                style={[
                  styles.rotatingCompass,
                  {
                    transform: [{ rotate: rotateAnim }],
                  },
                ]}
              >
                {/* Degree Markers */}
                {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350].map(deg => {
                  const isMajor = deg % 30 === 0;
                  return (
                    <View
                      key={deg}
                      style={[
                        styles.degreeMarker,
                        {
                          transform: [{ rotate: `${deg}deg` }],
                          top: 18,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.markerLine,
                          isMajor && styles.markerLineMajor,
                        ]}
                      />
                    </View>
                  );
                })}

                {/* Degree Numbers */}
                {[0, 90, 180, 270].map(deg => {
                  const x = 100 * Math.sin((deg * Math.PI) / 180);
                  const y = -100 * Math.cos((deg * Math.PI) / 180);
                  return (
                    <Text
                      key={`text-${deg}`}
                      style={[
                        styles.degreeText,
                        {
                          position: 'absolute',
                          left: 110 + x,
                          top: 110 + y,
                          transform: [{ translateX: -12 }, { translateY: -8 }],
                        },
                      ]}
                    >
                      {deg}°
                    </Text>
                  );
                })}
              </Animated.View>

              {/* Qibla Direction Indicator (Red Arrow) */}
              <Animated.View
                style={[
                  styles.qiblaArrowContainer,
                  {
                    transform: [{ rotate: `${relativeAngle}deg` }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#ff6b6b', '#ff5252']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.qiblaArrow}
                >
                  <MaterialCommunityIcons name="arrow-up" size={32} color={COLORS.white} />
                </LinearGradient>
              </Animated.View>

              {/* Center Circle */}
              <View style={styles.centerCircle}>
                <View style={styles.centerDot} />
              </View>

              {/* Top Indicator Line */}
              <View style={styles.topIndicator} />
            </View>
          </LinearGradient>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCardsContainer}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoLabel}>QIBLA DIRECTION</Text>
              <Text style={styles.infoValue}>{Math.round(qiblaDirection)}°</Text>
            </View>
            <LinearGradient
              colors={['rgba(26, 188, 156, 0.2)', 'rgba(0, 212, 170, 0.1)']}
              style={styles.infoCardBg}
            />
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardContent}>
              <Text style={styles.infoLabel}>YOUR HEADING</Text>
              <Text style={styles.infoValue}>{Math.round(heading)}°</Text>
            </View>
            <LinearGradient
              colors={['rgba(52, 152, 219, 0.2)', 'rgba(41, 128, 185, 0.1)']}
              style={styles.infoCardBg}
            />
          </View>
        </View>

        {/* Accuracy Info */}
        <View style={styles.accuracySection}>
          <View style={styles.accuracyContent}>
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={COLORS.accent} />
            <Text style={styles.accuracyText}>
              Accuracy: {accuracy ? `±${Math.round(accuracy)}m` : 'Calculating...'}
            </Text>
          </View>
        </View>

        {/* Direction Guide */}
        <LinearGradient
          colors={['rgba(26, 188, 156, 0.25)', 'rgba(0, 212, 170, 0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.directionGuide}
        >
          <MaterialCommunityIcons
            name={directionGuide.icon as any}
            size={22}
            color={directionGuide.color}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.guideText, { color: directionGuide.color }]}>
            {directionGuide.text}
          </Text>
        </LinearGradient>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  gradient: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 10,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  locationName: {
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
    marginTop: -4,
  },
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    flex: 1,
    minHeight: 280,
  },
  compassGradientRing: {
    width: 260,
    height: 260,
    borderRadius: 130,
    padding: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  compassRing: {
    flex: 1,
    borderRadius: 130,
    backgroundColor: 'rgba(15, 88, 86, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(26, 188, 156, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cardinal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accent,
    position: 'absolute',
  },
  cardinalN: {
    top: 8,
  },
  cardinalS: {
    bottom: 8,
  },
  cardinalE: {
    right: 8,
  },
  cardinalW: {
    left: 8,
  },
  rotatingCompass: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  degreeMarker: {
    position: 'absolute',
    width: 2,
    height: 16,
    alignItems: 'center',
  },
  markerLine: {
    width: 2,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  markerLineMajor: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  degreeText: {
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: '700',
  },
  qiblaArrowContainer: {
    position: 'absolute',
    zIndex: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qiblaArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff5252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  centerCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(26, 188, 156, 0.5)',
    zIndex: 20,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  topIndicator: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 1.5,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(26, 188, 156, 0.25)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  infoCardsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(26, 188, 156, 0.3)',
  },
  infoCardBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  infoCardContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.muted,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accent,
  },
  accuracySection: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(26, 188, 156, 0.2)',
  },
  accuracyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: 8,
  },
  directionGuide: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 188, 156, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  guideText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
});
