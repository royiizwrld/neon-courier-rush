import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LANE_W, SEG_COUNT, SEG_LEN } from "../constants";
import { run } from "../runtime";
import { biomeAt } from "../biomes/biomes";
import { blend } from "../biomes/BiomeSky";

function roadTexture() {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#14152a"; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 500; i++) {
    const v = 20 + Math.random() * 30;
    x.fillStyle = `rgb(${v},${v},${v + 15})`;
    x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  x.strokeStyle = "#0c0d1c"; x.lineWidth = 2;
  x.strokeRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Recycled road segments: SEG_COUNT groups wrap around as distance grows. */
export function Track() {
  const segs = useRef<(THREE.Group | null)[]>([]);
  const r = useMemo(() => ({
    road: new THREE.PlaneGeometry(LANE_W * 3 + 0.6, SEG_LEN),
    line: new THREE.BoxGeometry(0.08, 0.02, SEG_LEN * 0.45),
    curb: new THREE.BoxGeometry(0.3, 0.25, SEG_LEN),
    walk: new THREE.PlaneGeometry(4, SEG_LEN),
    roadM: new THREE.MeshStandardMaterial({ map: roadTexture(), roughness: 0.25, metalness: 0.55 }),
    lineM: new THREE.MeshStandardMaterial({ color: "#00e5ff", emissive: "#00e5ff", emissiveIntensity: 2.5 }),
    curbM: new THREE.MeshStandardMaterial({ color: "#ff3d8b", emissive: "#ff3d8b", emissiveIntensity: 1.6 }),
    walkM: new THREE.MeshStandardMaterial({ color: "#1d1b33", roughness: 0.7 }),
  }), []);
  useFrame((_, dt) => {
    const b = biomeAt(run.biome);
    blend(r.curbM.color, b.curb, dt); blend(r.curbM.emissive, b.curb, dt);
    blend(r.lineM.color, b.line, dt); blend(r.lineM.emissive, b.line, dt);
    blend(r.roadM.color, b.road, dt);
    const off = run.distance % SEG_LEN;
    for (let i = 0; i < SEG_COUNT; i++) {
      const s = segs.current[i];
      if (s) s.position.z = -i * SEG_LEN + off + SEG_LEN * 0.5;
    }
  });
  const hw = (LANE_W * 3) / 2 + 0.3;
  return (
    <>
      {Array.from({ length: SEG_COUNT }, (_, i) => (
        <group key={i} ref={(el) => { segs.current[i] = el; }}>
          <mesh geometry={r.road} material={r.roadM} rotation-x={-Math.PI / 2} />
          <mesh geometry={r.line} material={r.lineM} position={[-LANE_W / 2, 0.01, 0]} />
          <mesh geometry={r.line} material={r.lineM} position={[LANE_W / 2, 0.01, 0]} />
          <mesh geometry={r.curb} material={r.curbM} position={[-hw, 0.12, 0]} />
          <mesh geometry={r.curb} material={r.curbM} position={[hw, 0.12, 0]} />
          <mesh geometry={r.walk} material={r.walkM} rotation-x={-Math.PI / 2} position={[-hw - 2, 0.2, 0]} />
          <mesh geometry={r.walk} material={r.walkM} rotation-x={-Math.PI / 2} position={[hw + 2, 0.2, 0]} />
        </group>
      ))}
    </>
  );
}
