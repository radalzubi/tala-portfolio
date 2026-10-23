#!/usr/bin/env python3
"""Create the public reading edition of the dissertation: main text and bibliography only.

Usage: python3 -I scripts/make_research_excerpt.py
Takes physical pages 1-28 of the dissertation (title, abstract, contents, chapters, bibliography,
figure references). Pages 29-48 (appendices: ethics forms, consent forms, interview transcripts)
are excluded. The script then scans the exported text for e-mail addresses, phone numbers and
signature lines and refuses to write the file if any are found.
"""
from __future__ import annotations

import glob
import re
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
SRC = sorted(glob.glob(str(ROOT / "sources" / "raw" / "*Dissertation*.pdf")))
OUT_DIR = ROOT / "public" / "downloads"
OUT = OUT_DIR / "Tala-Hagras-Homogenisation-of-Cairos-Urban-Horizons-reading-edition.pdf"
LAST_PAGE = 28  # inclusive, physical

if not SRC:
    print("source dissertation not found under sources/raw", file=sys.stderr)
    sys.exit(1)

doc = fitz.open(SRC[0])
excerpt = fitz.open()
excerpt.insert_pdf(doc, from_page=0, to_page=LAST_PAGE - 1)
excerpt.set_metadata(
    {
        "title": "Homogenisation of Cairo's Urban Horizons — reading edition (main text and bibliography)",
        "author": "Tala Hagras",
        "subject": "Cultural Identity, Lived Experience, and Contemporary Urban Practice. Reading edition: appendices omitted.",
        "creator": "scripts/make_research_excerpt.py",
    }
)
text = "\n".join(p.get_text() for p in excerpt)
problems = []
for label, pattern in {
    "email": r"[\w.+-]+@[\w-]+\.[\w.-]+",
    "phone": r"(?<!\d)\+?\d{2,4}[ ().-]?\d{3,4}[ ().-]?\d{3,5}(?!\d)",
    "signature": r"\bSignature\b",
}.items():
    for m in re.finditer(pattern, text):
        if label == "phone" and (sum(c.isdigit() for c in m.group(0)) < 9 or not any(c in " ().-+" for c in m.group(0))):
            continue  # ISBNs and URL ids are unseparated digit runs, not phone numbers
        problems.append((label, m.group(0)))
if problems:
    print("refusing to write: personal data patterns found", problems[:10], file=sys.stderr)
    sys.exit(2)
OUT_DIR.mkdir(parents=True, exist_ok=True)
excerpt.save(OUT, garbage=4, deflate=True)
print(f"wrote {OUT.relative_to(ROOT)}: {excerpt.page_count} pages, {OUT.stat().st_size // 1024} KB")
print("first line:", text.strip().splitlines()[0])
