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
  const b = f.geometry.boundingBox.clone().translate(new THREE.Vector3(f.x, 0, 0));
  bb.union(b);
  tris += f.geometry.index ? f.geometry.index.count / 3 : f.geometry.attributes.position.count / 3;
}
console.log("fins:", fins.length, "triangles:", tris);
console.log("fin bbox min", bb.min.toArray().map((v) => v.toFixed(2)), "max", bb.max.toArray().map((v) => v.toFixed(2)));
const f0 = fins[0].geometry.boundingBox;
console.log("fin[0] side+1 bbox", f0.min.toArray().map((v) => v.toFixed(2)), f0.max.toArray().map((v) => v.toFixed(2)), "x at", fins[0].x.toFixed(2));
const fm = fins[fins.length - 1].geometry.boundingBox;
console.log("fin[last] side-1 bbox", fm.min.toArray().map((v) => v.toFixed(2)), fm.max.toArray().map((v) => v.toFixed(2)));
const g = buildGable();
g.computeBoundingBox();
console.log("gable bbox", g.boundingBox.min.toArray().map((v) => v.toFixed(2)), g.boundingBox.max.toArray().map((v) => v.toFixed(2)));
console.log("expect: fins span x≈±14.3, z from ≈±6.5 outward to ≈±8.3, y from ≈3.3 to ≈10.3; gable x≈0..0.35, z≈±6.5, y 3.6..10.2");
