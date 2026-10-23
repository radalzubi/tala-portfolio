/** Viewer state in the URL hash (`#view=assembly&fold=0.6`), replaced without history entries. */

export interface HashViewerState {
  view?: string;
  fold?: number;
}

export function readHashState(hash: string): HashViewerState {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const view = params.get("view") ?? undefined;
  const foldRaw = params.get("fold");
  const fold = foldRaw === null ? undefined : Number(foldRaw);
  return { view, fold: fold !== undefined && Number.isFinite(fold) ? Math.min(1, Math.max(0, fold)) : undefined };
}

export function writeHashState(state: HashViewerState, defaults: HashViewerState): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (state.view && state.view !== defaults.view) params.set("view", state.view);
  if (state.fold !== undefined && Math.abs(state.fold - (defaults.fold ?? 0)) > 0.01) params.set("fold", state.fold.toFixed(2));
  const next = params.toString();
  const url = `${window.location.pathname}${window.location.search}${next ? `#${next}` : ""}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", url);
  }
}
