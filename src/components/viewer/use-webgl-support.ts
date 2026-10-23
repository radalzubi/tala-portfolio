"use client";

import { useSyncExternalStore } from "react";

export type WebGLSupport = "unknown" | "yes" | "no";

let detected: WebGLSupport | null = null;

function detectWebGL(): WebGLSupport {
  if (detected) return detected;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    detected = gl ? "yes" : "no";
    const ext = (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context");
    ext?.loseContext();
  } catch {
    detected = "no";
  }
  return detected;
}

const noop = () => () => {};

/** Detects WebGL once on the client. "unknown" during SSR and hydration. */
export function useWebGLSupport(): WebGLSupport {
  return useSyncExternalStore(noop, detectWebGL, () => "unknown");
}

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

const coarseSubscribe = subscribeMedia("(pointer: coarse)");

export function useCoarsePointer(): boolean {
  return useSyncExternalStore(coarseSubscribe, () => window.matchMedia("(pointer: coarse)").matches, () => false);
}
