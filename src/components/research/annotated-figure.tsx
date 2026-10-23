"use client";

import { useId, type CSSProperties } from "react";
import type { AnnotationShape, CaseAnnotation, MediaAsset, ResearchTheme } from "@/content/types";
import { cn } from "@/lib/cn";
import { pictureSources } from "./figure-sources";

export interface AnnotatedFigureProps {
  asset: MediaAsset;
  /** All annotations for the case; the component picks those for this asset and the active theme. */
  annotations: CaseAnnotation[];
  activeTheme: ResearchTheme;
  showAnnotations: boolean;
  /** Reduced-motion preference: shapes appear at once and the pencil-wobble filter is skipped. */
  reduced: boolean;
  /** `sizes` attribute for the responsive srcset. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/** Overlay viewBox width; the height follows the figure's aspect ratio. */
const VB_W = 1000;
const STAGGER_MS = 140;

/*
 * Draw-on animation. The stroke is dashed with the normalised `pathLength` (100) and the offset runs
 * from 100 to 0, so CSS does the work with no per-frame React updates. The site's `--dur-*` tokens
 * already collapse to 1 ms under reduced motion; `data-draw="off"` removes the animation outright.
 */
const ANNOTATION_CSS = `
.cx-shape{stroke-dasharray:100;stroke-dashoffset:0}
.cx-shape[data-draw="on"]{animation:cx-draw var(--dur-slow,700ms) cubic-bezier(0.25,1,0.5,1) both;animation-delay:var(--cx-delay,0ms)}
.cx-label[data-draw="on"]{animation:cx-fade var(--dur-base,280ms) cubic-bezier(0.25,1,0.5,1) both;animation-delay:calc(var(--cx-delay,0ms) + var(--dur-slow,700ms) * 0.55)}
@keyframes cx-draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
@keyframes cx-fade{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
`;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));

/**
 * The content contract says rect/ellipse coords are `[x, y, w, h]` in 0–1 figure space. Some records
 * are written as corners `[x1, y1, x2, y2]` instead; those are detectable because a `[x, y, w, h]`
 * reading would run past the figure edge. The decision is made per annotation and shape type so a
 * whole set of boxes is read consistently.
 */
function looksLikeCorners(coords: number[]): boolean {
  const [x = 0, y = 0, c = 0, d = 0] = coords;
  return c > x && d > y && c <= 1 && d <= 1 && (x + c > 1 || y + d > 1);
}

function boxFromCoords(coords: number[], asCorners: boolean): Box {
  const [a = 0, b = 0, c = 0, d = 0] = coords;
  const x1 = clamp01(a);
  const y1 = clamp01(b);
  const x2 = clamp01(asCorners ? c : a + c);
  const y2 = clamp01(asCorners ? d : b + d);
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

/** Approximate bounds of path data in 0–1 space (control points included), for label placement. */
function pathBounds(d: string): Box {
  const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const x = clamp01(numbers[i]);
    const y = clamp01(numbers[i + 1]);
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return { x: 0, y: 0, w: 1, h: 1 };
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

interface PlacedShape {
  shape: AnnotationShape;
  box: Box;
  key: string;
}

function placeShapes(shapes: AnnotationShape[]): PlacedShape[] {
  const cornersFor = (type: AnnotationShape["type"]) =>
    shapes.some((s) => s.type === type && Array.isArray(s.coords) && looksLikeCorners(s.coords));
  const rectCorners = cornersFor("rect");
  const ellipseCorners = cornersFor("ellipse");
  return shapes.map((shape, i) => {
    let box: Box;
    if (shape.type === "path" || typeof shape.coords === "string") {
      box = pathBounds(typeof shape.coords === "string" ? shape.coords : "");
    } else {
      box = boxFromCoords(shape.coords, shape.type === "ellipse" ? ellipseCorners : rectCorners);
    }
    return { shape, box, key: `${i}-${shape.type}-${shape.label}` };
  });
}

/**
 * Label box position in percentages of the figure. Above the shape when there is room, otherwise just
 * inside its top edge; anchored to whichever side keeps it inside the figure.
 */
function labelStyle(box: Box, delay: number): CSSProperties {
  const style: Record<string, string> = { maxWidth: "46%", "--cx-delay": `${delay}ms` };
  if (box.y > 0.1) style.bottom = `calc(${((1 - box.y) * 100).toFixed(2)}% + 4px)`;
  else style.top = `calc(${(box.y * 100).toFixed(2)}% + 4px)`;
  if (box.x + box.w / 2 <= 0.5) style.left = `${(box.x * 100).toFixed(2)}%`;
  else style.right = `${((1 - (box.x + box.w)) * 100).toFixed(2)}%`;
  return style as CSSProperties;
}

function ShapeMark({ placed, vbH, index, drawOn }: { placed: PlacedShape; vbH: number; index: number; drawOn: boolean }) {
  const { shape, box } = placed;
  const common = {
    className: "cx-shape",
    pathLength: 100,
    "data-draw": drawOn ? "on" : "off",
    style: { "--cx-delay": `${index * STAGGER_MS}ms` } as CSSProperties,
  };
  if (shape.type === "ellipse") {
    return (
      <ellipse
        cx={(box.x + box.w / 2) * VB_W}
        cy={(box.y + box.h / 2) * vbH}
        rx={(box.w / 2) * VB_W}
        ry={(box.h / 2) * vbH}
        {...common}
      />
    );
  }
  if (shape.type === "path" && typeof shape.coords === "string") {
    // Path data is in 0–1 space; scale it into the viewBox and keep the stroke width constant.
    return (
      <g transform={`scale(${VB_W} ${vbH})`}>
        <path d={shape.coords} vectorEffect="non-scaling-stroke" {...common} />
      </g>
    );
  }
  return <rect x={box.x * VB_W} y={box.y * vbH} width={box.w * VB_W} height={box.h * vbH} rx={6} ry={6} {...common} />;
}

export function AnnotatedFigure({
  asset,
  annotations,
  activeTheme,
  showAnnotations,
  reduced,
  sizes = "(min-width: 64rem) 55vw, 100vw",
  priority = false,
  className,
}: AnnotatedFigureProps) {
  const rawId = useId();
  const filterId = `cx-pencil-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sources = pictureSources(asset);
  const vbH = Math.max(1, Math.round((VB_W * sources.height) / sources.width));

  const shapes = annotations
    .filter((a) => a.mediaId === asset.id && a.theme === activeTheme)
    .flatMap((a) => a.shapes);
  const placed = placeShapes(shapes);
  const visible = showAnnotations && placed.length > 0;
  const drawOn = !reduced;
  // Remounting the overlay on these changes restarts the CSS draw-on.
  const drawKey = `${asset.id}|${activeTheme}|${showAnnotations ? "on" : "off"}`;

  return (
    <>
      <style href="cairo-annotated-figure" precedence="default">
        {ANNOTATION_CSS}
      </style>
      <div
        className={cn("relative w-full overflow-hidden bg-sheet", className)}
        style={{
          aspectRatio: `${sources.width} / ${sources.height}`,
          maxWidth: asset.lowResolution ? `${asset.native[0]}px` : undefined,
          backgroundColor: asset.tone,
          backgroundImage: asset.placeholder ? `url(${asset.placeholder})` : undefined,
          backgroundSize: "cover",
        }}
      >
        <picture className="absolute inset-0 block h-full w-full">
          {sources.webpSrcSet && <source type="image/webp" srcSet={sources.webpSrcSet} sizes={sizes} />}
          <img
            src={sources.fallbackSrc}
            srcSet={sources.fallbackSrcSet ?? undefined}
            sizes={sizes}
            width={sources.width}
            height={sources.height}
            alt={asset.alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="h-full w-full object-contain"
          />
        </picture>

        {visible && (
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox={`0 0 ${VB_W} ${vbH}`}
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            {!reduced && (
              <defs>
                {/* A faint displacement gives the overlay the wobble of a pencil line over the artwork. */}
                <filter id={filterId} filterUnits="userSpaceOnUse" x={-30} y={-30} width={VB_W + 60} height={vbH + 60}>
                  <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={7} result="grain" />
                  <feDisplacementMap in="SourceGraphic" in2="grain" scale={4.5} xChannelSelector="R" yChannelSelector="G" />
                </filter>
              </defs>
            )}
            <g
              key={drawKey}
              fill="none"
              className="stroke-pencil"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.92}
              filter={reduced ? undefined : `url(#${filterId})`}
            >
              {placed.map((p, i) => (
                <ShapeMark key={p.key} placed={p} vbH={vbH} index={i} drawOn={drawOn} />
              ))}
            </g>
          </svg>
        )}

        {visible && (
          <ul key={drawKey} aria-label="Annotations" className="pointer-events-none absolute inset-0 m-0 list-none p-0">
            {placed.map((p, i) => (
              <li
                key={p.key}
                className="cx-label absolute"
                data-draw={drawOn ? "on" : "off"}
                style={labelStyle(p.box, i * STAGGER_MS)}
              >
                <span className="inline-block border-l-2 border-pencil bg-chalk/95 px-1.5 py-0.5 font-sans text-2xs leading-tight text-ink shadow-control">
                  {p.shape.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
