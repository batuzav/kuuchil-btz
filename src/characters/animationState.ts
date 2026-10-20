import type { CharacterAnimState } from "../content/types.ts";
import { TUNING } from "../core/tuning.ts";

export type AnimContext = {
  readonly grounded: boolean;
  readonly velocityX: number;
  readonly velocityY: number;
  readonly dashing: boolean;
  readonly shooting: boolean;
  readonly hurt: boolean;
  readonly dead: boolean;
};

export const animationKey = (characterId: string, state: string): string =>
  `${characterId}:${state}`;

/** Prioridad: muerto > herido > dash > aire > disparo (solo parado) > correr > idle. */
export function pickAnimation(c: AnimContext): CharacterAnimState {
  if (c.dead) return "dead";
  if (c.hurt) return "hurt";
  if (c.dashing) return "dash";
  if (!c.grounded) return c.velocityY < 0 ? "jump" : "fall";
  const moving = Math.abs(c.velocityX) > TUNING.runAnimMinSpeed;
  if (c.shooting && !moving) return "shoot";
  return moving ? "run" : "idle";
}
