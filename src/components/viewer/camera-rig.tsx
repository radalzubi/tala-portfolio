"use client";

import { useEffect, useRef, type Dispatch, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { ModelSpec } from "@/content/types";
import { findHotspot, findPreset, type ViewerAction, type ViewerCanvasApi, type ViewerState } from "./model-contract";

interface CameraTween {
  t: number;
  duration: number;
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  t0: THREE.Vector3;
  t1: THREE.Vector3;
  f0: number;
  f1: number;
}

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export interface CameraRigProps {
  spec: ModelSpec;
  state: ViewerState;
  dispatch: Dispatch<ViewerAction>;
  reducedMotion: boolean;
  rotateEnabled: boolean;
  zoomEnabled: boolean;
  running: boolean; // in view and tab visible
  assemblyRef: RefObject<number>;
  lightRef: RefObject<THREE.DirectionalLight | null>;
  apiRef: RefObject<ViewerCanvasApi | null>;
  onUserInteract: () => void;
}

/**
 * Owns camera movement and the eased assembly value.
 * Guided moves (preset change, hotspot focus, reset, zoom buttons) run as tweens; any user
 * interaction with the controls cancels the running tween. Frames are only requested while
 * something is actually changing, so the renderer stays idle at rest.
 */
export function CameraRig({
  spec,
  state,
  dispatch,
  reducedMotion,
  rotateEnabled,
  zoomEnabled,
  running,
  assemblyRef,
  lightRef,
  apiRef,
  onUserInteract,
}: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const tween = useRef<CameraTween | null>(null);
  const assemblyTarget = useRef(state.assembly);
  const lightTarget = useRef(state.lightStudy);
  const lightCurrent = useRef(state.lightStudy);
  const presetRef = useRef(state.presetId);

  const startTween = (p1: THREE.Vector3, t1: THREE.Vector3, fov: number, duration: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (reducedMotion || duration <= 0.002) {
      camera.position.copy(p1);
      controls.target.copy(t1);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      controls.update();
      invalidate();
      tween.current = null;
      return;
    }
    tween.current = {
      t: 0,
      duration,
      p0: camera.position.clone(),
      p1,
      t0: controls.target.clone(),
      t1,
      f0: camera.fov,
      f1: fov,
    };
    invalidate();
  };

  // Preset change or reset → fly to the preset camera.
  useEffect(() => {
    const preset = findPreset(spec, state.presetId);
    const changed = presetRef.current !== state.presetId;
    presetRef.current = state.presetId;
    startTween(
      new THREE.Vector3(...preset.camera.position),
      new THREE.Vector3(...preset.camera.target),
      preset.camera.fov ?? 32,
      changed ? 1.1 : 0.7,
    );
    if (changed && preset.assembly !== undefined) {
      dispatch({ type: "assembly", value: preset.assembly });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.presetId, state.resetToken]);

  // Hotspot focus → aim the target at the anchor without changing distance much.
  useEffect(() => {
    const hotspot = findHotspot(spec, state.focusedHotspot);
    const controls = controlsRef.current;
    if (!hotspot || !controls) return;
    const anchor = new THREE.Vector3(...hotspot.anchor);
    const offset = camera.position.clone().sub(controls.target);
    const dist = Math.max(spec.bounds.radius * 0.9, offset.length() * 0.75);
    const dir = offset.normalize();
    startTween(anchor.clone().add(dir.multiplyScalar(dist)), anchor, camera.fov, 0.9);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.focusedHotspot]);

  // Zoom buttons.
  useEffect(() => {
    if (!state.zoomToken || !controlsRef.current) return;
    const controls = controlsRef.current;
    const factor = state.zoomDirection === 1 ? 0.78 : 1.28;
    const offset = camera.position.clone().sub(controls.target);
    const len = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
    startTween(controls.target.clone().add(offset.normalize().multiplyScalar(len)), controls.target.clone(), camera.fov, 0.35);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.zoomToken]);

  useEffect(() => {
    assemblyTarget.current = state.assembly;
    invalidate();
  }, [state.assembly, invalidate]);

  useEffect(() => {
    lightTarget.current = state.lightStudy;
    invalidate();
  }, [state.lightStudy, invalidate]);

  // Auto-rotate only while allowed, running and not paused by the visitor.
  const autoRotate = state.autoRotate && running && !state.userPaused && !reducedMotion;
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.autoRotate = autoRotate;
    if (autoRotate) invalidate();
  }, [autoRotate, invalidate]);

  // Imperative API for DOM keyboard handling.
  useEffect(() => {
    apiRef.current = {
      rotateBy(azimuthDelta, polarDelta) {
        const controls = controlsRef.current;
        if (!controls) return;
        tween.current = null;
        const offset = camera.position.clone().sub(controls.target);
        const sph = new THREE.Spherical().setFromVector3(offset);
        sph.theta += azimuthDelta;
        sph.phi = THREE.MathUtils.clamp(sph.phi + polarDelta, 0.08, Math.PI / 2 - 0.03);
        offset.setFromSpherical(sph);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        invalidate();
      },
      dolly(factor) {
        dispatch({ type: "zoom", direction: factor < 1 ? 1 : -1 });
      },
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, dispatch, invalidate]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    let busy = false;
    const dt = Math.min(delta, 0.05);

    const tw = tween.current;
    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.duration);
      const k = easeInOut(tw.t);
      camera.position.lerpVectors(tw.p0, tw.p1, k);
      controls.target.lerpVectors(tw.t0, tw.t1, k);
      const fov = THREE.MathUtils.lerp(tw.f0, tw.f1, k);
      if (Math.abs(fov - camera.fov) > 0.01) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      controls.update();
      if (tw.t >= 1) tween.current = null;
      busy = true;
    }

    const a = assemblyRef.current ?? 0;
    const diff = assemblyTarget.current - a;
    if (Math.abs(diff) > 0.0008) {
      const next = reducedMotion ? assemblyTarget.current : a + diff * (1 - Math.exp(-dt * 7));
      (assemblyRef as { current: number }).current = Math.abs(assemblyTarget.current - next) < 0.0008 ? assemblyTarget.current : next;
      busy = true;
    }

    const ld = lightTarget.current - lightCurrent.current;
    if (Math.abs(ld) > 0.001 || !lightRef.current?.userData.placed) {
      lightCurrent.current = reducedMotion ? lightTarget.current : lightCurrent.current + ld * (1 - Math.exp(-dt * 8));
      const light = lightRef.current;
      if (light) {
        const az = THREE.MathUtils.lerp(-1.15, 1.15, lightCurrent.current);
        const el = THREE.MathUtils.lerp(0.55, 0.95, Math.sin(lightCurrent.current * Math.PI));
        const r = 70;
        light.position.set(r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az));
        light.target.position.set(0, 3, 0);
        light.target.updateMatrixWorld();
        light.userData.placed = true;
      }
      busy = true;
    }

    if (controls.autoRotate) {
      controls.update();
      busy = true;
    }
    if (busy) invalidate();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableZoom={zoomEnabled}
      enableRotate={rotateEnabled}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      autoRotateSpeed={0.55}
      minDistance={spec.bounds.radius * 0.6}
      maxDistance={spec.bounds.radius * 5}
      maxPolarAngle={Math.PI / 2 - 0.03}
      target={spec.bounds.center}
      onStart={() => {
        tween.current = null;
        onUserInteract();
      }}
    />
  );
}
