"use client";

import type { ModelComponentProps } from "@/components/viewer/model-contract";

/** Placeholder until the music institution reconstruction lands (see docs/TASKS.json T5). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MusicInstitutionModel(props: ModelComponentProps) {
  return (
    <mesh position={[0, 2, 0]} castShadow>
      <cylinderGeometry args={[6, 6, 4, 48]} />
      <meshStandardMaterial color="#d9d2c5" />
    </mesh>
  );
}
