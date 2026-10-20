import Phaser from "phaser";
import type { Ability, AbilityEffect } from "../characters/ability.ts";
import { createAbility } from "../characters/abilityRegistry.ts";
import type { CharacterDef } from "../content/types.ts";
import { type HealthState, applyDamage, createHealth, tickHealth } from "../core/health.ts";
import { TUNING } from "../core/tuning.ts";
import type { ActionSnapshot } from "../input/actions.ts";
import { fireProjectile } from "./Projectile.ts";

export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly def: CharacterDef;
  private readonly abilities: Ability[];
  private readonly shots: Phaser.Physics.Arcade.Group;
  health: HealthState;
  private facing: 1 | -1 = 1;
  private knockbackMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    def: CharacterDef,
    shots: Phaser.Physics.Arcade.Group,
  ) {
    super(scene, x, y, def.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.def = def;
    this.shots = shots;
    this.health = createHealth(def.maxHp);
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.hitbox.width, def.hitbox.height);
    body.setOffset(def.hitbox.offsetX, def.hitbox.offsetY);
    this.abilities = def.abilities.map((id) => createAbility(id, TUNING));
  }

  update(snapshot: ActionSnapshot, dtMs: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.health = tickHealth(this.health, dtMs);
    this.knockbackMs = Math.max(0, this.knockbackMs - dtMs);
    this.setAlpha(
      this.health.invulnMs > 0 && Math.floor(this.health.invulnMs / 100) % 2 === 0 ? 0.4 : 1,
    );
    if (snapshot.held.left && !snapshot.held.right) this.facing = -1;
    else if (snapshot.held.right && !snapshot.held.left) this.facing = 1;

    const merged: AbilityEffect = {};
    for (const ability of this.abilities) {
      const effect = ability.update({
        dtMs,
        held: snapshot.held,
        pressed: snapshot.pressed,
        grounded: body.blocked.down,
        facing: this.facing,
        velocityY: body.velocity.y,
        activeShots: this.shots.countActive(true),
      });
      if (effect.velocityX !== undefined) merged.velocityX = effect.velocityX;
      if (effect.velocityY !== undefined) merged.velocityY = effect.velocityY;
      if (effect.ignoreGravity !== undefined) merged.ignoreGravity = effect.ignoreGravity;
      if (effect.fire) merged.fire = true;
    }

    if (merged.velocityX !== undefined && this.knockbackMs <= 0)
      this.setVelocityX(merged.velocityX);
    if (merged.velocityY !== undefined) this.setVelocityY(merged.velocityY);
    body.setAllowGravity(!merged.ignoreGravity);
    this.setFlipX(this.facing < 0);

    if (merged.fire) {
      fireProjectile(
        this.shots,
        this.x + this.def.muzzle.x * this.facing,
        this.y - this.def.muzzle.y,
        TUNING.shotSpeed * this.facing,
        0,
        this.def.projectileTextureKey,
        this.def.shotDamage,
        "player",
        TUNING.shotLifetimeMs,
      );
    }
  }

  takeDamage(amount: number, fromX: number): void {
    const result = applyDamage(this.health, amount, TUNING.invulnerabilityMs);
    if (!result.applied) return;
    this.health = result.state;
    this.knockbackMs = 150;
    this.setVelocityX(this.x >= fromX ? TUNING.knockbackSpeed : -TUNING.knockbackSpeed);
  }
}
