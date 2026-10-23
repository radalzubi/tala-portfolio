"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import type { MediaAsset } from "@/content/types";
import { useMotionPreference } from "@/components/motion/motion-provider";
import { AssetMeta } from "./asset-meta";
import { largestOf, largestVariant } from "./asset-utils";
import { KEY_PAN_STEP, PanZoomController, TOGGLE_ZOOM, clamp, type Point } from "./pan-zoom";

export interface DrawingInspectorProps {
  asset: MediaAsset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Element that opened the inspector; focus returns to it on close (Safari does not focus clicked buttons). */
  returnFocusTo?: RefObject<HTMLElement | null>;
}

/**
 * Fullscreen Radix dialog showing one drawing at its largest variant inside a pan/zoom stage.
 * Normally mounted once by InspectorProvider; it can also be driven directly with `open`/`asset`.
 *
 * Keyboard (anywhere in the dialog): + / = zoom in, - zoom out, 0 reset, arrow keys pan (Shift: ×4),
 * Escape closes. Pointer: drag to pan, wheel (or trackpad pinch) to zoom about the cursor, two-finger
 * pinch, double-click / double-tap toggles 1× and 2.5×.
 */
export function DrawingInspector({ asset, open, onOpenChange, returnFocusTo }: DrawingInspectorProps) {
  const { reduced } = useMotionPreference();
  const [controller] = useState(() => new PanZoomController());
  const stageRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const animate = !reduced;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const step = event.shiftKey ? KEY_PAN_STEP * 4 : KEY_PAN_STEP;
    // Leave arrow keys to the panel when focus is inside it (it scrolls on small screens).
    const inPanel = event.target instanceof Node && panelRef.current?.contains(event.target) === true;
    switch (event.key) {
      case "+":
      case "=":
        controller.zoomStep(1, animate);
        break;
      case "-":
      case "_":
        controller.zoomStep(-1, animate);
        break;
      case "0":
        controller.reset(animate);
        break;
      case "ArrowLeft":
        if (inPanel) return;
        controller.panBy(step, 0);
        break;
      case "ArrowRight":
        if (inPanel) return;
        controller.panBy(-step, 0);
        break;
      case "ArrowUp":
        if (inPanel) return;
        controller.panBy(0, step);
        break;
      case "ArrowDown":
        if (inPanel) return;
        controller.panBy(0, -step);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <Dialog.Root open={open && asset !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-chalk/95" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col text-ink outline-none lg:flex-row"
          onKeyDown={onKeyDown}
          onOpenAutoFocus={(event) => {
            // Land on the stage so arrow keys and +/- work straight away.
            const stage = stageRef.current;
            if (stage) {
              event.preventDefault();
              stage.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            // The dialog is opened programmatically, so restore focus to the recorded opener ourselves.
            const opener = returnFocusTo?.current;
            if (opener && opener.isConnected) {
              event.preventDefault();
              opener.focus();
            }
          }}
        >
          {asset && (
            <>
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <Toolbar controller={controller} animate={animate} />
                <ZoomStage key={asset.id} asset={asset} controller={controller} animate={animate} stageRef={stageRef} />
              </div>
              <aside
                ref={panelRef}
                className="max-h-[38vh] shrink-0 overflow-y-auto border-t border-rule-soft px-(--gutter) py-4 lg:max-h-none lg:w-[22rem] lg:border-t-0 lg:border-l lg:py-6"
              >
                <Dialog.Title className="font-display text-lg leading-snug text-ink">{asset.caption}</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Zoomable drawing. Use the toolbar, or press plus and minus to zoom, the arrow keys to pan, 0 to
                  reset the view and Escape to close.
                </Dialog.Description>
                <AssetMeta asset={asset} layout="stacked" className="mt-4 border-t border-rule-soft pt-3" />
                <p className="meta mt-4 border-t border-rule-soft pt-3">
                  Drag to pan · scroll or pinch to zoom · double-click to toggle {TOGGLE_ZOOM}× · keys + − 0 and
                  arrows
                </p>
              </aside>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Toolbar({ controller, animate }: { controller: PanZoomController; animate: boolean }) {
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);

  return (
    <div
      role="group"
      aria-label="View controls"
      className="flex flex-wrap items-center gap-2 border-b border-rule-soft px-(--gutter) py-3"
    >
      <button
        type="button"
        className="control control-icon"
        aria-label="Zoom out"
        aria-disabled={view.atMin || undefined}
        onClick={() => {
          if (!view.atMin) controller.zoomStep(-1, animate);
        }}
      >
        <ZoomOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </button>
      <output aria-live="polite" aria-atomic="true" className="meta meta-strong tabular min-w-14 text-center">
        <span className="sr-only">Zoom </span>
        {view.label}
      </output>
      <button
        type="button"
        className="control control-icon"
        aria-label="Zoom in"
        aria-disabled={view.atMax || undefined}
        onClick={() => {
          if (!view.atMax) controller.zoomStep(1, animate);
        }}
      >
        <ZoomIn aria-hidden="true" className="size-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="control"
        aria-disabled={view.atMin || undefined}
        onClick={() => {
          if (!view.atMin) controller.reset(animate);
        }}
      >
        Reset view
      </button>
      <button type="button" className="control" onClick={() => controller.fitWidth(animate)}>
        Fit width
      </button>
      <Dialog.Close asChild>
        <button type="button" className="control ml-auto">
          <X aria-hidden="true" className="size-4" strokeWidth={1.75} />
          <span>Close</span>
        </button>
      </Dialog.Close>
    </div>
  );
}

/** Pointer movement below this (px) still counts as a tap. */
const TAP_SLOP = 6;
const TAP_MS = 400;
const DOUBLE_TAP_MS = 350;
const DOUBLE_TAP_DISTANCE = 30;

interface Tap {
  x: number;
  y: number;
  time: number;
}

interface Gesture {
  pinch: { dist: number; mid: Point } | null;
  down: Tap | null;
  moved: boolean;
  lastTap: Tap | null;
}

interface ZoomStageProps {
  asset: MediaAsset;
  controller: PanZoomController;
  animate: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
}

/**
 * The focusable stage. All gesture state lives in refs and the controller; nothing here sets React
 * state, so dragging never re-renders.
 */
function ZoomStage({ asset, controller, animate, stageRef }: ZoomStageProps) {
  const largest = largestVariant(asset);
  const webp = largestOf(asset, "webp");
  const contentWidth = largest?.width ?? asset.native[0];
  const contentHeight = largest?.height ?? asset.native[1];
  const elementRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const gestureRef = useRef<Gesture>({ pinch: null, down: null, moved: false, lastTap: null });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const element = elementRef.current;
    if (!stage || !element) return;
    controller.attach(stage, element, { width: contentWidth, height: contentHeight });

    const observer = new ResizeObserver(() => {
      controller.setStageSize({ width: stage.clientWidth, height: stage.clientHeight });
    });
    observer.observe(stage);

    // React registers wheel listeners as passive, so a native non-passive one is needed to stop the
    // page scrolling or (ctrl+wheel / trackpad pinch) the browser zooming.
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const delta = clamp(event.deltaY * unit, -120, 120);
      const factor = Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0022));
      controller.zoomBy(factor, controller.anchorFromClient(event.clientX, event.clientY));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      observer.disconnect();
      stage.removeEventListener("wheel", onWheel);
      controller.detach();
    };
  }, [controller, stageRef, contentWidth, contentHeight]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const stage = event.currentTarget;
    const pointers = pointersRef.current;
    const gesture = gestureRef.current;
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    controller.cancelAnimation();
    gesture.moved = false;
    gesture.down = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      gesture.pinch = { dist: Math.hypot(b.x - a.x, b.y - a.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
      gesture.moved = true;
    }
    stage.dataset.dragging = "true";
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const current = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, current);
    const gesture = gestureRef.current;

    if (pointers.size >= 2 && gesture.pinch) {
      const [a, b] = Array.from(pointers.values());
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (gesture.pinch.dist > 0) {
        controller.zoomBy(dist / gesture.pinch.dist, controller.anchorFromClient(mid.x, mid.y));
      }
      controller.panBy(mid.x - gesture.pinch.mid.x, mid.y - gesture.pinch.mid.y);
      gesture.pinch = { dist, mid };
      return;
    }
    if (pointers.size !== 1) return;
    if (!gesture.moved && gesture.down) {
      if (Math.hypot(current.x - gesture.down.x, current.y - gesture.down.y) > TAP_SLOP) gesture.moved = true;
    }
    controller.panBy(current.x - previous.x, current.y - previous.y);
  };

  const endPointer = (event: PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    const stage = event.currentTarget;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    const gesture = gestureRef.current;
    if (pointers.size >= 1) {
      // Pinch ended with one finger still down: carry on as a plain drag from its last position.
      gesture.pinch = null;
      gesture.moved = true;
      return;
    }
    delete stage.dataset.dragging;
    const down = gesture.down;
    gesture.down = null;
    gesture.pinch = null;
    const tapped = event.type === "pointerup" && down !== null && !gesture.moved && event.timeStamp - down.time < TAP_MS;
    if (!tapped) {
      gesture.lastTap = null;
      return;
    }
    const last = gesture.lastTap;
    const isDouble =
      last !== null &&
      event.timeStamp - last.time < DOUBLE_TAP_MS &&
      Math.hypot(event.clientX - last.x, event.clientY - last.y) < DOUBLE_TAP_DISTANCE;
    if (isDouble) {
      gesture.lastTap = null;
      controller.toggleZoom(controller.anchorFromClient(event.clientX, event.clientY), animate);
    } else {
      gesture.lastTap = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    }
  };

  return (
    <div
      ref={stageRef}
      role="img"
      aria-label={asset.alt}
      aria-roledescription="zoomable drawing"
      tabIndex={0}
      className="relative min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden focus-visible:-outline-offset-4 data-[dragging=true]:cursor-grabbing"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onDoubleClick={(event) => event.preventDefault()}
    >
      <div
        ref={elementRef}
        className="absolute top-1/2 left-1/2 origin-top-left will-change-transform"
        style={{
          width: contentWidth,
          height: contentHeight,
          visibility: "hidden",
          backgroundColor: asset.tone,
          backgroundImage: asset.placeholder ? `url("${asset.placeholder}")` : undefined,
          backgroundSize: "cover",
        }}
      >
        {largest && (
          <picture>
            {webp && <source type="image/webp" srcSet={webp.src} />}
            <img
              src={largest.src}
              width={largest.width}
              height={largest.height}
              alt=""
              draggable={false}
              decoding="async"
              className="block h-full w-full max-w-none"
            />
          </picture>
        )}
      </div>
    </div>
  );
}
