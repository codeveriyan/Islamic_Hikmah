/**
 * Shared time formatting utilities.
 * Centralizes duplicated format12Hour logic from prayer-times.tsx and (tabs)/index.tsx
 */

/**
 * Converts a 24-hour time string (e.g. "14:30" or "14:30:00") to
 * a 12-hour formatted string (e.g. "02:30 PM").
 */
export function format12Hour(timeStr: string): string {
  if (!timeStr) return "";
  const clean = timeStr.split(" ")[0];
  const parts = clean.split(":");
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1].substring(0, 2);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

/**
 * Returns the number of minutes remaining until a given 24-h time string today.
 * Returns null if the time has already passed today.
 */
export function minutesUntil(timeStr: string): number | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  const diff = (target.getTime() - now.getTime()) / 60000;
  return diff >= 0 ? Math.ceil(diff) : null;
}
