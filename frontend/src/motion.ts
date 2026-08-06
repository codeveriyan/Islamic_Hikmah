import { useReducedMotion as useReanimatedReducedMotion } from "react-native-reanimated";

/**
 * Centralized motion tokens for Reanimated-driven interactions.
 *
 * Import spring/timing presets from here instead of hand-rolling
 * `{ damping, stiffness, mass }` or `{ duration }` objects inline in each
 * component. This keeps press/expand/dismiss animations feeling consistent
 * across the app, and makes it possible to tune "feel" globally in one file.
 */

export type SpringPreset = {
  damping: number;
  stiffness: number;
  mass: number;
};

export type TimingPreset = {
  duration: number;
};

/** Snappy press feedback (cards, buttons, icon buttons). Matches the values
 * previously hardcoded inline in AnimatedCard. */
export const SPRING_PRESS: SpringPreset = { damping: 15, stiffness: 300, mass: 0.6 };

/** Slightly softer spring for modal/sheet entrances and larger surfaces. */
export const SPRING_ENTRANCE: SpringPreset = { damping: 18, stiffness: 220, mass: 0.8 };

/** Gentle spring for small, low-emphasis UI (dots, badges, pulses). */
export const SPRING_SUBTLE: SpringPreset = { damping: 12, stiffness: 180, mass: 0.5 };

/** Fast opacity/color fades (press-in feedback). */
export const TIMING_FAST: TimingPreset = { duration: 80 };
/** Standard opacity/color fades (press-out, toggles). */
export const TIMING_BASE: TimingPreset = { duration: 120 };
/** Slower transitions (page-level fades, banners, celebrations). */
export const TIMING_SLOW: TimingPreset = { duration: 250 };

/**
 * Reduce-motion-aware hook. Re-exports Reanimated's built-in
 * `useReducedMotion` (backed by the OS "Reduce Motion" accessibility
 * setting) so call sites only need one import from `@/src/motion`.
 */
export const useReducedMotion = useReanimatedReducedMotion;

/**
 * Returns a spring config, collapsed to a near-instant settle when the user
 * has "Reduce Motion" enabled in their OS accessibility settings.
 *
 * Usage:
 *   const reduceMotion = useReducedMotion();
 *   scale.value = withSpring(0.96, getSpringConfig(SPRING_PRESS, reduceMotion));
 */
export function getSpringConfig(preset: SpringPreset, reduceMotion: boolean): SpringPreset {
  if (!reduceMotion) return preset;
  // Keep it a real (very stiff, critically-damped) spring rather than removing
  // the animation outright, so shared-value driven styles still settle
  // smoothly instead of visually "jumping" to their end state.
  return { damping: 100, stiffness: 1000, mass: 0.3 };
}

/**
 * Returns a timing config, collapsed to duration 0 when the user has
 * "Reduce Motion" enabled.
 */
export function getTimingConfig(preset: TimingPreset, reduceMotion: boolean): TimingPreset {
  if (!reduceMotion) return preset;
  return { duration: 0 };
}
