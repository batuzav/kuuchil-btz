import type { Tuning } from "../core/tuning.ts";
import type { Ability, AbilityFactory } from "./ability.ts";
import { createCrouch } from "./abilities/crouch.ts";
import { createDash } from "./abilities/dash.ts";
import { createJump } from "./abilities/jump.ts";
import { createRun } from "./abilities/run.ts";
import { createShoot } from "./abilities/shoot.ts";

export const ABILITY_FACTORIES: Readonly<Record<string, AbilityFactory>> = {
  run: createRun,
  jump: createJump,
  crouch: createCrouch,
  dash: createDash,
  shoot: createShoot,
};

export function hasAbility(id: string): boolean {
  return Object.hasOwn(ABILITY_FACTORIES, id);
}

export function createAbility(id: string, tuning: Tuning): Ability {
  const factory = ABILITY_FACTORIES[id];
  if (!factory || !hasAbility(id)) throw new Error(`Unknown ability: ${id}`);
  return factory(tuning);
}
