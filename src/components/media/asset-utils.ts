/**
 * Pure helpers over the MediaAsset contract (src/content/types.ts). No React, no "use client":
 * usable from server components (Figure) and client islands (DrawingInspector) alike.
 */
import type { MediaAsset, MediaSize, MediaVariant, Provenance, SourceRef } from "@/content/types";

/** `sizes` hints per placement; breakpoints match the sheet grid in globals.css (48rem / 64rem). */
export const SIZES: Record<MediaSize, string> = {
  full: "100vw",
  wide: "(min-width: 64rem) 66vw, 100vw",
  half: "(min-width: 48rem) 50vw, 100vw",
  third: "(min-width: 48rem) 33vw, 100vw",
  strip: "25vw",
};

export const LOW_RESOLUTION_NOTE = "Source supplied at low resolution";

const byWidth = (a: MediaVariant, b: MediaVariant) => a.width - b.width;

/** Variants of one format, smallest first. */
export function variantsOf(asset: MediaAsset, format: MediaVariant["format"]): MediaVariant[] {
  return asset.variants.filter((v) => v.format === format).sort(byWidth);
}

/**
 * Variants for the `<img>` fallback, smallest first: jpg/png where they exist, otherwise anything
 * that is not a next-gen format, otherwise whatever the asset has.
 */
export function fallbackVariants(asset: MediaAsset): MediaVariant[] {
  const raster = asset.variants.filter((v) => v.format === "jpg" || v.format === "png");
  if (raster.length) return raster.sort(byWidth);
  const other = asset.variants.filter((v) => v.format !== "webp" && v.format !== "avif");
  return (other.length ? other : [...asset.variants]).sort(byWidth);
}

/** The largest fallback variant; its pixel size is the figure's intrinsic size. */
export function largestVariant(asset: MediaAsset): MediaVariant | undefined {
  const list = fallbackVariants(asset);
  return list[list.length - 1];
}

/** Largest variant of a given format, if the asset has that format at all. */
export function largestOf(asset: MediaAsset, format: MediaVariant["format"]): MediaVariant | undefined {
  const list = variantsOf(asset, format);
  return list[list.length - 1];
}

/** `srcset` string with width descriptors, or undefined when there is nothing to list. */
export function srcSetOf(variants: MediaVariant[]): string | undefined {
  return variants.length ? variants.map((v) => `${v.src} ${v.width}w`).join(", ") : undefined;
}

const PROVENANCE_LABEL: Record<Provenance, string> = {
  original: "Original",
  derivative: "Crop",
  "interpretive-3d": "Interpretive 3D study",
  "concept-visualisation": "Concept visualisation",
  "third-party": "Third-party",
};

export function provenanceLabel(provenance: Provenance): string {
  return PROVENANCE_LABEL[provenance];
}

const SOURCE_FILE_LABEL: Record<SourceRef["file"], string> = {
  portfolio: "Portfolio",
  dissertation: "Dissertation",
};

/** e.g. "Portfolio, p.11" or "Dissertation, p.15, fig. 5". */
export function sourceLabel(ref: SourceRef): string {
  const parts = [`${SOURCE_FILE_LABEL[ref.file]}, p.${ref.page}`];
  if (ref.figure !== undefined) parts.push(`fig. ${ref.figure}`);
  return parts.join(", ");
}
