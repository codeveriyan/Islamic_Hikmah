import { Platform } from "react-native";

/**
 * Centralized elevation tokens.
 *
 * Cards/surfaces across the app previously hand-rolled shadow objects like
 * `{ shadowColor: "#000", shadowOffset: {...}, shadowOpacity: 0.16, shadowRadius: 20, elevation: 8 }`
 * with slightly different values in each file. Use `getElevation(level)` so
 * every "raised" surface in the app shares the same 6-step scale, and
 * Android `elevation` stays in sync with the iOS shadow definition.
 */

export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type ElevationStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

// 6-step elevation scale, roughly aligned with Material 3 elevation levels.
// Level 5 matches the values previously used for the Home hero banner.
const LEVELS: Record<ElevationLevel, Omit<ElevationStyle, "shadowColor">> = {
  0: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  1: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  2: { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 },
  3: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  4: { shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 16, elevation: 6 },
  5: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.16, shadowRadius: 20, elevation: 8 },
};

/**
 * Returns a platform-correct shadow/elevation style object for the given
 * level (0 = flat, 5 = highest emphasis).
 *
 * @param level 0-5 elevation step.
 * @param shadowColor Defaults to "#000"; pass a theme color for tinted shadows.
 *
 * @example
 * <AnimatedCard style={[styles.card, getElevation(5)]}>
 */
export function getElevation(level: ElevationLevel, shadowColor = "#000"): ElevationStyle {
  const base = LEVELS[level];
  return {
    shadowColor,
    ...base,
    // Android reads only `elevation`; iOS reads only the shadow* props.
    // Setting both means a single style object is correct on every platform.
    elevation: Platform.OS === "android" ? base.elevation : base.elevation,
  };
}

/** Convenience presets for the most common existing usages in the app. */
export const ELEVATION_NONE = getElevation(0);
export const ELEVATION_CARD = getElevation(2);
export const ELEVATION_RAISED = getElevation(3);
export const ELEVATION_HERO = getElevation(5);
