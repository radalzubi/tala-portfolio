# Tala Hagras portfolio — repository instructions

Interactive architectural portfolio for Tala Hagras ("The Living Section"). Static Next.js 16 export
with React Three Fiber 3D islands. Read these before changing anything:

1. `docs/MASTER_PROMPT.txt` — the original brief (content integrity rules, IA, acceptance tests).
2. `docs/CLOUD_HANDOFF.md` — current state, known failures, prioritised tasks, next action.
3. `docs/BRIEF.md`, `docs/DECISIONS.md`, `docs/TASKS.json`, `docs/CONTENT_NEEDED.md`.
4. `AGENTS.md` — Next.js 16 differs from older versions; read `node_modules/next/dist/docs/` before using an API.

## Non-negotiable rules
- Preserve working code and the decisions in `docs/DECISIONS.md`. Do not restart or redesign without evidence.
- Keep original artwork distinct from interpretive 3D reconstructions. Label every model
  "Interpretive 3D study based on portfolio drawings" (or equivalent) next to its viewer.
- Every public image traces to a source file and physical page via `data/source-manifest.json`.
- Never publish production notes ("Insert original…", "Awaiting source artwork", "should become…").
- No invented facts: no contact details, CV, awards, dimensions, fin counts, years per project, built status.
- British English in site copy. Dissertation title is "Homogenisation of Cairo's Urban Horizons";
  "Beyond the Generic City" is only an editorial label.
- Never commit or publish dissertation appendices (physical pages 29–48) or the raw dissertation PDF.
- Do not deploy publicly, merge to main, or force-push without the owner's explicit approval.

## Commands
```bash
npm ci                     # install from lockfile
npm run dev                # http://localhost:3000
npm run typecheck          # tsc --noEmit
npx eslint src scripts     # lint
npm run build              # static export to ./out
npm start                  # serve ./out
npm run check:geometry     # numeric sanity check of the Maison Peplum fins
npm run check:contrast     # WCAG contrast of palette tokens
npm run media              # build public/media from data/source-manifest.json (needs pymupdf + pillow)
```

Page numbers everywhere are one-based physical PDF pages.
