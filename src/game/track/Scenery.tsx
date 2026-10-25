import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { DESPAWN_Z } from "../constants";
import { run } from "../runtime";
import { biomeAt, KINDS, type BiomeKind } from "../biomes/biomes";
import { blend } from "../biomes/BiomeSky";

const PER_SIDE = 22;
const SPACING = 8;
const LOOP = PER_SIDE * SPACING;
const SIGN_COLORS = ["#ff3d8b", "#00e5ff", "#ffb020", "#7dff6a"];
const dummy = new THREE.Object3D();

interface Item {
  side: number; outer: boolean; z: number; x: number; w: number; h: number; d: number;
  signY: number; signC: string; r1: number; r2: number; r3: number;
}
/** place() positions `dummy` for item `it` at depth z; return false to hide the instance. */
interface Layer { geo: THREE.BufferGeometry; mat: THREE.Material; colors?: (it: Item) => string; place: (it: Item, z: number, i: number, t: number) => boolean }

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

const std = (color: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, flatShading: true, ...o });

function buildLayers(): Record<BiomeKind, Layer[]> {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  const trunk = new THREE.CylinderGeometry(0.22, 0.38, 1, 7);
  const cone = new THREE.ConeGeometry(1, 1, 7);
  const rock = new THREE.DodecahedronGeometry(1, 0);
  const oct = new THREE.OctahedronGeometry(1, 0);
  const ball = new THREE.SphereGeometry(1, 8, 6);
  const tex = windowTexture();
  const P = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rx = 0, ry = 0, rz = 0) => {
    dummy.position.set(x, y, z); dummy.scale.set(sx, sy, sz); dummy.rotation.set(rx, ry, rz); return true;
  };

  return {
    city: [
      { geo: box, mat: new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: "#ffffff", emissiveIntensity: 0.9, roughness: 0.8 }),
        place: (it, z) => P(it.x, it.h / 2, z, it.w, it.h, it.d) },
      { geo: box, mat: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), colors: (it) => it.signC,
        place: (it, z) => !it.outer && P(it.x - it.side * (it.w / 2 + 0.15), it.signY, z, 0.15, 1.8, 2.6) },
      { geo: box, mat: std("#333", { emissive: "#ffe8b0", emissiveIntensity: 0.4 }),
        place: (it, z) => !it.outer && P(it.side * 5.2, 2.2, z + 3, 0.12, 4.4, 0.12) },
    ],
    forest: [
      { geo: trunk, mat: std("#5a3a22"), place: (it, z) => {
        const h = 3 + it.h * 0.25; return P(it.x - it.side * (it.outer ? 0 : 2), h / 2, z, 1 + it.r1 * 0.5, h, 1 + it.r1 * 0.5);
      } },
      { geo: cone, mat: std("#2f6a34"), place: (it, z) => {
        const h = 3 + it.h * 0.25, s = 2.2 + it.r2 * 1.4;
        return P(it.x - it.side * (it.outer ? 0 : 2), h * 0.75, z, s, h * 0.7, s, 0, it.r3 * 3);
      } },
      { geo: cone, mat: std("#3f8a40"), place: (it, z) => {
        const h = 3 + it.h * 0.25, s = 1.5 + it.r2;
        return P(it.x - it.side * (it.outer ? 0 : 2), h * 1.1, z, s, h * 0.5, s, 0, it.r1 * 3);
      } },
      { geo: rock, mat: std("#6e7468"), place: (it, z, i) =>
        !it.outer && i % 3 === 0 && P(it.side * (6 + it.r3 * 1.5), 0.3, z + 2, 0.6 + it.r1 * 0.7, 0.5 + it.r2 * 0.5, 0.7 + it.r3 * 0.6, it.r1, it.r2) },
      { geo: cone, mat: std("#4f9a3a"), place: (it, z) => // ferns
        !it.outer && P(it.side * (5.3 + it.r2), 0.35, z - 3, 0.6, 0.7, 0.6, 0, it.r3 * 4) },
      { geo: ball, mat: new THREE.MeshBasicMaterial({ color: "#fff3a0", toneMapped: false }), place: (it, z, i, t) => // fireflies
        i % 2 === 0 && P(it.side * (4.6 + it.r1 * 3), 1.2 + Math.sin(t * 1.5 + i) * 0.6 + it.r2 * 2, z + Math.cos(t + i) * 1.5, 0.07, 0.07, 0.07) },
    ],
    sewer: [
      { geo: box, mat: std("#3a4438", { roughness: 0.6, metalness: 0.2 }), place: (it, z) => // tunnel walls
        P(it.side * (it.outer ? 9.5 : 7.4), 4.5, z, 1, 9, SPACING + 0.05) },
      { geo: box, mat: std("#2c352b"), place: (it, z) => // curved shoulder wall tops
        P(it.side * (it.outer ? 7.6 : 5.6), 8.7, z, 4, 1, SPACING + 0.05, 0, 0, it.side * 0.45) },
      { geo: cyl, mat: std("#5f6e58", { metalness: 0.6, roughness: 0.4 }), place: (it, z) => // long pipes
        !it.outer && P(it.side * 6.5, 1.3 + (it.r1 > 0.5 ? 1.6 : 0), z, 0.7, SPACING + 0.05, 0.7, Math.PI / 2) },
      { geo: cyl, mat: std("#7a4a2a", { metalness: 0.5, roughness: 0.5 }), place: (it, z) => // rusty thin pipe
        !it.outer && P(it.side * 6.85, 4.6, z, 0.35, SPACING + 0.05, 0.35, Math.PI / 2) },
      { geo: box, mat: std("#2a2f28"), place: (it, z, i) => // arches over the road
        !it.outer && it.side < 0 && i % 6 === 0 && P(0, 8.6, z, 15, 1.2, 1.2) },
      { geo: box, mat: new THREE.MeshBasicMaterial({ color: "#6cff4a", toneMapped: false }), place: (it, z) => // glowing sludge channel
        !it.outer && P(it.side * 5.6, 0.08, z, 1.1, 0.05, SPACING + 0.05) },
      { geo: box, mat: new THREE.MeshBasicMaterial({ color: "#c8ff9a", toneMapped: false }), place: (it, z, i) => // wall lamps
        !it.outer && i % 2 === 0 && P(it.side * 6.85, 6.4, z, 0.15, 0.4, 0.8) },
    ],
    ice: [
      { geo: oct, mat: std("#9fe6ff", { emissive: "#4fc8ff", emissiveIntensity: 0.6, transparent: true, opacity: 0.85, roughness: 0.15, metalness: 0.1 }),
        place: (it, z) => P(it.x, it.h * 0.3, z, it.w * 0.35, it.h * 0.6, it.w * 0.35, 0, it.r1 * 3, it.side * (0.1 + it.r2 * 0.25)) },
      { geo: oct, mat: std("#d8f4ff", { emissive: "#8fe0ff", emissiveIntensity: 0.4, roughness: 0.2 }),
        place: (it, z) => P(it.x - it.side * 2.2, 1.2, z + 3, 0.6 + it.r3, 1.5 + it.r1 * 2, 0.6 + it.r3, 0, it.r2 * 3, -it.side * 0.3) },
      { geo: ball, mat: std("#f2fbff", { roughness: 1 }), place: (it, z) => // snow banks
        !it.outer && P(it.side * 6.2, 0, z, 1.8 + it.r1, 0.6 + it.r2 * 0.4, 3.5) },
      { geo: cone, mat: std("#bfeeff", { emissive: "#6fd8ff", emissiveIntensity: 0.5 }), place: (it, z, i) => // ceiling stalactites
        !it.outer && i % 2 === 0 && P(it.side * (5 + it.r3 * 3), 9 - it.r1, z, 0.5, 2.5 + it.r2 * 2, 0.5, Math.PI) },
      { geo: box, mat: std("#1c3550"), place: (it, z) => // cavern walls far out
        it.outer && P(it.side * 15, 6, z, 2, 14, SPACING + 0.05) },
    ],
    canyon: [
      { geo: rock, mat: std("#a84a2a"), place: (it, z) => // big cliffs
        P(it.x + it.side * (it.outer ? 2 : 3), it.h * 0.45, z, it.w * (it.outer ? 1.6 : 1.1), it.h * 0.8 + 4, it.d * 1.1, 0, it.r1 * 3) },
      { geo: rock, mat: std("#c8683a"), place: (it, z) => // lighter strata at the base
        P(it.x + it.side * 2, 1.4, z + 2, it.w * 1.2, 2.2, it.d, 0, it.r2 * 3) },
      { geo: box, mat: std("#8a3a20"), place: (it, z, i) => // rock pillars near road
        !it.outer && i % 3 === 1 && P(it.side * (6.6 + it.r3), 2 + it.r1, z, 1.2, 4 + it.r1 * 2, 1.2, 0, it.r2) },
      { geo: cyl, mat: std("#4f8a3a"), place: (it, z, i) => // cacti
        !it.outer && i % 4 === 0 && P(it.side * (5.6 + it.r2), 1, z - 2, 0.45, 2, 0.45) },
      { geo: cyl, mat: std("#4f8a3a"), place: (it, z, i) => // cactus arm
        !it.outer && i % 4 === 0 && P(it.side * (5.6 + it.r2) + 0.35, 1.3, z - 2, 0.25, 0.9, 0.25, 0, 0, -0.9) },
      { geo: box, mat: new THREE.MeshBasicMaterial({ color: "#ff7a2a", toneMapped: false }), place: (it, z, i) => // glowing cracks
        !it.outer && i % 2 === 1 && P(it.side * 5.4, 0.03, z, 0.15, 0.04, 4 + it.r1 * 3, 0, it.r2 - 0.5) },
    ],
  } satisfies Record<BiomeKind, Layer[]>;
}

/** Per-world instanced scenery on both sides; only the current world's set is visible and updated. */
export function Scenery() {
  const groups = useRef<Partial<Record<BiomeKind, THREE.Group | null>>>({});
  const meshes = useRef<Partial<Record<BiomeKind, (THREE.InstancedMesh | null)[]>>>({});
  const data = useMemo(() => {
    const items: Item[] = [];
    for (let i = 0; i < PER_SIDE * 4; i++) {
      const side = i % 2 ? 1 : -1;
      const outer = i >= PER_SIDE * 2;
      items.push({
        side, outer, z: -Math.floor((i % (PER_SIDE * 2)) / 2) * SPACING - (outer ? SPACING / 2 : 0),
        x: side * (outer ? 19 + Math.random() * 6 : 9 + Math.random() * 3),
        w: 5 + Math.random() * 3, h: 8 + Math.random() * 22, d: 6 + Math.random() * 2,
        signY: 3 + Math.random() * 5, signC: SIGN_COLORS[Math.floor(Math.random() * 4)]!,
        r1: Math.random(), r2: Math.random(), r3: Math.random(),
      });
    }
    const gMat = new THREE.MeshStandardMaterial({ color: "#0e0c22", roughness: 0.9 });
    const skyM = new THREE.MeshBasicMaterial({ color: "#2a0f45", fog: false });
    const sunM = new THREE.MeshBasicMaterial({ color: "#ff4fa0", fog: false });
    return { items, layers: buildLayers(), gMat, skyM, sunM };
  }, []);

  useFrame((state, dt) => {
    const bi = biomeAt(run.biome);
    blend(data.gMat.color, bi.ground, dt); blend(data.skyM.color, bi.skyline, dt); blend(data.sunM.color, bi.sun, dt);
    for (const k of KINDS) { const g = groups.current[k]; if (g) g.visible = k === bi.kind; }
    const list = meshes.current[bi.kind];
    if (!list) return;
    const t = state.clock.elapsedTime;
    const off = run.distance;
    data.layers[bi.kind].forEach((layer, li) => {
      const m = list[li];
      if (!m) return;
      data.items.forEach((it, i) => {
        let z = (it.z + off) % LOOP;
        if (z > DESPAWN_Z) z -= LOOP;
        if (!layer.place(it, z, i, t)) { dummy.scale.set(0, 0, 0); }
        dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    });
  });

  const n = data.items.length;
  return (
    <>
      {KINDS.map((k) => (
        <group key={k} ref={(el) => { groups.current[k] = el; }} visible={k === "city"}>
          {data.layers[k].map((layer, li) => (
            <instancedMesh
              key={li}
              args={[layer.geo, layer.mat, n]}
              frustumCulled={false}
              ref={(el) => {
                (meshes.current[k] ??= [])[li] = el;
                if (el && layer.colors && !el.instanceColor) {
                  data.items.forEach((it, i) => el.setColorAt(i, new THREE.Color(layer.colors!(it))));
                  layer.mat.needsUpdate = true;
                }
              }}
            />
          ))}
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, -70]} material={data.gMat}>
        <planeGeometry args={[220, 200]} />
      </mesh>
      <mesh position={[0, 18, -160]} material={data.skyM}>
        <planeGeometry args={[700, 80]} />
      </mesh>
      <mesh position={[0, 30, -159]} material={data.sunM}>
        <circleGeometry args={[14, 32]} />
      </mesh>
    </>
  );
}
