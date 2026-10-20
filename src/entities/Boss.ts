import Phaser from "phaser";
import { PALETTE } from "../assets/palette.ts";
import { type BossState, createBossState, stepBoss } from "../bosses/fsm.ts";
import { dashVelocity, slamVelocity, spreadVelocities } from "../bosses/patterns.ts";
import type { BossAttackDef, BossDef } from "../content/types.ts";
import { type HealthState, createHealth } from "../core/health.ts";
import { TUNING } from "../core/tuning.ts";
import { fireProjectile } from "./Projectile.ts";

export class Boss extends Phaser.Physics.Arcade.Sprite {
  readonly def: BossDef;
  health: HealthState;
  fsm: BossState;
  private blinkMs = 0;
  private blinkOn = false;

  constructor(scene: Phaser.Scene, x: number, y: number, def: BossDef) {
    super(scene, x, y, def.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.def = def;
    this.health = createHealth(def.maxHp);
    this.fsm = createBossState(def);
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(def.hitbox.width, def.hitbox.height);
    body.setOffset(def.hitbox.offsetX, def.hitbox.offsetY);
  }

  // Phaser 4: setTintFill() ya no recibe color; el relleno es un modo de tinte aparte.
  private flash(): void {
    this.setTint(PALETTE.telegraph).setTintMode(Phaser.TintModes.FILL);
  }

  private unflash(): void {
    this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
  }

  private currentAttack(): BossAttackDef | undefined {
    return this.def.attacks.find((a) => a.id === this.fsm.attackId);
  }

  update(
    dtMs: number,
    player: Phaser.GameObjects.Sprite,
    bossShots: Phaser.Physics.Arcade.Group,
  ): void {
    if (!this.body) return;
    const previous = this.fsm.kind;
    this.fsm = stepBoss(this.def, this.fsm, dtMs, this.health.hp);
    const kind = this.fsm.kind;

    if (kind === "telegraph") {
      if (previous !== "telegraph") {
        this.blinkMs = 0;
        this.blinkOn = true;
        this.flash();
      } else {
        this.blinkMs += dtMs;
        if (this.blinkMs >= TUNING.telegraphBlinkMs) {
          this.blinkMs = 0;
          this.blinkOn = !this.blinkOn;
          if (this.blinkOn) this.flash();
          else this.unflash();
        }
      }
    } else if (previous === "telegraph") {
      this.unflash();
    }

    if (kind === "active" && previous !== "active") this.startAttack(player, bossShots);
    if (kind === "recovery" || kind === "idle" || kind === "intro") this.setVelocityX(0);
    if (kind === "defeated") {
      this.unflash();
      this.setVelocity(0, 0);
    }
  }

  private startAttack(
    player: Phaser.GameObjects.Sprite,
    bossShots: Phaser.Physics.Arcade.Group,
  ): void {
    const attack = this.currentAttack();
    if (!attack) return;
    const toward: 1 | -1 = player.x >= this.x ? 1 : -1;
    this.setFlipX(toward < 0);
    switch (attack.pattern) {
      case "dash":
        this.setVelocityX(dashVelocity(this.x, player.x, attack.speed));
        break;
      case "shot-spread":
        for (const { vx, vy } of spreadVelocities(attack.count, attack.speed, toward)) {
          fireProjectile(
            bossShots,
            this.x,
            this.y - 16,
            vx,
            vy,
            "projectile-enemy",
            attack.damage,
            "enemy",
            2000,
          );
        }
        break;
      case "slam": {
        const slam = slamVelocity(this.x, player.x, attack.speed);
        this.setVelocity(slam.vx, slam.vy);
        break;
      }
    }
  }

  currentContactDamage(): number {
    const attack = this.currentAttack();
    if (
      this.fsm.kind === "active" &&
      attack &&
      (attack.pattern === "dash" || attack.pattern === "slam")
    ) {
      return attack.damage;
    }
    return this.def.contactDamage;
  }
}
