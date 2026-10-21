import { SAFE_START, START_SPEED } from "./constants";
import type { ObstacleType } from "./track/patterns";

export type Action = "left" | "right" | "up" | "down";
export interface Obs { active: boolean; type: ObstacleType; lane: number; z: number; vz: number }
export interface Coin { active: boolean; x: number; y: number; z: number; pick: number }

/** Mutable per-frame run state. Lives outside React to avoid re-renders. */
export const run = {
  distance: 0, speed: START_SPEED, time: 0, coins: 0,
  lane: 0, x: 0, y: 0, vy: 0, grounded: true, slide: 0, slideQueued: false,
  jumpBuffer: 0, lean: 0, crashT: 0, crashed: false,
  nextRowZ: -SAFE_START, movingLane: -1, movingRows: 0,
  queue: [] as Action[],
  obstacles: Array.from({ length: 36 }, (): Obs => ({ active: false, type: "low", lane: 0, z: 0, vz: 0 })),
  coinPool: Array.from({ length: 160 }, (): Coin => ({ active: false, x: 0, y: 0, z: 0, pick: 0 })),
};

export function resetRun() {
  Object.assign(run, {
    distance: 0, speed: START_SPEED, time: 0, coins: 0, lane: 0, x: 0, y: 0, vy: 0,
    grounded: true, slide: 0, slideQueued: false, jumpBuffer: 0, lean: 0, crashT: 0,
    crashed: false, nextRowZ: -SAFE_START, movingLane: -1, movingRows: 0,
  });
  run.queue.length = 0;
  for (const o of run.obstacles) o.active = false;
  for (const c of run.coinPool) { c.active = false; c.pick = 0; }
}
