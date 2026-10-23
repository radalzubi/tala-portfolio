/**
 * Pan/zoom controller for the drawing inspector.
 *
 * The view (zoom, offset) lives here, outside React. Pointer, wheel and keyboard handlers mutate it;
 * one requestAnimationFrame writes a single CSS transform; React subscribes (useSyncExternalStore) to a
 * coarse snapshot — the rounded zoom label and the limit flags — so only the toolbar re-renders, and only
 * when that label changes.
 *
 * Coordinate model: the transformed element is `content.width × content.height` CSS px, positioned with
 * its top-left corner at the stage centre and `transform-origin: 0 0`. The view offset (x, y) is where the
 * image centre sits relative to the stage centre, in stage px. Zoom 1× is "fit": the image fits the stage
 * (less FIT_PADDING) but is never drawn larger than CONTENT_CAP × its own pixel size, because the sources
 * are small and anything beyond that is pure blur.
 */

export interface Size {
  width: number;
  height: number;
}
export interface Point {
  x: number;
  y: number;
}
export interface View {
  zoom: number;
  x: number;
  y: number;
}
export interface Geometry {
  /** CSS scale of the content element at zoom 1×. */
  baseScale: number;
  /** Largest zoom allowed for this stage/content pair (≥ 1). */
  maxZoom: number;
}
export interface ViewSnapshot {
  /** Readout text, e.g. "1.0×". */
  label: string;
  /** Zoom rounded to the readout precision (one decimal). */
  zoom: number;
  atMin: boolean;
  atMax: boolean;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;
/** Never render the content larger than this multiple of its own pixel width. */
export const CONTENT_CAP = 2;
export const ZOOM_STEP = 1.5;
export const TOGGLE_ZOOM = 2.5;
/** Duration of an animated zoom step (buttons, keys, double-tap). */
export const ZOOM_DURATION = 180;
/** Breathing room around the fitted image at 1×, in stage px. */
export const FIT_PADDING = 24;
/** Arrow-key pan distance in stage px (× 4 with Shift). */
export const KEY_PAN_STEP = 48;

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function computeGeometry(stage: Size, content: Size): Geometry {
  const availW = Math.max(1, stage.width - FIT_PADDING * 2);
  const availH = Math.max(1, stage.height - FIT_PADDING * 2);
  const fit = Math.min(availW / content.width, availH / content.height);
  const baseScale = Math.min(fit, CONTENT_CAP);
  const maxZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, CONTENT_CAP / baseScale));
  return { baseScale, maxZoom };
}

/** Keeps the zoom inside [1, maxZoom] and the image edges inside the stage once it overflows. */
export function clampView(view: View, stage: Size, content: Size, geometry: Geometry): View {
  const zoom = clamp(view.zoom, MIN_ZOOM, geometry.maxZoom);
  const scale = geometry.baseScale * zoom;
  const limitX = Math.max(0, (content.width * scale - stage.width) / 2);
  const limitY = Math.max(0, (content.height * scale - stage.height) / 2);
  return { zoom, x: clamp(view.x, -limitX, limitX), y: clamp(view.y, -limitY, limitY) };
}

/** New view with `zoom`, keeping the image point under `anchor` (stage-centre coordinates) still. */
export function zoomAbout(view: View, zoom: number, anchor: Point): View {
  const ratio = zoom / view.zoom;
  return {
    zoom,
    x: anchor.x - (anchor.x - view.x) * ratio,
    y: anchor.y - (anchor.y - view.y) * ratio,
  };
}

export function formatZoom(zoom: number): string {
  return `${zoom.toFixed(1)}×`;
}

const ORIGIN: Point = { x: 0, y: 0 };
const INITIAL_VIEW: View = { zoom: 1, x: 0, y: 0 };

interface Animation {
  from: View;
  to: View;
  start: number;
  duration: number;
}

export class PanZoomController {
  private view: View = INITIAL_VIEW;
  private stage: Size = { width: 1, height: 1 };
  private content: Size = { width: 1, height: 1 };
  private geometry: Geometry = { baseScale: 1, maxZoom: 1 };
  private stageEl: HTMLElement | null = null;
  private element: HTMLElement | null = null;
  private frame = 0;
  private animation: Animation | null = null;
  private listeners = new Set<() => void>();
  private snapshot: ViewSnapshot = { label: formatZoom(1), zoom: 1, atMin: true, atMax: true };

  /** Binds the stage (for measuring and anchors) and the element that receives the transform. */
  attach(stageEl: HTMLElement, element: HTMLElement, content: Size): void {
    this.stageEl = stageEl;
    this.element = element;
    this.content = { width: Math.max(1, content.width), height: Math.max(1, content.height) };
    this.animation = null;
    this.view = INITIAL_VIEW;
    this.stage = { width: Math.max(1, stageEl.clientWidth), height: Math.max(1, stageEl.clientHeight) };
    this.geometry = computeGeometry(this.stage, this.content);
    // First paint is synchronous so the image never flashes at its untransformed size.
    this.write();
    element.style.visibility = "";
    this.publish();
  }

  detach(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.animation = null;
    this.stageEl = null;
    this.element = null;
  }

  setStageSize(size: Size): void {
    this.stage = { width: Math.max(1, size.width), height: Math.max(1, size.height) };
    this.geometry = computeGeometry(this.stage, this.content);
    this.view = this.clamp(this.view);
    if (this.animation) this.animation.to = this.clamp(this.animation.to);
    this.schedule();
  }

  getView(): View {
    return this.view;
  }

  /** Stage-centre coordinates of a client-space point (pointer events). */
  anchorFromClient(clientX: number, clientY: number): Point {
    const el = this.stageEl;
    if (!el) return ORIGIN;
    const rect = el.getBoundingClientRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  }

  /** Immediate pan by a delta in stage px (drag, arrow keys). Cancels any running animation. */
  panBy(dx: number, dy: number): void {
    const base = this.animation ? this.animation.to : this.view;
    this.animation = null;
    this.view = this.clamp({ ...base, x: base.x + dx, y: base.y + dy });
    this.schedule();
  }

  /** Multiply the zoom, keeping the point under `anchor` still (wheel, pinch, buttons). */
  zoomBy(factor: number, anchor: Point = ORIGIN, animate = false): void {
    const base = this.animation ? this.animation.to : this.view;
    this.zoomTo(base.zoom * factor, anchor, animate);
  }

  zoomTo(zoom: number, anchor: Point = ORIGIN, animate = false): void {
    const base = this.animation ? this.animation.to : this.view;
    const target = clamp(zoom, MIN_ZOOM, this.geometry.maxZoom);
    this.apply(this.clamp(zoomAbout(base, target, anchor)), animate);
  }

  /** One toolbar / keyboard step in or out, about the stage centre. */
  zoomStep(direction: 1 | -1, animate: boolean): void {
    this.zoomBy(direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP, ORIGIN, animate);
  }

  /** Double-click / double-tap: back to 1× when zoomed, otherwise TOGGLE_ZOOM about the tap point. */
  toggleZoom(anchor: Point, animate: boolean): void {
    const base = this.animation ? this.animation.to : this.view;
    if (base.zoom > MIN_ZOOM + 0.01) this.reset(animate);
    else this.zoomTo(TOGGLE_ZOOM, anchor, animate);
  }

  /** Back to 1×, centred. */
  reset(animate: boolean): void {
    this.apply(INITIAL_VIEW, animate);
  }

  /** Fill the stage width and start at the top edge (useful for portrait sheets on wide screens). */
  fitWidth(animate: boolean): void {
    const avail = Math.max(1, this.stage.width - FIT_PADDING * 2);
    const zoom = clamp(avail / (this.geometry.baseScale * this.content.width), MIN_ZOOM, this.geometry.maxZoom);
    const scale = this.geometry.baseScale * zoom;
    const top = Math.max(0, (this.content.height * scale - this.stage.height) / 2);
    this.apply(this.clamp({ zoom, x: 0, y: top }), animate);
  }

  cancelAnimation(): void {
    if (!this.animation) return;
    this.view = this.animation.to;
    this.animation = null;
    this.schedule();
  }

  // --- external store -----------------------------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ViewSnapshot => this.snapshot;

  // --- internals ----------------------------------------------------------------------------------

  private clamp(view: View): View {
    return clampView(view, this.stage, this.content, this.geometry);
  }

  private apply(target: View, animate: boolean): void {
    if (animate && this.element) {
      this.animation = { from: this.view, to: target, start: -1, duration: ZOOM_DURATION };
    } else {
      this.animation = null;
      this.view = target;
    }
    this.schedule();
  }

  private schedule(): void {
    if (this.frame || !this.element) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (now: number): void => {
    this.frame = 0;
    const anim = this.animation;
    if (anim) {
      if (anim.start < 0) anim.start = now;
      const t = clamp((now - anim.start) / anim.duration, 0, 1);
      if (t >= 1) {
        this.view = anim.to;
        this.animation = null;
      } else {
        const k = easeOut(t);
        this.view = {
          zoom: anim.from.zoom + (anim.to.zoom - anim.from.zoom) * k,
          x: anim.from.x + (anim.to.x - anim.from.x) * k,
          y: anim.from.y + (anim.to.y - anim.from.y) * k,
        };
        this.schedule();
      }
    }
    this.write();
    this.publish();
  };

  private write(): void {
    const el = this.element;
    if (!el) return;
    const scale = this.geometry.baseScale * this.view.zoom;
    const tx = this.view.x - (this.content.width * scale) / 2;
    const ty = this.view.y - (this.content.height * scale) / 2;
    el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  }

  /** Replaces the snapshot only when something visible to React changed, so subscribers stay quiet. */
  private publish(): void {
    const target = this.animation ? this.animation.to : this.view;
    const label = formatZoom(this.view.zoom);
    const atMin = target.zoom <= MIN_ZOOM + 0.001;
    const atMax = target.zoom >= this.geometry.maxZoom - 0.001;
    const prev = this.snapshot;
    if (prev.label === label && prev.atMin === atMin && prev.atMax === atMax) return;
    this.snapshot = { label, zoom: Number(this.view.zoom.toFixed(1)), atMin, atMax };
    this.listeners.forEach((l) => l());
  }
}
