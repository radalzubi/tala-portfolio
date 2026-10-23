/**
 * Maison Peplum — interpretive massing and fin geometry.
 *
 * Proportions are read from the portfolio drawings (plan p.10, section 1:50 p.11, models p.9/p.12)
 * and the exterior renders (p.8, p.12). No dimensions are stated in the source; everything here is
 * proportional and recorded in docs/RECONSTRUCTION.md. Model units are notional metres.
 *
 * What the sources show about the fins (and what this geometry reproduces):
 *  - p.8 / p.12 renders: thin vertical fins, perpendicular to the façade, rising from the ground,
 *    fairly straight through the floors and then bulging outward above the eaves into a rounded,
 *    wave-like crest that stands above the ridge; the row continues around the gable end.
 *  - p.11 section: fins on both faces; the right-hand fins run to the ground, the left-hand ones
 *    start at the first floor; both swell into a thick curl above the roof.
 *  - p.9 garment studies: the flare at the hem of the peplum jacket.
 */
import * as THREE from "three";

export const PEPLUM = {
  length: 30, // along X (long façades face ±Z)
  width: 13, // along Z
  wall: 0.35,
  groundFloor: 3.6, // top of ground-floor slab zone
  eaves: 7.0,
  ridge: 10.2,
  baseInset: 0.8, // ground floor recessed under the upper volume (cantilever)
  finCount: 34, // per long façade
  endFinCount: 11, // per gable end
  finThickness: 0.08,
  finBottom: 0.35,
} as const;

export interface FinSpec {
  index: number;
  kind: "long" | "end";
  /** +1 / -1 along the fin's outward axis (Z for long façades, X for gable ends). */
  side: 1 | -1;
  /** Base position of the fin in world space when assembled. */
  base: [number, number, number];
  /** 0–1 position along its row. */
  t: number;
  tint: number;
  geometry: THREE.BufferGeometry;
  /** Outward unit direction for the explode animation. */
  outward: [number, number, number];
}

const roofDir = (() => {
  const dz = -PEPLUM.width / 2;
  const dy = PEPLUM.ridge - PEPLUM.eaves;
  const len = Math.hypot(dz, dy);
  return { z: dz / len, y: dy / len, len };
})();

interface PathSample {
  pts: THREE.Vector2[];
  normals: THREE.Vector2[];
  /** 0 on the wall, rising to 1 at the end of the over-roof portion; used by the depth function. */
  roofU: number[];
}

/**
 * Inner path of a long-façade fin in (u outward, y up): up the wall from `bottom`, over the eave
 * and up the roof slope for `topT` of the slope length.
 */
function longInnerPath(bottom: number, topT: number, samples = 30): PathSample {
  const pts: THREE.Vector2[] = [];
  const normals: THREE.Vector2[] = [];
  const roofU: number[] = [];
  const wallH = PEPLUM.eaves - bottom;
  const roofLen = roofDir.len * topT;
  const wallSamples = Math.max(6, Math.round((samples * wallH) / (wallH + roofLen)));
  const roofSamples = samples - wallSamples;
  const uWall = PEPLUM.width / 2;
  for (let i = 0; i < wallSamples; i++) {
    const s = i / (wallSamples - 1);
    pts.push(new THREE.Vector2(uWall, bottom + s * wallH));
    normals.push(new THREE.Vector2(1, 0));
    roofU.push(0);
  }
  for (let i = 1; i <= roofSamples; i++) {
    const s = i / roofSamples;
    const d = s * roofLen;
    pts.push(new THREE.Vector2(uWall + roofDir.z * d, PEPLUM.eaves + roofDir.y * d));
    normals.push(new THREE.Vector2(roofDir.y, -roofDir.z)); // outward-up normal of the roof plane
    roofU.push(s);
  }
  normals[wallSamples - 1] = new THREE.Vector2(1 + roofDir.y, -roofDir.z).normalize(); // soften the eave corner
  return { pts, normals, roofU };
}

/**
 * Inner path of a gable-end fin: up the end wall to the gable line at this z, then a short lean
 * inward and upward (the render shows the crest continuing round the corner).
 */
function endInnerPath(bottom: number, z: number, samples = 24): PathSample {
  const pts: THREE.Vector2[] = [];
  const normals: THREE.Vector2[] = [];
  const roofU: number[] = [];
  const top = gableHeightAt(z);
  const uWall = PEPLUM.length / 2;
  const leanLen = 1.6 + 0.9 * (1 - Math.abs(z) / (PEPLUM.width / 2));
  const wallSamples = samples - 8;
  for (let i = 0; i < wallSamples; i++) {
    const s = i / (wallSamples - 1);
    pts.push(new THREE.Vector2(uWall, bottom + s * (top - bottom)));
    normals.push(new THREE.Vector2(1, 0));
    roofU.push(0);
  }
  const lean = new THREE.Vector2(-0.55, 0.84).normalize();
  for (let i = 1; i <= 8; i++) {
    const s = i / 8;
    pts.push(new THREE.Vector2(uWall + lean.x * leanLen * s, top + lean.y * leanLen * s));
    normals.push(new THREE.Vector2(lean.y, -lean.x));
    roofU.push(s);
  }
  return { pts, normals, roofU };
}

// Height of the gable roof line at a given z (0 at the ridge).
function gableHeightAt(z: number): number {
  return PEPLUM.eaves + (PEPLUM.ridge - PEPLUM.eaves) * (1 - Math.min(1, Math.abs(z) / (PEPLUM.width / 2)));
}

/**
 * Outward depth of a fin along its path. `y` is the height of the inner point, `u` the position along
 * the over-roof portion (0 on the wall), `t` the fin's position along its row (drives the wave).
 */
function finDepth(y: number, u: number, t: number, crest: number): number {
  // hem: the peplum flare at the bottom, strongest at the ground, gone by the first floor
  const hem = 1.05 * Math.pow(Math.max(0, 1 - (y - PEPLUM.finBottom) / 3.4), 2.2);
  // waist: a quiet, slightly undulating depth through the upper floor
  const waist = 0.5 + 0.12 * (0.5 + 0.5 * Math.sin(t * Math.PI * 4.3 + y * 0.6));
  // crest: the rounded bulge above the eaves, its size varying along the row like a travelling fold
  const petal = u > 0 ? crest * Math.pow(Math.sin(u * Math.PI), 0.85) : 0;
  return Math.max(0.28, hem + waist + petal);
}

function buildShape(path: PathSample, t: number, crest: number, hemDrop: number): THREE.Shape {
  const { pts, normals, roofU } = path;
  const outer = pts.map((p, i) => {
    const d = finDepth(p.y, roofU[i], t, crest);
    return new THREE.Vector2(p.x + normals[i].x * d, p.y + normals[i].y * d);
  });
  outer[0].y -= hemDrop; // the hem hangs slightly below the inner edge, like a jacket hem
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
  // rounded tip curling outward and up between the inner top and the outer top
  const tipIn = pts[pts.length - 1];
  const tipOut = outer[outer.length - 1];
  const nTip = normals[normals.length - 1];
  // control point leans outward more than up, so the tip reads as a rounded fold rather than a spike
  const ctrl = new THREE.Vector2(tipIn.x + nTip.x * crest * 1.15 + 0.35, tipIn.y + nTip.y * crest * 0.75 + 0.45);
  shape.quadraticCurveTo(ctrl.x, ctrl.y, tipOut.x, tipOut.y);
  for (let i = outer.length - 2; i >= 0; i--) shape.lineTo(outer[i].x, outer[i].y);
  shape.closePath();
  return shape;
}

function extrude(shape: THREE.Shape): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, { depth: PEPLUM.finThickness, bevelEnabled: false, curveSegments: 8 });
  return g;
}

/** Build every fin: two long façades (±Z) and two gable ends (±X). Geometry is in world orientation. */
export function buildFins(): FinSpec[] {
  const fins: FinSpec[] = [];
  const n = PEPLUM.finCount;
  const usable = PEPLUM.length - 2.6; // leave the corners to the gable-end fins
  for (const side of [1, -1] as const) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const tt = side === 1 ? t : 1 - t * 0.97;
      // the crest travels along the row: two long folds with a smaller counter-wave
      const wave = 0.5 + 0.4 * Math.sin(tt * Math.PI * 2.4 + 0.9) + 0.1 * Math.sin(tt * Math.PI * 7.1);
      const crest = 1.35 + 0.95 * wave;
      const topT = 0.55 + 0.35 * Math.pow(Math.sin(tt * Math.PI), 0.7);
      // on the canal side (+Z) every fin reaches the ground; on the street side alternate fins stop at the first floor (section p.11)
      const bottom = side === 1 || i % 3 !== 1 ? PEPLUM.finBottom : PEPLUM.groundFloor + 0.1;
      const shape = buildShape(longInnerPath(bottom, topT), tt, crest, 0.3 * (0.5 + 0.5 * Math.sin(tt * Math.PI * 1.7)));
      const geometry = extrude(shape);
      // Shape space (x = outward z, y = up) extruded along +z → rotate so extrusion runs along world X.
      geometry.rotateY(-Math.PI / 2); // shape x (outward) → world +z; verified in scripts/check_geometry.mjs
      if (side === -1) geometry.rotateY(Math.PI);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      fins.push({
        index: i,
        kind: "long",
        side,
        base: [-usable / 2 + (usable / (n - 1)) * i, 0, 0],
        t,
        tint: 0.5 + 0.5 * Math.sin(i * 1.73 + side),
        geometry,
        outward: [0, 0.22, side],
      });
    }
  }
  const m = PEPLUM.endFinCount;
  const endUsable = PEPLUM.width - 1.6;
  for (const side of [1, -1] as const) {
    for (let i = 0; i < m; i++) {
      const t = i / (m - 1);
      const z = -endUsable / 2 + endUsable * t;
      const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 2.1 + (side === 1 ? 0.4 : 1.9));
      const crest = 0.9 + 0.7 * wave;
      const shape = buildShape(endInnerPath(PEPLUM.finBottom, z), t, crest, 0.2);
      const geometry = extrude(shape);
      // Shape space (x = outward x, y = up) extruded along +z: already world-oriented for the +X end.
      if (side === -1) geometry.rotateY(Math.PI);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      fins.push({
        index: n * 2 + i,
        kind: "end",
        side,
        base: [side * 0.02, 0, z],
        t,
        tint: 0.5 + 0.5 * Math.sin(i * 1.3 + side * 2),
        geometry,
        outward: [side, 0.22, 0],
      });
    }
  }
  return fins;
}

/** Gable end wall profile (pentagon) in (z, y) for extrusion along X. */
export function gableShape(width: number, eaves: number, ridge: number, base = 0): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, base);
  s.lineTo(width / 2, base);
  s.lineTo(width / 2, eaves);
  s.lineTo(0, ridge);
  s.lineTo(-width / 2, eaves);
  s.closePath();
  return s;
}

export function buildGable(thickness = PEPLUM.wall): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(gableShape(PEPLUM.width, PEPLUM.eaves, PEPLUM.ridge, PEPLUM.groundFloor), {
    depth: thickness,
    bevelEnabled: false,
  });
  g.rotateY(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

/** Roof slope slab: returns geometry for one side, positioned by the caller. */
export function roofSlope(): { geometry: THREE.BufferGeometry; angle: number; length: number } {
  const length = roofDir.len + 0.5;
  const geometry = new THREE.BoxGeometry(PEPLUM.length + 0.8, 0.22, length);
  return { geometry, angle: Math.atan2(PEPLUM.ridge - PEPLUM.eaves, PEPLUM.width / 2), length };
}
