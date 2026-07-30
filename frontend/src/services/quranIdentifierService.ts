import { API_BASE_URL } from "@/src/apiBaseUrl";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";


export interface IdentifiedRecitationResult {
  status: "success";
  source: "model";
  surah_number: number;
  surah_name_english: string;
  surah_name_arabic: string;
  verse_start: number;
  verse_end: number;
  reciter_name: string | null;
  reciter_id: string | null;
  reciter_country: string | null;
  reciter_style: string | null;
  reciter_status: "not_available";
  confidence: number;
  matched_text_arabic: string;
  matched_text_english: string;
  transcript: string;
  modelName: string;
  modelRevision: string;
  processingTimeMs: number;
}

export interface UnidentifiedRecitationResult {
  status: "no_match";
  message: string;
  transcript?: string;
}

export type QuranIdentificationResponse =
  | IdentifiedRecitationResult
  | UnidentifiedRecitationResult;

function readableApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  const message = (payload as { message?: unknown }).message;
  return typeof message === "string" ? message : fallback;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The browser recording could not be read."));
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(blob);
  });
}

async function encodeRecording(
  audioUri: string,
): Promise<{ audioBase64: string; audioFormat: string }> {
  if (Platform.OS === "web") {
    const response = await fetch(audioUri);
    if (!response.ok) {
      throw new Error("The browser recording could not be read.");
    }
    const blob = await response.blob();
    return {
      audioBase64: await blobToDataUrl(blob),
      audioFormat: blob.type.includes("mp4") ? "m4a" : "webm",
    };
  }

  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const extension = audioUri.split("?")[0].split(".").pop()?.toLowerCase();
  return {
    audioBase64,
    audioFormat: extension === "3gp" ? "3gp" : "m4a",
  };
}

export async function identifyQuranRecording(
  audioUri: string,
): Promise<QuranIdentificationResponse> {
  if (!API_BASE_URL) {
    throw new Error("The recitation identification service is not configured.");
  }

  const { audioBase64, audioFormat } = await encodeRecording(audioUri);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/quran/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio_b64: audioBase64,
        audio_format: audioFormat,
        sample_rate: 44100,
      }),
    });
  } catch {
    throw new Error(
      `Cannot reach the recitation backend at ${API_BASE_URL}.`,
    );
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      readableApiError(payload, "The recitation could not be identified."),
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    !["success", "no_match"].includes(
      String((payload as { status?: unknown }).status),
    )
  ) {
    throw new Error("The identification service returned an invalid response.");
  }

  const result = payload as QuranIdentificationResponse;
  if (result.status === "success" && result.source !== "model") {
    throw new Error(
      "The backend returned a demonstration result, so it was discarded.",
    );
  }
  return result;
}
