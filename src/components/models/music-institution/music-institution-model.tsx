"use client";

/**
 * Music Institution, Reading — interpretive procedural study.
 *
 * Semantic groups (named <group>s, ids also accepted in `preset.emphasis`):
 *   landscape          plateau, curved terraces SU01, canal (plan p.4) — exempt from section clipping
 *   outdoor-stage      timber-slatted annexe (render p.7), curved screen SU02 and round pavilions (axonometric p.5)
 *   ring-ground        plinth, ground-floor rooms, glazing and columns (axonometric p.5, render p.7)
 *   performance-volume sunken hall SU02 with stepped seating SU03 — the heart of the plan (section p.5)
 *   ring-upper         mezzanine ring SU05/SU07, practice rooms SU08/SU09, upper glazing and columns
 *   roof               thin disc, oculus ring SU14 and the rooftop garden SU13
 *
 * The eased assembly value (0 assembled → 1 separated) lifts the roof most and the upper ring less,
 * echoing the exploded axonometric on p.5. Rendering is on demand: every visual change invalidates.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { ModelComponentProps } from "@/components/viewer/model-contract";
import { buildMusicInstitution, type InstanceSet } from "./geometry";
import { MUSIC_INSTITUTION_GROUP_IDS, type MusicGroupId } from "./spec";

/** Illustrative palette (not verified materials): pale limestone/concrete, timber, green roof, water. */
const TIMBER = new THREE.Color("#b9743f");
const TIMBER_DARK = new THREE.Color("#9c5a2d");

type MaterialKey = "wall" | "floor" | "seating" | "roof" | "green" | "column" | "glass" | "timber" | "terrace" | "plateau" | "canal";

const MATERIAL_DEFS: Record<MaterialKey, THREE.MeshStandardMaterialParameters> = {
  wall: { color: "#e8e2d6", roughness: 0.92, side: THREE.DoubleSide },
  floor: { color: "#d9d2c5", roughness: 0.9, side: THREE.DoubleSide },
  seating: { color: "#d9cab3", roughness: 0.88, side: THREE.DoubleSide },
  roof: { color: "#ece7dd", roughness: 0.85, side: THREE.DoubleSide },
  green: { color: "#9fae8a", roughness: 1, side: THREE.DoubleSide },
  column: { color: "#d4cec4", roughness: 0.7, metalness: 0.05 },
  glass: { color: "#cfdde2", roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide },
  // white base colour so the per-instance timber tint shows unmodified
  timber: { color: "#ffffff", roughness: 0.6, metalness: 0.03 },
  terrace: { color: "#ddd6c9", roughness: 0.95 },
  plateau: { color: "#e3ddd1", roughness: 0.95 },
  canal: { color: "#b7c8cc", roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.85 },
};

interface Registered {
  group: MusicGroupId;
  material: THREE.MeshStandardMaterial;
  base: number;
}

/** One material set per semantic group so emphasis can fade groups independently. */
function createMaterials() {
  const registry: Registered[] = [];
  const mat = (group: MusicGroupId, key: MaterialKey) => {
    const def = MATERIAL_DEFS[key];
    const material = new THREE.MeshStandardMaterial(def);
    registry.push({ group, material, base: def.opacity ?? 1 });
    return material;
  };
  return {
    registry,
    landscape: { terrace: mat("landscape", "terrace"), plateau: mat("landscape", "plateau"), canal: mat("landscape", "canal") },
    stage: { timber: mat("outdoor-stage", "timber"), floor: mat("outdoor-stage", "floor"), roof: mat("outdoor-stage", "roof"), glass: mat("outdoor-stage", "glass") },
    ground: { wall: mat("ring-ground", "wall"), glass: mat("ring-ground", "glass"), column: mat("ring-ground", "column") },
    hall: { wall: mat("performance-volume", "wall"), seating: mat("performance-volume", "seating"), floor: mat("performance-volume", "floor") },
    upper: { wall: mat("ring-upper", "wall"), floor: mat("ring-upper", "floor"), glass: mat("ring-upper", "glass"), column: mat("ring-upper", "column") },
    roof: { slab: mat("roof", "roof"), ring: mat("roof", "wall"), green: mat("roof", "green") },
  };
}

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Instanced repeats (slats, columns, partitions). Matrices are written once, before the first paint. */
function InstancedSet({ geometry, material, set, castShadow }: { geometry: THREE.BufferGeometry; material: THREE.Material; set: InstanceSet; castShadow: boolean }) {
  const ref = useRef<THREE.InstancedMesh | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    set.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    if (set.tints) {
      const c = new THREE.Color();
      set.tints.forEach((t, i) => mesh.setColorAt(i, c.copy(TIMBER).lerp(TIMBER_DARK, t * 0.55)));
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    // Culling uses the instanced bounds, which must be recomputed once the matrices are in place.
    mesh.computeBoundingSphere();
    invalidate();
  }, [set, invalidate]);
  return <instancedMesh ref={ref} args={[geometry, material, set.matrices.length]} castShadow={castShadow} receiveShadow />;
}

export function MusicInstitutionModel({ assemblyRef, preset, focusedHotspot, lowQuality }: ModelComponentProps) {
  const invalidate = useThree((s) => s.invalidate);
  const geo = useMemo(() => buildMusicInstitution(), []);
  const mats = useMemo(() => createMaterials(), []);

  useEffect(() => {
    return () => {
      geo.dispose();
      mats.registry.forEach((r) => r.material.dispose());
    };
  }, [geo, mats]);

  const roofGroup = useRef<THREE.Group | null>(null);
  const upperGroup = useRef<THREE.Group | null>(null);
  const lastAssembly = useRef(-1);
  const fade = useRef<Record<MusicGroupId, number>>({ landscape: 1, "outdoor-stage": 1, "ring-ground": 1, "performance-volume": 1, "ring-upper": 1, roof: 1 });

  // Emphasised groups stay opaque, the rest fade to 0.22. Focusing a hall hotspot thins the roof and
  // upper ring so the performance volume reads as the heart of the plan.
  const emphasis = preset.emphasis;
  const hallFocus = focusedHotspot === "performance-hall" || focusedHotspot === "stepped-seating";
  const targetFor = (id: MusicGroupId) => {
    if (emphasis && emphasis.length > 0 && !emphasis.includes(id)) return 0.22;
    if (hallFocus && (id === "roof" || id === "ring-upper")) return 0.35;
    return 1;
  };
  const targetKey = MUSIC_INSTITUTION_GROUP_IDS.map((id) => targetFor(id)).join("|");

  useEffect(() => {
    invalidate();
  }, [targetKey, invalidate]);

  useFrame((_, delta) => {
    let busy = false;
    const a = assemblyRef.current ?? 0;
    if (a !== lastAssembly.current) {
      lastAssembly.current = a;
      // Restrained vertical separation after the exploded axonometric (p.5): roof lifts most, upper ring less.
      if (roofGroup.current) roofGroup.current.position.y = smoothstep((a - 0.12) / 0.88) * 7.5;
      if (upperGroup.current) upperGroup.current.position.y = smoothstep(a / 0.9) * 3.4;
      busy = true;
    }
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 9);
    const f = fade.current;
    for (const id of MUSIC_INSTITUTION_GROUP_IDS) {
      const target = targetFor(id);
      const current = f[id];
      if (Math.abs(current - target) < 0.003) continue;
      const next = Math.abs(current - target) < 0.006 ? target : current + (target - current) * k;
      f[id] = next;
      for (const r of mats.registry) {
        if (r.group !== id) continue;
        r.material.opacity = r.base * next;
        const transparent = r.base < 1 || next < 0.999;
        if (r.material.transparent !== transparent) {
          r.material.transparent = transparent;
          r.material.needsUpdate = true;
        }
      }
      busy = true;
    }
    if (busy) invalidate();
  });

  const cast = !lowQuality;

  return (
    <group name="music-institution">
      {/* Landscape context is exempt from section clipping so the site keeps reading in cut views. */}
      <group name="landscape">
        <mesh geometry={geo.plateau} material={mats.landscape.plateau} castShadow={cast} receiveShadow userData={{ noClip: true }} />
        <mesh geometry={geo.terraces} material={mats.landscape.terrace} castShadow={cast} receiveShadow userData={{ noClip: true }} />
        <mesh geometry={geo.kerb} material={mats.landscape.terrace} castShadow={cast} receiveShadow userData={{ noClip: true }} />
        {/* Water sits 2 cm below the viewer's shadow-catching plane; draw it first so that plane cannot occlude it. */}
        <mesh geometry={geo.water} material={mats.landscape.canal} receiveShadow renderOrder={-1} userData={{ noClip: true }} />
      </group>

      <group name="outdoor-stage">
        {/* timber-slatted annexe (render p.7, model photos p.7) */}
        <InstancedSet geometry={geo.unitBox} material={mats.stage.timber} set={geo.annexeSlats} castShadow={cast} />
        <mesh geometry={geo.annexeSkin} material={mats.stage.glass} />
        <mesh geometry={geo.annexeFloor} material={mats.stage.floor} receiveShadow />
        <mesh geometry={geo.annexeRoof} material={mats.stage.roof} castShadow={cast} receiveShadow />
        {/* curved outdoor performance screen SU02 with its stage floor (axonometric p.5, plan p.4) */}
        <InstancedSet geometry={geo.unitBox} material={mats.stage.timber} set={geo.screenSlats} castShadow={cast} />
        <mesh geometry={geo.screenStage} material={mats.stage.floor} receiveShadow />
        {/* round outdoor pavilions (plan p.4, model photos p.7) */}
        <InstancedSet geometry={geo.unitBox} material={mats.stage.timber} set={geo.pavilionSlats} castShadow={cast} />
        <mesh geometry={geo.pavilionPlatforms} material={mats.stage.floor} castShadow={cast} receiveShadow />
      </group>

      <group name="ring-ground">
        <mesh geometry={geo.plinth} material={mats.ground.wall} castShadow={cast} receiveShadow />
        <InstancedSet geometry={geo.unitBox} material={mats.ground.wall} set={geo.partitionsGround} castShadow={cast} />
        <InstancedSet geometry={geo.unitColumn} material={mats.ground.column} set={geo.columnsGround} castShadow={cast} />
        <mesh geometry={geo.glazingGround} material={mats.ground.glass} />
      </group>

      <group name="performance-volume" userData={{ heart: true }}>
        <mesh geometry={geo.pit} material={mats.hall.floor} receiveShadow />
        <mesh geometry={geo.seating} material={mats.hall.seating} castShadow={cast} receiveShadow />
        <mesh geometry={geo.hallWall} material={mats.hall.wall} castShadow={cast} receiveShadow />
      </group>

      <group name="ring-upper" ref={upperGroup}>
        <mesh geometry={geo.firstPlate} material={mats.upper.floor} castShadow={cast} receiveShadow />
        <mesh geometry={geo.mezzanineWall} material={mats.upper.wall} castShadow={cast} receiveShadow />
        <InstancedSet geometry={geo.unitBox} material={mats.upper.wall} set={geo.partitionsUpper} castShadow={cast} />
        <InstancedSet geometry={geo.unitColumn} material={mats.upper.column} set={geo.columnsUpper} castShadow={cast} />
        <mesh geometry={geo.balustrade} material={mats.upper.glass} />
        <mesh geometry={geo.glazingUpper} material={mats.upper.glass} />
      </group>

      <group name="roof" ref={roofGroup}>
        <mesh geometry={geo.roofDisc} material={mats.roof.slab} castShadow={cast} receiveShadow />
        <mesh geometry={geo.oculusRing} material={mats.roof.ring} castShadow={cast} receiveShadow />
        <mesh geometry={geo.planting} material={mats.roof.green} receiveShadow />
      </group>
    </group>
  );
}
