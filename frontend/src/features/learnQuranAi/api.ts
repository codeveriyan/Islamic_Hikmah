import { auth } from "@/src/firebase";

import type { ScoreResponse } from "./types";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_HADITH_API_BASE_URL
)?.replace(/\/$/, "");

type ScoreInput = {
  audioUri: string;
  surahId: number;
  ayahId: number;
  expectedText: string;
  wordIndex?: number;
};

export async function scoreRecitation(input: ScoreInput): Promise<ScoreResponse> {
  const currentUser = auth.currentUser;
  if (!API_BASE_URL) {
    throw new Error(
      "The AI scoring service is not configured. No score was generated.",
    );
  }
  if (!currentUser) {
    throw new Error(
      "Sign in before using AI recitation scoring. No score was generated.",
    );
  }

  const token = await currentUser.getIdToken();
  const form = new FormData();
  form.append("surah_id", String(input.surahId));
  form.append("ayah_id", String(input.ayahId));
  if (input.wordIndex != null) form.append("word_index", String(input.wordIndex));
  form.append("audio", {
    uri: input.audioUri,
    name: `recitation-${input.surahId}-${input.ayahId}.m4a`,
    type: "audio/m4a",
  } as any);

  const response = await fetch(`${API_BASE_URL}/api/learn/score`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || "The recitation could not be scored.");
  }
  const score = payload as ScoreResponse;
  if (score.source !== "model") {
    throw new Error(
      "The backend returned prototype feedback, so it was discarded. No score was saved.",
    );
  }
  return score;
}
