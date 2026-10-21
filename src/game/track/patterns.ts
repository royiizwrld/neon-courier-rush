import { COIN_SCORE } from "../constants";

export type ObstacleType = "low" | "high" | "block" | "moving";
export type Cell = ObstacleType | null;
export type Row = [Cell, Cell, Cell];

/** Obstacle pool unlocked by difficulty (0..1). */
export function poolFor(difficulty: number): ObstacleType[] {
  if (difficulty < 0.12) return ["low", "block"];
  if (difficulty < 0.35) return ["low", "high", "block"];
  return ["low", "high", "block", "moving"];
}

/**
 * Build one fair row. Guarantees at least one fully open lane, at most one
 * moving vehicle, and (if avoidFreeLane given) an open lane other than it.
 */
export function makeRow(rand: () => number, difficulty: number, avoidFreeLane = -1): Row {
  const pool = poolFor(difficulty);
  for (let tries = 0; tries < 12; tries++) {
    const row: Cell[] = [null, null, null];
    const count = rand() < 0.25 + difficulty * 0.45 ? 2 : 1;
    const lanes = [0, 1, 2];
    for (let i = 2; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    let moving = 0;
    for (let i = 0; i < count; i++) {
      let t = pool[Math.floor(rand() * pool.length)];
      if (t === "moving" && moving++ > 0) t = "block";
      row[lanes[i]] = t;
    }
    const r = row as Row;
    if (isFair(r, avoidFreeLane)) return r;
  }
  return [null, null, null];
}

export function isFair(row: Row, avoidFreeLane = -1): boolean {
  const open = row.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  if (open.length === 0) return false;
  if (row.filter((c) => c === "moving").length > 1) return false;
  if (avoidFreeLane >= 0 && !open.some((i) => i !== avoidFreeLane)) return false;
  return true;
}

/** Minimum distance between rows: grows with speed so reaction time stays constant. */
export function minGap(speed: number): number {
  return speed * 0.85 + 9;
}

export function computeScore(distance: number, coins: number, mult = 1): number {
  return Math.floor(distance * mult) + coins * COIN_SCORE;
}
