#!/usr/bin/env python3
"""Reproducible, private source extraction for the Tala Hagras portfolio site.

Usage:
    python3 -I scripts/extract_sources.py --archive <path-to-zip> --out sources

Everything this script writes is PRIVATE working material and must stay
outside public/. Curated web derivatives are produced separately by
scripts/build_media.py from data/source-manifest.json.

Outputs under <out>/:
    raw/                      safely extracted archive contents (untouched originals)
    derived/inventory.json    file hashes, PDF metadata, page sizes, image/annotation inventory
    derived/text/<doc>.txt    full text with "=== PAGE n ===" physical page markers
    derived/text/<doc>/page-NN.txt and page-NN.blocks.json (text + image blocks with bboxes)
    derived/pages/<doc>/page-NN.png   page renders at --dpi (default 150)
    derived/contact/<doc>-sheet-N.png contact sheets for visual inspection
    derived/images/<doc>/pNN-xNNN-WxH.ext embedded raster images (deduplicated by hash)
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import zipfile
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

MAX_TOTAL_UNCOMPRESSED = 2 * 1024 * 1024 * 1024  # 2 GiB guard against zip bombs
MIN_IMAGE_PIXELS = 64 * 64


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def safe_extract(archive: Path, dest: Path) -> list[Path]:
    """Extract a zip without path traversal, symlinks or absolute paths."""
    dest = dest.resolve()
    dest.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    total = 0
    with zipfile.ZipFile(archive) as zf:
        for info in zf.infolist():
            name = info.filename
            if info.is_dir():
                continue
            # Reject symlinks (unix mode in high 16 bits of external_attr)
            mode = (info.external_attr >> 16) & 0o170000
            if mode == 0o120000:
                print(f"skip symlink entry: {name}", file=sys.stderr)
                continue
            norm = os.path.normpath(name)
            if norm.startswith(("/", "\\")) or norm.split(os.sep)[0] == ".." or re.match(r"^[A-Za-z]:", norm):
                print(f"skip unsafe entry: {name}", file=sys.stderr)
                continue
            target = (dest / norm).resolve()
            if dest not in target.parents and target != dest:
                print(f"skip traversal entry: {name}", file=sys.stderr)
                continue
            total += info.file_size
            if total > MAX_TOTAL_UNCOMPRESSED:
                raise RuntimeError("archive exceeds uncompressed size guard")
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(info) as src, target.open("wb") as out:
                while True:
                    chunk = src.read(1 << 20)
                    if not chunk:
                        break
                    out.write(chunk)
            written.append(target)
    return written


def doc_slug(path: Path) -> str:
    stem = path.stem.lower()
    if "portfolio" in stem:
        return "portfolio"
    if "dissertation" in stem:
        return "dissertation"
    return re.sub(r"[^a-z0-9]+", "-", stem).strip("-") or "doc"


def label_font(size: int):
    for candidate in ("/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf"):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def contact_sheets(page_pngs: list[Path], out_dir: Path, slug: str, cols: int = 4, thumb_w: int = 420, per_sheet: int = 16) -> list[str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    sheets: list[str] = []
    font = label_font(22)
    for s in range(0, len(page_pngs), per_sheet):
        batch = page_pngs[s : s + per_sheet]
        thumbs = []
        for p in batch:
            im = Image.open(p).convert("RGB")
            ratio = thumb_w / im.width
            im = im.resize((thumb_w, max(1, int(im.height * ratio))), Image.LANCZOS)
            thumbs.append((p, im))
        row_h = max(im.height for _, im in thumbs) + 40
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (thumb_w + 20) + 20, rows * row_h + 20), "#d9d9d9")
        draw = ImageDraw.Draw(sheet)
        for i, (p, im) in enumerate(thumbs):
            r, c = divmod(i, cols)
            x = 20 + c * (thumb_w + 20)
            y = 20 + r * row_h
            sheet.paste(im, (x, y + 30))
            page_no = int(re.search(r"page-(\d+)", p.name).group(1))
            draw.text((x, y + 2), f"p{page_no}", fill="#111", font=font)
        name = f"{slug}-sheet-{s // per_sheet + 1}.png"
        sheet.save(out_dir / name, optimize=True)
        sheets.append(name)
    return sheets


def extract_images(doc: fitz.Document, slug: str, out_dir: Path, seen_hashes: dict[str, str]) -> list[dict]:
    out_dir.mkdir(parents=True, exist_ok=True)
    records: list[dict] = []
    for pno in range(doc.page_count):
        page = doc[pno]
        for img in page.get_images(full=True):
            xref, smask = img[0], img[1]
            width, height = img[2], img[3]
            rec = {
                "page": pno + 1,
                "xref": xref,
                "smask": smask,
                "width": width,
                "height": height,
                "colorspace": img[5],
                "bpc": img[4],
                "filter": img[8] if len(img) > 8 else None,
                "placements": [list(map(lambda v: round(v, 2), r)) for r in page.get_image_rects(xref)],
            }
            if width * height < MIN_IMAGE_PIXELS:
                rec["skipped"] = "tiny"
                records.append(rec)
                continue
            try:
                base = doc.extract_image(xref)
                data = base["image"]
                digest = hashlib.sha256(data).hexdigest()
                rec["sha256"] = digest
                if digest in seen_hashes:
                    rec["duplicate_of"] = seen_hashes[digest]
                    records.append(rec)
                    continue
                ext = base.get("ext", "png")
                filename = f"p{pno + 1:02d}-x{xref}-{width}x{height}.{ext}"
                if smask:
                    pix = fitz.Pixmap(doc, xref)
                    mask = fitz.Pixmap(doc, smask)
                    if pix.n - pix.alpha >= 4:
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    pix = fitz.Pixmap(pix, mask)
                    filename = f"p{pno + 1:02d}-x{xref}-{width}x{height}.png"
                    pix.save(out_dir / filename)
                elif base.get("colorspace", 3) >= 4 or ext in ("jb2", "jpx"):
                    pix = fitz.Pixmap(doc, xref)
                    if pix.n - pix.alpha >= 4:
                        pix = fitz.Pixmap(fitz.csRGB, pix)
                    filename = f"p{pno + 1:02d}-x{xref}-{width}x{height}.png"
                    pix.save(out_dir / filename)
                else:
                    (out_dir / filename).write_bytes(data)
                rec["file"] = f"images/{slug}/{filename}"
                seen_hashes[digest] = rec["file"]
            except Exception as exc:  # noqa: BLE001 - keep inventory going
                rec["error"] = str(exc)
            records.append(rec)
    return records


def inventory_pdf(pdf: Path, slug: str, derived: Path, dpi: int) -> dict:
    doc = fitz.open(pdf)
    text_dir = derived / "text" / slug
    pages_dir = derived / "pages" / slug
    text_dir.mkdir(parents=True, exist_ok=True)
    pages_dir.mkdir(parents=True, exist_ok=True)
    full_text: list[str] = []
    pages: list[dict] = []
    page_pngs: list[Path] = []
    for pno in range(doc.page_count):
        page = doc[pno]
        n = pno + 1
        text = page.get_text("text")
        (text_dir / f"page-{n:02d}.txt").write_text(text, encoding="utf-8")
        full_text.append(f"=== PAGE {n} ===\n{text}\n")
        blocks = [
            {"bbox": [round(v, 2) for v in b[:4]], "type": "image" if b[6] == 1 else "text", "text": b[4] if b[6] == 0 else None}
            for b in page.get_text("blocks")
        ]
        (text_dir / f"page-{n:02d}.blocks.json").write_text(json.dumps(blocks, indent=1), encoding="utf-8")
        pix = page.get_pixmap(dpi=dpi, alpha=False)
        png = pages_dir / f"page-{n:02d}.png"
        pix.save(png)
        page_pngs.append(png)
        annots = []
        for a in page.annots() or []:
            annots.append({"type": a.type[1], "rect": [round(v, 2) for v in a.rect]})
        try:
            drawing_count = len(page.get_cdrawings())
        except Exception:  # noqa: BLE001
            drawing_count = None
        pages.append(
            {
                "page": n,
                "width_pt": round(page.rect.width, 2),
                "height_pt": round(page.rect.height, 2),
                "rotation": page.rotation,
                "render_px": [pix.width, pix.height],
                "text_chars": len(text),
                "image_count": len(page.get_images(full=True)),
                "vector_drawing_count": drawing_count,
                "annotations": annots,
                "links": len(page.get_links()),
            }
        )
    (derived / "text" / f"{slug}.txt").write_text("".join(full_text), encoding="utf-8")
    embedded_files = [doc.embfile_info(i) for i in range(doc.embfile_count())]
    meta = doc.metadata or {}
    record = {
        "slug": slug,
        "file": str(pdf.name),
        "sha256": sha256_file(pdf),
        "bytes": pdf.stat().st_size,
        "page_count": doc.page_count,
        "metadata": meta,
        "is_pdf_a_or_x": doc.xref_xml_metadata() > 0,
        "embedded_files": embedded_files,
        "has_3d_annotations": any(a["type"] == "3D" for p in pages for a in p["annotations"]),
        "pages": pages,
        "contact_sheets": contact_sheets(page_pngs, derived / "contact", slug),
    }
    record["images"] = extract_images(doc, slug, derived / "images" / slug, seen_hashes={})
    doc.close()
    return record


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--dpi", type=int, default=150)
    args = ap.parse_args()

    args.out = args.out.resolve()
    raw = args.out / "raw"
    derived = args.out / "derived"
    derived.mkdir(parents=True, exist_ok=True)
    files = safe_extract(args.archive, raw)
    inventory = {
        "archive": {"file": args.archive.name, "sha256": sha256_file(args.archive), "bytes": args.archive.stat().st_size},
        "extracted": [],
        "documents": [],
        "render_dpi": args.dpi,
        "note": "Private working inventory. Physical one-based page numbers. Nothing here is served from public/.",
    }
    for f in files:
        inventory["extracted"].append({"file": str(f.relative_to(args.out)), "bytes": f.stat().st_size, "sha256": sha256_file(f)})
        if f.suffix.lower() == ".pdf":
            print(f"inventory {f.name}", file=sys.stderr)
            inventory["documents"].append(inventory_pdf(f, doc_slug(f), derived, args.dpi))
    (derived / "inventory.json").write_text(json.dumps(inventory, indent=1), encoding="utf-8")
    print(json.dumps({d["slug"]: {"pages": d["page_count"], "images": len(d["images"]), "sheets": d["contact_sheets"]} for d in inventory["documents"]}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
