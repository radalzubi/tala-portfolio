"use client";

import { useId } from "react";
import { useMotionPreference } from "./motion-provider";

/**
 * Site-wide motion control. Three explicit choices so a visitor can also opt back
 * into full motion when their OS preference is "reduce".
 */
export function MotionSetting({ compact = false }: { compact?: boolean }) {
  const { setting, setSetting, systemReduced } = useMotionPreference();
  const id = useId();
  const options: { value: typeof setting; label: string }[] = [
    { value: "system", label: `Follow system${systemReduced ? " (reduced)" : ""}` },
    { value: "reduced", label: "Reduce motion" },
    { value: "full", label: "Full motion" },
  ];
  return (
    <div className={compact ? "flex items-center gap-2" : "flex flex-wrap items-center gap-3"}>
      <label htmlFor={id} className="text-sm text-ink-2">
        Motion
      </label>
      <select
        id={id}
        value={setting}
        onChange={(e) => setSetting(e.target.value as typeof setting)}
        className="control pr-8"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
