import type { EnemyDef } from "../types.ts";

export const turret: EnemyDef = {
  id: "turret",
  name: "Torreta",
  behavior: "turret",
  textureKey: "enemy-turret",
  hitbox: { width: 14, height: 14, offsetX: 1, offsetY: 2 },
  maxHp: 4,
  contactDamage: 1,
  speed: 0,
  jumpVelocity: 0,
  actionIntervalMs: 1800,
  rangePx: 128,
  projectileSpeed: 100,
  projectileDamage: 2,
};
