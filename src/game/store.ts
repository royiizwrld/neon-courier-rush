import { create } from "zustand";
import { resetRun } from "./runtime";

export type Phase = "start" | "playing" | "paused" | "over";

interface GameState {
  phase: Phase; score: number; coins: number; best: number; totalCoins: number;
  newBest: boolean; fps: number; debug: boolean;
  load: () => void; start: () => void; pause: () => void; resume: () => void;
  end: (score: number, coins: number) => void; home: () => void;
  setHud: (score: number, coins: number) => void; setFps: (f: number) => void; toggleDebug: () => void;
}

const KEY = "neon-courier:v1";
function save(best: number, totalCoins: number) {
  try { localStorage.setItem(KEY, JSON.stringify({ best, totalCoins })); } catch { /* ignore */ }
}

export const useGame = create<GameState>((set, get) => ({
  phase: "start", score: 0, coins: 0, best: 0, totalCoins: 0, newBest: false, fps: 0, debug: false,
  load: () => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      set({ best: d.best ?? 0, totalCoins: d.totalCoins ?? 0 });
    } catch { /* ignore */ }
  },
  start: () => { resetRun(); set({ phase: "playing", score: 0, coins: 0, newBest: false }); },
  pause: () => get().phase === "playing" && set({ phase: "paused" }),
  resume: () => get().phase === "paused" && set({ phase: "playing" }),
  end: (score, coins) => {
    const { best, totalCoins } = get();
    const nb = Math.max(best, score);
    const tc = totalCoins + coins;
    save(nb, tc);
    set({ phase: "over", score, coins, best: nb, totalCoins: tc, newBest: score > best });
  },
  home: () => { resetRun(); set({ phase: "start" }); },
  setHud: (score, coins) => set({ score, coins }),
  setFps: (fps) => set({ fps }),
  toggleDebug: () => set({ debug: !get().debug }),
}));
