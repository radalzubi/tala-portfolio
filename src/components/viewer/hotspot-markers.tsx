"use client";

import { useMemo, type RefObject } from "react";
import * as THREE from "three";
import type { ModelSpec } from "@/content/types";

function ringTexture(color: string): THREE.CanvasTexture {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
  ctx.lineWidth = size * 0.08;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.1, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function HotspotMarkers({
  spec,
  focused,
  onSelect,
}: {
  spec: ModelSpec;
  focused: string | null;
  onSelect: (id: string) => void;
  assemblyRef: RefObject<number>;
}) {
  const textures = useMemo(() => ({ idle: ringTexture("#191a18"), active: ringTexture("#a95336") }), []);
  return (
    <group name="hotspots" userData={{ noClip: true }}>
      {spec.hotspots.map((h) => (
        <sprite
          key={h.id}
          position={h.anchor}
          scale={focused === h.id ? [1.5, 1.5, 1] : [1.05, 1.05, 1]}
          userData={{ noClip: true }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(h.id);
          }}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <spriteMaterial map={focused === h.id ? textures.active : textures.idle} depthTest={false} transparent opacity={0.95} sizeAttenuation />
        </sprite>
      ))}
    </group>
  );
}
