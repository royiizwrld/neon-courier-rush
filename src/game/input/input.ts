import { run, type Action } from "../runtime";
import { useGame } from "../store";

const SWIPE = 28;

/** Attach keyboard + swipe listeners. Returns cleanup. Call from useEffect. */
export function attachInput(): () => void {
  let sx = 0, sy = 0, fired = false, tracking = false;
  let taps: number[] = [];
  const push = (a: Action) => { if (useGame.getState().phase === "playing") run.queue.push(a); };

  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "f3" || k === "`") { e.preventDefault(); useGame.getState().toggleDebug(); return; }
    if (k === "escape" || k === "p") {
      const g = useGame.getState();
      g.phase === "playing" ? g.pause() : g.resume();
      return;
    }
    const map: Record<string, Action> = {
      arrowleft: "left", a: "left", arrowright: "right", d: "right",
      arrowup: "up", w: "up", arrowdown: "down", s: "down",
    };
    const a = map[k];
    if (a) { e.preventDefault(); if (!e.repeat) push(a); }
  };
  const onStart = (e: TouchEvent) => {
    const t = e.touches[0]; if (!t) return;
    sx = t.clientX; sy = t.clientY; fired = false; tracking = true;
    if (t.clientX < 90 && t.clientY < 90) {
      const now = performance.now();
      taps = taps.filter((x) => now - x < 650); taps.push(now);
      if (taps.length >= 3) { taps = []; useGame.getState().toggleDebug(); }
    }
  };
  const onMove = (e: TouchEvent) => {
    if (useGame.getState().phase === "playing") e.preventDefault();
    if (!tracking || fired) return;
    const t = e.touches[0]; if (!t) return;
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) < SWIPE && Math.abs(dy) < SWIPE) return;
    fired = true;
    if (Math.abs(dx) > Math.abs(dy)) push(dx > 0 ? "right" : "left");
    else push(dy > 0 ? "down" : "up");
  };
  const onEnd = () => { tracking = false; };
  const noGesture = (e: Event) => e.preventDefault();

  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("touchend", onEnd);
  document.addEventListener("gesturestart", noGesture);
  return () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("touchstart", onStart);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
    document.removeEventListener("gesturestart", noGesture);
  };
}
