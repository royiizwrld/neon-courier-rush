import { LANE_W } from "../constants";
import type { ObstacleType } from "../track/patterns";

/** Obstacle boxes: [yMin, yMax, halfDepth]. Half width is shared. */
export const OBSTACLE_BOX: Record<ObstacleType, [number, number, number]> = {
  low: [0, 0.75, 0.35],
  high: [1.15, 2.7, 0.3],
  block: [0, 2.4, 2.2],
  moving: [0, 2.0, 2.0],
};
const OBS_HALF_W = 0.9;
const MARGIN = 0.12; // forgiving

export function hitsObstacle(
  px: number, py: number, sliding: boolean,
  type: ObstacleType, lane: number, z: number,
): boolean {
  const [y0, y1, hd] = OBSTACLE_BOX[type];
  const ph = sliding ? 0.8 : 1.6;
  const ox = lane * LANE_W;
  if (Math.abs(px - ox) > OBS_HALF_W + 0.35 - MARGIN) return false;
  if (Math.abs(z) > hd + 0.3 - MARGIN) return false;
  return py + MARGIN < y1 && py + ph - MARGIN > y0;
}
