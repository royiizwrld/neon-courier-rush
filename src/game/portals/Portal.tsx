import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { run } from "../runtime";
import { biomeAt } from "../biomes/biomes";
import { portalZ } from "../loop/GameLoop";

/** One reusable portal gate spanning all lanes, tinted with the NEXT biome's colors. */
export function Portal() {
  const root = useRef<THREE.Group>(null);
  const swirl = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const r = useMemo(() => ({
    ring: new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#fff", emissiveIntensity: 3, metalness: 0.4, roughness: 0.2, toneMapped: false }),
    inner: new THREE.MeshBasicMaterial({ color: "#fff", transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
    pillar: new THREE.MeshStandardMaterial({ color: "#1a1a2e", metalness: 0.7, roughness: 0.3 }),
    swirlGeo: new THREE.RingGeometry(0.4, 4.6, 48, 4, 0, Math.PI * 1.7),
  }), []);

  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const z = portalZ();
    g.visible = z > -170 && z < 12;
    if (!g.visible) return;
    g.position.z = z;
    const next = biomeAt(run.biome + 1);
    r.ring.color.copy(next.curb); r.ring.emissive.copy(next.curb);
    r.inner.color.copy(next.line);
    const t = state.clock.elapsedTime;
    if (swirl.current) swirl.current.rotation.z = -t * 2.5;
    if (ring2.current) { ring2.current.rotation.z = t * 1.2; ring2.current.scale.setScalar(1 + Math.sin(t * 4) * 0.03); }
  });

  return (
    <group ref={root} visible={false}>
      <mesh position={[0, 3.2, 0]} material={r.ring}>
        <torusGeometry args={[4.9, 0.32, 12, 64, Math.PI]} />
      </mesh>
      <mesh ref={ring2} position={[0, 3.2, -0.2]} material={r.ring}>
        <torusGeometry args={[4.4, 0.08, 6, 64]} />
      </mesh>
      <mesh ref={swirl} position={[0, 3.2, 0.05]} geometry={r.swirlGeo} material={r.inner} />
      <mesh position={[-4.9, 1.6, 0]} material={r.pillar}><cylinderGeometry args={[0.45, 0.6, 3.2, 12]} /></mesh>
      <mesh position={[4.9, 1.6, 0]} material={r.pillar}><cylinderGeometry args={[0.45, 0.6, 3.2, 12]} /></mesh>
    </group>
  );
}
