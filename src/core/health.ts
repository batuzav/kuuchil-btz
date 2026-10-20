export type HealthState = {
  readonly hp: number;
  readonly maxHp: number;
  readonly invulnMs: number;
};

export function createHealth(maxHp: number): HealthState {
  return { hp: maxHp, maxHp, invulnMs: 0 };
}

export function applyDamage(
  s: HealthState,
  amount: number,
  invulnerabilityMs: number,
): { state: HealthState; applied: boolean } {
  if (s.invulnMs > 0) return { state: s, applied: false };
  return {
    state: { ...s, hp: Math.max(0, s.hp - amount), invulnMs: invulnerabilityMs },
    applied: true,
  };
}

export function tickHealth(s: HealthState, dtMs: number): HealthState {
  return s.invulnMs > 0 ? { ...s, invulnMs: Math.max(0, s.invulnMs - dtMs) } : s;
}

export function isDead(s: HealthState): boolean {
  return s.hp <= 0;
}

export function hpFraction(s: HealthState): number {
  return s.maxHp <= 0 ? 0 : Math.min(1, Math.max(0, s.hp / s.maxHp));
}
