/**
 * QuranPlayerContext — global mini-player state for surah audio.
 * Provides play/pause/stop across all screens without interfering
 * with the existing Adhan player in _layout.tsx.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

// ──────────────────────────────────────────────────────────
// CDN URL builder  (uses the Islamic Network free CDN)
// ──────────────────────────────────────────────────────────
const surahUrl = (surahNumber: number, reciterId = "ar.alafasy") =>
  `https://cdn.islamic.network/quran/audio-surah/128/${reciterId}/${surahNumber}.mp3`;

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────
export type QuranTrack = {
  surahNumber: number;
  surahName: string;
  reciterName: string;
  reciterId: string;
};

type QuranPlayerContextValue = {
  track: QuranTrack | null;
  isPlaying: boolean;
  isVisible: boolean;
  position: number;    // seconds
  duration: number;    // seconds
  play: (track: QuranTrack) => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  dismiss: () => void;
};

// ──────────────────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────────────────
const QuranPlayerContext = createContext<QuranPlayerContextValue>({
  track: null,
  isPlaying: false,
  isVisible: false,
  position: 0,
  duration: 0,
  play: () => {},
  togglePlayPause: () => {},
  skipNext: () => {},
  skipPrev: () => {},
  dismiss: () => {},
});

export function useQuranPlayer() {
  return useContext(QuranPlayerContext);
}

// ──────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────
export function QuranPlayerProvider({ children }: { children: React.ReactNode }) {
  const [track, setTrack] = useState<QuranTrack | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // We use a stable placeholder so useAudioPlayer is always called with a value
  const [audioSource, setAudioSource] = useState<{ uri: string } | null>(null);

  const player = useAudioPlayer(audioSource ?? { uri: "" });
  const status = useAudioPlayerStatus(player);

  const play = useCallback(
    (newTrack: QuranTrack) => {
      const url = surahUrl(newTrack.surahNumber, newTrack.reciterId);
      setTrack(newTrack);
      setIsVisible(true);
      setAudioSource({ uri: url });
      // replace triggers a reload; then play automatically after brief delay
      try {
        player.replace({ uri: url });
        setTimeout(() => { try { player.play(); } catch {} }, 300);
      } catch {}
    },
    [player]
  );

  const togglePlayPause = useCallback(() => {
    try {
      if (status.playing) player.pause();
      else player.play();
    } catch {}
  }, [player, status.playing]);

  const skipNext = useCallback(() => {
    if (!track) return;
    const next = Math.min(track.surahNumber + 1, 114);
    play({ ...track, surahNumber: next });
  }, [track, play]);

  const skipPrev = useCallback(() => {
    if (!track) return;
    const prev = Math.max(track.surahNumber - 1, 1);
    play({ ...track, surahNumber: prev });
  }, [track, play]);

  const dismiss = useCallback(() => {
    try { player.pause(); } catch {}
    setIsVisible(false);
    setTrack(null);
  }, [player]);

  return (
    <QuranPlayerContext.Provider
      value={{
        track,
        isPlaying: status.playing,
        isVisible,
        position: status.currentTime ?? 0,
        duration: status.duration ?? 0,
        play,
        togglePlayPause,
        skipNext,
        skipPrev,
        dismiss,
      }}
    >
      {children}
    </QuranPlayerContext.Provider>
  );
}
