import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { LANE_W } from "../constants";
import { run } from "../runtime";
import type { ObstacleType } from "../track/patterns";
import { biomeAt, KINDS } from "../biomes/biomes";

function slideTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#1a0820"; x.fillRect(0, 0, 256, 128);
  x.fillStyle = "#ff3d8b";
  for (let i = -2; i < 12; i++) { x.beginPath(); x.moveTo(i * 28, 0); x.lineTo(i * 28 + 14, 0); x.lineTo(i * 28 - 10, 22); x.lineTo(i * 28 - 24, 22); x.fill(); }
  for (let i = -2; i < 12; i++) { x.beginPath(); x.moveTo(i * 28, 106); x.lineTo(i * 28 + 14, 106); x.lineTo(i * 28 - 10, 128); x.lineTo(i * 28 - 24, 128); x.fill(); }
  x.fillStyle = "#ffffff"; x.font = "bold 54px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("▼ DUCK ▼", 128, 66);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

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
        log: new THREE.CylinderGeometry(0.36, 0.4, 2.3, 9),
        cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
        rock: new THREE.DodecahedronGeometry(1, 0),
        ball: new THREE.IcosahedronGeometry(1, 1),
        cone: new THREE.ConeGeometry(1, 1, 6),
        box: new THREE.BoxGeometry(1, 1, 1),
      },
      m: {
        post: mat("#333a55"),
        stripe: mat("#ffcc00", "#ffaa00", 1.2),
        high: (() => { const t = slideTexture(); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: "#ffffff", emissiveIntensity: 1.4, roughness: 0.4 }); })(),
        glow: mat("#ff3d8b", "#ff3d8b", 3),
        van: mat("#2a3a6a"),
        vanLine: mat("#00e5ff", "#00e5ff", 2),
        car: mat("#ffb020"),
        cab: mat("#202538"),
        head: mat("#ffffff", "#fff6c0", 4),
        tail: mat("#ff2030", "#ff2030", 3),
        wheel: mat("#111"),
        bark: new THREE.MeshStandardMaterial({ color: "#6a4426", roughness: 0.95, flatShading: true }),
        ring: new THREE.MeshStandardMaterial({ color: "#c9a26a", roughness: 0.9 }),
        moss: new THREE.MeshStandardMaterial({ color: "#4f8a34", roughness: 1, flatShading: true }),
        leaf: new THREE.MeshStandardMaterial({ color: "#3a7a36", roughness: 1, flatShading: true }),
        stone: new THREE.MeshStandardMaterial({ color: "#7a7f74", roughness: 0.95, flatShading: true }),
        rune: mat("#9dffcf", "#5affb0", 2),
        pipe: new THREE.MeshStandardMaterial({ color: "#5c6b55", metalness: 0.7, roughness: 0.4 }),
        rust: new THREE.MeshStandardMaterial({ color: "#7a4424", metalness: 0.5, roughness: 0.6 }),
        slime: mat("#6cff4a", "#4aff2a", 2),
        hazard: mat("#ffd23d", "#ffb000", 0.8),
        ice: new THREE.MeshStandardMaterial({ color: "#aeeaff", emissive: "#4fc8ff", emissiveIntensity: 0.5, roughness: 0.1, transparent: true, opacity: 0.88, flatShading: true }),
        snow: new THREE.MeshStandardMaterial({ color: "#f4fbff", roughness: 1, flatShading: true }),
        redrock: new THREE.MeshStandardMaterial({ color: "#a84a2a", roughness: 0.95, flatShading: true }),
        sand: new THREE.MeshStandardMaterial({ color: "#c8783e", roughness: 1, flatShading: true }),
        lava: mat("#ff5a1a", "#ff4a00", 2.5),
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
      const active = KINDS.indexOf(biomeAt(run.biome).kind) * 4 + TYPES.indexOf(o.type);
      for (let k = 0; k < s.children.length; k++) s.children[k]!.visible = k === active;
      // rolling hazards (boulders, drums) spin as they come at the player
      const roll = s.children[active]!.userData.roll as THREE.Object3D | undefined;
      if (roll) roll.rotation.x = o.z * 0.9;
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
            <mesh geometry={g.post} material={m.post} position={[-1.02, 1.4, 0]} scale={[1.8, 2.8, 1.8]} />
            <mesh geometry={g.post} material={m.post} position={[1.02, 1.4, 0]} scale={[1.8, 2.8, 1.8]} />
            <mesh material={m.high} position={[0, 1.95, 0]}><boxGeometry args={[2.0, 1.4, 0.18]} /></mesh>
            <mesh geometry={g.bar} material={m.glow} position={[0, 1.22, 0]} scale={[1.08, 0.35, 1.8]} />
            <mesh geometry={g.bar} material={m.glow} position={[0, 2.68, 0]} scale={[1.08, 0.35, 1.8]} />
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
          {/* ===== MISTY FOREST ===== */}
          <group>{/* fallen log */}
            <mesh geometry={g.log} material={m.bark} position={[0, 0.38, 0]} rotation-z={Math.PI / 2} />
            <mesh geometry={g.cyl} material={m.ring} position={[1.16, 0.38, 0]} rotation-z={Math.PI / 2} scale={[0.68, 0.02, 0.68]} />
            <mesh geometry={g.rock} material={m.moss} position={[-0.3, 0.7, 0]} scale={[0.6, 0.18, 0.4]} />
          </group>
          <group>{/* low branch with hanging leaves */}
            <mesh geometry={g.log} material={m.bark} position={[0, 1.95, 0]} rotation-z={Math.PI / 2 + 0.06} scale={[1.1, 1.05, 1.1]} />
            <mesh geometry={g.log} material={m.bark} position={[-1.3, 1.3, 0]} scale={[0.9, 1.15, 0.9]} />
            <mesh geometry={g.log} material={m.bark} position={[1.3, 1.3, 0]} scale={[0.9, 1.15, 0.9]} />
            <mesh geometry={g.rock} material={m.leaf} position={[-0.5, 2.4, 0]} scale={[0.8, 0.45, 0.6]} />
            <mesh geometry={g.rock} material={m.leaf} position={[0.6, 2.35, 0.1]} scale={[0.7, 0.4, 0.6]} />
            <mesh geometry={g.cone} material={m.leaf} position={[0.1, 1.55, 0]} rotation-x={Math.PI} scale={[0.2, 0.5, 0.2]} />
          </group>
          <group>{/* standing stone */}
            <mesh geometry={g.rock} material={m.stone} position={[0, 1.3, 0]} scale={[0.9, 1.5, 1.2]} />
            <mesh geometry={g.box} material={m.rune} position={[0, 1.5, 1.05]} scale={[0.25, 0.7, 0.05]} />
            <mesh geometry={g.rock} material={m.moss} position={[0, 2.5, 0]} scale={[0.7, 0.25, 0.8]} />
          </group>
          <group>{/* rolling boulder */}
            <group position={[0, 1, 0]} ref={(el) => { if (el?.parent) el.parent.userData.roll = el; }}>
              <mesh geometry={g.rock} material={m.stone} scale={0.98} />
              <mesh geometry={g.rock} material={m.moss} position={[0, 0.7, 0.3]} scale={[0.5, 0.3, 0.5]} />
            </group>
          </group>
          {/* ===== TOXIC SEWERS ===== */}
          <group>{/* leaking pipe */}
            <mesh geometry={g.cyl} material={m.pipe} position={[0, 0.4, 0]} rotation-z={Math.PI / 2} scale={[0.6, 2.2, 0.6]} />
            <mesh geometry={g.cyl} material={m.rust} position={[0, 0.4, 0]} rotation-z={Math.PI / 2} scale={[0.72, 0.2, 0.72]} />
            <mesh geometry={g.cyl} material={m.slime} position={[0.3, 0.02, 0.6]} scale={[1.2, 0.03, 0.8]} />
          </group>
          <group>{/* overhead steam pipe */}
            <mesh geometry={g.cyl} material={m.pipe} position={[0, 1.95, 0]} rotation-z={Math.PI / 2} scale={[0.75, 2.4, 0.75]} />
            <mesh geometry={g.box} material={m.rust} position={[-1.1, 1.2, 0]} scale={[0.2, 2.4, 0.3]} />
            <mesh geometry={g.box} material={m.rust} position={[1.1, 1.2, 0]} scale={[0.2, 2.4, 0.3]} />
            <mesh geometry={g.box} material={m.hazard} position={[0, 1.55, 0.3]} scale={[1.8, 0.08, 0.05]} />
            <mesh geometry={g.cone} material={m.slime} position={[0.3, 1.45, 0]} rotation-x={Math.PI} scale={[0.08, 0.2, 0.08]} />
          </group>
          <group>{/* chemical tank */}
            <mesh geometry={g.cyl} material={m.rust} position={[0, 1.2, 0]} scale={[1.8, 2.4, 1.8]} />
            <mesh geometry={g.cyl} material={m.slime} position={[0, 1.2, 0]} scale={[1.84, 0.3, 1.84]} />
            <mesh geometry={g.box} material={m.hazard} position={[0, 1.9, 0.92]} scale={[0.6, 0.4, 0.03]} />
          </group>
          <group>{/* rolling waste drum */}
            <group position={[0, 0.75, 0]} ref={(el) => { if (el?.parent) el.parent.userData.roll = el; }}>
              <mesh geometry={g.cyl} material={m.hazard} rotation-z={Math.PI / 2} scale={[1.5, 1.8, 1.5]} />
              <mesh geometry={g.cyl} material={m.rust} rotation-z={Math.PI / 2} scale={[1.55, 0.25, 1.55]} />
            </group>
          </group>
          {/* ===== FROST CAVERNS ===== */}
          <group>{/* ice ridge */}
            <mesh geometry={g.rock} material={m.snow} position={[0, 0.2, 0]} scale={[1.1, 0.35, 0.6]} />
            <mesh geometry={g.cone} material={m.ice} position={[-0.5, 0.35, 0]} scale={[0.3, 0.7, 0.3]} />
            <mesh geometry={g.cone} material={m.ice} position={[0.2, 0.33, 0.1]} scale={[0.25, 0.65, 0.25]} />
            <mesh geometry={g.cone} material={m.ice} position={[0.7, 0.3, 0]} scale={[0.25, 0.6, 0.25]} />
          </group>
          <group>{/* hanging icicles */}
            <mesh geometry={g.box} material={m.snow} position={[0, 2.5, 0]} scale={[2.3, 0.5, 0.6]} />
            <mesh geometry={g.box} material={m.ice} position={[-1.1, 1.3, 0]} scale={[0.25, 2.6, 0.4]} />
            <mesh geometry={g.box} material={m.ice} position={[1.1, 1.3, 0]} scale={[0.25, 2.6, 0.4]} />
            {[-0.7, -0.25, 0.2, 0.65].map((x, k) => (
              <mesh key={k} geometry={g.cone} material={m.ice} position={[x, 1.9, 0]} rotation-x={Math.PI} scale={[0.17, 0.75 + (k % 2) * 0.15, 0.17]} />
            ))}
          </group>
          <group>{/* glacier block */}
            <mesh geometry={g.box} material={m.ice} position={[0, 1.2, 0]} scale={[1.8, 2.4, 1.8]} rotation-y={0.2} />
            <mesh geometry={g.rock} material={m.snow} position={[0, 2.45, 0]} scale={[1, 0.25, 1]} />
          </group>
          <group>{/* sliding ice chunk */}
            <group position={[0, 0.9, 0]} ref={(el) => { if (el?.parent) el.parent.userData.roll = el; }}>
              <mesh geometry={g.rock} material={m.ice} scale={[0.95, 0.9, 0.95]} />
            </group>
          </group>
          {/* ===== EMBER CANYON ===== */}
          <group>{/* rock slab with lava crack */}
            <mesh geometry={g.rock} material={m.redrock} position={[0, 0.3, 0]} scale={[1.1, 0.4, 0.5]} />
            <mesh geometry={g.box} material={m.lava} position={[0, 0.45, 0.36]} scale={[1.4, 0.06, 0.05]} />
          </group>
          <group>{/* rock arch */}
            <mesh geometry={g.rock} material={m.redrock} position={[-1.15, 1.2, 0]} scale={[0.4, 1.4, 0.6]} />
            <mesh geometry={g.rock} material={m.redrock} position={[1.15, 1.2, 0]} scale={[0.4, 1.4, 0.6]} />
            <mesh geometry={g.rock} material={m.sand} position={[0, 2.2, 0]} scale={[1.6, 0.5, 0.6]} />
          </group>
          <group>{/* canyon boulder */}
            <mesh geometry={g.rock} material={m.redrock} position={[0, 1.2, 0]} scale={[1, 1.3, 1.3]} />
            <mesh geometry={g.rock} material={m.sand} position={[0.2, 0.4, 0.5]} scale={[0.7, 0.5, 0.7]} />
          </group>
          <group>{/* rolling lava rock */}
            <group position={[0, 0.95, 0]} ref={(el) => { if (el?.parent) el.parent.userData.roll = el; }}>
              <mesh geometry={g.ball} material={m.redrock} scale={0.92} />
              <mesh geometry={g.ball} material={m.lava} scale={[0.95, 0.12, 0.95]} />
              <mesh geometry={g.ball} material={m.lava} scale={[0.12, 0.95, 0.95]} />
            </group>
          </group>
        </group>
      ))}
    </>
  );
}
