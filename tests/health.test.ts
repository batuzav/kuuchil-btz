import { describe, expect, it } from "vitest";
import { applyDamage, createHealth, hpFraction, isDead, tickHealth } from "../src/core/health.ts";

describe("health", () => {
  it("applies damage, clamps at 0 and opens the invulnerability window", () => {
    const hit = applyDamage(createHealth(10), 3, 1000);
    expect(hit.applied).toBe(true);
    expect(hit.state).toEqual({ hp: 7, maxHp: 10, invulnMs: 1000 });
    const overkill = applyDamage(createHealth(2), 99, 500);
    expect(overkill.state.hp).toBe(0);
  });

  it("ignores damage while invulnerable", () => {
    const first = applyDamage(createHealth(10), 3, 1000).state;
    const second = applyDamage(first, 5, 1000);
    expect(second.applied).toBe(false);
    expect(second.state.hp).toBe(7);
  });

  it("ends invulnerability when the remaining time is consumed", () => {
    const s = applyDamage(createHealth(10), 1, 300).state;
    expect(tickHealth(s, 100).invulnMs).toBe(200);
    expect(tickHealth(s, 300).invulnMs).toBe(0);
    expect(tickHealth(s, 999).invulnMs).toBe(0);
  });

  it("reports death and a zero fraction at 0 hp", () => {
    const dead = applyDamage(createHealth(4), 4, 0).state;
    expect(isDead(dead)).toBe(true);
    expect(hpFraction(dead)).toBe(0);
    expect(hpFraction(createHealth(4))).toBe(1);
  });

  it("lets zero-window hits stack (used for enemy damage)", () => {
    const a = applyDamage(createHealth(3), 1, 0).state;
    const b = applyDamage(a, 1, 0);
    expect(b.applied).toBe(true);
    expect(b.state.hp).toBe(1);
  });
});
