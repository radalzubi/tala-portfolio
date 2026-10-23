"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { MediaAsset } from "@/content/types";
import { DrawingInspector } from "./drawing-inspector";

export interface InspectorContextValue {
  /** Show `asset` in the inspector. `opener` receives focus again when the dialog closes. */
  open: (asset: MediaAsset, opener?: HTMLElement | null) => void;
  close: () => void;
}

export const InspectorContext = createContext<InspectorContextValue | null>(null);

/**
 * Mounts one DrawingInspector for the whole page and hands out `open()`; put it once in the layout
 * inside MotionProvider. Figures anywhere below it get a working Inspect button.
 */
export function InspectorProvider({ children }: { children: ReactNode }) {
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((next: MediaAsset, opener?: HTMLElement | null) => {
    const active = document.activeElement;
    openerRef.current = opener ?? (active instanceof HTMLElement ? active : null);
    setAsset(next);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<InspectorContextValue>(() => ({ open, close }), [open, close]);

  return (
    <InspectorContext.Provider value={value}>
      {children}
      <DrawingInspector
        asset={asset}
        open={isOpen}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        returnFocusTo={openerRef}
      />
    </InspectorContext.Provider>
  );
}

export function useInspector(): InspectorContextValue {
  const value = useContext(InspectorContext);
  if (!value) {
    throw new Error("useInspector() needs an <InspectorProvider> above it (see src/components/media/README.md).");
  }
  return value;
}
