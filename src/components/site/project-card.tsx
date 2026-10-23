import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Project } from "@/content/types";
import { getMedia, hasMedia } from "@/content/media";
import { Figure } from "@/components/media";
import { SensoryDiagram } from "./sensory-diagram";
import { cn } from "@/lib/cn";

export function ProjectCard({ project, index, compact = false }: { project: Project; index: number; compact?: boolean }) {
  const hero = hasMedia(project.heroId) ? getMedia(project.heroId) : null;
  return (
    <article className={cn("sheet-grid items-start", compact ? "py-8" : "py-10")} aria-labelledby={`card-${project.slug}`}>
      <div className={cn("col-span-4 md:col-span-3 lg:col-span-4", compact && "lg:col-span-5")}>
        <p className="meta">
          {String(index).padStart(2, "0")} · {project.subtitle}
        </p>
        <h3 id={`card-${project.slug}`} className="display-md mt-3">
          <Link href={`/work/${project.slug}`} className="link-quiet">
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-ink-2">{project.location}</p>
        <p className="prose-editorial mt-5 text-base">{project.summary}</p>
        <p className="mt-4 flex flex-wrap gap-2">
          {project.themes.map((t) => (
            <span key={t} className="meta rounded-xs border border-rule-soft px-2 py-1">
              {t}
            </span>
          ))}
        </p>
        <Link href={`/work/${project.slug}`} className="control mt-6">
          {project.model ? "Explore project" : "Read entry"}
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <div className={cn("col-span-4 md:col-span-5 lg:col-span-8", compact && "lg:col-span-7")}>
        {hero ? (
          <Figure asset={hero} size="wide" inspectable={false} />
        ) : (
          <figure>
            <SensoryDiagram className="w-full border border-rule-soft" />
            <figcaption className="meta mt-2">Interpretive sensory diagram drawn from the written description. Original DS5 artwork not yet supplied.</figcaption>
          </figure>
        )}
      </div>
    </article>
  );
}
