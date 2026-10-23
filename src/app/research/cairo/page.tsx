import type { Metadata } from "next";
import { Download } from "lucide-react";
import { cairoResearch } from "@/content/research";
import { media } from "@/content/media";
import { CairoAtlas } from "@/components/research";
import { formatSourceRef, SourceRefs } from "@/components/site/source-ref";

export const metadata: Metadata = {
  title: `${cairoResearch.title} — Research`,
  description: `${cairoResearch.subtitle}. Tala Hagras's dissertation on architectural homogenisation in Cairo, read through the New Administrative Capital, Zamalek, West el Balad and the Ashwa'iyat.`,
};

export default function CairoResearchPage() {
  const r = cairoResearch;
  return (
    <article className="sheet py-10 md:py-14">
      <header className="sheet-grid">
        <div className="col-span-4 md:col-span-8 lg:col-span-8">
          <p className="meta">Research · {r.editorialLabel}</p>
          <h1 className="display-md mt-3">{r.title}</h1>
          <p className="mt-3 font-display text-xl text-ink-2">{r.subtitle}</p>
        </div>
        <dl className="col-span-4 md:col-span-8 lg:col-span-4 grid grid-cols-2 gap-4 lg:self-end">
          <div>
            <dt className="meta">Dissertation</dt>
            <dd className="mt-1 text-sm">{r.institution}, 2025–26</dd>
          </div>
          <div>
            <dt className="meta">Length</dt>
            <dd className="mt-1 text-sm">{r.wordCount} words</dd>
          </div>
        </dl>
      </header>

      {/* Question */}
      <section className="sheet-grid hairline-t mt-12 pt-8" aria-labelledby="q-title">
        <div className="col-span-4 md:col-span-8 lg:col-span-4">
          <p className="meta">01</p>
          <h2 id="q-title" className="heading mt-2">
            The question
          </h2>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          <p className="prose-editorial text-xl">{r.question.text}</p>
          <div className="mt-3">
            <SourceRefs refs={r.question.sourceRefs} />
          </div>
          <blockquote className="prose-editorial mt-8 border-l-2 border-pencil pl-4 text-base">
            <p>{r.abstract.text}</p>
            <cite className="meta mt-2 block not-italic">{formatSourceRef(r.abstract.sourceRef)}</cite>
          </blockquote>
        </div>
      </section>

      {/* Lenses + methods */}
      <section className="sheet-grid hairline-t mt-16 pt-8" aria-labelledby="m-title">
        <div className="col-span-4 md:col-span-8 lg:col-span-4">
          <p className="meta">02</p>
          <h2 id="m-title" className="heading mt-2">
            Lenses and methods
          </h2>
          <p className="mt-4 max-w-sm text-sm text-ink-2">Three theoretical perspectives and an Egyptian counterpoint frame a comparative urban analysis across scales.</p>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-8">
          <ul className="grid gap-6 md:grid-cols-2">
            {r.lenses.map((l) => (
              <li key={l.name} className="hairline-t pt-4">
                <p className="font-display text-lg">{l.name}</p>
                <p className="meta mt-1">{l.thinkers.join(" · ")}</p>
                <p className="mt-3 text-sm text-ink-2">{l.text}</p>
                <div className="mt-2">
                  <SourceRefs refs={l.sourceRefs} />
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {r.methods.map((m) => (
              <li key={m.name} className="rule-t pt-4">
                <p className="font-display text-lg">{m.name}</p>
                <p className="mt-3 text-sm text-ink-2">{m.text}</p>
                <div className="mt-2">
                  <SourceRefs refs={m.sourceRefs} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Atlas */}
      <section className="hairline-t mt-16 pt-8" aria-labelledby="atlas-title">
        <div className="sheet-grid">
          <div className="col-span-4 md:col-span-8 lg:col-span-4">
            <p className="meta">03</p>
            <h2 id="atlas-title" className="heading mt-2">
              An atlas of identity
            </h2>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-7">
            <p className="prose-editorial text-base">
              Four urban conditions, four scales. Select a case to read the dissertation’s observations over Tala’s analytical drawings; the red
              annotations follow the theme you choose. The arrangement is schematic — a field of drawings, not a map.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <CairoAtlas chapter={r} figures={media} />
        </div>
      </section>

      {/* Perspectives + insights */}
      <section className="sheet-grid hairline-t mt-16 pt-8" aria-labelledby="p-title">
        <div className="col-span-4 md:col-span-8 lg:col-span-4">
          <p className="meta">04</p>
          <h2 id="p-title" className="heading mt-2">
            Architects’ perspectives
          </h2>
          <p className="mt-4 max-w-sm text-sm text-ink-2">Five recurring themes from semi-structured interviews with practising architects in Cairo.</p>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-8">
          <ol className="grid gap-5 md:grid-cols-2">
            {r.perspectives.map((pv, i) => (
              <li key={pv.title} className="hairline-t pt-4">
                <p className="meta">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-1 font-display text-lg">{pv.title}</p>
                <p className="mt-2 text-sm text-ink-2">{pv.text}</p>
                <div className="mt-2">
                  <SourceRefs refs={pv.sourceRefs} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sheet-grid hairline-t mt-16 pt-8" aria-labelledby="i-title">
        <div className="col-span-4 md:col-span-8 lg:col-span-4">
          <p className="meta">05</p>
          <h2 id="i-title" className="heading mt-2">
            Insights and conclusion
          </h2>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-7">
          <ul className="space-y-5">
            {r.insights.map((q) => (
              <li key={q.text}>
                <blockquote className="prose-editorial text-lg">
                  <p>“{q.text}”</p>
                  <cite className="meta mt-1 block not-italic">{formatSourceRef(q.sourceRef)}</cite>
                </blockquote>
              </li>
            ))}
          </ul>
          <blockquote className="mt-10 border-l-2 border-pencil pl-4">
            <p className="font-display text-2xl leading-snug">“{r.conclusion.text}”</p>
            <cite className="meta mt-2 block not-italic">{formatSourceRef(r.conclusion.sourceRef)}</cite>
          </blockquote>
          <p className="mt-6 max-w-prose text-sm text-ink-2">
            These conclusions are the author’s qualitative analysis. The dissertation does not flatten its findings into a claim that modern
            architecture is bad: identity is shown changing through negotiation between development, memory, local practice and everyday life.
          </p>
        </div>
      </section>

      {/* Limitations, ethics, sources */}
      <section className="sheet-grid hairline-t mt-16 pt-8" aria-labelledby="l-title">
        <div className="col-span-4 md:col-span-8 lg:col-span-4">
          <p className="meta">06</p>
          <h2 id="l-title" className="heading mt-2">
            Limitations, ethics and sources
          </h2>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-8">
          <ul className="space-y-3">
            {r.limitations.map((q) => (
              <li key={q.text} className="text-sm text-ink-2">
                {q.text} <span className="meta">— {formatSourceRef(q.sourceRef)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-2">
            {r.ethics.text} <span className="meta">— {formatSourceRef(r.ethics.sourceRef)}</span>
          </p>
          {r.download && (
            <div className="mt-8 rule-t pt-6">
              <a href={r.download.href} className="control" download>
                <Download size={16} aria-hidden />
                {r.download.label}
              </a>
              <p className="meta mt-2 max-w-prose">{r.download.note}</p>
            </div>
          )}
          <h3 className="meta meta-strong mt-10">Bibliography</h3>
          <ol className="mt-3 space-y-2 text-sm text-ink-2">
            {r.bibliography.map((b) => (
              <li key={b.text}>{b.text}</li>
            ))}
          </ol>
          <h3 className="meta meta-strong mt-10">Figure references</h3>
          <ol className="mt-3 space-y-1 text-sm text-ink-2">
            {r.figureCredits.map((f) => (
              <li key={f.figure}>
                Figure {f.figure} — {f.credit}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </article>
  );
}
