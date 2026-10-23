/**
 * Music Institution — default view presets, bounds and hotspot anchors for the interpretive model.
 * World units match dimensions.ts (notional metres; drum centred on the origin, canal toward +Z,
 * drum ground floor on the plateau at y = LEVELS.ground). The content layer maps these into its
 * ModelSpec records; drawing ids are left for the content layer to attach.
 */
import type { ViewPreset } from "@/content/types";
import { LEVELS, MUSIC } from "./dimensions";

/** Semantic group ids used as <group name> in the component and accepted in `preset.emphasis`. */
export const MUSIC_INSTITUTION_GROUP_IDS = ["landscape", "outdoor-stage", "ring-ground", "performance-volume", "ring-upper", "roof"] as const;
export type MusicGroupId = (typeof MUSIC_INSTITUTION_GROUP_IDS)[number];

const DEG = Math.PI / 180;
const polar = (r: number, deg: number, y: number): [number, number, number] => [r * Math.cos(deg * DEG), y, r * Math.sin(deg * DEG)];

/** World-space anchors for hotspots, keyed by the ids the content layer will map. */
export const hotspotAnchors: Record<string, [number, number, number]> = {
  /** Centre of the double-height performance space SU02 (section p.5). */
  "performance-hall": [0, LEVELS.pit + 2.2, 0.8],
  /** Inside the concentric stepped seating SU03, on the side away from the stage. */
  "stepped-seating": polar(4.3, 270, LEVELS.pit + 1.9),
  /** Mezzanine hallway SU05 overlooking the hall (section p.5, interior render p.7). */
  mezzanine: polar(7.2, 45, LEVELS.first + 1.3),
  /** Rooftop garden SU13 (axonometric p.5; planting on the section p.5). */
  "roof-garden": polar(10.5, 300, LEVELS.roofTop + 0.35),
  /** Skylight / oculus SU14 at the centre of the roof disc (render p.7). */
  oculus: [0, LEVELS.roofTop + 0.7, 0],
  /** Middle band of the outdoor stepped seating SU01 on the canal side. */
  terraces: [-4, MUSIC.plateau - 2 * MUSIC.terrace.riser + 0.1, 20.5 + 1.5 * MUSIC.terrace.tread],
  /** Kerb along the near bank of the canal (plan p.4, render p.7). */
  "canal-edge": [-6, 0.3, MUSIC.canal.near - 0.2],
  /** Curved outdoor performance screen SU02 (axonometric p.5). */
  "outdoor-stage": [MUSIC.screen.x, LEVELS.ground + 2.2, MUSIC.screen.z],
};

const presets: ViewPreset[] = [
  {
    id: "whole",
    label: "Whole",
    description: "Three-quarter view from the canal side: the glazed drum under its thin roof disc, the timber annexe to the left and the terraces stepping down to the water (render p.7).",
    camera: { position: [52, 30, 66], target: [-6, 3, 6], fov: 30 },
    assembly: 0,
  },
  {
    id: "plan",
    label: "Plan",
    description: "Near-orthographic view from above, cut just above head height on the ground floor so the ring plan, the central hall and its stepped seating read as on the site plan (p.4).",
    camera: { position: [0, 232, 1.5], target: [0, LEVELS.ground, 0], fov: 14 },
    assembly: 0,
    // Horizontal cut 2.3 m above the ground floor: removes points with y > constant.
    section: { normal: [0, -1, 0], constant: LEVELS.ground + 2.3 },
  },
  {
    id: "section",
    label: "Section",
    description: "Side view with the half nearer the camera removed through the drum centre: sunken performance floor, stepped seating, mezzanine and roof garden, with the outdoor steps and canal to the right (section p.5).",
    camera: { position: [-108, 24, 2], target: [0, 4, 2], fov: 18 },
    assembly: 0,
    section: { normal: [1, 0, 0], constant: 0 },
  },
  {
    id: "route",
    label: "Route",
    description: "Eye-level from the far bank of the canal, looking up the curved terraces toward the drum, with the landscape and outdoor stage held in focus.",
    camera: { position: [16, 2.2, 46], target: [-4, 0.9, 16], fov: 36 },
    assembly: 0,
    emphasis: ["landscape", "outdoor-stage"],
  },
  {
    id: "assembly",
    label: "Layers",
    description: "The three lifted layers of the exploded axonometric (p.5): ground ring, upper ring and the roof disc with its skylight.",
    camera: { position: [-60, 40, 58], target: [-4, 6, 4], fov: 30 },
    assembly: 1,
  },
];

export const MUSIC_INSTITUTION_MODEL_DEFAULTS = {
  /** Fits the drum, annexe, outdoor stage, terraces and the near canal; the plate's far corners may fall outside. */
  bounds: { radius: 48, center: [-8, 3, 6] as [number, number, number] },
  presets,
  hotspotAnchors,
  groupIds: MUSIC_INSTITUTION_GROUP_IDS,
};
