import type { MediaAsset } from "@/content/types";
import { cn } from "@/lib/cn";
import { LOW_RESOLUTION_NOTE, provenanceLabel, sourceLabel } from "./asset-utils";

export interface AssetMetaProps {
  asset: MediaAsset;
  /** "inline": one `.meta` line with middle-dot separators. "stacked": a definition list. */
  layout?: "inline" | "stacked";
  className?: string;
}

interface MetaItem {
  label: string;
  value: string;
}

export function metaItems(asset: MediaAsset): MetaItem[] {
  const items: MetaItem[] = [
    { label: "Credit", value: asset.credit },
    { label: "Source", value: sourceLabel(asset.source) },
    { label: "Provenance", value: provenanceLabel(asset.provenance) },
  ];
  if (asset.lowResolution) items.push({ label: "Note", value: LOW_RESOLUTION_NOTE });
  if (asset.rightsNote) items.push({ label: "Rights", value: asset.rightsNote });
  return items;
}

/**
 * Credit, source page, provenance word and the quiet low-resolution note. Server-compatible; shared by
 * the Figure caption (inline) and the inspector panel (stacked).
 */
export function AssetMeta({ asset, layout = "inline", className }: AssetMetaProps) {
  const items = metaItems(asset);

  if (layout === "stacked") {
    return (
      <dl className={cn("meta space-y-1.5", className)}>
        {items.map((item) => (
          <div key={item.label} className="flex gap-3">
            <dt className="w-20 shrink-0">{item.label}</dt>
            <dd className="meta-strong">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <p className={cn("meta", className)}>
      {items.map((item, index) => (
        <span key={item.label}>
          {index > 0 && <span aria-hidden="true"> · </span>}
          <span>{item.value}</span>
        </span>
      ))}
    </p>
  );
}
