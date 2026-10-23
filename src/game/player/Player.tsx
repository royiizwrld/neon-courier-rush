import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { run } from "../runtime";
import { useGame } from "../store";

type G = THREE.Group | null;

/** Vex the courier: rounded capsules/spheres, two-joint limbs, procedural run cycle. */
export function Player() {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const j = useRef<Record<string, G>>({});
  const shadow = useRef<THREE.Mesh>(null);
  const shield = useRef<THREE.Mesh>(null);
  const jet = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Group>(null);
  const m = useMemo(() => {
    const s = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o });
    return {
      hoodie: s("#ff3d8b", { roughness: 0.6 }),
      hoodie2: s("#d42a72"),
      pants: s("#23285a", { roughness: 0.8 }),
      skin: s("#d99a6c", { roughness: 0.7 }),
      hair: s("#1a1230"),
      cap: s("#00c8e6", { roughness: 0.4 }),
      visor: s("#0a0a18", { metalness: 0.9, roughness: 0.1, emissive: "#00e5ff", emissiveIntensity: 0.5 }),
      bag: s("#ffb020", { roughness: 0.5 }),
      strap: s("#3a2a10"),
      shoe: s("#ffffff", { emissive: "#00e5ff", emissiveIntensity: 0.35 }),
      sole: s("#00e5ff", { emissive: "#00e5ff", emissiveIntensity: 1.6 }),
      shadow: new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.45, depthWrite: false }),
      shield: new THREE.MeshStandardMaterial({ color: "#7fe9ff", emissive: "#2ee6ff", emissiveIntensity: 0.8, transparent: true, opacity: 0.22, depthWrite: false }),
      metal: s("#6a7590", { metalness: 0.8, roughness: 0.3 }),
      flame: new THREE.MeshBasicMaterial({ color: "#ffb347", toneMapped: false }),
    };
  }, []);
  const set = (k: string) => (el: G) => { j.current[k] = el; };

  useFrame((state) => {
    const playing = useGame.getState().phase !== "start";
    const t = playing ? run.time : state.clock.elapsedTime * 0.6;
    const sliding = run.slide > 0;
    const flying = run.jet > 0;
    const ph = t * (run.speed * 0.72);
    const sw = run.grounded && !sliding && !flying ? Math.sin(ph) : 0;
    const J = j.current;
    if (root.current) {
      root.current.position.set(run.x, run.y, 0);
      root.current.rotation.z = THREE.MathUtils.clamp(-run.lean, -0.35, 0.35);
      // blink while invulnerable
      root.current.visible = run.invuln > 0 ? Math.floor(state.clock.elapsedTime * 16) % 2 === 0 : true;
    }
    if (body.current) {
      body.current.rotation.x = sliding ? -1.25 : flying ? 0.25 : run.grounded ? -0.18 : -0.05;
      body.current.position.y = sliding ? 0.25 : Math.abs(Math.sin(ph)) * 0.07;
      body.current.rotation.y = sw * 0.12;
    }
    if (head.current) head.current.rotation.x = sliding ? 0.9 : 0.1;
    const air = !run.grounded && !flying;
    const L = (k: string, x: number) => { const g = J[k]; if (g) g.rotation.x = x; };
    // legs: hip + knee
    L("hipL", sliding ? 0.15 : flying ? 0.3 : sw * 0.85 - (air ? 0.9 : 0));
    L("hipR", sliding ? 0.45 : flying ? 0.1 : -sw * 0.85 + (air ? 0.2 : 0));
    L("kneeL", sliding ? 0.2 : flying ? 0.5 : Math.max(0, -Math.cos(ph)) * 1.3 + (air ? 1.1 : 0.1));
    L("kneeR", sliding ? 0.6 : flying ? 0.6 : Math.max(0, Math.cos(ph)) * 1.3 + (air ? 0.4 : 0.1));
    // arms: shoulder + elbow
    L("shL", sliding ? -0.4 : flying ? -0.4 : -sw * 0.9 - (air ? 2.6 : 0));
    L("shR", sliding ? -2.2 : flying ? -0.4 : sw * 0.9 - (air ? 2.6 : 0));
    L("elL", -1.1 - (air ? 0 : 0.2));
    L("elR", -1.1 - (air ? 0 : 0.2));
    if (shadow.current) {
      shadow.current.position.set(run.x, 0.02, 0);
      const s = 1 / (1 + run.y * 0.6);
      shadow.current.scale.set(s, s, s);
    }
    if (shield.current) {
      shield.current.visible = run.shield;
      shield.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 5) * 0.04);
    }
    if (jet.current) jet.current.visible = flying;
    if (flame.current) flame.current.scale.y = 0.8 + Math.random() * 0.6;
  });

  return (
    <>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} material={m.shadow}>
        <circleGeometry args={[0.55, 24]} />
      </mesh>
      <group ref={root} rotation-y={Math.PI}>
        <mesh ref={shield} position={[0, 1.0, 0]} material={m.shield} visible={false}>
          <sphereGeometry args={[1.15, 32, 20]} />
        </mesh>
        <group ref={body}>
          {/* torso + hoodie */}
          <mesh position={[0, 1.18, 0]} material={m.hoodie} scale={[1, 1, 0.75]}><capsuleGeometry args={[0.27, 0.36, 6, 16]} /></mesh>
          <mesh position={[0, 0.88, 0]} material={m.hoodie2} scale={[1, 0.5, 0.78]}><sphereGeometry args={[0.28, 16, 10]} /></mesh>
          <mesh position={[0, 1.42, -0.17]} material={m.hoodie2} rotation-x={0.5}><torusGeometry args={[0.16, 0.06, 8, 16]} /></mesh>
          {/* courier bag */}
          <mesh position={[0, 1.16, -0.3]} material={m.bag}><capsuleGeometry args={[0.2, 0.16, 6, 12]} /></mesh>
          <mesh position={[0, 1.16, -0.2]} rotation-z={0.6} material={m.strap} scale={[1, 1, 0.5]}><torusGeometry args={[0.33, 0.025, 6, 20]} /></mesh>
          {/* jetpack */}
          <group ref={jet} position={[0, 1.15, -0.42]} visible={false}>
            <mesh position={[-0.13, 0, 0]} material={m.metal}><capsuleGeometry args={[0.1, 0.3, 4, 10]} /></mesh>
            <mesh position={[0.13, 0, 0]} material={m.metal}><capsuleGeometry args={[0.1, 0.3, 4, 10]} /></mesh>
            <group ref={flame} position={[0, -0.3, 0]}>
              <mesh position={[-0.13, -0.15, 0]} rotation-x={Math.PI} material={m.flame}><coneGeometry args={[0.08, 0.4, 10]} /></mesh>
              <mesh position={[0.13, -0.15, 0]} rotation-x={Math.PI} material={m.flame}><coneGeometry args={[0.08, 0.4, 10]} /></mesh>
            </group>
          </group>
          {/* head */}
          <group ref={head} position={[0, 1.62, 0]}>
            <mesh position={[0, 0.06, 0]} material={m.skin}><sphereGeometry args={[0.2, 20, 16]} /></mesh>
            <mesh position={[0, 0.1, -0.03]} material={m.hair} scale={[1.02, 0.9, 1.02]}><sphereGeometry args={[0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <mesh position={[0, 0.17, 0]} material={m.cap} scale={[1.08, 0.7, 1.08]}><sphereGeometry args={[0.2, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
            <mesh position={[0, 0.16, 0.2]} rotation-x={-0.2} material={m.cap} scale={[1, 0.15, 1]}><cylinderGeometry args={[0.16, 0.16, 0.1, 16, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
            <mesh position={[0, 0.06, 0.15]} material={m.visor} scale={[1, 0.38, 0.5]}><sphereGeometry args={[0.17, 16, 10]} /></mesh>
          </group>
          {/* arms */}
          {(["L", "R"] as const).map((s) => (
            <group key={s} ref={set("sh" + s)} position={[s === "L" ? -0.36 : 0.36, 1.38, 0]}>
              <mesh position={[0, -0.15, 0]} material={m.hoodie}><capsuleGeometry args={[0.08, 0.2, 4, 10]} /></mesh>
              <group ref={set("el" + s)} position={[0, -0.32, 0]}>
                <mesh position={[0, -0.13, 0]} material={m.hoodie2}><capsuleGeometry args={[0.07, 0.18, 4, 10]} /></mesh>
                <mesh position={[0, -0.3, 0]} material={m.skin}><sphereGeometry args={[0.075, 12, 10]} /></mesh>
              </group>
            </group>
          ))}
          {/* legs */}
          {(["L", "R"] as const).map((s) => (
            <group key={s} ref={set("hip" + s)} position={[s === "L" ? -0.14 : 0.14, 0.85, 0]}>
              <mesh position={[0, -0.19, 0]} material={m.pants}><capsuleGeometry args={[0.1, 0.24, 4, 10]} /></mesh>
              <group ref={set("knee" + s)} position={[0, -0.4, 0]} rotation-x={0}>
                <mesh position={[0, -0.17, 0]} material={m.pants}><capsuleGeometry args={[0.085, 0.22, 4, 10]} /></mesh>
                <group position={[0, -0.38, 0.06]}>
                  <mesh material={m.shoe} scale={[1, 0.65, 1.6]}><sphereGeometry args={[0.11, 14, 10]} /></mesh>
                  <mesh position={[0, -0.06, 0]} material={m.sole} scale={[1.05, 0.2, 1.65]}><sphereGeometry args={[0.11, 12, 8]} /></mesh>
                </group>
              </group>
            </group>
          ))}
        </group>
      </group>
    </>
  );
}
