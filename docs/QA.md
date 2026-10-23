# QA record

Environment: build container (Linux, 4 vCPU, no GPU), Node 22, Next.js 16.4.3, Playwright 1.64.1 driving
the pre-installed Chromium 1243 with SwiftShader WebGL (`--use-gl=angle --use-angle=swiftshader`).
Tests run against the static export in `out/`, served by `serve` on port 4173 — the same files that
ship. Mobile checks use Playwright's Pixel 7 profile (touch, coarse pointer, 412 × 915 CSS px); no
physical device, no iOS Safari and no Firefox were available.

## Commands and results (2026-10-23)

| Command | Result |
| --- | --- |
| `npm run check` (`tsc --noEmit` + `eslint`) | pass, 0 errors |
| `node scripts/check_content.mjs` | 52 media ids referenced, 52 built, no third-party assets, no production notes |
| `npm run build` | 10 routes prerendered (`/`, `/work`, 3 project pages, `/research/cairo`, `/about`, 404) |
| `npx playwright test --project=desktop-chromium` | 40 passed, 1 skipped (touch-only test) |
| `npx playwright test --project=mobile-chromium` (routes, viewer, research, inspector) | 29 passed, 5 skipped (desktop-only tests) |
| `node scripts/check_geometry.mjs` / `check_music_geometry.mjs` | bounds and triangle counts as recorded in docs/PERFORMANCE.md |

## Flows exercised (tests/*.spec.ts)

Functional
- Every route loads directly with status 200, exactly one `h1`, the main navigation, no console errors, no failed requests and no horizontal overflow (desktop and mobile).
- Home identifies Tala and the “Selected work” link reaches `/work`; 404 page offers the project, research and about links.
- Maison Peplum viewer: canvas mounts, presets switch (`aria-pressed`, URL hash `#view=…`), the paired drawing aside appears for the Section view, play/pause toggles and the pause persists across hover and focus, the assembly slider moves fin geometry (canvas pixels compared before/after), drag rotates (pixels compared), keyboard rotate/zoom/reset on the focused stage, zoom and reset buttons respond.
- Direct link `#view=assembly&fold=0.80` restores preset and slider value.
- Hotspot list focuses a point of interest and shows its text without the canvas.
- Music institution: Section and Plan presets, paired section drawing, the Reveal slider reaches 100 %.
- Hero auto-rotates only without reduced motion; the visitor’s pause survives hover.
- Reduced motion: no automatic rotation, rotate control disabled.
- No WebGL (context forced to null): viewer reports `fallback`, poster and full project text and drawings remain, no canvas.
- Touch: poster first, “Explore in 3D” mounts the canvas, “Done exploring” releases it, a real touch swipe on the canvas scrolls the page, body overflow is restored, stage `touch-action: pan-y`.
- Drawing inspector: opens from a figure, zooms (buttons and `+`/`0` keys), resets, closes with Escape, focus returns to the opening button, body scroll restored; keyboard-only open, Tab stays inside the dialog.
- Cairo atlas: tab list of four cases, case selection updates the panel, figure, page references and `?case=`; theme buttons switch the red overlay and `?theme=`; arrow keys move between tabs; Back/Forward restore the case.

Content and source integrity
- No “Insert original”, “Awaiting source”, “should become the principal”, “in the final portfolio” or “Full dissertation source to be incorporated” text on any route.
- The dissertation title is the `h1` on `/research/cairo`; “Beyond the Generic City” appears only as the editorial label.
- The download is the 28-page reading edition (`%PDF-` header checked, > 100 KB); `sources/`, the inventory and the manifest are not reachable from the export (404).
- No numeric scores in the theme comparison.

Accessibility
- axe-core (`wcag2a`, `wcag2aa`, `wcag22aa`) on all seven routes: no serious or critical violations (desktop and mobile). The one finding during development — Radix slider thumbs without accessible names — was fixed.
- Manual review of the screenshots for focus order and visible focus is recorded below; a full manual keyboard pass with a screen reader was **not** possible in this container.

## Screenshots inspected (docs/evidence/screenshots)

- All routes at 360, 390, 768, 1440 and 1920 px (full page) plus a short-height landscape (844 × 390) of the Maison Peplum page.
- Viewer presets for both studies (`presets/`), the atlas with the climate-response overlay, the open inspector.
- Findings acted on: fin silhouette reworked (deeper, hem flare, crest curl, gable-end fins); section camera pulled back; hotspot markers on the clipped half hidden; posters recaptured without markers.

## Known limitations and what was not tested

- Real devices (iOS Safari pinch in the inspector and viewer, Android Chrome), Firefox and Safari: not tested. Pointer/touch code follows standard patterns and passes the emulated checks only.
- Frame rates: software WebGL in the container cannot stand in for a device; see docs/PERFORMANCE.md.
- Screen-reader behaviour of the 3D stage (`role="group"` with instructions) and the inspector was reviewed by markup only.
- The forensics-driven crops were verified by a second agent re-rendering every crop; the orchestrator spot-checked a subset visually.
