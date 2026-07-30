/**
 * MiniPlayerBar — Spotify-style persistent audio mini-player.
 * Slides up from the bottom when a Quran surah is playing.
 * Sits above the tab bar and animates waveform bars when audio plays.
 */
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { useQuranPlayer } from "@/src/QuranPlayerContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ──────────────────────────────────────────────────────────
// Animated waveform bar
// ──────────────────────────────────────────────────────────
function WaveBar({ delay, isPlaying }: { delay: number; isPlaying: boolean }) {
  const { colors } = useTheme();
  const height = useSharedValue(4);

  useEffect(() => {
    if (isPlaying) {
      height.value = withRepeat(
        withSequence(
          withTiming(18, { duration: 300 + delay * 50, easing: Easing.inOut(Easing.ease) }),
          withTiming(4, { duration: 300 + delay * 50, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      height.value = withTiming(4, { duration: 200 });
    }
  }, [isPlaying, delay]);

  const style = useAnimatedStyle(() => ({
    height: height.value,
    backgroundColor: colors.brand,
    width: 3,
    borderRadius: 2,
    alignSelf: "center",
  }));

  return <Animated.View style={style} />;
}

// ──────────────────────────────────────────────────────────
// Progress bar
// ──────────────────────────────────────────────────────────
function ProgressBar({ position, duration }: { position: number; duration: number }) {
  const { colors } = useTheme();
  const pct = duration > 0 ? Math.min(1, position / duration) : 0;
  return (
    <View style={[pb.track, { backgroundColor: colors.border }]}>
      <View style={[pb.fill, { width: `${pct * 100}%`, backgroundColor: colors.brand }]} />
    </View>
  );
}
const pb = StyleSheet.create({
  track: { height: 2, borderRadius: 1, overflow: "hidden", marginBottom: 0 },
  fill: { height: 2, borderRadius: 1 },
});

const SPEED_STEPS = [0.75, 1.0, 1.25, 1.5, 2.0];

// ──────────────────────────────────────────────────────────
// Speed chip — animated glow when not at 1×
// ──────────────────────────────────────────────────────────
function SpeedChip({ rate, onPress }: { rate: number; onPress: () => void }) {
  const { colors } = useTheme();
  const glowOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const isActive = rate !== 1.0;

  useEffect(() => {
    if (isActive) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isActive]);

  const chipStyle = useAnimatedStyle(() => ({
    shadowOpacity: glowOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  const label = rate === 1.0 ? "1×" : rate === 0.75 ? "¾×" : `${rate}×`;

  return (
    <Pressable
      onPress={() => {
        scale.value = withSequence(withTiming(0.85, { duration: 80 }), withTiming(1, { duration: 120 }));
        onPress();
      }}
      hitSlop={10}
    >
      <Animated.View
        style={[
          s.speedChip,
          {
            backgroundColor: isActive ? colors.brand + "28" : "transparent",
            borderColor: isActive ? colors.brand : colors.border,
            shadowColor: colors.brand,
          },
          chipStyle,
        ]}
      >
        <Text style={[s.speedChipTxt, { color: isActive ? colors.brand : colors.onSurfaceMuted }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ──────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────
const BAR_HEIGHT = 64;

export function MiniPlayerBar() {
  const { colors, mode } = useTheme();
  const { track, isPlaying, isVisible, position, duration, togglePlayPause, skipNext, skipPrev, dismiss, playbackRate, setPlaybackRate } =
    useQuranPlayer();
  const insets = useSafeAreaInsets();

  const cycleSpeed = () => {
    const idx = SPEED_STEPS.indexOf(playbackRate);
    const next = SPEED_STEPS[(idx + 1) % SPEED_STEPS.length];
    setPlaybackRate(next);
  };

  // Slide-up animation
  const translateY = useSharedValue(BAR_HEIGHT + 100);

  useEffect(() => {
    translateY.value = withTiming(isVisible ? 0 : BAR_HEIGHT + 100, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
    });
  }, [isVisible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!track && !isVisible) return null;

  const bg = mode === "dark" ? colors.surfaceSecondary : "#FFFFFF";

  return (
    <Animated.View
      style={[
        s.wrapper,
        animStyle,
        {
          backgroundColor: bg,
          borderTopColor: colors.border,
          // sit just above the tab bar (56px) + safe area bottom
          bottom: 56 + insets.bottom,
        },
      ]}
    >
      {/* Progress strip */}
      <ProgressBar position={position} duration={duration} />

      <View style={s.row}>
        {/* Waveform */}
        <View style={s.waveform}>
          {[0, 1, 2, 3, 4].map((i) => (
            <WaveBar key={i} delay={i} isPlaying={isPlaying} />
          ))}
        </View>

        {/* Track info */}
        <View style={s.info}>
          <Text style={[s.surahName, { color: colors.onSurface }]} numberOfLines={1}>
            {track?.surahName ?? "Surah"}
          </Text>
          <Text style={[s.reciterName, { color: colors.onSurfaceMuted }]} numberOfLines={1}>
            {track?.reciterName ?? ""}
          </Text>
        </View>

        {/* Controls */}
        <Pressable onPress={skipPrev} hitSlop={10} style={s.ctrlBtn}>
          <MaterialCommunityIcons name="skip-previous" size={22} color={colors.onSurface} />
        </Pressable>

        <Pressable
          onPress={togglePlayPause}
          style={[s.playBtn, { backgroundColor: colors.brand }]}
        >
          <MaterialCommunityIcons
            name={isPlaying ? "pause" : "play"}
            size={20}
            color="#fff"
          />
        </Pressable>

        <Pressable onPress={skipNext} hitSlop={10} style={s.ctrlBtn}>
          <MaterialCommunityIcons name="skip-next" size={22} color={colors.onSurface} />
        </Pressable>

        <SpeedChip rate={playbackRate} onPress={cycleSpeed} />

        <Pressable onPress={dismiss} hitSlop={10} style={[s.ctrlBtn, { marginLeft: 2 }]}>
          <MaterialCommunityIcons name="close" size={18} color={colors.onSurfaceMuted} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    borderTopWidth: 0.5,
    paddingHorizontal: 12,
    zIndex: 999,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 6,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    width: 26,
    height: 20,
  },
  info: { flex: 1, minWidth: 0 },
  surahName: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Outfit_600SemiBold",
  },
  reciterName: {
    fontSize: 10,
    fontFamily: "Figtree_400Regular",
    marginTop: 1,
  },
  ctrlBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  speedChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 0,
  },
  speedChipTxt: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Outfit_600SemiBold",
    letterSpacing: 0.3,
  },
});
