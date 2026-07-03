// Tajweed rule colors, sourced from Al Quran Cloud's published Tajweed Guide:
// https://alquran.cloud/tajweed-guide
//
// The `quran-tajweed` edition of the Al Quran Cloud API (the same host this app
// already uses for reciter audio) wraps each Uthmani-script segment that carries
// a tajweed rule in a tag like:
//   <tajweed class="madda_normal">...</tajweed>
// The `class` value below is the rule key used by that API. Colors are the
// light-mode values published in the guide; dark-mode variants are lightened
// so they stay legible on a near-black reading surface (several of the
// official colors, e.g. #000EBC, are close to invisible on black).
//
// If the API ever returns a rule key not listed here, renderers should fall
// back to the surrounding text color rather than throwing — see
// getTajweedColor() in src/utils/parseTajweed.ts.

export type TajweedRuleKey =
  | "ham_wasl"
  | "silent"
  | "laam_shamsiyah"
  | "madda_normal"
  | "madda_permissible"
  | "madda_necessary"
  | "qalaqah"
  | "madda_obligatory"
  | "ikhafa_shafawi"
  | "ikhafa"
  | "idgham_shafawi"
  | "iqlab"
  | "idgham_ghunnah"
  | "idgham_wo_ghunnah"
  | "idgham_mutajanisayn"
  | "idgham_mutaqaribayn"
  | "ghunnah";

export const TAJWEED_RULE_LABELS: Record<TajweedRuleKey, string> = {
  ham_wasl: "Hamzat ul Wasl",
  silent: "Silent letter",
  laam_shamsiyah: "Laam Shamsiyyah",
  madda_normal: "Madd (normal)",
  madda_permissible: "Madd (permissible)",
  madda_necessary: "Madd (necessary)",
  qalaqah: "Qalqalah",
  madda_obligatory: "Madd (obligatory)",
  ikhafa_shafawi: "Ikhafa Shafawi",
  ikhafa: "Ikhafa",
  idgham_shafawi: "Idgham Shafawi",
  iqlab: "Iqlab",
  idgham_ghunnah: "Idgham with Ghunnah",
  idgham_wo_ghunnah: "Idgham without Ghunnah",
  idgham_mutajanisayn: "Idgham Mutajanisayn",
  idgham_mutaqaribayn: "Idgham Mutaqaribayn",
  ghunnah: "Ghunnah",
};

export const TAJWEED_COLORS_LIGHT: Record<TajweedRuleKey, string> = {
  ham_wasl: "#AAAAAA",
  silent: "#AAAAAA",
  laam_shamsiyah: "#AAAAAA",
  madda_normal: "#537FFF",
  madda_permissible: "#4050FF",
  madda_necessary: "#000EBC",
  qalaqah: "#DD0008",
  madda_obligatory: "#2144C1",
  ikhafa_shafawi: "#D500B7",
  ikhafa: "#9400A8",
  idgham_shafawi: "#58B800",
  iqlab: "#26BFFD",
  idgham_ghunnah: "#169777",
  idgham_wo_ghunnah: "#169200",
  idgham_mutajanisayn: "#A1A1A1",
  idgham_mutaqaribayn: "#A1A1A1",
  ghunnah: "#FF7E1E",
};

// Lightened for legibility on a dark reading surface. Hues are preserved;
// darker/navy tones (madda_necessary, madda_obligatory, ikhafa) are brightened
// the most since they'd otherwise disappear on black.
export const TAJWEED_COLORS_DARK: Record<TajweedRuleKey, string> = {
  ham_wasl: "#8A8A8A",
  silent: "#8A8A8A",
  laam_shamsiyah: "#8A8A8A",
  madda_normal: "#8FA8FF",
  madda_permissible: "#8290FF",
  madda_necessary: "#6B76FF",
  qalaqah: "#FF6B6F",
  madda_obligatory: "#7C8CFF",
  ikhafa_shafawi: "#F16FE0",
  ikhafa: "#D66FE8",
  idgham_shafawi: "#8CE84A",
  iqlab: "#6FDBFF",
  idgham_ghunnah: "#4FD9B8",
  idgham_wo_ghunnah: "#4FD94A",
  idgham_mutajanisayn: "#C7C7C7",
  idgham_mutaqaribayn: "#C7C7C7",
  ghunnah: "#FFA75E",
};
