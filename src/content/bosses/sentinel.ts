import type { BossDef } from "../types.ts";

const BODY = { width: 24, height: 28, offsetX: 4, offsetY: 4 };

export const sentinel: BossDef = {
  id: "sentinel",
  name: "Centinela",
  textureKey: "boss-sentinel",
  hitbox: BODY,
  maxHp: 32,
  contactDamage: 3,
  introMs: 1200,
  phases: [
    { id: "phase-1", enterAtHpFraction: 1, idleMs: 900, attackCycle: ["dash", "spread"] },
    { id: "phase-2", enterAtHpFraction: 0.5, idleMs: 600, attackCycle: ["slam", "dash", "spread"] },
  ],
  attacks: [
    {
      id: "dash",
      pattern: "dash",
      telegraphMs: 600,
      activeMs: 500,
      recoveryMs: 500,
      damage: 3,
      hitbox: BODY,
      speed: 220,
      count: 1,
    },
    {
      id: "spread",
      pattern: "shot-spread",
      telegraphMs: 500,
      activeMs: 300,
      recoveryMs: 600,
      damage: 2,
      hitbox: { width: 4, height: 4, offsetX: 0, offsetY: 0 },
      speed: 120,
      count: 3,
    },
    {
      id: "slam",
      pattern: "slam",
      telegraphMs: 700,
      activeMs: 600,
      recoveryMs: 700,
      damage: 4,
      hitbox: BODY,
      speed: 260,
      count: 1,
    },
  ],
};
