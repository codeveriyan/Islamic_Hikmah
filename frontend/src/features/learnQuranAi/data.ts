import type {
  ArticulationGuide,
  LearnerLevel,
  QaidaLesson,
  TajweedLesson,
} from "./types";

export const LEARNER_LEVELS: {
  id: LearnerLevel;
  title: string;
  subtitle: string;
}[] = [
  { id: "beginner", title: "Complete beginner", subtitle: "I cannot read Arabic yet" },
  { id: "letters", title: "Know the letters", subtitle: "I recognise Arabic letters" },
  { id: "slow_reader", title: "Slow reader", subtitle: "I can read with some help" },
  { id: "improving", title: "Improve recitation", subtitle: "I want clearer, more accurate recitation" },
  { id: "advanced", title: "Advanced practice", subtitle: "I want focused fluency and Tajweed study" },
];

// These lessons are product prototypes, not a publishable religious curriculum.
// Text, sequencing, teacher recordings, and pedagogy require qualified review.
export const QAIDA_LESSONS: QaidaLesson[] = [
  {
    id: "letters-1",
    order: 1,
    title: "Meet the first letters",
    subtitle: "Alif, Baa, Taa and Thaa",
    objective: "Recognise four letter shapes and distinguish their basic sounds.",
    examples: ["ا", "ب", "ت", "ث"],
    reviewStatus: "draft",
    estimatedMinutes: 6,
  },
  {
    id: "short-vowels-1",
    order: 2,
    title: "Short vowels",
    subtitle: "Fathah, kasrah and dammah",
    objective: "Read a consonant with the three short vowel marks.",
    examples: ["بَ", "بِ", "بُ"],
    reviewStatus: "draft",
    estimatedMinutes: 8,
  },
  {
    id: "joining-1",
    order: 3,
    title: "Joining letters",
    subtitle: "Read simple connected forms",
    objective: "Notice how letter shapes change when connected inside a word.",
    examples: ["بَتَ", "كَتَبَ", "رَبِّ"],
    reviewStatus: "draft",
    estimatedMinutes: 10,
  },
];

export const TAJWEED_LESSONS: TajweedLesson[] = [
  {
    id: "madd",
    title: "Madd",
    arabicTitle: "المد",
    summary: "Lengthening a vowel for the required number of counts.",
    example: "قَالَ",
    color: "#8B5CF6",
  },
  {
    id: "ghunnah",
    title: "Ghunnah",
    arabicTitle: "الغنة",
    summary: "A nasal sound associated with noon and meem in defined situations.",
    example: "إِنَّ",
    color: "#0EA5E9",
  },
  {
    id: "qalqalah",
    title: "Qalqalah",
    arabicTitle: "القلقلة",
    summary: "A controlled echo on ق ط ب ج د when the letter carries sukoon.",
    example: "أَحَدْ",
    color: "#F97316",
  },
  {
    id: "ikhfa",
    title: "Ikhfa",
    arabicTitle: "الإخفاء",
    summary: "Concealing noon sakinah or tanween before its recognised letters.",
    example: "مِنْ شَرِّ",
    color: "#10B981",
  },
];

export const ARTICULATION_GUIDES: ArticulationGuide[] = [
  {
    letter: "ح",
    name: "Haa",
    makhraj: "Middle of the throat",
    guidance: "Let air pass gently through the middle throat without using the vocal cords heavily.",
    contrast: "Compare with ه, which is lighter and comes from the lower throat.",
  },
  {
    letter: "ع",
    name: "Ayn",
    makhraj: "Middle of the throat",
    guidance: "Narrow the middle throat gently; avoid turning it into a plain vowel.",
    contrast: "Compare with ء, which begins with a sharper closure.",
  },
  {
    letter: "ق",
    name: "Qaaf",
    makhraj: "Back of the tongue with the soft palate",
    guidance: "Raise the deepest part of the tongue and keep the sound full.",
    contrast: "Compare with ك, which is produced slightly further forward.",
  },
  {
    letter: "ض",
    name: "Daad",
    makhraj: "Side of the tongue against the upper molars",
    guidance: "Press one side of the tongue along the upper molars while maintaining a full sound.",
    contrast: "Compare with د; do not reduce ض to a simple d sound.",
  },
];
