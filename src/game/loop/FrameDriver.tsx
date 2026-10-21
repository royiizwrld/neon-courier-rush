import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useSettings } from "../settings";

/**
 * Drives rendering when the Canvas uses frameloop="demand".
 * Unlimited = one frame per display refresh (works on 120/144Hz); otherwise capped.
 * All simulation uses delta time, so speed is identical at any frame rate.
 */
export function FrameDriver() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0, last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const cap = useSettings.getState().fpsCap;
      if (cap === 0) { invalidate(); return; }
      const interval = 1000 / cap;
      if (now - last >= interval - 1.5) { last = now - ((now - last) % interval); if (now - last > interval) last = now; invalidate(); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [invalidate]);
  return null;
}
