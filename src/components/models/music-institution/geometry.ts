/**
 * Music Institution — procedural, interpretive geometry.
 *
 * Pure builders (no React, no renderer state). Each element names the drawing it derives from:
 * site plan p.4, section and exploded axonometric p.5, renders p.3/p.7, model photographs p.7.
 * Everything is proportional; see dimensions.ts. Geometry is produced in world orientation so the
 * component places meshes at the origin and moves whole semantic groups for the exploded view.
 */
import * as THREE from "three";
import { LEVELS, MUSIC } from "./dimensions";

type V3 = [number, number, number];
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const UP: V3 = [0, 1, 0];
const DOWN: V3 = [0, -1, 0];
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Collects a flat triangle soup (position / normal / uv) and emits one non-indexed geometry. */
export class TriangleSoup {
  private readonly pos: number[] = [];
  private readonly nor: number[] = [];
  private readonly uv: number[] = [];

  /** One triangle, wound so that it faces along the supplied normal(s). */
  tri(a: V3, b: V3, c: V3, na: V3, nb: V3 = na, nc: V3 = na) {
    const ux = b[0] - a[0];
    const uy = b[1] - a[1];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vy = c[1] - a[1];
    const vz = c[2] - a[2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    const dot = cx * (na[0] + nb[0] + nc[0]) + cy * (na[1] + nb[1] + nc[1]) + cz * (na[2] + nb[2] + nc[2]);
    if (dot < 0) {
      this.pos.push(...a, ...c, ...b);
      this.nor.push(...na, ...nc, ...nb);
    } else {
      this.pos.push(...a, ...b, ...c);
      this.nor.push(...na, ...nb, ...nc);
    }
    this.uv.push(0, 0, 1, 0, 1, 1);
  }

  /** Quad a-b-c-d as two triangles (per-vertex normals allow smooth cylindrical faces). */
  quad(a: V3, b: V3, c: V3, d: V3, na: V3, nb: V3 = na, nc: V3 = na, nd: V3 = na) {
    this.tri(a, b, c, na, nb, nc);
    this.tri(a, c, d, na, nc, nd);
  }

  build(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

export interface SectorOptions {
  rIn: number;
  rOut: number;
  y0: number;
  y1: number;
  /** Degrees measured from +X toward +Z. Omit both for a full ring. */
  from?: number;
  to?: number;
  /** Plan-circle centre; defaults to the origin. */
  cx?: number;
  cz?: number;
  segmentsPerTurn?: number;
  top?: boolean;
  bottom?: boolean;
  inner?: boolean;
  outer?: boolean;
  caps?: boolean;
}

/** Annular sector prism: ring slabs, curved walls, stepped seating and discs (rIn = 0) all use this. */
export function addSector(soup: TriangleSoup, o: SectorOptions) {
  const full = o.from === undefined || o.to === undefined || Math.abs(o.to - o.from - 360) < 1e-6;
  const a0 = (o.from ?? 0) * DEG;
  const a1 = full ? a0 + TAU : (o.to as number) * DEG;
  const seg = Math.max(6, Math.ceil(((o.segmentsPerTurn ?? 96) * Math.abs(a1 - a0)) / TAU));
  const top = o.top ?? true;
  const bottom = o.bottom ?? true;
  const inner = (o.inner ?? true) && o.rIn > 0;
  const outer = o.outer ?? true;
  const caps = (o.caps ?? true) && !full;
  const cx = o.cx ?? 0;
  const cz = o.cz ?? 0;
  const P = (r: number, a: number, y: number): V3 => [cx + r * Math.cos(a), y, cz + r * Math.sin(a)];
  const radial = (a: number, s = 1): V3 => [s * Math.cos(a), 0, s * Math.sin(a)];
  const centreTop: V3 = [cx, o.y1, cz];
  const centreBottom: V3 = [cx, o.y0, cz];
  for (let i = 0; i < seg; i++) {
    const aA = a0 + ((a1 - a0) * i) / seg;
    const aB = a0 + ((a1 - a0) * (i + 1)) / seg;
    if (top) {
      if (o.rIn > 0) soup.quad(P(o.rIn, aA, o.y1), P(o.rOut, aA, o.y1), P(o.rOut, aB, o.y1), P(o.rIn, aB, o.y1), UP);
      else soup.tri(centreTop, P(o.rOut, aA, o.y1), P(o.rOut, aB, o.y1), UP);
    }
    if (bottom) {
      if (o.rIn > 0) soup.quad(P(o.rIn, aA, o.y0), P(o.rOut, aA, o.y0), P(o.rOut, aB, o.y0), P(o.rIn, aB, o.y0), DOWN);
      else soup.tri(centreBottom, P(o.rOut, aA, o.y0), P(o.rOut, aB, o.y0), DOWN);
    }
    if (outer) soup.quad(P(o.rOut, aA, o.y0), P(o.rOut, aA, o.y1), P(o.rOut, aB, o.y1), P(o.rOut, aB, o.y0), radial(aA), radial(aA), radial(aB), radial(aB));
    if (inner) soup.quad(P(o.rIn, aA, o.y0), P(o.rIn, aA, o.y1), P(o.rIn, aB, o.y1), P(o.rIn, aB, o.y0), radial(aA, -1), radial(aA, -1), radial(aB, -1), radial(aB, -1));
  }
  if (caps) {
    // Faces at the two ends of a partial ring point away from the sector along its tangent.
    const n0: V3 = [Math.sin(a0), 0, -Math.cos(a0)];
    const n1: V3 = [-Math.sin(a1), 0, Math.cos(a1)];
    soup.quad(P(o.rIn, a0, o.y0), P(o.rOut, a0, o.y0), P(o.rOut, a0, o.y1), P(o.rIn, a0, o.y1), n0);
    soup.quad(P(o.rIn, a1, o.y0), P(o.rOut, a1, o.y0), P(o.rOut, a1, o.y1), P(o.rIn, a1, o.y1), n1);
  }
}

function sector(o: SectorOptions): THREE.BufferGeometry {
  const soup = new TriangleSoup();
  addSector(soup, o);
  return soup.build();
}

/** Per-instance transforms for an InstancedMesh (plus an optional 0–1 tint for timber). */
export interface InstanceSet {
  matrices: THREE.Matrix4[];
  tints?: number[];
}

/**
 * Transform for a unit box/cylinder standing between y0 and y1 at polar position (r, deg) around
 * (cx, cz), rotated so its local +X points radially outward. sx is the radial size, sz the
 * tangential size (for a unit cylinder both are the radius).
 */
function radialInstance(r: number, deg: number, y0: number, y1: number, sx: number, sz: number, cx = 0, cz = 0): THREE.Matrix4 {
  const a = deg * DEG;
  return new THREE.Matrix4().compose(
    new THREE.Vector3(cx + r * Math.cos(a), (y0 + y1) / 2, cz + r * Math.sin(a)),
    new THREE.Quaternion().setFromAxisAngle(Y_AXIS, -a),
    new THREE.Vector3(sx, y1 - y0, sz),
  );
}

/** Slats around an arc with a gentle alternating tint (model photos p.7 show laser-cut timber). */
function slatRing(cx: number, cz: number, r: number, count: number, from: number, to: number, y0: number, height: (t: number) => number, width = 0.28, depth = 0.12): InstanceSet {
  const matrices: THREE.Matrix4[] = [];
  const tints: number[] = [];
  const full = Math.abs(to - from - 360) < 1e-6;
  for (let i = 0; i < count; i++) {
    const t = full ? i / count : i / (count - 1);
    const deg = from + (to - from) * t;
    matrices.push(radialInstance(r, deg, y0, y0 + height(t), depth, width, cx, cz));
    tints.push(0.5 + 0.5 * Math.sin(i * 1.73 + cx));
  }
  return { matrices, tints };
}

/** Sampled terrace path (top edge) with outward normals in plan (x, z), see dimensions.ts. */
export function terracePath(divisions = 80): { points: THREE.Vector3[]; normals: THREE.Vector2[] } {
  const curve = new THREE.CatmullRomCurve3(
    MUSIC.terracePath.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
  );
  const points = curve.getSpacedPoints(divisions);
  const normals = points.map((_, i) => {
    const t = curve.getTangentAt(i / divisions);
    // Right-hand normal of the travel direction: +X at the start (east of the drum), +Z along the canal.
    return new THREE.Vector2(t.z, -t.x).normalize();
  });
  return { points, normals };
}

/** Curved stepped terraces SU01: bands offset from the path, each a solid from the bank up to its tread (plan p.4, section p.5, render p.7). */
export function buildTerraces(path = terracePath()): THREE.BufferGeometry {
  const soup = new TriangleSoup();
  const { steps, riser, tread } = MUSIC.terrace;
  const { points, normals } = path;
  const at = (i: number, d: number, y: number): V3 => [points[i].x + normals[i].x * d, y, points[i].z + normals[i].y * d];
  const n3 = (i: number): V3 => [normals[i].x, 0, normals[i].y];
  for (let k = 0; k < steps; k++) {
    const dIn = k * tread;
    const dOut = (k + 1) * tread;
    const yTop = MUSIC.plateau - (k + 1) * riser;
    for (let i = 0; i < points.length - 1; i++) {
      soup.quad(at(i, dIn, yTop), at(i, dOut, yTop), at(i + 1, dOut, yTop), at(i + 1, dIn, yTop), UP);
      soup.quad(at(i, dOut, LEVELS.bank), at(i, dOut, yTop), at(i + 1, dOut, yTop), at(i + 1, dOut, LEVELS.bank), n3(i), n3(i), n3(i + 1), n3(i + 1));
    }
    // End caps face along the path tangent (tangent = (-n.y, 0, n.x) for the right-hand normal).
    const first = 0;
    const last = points.length - 1;
    const tStart: V3 = [normals[first].y, 0, -normals[first].x];
    const tEnd: V3 = [-normals[last].y, 0, normals[last].x];
    soup.quad(at(first, dIn, LEVELS.bank), at(first, dOut, LEVELS.bank), at(first, dOut, yTop), at(first, dIn, yTop), tStart);
    soup.quad(at(last, dIn, LEVELS.bank), at(last, dOut, LEVELS.bank), at(last, dOut, yTop), at(last, dIn, yTop), tEnd);
  }
  return soup.build();
}

/** Site plateau: a quiet plate whose +Z edge is the first terrace riser and which has a hole for the drum's plinth. */
export function buildPlateau(path = terracePath()): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const pts = path.points;
  shape.moveTo(pts[0].x, pts[0].z);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].z);
  shape.lineTo(MUSIC.site.xMin, pts[pts.length - 1].z);
  shape.lineTo(MUSIC.site.xMin, MUSIC.site.zMin);
  shape.lineTo(pts[0].x, MUSIC.site.zMin);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, MUSIC.plinthRadius + 0.06, 0, TAU, false);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: MUSIC.plateau, bevelEnabled: false, curveSegments: 72 });
  // Shape (x, y) extruded along +z → rotate so shape y becomes world z and the depth runs down from the plateau level.
  g.rotateX(Math.PI / 2);
  g.translate(0, MUSIC.plateau, 0);
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

/** Canal water (flat plane) and a low kerb along the near bank (plan p.4, render p.7). */
export function buildCanal(): { water: THREE.BufferGeometry; kerb: THREE.BufferGeometry } {
  const c = MUSIC.canal;
  const water = new THREE.PlaneGeometry(c.xMax - c.xMin, c.far - c.near);
  water.rotateX(-Math.PI / 2);
  water.translate((c.xMin + c.xMax) / 2, c.surface, (c.near + c.far) / 2);
  water.computeBoundingBox();
  const kerb = new THREE.BoxGeometry(c.xMax - c.xMin, 0.25, 0.35);
  kerb.translate((c.xMin + c.xMax) / 2, 0.125, c.near - 0.175);
  kerb.computeBoundingBox();
  return { water, kerb };
}

export interface MusicGeometry {
  // ring-ground (axonometric p.5: ground ring with SU05 studios, SU12 entrance, SU10/SU11 services)
  plinth: THREE.BufferGeometry;
  glazingGround: THREE.BufferGeometry;
  columnsGround: InstanceSet;
  partitionsGround: InstanceSet;
  // performance-volume (SU02 sunken double-height space with SU03 stepped seating, section p.5)
  pit: THREE.BufferGeometry;
  seating: THREE.BufferGeometry;
  hallWall: THREE.BufferGeometry;
  // ring-upper (SU05/SU07 mezzanine ring, SU08/SU09 practice rooms, axonometric p.5)
  firstPlate: THREE.BufferGeometry;
  mezzanineWall: THREE.BufferGeometry;
  balustrade: THREE.BufferGeometry;
  glazingUpper: THREE.BufferGeometry;
  columnsUpper: InstanceSet;
  partitionsUpper: InstanceSet;
  // roof (SU13 rooftop garden and SU14 skylight; thin disc with oculus ring on p.7)
  roofDisc: THREE.BufferGeometry;
  oculusRing: THREE.BufferGeometry;
  planting: THREE.BufferGeometry;
  // outdoor-stage (timber annexe p.7; SU02 curved screens and round pavilions, axonometric p.5)
  annexeSlats: InstanceSet;
  annexeRoof: THREE.BufferGeometry;
  annexeFloor: THREE.BufferGeometry;
  annexeSkin: THREE.BufferGeometry;
  screenSlats: InstanceSet;
  screenStage: THREE.BufferGeometry;
  pavilionSlats: InstanceSet;
  pavilionPlatforms: THREE.BufferGeometry;
  // landscape (plan p.4)
  plateau: THREE.BufferGeometry;
  terraces: THREE.BufferGeometry;
  water: THREE.BufferGeometry;
  kerb: THREE.BufferGeometry;
  // shared unit geometries for the instanced meshes
  unitBox: THREE.BufferGeometry;
  unitColumn: THREE.BufferGeometry;
  dispose: () => void;
}

function openCylinder(radius: number, y0: number, y1: number, segments = 96): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, y1 - y0, segments, 1, true);
  g.translate(0, (y0 + y1) / 2, 0);
  g.computeBoundingBox();
  return g;
}

/** Builds every element of the study. Call once; dispose via the returned handle. */
export function buildMusicInstitution(): MusicGeometry {
  const M = MUSIC;
  const L = LEVELS;
  const firstSlabUnderside = L.first - M.slab;

  // --- ground ring -------------------------------------------------------------------------
  // Solid plinth under the ring rooms, from the bank level up to the ground floor (section p.5 shows ground under the ring).
  const plinth = sector({ rIn: M.hallRadius + M.hallWall, rOut: M.plinthRadius, y0: L.bank, y1: L.ground, segmentsPerTurn: 128, bottom: false });
  const glazingGround = openCylinder(M.glazingRadius, L.ground, firstSlabUnderside);
  const columnDeg = (i: number) => (360 / M.columnCount) * i + 7.5;
  const columnsGround: InstanceSet = {
    matrices: Array.from({ length: M.columnCount }, (_, i) => radialInstance(M.columnRing, columnDeg(i), L.ground, firstSlabUnderside, M.columnRadius, M.columnRadius)),
  };
  const columnsUpper: InstanceSet = {
    matrices: Array.from({ length: M.columnCount }, (_, i) => radialInstance(M.columnRing, columnDeg(i), L.first, L.roofUnderside, M.columnRadius, M.columnRadius)),
  };
  // Radial partitions between the ring rooms; the +Z sector stays open as the entrance / foyer (SU12 on p.5).
  const partition = (r0: number, r1: number, deg: number, y0: number, y1: number) => radialInstance((r0 + r1) / 2, deg, y0, y1, r1 - r0, 0.18);
  const partitionsGround: InstanceSet = {
    matrices: [22.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => partition(M.hallRadius + M.hallWall, M.glazingRadius - 0.05, deg, L.ground, firstSlabUnderside)),
  };
  const partitionsUpper: InstanceSet = {
    matrices: Array.from({ length: 8 }, (_, i) => partition(M.mezzanineOuter + 0.3, M.glazingRadius - 0.05, 22.5 + 45 * i, L.first, L.roofUnderside)),
  };

  // --- performance volume ------------------------------------------------------------------
  // Sunken floor SU02: solid ground up to the pit level inside the hall.
  const pit = sector({ rIn: 0, rOut: M.hallRadius + M.hallWall, y0: L.bank, y1: L.pit, segmentsPerTurn: 128, bottom: false });
  // Stepped seating SU03 as concentric arcs rising from the pit toward the hall wall (plan p.4, section p.5).
  const seatingSoup = new TriangleSoup();
  const seatTread = (M.hallRadius - M.seating.inner) / M.seating.steps;
  for (let k = 0; k < M.seating.steps; k++) {
    addSector(seatingSoup, {
      rIn: M.seating.inner + k * seatTread,
      rOut: M.seating.inner + (k + 1) * seatTread,
      y0: L.pit,
      y1: L.pit + (k + 1) * M.seating.riser,
      from: M.seating.from,
      to: M.seating.to,
      segmentsPerTurn: 96,
      bottom: false,
      outer: false, // hidden by the next step / the hall wall
    });
  }
  const seating = seatingSoup.build();
  // Hall wall with three door openings (interior render p.7 shows doors in the drum wall).
  const hallSoup = new TriangleSoup();
  const door = (1.2 / M.hallRadius) / DEG; // half-angle of a 2.4 m opening
  for (const [from, to] of [
    [door, 90 - door],
    [90 + door, 180 - door],
    [180 + door, 360 - door],
  ]) {
    addSector(hallSoup, { rIn: M.hallRadius, rOut: M.hallRadius + M.hallWall, y0: L.pit, y1: firstSlabUnderside, from, to, segmentsPerTurn: 128, bottom: false });
  }
  const hallWall = hallSoup.build();

  // --- upper ring --------------------------------------------------------------------------
  const firstPlate = sector({ rIn: M.hallRadius, rOut: M.plinthRadius, y0: firstSlabUnderside, y1: L.first, segmentsPerTurn: 128 });
  // Wall between the mezzanine hallway and the practice rooms, with four door gaps (SU07/SU08/SU09, axonometric p.5).
  const mezzSoup = new TriangleSoup();
  const gap = (0.9 / M.mezzanineOuter) / DEG;
  for (let i = 0; i < 4; i++) {
    const centre = 45 + 90 * i;
    addSector(mezzSoup, { rIn: M.mezzanineOuter, rOut: M.mezzanineOuter + 0.3, y0: L.first, y1: L.roofUnderside, from: centre + gap, to: centre + 90 - gap, segmentsPerTurn: 128, bottom: false });
  }
  const mezzanineWall = mezzSoup.build();
  // Glass balustrade where the mezzanine overlooks the hall (SU05, section p.5; interior render p.7).
  const balustrade = openCylinder(M.hallRadius + 0.04, L.first, L.first + 1.1);
  const glazingUpper = openCylinder(M.glazingRadius, L.first, L.roofUnderside);

  // --- roof --------------------------------------------------------------------------------
  const roofDisc = sector({ rIn: M.oculusRadius, rOut: M.roofRadius, y0: L.roofUnderside, y1: L.roofTop, segmentsPerTurn: 160 });
  const oculusRing = sector({ rIn: M.oculusRadius, rOut: M.oculusRadius + 0.55, y0: L.roofTop, y1: L.roofTop + 0.5, segmentsPerTurn: 128 });
  const planting = sector({ rIn: M.oculusRadius + 1.3, rOut: M.roofRadius - 1.2, y0: L.roofTop, y1: L.roofTop + 0.12, segmentsPerTurn: 160, bottom: false });

  // --- outdoor stage -----------------------------------------------------------------------
  const A = M.annexe;
  const annexeSlats = slatRing(A.x, A.z, A.radius, A.slats, 0, 360, L.ground, () => A.height);
  const annexeRoof = sector({ rIn: 0, rOut: A.radius + 0.25, y0: L.ground + A.height, y1: L.ground + A.height + 0.3, cx: A.x, cz: A.z, segmentsPerTurn: 96 });
  const annexeFloor = sector({ rIn: 0, rOut: A.radius - 0.2, y0: L.ground, y1: L.ground + 0.15, cx: A.x, cz: A.z, segmentsPerTurn: 96, bottom: false });
  const annexeSkin = openCylinder(A.radius - 0.6, L.ground + 0.15, L.ground + A.height, 72);
  annexeSkin.translate(A.x, 0, A.z);
  annexeSkin.computeBoundingBox();
  const S = M.screen;
  const screenSlats = slatRing(S.x, S.z, S.radius, S.slats, S.from, S.to, L.ground, (t) => S.height - 0.8 + 0.8 * Math.sin(t * Math.PI), 0.4, 0.14);
  const screenStage = sector({ rIn: 0, rOut: S.radius + 0.4, y0: L.ground, y1: L.ground + 0.12, cx: S.x, cz: S.z, segmentsPerTurn: 96, bottom: false });
  const pavilionSoup = new TriangleSoup();
  const pavilionSlats: InstanceSet = { matrices: [], tints: [] };
  for (const p of M.pavilions) {
    addSector(pavilionSoup, { rIn: 0, rOut: p.radius, y0: L.ground, y1: L.ground + 0.3, cx: p.x, cz: p.z, segmentsPerTurn: 72, bottom: false });
    const ring = slatRing(p.x, p.z, p.radius - 0.3, 26, 30, 330, L.ground + 0.3, () => 2.6, 0.22, 0.1);
    pavilionSlats.matrices.push(...ring.matrices);
    pavilionSlats.tints!.push(...(ring.tints as number[]));
  }
  const pavilionPlatforms = pavilionSoup.build();

  // --- landscape ---------------------------------------------------------------------------
  const path = terracePath();
  const plateau = buildPlateau(path);
  const terraces = buildTerraces(path);
  const { water, kerb } = buildCanal();

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitColumn = new THREE.CylinderGeometry(1, 1, 1, 10, 1);

  const all = [
    plinth, glazingGround, pit, seating, hallWall, firstPlate, mezzanineWall, balustrade, glazingUpper,
    roofDisc, oculusRing, planting, annexeRoof, annexeFloor, annexeSkin, screenStage, pavilionPlatforms,
    plateau, terraces, water, kerb, unitBox, unitColumn,
  ];

  return {
    plinth,
    glazingGround,
    columnsGround,
    partitionsGround,
    pit,
    seating,
    hallWall,
    firstPlate,
    mezzanineWall,
    balustrade,
    glazingUpper,
    columnsUpper,
    partitionsUpper,
    roofDisc,
    oculusRing,
    planting,
    annexeSlats,
    annexeRoof,
    annexeFloor,
    annexeSkin,
    screenSlats,
    screenStage,
    pavilionSlats,
    pavilionPlatforms,
    plateau,
    terraces,
    water,
    kerb,
    unitBox,
    unitColumn,
    dispose: () => all.forEach((g) => g.dispose()),
  };
}

/** Triangle count of a geometry (indexed or not); used by scripts/check_music_geometry.mjs. */
export function triangleCount(g: THREE.BufferGeometry): number {
  return g.index ? g.index.count / 3 : g.attributes.position.count / 3;
}
