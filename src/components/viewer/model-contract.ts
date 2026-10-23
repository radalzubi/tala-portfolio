/**
 * Viewer contract shared by the viewer shell, DOM controls and the model components.
 * A single reducer owns viewer state; the canvas island reads it and never mutates it directly.
 */
import type { RefObject } from "react";
import type { Hotspot, ModelSpec, ViewPreset } from "@/content/types";

export type ViewerStatus =
  | "poster" // poster shown, canvas not mounted
  | "loading" // canvas code/model loading
  | "interactive" // canvas live
  | "fallback" // no WebGL or user chose stills
  | "error"; // load/runtime failure; poster stays visible

export interface ViewerState {
  status: ViewerStatus;
  presetId: string;
  /** 0 = assembled, 1 = fully separated. */
  assembly: number;
  /** Auto-rotation requested (and allowed by motion preference). */
  autoRotate: boolean;
  /** The visitor pressed pause; must not be undone by hover/focus/visibility changes. */
  userPaused: boolean;
  /** Illustrative light angle 0–1 (not a solar simulation). */
  lightStudy: number;
  focusedHotspot: string | null;
  hotspotsVisible: boolean;
  fullscreen: boolean;
  /** Incremented to request a camera reset to the current preset. */
  resetToken: number;
  /** Zoom step requests from DOM buttons. */
  zoomToken: number;
  zoomDirection: 1 | -1 | 0;
}

export type ViewerAction =
  | { type: "engage" } // mount canvas
  | { type: "ready" }
  | { type: "fail"; reason: string }
  | { type: "fallback" }
  | { type: "preset"; id: string }
  | { type: "assembly"; value: number }
  | { type: "rotate"; on: boolean; byUser?: boolean }
  | { type: "light"; value: number }
  | { type: "hotspot"; id: string | null }
  | { type: "hotspots"; visible: boolean }
  | { type: "fullscreen"; on: boolean }
  | { type: "reset" }
  | { type: "zoom"; direction: 1 | -1 };

export function initialViewerState(spec: ModelSpec, presetId?: string, assembly?: number): ViewerState {
  const preset = spec.presets.find((p) => p.id === presetId) ?? spec.presets[0];
  return {
    status: "poster",
    presetId: preset.id,
    assembly: assembly ?? preset.assembly ?? 0,
    autoRotate: false,
    userPaused: false,
    lightStudy: 0.35,
    focusedHotspot: null,
    hotspotsVisible: true,
    fullscreen: false,
    resetToken: 0,
    zoomToken: 0,
    zoomDirection: 0,
  };
}

export function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case "engage":
      return state.status === "poster" || state.status === "error" ? { ...state, status: "loading" } : state;
    case "ready":
      return { ...state, status: "interactive" };
    case "fail":
      return { ...state, status: "error" };
    case "fallback":
      return { ...state, status: "fallback", autoRotate: false };
    case "preset":
      return { ...state, presetId: action.id, focusedHotspot: null, resetToken: state.resetToken + 1 };
    case "assembly":
      return { ...state, assembly: Math.min(1, Math.max(0, action.value)) };
    case "rotate":
      return {
        ...state,
        autoRotate: action.on,
        userPaused: action.byUser ? !action.on : state.userPaused,
      };
    case "light":
      return { ...state, lightStudy: Math.min(1, Math.max(0, action.value)) };
    case "hotspot":
      return { ...state, focusedHotspot: action.id };
    case "hotspots":
      return { ...state, hotspotsVisible: action.visible };
    case "fullscreen":
      return { ...state, fullscreen: action.on };
    case "reset":
      return { ...state, resetToken: state.resetToken + 1, focusedHotspot: null };
    case "zoom":
      return { ...state, zoomToken: state.zoomToken + 1, zoomDirection: action.direction };
    default:
      return state;
  }
}

/** Props every procedural model component receives inside the canvas. */
export interface ModelComponentProps {
  spec: ModelSpec;
  /** Eased assembly value 0–1, owned by the camera rig; read it inside useFrame, never in render. */
  assemblyRef: RefObject<number>;
  preset: ViewPreset;
  focusedHotspot: string | null;
  /** When true, materials/geometry should use the lower quality tier. */
  lowQuality: boolean;
}

/** Imperative API the canvas exposes to DOM keyboard handling. */
export interface ViewerCanvasApi {
  rotateBy: (azimuthDelta: number, polarDelta: number) => void;
  dolly: (factor: number) => void;
}

export function findPreset(spec: ModelSpec, id: string): ViewPreset {
  return spec.presets.find((p) => p.id === id) ?? spec.presets[0];
}

export function findHotspot(spec: ModelSpec, id: string | null): Hotspot | undefined {
  return id ? spec.hotspots.find((h) => h.id === id) : undefined;
}
