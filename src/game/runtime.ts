import { SAFE_START, START_SPEED } from "./constants";
import type { ObstacleType } from "./track/patterns";

export type Action = "left" | "right" | "up" | "down";
export type PowerType = "magnet" | "x2" | "shield" | "jet";
export interface Obs { active: boolean; type: ObstacleType; lane: number; z: number; vz: number }
export interface Coin { active: boolean; x: number; y: number; z: number; pick: number }
export interface Pickup { active: boolean; type: PowerType; x: number; z: number; pick: number }

export const FIRST_PORTAL = 380;

/** Mutable per-frame run state. Lives outside React to avoid re-renders. */
export const run = {
  distance: 0, speed: START_SPEED, time: 0, coins: 0, scoreDist: 0,
  lane: 0, x: 0, y: 0, vy: 0, grounded: true, slide: 0, slideQueued: false,
  jumpBuffer: 0, lean: 0, crashT: 0, crashed: false, invuln: 0,
  nextRowZ: -SAFE_START, movingLane: -1, movingRows: 0,
  // biomes & portals
  biome: 0, nextPortal: FIRST_PORTAL, warp: 0,
  // power-up timers (seconds left); shield is a single charge
  magnet: 0, x2: 0, jet: 0, shield: false,
  queue: [] as Action[],
  obstacles: Array.from({ length: 48 }, (): Obs => ({ active: false, type: "low", lane: 0, z: 0, vz: 0 })),
  coinPool: Array.from({ length: 200 }, (): Coin => ({ active: false, x: 0, y: 0, z: 0, pick: 0 })),
  pickups: Array.from({ length: 6 }, (): Pickup => ({ active: false, type: "magnet", x: 0, z: 0, pick: 0 })),
};

export function resetRun() {
  Object.assign(run, {
    distance: 0, speed: START_SPEED, time: 0, coins: 0, scoreDist: 0, lane: 0, x: 0, y: 0, vy: 0,
    grounded: true, slide: 0, slideQueued: false, jumpBuffer: 0, lean: 0, crashT: 0,
    crashed: false, invuln: 0, nextRowZ: -SAFE_START, movingLane: -1, movingRows: 0,
    biome: 0, nextPortal: FIRST_PORTAL, warp: 0, magnet: 0, x2: 0, jet: 0, shield: false,
  });
  run.queue.length = 0;
  for (const o of run.obstacles) o.active = false;
  for (const c of run.coinPool) { c.active = false; c.pick = 0; }
  for (const p of run.pickups) { p.active = false; p.pick = 0; }
}
