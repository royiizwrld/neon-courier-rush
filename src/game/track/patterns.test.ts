import { describe, it, expect } from "vitest";
import { makeRow, isFair, computeScore, minGap } from "./patterns";

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe("track patterns", () => {
  it("never blocks all three lanes", () => {
    const r = seeded(7);
    for (let i = 0; i < 5000; i++) {
      const row = makeRow(r, i / 5000, i % 4 === 0 ? i % 3 : -1);
      expect(row.some((c) => c === null)).toBe(true);
    }
  });
  it("keeps an open lane other than a moving vehicle's lane", () => {
    const r = seeded(3);
    for (let i = 0; i < 2000; i++) {
      const row = makeRow(r, 1, 1);
      expect(row.some((c, idx) => c === null && idx !== 1)).toBe(true);
    }
  });
  it("rejects a fully blocked row", () => {
    expect(isFair(["block", "low", "high"])).toBe(false);
  });
  it("score is distance plus 10 per coin", () => {
    expect(computeScore(123.9, 5)).toBe(173);
  });
  it("gap grows with speed", () => {
    expect(minGap(30)).toBeGreaterThan(minGap(14));
  });
});
