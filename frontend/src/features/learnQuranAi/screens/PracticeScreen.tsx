import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { useTheme } from "@/src/ThemeContext";
import quranData from "@/src/data/quran/quranData.json";

import { scoreRecitation } from "../api";
import { AiScreen, PrototypeNotice, SectionHeading } from "../components";
import { saveAttempt } from "../storage";
import type { ScoreResponse, WordResult, WordStatus } from "../types";

type LocalAyah = {
  numberInSurah: number;
  arabic: string;
  translation: string;
  transliteration: string;
};

const FATIHA_AYAHS = ((quranData as any[])[0]?.ayahs ?? []) as LocalAyah[];

const STATUS_META: Record<WordStatus, { label: string; color: string; icon: string }> = {
  correct: { label: "Matched", color: "#10B981", icon: "check-circle" },
  minor_issue: { label: "Review", color: "#F59E0B", icon: "alert-circle" },
  incorrect: { label: "Try again", color: "#EF4444", icon: "close-circle" },
};

function getQariAudioUrl(ayahNumber: number): string {
  const ayahFile = `001${String(ayahNumber).padStart(3, "0")}`;
  return `https://everyayah.com/data/Alafasy_128kbps/${ayahFile}.mp3`;
}

export default function PracticeScreen() {
  const { colors } = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const qariPlayer = useAudioPlayer(null);
  const qariStatus = useAudioPlayerStatus(qariPlayer);
  const learnerPlayer = useAudioPlayer(null);
  const learnerStatus = useAudioPlayerStatus(learnerPlayer);
  const [ayahNumber, setAyahNumber] = useState(1);
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringUnavailable, setScoringUnavailable] = useState<string | null>(null);
  const ayah = FATIHA_AYAHS.find((item) => item.numberInSurah === ayahNumber) ?? FATIHA_AYAHS[0];
  const expectedWords = useMemo(() => ayah?.arabic.trim().split(/\s+/) ?? [], [ayah]);

  const startRecording = async () => {
    try {
      qariPlayer.pause();
      learnerPlayer.pause();
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone permission needed", "Allow microphone access to record your recitation.");
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
      setRecordingUri(null);
      setScoringUnavailable(null);
    } catch (error: any) {
      Alert.alert("Could not start recording", error?.message || "Please try again.");
    }
  };

  const stopAndScore = async () => {
    try {
      setIsScoring(true);
      await recorder.stop();
      const audioUri = recorder.uri;
      if (!audioUri || !ayah) throw new Error("The recording could not be saved.");
      setRecordingUri(audioUri);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      const response = await scoreRecitation({
        audioUri,
        surahId: 1,
        ayahId: ayah.numberInSurah,
        expectedText: ayah.arabic,
        wordIndex: selectedWordIndex ?? undefined,
      });
      setResult(response);
      await saveAttempt({
        ...response,
        createdAt: Date.now(),
        practiceMode: selectedWordIndex == null ? "ayah" : "word",
      });
    } catch (error: any) {
      setResult(null);
      setScoringUnavailable(
        error?.message || "AI scoring is unavailable. No score was generated.",
      );
    } finally {
      setIsScoring(false);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      }).catch(() => {});
    }
  };

  const playQariRecitation = async () => {
    try {
      learnerPlayer.pause();
      if (qariStatus.playing) {
        qariPlayer.pause();
        return;
      }
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      qariPlayer.replace({ uri: getQariAudioUrl(ayahNumber) });
      qariPlayer.play();
    } catch (error: any) {
      Alert.alert("Qari audio unavailable", error?.message || "Please check your internet connection.");
    }
  };

  const playLearnerRecording = async () => {
    if (!recordingUri) return;
    try {
      qariPlayer.pause();
      if (learnerStatus.playing) {
        learnerPlayer.pause();
        return;
      }
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: "duckOthers",
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });
      learnerPlayer.replace({ uri: recordingUri });
      learnerPlayer.play();
    } catch (error: any) {
      Alert.alert("Recording playback unavailable", error?.message || "Please record the ayah again.");
    }
  };

  const switchAyah = (nextAyah: number) => {
    if (recorderState.isRecording) return;
    qariPlayer.pause();
    learnerPlayer.pause();
    setAyahNumber(nextAyah);
    setResult(null);
    setRecordingUri(null);
    setScoringUnavailable(null);
    setSelectedWordIndex(null);
  };

  const durationSeconds = Math.round((recorderState.durationMillis ?? 0) / 1000);

  return (
    <AiScreen title="AI Recitation Coach" subtitle="Al-Fatihah pilot">
      <PrototypeNotice text="Quran-trained speech recognition compares the words it hears with Al-Fatihah. This is word matching only—not Tajweed, makhraj, or vowel assessment." />

      <SectionHeading>Choose an ayah</SectionHeading>
      <View style={styles.ayahPicker}>
        {FATIHA_AYAHS.map((item) => (
          <Pressable
            key={item.numberInSurah}
            onPress={() => switchAyah(item.numberInSurah)}
            style={[
              styles.ayahChip,
              {
                backgroundColor: item.numberInSurah === ayahNumber ? colors.brand : colors.surfaceSecondary,
                borderColor: item.numberInSurah === ayahNumber ? colors.brand : colors.border,
              },
            ]}
          >
            <Text style={{
              color: item.numberInSurah === ayahNumber ? colors.onBrandPrimary : colors.onSurface,
              fontWeight: "900",
            }}>
              {item.numberInSurah}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.ayahCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
        <Text style={[styles.surahLabel, { color: colors.brand }]}>AL-FATIHAH · AYAH {ayahNumber}</Text>
        <View style={styles.words}>
          {expectedWords.map((word, index) => {
            const scoredWord = result?.wordResults.find((item) => item.wordIndex === index);
            const meta = scoredWord ? STATUS_META[scoredWord.status] : null;
            const selected = selectedWordIndex === index;
            return (
              <Pressable
                key={`${word}-${index}`}
                onPress={() => setSelectedWordIndex(selected ? null : index)}
                style={[
                  styles.word,
                  {
                    backgroundColor: meta ? `${meta.color}20` : selected ? `${colors.brand}20` : colors.surfaceTertiary,
                    borderColor: meta?.color || (selected ? colors.brand : "transparent"),
                  },
                ]}
              >
                <Text style={[styles.wordText, { color: meta?.color || colors.onSurface }]}>{word}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.translation, { color: colors.onSurfaceSecondary }]}>{ayah.translation}</Text>
        <Text style={[styles.transliteration, { color: colors.onSurfaceMuted }]}>{ayah.transliteration}</Text>
      </View>

      <View style={[styles.listenCard, { backgroundColor: `${colors.brand}10`, borderColor: `${colors.brand}45` }]}>
        <View style={[styles.stepBadge, { backgroundColor: colors.brand }]}>
          <Text style={[styles.stepBadgeText, { color: colors.onBrandPrimary }]}>1</Text>
        </View>
        <View style={styles.listenCopy}>
          <Text style={[styles.listenTitle, { color: colors.onSurface }]}>Listen to the Qari first</Text>
          <Text style={[styles.listenSubtitle, { color: colors.onSurfaceMuted }]}>
            Mishary Rashid Alafasy · selected ayah
          </Text>
        </View>
        <Pressable
          disabled={recorderState.isRecording || isScoring}
          onPress={playQariRecitation}
          style={[styles.audioButton, { backgroundColor: colors.brand }]}
        >
          <MaterialCommunityIcons
            name={qariStatus.playing ? "pause" : "play"}
            size={22}
            color={colors.onBrandPrimary}
          />
          <Text style={[styles.audioButtonText, { color: colors.onBrandPrimary }]}>
            {qariStatus.playing ? "Pause" : "Listen"}
          </Text>
        </Pressable>
      </View>

      {selectedWordIndex != null ? (
        <View style={[styles.focusCard, { backgroundColor: `${colors.brand}15`, borderColor: `${colors.brand}55` }]}>
          <MaterialCommunityIcons name="target" size={21} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.focusLabel, { color: colors.brand }]}>FOCUSED WORD RETRY</Text>
            <Text style={[styles.focusWord, { color: colors.onSurface }]}>
              {expectedWords[selectedWordIndex]}
            </Text>
          </View>
          <Pressable onPress={() => setSelectedWordIndex(null)}>
            <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceMuted} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.recorderArea}>
        <View style={[styles.stepBadge, { backgroundColor: colors.brand }]}>
          <Text style={[styles.stepBadgeText, { color: colors.onBrandPrimary }]}>2</Text>
        </View>
        <Pressable
          disabled={isScoring}
          onPress={recorderState.isRecording ? stopAndScore : startRecording}
          style={[
            styles.recordButton,
            {
              backgroundColor: recorderState.isRecording ? colors.error : colors.brand,
              opacity: isScoring ? 0.6 : 1,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={recorderState.isRecording ? "stop" : "microphone"}
            size={32}
            color={colors.onBrandPrimary}
          />
        </Pressable>
        <Text style={[styles.recordTitle, { color: colors.onSurface }]}>
          {isScoring
            ? "Preparing feedback…"
            : recorderState.isRecording
              ? `Recording ${durationSeconds}s · tap to stop`
              : selectedWordIndex == null
                ? "Record the complete ayah"
                : "Record the selected word"}
        </Text>
        <Text style={[styles.recordHint, { color: colors.onSurfaceMuted }]}>
          Keep attempts under 30 seconds. The backend processes the recording in memory and does not retain the audio.
        </Text>
      </View>

      {recordingUri ? (
        <View style={[styles.recordingCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <View style={[styles.recordingIcon, { backgroundColor: `${colors.brand}18` }]}>
            <MaterialCommunityIcons name="waveform" size={24} color={colors.brand} />
          </View>
          <View style={styles.listenCopy}>
            <Text style={[styles.listenTitle, { color: colors.onSurface }]}>Your recorded recitation</Text>
            <Text style={[styles.listenSubtitle, { color: colors.onSurfaceMuted }]}>
              {isScoring ? "Saved · AI comparison is processing" : "Saved on this device for this attempt"}
            </Text>
          </View>
          <Pressable
            onPress={playLearnerRecording}
            style={[styles.audioButton, { backgroundColor: colors.surfaceTertiary, borderColor: colors.border, borderWidth: 1 }]}
          >
            <MaterialCommunityIcons
              name={learnerStatus.playing ? "pause" : "play"}
              size={22}
              color={colors.brand}
            />
            <Text style={[styles.audioButtonText, { color: colors.brand }]}>
              {learnerStatus.playing ? "Pause" : "Play mine"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {scoringUnavailable ? (
        <View style={[styles.unavailableCard, { backgroundColor: `${colors.warning}16`, borderColor: `${colors.warning}55` }]}>
          <MaterialCommunityIcons name="shield-alert-outline" size={24} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.unavailableTitle, { color: colors.onSurface }]}>No score generated</Text>
            <Text style={[styles.unavailableText, { color: colors.onSurfaceMuted }]}>
              {scoringUnavailable}
            </Text>
          </View>
        </View>
      ) : null}

      {result ? (
        <>
          <View style={[styles.comparisonCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.comparisonHeader}>
              <View style={[styles.stepBadge, { backgroundColor: colors.brand }]}>
                <Text style={[styles.stepBadgeText, { color: colors.onBrandPrimary }]}>3</Text>
              </View>
              <View style={styles.listenCopy}>
                <Text style={[styles.comparisonTitle, { color: colors.onSurface }]}>Listen and compare</Text>
                <Text style={[styles.listenSubtitle, { color: colors.onSurfaceMuted }]}>
                  Alternate between the Qari and your recording, then review what the Quran ASR heard.
                </Text>
              </View>
            </View>
            <View style={styles.comparisonAudioRow}>
              <Pressable
                onPress={playQariRecitation}
                style={[styles.comparisonAudioButton, { backgroundColor: `${colors.brand}16`, borderColor: `${colors.brand}55` }]}
              >
                <MaterialCommunityIcons name={qariStatus.playing ? "pause-circle" : "play-circle"} size={25} color={colors.brand} />
                <View>
                  <Text style={[styles.comparisonAudioLabel, { color: colors.onSurface }]}>Qari reference</Text>
                  <Text style={[styles.comparisonAudioHint, { color: colors.onSurfaceMuted }]}>Alafasy</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={playLearnerRecording}
                style={[styles.comparisonAudioButton, { backgroundColor: `${colors.brandSecondary}12`, borderColor: `${colors.brandSecondary}55` }]}
              >
                <MaterialCommunityIcons name={learnerStatus.playing ? "pause-circle" : "play-circle"} size={25} color={colors.brandSecondary} />
                <View>
                  <Text style={[styles.comparisonAudioLabel, { color: colors.onSurface }]}>Your recitation</Text>
                  <Text style={[styles.comparisonAudioHint, { color: colors.onSurfaceMuted }]}>This attempt</Text>
                </View>
              </Pressable>
            </View>
            <Text style={[styles.comparisonLimit, { color: colors.onSurfaceMuted }]}>
              The current AI compares recognized words. It cannot yet measure letter articulation, vowel length, makhraj, or Tajweed acoustics.
            </Text>
          </View>

          <View style={[styles.scoreCard, { backgroundColor: colors.surfaceSecondary }]}>
            <View>
              <Text style={[styles.scoreLabel, { color: colors.onSurfaceMuted }]}>AI WORD MATCH</Text>
              <Text style={[styles.scoreValue, { color: colors.brand }]}>{result.overallScore}%</Text>
            </View>
            <View style={[styles.modelBadge, { backgroundColor: `${colors.brand}1F` }]}>
              <Text style={[styles.modelText, { color: colors.brand }]}>QURAN ASR</Text>
            </View>
          </View>
          {result.transcript ? (
            <View style={[styles.transcriptCard, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={[styles.transcriptLabel, { color: colors.onSurfaceMuted }]}>AI HEARD</Text>
              <Text style={[styles.transcriptText, { color: colors.onSurface }]}>{result.transcript}</Text>
              {result.processingTimeMs != null ? (
                <Text style={[styles.transcriptMeta, { color: colors.onSurfaceMuted }]}>
                  Processed in {(result.processingTimeMs / 1000).toFixed(1)}s
                </Text>
              ) : null}
            </View>
          ) : null}
          <View style={styles.legend}>
            {(Object.entries(STATUS_META) as [WordStatus, typeof STATUS_META.correct][]).map(([status, meta]) => (
              <View key={status} style={styles.legendItem}>
                <MaterialCommunityIcons name={meta.icon as any} size={17} color={meta.color} />
                <Text style={[styles.legendText, { color: colors.onSurfaceMuted }]}>{meta.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.disclaimer, { color: colors.onSurfaceMuted }]}>{result.disclaimer}</Text>
          {result.wordResults.map((word: WordResult) => {
            const meta = STATUS_META[word.status];
            return (
              <Pressable
                key={`${word.wordIndex}-${word.expectedText}`}
                onPress={() => setSelectedWordIndex(word.wordIndex)}
                style={[styles.resultRow, { backgroundColor: colors.surfaceSecondary, borderColor: `${meta.color}55` }]}
              >
                <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
                <View style={styles.wordComparison}>
                  <Text style={[styles.resultArabic, { color: colors.onSurface }]}>{word.expectedText}</Text>
                  <Text style={[styles.heardWord, { color: colors.onSurfaceMuted }]}>
                    AI heard: {word.heardText || "No matching word"}
                  </Text>
                </View>
                <Text style={[styles.resultStatus, { color: meta.color }]}>{meta.label}</Text>
                <MaterialCommunityIcons name="replay" size={19} color={colors.onSurfaceMuted} />
              </Pressable>
            );
          })}
        </>
      ) : null}
    </AiScreen>
  );
}

const styles = StyleSheet.create({
  ayahPicker: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ayahChip: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  ayahCard: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 13 },
  surahLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  words: { flexDirection: "row-reverse", flexWrap: "wrap", justifyContent: "center", gap: 7 },
  word: { borderRadius: 11, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  wordText: { fontFamily: "ScheherazadeNew", fontSize: 26, lineHeight: 38 },
  translation: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  transliteration: { fontSize: 11, lineHeight: 17, textAlign: "center", fontStyle: "italic" },
  listenCard: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepBadgeText: { fontSize: 12, fontWeight: "900" },
  listenCopy: { flex: 1, gap: 2 },
  listenTitle: { fontSize: 13, fontWeight: "900" },
  listenSubtitle: { fontSize: 10, lineHeight: 14 },
  audioButton: { minHeight: 38, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  audioButtonText: { fontSize: 10, fontWeight: "900" },
  focusCard: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  focusLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  focusWord: { fontFamily: "ScheherazadeNew", fontSize: 22, marginTop: 2 },
  recorderArea: { alignItems: "center", paddingVertical: 12, gap: 7 },
  recordButton: { width: 78, height: 78, borderRadius: 39, alignItems: "center", justifyContent: "center", elevation: 4 },
  recordTitle: { fontSize: 14, fontWeight: "800", marginTop: 5 },
  recordHint: { fontSize: 10, lineHeight: 15, textAlign: "center", maxWidth: 300 },
  recordingCard: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  recordingIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  comparisonCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  comparisonHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  comparisonTitle: { fontSize: 15, fontWeight: "900" },
  comparisonAudioRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  comparisonAudioButton: { flex: 1, minWidth: 135, borderWidth: 1, borderRadius: 13, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  comparisonAudioLabel: { fontSize: 11, fontWeight: "900" },
  comparisonAudioHint: { fontSize: 9, marginTop: 1 },
  comparisonLimit: { fontSize: 9, lineHeight: 14 },
  scoreCard: { borderRadius: 18, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  scoreValue: { fontSize: 32, fontWeight: "900", marginTop: 3 },
  modelBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  modelText: { fontSize: 9, fontWeight: "900" },
  transcriptCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 4 },
  transcriptLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },
  transcriptText: { fontFamily: "ScheherazadeNew", fontSize: 22, lineHeight: 34, textAlign: "right" },
  transcriptMeta: { fontSize: 9 },
  legend: { flexDirection: "row", justifyContent: "space-around", flexWrap: "wrap", gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 10, fontWeight: "700" },
  disclaimer: { fontSize: 10, lineHeight: 15 },
  unavailableCard: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  unavailableTitle: { fontSize: 14, fontWeight: "900" },
  unavailableText: { fontSize: 11, lineHeight: 17, marginTop: 3 },
  resultRow: { borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 9 },
  wordComparison: { flex: 1 },
  resultArabic: { fontFamily: "ScheherazadeNew", fontSize: 22 },
  heardWord: { fontSize: 9, lineHeight: 13 },
  resultStatus: { fontSize: 10, fontWeight: "900" },
});
