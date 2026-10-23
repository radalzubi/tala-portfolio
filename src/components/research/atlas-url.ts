import type { ResearchTheme } from "@/content/types";

/**
 * Atlas selection in the query string: `?case=zamalek&theme=climate-response`.
 * Defaults (first case, "built-form") are omitted; the URL is replaced, never pushed, so browsing the
 * atlas does not fill the history stack. Other query parameters and the hash are preserved.
 */
export interface AtlasState {
  caseId: string;
  theme: ResearchTheme;
}

export const THEME_IDS: readonly ResearchTheme[] = ["built-form", "street-life", "climate-response", "identity"];
export const DEFAULT_THEME: ResearchTheme = "built-form";

export function isTheme(value: string | null | undefined): value is ResearchTheme {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value);
}

// Tiny external store over window.location.search so the selection derives from the URL in render
// (no state mirrored through effects) and `popstate` is handled by the same subscription.
const listeners = new Set<() => void>();

export function subscribeSearch(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

export function getSearchSnapshot(): string {
  return window.location.search;
}

export function getServerSearchSnapshot(): string {
  return "";
}

export function parseAtlasSearch(search: string, caseIds: readonly string[]): AtlasState {
  const params = new URLSearchParams(search);
  const caseParam = params.get("case");
  const themeParam = params.get("theme");
  return {
    caseId: caseParam && caseIds.includes(caseParam) ? caseParam : (caseIds[0] ?? ""),
    theme: isTheme(themeParam) ? themeParam : DEFAULT_THEME,
  };
}

export function writeAtlasSearch(next: AtlasState, defaults: AtlasState): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (next.caseId === defaults.caseId) params.delete("case");
  else params.set("case", next.caseId);
  if (next.theme === defaults.theme) params.delete("theme");
  else params.set("theme", next.theme);
  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (url !== current) window.history.replaceState(null, "", url);
  listeners.forEach((listener) => listener());
}
