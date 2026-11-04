import { useSettings } from "../settings";

// Tiny synthesized effects (no audio files). Context is created on first use, which follows a user tap.
let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (useSettings.getState().muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}
function tone(freq: number, end: number, dur: number, type: OscillatorType, vol = 0.15, delay = 0) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(end, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}

export const sfx = {
  gem() { tone(1320, 1760, 0.12, "triangle", 0.14); tone(1760, 2640, 0.18, "sine", 0.12, 0.08); tone(2640, 3200, 0.25, "sine", 0.08, 0.16); },
  rewind() { tone(900, 160, 0.6, "sawtooth", 0.07); tone(400, 1200, 0.4, "sine", 0.1, 0.5); },
  tick() { tone(660, 660, 0.08, "square", 0.06); },
};
