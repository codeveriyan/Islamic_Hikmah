import { API_BASE_URL } from "@/src/apiBaseUrl";

export interface IdentifiedRecitationResult {
  status: string;
  surah_number: number;
  surah_name_english: string;
  surah_name_arabic: string;
  verse_start: number;
  verse_end: number;
  reciter_name: string;
  reciter_id: string;
  reciter_country: string;
  reciter_style: string;
  confidence: number;
  matched_text_arabic: string;
  matched_text_english: string;
}

export async function identifyQuranAudio(
  audioBase64?: string,
  audioFormat: string = "wav"
): Promise<IdentifiedRecitationResult> {
  const baseUrl = API_BASE_URL || "http://localhost:8000";
  const response = await fetch(`${baseUrl}/api/quran/identify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_b64: audioBase64 || null,
      audio_format: audioFormat,
      sample_rate: 16000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Identification failed with status ${response.status}`);
  }

  return response.json();
}
