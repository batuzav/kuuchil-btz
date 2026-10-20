import type Phaser from "phaser";

export type ProjectileOwner = "player" | "enemy";

const hookedWorlds = new WeakSet<Phaser.Physics.Arcade.World>();

export function fireProjectile(
  group: Phaser.Physics.Arcade.Group,
  x: number,
  y: number,
  vx: number,
  vy: number,
  textureKey: string,
  damage: number,
  owner: ProjectileOwner,
  lifetimeMs: number,
): Phaser.Physics.Arcade.Sprite {
  const scene = group.scene;
  const world = scene.physics.world;
  if (!hookedWorlds.has(world)) {
    hookedWorlds.add(world);
    world.on("worldbounds", (body: Phaser.Physics.Arcade.Body) => {
      if (body.gameObject?.getData("projectile")) body.gameObject.destroy();
    });
  }
  const shot = group.create(x, y, textureKey) as Phaser.Physics.Arcade.Sprite;
  const body = shot.body as Phaser.Physics.Arcade.Body;
  body.setAllowGravity(false);
  body.setCollideWorldBounds(true);
  body.onWorldBounds = true;
  shot.setVelocity(vx, vy);
  shot.setData({ projectile: true, damage, owner });
  scene.time.delayedCall(lifetimeMs, () => {
    if (shot.active) shot.destroy();
  });
  return shot;
}
