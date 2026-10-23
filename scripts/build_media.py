#!/usr/bin/env python3
"""Build public web derivatives from data/source-manifest.json.

Usage:  python3 -I scripts/build_media.py            (from the project root)

Reads   data/source-manifest.json   (asset provenance: source page/xref, crop, captions, credits)
Writes  public/media/<id>-<width>.{jpg,webp}         (never upscaled beyond the native/crop size)
        src/content/media.generated.json             (public fields only — no private source paths)
        data/media-build-log.json                    (private: hashes, crop boxes, transform history)

Manifest asset fields:
  id, kind, provenance, alt, caption, credit, source{file,page,xref|figure}, crop[x0,y0,x1,y1] (0-1),
  sourcePath (alternative to xref; relative to project root, e.g. data/posters/x.png),
  widths (default [480, 960, 1600]), quality, rightsNote, tone (auto if absent)
"""
from __future__ import annotations

import base64
import glob
import hashlib
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "data" / "source-manifest.json"
PUBLIC = ROOT / "public" / "media"
GENERATED = ROOT / "src" / "content" / "media.generated.json"
LOG = ROOT / "data" / "media-build-log.json"
IMAGES = ROOT / "sources" / "derived" / "images"
DEFAULT_WIDTHS = [480, 960, 1600]


def find_source(asset: dict) -> Path:
    if asset.get("sourcePath"):
        p = ROOT / asset["sourcePath"]
        if not p.exists():
            raise FileNotFoundError(p)
        return p
    src = asset["source"]
    pattern = str(IMAGES / src["file"] / f"p{src['page']:02d}-x{src['xref']}-*")
    matches = sorted(glob.glob(pattern))
    if not matches:
        raise FileNotFoundError(f"no extracted image for {asset['id']} ({pattern})")
    return Path(matches[0])


def average_tone(im: Image.Image) -> str:
    small = im.convert("RGB").resize((8, 8), Image.BOX)
    px = list(small.get_flattened_data()) if hasattr(small, "get_flattened_data") else list(small.getdata())
    r = sum(p[0] for p in px) // len(px)
    g = sum(p[1] for p in px) // len(px)
    b = sum(p[2] for p in px) // len(px)
    return f"#{r:02x}{g:02x}{b:02x}"


def placeholder(im: Image.Image) -> str:
    tiny = im.convert("RGB").copy()
    tiny.thumbnail((24, 24), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, "JPEG", quality=40, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def build_asset(asset: dict) -> tuple[dict, dict]:
    src_path = find_source(asset)
    raw = src_path.read_bytes()
    im = Image.open(io.BytesIO(raw))
    im = ImageOps.exif_transpose(im)
    native_w, native_h = im.size
    history = ["decode"]
    crop = asset.get("crop")
    if crop:
        x0, y0, x1, y1 = crop
        box = (round(x0 * native_w), round(y0 * native_h), round(x1 * native_w), round(y1 * native_h))
        im = im.crop(box)
        history.append(f"crop{box}")
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGB")
    has_alpha = im.mode == "RGBA" and im.getextrema()[3][0] < 255
    w, h = im.size
    widths = sorted(set(min(x, w) for x in asset.get("widths", DEFAULT_WIDTHS)))
    if w not in widths and w <= max(asset.get("widths", DEFAULT_WIDTHS)):
        widths.append(w)
    widths = sorted(set(widths))
    quality = asset.get("quality", 82)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    variants = []
    for target_w in widths:
        scale = target_w / w
        target_h = max(1, round(h * scale))
        out = im if target_w == w else im.resize((target_w, target_h), Image.LANCZOS)
        history.append(f"resize{(target_w, target_h)}")
        if has_alpha:
            fn = PUBLIC / f"{asset['id']}-{target_w}.png"
            out.save(fn, "PNG", optimize=True)
            variants.append({"src": f"/media/{fn.name}", "width": target_w, "height": target_h, "format": "png"})
        else:
            fn = PUBLIC / f"{asset['id']}-{target_w}.jpg"
            out.convert("RGB").save(fn, "JPEG", quality=quality, optimize=True, progressive=True)
            variants.append({"src": f"/media/{fn.name}", "width": target_w, "height": target_h, "format": "jpg"})
        fn_webp = PUBLIC / f"{asset['id']}-{target_w}.webp"
        out.save(fn_webp, "WEBP", quality=quality - 2, method=6)
        variants.append({"src": f"/media/{fn_webp.name}", "width": target_w, "height": target_h, "format": "webp"})
    public = {
        "id": asset["id"],
        "alt": asset["alt"],
        "caption": asset["caption"],
        "credit": asset["credit"],
        "provenance": asset["provenance"],
        "kind": asset["kind"],
        "source": {k: v for k, v in asset["source"].items() if k in ("file", "page", "figure", "note")},
        "native": [w, h],
        "lowResolution": w < 700,
        "variants": variants,
        "placeholder": placeholder(im),
        "tone": asset.get("tone") or average_tone(im),
    }
    if asset.get("rightsNote"):
        public["rightsNote"] = asset["rightsNote"]
    private = {
        "id": asset["id"],
        "sourceFile": str(src_path.relative_to(ROOT)),
        "sourceSha256": hashlib.sha256(raw).hexdigest(),
        "nativeSize": [native_w, native_h],
        "crop": crop,
        "history": history,
        "outputs": [v["src"] for v in variants],
    }
    return public, private


def main() -> int:
    manifest = json.loads(MANIFEST.read_text())
    generated: dict[str, dict] = {}
    log: list[dict] = []
    errors = 0
    for asset in manifest["assets"]:
        try:
            public, private = build_asset(asset)
            generated[asset["id"]] = public
            log.append(private)
            print(f"ok   {asset['id']}  {public['native'][0]}x{public['native'][1]}  {len(public['variants'])} variants")
        except Exception as exc:  # noqa: BLE001
            errors += 1
            print(f"FAIL {asset.get('id')}: {exc}", file=sys.stderr)
    GENERATED.write_text(json.dumps(generated, indent=1, ensure_ascii=False), encoding="utf-8")
    LOG.write_text(json.dumps({"assets": log}, indent=1), encoding="utf-8")
    print(f"{len(generated)} assets built, {errors} errors -> {GENERATED.relative_to(ROOT)}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
