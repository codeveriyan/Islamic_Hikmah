/**
 * QuranPlayerContext — global mini-player state for surah audio.
 * Provides play/pause/stop across all screens without interfering
 * with the existing Adhan player in _layout.tsx.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  playbackRate: number;
  play: (track: QuranTrack) => void;
  togglePlayPause: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  dismiss: () => void;
  setPlaybackRate: (rate: number) => void;
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
  playbackRate: 1.0,
  play: () => {},
  togglePlayPause: () => {},
  skipNext: () => {},
  skipPrev: () => {},
  dismiss: () => {},
  setPlaybackRate: () => {},
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
  const [playbackRate, setPlaybackRateState] = useState(1.0);

  // Persist playback rate across app sessions
  useEffect(() => {
    AsyncStorage.getItem("hikmah:playback-rate").then((v) => {
      const parsed = parseFloat(v ?? "");
      if (!isNaN(parsed) && parsed > 0) setPlaybackRateState(parsed);
    }).catch(() => {});
  }, []);

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
        setTimeout(() => {
          try {
            // Re-apply rate after replace (replace resets rate to 1.0)
            player.setPlaybackRate(playbackRate);
            player.shouldCorrectPitch = true;
            player.play();
          } catch {}
        }, 300);
      } catch {}
    },
    [player, playbackRate]
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

  const handleSetPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    AsyncStorage.setItem("hikmah:playback-rate", String(rate)).catch(() => {});
    try {
      player.setPlaybackRate(rate);
      player.shouldCorrectPitch = true;
    } catch {}
  }, [player]);

  return (
    <QuranPlayerContext.Provider
      value={{
        track,
        isPlaying: status.playing,
        isVisible,
        position: status.currentTime ?? 0,
        duration: status.duration ?? 0,
        playbackRate,
        play,
        togglePlayPause,
        skipNext,
        skipPrev,
        dismiss,
        setPlaybackRate: handleSetPlaybackRate,
      }}
    >
      {children}
    </QuranPlayerContext.Provider>
  );
}
