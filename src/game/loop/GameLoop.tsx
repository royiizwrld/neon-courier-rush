import { useFrame } from "@react-three/fiber";
import {
  ACCEL, DESPAWN_Z, FAST_DROP_V, GRAVITY, JUMP_BUFFER, JUMP_V, LANE_EASE, LANE_W,
  MAX_SPEED, SLIDE_TIME, SPAWN_Z, START_SPEED,
} from "../constants";
import { run } from "../runtime";
import { useGame } from "../store";
import { computeScore, makeRow, minGap, type Row } from "../track/patterns";
import { hitsObstacle } from "../collision/collision";

let fpsAcc = 0, fpsFrames = 0, hudAcc = 0;

function spawnObstacle(type: Row[number], lane: number, z: number) {
  if (!type) return;
  const o = run.obstacles.find((x) => !x.active);
  if (!o) return;
  o.active = true; o.type = type; o.lane = lane; o.z = type === "moving" ? z - 25 : z;
  o.vz = type === "moving" ? 9 : 0;
}
function spawnCoin(x: number, y: number, z: number) {
  const c = run.coinPool.find((k) => !k.active);
  if (!c) return;
  c.active = true; c.x = x; c.y = y; c.z = z; c.pick = 0;
}

function spawnRow(z: number) {
  const difficulty = Math.min(1, Math.max(0, (run.time - 15) / 90) + run.distance / 4000);
  const avoid = run.movingRows > 0 ? run.movingLane : -1;
  const row = makeRow(Math.random, difficulty, avoid);
  if (run.movingRows > 0) run.movingRows--;
  row.forEach((t, i) => {
    spawnObstacle(t, i - 1, z);
    if (t === "moving") { run.movingLane = i; run.movingRows = 2; }
  });
  // coins
  const open = row.map((c, i) => (c === null && i !== avoid ? i : -1)).filter((i) => i >= 0);
  const lowLane = row.indexOf("low");
  if (lowLane >= 0 && Math.random() < 0.4) {
    for (let k = 0; k < 5; k++) spawnCoin((lowLane - 1) * LANE_W, 0.7 + Math.sin((k / 4) * Math.PI) * 1.2, z + 4 - k * 2);
  } else if (open.length && Math.random() < 0.75) {
    const lane = open[Math.floor(Math.random() * open.length)] - 1;
    const n = 4 + Math.floor(Math.random() * 4);
    for (let k = 0; k < n; k++) spawnCoin(lane * LANE_W, 0.7, z - 4 - k * 2.4);
  }
}

export function GameLoop() {
  useFrame((_, raw) => {
    const g = useGame.getState();
    fpsAcc += raw; fpsFrames++;
    if (fpsAcc > 0.5) { if (g.debug) g.setFps(Math.round(fpsFrames / fpsAcc)); fpsAcc = 0; fpsFrames = 0; }
    if (g.phase !== "playing") return;
    const dt = Math.min(raw, 0.05);

    if (run.crashed) {
      run.crashT -= dt;
      run.speed *= Math.exp(-8 * dt);
      if (run.crashT <= 0) g.end(computeScore(run.distance, run.coins), run.coins);
      return;
    }

    run.time += dt;
    run.speed = Math.min(MAX_SPEED, START_SPEED + run.time * ACCEL);
    const move = run.speed * dt;
    run.distance += move;

    // input
    while (run.queue.length) {
      const a = run.queue.shift()!;
      if (a === "left") run.lane = Math.max(-1, run.lane - 1);
      else if (a === "right") run.lane = Math.min(1, run.lane + 1);
      else if (a === "up") {
        if (run.grounded) { run.vy = JUMP_V; run.grounded = false; run.slide = 0; }
        else run.jumpBuffer = JUMP_BUFFER;
      } else if (a === "down") {
        if (!run.grounded) { run.vy = Math.min(run.vy, FAST_DROP_V); run.slideQueued = true; }
        else run.slide = SLIDE_TIME;
      }
    }

    // player physics
    if (!run.grounded) {
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
      run.nextRowZ -= minGap(run.speed) * (1 + Math.random() * 0.5);
    }

    // obstacles
    const sliding = run.slide > 0;
    for (const o of run.obstacles) {
      if (!o.active) continue;
      o.z += move + o.vz * dt;
      if (o.z > DESPAWN_Z) { o.active = false; continue; }
      if (hitsObstacle(run.x, run.y, sliding, o.type, o.lane, o.z)) {
        run.crashed = true; run.crashT = 0.8;
        if (navigator.vibrate) navigator.vibrate(120);
      }
    }
    // coins
    const py = run.y + (sliding ? 0.4 : 0.8);
    for (const c of run.coinPool) {
      if (!c.active) continue;
      c.z += move;
      if (c.pick > 0) { c.pick += dt; if (c.pick > 0.35) c.active = false; continue; }
      if (c.z > DESPAWN_Z) { c.active = false; continue; }
      if (Math.abs(c.z) < 0.8 && Math.abs(c.x - run.x) < 0.9 && Math.abs(c.y - py) < 1.1) {
        c.pick = 0.0001; run.coins++;
      }
    }

    hudAcc += dt;
    if (hudAcc > 0.1) { hudAcc = 0; g.setHud(computeScore(run.distance, run.coins), run.coins); }
  });
  return null;
}
