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

/**
 * Short figure label for thumbnails: "4", or "7a" when the id carries a crop suffix (`cx-fig-07a`).
 * The number comes from the source record when it is there, else from the id.
 */
export function figureLabel(asset: MediaAsset | undefined, mediaId: string): string | undefined {
  const match = mediaId.match(/(\d+)([a-z]?)$/i);
  const suffix = match?.[2] ?? "";
  const number = asset?.source.figure ?? (match ? Number(match[1]) : undefined);
  return number === undefined ? undefined : `${number}${suffix}`;
}
