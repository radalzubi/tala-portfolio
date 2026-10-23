# Performance report

Measurements are from the static export (`npm run build`, served by `serve`), taken in the build
container with headless Chromium 1243 and SwiftShader software WebGL. Targets come from the brief;
they are project targets, not guarantees. **No physical device or field data was available**; mobile
numbers are emulation only (Pixel 7 profile in Playwright), and no real-user Web Vitals exist yet.

## Payloads (gzip, measured from `out/`)

| Route | Scripts | First-load JS | CSS | HTML |
| --- | --- | --- | --- | --- |
| `/` | 10 | 207.7 KB | 8.1 KB | 25.8 KB |
| `/work` | 8 | 193.4 KB | 8.1 KB | 8.2 KB |
| `/work/maison-peplum` | 10 | 207.7 KB | 8.1 KB | 31.8 KB |
| `/research/cairo` | 9 | 202.0 KB | 8.1 KB | 36.3 KB |
| `/about` | 8 | 193.4 KB | 8.1 KB | 4.7 KB |

- The 3D stack (three.js, React Three Fiber, drei, both procedural models) is one lazily loaded
  chunk of **249.6 KB gzip**, fetched only when a viewer decides to mount a canvas (fine pointers:
  hero after idle, studies near the viewport; coarse pointers: on tap). It is never fetched on
  `/work`, `/about` or `/research/cairo`. Budget: first interactive model under 4 MB compressed —
  met with a wide margin because the models are procedural (no mesh download).
- Non-3D first-load JS is **193–208 KB gzip** against a 200 KB target: `/work` and `/about` are
  under; the routes that mount the viewer shell (`/`, `/work/[slug]`) and the atlas (`/research/cairo`)
  are 2–8 KB over. Framework overhead (Next.js 16 runtime + React 19) accounts for roughly 180 KB
  of this; the remainder is the viewer shell, Radix slider/dialog and the inspector. Recorded as a
  justified exception; the next lever is dropping Radix Slider for a native range input.
- Fonts: Newsreader (variable, optical sizes) 128 KB latin + 84 KB latin-ext, Hanken Grotesk 33 KB,
  IBM Plex Mono 14 KB (woff2, self-hosted via Fontsource, `unicode-range` subsets so latin-ext only
  downloads when used). The italic face was removed from the bundle because no italic text is set.
- Hero poster: `mp-poster` is served as webp/jpg at 640 / 1280 / 1900 px (see `public/media`);
  the 1280 px webp used at desktop widths is listed below. Target ≤ 250 KB.
- Images: all derivatives are built at ≤ 1400 px (plus the native width where larger drawings
  benefit) with JPEG q74 / WebP q70 by default; the Cairo sketches are noisy scans and remain the
  heaviest files (300–600 KB at 1152–1536 px). `sizes` hints keep narrow placements on the 480/960
  variants.

## Scene budgets (measured headlessly with `scripts/check_geometry.mjs` and `scripts/check_music_geometry.mjs`)

| Scene | Triangles | Draw calls (approx.) | Notes |
| --- | --- | --- | --- |
| Maison Peplum | ~18 k fins + ~2 k shell | ~100 (90 fin meshes + shell parts) | fins are individual meshes so the assembly study can move them; could be instanced if profiling demands |
| Music institution | 15.9 k with instances expanded | < 40 | slats, columns and partitions are `InstancedMesh` |

Both well inside the 150 k triangle / 100 draw-call starting budget.

## Rendering lifecycle (verified by the Playwright suite and by inspection)

- `frameloop="demand"`: at rest no frames are rendered. Frames are requested only while a camera
  tween, the eased assembly value, the light study or auto-rotation is active (`CameraRig`).
- Auto-rotation stops when the viewer leaves the viewport or the tab is hidden (`running`), and
  stays stopped after the visitor pauses it (`userPaused`).
- Device pixel ratio is capped at 2 (1.25 after `PerformanceMonitor` reports a decline, which also
  halves the shadow map and disables fin shadow casting).
- Geometries and materials are disposed on unmount; route changes unmount the canvas.

## Lab timings

Not measured with a calibrated throttle in this container (software WebGL makes any frame-rate
number meaningless for real devices). What was observed: the static HTML renders identity, navigation
and the poster before any 3D code is requested; the 3D chunk arrives after `requestIdleCallback`
on the hero. **Outstanding:** Lighthouse/INP traces on a real desktop and a mid-range phone, and
field data once the site is public.
