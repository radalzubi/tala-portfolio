import type { MediaAsset, MediaVariant } from "@/content/types";

/**
 * Builds `<picture>` sources from a media record's variants: a WebP `srcset` where available and a
 * JPEG (or PNG) fallback `srcset`. Image paths are never hard-coded; everything comes from the asset.
 */
export interface PictureSources {
  /** `srcset` for a `<source type="image/webp">`, or null when the asset has no WebP variants. */
  webpSrcSet: string | null;
  /** `srcset` for the fallback `<img>`, or null when there is a single fallback candidate. */
  fallbackSrcSet: string | null;
  /** The largest fallback file, used as `src`. */
  fallbackSrc: string;
  width: number;
  height: number;
}

function toSrcSet(list: MediaVariant[]): string {
  return list.map((v) => `${v.src} ${v.width}w`).join(", ");
}

export function pictureSources(asset: MediaAsset): PictureSources {
  const byWidth = [...asset.variants].sort((a, b) => a.width - b.width);
  const webp = byWidth.filter((v) => v.format === "webp");
  const raster = byWidth.filter((v) => v.format === "jpg" || v.format === "png");
  const fallback = raster.length > 0 ? raster : byWidth.filter((v) => v.format !== "svg");
  const largest = fallback[fallback.length - 1] ?? byWidth[byWidth.length - 1];
  const [nativeW, nativeH] = asset.native;
  return {
    webpSrcSet: webp.length > 0 ? toSrcSet(webp) : null,
    fallbackSrcSet: fallback.length > 1 ? toSrcSet(fallback) : null,
    fallbackSrc: largest?.src ?? "",
    width: largest?.width ?? nativeW,
    height: largest?.height ?? nativeH,
  };
}

/** Dissertation figure number: from the source record, else parsed from an id such as `cx-fig-04`. */
export function figureNumber(asset: MediaAsset | undefined, mediaId: string): number | undefined {
  if (asset?.source.figure) return asset.source.figure;
  const digits = mediaId.replace(/\D+/g, "");
  return digits ? Number(digits) : undefined;
}

/** "Dissertation, p.12, fig. 1" */
export function sourceLine(asset: MediaAsset): string {
  const file = asset.source.file === "dissertation" ? "Dissertation" : "Portfolio";
  const fig = asset.source.figure ? `, fig. ${asset.source.figure}` : "";
  return `${file}, p.${asset.source.page}${fig}`;
}
