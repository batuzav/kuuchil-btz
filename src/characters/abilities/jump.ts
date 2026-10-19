import { applyJumpCut, canJump, clampFall } from "../../core/movement.ts";
import type { AbilityFactory } from "../ability.ts";

export const createJump: AbilityFactory = (tuning) => {
  let msSinceGrounded = Number.POSITIVE_INFINITY;
  let msSinceJumpPressed = Number.POSITIVE_INFINITY;
  return {
    id: "jump",
    update: (input) => {
      msSinceGrounded = input.grounded ? 0 : msSinceGrounded + input.dtMs;
      msSinceJumpPressed = input.pressed.jump ? 0 : msSinceJumpPressed + input.dtMs;
      if (canJump(msSinceGrounded, msSinceJumpPressed, tuning)) {
        msSinceGrounded = Number.POSITIVE_INFINITY;
        msSinceJumpPressed = Number.POSITIVE_INFINITY;
        return { velocityY: -tuning.jumpVelocity };
      }
      return {
        velocityY: clampFall(
          applyJumpCut(input.velocityY, input.held.jump, tuning.jumpCutMultiplier),
          tuning.maxFallSpeed,
        ),
      };
    },
    reset: () => {
      msSinceGrounded = Number.POSITIVE_INFINITY;
      msSinceJumpPressed = Number.POSITIVE_INFINITY;
    },
  };
};
