import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/ThemeContext';
import { useTranslation } from '@/src/localization';
import { getDhikrCounts, setDhikrCount } from '@/src/storage';
import { useAudioPlayer } from 'expo-audio';
import { theme } from '@/src/theme';

const { width } = Dimensions.get('window');

const TASBIH_PHRASES = [
  { id: 1, arabic: 'سُبْحَانَ اللَّهِ', transliteration: 'SubhanAllah', meaning: 'Glory be to Allah' },
  { id: 2, arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', meaning: 'Praise be to Allah' },
  { id: 3, arabic: 'اللَّهُ أَكْبَرُ', transliteration: 'Allahu Akbar', meaning: 'Allah is Greatest' },
  { id: 4, arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ', transliteration: 'La hawla wa la quwwata illa billah', meaning: 'No power except with Allah' },
  { id: 5, arabic: 'أَسْتَغْفِرُ اللَّهَ', transliteration: 'Astaghfirullah', meaning: 'I seek forgiveness from Allah' },
  { id: 6, arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', transliteration: 'La ilaha illallah', meaning: 'There is no god but Allah' },
];

interface TasbihState {
  count: number;
  phraseId: number;
  targetCount: number;
}

export default function TasbihScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  // Audio player for offline click sound
  const tickPlayer = useAudioPlayer(require('../assets/audio/tick.wav'));

  const [state, setState] = useState<TasbihState>({
    count: 0,
    phraseId: 1,
    targetCount: 33,
  });

  const [isMuted, setIsMuted] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const selectedPhrase = TASBIH_PHRASES.find(p => p.id === state.phraseId) || TASBIH_PHRASES[0];
  const progressPercentage = (state.count / state.targetCount) * 100;
  const isComplete = state.count >= state.targetCount && state.targetCount > 0;

  const phraseStorageKey = useMemo(() => {
    switch (state.phraseId) {
      case 1: return 'subhanallah';
      case 2: return 'alhamdulillah';
      case 3: return 'allahuakbar';
      case 4: return 'lahawla';
      case 5: return 'astaghfirullah';
      case 6: return 'lailaha';
      default: return 'subhanallah';
    }
  }, [state.phraseId]);

  // Load saved counts on start
  useEffect(() => {
    getDhikrCounts().then((c) => {
      setCounts(c);
      setState(prev => ({
        ...prev,
        count: c[phraseStorageKey] || 0
      }));
    });
  }, [phraseStorageKey]);

  const handleIncrement = useCallback(() => {
    const nextCount = state.count + 1;
    const isTargetHit = state.targetCount > 0 && nextCount >= state.targetCount;
    const finalCount = isTargetHit ? 0 : nextCount;

    // Audio click feedback
    if (!isMuted) {
      tickPlayer.seekTo(0);
      tickPlayer.play();
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    // Pulse background animation
    pulseAnim.setValue(0);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    setState(prev => ({
      ...prev,
      count: finalCount,
    }));

    const newCounts = { ...counts, [phraseStorageKey]: finalCount };
    setCounts(newCounts);
    setDhikrCount(phraseStorageKey, finalCount).catch(console.error);

    if (isTargetHit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [state.count, state.targetCount, phraseStorageKey, counts, isMuted]);

  const handleDecrement = useCallback(() => {
    const nextCount = Math.max(0, state.count - 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    setState(prev => ({
      ...prev,
      count: nextCount,
    }));

    const newCounts = { ...counts, [phraseStorageKey]: nextCount };
    setCounts(newCounts);
    setDhikrCount(phraseStorageKey, nextCount).catch(console.error);
  }, [state.count, phraseStorageKey, counts]);

  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      count: 0,
    }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

    const newCounts = { ...counts, [phraseStorageKey]: 0 };
    setCounts(newCounts);
    setDhikrCount(phraseStorageKey, 0).catch(console.error);
  }, [phraseStorageKey, counts]);

  const handlePhraseSelect = useCallback((phraseId: number) => {
    setState(prev => ({
      ...prev,
      phraseId,
      count: counts[TASBIH_PHRASES.find(p => p.id === phraseId)?.transliteration.toLowerCase() || 'subhanallah'] || 0
    }));
  }, [counts]);

  const handleSetTarget = useCallback((target: number) => {
    setState(prev => ({
      ...prev,
      targetCount: target,
    }));
  }, []);

  // Gestures touch handlers
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent;
    touchStartRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: any) => {
    const touch = e.nativeEvent;
    const dx = touch.pageX - touchStartRef.current.x;
    const dy = touch.pageY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    // Check if it's a Tap
    if (dt < 250 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      handleIncrement();
    } 
    // Check if it's a Right-to-Left swipe (decrease count)
    else if (dx < -50 && Math.abs(dy) < 35) {
      handleDecrement();
    }
  };

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.4],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
      {/* Tap anywhere pressable wrapper */}
      <Pressable 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={styles.gestureContainer}
      >
        {/* Header */}
        <View style={[styles.backHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.headerTitleText, { color: colors.onSurface }]}>Tasbih Counter</Text>
          <View style={styles.headerRightActions}>
            <Pressable onPress={handleReset} hitSlop={10} style={{ marginRight: 16 }}>
              <MaterialCommunityIcons name="cached" size={24} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => setIsMuted(!isMuted)} hitSlop={10}>
              <MaterialCommunityIcons name={isMuted ? "volume-off" : "volume-high"} size={24} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Phrase details */}
          <View style={styles.headerPhraseSection}>
            <Text style={[styles.phraseArabicText, { color: colors.brand }]}>{selectedPhrase.arabic}</Text>
            <Text style={[styles.selectedPhraseText, { color: colors.onSurfaceMuted }]}>{selectedPhrase.transliteration}</Text>
            <Text style={[styles.selectedPhraseMeaning, { color: colors.onSurfaceMuted }]}>{selectedPhrase.meaning}</Text>
          </View>

          {/* Main Counter Pulsing Circle */}
          <View style={styles.counterContainer}>
            <Animated.View
              style={[
                styles.pulseCircle,
                {
                  opacity: pulseOpacity,
                  backgroundColor: isComplete ? 'rgba(46, 204, 113, 0.15)' : colors.brand + "22",
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            />

            <Pressable
              onPress={handleIncrement}
              style={({ pressed }) => [
                styles.counterButton,
                { backgroundColor: isComplete ? '#2ecc71' : colors.brand },
                pressed && styles.counterButtonPressed,
              ]}
            >
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Text style={styles.counterText}>{state.count}</Text>
                {isComplete && (
                  <View style={styles.completeIcon}>
                    <MaterialCommunityIcons name="check-circle" size={40} color="#FFF" />
                  </View>
                )}
              </Animated.View>
            </Pressable>

            {/* Progress Count Text */}
            <Text style={[styles.progressText, { color: colors.onSurfaceMuted }]}>
              {state.targetCount > 0 ? `${state.count}/${state.targetCount}` : `${state.count}`}
            </Text>
          </View>

          {/* Prompt guide */}
          <View style={styles.hintContainer}>
            <Text style={[styles.hintText, { color: colors.onSurfaceMuted }]}>Tap anywhere to count</Text>
            <Text style={[styles.subHintText, { color: colors.onSurfaceMuted }]}>Swipe right-to-left to decrease</Text>
          </View>

          {/* Target Counter Selector */}
          <View style={styles.targetSection}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Target Count</Text>
            <View style={styles.targetButtons}>
              {[33, 66, 99, 100].map(target => (
                <TouchableOpacity
                  key={target}
                  onPress={() => handleSetTarget(target)}
                  style={[
                    styles.targetButton,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    state.targetCount === target && [styles.targetButtonActive, { backgroundColor: colors.brand + "22", borderColor: colors.brand }]
                  ]}
                >
                  <Text
                    style={[
                      styles.targetButtonText,
                      { color: colors.onSurfaceMuted },
                      state.targetCount === target && { color: colors.brand }
                    ]}
                  >
                    {target}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Phrase Selector */}
          <View style={styles.phraseSection}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Select Dhikr</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phraseScroll}>
              {TASBIH_PHRASES.map(phrase => (
                <TouchableOpacity
                  key={phrase.id}
                  onPress={() => handlePhraseSelect(phrase.id)}
                  style={[
                    styles.phraseButton,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    state.phraseId === phrase.id && [styles.phraseButtonActive, { backgroundColor: colors.brand + "22", borderColor: colors.brand }]
                  ]}
                >
                  <Text style={[styles.phraseArabic, { color: colors.onSurface }]}>{phrase.arabic}</Text>
                  <Text style={[styles.phraseMeaning, { color: colors.onSurfaceMuted }]}>{phrase.transliteration}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={[styles.actionButton, styles.decrementButton]}
            >
              <MaterialCommunityIcons name="minus-circle-outline" size={22} color="#e74c3c" />
              <Text style={[styles.actionButtonText, { color: '#e74c3c' }]}>Decrease</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReset}
              style={[styles.actionButton, styles.resetButton]}
            >
              <MaterialCommunityIcons name="refresh" size={22} color={colors.brand} />
              <Text style={[styles.actionButtonText, { color: colors.brand }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Progress / Remaining Section */}
          <View style={styles.infoSection}>
            <View style={[styles.infoItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Progress</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(progressPercentage, 100)}%`, backgroundColor: colors.brand },
                  ]}
                />
              </View>
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>{Math.round(progressPercentage)}%</Text>
            </View>

            <View style={[styles.infoItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Remaining</Text>
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                {Math.max(0, state.targetCount - state.count)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureContainer: {
    flex: 1,
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  headerPhraseSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  phraseArabicText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  selectedPhraseText: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedPhraseMeaning: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  counterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  counterButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  counterButtonPressed: {
    opacity: 0.85,
  },
  counterText: {
    fontSize: 72,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  completeIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  progressText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  hintContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subHintText: {
    fontSize: 11,
    marginTop: 3,
  },
  targetSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  targetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  targetButtonActive: {},
  targetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  phraseSection: {
    marginBottom: 24,
  },
  phraseScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  phraseButton: {
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 130,
  },
  phraseButtonActive: {},
  phraseArabic: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  phraseMeaning: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  decrementButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  resetButton: {
    backgroundColor: 'rgba(26, 188, 156, 0.08)',
    borderColor: 'rgba(26, 188, 156, 0.3)',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  infoItem: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
