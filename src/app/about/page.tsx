import type { Metadata } from "next";
import Link from "next/link";
import { about } from "@/content/about";
import { formatSourceRef } from "@/components/site/source-ref";

export const metadata: Metadata = {
  title: "About",
  description: "Tala Hagras — architecture student working between Cairo and London. Interests in material, movement, atmosphere and place.",
};

export default function AboutPage() {
  return (
    <div className="sheet py-12 md:py-16">
      <div className="sheet-grid">
        <header className="col-span-4 md:col-span-8 lg:col-span-7">
          <p className="meta">About</p>
          <h1 className="display-md mt-3">{about.name}</h1>
          <p className="prose-editorial mt-5 text-xl">{about.positioning}.</p>
        </header>
        <div className="col-span-4 md:col-span-8 lg:col-span-7 lg:col-start-1">
          <h2 className="heading mt-12">From the sources</h2>
          <ul className="mt-5 space-y-4">
            {about.facts.map((f) => (
              <li key={f.text} className="hairline-t pt-4">
                <p className="prose-editorial text-base">{f.text}</p>
                <p className="meta mt-1">{formatSourceRef(f.sourceRef)}</p>
              </li>
            ))}
          </ul>
          <h2 className="heading mt-12">Design interests</h2>
          <ul className="mt-5 space-y-3">
            {about.interests.map((t) => (
              <li key={t} className="prose-editorial text-base">
                {t}
              </li>
            ))}
          </ul>
        </div>
        <aside className="col-span-4 md:col-span-8 lg:col-span-4 lg:col-start-9">
          <p className="meta meta-strong mt-12 lg:mt-0">Collection</p>
          <p className="mt-2 font-display text-xl">{about.collection}</p>
          <p className="mt-3 flex flex-wrap gap-2">
            {about.themes.map((t) => (
              <span key={t} className="meta rounded-xs border border-rule-soft px-2 py-1">
                {t}
              </span>
            ))}
          </p>
          <p className="meta meta-strong mt-10">Work</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <Link href="/work/maison-peplum" className="link-quiet">
                Maison Peplum — Brentford
              </Link>
            </li>
            <li>
              <Link href="/work/music-institution" className="link-quiet">
                Music Institution — Reading
              </Link>
            </li>
            <li>
              <Link href="/work/sound-aroma-loom" className="link-quiet">
                Sound Aroma Loom — Whitechapel
              </Link>
            </li>
            <li>
              <Link href="/research/cairo" className="link-quiet">
                Research — Cairo
              </Link>
            </li>
          </ul>
          <p className="mt-10 max-w-xs text-xs leading-relaxed text-ink-2">
            Biographical details on this page are limited to what the portfolio and dissertation state. Projects are academic design proposals.
          </p>
        </aside>
      </div>
    </div>
  );
}
