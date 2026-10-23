"use client";

import { useEffect, useState } from "react";

export type WebGLSupport = "unknown" | "yes" | "no";

/** Detects WebGL once on the client. "unknown" during SSR and before the first effect. */
export function useWebGLSupport(): WebGLSupport {
  const [support, setSupport] = useState<WebGLSupport>("unknown");
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
        canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
      setSupport(gl ? "yes" : "no");
      const ext = (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    } catch {
      setSupport("no");
    }
  }, []);
  return support;
}

export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(pointer: coarse)");
    const sync = () => setCoarse(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);
  return coarse;
}
