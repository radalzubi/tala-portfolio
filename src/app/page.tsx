import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { about } from "@/content/about";
import { cairoResearch } from "@/content/research";
import { getProject, projectsByOrder } from "@/content/projects";
import { getMedia, hasMedia, media } from "@/content/media";
import { Figure } from "@/components/media";
import { ModelViewer } from "@/components/viewer/model-viewer";
import { ProjectCard } from "@/components/site/project-card";

export default function HomePage() {
  const peplum = getProject("maison-peplum")!;
  const poster = hasMedia(peplum.model!.posterId) ? getMedia(peplum.model!.posterId) : getMedia(peplum.heroId);
  const researchFigure = hasMedia("cx-fig-04") ? getMedia("cx-fig-04") : null;

  return (
    <>
      {/* Hero */}
      <section className="sheet pt-6 md:pt-10" aria-labelledby="hero-title">
        <div className="sheet-grid items-end">
          <div className="col-span-4 md:col-span-8 lg:col-span-4">
            <p className="meta">{about.collection}</p>
            <h1 id="hero-title" className="display mt-4">
              Tala Hagras
            </h1>
            <p className="mt-6 font-display text-2xl leading-tight text-ink">Architecture, experienced in motion.</p>
            <p className="mt-4 max-w-sm text-base text-ink-2">
              A warehouse in Brentford wrapped in folds drawn from a jacket, a music institution opening onto a canal in Reading, and research
              into how Cairo’s streets keep their identity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/work" className="control control-primary">
                Selected work
                <ArrowRight size={16} aria-hidden />
              </Link>
              <Link href="/research/cairo" className="control">
                Research
              </Link>
            </div>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-display text-xl">
                {peplum.title} <span className="text-ink-2">— {peplum.location}</span>
              </p>
              <Link href={`/work/${peplum.slug}`} className="link-quiet inline-flex items-center gap-1 text-sm font-medium">
                Explore project
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
            <ModelViewer spec={peplum.model!} poster={poster} drawings={media} subject={peplum.title} variant="hero" compact className="mt-3" />
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section className="sheet mt-24" aria-labelledby="work-title">
        <div className="flex items-baseline justify-between rule-t pt-6">
          <h2 id="work-title" className="heading">
            Selected work
          </h2>
          <Link href="/work" className="link-quiet text-sm font-medium">
            All work
          </Link>
        </div>
        <div className="divide-y divide-rule-soft">
          {projectsByOrder.map((pr, i) => (
            <ProjectCard key={pr.slug} project={pr} index={i + 1} compact={!pr.model} />
          ))}
        </div>
      </section>

      {/* Research */}
      <section className="sheet mt-24" aria-labelledby="research-title">
        <div className="sheet-grid rule-t pt-6">
          <div className="col-span-4 md:col-span-8 lg:col-span-5">
            <p className="meta">Research · {cairoResearch.editorialLabel}</p>
            <h2 id="research-title" className="display-md mt-3">
              {cairoResearch.title}
            </h2>
            <p className="mt-2 font-display text-lg text-ink-2">{cairoResearch.subtitle}</p>
            <p className="prose-editorial mt-5 text-base">
              A dissertation on how homogenisation shapes Cairo, read through four conditions — the New Administrative Capital, Zamalek, West el
              Balad and the Ashwa’iyat — in Tala’s own analytical drawings, red pencil over black line.
            </p>
            <Link href="/research/cairo" className="control mt-6">
              Open the atlas
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">{researchFigure && <Figure asset={researchFigure} size="half" inspectable={false} />}</div>
        </div>
      </section>

      {/* About */}
      <section className="sheet mt-24" aria-labelledby="about-title">
        <div className="sheet-grid rule-t pt-6">
          <div className="col-span-4 md:col-span-8 lg:col-span-5">
            <h2 id="about-title" className="heading">
              About
            </h2>
            <p className="prose-editorial mt-4 text-base">
              {about.positioning}. Her interests run through material and assembly, movement and atmosphere, and the identity of place.
            </p>
            <Link href="/about" className="link-quiet mt-4 inline-flex items-center gap-1 text-sm font-medium">
              More about Tala
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
