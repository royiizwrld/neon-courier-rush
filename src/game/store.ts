import { create } from "zustand";
import { resetRun, reviveRun, run } from "./runtime";
import { DAILY_FREE_REVIVE, GEMS_NEW_TRACK, reviveCost } from "./config";

export type Phase = "start" | "playing" | "paused" | "saveme" | "reviving" | "over";

interface GameState {
  phase: Phase; score: number; coins: number; best: number; totalCoins: number;
  newBest: boolean; fps: number; debug: boolean;
  gems: number; runGems: number; revivesThisRun: number; totalRevives: number; freeReviveDate: string;
  discovered: number[]; reviveKey: number;
  powers: { magnet: number; x2: number; jet: number; shield: boolean }; toast: string; toastKey: number;
  setPowers: (p: GameState["powers"]) => void; showToast: (t: string) => void;
  load: () => void; start: () => void; pause: () => void; resume: () => void;
  end: (score: number, coins: number) => void; home: () => void;
  offerSave: (score: number, coins: number) => void; nextCost: () => number | null;
  revive: () => boolean; declineSave: () => void; finishRevive: () => void;
  addGems: (n: number) => void; discover: (biome: number) => boolean;
  setHud: (score: number, coins: number) => void; setFps: (f: number) => void; toggleDebug: () => void;
}

const KEY = "neon-courier:v1";
const today = () => new Date().toISOString().slice(0, 10);

function save(s: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      best: s.best, totalCoins: s.totalCoins, gems: s.gems, totalRevives: s.totalRevives,
      freeReviveDate: s.freeReviveDate, discovered: s.discovered,
    }));
  } catch { /* ignore */ }
}

export const useGame = create<GameState>((set, get) => ({
  phase: "start", score: 0, coins: 0, best: 0, totalCoins: 0, newBest: false, fps: 0, debug: false,
  gems: 0, runGems: 0, revivesThisRun: 0, totalRevives: 0, freeReviveDate: "", discovered: [0], reviveKey: 0,
  powers: { magnet: 0, x2: 0, jet: 0, shield: false }, toast: "", toastKey: 0,
  setPowers: (powers) => set({ powers }),
  showToast: (toast) => set({ toast, toastKey: get().toastKey + 1 }),
  load: () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      set({
        best: d.best ?? 0, totalCoins: d.totalCoins ?? 0, gems: d.gems ?? 0, totalRevives: d.totalRevives ?? 0,
        freeReviveDate: d.freeReviveDate ?? "", discovered: Array.isArray(d.discovered) ? d.discovered : [0],
      });
    } catch { /* ignore */ }
  },
  start: () => {
    resetRun();
    set({ phase: "playing", score: 0, coins: 0, runGems: 0, revivesThisRun: 0, newBest: false, powers: { magnet: 0, x2: 0, jet: 0, shield: false } });
    get().showToast("Neon City");
  },
  pause: () => get().phase === "playing" && set({ phase: "paused" }),
  resume: () => get().phase === "paused" && set({ phase: "reviving", reviveKey: get().reviveKey + 1 }),
  nextCost: () => {
    const s = get();
    return reviveCost(s.revivesThisRun, DAILY_FREE_REVIVE && s.freeReviveDate !== today());
  },
  offerSave: (score, coins) => {
    if (get().nextCost() === null) { get().end(score, coins); return; }
    set({ phase: "saveme", score, coins });
  },
  revive: () => {
    const s = get();
    const cost = s.nextCost();
    if (cost === null || s.gems < cost) return false;
    const freeUsed = cost === 0;
    set({
      gems: s.gems - cost, revivesThisRun: s.revivesThisRun + 1, totalRevives: s.totalRevives + 1,
      freeReviveDate: freeUsed ? today() : s.freeReviveDate, phase: "reviving", reviveKey: s.reviveKey + 1,
    });
    save(get());
    reviveRun();
    return true;
  },
  declineSave: () => { const s = get(); s.end(s.score, s.coins); },
  finishRevive: () => get().phase === "reviving" && set({ phase: "playing" }),
  addGems: (n) => { set({ gems: get().gems + n, runGems: get().runGems + n }); save(get()); },
  discover: (biome) => {
    const s = get();
    if (s.discovered.includes(biome)) return false;
    set({ discovered: [...s.discovered, biome] });
    s.addGems(GEMS_NEW_TRACK);
    return true;
  },
  end: (score, coins) => {
    const s = get();
    const nb = Math.max(s.best, score);
    set({ phase: "over", score, coins, best: nb, totalCoins: s.totalCoins + coins, newBest: score > s.best });
    save(get());
  },
  home: () => { resetRun(); set({ phase: "start" }); },
  setHud: (score, coins) => set({ score, coins }),
  setFps: (fps) => set({ fps }),
  toggleDebug: () => set({ debug: !get().debug }),
}));

// keep `run` referenced for tree-shaking clarity in dev tools
void run;
