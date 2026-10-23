import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, nextProject, projects } from "@/content/projects";
import { getMedia, hasMedia, media } from "@/content/media";
import { Figure } from "@/components/media";
import { ModelViewer } from "@/components/viewer/model-viewer";
import { ProjectStory } from "@/components/site/project-story";
import { ProjectNav } from "@/components/site/project-nav";
import { SensoryDiagram } from "@/components/site/sensory-diagram";
import { formatSourceRef } from "@/components/site/source-ref";

export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((pr) => ({ slug: pr.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return { title: `${project.title} — ${project.location}`, description: project.summary };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  const next = nextProject(slug);
  const hero = hasMedia(project.heroId) ? getMedia(project.heroId) : null;
  const model = project.model;
  const poster = model && hasMedia(model.posterId) ? getMedia(model.posterId) : hero;

  return (
    <article className="sheet py-10 md:py-14">
      <header className="sheet-grid">
        <div className="col-span-4 md:col-span-8 lg:col-span-8">
          <p className="meta">
            Project {String(project.order).padStart(2, "0")} · {project.subtitle}
          </p>
          <h1 className="display mt-3">{project.title}</h1>
          <p className="mt-3 font-display text-xl text-ink-2">{project.location}</p>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:self-end">
          <p className="prose-editorial text-base">{project.summary}</p>
        </div>
      </header>

      <div className="mt-10">
        {model && poster ? (
          <ModelViewer spec={model} poster={poster} drawings={media} subject={project.title} variant="study" syncUrl />
        ) : hero ? (
          <Figure asset={hero} size="full" priority />
        ) : (
          <figure>
            <SensoryDiagram className="w-full border border-rule-soft" />
            <figcaption className="meta mt-2">Interpretive sensory diagram drawn from the written description on portfolio pp.13–16. Original DS5 artwork not yet supplied.</figcaption>
          </figure>
        )}
      </div>

      <dl className="sheet-grid hairline-t mt-10 pt-6">
        {project.meta.map((m) => (
          <div key={m.label} className="col-span-2 md:col-span-4 lg:col-span-3">
            <dt className="meta">{m.label}</dt>
            <dd className="mt-1 text-sm">{m.value}</dd>
            <dd className="meta mt-1 text-ink-2">{formatSourceRef(m.sourceRef)}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-16">
        <ProjectStory project={project} />
      </div>

      {project.publication.status === "needs-content" && (
        <aside className="hairline-t mt-16 pt-6" aria-label="Source material note">
          <p className="meta meta-strong">Source material</p>
          <p className="mt-2 max-w-prose text-sm text-ink-2">
            Shown from the supplied portfolio preview. {project.publication.needs.length > 0 && "Still to be supplied: "}
            {project.publication.needs.join("; ")}.
          </p>
        </aside>
      )}

      <ProjectNav next={next} />
    </article>
  );
}
