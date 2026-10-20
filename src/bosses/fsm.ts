import type { BossAttackDef, BossDef, BossPhaseDef } from "../content/types.ts";

export type BossStateKind = "intro" | "idle" | "telegraph" | "active" | "recovery" | "defeated";

export type BossState = {
  readonly kind: BossStateKind;
  readonly timerMs: number;
  readonly phaseIndex: number;
  readonly cycleIndex: number;
  readonly attackId: string | null;
};

export function phaseIndexFor(phases: readonly BossPhaseDef[], hpFraction: number): number {
  let index = 0;
  phases.forEach((phase, i) => {
    if (hpFraction <= phase.enterAtHpFraction) index = i;
  });
  return index;
}

export function createBossState(def: BossDef): BossState {
  return { kind: "intro", timerMs: def.introMs, phaseIndex: 0, cycleIndex: 0, attackId: null };
}

function attackOf(def: BossDef, id: string | null): BossAttackDef {
  const attack = def.attacks.find((a) => a.id === id);
  if (!attack) throw new Error(`Ataque desconocido: ${id}`);
  return attack;
}

export function stepBoss(def: BossDef, state: BossState, dtMs: number, hp: number): BossState {
  if (state.kind === "defeated") return state;
  if (hp <= 0) return { ...state, kind: "defeated", timerMs: 0 };
  const timerMs = state.timerMs - dtMs;
  if (timerMs > 0) return { ...state, timerMs };

  const fraction = hp / def.maxHp;
  switch (state.kind) {
    case "intro": {
      const phaseIndex = phaseIndexFor(def.phases, fraction);
      return {
        kind: "idle",
        timerMs: (def.phases[phaseIndex] as BossPhaseDef).idleMs,
        phaseIndex,
        cycleIndex: 0,
        attackId: null,
      };
    }
    case "idle": {
      const phase = def.phases[state.phaseIndex] as BossPhaseDef;
      const attackId = phase.attackCycle[state.cycleIndex % phase.attackCycle.length] as string;
      return {
        ...state,
        kind: "telegraph",
        attackId,
        timerMs: attackOf(def, attackId).telegraphMs,
      };
    }
    case "telegraph":
      return { ...state, kind: "active", timerMs: attackOf(def, state.attackId).activeMs };
    case "active":
      return { ...state, kind: "recovery", timerMs: attackOf(def, state.attackId).recoveryMs };
    case "recovery": {
      const phaseIndex = phaseIndexFor(def.phases, fraction);
      return {
        kind: "idle",
        timerMs: (def.phases[phaseIndex] as BossPhaseDef).idleMs,
        phaseIndex,
        cycleIndex: phaseIndex !== state.phaseIndex ? 0 : state.cycleIndex + 1,
        attackId: null,
      };
    }
  }
}
