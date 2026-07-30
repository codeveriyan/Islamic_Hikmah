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
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
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
  identifyQuranText,
  IdentifiedRecitationResult,
} from "@/src/services/quranIdentifierService";

// ─── Types ────────────────────────────────────────────────────────────────────
type ScreenMode = "listen" | "scan";
type ScanStep = "entry" | "preview" | "result";
type FeedbackType = "warning" | "error" | "ocr_empty";

const MIN_RECORDING_MILLIS = 2500;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IdentifyQuranScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // ── Mode toggle ─────────────────────────────────────────────────────────────
  const [screenMode, setScreenMode] = useState<ScreenMode>("listen");

  // ── Audio (Listen) mode state ────────────────────────────────────────────────
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Scan mode state ──────────────────────────────────────────────────────────
  const [scanStep, setScanStep] = useState<ScanStep>("entry");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedMime, setCapturedMime] = useState<string>("image/jpeg");
  const [extractedText, setExtractedText] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanLoading, setIsScanLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // ── Shared result / feedback ─────────────────────────────────────────────────
  const [result, setResult] = useState<IdentifiedRecitationResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("warning");

  // ─── Pulse animation for mic ──────────────────────────────────────────────
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

  // ─── Mode switch — reset both modes ──────────────────────────────────────────
  const switchMode = (mode: ScreenMode) => {
    if (screenMode === mode) return;
    setScreenMode(mode);
    setResult(null);
    setFeedback(null);
    setScanStep("entry");
    setCapturedImageUri(null);
    setExtractedText("");
    setPasteText("");
    setIsCameraOpen(false);
  };

  // ─── LISTEN MODE handlers ─────────────────────────────────────────────────
  const startListening = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone permission needed",
          "Allow microphone access to identify a Quran recitation."
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
      Alert.alert("Could not start recording", error?.message || "Please try again.");
    }
  };

  const stopAndIdentify = async () => {
    if (recorderState.durationMillis < MIN_RECORDING_MILLIS) {
      setFeedback("Keep reciting for at least 3 seconds, then tap again.");
      setFeedbackType("warning");
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
      if (data.status === "success") {
        setResult(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return;
      }
      if (data.status === "no_match") {
        setResult(null);
        setFeedback(data.message);
        setFeedbackType("warning");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        return;
      }
      setResult(null);
      setFeedback("The recitation could not be identified.");
      setFeedbackType("error");
    } catch (error: any) {
      setResult(null);
      setFeedback(error?.message || "Could not analyze the recording. Please try again.");
      setFeedbackType("error");
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
    if (isListening) void stopAndIdentify();
    else void startListening();
  };

  const recordingSeconds = Math.max(0, Math.round(recorderState.durationMillis / 1000));

  // ─── SCAN MODE handlers ───────────────────────────────────────────────────
  const openCamera = async () => {
    const perm = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!perm?.granted) {
      Alert.alert("Camera permission needed", "Allow camera access to scan Arabic text.");
      return;
    }
    setIsCameraOpen(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) return;
      setIsCameraOpen(false);
      await processImageUri(photo.uri, "image/jpeg");
    } catch {
      setIsCameraOpen(false);
      Alert.alert("Capture failed", "Could not take a photo. Please try again.");
    }
  };

  const openGallery = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert("Gallery permission needed", "Allow photo library access to pick an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType || "image/jpeg";
    await processImageUri(asset.uri, mime);
  };

  const processImageUri = async (uri: string, mime: string) => {
    setCapturedImageUri(uri);
    setCapturedMime(mime);
    setIsScanLoading(true);
    setFeedback(null);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const data = await identifyQuranText({ image_b64: base64, mime });

      if (data.status === "ocr_failed") {
        setFeedback(data.message || "Could not read the image. Check your connection and try again.");
        setFeedbackType("error");
        setScanStep("entry");
        return;
      }
      if (data.status === "ocr_empty") {
        setFeedback(data.message || "No Arabic text was detected. Try better lighting or a clearer photo.");
        setFeedbackType("ocr_empty");
        setScanStep("entry");
        return;
      }
      if (data.status === "no_match") {
        // OCR worked — show extracted text in preview so user can edit before retrying
        if ((data as any).extracted_text) {
          setExtractedText((data as any).extracted_text);
          setFeedback("No Quran verse matched. You can edit the text below and try again, or paste directly.");
          setFeedbackType("warning");
          setScanStep("preview");
        } else {
          setFeedback(data.message);
          setFeedbackType("warning");
          setScanStep("entry");
        }
        return;
      }
      if (data.status === "success") {
        setResult(data);
        setScanStep("result");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return;
      }
      setFeedback("The text could not be identified.");
      setFeedbackType("error");
    } catch (error: any) {
      setFeedback(error?.message || "An unexpected error occurred. Please try again.");
      setFeedbackType("error");
      setScanStep("entry");
    } finally {
      setIsScanLoading(false);
    }
  };

  const matchExtractedText = async (text: string) => {
    if (!text.trim()) {
      Alert.alert("No text", "Please enter or paste some Arabic text first.");
      return;
    }
    setIsScanLoading(true);
    setFeedback(null);
    try {
      const data = await identifyQuranText({ arabic_text: text.trim() });
      if (data.status === "success") {
        setResult(data);
        setScanStep("result");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        return;
      }
      if (data.status === "no_match") {
        setFeedback(data.message);
        setFeedbackType("warning");
        return;
      }
      if (data.status === "ocr_failed" || data.status === "ocr_empty") {
        setFeedback(data.message || "Something went wrong. Please try again.");
        setFeedbackType("error");
        return;
      }
    } catch (error: any) {
      setFeedback(error?.message || "Could not match the text. Please try again.");
      setFeedbackType("error");
    } finally {
      setIsScanLoading(false);
    }
  };

  const resetScan = () => {
    setScanStep("entry");
    setCapturedImageUri(null);
    setExtractedText("");
    setPasteText("");
    setResult(null);
    setFeedback(null);
  };

  // ─── Feedback icon & colour ───────────────────────────────────────────────
  const feedbackMeta = {
    warning: { icon: "information-outline" as const, color: colors.warning || "#F59E0B" },
    error: { icon: "alert-circle-outline" as const, color: "#DC2626" },
    ocr_empty: { icon: "image-off-outline" as const, color: colors.warning || "#F59E0B" },
  }[feedbackType];

  // ─── CAMERA VIEW ──────────────────────────────────────────────────────────
  if (isCameraOpen) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
          <SafeAreaView style={styles.cameraOverlay} edges={["top", "bottom"]}>
            <Pressable
              onPress={() => setIsCameraOpen(false)}
              style={styles.cameraCloseBtn}
              hitSlop={12}
            >
              <MaterialCommunityIcons name="close" size={26} color="#FFF" />
            </Pressable>
            <View style={styles.cameraFrameHint}>
              <View style={styles.cameraFrame} />
              <Text style={styles.cameraHintText}>Frame the Arabic text clearly</Text>
            </View>
            <Pressable onPress={capturePhoto} style={styles.shutterBtn}>
              <View style={styles.shutterInner} />
            </Pressable>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ─── MAIN SCREEN ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.surfaceSecondary || "#0B141A" }]}
      edges={["top", "bottom"]}
    >
      {/* ── Header ── */}
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

      {/* ── Mode toggle pill ── */}
      <View style={[styles.toggleRow, { borderBottomColor: colors.border || "#222E35" }]}>
        <View style={[styles.togglePill, { backgroundColor: colors.surface || "#111B21" }]}>
          <Pressable
            onPress={() => switchMode("listen")}
            style={[
              styles.toggleOption,
              screenMode === "listen" && styles.toggleOptionActive,
              screenMode === "listen" && { backgroundColor: colors.brand || "#00A884" },
            ]}
          >
            <MaterialCommunityIcons
              name="microphone"
              size={15}
              color={screenMode === "listen" ? "#FFF" : colors.onSurfaceMuted || "#8696A0"}
            />
            <Text
              style={[
                styles.toggleLabel,
                { color: screenMode === "listen" ? "#FFF" : colors.onSurfaceMuted || "#8696A0" },
              ]}
            >
              Listen
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode("scan")}
            style={[
              styles.toggleOption,
              screenMode === "scan" && styles.toggleOptionActive,
              screenMode === "scan" && { backgroundColor: colors.brand || "#00A884" },
            ]}
          >
            <MaterialCommunityIcons
              name="text-recognition"
              size={15}
              color={screenMode === "scan" ? "#FFF" : colors.onSurfaceMuted || "#8696A0"}
            />
            <Text
              style={[
                styles.toggleLabel,
                { color: screenMode === "scan" ? "#FFF" : colors.onSurfaceMuted || "#8696A0" },
              ]}
            >
              Scan Text
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ════════════════════════════════════════════════════════
            LISTEN MODE
        ════════════════════════════════════════════════════════ */}
        {screenMode === "listen" && !result && (
          <View style={styles.listenContainer}>
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
                accessibilityLabel={isListening ? "Stop and identify recitation" : "Start recording recitation"}
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
            {feedback && <FeedbackCard message={feedback} icon={feedbackMeta.icon} color={feedbackMeta.color} />}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════
            SCAN MODE — ENTRY
        ════════════════════════════════════════════════════════ */}
        {screenMode === "scan" && scanStep === "entry" && (
          <View style={styles.scanEntryContainer}>
            <Text style={[styles.scanTitle, { color: colors.onSurface }]}>Scan Arabic Text</Text>
            <Text style={[styles.scanSubtitle, { color: colors.onSurfaceMuted }]}>
              Identify any Quran verse from a photo, image, or by typing
            </Text>

            {isScanLoading && (
              <View style={styles.loadingBlock}>
                <ActivityIndicator size="large" color={colors.brand || "#00A884"} />
                <Text style={[styles.loadingText, { color: colors.onSurfaceMuted }]}>
                  Reading Arabic text…
                </Text>
              </View>
            )}

            {!isScanLoading && (
              <>
                {/* Camera */}
                <Pressable
                  onPress={openCamera}
                  style={({ pressed }) => [
                    styles.scanOptionCard,
                    { backgroundColor: colors.surface || "#111B21", borderColor: colors.border || "#222E35" },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={[styles.scanOptionIcon, { backgroundColor: "rgba(0,168,132,0.12)" }]}>
                    <MaterialCommunityIcons name="camera" size={26} color={colors.brand || "#00A884"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scanOptionTitle, { color: colors.onSurface }]}>Camera</Text>
                    <Text style={[styles.scanOptionSub, { color: colors.onSurfaceMuted }]}>
                      Take a photo of a Quran page, dua card, or book
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                </Pressable>

                {/* Gallery */}
                <Pressable
                  onPress={openGallery}
                  style={({ pressed }) => [
                    styles.scanOptionCard,
                    { backgroundColor: colors.surface || "#111B21", borderColor: colors.border || "#222E35" },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <View style={[styles.scanOptionIcon, { backgroundColor: "rgba(99,102,241,0.12)" }]}>
                    <MaterialCommunityIcons name="image" size={26} color="#6366F1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scanOptionTitle, { color: colors.onSurface }]}>Gallery</Text>
                    <Text style={[styles.scanOptionSub, { color: colors.onSurfaceMuted }]}>
                      Pick an existing photo from your library
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceMuted} />
                </Pressable>

                {/* Paste / Type */}
                <View
                  style={[
                    styles.scanOptionCard,
                    styles.pasteCard,
                    { backgroundColor: colors.surface || "#111B21", borderColor: colors.border || "#222E35" },
                  ]}
                >
                  <View style={[styles.scanOptionIcon, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
                    <MaterialCommunityIcons name="pencil" size={26} color={colors.warning || "#F59E0B"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.scanOptionTitle, { color: colors.onSurface }]}>Paste Arabic</Text>
                    <TextInput
                      value={pasteText}
                      onChangeText={setPasteText}
                      placeholder="اكتب أو الصق النص العربي هنا"
                      placeholderTextColor={colors.onSurfaceMuted || "#8696A0"}
                      multiline
                      style={[styles.pasteInput, { color: colors.onSurface }]}
                      textAlign="right"
                    />
                    <Pressable
                      onPress={() => matchExtractedText(pasteText)}
                      style={[styles.matchBtn, { backgroundColor: colors.brand || "#00A884" }]}
                    >
                      <MaterialCommunityIcons name="magnify" size={16} color="#FFF" />
                      <Text style={styles.matchBtnText}>Match in Quran</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}

            {feedback && !isScanLoading && (
              <FeedbackCard message={feedback} icon={feedbackMeta.icon} color={feedbackMeta.color} />
            )}
          </View>
        )}

        {/* ════════════════════════════════════════════════════════
            SCAN MODE — OCR PREVIEW (editable before matching)
        ════════════════════════════════════════════════════════ */}
        {screenMode === "scan" && scanStep === "preview" && (
          <View style={styles.previewContainer}>
            {capturedImageUri && (
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <Text style={[styles.previewLabel, { color: colors.onSurfaceMuted }]}>
              EXTRACTED ARABIC TEXT · EDIT IF NEEDED
            </Text>
            <TextInput
              value={extractedText}
              onChangeText={setExtractedText}
              multiline
              style={[
                styles.extractedInput,
                {
                  color: colors.onSurface,
                  backgroundColor: colors.surface || "#111B21",
                  borderColor: colors.border || "#222E35",
                },
              ]}
              textAlign="right"
            />
            {feedback && (
              <FeedbackCard message={feedback} icon={feedbackMeta.icon} color={feedbackMeta.color} />
            )}
            <View style={styles.previewActions}>
              <Pressable
                onPress={() => matchExtractedText(extractedText)}
                disabled={isScanLoading}
                style={[styles.primaryBtn, { backgroundColor: colors.brand || "#00A884" }]}
              >
                {isScanLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="magnify" size={20} color="#FFF" />
                    <Text style={styles.primaryBtnText}>Match in Quran</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={resetScan}
                style={[styles.secondaryBtn, { borderColor: colors.border || "#222E35" }]}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
                <Text style={[styles.secondaryBtnText, { color: colors.onSurface }]}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ════════════════════════════════════════════════════════
            SHARED RESULT CARD (both modes)
        ════════════════════════════════════════════════════════ */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Match badge */}
            <View style={styles.badgeRow}>
              <View style={styles.confidenceBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#00A884" />
                <Text style={styles.confidenceText}>
                  {Math.round(result.confidence * 100)}% Match Found
                </Text>
              </View>
            </View>

            {/* Source badge — only show for Listen mode (has reciter card) */}
            {screenMode === "listen" && (
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
            )}

            {/* Scan source badge */}
            {screenMode === "scan" && (
              <View style={[styles.sourceBadgeCard, { backgroundColor: colors.surface || "#111B21", borderColor: colors.border }]}>
                <MaterialCommunityIcons name="text-recognition" size={20} color={colors.brand || "#00A884"} />
                <Text style={[styles.sourceBadgeText, { color: colors.onSurfaceMuted }]}>
                  Identified from scanned Arabic text
                </Text>
              </View>
            )}

            {/* Surah & Ayah */}
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
              <View style={styles.textContainer}>
                <Text style={styles.arabicVerseText}>{result.matched_text_arabic}</Text>
                <Text style={[styles.englishVerseText, { color: colors.onSurfaceMuted }]}>
                  {result.matched_text_english}
                </Text>
              </View>
            </View>

            {/* Transcript / source text */}
            <View style={[styles.transcriptCard, { backgroundColor: colors.surface || "#111B21", borderColor: colors.border }]}>
              <Text style={[styles.transcriptLabel, { color: colors.onSurfaceMuted }]}>
                {screenMode === "listen"
                  ? `AI HEARD · ${result.processingTimeMs} MS`
                  : "TEXT MATCHED"}
              </Text>
              <Text style={[styles.transcriptText, { color: colors.onSurface }]}>
                {result.transcript}
              </Text>
            </View>

            {/* Actions */}
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
                  if (screenMode === "scan") resetScan();
                }}
                style={[styles.secondaryBtn, { borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="refresh" size={20} color={colors.onSurface} />
                <Text style={[styles.secondaryBtnText, { color: colors.onSurface }]}>
                  {screenMode === "listen" ? "Identify Another" : "Scan Again"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared feedback card ─────────────────────────────────────────────────────
function FeedbackCard({
  message,
  icon,
  color,
}: {
  message: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}) {
  return (
    <View
      style={[
        styles.feedbackCard,
        { backgroundColor: `${color}18`, borderColor: `${color}66` },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={20} color={color} />
      <Text style={[styles.feedbackText, { color: "#E2E8F0" }]}>{message}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  // Header
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
  headerTitleContainer: { alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  headerSubtitle: { fontSize: 12, marginTop: 2 },

  // Mode toggle
  toggleRow: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  togglePill: {
    flexDirection: "row",
    borderRadius: 24,
    padding: 3,
    gap: 2,
  },
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 21,
  },
  toggleOptionActive: {},
  toggleLabel: { fontSize: 13, fontWeight: "700" },

  // Scroll
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 40 },

  // Listen mode
  listenContainer: { alignItems: "center", marginTop: 32 },
  pulseWrapper: { width: 180, height: 180, alignItems: "center", justifyContent: "center", position: "relative" },
  pulseRing: { position: "absolute", width: 180, height: 180, borderRadius: 90 },
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
  instructionTitle: { fontSize: 20, fontWeight: "700", marginTop: 32, textAlign: "center" },
  instructionSub: { fontSize: 14, marginTop: 8, textAlign: "center", maxWidth: 280, lineHeight: 20 },

  // Feedback
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
  feedbackText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Scan entry
  scanEntryContainer: { width: "100%", gap: 14, marginTop: 8 },
  scanTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  scanSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  scanOptionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  scanOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scanOptionTitle: { fontSize: 15, fontWeight: "700" },
  scanOptionSub: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  pasteCard: { flexDirection: "column", alignItems: "flex-start" },
  pasteInput: {
    width: "100%",
    minHeight: 80,
    fontSize: 17,
    lineHeight: 28,
    marginTop: 10,
    paddingVertical: 4,
  },
  matchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 16,
    marginTop: 10,
    alignSelf: "flex-end",
  },
  matchBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  loadingBlock: { alignItems: "center", paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: 14 },

  // Camera
  cameraOverlay: { flex: 1, justifyContent: "space-between", padding: 20 },
  cameraCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraFrameHint: { alignItems: "center", gap: 12 },
  cameraFrame: {
    width: 260,
    height: 180,
    borderWidth: 2,
    borderColor: "rgba(0,168,132,0.8)",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  cameraHintText: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 3,
    borderColor: "#FFF",
  },
  shutterInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#FFF" },

  // OCR Preview
  previewContainer: { width: "100%", gap: 14 },
  previewImage: { width: "100%", height: 180, borderRadius: 14 },
  previewLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  extractedInput: {
    width: "100%",
    minHeight: 100,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 18,
    lineHeight: 30,
  },
  previewActions: { gap: 12, marginTop: 4 },

  // Shared result
  resultContainer: { width: "100%", gap: 16 },
  badgeRow: { alignItems: "center" },
  confidenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 168, 132, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: { color: "#00A884", fontSize: 13, fontWeight: "700" },
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
  reciterDetails: { flex: 1 },
  reciterName: { fontSize: 17, fontWeight: "700" },
  reciterStyle: { fontSize: 13, fontWeight: "600", marginTop: 3 },
  sourceBadgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sourceBadgeText: { fontSize: 13 },
  surahCard: { padding: 18, borderRadius: 16, borderWidth: 1, gap: 16 },
  surahHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  surahNumberBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#00A884",
    alignItems: "center",
    justifyContent: "center",
  },
  surahNumberText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  surahNameEng: { fontSize: 16, fontWeight: "700" },
  verseRange: { fontSize: 12, marginTop: 2 },
  surahNameAra: { color: "#00A884", fontSize: 20, fontWeight: "700" },
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
  englishVerseText: { fontSize: 14, lineHeight: 22 },
  transcriptCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  transcriptLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  transcriptText: { fontSize: 16, lineHeight: 26, textAlign: "right" },
  actionButtons: { gap: 12, marginTop: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 25,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600" },
});
