"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type MotionSetting = "system" | "reduced" | "full";

interface MotionContextValue {
  /** True when non-essential motion should be suppressed right now. */
  reduced: boolean;
  /** True when the operating system asks for reduced motion. */
  systemReduced: boolean;
  setting: MotionSetting;
  setSetting: (next: MotionSetting) => void;
}

const MotionContext = createContext<MotionContextValue>({
  reduced: false,
  systemReduced: false,
  setting: "system",
  setSetting: () => {},
});

export const MOTION_STORAGE_KEY = "tala-motion";

/** Inline script run before paint so a stored "reduced" choice never flashes full motion. */
export const motionBootScript = `(function(){try{var v=localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)});if(v==="reduced"||v==="full"){document.documentElement.setAttribute("data-motion",v);}}catch(e){}})();`;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeSystem(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const readSystem = () => window.matchMedia(REDUCED_QUERY).matches;

// Tiny external store for the visitor's explicit setting (persisted in localStorage).
const listeners = new Set<() => void>();
function readSetting(): MotionSetting {
  try {
    const stored = localStorage.getItem(MOTION_STORAGE_KEY);
    return stored === "reduced" || stored === "full" ? stored : "system";
  } catch {
    return "system";
  }
}
function subscribeSetting(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}
function writeSetting(next: MotionSetting) {
  try {
    if (next === "system") localStorage.removeItem(MOTION_STORAGE_KEY);
    else localStorage.setItem(MOTION_STORAGE_KEY, next);
  } catch {
    /* storage unavailable: the in-memory listeners still update this session */
  }
  listeners.forEach((l) => l());
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const systemReduced = useSyncExternalStore(subscribeSystem, readSystem, () => false);
  const setting = useSyncExternalStore(subscribeSetting, readSetting, () => "system" as MotionSetting);

  useEffect(() => {
    const root = document.documentElement;
    if (setting === "system") root.removeAttribute("data-motion");
    else root.setAttribute("data-motion", setting);
  }, [setting]);

  const setSetting = useCallback((next: MotionSetting) => writeSetting(next), []);

  const value = useMemo<MotionContextValue>(
    () => ({
      systemReduced,
      setting,
      setSetting,
      reduced: setting === "reduced" || (setting === "system" && systemReduced),
    }),
    [systemReduced, setting, setSetting],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotionPreference(): MotionContextValue {
  return useContext(MotionContext);
}
