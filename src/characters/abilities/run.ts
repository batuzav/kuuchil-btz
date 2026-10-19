import { horizontalVelocity } from "../../core/movement.ts";
import type { AbilityFactory } from "../ability.ts";

export const createRun: AbilityFactory = (tuning) => ({
  id: "run",
  update: (input) => ({
    velocityX: horizontalVelocity(input.held.left, input.held.right, tuning.runSpeed),
  }),
  reset: () => {},
});
