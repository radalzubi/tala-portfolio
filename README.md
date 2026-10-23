# Tala Hagras — The Living Section

Architecture portfolio website for Tala Hagras: selected architectural works (2024–2026) and
dissertation research on the homogenisation of Cairo's urban horizons. The site is a static
Next.js 16 export with small client-side 3D islands (three.js / React Three Fiber).

**Status: work in progress.** See `docs/TASKS.json` for the task ledger and `docs/HANDOFF.md`
(to be written) for the release report.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm run preview    # serve the export at http://127.0.0.1:4173
npm run check      # typecheck + lint
npm test           # Playwright tests against ./out (run build first)
```

## Layout

| Path | What it is |
| --- | --- |
| `src/app` | Routes: `/`, `/work`, `/work/[slug]`, `/research/cairo`, `/about`, 404 |
| `src/content` | Typed content records and the generated media manifest (public fields only) |
| `src/components/viewer` | Model viewer shell, camera rig, controls, hotspots (one owner of viewer state) |
| `src/components/models` | Procedural, interpretive 3D studies (Maison Peplum, music institution) |
| `src/components/research` | Cairo research chapter: schematic atlas, case selector, annotations |
| `data/source-manifest.json` | Asset provenance: source file, physical page, crop, credit, publication state |
| `scripts/extract_sources.py` | Reproducible extraction of the supplied archive (private outputs under `sources/`) |
| `scripts/build_media.py` | Builds `public/media` derivatives and `src/content/media.generated.json` |
| `scripts/make_research_excerpt.py` | Dissertation reading edition (pages 1–28, appendices excluded, personal-data scan) |
| `scripts/capture_posters.mjs` | Captures still posters of the 3D studies from the built site (`data/posters/*.png`) |
| `scripts/check_content.mjs` | Content integrity check: media ids resolve, no third-party assets, no production notes |
| `tests/` | Playwright end-to-end and axe accessibility checks against the static export |
| `docs/` | Brief, decisions, ownership, assets, reconstruction, content needed, QA, performance, handoff |

## Sources

`sources/raw` and `sources/derived` are git-ignored: they hold the supplied PDFs and private
extraction outputs (including dissertation appendices with personal data). Rebuild them with:

```bash
python3 -I scripts/extract_sources.py --archive "/path/to/Portfolios_Rough_Draft.zip" --out sources
```

All page references in content and docs are one-based physical PDF pages.

## Integrity rules

- Every public image traces to a source file and page through `data/source-manifest.json`.
- 3D studies are interpretive reconstructions and are labelled as such beside each viewer.
- No contact details, CV, awards, dimensions or built status are shown unless present in the sources.
- Production notes from the portfolio preview ("Insert original…", "Awaiting source artwork") never appear as public copy.
