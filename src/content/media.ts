import generated from "./media.generated.json";
import type { MediaAsset } from "./types";

/** Public media records built by scripts/build_media.py from data/source-manifest.json. */
export const media = generated as unknown as Record<string, MediaAsset>;

/** Resolves a media id; throws at build time if a content record references an asset that was never built. */
export function getMedia(id: string): MediaAsset {
  const asset = media[id];
  if (!asset) throw new Error(`Unknown media id "${id}" — add it to data/source-manifest.json and run scripts/build_media.py`);
  return asset;
}

export function hasMedia(id: string): boolean {
  return Boolean(media[id]);
}
