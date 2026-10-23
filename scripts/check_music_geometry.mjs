// Sanity-check the procedural Music Institution geometry outside the browser.
// Run: node scripts/check_music_geometry.mjs   (after `npm install`; uses the project's three.js)
// Prints triangle counts and bounding boxes, verifies the drum is centred where spec.ts says,
// and that nothing sits below y = -0.05 except the canal water.
import * as THREE from "three";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const ts = await import("typescript");
const srcDir = new URL("../src/components/models/music-institution/", import.meta.url);
const outDir = new URL("../.tmp/music/", import.meta.url);
mkdirSync(outDir, { recursive: true });
for (const name of ["dimensions", "geometry", "spec"]) {
  const src = readFileSync(new URL(`${name}.ts`, srcDir), "utf8");
  let js = ts.default.transpileModule(src, { compilerOptions: { module: ts.default.ModuleKind.ESNext, target: ts.default.ScriptTarget.ES2022 } }).outputText;
  js = js.replace(/from "\.\/(dimensions|geometry)"/g, 'from "./$1.mjs"'); // bare "three" resolves from node_modules
  writeFileSync(new URL(`${name}.mjs`, outDir), js);
}
const { buildMusicInstitution, triangleCount } = await import(new URL("geometry.mjs", outDir).href);
const { MUSIC_INSTITUTION_MODEL_DEFAULTS, hotspotAnchors } = await import(new URL("spec.mjs", outDir).href);
const { MUSIC, LEVELS } = await import(new URL("dimensions.mjs", outDir).href);

const geo = buildMusicInstitution();
const fmt = (v) => v.toArray().map((n) => n.toFixed(2)).join(", ");
const rows = [];
let total = 0;
const composition = new THREE.Box3(); // everything except the plate / kerb / canal, which run beyond as context
const scene = new THREE.Box3(); // everything, context included
const elementBoxes = [];
const problems = [];

function report(name, geometry, { instances = 1, matrices = null, allowBelow = false, context = false } = {}) {
  geometry.computeBoundingBox();
  let bb = geometry.boundingBox.clone();
  if (matrices) {
    bb = new THREE.Box3();
    for (const m of matrices) bb.union(geometry.boundingBox.clone().applyMatrix4(m));
  }
  const tris = triangleCount(geometry) * instances;
  total += tris;
  rows.push({ name, tris, min: fmt(bb.min), max: fmt(bb.max) });
  if (!allowBelow && bb.min.y < -0.05) problems.push(`${name} reaches y=${bb.min.y.toFixed(3)} (< -0.05)`);
  scene.union(bb);
  if (!context) {
    composition.union(bb);
    elementBoxes.push({ name, bb });
  }
  return bb;
}

const inst = (name, geometry, set) => report(name, geometry, { instances: set.matrices.length, matrices: set.matrices });

const plinth = report("plinth (ring-ground)", geo.plinth);
report("glazing ground", geo.glazingGround);
inst("columns ground", geo.unitColumn, geo.columnsGround);
inst("partitions ground", geo.unitBox, geo.partitionsGround);
report("pit (performance-volume)", geo.pit);
report("seating", geo.seating);
report("hall wall", geo.hallWall);
report("first plate (ring-upper)", geo.firstPlate);
report("mezzanine wall", geo.mezzanineWall);
report("balustrade", geo.balustrade);
report("glazing upper", geo.glazingUpper);
inst("columns upper", geo.unitColumn, geo.columnsUpper);
inst("partitions upper", geo.unitBox, geo.partitionsUpper);
const roof = report("roof disc", geo.roofDisc);
report("oculus ring", geo.oculusRing);
report("planting", geo.planting);
inst("annexe slats", geo.unitBox, geo.annexeSlats);
report("annexe skin", geo.annexeSkin);
report("annexe floor", geo.annexeFloor);
report("annexe roof", geo.annexeRoof);
inst("screen slats", geo.unitBox, geo.screenSlats);
report("screen stage", geo.screenStage);
inst("pavilion slats", geo.unitBox, geo.pavilionSlats);
report("pavilion platforms", geo.pavilionPlatforms);
report("terraces", geo.terraces);
report("kerb", geo.kerb, { context: true });
report("plateau", geo.plateau, { context: true });
report("canal water", geo.water, { allowBelow: true, context: true });

console.table(rows);
console.log("total triangles (instances expanded):", total);

// Drum centring: plinth and roof must be centred on the plan origin where the spec anchors the hall.
const centre = plinth.getCenter(new THREE.Vector3());
const roofCentre = roof.getCenter(new THREE.Vector3());
if (Math.abs(centre.x) > 0.01 || Math.abs(centre.z) > 0.01) problems.push(`plinth centred at (${centre.x.toFixed(2)}, ${centre.z.toFixed(2)}), expected (0, 0)`);
if (Math.abs(roofCentre.x) > 0.01 || Math.abs(roofCentre.z) > 0.01) problems.push(`roof centred at (${roofCentre.x.toFixed(2)}, ${roofCentre.z.toFixed(2)}), expected (0, 0)`);
const hall = hotspotAnchors["performance-hall"];
if (Math.abs(hall[0]) > 0.01 || Math.abs(hall[2]) > 1) problems.push(`performance-hall anchor ${hall} is not at the drum centre`);
console.log("drum centre (plinth)", fmt(centre), "roof centre", fmt(roofCentre));
console.log("levels", LEVELS, "plateau hole radius", (MUSIC.plinthRadius + 0.06).toFixed(2));

// Bounds: every element's bounding-box corners should sit within the spec sphere (5% slack); report the farthest.
const { bounds } = MUSIC_INSTITUTION_MODEL_DEFAULTS;
const bc = new THREE.Vector3(...bounds.center);
let farthest = { d: 0, name: "" };
for (const { name, bb } of elementBoxes) {
  for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
    const d = new THREE.Vector3(x, y, z).distanceTo(bc);
    if (d > farthest.d) farthest = { d, name };
  }
}
console.log("composition bbox", fmt(composition.min), "→", fmt(composition.max));
console.log(`spec bounds centre (${bounds.center}) radius ${bounds.radius}; farthest element corner ${farthest.d.toFixed(1)} (${farthest.name})`);
if (farthest.d > bounds.radius * 1.05) problems.push(`composition exceeds spec bounds radius (${farthest.d.toFixed(1)} > ${bounds.radius}, ${farthest.name})`);

// Hotspot anchors should lie inside the scene box (with a little head-room above the roof).
const slack = new THREE.Box3(scene.min.clone().subScalar(1), scene.max.clone().addScalar(1));
for (const [id, p] of Object.entries(hotspotAnchors)) {
  if (!slack.containsPoint(new THREE.Vector3(...p))) problems.push(`hotspot ${id} at (${p}) lies outside the scene`);
}
console.log("hotspots", hotspotAnchors);

// Preset cameras must respect the camera rig's orbit limits (0.6R ≤ distance ≤ 5R, camera above target).
for (const p of MUSIC_INSTITUTION_MODEL_DEFAULTS.presets) {
  const pos = new THREE.Vector3(...p.camera.position);
  const tgt = new THREE.Vector3(...p.camera.target);
  const d = pos.distanceTo(tgt);
  const polar = Math.atan2(Math.hypot(pos.x - tgt.x, pos.z - tgt.z), pos.y - tgt.y);
  const note = d < bounds.radius * 0.6 ? "TOO CLOSE" : d > bounds.radius * 5 ? "TOO FAR" : polar > Math.PI / 2 - 0.03 ? "BELOW POLAR CLAMP" : "ok";
  if (note !== "ok") problems.push(`preset ${p.id}: ${note} (distance ${d.toFixed(1)}, polar ${((polar * 180) / Math.PI).toFixed(1)}°)`);
  console.log(`preset ${p.id.padEnd(9)} distance ${d.toFixed(1).padStart(6)}  polar ${((polar * 180) / Math.PI).toFixed(1)}°  fov ${p.camera.fov}  ${note}`);
}

if (total > 60000) problems.push(`triangle budget exceeded: ${total} > 60000`);
if (problems.length) {
  console.error("\nPROBLEMS:\n - " + problems.join("\n - "));
  process.exitCode = 1;
} else {
  console.log("\nOK: drum centred, nothing below y=-0.05 except the canal, bounds and presets consistent.");
}
geo.dispose();
