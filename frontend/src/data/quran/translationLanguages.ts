export type LangCode =
  | "en" | "ta" | "hi" | "ur" | "bn" | "te" | "kn" | "ml" | "es" | "fr" | "de" | "tr"
  | "id" | "ru" | "fa" | "so" | "ms" | "uz" | "yo" | "ps" | "gu" | "mr" | "pa" | "sq"
  | "bs" | "ro" | "sw" | "tg" | "az" | "bm" | "bg" | "zh" | "dv" | "nl" | "ha" | "it"
  | "ja" | "ko" | "ku" | "pt" | "th" | "vi" | "am" | "as" | "km" | "ce" | "cs" | "fi"
  | "lg" | "he" | "kk" | "rw" | "om" | "pl" | "sd" | "si" | "sv" | "tl" | "tt" | "ug"
  | "uk";

export const LANGUAGES = [
  { id: "en" as const, label: "English", flag: "🇬🇧" },
  { id: "ta" as const, label: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { id: "hi" as const, label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { id: "ur" as const, label: "Urdu (اردو)", flag: "🇵🇰" },
  { id: "bn" as const, label: "Bengali (বাংলা)", flag: "🇧🇩" },
  { id: "te" as const, label: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { id: "kn" as const, label: "Kannada (ಕನ್ನಡ)", flag: "🇮🇳" },
  { id: "ml" as const, label: "Malayalam (മലയാളം)", flag: "🇮🇳" },
  { id: "es" as const, label: "Spanish (Español)", flag: "🇪🇸" },
  { id: "fr" as const, label: "French (Français)", flag: "🇫🇷" },
  { id: "de" as const, label: "German (Deutsch)", flag: "🇩🇪" },
  { id: "tr" as const, label: "Turkish (Türkçe)", flag: "🇹🇷" },
  { id: "id" as const, label: "Indonesian (Bahasa Indonesia)", flag: "🇮🇩" },
  { id: "ru" as const, label: "Russian (Русский)", flag: "🇷🇺" },
  { id: "fa" as const, label: "Persian (فارسی)", flag: "🇮🇷" },
  { id: "so" as const, label: "Somali (Soomaali)", flag: "🇸🇴" },
  { id: "ms" as const, label: "Malay (Bahasa Melayu)", flag: "🇲🇾" },
  { id: "uz" as const, label: "Uzbek (Oʻzbekcha)", flag: "🇺🇿" },
  { id: "yo" as const, label: "Yoruba (Yorùbá)", flag: "🇳🇬" },
  { id: "ps" as const, label: "Pashto (پښتو)", flag: "🇦🇫" },
  { id: "gu" as const, label: "Gujarati (ગુજરાતી)", flag: "🇮🇳" },
  { id: "mr" as const, label: "Marathi (मराठी)", flag: "🇮🇳" },
  { id: "pa" as const, label: "Punjabi (ਪੰਜਾਬੀ)", flag: "🇮🇳" },
  { id: "sq" as const, label: "Albanian (Shqip)", flag: "🇦🇱" },
  { id: "bs" as const, label: "Bosnian (Bosanski)", flag: "🇧🇦" },
  { id: "ro" as const, label: "Romanian (Română)", flag: "🇷🇴" },
  { id: "sw" as const, label: "Swahili (Kiswahili)", flag: "🇰🇪" },
  { id: "tg" as const, label: "Tajik (Тоҷиκӣ)", flag: "🇹🇯" },
  { id: "az" as const, label: "Azeri (Azərbaycanca)", flag: "🇦🇿" },
  { id: "bm" as const, label: "Bambara (Bamanankan)", flag: "🇲🇱" },
  { id: "bg" as const, label: "Bulgarian (Български)", flag: "🇧🇬" },
  { id: "zh" as const, label: "Chinese (中文)", flag: "🇨🇳" },
  { id: "dv" as const, label: "Divehi (Dhivehi)", flag: "🇲🇻" },
  { id: "nl" as const, label: "Dutch (Nederlands)", flag: "🇳🇱" },
  { id: "ha" as const, label: "Hausa (Harshen Hausa)", flag: "🇳🇬" },
  { id: "it" as const, label: "Italian (Italiano)", flag: "🇮🇹" },
  { id: "ja" as const, label: "Japanese (日本語)", flag: "🇯🇵" },
  { id: "ko" as const, label: "Korean (한국어)", flag: "🇰🇷" },
  { id: "ku" as const, label: "Kurdish (Kurdî)", flag: "🇮🇶" },
  { id: "pt" as const, label: "Portuguese (Português)", flag: "🇵🇹" },
  { id: "th" as const, label: "Thai (ภาษาไทย)", flag: "🇹🇭" },
  { id: "vi" as const, label: "Vietnamese (Tiếng Việt)", flag: "🇻🇳" },
  { id: "am" as const, label: "Amharic (አማርኛ)", flag: "🇪🇹" },
  { id: "as" as const, label: "Assamese (অসমীয়া)", flag: "🇮🇳" },
  { id: "km" as const, label: "Central Khmer (ភាសាខ្មែរ)", flag: "🇰🇭" },
  { id: "ce" as const, label: "Chechen (Нохчийн)", flag: "🇷🇺" },
  { id: "cs" as const, label: "Czech (Čeština)", flag: "🇨🇿" },
  { id: "fi" as const, label: "Finnish (Suomi)", flag: "🇫🇮" },
  { id: "lg" as const, label: "Ganda (Luganda)", flag: "🇺🇬" },
  { id: "he" as const, label: "Hebrew (עברית)", flag: "🇮🇱" },
  { id: "kk" as const, label: "Kazakh (Қазақша)", flag: "🇰🇿" },
  { id: "rw" as const, label: "Kinyarwanda (Ikinyarwanda)", flag: "🇷🇼" },
  { id: "om" as const, label: "Oromo (Oromoo)", flag: "🇪🇹" },
  { id: "pl" as const, label: "Polish (Polski)", flag: "🇵🇱" },
  { id: "sd" as const, label: "Sindhi (سنڌي)", flag: "🇵🇰" },
  { id: "si" as const, label: "Sinhalese (සිංහල)", flag: "🇱🇰" },
  { id: "sv" as const, label: "Swedish (Svenska)", flag: "🇸🇪" },
  { id: "tl" as const, label: "Tagalog (Wikang Tagalog)", flag: "🇵🇭" },
  { id: "tt" as const, label: "Tatar (Татарча)", flag: "🇷🇺" },
  { id: "ug" as const, label: "Uyghur (ئۇيغۇرچە)", flag: "🇨🇳" },
  { id: "uk" as const, label: "Ukrainian (Українська)", flag: "🇺🇦" },
];

export const TRANSLATION_MAP: Record<LangCode, number> = {
  en: 131, // Sahih International
  ta: 0,   // Jan Trust (Local JSON translation)
  hi: 122, // Suhel Farooq Khan and Saifur Rahman Nadwi
  ur: 158, // Fateh Muhammad Jalandhri
  bn: 161, // Bayaan Foundation
  te: 44,  // Abdul Azeez Al-Qazi
  kn: 100, // Kannada Quran Translation
  ml: 200, // Malayalam Translation
  es: 83,  // Muhammad Isa García
  fr: 136, // Muhammad Hamidullah
  de: 27,  // Abu Rida Rassoul
  tr: 77,  // Diyanet Isleri
  id: 33,  // Indonesian Ministry of Religious Affairs
  ru: 79,  // Elmir Kuliev
  fa: 135, // Hussein Taji Kal Dari
  so: 124, // Mahmud Mahmud Abdu
  ms: 39,  // Abdullah Muhammad Basmeih
  uz: 101, // Muhammad Sodik Yusuf
  yo: 125, // Al-Qur'an Translation
  ps: 91,  // Zakaria Zakaria
  gu: 211, // Raza Khan
  mr: 228, // Muhammad Shafi'i
  pa: 223, // Punjabi Translation
  sq: 169, // Sherif Ahmeti
  bs: 25,  // Besim Korkut
  ro: 173, // George Grigore
  sw: 123, // Ali Muhsin Al-Barwani
  tg: 120, // AbdolMohammad Ayati
  az: 142, // Alikhan Musayev
  bm: 286, // Bambara Translation
  bg: 288, // Tzvetan Theophanov
  zh: 109, // Ma Jian
  dv: 96,  // Office of the President
  nl: 287, // Sofian S. Siregar
  ha: 298, // Abubakar Mahmood Jummi
  it: 35,  // Hamza Roberto Piccardo
  ja: 212, // Ryoichi Mita
  ko: 36,  // Korean Translation
  ku: 270, // Burhan Muhammad Amin
  pt: 216, // Samir El-Hayek
  th: 121, // King Fahd Complex
  vi: 174, // Vietnamese Translation
  am: 191, // Muhammed Sani Habib
  as: 292, // Assamese Translation
  km: 157, // Cambodian Translation
  ce: 295, // Chechen Translation
  cs: 152, // Preklad I. Hrbek
  fi: 289, // Finnish Translation
  lg: 290, // Luganda Translation
  he: 464, // Hebrew Translation
  kk: 279, // Kazakh Translation
  rw: 210, // Rwanda Translation
  om: 304, // Oromo Translation
  pl: 300, // Józef Bielawski
  sd: 465, // Sindhi Translation
  si: 472, // Sinhalese Translation
  sv: 122, // Knut Bernström
  tl: 294, // Tagalog Translation
  tt: 305, // Tatar Translation
  ug: 296, // Uyghur Translation
  uk: 426, // Ukrainian Translation
};
