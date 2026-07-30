import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { useTheme } from "@/src/ThemeContext";
import {
  identifyQuranRecording,
  IdentifiedRecitationResult,
} from "@/src/services/quranIdentifierService";

const MIN_RECORDING_MILLIS = 2500;

export default function IdentifyQuranScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<IdentifiedRecitationResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Pulse animation for recording ring
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const startListening = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission needed",
          "Allow microphone access to identify a Quran recitation.",
        );
        return;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: "doNotMix",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setResult(null);
      setFeedback(null);
      setIsListening(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (error: any) {
      setIsListening(false);
      Alert.alert(
        "Could not start recording",
        error?.message || "Please try again.",
      );
    }
  };

  const stopAndIdentify = async () => {
    if (recorderState.durationMillis < MIN_RECORDING_MILLIS) {
      setFeedback("Keep reciting for at least 3 seconds, then tap again.");
      return;
    }

    setIsAnalyzing(true);
    setFeedback(null);
    try {
      await recorder.stop();
      setIsListening(false);
      const audioUri = recorder.uri;
      if (!audioUri) throw new Error("The recording could not be saved.");

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      const data = await identifyQuranRecording(audioUri);
      if (data.status === "no_match") {
        setResult(null);
        setFeedback(data.message);
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        ).catch(() => {});
        return;
      }
      setResult(data);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    } catch (error: any) {
      setResult(null);
      setFeedback(
        error?.message || "Could not analyze the recording. Please try again.",
      );
    } finally {
      setIsListening(false);
      setIsAnalyzing(false);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      }).catch(() => {});
    }
  };

  const handleRecordingPress = () => {
    if (isListening) {
      void stopAndIdentify();
    } else {
      void startListening();
    }
  };

  const recordingSeconds = Math.max(
    0,
    Math.round(recorderState.durationMillis / 1000),
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceSecondary || "#0B141A" }]} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border || "#222E35" }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Identify Recitation</Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceMuted || "#8696A0" }]}>
            Surah & Ayah matching
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!result && (
          <View style={styles.listenContainer}>
            {/* Pulsating Microphone Button */}
            <View style={styles.pulseWrapper}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isListening ? "rgba(0, 168, 132, 0.2)" : "transparent",
                  },
                ]}
              />
              <Pressable
                onPress={handleRecordingPress}
                disabled={isAnalyzing}
                accessibilityRole="button"
                accessibilityLabel={
                  isListening ? "Stop and identify recitation" : "Start recording recitation"
                }
                style={({ pressed }) => [
                  styles.micCircle,
                  {
                    backgroundColor: isListening
                      ? colors.warning || "#F59E0B"
                      : colors.brand || "#00A884",
                  },
                  pressed && { transform: [{ scale: 0.95 }] },
                ]}
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons
                    name={isListening ? "waveform" : "microphone"}
                    size={48}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            {/* Instruction Text */}
            <Text style={[styles.instructionTitle, { color: colors.onSurface }]}>
              {isListening
                ? "Listening to recitation..."
                : isAnalyzing
                ? "Matching Quran transcript..."
                : "Tap to Identify Recitation"}
            </Text>
            <Text style={[styles.instructionSub, { color: colors.onSurfaceMuted }]}>
              {isListening
                ? `${recordingSeconds}s recorded · tap again to identify`
                : "Record a clear 5–15 second Quran passage"}
            </Text>
            {feedback ? (
              <View
                style={[
                  styles.feedbackCard,
                  {
                    backgroundColor: `${colors.warning || "#F59E0B"}18`,
                    borderColor: `${colors.warning || "#F59E0B"}66`,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color={colors.warning || "#F59E0B"}
                />
                <Text style={[styles.feedbackText, { color: colors.onSurface }]}>
                  {feedback}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {/* Identified Result Card */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Match Confidence Badge */}
            <View style={styles.badgeRow}>
              <View style={styles.confidenceBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#00A884" />
                <Text style={styles.confidenceText}>
                  {Math.round(result.confidence * 100)}% Match Found
                </Text>
              </View>
            </View>

            {/* Reciter availability */}
            <View style={[styles.reciterCard, { backgroundColor: colors.surface || "#111B21", borderColor: colors.border }]}>
              <View style={styles.reciterAvatar}>
                <MaterialCommunityIcons name="account-question" size={32} color="#00A884" />
              </View>
              <View style={styles.reciterDetails}>
                <Text style={[styles.reciterName, { color: colors.onSurface }]}>
                  Reciter voice not identified
                </Text>
                <Text style={[styles.reciterStyle, { color: colors.onSurfaceMuted }]}>
                  Voice identification needs a separate speaker model.
                </Text>
              </View>
            </View>

            {/* Surah & Ayah Details */}
            <View style={[styles.surahCard, { backgroundColor: colors.surface || "#111B21", borderColor: colors.border }]}>
              <View style={styles.surahHeader}>
                <View style={styles.surahNumberBadge}>
                  <Text style={styles.surahNumberText}>{result.surah_number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.surahNameEng, { color: colors.onSurface }]}>
                    {result.surah_name_english}
                  </Text>
                  <Text style={[styles.verseRange, { color: colors.onSurfaceMuted }]}>
                    Verses {result.verse_start} – {result.verse_end}
                  </Text>
                </View>
                <Text style={styles.surahNameAra}>{result.surah_name_arabic}</Text>
              </View>

              {/* Matched Verse Text */}
              <View style={styles.textContainer}>
                <Text style={styles.arabicVerseText}>{result.matched_text_arabic}</Text>
                <Text style={[styles.englishVerseText, { color: colors.onSurfaceMuted }]}>
                  {result.matched_text_english}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.transcriptCard,
                {
                  backgroundColor: colors.surface || "#111B21",
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.transcriptLabel, { color: colors.onSurfaceMuted }]}>
                AI HEARD · {result.processingTimeMs} MS
              </Text>
              <Text style={[styles.transcriptText, { color: colors.onSurface }]}>
                {result.transcript}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  router.push(`/quran/${result.surah_number}` as any);
                }}
                style={[styles.primaryBtn, { backgroundColor: colors.brand || "#00A884" }]}
              >
                <MaterialCommunityIcons name="book-open-variant" size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Read Full Surah</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setResult(null);
                  setFeedback(null);
                }}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={colors.onSurface} />
                <Text style={[styles.secondaryBtnText, { color: colors.onSurface }]}>
                  Identify Another
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: 20,
    alignItems: "center",
  },
  listenContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  pulseWrapper: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  micCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 32,
    textAlign: "center",
  },
  instructionSub: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 20,
  },
  feedbackCard: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  resultContainer: {
    width: "100%",
    gap: 16,
  },
  badgeRow: {
    alignItems: "center",
  },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 168, 132, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    color: "#00A884",
    fontSize: 13,
    fontWeight: "700",
  },
  reciterCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  reciterAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(0, 168, 132, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  reciterDetails: {
    flex: 1,
  },
  reciterName: {
    fontSize: 17,
    fontWeight: "700",
  },
  reciterStyle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },
  surahCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  surahHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  surahNumberBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#00A884",
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumberText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  surahNameEng: {
    fontSize: 16,
    fontWeight: "700",
  },
  verseRange: {
    fontSize: 12,
    marginTop: 2,
  },
  surahNameAra: {
    color: "#00A884",
    fontSize: 20,
    fontWeight: "700",
  },
  textContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 14,
    gap: 10,
  },
  arabicVerseText: {
    color: "#00A884",
    fontSize: 22,
    lineHeight: 38,
    textAlign: "right",
    fontFamily: Platform.OS === "ios" ? "Amiri" : "sans-serif",
  },
  englishVerseText: {
    fontSize: 14,
    lineHeight: 22,
  },
  transcriptCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "right",
  },
  actionButtons: {
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 25,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
