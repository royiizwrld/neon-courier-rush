import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { run } from "../runtime";
import { biomeAt } from "./biomes";

/** Smoothly blend a color toward a target (frame-rate independent). */
export function blend(c: THREE.Color, target: THREE.Color, dt: number, rate = 3) {
  c.lerp(target, 1 - Math.exp(-rate * Math.min(dt, 0.05)));
}

/** Sky + fog follow the current biome. */
export function BiomeSky() {
  const scene = useThree((s) => s.scene);
  useFrame((_, dt) => {
    const b = biomeAt(run.biome);
    if (scene.background instanceof THREE.Color) blend(scene.background, b.sky, dt);
    if (scene.fog) blend(scene.fog.color, b.fog, dt);
  });
  return null;
}
