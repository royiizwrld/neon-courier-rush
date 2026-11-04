// Tunable config: camera framing per device and the Save Me / gem economy.

export type CamPresetName = "phonePortrait" | "phoneLandscape" | "tablet" | "desktop";
export interface CamPreset {
  fov: number; // base vertical FOV (deg)
  y: number; // camera height
  z: number; // distance behind runner
  lookY: number; // look-at height
  lookZ: number; // look-at depth ahead (negative = ahead)
  followX: number; // how much the camera follows lane changes (0..1)
  speedFov: number; // extra FOV at max speed
}

/** Portrait phones pull back + up with a wider FOV so ~3-4 obstacle rows and all 3 lanes fit. */
export const CAMERA_PRESETS: Record<CamPresetName, CamPreset> = {
  phonePortrait: { fov: 70, y: 5.0, z: 9.6, lookY: 1.0, lookZ: -14, followX: 0.35, speedFov: 8 },
  phoneLandscape: { fov: 54, y: 3.9, z: 8.2, lookY: 1.2, lookZ: -12, followX: 0.45, speedFov: 8 },
  tablet: { fov: 60, y: 4.4, z: 8.6, lookY: 1.1, lookZ: -12, followX: 0.45, speedFov: 10 },
  desktop: { fov: 50, y: 4.0, z: 8.2, lookY: 1.2, lookZ: -10, followX: 0.4, speedFov: 8 },
};

export function pickCamPreset(w: number, h: number): CamPresetName {
  const short = Math.min(w, h);
  const portrait = h >= w;
  if (short < 500) return portrait ? "phonePortrait" : "phoneLandscape";
  if (short < 900 && (w < 1200 || portrait)) return "tablet";
  return "desktop";
}

export const DPR_MAX = 2;
export const DPR_MIN = 1;

// ---- Save Me / gems ----
export const REVIVE_COSTS = [2, 4, 8];
export const MAX_REVIVES = REVIVE_COSTS.length;
export const REVIVE_COUNTDOWN = 5; // seconds to decide
export const REVIVE_INVULN = 3; // seconds
export const REVIVE_CLEAR_AHEAD = 70; // metres of obstacles removed
export const DAILY_FREE_REVIVE = true; // set false to disable the once-a-day free save
export const GEM_SPAWN_CHANCE = 0.004; // per obstacle row ≈ one every few runs
export const GEMS_NEW_TRACK = 1;

/** Cost of the next revive (0 = free), or null when no revives remain. */
export function reviveCost(usedThisRun: number, freeAvailable: boolean): number | null {
  if (usedThisRun >= MAX_REVIVES) return null;
  if (freeAvailable && DAILY_FREE_REVIVE && usedThisRun === 0) return 0;
  return REVIVE_COSTS[usedThisRun]!;
}
