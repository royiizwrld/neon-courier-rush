import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { run, type PowerType } from "../runtime";

const TYPES: PowerType[] = ["magnet", "x2", "shield", "jet"];

/** Pooled floating power-up pickups inside a glowing bubble. */
export function PowerUps() {
  const slots = useRef<(THREE.Group | null)[]>([]);
  const m = useMemo(() => {
    const e = (c: string, i = 1.6) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.3, metalness: 0.4 });
    return {
      bubble: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#8af", emissiveIntensity: 0.6, transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false }),
      red: e("#ff2a4a"), silver: e("#dfe6ff", 0.6), gold: e("#ffc233", 1.8), cyan: e("#2ee6ff", 2), orange: e("#ff7a1a", 2.2), grey: e("#55607a", 0.3),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    run.pickups.forEach((p, i) => {
      const s = slots.current[i];
      if (!s) return;
      s.visible = p.active;
      if (!p.active) return;
      s.position.set(p.x, 1.2 + Math.sin(t * 3 + i) * 0.15 + p.pick * 5, p.z);
      s.rotation.y = t * 2;
      s.scale.setScalar(p.pick > 0 ? Math.max(0, 1 - p.pick * 2.5) : 1);
      for (let k = 0; k < 4; k++) s.children[k + 1]!.visible = TYPES[k] === p.type;
    });
  });

  return (
    <>
      {run.pickups.map((_, i) => (
        <group key={i} ref={(el) => { slots.current[i] = el; }} visible={false}>
          <mesh material={m.bubble}><sphereGeometry args={[0.62, 24, 16]} /></mesh>
          {/* magnet */}
          <group rotation-z={Math.PI}>
            <mesh material={m.red}><torusGeometry args={[0.28, 0.1, 10, 24, Math.PI]} /></mesh>
            <mesh material={m.silver} position={[-0.28, -0.08, 0]}><cylinderGeometry args={[0.1, 0.1, 0.16, 12]} /></mesh>
            <mesh material={m.silver} position={[0.28, -0.08, 0]}><cylinderGeometry args={[0.1, 0.1, 0.16, 12]} /></mesh>
          </group>
          {/* x2 multiplier star */}
          <group>
            <mesh material={m.gold}><octahedronGeometry args={[0.38, 0]} /></mesh>
          </group>
          {/* shield */}
          <group>
            <mesh material={m.cyan} scale={[1, 1.15, 0.4]}><sphereGeometry args={[0.3, 16, 12]} /></mesh>
          </group>
          {/* jetpack */}
          <group>
            <mesh material={m.grey} position={[-0.13, 0, 0]}><capsuleGeometry args={[0.11, 0.3, 4, 10]} /></mesh>
            <mesh material={m.grey} position={[0.13, 0, 0]}><capsuleGeometry args={[0.11, 0.3, 4, 10]} /></mesh>
            <mesh material={m.orange} position={[-0.13, -0.3, 0]}><coneGeometry args={[0.09, 0.22, 10]} /></mesh>
            <mesh material={m.orange} position={[0.13, -0.3, 0]}><coneGeometry args={[0.09, 0.22, 10]} /></mesh>
          </group>
        </group>
      ))}
    </>
  );
}
