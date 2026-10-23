# Media components (dev note)

Figures and the drawing inspector. Everything here consumes the `MediaAsset` contract from
`src/content/types.ts`; nothing reads the private manifest.

## Set-up

Mount the provider once, inside `MotionProvider` (it reads the motion preference), so there is a
single inspector dialog per page:

```tsx
// src/app/layout.tsx
<MotionProvider>
  <InspectorProvider>
    <SkipLink />
    <SiteHeader />
    <main id="main">{children}</main>
    <SiteFooter />
  </InspectorProvider>
</MotionProvider>
```

Then, in any server or client component:

```tsx
import { Figure } from "@/components/media";

<Figure asset={asset} size="half" />
<Figure asset={hero} size="full" priority caption="Placement-specific caption" />
<Figure asset={asset} inspectable={false} />
```

`InspectButton` renders nothing when no provider is mounted, so a figure never breaks for lack of one.
`useInspector().open(asset, openerElement)` opens the dialog programmatically (for example from an
annotation marker); pass the element that should receive focus when it closes.

## Figure

- `<figure>` → `<picture>` with avif/webp `<source>`s and a jpg/png `<img>` (`srcset` + `sizes`),
  `width`/`height` from the largest variant, the asset's `tone` and placeholder behind it.
- `sizes` by placement: full `100vw`, wide `(min-width: 64rem) 66vw, 100vw`, half
  `(min-width: 48rem) 50vw, 100vw`, third `(min-width: 48rem) 33vw, 100vw`, strip `25vw`.
- The figure's `max-width` is the native pixel width (inline style): small sources are never stretched.
- Caption row: caption (or override) + Inspect button; then a `.meta` line with credit, source
  ("Portfolio, p.11" / "Dissertation, p.15, fig. 5"), provenance word, "Source supplied at low
  resolution" when `lowResolution`, and `rightsNote` when present.

## Inspector keyboard contract

Shortcuts work anywhere inside the dialog (focus lands on the stage when it opens).

| Key | Action |
| --- | --- |
| `+` / `=` | Zoom in one step (×1.5), about the centre |
| `-` | Zoom out one step |
| `0` | Reset to 1× (fit), centred |
| Arrow keys | Pan 48 px in the scroll sense (Right reveals the right-hand side); Shift ×4 |
| `Tab` / `Shift+Tab` | Move between the stage and the toolbar (focus is trapped) |
| `Escape` | Close; focus returns to the Inspect button that opened it |

Pointer: drag to pan (pointer capture, mouse and touch), wheel or trackpad pinch zooms about the
cursor, two-finger pinch zooms about the midpoint, double-click / double-tap toggles 1× and 2.5×.

Zoom limits: 1× means the image fits the stage. The maximum is 8× or whatever keeps the image at
no more than twice its own pixel width, whichever is lower — the sources are small, so beyond that it
is only blur. "Fit width" fills the stage width and starts at the top edge (for portrait sheets).

Motion: zoom steps from buttons, keys and double-tap ease over 180 ms; with reduced motion they jump.
Drag, wheel and pinch always follow the pointer directly.

## Implementation notes

- `pan-zoom.ts` owns the view outside React: handlers mutate it, one `requestAnimationFrame`
  writes a single `transform`, and the toolbar subscribes with `useSyncExternalStore` to a snapshot that
  only changes when the rounded readout or a limit flag changes. No state updates per pointer move.
- The wheel listener is attached natively (`passive: false`) because React registers `wheel` as
  passive and `preventDefault()` would be ignored.
- `touch-action: none` is a class on the stage, which only exists while the dialog is open; Radix
  handles the body scroll lock and `aria-hidden` on the rest of the page.
- Toolbar limits use `aria-disabled` rather than `disabled` so a focused button never drops focus
  to the body when it reaches a limit.
