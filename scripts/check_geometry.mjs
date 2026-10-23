// Sanity-check the procedural Maison Peplum geometry outside the browser.
// Run: node scripts/check_geometry.mjs   (after `npm install`; uses the project's three.js)
import * as THREE from "three";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// transpile the TS module quickly with typescript's transpileModule
const ts = await import("typescript");
const src = readFileSync(new URL("../src/components/models/maison-peplum/geometry.ts", import.meta.url), "utf8");
const js = ts.default.transpileModule(src, { compilerOptions: { module: ts.default.ModuleKind.ESNext, target: ts.default.ScriptTarget.ES2022 } }).outputText;
mkdirSync(new URL("../.tmp", import.meta.url), { recursive: true });
const out = new URL("../.tmp/geometry.mjs", import.meta.url);
writeFileSync(out, js); // bare "three" resolves from node_modules
const { buildFins, buildGable } = await import(out.href);
const fins = buildFins();
const bb = new THREE.Box3();
let tris = 0;
for (const f of fins) {
  const b = f.geometry.boundingBox.clone().translate(new THREE.Vector3(...f.base));
  bb.union(b);
  tris += f.geometry.index ? f.geometry.index.count / 3 : f.geometry.attributes.position.count / 3;
}
console.log("fins:", fins.length, "triangles:", tris);
console.log("fin bbox min", bb.min.toArray().map((v) => v.toFixed(2)), "max", bb.max.toArray().map((v) => v.toFixed(2)));
const f0 = fins[0].geometry.boundingBox;
console.log("fin[0] side+1 bbox", f0.min.toArray().map((v) => v.toFixed(2)), f0.max.toArray().map((v) => v.toFixed(2)), "base", fins[0].base);
const fm = fins[fins.length - 1].geometry.boundingBox;
console.log("fin[last] side-1 bbox", fm.min.toArray().map((v) => v.toFixed(2)), fm.max.toArray().map((v) => v.toFixed(2)));
const g = buildGable();
g.computeBoundingBox();
console.log("gable bbox", g.boundingBox.min.toArray().map((v) => v.toFixed(2)), g.boundingBox.max.toArray().map((v) => v.toFixed(2)));
const ends = fins.filter((f) => f.kind === "end");
const e0 = ends[0].geometry.boundingBox;
console.log("end fins:", ends.length, "end[0] bbox", e0.min.toArray().map((v) => v.toFixed(2)), e0.max.toArray().map((v) => v.toFixed(2)), "base", ends[0].base);
console.log("expect: long fins span x≈±14.4, z from ≈±6.5 outward to ≈±9.5, y from ≈0.1 to ≈12.5; end fins x from ≈±15 outward to ≈±17; gable x≈0..0.35, z≈±6.5, y 3.6..10.2");
