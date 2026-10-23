# Handoff

Status: **ready for review as a private preview.** Not ready for public publication until the
publication dependencies in `docs/CONTENT_NEEDED.md` are resolved (contact details, confirmation of
photo authorship in two collages, permission to publish the dissertation reading edition) and a
public deployment is explicitly authorised.

## What was built

A static Next.js 16 site (`output: "export"`) for Tala Hagras’s architecture portfolio:

- `/` — editorial introduction with the Maison Peplum interpretive 3D study as hero, the three selected works, the research invitation and a short about.
- `/work`, `/work/maison-peplum`, `/work/music-institution`, `/work/sound-aroma-loom` — the project index and case studies (identity, verified metadata, design question, spatial organisation, material and model evidence, interactive study with provenance, next-project navigation). Sound Aroma Loom is text-led with a labelled interpretive diagram because no artwork was supplied.
- `/research/cairo` — the dissertation chapter: question → lenses and methods → an atlas of the four cases with annotated original drawings and a qualitative theme comparison → architects’ perspectives → insights and conclusion → limitations, ethics, download and sources.
- `/about` — only facts from the sources; no contact or CV (none supplied).
- A drawing inspector (zoom, pan, keyboard, focus return) on every figure; a site-wide motion setting; a 404 page.

Strongest interactions: the Maison Peplum fold/assembly study (fins and roof separate and return under a scrubbable slider, with the façade assembly drawing paired beside it); the section cut through both studies paired with Tala’s own sections; the Cairo atlas, where the red-pencil annotation layer follows the chosen theme over her drawings.

## Run

```bash
npm install            # or npm ci
npm run build          # static export → ./out
npm run preview        # http://127.0.0.1:4173
npm run check          # typecheck + lint
npm test               # Playwright (needs the build; uses the preinstalled Chromium or PW_CHROMIUM)
```

Rebuilding the private source extraction (only needed to change crops or add assets):

```bash
pip install pymupdf pillow
python3 -I scripts/extract_sources.py --archive "/path/to/Portfolios_Rough_Draft.zip" --out sources
npm run media && node scripts/check_content.mjs
```

## Replacing artwork and models

- Images: edit `data/source-manifest.json` (see `docs/ASSETS.md`), run `npm run media`. Higher-resolution originals go in via `sourcePath` without touching any component.
- 3D: both studies are procedural (`src/components/models/*`). A supplied GLB would be loaded in `viewer-canvas.tsx` with `model.kind = "original"` in the content record; presets, hotspots, controls and fallbacks stay as they are (`docs/RECONSTRUCTION.md`).
- Copy: `src/content/projects.ts`, `src/content/research.ts`, `src/content/about.ts`. Every statement carries a `sourceRef` (file + physical page).

## Evidence

- `docs/QA.md` — commands, results, flows, screenshots, limitations.
- `docs/PERFORMANCE.md` — payloads, scene budgets, lifecycle, what remains unmeasured.
- `docs/evidence/screenshots/` — route and viewer captures at 360–1920 px.
- `docs/DECISIONS.md`, `docs/RECONSTRUCTION.md`, `docs/ASSETS.md`.

## Source limitations (not implementation defects)

- Maison Peplum rasters are 358–687 px wide; they are shown at honest sizes. The hero therefore uses a still of the interpretive 3D study rather than Tala’s render.
- Sound Aroma Loom has no artwork in the preview (pages 13–16 are placeholders).
- No CAD or 3D sources: both studies are interpretive and labelled as such.
- Several composites embed photographs of unstated authorship (concept collage p.8, garment board p.9, site analysis p.4, p.6 material study with ABBA Arena photographs); those parts are cropped out or carried with a rights note.
- No contact details, CV, project years or team credits exist in the sources; none are shown.

## Smallest remaining owner actions

1. Supply a contact route (e-mail or form endpoint) — the about page and footer will then gain a contact action.
2. Confirm authorship of the site photographs in the p.4 collage (currently published with a rights note).
3. Confirm the dissertation reading edition (pp. 1–28) may be offered for download; it is included in the preview.
