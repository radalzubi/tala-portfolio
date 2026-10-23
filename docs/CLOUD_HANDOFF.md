# Cloud handoff — Tala Hagras portfolio

Checkpoint written 2026-10-23 from the local session that started the build. Everything below was
checked against the files and commands at that time; nothing here is from memory alone.

## 1. Objective

Build Tala Hagras's interactive architectural portfolio website exactly as specified in
`docs/MASTER_PROMPT.txt` (the original brief, preserved verbatim). Creative direction already chosen:
**The Living Section**. A restrained, monograph-like exhibition where a façade unfolds, a section opens and
an urban drawing shows how a city is lived in. Hero project: **Maison Peplum**, shown as a manipulable
interpretive 3D study of folded timber fins over the existing warehouse shell. Three signature chapters:
Maison Peplum, Music Institution, Cairo research. Sound Aroma Loom is a text-led secondary entry because
the supplied preview has no artwork for it.

Deliverable: a complete, tested, static site that runs locally or as a private preview.
Public deployment is out of scope until the owner approves it.

## 2. Where things are

| What | Path | Committed? |
| --- | --- | --- |
| Original master prompt (verbatim) | `docs/MASTER_PROMPT.txt` | yes |
| Brief and verified source facts | `docs/BRIEF.md` | yes |
| Design and engineering decisions | `docs/DECISIONS.md` | yes |
| Task ledger | `docs/TASKS.json` | yes |
| Missing owner content | `docs/CONTENT_NEEDED.md` | yes |
| File ownership and contracts | `docs/OWNERSHIP.md` | yes |
| Portfolio PDF, 17 pages | `sources/raw/Tala_Portfolio_Preview_17_Pages.pdf` | yes, private repo, outside `public/` |
| Dissertation PDF, 48 pages | `sources/raw/TalaHagras_Dissertation_2025-6 (1) (1).pdf` | **no**: its pages 29–48 hold ethics forms, signatures, e-mails and interview transcripts |
| Dissertation reading edition, pages 1–28 | `public/downloads/Tala-Hagras-Homogenisation-of-Cairos-Urban-Horizons-reading-edition.pdf` | yes, intended public download |
| Inventory: hashes, page sizes, images, placements | `sources/derived/inventory.json` | yes |
| Page renders, 150 dpi | `sources/derived/pages/portfolio/page-01..17.png`, `sources/derived/pages/dissertation/page-01..28.png` | yes, appendix pages excluded |
| Embedded raster images | `sources/derived/images/portfolio/*` (30), `sources/derived/images/dissertation/p01..p18*` (12) | yes |
| Contact sheets | `sources/derived/contact/portfolio-sheet-*.png`, `dissertation-main-sheet-*.png` | yes |
| Page text with markers | `sources/derived/text/portfolio.txt`, `sources/derived/text/dissertation-main-1-28.txt`, per-page `.txt` and `.blocks.json` | yes, pages 1–28 only for the dissertation |
| Verified dissertation notes | `sources/derived/notes/dissertation-notes.json` | yes |
| Image forensics records: captions, alt text, crops, authorship | `sources/derived/notes/image-forensics-partial.json` | yes |
| Asset manifest | `data/source-manifest.json` | **not written yet** |
| Generated public media manifest | `src/content/media.generated.json` | **not generated yet** |
| 3D models | Procedural only: `src/components/models/**`. No CAD, GLB or mesh files exist in the sources. | yes |

How to read the notes files:

- **Dissertation notes.** Fields: `notes.cases[]`, `notes.architectsPerspectives`, `notes.bibliography`,
  `notes.figureReferences` and more. Every claim carries a physical page. A four-checker verification
  pass applied 14 corrections; they are listed under `issues`.
- **Forensics records.** The `coverage` field shows which batches were independently audited. Every
  image has `subregions[]` with a normalised `bboxNorm` and a `recommendedUse`. Preview crops were
  regenerable scratch files and are not committed. Re-create any of them by cropping the source image
  with its `bboxNorm`.

## 3. State of the work

### Implemented, built, not yet seen in a browser

- **Reproducible extraction.** `scripts/extract_sources.py` handles safe unzip, inventory, renders, text,
  images and contact sheets. It also accepts `--pdf` files directly.
- **Reading edition.** `scripts/make_research_excerpt.py` builds it and scans it for e-mails, phone
  numbers and signatures.
- **Design tokens.** `src/app/globals.css` uses Tailwind 4 `@theme`, the palette and type scale from
  `docs/DECISIONS.md` #5–6, and motion duration tokens that collapse under reduced motion.
- **Fonts.** Self-hosted through Fontsource and imported in `src/app/layout.tsx`.
- **Shell.** Skip link, header, primary nav, footer with an index and the site motion setting.
- **Motion preference.** `src/components/motion/motion-provider.tsx` honours system, reduced and full
  modes. A boot script prevents a flash of motion.
- **Content contract.** `src/content/types.ts` defines `Project`, `MediaAsset`, `ModelSpec`, `ViewPreset`
  with a section clip plane, `ResearchChapter`, and related types.
- **Viewer contract and reducer.** `src/components/viewer/model-contract.ts` covers the poster, loading,
  interactive, fallback and error states, plus a durable `userPaused` flag.
- **Camera rig.** `src/components/viewer/camera-rig.tsx` runs guided camera tweens that user input
  cancels. It eases assembly and light-study values in `useFrame`, requests frames only while something
  changes, and pauses auto-rotate when the visitor pauses or the view is hidden.
- **Canvas island.** `src/components/viewer/viewer-canvas.tsx` uses demand frame loop, DPR cap, a
  `PerformanceMonitor` quality drop, an error boundary, context-loss handling, a section clipping plane,
  a shadow-only ground and hotspot sprites.
- **URL hash state.** `src/components/viewer/url-state.ts` keeps `#view=…&fold=…` with `replaceState`.
- **Maison Peplum geometry.** `src/components/models/maison-peplum/geometry.ts` generates the fins
  procedurally. `npm run check:geometry` passes the numeric sanity check: 76 fins, 17,024 triangles.
- **Maison Peplum model.** `src/components/models/maison-peplum/maison-peplum-model.tsx` has semantic
  groups: `facade-fins`, `existing-shell`, `structure`, `glazed-base`, `roof` and `context`. The assembly
  control separates fins outward and lifts the roof. Presets can emphasise fins or shell.

### Partially implemented

- `src/app/page.tsx` is a placeholder heading only.
- `src/components/models/music-institution/music-institution-model.tsx` is a placeholder cylinder.
- **Asset pipeline.** `scripts/build_media.py` is written but has never run because the manifest it
  reads does not exist yet.
- **Image forensics.** All 42 images have records. The Maison Peplum batches, portfolio pages 8–9 and 12,
  were never independently audited because the audit agents failed when the session restarted.

### Missing

- **Viewer shell.** `ModelViewer` is the DOM shell that owns the `useReducer`. It still needs the poster,
  an "Explore in 3D" engage action and an exit, plus these controls: rotate/pause, zoom in/out, reset,
  view presets, an assembly slider with its value, a light-study slider, fullscreen, source drawing, a
  DOM hotspot list, keyboard handling scoped to the focused viewer, and an IntersectionObserver plus
  `visibilitychange` that set `running`. `viewer-canvas.tsx` must be loaded with `next/dynamic`
  (`ssr:false`) only after engagement or when it nears the viewport.
- **Content records.** `src/content/projects.ts` needs the project records and `ModelSpec`s with presets,
  hotspots and groups. `src/content/research.ts` needs the Cairo chapter.
- **Routes.** `/work`, `/work/[slug]` with `generateStaticParams`, `/research/cairo`, `/about` and a
  custom `not-found.tsx`.
- **Interactive pieces.** Drawing inspector with zoom, pan, keyboard, captions, credit, reset and focus
  return. Cairo schematic atlas, case selector and red annotation layer. Sound Aroma Loom interpretive
  sensory diagram, clearly labelled.
- **Docs.** `docs/RECONSTRUCTION.md`, `docs/QA.md`, `docs/PERFORMANCE.md` and `docs/HANDOFF.md`.
- **Tests.** Playwright and axe tests (`playwright.config.ts`, `tests/`).

## 4. Architecture and decisions

The full list is in `docs/DECISIONS.md`. Key points:

- **Next.js 16.4.3 App Router with `output: "export"`.** The build writes `./out`, so there is no server
  runtime. `images.unoptimized` is set because `build_media.py` pre-builds derivatives.
  `cacheComponents` was removed from the scaffold because it is incompatible with a pure static export.
  Read `AGENTS.md`: this Next version differs from older training data, and the docs are in
  `node_modules/next/dist/docs/`.
- **Content flow.** Static typed content in `src/content/*.ts` resolves media IDs through
  `media.generated.json`. No CMS, backend, accounts or telemetry.
- **Single viewer-state owner.** `viewerReducer` is the only owner. The canvas reads state and receives
  `dispatch`. The rig owns the camera, and user input cancels guided moves. The eased assembly value is a
  ref, so React never re-renders per frame.
- **Procedural models.** No source geometry exists, so models are procedural (DECISIONS #2). They stay
  `kind: "interpretive"` and carry a visible disclosure label.
- **Animation engines.** `motion` is for DOM transitions only, and three.js owns scene tweens. No GSAP
  and no scroll smoothing.
- **Visual system.**
  - Palette: chalk `#F3F0E9` page, sheet `#FBFAF7`, ink `#191A18`, secondary text `#5B574F` (6.3:1 on
    chalk). Rule `#9A948B` is for lines only and fails as text. Copper `#A95336` is the Maison Peplum
    accent (4.6:1). Pencil red `#B8322A` is for Cairo only (5.2:1).
  - Type: Newsreader (display and editorial serif, optical sizes), Hanken Grotesk (UI and body),
    IBM Plex Mono 400 (drawing metadata only).
- **Cairo atlas.** Schematic, with no map library and no coordinates. Figure 10 is a third-party
  photograph and is cited, not displayed.
- **Contact and CV.** None supplied, so the site shows no contact action (see `docs/CONTENT_NEEDED.md`).

Locked dependencies come from `package.json` and `package-lock.json`. Runtime: next 16.4.3, react and
react-dom 19.3.0, three 0.186.1, @react-three/fiber 9.8.2, @react-three/drei 10.7.9, motion 14.6.0,
Radix dialog/slider/switch/tooltip/visually-hidden, lucide-react, and the Fontsource packages.
Dev: typescript 5, eslint 9 with eslint-config-next 16.4.3, tailwindcss 4 with
@tailwindcss/turbopack, @playwright/test 1.64, @axe-core/playwright 4.14, serve 14, @types/three 0.186.
Radix, motion and lucide are installed but not imported yet.

## 5. Commands

```bash
npm ci                          # install exactly from package-lock.json (Node 20; checkpoint used 20.20.2 / npm 10.8.2)
npm run dev                     # dev server on http://localhost:3000
npm run typecheck               # tsc --noEmit
npx eslint src scripts          # lint (currently fails: see section 8)
npm run build                   # static export to ./out
npm start                       # serve ./out (uses the `serve` dev dependency)
npm run check:geometry          # Maison Peplum fin sanity check (node + typescript transpile into .tmp/)
npm run check:contrast          # palette contrast table
npm run media                   # build public/media + src/content/media.generated.json from data/source-manifest.json
python3 -I scripts/make_research_excerpt.py   # rebuild the reading edition (needs the raw dissertation PDF)
python3 -I scripts/extract_sources.py --pdf sources/raw/Tala_Portfolio_Preview_17_Pages.pdf --out sources   # re-extract portfolio
npx playwright install --with-deps chromium   # browser for e2e tests (not set up yet)
```

Python scripts need Python 3.10+ with `pymupdf` and `pillow`:
`pip install pymupdf pillow`. Always run them with `python3 -I` from the repo root.

## 6. Environment variables

None. The site is fully static and uses no APIs, keys or analytics.

## 7. Tests and checks actually run

| Check | Result |
| --- | --- |
| `python3 -I scripts/extract_sources.py` on the supplied zip | Pass. 2 PDFs inventoried: 17 + 48 pages, 30 + 24 images. No 3D annotations or CAD attachments. The portfolio PDF embeds one C2PA "Content Credentials" file. |
| `python3 -I scripts/make_research_excerpt.py` | Pass. 28 pages, 5.2 MB. The personal-data scan found no e-mail, phone or signature patterns. |
| Dissertation notes workflow (draft, 4 adversarial verifiers, repair) | Pass. 14 corrections applied. Output in `dissertation-notes.json`. |
| Image forensics workflow (inspect, then independent audit) | Partial. 42 of 42 images have records. 8 of 10 batches audited. 95 of 96 crops visually verified. |
| `npm run check:geometry` | Pass. Fin bounding boxes match the expected envelope: x ±14.4, y 3.3–10.4, z ±8.1. |
| `npm run check:contrast` | Done. Text pairs used on chalk or sheet pass AA. `rule` is not used for text. |
| `npm run typecheck` | Pass. |
| `npm run build` | Pass after a fix in this checkpoint: `NAV_ITEMS` moved from a client module to `src/content/nav.ts`. Exports `/` and `/_not-found`. First-load JS on `/` is 6 files, 174.5 KB gzip. |
| `npx eslint src scripts` | **Fails: 16 errors, 2 warnings.** See section 8. |

Not run yet:

- `next dev` and any browser rendering. The viewer and model have never been drawn on screen.
- Playwright, axe and manual keyboard checks.
- Viewport screenshots at 360, 390, 768, 1440 and 1920 px, plus short landscape.
- Reduced-motion and no-WebGL paths.
- Performance profiling and a fresh-clone install, which is done after the push (see the end of this file).

## 8. Known bugs, source limitations and reconstruction assumptions

### Known bugs and code risks

1. **ESLint errors from React 19 compiler rules.**
   - `react-hooks/immutability`: in `viewer-canvas.tsx` (writes to `gl.*` in an effect), `camera-rig.tsx`
     (camera, controls and ref writes) and `maison-peplum-model.tsx` (material opacity in `useFrame`).
   - `react-hooks/set-state-in-effect`: in `motion-provider.tsx` and `use-webgl-support.ts`.
   - Two unused-variable warnings.
   - Fix by moving three.js mutation into `onCreated`, `useFrame` or ref callbacks, and by using
     `useSyncExternalStore` for media queries and WebGL detection. Behaviour must not change.
2. **Shadows always on.** In `viewer-canvas.tsx` the directional light has `castShadow={!lowQuality || true}`,
   so shadows never drop on low quality. Intended: `castShadow` always, with a smaller map when
   `lowQuality`.
3. **Hotspots ignore assembly.** `HotspotMarkers` receives `assemblyRef` but does not use it, so markers
   stay put when the fins separate. Either move anchors with their group or hide markers when assembly is
   above about 0.1.
4. **Both models in one chunk.** `viewer-canvas.tsx` imports both models statically. Split per model with
   `dynamic()` or a component map so each page loads one model.
5. **Opacity cost.** Toggling material `transparent` for emphasis forces shader recompiles. Prefer a
   fixed `transparent` flag per material.
6. **Untested camera code.** Camera-rig preset tweens, section clipping and the `PerformanceMonitor`
   decline path have never run in a browser.
7. **Lockfile extras.** `npm ls` reports extraneous optional wasm packages (`@emnapi/*`, `@img/sharp-wasm32`).
   They are harmless and `npm ci` cleans them.

### Source limitations, all recorded in `docs/CONTENT_NEEDED.md`

- **Low-resolution Maison Peplum rasters.** They are 358–687 px wide (17 of 42 images are under 700 px).
  Show them at honest sizes and never upscale or regenerate detail.
- **Sound Aroma Loom has no artwork.** Portfolio pages 13–16 are placeholders with production notes.
  Page 17 has only placeholders too.
- **No geometry.** There is no CAD, glTF or mesh source and no stated dimensions.
- **No contact details, CV, per-project years or team credits.**
- **Third-party or mixed content**, from the forensics records:
  - Dissertation p18, Figure 10: a published mural photograph credited to Seed, El. (2016). Do not display it.
  - Dissertation p1: University of Reading logo. Use the institution name as text only.
  - Portfolio p3 design-statement collage: the pianist and dancers vignette looks like a reproduced illustration.
  - Portfolio p4 site-analysis collage: graffiti photographs.
  - Portfolio p6 material-reuse composite: ABBA Arena precedent interiors.
  - Portfolio p8 concept collage: an apartment-block image of unknown origin.
  - For each of these, crop to Tala's own drawings and models, or label them as precedent or reference.
- **Notes mismatch.** `dissertation-notes.json` says the cover names no university, which is only true of
  the extracted text. The cover image carries the University of Reading and School of Architecture marks.
  The main text, on p11, mentions the University of Reading's ethical guidelines.

### Maison Peplum reconstruction assumptions

These must be copied into `docs/RECONSTRUCTION.md` and summarised beside the viewer.

- **Overall form.** Proportional massing only, read from plan p10, section 1:50 p11, models p9 and p12,
  and renders p8 and p12. The constants in `geometry.ts` (`PEPLUM`) are notional metres, not stated
  dimensions.
- **Shell.** An existing pitched-roof shell with gable ends. The upper floor is glazed with a steel frame
  and cross bracing on the long façades, after the section labels "Steel Beams Cross Brassing" and
  "Cantilever Steel Beam". The glazed ground floor is recessed under a cantilevered upper volume.
- **Fins.** 38 per long side, which is an assumption, not a counted fact. Their profile flares at the hem
  and folds as it runs over the eave and up the roof, after the wave-profile fins in the 1:200 model.
- **Canal.** Placed on one long side, after the plan and section.
- **Assembly study.** The "Fold / Assembly" control is an interpretive separation of supported groups
  (fins, roof). It is not a construction sequence.
- **Light study.** The light-study control is illustrative and is not a solar simulation.
- **No interiors.** The model has no interior or technical structure beyond what the section shows.

## 9. Prioritised task list

| # | Task | Acceptance criteria |
| --- | --- | --- |
| P0 | **Validate the checkpoint** and fix the ESLint errors (TASKS T11). | `npm ci`, typecheck and build pass. `npx eslint src scripts` reports 0 errors. No behaviour change. |
| P1 | **Maison Peplum source manifest and media.** Audit the forensics records for portfolio pages 8, 9 and 12. Write `data/source-manifest.json` entries for every Maison Peplum image used, then run `npm run media` (TASKS T1). | Each asset has id, file, page, xref, crop, caption, alt, credit, provenance and a rights note where needed. `media.generated.json` contains no private paths. Third-party subregions are excluded. Images are not upscaled. |
| P2 | **Maison Peplum vertical slice** (TASKS T4). Build `ModelViewer` and its controls, the `projects.ts` record with presets *whole*, *façade rhythm*, *assembly* and *section/context* (clip plane plus the p11 section drawing), hotspots and the disclosure label. Build `/work/maison-peplum` with the narrative, original drawings and the poster. | In a real browser: drag visibly rotates the mesh. Pause persists across focus and hover. Reset and presets work. The assembly slider moves fin groups and reverses. The hash is kept on reload. The poster and full text show with WebGL disabled. Touch scroll is not trapped. No console errors. Layout checked at 390 px and 1440 px. |
| P3 | **Home page.** Identity, positioning line, "Selected work" link, a lazily loaded Maison Peplum viewer with visible rotate, pause and view controls, and a mobile poster with "Explore in 3D". | Tala's name and the path to the work are visible without scrolling. The 3D code is not in first-load JS. |
| P4 | **Drawing inspector** using the Radix dialog. | Opens, zooms, pans and resets with mouse, touch and keyboard. Esc closes it and focus returns to the trigger. Shows caption and source credit. |
| P5 | **Music institution** (TASKS T5). Procedural study: circular performance volume, stepped landscape, canal edge. Presets *whole*, *plan* and *section* with a narrow field of view. Page with the p5 section and the p4 site plan beside the viewer. Any circulation overlay is labelled diagrammatic. | Presets work. The original section stays accessible. The study is labelled interpretive. |
| P6 | **Cairo research chapter** (TASKS T6). Build `research.ts` from `dissertation-notes.json`, a schematic atlas, a case selector for the four cases, a red annotation layer over Figures 1–9 and 11, a qualitative comparison by theme, and the flow from question to sources. Link the reading-edition download. | Switching case updates artwork, text and page references. No coordinates or scores. The dissertation title is correct. Figure 10 is cited, not shown. |
| P7 | **Remaining routes:** `/work` index, `/about` (verified facts only), the Sound Aroma Loom text entry with a labelled interpretive diagram, and `not-found.tsx`. | Every nav link resolves. No production notes are public. No empty picture boxes. |
| P8 | **QA** (TASKS T8). Playwright flows and an axe scan per route. Screenshots at 360, 390, 768, 1440 and 1920 px and in landscape. Reduced motion toggled live. WebGL-blocked and model-failure paths. Write `docs/QA.md`. | The master prompt's section 14 functional and accessibility items pass, or are documented with the blocker. |
| P9 | **Performance and release** (TASKS T9 and T10). Write `docs/PERFORMANCE.md` with measurements separated from targets, plus `docs/RECONSTRUCTION.md`, `docs/HANDOFF.md` and an updated README. | A fresh clone builds. Budgets are reported honestly. |

## 10. Single best next action

Validate the checkpoint (`npm ci && npm run typecheck && npm run build`), fix the 16 ESLint errors, then
build the **Maison Peplum vertical slice** (P1 and P2) and verify it in a real browser at desktop and
mobile widths before multiplying the pattern to other pages. This is the master prompt's Phase 1 gate.

## 11. Local-only items and cloud replacements

| Local item | Cloud replacement |
| --- | --- |
| Source archive `~/Downloads/Portfolios_Rough_Draft (1).zip` | The portfolio PDF is in `sources/raw/`. The dissertation PDF is deliberately not committed. It is only needed to rebuild the reading edition, which is already built, or to re-extract pages that are already committed for pages 1–28. If it is ever needed, ask the owner to upload it privately and keep it out of git. |
| Master prompt `~/Downloads/Tala_Portfolio_Fable_5_1_Ultra_Master_Prompt.txt` | `docs/MASTER_PROMPT.txt`, a verbatim copy. |
| Workflow transcripts and journals under `~/.claude/...` | Results saved in `sources/derived/notes/*.json`. |
| Crop previews in `sources/derived/crops-preview/` (31 MB, git-ignored) | Re-create from `bboxNorm` with Pillow, or let `build_media.py` produce real crops. |
| Playwright Chromium in `~/Library/Caches/ms-playwright` | `npx playwright install --with-deps chromium`. |
| Claude desktop built-in browser used for visual checks | Playwright screenshots, or the cloud session's own browser tooling. |
| Python with PyMuPDF 1.27 and Pillow 12 | `pip install pymupdf pillow`. |
| `gh` CLI logged in as `radalzubi` | The cloud session's GitHub access to the private repo. |

## 12. Git

- Repository: `https://github.com/radalzubi/tala-portfolio`, private.
- `main` holds the first scaffold commit. This checkpoint is on branch `handoff/cloud-2026-10-23`.
  Continue on that branch or a branch cut from it.
- Do not merge into `main`, force-push or make the repository public without the owner's approval.

## 13. Verification after push

Run on 2026-10-23 against commit `6386a194cff891f450583deeec18ae67f3152e21`, freshly cloned from
`origin/handoff/cloud-2026-10-23` into an empty directory:

| Step | Result |
| --- | --- |
| `git ls-remote` and the GitHub API | Remote branch head equals the local commit. `docs/CLOUD_HANDOFF.md` is present on the branch. `main` is unchanged at `91c07ba`. Repository visibility is PRIVATE. |
| Raw dissertation PDF in the clone | Absent, as intended. Dissertation page renders stop at `page-28.png`. |
| `npm ci` | Exit 0, 537 packages. |
| `npm run typecheck` | Pass. |
| `npm run build` | Exit 0. Routes `/` and `/_not-found`. |
| `npm run check:geometry` | Pass: 76 fins, 17,024 triangles. |

The later commit that adds this section changes only this document.
