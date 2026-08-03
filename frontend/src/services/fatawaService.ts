/**
 * fatawaService.ts
 * ----------------
 * Type definitions and API service for the Fatawa & Scholarly Answers feature.
 *
 * Content policy
 * ~~~~~~~~~~~~~~
 * • All `excerpt_or_summary` text in the catalog is an original Islamic
 *   Hikmah editorial summary — NOT a full reproduction of any copyrighted
 *   answer from IslamQA.info or any other site.
 * • `source_url` always points to the canonical source page so users can
 *   read the full ruling directly.
 * • The `ALLOWED_SOURCE_HOSTS` allowlist in the backend mirrors the list
 *   below for documentation purposes.
 */

import { API_BASE_URL } from "@/src/apiBaseUrl";

// ---------------------------------------------------------------------------
// Type definitions (mirrors FatawaItemResponse Pydantic model)
// ---------------------------------------------------------------------------

export type EvidenceCitationType = "quran" | "hadith" | "fatwa" | "tafsir";

export interface EvidenceCitation {
  type: EvidenceCitationType;
  reference: string;
  url?: string | null;
  verified: boolean;
}

export type FatawaCategory =
  | "aqeedah"
  | "worship"
  | "family"
  | "transactions"
  | "food_ethics"
  | "contemporary";

export type ReviewStatus = "draft" | "scholar_reviewed" | "published";

export type LicenseType =
  | "original_islamic_hikmah_summary"
  | "licensed_content"
  | "public_domain"
  | "permission_required";

export interface FatawaItem {
  schema_version: 1;
  id: string;
  title: string;
  question_summary: string;
  excerpt_or_summary: string;
  summary_author?: string | null;
  category: FatawaCategory;
  category_name_english: string;
  category_name_arabic: string;
  evidence_citations: EvidenceCitation[];
  source_provider: string;
  source_url: string;
  source_reference: string;
  scholar_or_author?: string | null;
  reviewer_name_or_org?: string | null;
  review_status: ReviewStatus;
  differing_opinions_note?: string | null;
  language: string;
  madhhab_or_scope?: string | null;
  license: LicenseType;
  rights_basis?: string | null;
  published_at?: string | null;
  reviewed_at?: string | null;
  updated_at?: string | null;
  catalog_version: number;
  content_version: number;
}

export interface FatawaCategoryMeta {
  id: string;
  name_english: string;
  name_arabic: string;
  icon: string;
  description: string;
  count: number;
}

export interface FatawaPaginatedResponse {
  total: number;
  page: number;
  limit: number;
  results: FatawaItem[];
}

// ---------------------------------------------------------------------------
// Offline fallback catalog
// ---------------------------------------------------------------------------
// This is a bundled copy of the backend catalog data. It is used whenever
// the network request fails (offline, server down, etc.).
// It is NOT a reproduction of copyrighted content — all summaries are original.
// Keep this in sync with backend/fatawa_catalog.py.

export const LOCAL_CATALOG: FatawaItem[] = [
  {
    schema_version: 1, id: "islamqa-219",
    title: "Is it permissible to pray with shoes on?",
    question_summary: "Can a Muslim pray wearing shoes inside the masjid or outdoors?",
    excerpt_or_summary: "Praying with shoes on is permissible provided the shoes are pure (tahir) and free of impurity. The Prophet ﷺ prayed with his sandals on and encouraged Muslims to do so to distinguish themselves from the Jews. Shoes must be removed if impurity is detected. Inside a mosque, local customs and cleanliness concerns should be respected.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "worship", category_name_english: "Worship (Ibadah)", category_name_arabic: "العبادة",
    evidence_citations: [
      { type: "hadith", reference: "Sunan Abi Dawud 650 — Prophet ﷺ prayed with sandals", url: "https://sunnah.com/abudawud:650", verified: true },
      { type: "hadith", reference: "Sunan Abi Dawud 652 — Remove impurity from shoes by rubbing on earth", url: "https://sunnah.com/abudawud:652", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/219/praying-in-shoes", source_reference: "Fatwa #219",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    language: "en", madhhab_or_scope: "General (Majority view)", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-9365",
    title: "Ruling on praying Sunnah prayers in congregation",
    question_summary: "Is it permissible to pray Sunnah (nawafil) prayers in congregation?",
    excerpt_or_summary: "The general principle is that Sunnah prayers are performed individually. However, scholars permit occasional congregation for Sunnah prayers if done infrequently, such as Tarawih, Qiyam al-Layl, and teaching-related prayers. Making it a regular habit of congregational Sunnah prayer without evidence is considered an innovation (bid'ah).",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "worship", category_name_english: "Worship (Ibadah)", category_name_arabic: "العبادة",
    evidence_citations: [
      { type: "hadith", reference: "Sahih Bukhari 698 — Praying Sunnah prayers alone", url: "https://sunnah.com/bukhari:698", verified: true },
      { type: "hadith", reference: "Sahih Bukhari 2010 — Tarawih in congregation", url: "https://sunnah.com/bukhari:2010", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/9365/sunnah-prayers-in-congregation", source_reference: "Fatwa #9365",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    language: "en", madhhab_or_scope: "General", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-37694",
    title: "Ruling on fasting for a pregnant or breastfeeding woman",
    question_summary: "Does a pregnant or nursing mother have to fast in Ramadan?",
    excerpt_or_summary: "Pregnant and breastfeeding women are permitted to break their fast in Ramadan if they fear harm to themselves or to their child. They must make up the missed days (qada) later. The majority of scholars hold that expiation (fidya — feeding a poor person for each missed day) is not required if they only fear for the child, while some scholars (Hanbali position) require both qada and fidya in that case.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "worship", category_name_english: "Worship (Ibadah)", category_name_arabic: "العبادة",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Baqarah 2:185 — Ease and hardship in fasting", url: "https://quran.com/2/185", verified: true },
      { type: "hadith", reference: "Sunan Abi Dawud 2408 — Concession for the pregnant traveller", url: "https://sunnah.com/abudawud:2408", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/37694/ruling-on-pregnant-breastfeeding-woman-fasting", source_reference: "Fatwa #37694",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Shafi'i and Maliki scholars: only qada required. Hanbali scholars: both qada and fidya if fear is for child only.",
    language: "en", madhhab_or_scope: "General / Differing views", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-10236",
    title: "What is the ruling on celebrating birthdays?",
    question_summary: "Is it permissible for Muslims to celebrate birthdays?",
    excerpt_or_summary: "Celebrating birthdays is not established from the Quran or Sunnah, and was not practiced by the Companions. Many contemporary scholars consider it a prohibited innovation (bid'ah) if done with the intention of religious significance. However, a number of scholars permit a simple, modest gathering without religious connotation, provided it involves no prohibited acts such as mixing of the sexes, music, or extravagance.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "aqeedah", category_name_english: "Aqeedah & Belief", category_name_arabic: "العقيدة",
    evidence_citations: [
      { type: "hadith", reference: "Sunan Abi Dawud 4607 — Every innovation is misguidance", url: "https://sunnah.com/abudawud:4607", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/10236/ruling-on-celebrating-birthdays", source_reference: "Fatwa #10236",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Some contemporary scholars permit simple family gatherings without religious intent.",
    language: "en", madhhab_or_scope: "General", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-1507",
    title: "Is music halal or haram in Islam?",
    question_summary: "What is the Islamic ruling on listening to music?",
    excerpt_or_summary: "The majority of classical and contemporary scholars, including the four main madhahib, consider musical instruments (ma'azif) impermissible based on Quranic and Sunnah evidence. The permissibility exception covers the duff (hand drum) on Eids and weddings. Some contemporary scholars permit music that does not promote immorality and does not involve prohibited instruments. Muslims are advised to follow the ruling of trusted scholars in their community.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "aqeedah", category_name_english: "Aqeedah & Belief", category_name_arabic: "العقيدة",
    evidence_citations: [
      { type: "quran", reference: "Surah Luqman 31:6 — Idle talk that leads astray", url: "https://quran.com/31/6", verified: true },
      { type: "hadith", reference: "Sahih Bukhari 5590 — Those who permit silk, intoxicants and musical instruments", url: "https://sunnah.com/bukhari:5590", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/5000/the-islamic-ruling-on-music", source_reference: "Fatwa #5000",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "A minority of scholars permit music without immoral content. The duff is permitted by majority consensus on Eids and weddings.",
    language: "en", madhhab_or_scope: "General / Majority", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-6503",
    title: "Ruling on eating meat slaughtered by Christians and Jews",
    question_summary: "Is meat slaughtered by People of the Book (Christians/Jews) halal?",
    excerpt_or_summary: "The Quran explicitly permits the food (including meat) of the People of the Book (Ahl al-Kitab). Scholars hold that mechanically slaughtered meat where the name of Allah is not mentioned is contested — the Hanbali position requires Tasmiyah (saying Bismillah) to be pronounced over every animal. Most contemporary scholars recommend consuming certified halal meat where available, but do not prohibit all Western Christian/Jewish-slaughtered meat.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "food_ethics", category_name_english: "Food & Ethics", category_name_arabic: "الطعام والآداب",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Ma'idah 5:5 — Food of People of the Book is permitted", url: "https://quran.com/5/5", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/6503/ruling-on-eating-meat-slaughtered-by-christians-and-jews", source_reference: "Fatwa #6503",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Stricter view: Tasmiyah must be pronounced by the slaughterer for validity. More lenient view: Quranic permission applies broadly to People of the Book.",
    language: "en", madhhab_or_scope: "General / Differing views", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-96533",
    title: "Is it permissible to eat food that contains gelatin?",
    question_summary: "What is the ruling on food products containing gelatin from pork or unknown sources?",
    excerpt_or_summary: "Gelatin derived from pork is haram (impermissible). Gelatin from cattle slaughtered in a non-Islamic manner is disputed. Fish-derived gelatin is permissible. Many contemporary scholars apply the principle of istihalah (transformation) — if the gelatin has undergone complete chemical transformation, some scholars permit it even from originally impure sources. Muslims are advised to choose halal-certified products when possible.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "food_ethics", category_name_english: "Food & Ethics", category_name_arabic: "الطعام والآداب",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Baqarah 2:173 — Prohibition of pork", url: "https://quran.com/2/173", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/96533/gelatin-ruling", source_reference: "Fatwa #96533",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Istihalah (complete transformation) principle is accepted by some scholars, rejected by others.",
    language: "en", madhhab_or_scope: "General", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-2521",
    title: "Ruling on taking out a bank loan with interest (riba)",
    question_summary: "Is it permissible to take a bank mortgage or personal loan that involves interest?",
    excerpt_or_summary: "Riba (interest) is explicitly prohibited in the Quran and is one of the major sins in Islam. Taking an interest-bearing mortgage or loan is not permissible except in cases of dire necessity (darura), and scholars have strict conditions for what constitutes genuine necessity. Muslims are strongly encouraged to seek Islamic finance alternatives (murabaha, musharakah, ijara) where available.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "transactions", category_name_english: "Business & Transactions", category_name_arabic: "المعاملات",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Baqarah 2:275-279 — Prohibition of riba", url: "https://quran.com/2/275", verified: true },
      { type: "hadith", reference: "Sahih Muslim 1598 — Curse upon the one who deals in riba", url: "https://sunnah.com/muslim:1598", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/2521/ruling-on-interest-based-mortgage", source_reference: "Fatwa #2521",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    language: "en", madhhab_or_scope: "General / Unanimous prohibition", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-21914",
    title: "Ruling on working in a bank that deals with interest",
    question_summary: "Is it permissible to work for a bank that charges or pays interest?",
    excerpt_or_summary: "Scholars agree it is impermissible to work in a role that directly involves writing, witnessing, or facilitating riba-based transactions — the Prophet ﷺ cursed all four parties of a riba contract. Working in a general administrative or unrelated role in a bank is more contested, with some scholars permitting it on grounds of necessity while others prohibit it entirely. Muslims should seek halal employment alternatives where possible.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "transactions", category_name_english: "Business & Transactions", category_name_arabic: "المعاملات",
    evidence_citations: [
      { type: "hadith", reference: "Sahih Muslim 1598 — All parties of riba transaction are cursed", url: "https://sunnah.com/muslim:1598", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/21914/working-in-a-bank", source_reference: "Fatwa #21914",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Some scholars permit admin roles; direct riba facilitation is unanimously prohibited.",
    language: "en", madhhab_or_scope: "General", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-2127",
    title: "Ruling on marriage to a non-Muslim woman",
    question_summary: "Can a Muslim man marry a Christian or Jewish woman (Ahl al-Kitab)?",
    excerpt_or_summary: "The Quran permits Muslim men to marry chaste women from the People of the Book (Christians and Jews). However, scholars note this permission comes with considerations: her religion should not adversely affect the children's Islamic upbringing, and a Muslim woman may never marry a non-Muslim man. Many scholars strongly discourage inter-faith marriage in non-Muslim societies due to the risks to Islamic family values and the children's faith.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "family", category_name_english: "Family & Marriage", category_name_arabic: "الأسرة والزواج",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Ma'idah 5:5 — Chaste women from People of the Book", url: "https://quran.com/5/5", verified: true },
      { type: "quran", reference: "Surah Al-Baqarah 2:221 — Do not marry polytheists", url: "https://quran.com/2/221", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/2127/marriage-to-non-muslim-woman", source_reference: "Fatwa #2127",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Some scholars consider it makruh (disliked) in non-Muslim countries due to risk of the children not being raised Muslim.",
    language: "en", madhhab_or_scope: "General / Majority", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-9465",
    title: "Conditions and rulings on Islamic divorce (Talaq)",
    question_summary: "What are the Islamic rulings on talaq (divorce) and how does it work?",
    excerpt_or_summary: "Talaq is the husband's right to pronounce divorce, but it must meet strict conditions. It should be pronounced once during a period of purity (tuhr) when the husband has not had intercourse. Triple talaq in one sitting is considered a prohibited innovation by many scholars and is valid as one talaq in the Hanbali and some other views. After a single talaq, there is an 'iddah (waiting period) during which the couple may reconcile. After three talaqs, remarriage requires an independent marriage (muhallil is prohibited).",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "family", category_name_english: "Family & Marriage", category_name_arabic: "الأسرة والزواج",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Baqarah 2:229-230 — Talaq rulings", url: "https://quran.com/2/229", verified: true },
      { type: "quran", reference: "Surah At-Talaq 65:1 — Divorce during purity period", url: "https://quran.com/65/1", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/9465/conditions-and-rulings-on-talaq", source_reference: "Fatwa #9465",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Triple talaq in one sitting: Majority view holds it counts as three; Hanbali and many contemporary scholars hold it counts as one.",
    language: "en", madhhab_or_scope: "General / Differing views", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-163498",
    title: "Ruling on cryptocurrency trading (Bitcoin etc.)",
    question_summary: "Is investing in or trading cryptocurrency such as Bitcoin permissible in Islam?",
    excerpt_or_summary: "Scholars are divided on the permissibility of cryptocurrency. Those who permit it argue that Bitcoin and similar currencies can function as a medium of exchange and store of value, similar to gold or commodity money. Those who prohibit it cite gharar (excessive uncertainty), maysir (gambling-like speculation), use in illegal transactions, and lack of intrinsic value. The consensus position is still evolving. Muslims should exercise extreme caution, avoid highly speculative trading, and consult a trusted scholar.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "contemporary", category_name_english: "Contemporary Issues", category_name_arabic: "القضايا المعاصرة",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Ma'idah 5:90 — Prohibition of maysir (gambling)", url: "https://quran.com/5/90", verified: true },
      { type: "hadith", reference: "Sunan Abi Dawud 3376 — Prohibition of gharar transactions", url: "https://sunnah.com/abudawud:3376", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/163498/ruling-on-cryptocurrency", source_reference: "Fatwa #163498",
    scholar_or_author: "Various Contemporary Scholars", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Permissive view (e.g. some Saudi scholars): permissible as a medium of exchange. Prohibitive view: highly speculative nature makes it akin to gambling.",
    language: "en", madhhab_or_scope: "Contemporary / Differing views", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
  {
    schema_version: 1, id: "islamqa-49016",
    title: "Is it permissible to take out insurance policies?",
    question_summary: "What is the Islamic ruling on commercial insurance (health, car, home)?",
    excerpt_or_summary: "Commercial insurance as practiced today is considered impermissible by the majority of scholars due to elements of riba (interest), gharar (uncertainty), and maysir (gambling). The permissible alternative is Takaful — a cooperative Islamic insurance scheme based on mutual contribution and shared risk. Where insurance is compulsory by law (e.g. car insurance), many scholars permit compliance to the legal minimum while considering the Islamic alternative.",
    summary_author: "Islamic Hikmah Editorial Team",
    category: "contemporary", category_name_english: "Contemporary Issues", category_name_arabic: "القضايا المعاصرة",
    evidence_citations: [
      { type: "quran", reference: "Surah Al-Ma'idah 5:90 — Prohibition of maysir", url: "https://quran.com/5/90", verified: true },
    ],
    source_provider: "IslamQA.info", source_url: "https://islamqa.info/en/answers/49016/ruling-on-insurance", source_reference: "Fatwa #49016",
    scholar_or_author: "Sheikh Muhammad Salih Al-Munajjid", reviewer_name_or_org: "Islamic Hikmah Editorial Team", review_status: "published", reviewed_at: "2024-01-01",
    differing_opinions_note: "Compulsory government-mandated insurance (e.g. car insurance) is permitted by many scholars.",
    language: "en", madhhab_or_scope: "General / Majority", license: "original_islamic_hikmah_summary",
    rights_basis: "Original summary; canonical link to IslamQA.info", published_at: "2024-01-01", catalog_version: 1, content_version: 1,
  },
];

/** Offline category metadata derived from LOCAL_CATALOG. */
export const LOCAL_CATEGORIES: FatawaCategoryMeta[] = [
  { id: "worship", name_english: "Worship (Ibadah)", name_arabic: "العبادة", icon: "hands-pray", description: "Salah, Sawm, Zakat, Hajj, and acts of devotion", count: LOCAL_CATALOG.filter(f => f.category === "worship").length },
  { id: "aqeedah", name_english: "Aqeedah & Belief", name_arabic: "العقيدة", icon: "star-crescent", description: "Islamic creed, belief, and foundational tenets", count: LOCAL_CATALOG.filter(f => f.category === "aqeedah").length },
  { id: "family", name_english: "Family & Marriage", name_arabic: "الأسرة والزواج", icon: "home-heart", description: "Marriage, divorce, parenting, and family relations", count: LOCAL_CATALOG.filter(f => f.category === "family").length },
  { id: "transactions", name_english: "Business & Transactions", name_arabic: "المعاملات", icon: "bank", description: "Halal finance, trade, contracts, and riba rulings", count: LOCAL_CATALOG.filter(f => f.category === "transactions").length },
  { id: "food_ethics", name_english: "Food & Ethics", name_arabic: "الطعام والآداب", icon: "food-halal", description: "Halal/haram foods, etiquette, and daily life ethics", count: LOCAL_CATALOG.filter(f => f.category === "food_ethics").length },
  { id: "contemporary", name_english: "Contemporary Issues", name_arabic: "القضايا المعاصرة", icon: "lightning-bolt", description: "Modern finance, technology, and current affairs", count: LOCAL_CATALOG.filter(f => f.category === "contemporary").length },
];

// ---------------------------------------------------------------------------
// Offline search helpers
// ---------------------------------------------------------------------------

function _normalizeArabicOffline(text: string): string {
  // Strip Arabic diacritics (tashkeel) for fuzzy matching
  return text.replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed]/g, "");
}

const LOCAL_SEARCH_STOPWORDS = new Set([
  "a", "an", "the", "is", "it", "to", "of", "in", "on", "for", "and", "or",
  "do", "does", "can", "could", "should", "would", "i", "my", "me", "what",
  "how", "are", "if", "with", "was", "be", "this", "that", "there",
]);

function _localQueryTokens(text: string): Set<string> {
  const words = _normalizeArabicOffline(text.toLowerCase()).match(/[\p{L}\p{N}']+/gu) ?? [];
  return new Set(words.filter((word) => word.length > 1 && !LOCAL_SEARCH_STOPWORDS.has(word)));
}

function _localItemMatches(item: FatawaItem, q: string): boolean {
  const qNorm = _normalizeArabicOffline(q.toLowerCase());
  const haystack = [item.title, item.question_summary, item.excerpt_or_summary, item.scholar_or_author ?? ""].join(" ");
  const haystackNorm = _normalizeArabicOffline(haystack.toLowerCase());
  if (qNorm && haystackNorm.includes(qNorm)) return true;

  const queryTokens = _localQueryTokens(q);
  if (queryTokens.size === 0) return false;
  const haystackTokens = _localQueryTokens(haystack);
  const overlap = [...queryTokens].filter((token) => haystackTokens.has(token)).length;
  const required = queryTokens.size <= 2
    ? queryTokens.size
    : Math.max(2, Math.ceil(queryTokens.size * 0.6));
  return overlap >= required;
}


function _searchLocalCatalog(params: SearchFatawaParams): FatawaPaginatedResponse {
  const { q, category, page = 1, limit = 20 } = params;
  let results = LOCAL_CATALOG.filter(
    (item) => item.review_status === "published" && item.license !== "permission_required"
  );
  if (category) results = results.filter((item) => item.category === category);
  if (q?.trim()) {
    const qClean = q.trim();
    results = results.filter((item) => _localItemMatches(item, qClean));
  }
  const total = results.length;
  const offset = (page - 1) * limit;
  return { total, page, limit, results: results.slice(offset, offset + limit) };
}

// ---------------------------------------------------------------------------
// API client (with offline fallback)
// ---------------------------------------------------------------------------

export class FatawaHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "FatawaHttpError";
    this.status = status;
  }
}

const BASE = `${API_BASE_URL}/api/fatawa`;

/** Fetch all category metadata with counts. Falls back to LOCAL_CATEGORIES only on network failure. */
export async function fetchFatawaCategories(): Promise<FatawaCategoryMeta[]> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/categories`);
  } catch {
    // True network failure (offline, DNS error, timeout)
    return LOCAL_CATEGORIES;
  }
  if (!res.ok) {
    throw new FatawaHttpError(res.status, `Failed to fetch categories (HTTP ${res.status})`);
  }
  return res.json();
}

export interface SearchFatawaParams {
  q?: string;
  category?: FatawaCategory | null;
  page?: number;
  limit?: number;
}

/** Search and filter fatawa summaries. Falls back to local catalog only on network failure. */
export async function searchFatawa(
  params: SearchFatawaParams = {}
): Promise<FatawaPaginatedResponse> {
  const { q, category, page = 1, limit = 20 } = params;

  let res: Response;
  try {
    const url = new URL(`${BASE}/search`);
    if (q && q.trim()) url.searchParams.set("q", q.trim());
    if (category) url.searchParams.set("category", category);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    res = await fetch(url.toString());
  } catch {
    // True network failure (offline, DNS error, timeout, malformed URL)
    return _searchLocalCatalog(params);
  }

  if (!res.ok) {
    throw new FatawaHttpError(res.status, `Search failed (HTTP ${res.status})`);
  }
  return res.json();
}

/** Fetch a single fatwa by its ID. Falls back to local catalog only on network failure. */
export async function fetchFatawaById(id: string): Promise<FatawaItem> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/${encodeURIComponent(id)}`);
  } catch {
    // True network failure (offline)
    const local = LOCAL_CATALOG.find((item) => item.id === id);
    if (local) return local;
    throw new Error("Fatwa not found offline");
  }

  if (res.status === 404) throw new FatawaHttpError(404, "Fatwa not found");
  if (!res.ok) throw new FatawaHttpError(res.status, `Failed to fetch fatwa (HTTP ${res.status})`);
  return res.json();
}

/** Submit any custom question and receive a grounded Islamic ruling summary. */
export async function askFatawaQuestion(question: string): Promise<FatawaItem> {
  const q = question.trim();
  if (!q) throw new Error("Question cannot be empty");

  let res: Response;
  try {
    res = await fetch(`${BASE}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
  } catch {
    // A reviewed catalog match remains useful while offline. Unknown
    // questions must not receive a generated or guessed ruling.
    const localMatch = LOCAL_CATALOG.find((item) => _localItemMatches(item, q));
    if (localMatch) return localMatch;
    throw new FatawaHttpError(
      0,
      "The live Fatwa search is unavailable. Check your connection and try again."
    );
  }

  if (res.ok) return res.json();

  let detail = "";
  try {
    const payload = await res.json();
    if (typeof payload?.detail === "string") detail = payload.detail;
  } catch {}

  if (res.status === 404) {
    throw new FatawaHttpError(
      404,
      detail || "No confident scholarly source match was found. Try rephrasing your question."
    );
  }
  throw new FatawaHttpError(
    res.status,
    detail || `The Fatwa service could not answer this question (HTTP ${res.status}).`
  );
}

// ---------------------------------------------------------------------------
// Category icon mapping
// ---------------------------------------------------------------------------

export const CATEGORY_ICON_MAP: Record<string, string> = {
  worship: "hands-pray",
  aqeedah: "star-crescent",
  family: "home-heart",
  transactions: "bank",
  food_ethics: "food-halal",
  contemporary: "lightning-bolt",
};

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  worship: "#00A884",
  aqeedah: "#8B5CF6",
  family: "#F59E0B",
  transactions: "#3B82F6",
  food_ethics: "#10B981",
  contemporary: "#EF4444",
};

/** Badge label for review status. */
export function getReviewStatusLabel(status: ReviewStatus): string {
  switch (status) {
    case "published":
      // 'Published' not 'Verified': catalog items have editorial review but
      // no named scholar reviewer yet. Change to 'Scholar Verified' once
      // reviewer_name_or_org and reviewed_at are populated.
      return "Published";
    case "scholar_reviewed":
      return "Scholar Reviewed";
    case "draft":
      return "Draft";
  }
}

/** Badge colour for review status. */
export function getReviewStatusColor(status: ReviewStatus): string {
  switch (status) {
    case "published":
      return "#00A884";
    case "scholar_reviewed":
      return "#8B5CF6";
    case "draft":
      return "#F59E0B";
  }
}

/** Icon name for evidence citation type. */
export function getEvidenceIcon(type: EvidenceCitationType): string {
  switch (type) {
    case "quran":
      return "book-open-variant";
    case "hadith":
      return "book-open";
    case "fatwa":
      return "gavel";
    case "tafsir":
      return "magnify";
  }
}
