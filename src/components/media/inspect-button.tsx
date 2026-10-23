"use client";

import { useContext } from "react";
import { ZoomIn } from "lucide-react";
import type { MediaAsset } from "@/content/types";
import { cn } from "@/lib/cn";
import { InspectorContext } from "./inspector-provider";

export interface InspectButtonProps {
  asset: MediaAsset;
  className?: string;
}

/**
 * Opens the page's DrawingInspector on this asset. Renders nothing when no InspectorProvider is
 * mounted, so a Figure placed outside the provider still renders its image and caption.
 */
export function InspectButton({ asset, className }: InspectButtonProps) {
  const inspector = useContext(InspectorContext);
  if (!inspector) return null;

  return (
    <button
      type="button"
      className={cn("control min-h-8 shrink-0 px-2.5 text-xs", className)}
      aria-label={`Inspect: ${asset.alt}`}
      onClick={(event) => inspector.open(asset, event.currentTarget)}
    >
      <ZoomIn aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
      <span>Inspect</span>
    </button>
  );
}
