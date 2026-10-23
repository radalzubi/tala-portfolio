import type { Project, ProjectSection } from "@/content/types";
import { getMedia, hasMedia } from "@/content/media";
import { Figure } from "@/components/media";
import { SourceRefs } from "./source-ref";

const SPAN: Record<NonNullable<ProjectSection["media"][number]["size"]>, string> = {
  full: "col-span-4 md:col-span-8 lg:col-span-12",
  wide: "col-span-4 md:col-span-8 lg:col-span-8",
  half: "col-span-4 md:col-span-4 lg:col-span-6",
  third: "col-span-4 md:col-span-4 lg:col-span-4",
  strip: "col-span-2 md:col-span-2 lg:col-span-3",
};

export function ProjectStory({ project }: { project: Project }) {
  return (
    <div className="space-y-20">
      {project.sections.map((section, i) => {
        const placements = section.media.filter((m) => hasMedia(m.id));
        return (
          <section key={section.id} id={section.id} aria-labelledby={`${project.slug}-${section.id}`} className="sheet-grid hairline-t pt-8">
            <div className="col-span-4 md:col-span-8 lg:col-span-4">
              <p className="meta">{String(i + 1).padStart(2, "0")}</p>
              <h2 id={`${project.slug}-${section.id}`} className="heading mt-2">
                {section.heading}
              </h2>
              <div className="prose-editorial mt-5">
                {section.body.map((para) => (
                  <p key={para.slice(0, 32)}>{para}</p>
                ))}
              </div>
              <div className="mt-4">
                <SourceRefs refs={section.sourceRefs} />
              </div>
            </div>
            {placements.length > 0 && (
              <div className="col-span-4 md:col-span-8 lg:col-span-8">
                <div className="sheet-grid">
                  {placements.map((m) => (
                    <div key={m.id} className={SPAN[m.size ?? "half"]}>
                      <Figure asset={getMedia(m.id)} size={m.size ?? "half"} caption={m.caption} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
