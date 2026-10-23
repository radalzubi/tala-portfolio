"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ModelComponentProps } from "@/components/viewer/model-contract";
import { PEPLUM, buildFins, buildGable, roofSlope } from "./geometry";

const COLOURS = {
  fin: new THREE.Color("#b9743f"),
  finDark: new THREE.Color("#9c5a2d"),
  shell: "#e6dfd2",
  roof: "#cdc6b9",
  floor: "#ddd6c9",
  glass: "#cfdde2",
  frame: "#45413c",
  canal: "#b7c8cc",
};

const smoothstep = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

/** Mullions, transoms and cross bracing for one long façade, merged into one geometry. */
function buildFrame(length: number, y0: number, y1: number, bays: number, braced: boolean): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const bayW = length / bays;
  const h = y1 - y0;
  for (let i = 0; i <= bays; i++) {
    const g = new THREE.BoxGeometry(0.12, h, 0.14);
    g.translate(-length / 2 + i * bayW, y0 + h / 2, 0);
    parts.push(g);
  }
  for (const yy of [y0 + 0.08, y1 - 0.08]) {
    const g = new THREE.BoxGeometry(length, 0.16, 0.14);
    g.translate(0, yy, 0);
    parts.push(g);
  }
  if (braced) {
    const diag = Math.hypot(bayW, h);
    const angle = Math.atan2(h, bayW);
    for (let i = 0; i < bays; i += 2) {
      for (const sign of [1, -1]) {
        const g = new THREE.BoxGeometry(diag, 0.07, 0.07);
        g.rotateZ(sign * angle);
        g.translate(-length / 2 + (i + 0.5) * bayW, y0 + h / 2, 0.02);
        parts.push(g);
      }
    }
  }
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged!;
}

export function MaisonPeplumModel({ assemblyRef, preset, lowQuality }: ModelComponentProps) {
  const invalidate = useThree((s) => s.invalidate);
  const fins = useMemo(() => buildFins(), []);
  const gable = useMemo(() => buildGable(), []);
  const roof = useMemo(() => roofSlope(), []);
  const upperFrame = useMemo(() => buildFrame(PEPLUM.length - 0.3, PEPLUM.groundFloor + 0.3, PEPLUM.eaves - 0.1, 16, true), []);
  const baseFrame = useMemo(() => buildFrame(PEPLUM.length - 2 * PEPLUM.baseInset - 0.3, 0.2, PEPLUM.groundFloor - 0.3, 12, false), []);

  const finMaterials = useMemo(
    () =>
      fins.map((f) => {
        const c = COLOURS.fin.clone().lerp(COLOURS.finDark, f.tint * 0.55);
        return new THREE.MeshStandardMaterial({ color: c, roughness: 0.58, metalness: 0.04 });
      }),
    [fins],
  );
  const shellMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.shell, roughness: 0.95, side: THREE.DoubleSide, transparent: true }), []);
  const roofMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.roof, roughness: 0.85, side: THREE.DoubleSide, transparent: true }), []);
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.floor, roughness: 0.9, transparent: true }), []);
  const glassMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.glass, roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }), []);
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.frame, roughness: 0.6, metalness: 0.3, transparent: true }), []);
  const canalMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: COLOURS.canal, roughness: 0.3, metalness: 0.05, transparent: true, opacity: 0.85 }), []);

  useEffect(() => {
    return () => {
      fins.forEach((f) => f.geometry.dispose());
      finMaterials.forEach((m) => m.dispose());
      gable.dispose();
      roof.geometry.dispose();
      upperFrame.dispose();
      baseFrame.dispose();
      [shellMaterial, roofMaterial, floorMaterial, glassMaterial, frameMaterial, canalMaterial].forEach((m) => m.dispose());
    };
  }, [fins, finMaterials, gable, roof, upperFrame, baseFrame, shellMaterial, roofMaterial, floorMaterial, glassMaterial, frameMaterial, canalMaterial]);

  const finRefs = useRef<(THREE.Mesh | null)[]>([]);
  const roofGroup = useRef<THREE.Group | null>(null);
  const lastAssembly = useRef(-1);
  const emphasis = useRef({ shell: 1, fins: 1 });

  const emphasiseFins = preset.emphasis?.includes("facade-fins") ?? false;
  const emphasiseShell = preset.emphasis?.includes("existing-shell") ?? false;
  const targetShell = emphasiseFins ? 0.22 : 1;
  const targetFins = emphasiseShell ? 0.3 : 1;

  useEffect(() => {
    invalidate();
  }, [targetShell, targetFins, invalidate]);

  useFrame((_, delta) => {
    const a = assemblyRef.current ?? 0;
    let busy = false;
    if (a !== lastAssembly.current) {
      lastAssembly.current = a;
      const spread = smoothstep(a / 0.75);
      for (let i = 0; i < fins.length; i++) {
        const f = fins[i];
        const mesh = finRefs.current[i];
        if (!mesh) continue;
        const stagger = 0.5 + 0.5 * Math.sin(f.index * 0.9 + (f.side === 1 ? 0 : 1.3));
        const travel = spread * (2.4 + stagger * 0.6);
        const lift = spread * (0.9 + stagger * 0.9);
        mesh.position.set(f.base[0] + f.outward[0] * travel, f.base[1] + lift, f.base[2] + f.outward[2] * travel);
      }
      if (roofGroup.current) roofGroup.current.position.y = smoothstep((a - 0.3) / 0.7) * 3.2;
      busy = true;
    }
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 9);
    const e = emphasis.current;
    if (Math.abs(e.shell - targetShell) > 0.004 || Math.abs(e.fins - targetFins) > 0.004) {
      e.shell += (targetShell - e.shell) * k;
      e.fins += (targetFins - e.fins) * k;
      shellMaterial.opacity = e.shell;
      roofMaterial.opacity = e.shell;
      floorMaterial.opacity = e.shell;
      frameMaterial.opacity = e.shell;
      glassMaterial.opacity = 0.38 * e.shell;
      for (const m of finMaterials) m.opacity = e.fins;
      const finsTransparent = e.fins < 0.999;
      for (const m of finMaterials) m.transparent = finsTransparent;
      busy = true;
    }
    if (busy) invalidate();
  });

  const half = PEPLUM.width / 2;
  const upperH = PEPLUM.eaves - PEPLUM.groundFloor;
  const castShadows = !lowQuality;

  return (
    <group name="maison-peplum">
      <group name="facade-fins">
        {fins.map((f, i) => (
          <mesh
            key={`${f.kind}-${f.side}-${f.index}`}
            ref={(el) => {
              finRefs.current[i] = el;
            }}
            geometry={f.geometry}
            material={finMaterials[i]}
            position={f.base}
            castShadow={castShadows}
            receiveShadow
          />
        ))}
      </group>

      <group name="existing-shell">
        {/* gable ends (existing brick shell) */}
        <mesh geometry={gable} material={shellMaterial} position={[-PEPLUM.length / 2, 0, 0]} castShadow={castShadows} receiveShadow />
        <mesh geometry={gable} material={shellMaterial} position={[PEPLUM.length / 2 - PEPLUM.wall, 0, 0]} castShadow={castShadows} receiveShadow />
        {/* first-floor slab and ground slab */}
        <mesh material={floorMaterial} position={[0, PEPLUM.groundFloor - 0.15, 0]} castShadow={castShadows} receiveShadow>
          <boxGeometry args={[PEPLUM.length, 0.3, PEPLUM.width]} />
        </mesh>
        <mesh material={floorMaterial} position={[0, 0.1, 0]} receiveShadow>
          <boxGeometry args={[PEPLUM.length - 2 * PEPLUM.baseInset, 0.2, PEPLUM.width - 2 * PEPLUM.baseInset]} />
        </mesh>
        {/* upper floor glazed long façades with steel frame and cross bracing (section p.11) */}
        {[1, -1].map((side) => (
          <group key={side} position={[0, 0, side * (half - 0.07)]}>
            <mesh material={glassMaterial} position={[0, PEPLUM.groundFloor + upperH / 2 + 0.1, 0]} receiveShadow>
              <boxGeometry args={[PEPLUM.length - 0.3, upperH - 0.2, 0.04]} />
            </mesh>
            <mesh geometry={upperFrame} material={frameMaterial} castShadow={castShadows} />
          </group>
        ))}
      </group>

      <group name="structure">
        {/* cantilever steel beams carrying the upper floor over the recessed base */}
        {Array.from({ length: 11 }, (_, i) => -PEPLUM.length / 2 + 1.5 + i * ((PEPLUM.length - 3) / 10)).map((x) =>
          [1, -1].map((side) => (
            <mesh key={`${x}-${side}`} material={frameMaterial} position={[x, PEPLUM.groundFloor - 0.45, side * (half - PEPLUM.baseInset / 2 - 0.2)]} castShadow={castShadows}>
              <boxGeometry args={[0.18, 0.3, PEPLUM.baseInset + 0.8]} />
            </mesh>
          )),
        )}
      </group>

      <group name="glazed-base">
        {[1, -1].map((side) => (
          <group key={side} position={[0, 0, side * (half - PEPLUM.baseInset)]}>
            <mesh material={glassMaterial} position={[0, PEPLUM.groundFloor / 2, 0]}>
              <boxGeometry args={[PEPLUM.length - 2 * PEPLUM.baseInset, PEPLUM.groundFloor - 0.4, 0.04]} />
            </mesh>
            <mesh geometry={baseFrame} material={frameMaterial} castShadow={castShadows} />
          </group>
        ))}
        {[1, -1].map((side) => (
          <mesh key={`end-${side}`} material={glassMaterial} position={[side * (PEPLUM.length / 2 - PEPLUM.baseInset), PEPLUM.groundFloor / 2, 0]}>
            <boxGeometry args={[0.04, PEPLUM.groundFloor - 0.4, PEPLUM.width - 2 * PEPLUM.baseInset]} />
          </mesh>
        ))}
      </group>

      <group name="roof" ref={roofGroup}>
        {[1, -1].map((side) => {
          const midZ = side * (half / 2);
          const midY = (PEPLUM.eaves + PEPLUM.ridge) / 2 + 0.1;
          return (
            <mesh key={side} geometry={roof.geometry} material={roofMaterial} position={[0, midY, midZ]} rotation-x={-side * roof.angle} castShadow={castShadows} receiveShadow />
          );
        })}
        <mesh material={roofMaterial} position={[0, PEPLUM.ridge + 0.12, 0]} castShadow={castShadows}>
          <boxGeometry args={[PEPLUM.length + 0.8, 0.22, 0.6]} />
        </mesh>
      </group>

      <group name="context" userData={{ noClip: true }}>
        {/* canal along the front façade, as drawn on the plan (p.10) and section (p.11) */}
        {/* renderOrder -1: drawn before the viewer's shadow plane at y=-0.01 so the water is never depth-occluded by it */}
        <mesh material={canalMaterial} rotation-x={-Math.PI / 2} position={[0, -0.02, half + 7.5]} receiveShadow renderOrder={-1} userData={{ noClip: true }}>
          <planeGeometry args={[PEPLUM.length + 40, 9]} />
        </mesh>
        <mesh material={floorMaterial} position={[0, -0.1, half + 1.6]} receiveShadow userData={{ noClip: true }}>
          <boxGeometry args={[PEPLUM.length + 4, 0.16, 2.6]} />
        </mesh>
      </group>
    </group>
  );
}
