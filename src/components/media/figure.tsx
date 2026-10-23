import type { MediaAsset, MediaSize } from "@/content/types";
import { cn } from "@/lib/cn";
import { AssetMeta } from "./asset-meta";
import { SIZES, fallbackVariants, largestVariant, srcSetOf, variantsOf } from "./asset-utils";
import { InspectButton } from "./inspect-button";

export interface FigureProps {
  asset: MediaAsset;
  /** Placement width; sets the `sizes` hint. Defaults to "full". */
  size?: MediaSize;
  /** Overrides the asset's caption for this placement. */
  caption?: string;
  /** Above the fold: eager loading and high fetch priority. */
  priority?: boolean;
  /** Render the Inspect button in the caption row (needs an InspectorProvider up the tree). */
  inspectable?: boolean;
  className?: string;
}

/**
 * Server-compatible drawing figure: `<picture>` with webp (and avif, if built) sources and a jpg/png
 * fallback, intrinsic width/height from the largest variant so nothing shifts while it loads, the
 * asset's average tone (and tiny placeholder) behind it, and a title-block style caption area.
 *
 * The figure is capped at the source's native pixel width with an inline style, so small sources
 * are never stretched past what was supplied.
 */
export function Figure({ asset, size = "full", caption, priority = false, inspectable = true, className }: FigureProps) {
  const largest = largestVariant(asset);
  if (!largest) return null;

  const sizes = SIZES[size];
  const webp = srcSetOf(variantsOf(asset, "webp"));
  const avif = srcSetOf(variantsOf(asset, "avif"));
  const fallback = srcSetOf(fallbackVariants(asset));
  const nativeWidth = Math.max(1, asset.native[0]);

  return (
    <figure className={cn("w-full", className)} style={{ maxWidth: `${nativeWidth}px` }}>
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: asset.tone,
          backgroundImage: asset.placeholder ? `url("${asset.placeholder}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <picture>
          {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
          {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
          <img
            src={largest.src}
            srcSet={fallback}
            sizes={sizes}
            width={largest.width}
            height={largest.height}
            alt={asset.alt}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="h-auto w-full"
          />
        </picture>
      </div>
      <figcaption className="mt-2 border-t border-rule-soft pt-2">
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm leading-snug text-ink">{caption ?? asset.caption}</p>
          {inspectable && <InspectButton asset={asset} className="-mt-0.5" />}
        </div>
        <AssetMeta asset={asset} className="mt-2 border-t border-rule-soft pt-1.5" />
      </figcaption>
    </figure>
  );
}
