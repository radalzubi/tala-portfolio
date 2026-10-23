import Link from "next/link";
import { ArrowRight, ArrowUpLeft } from "lucide-react";
import type { Project } from "@/content/types";

export function ProjectNav({ next }: { next?: Project }) {
  return (
    <nav aria-label="Project navigation" className="sheet-grid rule-t mt-24 pt-8">
      <div className="col-span-4 md:col-span-4 lg:col-span-6">
        <Link href="/work" className="control">
          <ArrowUpLeft size={16} aria-hidden />
          All work
        </Link>
      </div>
      {next && (
        <div className="col-span-4 md:col-span-4 lg:col-span-6 md:text-right">
          <p className="meta">Next project</p>
          <Link href={`/work/${next.slug}`} className="link-quiet mt-1 inline-flex items-center gap-2 font-display text-2xl">
            {next.title}
            <ArrowRight size={20} aria-hidden />
          </Link>
          <p className="text-sm text-ink-2">{next.location}</p>
        </div>
      )}
    </nav>
  );
}
