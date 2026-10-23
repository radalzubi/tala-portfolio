/**
 * Music Institution, Reading — proportional dimensions for the interpretive 3D study.
 *
 * Nothing in the portfolio is dimensioned. Every value here is read proportionally from the
 * site plan (p.4), the section and exploded axonometric (p.5), the renders (p.3, p.7) and the
 * physical model photographs (p.7). Units are notional metres. +Y is up, the drum is centred on
 * the origin in plan and the canal lies toward +Z (the same convention as the Maison Peplum model).
 *
 * Levels: the render on p.7 and the model photographs show the water at the lowest level with the
 * terraces stepping up to the building, so the site is modelled as a raised plateau (like the model
 * base) whose edge steps down to the canal bank at y = 0. The water surface sits at y = -0.02.
 *
 * This file deliberately has no three.js import so the view spec can share it without pulling the
 * renderer into content code.
 */
export const MUSIC = {
  /** Site plateau level around the drum (four 0.4 m risers above the canal bank). */
  plateau: 1.6,
  /** Two storeys of ~3.6 m (section p.5 shows two levels plus a green roof). */
  storey: 3.6,
  slab: 0.3,
  /** Drum outer line, ~26 m across (ring plan p.4; two-storey glazed cylinder on p.7). */
  drumRadius: 13,
  /** Ground plinth under the ring and the matching hole in the plateau. */
  plinthRadius: 13.3,
  /** Central performance space: the plan (p.4) reads the hall at ~0.45 of the drum radius. */
  hallRadius: 6,
  hallWall: 0.3,
  /** SU02 sunken floor depth below the ground floor (section p.5). */
  sunken: 0.8,
  /** Outer line of the mezzanine hallway (SU05 / SU07) before the upper rooms begin (axonometric p.5). */
  mezzanineOuter: 8.4,
  /** Thin, wide roof disc with a central oculus (render p.7, SU13/SU14 on the axonometric p.5). */
  roofRadius: 14.8,
  roofThickness: 0.35,
  oculusRadius: 5.2,
  /** Slender perimeter columns just outside the glazing line (render p.7). */
  columnCount: 24,
  columnRadius: 0.17,
  columnRing: 13.1,
  glazingRadius: 12.85,
  /** Stepped seating as concentric arcs on the side away from the stage (plan p.4, SU03 on p.5). */
  seating: { steps: 7, riser: 0.4, inner: 2.5, from: 190, to: 350 },
  /** Timber-slatted annexe to the left of the drum in the p.7 render and model photos. */
  annexe: { x: -26, z: -6, radius: 6.2, height: 5.4, slats: 64 },
  /** Curved outdoor performance screen of slats (SU02 on the axonometric p.5; plan p.4). */
  screen: { x: -34, z: 10, radius: 7, height: 4.2, slats: 36, from: 110, to: 350 },
  /** Round outdoor pavilions / seating circles south-west of the drum (plan p.4, model photos p.7). */
  pavilions: [
    { x: -46, z: 0, radius: 4 },
    { x: -44, z: 16, radius: 3.6 },
  ],
  /** Curved landscape terraces: three bands below the plateau edge, four risers in all (plan p.4, section p.5, render p.7). */
  terrace: { steps: 3, riser: 0.4, tread: 2.6 },
  /** Top edge of the terraces in plan (x, z): hugs the drum's east side, then sweeps along the canal. */
  terracePath: [
    [24, -24],
    [23, -14],
    [21, -2],
    [18, 8],
    [10, 17],
    [-4, 20.5],
    [-20, 22],
    [-36, 22],
    [-52, 21.5],
  ],
  /** Plateau extents (the +Z side is bounded by the terrace path, the first point of which lies on zMin). */
  site: { xMin: -52, xMax: 40, zMin: -24 },
  /** Canal running along the south-east edge of the site, here parallel to X at +Z. */
  canal: { near: 33, far: 42, xMin: -60, xMax: 44, surface: -0.02 },
} as const;

/** Finished levels (y) used by every builder and by the view spec. */
export const LEVELS = {
  bank: 0,
  ground: MUSIC.plateau,
  pit: MUSIC.plateau - MUSIC.sunken,
  first: MUSIC.plateau + MUSIC.storey,
  roofUnderside: MUSIC.plateau + 2 * MUSIC.storey,
  roofTop: MUSIC.plateau + 2 * MUSIC.storey + MUSIC.roofThickness,
} as const;
