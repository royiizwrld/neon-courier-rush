import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { run } from "../runtime";
import { useGame } from "../store";

/** Vex the courier: built from boxes, animated procedurally. */
export function Player() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null), armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null), legR = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const m = useMemo(() => ({
    jacket: new THREE.MeshStandardMaterial({ color: "#ff3d8b", roughness: 0.5 }),
    pants: new THREE.MeshStandardMaterial({ color: "#1b1f3a", roughness: 0.8 }),
    skin: new THREE.MeshStandardMaterial({ color: "#c98a5e" }),
    visor: new THREE.MeshStandardMaterial({ color: "#00e5ff", emissive: "#00e5ff", emissiveIntensity: 2 }),
    bag: new THREE.MeshStandardMaterial({ color: "#ffb020", roughness: 0.6 }),
    shoe: new THREE.MeshStandardMaterial({ color: "#f2f2f2", emissive: "#00e5ff", emissiveIntensity: 0.4 }),
    shadow: new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.45, depthWrite: false }),
  }), []);

  useFrame((state) => {
    const playing = useGame.getState().phase !== "start";
    const t = playing ? run.time : state.clock.elapsedTime * 0.6;
    const sliding = run.slide > 0;
    const ph = t * (run.speed * 0.75);
    const sw = run.grounded && !sliding ? Math.sin(ph) : 0;
    if (root.current) {
      root.current.position.set(run.x, run.y, 0);
      root.current.rotation.z = THREE.MathUtils.clamp(-run.lean, -0.35, 0.35);
    }
    if (body.current) {
      body.current.rotation.x = sliding ? -1.2 : run.grounded ? -0.15 : -0.05;
      body.current.position.y = sliding ? 0.35 : Math.abs(Math.sin(ph)) * 0.08;
    }
    const airLeg = run.grounded ? 0 : 0.7;
    if (legL.current) legL.current.rotation.x = sw * 0.9 - airLeg;
    if (legR.current) legR.current.rotation.x = -sw * 0.9 + (run.grounded ? 0 : 0.3);
    if (armL.current) armL.current.rotation.x = -sw * 1.0 - (run.grounded ? 0 : 2.4);
    if (armR.current) armR.current.rotation.x = sw * 1.0 - (run.grounded ? 0 : 2.4);
    if (shadow.current) {
      shadow.current.position.set(run.x, 0.02, 0);
      const s = 1 / (1 + run.y * 0.6);
      shadow.current.scale.set(s, s, s);
    }
  });

  return (
    <>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} material={m.shadow}>
        <circleGeometry args={[0.55, 20]} />
      </mesh>
      <group ref={root} rotation-y={Math.PI}>
        <group ref={body}>
          <mesh position={[0, 1.15, 0]} material={m.jacket}><boxGeometry args={[0.6, 0.65, 0.35]} /></mesh>
          <mesh position={[0, 1.15, -0.28]} material={m.bag}><boxGeometry args={[0.5, 0.5, 0.22]} /></mesh>
          <mesh position={[0, 1.68, 0]} material={m.skin}><boxGeometry args={[0.36, 0.36, 0.36]} /></mesh>
          <mesh position={[0, 1.72, 0.17]} material={m.visor}><boxGeometry args={[0.38, 0.1, 0.06]} /></mesh>
          <mesh position={[0, 1.88, -0.02]} material={m.jacket}><boxGeometry args={[0.4, 0.1, 0.42]} /></mesh>
          <group ref={armL} position={[-0.4, 1.42, 0]}>
            <mesh position={[0, -0.28, 0]} material={m.jacket}><boxGeometry args={[0.16, 0.56, 0.16]} /></mesh>
          </group>
          <group ref={armR} position={[0.4, 1.42, 0]}>
            <mesh position={[0, -0.28, 0]} material={m.jacket}><boxGeometry args={[0.16, 0.56, 0.16]} /></mesh>
          </group>
          <group ref={legL} position={[-0.16, 0.82, 0]}>
            <mesh position={[0, -0.36, 0]} material={m.pants}><boxGeometry args={[0.2, 0.7, 0.2]} /></mesh>
            <mesh position={[0, -0.74, 0.06]} material={m.shoe}><boxGeometry args={[0.22, 0.12, 0.32]} /></mesh>
          </group>
          <group ref={legR} position={[0.16, 0.82, 0]}>
            <mesh position={[0, -0.36, 0]} material={m.pants}><boxGeometry args={[0.2, 0.7, 0.2]} /></mesh>
            <mesh position={[0, -0.74, 0.06]} material={m.shoe}><boxGeometry args={[0.22, 0.12, 0.32]} /></mesh>
          </group>
        </group>
      </group>
    </>
  );
}
