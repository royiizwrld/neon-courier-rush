import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DESPAWN_Z } from "../constants";
import { run } from "../runtime";

const PER_SIDE = 22;
const SPACING = 8;
const LOOP = PER_SIDE * SPACING;
const SIGN_COLORS = ["#ff3d8b", "#00e5ff", "#ffb020", "#7dff6a"];
const dummy = new THREE.Object3D();

function windowTexture() {
  const c = document.createElement("canvas");
  c.width = 64; c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#0d0e1f"; x.fillRect(0, 0, 64, 128);
  for (let yy = 4; yy < 128; yy += 10) for (let xx = 4; xx < 64; xx += 10) {
    if (Math.random() < 0.45) {
      x.fillStyle = ["#ffd27a", "#7fe9ff", "#ff8fc0"][Math.floor(Math.random() * 3)] ?? "#ffd27a";
      x.fillRect(xx, yy, 5, 6);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  return t;
}

/** Instanced buildings + neon signs + lamps on both sides; recycled by z wrap. */
export function Scenery() {
  const bRef = useRef<THREE.InstancedMesh>(null);
  const sRef = useRef<THREE.InstancedMesh>(null);
  const lRef = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const items = [];
    // inner row (signs + lamps) and an outer row that fills wide/landscape screens
    for (let i = 0; i < PER_SIDE * 4; i++) {
      const side = i % 2 ? 1 : -1;
      const outer = i >= PER_SIDE * 2;
      items.push({
        side, outer, z: -Math.floor((i % (PER_SIDE * 2)) / 2) * SPACING - (outer ? SPACING / 2 : 0),
        x: side * (outer ? 19 + Math.random() * 6 : 9 + Math.random() * 3),
        w: 5 + Math.random() * 3, h: 8 + Math.random() * 22, d: 6 + Math.random() * 2,
        signY: 3 + Math.random() * 5, signC: SIGN_COLORS[Math.floor(Math.random() * 4)],
      });
    }
    const tex = windowTexture();
    const bMat = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: 0.9, roughness: 0.8 });
    const sMat = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
    const lMat = new THREE.MeshStandardMaterial({ color: "#333", emissive: "#ffe8b0", emissiveIntensity: 0 });
    return { items, bMat, sMat, lMat };
  }, []);

  useFrame(() => {
    const b = bRef.current, s = sRef.current, l = lRef.current;
    if (!b || !s || !l) return;
    const off = run.distance;
    data.items.forEach((it, i) => {
      let z = ((it.z + off) % LOOP);
      if (z > DESPAWN_Z) z -= LOOP;
      dummy.position.set(it.x, it.h / 2, z);
      dummy.scale.set(it.w, it.h, it.d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix(); b.setMatrixAt(i, dummy.matrix);
      dummy.position.set(it.x - it.side * (it.w / 2 + 0.15), it.signY, z);
      dummy.scale.set(it.outer ? 0 : 0.15, it.outer ? 0 : 1.8, it.outer ? 0 : 2.6);
      dummy.updateMatrix(); s.setMatrixAt(i, dummy.matrix);
      dummy.position.set(it.side * 5.2, 2.2, z + 3);
      if (it.outer) dummy.scale.set(0, 0, 0); else dummy.scale.set(0.12, 4.4, 0.12);
      dummy.updateMatrix(); l.setMatrixAt(i, dummy.matrix);
    });
    b.instanceMatrix.needsUpdate = true;
    s.instanceMatrix.needsUpdate = true;
    l.instanceMatrix.needsUpdate = true;
  });

  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const n = data.items.length;
  return (
    <>
      <instancedMesh ref={bRef} args={[box, data.bMat, n]} frustumCulled={false} />
      <instancedMesh
        ref={(el) => {
          sRef.current = el;
          if (el && !el.instanceColor) { data.items.forEach((it, i) => el.setColorAt(i, new THREE.Color(it.signC))); data.sMat.needsUpdate = true; }
        }}
        args={[box, data.sMat, n]} frustumCulled={false}
      />
      <instancedMesh ref={lRef} args={[box, data.lMat, n]} frustumCulled={false} />
      {/* wide ground so side areas never show empty sky on landscape screens */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, -70]}>
        <planeGeometry args={[220, 200]} />
        <meshStandardMaterial color="#0e0c22" roughness={0.9} />
      </mesh>
      {/* distant skyline */}
      <mesh position={[0, 18, -160]}>
        <planeGeometry args={[700, 80]} />
        <meshBasicMaterial color="#2a0f45" fog={false} />
      </mesh>
      <mesh position={[0, 30, -159]}>
        <circleGeometry args={[14, 32]} />
        <meshBasicMaterial color="#ff4fa0" fog={false} />
      </mesh>
    </>
  );
}
