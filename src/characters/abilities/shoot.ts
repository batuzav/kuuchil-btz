import type { AbilityFactory } from "../ability.ts";

export const createShoot: AbilityFactory = (tuning) => {
  let cooldownMs = 0;
  return {
    id: "shoot",
    update: (input) => {
      cooldownMs -= input.dtMs;
      if (input.pressed.shoot && cooldownMs <= 0 && input.activeShots < tuning.maxShotsOnScreen) {
        cooldownMs = tuning.shotCooldownMs;
        return { fire: true };
      }
      return {};
    },
    reset: () => {
      cooldownMs = 0;
    },
  };
};
