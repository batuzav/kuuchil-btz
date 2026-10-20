import type { EnemyDef } from "../types.ts";

export const turret: EnemyDef = {
  id: "turret",
  name: "Torreta",
  behavior: "turret",
  textureKey: "enemy-turret",
  hitbox: { width: 20, height: 20, offsetX: 2, offsetY: 4 },
  maxHp: 4,
  contactDamage: 1,
  speed: 0,
  jumpVelocity: 0,
  actionIntervalMs: 1800,
  rangePx: 128,
  projectileSpeed: 100,
  projectileDamage: 2,
};
