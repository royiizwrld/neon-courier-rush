import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LANE_W } from "../constants";
import { run } from "../runtime";
import type { ObstacleType } from "../track/patterns";

const TYPES: ObstacleType[] = ["low", "high", "block", "moving"];

/** Pooled obstacle slots; each slot holds every type model and toggles visibility. */
export function Obstacles() {
  const slots = useRef<(THREE.Group | null)[]>([]);
  const r = useMemo(() => {
    const mat = (c: string, e?: string, ei = 1.5) =>
      new THREE.MeshStandardMaterial({ color: c, emissive: e ?? "#000", emissiveIntensity: e ? ei : 0, roughness: 0.5, metalness: 0.3 });
    return {
      g: {
        post: new THREE.BoxGeometry(0.15, 1, 0.15),
        bar: new THREE.BoxGeometry(1.9, 0.22, 0.12),
        van: new THREE.BoxGeometry(1.8, 2.3, 4.2),
        cab: new THREE.BoxGeometry(1.7, 1.0, 3.6),
        car: new THREE.BoxGeometry(1.8, 0.9, 3.9),
        light: new THREE.BoxGeometry(0.4, 0.15, 0.05),
        wheel: new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10),
      },
      m: {
        post: mat("#333a55"),
        stripe: mat("#ffcc00", "#ffaa00", 1.2),
        high: mat("#ff3d8b", "#ff3d8b", 2),
        van: mat("#2a3a6a"),
        vanLine: mat("#00e5ff", "#00e5ff", 2),
        car: mat("#ffb020"),
        cab: mat("#202538"),
        head: mat("#ffffff", "#fff6c0", 4),
        tail: mat("#ff2030", "#ff2030", 3),
        wheel: mat("#111"),
      },
    };
  }, []);

  useFrame(() => {
    run.obstacles.forEach((o, i) => {
      const s = slots.current[i];
      if (!s) return;
      s.visible = o.active;
      if (!o.active) return;
      s.position.set(o.lane * LANE_W, 0, o.z);
      for (let k = 0; k < 4; k++) s.children[k].visible = TYPES[k] === o.type;
    });
  });

  const { g, m } = r;
  return (
    <>
      {run.obstacles.map((_, i) => (
        <group key={i} ref={(el) => { slots.current[i] = el; }} visible={false}>
          {/* low barrier */}
          <group>
            <mesh geometry={g.post} material={m.post} position={[-0.85, 0.35, 0]} scale={[1, 0.7, 1]} />
            <mesh geometry={g.post} material={m.post} position={[0.85, 0.35, 0]} scale={[1, 0.7, 1]} />
            <mesh geometry={g.bar} material={m.stripe} position={[0, 0.62, 0]} />
          </group>
          {/* high barrier */}
          <group>
            <mesh geometry={g.post} material={m.post} position={[-0.9, 1.25, 0]} scale={[1, 2.5, 1]} />
            <mesh geometry={g.post} material={m.post} position={[0.9, 1.25, 0]} scale={[1, 2.5, 1]} />
            <mesh geometry={g.bar} material={m.high} position={[0, 1.45, 0]} scale={[1, 2.2, 1]} />
          </group>
          {/* parked van */}
          <group>
            <mesh geometry={g.van} material={m.van} position={[0, 1.25, 0]} />
            <mesh geometry={g.bar} material={m.vanLine} position={[0, 1.4, 2.12]} scale={[0.9, 0.5, 1]} />
            <mesh geometry={g.light} material={m.tail} position={[-0.65, 0.7, 2.11]} />
            <mesh geometry={g.light} material={m.tail} position={[0.65, 0.7, 2.11]} />
          </group>
          {/* moving car (headlights face the player) */}
          <group>
            <mesh geometry={g.car} material={m.car} position={[0, 0.65, 0]} />
            <mesh geometry={g.cab} material={m.cab} position={[0, 1.45, -0.2]} scale={[0.95, 0.7, 0.6]} />
            <mesh geometry={g.light} material={m.head} position={[-0.6, 0.75, 1.96]} />
            <mesh geometry={g.light} material={m.head} position={[0.6, 0.75, 1.96]} />
            <mesh geometry={g.wheel} material={m.wheel} position={[-0.9, 0.35, 1.2]} rotation-z={Math.PI / 2} />
            <mesh geometry={g.wheel} material={m.wheel} position={[0.9, 0.35, 1.2]} rotation-z={Math.PI / 2} />
            <mesh geometry={g.wheel} material={m.wheel} position={[-0.9, 0.35, -1.2]} rotation-z={Math.PI / 2} />
            <mesh geometry={g.wheel} material={m.wheel} position={[0.9, 0.35, -1.2]} rotation-z={Math.PI / 2} />
          </group>
        </group>
      ))}
    </>
  );
}
