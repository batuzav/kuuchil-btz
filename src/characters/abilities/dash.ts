import type { AbilityFactory } from "../ability.ts";

export const createDash: AbilityFactory = (tuning) => {
  let dashRemainingMs = 0;
  let cooldownMs = 0;
  let airDashUsed = false;
  return {
    id: "dash",
    update: (input) => {
      if (input.grounded) airDashUsed = false;
      if (dashRemainingMs <= 0 && cooldownMs > 0) cooldownMs -= input.dtMs;
      if (
        input.pressed.dash &&
        dashRemainingMs <= 0 &&
        cooldownMs <= 0 &&
        (input.grounded || !airDashUsed)
      ) {
        dashRemainingMs = tuning.dashDurationMs;
        if (!input.grounded) airDashUsed = true;
      }
      if (dashRemainingMs > 0) {
        dashRemainingMs -= input.dtMs;
        if (dashRemainingMs <= 0) cooldownMs = tuning.dashCooldownMs;
        return { velocityX: tuning.dashSpeed * input.facing, velocityY: 0, ignoreGravity: true };
      }
      return {};
    },
    reset: () => {
      dashRemainingMs = 0;
      cooldownMs = 0;
      airDashUsed = false;
    },
  };
};
