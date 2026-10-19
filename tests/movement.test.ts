import { describe, expect, it } from "vitest";
import { applyJumpCut, canJump, clampFall, horizontalVelocity } from "../src/core/movement.ts";
import { TUNING } from "../src/core/tuning.ts";

describe("applyJumpCut", () => {
  it("cuts an upward velocity when jump is released", () => {
    expect(applyJumpCut(-200, false, TUNING.jumpCutMultiplier)).toBe(
      -200 * TUNING.jumpCutMultiplier,
    );
  });
  it("leaves velocity alone while jump is held or while falling", () => {
    expect(applyJumpCut(-200, true, TUNING.jumpCutMultiplier)).toBe(-200);
    expect(applyJumpCut(120, false, TUNING.jumpCutMultiplier)).toBe(120);
  });
});

describe("canJump", () => {
  it("allows a jump inside both windows", () => {
    expect(canJump(TUNING.coyoteTimeMs, TUNING.jumpBufferMs, TUNING)).toBe(true);
    expect(canJump(0, 0, TUNING)).toBe(true);
  });
  it("refuses when either window is exceeded", () => {
    expect(canJump(TUNING.coyoteTimeMs + 1, 0, TUNING)).toBe(false);
    expect(canJump(0, TUNING.jumpBufferMs + 1, TUNING)).toBe(false);
  });
});

describe("horizontalVelocity", () => {
  it("is 0 with both or neither direction held", () => {
    expect(horizontalVelocity(true, true, TUNING.runSpeed)).toBe(0);
    expect(horizontalVelocity(false, false, TUNING.runSpeed)).toBe(0);
  });
  it("is runSpeed times the direction otherwise", () => {
    expect(horizontalVelocity(false, true, TUNING.runSpeed)).toBe(TUNING.runSpeed);
    expect(horizontalVelocity(true, false, TUNING.runSpeed)).toBe(-TUNING.runSpeed);
  });
});

describe("clampFall", () => {
  it("caps downward speed only", () => {
    expect(clampFall(999, TUNING.maxFallSpeed)).toBe(TUNING.maxFallSpeed);
    expect(clampFall(-50, TUNING.maxFallSpeed)).toBe(-50);
  });
});
