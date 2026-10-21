import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { run } from "../runtime";

const dummy = new THREE.Object3D();

/** All coins in one instanced draw call. Picked coins pop up and shrink. */
export function Coins() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.CylinderGeometry(0.32, 0.32, 0.08, 14).rotateX(Math.PI / 2), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffc233", emissive: "#ff9a00", emissiveIntensity: 1.2, metalness: 0.8, roughness: 0.25 }), []);
  const n = run.coinPool.length;
  useFrame((state) => {
    const im = ref.current;
    if (!im) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < n; i++) {
      const c = run.coinPool[i]!;
      if (!c.active) { dummy.scale.setScalar(0); }
      else {
        const p = c.pick;
        dummy.position.set(c.x, c.y + (p > 0 ? p * 6 : Math.sin(t * 3 + c.z) * 0.08), c.z);
        dummy.rotation.set(0, t * 4 + i, 0);
        dummy.scale.setScalar(p > 0 ? Math.max(0, 1.4 - p * 4) : 1);
      }
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, n]} frustumCulled={false} />;
}
