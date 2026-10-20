import type { CharacterDef } from "../types.ts";

export const kuuchil: CharacterDef = {
  id: "kuuchil",
  name: "Kuuchil",
  textureKey: "player",
  projectileTextureKey: "projectile-player",
  hitbox: { width: 12, height: 30, offsetX: 2, offsetY: 2 },
  muzzle: { x: 10, y: 18 },
  maxHp: 16,
  shotDamage: 1,
  abilities: ["run", "jump", "dash", "shoot"],
};
