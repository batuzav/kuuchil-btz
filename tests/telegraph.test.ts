import { describe, expect, it } from "vitest";
import { createBossState, stepBoss } from "../src/bosses/fsm.ts";
import { CONTENT } from "../src/content/registry.ts";
import { TUNING } from "../src/core/tuning.ts";

const STEP_MS = 16;
const TOTAL_MS = 20000;

describe("telegraph invariant", () => {
  it("keeps every attack's telegraphMs at or above the minimum", () => {
    for (const boss of CONTENT.bosses) {
      for (const attack of boss.attacks) {
        expect(attack.telegraphMs).toBeGreaterThanOrEqual(TUNING.minTelegraphMs);
      }
    }
  });

  it("never enters active before the full telegraph time has elapsed", () => {
    for (const boss of CONTENT.bosses) {
      for (const hp of [boss.maxHp, boss.maxHp / 2]) {
        let state = createBossState(boss);
        let inTelegraph = 0;
        let activations = 0;
        for (let t = 0; t < TOTAL_MS; t += STEP_MS) {
          const next = stepBoss(boss, state, STEP_MS, hp);
          if (next.kind === "telegraph") inTelegraph += STEP_MS;
          if (state.kind === "telegraph" && next.kind === "active") {
            const attack = boss.attacks.find((a) => a.id === state.attackId);
            expect(inTelegraph).toBeGreaterThanOrEqual(
              attack?.telegraphMs ?? Number.POSITIVE_INFINITY,
            );
            inTelegraph = 0;
            activations++;
          }
          if (next.kind !== "telegraph") inTelegraph = next.kind === "active" ? 0 : inTelegraph;
          state = next;
        }
        expect(activations).toBeGreaterThan(0);
      }
    }
  });
});
