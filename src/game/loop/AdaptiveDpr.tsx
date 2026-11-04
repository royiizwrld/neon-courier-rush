import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { DPR_MAX, DPR_MIN } from "../config";

/** Caps pixel ratio at 2 and lowers it when the frame rate stays low; raises it back when smooth. */
export function AdaptiveDpr() {
  const setDpr = useThree((s) => s.setDpr);
  const st = useRef({ acc: 0, frames: 0, dpr: 0 });
  useFrame((_, raw) => {
    const s = st.current;
    if (!s.dpr) { s.dpr = Math.min(DPR_MAX, window.devicePixelRatio || 1); setDpr(s.dpr); }
    s.acc += raw; s.frames++;
    if (s.acc < 2) return;
    const fps = s.frames / s.acc; s.acc = 0; s.frames = 0;
    const cap = Math.min(DPR_MAX, window.devicePixelRatio || 1);
    let next = s.dpr;
    if (fps < 45) next = Math.max(DPR_MIN, s.dpr - 0.25);
    else if (fps > 57) next = Math.min(cap, s.dpr + 0.25);
    if (next !== s.dpr) { s.dpr = next; setDpr(next); }
  });
  return null;
}
