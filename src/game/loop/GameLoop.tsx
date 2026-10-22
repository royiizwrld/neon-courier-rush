import { useFrame } from "@react-three/fiber";
import {
  ACCEL, DESPAWN_Z, FAST_DROP_V, GRAVITY, JUMP_BUFFER, JUMP_V, LANE_EASE, LANE_W,
  MAX_SPEED, SLIDE_TIME, SPAWN_Z, START_SPEED,
} from "../constants";
import { run, type PowerType } from "../runtime";
import { useGame } from "../store";
import { computeScore, makeRow, minGap, type Row } from "../track/patterns";
import { hitsObstacle } from "../collision/collision";
import { biomeAt } from "../biomes/biomes";

export const POWER_TIME: Record<PowerType, number> = { magnet: 10, x2: 12, jet: 6, shield: 0 };
export const JET_Y = 6;
const PORTAL_CLEAR = 30; // metres kept free of obstacles around a portal
const POWERS: PowerType[] = ["magnet", "x2", "shield", "jet"];

let fpsAcc = 0, fpsFrames = 0, hudAcc = 0, sinceJetCoin = 0;

function spawnObstacle(type: Row[number], lane: number, z: number) {
  if (!type) return;
  const o = run.obstacles.find((x) => !x.active);
  if (!o) return;
  o.active = true; o.type = type; o.lane = lane; o.z = type === "moving" ? z - 25 : z;
  o.vz = type === "moving" ? 9 + run.speed * 0.15 : 0;
}
function spawnCoin(x: number, y: number, z: number) {
  const c = run.coinPool.find((k) => !k.active);
  if (!c) return;
  c.active = true; c.x = x; c.y = y; c.z = z; c.pick = 0;
}
function spawnPickup(lane: number, z: number) {
  const p = run.pickups.find((k) => !k.active);
  if (!p) return;
  p.active = true; p.pick = 0; p.x = lane * LANE_W; p.z = z;
  p.type = POWERS[Math.floor(Math.random() * POWERS.length)]!;
}

/** Distance (m, negative = ahead) of the next portal relative to the player. */
export const portalZ = () => run.distance - run.nextPortal;

function spawnRow(z: number) {
  // keep the area around a portal clear so the gate is always reachable
  const portalAt = portalZ() + (z - 0) * -1 * -1; // portal z in world space
  if (Math.abs(z - portalAt) < PORTAL_CLEAR) return;

  const difficulty = Math.min(1, Math.max(0, (run.time - 5) / 60) + run.distance / 2500);
  const avoid = run.movingRows > 0 ? run.movingLane : -1;
  const row = makeRow(Math.random, difficulty, avoid);
  if (run.movingRows > 0) run.movingRows--;
  row.forEach((t, i) => {
    spawnObstacle(t, i - 1, z);
    if (t === "moving") { run.movingLane = i; run.movingRows = 2; }
  });
  const open = row.map((c, i) => (c === null && i !== avoid ? i : -1)).filter((i) => i >= 0);
  // power-up: about 1 in 14 rows, in an open lane
  if (open.length && Math.random() < 0.07 && !run.pickups.some((p) => p.active)) {
    spawnPickup((open[Math.floor(Math.random() * open.length)] ?? 1) - 1, z - 6);
    return;
  }
  const lowLane = row.indexOf("low");
  if (lowLane >= 0 && Math.random() < 0.45) {
    for (let k = 0; k < 5; k++) spawnCoin((lowLane - 1) * LANE_W, 0.7 + Math.sin((k / 4) * Math.PI) * 1.2, z + 4 - k * 2);
  } else if (open.length && Math.random() < 0.8) {
    const lane = (open[Math.floor(Math.random() * open.length)] ?? 1) - 1;
    const n = 5 + Math.floor(Math.random() * 5);
    for (let k = 0; k < n; k++) spawnCoin(lane * LANE_W, 0.7, z - 4 - k * 2.4);
  }
}

function crash() {
  if (run.invuln > 0 || run.jet > 0) return;
  if (run.shield) {
    run.shield = false; run.invuln = 1.2;
    if (navigator.vibrate) navigator.vibrate(60);
    return;
  }
  run.crashed = true; run.crashT = 0.8;
  if (navigator.vibrate) navigator.vibrate(120);
}

export function GameLoop() {
  useFrame((_, raw) => {
    const g = useGame.getState();
    fpsAcc += raw; fpsFrames++;
    if (fpsAcc > 0.5) { if (g.debug) g.setFps(Math.round(fpsFrames / fpsAcc)); fpsAcc = 0; fpsFrames = 0; }
    if (run.warp > 0) run.warp = Math.max(0, run.warp - Math.min(raw, 0.05));
    if (g.phase !== "playing") return;
    const dt = Math.min(raw, 0.05);

    if (run.crashed) {
      run.crashT -= dt;
      run.speed *= Math.exp(-8 * dt);
      if (run.crashT <= 0) g.end(computeScore(run.scoreDist, run.coins), run.coins);
      return;
    }

    run.time += dt;
    run.speed = Math.min(MAX_SPEED, START_SPEED + run.time * ACCEL);
    const move = run.speed * dt;
    run.distance += move;
    run.scoreDist += move * (run.x2 > 0 ? 2 : 1);
    if (run.invuln > 0) run.invuln -= dt;

    // power-up timers
    if (run.magnet > 0) run.magnet -= dt;
    if (run.x2 > 0) run.x2 -= dt;
    if (run.jet > 0) {
      run.jet -= dt;
      if (run.jet <= 0) { run.grounded = false; run.vy = 0; run.invuln = 1; }
    }

    // portals
    if (run.distance >= run.nextPortal) {
      run.biome++;
      run.warp = 0.9;
      run.nextPortal += 400 + Math.random() * 300;
      g.showToast(biomeAt(run.biome).name);
      for (const o of run.obstacles) if (o.z > -40) o.active = false;
    }

    // input
    while (run.queue.length) {
      const a = run.queue.shift()!;
      if (a === "left") run.lane = Math.max(-1, run.lane - 1);
      else if (a === "right") run.lane = Math.min(1, run.lane + 1);
      else if (run.jet > 0) continue;
      else if (a === "up") {
        if (run.grounded) { run.vy = JUMP_V; run.grounded = false; run.slide = 0; }
        else run.jumpBuffer = JUMP_BUFFER;
      } else if (a === "down") {
        if (!run.grounded) { run.vy = Math.min(run.vy, FAST_DROP_V); run.slideQueued = true; }
        else run.slide = SLIDE_TIME;
      }
    }

    // player physics
    if (run.jet > 0) {
      run.y += (JET_Y - run.y) * (1 - Math.exp(-4 * dt));
      run.vy = 0; run.grounded = false; run.slide = 0;
      sinceJetCoin += move;
      if (sinceJetCoin > 2.6) { sinceJetCoin = 0; spawnCoin(run.lane * LANE_W, JET_Y + 0.6, SPAWN_Z * 0.35); }
    } else if (!run.grounded) {
      run.vy -= GRAVITY * dt;
      run.y += run.vy * dt;
      run.jumpBuffer -= dt;
      if (run.y <= 0) {
        run.y = 0; run.vy = 0; run.grounded = true;
        if (run.jumpBuffer > 0) { run.vy = JUMP_V; run.grounded = false; run.jumpBuffer = 0; }
        else if (run.slideQueued) run.slide = SLIDE_TIME;
        run.slideQueued = false;
      }
    }
    if (run.slide > 0) run.slide -= dt;
    const tx = run.lane * LANE_W;
    const prevX = run.x;
    run.x += (tx - run.x) * (1 - Math.exp(-LANE_EASE * dt));
    run.lean = (run.x - prevX) / Math.max(dt, 1e-4) * 0.04;

    // spawning
    run.nextRowZ += move;
    while (run.nextRowZ > SPAWN_Z) {
      spawnRow(run.nextRowZ);
      run.nextRowZ -= minGap(run.speed) * (1 + Math.random() * 0.4);
    }

    // obstacles
    const sliding = run.slide > 0;
    for (const o of run.obstacles) {
      if (!o.active) continue;
      o.z += move + o.vz * dt;
      if (o.z > DESPAWN_Z) { o.active = false; continue; }
      if (hitsObstacle(run.x, run.y, sliding, o.type, o.lane, o.z)) crash();
    }
    // coins (+ magnet pull)
    const py = run.y + (sliding ? 0.4 : 0.8);
    const pull = 1 - Math.exp(-10 * dt);
    for (const c of run.coinPool) {
      if (!c.active) continue;
      c.z += move;
      if (c.pick > 0) { c.pick += dt; if (c.pick > 0.35) c.active = false; continue; }
      if (c.z > DESPAWN_Z) { c.active = false; continue; }
      if (run.magnet > 0 && c.z > -22 && c.z < 2) {
        c.x += (run.x - c.x) * pull; c.y += (py - c.y) * pull; c.z += (0 - c.z) * pull * 0.5;
      }
      if (Math.abs(c.z) < 0.9 && Math.abs(c.x - run.x) < 0.9 && Math.abs(c.y - py) < 1.2) {
        c.pick = 0.0001; run.coins++;
      }
    }
    // power-ups
    for (const p of run.pickups) {
      if (!p.active) continue;
      p.z += move;
      if (p.pick > 0) { p.pick += dt; if (p.pick > 0.4) p.active = false; continue; }
      if (p.z > DESPAWN_Z) { p.active = false; continue; }
      if (Math.abs(p.z) < 1 && Math.abs(p.x - run.x) < 1 && run.y < 2.5) {
        p.pick = 0.0001;
        if (p.type === "shield") run.shield = true;
        else run[p.type] = POWER_TIME[p.type];
        if (p.type === "jet") sinceJetCoin = 0;
      }
    }

    hudAcc += dt;
    if (hudAcc > 0.1) {
      hudAcc = 0;
      g.setHud(computeScore(run.scoreDist, run.coins), run.coins);
      g.setPowers({ magnet: Math.max(0, run.magnet), x2: Math.max(0, run.x2), jet: Math.max(0, run.jet), shield: run.shield });
    }
  });
  return null;
}
