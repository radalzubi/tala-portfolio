/**
 * Maison Peplum — interpretive massing and fin geometry.
 *
 * Proportions are read from the portfolio drawings (plan p.10, section 1:50 p.11, models p.9/p.12)
 * and the exterior renders (p.8, p.12). No dimensions are stated in the source; everything here is
 * proportional and recorded in docs/RECONSTRUCTION.md. Model units are notional metres.
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
  finCount: 38,
  finThickness: 0.09,
  finDepthBase: 0.42,
  finFlare: 0.75,
  finHem: 0.35,
} as const;

export interface FinSpec {
  index: number;
  side: 1 | -1;
  x: number;
  /** 0–1 position along the row. */
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

/** Inner path of a fin in (z outward, y up) coordinates: up the wall, over the eave, up the roof. */
function innerPath(topT: number, samples = 26): { pts: THREE.Vector2[]; normals: THREE.Vector2[] } {
  const pts: THREE.Vector2[] = [];
  const normals: THREE.Vector2[] = [];
  const wallSamples = Math.round(samples * 0.42);
  const roofSamples = samples - wallSamples;
  const zWall = PEPLUM.width / 2;
  for (let i = 0; i < wallSamples; i++) {
    const s = i / (wallSamples - 1);
    pts.push(new THREE.Vector2(zWall, PEPLUM.groundFloor + 0.05 + s * (PEPLUM.eaves - PEPLUM.groundFloor - 0.05)));
    normals.push(new THREE.Vector2(1, 0));
  }
  const roofLen = roofDir.len * Math.max(0.12, Math.min(0.97, topT));
  for (let i = 1; i <= roofSamples; i++) {
    const s = i / roofSamples;
    const d = s * roofLen;
    pts.push(new THREE.Vector2(zWall + roofDir.z * d, PEPLUM.eaves + roofDir.y * d));
    normals.push(new THREE.Vector2(roofDir.y, -roofDir.z)); // outward-up normal of the roof plane
  }
  // soften the eave corner normal
  const k = wallSamples - 1;
  normals[k] = new THREE.Vector2(1 + roofDir.y, -roofDir.z).normalize();
  return { pts, normals };
}

/** Outer offset distance along the fin: peplum flare at the hem, travelling folds above. */
function finDepth(s: number, t: number): number {
  const flare = PEPLUM.finFlare * Math.pow(1 - s, 2.4);
  const amplitude = 0.22 + 0.34 * (0.5 + 0.5 * Math.sin(t * Math.PI * 3.1 + 1.2));
  const phase = t * Math.PI * 2.6;
  const wave = amplitude * (0.5 + 0.5 * Math.sin(s * Math.PI * 2.0 + phase));
  const taper = 0.6 + 0.4 * (1 - s); // thinner towards the ridge
  return Math.max(0.2, (PEPLUM.finDepthBase + flare + wave) * taper);
}

function finShape(t: number): THREE.Shape {
  const topT = 0.32 + 0.68 * Math.pow(Math.sin(t * Math.PI), 0.65);
  const { pts, normals } = innerPath(topT);
  const outer = pts.map((p, i) => {
    const s = i / (pts.length - 1);
    const d = finDepth(s, t);
    return new THREE.Vector2(p.x + normals[i].x * d, p.y + normals[i].y * d);
  });
  // hem drops slightly below the inner start, like a jacket hem
  outer[0].y -= PEPLUM.finHem * (0.6 + 0.4 * Math.sin(t * Math.PI * 1.7));
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].y);
  // rounded tip between inner top and outer top
  const tipIn = pts[pts.length - 1];
  const tipOut = outer[outer.length - 1];
  const mid = new THREE.Vector2((tipIn.x + tipOut.x) / 2, (tipIn.y + tipOut.y) / 2 + 0.12);
  shape.quadraticCurveTo(mid.x, mid.y, tipOut.x, tipOut.y);
  for (let i = outer.length - 2; i >= 0; i--) shape.lineTo(outer[i].x, outer[i].y);
  shape.closePath();
  return shape;
}

/** Build every fin for both long façades. Geometry is in world orientation; position by `x`. */
export function buildFins(): FinSpec[] {
  const fins: FinSpec[] = [];
  const n = PEPLUM.finCount;
  const usable = PEPLUM.length - 1.4;
  for (const side of [1, -1] as const) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const shape = finShape(side === 1 ? t : 1 - t * 0.97);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: PEPLUM.finThickness,
        bevelEnabled: false,
        curveSegments: 6,
      });
      // Shape space (x = outward z, y = up) extruded along +z → rotate so extrusion runs along world X.
      geometry.rotateY(-Math.PI / 2); // shape x (outward) → world +z; verified in scripts/check_geometry.mjs
      if (side === -1) geometry.rotateY(Math.PI);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      fins.push({
        index: i,
        side,
        t,
        x: -usable / 2 + (usable / (n - 1)) * i,
        tint: 0.5 + 0.5 * Math.sin(i * 1.73 + side),
        geometry,
        outward: [0, 0.25, side],
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
