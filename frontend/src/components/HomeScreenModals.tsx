import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions, Animated, ImageBackground, Image, Modal, Alert, RefreshControl, FlatList, InteractionManager,
} from "react-native";
import { ScrollView as AnimatedScrollView } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useTranslation } from "@/src/localization";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import Svg, { Circle } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format12Hour } from "@/src/utils/time";

import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { AnimatedCard } from "@/src/components/AnimatedCard";
import { PrayerCardSkeleton } from "@/src/components/SkeletonLoader";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";
import { DEFAULT_GOALS, CATEGORY_COLORS, Goal } from "@/src/data/goals";
import { SURAH_LIST } from "@/src/data/surahList";
import { SELECTABLE_ADHKAAR, DHIKRS } from "@/src/data/dhikrs";
// Note: duas.ts (608 KB) is lazily required inside a deferred effect to keep it off the startup import graph and first paint
import {
  resolveUserLocation, getCompletedGoals, toggleGoal,
  getActiveGoalIds, getPrayerSettings, schedulePrayerNotifications, updateStickyPrayerNotification,
  getMenstrualModeActive, setMenstrualModeActive,
  getGoogleCalendarConnected, setGoogleCalendarConnected,
  getGoogleCalendarDismissed, setGoogleCalendarDismissed,
  getDailyDhikrCounts, saveDailyDhikrCounts,
  getPrayerCompletions, savePrayerCompletions,
  saveActiveGoalIds, getGoalNotifTimes, scheduleGoalNotifications,
  getPrayerTimingsCache,
} from "@/src/storage";
import { useTabBarVisibility } from "@/src/TabBarVisibilityContext";
import { Image as ExpoImage } from "expo-image";
import {
  AppIconButton,
  AppSwitch,
  AppTextInput,
} from "@/src/components/ui";

// Extracted from frontend/app/(tabs)/index.tsx to keep the main screen file
// smaller. Pure presentational component: all state and handlers are owned by
// HomeScreen and passed in as props. Behavior is unchanged from the original
// inline JSX.
const { width, height } = Dimensions.get("window");

export function HomeScreenModals(props: any) {
  const {
  activeActionGoal,
  activeIds,
  allCompletedModalVisible,
  allDhikrAndDuaOptions,
  colors,
  confettiParticles,
  customGoals,
  dhikrModalVisible,
  dhikrSearch,
  handleAddCustomGoal,
  handleMenstrualModeToggle,
  menstrualMode,
  newGoalCategory,
  newGoalTitle,
  prayerCompletions,
  prayersModalVisible,
  removeGoalFromHome,
  router,
  setActiveActionGoal,
  setActiveIds,
  setAllCompletedModalVisible,
  setCustomGoals,
  setDhikrModalVisible,
  setDhikrSearch,
  setNewGoalCategory,
  setNewGoalTitle,
  setPrayersModalVisible,
  setShowAddCustomModal,
  setSurahSearch,
  showAddCustomModal,
  styles,
  surahSearch,
  togglePrayerCompletion,
  } = props;
  return (
    <>

      {/* All Prayers Modal */}
      <Modal
        visible={prayersModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPrayersModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPrayersModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface }]}>All Prayers</Text>
              <AppIconButton
                accessibilityLabel="Close all prayers"
                icon="close"
                onPress={() => setPrayersModalVisible(false)}
              />
            </View>
            
            <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false}>
              {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((pName) => {
                const isDone = menstrualMode ? true : prayerCompletions[pName];
                return (
                  <Pressable 
                    key={pName} 
                    onPress={() => {
                      if (menstrualMode) return;
                      togglePrayerCompletion(pName);
                    }}
                    style={[styles.modalPrayerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <Text style={[styles.modalPrayerLabel, { color: colors.onSurface }]}>{pName}</Text>
                    <View style={[styles.goalCircleCheck, { borderColor: CATEGORY_COLORS.prayer, backgroundColor: isDone ? CATEGORY_COLORS.prayer : "transparent" }]}>
                      {isDone && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
              
              {/* Menstrual Mode Section */}
              <View style={[styles.menstrualCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.menstrualTitle, { color: colors.onSurface }]}>Menstrual Mode</Text>
                  <Text style={[styles.menstrualSub, { color: colors.onSurfaceMuted }]}>
                    Menstrual mode will excuse your Prayers until you turn it off at the end of your period.
                  </Text>
                </View>
                <AppSwitch
                  accessibilityLabel="Menstrual mode"
                  value={menstrualMode}
                  onValueChange={handleMenstrualModeToggle}
                />
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Select Daily Adhkar Modal */}
      <Modal
        visible={dhikrModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDhikrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, maxHeight: height * 0.85, width: "92%", borderRadius: theme.radius.lg }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitle, { color: colors.onSurface, fontSize: 18, fontWeight: "700" }]}>Select Daily Adhkar</Text>
                <Text style={{ fontSize: 12, color: colors.onSurfaceMuted, marginTop: 2 }}>Select your favourite Dhikr to perform everyday</Text>
              </View>
              <AppIconButton
                accessibilityLabel="Close daily adhkar selection"
                icon="close"
                onPress={() => setDhikrModalVisible(false)}
              />
            </View>

            {/* Create Custom Goal Button */}
            <Pressable
              onPress={() => {
                setDhikrModalVisible(false);
                setShowAddCustomModal(true);
              }}
              style={[styles.addCustomBtn, { backgroundColor: colors.brand, marginVertical: 10, borderRadius: theme.radius.md, paddingVertical: 10 }]}
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.onBrandPrimary} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.onBrandPrimary, fontWeight: "700", fontSize: 14 }}>Create Custom Goal</Text>
            </Pressable>

            <ScrollView style={{ width: "100%" }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 16 }}>
              {SELECTABLE_ADHKAAR.map((item) => {
                const isAdded = activeIds.includes(item.id);
                return (
                  <View 
                    key={item.id} 
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: 14,
                      padding: 14,
                      gap: 8
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.onSurface, flex: 1, paddingRight: 8 }}>{item.title}</Text>
                      <AppSwitch
                        accessibilityLabel={`Include ${item.title} in daily adhkar`}
                        value={isAdded}
                        onValueChange={async () => {
                          Haptics.selectionAsync().catch(() => {});
                          if (isAdded) {
                            const updated = activeIds.filter(id => id !== item.id);
                            setActiveIds(updated);
                            await saveActiveGoalIds(updated);
                          } else {
                            const updated = [...activeIds, item.id];
                            setActiveIds(updated);
                            await saveActiveGoalIds(updated);
                          }
                        }}
                      />
                    </View>

                    <Text style={{ fontSize: 16, color: colors.brand, fontFamily: "Amiri", textAlign: "right", lineHeight: 28 }}>
                      {item.arabic}
                    </Text>

                    <View style={{ marginTop: 2 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: colors.onSurfaceMuted }}>Transliteration:</Text>
                      <Text style={{ fontSize: 13, color: colors.onSurface, lineHeight: 18, marginTop: 2 }}>
                        {item.transliteration}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Custom Goal Modal */}
      <Modal
        visible={showAddCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, maxHeight: height * 0.85, width: "92%", borderRadius: theme.radius.lg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.onSurface, fontSize: 18, fontWeight: "700" }]}>Create Custom Goal</Text>
              <AppIconButton
                accessibilityLabel="Close custom goal"
                icon="close"
                onPress={() => setShowAddCustomModal(false)}
              />
            </View>
            
            <View style={{ gap: 14, marginTop: 8, width: "100%", flex: 1 }}>
              <View>
                <Text style={{ fontSize: 13, color: colors.onSurfaceMuted, marginBottom: 6, fontWeight: "600" }}>Category</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {(["prayer", "quran", "dhikr", "other"] as const).map((cat) => {
                    const isSel = newGoalCategory === cat;
                    const labelMap: Record<string, string> = { prayer: "Prayer", quran: "Qur'an", dhikr: "Dhikr", other: "Other" };
                    return (
                      <Pressable
                        key={cat}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setNewGoalCategory(cat);
                        }}
                        style={[
                          styles.catSelectBtn, 
                          { flex: 1, borderColor: colors.border, backgroundColor: isSel ? colors.brand : colors.surface, paddingVertical: 10, alignItems: "center", borderRadius: 10 }
                        ]}
                      >
                        <Text style={{ fontSize: 12, color: isSel ? colors.onBrandPrimary : colors.onSurface, fontWeight: isSel ? "700" : "500" }}>
                          {labelMap[cat]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {newGoalCategory === "quran" ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.onSurfaceMuted, fontWeight: "600" }}>Select Surah to Recite Everyday</Text>
                  <AppTextInput
                    value={surahSearch}
                    onChangeText={setSurahSearch}
                    placeholder="Search Surah (e.g. Yaseen, Kahf, Mulk...)"
                    leadingIcon="magnify"
                    style={styles.input}
                  />

                  <FlatList
                    data={SURAH_LIST.filter(s =>
                      s.englishName.toLowerCase().includes(surahSearch.toLowerCase()) ||
                      s.englishNameTranslation.toLowerCase().includes(surahSearch.toLowerCase()) ||
                      s.number.toString() === surahSearch.trim()
                    )}
                    keyExtractor={(surah: any) => surah.number.toString()}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews
                    renderItem={({ item: surah }: { item: any }) => (
                      <Pressable
                        onPress={async () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                          const newGoal = {
                            id: `custom-surah-${surah.number}-${Date.now()}`,
                            title: `Recite Surah ${surah.englishName}`,
                            arabic: surah.name,
                            category: "quran" as const,
                            repeat: "daily" as const
                          };
                          const updatedCustom = [...customGoals, newGoal];
                          setCustomGoals(updatedCustom);
                          await AsyncStorage.setItem("hikmah:custom-goals:v1", JSON.stringify(updatedCustom));
                          const updatedActive = [...activeIds, newGoal.id];
                          setActiveIds(updatedActive);
                          await saveActiveGoalIds(updatedActive);
                          setShowAddCustomModal(false);
                          setSurahSearch("");
                          Alert.alert("Goal Created \ud83c\udf89", `Added "Recite Surah ${surah.englishName}" to your daily goals!`);
                        }}
                        style={[styles.modalPrayerRow, { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 10, borderRadius: theme.radius.md }]}
                      >
                        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brand + "18", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.brand }}>{surah.number}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.modalPrayerLabel, { color: colors.onSurface }]}>{surah.englishName}</Text>
                          <Text style={{ fontSize: 11, color: colors.onSurfaceMuted }}>{surah.englishNameTranslation} \ufffd {surah.numberOfAyahs} Verses</Text>
                        </View>
                        <Text style={{ fontSize: 16, color: colors.brand, fontFamily: "Amiri" }}>{surah.name}</Text>
                      </Pressable>
                    )}
                  />
                </View>
              ) : newGoalCategory === "dhikr" ? (
                <View style={{ flex: 1, gap: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.onSurfaceMuted, fontWeight: "600" }}>Select Dhikr or Du'a from Du'a Hub to Recite Everyday</Text>
                  <AppTextInput
                    value={dhikrSearch}
                    onChangeText={setDhikrSearch}
                    placeholder="Search Dhikr or Du'a (e.g. Protection, Forgiveness, Ummah, Healing...)"
                    leadingIcon="magnify"
                    style={styles.input}
                  />

                  <FlatList
                    data={allDhikrAndDuaOptions.filter(item =>
                      item.title.toLowerCase().includes(dhikrSearch.toLowerCase()) ||
                      (item.transliteration && item.transliteration.toLowerCase().includes(dhikrSearch.toLowerCase())) ||
                      (item.translation && item.translation.toLowerCase().includes(dhikrSearch.toLowerCase())) ||
                      (item.categoryTag && item.categoryTag.toLowerCase().includes(dhikrSearch.toLowerCase())) ||
                      item.arabic.includes(dhikrSearch.trim())
                    )}
                    keyExtractor={(item: any) => item.id}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                    removeClippedSubviews
                    renderItem={({ item: dhikrItem }: { item: any }) => (
                      <Pressable
                        onPress={async () => {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                          const newGoal = {
                            id: `custom-dhikr-${dhikrItem.id}-${Date.now()}`,
                            title: dhikrItem.title,
                            arabic: dhikrItem.arabic,
                            subtitle: dhikrItem.transliteration || dhikrItem.translation,
                            category: "dhikr" as const,
                            repeat: "daily" as const
                          };
                          const updatedCustom = [...customGoals, newGoal];
                          setCustomGoals(updatedCustom);
                          await AsyncStorage.setItem("hikmah:custom-goals:v1", JSON.stringify(updatedCustom));
                          const updatedActive = [...activeIds, newGoal.id];
                          setActiveIds(updatedActive);
                          await saveActiveGoalIds(updatedActive);
                          setShowAddCustomModal(false);
                          setDhikrSearch("");
                          Alert.alert("Goal Created \ud83c\udf89", `Added "${dhikrItem.title}" to your daily goals!`);
                        }}
                        style={[styles.modalPrayerRow, { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 10, borderRadius: theme.radius.md, alignItems: "flex-start" }]}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2, flexWrap: "wrap" }}>
                            <Text style={[styles.modalPrayerLabel, { color: colors.onSurface, fontSize: 14 }]}>{dhikrItem.title}</Text>
                            <View style={{ backgroundColor: colors.brand + "18", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 10, color: colors.brand, fontWeight: "600" }}>{dhikrItem.categoryTag}</Text>
                            </View>
                          </View>
                          {dhikrItem.transliteration ? (
                            <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }} numberOfLines={2}>{dhikrItem.transliteration}</Text>
                          ) : dhikrItem.translation ? (
                            <Text style={{ fontSize: 11, color: colors.onSurfaceMuted, marginTop: 2 }} numberOfLines={2}>{dhikrItem.translation}</Text>
                          ) : null}
                        </View>
                        <Text style={{ fontSize: 15, color: colors.brand, fontFamily: "Amiri", textAlign: "right" }}>{dhikrItem.arabic}</Text>
                      </Pressable>
                    )}
                  />
                </View>
              ) : (
                <View style={{ gap: 16, marginTop: 4 }}>
                  <View>
                    <Text style={{ fontSize: 13, color: colors.onSurfaceMuted, marginBottom: 6, fontWeight: "600" }}>Goal Title</Text>
                    <AppTextInput
                      value={newGoalTitle}
                      onChangeText={setNewGoalTitle}
                      placeholder={newGoalCategory === "prayer" ? "e.g. Offer Ishraq, Offer Duha" : "e.g. Read Tafseer, Visit Family"}
                      style={styles.input}
                    />
                  </View>

                  <Pressable 
                    onPress={handleAddCustomGoal}
                    style={[styles.modalSubmitBtn, { backgroundColor: colors.brand, marginTop: 8, borderRadius: theme.radius.md }]}
                  >
                    <Text style={{ color: colors.onBrandPrimary, fontWeight: "700", fontSize: 15 }}>Create & Add Goal</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Goal ActionSheet Modal */}
      <Modal
        visible={activeActionGoal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveActionGoal(null)}
      >
        <Pressable style={styles.actionSheetOverlay} onPress={() => setActiveActionGoal(null)}>
          <View style={[styles.actionSheetContent, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Pressable 
              onPress={() => {
                if (activeActionGoal) {
                  setActiveActionGoal(null);
                  router.push("/goal-settings");
                }
              }}
              style={[styles.actionSheetOpt, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.actionSheetText, { color: colors.onSurface }]}>Edit goal</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => {
                if (activeActionGoal) {
                  const id = activeActionGoal.id;
                  setActiveActionGoal(null);
                  removeGoalFromHome(id);
                }
              }}
              style={[styles.actionSheetOpt, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
            >
              <Text style={[styles.actionSheetText, { color: colors.error }]}>Remove</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => setActiveActionGoal(null)}
              style={styles.actionSheetOpt}
            >
              <Text style={[styles.actionSheetText, { color: colors.onSurface, fontWeight: "700" }]}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Confetti Celebration Overlay Modal */}
      <Modal
        visible={allCompletedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAllCompletedModalVisible(false)}
      >
        <Pressable 
          style={StyleSheet.absoluteFillObject} 
          onPress={() => setAllCompletedModalVisible(false)}
        >
          <View style={[styles.congratsOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
            {/* Render Confetti Particles */}
            {confettiParticles.map((p, idx) => {
              const rotation = p.rotate.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', `${360 + Math.random() * 360}deg`]
              });
              const translateX = p.rotate.interpolate({
                inputRange: [0, 1],
                outputRange: [0, p.drift]
              });
              return (
                <Animated.View
                  key={idx}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: p.x,
                    width: p.shape === "rect" ? 14 : 9,
                    height: 9,
                    borderRadius: p.shape === "circle" ? 4.5 : 2,
                    backgroundColor: p.color,
                    transform: [
                      { translateY: p.y },
                      { translateX: translateX },
                      { rotate: rotation },
                      { scale: p.scale }
                    ],
                    zIndex: 9999,
                  }}
                />
              );
            })}

            {/* Celebratory Text */}
            <View style={{ alignItems: "center", justifyContent: "center", flex: 1, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 48, color: "#F5D061", fontWeight: "bold", textAlign: "center", marginBottom: 16, fontFamily: "AmiriBold", textShadowColor: "rgba(245,208,97,0.45)", textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 14 }}>
                سُبْحَانَ ٱللَّٰهِ
              </Text>
              <Text style={{ fontSize: 24, color: "#FFFFFF", fontWeight: "800", textAlign: "center", lineHeight: 36, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>
                {"You've completed\nall your goals for today."}
              </Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
