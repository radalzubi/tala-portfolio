"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import * as Slider from "@radix-ui/react-slider";
import { ChevronDown, Maximize2, Minimize2, Pause, Play, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import type { MediaAsset, ModelSpec } from "@/content/types";
import { cn } from "@/lib/cn";
import { useMotionPreference } from "@/components/motion/motion-provider";
import { Figure, useInspector } from "@/components/media";
import { largestVariant, srcSetOf, variantsOf } from "@/components/media/asset-utils";
import { findHotspot, findPreset, initialViewerState, viewerReducer, type ViewerCanvasApi } from "./model-contract";
import { readHashState, writeHashState } from "./url-state";
import { useCoarsePointer, useWebGLSupport } from "./use-webgl-support";

const ViewerCanvas = dynamic(() => import("./viewer-canvas"), {
  ssr: false,
  loading: () => null,
});

export interface ModelViewerProps {
  spec: ModelSpec;
  /** 2D poster shown before, under and instead of the canvas. */
  poster: MediaAsset;
  /** Drawings referenced by presets (`drawingId`) and hotspots, resolved by id. */
  drawings: Record<string, MediaAsset>;
  /** Accessible subject name, e.g. "Maison Peplum". */
  subject: string;
  /** Hero: taller stage, auto-rotate on load (unless reduced motion), canvas loads when idle. Study: loads near the viewport. */
  variant?: "hero" | "study";
  /** Mirror preset/assembly to the URL hash (one viewer per page). */
  syncUrl?: boolean;
  /** Hero mode: fewer controls (no hotspot list, light slider or paired drawing), one-line provenance. */
  compact?: boolean;
  /** Rendered under the controls (e.g. the project link in the hero). */
  children?: ReactNode;
  className?: string;
}

/** The still study: a plain responsive picture filling the stage (no caption; the provenance line sits below the controls). */
function Poster({ asset, hero }: { asset: MediaAsset; hero: boolean }) {
  const largest = largestVariant(asset);
  if (!largest) return null;
  const webp = srcSetOf(variantsOf(asset, "webp"));
  const fallback = srcSetOf(variantsOf(asset, largest.format));
  const sizes = hero ? "(min-width: 64rem) 66vw, 100vw" : "100vw";
  return (
    <picture className="absolute inset-0 block" style={{ backgroundColor: asset.tone }}>
      {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
      <img
        src={largest.src}
        srcSet={fallback}
        sizes={sizes}
        width={largest.width}
        height={largest.height}
        alt={asset.alt}
        loading={hero ? "eager" : "lazy"}
        fetchPriority={hero ? "high" : undefined}
        decoding="async"
        className="h-full w-full object-contain"
      />
    </picture>
  );
}

function useInView(ref: React.RefObject<HTMLElement | null>, rootMargin: string): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const sync = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  return visible;
}

export function ModelViewer({ spec, poster, drawings, subject, variant = "study", syncUrl = false, compact = false, children, className }: ModelViewerProps) {
  const { reduced } = useMotionPreference();
  const webgl = useWebGLSupport();
  const coarse = useCoarsePointer();
  const inspector = useInspector();
  const id = useId();

  const initialHash = useMemo(() => (syncUrl && typeof window !== "undefined" ? readHashState(window.location.hash) : {}), [syncUrl]);
  const [state, dispatch] = useReducer(viewerReducer, spec, (s) => initialViewerState(s, initialHash.view, initialHash.fold));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<ViewerCanvasApi | null>(null);
  const inView = useInView(containerRef, variant === "hero" ? "0px" : "320px");
  const pageVisible = usePageVisible();
  const [engaged, setEngaged] = useState(false);
  const [cssFullscreen, setCssFullscreen] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  const preset = findPreset(spec, state.presetId);
  const hotspot = findHotspot(spec, state.focusedHotspot);
  const pairedDrawing = !compact && preset.drawingId ? drawings[preset.drawingId] : undefined;
  const canvasMounted = state.status === "loading" || state.status === "interactive";
  const showPoster = state.status !== "interactive";
  const running = inView && pageVisible && !state.fullscreen ? true : state.fullscreen ? pageVisible : false;

  // Fallback when WebGL is unavailable.
  useEffect(() => {
    if (webgl === "no" && state.status !== "fallback") dispatch({ type: "fallback" });
  }, [webgl, state.status]);

  // Load the canvas: on fine pointers the hero loads once the page has settled and studies load near the
  // viewport; on touch devices nothing loads until the visitor taps "Explore in 3D" (poster-first mobile path).
  useEffect(() => {
    if (webgl !== "yes" || state.status !== "poster" || !inView || coarse) return;
    const start = () => dispatch({ type: "engage" });
    if (variant === "hero") {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };
      if (w.requestIdleCallback) {
        const handle = w.requestIdleCallback(start, { timeout: 1500 });
        return () => (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback?.(handle);
      }
      const t = window.setTimeout(start, 400);
      return () => window.clearTimeout(t);
    }
    start();
  }, [webgl, state.status, inView, variant, coarse]);

  // Gentle rotation for the hero once interactive, unless the visitor prefers reduced motion or has paused before.
  useEffect(() => {
    if (state.status === "interactive" && variant === "hero" && !reduced && !state.userPaused && !state.autoRotate) {
      dispatch({ type: "rotate", on: true });
    }
    if (reduced && state.autoRotate) dispatch({ type: "rotate", on: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, reduced]);

  // URL hash mirror.
  useEffect(() => {
    if (!syncUrl) return;
    const first = spec.presets[0];
    writeHashState({ view: state.presetId, fold: state.assembly }, { view: first.id, fold: first.assembly ?? 0 });
  }, [syncUrl, spec.presets, state.presetId, state.assembly]);

  useEffect(() => {
    if (!syncUrl) return;
    const onHash = () => {
      const h = readHashState(window.location.hash);
      if (h.view && h.view !== state.presetId && spec.presets.some((p) => p.id === h.view)) dispatch({ type: "preset", id: h.view });
      if (h.fold !== undefined && Math.abs(h.fold - state.assembly) > 0.01) dispatch({ type: "assembly", value: h.fold });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [syncUrl, spec.presets, state.presetId, state.assembly]);

  // Fullscreen: native API when available, CSS fallback otherwise. Body scroll is restored on exit.
  const setFullscreen = useCallback(
    (on: boolean) => {
      const el = containerRef.current;
      if (!el) return;
      if (on) {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => setCssFullscreen(true));
        } else {
          setCssFullscreen(true);
        }
      } else if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        setCssFullscreen(false);
      }
    },
    [],
  );
  useEffect(() => {
    const sync = () => {
      const on = document.fullscreenElement === containerRef.current;
      dispatch({ type: "fullscreen", on: on || cssFullscreen });
    };
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [cssFullscreen]);
  useEffect(() => {
    if (!cssFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [cssFullscreen]);

  const onUserInteract = useCallback(() => {
    if (state.autoRotate) dispatch({ type: "rotate", on: false });
  }, [state.autoRotate]);

  const announce = (msg: string) => setLiveMessage(msg);

  const onStageKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (state.status !== "interactive") return;
    const step = e.shiftKey ? 0.35 : 0.12;
    switch (e.key) {
      case "ArrowLeft":
        apiRef.current?.rotateBy(step, 0);
        break;
      case "ArrowRight":
        apiRef.current?.rotateBy(-step, 0);
        break;
      case "ArrowUp":
        apiRef.current?.rotateBy(0, -step * 0.6);
        break;
      case "ArrowDown":
        apiRef.current?.rotateBy(0, step * 0.6);
        break;
      case "+":
      case "=":
        dispatch({ type: "zoom", direction: 1 });
        break;
      case "-":
      case "_":
        dispatch({ type: "zoom", direction: -1 });
        break;
      case "0":
        dispatch({ type: "reset" });
        break;
      case " ":
        dispatch({ type: "rotate", on: !state.autoRotate, byUser: true });
        break;
      case "Escape":
        if (state.fullscreen) setFullscreen(false);
        else setEngaged(false);
        break;
      default:
        return;
    }
    e.preventDefault();
    onUserInteract();
  };

  const rotateEnabled = state.status === "interactive" && (engaged || !coarse);
  const zoomEnabled = state.status === "interactive" && engaged;
  const stageHeight = variant === "hero" ? "aspect-[4/3] md:aspect-[5/4] lg:aspect-auto lg:h-[min(78vh,54rem)]" : "aspect-[4/3] md:aspect-[16/10]";
  const rotateLabel = state.autoRotate ? "Pause rotation" : "Play rotation";

  return (
    <section
      ref={containerRef}
      aria-label={`${subject}: interactive study`}
      className={cn(
        "viewer group/viewer relative",
        cssFullscreen && "fixed inset-0 z-[90] overflow-auto bg-chalk p-4",
        state.fullscreen && !cssFullscreen && "bg-chalk p-4",
        className,
      )}
      data-status={state.status}
    >
      <div className={cn("grid gap-6", pairedDrawing ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]" : "")}>
        <div>
          {/* Stage */}
          <div
            ref={stageRef}
            tabIndex={0}
            role="group"
            aria-roledescription="3D model stage"
            aria-label={`${subject} model. ${state.status === "interactive" ? "Arrow keys rotate, plus and minus zoom, 0 resets, space pauses rotation." : "3D view not active."}`}
            aria-describedby={`${id}-disclosure`}
            onKeyDown={onStageKeyDown}
            onPointerDown={() => {
              if (!coarse) setEngaged(true);
            }}
            className={cn("relative isolate w-full overflow-hidden rounded-sm", stageHeight, state.fullscreen && "h-[calc(100vh-9rem)] aspect-auto")}
            style={{ touchAction: engaged ? "none" : "pan-y" }}
          >
            {showPoster && <Poster asset={poster} hero={variant === "hero"} />}
            {canvasMounted && (
              <div className={cn("absolute inset-0 transition-opacity duration-500", state.status === "interactive" ? "opacity-100" : "opacity-0")}>
                <ViewerCanvas
                  spec={spec}
                  state={state}
                  dispatch={dispatch}
                  reducedMotion={reduced}
                  rotateEnabled={rotateEnabled}
                  zoomEnabled={zoomEnabled}
                  running={running}
                  apiRef={apiRef}
                  onUserInteract={onUserInteract}
                />
              </div>
            )}
            {state.status === "loading" && (
              <p className="meta absolute bottom-3 left-3 rounded-xs bg-sheet/90 px-2 py-1" role="status">
                Loading 3D study…
              </p>
            )}
            {(state.status === "fallback" || state.status === "error") && (
              <p className="meta absolute bottom-3 left-3 max-w-[85%] rounded-xs bg-sheet/90 px-2 py-1" role="status">
                {state.status === "error" ? "The 3D view could not start; showing the still study." : "3D view unavailable here; showing the still study and drawings."}
              </p>
            )}
            {webgl === "yes" && coarse && (state.status === "poster" || (state.status === "interactive" && !engaged)) && (
              <button
                type="button"
                className="control control-primary absolute bottom-3 left-3"
                onClick={() => {
                  if (state.status === "poster") dispatch({ type: "engage" });
                  setEngaged(true);
                }}
              >
                Explore in 3D
              </button>
            )}
            {state.status === "interactive" && coarse && engaged && (
              <button type="button" className="control absolute bottom-3 left-3" onClick={() => setEngaged(false)}>
                Done exploring
              </button>
            )}
            {state.status === "interactive" && (
              <div className="pointer-events-none absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-focus-within/viewer:opacity-100 group-hover/viewer:opacity-100">
                <span className="meta rounded-xs bg-sheet/90 px-2 py-1">{coarse ? (engaged ? "Drag to rotate · pinch to zoom" : "Tap “Explore in 3D” to rotate") : engaged ? "Drag to rotate · scroll to zoom" : "Drag to rotate"}</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2" role="toolbar" aria-label={`${subject} viewer controls`}>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Views">
              {spec.presets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="control"
                  aria-pressed={p.id === state.presetId}
                  title={p.description}
                  onClick={() => {
                    dispatch({ type: "preset", id: p.id });
                    announce(`${p.label} view. ${p.description}`);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-1" role="group" aria-label="Camera">
              <button type="button" className="control control-icon" aria-label={rotateLabel} aria-pressed={state.autoRotate} disabled={state.status !== "interactive" || reduced} title={reduced ? "Rotation is off while reduced motion is on" : rotateLabel} onClick={() => dispatch({ type: "rotate", on: !state.autoRotate, byUser: true })}>
                {state.autoRotate ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              </button>
              <button type="button" className="control control-icon" aria-label="Zoom in" disabled={state.status !== "interactive"} onClick={() => dispatch({ type: "zoom", direction: 1 })}>
                <ZoomIn size={16} aria-hidden />
              </button>
              <button type="button" className="control control-icon" aria-label="Zoom out" disabled={state.status !== "interactive"} onClick={() => dispatch({ type: "zoom", direction: -1 })}>
                <ZoomOut size={16} aria-hidden />
              </button>
              <button type="button" className="control control-icon" aria-label="Reset view" disabled={state.status !== "interactive"} onClick={() => dispatch({ type: "reset" })}>
                <RotateCcw size={16} aria-hidden />
              </button>
              <button type="button" className="control control-icon" aria-label={state.fullscreen ? "Exit full screen" : "Full screen"} aria-pressed={state.fullscreen} onClick={() => setFullscreen(!state.fullscreen)}>
                {state.fullscreen ? <Minimize2 size={16} aria-hidden /> : <Maximize2 size={16} aria-hidden />}
              </button>
            </div>
          </div>

          {(spec.assembly || (spec.lightStudy && !compact)) && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {spec.assembly && (
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor={`${id}-assembly`} className="text-sm font-medium">
                      {spec.assembly.label}
                    </label>
                    <span className="meta tabular" aria-hidden>
                      {Math.round(state.assembly * 100)}%
                    </span>
                  </div>
                  <Slider.Root
                    id={`${id}-assembly`}
                    className="relative mt-2 flex h-6 w-full touch-none select-none items-center"
                    min={0}
                    max={100}
                    step={1}
                    value={[Math.round(state.assembly * 100)]}
                    onValueChange={([v]) => dispatch({ type: "assembly", value: v / 100 })}
                    aria-label={spec.assembly.label}
                  >
                    <Slider.Track className="relative h-px w-full grow bg-rule">
                      <Slider.Range className="absolute h-px bg-ink" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-4 w-4 rounded-full border border-ink bg-sheet shadow-control hover:bg-chalk" aria-valuetext={`${Math.round(state.assembly * 100)}% separated`} />
                  </Slider.Root>
                  <p className="meta mt-1">{spec.assembly.description}</p>
                </div>
              )}
              {spec.lightStudy && !compact && (
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor={`${id}-light`} className="text-sm font-medium">
                      {spec.lightStudy.label}
                    </label>
                    <span className="meta tabular" aria-hidden>
                      {state.lightStudy < 0.33 ? "Morning" : state.lightStudy < 0.66 ? "Midday" : "Evening"}
                    </span>
                  </div>
                  <Slider.Root
                    id={`${id}-light`}
                    className="relative mt-2 flex h-6 w-full touch-none select-none items-center"
                    min={0}
                    max={100}
                    step={1}
                    value={[Math.round(state.lightStudy * 100)]}
                    onValueChange={([v]) => dispatch({ type: "light", value: v / 100 })}
                    aria-label={spec.lightStudy.label}
                  >
                    <Slider.Track className="relative h-px w-full grow bg-rule">
                      <Slider.Range className="absolute h-px bg-ink" />
                    </Slider.Track>
                    <Slider.Thumb className="block h-4 w-4 rounded-full border border-ink bg-sheet shadow-control hover:bg-chalk" aria-valuetext={`${state.lightStudy < 0.33 ? "morning" : state.lightStudy < 0.66 ? "midday" : "evening"} light`} />
                  </Slider.Root>
                  <p className="meta mt-1">{spec.lightStudy.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Hotspots: a DOM list so the information is reachable without the canvas. */}
          {spec.hotspots.length > 0 && !compact && (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="meta meta-strong">Points of interest</p>
                <label className="meta ml-auto flex items-center gap-2">
                  <input type="checkbox" checked={state.hotspotsVisible} onChange={(e) => dispatch({ type: "hotspots", visible: e.target.checked })} className="accent-copper-deep" />
                  Show markers in 3D
                </label>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1">
                {spec.hotspots.map((h) => (
                  <li key={h.id}>
                    <button type="button" className="control" aria-pressed={state.focusedHotspot === h.id} onClick={() => dispatch({ type: "hotspot", id: state.focusedHotspot === h.id ? null : h.id })}>
                      {h.label}
                    </button>
                  </li>
                ))}
              </ul>
              {hotspot && (
                <div className="mt-3 border-l-2 border-copper pl-3" aria-live="polite">
                  <p className="font-display text-lg">{hotspot.label}</p>
                  <p className="mt-1 text-sm text-ink-2">{hotspot.body}</p>
                  <p className="meta mt-1">
                    Source: {hotspot.sourceRef.file === "portfolio" ? "portfolio" : "dissertation"}, p.{hotspot.sourceRef.page}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Provenance */}
          <details id={`${id}-disclosure`} className={cn("text-sm", compact ? "mt-3" : "mt-4")}>
            <summary className="flex cursor-pointer list-none items-center gap-2 text-ink-2">
              <ChevronDown size={14} aria-hidden className="transition-transform [details[open]_&]:rotate-180" />
              <span>{spec.label}</span>
            </summary>
            <div className="mt-2 max-w-prose space-y-2 text-ink-2">
              <p>{spec.disclosure}</p>
              <ul className="list-disc space-y-1 pl-5">
                {spec.assumptions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="meta">
                Based on: {spec.basedOn.map((r) => `${r.file === "portfolio" ? "portfolio" : "dissertation"} p.${r.page}${r.note ? ` (${r.note})` : ""}`).join("; ")}
              </p>
            </div>
          </details>
          <p className="sr-only" aria-live="polite">
            {liveMessage}
          </p>
          {children}
        </div>

        {pairedDrawing && (
          <aside className="lg:pt-0" aria-label={`Drawing paired with the ${preset.label} view`}>
            <p className="meta meta-strong mb-2">Paired drawing · {preset.label}</p>
            <Figure asset={pairedDrawing} size="third" />
            <p className="mt-2 text-sm text-ink-2">{preset.description}</p>
            <button type="button" className="control mt-3" onClick={(e) => inspector.open(pairedDrawing, e.currentTarget)}>
              Open source drawing
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}
