import { describe, expect, it } from "vitest";
import { type StageFlowEvent, type StageFlowState, nextFlow } from "../src/core/stageFlow.ts";

describe("stage flow", () => {
  it("walks exploring -> bossIntro -> bossFight -> won", () => {
    expect(nextFlow("exploring", "enteredBossTrigger")).toBe("bossIntro");
    expect(nextFlow("bossIntro", "bossIntroDone")).toBe("bossFight");
    expect(nextFlow("bossFight", "bossDefeated")).toBe("won");
  });

  it("keeps won on playerDied", () => {
    expect(nextFlow("won", "playerDied")).toBe("won");
  });

  it("moves any live state to lost on playerDied, and lost back to exploring on restart", () => {
    for (const s of ["exploring", "bossIntro", "bossFight"] as const) {
      expect(nextFlow(s, "playerDied")).toBe("lost");
    }
    expect(nextFlow("lost", "restart")).toBe("exploring");
  });

  it("ignores every transition not listed", () => {
    const allowed = new Set([
      "exploring:enteredBossTrigger",
      "bossIntro:bossIntroDone",
      "bossFight:bossDefeated",
      "exploring:playerDied",
      "bossIntro:playerDied",
      "bossFight:playerDied",
      "lost:restart",
    ]);
    const states: StageFlowState[] = ["exploring", "bossIntro", "bossFight", "won", "lost"];
    const events: StageFlowEvent[] = [
      "enteredBossTrigger",
      "bossIntroDone",
      "bossDefeated",
      "playerDied",
      "restart",
    ];
    for (const s of states) {
      for (const e of events) {
        if (!allowed.has(`${s}:${e}`)) expect(nextFlow(s, e)).toBe(s);
      }
    }
  });
});
