import { describe, expect, it } from "vitest";
import { apexHeight, dashDistance, runningJumpDistance } from "../src/core/movement.ts";
import { TUNING } from "../src/core/tuning.ts";

describe("tuning sanity (properties the stage-01 map relies on)", () => {
  it("reaches the highest platform of stage 1 (64 px above the ground)", () => {
    expect(apexHeight(TUNING)).toBeGreaterThan(64);
  });
  it("crosses a 3-tile pit with a running jump", () => {
    expect(runningJumpDistance(TUNING)).toBeGreaterThan(48);
  });
  it("dashes far enough to dodge", () => {
    expect(dashDistance(TUNING)).toBeGreaterThan(32);
  });
  it("shots travel at least one screen width", () => {
    expect((TUNING.shotSpeed * TUNING.shotLifetimeMs) / 1000).toBeGreaterThanOrEqual(240);
  });
  it("keeps telegraph blinking under 3 flashes per second", () => {
    expect(TUNING.telegraphBlinkMs).toBeGreaterThanOrEqual(167);
  });
});
