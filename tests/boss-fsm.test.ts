import { describe, expect, it } from "vitest";
import { type BossState, createBossState, phaseIndexFor, stepBoss } from "../src/bosses/fsm.ts";
import type { BossDef } from "../src/content/types.ts";

const hb = { width: 8, height: 8, offsetX: 0, offsetY: 0 };
const attack = (id: string) => ({
  id,
  pattern: "dash" as const,
  telegraphMs: 300,
  activeMs: 200,
  recoveryMs: 400,
  damage: 1,
  hitbox: hb,
  speed: 1,
  count: 1,
});
const def: BossDef = {
  id: "fixture",
  name: "F",
  textureKey: "t",
  hitbox: hb,
  maxHp: 10,
  contactDamage: 1,
  introMs: 500,
  phases: [
    { id: "p1", enterAtHpFraction: 1, idleMs: 100, attackCycle: ["a", "b"] },
    { id: "p2", enterAtHpFraction: 0.5, idleMs: 50, attackCycle: ["c"] },
  ],
  attacks: [attack("a"), attack("b"), attack("c")],
};

function runUntil(state: BossState, hp: number, stop: (s: BossState) => boolean): BossState {
  let s = state;
  for (let i = 0; i < 10000 && !stop(s); i++) s = stepBoss(def, s, 10, hp);
  return s;
}

describe("phaseIndexFor", () => {
  it("picks the last phase whose threshold the hp fraction reached", () => {
    expect(phaseIndexFor(def.phases, 1)).toBe(0);
    expect(phaseIndexFor(def.phases, 0.6)).toBe(0);
    expect(phaseIndexFor(def.phases, 0.5)).toBe(1);
    expect(phaseIndexFor(def.phases, 0.1)).toBe(1);
  });
});

describe("stepBoss", () => {
  it("visits intro, idle, telegraph, active, recovery, idle in order", () => {
    const seen: string[] = [];
    let s = createBossState(def);
    seen.push(s.kind);
    for (let i = 0; i < 10000 && seen.length < 7; i++) {
      s = stepBoss(def, s, 10, 10);
      if (s.kind !== seen.at(-1)) seen.push(s.kind);
    }
    expect(seen).toEqual(["intro", "idle", "telegraph", "active", "recovery", "idle", "telegraph"]);
  });

  it("advances the attack cycle within a phase", () => {
    let s = runUntil(createBossState(def), 10, (x) => x.kind === "telegraph");
    expect(s.attackId).toBe("a");
    s = runUntil(stepBoss(def, s, 10, 10), 10, (x) => x.kind === "idle");
    s = runUntil(s, 10, (x) => x.kind === "telegraph");
    expect(s.attackId).toBe("b");
  });

  it("switches phase on the next idle entry and restarts that cycle at 0", () => {
    let s = runUntil(createBossState(def), 10, (x) => x.kind === "recovery");
    expect(s.phaseIndex).toBe(0);
    s = runUntil(s, 4, (x) => x.kind === "idle");
    expect(s.phaseIndex).toBe(1);
    expect(s.cycleIndex).toBe(0);
    s = runUntil(s, 4, (x) => x.kind === "telegraph");
    expect(s.attackId).toBe("c");
  });

  it("becomes defeated at 0 hp from any state and stays defeated", () => {
    for (const stop of ["intro", "idle", "telegraph", "active", "recovery"] as const) {
      const s = runUntil(createBossState(def), 10, (x) => x.kind === stop);
      const dead = stepBoss(def, s, 10, 0);
      expect(dead.kind).toBe("defeated");
      expect(stepBoss(def, dead, 10, 10).kind).toBe("defeated");
    }
  });
});
