import { describe, expect, it } from "vitest";
import type { AbilityInput } from "../src/characters/ability.ts";
import { createAbility } from "../src/characters/abilityRegistry.ts";
import { TUNING } from "../src/core/tuning.ts";
import { emptyActionState } from "../src/input/actions.ts";

const input = (over: {
  held?: Partial<ReturnType<typeof emptyActionState>>;
  pressed?: Partial<ReturnType<typeof emptyActionState>>;
  grounded?: boolean;
  dtMs?: number;
  velocityY?: number;
}): AbilityInput => ({
  dtMs: over.dtMs ?? 16,
  held: { ...emptyActionState(), ...over.held },
  pressed: { ...emptyActionState(), ...over.pressed },
  grounded: over.grounded ?? false,
  facing: 1,
  velocityY: over.velocityY ?? 0,
  activeShots: 0,
});

describe("run", () => {
  it("moves right at runSpeed", () => {
    const run = createAbility("run", TUNING);
    expect(run.update(input({ held: { right: true } })).velocityX).toBe(TUNING.runSpeed);
  });
});

describe("jump", () => {
  it("jumps on landing if pressed within the buffer window", () => {
    const jump = createAbility("jump", TUNING);
    jump.update(input({ pressed: { jump: true }, held: { jump: true }, grounded: false }));
    const landed = jump.update(input({ grounded: true, dtMs: TUNING.jumpBufferMs - 20 }));
    expect(landed.velocityY).toBe(-TUNING.jumpVelocity);
  });

  it("does not jump on landing after the buffer expires", () => {
    const jump = createAbility("jump", TUNING);
    jump.update(input({ pressed: { jump: true }, held: { jump: true }, grounded: false }));
    const landed = jump.update(input({ grounded: true, dtMs: TUNING.jumpBufferMs + 50 }));
    expect(landed.velocityY).not.toBe(-TUNING.jumpVelocity);
  });

  it("allows coyote jumps inside the window and refuses outside it", () => {
    const early = createAbility("jump", TUNING);
    early.update(input({ grounded: true }));
    early.update(input({ grounded: false, dtMs: TUNING.coyoteTimeMs - 20 }));
    const ok = early.update(input({ grounded: false, dtMs: 1, pressed: { jump: true } }));
    expect(ok.velocityY).toBe(-TUNING.jumpVelocity);

    const late = createAbility("jump", TUNING);
    late.update(input({ grounded: true }));
    late.update(input({ grounded: false, dtMs: TUNING.coyoteTimeMs + 20 }));
    const no = late.update(input({ grounded: false, dtMs: 1, pressed: { jump: true } }));
    expect(no.velocityY).not.toBe(-TUNING.jumpVelocity);
  });

  it("cuts the jump when released while rising", () => {
    const jump = createAbility("jump", TUNING);
    const r = jump.update(input({ grounded: false, velocityY: -200, held: { jump: false } }));
    expect(r.velocityY).toBe(-200 * TUNING.jumpCutMultiplier);
  });
});

describe("registry", () => {
  it("throws a named error for unknown abilities", () => {
    expect(() => createAbility("wall-jump", TUNING)).toThrow(/wall-jump/);
  });
});
