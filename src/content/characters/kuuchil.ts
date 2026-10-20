import type { CharacterDef } from "../types.ts";

export const kuuchil: CharacterDef = {
  id: "kuuchil",
  name: "Kuuchil",
  textureKey: "player",
  projectileTextureKey: "projectile-player",
  hitbox: { width: 10, height: 14, offsetX: 3, offsetY: 2 },
  maxHp: 16,
  shotDamage: 1,
  abilities: ["run", "jump", "dash", "shoot"],
};
