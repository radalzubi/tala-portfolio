// Content integrity checks: every media id referenced by the content records exists in the built
// manifest, no production notes leak into public copy, and no third-party asset is referenced.
// Run after `npm run media`:  node scripts/check_content.mjs
import { readFileSync } from "node:fs";
const media = JSON.parse(readFileSync(new URL("../src/content/media.generated.json", import.meta.url), "utf8"));
const projectsSrc = readFileSync(new URL("../src/content/projects.ts", import.meta.url), "utf8");
const researchSrc = readFileSync(new URL("../src/content/research.ts", import.meta.url), "utf8");
const aboutSrc = readFileSync(new URL("../src/content/about.ts", import.meta.url), "utf8");

const ids = new Set();
for (const m of projectsSrc.matchAll(/\b(?:id|heroId|posterId|drawingId|mediaId):\s*"([a-z0-9-]+)"/g)) ids.add(m[1]);
for (const m of researchSrc.matchAll(/\b(?:mediaId):\s*"([a-z0-9-]+)"/g)) ids.add(m[1]);
for (const m of researchSrc.matchAll(/figures:\s*\[([^\]]+)\]/g)) for (const id of m[1].matchAll(/"([a-z0-9-]+)"/g)) ids.add(id[1]);

// sal-* ids are rendered by the SensoryDiagram SVG component, not the media pipeline; *-poster ids are
// captured from the built site by scripts/capture_posters.mjs and only warned about until then.
const mediaLike = [...ids].filter((id) => /^(mp|mi|cx|id)-/.test(id));
const missingPosters = mediaLike.filter((id) => id.endsWith("-poster") && !media[id]);
const missing = mediaLike.filter((id) => !id.endsWith("-poster") && !media[id]);
if (missingPosters.length) console.log("posters not yet captured (viewer falls back to the hero image):", missingPosters.join(", "));
const thirdParty = mediaLike.filter((id) => media[id]?.provenance === "third-party");

const banned = [/insert original/i, /awaiting source/i, /should become the principal/i, /in the final portfolio/i, /production note/i, /lorem ipsum/i, /@example\.com/i, /\bTODO\b/];
const leaks = [];
for (const [name, src] of [["projects", projectsSrc], ["research", researchSrc], ["about", aboutSrc]]) {
  for (const re of banned) if (re.test(src)) leaks.push(`${name}: ${re}`);
}
for (const [id, a] of Object.entries(media)) {
  for (const re of banned) if (re.test(a.caption) || re.test(a.alt)) leaks.push(`media ${id}: ${re}`);
}

console.log(`${mediaLike.length} media ids referenced, ${Object.keys(media).length} built`);
if (missing.length) console.log("MISSING media:", missing.join(", "));
if (thirdParty.length) console.log("THIRD-PARTY media referenced:", thirdParty.join(", "));
if (leaks.length) console.log("PRODUCTION NOTE LEAKS:", leaks.join("; "));
const unused = Object.keys(media).filter((id) => !ids.has(id));
if (unused.length) console.log("built but unreferenced:", unused.join(", "));
process.exit(missing.length || thirdParty.length || leaks.length ? 1 : 0);
