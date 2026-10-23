# Assets and provenance

Every public image traces to a source file and a one-based physical PDF page through
`data/source-manifest.json`. The pipeline is reproducible:

```
Portfolios_Rough_Draft.zip
  └─ scripts/extract_sources.py ──▶ sources/raw (originals)            private, git-ignored
                                     sources/derived/inventory.json     private
                                     sources/derived/images/<doc>/pNN-xNNN-WxH.ext
                                     sources/derived/pages, contact, text
  └─ forensics workflow ───────────▶ sources/derived/notes/forensics/*.json   private
data/source-manifest.json ──▶ scripts/build_media.py ──▶ public/media/<id>-<w>.{jpg,webp}
                                                         src/content/media.generated.json  (public fields only)
                                                         data/media-build-log.json         (hashes, crops, history)
```

## Manifest record

| Field | Meaning |
| --- | --- |
| `id` | Stable asset id used by content records (`mp-` Maison Peplum, `mi-` music institution, `cx-` Cairo dissertation, `id-` identity pages). |
| `kind` | render, drawing, plan, section, axonometric, detail-drawing, model-photo, site-photo, collage, diagram, poster. |
| `provenance` | `original` (supplied artwork shown whole), `derivative` (a crop of supplied artwork), `interpretive-3d` (poster of a reconstruction), `concept-visualisation` (made only from a written description), `third-party` (never built). |
| `source` | `{ file, page, xref, figure?, note? }` — the embedded image is addressed by its PDF object number so the derivative is reproducible. `sourcePath` (relative to the project root) replaces `xref` for files that are not embedded in the PDFs, such as captured 3D posters. |
| `crop` | Normalised `[x0, y0, x1, y1]` on the embedded image; omitted when the whole image is used. |
| `widths` | Output widths; never larger than the source or crop. |
| `quality` | JPEG quality (WebP uses quality − 4). Default 74. |
| `alt`, `caption`, `credit` | Public text, British English, no production notes. |
| `rightsNote` | Shown with the image when it contains anything not drawn or made by Tala. |

`build_media.py` records the native size, the crop box, the SHA-256 of the source image and the output
list in `data/media-build-log.json`, and flags `lowResolution` on every asset narrower than 700 px so the
UI caps its display size.

## Publication decisions from the forensics pass

- **Dissertation figures 1–9 and 11** are drawn by Tala Hagras (figure references, dissertation p.28)
  and are published; several are trimmed of blank margins. **Figure 10** is a third-party photograph
  (Seed, El. (2016), via The Telegraph) and is cited in text only.
- **Figure 7** is a stacked composite of two drawings and is published as two assets (`cx-fig-07a`,
  `cx-fig-07b`).
- **Portfolio p.1–2** thumbnails duplicate larger images elsewhere; the day render of Maison Peplum on
  p.2 (372 px) is the largest copy in the archive and is used in place of the p.8 placement (358 px).
- **Portfolio p.3 concept board** contains a torn-paper vignette (pianist and dancers) and a score
  fragment of unstated authorship; only the exploded sketch and the flow-line motif are published.
- **Portfolio p.4 site analysis collage** is Tala’s composition but embeds site photographs (graffiti
  walls, weir, pedestrians) with no stated authorship; it is published as a crop with a rights note and
  is listed in `docs/CONTENT_NEEDED.md` for confirmation.
- **Portfolio p.6 material study** cites the ABBA Arena as a reclaimed-glulam precedent with photographs
  of that building; the precedent photographs are not published.
- **Maison Peplum rasters are 358–687 px wide.** They are shown at honest sizes and never upscaled;
  higher-resolution exports are requested in `docs/CONTENT_NEEDED.md`.
- **Production notes** on the portfolio pages (“Insert original…”, “Awaiting source artwork”, “should
  become the principal drawing”, “in the final portfolio”) never appear in public copy; the content check
  `node scripts/check_content.mjs` scans for them.

## Replacing artwork

1. Add or edit a record in `data/source-manifest.json` (for a new file outside the PDFs use
   `sourcePath`, e.g. `data/originals/mp-section.png`).
2. Run `npm run media`, then `node scripts/check_content.mjs`.
3. Reference the id from `src/content/projects.ts` or `src/content/research.ts`.
