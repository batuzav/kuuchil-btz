import Phaser from "phaser";
import type { EnemyDef } from "../content/types.ts";
import { hopperStep, turretStep, walkerDirection } from "../core/enemyAi.ts";
import { type HealthState, createHealth } from "../core/health.ts";
import { fireProjectile } from "./Projectile.ts";

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly def: EnemyDef;
  health: HealthState;
  private dir: 1 | -1 = -1;
  private timerMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, def: EnemyDef) {
    super(scene, x, y, def.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.def = def;
    this.health = createHealth(def.maxHp);
    this.setOrigin(0.5, 1);
    this.configureBody();
  }

  /** Se vuelve a llamar tras añadirlo a un grupo, porque el grupo reescribe los valores del body. */
  configureBody(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.def.hitbox.width, this.def.hitbox.height);
    body.setOffset(this.def.hitbox.offsetX, this.def.hitbox.offsetY);
    if (this.def.behavior === "turret") {
      body.setAllowGravity(false);
      body.setImmovable(true);
    }
  }

  update(
    dtMs: number,
    player: Phaser.GameObjects.Sprite,
    ground: Phaser.Tilemaps.TilemapLayer,
    enemyShots: Phaser.Physics.Arcade.Group,
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const towardPlayer: 1 | -1 = player.x >= this.x ? 1 : -1;
    switch (this.def.behavior) {
      case "walker": {
        const blocked = this.dir === 1 ? body.blocked.right : body.blocked.left;
        const groundAhead = ground.getTileAtWorldXY(this.x + this.dir * 10, this.y + 2) !== null;
        this.dir = walkerDirection(this.dir, blocked, groundAhead);
        this.setVelocityX(this.dir * this.def.speed);
        this.setFlipX(this.dir < 0);
        break;
      }
      case "hopper": {
        const step = hopperStep(this.timerMs, dtMs, this.def, body.blocked.down);
        this.timerMs = step.timerMs;
        this.setVelocityX(towardPlayer * this.def.speed);
        if (step.jump) this.setVelocityY(-this.def.jumpVelocity);
        break;
      }
      case "turret": {
        const step = turretStep(this.timerMs, dtMs, this.def, Math.abs(player.x - this.x));
        this.timerMs = step.timerMs;
        this.setFlipX(towardPlayer < 0);
        if (step.fire) {
          fireProjectile(
            enemyShots,
            this.x,
            this.y - this.def.hitbox.offsetY - this.def.hitbox.height / 2,
            this.def.projectileSpeed * towardPlayer,
            0,
            "projectile-enemy",
            this.def.projectileDamage,
            "enemy",
            2000,
          );
        }
        break;
      }
    }
  }
}
