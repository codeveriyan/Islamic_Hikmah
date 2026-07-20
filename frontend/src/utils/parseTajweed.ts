import { TAJWEED_COLORS_DARK, TAJWEED_COLORS_LIGHT, TajweedRuleKey } from "@/src/data/tajweedColors";

export type TajweedSegment = {
  text: string;
  rule: TajweedRuleKey | null;
};

// Al Quran Cloud's compact API notation uses markers such as `[h:13[ٱ]`.
// The number is metadata; only the code and the enclosed Quranic text matter.
const BRACKET_RULES: Record<string, TajweedRuleKey> = {
  h: "ham_wasl", s: "silent", l: "laam_shamsiyah", n: "madda_normal",
  p: "madda_permissible", m: "madda_necessary", q: "qalaqah",
  o: "madda_obligatory", c: "ikhafa_shafawi", f: "ikhafa",
  w: "idgham_shafawi", i: "iqlab", a: "idgham_ghunnah",
  u: "idgham_wo_ghunnah", d: "idgham_mutajanisayn",
  b: "idgham_mutaqaribayn", g: "ghunnah",
};

/**
 * Parses the `text` field returned by Al Quran Cloud's `quran-tajweed` edition,
 * e.g.:
 *   بِسْمِ <tajweed class="ham_wasl">ٱ</tajweed>للَّهِ ...
 * into a flat list of { text, rule } segments, so callers can render each
 * segment as its own <Text> with a rule-specific color.
 *
 * Deliberately tolerant: unknown/malformed tags are treated as plain text
 * rather than thrown away, so a parsing edge case degrades to "looks like
 * normal Arabic text" instead of dropping words or crashing the screen.
 */
export function parseTajweedText(raw: string): TajweedSegment[] {
  if (!raw) return [];

  // Strip the ayah-end marker span — the app already renders its own ayah
  // number badge, so we don't want a second glyph baked into the text.
  const cleaned = raw.replace(/<span[^>]*class=["']?end["']?[^>]*>.*?<\/span>/gi, "").trim();

  const segments: TajweedSegment[] = [];
  const tagPattern = /<tajweed[^>]*class=["']?([a-z_]+)["']?[^>]*>(.*?)<\/tajweed>/gi;
  const bracketPattern = /\[([a-z])(?::\d+)?\[([^\]]*)\]/gi;
  const pattern = cleaned.includes("<tajweed") ? tagPattern : bracketPattern;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(cleaned)) !== null) {
    const [fullMatch, rawRuleKey, innerText] = match;
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      const plain = cleaned.slice(lastIndex, matchStart);
      if (plain) segments.push({ text: plain, rule: null });
    }

    if (innerText) {
      const rule = pattern === bracketPattern
        ? BRACKET_RULES[rawRuleKey.toLowerCase()] ?? null
        : rawRuleKey as TajweedRuleKey;
      segments.push({ text: innerText, rule });
    }

    lastIndex = matchStart + fullMatch.length;
  }

  if (lastIndex < cleaned.length) {
    const plain = cleaned.slice(lastIndex);
    if (plain) segments.push({ text: plain, rule: null });
  }

  return segments;
}

/**
 * Resolves a rule key to a color for the current theme. Falls back to
 * `fallbackColor` (normally the surrounding Arabic text color) for any rule
 * key the app doesn't recognize, so an unexpected/new rule from the API never
 * renders as invisible or throws — it just looks like plain Arabic text.
 */
export function getTajweedColor(
  rule: TajweedRuleKey | null,
  isDark: boolean,
  fallbackColor: string
): string {
  if (!rule) return fallbackColor;
  const palette = isDark ? TAJWEED_COLORS_DARK : TAJWEED_COLORS_LIGHT;
  return palette[rule] ?? fallbackColor;
}
