import { describe, expect, it } from "vitest";
import { dashVelocity, slamVelocity, spreadVelocities } from "../src/bosses/patterns.ts";

describe("dashVelocity", () => {
  it("points toward the player and defaults to +speed when aligned", () => {
    expect(dashVelocity(100, 40, 220)).toBe(-220);
    expect(dashVelocity(100, 180, 220)).toBe(220);
    expect(dashVelocity(100, 100, 220)).toBe(220);
  });
});

describe("spreadVelocities", () => {
  it("returns symmetric vectors of the requested magnitude", () => {
    const v = spreadVelocities(3, 120, 1);
    expect(v).toHaveLength(3);
    for (const { vx, vy } of v) {
      expect(Math.hypot(vx, vy)).toBeCloseTo(120, 3);
      expect(vx).toBeGreaterThan(0);
    }
    expect(v[0]?.vy).toBeCloseTo(-(v[2]?.vy ?? 0), 6);
    expect(v[1]?.vy).toBeCloseTo(0, 6);
  });
  it("flips vx with facing and uses 0 degrees for a single bullet", () => {
    expect(spreadVelocities(1, 100, -1)).toEqual([{ vx: -100, vy: 0 }]);
  });
});

describe("slamVelocity", () => {
  it("jumps up and drifts toward the player, clamped to 80", () => {
    expect(slamVelocity(100, 130, 260)).toEqual({ vx: 30, vy: -260 });
    expect(slamVelocity(100, 900, 260).vx).toBe(80);
    expect(slamVelocity(100, -900, 260).vx).toBe(-80);
  });
});
