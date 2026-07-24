"""Import the user-supplied, prophet-specific PDFs into the app's text reader.

The PDFs are deliberately used one-for-one, so content from one prophet cannot
spill into the next entry in the UI.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader


PDF_DIR = Path(r"C:/Users/smuha/Downloads/Document Cloud/Document Cloud")
DATA_FILE = Path("src/data/prophets.ts")

PDF_BY_ID = {
    "adam": "Prophet Adam.pdf",
    "idris": "Prophet Idris.pdf",
    "nuh": "Prophet Nuh.pdf",
    "hud": "Prophet hud.pdf",
    "salih": "Prophet salih.pdf",
    "ibrahim": "Prophet ibrahim.pdf",
    "ismail": "Prophet isma'il.pdf",
    "ishaq": "Prophet ishaq.pdf",
    "yaqub": "Prophet yaqub.pdf",
    "lut": "Prophet lot.pdf",
    "shuaib": "Prophet shuiab.pdf",
    "yusuf": "Prophet yusuf.pdf",
    "ayyub": "Prophet ayoub.pdf",
    "dhul-kifl": "Prophet dhul-kifl.pdf",
    "yunus": "Prophet yunus.pdf",
    "musa": "Prophet musa & harun.pdf",
    "hizqeel": "Prophet hizqeel.pdf",
    "elyas": "Prophet elyas.pdf",
    "shammil": "Prophet Shammil (Samuel).pdf",
    "dawud": "Prophet dawud.pdf",
    "sulaiman": "Prophet sulaiman.pdf",
    "shia": "Prophet shia.pdf",
    "aramaya": "Prophet aramaya.pdf",
    "daniel": "Prophet daniel.pdf",
    "uzair": "Prophet uzair.pdf",
    "zakariyah": "Prophet zakariyah.pdf",
    "yahya": "Prophet yahya.pdf",
    "isa": "Prophet isa.pdf",
    "muhammad": "Prophet Muhammad.pdf",
}


def looks_like_heading(line: str) -> bool:
    words = re.findall(r"[A-Za-z]+", line)
    title_case_ratio = (
        sum(word[0].isupper() for word in words if len(word) > 2)
        / max(sum(len(word) > 2 for word in words), 1)
    )
    return (
        len(line) < 105
        and len(line.split()) <= 10
        and bool(re.match(r"[A-Z]", line))
        and title_case_ratio >= 0.7
        and not re.search(r"[.!?:,;\"']$", line)
    )


def source_paragraphs(pdf_path: Path) -> list[str]:
    pages = [page.extract_text() or "" for page in PdfReader(str(pdf_path)).pages]
    lines = [re.sub(r"\s+", " ", line).strip() for line in "\n".join(pages).splitlines()]
    lines = [line for line in lines if line and not re.fullmatch(r"www\.islam ?basics\.com", line, re.IGNORECASE)]

    blocks: list[str] = []
    current: list[str] = []

    def flush() -> None:
        if current:
            blocks.append(" ".join(current))
            current.clear()

    for line in lines:
        # In the supplied PDFs, section titles occupy their own short line.
        if looks_like_heading(line):
            flush()
            blocks.append(line)
            continue

        current.append(line)
        if len(" ".join(current)) >= 90 and re.search(r"[.!?\")']$", line):
            flush()

    flush()
    if pdf_path.name.casefold() == "prophet adam.pdf":
        # The Adam PDF begins with the book's cover and all-29-prophet contents page.
        # The reader must begin at the actual Adam chapter, not that front matter.
        first_story_block = next(
            (index for index, block in enumerate(blocks) if block.casefold() == "prophet adam"),
            None,
        )
        if first_story_block is None:
            raise ValueError("Could not find the Prophet Adam chapter after the contents page")
        return blocks[first_story_block:]
    return blocks


def tagged_content(paragraphs: list[str]) -> list[str]:
    tagged: list[str] = []
    for paragraph in paragraphs:
        # Preserve visible section titles while keeping prose and quotations readable.
        is_heading = looks_like_heading(paragraph)
        is_quran = bool(re.search(r"\(Ch\.?\s*\d+[:.]\d+.*Quran\)", paragraph, re.IGNORECASE))
        prefix = "HEADING:" if is_heading else "QURAN:" if is_quran else "TEXT:"
        tagged.append(prefix + paragraph)
    return tagged


def content_range(source: str, story_id: str) -> tuple[int, int]:
    id_match = re.search(rf'"id": "{re.escape(story_id)}"', source)
    if not id_match:
        raise ValueError(f"Missing story id: {story_id}")
    start = source.find('"content": [', id_match.end())
    if start < 0:
        raise ValueError(f"Missing content for: {story_id}")
    array_start = source.find("[", start)
    depth, in_string, escaped = 0, False, False
    for position in range(array_start, len(source)):
        char = source[position]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
        elif char == '"':
            in_string = True
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                return array_start, position + 1
    raise ValueError(f"Unclosed content array: {story_id}")


def main() -> None:
    source = DATA_FILE.read_text(encoding="utf-8")
    replacements: list[tuple[int, int, str]] = []
    for story_id, filename in PDF_BY_ID.items():
        paragraphs = tagged_content(source_paragraphs(PDF_DIR / filename))
        if not paragraphs:
            raise ValueError(f"No extractable text in {filename}")
        start, end = content_range(source, story_id)
        body = json.dumps(paragraphs, ensure_ascii=False, indent=6)
        replacements.append((start, end, "[\n      " + body[1:-1] + "\n    ]"))
        print(f"{story_id:12} {len(paragraphs):4} blocks  {sum(map(len, paragraphs)):6} chars")

    for start, end, replacement in sorted(replacements, reverse=True):
        source = source[:start] + replacement + source[end:]
    DATA_FILE.write_text(source, encoding="utf-8")


if __name__ == "__main__":
    main()
