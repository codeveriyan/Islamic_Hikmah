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
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/src/ThemeContext';
import { useTranslation } from '@/src/localization';
import { getDhikrCounts, setDhikrCount } from '@/src/storage';

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
};

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

interface BeadProps {
  index: number;
  isActive: boolean;
  totalBeads: number;
  size: number;
}

const Bead: React.FC<BeadProps> = ({ index, isActive, totalBeads, size }) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.2 : 0.8)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isActive ? 1.25 : 0.85,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  // Calculate position in circle/arc
  const angle = (index / totalBeads) * (Math.PI * 2) - Math.PI / 2;
  const radius = 100;
  const x = radius * Math.cos(angle);
  const y = radius * Math.sin(angle);

  return (
    <Animated.View
      style={[
        styles.bead,
        {
          transform: [
            { translateX: x },
            { translateY: y },
            { scale: scaleAnim },
          ],
        },
        isActive && styles.beadActive,
      ]}
    >
      <LinearGradient
        colors={
          isActive
            ? [COLORS.accent, COLORS.primary]
            : ['#2c3e50', '#34495e']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.beadGradient}
      >
        <View style={styles.beadInner} />
      </LinearGradient>
    </Animated.View>
  );
};

export default function TasbihScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  const [state, setState] = useState<TasbihState>({
    count: 0,
    phraseId: 1,
    targetCount: 33,
  });

  const [counts, setCounts] = useState<Record<string, number>>({});

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const selectedPhrase = TASBIH_PHRASES.find(p => p.id === state.phraseId) || TASBIH_PHRASES[0];
  const progressPercentage = (state.count / state.targetCount) * 100;
  const isComplete = state.count >= state.targetCount && state.targetCount > 0;

  // Generate beads array
  const beads = useMemo(() => {
    return Array.from({ length: state.targetCount }, (_, i) => i);
  }, [state.targetCount]);

  // Get current active phrase storage key
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
    setState(prev => ({
      ...prev,
      count: nextCount,
    }));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // Button scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    const newCounts = { ...counts, [phraseStorageKey]: nextCount };
    setCounts(newCounts);
    setDhikrCount(phraseStorageKey, nextCount).catch(console.error);

    if (nextCount % state.targetCount === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [state.count, state.targetCount, phraseStorageKey, counts]);

  const handleDecrement = useCallback(() => {
    const nextCount = Math.max(0, state.count - 1);
    setState(prev => ({
      ...prev,
      count: nextCount,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

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
    }));
  }, []);

  const handleSetTarget = useCallback((target: number) => {
    setState(prev => ({
      ...prev,
      targetCount: target,
    }));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[COLORS.dark, COLORS.surface, COLORS.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.backHeader}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.white} />
          </Pressable>
          <Text style={styles.headerTitleText}>Tasbih</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.selectedPhrase}>{selectedPhrase.transliteration}</Text>
          </View>

          {/* Beads Visual Counter */}
          <View style={styles.beadsContainer}>
            <View style={styles.beadsCircle}>
              {beads.map((_, index) => (
                <Bead
                  key={index}
                  index={index}
                  isActive={index < state.count}
                  totalBeads={state.targetCount}
                  size={12}
                />
              ))}

              {/* Center Counter */}
              <Animated.View
                style={[
                  styles.centerCounter,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Pressable
                  onPress={handleIncrement}
                  style={({ pressed }) => [
                    styles.counterButton,
                    isComplete && styles.counterButtonComplete,
                    pressed && styles.counterButtonPressed,
                  ]}
                >
                  <Text style={styles.counterText}>{state.count}</Text>
                  {isComplete && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={28}
                      color={COLORS.accent}
                      style={styles.completeIcon}
                    />
                  )}
                </Pressable>
              </Animated.View>

              {/* Connection Lines SVG-style visual */}
              <View style={styles.beadConnector}>
                <LinearGradient
                  colors={['rgba(26, 188, 156, 0.3)', 'rgba(0, 212, 170, 0.3)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.connectorGradient}
                />
              </View>
            </View>

            <Text style={styles.progressText}>
              {state.targetCount > 0 ? `${state.count}/${state.targetCount}` : `${state.count}`}
            </Text>
          </View>

          {/* Target Counter Selector */}
          <View style={styles.targetSection}>
            <Text style={styles.sectionTitle}>Target Count</Text>
            <View style={styles.targetButtons}>
              {[33, 66, 99, 100].map(target => (
                <TouchableOpacity
                  key={target}
                  onPress={() => handleSetTarget(target)}
                  style={[
                    styles.targetButton,
                    state.targetCount === target && styles.targetButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.targetButtonText,
                      state.targetCount === target && styles.targetButtonTextActive,
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
            <Text style={styles.sectionTitle}>Select Phrase</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.phraseScroll}
              contentContainerStyle={styles.phraseScrollContent}
            >
              {TASBIH_PHRASES.map(phrase => (
                <TouchableOpacity
                  key={phrase.id}
                  onPress={() => handlePhraseSelect(phrase.id)}
                  style={[
                    styles.phraseButton,
                    state.phraseId === phrase.id && styles.phraseButtonActive,
                  ]}
                >
                  <Text style={styles.phraseArabic}>{phrase.arabic}</Text>
                  <Text style={styles.phraseMeaning}>{phrase.meaning}</Text>
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
              <MaterialCommunityIcons name="minus-circle" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Decrease</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReset}
              style={[styles.actionButton, styles.resetButton]}
            >
              <MaterialCommunityIcons name="refresh" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>{Math.round(progressPercentage)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBar,
                  { width: `${Math.min(progressPercentage, 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Remaining Count */}
          <View style={styles.remainingSection}>
            <View style={styles.remainingBox}>
              <Text style={styles.remainingLabel}>Remaining</Text>
              <Text style={styles.remainingValue}>
                {Math.max(0, state.targetCount - state.count)}
              </Text>
            </View>
          </View>
        </ScrollView>
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
  },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedPhrase: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    letterSpacing: 1,
  },
  beadsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    minHeight: 280,
  },
  beadsCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(26, 188, 156, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(26, 188, 156, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  bead: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  beadGradient: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  beadInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  beadActive: {
    shadowColor: COLORS.accent,
    shadowOpacity: 0.8,
  },
  beadConnector: {
    position: 'absolute',
    width: '80%',
    height: 2,
    borderRadius: 1,
    opacity: 0.4,
  },
  connectorGradient: {
    flex: 1,
    borderRadius: 1,
  },
  centerCounter: {
    zIndex: 10,
  },
  counterButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  counterButtonPressed: {
    opacity: 0.85,
  },
  counterButtonComplete: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
  },
  counterText: {
    fontSize: 56,
    fontWeight: '800',
    color: COLORS.white,
  },
  completeIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  progressText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: '500',
  },
  targetSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  targetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  targetButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(26, 188, 156, 0.2)',
    alignItems: 'center',
  },
  targetButtonActive: {
    backgroundColor: 'rgba(26, 188, 156, 0.4)',
    borderColor: COLORS.accent,
  },
  targetButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.muted,
  },
  targetButtonTextActive: {
    color: COLORS.accent,
  },
  phraseSection: {
    marginBottom: 24,
  },
  phraseScroll: {
    marginHorizontal: -16,
  },
  phraseScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  phraseButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(26, 188, 156, 0.15)',
    minWidth: 150,
  },
  phraseButtonActive: {
    backgroundColor: 'rgba(26, 188, 156, 0.35)',
    borderColor: COLORS.primary,
  },
  phraseArabic: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 6,
    textAlign: 'center',
  },
  phraseMeaning: {
    fontSize: 11,
    color: COLORS.muted,
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
    paddingHorizontal: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  decrementButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(231, 76, 60, 0.5)',
  },
  resetButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 152, 219, 0.5)',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accent,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  remainingSection: {
    marginBottom: 20,
  },
  remainingBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(26, 188, 156, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(26, 188, 156, 0.3)',
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.accent,
  },
});
