import type { EnemyDef } from "../types.ts";

export const hopper: EnemyDef = {
  id: "hopper",
  name: "Saltarín",
  behavior: "hopper",
  textureKey: "enemy-hopper",
  hitbox: { width: 18, height: 18, offsetX: 3, offsetY: 6 },
  maxHp: 2,
  contactDamage: 2,
  speed: 40,
  jumpVelocity: 260,
  actionIntervalMs: 1400,
  rangePx: 0,
  projectileSpeed: 0,
  projectileDamage: 0,
};
