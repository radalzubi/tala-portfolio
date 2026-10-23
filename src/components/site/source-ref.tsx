import type { SourceRef } from "@/content/types";

export function formatSourceRef(ref: SourceRef): string {
  const doc = ref.file === "portfolio" ? "Portfolio" : "Dissertation";
  const fig = ref.figure ? `, fig. ${ref.figure}` : "";
  const note = ref.note ? ` (${ref.note})` : "";
  return `${doc}, p.${ref.page}${fig}${note}`;
}

export function SourceRefs({ refs, prefix = "Source" }: { refs: SourceRef[]; prefix?: string }) {
  if (!refs.length) return null;
  const grouped = refs.reduce<Record<string, number[]>>((acc, r) => {
    const key = r.file === "portfolio" ? "Portfolio" : "Dissertation";
    acc[key] = acc[key] ?? [];
    if (!acc[key].includes(r.page)) acc[key].push(r.page);
    return acc;
  }, {});
  return (
    <p className="meta">
      {prefix}: {Object.entries(grouped).map(([doc, pages]) => `${doc}, p.${pages.sort((a, b) => a - b).join(", ")}`).join("; ")}
    </p>
  );
}
