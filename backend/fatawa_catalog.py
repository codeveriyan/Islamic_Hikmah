"""
fatawa_catalog.py
-----------------
Offline catalog of original Islamic Hikmah summaries for the Fatawa &
Scholarly Answers feature.

Content policy
~~~~~~~~~~~~~~
* All ``excerpt_or_summary`` fields are **original human-written summaries**
  authored by the Islamic Hikmah editorial team.  They are NOT reproductions
  of copyrighted fatawa from IslamQA.info or any other site.
* ``source_url`` provides a canonical link so users can read the full ruling
  directly on the source website.
* Allowed ``source_url`` host-names are validated at API time via
  ``ALLOWED_SOURCE_HOSTS``.  The catalog data is also verified by
  ``test_fatawa.py``.

Adding entries
~~~~~~~~~~~~~~
1. Write an **original** ``excerpt_or_summary`` (or set license =
   ``"permission_required"`` and leave it blank until permission is granted).
2. Fill in ``evidence_citations`` with verified references.
3. Set ``review_status = "draft"`` until scholar review is complete.
4. Only items with ``review_status = "published"`` are surfaced to end-users
   by default (the API parameter ``include_draft`` is authenticated-only).
"""

from __future__ import annotations

from typing import Final, List, TypedDict


# ---------------------------------------------------------------------------
# Allowed external host names for source_url and citation URL fields.
# Any URL not on this list will be rejected by the API validation layer.
# ---------------------------------------------------------------------------
ALLOWED_SOURCE_HOSTS: Final[frozenset[str]] = frozenset(
    {
        "islamqa.info",
        "quran.com",
        "sunnah.com",
        "islamweb.net",
        "dar-alifta.org",
        "islamhelpline.net",
    }
)


# ---------------------------------------------------------------------------
# TypedDict definitions (mirrors the TypeScript FatawaItem interface)
# ---------------------------------------------------------------------------

class EvidenceCitation(TypedDict, total=False):
    type: str           # "quran" | "hadith" | "fatwa" | "tafsir"
    reference: str      # e.g. "Surah Al-Baqarah 2:183"
    url: str            # optional; must be from ALLOWED_SOURCE_HOSTS
    verified: bool


class FatawaItemDict(TypedDict, total=False):
    schema_version: int
    id: str
    title: str
    question_summary: str
    excerpt_or_summary: str
    summary_author: str
    category: str
    category_name_english: str
    category_name_arabic: str
    evidence_citations: List[EvidenceCitation]
    source_provider: str
    source_url: str
    source_reference: str
    scholar_or_author: str
    reviewer_name_or_org: str
    review_status: str
    differing_opinions_note: str
    language: str
    madhhab_or_scope: str
    license: str
    rights_basis: str
    published_at: str
    reviewed_at: str
    updated_at: str
    catalog_version: int
    content_version: int


# ---------------------------------------------------------------------------
# Catalog data
# ---------------------------------------------------------------------------

FATAWA_CATALOG: List[FatawaItemDict] = [
    # ── WORSHIP ─────────────────────────────────────────────────────────────
    {
        "schema_version": 1,
        "id": "islamqa-219",
        "title": "Is it permissible to pray with shoes on?",
        "question_summary": "Can a Muslim pray wearing shoes inside the masjid or outdoors?",
        "excerpt_or_summary": (
            "Praying with shoes on is permissible provided the shoes are pure (tahir) "
            "and free of impurity. The Prophet ﷺ prayed with his sandals on and encouraged "
            "Muslims to do so to distinguish themselves from the Jews. Shoes must be removed "
            "if impurity is detected. Inside a mosque, local customs and cleanliness concerns "
            "should be respected."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "worship",
        "category_name_english": "Worship (Ibadah)",
        "category_name_arabic": "العبادة",
        "evidence_citations": [
            {
                "type": "hadith",
                "reference": "Sunan Abi Dawud 650 — Prophet ﷺ prayed with sandals",
                "url": "https://sunnah.com/abudawud:650",
                "verified": True,
            },
            {
                "type": "hadith",
                "reference": "Sunan Abi Dawud 652 — Remove impurity from shoes by rubbing on earth",
                "url": "https://sunnah.com/abudawud:652",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/219/praying-in-shoes",
        "source_reference": "Fatwa #219",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",

        "review_status": "published",
        "reviewed_at": "2024-01-01",

        "language": "en",
        "madhhab_or_scope": "General (Majority view)",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    {
        "schema_version": 1,
        "id": "islamqa-9365",
        "title": "Ruling on praying Sunnah prayers in congregation",
        "question_summary": "Is it permissible to pray Sunnah (nawafil) prayers in congregation?",
        "excerpt_or_summary": (
            "The general principle is that Sunnah prayers are performed individually. "
            "However, scholars permit occasional congregation for Sunnah prayers if done "
            "infrequently, such as Tarawih, Qiyam al-Layl, and teaching-related prayers. "
            "Making it a regular habit of congregational Sunnah prayer without evidence is "
            "considered an innovation (bid'ah)."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "worship",
        "category_name_english": "Worship (Ibadah)",
        "category_name_arabic": "العبادة",
        "evidence_citations": [
            {
                "type": "hadith",
                "reference": "Sahih Bukhari 698 — Praying Sunnah prayers alone",
                "url": "https://sunnah.com/bukhari:698",
                "verified": True,
            },
            {
                "type": "hadith",
                "reference": "Sahih Bukhari 2010 — Tarawih in congregation",
                "url": "https://sunnah.com/bukhari:2010",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/9365/sunnah-prayers-in-congregation",
        "source_reference": "Fatwa #9365",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "language": "en",
        "madhhab_or_scope": "General",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    {
        "schema_version": 1,
        "id": "islamqa-37694",
        "title": "Ruling on fasting for a pregnant or breastfeeding woman",
        "question_summary": "Does a pregnant or nursing mother have to fast in Ramadan?",
        "excerpt_or_summary": (
            "Pregnant and breastfeeding women are permitted to break their fast in Ramadan "
            "if they fear harm to themselves or to their child. They must make up the missed "
            "days (qada) later. The majority of scholars hold that expiation (fidya — feeding "
            "a poor person for each missed day) is not required if they only fear for the "
            "child, while some scholars (Hanbali position) require both qada and fidya in "
            "that case."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "worship",
        "category_name_english": "Worship (Ibadah)",
        "category_name_arabic": "العبادة",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Baqarah 2:185 — Ease and hardship in fasting",
                "url": "https://quran.com/2/185",
                "verified": True,
            },
            {
                "type": "hadith",
                "reference": "Sunan Abi Dawud 2408 — Concession for the pregnant traveller",
                "url": "https://sunnah.com/abudawud:2408",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/37694/ruling-on-pregnant-breastfeeding-woman-fasting",
        "source_reference": "Fatwa #37694",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": (
            "Shafi'i and Maliki scholars: only qada required. Hanbali scholars: both qada and fidya if fear is for child only."
        ),
        "language": "en",
        "madhhab_or_scope": "General / Differing views",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    # ── AQEEDAH ─────────────────────────────────────────────────────────────
    {
        "schema_version": 1,
        "id": "islamqa-10236",
        "title": "What is the ruling on celebrating birthdays?",
        "question_summary": "Is it permissible for Muslims to celebrate birthdays?",
        "excerpt_or_summary": (
            "Celebrating birthdays is not established from the Quran or Sunnah, and was "
            "not practiced by the Companions. Many contemporary scholars consider it a "
            "prohibited innovation (bid'ah) if done with the intention of religious "
            "significance. However, a number of scholars permit a simple, modest gathering "
            "without religious connotation, provided it involves no prohibited acts such as "
            "mixing of the sexes, music, or extravagance."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "aqeedah",
        "category_name_english": "Aqeedah & Belief",
        "category_name_arabic": "العقيدة",
        "evidence_citations": [
            {
                "type": "hadith",
                "reference": "Sunan Abi Dawud 4607 — Every innovation is misguidance",
                "url": "https://sunnah.com/abudawud:4607",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/10236/ruling-on-celebrating-birthdays",
        "source_reference": "Fatwa #10236",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": "Some contemporary scholars permit simple family gatherings without religious intent.",
        "language": "en",
        "madhhab_or_scope": "General",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    {
        "schema_version": 1,
        "id": "islamqa-1507",
        "title": "Is music halal or haram in Islam?",
        "question_summary": "What is the Islamic ruling on listening to music?",
        "excerpt_or_summary": (
            "The majority of classical and contemporary scholars, including the four main "
            "madhahib, consider musical instruments (ma'azif) impermissible based on "
            "Quranic and Sunnah evidence. The permissibility exception covers the duff "
            "(hand drum) on Eids and weddings. Some contemporary scholars permit music "
            "that does not promote immorality and does not involve prohibited instruments. "
            "Muslims are advised to follow the ruling of trusted scholars in their community."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "aqeedah",
        "category_name_english": "Aqeedah & Belief",
        "category_name_arabic": "العقيدة",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Luqman 31:6 — Idle talk that leads astray",
                "url": "https://quran.com/31/6",
                "verified": True,
            },
            {
                "type": "hadith",
                "reference": "Sahih Bukhari 5590 — Those who permit silk, intoxicants and musical instruments",
                "url": "https://sunnah.com/bukhari:5590",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/5000/the-islamic-ruling-on-music",
        "source_reference": "Fatwa #5000",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": (
            "A minority of scholars permit music without immoral content. The duff is "
            "permitted by majority consensus on Eids and weddings."
        ),
        "language": "en",
        "madhhab_or_scope": "General / Majority",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    # ── FOOD & ETHICS ────────────────────────────────────────────────────────
    {
        "schema_version": 1,
        "id": "islamqa-6503",
        "title": "Ruling on eating meat slaughtered by Christians and Jews",
        "question_summary": "Is meat slaughtered by People of the Book (Christians/Jews) halal?",
        "excerpt_or_summary": (
            "The Quran explicitly permits the food (including meat) of the People of the "
            "Book (Ahl al-Kitab). Scholars hold that mechanically slaughtered meat where "
            "the name of Allah is not mentioned is contested — the Hanbali position "
            "requires Tasmiyah (saying Bismillah) to be pronounced over every animal. "
            "Most contemporary scholars recommend consuming certified halal meat where "
            "available, but do not prohibit all Western Christian/Jewish-slaughtered meat."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "food_ethics",
        "category_name_english": "Food & Ethics",
        "category_name_arabic": "الطعام والآداب",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Ma'idah 5:5 — Food of People of the Book is permitted",
                "url": "https://quran.com/5/5",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/6503/ruling-on-eating-meat-slaughtered-by-christians-and-jews",
        "source_reference": "Fatwa #6503",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": (
            "Stricter view: Tasmiyah must be pronounced by the slaughterer for validity. "
            "More lenient view: Quranic permission applies broadly to People of the Book."
        ),
        "language": "en",
        "madhhab_or_scope": "General / Differing views",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    {
        "schema_version": 1,
        "id": "islamqa-96533",
        "title": "Is it permissible to eat food that contains gelatin?",
        "question_summary": "What is the ruling on food products containing gelatin from pork or unknown sources?",
        "excerpt_or_summary": (
            "Gelatin derived from pork is haram (impermissible). Gelatin from cattle "
            "slaughtered in a non-Islamic manner is disputed. Fish-derived gelatin is "
            "permissible. Many contemporary scholars apply the principle of istihalah "
            "(transformation) — if the gelatin has undergone complete chemical transformation, "
            "some scholars permit it even from originally impure sources. Muslims are advised "
            "to choose halal-certified products when possible."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "food_ethics",
        "category_name_english": "Food & Ethics",
        "category_name_arabic": "الطعام والآداب",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Baqarah 2:173 — Prohibition of pork",
                "url": "https://quran.com/2/173",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/96533/gelatin-ruling",
        "source_reference": "Fatwa #96533",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": "Istihalah (complete transformation) principle is accepted by some scholars, rejected by others.",
        "language": "en",
        "madhhab_or_scope": "General",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    # ── TRANSACTIONS ─────────────────────────────────────────────────────────
    {
        "schema_version": 1,
        "id": "islamqa-2521",
        "title": "Ruling on taking out a bank loan with interest (riba)",
        "question_summary": "Is it permissible to take a bank mortgage or personal loan that involves interest?",
        "excerpt_or_summary": (
            "Riba (interest) is explicitly prohibited in the Quran and is one of the major "
            "sins in Islam. Taking an interest-bearing mortgage or loan is not permissible "
            "except in cases of dire necessity (darura), and scholars have strict conditions "
            "for what constitutes genuine necessity. Muslims are strongly encouraged to seek "
            "Islamic finance alternatives (murabaha, musharakah, ijara) where available."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "transactions",
        "category_name_english": "Business & Transactions",
        "category_name_arabic": "المعاملات",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Baqarah 2:275-279 — Prohibition of riba",
                "url": "https://quran.com/2/275",
                "verified": True,
            },
            {
                "type": "hadith",
                "reference": "Sahih Muslim 1598 — Curse upon the one who deals in riba",
                "url": "https://sunnah.com/muslim:1598",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/2521/ruling-on-interest-based-mortgage",
        "source_reference": "Fatwa #2521",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "language": "en",
        "madhhab_or_scope": "General / Unanimous prohibition",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    {
        "schema_version": 1,
        "id": "islamqa-21914",
        "title": "Ruling on working in a bank that deals with interest",
        "question_summary": "Is it permissible to work for a bank that charges or pays interest?",
        "excerpt_or_summary": (
            "Scholars agree it is impermissible to work in a role that directly involves "
            "writing, witnessing, or facilitating riba-based transactions — the Prophet ﷺ "
            "cursed all four parties of a riba contract. Working in a general administrative "
            "or unrelated role in a bank is more contested, with some scholars permitting it "
            "on grounds of necessity while others prohibit it entirely. Muslims should seek "
            "halal employment alternatives where possible."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "transactions",
        "category_name_english": "Business & Transactions",
        "category_name_arabic": "المعاملات",
        "evidence_citations": [
            {
                "type": "hadith",
                "reference": "Sahih Muslim 1598 — All parties of riba transaction are cursed",
                "url": "https://sunnah.com/muslim:1598",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/21914/working-in-a-bank",
        "source_reference": "Fatwa #21914",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": "Some scholars permit admin roles; direct riba facilitation is unanimously prohibited.",
        "language": "en",
        "madhhab_or_scope": "General",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    # ── FAMILY ───────────────────────────────────────────────────────────────
    {
        "schema_version": 1,
        "id": "islamqa-2127",
        "title": "Ruling on marriage to a non-Muslim woman",
        "question_summary": "Can a Muslim man marry a Christian or Jewish woman (Ahl al-Kitab)?",
        "excerpt_or_summary": (
            "The Quran permits Muslim men to marry chaste women from the People of the Book "
            "(Christians and Jews). However, scholars note this permission comes with "
            "considerations: her religion should not adversely affect the children's Islamic "
            "upbringing, and a Muslim woman may never marry a non-Muslim man. Many scholars "
            "strongly discourage inter-faith marriage in non-Muslim societies due to the risks "
            "to Islamic family values and the children's faith."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "family",
        "category_name_english": "Family & Marriage",
        "category_name_arabic": "الأسرة والزواج",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Ma'idah 5:5 — Chaste women from People of the Book",
                "url": "https://quran.com/5/5",
                "verified": True,
            },
            {
                "type": "quran",
                "reference": "Surah Al-Baqarah 2:221 — Do not marry polytheists",
                "url": "https://quran.com/2/221",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/2127/marriage-to-non-muslim-woman",
        "source_reference": "Fatwa #2127",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": (
            "Some scholars consider it makruh (disliked) in non-Muslim countries due to risk "
            "of the children not being raised Muslim."
        ),
        "language": "en",
        "madhhab_or_scope": "General / Majority",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    {
        "schema_version": 1,
        "id": "islamqa-9465",
        "title": "Conditions and rulings on Islamic divorce (Talaq)",
        "question_summary": "What are the Islamic rulings on talaq (divorce) and how does it work?",
        "excerpt_or_summary": (
            "Talaq is the husband's right to pronounce divorce, but it must meet strict "
            "conditions. It should be pronounced once during a period of purity (tuhr) "
            "when the husband has not had intercourse. Triple talaq in one sitting is "
            "considered a prohibited innovation by many scholars and is valid as one talaq "
            "in the Hanbali and some other views. After a single talaq, there is an 'iddah "
            "(waiting period) during which the couple may reconcile. After three talaqs, "
            "remarriage requires an independent marriage (muhallil is prohibited)."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "family",
        "category_name_english": "Family & Marriage",
        "category_name_arabic": "الأسرة والزواج",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Baqarah 2:229-230 — Talaq rulings",
                "url": "https://quran.com/2/229",
                "verified": True,
            },
            {
                "type": "quran",
                "reference": "Surah At-Talaq 65:1 — Divorce during purity period",
                "url": "https://quran.com/65/1",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/9465/conditions-and-rulings-on-talaq",
        "source_reference": "Fatwa #9465",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": (
            "Triple talaq in one sitting: Majority view holds it counts as three; Hanbali and "
            "many contemporary scholars hold it counts as one."
        ),
        "language": "en",
        "madhhab_or_scope": "General / Differing views",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    # ── CONTEMPORARY ─────────────────────────────────────────────────────────
    {
        "schema_version": 1,
        "id": "islamqa-163498",
        "title": "Ruling on cryptocurrency trading (Bitcoin etc.)",
        "question_summary": "Is investing in or trading cryptocurrency such as Bitcoin permissible in Islam?",
        "excerpt_or_summary": (
            "Scholars are divided on the permissibility of cryptocurrency. Those who "
            "permit it argue that Bitcoin and similar currencies can function as a "
            "medium of exchange and store of value, similar to gold or commodity money. "
            "Those who prohibit it cite gharar (excessive uncertainty), maysir "
            "(gambling-like speculation), use in illegal transactions, and lack of "
            "intrinsic value. The consensus position is still evolving. Muslims should "
            "exercise extreme caution, avoid highly speculative trading, and consult a "
            "trusted scholar."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "contemporary",
        "category_name_english": "Contemporary Issues",
        "category_name_arabic": "القضايا المعاصرة",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Ma'idah 5:90 — Prohibition of maysir (gambling)",
                "url": "https://quran.com/5/90",
                "verified": True,
            },
            {
                "type": "hadith",
                "reference": "Sunan Abi Dawud 3376 — Prohibition of gharar transactions",
                "url": "https://sunnah.com/abudawud:3376",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/163498/ruling-on-cryptocurrency",
        "source_reference": "Fatwa #163498",
        "scholar_or_author": "Various Contemporary Scholars",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": (
            "Permissive view (e.g. some Saudi scholars): permissible as a medium of exchange. "
            "Prohibitive view: highly speculative nature makes it akin to gambling."
        ),
        "language": "en",
        "madhhab_or_scope": "Contemporary / Differing views",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
    {
        "schema_version": 1,
        "id": "islamqa-49016",
        "title": "Is it permissible to take out insurance policies?",
        "question_summary": "What is the Islamic ruling on commercial insurance (health, car, home)?",
        "excerpt_or_summary": (
            "Commercial insurance as practiced today is considered impermissible by the "
            "majority of scholars due to elements of riba (interest), gharar (uncertainty), "
            "and maysir (gambling). The permissible alternative is Takaful — a cooperative "
            "Islamic insurance scheme based on mutual contribution and shared risk. Where "
            "insurance is compulsory by law (e.g. car insurance), many scholars permit "
            "compliance to the legal minimum while considering the Islamic alternative."
        ),
        "summary_author": "Islamic Hikmah Editorial Team",
        "category": "contemporary",
        "category_name_english": "Contemporary Issues",
        "category_name_arabic": "القضايا المعاصرة",
        "evidence_citations": [
            {
                "type": "quran",
                "reference": "Surah Al-Ma'idah 5:90 — Prohibition of maysir",
                "url": "https://quran.com/5/90",
                "verified": True,
            },
        ],
        "source_provider": "IslamQA.info",
        "source_url": "https://islamqa.info/en/answers/49016/ruling-on-insurance",
        "source_reference": "Fatwa #49016",
        "scholar_or_author": "Sheikh Muhammad Salih Al-Munajjid",
        "reviewer_name_or_org": "Islamic Hikmah Editorial Team",
        "review_status": "published",
        "reviewed_at": "2024-01-01",
        "differing_opinions_note": "Compulsory government-mandated insurance (e.g. car insurance) is permitted by many scholars.",
        "language": "en",
        "madhhab_or_scope": "General / Majority",
        "license": "original_islamic_hikmah_summary",
        "rights_basis": "Original summary authored by Islamic Hikmah team; canonical link provided to IslamQA.info",
        "published_at": "2024-01-01",
        "catalog_version": 1,
        "content_version": 1,
    },
]

# ---------------------------------------------------------------------------
# Category metadata (used by /api/fatawa/categories endpoint)
# ---------------------------------------------------------------------------

CATEGORIES = [
    {
        "id": "worship",
        "name_english": "Worship (Ibadah)",
        "name_arabic": "العبادة",
        "icon": "hands-pray",
        "description": "Salah, Sawm, Zakat, Hajj, and acts of devotion",
        "count": sum(1 for f in FATAWA_CATALOG if f.get("category") == "worship"),
    },
    {
        "id": "aqeedah",
        "name_english": "Aqeedah & Belief",
        "name_arabic": "العقيدة",
        "icon": "star-crescent",
        "description": "Islamic creed, belief, and foundational tenets",
        "count": sum(1 for f in FATAWA_CATALOG if f.get("category") == "aqeedah"),
    },
    {
        "id": "family",
        "name_english": "Family & Marriage",
        "name_arabic": "الأسرة والزواج",
        "icon": "home-heart",
        "description": "Marriage, divorce, parenting, and family relations",
        "count": sum(1 for f in FATAWA_CATALOG if f.get("category") == "family"),
    },
    {
        "id": "transactions",
        "name_english": "Business & Transactions",
        "name_arabic": "المعاملات",
        "icon": "bank",
        "description": "Halal finance, trade, contracts, and riba rulings",
        "count": sum(1 for f in FATAWA_CATALOG if f.get("category") == "transactions"),
    },
    {
        "id": "food_ethics",
        "name_english": "Food & Ethics",
        "name_arabic": "الطعام والآداب",
        "icon": "food-halal",
        "description": "Halal/haram foods, etiquette, and daily life ethics",
        "count": sum(1 for f in FATAWA_CATALOG if f.get("category") == "food_ethics"),
    },
    {
        "id": "contemporary",
        "name_english": "Contemporary Issues",
        "name_arabic": "القضايا المعاصرة",
        "icon": "lightning-bolt",
        "description": "Modern finance, technology, and current affairs",
        "count": sum(1 for f in FATAWA_CATALOG if f.get("category") == "contemporary"),
    },
]
