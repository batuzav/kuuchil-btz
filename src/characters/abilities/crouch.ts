import type { AbilityFactory } from "../ability.ts";

// Mantener "abajo" en el suelo: agacharse y quedarse quieto. Saltar cancela el agache.
export const createCrouch: AbilityFactory = () => ({
  id: "crouch",
  update: (input) =>
    input.grounded && input.held.down && !input.pressed.jump
      ? { velocityX: 0, crouching: true }
      : {},
  reset: () => {},
});
