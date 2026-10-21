import { create } from "zustand";

export type Bindable = "left" | "right" | "jump" | "slide" | "pause" | "mute" | "fullscreen";
export type Device = "touch" | "keyboard" | "gamepad";
export type FpsCap = 0 | 30 | 60;

export const DEFAULT_KEYS: Record<Bindable, string[]> = {
  left: ["arrowleft", "a"],
  right: ["arrowright", "d"],
  jump: ["arrowup", "w", " "],
  slide: ["arrowdown", "s"],
  pause: ["p", "escape"],
  mute: ["m"],
  fullscreen: ["f"],
};

export const BIND_LABELS: Record<Bindable, string> = {
  left: "Move left", right: "Move right", jump: "Jump", slide: "Slide",
  pause: "Pause", mute: "Mute", fullscreen: "Fullscreen",
};

interface SettingsState {
  fpsCap: FpsCap; muted: boolean; keys: Record<Bindable, string[]>;
  device: Device; open: boolean; rebinding: Bindable | null;
  setFpsCap: (f: FpsCap) => void; toggleMute: () => void; setDevice: (d: Device) => void;
  setOpen: (o: boolean) => void; startRebind: (b: Bindable | null) => void;
  bind: (b: Bindable, key: string) => void; resetKeys: () => void; load: () => void;
}

const KEY = "neon-courier:settings";
function persist(s: Pick<SettingsState, "fpsCap" | "muted" | "keys">) {
  try { localStorage.setItem(KEY, JSON.stringify({ fpsCap: s.fpsCap, muted: s.muted, keys: s.keys })); } catch { /* ignore */ }
}

export const useSettings = create<SettingsState>((set, get) => ({
  fpsCap: 0, muted: false, keys: DEFAULT_KEYS, device: "keyboard", open: false, rebinding: null,
  load: () => {
    const coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
    let d: Partial<SettingsState> = {};
    try { d = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { /* ignore */ }
    set({
      device: coarse ? "touch" : "keyboard",
      fpsCap: d.fpsCap === 30 || d.fpsCap === 60 ? d.fpsCap : 0,
      muted: !!d.muted,
      keys: { ...DEFAULT_KEYS, ...(d.keys ?? {}) },
    });
  },
  setFpsCap: (fpsCap) => { set({ fpsCap }); persist(get()); },
  toggleMute: () => { set({ muted: !get().muted }); persist(get()); },
  setDevice: (device) => get().device !== device && set({ device }),
  setOpen: (open) => set({ open, rebinding: null }),
  startRebind: (rebinding) => set({ rebinding }),
  bind: (b, key) => {
    const keys = { ...get().keys };
    // remove the key from any other action so one key never does two things
    for (const k of Object.keys(keys) as Bindable[]) keys[k] = keys[k].filter((x) => x !== key);
    keys[b] = [key, ...keys[b].filter((x) => x !== key)].slice(0, 2);
    set({ keys, rebinding: null }); persist(get());
  },
  resetKeys: () => { set({ keys: DEFAULT_KEYS }); persist(get()); },
}));

export function keyLabel(k: string): string {
  const m: Record<string, string> = { " ": "Space", arrowleft: "←", arrowright: "→", arrowup: "↑", arrowdown: "↓", escape: "Esc", enter: "Enter" };
  return m[k] ?? k.toUpperCase();
}

export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}
