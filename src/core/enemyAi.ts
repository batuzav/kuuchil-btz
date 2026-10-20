import type { EnemyDef } from "../content/types.ts";

export function walkerDirection(dir: 1 | -1, blockedAhead: boolean, groundAhead: boolean): 1 | -1 {
  return blockedAhead || !groundAhead ? (dir === 1 ? -1 : 1) : dir;
}

export function hopperStep(
  timerMs: number,
  dtMs: number,
  def: EnemyDef,
  grounded: boolean,
): { timerMs: number; jump: boolean } {
  if (def.actionIntervalMs <= 0) return { timerMs: 0, jump: false };
  const t = Math.min(timerMs + dtMs, def.actionIntervalMs);
  if (grounded && t >= def.actionIntervalMs) return { timerMs: 0, jump: true };
  return { timerMs: t, jump: false };
}

export function turretStep(
  timerMs: number,
  dtMs: number,
  def: EnemyDef,
  distanceToPlayer: number,
): { timerMs: number; fire: boolean } {
  if (def.actionIntervalMs <= 0) return { timerMs: 0, fire: false };
  const t = Math.min(timerMs + dtMs, def.actionIntervalMs);
  if (distanceToPlayer <= def.rangePx && t >= def.actionIntervalMs)
    return { timerMs: 0, fire: true };
  return { timerMs: t, fire: false };
}
