# Ownership and shared contracts

Orchestrator (this session) owns: package.json and lockfile, `src/app/globals.css` tokens,
`src/app/layout.tsx`, routing, `src/content/types.ts`, `data/source-manifest.json`, scripts.

Workers receive exclusive paths; they validate with `npx tsc --noEmit` and `npx eslint <paths>`
only. Only the orchestrator runs `next build` and `next dev`.

| Area | Paths | Shared contract consumed |
| --- | --- | --- |
| Maison Peplum model | `src/components/models/maison-peplum/**` | `src/components/viewer/model-contract.ts` |
| Music institution model | `src/components/models/music-institution/**` | same |
| Viewer shell + controls | `src/components/viewer/**` | `src/content/types.ts` |
| Cairo chapter | `src/components/research/**`, `src/content/research.ts` | `src/content/types.ts`, media manifest |
| Pages + layout | `src/app/**`, `src/components/site/**`, `src/components/media/**` | all of the above |
| Tests | `tests/**`, `playwright.config.ts` | routes |
