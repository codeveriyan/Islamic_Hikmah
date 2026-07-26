export type WordStatus = "correct" | "minor_issue" | "incorrect";
export type ScoreSource = "mock" | "model";
export type LearnerLevel = "beginner" | "letters" | "slow_reader" | "improving" | "advanced";

export interface WordResult {
  wordIndex: number;
  expectedText: string;
  heardText: string | null;
  status: WordStatus;
}

export interface ScoreResponse {
  attemptId: string;
  surahId: number;
  ayahId: number;
  overallScore: number;
  wordResults: WordResult[];
  source: ScoreSource;
  disclaimer: string;
  transcript?: string | null;
  modelName?: string | null;
  modelRevision?: string | null;
  scorerVersion?: string | null;
  processingTimeMs?: number | null;
}

export interface StoredAttempt extends ScoreResponse {
  createdAt: number;
  practiceMode: "ayah" | "word";
}

export interface QaidaLesson {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  objective: string;
  examples: string[];
  reviewStatus: "draft" | "teacher_reviewed";
  estimatedMinutes: number;
}

export interface TajweedLesson {
  id: string;
  title: string;
  arabicTitle: string;
  summary: string;
  example: string;
  color: string;
}

export interface ArticulationGuide {
  letter: string;
  name: string;
  makhraj: string;
  guidance: string;
  contrast: string;
}

export interface MistakeAggregate {
  key: string;
  expectedText: string;
  count: number;
  lastMissedAt: number;
  status: Exclude<WordStatus, "correct">;
  surahId: number;
  ayahId: number;
  wordIndex: number;
}

export interface LearningSnapshot {
  attempts: number;
  averageScore: number;
  practicedAyahs: number;
  completedQaidaLessons: number;
  totalQaidaLessons: number;
  wordsNeedingPractice: number;
}
