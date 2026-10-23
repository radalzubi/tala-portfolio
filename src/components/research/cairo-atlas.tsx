"use client";

import * as Switch from "@radix-ui/react-switch";
import { ZoomIn } from "lucide-react";
import { useId, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { sourceLabel, useInspector } from "@/components/media";
import { useMotionPreference } from "@/components/motion/motion-provider";
import type { MediaAsset, ResearchCase, ResearchChapter, ResearchTheme, SourceRef } from "@/content/types";
import { cn } from "@/lib/cn";
import { AnnotatedFigure } from "./annotated-figure";
import {
  DEFAULT_THEME,
  THEME_IDS,
  getSearchSnapshot,
  getServerSearchSnapshot,
  parseAtlasSearch,
  subscribeSearch,
  writeAtlasSearch,
} from "./atlas-url";
import { figureLabel, pictureSources } from "./figure-sources";

export interface CairoAtlasProps {
  chapter: ResearchChapter;
  /** Media records keyed by id (`cx-fig-01` …). Figures that are not present render as quiet placeholders. */
  figures: Record<string, MediaAsset>;
  className?: string;
}

const THEME_LABELS: Record<ResearchTheme, string> = {
  "built-form": "Built form",
  "street-life": "Street life",
  "climate-response": "Climate response",
  identity: "Identity",
};

/**
 * Schematic positions (percent of the field) on two axes: planned → grown across, formal → informal
 * down. They encode the dissertation's contrasting conditions, nothing geographic. Mobile and md+
 * positions differ only to keep the cards clear of each other.
 */
interface FieldSlot {
  x: number;
  y: number;
  mdX: number;
  mdY: number;
  tag: string;
}
const FIELD_SLOTS: Record<ResearchCase["id"], FieldSlot> = {
  "new-administrative-capital": { x: 24, y: 16, mdX: 22, mdY: 18, tag: "Planned · formal" },
  zamalek: { x: 32, y: 50, mdX: 40, mdY: 52, tag: "Historic · formal, under pressure" },
  "west-el-balad": { x: 68, y: 50, mdX: 62, mdY: 52, tag: "Historic · formal, under pressure" },
  ashwaiyat: { x: 76, y: 84, mdX: 82, mdY: 82, tag: "Grown · informal" },
};
const FALLBACK_SLOT: FieldSlot = { x: 50, y: 50, mdX: 50, mdY: 50, tag: "" };

const FIGURE_SIZES = "(min-width: 64rem) 52vw, (min-width: 48rem) 60vw, 100vw";
const THUMB_SIZES = "6rem";

function pageRef(ref: SourceRef): string {
  return `${ref.file === "dissertation" ? "Dissertation" : "Portfolio"}, p.${ref.page}`;
}
function citeLine(ref: SourceRef): string {
  return ref.note ? `${pageRef(ref)} — ${ref.note}` : pageRef(ref);
}

/** Small `<picture>` for the field cards and thumbnail strip; decorative, the button carries the name. */
function Thumb({ asset, sizes, className }: { asset: MediaAsset | undefined; sizes: string; className?: string }) {
  if (!asset) return <span className="meta flex h-full w-full items-center justify-center">—</span>;
  const s = pictureSources(asset);
  return (
    <picture className="block h-full w-full">
      {s.webpSrcSet && <source type="image/webp" srcSet={s.webpSrcSet} sizes={sizes} />}
      <img
        src={s.fallbackSrc}
        srcSet={s.fallbackSrcSet ?? undefined}
        sizes={sizes}
        width={s.width}
        height={s.height}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn("h-full w-full object-cover", className)}
      />
    </picture>
  );
}

export function CairoAtlas({ chapter, figures, className }: CairoAtlasProps) {
  const { reduced } = useMotionPreference();
  const inspector = useInspector();
  const baseId = useId();
  const search = useSyncExternalStore(subscribeSearch, getSearchSnapshot, getServerSearchSnapshot);

  const cases = chapter.cases;
  const caseIds = cases.map((c) => c.id);
  const defaults = { caseId: caseIds[0] ?? "", theme: DEFAULT_THEME };
  const state = parseAtlasSearch(search, caseIds);
  const selected = cases.find((c) => c.id === state.caseId) ?? cases[0];
  const theme = state.theme;
  const themes = THEME_IDS.map((id) => ({
    id,
    label: chapter.comparison.find((c) => c.theme === id)?.label ?? THEME_LABELS[id],
  }));
  const themeLabel = themes.find((t) => t.id === theme)?.label ?? THEME_LABELS[theme];

  // An explicit thumbnail choice; it is dropped when the case changes or the theme asks for another drawing.
  const [pick, setPick] = useState<{ caseId: string; theme: ResearchTheme; mediaId: string } | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const tabRefs = useRef<Map<string, HTMLButtonElement> | null>(null);

  if (!selected) return null;

  const hasAnnotation = (mediaId: string, t: ResearchTheme) =>
    selected.annotations.some((a) => a.mediaId === mediaId && a.theme === t);
  const pickedInCase = pick && pick.caseId === selected.id && selected.figures.includes(pick.mediaId) ? pick.mediaId : null;
  const currentMediaId =
    pickedInCase && (pick?.theme === theme || hasAnnotation(pickedInCase, theme))
      ? pickedInCase
      : (selected.figures.find((id) => hasAnnotation(id, theme)) ?? pickedInCase ?? selected.figures[0]);
  const currentAsset = currentMediaId ? figures[currentMediaId] : undefined;
  const currentAnnotations = currentMediaId
    ? selected.annotations.filter((a) => a.mediaId === currentMediaId && a.theme === theme)
    : [];
  const activeNote = currentAnnotations[0];
  const comparison = chapter.comparison.find((c) => c.theme === theme);

  const selectCase = (caseId: string) => writeAtlasSearch({ caseId, theme }, defaults);
  const selectTheme = (next: ResearchTheme) => writeAtlasSearch({ caseId: selected.id, theme: next }, defaults);

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = `${baseId}-panel`;
  const fieldNoteId = `${baseId}-field-note`;
  const fieldAxesId = `${baseId}-field-axes`;
  const comparisonId = `${baseId}-comparison`;
  const observationsId = `${baseId}-observations`;
  const quotesId = `${baseId}-quotes`;
  const switchId = `${baseId}-annotations`;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const count = cases.length;
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % count;
    else if (event.key === "ArrowLeft") next = (index - 1 + count) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    if (next === null) return;
    event.preventDefault();
    const target = cases[next];
    selectCase(target.id);
    tabRefs.current?.get(target.id)?.focus();
  };

  const observationGroups = themes
    .map((t) => ({ ...t, items: selected.observations.filter((o) => o.theme === t.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className={cn("cairo-atlas", className)}>
      {/* ------------------------------------------------------------------ Schematic field */}
      <section aria-label="Schematic field of the four cases">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-x-2 gap-y-2 md:gap-x-3">
          <div aria-hidden="true" className="flex flex-col items-center justify-between py-1">
            <span className="meta rotate-180 [writing-mode:vertical-rl]">Formal</span>
            <span className="my-2 w-px flex-1 bg-rule-soft" />
            <span className="meta rotate-180 [writing-mode:vertical-rl]">Informal</span>
          </div>

          <div
            role="group"
            aria-label="Cases arranged by spatial condition"
            aria-describedby={`${fieldNoteId} ${fieldAxesId}`}
            className="relative isolate aspect-[3/5] border border-rule bg-sheet shadow-sheet md:aspect-[4/3] lg:aspect-video"
          >
            <svg aria-hidden="true" focusable="false" className="pointer-events-none absolute inset-0 h-full w-full">
              <line x1="50%" y1="3%" x2="50%" y2="97%" className="stroke-rule-soft" strokeDasharray="2 7" strokeWidth={1} />
              <line x1="3%" y1="50%" x2="97%" y2="50%" className="stroke-rule-soft" strokeDasharray="2 7" strokeWidth={1} />
            </svg>
            <p id={fieldNoteId} className="meta absolute right-2 top-2 max-w-[58%] text-right md:right-3">
              Schematic arrangement by spatial condition — not a map
            </p>
            <p id={fieldAxesId} className="sr-only">
              Across: planned to grown. Down: formal to informal. Positions describe each case’s condition and carry
              no geographic meaning.
            </p>

            {cases.map((c) => {
              const slot = FIELD_SLOTS[c.id] ?? FALLBACK_SLOT;
              const active = c.id === selected.id;
              const first = c.figures[0];
              const asset = first ? figures[first] : undefined;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectCase(c.id)}
                  style={
                    {
                      "--fx": `${slot.x}%`,
                      "--fy": `${slot.y}%`,
                      "--fx-md": `${slot.mdX}%`,
                      "--fy-md": `${slot.mdY}%`,
                    } as CSSProperties
                  }
                  className={cn(
                    "absolute isolate left-(--fx) top-(--fy) w-[clamp(6.5rem,30%,11rem)] -translate-x-1/2 -translate-y-1/2 border bg-sheet p-1.5 text-left transition-colors duration-(--dur-fast) ease-out md:left-(--fx-md) md:top-(--fy-md) md:w-[clamp(6.5rem,17%,11rem)]",
                    "before:absolute before:inset-0 before:-z-10 before:translate-x-[3px] before:translate-y-[3px] before:border before:content-['']",
                    active
                      ? "border-pencil before:border-pencil/60"
                      : "border-rule before:border-rule-soft hover:border-ink",
                  )}
                >
                  <span className="block aspect-[4/3] overflow-hidden" style={{ backgroundColor: asset?.tone }}>
                    <Thumb asset={asset} sizes="11rem" />
                  </span>
                  <span className="mt-1.5 block font-display text-sm leading-tight text-ink">{c.name}</span>
                  <span className="mt-0.5 block text-2xs leading-tight text-ink-2">{slot.tag}</span>
                </button>
              );
            })}
          </div>

          <div aria-hidden="true" />
          <div aria-hidden="true" className="flex items-center justify-between">
            <span className="meta">Planned</span>
            <span className="mx-2 h-px flex-1 bg-rule-soft" />
            <span className="meta">Grown</span>
          </div>
        </div>
        <p className="meta mt-3 max-w-prose">
          The axes are the dissertation’s own contrasts — planned against organic, formal against informal. Nothing here is
          located; choose a case to read it.
        </p>
      </section>

      {/* ------------------------------------------------------------------ Case tabs + theme control */}
      <div className="mt-10 hairline-b">
        <div role="tablist" aria-label="Case study" className="-mb-px flex gap-1 overflow-x-auto">
          {cases.map((c, i) => {
            const active = c.id === selected.id;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  if (!tabRefs.current) tabRefs.current = new Map();
                  const map = tabRefs.current;
                  map.set(c.id, el as HTMLButtonElement);
                  return () => {
                    map.delete(c.id);
                  };
                }}
                type="button"
                role="tab"
                id={tabId(c.id)}
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                onClick={() => selectCase(c.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-3 font-display text-lg leading-none whitespace-nowrap transition-colors duration-(--dur-fast) ease-out first:pl-0",
                  active ? "border-pencil text-ink" : "border-transparent text-ink-2 hover:text-ink",
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="meta meta-strong">Theme</span>
        <div role="group" aria-label="Theme" className="flex flex-wrap gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === theme}
              onClick={() => selectTheme(t.id)}
              className="control"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ Selected case */}
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(selected.id)}
        className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-x-8"
      >
        {/* Reading panel */}
        <article className="order-2 lg:order-1 lg:col-span-5">
          <p className="meta">
            Case {cases.indexOf(selected) + 1} of {cases.length}
          </p>
          <h3 className="heading mt-2 text-ink">{selected.name}</h3>
          <p className="mt-2 max-w-prose text-sm text-ink-2">{selected.condition}</p>
          <div className="prose-editorial mt-6 text-ink">
            <p>{selected.summary}</p>
          </div>

          <section aria-labelledby={observationsId} className="mt-8 hairline-t pt-5">
            <h4 id={observationsId} className="meta meta-strong">
              Observations
            </h4>
            <dl className="mt-4 space-y-5">
              {observationGroups.map((g) => {
                const active = g.id === theme;
                return (
                  <div
                    key={g.id}
                    className={cn(
                      "border-l pl-4 transition-colors duration-(--dur-fast) ease-out",
                      active ? "border-l-2 border-pencil" : "border-rule-soft",
                    )}
                  >
                    <dt className="text-xs font-medium text-ink">{g.label}</dt>
                    {g.items.map((o, i) => (
                      <dd key={i} className="mt-1 text-sm text-ink">
                        {o.text} <span className="meta whitespace-nowrap">{pageRef(o.sourceRef)}</span>
                      </dd>
                    ))}
                  </div>
                );
              })}
            </dl>
          </section>

          {selected.quotes.length > 0 && (
            <section aria-labelledby={quotesId} className="mt-8 hairline-t pt-5">
              <h4 id={quotesId} className="meta meta-strong">
                From the dissertation
              </h4>
              <div className="mt-4 space-y-5">
                {selected.quotes.map((q, i) => (
                  <blockquote key={i} className="font-display text-lg leading-snug text-ink">
                    <p>“{q.text}”</p>
                    <cite className="meta mt-2 block not-italic">{citeLine(q.sourceRef)}</cite>
                  </blockquote>
                ))}
              </div>
            </section>
          )}

          <p className="meta mt-8">Source pages: {selected.pages.join(", ")}</p>
        </article>

        {/* Annotated figure viewer */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <figure className="m-0">
            {currentAsset ? (
              <AnnotatedFigure
                asset={currentAsset}
                annotations={selected.annotations}
                activeTheme={theme}
                showAnnotations={showAnnotations}
                reduced={reduced}
                sizes={FIGURE_SIZES}
                className="border border-rule-soft"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-rule-soft bg-sheet">
                <p className="meta">
                  {currentMediaId
                    ? `Figure ${figureLabel(undefined, currentMediaId) ?? ""} is not available yet.`
                    : "No drawings for this case."}
                </p>
              </div>
            )}
            <figcaption className="mt-4 space-y-3">
              {activeNote ? (
                <p className="border-l-2 border-pencil pl-3 text-sm text-ink">
                  <span className="text-xs font-medium">{themeLabel}. </span>
                  {activeNote.note} <span className="meta whitespace-nowrap">{pageRef(activeNote.sourceRef)}</span>
                </p>
              ) : (
                currentAsset && (
                  <p className="border-l border-rule-soft pl-3 text-sm text-ink-2">
                    No annotation for this theme on this drawing — see the observations.
                  </p>
                )
              )}
              {currentAsset && (
                <div>
                  <p className="text-sm text-ink">{currentAsset.caption}</p>
                  <p className="meta mt-1">
                    {currentAsset.credit} · {sourceLabel(currentAsset.source)}
                    {currentAsset.source.note ? ` — ${currentAsset.source.note}` : ""}
                  </p>
                  {currentAsset.rightsNote && <p className="meta mt-1">{currentAsset.rightsNote}</p>}
                </div>
              )}
            </figcaption>
          </figure>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="flex items-center gap-2.5">
              <Switch.Root
                id={switchId}
                checked={showAnnotations}
                onCheckedChange={setShowAnnotations}
                className="relative h-5 w-9 shrink-0 rounded-full border border-rule bg-sheet shadow-control transition-colors duration-(--dur-fast) ease-out data-[state=checked]:border-ink data-[state=checked]:bg-ink"
              >
                <Switch.Thumb className="block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-ink transition-transform duration-(--dur-fast) ease-out data-[state=checked]:translate-x-[1.125rem] data-[state=checked]:bg-chalk" />
              </Switch.Root>
              <label htmlFor={switchId} className="text-sm text-ink">
                Show annotations
              </label>
            </div>
            {currentAsset && (
              <button
                type="button"
                className="control"
                onClick={(e) => inspector.open(currentAsset, e.currentTarget)}
              >
                <ZoomIn aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                Inspect drawing
              </button>
            )}
          </div>

          {selected.figures.length > 1 && (
            <div role="group" aria-label="Drawings for this case" className="mt-5 flex flex-wrap gap-3">
              {selected.figures.map((id) => {
                const asset = figures[id];
                const n = figureLabel(asset, id);
                const active = id === currentMediaId;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active}
                    aria-label={asset ? `Figure ${n ?? ""}: ${asset.caption}` : `Figure ${n ?? ""} (not available)`}
                    onClick={() => setPick({ caseId: selected.id, theme, mediaId: id })}
                    className={cn(
                      "group w-20 border bg-sheet p-1 text-left transition-colors duration-(--dur-fast) ease-out",
                      active ? "border-pencil" : "border-rule-soft hover:border-ink",
                    )}
                  >
                    <span className="block aspect-[4/3] overflow-hidden" style={{ backgroundColor: asset?.tone }}>
                      <Thumb asset={asset} sizes={THUMB_SIZES} />
                    </span>
                    <span className="meta mt-1 block">fig. {n ?? "—"}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ Theme comparison */}
      <section aria-labelledby={comparisonId} className="mt-14 rule-t pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 id={comparisonId} className="heading text-ink">
            {themeLabel} across the four cases
          </h3>
          <p className="meta">Qualitative readings from the dissertation — not scores</p>
        </div>
        {comparison ? (
          <ul className="mt-6 grid gap-x-6 gap-y-6 md:grid-cols-2 lg:grid-cols-4">
            {cases.map((c) => {
              const active = c.id === selected.id;
              return (
                <li
                  key={c.id}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "border-l pl-4 transition-colors duration-(--dur-fast) ease-out",
                    active ? "border-l-2 border-pencil" : "border-rule-soft",
                  )}
                >
                  <h4 className="font-display text-lg leading-tight text-ink">{c.name}</h4>
                  <p className="mt-2 text-sm text-ink">{comparison.byCase[c.id]}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-ink-2">No comparison recorded for this theme.</p>
        )}
      </section>
    </div>
  );
}
