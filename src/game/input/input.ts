import { run, type Action } from "../runtime";
import { useGame } from "../store";
import { useSettings, toggleFullscreen, type Bindable } from "../settings";

const SWIPE = 28;
const SCROLL_KEYS = new Set([" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "pageup", "pagedown", "home", "end"]);
const ACT: Partial<Record<Bindable, Action>> = { left: "left", right: "right", jump: "up", slide: "down" };

function push(a: Action) { if (useGame.getState().phase === "playing") run.queue.push(a); }

/** Pause / resume / start depending on the current screen. */
function primary(fromPause = false) {
  const g = useGame.getState();
  if (useSettings.getState().open) return;
  if (g.phase === "start" || g.phase === "over") { if (!fromPause) g.start(); }
  else if (g.phase === "paused") g.resume();
  else if (fromPause) g.pause();
}

function findBinding(k: string): Bindable | undefined {
  const keys = useSettings.getState().keys;
  return (Object.keys(keys) as Bindable[]).find((b) => keys[b].includes(k));
}

/** Keyboard, touch swipe, mouse drag and gamepad. Returns cleanup. Call from useEffect. */
export function attachInput(): () => void {
  let sx = 0, sy = 0, fired = false, tracking = false;
  let taps: number[] = [];
  const S = useSettings.getState;

  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const target = e.target as HTMLElement | null;
    const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
    if (SCROLL_KEYS.has(k) && !typing) e.preventDefault();
    S().setDevice("keyboard");

    if (S().rebinding) {
      e.preventDefault();
      if (k === "escape") S().startRebind(null); else S().bind(S().rebinding!, k);
      return;
    }
    if (k === "f3" || k === "`") { e.preventDefault(); useGame.getState().toggleDebug(); return; }
    if (S().open) { if (k === "escape") S().setOpen(false); return; }
    if (k === "enter") {
      // let focused buttons handle Enter themselves
      if (target?.tagName === "BUTTON" && useGame.getState().phase !== "playing") return;
      e.preventDefault(); primary(); return;
    }
    const b = findBinding(k);
    if (!b || e.repeat) return;
    if (b === "pause") primary(true);
    else if (b === "mute") S().toggleMute();
    else if (b === "fullscreen") toggleFullscreen();
    else push(ACT[b]!);
  };

  const begin = (x: number, y: number) => { sx = x; sy = y; fired = false; tracking = true; };
  const drag = (x: number, y: number) => {
    if (!tracking || fired) return;
    const dx = x - sx, dy = y - sy;
    if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
    fired = true;
    if (Math.abs(dx) > Math.abs(dy)) push(dx > 0 ? "right" : "left");
    else push(dy > 0 ? "down" : "up");
  };

  const onStart = (e: TouchEvent) => {
    S().setDevice("touch");
    const t = e.touches[0]; if (!t) return;
    begin(t.clientX, t.clientY);
    if (t.clientX < 90 && t.clientY < 90) {
      const now = performance.now();
      taps = taps.filter((x) => now - x < 650); taps.push(now);
      if (taps.length >= 3) { taps = []; useGame.getState().toggleDebug(); }
    }
  };
  const onMove = (e: TouchEvent) => {
    if (useGame.getState().phase === "playing") e.preventDefault();
    const t = e.touches[0]; if (t) drag(t.clientX, t.clientY);
  };
  const onEnd = () => { tracking = false; };

  // Mouse: click-and-drag swipes (ignores clicks on buttons)
  const onPDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    S().setDevice("keyboard");
    if ((e.target as HTMLElement).closest("button")) return;
    begin(e.clientX, e.clientY);
  };
  const onPMove = (e: PointerEvent) => { if (e.pointerType === "mouse") drag(e.clientX, e.clientY); };
  const onPUp = (e: PointerEvent) => { if (e.pointerType === "mouse") tracking = false; };
  const noGesture = (e: Event) => e.preventDefault();

  // Gamepad polling with edge detection
  let raf = 0;
  const prev: Record<string, boolean> = {};
  const edge = (id: string, down: boolean) => { const was = prev[id]; prev[id] = down; return down && !was; };
  const poll = () => {
    raf = requestAnimationFrame(poll);
    const pads = navigator.getGamepads?.() ?? [];
    for (const p of pads) {
      if (!p) continue;
      const btn = (i: number) => !!p.buttons[i]?.pressed;
      const ax = p.axes[0] ?? 0, ay = p.axes[1] ?? 0;
      const id = (s: string) => `${p.index}:${s}`;
      const fire = (s: string, down: boolean, fn: () => void) => { if (edge(id(s), down)) { S().setDevice("gamepad"); fn(); } };
      fire("l", btn(14) || ax < -0.5, () => push("left"));
      fire("r", btn(15) || ax > 0.5, () => push("right"));
      fire("u", btn(12) || ay < -0.6, () => push("up"));
      fire("d", btn(13) || ay > 0.6, () => push("down"));
      fire("a", btn(0), () => (useGame.getState().phase === "playing" ? push("up") : primary()));
      fire("b", btn(1), () => push("down"));
      fire("start", btn(9), () => primary(true) );
      // X / triggers reserved for throwing once that power-up exists
    }
  };
  raf = requestAnimationFrame(poll);

  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
  window.addEventListener("pointerdown", onPDown);
  window.addEventListener("pointermove", onPMove);
  window.addEventListener("pointerup", onPUp);
  document.addEventListener("gesturestart", noGesture);
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("touchstart", onStart);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    window.removeEventListener("pointerdown", onPDown);
    window.removeEventListener("pointermove", onPMove);
    window.removeEventListener("pointerup", onPUp);
    document.removeEventListener("gesturestart", noGesture);
  };
}
