import { describe, expect, it } from "vitest";
import { pickCamPreset, reviveCost } from "./config";

describe("revive cost", () => {
  it("costs 2, 4, then 8 gems", () => {
    expect(reviveCost(0, false)).toBe(2);
    expect(reviveCost(1, false)).toBe(4);
    expect(reviveCost(2, false)).toBe(8);
  });
  it("allows at most 3 revives per run", () => {
    expect(reviveCost(3, false)).toBeNull();
  });
  it("first revive is free once a day when available", () => {
    expect(reviveCost(0, true)).toBe(0);
    expect(reviveCost(1, true)).toBe(4);
  });
});

describe("camera preset", () => {
  it("chooses by screen size", () => {
    expect(pickCamPreset(390, 844)).toBe("phonePortrait");
    expect(pickCamPreset(844, 390)).toBe("phoneLandscape");
    expect(pickCamPreset(768, 1024)).toBe("tablet");
    expect(pickCamPreset(1600, 900)).toBe("desktop");
  });
});
