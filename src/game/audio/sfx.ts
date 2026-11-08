import { useSettings } from "../settings";

// All sound is synthesized with Web Audio (no files). The context is created on the first user gesture.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function init(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      ctx = new AudioContext();
      master = ctx.createGain(); master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyMute();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch { return null; }
}
function ac(): AudioContext | null {
  if (useSettings.getState().muted) return null;
  return init();
}
function applyMute() {
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(useSettings.getState().muted ? 0 : 1, ctx.currentTime, 0.03);
}
if (typeof window !== "undefined") {
  useSettings.subscribe((s, p) => { if (s.muted !== p.muted) { applyMute(); if (!s.muted) music.sync(); } });
  const unlock = () => { if (!useSettings.getState().muted) { init(); music.sync(); } };
  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}

function tone(freq: number, end: number, dur: number, type: OscillatorType, vol = 0.15, delay = 0, out?: AudioNode, at?: number) {
  const c = ctx; if (!c) return;
  const t = at ?? c.currentTime + delay;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (end !== freq) o.frequency.exponentialRampToValueAtTime(end, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out ?? sfxBus!); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur: number, vol: number, ftype: BiquadFilterType, f0: number, f1: number, out?: AudioNode, at?: number, q = 1) {
  const c = ctx; if (!c || !noiseBuf) return;
  const t = at ?? c.currentTime;
  const s = c.createBufferSource(); s.buffer = noiseBuf;
  const f = c.createBiquadFilter(); f.type = ftype; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(out ?? sfxBus!); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
let coinStep = 0; let lastCoin = 0;

export const sfx = {
  coin() {
    const c = ac(); if (!c) return;
    coinStep = c.currentTime - lastCoin < 0.5 ? Math.min(coinStep + 1, PENTA.length - 1) : 0; lastCoin = c.currentTime;
    const f = 988 * Math.pow(2, PENTA[coinStep]! / 12);
    tone(f, f, 0.09, "square", 0.05); tone(f * 1.5, f * 1.5, 0.16, "triangle", 0.07, 0.05);
  },
  jump() { if (!ac()) return; tone(300, 760, 0.16, "square", 0.06); noise(0.12, 0.05, "highpass", 2000, 6000); },
  slide() { if (!ac()) return; noise(0.35, 0.12, "bandpass", 900, 250, undefined, undefined, 2); tone(140, 70, 0.25, "sine", 0.1); },
  lane() { if (!ac()) return; noise(0.1, 0.07, "bandpass", 1800, 3600, undefined, undefined, 3); },
  land() { if (!ac()) return; tone(110, 55, 0.1, "sine", 0.12); },
  crash() {
    if (!ac()) return;
    tone(160, 35, 0.6, "sawtooth", 0.18); tone(80, 30, 0.7, "sine", 0.3); noise(0.5, 0.35, "lowpass", 4000, 200);
  },
  shieldHit() { if (!ac()) return; tone(1200, 300, 0.3, "triangle", 0.12); noise(0.2, 0.1, "highpass", 3000, 1000); },
  power() { if (!ac()) return; [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.18, "square", 0.06, i * 0.06)); },
  portal() {
    if (!ac()) return;
    tone(120, 1800, 0.9, "sawtooth", 0.06); tone(240, 2400, 0.9, "sine", 0.08);
    noise(1.0, 0.2, "bandpass", 300, 5000, undefined, undefined, 4);
  },
  gem() { if (!ac()) return; tone(1320, 1760, 0.12, "triangle", 0.14); tone(1760, 2640, 0.18, "sine", 0.12, 0.08); tone(2640, 3200, 0.25, "sine", 0.08, 0.16); },
  rewind() { if (!ac()) return; tone(900, 160, 0.6, "sawtooth", 0.07); tone(400, 1200, 0.4, "sine", 0.1, 0.5); },
  tick() { if (!ac()) return; tone(660, 660, 0.08, "square", 0.06); },
  gameOver() { if (!ac()) return; [392, 330, 262, 196].forEach((f, i) => tone(f, f, 0.3, "triangle", 0.1, i * 0.16)); },
};

// ---------- Procedural music: one step sequencer, a theme per world ----------
interface Theme { bpm: number; root: number; prog: number[]; lead: OscillatorType; bass: OscillatorType; arp: number[]; kick: number[]; hat: number; snare: boolean; cutoff: number }
const THEMES: Theme[] = [
  // Neon City: synthwave
  { bpm: 124, root: 45, prog: [0, -4, 3, -2], lead: "sawtooth", bass: "sawtooth", arp: [0, 7, 12, 7, 3, 7, 12, 15], kick: [0, 4, 8, 12], hat: 2, snare: true, cutoff: 1800 },
  // Misty Forest: mellow plucks
  { bpm: 108, root: 50, prog: [0, 5, -3, -5], lead: "triangle", bass: "sine", arp: [0, 4, 7, 11, 12, 11, 7, 4], kick: [0, 10], hat: 4, snare: false, cutoff: 1200 },
  // Toxic Sewers: acid industrial
  { bpm: 128, root: 40, prog: [0, 0, 1, -2], lead: "square", bass: "square", arp: [0, 0, 12, 0, 3, 0, 10, 0], kick: [0, 4, 8, 12], hat: 1, snare: true, cutoff: 900 },
  // Frost Caverns: bells
  { bpm: 112, root: 52, prog: [0, -3, -5, -7], lead: "sine", bass: "triangle", arp: [12, 19, 24, 19, 16, 19, 24, 28], kick: [0, 8], hat: 2, snare: false, cutoff: 2600 },
  // Ember Canyon: driving
  { bpm: 136, root: 43, prog: [0, 1, 3, 1], lead: "sawtooth", bass: "sawtooth", arp: [0, 3, 7, 10, 12, 10, 7, 3], kick: [0, 3, 6, 8, 11, 14], hat: 1, snare: true, cutoff: 1500 },
];
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

let playing = false; let wantPlay = false; let theme = 0; let step = 0; let nextT = 0;
let timer: ReturnType<typeof setInterval> | null = null;

function schedule() {
  const c = ctx; if (!c || !musicBus) return;
  const th = THEMES[theme]!;
  const sp = 60 / th.bpm / 4;
  while (nextT < c.currentTime + 0.15) {
    const s = step % 16; const bar = Math.floor(step / 16) % 4;
    const r = th.root + th.prog[bar]!;
    if (th.kick.includes(s)) { tone(150, 40, 0.22, "sine", 0.5, 0, musicBus, nextT); }
    if (th.snare && (s === 4 || s === 12)) noise(0.16, 0.16, "bandpass", 1800, 900, musicBus, nextT);
    if (s % th.hat === 0) noise(0.04, 0.05, "highpass", 7000, 9000, musicBus, nextT);
    if (s % 2 === 0) tone(midi(r - 12 + (s % 8 === 6 ? 12 : 0)), midi(r - 12), sp * 1.8, th.bass, 0.08, 0, musicBus, nextT);
    if (s % 2 === 1 || th.bpm < 115) tone(midi(r + 12 + th.arp[s % 8]!), midi(r + 12 + th.arp[s % 8]!), sp * 1.5, th.lead, 0.025, 0, musicBus, nextT);
    nextT += sp; step++;
  }
}

export const music = {
  /** Start or keep the loop running for this world index. */
  play(world: number) { wantPlay = true; this.setWorld(world); this.sync(); },
  stop() { wantPlay = false; this.sync(); },
  setWorld(world: number) {
    const w = ((world % THEMES.length) + THEMES.length) % THEMES.length;
    if (w === theme) return;
    theme = w;
    if (ctx && musicBus && playing) { // quick dip to crossfade the change
      const t = ctx.currentTime; musicBus.gain.cancelScheduledValues(t);
      musicBus.gain.setTargetAtTime(0.05, t, 0.1); musicBus.gain.setTargetAtTime(0.6, t + 0.6, 0.3);
    }
  },
  sync() {
    const should = wantPlay && !useSettings.getState().muted;
    if (should && !playing) {
      const c = init(); if (!c || !musicBus) return;
      playing = true; nextT = c.currentTime + 0.05; step = 0;
      musicBus.gain.cancelScheduledValues(c.currentTime);
      musicBus.gain.setTargetAtTime(0.6, c.currentTime, 0.3);
      timer = setInterval(schedule, 40); schedule();
    } else if (!should && playing) {
      playing = false; if (timer) clearInterval(timer); timer = null;
      if (ctx && musicBus) musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
    }
  },
};
