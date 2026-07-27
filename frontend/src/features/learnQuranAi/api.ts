import { auth } from "@/src/firebase";
import { API_BASE_URL } from "@/src/apiBaseUrl";
import { Platform } from "react-native";

import type { ScoreResponse } from "./types";

type ScoreInput = {
  audioUri: string;
  surahId: number;
  ayahId: number;
  expectedText: string;
  wordIndex?: number;
};

function readableApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return null;
        const issue = item as { msg?: unknown; loc?: unknown };
        const location = Array.isArray(issue.loc)
          ? issue.loc.filter((part) => part !== "body").join(" → ")
          : "";
        const message = typeof issue.msg === "string" ? issue.msg : "";
        if (!message) return null;
        return location ? `${location}: ${message}` : message;
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length) return messages.join(". ");
  }

  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : fallback;
}

async function appendRecording(
  form: FormData,
  input: ScoreInput,
): Promise<void> {
  if (Platform.OS === "web") {
    const recordingResponse = await fetch(input.audioUri);
    if (!recordingResponse.ok) {
      throw new Error("The browser recording could not be read for upload.");
    }
    const blob = await recordingResponse.blob();
    const mimeType = blob.type || "audio/webm";
    const extension = mimeType.includes("mp4") ? "m4a" : "webm";
    form.append(
      "audio",
      blob,
      `recitation-${input.surahId}-${input.ayahId}.${extension}`,
    );
    return;
  }

  form.append("audio", {
    uri: input.audioUri,
    name: `recitation-${input.surahId}-${input.ayahId}.m4a`,
    type: "audio/m4a",
  } as any);
}

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

  const form = new FormData();
  form.append("surah_id", String(input.surahId));
  form.append("ayah_id", String(input.ayahId));
  if (input.wordIndex != null) form.append("word_index", String(input.wordIndex));
  await appendRecording(form, input);

  const submit = async (token: string) => {
    try {
      return await fetch(`${API_BASE_URL}/api/learn/score`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
    } catch {
      throw new Error(
        `Cannot reach the AI scoring backend at ${API_BASE_URL}. Start the local backend and try again.`,
      );
    }
  };

  let response = await submit(await currentUser.getIdToken());
  if (response.status === 401) {
    response = await submit(await currentUser.getIdToken(true));
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      readableApiError(payload, "The recitation could not be scored."),
    );
  }
  const score = payload as ScoreResponse;
  if (score.source !== "model") {
    throw new Error(
      "The backend returned prototype feedback, so it was discarded. No score was saved.",
    );
  }
  return score;
}
