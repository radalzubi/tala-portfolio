"use client";

import { Component, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import type { ModelSpec } from "@/content/types";
import { findPreset, type ViewerAction, type ViewerCanvasApi, type ViewerState } from "./model-contract";
import { CameraRig } from "./camera-rig";
import { HotspotMarkers } from "./hotspot-markers";
import { MaisonPeplumModel } from "@/components/models/maison-peplum/maison-peplum-model";
import { MusicInstitutionModel } from "@/components/models/music-institution/music-institution-model";

export interface ViewerCanvasProps {
  spec: ModelSpec;
  state: ViewerState;
  dispatch: Dispatch<ViewerAction>;
  reducedMotion: boolean;
  /** Pointer rotation allowed (desktop always; touch only once engaged). */
  rotateEnabled: boolean;
  /** Wheel / pinch zoom allowed (only once engaged, so the page keeps scrolling). */
  zoomEnabled: boolean;
  running: boolean;
  apiRef: RefObject<ViewerCanvasApi | null>;
  onUserInteract: () => void;
}

class CanvasErrorBoundary extends Component<{ onError: (reason: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(error.message);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Applies the preset's clipping plane to every material in the model group (context is exempt). */
function SectionClip({ groupRef, section }: { groupRef: RefObject<THREE.Group | null>; section?: { normal: [number, number, number]; constant: number } }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const planes = section ? [new THREE.Plane(new THREE.Vector3(...section.normal).normalize(), section.constant)] : null;
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.noClip) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        m.clippingPlanes = planes;
        m.clipShadows = true;
        m.needsUpdate = true;
      }
    });
    invalidate();
  }, [groupRef, section, invalidate]);
  return null;
}

function Scene({ spec, state, dispatch, reducedMotion, rotateEnabled, zoomEnabled, running, apiRef, onUserInteract, lowQuality }: ViewerCanvasProps & { lowQuality: boolean }) {
  const assemblyRef = useRef(state.assembly);
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const preset = findPreset(spec, state.presetId);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    gl.localClippingEnabled = true;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl]);

  // Context loss: keep the poster, report the failure, stop rendering.
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost = (e: Event) => {
      e.preventDefault();
      dispatch({ type: "fail", reason: "WebGL context lost" });
    };
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl, dispatch]);

  const Model = spec.component === "maison-peplum" ? MaisonPeplumModel : MusicInstitutionModel;
  const shadowSize = lowQuality ? 1024 : 2048;

  return (
    <>
      <CameraRig
        spec={spec}
        state={state}
        dispatch={dispatch}
        reducedMotion={reducedMotion}
        rotateEnabled={rotateEnabled}
        zoomEnabled={zoomEnabled}
        running={running}
        assemblyRef={assemblyRef}
        lightRef={lightRef}
        apiRef={apiRef}
        onUserInteract={onUserInteract}
      />
      <hemisphereLight args={["#f6f1e6", "#b9b0a3", 0.75]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={lightRef}
        intensity={2.1}
        color="#fff4e6"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-spec.bounds.radius * 1.4}
        shadow-camera-right={spec.bounds.radius * 1.4}
        shadow-camera-top={spec.bounds.radius * 1.4}
        shadow-camera-bottom={-spec.bounds.radius * 1.4}
        shadow-camera-near={5}
        shadow-camera-far={160}
        shadow-bias={-0.00035}
        shadow-normalBias={0.03}
        shadow-radius={lowQuality ? 1 : 3}
      />
      <group ref={modelRef} name="model">
        <Model spec={spec} assemblyRef={assemblyRef} preset={preset} focusedHotspot={state.focusedHotspot} lowQuality={lowQuality} />
      </group>
      <SectionClip groupRef={modelRef} section={preset.section} />
      {/* Ground: transparent plane that only receives the shadow, so the page's own paper shows through. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01} receiveShadow userData={{ noClip: true }}>
        <planeGeometry args={[320, 320]} />
        <shadowMaterial opacity={0.16} color="#2a2825" />
      </mesh>
      {state.hotspotsVisible && (
        <HotspotMarkers
          spec={spec}
          focused={state.focusedHotspot}
          onSelect={(id) => dispatch({ type: "hotspot", id })}
          assemblyRef={assemblyRef}
          section={preset.section}
        />
      )}
    </>
  );
}

export default function ViewerCanvas(props: ViewerCanvasProps) {
  const { spec, state, dispatch } = props;
  const [lowQuality, setLowQuality] = useState(false);
  const preset = useMemo(() => findPreset(spec, state.presetId), [spec, state.presetId]);
  const dpr = useMemo<[number, number]>(() => [1, lowQuality ? 1.25 : 2], [lowQuality]);

  return (
    <CanvasErrorBoundary onError={(reason) => dispatch({ type: "fail", reason })}>
      <Canvas
        frameloop="demand"
        dpr={dpr}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ fov: preset.camera.fov ?? 32, near: 0.5, far: 600, position: preset.camera.position }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
        style={{ background: "transparent", touchAction: props.zoomEnabled ? "none" : "pan-y" }}
        onCreated={() => dispatch({ type: "ready" })}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 80 } }}
      >
        <PerformanceMonitor onDecline={() => setLowQuality(true)} flipflops={2} />
        <Scene {...props} lowQuality={lowQuality} />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
