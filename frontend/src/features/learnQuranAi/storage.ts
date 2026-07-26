import AsyncStorage from "@react-native-async-storage/async-storage";

import { QAIDA_LESSONS } from "./data";
import type {
  LearnerLevel,
  LearningSnapshot,
  MistakeAggregate,
  StoredAttempt,
} from "./types";

const ATTEMPTS_KEY = "hikmah:learn-ai:attempts:v1";
const QAIDA_KEY = "hikmah:learn-ai:qaida-complete:v1";
const LEVEL_KEY = "hikmah:learn-ai:level:v1";
const MAX_LOCAL_ATTEMPTS = 100;

async function parseArray<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getAttempts(): Promise<StoredAttempt[]> {
  const attempts = await parseArray<StoredAttempt>(ATTEMPTS_KEY);
  const verifiedAttempts = attempts.filter((attempt) => attempt.source === "model");
  if (verifiedAttempts.length !== attempts.length) {
    await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(verifiedAttempts));
  }
  return verifiedAttempts;
}

export async function saveAttempt(attempt: StoredAttempt): Promise<void> {
  const attempts = await getAttempts();
  const next = [attempt, ...attempts.filter((item) => item.attemptId !== attempt.attemptId)]
    .slice(0, MAX_LOCAL_ATTEMPTS);
  await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
}

export async function getCompletedQaidaLessons(): Promise<string[]> {
  return parseArray<string>(QAIDA_KEY);
}

export async function markQaidaLessonComplete(lessonId: string): Promise<string[]> {
  const completed = await getCompletedQaidaLessons();
  const next = completed.includes(lessonId) ? completed : [...completed, lessonId];
  await AsyncStorage.setItem(QAIDA_KEY, JSON.stringify(next));
  return next;
}

export async function getLearnerLevel(): Promise<LearnerLevel | null> {
  return (await AsyncStorage.getItem(LEVEL_KEY)) as LearnerLevel | null;
}

export async function saveLearnerLevel(level: LearnerLevel): Promise<void> {
  await AsyncStorage.setItem(LEVEL_KEY, level);
}

export function aggregateMistakes(attempts: StoredAttempt[]): MistakeAggregate[] {
  const aggregates = new Map<string, MistakeAggregate>();
  attempts.forEach((attempt) => {
    attempt.wordResults.forEach((word) => {
      if (word.status === "correct") return;
      const key = `${attempt.surahId}:${attempt.ayahId}:${word.wordIndex}`;
      const existing = aggregates.get(key);
      aggregates.set(key, {
        key,
        expectedText: word.expectedText,
        count: (existing?.count ?? 0) + 1,
        lastMissedAt: Math.max(existing?.lastMissedAt ?? 0, attempt.createdAt),
        status: word.status,
        surahId: attempt.surahId,
        ayahId: attempt.ayahId,
        wordIndex: word.wordIndex,
      });
    });
  });
  return [...aggregates.values()].sort(
    (a, b) => b.count - a.count || b.lastMissedAt - a.lastMissedAt,
  );
}

export async function getLearningSnapshot(): Promise<LearningSnapshot> {
  const [attempts, completed] = await Promise.all([
    getAttempts(),
    getCompletedQaidaLessons(),
  ]);
  const uniqueAyahs = new Set(
    attempts
      .filter((attempt) => attempt.practiceMode === "ayah")
      .map((attempt) => `${attempt.surahId}:${attempt.ayahId}`),
  );
  return {
    attempts: attempts.length,
    averageScore: attempts.length
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.overallScore, 0) / attempts.length)
      : 0,
    practicedAyahs: uniqueAyahs.size,
    completedQaidaLessons: completed.length,
    totalQaidaLessons: QAIDA_LESSONS.length,
    wordsNeedingPractice: aggregateMistakes(attempts).length,
  };
}
