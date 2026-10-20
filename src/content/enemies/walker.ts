import type { EnemyDef } from "../types.ts";

export const walker: EnemyDef = {
  id: "walker",
  name: "Caminante",
  behavior: "walker",
  textureKey: "enemy-walker",
  hitbox: { width: 12, height: 14, offsetX: 2, offsetY: 2 },
  maxHp: 3,
  contactDamage: 2,
  speed: 30,
  jumpVelocity: 0,
  actionIntervalMs: 0,
  rangePx: 0,
  projectileSpeed: 0,
  projectileDamage: 0,
};
