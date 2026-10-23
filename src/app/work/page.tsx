import type { Metadata } from "next";
import { projectsByOrder } from "@/content/projects";
import { ProjectCard } from "@/components/site/project-card";

export const metadata: Metadata = {
  title: "Work",
  description: "Selected architectural works by Tala Hagras: Maison Peplum, Music Institution and Sound Aroma Loom.",
};

export default function WorkPage() {
  return (
    <div className="sheet py-12 md:py-16">
      <header className="sheet-grid">
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          <p className="meta">Selected architectural works · 2024 — 2026</p>
          <h1 className="display-md mt-3">Work</h1>
          <p className="prose-editorial mt-5">
            Three academic projects: an adaptive reuse of a Brentford warehouse behind a fin façade drawn from a peplum jacket, a music
            institution organised around a circular hall on the canal in Reading, and a sensory pavilion for Whitechapel Market.
          </p>
        </div>
      </header>
      <div className="mt-10 divide-y divide-rule-soft border-t border-rule-soft">
        {projectsByOrder.map((pr, i) => (
          <ProjectCard key={pr.slug} project={pr} index={i + 1} compact={!pr.model} />
        ))}
      </div>
    </div>
  );
}
