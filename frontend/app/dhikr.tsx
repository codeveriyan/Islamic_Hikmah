import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Animated, Pressable, ScrollView, Platform, Modal,
  TextInput, FlatList, KeyboardAvoidingView, Image, Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/ThemeContext';
import { useTranslation } from '@/src/localization';
import { useAuth } from '@/src/AuthContext';
import { usePremiumModal } from '@/src/PremiumModalContext';
import { getDhikrCounts, setDhikrCount } from '@/src/storage';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { theme } from '@/src/theme';
import { CATEGORIES, DuaItem } from '@/src/data/duas';
import { MORNING_EVENING_ADHKAR, AdhkarItem } from '@/src/data/adhkar';
import { DHIKR_DATA } from '@/src/data/quran/dhikrData';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const PRO_GREEN = '#008f70';
const PRO_EMERALD = '#00c896';
const PRO_DARK = '#061713';

// ─── S-Curve Bezier geometry ─────────────────────────────────────────────────
// Matches MyIslam layout: top-left arc → bottom-right arc
const TH = 255;
const P0 = { x: -72, y: 46 };
const P1 = { x: CARD_WIDTH * 0.34, y: -34 };
const P2 = { x: CARD_WIDTH * 0.55, y: TH + 44 };
const P3 = { x: CARD_WIDTH + 72, y: TH - 48 };

// Compute bezier at any t (extrapolates outside [0,1] for off-screen positions)
function bezierAt(t: number) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * P0.x + 3 * mt * mt * t * P1.x + 3 * mt * t * t * P2.x + t * t * t * P3.x,
    y: mt * mt * mt * P0.y + 3 * mt * mt * t * P1.y + 3 * mt * t * t * P2.y + t * t * t * P3.y,
  };
}

const THREAD_PATH =
  `M ${P0.x} ${P0.y} C ${P1.x} ${P1.y}, ${P2.x} ${P2.y}, ${P3.x} ${P3.y}`;
const BEAD_SLOT_T = [-0.12, -0.055, 0.01, 0.075, 0.14, 0.205, 0.27, 0.335, 0.665, 0.73, 0.795, 0.86, 0.925, 0.99, 1.055, 1.12];

// ─── Gold vein definitions (relative to bead size) ─────────────────────────
const MAIN_VEINS = [
  { w: 0.78, top: 0.38, left: -0.02, rot: '24deg',  h: 2,   op: 0.9 },
  { w: 0.58, top: 0.57, left: 0.12, rot: '-17deg', h: 1.8, op: 0.78 },
  { w: 0.48, top: 0.20, left: 0.43, rot: '62deg',  h: 1.5, op: 0.86 },
  { w: 0.36, top: 0.67, left: 0.04, rot: '-52deg', h: 1.4, op: 0.68 },
  { w: 0.62, top: 0.29, left: 0.18, rot: '-38deg', h: 1.8, op: 0.8 },
  { w: 0.32, top: 0.48, left: 0.58, rot: '-8deg', h: 1.3, op: 0.74 },
];
const SUB_VEINS = [
  { w: 0.22, top: 0.44, left: 0.62, rot: '40deg' },
  { w: 0.18, top: 0.29, left: 0.28, rot: '-18deg' },
  { w: 0.28, top: 0.74, left: 0.32, rot: '12deg' },
];

// ─── Kintsugi / Customized bead graphic ───────────────────────────────────────────
export type BeadStyleType = 'gold' | 'emerald' | 'ruby' | 'aqua' | 'onyx' | 'pearl';

const BeadGraphic = memo(function BeadGraphic({ size, darkMode, beadStyle = 'onyx' }: { size: number; darkMode: boolean; beadStyle?: BeadStyleType }) {
  const r = size / 2;
  
  let bgColor = '#050505';
  let bColor = darkMode ? '#2b2210' : '#111111';
  let shadowColor = '#000';
  let shadowOp = darkMode ? 0.88 : 0.42;
  let veinColor = '#c18408';
  let subVeinColor = '#f1c64a';
  let sheenColor = 'rgba(255,255,255,0.05)';
  let hasVeins = true;

  if (beadStyle === 'gold') {
    bgColor = '#DAA520';
    bColor = '#B8860B';
    shadowColor = darkMode ? '#FFD700' : '#8B6508';
    veinColor = '#FFD700';
    subVeinColor = '#F0E68C';
    sheenColor = 'rgba(255,255,255,0.3)';
    hasVeins = false;
  } else if (beadStyle === 'emerald') {
    bgColor = '#087A38'; bColor = '#03451F'; shadowColor = '#00A94F'; hasVeins = false;
  } else if (beadStyle === 'ruby') {
    bgColor = '#9E1524'; bColor = '#520812'; shadowColor = '#D9293D'; hasVeins = false;
  } else if (beadStyle === 'aqua') {
    bgColor = '#0799A4'; bColor = '#03545B'; shadowColor = '#19D7DE'; hasVeins = false;
  } else if (beadStyle === 'pearl') {
    bgColor = '#FDFBF7';
    bColor = '#E6E2D8';
    shadowColor = darkMode ? '#FFF' : '#000';
    shadowOp = 0.3;
    sheenColor = 'rgba(255,255,255,0.6)';
    hasVeins = false;
  }

  return (
    <View
      style={{
        width: size, height: size, borderRadius: r, overflow: 'hidden',
        backgroundColor: bgColor,
        borderWidth: 1.4, borderColor: bColor,
        shadowColor,
        shadowOffset: { width: 5, height: 7 },
        shadowOpacity: shadowOp,
        shadowRadius: 12,
        elevation: 12,
      }}
    >
      <LinearGradient
        colors={beadStyle === 'gold' ? ['#FFF0A0', '#D99A16', '#8F5703', '#E8B52C'] : beadStyle === 'emerald' ? ['#65D98B', '#087A38', '#023A1A', '#0C9A49'] : beadStyle === 'ruby' ? ['#FF7580', '#A71929', '#4E0710', '#C6283A'] : beadStyle === 'aqua' ? ['#7EF5F1', '#0799A4', '#03464D', '#16BBC2'] : beadStyle === 'pearl' ? ['#FFFFFF', '#E8E1D5', '#B7B0A6', '#FAF8F2'] : ['#2a2a2a', '#050505', '#171717', '#000000']}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{
        position: 'absolute',
        top: size * 0.36,
        left: -size * 0.12,
        width: size * 1.22,
        height: size * 0.28,
        borderRadius: size * 0.18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        transform: [{ rotate: '-24deg' }],
      }} />
      {/* Depth shadow at bottom-right */}
      <View style={{
        position: 'absolute', right: 0, bottom: 0,
        width: size * 0.62, height: size * 0.58,
        borderRadius: size * 0.35,
        backgroundColor: '#000',
        opacity: beadStyle === 'pearl' ? 0.15 : 0.52,
      }} />

      {/* Main gold veins or Wood Grain */}
      {hasVeins && MAIN_VEINS.map((v, i) => (
        <View key={i} style={{
          position: 'absolute',
          height: v.h,
          backgroundColor: veinColor,
          opacity: v.op,
          width: size * v.w,
          top: size * v.top,
          left: size * v.left,
          transform: [{ rotate: v.rot }],
        }} />
      ))}

      {/* Sub-branch veins */}
      {hasVeins && SUB_VEINS.map((v, i) => (
        <View key={i} style={{
          position: 'absolute',
          height: 1,
          backgroundColor: subVeinColor,
          opacity: 0.55,
          width: size * v.w,
          top: size * v.top,
          left: size * v.left,
          transform: [{ rotate: v.rot }],
        }} />
      ))}

      {/* Primary specular highlight (large soft oval) */}
      <View style={{
        position: 'absolute',
        top: size * 0.07, left: size * 0.09,
        width: size * 0.38, height: size * 0.24,
        borderRadius: size * 0.14,
        backgroundColor: beadStyle === 'gold' || beadStyle === 'pearl' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.44)',
        transform: [{ rotate: '-28deg' }],
      }} />

      {/* Secondary tiny bright spot */}
      <View style={{
        position: 'absolute',
        top: size * 0.04, left: size * 0.06,
        width: size * 0.16, height: size * 0.10,
        borderRadius: size * 0.07,
        backgroundColor: 'rgba(255,255,255,0.7)',
      }} />

      {/* Sheen tint overlay */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: size * 0.45,
        borderTopLeftRadius: r, borderTopRightRadius: r,
        backgroundColor: sheenColor,
      }} />
    </View>
  );
});

// ─── Single animated bead positioned along the curve ─────────────────────────
interface BeadViewProps {
  index: number;
  totalBeads: number;
  targetCount: number;
  countAnim: Animated.Value;
  size: number;
  darkMode: boolean;
  beadStyle: BeadStyleType;
}

const BeadView = memo(function BeadView({ index, totalBeads, targetCount, countAnim, size, darkMode, beadStyle }: BeadViewProps) {
  const inputRange = Array.from({ length: targetCount + 1 }, (_, k) => k);

  const slotFor = (countValue: number) => {
    const slot = ((index + countValue) % totalBeads + totalBeads) % totalBeads;
    return BEAD_SLOT_T[slot] ?? 0;
  };

  const xOutput = inputRange.map(c => {
    const t = slotFor(c);
    return bezierAt(t).x;
  });

  const yOutput = inputRange.map(c => {
    const t = slotFor(c);
    return bezierAt(t).y;
  });

  const rotateOutput = inputRange.map(c => `${c * 18 + index * 9}deg`);

  const opacityOutput = inputRange.map(c => {
    const slot = ((index + c) % totalBeads + totalBeads) % totalBeads;
    // Hide beads at slot 14, 15, 0, and 1 to prevent them from showing as they wrap across the screen
    return (slot === 14 || slot === 15 || slot === 0 || slot === 1) ? 0 : 1;
  });

  const animLeft = (countAnim.interpolate({
    inputRange, outputRange: xOutput, extrapolate: 'clamp',
  })) as unknown as number;

  const animTop = (countAnim.interpolate({
    inputRange, outputRange: yOutput, extrapolate: 'clamp',
  })) as unknown as number;

  const animOpacity = countAnim.interpolate({
    inputRange, outputRange: opacityOutput, extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex: 5,
        opacity: animOpacity,
        transform: [
          { translateX: countAnim.interpolate({ inputRange, outputRange: xOutput, extrapolate: 'clamp' }) },
          { translateY: countAnim.interpolate({ inputRange, outputRange: yOutput, extrapolate: 'clamp' }) },
          { rotate: countAnim.interpolate({ inputRange, outputRange: rotateOutput, extrapolate: 'clamp' }) },
        ],
      }}
    >
      <BeadGraphic size={size} darkMode={darkMode} beadStyle={beadStyle} />
    </Animated.View>
  );
});

// ─── Type definitions ─────────────────────────────────────────────────────────
type DhikrEntry = {
  id: string; arabic: string; transliteration: string; meaning: string;
  audioUrl?: string; hadith?: string; hadithSource?: string;
  category?: 'short' | 'medium' | 'long'; recommendedCount?: number;
  source?: 'builtin' | 'dua' | 'adhkar';
};

interface SavedSession {
  id: string; name: string; dhikrId: string; dhikrName: string; count: number; date: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HAPTIC_KEY = 'hikmah:tasbih:haptic:v1';
const CUSTOM_DHIKR_KEY = 'hikmah:tasbih:custom-dhikr:v1';
const SESSIONS_KEY = 'hikmah:tasbih:sessions:v1';

const BUILTIN_PHRASES: DhikrEntry[] = DHIKR_DATA.map(item => ({
  id: item.id, arabic: item.arabic, transliteration: item.transliteration,
  meaning: item.meaning, audioUrl: item.audioUrl, hadith: item.hadith,
  hadithSource: item.source, category: item.category,
  recommendedCount: item.recommended_count, source: 'builtin' as const,
}));

export default function TasbihScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);
  const { profile } = useAuth();
  const { showPremiumModal } = usePremiumModal();
  const isDark = colors.mode === 'dark';

  const tickPlayer = useAudioPlayer(require('../assets/audio/tick.wav'));
  const recitationPlayer = useAudioPlayer(null);
  const recStatus = useAudioPlayerStatus(recitationPlayer);

  // ─── State ───────────────────────────────────────────────────────────────
  const [phraseId, setPhraseId] = useState('subhanallah');
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(33);
  const [isMuted, setIsMuted] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [hadithExpanded, setHadithExpanded] = useState(false);
  const [allPhrases, setAllPhrases] = useState<DhikrEntry[]>(BUILTIN_PHRASES);
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [pickerTab, setPickerTab] = useState<'all' | 'main' | 'other' | 'adhkar'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTargetInput, setCustomTargetInput] = useState('');

  // ─── Appearance State ────────────────────────────────────────────────────
  const [themeType, setThemeType] = useState<'image' | 'color'>('color');
  const [themeValue, setThemeValue] = useState<string>(isDark ? '#0B1120' : '#F8FAFC');
  const [counterStyle, setCounterStyle] = useState<'beads' | 'line'>('beads');
  const [beadStyle, setBeadStyle] = useState<BeadStyleType>('onyx');
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);

  // ─── Animation ───────────────────────────────────────────────────────────
  // countAnim drives ALL bead positions. Integer value = count, spring for smooth motion.
  const countAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const selectedPhrase = allPhrases.find(p => p.id === phraseId);
  const progressPercentage = targetCount > 0 ? (count / targetCount) * 100 : 0;
  const isComplete = count >= targetCount && targetCount > 0;
  const VISIBLE_BEADS = 16;
  const beadSize = Math.min(58, Math.max(48, CARD_WIDTH * 0.145));

  const filteredPhrases = useMemo(() => allPhrases.filter(phrase =>
    phrase.source !== 'builtin' ? selectedCategory === 'all' : selectedCategory === 'all' || phrase.category === selectedCategory
  ), [allPhrases, selectedCategory]);

  // ─── Load preferences ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const hapticRaw = await AsyncStorage.getItem(HAPTIC_KEY);
      if (hapticRaw !== null) setHapticEnabled(hapticRaw === 'true');
      const customRaw = await AsyncStorage.getItem(CUSTOM_DHIKR_KEY);
      if (customRaw) setAllPhrases([...BUILTIN_PHRASES, ...JSON.parse(customRaw)]);
      const sessionsRaw = await AsyncStorage.getItem(SESSIONS_KEY);
      if (sessionsRaw) setSessions(JSON.parse(sessionsRaw));

      const appearanceRaw = await AsyncStorage.getItem('hikmah:tasbih:appearance:v1');
      if (appearanceRaw) {
        const parsed = JSON.parse(appearanceRaw);
        setThemeType('color');
        setThemeValue(isDark ? '#0B1120' : '#F8FAFC');
        setCounterStyle('beads');
        const supportedBeads: BeadStyleType[] = ['gold', 'emerald', 'ruby', 'aqua', 'onyx', 'pearl'];
        setBeadStyle(supportedBeads.includes(parsed.beadStyle) ? parsed.beadStyle : 'onyx');
      } else {
        setThemeValue(isDark ? '#0B1120' : '#F8FAFC');
      }
      const c = await getDhikrCounts();
      setCounts(c);
      const init = c['subhanallah'] || 0;
      setCount(init);
      countAnim.setValue(init);
    })();
  }, []);

  useEffect(() => {
    const next = counts[phraseId] || 0;
    setCount(next);
    countAnim.setValue(next);
  }, [phraseId]);

  useEffect(() => {
    if (selectedPhrase?.recommendedCount) setTargetCount(selectedPhrase.recommendedCount);
  }, [phraseId]);

  // ─── Smooth spring animation on count change ──────────────────────────────
  useEffect(() => {
    Animated.timing(countAnim, {
      toValue: count,
      duration: 880,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [count]);

  // ─── Audio ────────────────────────────────────────────────────────────────
  const handlePlayAudio = useCallback(() => {
    if (!selectedPhrase?.audioUrl) return;
    if (profile?.tier !== 'premium' && !profile?.trialActive) { showPremiumModal('Dhikr Audio'); return; }
    try {
      if (recStatus.playing) { recitationPlayer.pause(); }
      else { recitationPlayer.replace({ uri: selectedPhrase.audioUrl }); recitationPlayer.play(); }
    } catch (e) { console.error(e); }
  }, [selectedPhrase, recStatus.playing, profile?.tier]);

  useEffect(() => { try { recitationPlayer.pause(); } catch {} }, [phraseId]);

  // Stop both audio players on unmount to prevent crash from released shared object.
  useEffect(() => {
    return () => {
      try { tickPlayer.pause(); } catch (e) { /* already released */ }
      try { recitationPlayer.pause(); } catch (e) { /* already released */ }
    };
  }, [tickPlayer, recitationPlayer]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleIncrement = useCallback(() => {
    if (!isMuted) { 
      try { 
        tickPlayer.seekTo(0); tickPlayer.play(); 
        if (selectedPhrase?.audioUrl && (profile?.tier === 'premium' || profile?.trialActive)) {
          recitationPlayer.replace({ uri: selectedPhrase.audioUrl });
          recitationPlayer.play();
        }
      } catch {} 
    }
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 65, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 65, useNativeDriver: true }),
    ]).start();

    const next = count + 1;

    if (next >= targetCount) {
      // Complete loop: all beads exit left → snap back instantly (they're off-screen)
      const snapBack = () => {
        countAnim.setValue(0);
        setCount(0);
        const newCounts = { ...counts, [phraseId]: 0 };
        setCounts(newCounts);
        setDhikrCount(phraseId, 0).catch(console.error);
      };
      // Briefly animate to targetCount (beads finish exiting), then snap
      Animated.timing(countAnim, {
        toValue: targetCount,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(snapBack, 60);
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCount(targetCount); // show target count briefly before reset
    } else {
      setCount(next);
      const newCounts = { ...counts, [phraseId]: next };
      setCounts(newCounts);
      setDhikrCount(phraseId, next).catch(console.error);
    }
  }, [count, targetCount, phraseId, counts, isMuted, hapticEnabled, selectedPhrase]);

  const handleDecrement = useCallback(() => {
    const next = Math.max(0, count - 1);
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCount(next);
    const newCounts = { ...counts, [phraseId]: next };
    setCounts(newCounts);
    setDhikrCount(phraseId, next).catch(console.error);
  }, [count, phraseId, counts, hapticEnabled]);

  const handleReset = useCallback(() => {
    setCount(0);
    countAnim.setValue(0);
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const newCounts = { ...counts, [phraseId]: 0 };
    setCounts(newCounts);
    setDhikrCount(phraseId, 0).catch(console.error);
  }, [phraseId, counts, hapticEnabled]);

  const handlePhraseSelect = useCallback((id: string) => {
    setPhraseId(prev => prev === id ? '' : id); setHadithExpanded(false);
  }, []);

  const toggleHaptic = useCallback(async () => {
    const next = !hapticEnabled; setHapticEnabled(next);
    await AsyncStorage.setItem(HAPTIC_KEY, String(next));
    if (next) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [hapticEnabled]);

  // ─── Sessions ─────────────────────────────────────────────────────────────
  const handleSaveProgress = useCallback(async () => {
    if (count === 0) return;
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const s: SavedSession = {
      id: Date.now().toString(),
      name: sessionNameInput.trim() || `${selectedPhrase?.transliteration ?? 'Free'} – ${dateStr}`,
      dhikrId: selectedPhrase?.id ?? 'free', dhikrName: selectedPhrase?.transliteration ?? 'Free', count, date: dateStr,
    };
    const updated = [s, ...sessions];
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    setShowSaveModal(false); setSessionNameInput('');
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [count, sessionNameInput, selectedPhrase, sessions, hapticEnabled]);

  const handleLoadSession = useCallback((session: SavedSession) => {
    if (allPhrases.some(p => p.id === session.dhikrId)) setPhraseId(session.dhikrId);
    else if (session.dhikrId === 'free') setPhraseId('');
    setCount(session.count);
    countAnim.setValue(session.count);
    const newCounts = { ...counts, [session.dhikrId]: session.count };
    setCounts(newCounts);
    setDhikrCount(session.dhikrId, session.count).catch(console.error);
  }, [allPhrases, counts]);

  const handleDeleteSession = useCallback(async (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  }, [sessions]);

  // ─── Custom Dhikr ─────────────────────────────────────────────────────────
  const handleAddDhikr = useCallback(async (entry: DhikrEntry) => {
    if (allPhrases.some(p => p.id === entry.id)) { setPhraseId(entry.id); setShowPicker(false); return; }
    const updated = [...allPhrases, entry];
    setAllPhrases(updated);
    await AsyncStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated.filter(p => p.source !== 'builtin')));
    setPhraseId(entry.id); setShowPicker(false);
  }, [allPhrases]);

  const handleRemoveCustomDhikr = useCallback(async (id: string) => {
    if (BUILTIN_PHRASES.some(p => p.id === id)) return;
    const updated = allPhrases.filter(p => p.id !== id);
    setAllPhrases(updated);
    await AsyncStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(updated.filter(p => p.source !== 'builtin')));
    if (phraseId === id) setPhraseId('subhanallah');
  }, [allPhrases, phraseId]);

  const handleSetTarget = useCallback((t: number) => setTargetCount(t), []);

  const handleCustomTargetConfirm = useCallback(() => {
    const v = parseInt(customTargetInput, 10);
    if (!isNaN(v) && v > 0) setTargetCount(v);
    setShowTargetModal(false); setCustomTargetInput('');
  }, [customTargetInput]);

  // ─── Picker data ──────────────────────────────────────────────────────────
  const pickerItems = useMemo(() => {
    const allDhikr = allPhrases.map(p => ({ id: p.id, arabic: p.arabic, transliteration: p.transliteration, meaning: p.meaning, source: p.source }));
    const mainDuas: DhikrEntry[] = CATEGORIES.filter(c => c.group === 'main').flatMap(c => c.duas.map((d: DuaItem) => ({ id: `dua-${d.id}`, arabic: d.arabic, transliteration: d.transliteration || d.title, meaning: d.translation, source: 'dua' as const })));
    const otherDuas: DhikrEntry[] = CATEGORIES.filter(c => c.group === 'other').flatMap(c => c.duas.map((d: DuaItem) => ({ id: `dua-${d.id}`, arabic: d.arabic, transliteration: d.transliteration || d.title, meaning: d.translation, source: 'dua' as const })));
    const adhkar: DhikrEntry[] = MORNING_EVENING_ADHKAR.map((a: AdhkarItem) => ({ id: `adhkar-${a.id}`, arabic: a.arabic, transliteration: a.transliteration || '', meaning: a.translation, source: 'adhkar' as const }));
    const base = pickerTab === 'all' ? allDhikr : pickerTab === 'main' ? mainDuas : pickerTab === 'other' ? otherDuas : adhkar;
    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(e => e.transliteration.toLowerCase().includes(q) || e.meaning.toLowerCase().includes(q) || e.arabic.includes(searchQuery));
  }, [pickerTab, searchQuery, allPhrases]);

  // ─── Gesture handling ─────────────────────────────────────────────────────
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const handleTouchStart = (e: any) => {
    const t = e.nativeEvent;
    touchStart.current = { x: t.pageX, y: t.pageY, time: Date.now() };
  };
  const handleTouchEnd = (e: any) => {
    const t = e.nativeEvent;
    const dx = t.pageX - touchStart.current.x;
    const dy = t.pageY - touchStart.current.y;
    const dt = Date.now() - touchStart.current.time;
    if (dt < 260 && Math.abs(dx) < 16 && Math.abs(dy) < 16) handleIncrement();
    else if (dx < -55 && Math.abs(dy) < 40) handleDecrement();
  };

  const getCategoryColor = (cat?: string) =>
    cat === 'short' ? '#27ae60' : cat === 'medium' ? '#f39c12' : cat === 'long' ? '#8e44ad' : colors.brand;

  const renderPickerItem = ({ item }: { item: DhikrEntry }) => {
    const sel = allPhrases.some(p => p.id === item.id);
    return (
      <Pressable onPress={() => handleAddDhikr(item)}
        style={[styles.pickerItem, { backgroundColor: colors.surfaceSecondary, borderColor: sel ? colors.brand : colors.border }]}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.pickerArabic, { color: colors.onSurface }]} numberOfLines={2}>{item.arabic}</Text>
          <Text style={[styles.pickerTranslit, { color: colors.brand }]} numberOfLines={1}>{item.transliteration}</Text>
          <Text style={[styles.pickerMeaning, { color: colors.onSurfaceMuted }]} numberOfLines={2}>{item.meaning}</Text>
        </View>
        <View style={[styles.pickerAddBtn, { backgroundColor: sel ? colors.brand + '22' : colors.brand }]}>
          <MaterialCommunityIcons name={sel ? 'check' : 'plus'} size={18} color={sel ? colors.brand : '#fff'} />
        </View>
      </Pressable>
    );
  };

  // ─── Bead rendering ───────────────────────────────────────────────────────
  const beads = useMemo(() => {
    return Array.from({ length: VISIBLE_BEADS }, (_, i) => (
      <BeadView
        key={i}
        index={i}
        totalBeads={VISIBLE_BEADS}
        targetCount={targetCount}
        countAnim={countAnim}
        size={beadSize}
        darkMode={isDark}
        beadStyle={beadStyle}
      />
    ));
  }, [VISIBLE_BEADS, targetCount, beadSize, isDark, beadStyle]);

  // Thread color: visible in both modes
  const threadColor = isDark ? '#0b0b0b' : '#202020';
  const threadWidth = 4;

  const saveAppearance = async (newThemeType: 'image' | 'color', newThemeValue: string, newCounterStyle: 'beads' | 'line', newBeadStyle: BeadStyleType) => {
    setThemeType(newThemeType);
    setThemeValue(newThemeValue);
    setCounterStyle(newCounterStyle);
    setBeadStyle(newBeadStyle);
    await AsyncStorage.setItem('hikmah:tasbih:appearance:v1', JSON.stringify({
      themeType: newThemeType,
      themeValue: newThemeValue,
      counterStyle: newCounterStyle,
      beadStyle: newBeadStyle
    }));
  };

  const renderAppearanceModal = () => (
    <Modal visible={showAppearanceModal} transparent animationType="slide" onRequestClose={() => setShowAppearanceModal(false)}>
      <Pressable style={[styles.overlay, { justifyContent: 'flex-end' }]} onPress={() => setShowAppearanceModal(false)}>
        <Pressable style={[styles.sheetCard, { backgroundColor: colors.surfaceSecondary, paddingBottom: 40 }]} onPress={e => e.stopPropagation()}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.onSurface }]}>Appearance Settings</Text>
            <Pressable onPress={() => setShowAppearanceModal(false)}><MaterialCommunityIcons name="close" size={24} color={colors.onSurface} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg }}>
            <Text style={[styles.sectionTitle, { color: colors.brand, marginTop: 12 }]}>Background</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <Pressable onPress={() => saveAppearance('color', isDark ? '#0B1120' : '#F8FAFC', 'beads', beadStyle)} style={[styles.optBtn, { borderColor: colors.brand, borderWidth: 2 }]}>
                <Text style={{ color: colors.onSurface }}>Default</Text>
              </Pressable>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.brand }]}>Counter Style</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <Pressable onPress={() => saveAppearance('color', isDark ? '#0B1120' : '#F8FAFC', 'beads', beadStyle)} style={[styles.optBtn, { borderColor: colors.brand, borderWidth: 2 }]}>
                <Text style={{ color: colors.onSurface }}>Beads</Text>
              </Pressable>
            </View>

            {counterStyle === 'beads' && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.brand }]}>Bead Style</Text>
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                  {(['gold', 'emerald', 'ruby', 'aqua', 'onyx', 'pearl'] as BeadStyleType[]).map(bs => (
                    <Pressable key={bs} onPress={() => saveAppearance(themeType, themeValue, counterStyle, bs)} style={[styles.optBtn, { borderColor: colors.border }, beadStyle === bs && { borderColor: colors.brand, borderWidth: 2 }]}>
                      <View style={{ alignItems: 'center', gap: 6 }}><BeadGraphic size={28} darkMode={isDark} beadStyle={bs} /><Text style={{ color: colors.onSurface, textTransform: 'capitalize' }}>{bs}</Text></View>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeType === 'color' ? themeValue : colors.surface }]} edges={['top']}>
      {themeType === 'image' && (
        <Image source={{ uri: themeValue }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      )}
      {themeType === 'image' && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
      )}
      <View style={styles.gestureContainer}>

        {/* ── Header ── */}
        <View style={[styles.backHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Tasbih Counter</Text>
          <View style={styles.headerRight}>
            <Pressable onPress={handleReset} hitSlop={10} style={styles.hBtn}>
              <MaterialCommunityIcons name="cached" size={22} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={toggleHaptic} hitSlop={10} style={styles.hBtn}>
              <MaterialCommunityIcons name={hapticEnabled ? 'vibrate' : 'vibrate-off'} size={22}
                color={hapticEnabled ? colors.brand : colors.onSurfaceMuted} />
            </Pressable>
            <Pressable onPress={() => setIsMuted(!isMuted)} hitSlop={10} style={styles.hBtn}>
              <MaterialCommunityIcons name={isMuted ? 'volume-off' : 'volume-high'} size={22} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => {
              if (profile?.tier !== 'premium' && !profile?.trialActive) { showPremiumModal('Appearance Settings'); return; }
              setShowAppearanceModal(true);
            }} hitSlop={10} style={styles.hBtn}>
              <MaterialCommunityIcons name="palette-outline" size={22} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={10} style={styles.hBtn}>
              <MaterialCommunityIcons name="home-outline" size={22} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── TASBIH CARD (Tap anywhere to count) ── */}
          <Pressable
            onPress={handleIncrement}
            style={({ pressed }) => [
              styles.countingCard,
              {
                borderColor: isComplete ? '#2ecc71' : 'rgba(212,175,55,0.42)',
                transform: [{ scale: pressed ? 0.992 : 1 }],
              }
            ]}
          >
            <LinearGradient
              colors={isDark ? ['#08251f', PRO_DARK, '#10251f'] : ['#fbf6e7', '#eef8f1', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.cardPatternRing} />
            <View style={[styles.cardPatternRing, styles.cardPatternRingSmall]} />
            {/* 1. Counter display area (top) */}
            <View style={styles.centerCounterSection}>
              <Text style={[styles.onlineTitle, { color: isDark ? '#d8c072' : '#8c6a12' }]}>DIGITAL TASBIH</Text>

              {/* Big green count */}
              <LinearGradient
                colors={isDark ? ['#03120f', '#0b2f27'] : ['#ffffff', '#e9f5ef']}
                style={styles.countWindow}
              >
                <Text style={[styles.countOverline, { color: isDark ? '#b9aa70' : '#8c6a12' }]}>
                  {Math.max(0, targetCount - count)} remaining
                </Text>
                <Animated.Text style={[styles.bigCount, { color: isComplete ? '#2ecc71' : PRO_EMERALD, transform: [{ scale: scaleAnim }] }]}>
                  {count}
                </Animated.Text>
                <View style={styles.countWindowShine} />
              </LinearGradient>
            </View>

            {/* 2. S-curve bead flow area (completely below the counter display, zero overlap) */}
            <View style={[styles.tasbihArea, { height: TH }]}>
              {/* SVG thread line behind beads */}
              <Svg style={StyleSheet.absoluteFillObject as any} width={CARD_WIDTH} height={TH}>
                <Path
                  d={THREAD_PATH}
                  fill="none"
                  stroke={isDark ? '#d4af37' : '#000000'}
                  strokeWidth={8}
                  strokeLinecap="round"
                  opacity={isDark ? 0.18 : 0.12}
                />
                <Path
                  d={THREAD_PATH}
                  fill="none"
                  stroke={threadColor}
                  strokeWidth={threadWidth}
                  strokeLinecap="round"
                />
              </Svg>

              {/* All animated beads */}
              {counterStyle === 'beads' && beads}
            </View>
          </Pressable>

          {/* ── Active phrase ── */}
          <View style={[styles.phraseRow, { paddingHorizontal: 20 }]}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              {selectedPhrase ? (
                <>
                  <Text style={[styles.translit, { color: colors.onSurface }]}>{selectedPhrase.transliteration}</Text>
                  <Text style={[styles.arabic, { color: colors.brand }]}>{selectedPhrase.arabic}</Text>
                  {selectedPhrase.meaning ? (
                    <Text style={[styles.meaning, { color: colors.onSurfaceMuted }]}>{selectedPhrase.meaning}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={[styles.translit, { color: colors.onSurface }]}>Free Dhikr</Text>
                  <Text style={[styles.meaning, { color: colors.onSurfaceMuted, marginTop: 4 }]}>Tap to count freely. Select a phrase below if desired.</Text>
                </>
              )}
            </View>
          </View>

          {/* ── Select Dhikr ── */}
          <View style={[styles.section, { paddingHorizontal: 16 }]}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Select Dhikr</Text>
              <Text style={[{ fontSize: 12, color: colors.onSurfaceMuted }]}>{filteredPhrases.length} dhikr</Text>
            </View>

            <View style={styles.catRow}>
              {(['all', 'short', 'medium', 'long'] as const).map(cat => (
                <Pressable key={cat} onPress={() => setSelectedCategory(cat)}
                  style={[styles.catBtn, { borderColor: selectedCategory === cat ? colors.brand : colors.border },
                    selectedCategory === cat && { backgroundColor: colors.brand + '18' }]}>
                  {cat !== 'all' && <View style={[styles.catDot, { backgroundColor: getCategoryColor(cat) }]} />}
                  <Text style={[styles.catLabel, { color: selectedCategory === cat ? colors.brand : colors.onSurfaceMuted }]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              {filteredPhrases.map(phrase => (
                <Pressable key={phrase.id} onPress={() => handlePhraseSelect(phrase.id)}
                  onLongPress={() => { if (phrase.source !== 'builtin') handleRemoveCustomDhikr(phrase.id); }}
                  style={[styles.phraseCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    phraseId === phrase.id && { backgroundColor: colors.brand + '15', borderColor: colors.brand }]}>
                  {phrase.category && (
                    <View style={[styles.catBadge, { backgroundColor: getCategoryColor(phrase.category) + '22' }]}>
                      <View style={[styles.catBadgeDot, { backgroundColor: getCategoryColor(phrase.category) }]} />
                      <Text style={[styles.catBadgeTxt, { color: getCategoryColor(phrase.category) }]}>{phrase.category}</Text>
                    </View>
                  )}
                  <Text style={[styles.phraseArabic, { color: colors.onSurface }]} numberOfLines={1}>{phrase.arabic}</Text>
                  <Text style={[styles.phraseTranslit, { color: colors.onSurfaceMuted }]} numberOfLines={1}>{phrase.transliteration}</Text>
                  {phrase.recommendedCount ? <Text style={[styles.phraseCountBadge, { color: colors.brand }]}>×{phrase.recommendedCount}</Text> : null}
                  {phrase.source !== 'builtin' && (
                    <View style={[styles.customTag, { backgroundColor: colors.brand + '22' }]}>
                      <Text style={[styles.customTagTxt, { color: colors.brand }]}>custom</Text>
                    </View>
                  )}
                </Pressable>
              ))}
              <Pressable onPress={() => {
                if (profile?.tier !== 'premium' && !profile?.trialActive) { showPremiumModal('Add More Dhikr'); return; }
                setShowPicker(true); setPickerTab('all'); setSearchQuery('');
              }}
                style={[styles.addBtn, { backgroundColor: colors.brand + '15', borderColor: colors.brand }]}>
                <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.brand} />
                <Text style={[styles.addBtnTxt, { color: colors.brand }]}>Add more{'\n'}Dhikr</Text>
              </Pressable>
            </ScrollView>
            <Text style={[styles.hint2, { color: colors.onSurfaceMuted }]}>💡 Long press custom card to remove</Text>
          </View>

          {/* ── Target Count ── */}
          <View style={[styles.section, { paddingHorizontal: 16 }]}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Target Count</Text>
              <Pressable onPress={() => setShowTargetModal(true)} style={[styles.editBtn, { borderColor: colors.brand }]}>
                <MaterialCommunityIcons name="pencil-outline" size={13} color={colors.brand} />
                <Text style={[styles.editBtnTxt, { color: colors.brand }]}>Custom</Text>
              </Pressable>
            </View>
            <View style={styles.targetRow}>
              {[33, 66, 99, 100].map(n => (
                <TouchableOpacity key={n} onPress={() => handleSetTarget(n)}
                  style={[styles.targetBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    targetCount === n && { backgroundColor: colors.brand + '15', borderColor: colors.brand }]}>
                  <Text style={[styles.targetBtnTxt, { color: targetCount === n ? colors.brand : colors.onSurfaceMuted }]}>{n}</Text>
                </TouchableOpacity>
              ))}
              {![33, 66, 99, 100].includes(targetCount) && targetCount > 0 && (
                <View style={[styles.targetBtn, { backgroundColor: colors.brand + '15', borderColor: colors.brand, flex: 0, paddingHorizontal: 16 }]}>
                  <Text style={[styles.targetBtnTxt, { color: colors.brand }]}>{targetCount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Quick Actions ── */}
          <View style={[styles.actionRow, { paddingHorizontal: 16 }]}>
            <TouchableOpacity onPress={() => {
              if (profile?.tier !== 'premium' && !profile?.trialActive) { showPremiumModal('Save Dhikr Session'); return; }
              setSessionNameInput(''); setShowSaveModal(true);
            }}
              style={[styles.actionBtn, { backgroundColor: 'rgba(39,174,96,0.08)', borderColor: 'rgba(39,174,96,0.3)' }]}>
              <MaterialCommunityIcons name="content-save-outline" size={18} color="#27ae60" />
              <Text style={[styles.actionBtnTxt, { color: '#27ae60' }]}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={[styles.actionBtn, { backgroundColor: colors.brand + '0e', borderColor: colors.brand + '40' }]}>
              <MaterialCommunityIcons name="refresh" size={18} color={colors.brand} />
              <Text style={[styles.actionBtnTxt, { color: colors.brand }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* ── Progress ── */}
          <View style={[styles.infoRow, { paddingHorizontal: 16 }]}>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Session Progress</Text>
              <View style={styles.progBar}>
                <View style={[styles.progFill, { width: `${Math.min(progressPercentage, 100)}%`, backgroundColor: isComplete ? '#2ecc71' : colors.brand }]} />
              </View>
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>{Math.round(progressPercentage)}% completed</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Remaining</Text>
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>{Math.max(0, targetCount - count)}</Text>
            </View>
          </View>

          {/* ── Hadith card ── */}
          {selectedPhrase?.hadith ? (
            <Pressable onPress={() => setHadithExpanded(!hadithExpanded)}
              style={[styles.hadithCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginHorizontal: 16 }]}>
              <View style={styles.hadithHead}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={20} color={colors.brand} />
                  <Text style={[styles.hadithTitle, { color: colors.onSurface }]}>Hadith & Virtues</Text>
                </View>
                <MaterialCommunityIcons name={hadithExpanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.onSurfaceMuted} />
              </View>
              {hadithExpanded && (
                <View style={styles.hadithBody}>
                  <Text style={[styles.hadithText, { color: colors.onSurface }]}>&ldquo;{selectedPhrase.hadith}&rdquo;</Text>
                  {selectedPhrase.hadithSource && (
                    <Text style={[styles.hadithSource, { color: colors.brand }]}>— {selectedPhrase.hadithSource}</Text>
                  )}
                </View>
              )}
            </Pressable>
          ) : null}

          {/* ── Saved Sessions ── */}
          {sessions.length > 0 && (
            <View style={[styles.sessionsWrap, { borderColor: colors.border, marginHorizontal: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 12 }]}>Saved Progress</Text>
              {sessions.map(s => (
                <View key={s.id} style={[styles.sessionRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionName, { color: colors.onSurface }]} numberOfLines={1}>{s.name}</Text>
                    <Text style={[styles.sessionMeta, { color: colors.onSurfaceMuted }]}>{s.dhikrName} · {s.count}× · {s.date}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <Pressable onPress={() => handleLoadSession(s)}
                      style={[styles.sessionBtn, { backgroundColor: colors.brand + '18', borderColor: colors.brand }]}>
                      <MaterialCommunityIcons name="restore" size={14} color={colors.brand} />
                      <Text style={[styles.sessionBtnTxt, { color: colors.brand }]}>Load</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteSession(s.id)}
                      style={[styles.sessionBtn, { backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)' }]}>
                      <MaterialCommunityIcons name="delete-outline" size={14} color="#e74c3c" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={{ height: 48 }} />
        </ScrollView>
      </View>

      {/* ══ ADD DHIKR MODAL ══ */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.surface }]} edges={['top']}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Add Dhikr</Text>
            <Pressable onPress={() => setShowPicker(false)} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={26} color={colors.onSurface} />
            </Pressable>
          </View>
          <View style={[styles.searchRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
            <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search dhikr or dua..."
              placeholderTextColor={colors.onSurfaceMuted} style={[styles.searchInput, { color: colors.onSurface }]} />
            {searchQuery ? <Pressable onPress={() => setSearchQuery('')}><MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceMuted} /></Pressable> : null}
          </View>
          <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
            {(['all', 'main', 'other', 'adhkar'] as const).map(tab => (
              <Pressable key={tab} onPress={() => setPickerTab(tab)}
                style={[styles.tab, pickerTab === tab && { borderBottomColor: colors.brand }]}>
                <Text style={[styles.tabTxt, { color: pickerTab === tab ? colors.brand : colors.onSurfaceMuted }]}>
                  {tab === 'all' ? 'All Dhikrs' : tab === 'main' ? 'Main Duas' : tab === 'other' ? 'Other Duas' : 'Adhkar'}
                </Text>
              </Pressable>
            ))}
          </View>
          <FlatList data={pickerItems} keyExtractor={item => item.id} renderItem={renderPickerItem}
            contentContainerStyle={{ padding: 16, gap: 10 }} showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={{ alignItems: 'center', paddingTop: 40 }}>
              <MaterialCommunityIcons name="magnify-close" size={40} color={colors.onSurfaceMuted} />
              <Text style={{ color: colors.onSurfaceMuted, marginTop: 12 }}>No results found</Text>
            </View>} keyboardShouldPersistTaps="handled" />
        </SafeAreaView>
      </Modal>

      {/* ══ CUSTOM TARGET MODAL ══ */}
      <Modal visible={showTargetModal} transparent animationType="fade" onRequestClose={() => setShowTargetModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTargetModal(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Set Custom Target</Text>
            <TextInput value={customTargetInput} onChangeText={setCustomTargetInput} keyboardType="numeric"
              placeholder="Enter target (e.g. 500)" placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.numInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]} autoFocus />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => setShowTargetModal(false)} style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={{ color: colors.onSurfaceMuted, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCustomTargetConfirm} style={[styles.modalBtn, { backgroundColor: colors.brand }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Set Target</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ SAVE MODAL ══ */}
      <Modal visible={showSaveModal} transparent animationType="fade" onRequestClose={() => setShowSaveModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSaveModal(false)} />
          <View style={[styles.modalCard, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialCommunityIcons name="content-save-outline" size={22} color="#27ae60" />
              <Text style={[styles.modalTitle, { color: colors.onSurface, textAlign: 'left', flex: 1 }]}>Save Progress</Text>
            </View>
            <Text style={{ color: colors.onSurfaceMuted, fontSize: 13 }}>{selectedPhrase?.transliteration} · {count} of {targetCount}</Text>
            <TextInput value={sessionNameInput} onChangeText={setSessionNameInput}
              placeholder={`${selectedPhrase?.transliteration ?? 'Dhikr'} – ${new Date().toLocaleDateString()}`}
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.numInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface, fontSize: 14 }]}
              autoFocus returnKeyType="done" onSubmitEditing={handleSaveProgress} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => setShowSaveModal(false)} style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={{ color: colors.onSurfaceMuted, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSaveProgress}
                style={[styles.modalBtn, { backgroundColor: count === 0 ? colors.border : '#27ae60', opacity: count === 0 ? 0.5 : 1 }]} disabled={count === 0}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ APPEARANCE MODAL ══ */}
      {renderAppearanceModal()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  gestureContainer: { flex: 1 },

  // Header
  backHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  hBtn: { marginLeft: 12 },

  scrollContent: { paddingBottom: 20, alignItems: 'center' },

  // Tasbih full-width area
  tasbihArea: { width: CARD_WIDTH, position: 'relative', overflow: 'hidden' },

  countingCard: {
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingTop: 18,
    paddingBottom: 12,
    marginBottom: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 14,
  },
  cardPatternRing: {
    position: 'absolute',
    width: CARD_WIDTH * 0.92,
    height: CARD_WIDTH * 0.92,
    borderRadius: CARD_WIDTH * 0.46,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.16)',
    top: -CARD_WIDTH * 0.44,
    right: -CARD_WIDTH * 0.32,
  },
  cardPatternRingSmall: {
    width: CARD_WIDTH * 0.54,
    height: CARD_WIDTH * 0.54,
    borderRadius: CARD_WIDTH * 0.27,
    top: 'auto',
    right: 'auto',
    bottom: -CARD_WIDTH * 0.28,
    left: -CARD_WIDTH * 0.2,
    borderColor: 'rgba(0,200,150,0.18)',
  },
  centerCounterSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 6,
  },
  onlineTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, marginBottom: 4 },
  countWindow: {
    width: Math.min(CARD_WIDTH - 64, 260),
    minHeight: 126,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  countWindowShine: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 34,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  countOverline: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  bigCount: { fontSize: 78, fontWeight: '900', textAlign: 'center', lineHeight: 84 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  roundBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 8, elevation: 6 },
  roundBtnText: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  resetPill: { flexDirection: 'row', gap: 6, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 5 },
  resetPillText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },

  // Phrase + audio row
  phraseRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12, paddingVertical: 12 },
  translit: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 2 },
  arabic: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  meaning: { fontSize: 12, textAlign: 'center', marginTop: 3 },
  audioBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  hintBox: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  hint: { fontSize: 12, textAlign: 'center' },

  // Sections
  section: { width: '100%', marginBottom: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Category tabs
  catRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catLabel: { fontSize: 11, fontWeight: '700' },

  // Phrase cards
  phraseCard: { marginRight: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, minWidth: 128, maxWidth: 170, height: 88, justifyContent: 'center' },
  catBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  catBadgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  catBadgeTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  phraseArabic: { fontSize: 15, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  phraseTranslit: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  phraseCountBadge: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  customTag: { marginTop: 3, alignSelf: 'center', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  customTagTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  addBtn: { marginRight: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', minWidth: 96, height: 88, alignItems: 'center', justifyContent: 'center', gap: 4 },
  addBtnTxt: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  hint2: { fontSize: 11, marginTop: 8 },

  // Target
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  editBtnTxt: { fontSize: 12, fontWeight: '700' },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  targetBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', minWidth: 56 },
  targetBtnTxt: { fontSize: 14, fontWeight: '600' },

  // Actions
  actionRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 22 },
  actionBtn: { flex: 1, flexDirection: 'row', paddingVertical: 12, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 5, borderWidth: 1.5 },
  actionBtnTxt: { fontSize: 12, fontWeight: '700' },

  // Info cards
  infoRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 22 },
  infoCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  progBar: { height: 6, backgroundColor: 'rgba(128,128,128,0.15)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 3 },
  infoValue: { fontSize: 16, fontWeight: '700' },

  // Hadith
  hadithCard: { marginBottom: 22, borderRadius: 16, borderWidth: 1.5, overflow: 'hidden' },
  hadithHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  hadithTitle: { fontSize: 14, fontWeight: '700' },
  hadithBody: { paddingHorizontal: 16, paddingBottom: 16 },
  hadithText: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  hadithSource: { fontSize: 12, fontWeight: '700', marginTop: 8 },

  // Sessions
  sessionsWrap: { width: '100%', marginBottom: 22, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  sessionName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  sessionMeta: { fontSize: 11 },
  sessionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  sessionBtnTxt: { fontSize: 12, fontWeight: '700' },

  // Modals
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15 },
  bottomTabs: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  
  // Appearance Modal Styles
  sheetCard: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  optBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabTxt: { fontSize: 12, fontWeight: '700' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  pickerArabic: { fontSize: 16, fontWeight: '700', textAlign: 'right' },
  pickerTranslit: { fontSize: 13, fontWeight: '600' },
  pickerMeaning: { fontSize: 12 },
  pickerAddBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000090', padding: 24 },
  modalCard: { width: '100%', borderRadius: 20, padding: 24, gap: 14 },
  numInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 17, textAlign: 'center', fontWeight: '700' },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});
