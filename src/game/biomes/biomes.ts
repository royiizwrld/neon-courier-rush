import * as THREE from "three";

export interface Biome {
  name: string;
  sky: THREE.Color; fog: THREE.Color; road: THREE.Color; curb: THREE.Color; line: THREE.Color;
  building: THREE.Color; ground: THREE.Color; sun: THREE.Color; skyline: THREE.Color;
}
const c = (h: string) => new THREE.Color(h);
const b = (name: string, sky: string, curb: string, line: string, building: string, ground: string, sun: string, skyline: string, road = "#ffffff"): Biome =>
  ({ name, sky: c(sky), fog: c(sky), road: c(road), curb: c(curb), line: c(line), building: c(building), ground: c(ground), sun: c(sun), skyline: c(skyline) });

/** Visual themes. Portals cycle through these in order. */
export const BIOMES: Biome[] = [
  b("Neon City", "#120a2a", "#ff3d8b", "#00e5ff", "#ffffff", "#0e0c22", "#ff4fa0", "#2a0f45"),
  b("Sunset Docks", "#3a1530", "#ff8a3d", "#ffd23d", "#ffb08a", "#20121c", "#ffb347", "#6a2340", "#ffd9c0"),
  b("Frost Grid", "#0a2236", "#7fe9ff", "#ffffff", "#a8e6ff", "#0c1e2c", "#d8f6ff", "#1a4a6a", "#cfeeff"),
  b("Toxic Sector", "#0d1f0d", "#7dff6a", "#d4ff3d", "#9dff8a", "#0a160a", "#b6ff3d", "#1d3d16", "#d8ffd0"),
  b("Ember Rail", "#240808", "#ff4a1d", "#ffb020", "#ff9a6a", "#1a0806", "#ff6a2a", "#4a1208", "#ffc8b0"),
];

export const biomeAt = (i: number) => BIOMES[i % BIOMES.length]!;
