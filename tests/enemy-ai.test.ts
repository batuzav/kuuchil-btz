import { describe, expect, it } from "vitest";
import { hopper } from "../src/content/enemies/hopper.ts";
import { turret } from "../src/content/enemies/turret.ts";
import { hopperStep, turretStep, walkerDirection } from "../src/core/enemyAi.ts";

describe("walkerDirection", () => {
  it("reverses when blocked or when there is no ground ahead", () => {
    expect(walkerDirection(1, true, true)).toBe(-1);
    expect(walkerDirection(-1, false, false)).toBe(1);
    expect(walkerDirection(1, true, false)).toBe(-1);
  });
  it("keeps going otherwise", () => {
    expect(walkerDirection(1, false, true)).toBe(1);
    expect(walkerDirection(-1, false, true)).toBe(-1);
  });
});

describe("hopperStep", () => {
  it("jumps once when the interval is reached on the ground, then resets", () => {
    const first = hopperStep(0, hopper.actionIntervalMs, hopper, true);
    expect(first).toEqual({ timerMs: 0, jump: true });
    expect(hopperStep(first.timerMs, 10, hopper, true).jump).toBe(false);
  });
  it("never jumps while airborne and keeps the timer capped", () => {
    const air = hopperStep(0, hopper.actionIntervalMs * 3, hopper, false);
    expect(air.jump).toBe(false);
    expect(air.timerMs).toBe(hopper.actionIntervalMs);
    expect(hopperStep(air.timerMs, 1, hopper, true).jump).toBe(true);
  });
});

describe("turretStep", () => {
  it("fires when the timer is full and the player is in range", () => {
    expect(turretStep(0, turret.actionIntervalMs, turret, turret.rangePx)).toEqual({
      timerMs: 0,
      fire: true,
    });
  });
  it("never fires beyond range, even with a full timer", () => {
    for (let i = 0; i < 5; i++) {
      expect(turretStep(turret.actionIntervalMs, 100, turret, turret.rangePx + 1).fire).toBe(false);
    }
  });
});
