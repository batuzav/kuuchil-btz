import { describe, expect, it } from "vitest";
import type { Ability, AbilityEffect, AbilityInput } from "../src/characters/ability.ts";
import { createAbility } from "../src/characters/abilityRegistry.ts";
import { TUNING } from "../src/core/tuning.ts";
import { emptyActionState } from "../src/input/actions.ts";

const input = (over: {
  dash?: boolean;
  shoot?: boolean;
  grounded?: boolean;
  dtMs?: number;
  facing?: 1 | -1;
  activeShots?: number;
}): AbilityInput => ({
  dtMs: over.dtMs ?? 10,
  held: emptyActionState(),
  pressed: { ...emptyActionState(), dash: over.dash ?? false, shoot: over.shoot ?? false },
  grounded: over.grounded ?? true,
  facing: over.facing ?? 1,
  velocityY: 0,
  activeShots: over.activeShots ?? 0,
});

/** Avanza `ms` en pasos de 10 ms sin pulsar nada y cuenta cuántos pasos devolvieron efecto de dash. */
function idleFor(ability: Ability, ms: number, grounded = true): AbilityEffect[] {
  const out: AbilityEffect[] = [];
  for (let t = 0; t < ms; t += 10) out.push(ability.update(input({ grounded })));
  return out;
}

describe("dash", () => {
  it("overrides velocity for dashDurationMs then stops", () => {
    const dash = createAbility("dash", TUNING);
    const first = dash.update(input({ dash: true, facing: -1 }));
    expect(first).toEqual({ velocityX: -TUNING.dashSpeed, velocityY: 0, ignoreGravity: true });
    const rest = idleFor(dash, TUNING.dashDurationMs + 50);
    const active = rest.filter((e) => e.ignoreGravity === true).length + 1;
    expect(active * 10).toBeGreaterThanOrEqual(TUNING.dashDurationMs);
    expect(active * 10).toBeLessThanOrEqual(TUNING.dashDurationMs + 10);
    expect(rest.at(-1)).toEqual({});
  });

  it("refuses a new dash before the cooldown elapsed", () => {
    const dash = createAbility("dash", TUNING);
    dash.update(input({ dash: true }));
    idleFor(dash, TUNING.dashDurationMs + 10);
    expect(dash.update(input({ dash: true }))).toEqual({});
    idleFor(dash, TUNING.dashCooldownMs + 20);
    expect(dash.update(input({ dash: true })).ignoreGravity).toBe(true);
  });

  it("allows one air dash until the next grounded update", () => {
    const dash = createAbility("dash", TUNING);
    expect(dash.update(input({ dash: true, grounded: false })).ignoreGravity).toBe(true);
    idleFor(dash, TUNING.dashDurationMs + TUNING.dashCooldownMs + 30, false);
    expect(dash.update(input({ dash: true, grounded: false }))).toEqual({});
    idleFor(dash, 20, true);
    expect(dash.update(input({ dash: true, grounded: false })).ignoreGravity).toBe(true);
  });
});

describe("shoot", () => {
  it("fires when pressed, off cooldown and under the shot cap", () => {
    const shoot = createAbility("shoot", TUNING);
    expect(shoot.update(input({ shoot: true }))).toEqual({ fire: true });
  });

  it("does not fire at the shot cap", () => {
    const shoot = createAbility("shoot", TUNING);
    const r = shoot.update(input({ shoot: true, activeShots: TUNING.maxShotsOnScreen }));
    expect(r.fire).toBeUndefined();
  });

  it("respects the cooldown between shots", () => {
    const shoot = createAbility("shoot", TUNING);
    shoot.update(input({ shoot: true }));
    expect(shoot.update(input({ shoot: true, dtMs: 10 })).fire).toBeUndefined();
    expect(shoot.update(input({ shoot: true, dtMs: TUNING.shotCooldownMs })).fire).toBe(true);
  });
});
