import * as THREE from "three";

/** Which scenery set and obstacle models a biome uses. */
export type BiomeKind = "city" | "forest" | "sewer" | "ice" | "canyon";
export const KINDS: BiomeKind[] = ["city", "forest", "sewer", "ice", "canyon"];

export interface Biome {
  name: string;
  kind: BiomeKind;
  /** emissive strength of curbs / lane lines (neon city glows, forest barely) */
  glow: number;
  sky: THREE.Color; fog: THREE.Color; road: THREE.Color; curb: THREE.Color; line: THREE.Color;
  walk: THREE.Color; ground: THREE.Color; sun: THREE.Color; skyline: THREE.Color;
}
const c = (h: string) => new THREE.Color(h);
const b = (name: string, kind: BiomeKind, glow: number, sky: string, curb: string, line: string, road: string, walk: string, ground: string, sun: string, skyline: string): Biome =>
  ({ name, kind, glow, sky: c(sky), fog: c(sky), road: c(road), curb: c(curb), line: c(line), walk: c(walk), ground: c(ground), sun: c(sun), skyline: c(skyline) });

/** Worlds. Portals cycle through these in order. */
export const BIOMES: Biome[] = [
  b("Neon City", "city", 2, "#120a2a", "#ff3d8b", "#00e5ff", "#3a3c5c", "#1d1b33", "#0e0c22", "#ff4fa0", "#2a0f45"),
  b("Misty Forest", "forest", 0.15, "#5d7a6e", "#5a4430", "#c9b98a", "#8a6a48", "#3f5a2c", "#2f4a24", "#f3e6b0", "#3c5a4a"),
  b("Toxic Sewers", "sewer", 1.2, "#0f1f14", "#3d5a40", "#7dff6a", "#4a5248", "#2a302a", "#18241a", "#7dff6a", "#16261a"),
  b("Frost Caverns", "ice", 0.8, "#1c3a55", "#bfefff", "#ffffff", "#c8e6f5", "#e6f6ff", "#d8eef8", "#e8fbff", "#2a5578"),
  b("Ember Canyon", "canyon", 0.9, "#5a2416", "#7a3a20", "#ff9a3d", "#b8673e", "#8a4a2a", "#7a3a1e", "#ffb347", "#6e2a18"),
];

export const biomeAt = (i: number) => BIOMES[i % BIOMES.length]!;
