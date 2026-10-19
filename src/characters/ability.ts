import type { Tuning } from "../core/tuning.ts";
import type { ActionState } from "../input/actions.ts";

export type AbilityInput = {
  readonly dtMs: number;
  readonly held: ActionState;
  readonly pressed: ActionState;
  readonly grounded: boolean;
  readonly facing: 1 | -1;
  readonly velocityY: number;
  readonly activeShots: number;
};

export type AbilityEffect = {
  velocityX?: number;
  velocityY?: number;
  ignoreGravity?: boolean;
  fire?: boolean;
};

export type Ability = {
  readonly id: string;
  update(input: AbilityInput): AbilityEffect;
  reset(): void;
};

export type AbilityFactory = (tuning: Tuning) => Ability;
