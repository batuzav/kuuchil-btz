import type { EnemyDef } from "../types.ts";

export const hopper: EnemyDef = {
  id: "hopper",
  name: "Saltarín",
  behavior: "hopper",
  textureKey: "enemy-hopper",
  hitbox: { width: 12, height: 12, offsetX: 2, offsetY: 4 },
  maxHp: 2,
  contactDamage: 2,
  speed: 40,
  jumpVelocity: 260,
  actionIntervalMs: 1400,
  rangePx: 0,
  projectileSpeed: 0,
  projectileDamage: 0,
};
