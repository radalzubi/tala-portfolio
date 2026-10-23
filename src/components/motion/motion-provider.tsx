"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

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

export function MotionProvider({ children }: { children: ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(false);
  const [setting, setSettingState] = useState<MotionSetting>("system");

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setSystemReduced(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    try {
      const stored = localStorage.getItem(MOTION_STORAGE_KEY);
      if (stored === "reduced" || stored === "full") setSettingState(stored);
    } catch {
      /* storage unavailable: keep system */
    }
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (setting === "system") root.removeAttribute("data-motion");
    else root.setAttribute("data-motion", setting);
  }, [setting]);

  const setSetting = useCallback((next: MotionSetting) => {
    setSettingState(next);
    try {
      if (next === "system") localStorage.removeItem(MOTION_STORAGE_KEY);
      else localStorage.setItem(MOTION_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

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
