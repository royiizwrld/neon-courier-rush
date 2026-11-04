import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { run } from "../runtime";

/** Single rare gem pickup: spinning octahedron with a pulsing halo and sparkle ring. */
export function Gem() {
  const g = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  const m = useMemo(() => ({
    gem: new THREE.MeshStandardMaterial({ color: "#3dffb0", emissive: "#19e6a0", emissiveIntensity: 1.8, metalness: 0.3, roughness: 0.1, flatShading: true }),
    halo: new THREE.MeshBasicMaterial({ color: "#7dffd0", transparent: true, opacity: 0.25, depthWrite: false, toneMapped: false }),
    spark: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
  }), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const gm = run.gem;
    if (!g.current) return;
    g.current.visible = gm.active;
    if (!gm.active) return;
    g.current.position.set(gm.x, 1.3 + Math.sin(t * 3) * 0.18 + gm.pick * 6, gm.z);
    g.current.rotation.y = t * 2.5;
    g.current.scale.setScalar(gm.pick > 0 ? 1 + gm.pick * 2 : 1);
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(t * 6) * 0.15);
    if (ring.current) { ring.current.rotation.z = t * 3; ring.current.children.forEach((c, i) => { c.visible = Math.sin(t * 9 + i * 1.7) > 0; }); }
  });
  return (
    <group ref={g} visible={false}>
      <mesh material={m.gem} scale={[0.42, 0.6, 0.42]}><octahedronGeometry args={[1, 0]} /></mesh>
      <mesh ref={halo} material={m.halo}><sphereGeometry args={[0.75, 16, 12]} /></mesh>
      <group ref={ring}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} material={m.spark} position={[Math.cos((i / 6) * Math.PI * 2) * 0.95, Math.sin((i / 6) * Math.PI * 2) * 0.95, 0]}>
            <octahedronGeometry args={[0.07, 0]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
