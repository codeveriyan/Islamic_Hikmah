import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Animated, Pressable, ScrollView, Platform, Modal,
  TextInput, FlatList, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/src/ThemeContext';
import { useTranslation } from '@/src/localization';
import { getDhikrCounts, setDhikrCount } from '@/src/storage';
import { useAudioPlayer } from 'expo-audio';
import { theme } from '@/src/theme';
import { CATEGORIES, DuaItem } from '@/src/data/duas';
import { MORNING_EVENING_ADHKAR, AdhkarItem } from '@/src/data/adhkar';

const { width } = Dimensions.get('window');

// ─── Built-in Tasbih phrases ─────────────────────────────────────────────────
const BUILTIN_PHRASES = [
  { id: 'subhanallah',     arabic: 'سُبْحَانَ اللَّهِ',                         transliteration: 'SubhanAllah',                       meaning: 'Glory be to Allah' },
  { id: 'alhamdulillah',   arabic: 'الْحَمْدُ لِلَّهِ',                         transliteration: 'Alhamdulillah',                     meaning: 'Praise be to Allah' },
  { id: 'allahuakbar',     arabic: 'اللَّهُ أَكْبَرُ',                          transliteration: 'Allahu Akbar',                      meaning: 'Allah is Greatest' },
  { id: 'lahawla',         arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',transliteration: 'La hawla wa la quwwata illa billah', meaning: 'No power except with Allah' },
  { id: 'astaghfirullah',  arabic: 'أَسْتَغْفِرُ اللَّهَ',                      transliteration: 'Astaghfirullah',                    meaning: 'I seek forgiveness from Allah' },
  { id: 'lailaha',         arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',                 transliteration: 'La ilaha illallah',                 meaning: 'There is no god but Allah' },
];

type DhikrEntry = {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  source?: 'builtin' | 'dua' | 'adhkar';
};

const HAPTIC_KEY = 'hikmah:tasbih:haptic:v1';
const CUSTOM_DHIKR_KEY = 'hikmah:tasbih:custom-dhikr:v1';

export default function TasbihScreen() {
  const router = useRouter();
  const { colors, language } = useTheme();
  const { t } = useTranslation(language);

  const tickPlayer = useAudioPlayer(require('../assets/audio/tick.wav'));

  // ─── State ───────────────────────────────────────────────────────────────
  const [phraseId, setPhraseId] = useState('subhanallah');
  const [count, setCount] = useState(0);
  const [targetCount, setTargetCount] = useState(33);
  const [isMuted, setIsMuted] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // All dhikr phrases (builtin + custom-added)
  const [allPhrases, setAllPhrases] = useState<DhikrEntry[]>(BUILTIN_PHRASES.map(p => ({ ...p, source: 'builtin' as const })));

  // Modals
  const [showPicker, setShowPicker] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [pickerTab, setPickerTab] = useState<'all' | 'main' | 'other' | 'adhkar'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customTargetInput, setCustomTargetInput] = useState('');

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const selectedPhrase = allPhrases.find(p => p.id === phraseId) || allPhrases[0];
  const progressPercentage = targetCount > 0 ? (count / targetCount) * 100 : 0;
  const isComplete = count >= targetCount && targetCount > 0;

  // ─── Load saved preferences ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Load haptic preference
      const hapticRaw = await AsyncStorage.getItem(HAPTIC_KEY);
      if (hapticRaw !== null) setHapticEnabled(hapticRaw === 'true');

      // Load custom dhikr entries
      const customRaw = await AsyncStorage.getItem(CUSTOM_DHIKR_KEY);
      if (customRaw) {
        const customEntries: DhikrEntry[] = JSON.parse(customRaw);
        setAllPhrases([
          ...BUILTIN_PHRASES.map(p => ({ ...p, source: 'builtin' as const })),
          ...customEntries,
        ]);
      }

      // Load dhikr counts
      const c = await getDhikrCounts();
      setCounts(c);
      setCount(c['subhanallah'] || 0);
    })();
  }, []);

  // Reload count when phrase changes
  useEffect(() => {
    setCount(counts[phraseId] || 0);
  }, [phraseId]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleIncrement = useCallback(() => {
    const nextCount = count + 1;
    const isTargetHit = targetCount > 0 && nextCount >= targetCount;
    const finalCount = isTargetHit ? 0 : nextCount;

    if (!isMuted) {
      tickPlayer.seekTo(0);
      tickPlayer.play();
    }

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    pulseAnim.setValue(0);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    setCount(finalCount);
    const newCounts = { ...counts, [phraseId]: finalCount };
    setCounts(newCounts);
    setDhikrCount(phraseId, finalCount).catch(console.error);

    if (isTargetHit) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [count, targetCount, phraseId, counts, isMuted, hapticEnabled]);

  const handleDecrement = useCallback(() => {
    const nextCount = Math.max(0, count - 1);
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCount(nextCount);
    const newCounts = { ...counts, [phraseId]: nextCount };
    setCounts(newCounts);
    setDhikrCount(phraseId, nextCount).catch(console.error);
  }, [count, phraseId, counts, hapticEnabled]);

  const handleReset = useCallback(() => {
    setCount(0);
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    const newCounts = { ...counts, [phraseId]: 0 };
    setCounts(newCounts);
    setDhikrCount(phraseId, 0).catch(console.error);
  }, [phraseId, counts, hapticEnabled]);

  const handlePhraseSelect = useCallback((id: string) => {
    setPhraseId(id);
  }, []);

  const toggleHaptic = useCallback(async () => {
    const next = !hapticEnabled;
    setHapticEnabled(next);
    await AsyncStorage.setItem(HAPTIC_KEY, String(next));
    if (next) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [hapticEnabled]);

  // ─── Add custom Dhikr from Duas/Adhkar ────────────────────────────────────
  const handleAddDhikr = useCallback(async (entry: DhikrEntry) => {
    const alreadyExists = allPhrases.some(p => p.id === entry.id);
    if (alreadyExists) {
      setPhraseId(entry.id);
      setShowPicker(false);
      return;
    }
    const updated = [...allPhrases, entry];
    setAllPhrases(updated);
    const customOnly = updated.filter(p => p.source !== 'builtin');
    await AsyncStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(customOnly));
    setPhraseId(entry.id);
    setShowPicker(false);
  }, [allPhrases]);

  const handleRemoveCustomDhikr = useCallback(async (id: string) => {
    if (BUILTIN_PHRASES.some(p => p.id === id)) return; // can't remove builtins
    const updated = allPhrases.filter(p => p.id !== id);
    setAllPhrases(updated);
    const customOnly = updated.filter(p => p.source !== 'builtin');
    await AsyncStorage.setItem(CUSTOM_DHIKR_KEY, JSON.stringify(customOnly));
    if (phraseId === id) setPhraseId('subhanallah');
  }, [allPhrases, phraseId]);

  // ─── Target count modal ───────────────────────────────────────────────────
  const handleSetTarget = useCallback((target: number) => {
    setTargetCount(target);
  }, []);

  const handleCustomTargetConfirm = useCallback(() => {
    const val = parseInt(customTargetInput, 10);
    if (!isNaN(val) && val > 0) {
      setTargetCount(val);
    }
    setShowTargetModal(false);
    setCustomTargetInput('');
  }, [customTargetInput]);

  // ─── Picker data ──────────────────────────────────────────────────────────
  const pickerItems = useMemo(() => {
    const allDhikrEntries: DhikrEntry[] = allPhrases.map(p => ({
      id: p.id, arabic: p.arabic, transliteration: p.transliteration, meaning: p.meaning, source: p.source,
    }));

    const mainDuaEntries: DhikrEntry[] = CATEGORIES
      .filter(c => c.group === 'main')
      .flatMap(c => c.duas.map((d: DuaItem) => ({
        id: `dua-${d.id}`,
        arabic: d.arabic,
        transliteration: d.transliteration || d.title,
        meaning: d.translation,
        source: 'dua' as const,
      })));

    const otherDuaEntries: DhikrEntry[] = CATEGORIES
      .filter(c => c.group === 'other')
      .flatMap(c => c.duas.map((d: DuaItem) => ({
        id: `dua-${d.id}`,
        arabic: d.arabic,
        transliteration: d.transliteration || d.title,
        meaning: d.translation,
        source: 'dua' as const,
      })));

    const adhkarEntries: DhikrEntry[] = MORNING_EVENING_ADHKAR.map((a: AdhkarItem) => ({
      id: `adhkar-${a.id}`,
      arabic: a.arabic,
      transliteration: a.transliteration || '',
      meaning: a.translation,
      source: 'adhkar' as const,
    }));

    const base = pickerTab === 'all' ? allDhikrEntries
      : pickerTab === 'main' ? mainDuaEntries
      : pickerTab === 'other' ? otherDuaEntries
      : adhkarEntries;

    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(e =>
      e.transliteration.toLowerCase().includes(q) ||
      e.meaning.toLowerCase().includes(q) ||
      e.arabic.includes(searchQuery)
    );
  }, [pickerTab, searchQuery, allPhrases]);

  // ─── Gestures ─────────────────────────────────────────────────────────────
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });

  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent;
    touchStartRef.current = { x: touch.pageX, y: touch.pageY, time: Date.now() };
  };

  const handleTouchEnd = (e: any) => {
    const touch = e.nativeEvent;
    const dx = touch.pageX - touchStartRef.current.x;
    const dy = touch.pageY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    if (dt < 250 && Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      handleIncrement();
    } else if (dx < -50 && Math.abs(dy) < 35) {
      handleDecrement();
    }
  };

  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });

  // ─── Render picker item ───────────────────────────────────────────────────
  const renderPickerItem = ({ item }: { item: DhikrEntry }) => {
    const isSelected = allPhrases.some(p => p.id === item.id);
    return (
      <Pressable
        onPress={() => handleAddDhikr(item)}
        style={[styles.pickerItem, { backgroundColor: colors.surfaceSecondary, borderColor: isSelected ? colors.brand : colors.border }]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.pickerArabic, { color: colors.onSurface }]} numberOfLines={2}>
            {item.arabic}
          </Text>
          <Text style={[styles.pickerTranslit, { color: colors.brand }]} numberOfLines={1}>
            {item.transliteration}
          </Text>
          <Text style={[styles.pickerMeaning, { color: colors.onSurfaceMuted }]} numberOfLines={2}>
            {item.meaning}
          </Text>
        </View>
        <View style={[styles.pickerAddBtn, { backgroundColor: isSelected ? colors.brand + '22' : colors.brand }]}>
          <MaterialCommunityIcons
            name={isSelected ? 'check' : 'plus'}
            size={18}
            color={isSelected ? colors.brand : '#fff'}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={['top']}>
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
            <Pressable onPress={handleReset} hitSlop={10} style={{ marginRight: 14 }}>
              <MaterialCommunityIcons name="cached" size={24} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={toggleHaptic} hitSlop={10} style={{ marginRight: 14 }}>
              <MaterialCommunityIcons
                name={hapticEnabled ? 'vibrate' : 'vibrate-off'}
                size={24}
                color={hapticEnabled ? colors.brand : colors.onSurfaceMuted}
              />
            </Pressable>
            <Pressable onPress={() => setIsMuted(!isMuted)} hitSlop={10} style={{ marginRight: 14 }}>
              <MaterialCommunityIcons name={isMuted ? 'volume-off' : 'volume-high'} size={24} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={10} style={{ marginRight: 14 }}>
              <MaterialCommunityIcons name="home-outline" size={24} color={colors.onSurface} />
            </Pressable>
            <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
              <MaterialCommunityIcons name="cog-outline" size={24} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Phrase detail */}
          <View style={styles.headerPhraseSection}>
            <Text style={[styles.phraseArabicText, { color: colors.brand }]}>{selectedPhrase.arabic}</Text>
            <Text style={[styles.selectedPhraseText, { color: colors.onSurfaceMuted }]}>{selectedPhrase.transliteration}</Text>
            <Text style={[styles.selectedPhraseMeaning, { color: colors.onSurfaceMuted }]}>{selectedPhrase.meaning}</Text>
          </View>

          {/* Counter circle */}
          <View style={styles.counterContainer}>
            <Animated.View
              style={[
                styles.pulseCircle,
                {
                  opacity: pulseOpacity,
                  backgroundColor: isComplete ? 'rgba(46,204,113,0.15)' : colors.brand + '22',
                  transform: [{
                    scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }),
                  }],
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
                <Text style={styles.counterText}>{count}</Text>
                {isComplete && (
                  <View style={styles.completeIcon}>
                    <MaterialCommunityIcons name="check-circle" size={40} color="#FFF" />
                  </View>
                )}
              </Animated.View>
            </Pressable>
            <Text style={[styles.progressText, { color: colors.onSurfaceMuted }]}>
              {targetCount > 0 ? `${count}/${targetCount}` : `${count}`}
            </Text>
          </View>

          {/* Hints */}
          <View style={styles.hintContainer}>
            <Text style={[styles.hintText, { color: colors.onSurfaceMuted }]}>Tap anywhere to count</Text>
            <Text style={[styles.subHintText, { color: colors.onSurfaceMuted }]}>Swipe right-to-left to decrease</Text>
          </View>

          {/* ── Target Count ── */}
          <View style={styles.targetSection}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Target Count</Text>
              <Pressable
                onPress={() => setShowTargetModal(true)}
                style={[styles.customBtn, { borderColor: colors.brand }]}
              >
                <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.brand} />
                <Text style={[styles.customBtnTxt, { color: colors.brand }]}>Custom</Text>
              </Pressable>
            </View>
            <View style={styles.targetButtons}>
              {[33, 66, 99, 100].map(target => (
                <TouchableOpacity
                  key={target}
                  onPress={() => handleSetTarget(target)}
                  style={[
                    styles.targetButton,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    targetCount === target && { backgroundColor: colors.brand + '22', borderColor: colors.brand },
                  ]}
                >
                  <Text style={[styles.targetButtonText, { color: targetCount === target ? colors.brand : colors.onSurfaceMuted }]}>
                    {target}
                  </Text>
                </TouchableOpacity>
              ))}
              {![33, 66, 99, 100].includes(targetCount) && targetCount > 0 && (
                <View style={[styles.targetButton, { backgroundColor: colors.brand + '22', borderColor: colors.brand, flex: 0, paddingHorizontal: 14 }]}>
                  <Text style={[styles.targetButtonText, { color: colors.brand }]}>{targetCount}</Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Select Dhikr ── */}
          <View style={styles.phraseSection}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Select Dhikr</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phraseScroll}>
              {allPhrases.map(phrase => (
                <Pressable
                  key={phrase.id}
                  onPress={() => handlePhraseSelect(phrase.id)}
                  onLongPress={() => {
                    if (phrase.source !== 'builtin') handleRemoveCustomDhikr(phrase.id);
                  }}
                  style={[
                    styles.phraseButton,
                    { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                    phraseId === phrase.id && { backgroundColor: colors.brand + '22', borderColor: colors.brand },
                  ]}
                >
                  <Text style={[styles.phraseArabic, { color: colors.onSurface }]} numberOfLines={2}>
                    {phrase.arabic}
                  </Text>
                  <Text style={[styles.phraseMeaning, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
                    {phrase.transliteration}
                  </Text>
                  {phrase.source !== 'builtin' && (
                    <View style={[styles.customTag, { backgroundColor: colors.brand + '22' }]}>
                      <Text style={[styles.customTagTxt, { color: colors.brand }]}>custom</Text>
                    </View>
                  )}
                </Pressable>
              ))}

              {/* Add more Dhikr button */}
              <Pressable
                onPress={() => { setShowPicker(true); setPickerTab('all'); setSearchQuery(''); }}
                style={[styles.addDhikrBtn, { backgroundColor: colors.brand + '15', borderColor: colors.brand }]}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.brand} />
                <Text style={[styles.addDhikrTxt, { color: colors.brand }]}>Add more{'\n'}Dhikr</Text>
              </Pressable>
            </ScrollView>
            <Text style={[styles.longPressHint, { color: colors.onSurfaceMuted }]}>
              💡 Long press a custom dhikr to remove it
            </Text>
          </View>

          {/* Haptic toggle */}
          <View style={[styles.hapticRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name={hapticEnabled ? 'vibrate' : 'vibrate-off'} size={20} color={hapticEnabled ? colors.brand : colors.onSurfaceMuted} />
            <Text style={[styles.hapticLabel, { color: colors.onSurface }]}>Haptic Vibration</Text>
            <Pressable onPress={toggleHaptic} style={[styles.hapticToggle, { backgroundColor: hapticEnabled ? colors.brand : colors.border }]}>
              <View style={[styles.hapticThumb, { left: hapticEnabled ? 22 : 2 }]} />
            </Pressable>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={handleDecrement} style={[styles.actionButton, styles.decrementButton]}>
              <MaterialCommunityIcons name="minus-circle-outline" size={22} color="#e74c3c" />
              <Text style={[styles.actionButtonText, { color: '#e74c3c' }]}>Decrease</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleReset} style={[styles.actionButton, styles.resetButton]}>
              <MaterialCommunityIcons name="refresh" size={22} color={colors.brand} />
              <Text style={[styles.actionButtonText, { color: colors.brand }]}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Progress / Remaining */}
          <View style={styles.infoSection}>
            <View style={[styles.infoItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Progress</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(progressPercentage, 100)}%`, backgroundColor: colors.brand }]} />
              </View>
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>{Math.round(progressPercentage)}%</Text>
            </View>
            <View style={[styles.infoItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.onSurfaceMuted }]}>Remaining</Text>
              <Text style={[styles.infoValue, { color: colors.onSurface }]}>
                {Math.max(0, targetCount - count)}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Pressable>

      {/* ══ ADD MORE DHIKR PICKER MODAL ══════════════════════════════════════ */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPicker(false)}>
        <SafeAreaView style={[styles.pickerContainer, { backgroundColor: colors.surface }]} edges={['top']}>
          {/* Picker Header */}
          <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.onSurface }]}>Add Dhikr</Text>
            <Pressable onPress={() => setShowPicker(false)} hitSlop={10}>
              <MaterialCommunityIcons name="close" size={26} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search dhikr or dua..."
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.searchInput, { color: colors.onSurface }]}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceMuted} />
              </Pressable>
            ) : null}
          </View>

          {/* Tabs */}
          <View style={[styles.pickerTabs, { borderBottomColor: colors.border }]}>
            {(['all', 'main', 'other', 'adhkar'] as const).map(tab => (
              <Pressable
                key={tab}
                onPress={() => setPickerTab(tab)}
                style={[styles.pickerTab, pickerTab === tab && { borderBottomColor: colors.brand }]}
              >
                <Text style={[styles.pickerTabTxt, { color: pickerTab === tab ? colors.brand : colors.onSurfaceMuted }]}>
                  {tab === 'all' ? 'All Dhikrs' : tab === 'main' ? 'Main Duas' : tab === 'other' ? 'Other Duas' : 'Adhkar'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* List */}
          <FlatList
            data={pickerItems}
            keyExtractor={item => item.id}
            renderItem={renderPickerItem}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <MaterialCommunityIcons name="magnify-close" size={40} color={colors.onSurfaceMuted} />
                <Text style={{ color: colors.onSurfaceMuted, marginTop: 12 }}>No results found</Text>
              </View>
            }
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>

      {/* ══ CUSTOM TARGET MODAL ══════════════════════════════════════════════ */}
      <Modal visible={showTargetModal} transparent animationType="fade" onRequestClose={() => setShowTargetModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.targetModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTargetModal(false)} />
          <View style={[styles.targetModalCard, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.targetModalTitle, { color: colors.onSurface }]}>Set Custom Target</Text>
            <TextInput
              value={customTargetInput}
              onChangeText={setCustomTargetInput}
              keyboardType="numeric"
              placeholder="Enter target (e.g. 500)"
              placeholderTextColor={colors.onSurfaceMuted}
              style={[styles.targetInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable onPress={() => setShowTargetModal(false)} style={[styles.targetModalBtn, { borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={{ color: colors.onSurfaceMuted, fontWeight: '600' }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleCustomTargetConfirm} style={[styles.targetModalBtn, { backgroundColor: colors.brand }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Set Target</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gestureContainer: { flex: 1 },
  backHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleText: { fontSize: 18, fontWeight: '700' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { paddingVertical: 20, paddingHorizontal: 16 },
  headerPhraseSection: { alignItems: 'center', marginBottom: 24 },
  phraseArabicText: { fontSize: 22, fontWeight: '700', marginBottom: 6, textAlign: 'center' },
  selectedPhraseText: { fontSize: 15, fontWeight: '600' },
  selectedPhraseMeaning: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  counterContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 32, position: 'relative' },
  pulseCircle: { position: 'absolute', width: 240, height: 240, borderRadius: 120 },
  counterButton: {
    width: 200, height: 200, borderRadius: 100,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
  },
  counterButtonPressed: { opacity: 0.85 },
  counterText: { fontSize: 72, fontWeight: '800', color: '#fff', textAlign: 'center' },
  completeIcon: { position: 'absolute', top: 6, right: 6 },
  progressText: { marginTop: 16, fontSize: 14, fontWeight: '500' },
  hintContainer: { alignItems: 'center', marginBottom: 32 },
  hintText: { fontSize: 13, fontWeight: '600' },
  subHintText: { fontSize: 11, marginTop: 3 },

  // Target section
  targetSection: { marginBottom: 24 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  customBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1.5 },
  customBtnTxt: { fontSize: 12, fontWeight: '700' },
  targetButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  targetButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', minWidth: 60 },
  targetButtonText: { fontSize: 14, fontWeight: '600' },

  // Phrase section
  phraseSection: { marginBottom: 16 },
  phraseScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  phraseButton: { marginRight: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, minWidth: 120, maxWidth: 160 },
  phraseArabic: { fontSize: 15, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  phraseMeaning: { fontSize: 11, textAlign: 'center', fontWeight: '500' },
  customTag: { marginTop: 4, alignSelf: 'center', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  customTagTxt: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  addDhikrBtn: {
    marginRight: 10, paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    minWidth: 90, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addDhikrTxt: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  longPressHint: { fontSize: 11, marginTop: 8 },

  // Haptic toggle
  hapticRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16,
  },
  hapticLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  hapticToggle: { width: 44, height: 24, borderRadius: 12, position: 'relative' },
  hapticThumb: { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },

  // Action buttons
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionButton: { flex: 1, flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 6, borderWidth: 1.5 },
  decrementButton: { backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.3)' },
  resetButton: { backgroundColor: 'rgba(26,188,156,0.08)', borderColor: 'rgba(26,188,156,0.3)' },
  actionButtonText: { fontSize: 13, fontWeight: '600' },

  // Info section
  infoSection: { flexDirection: 'row', gap: 12, paddingBottom: 24 },
  infoItem: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, marginBottom: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  infoValue: { fontSize: 18, fontWeight: '700' },

  // Picker modal
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: { fontSize: 18, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  pickerTabs: { flexDirection: 'row', borderBottomWidth: 1 },
  pickerTab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  pickerTabTxt: { fontSize: 12, fontWeight: '700' },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
  },
  pickerArabic: { fontSize: 16, fontWeight: '700', textAlign: 'right' },
  pickerTranslit: { fontSize: 13, fontWeight: '600' },
  pickerMeaning: { fontSize: 12 },
  pickerAddBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Target modal
  targetModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000088', padding: 24 },
  targetModalCard: { width: '100%', borderRadius: 20, padding: 24, gap: 12 },
  targetModalTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  targetInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 18, textAlign: 'center', fontWeight: '700' },
  targetModalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
});
