import Phaser from "phaser";
import {
  DEFAULT_CHARACTER_ID,
  getBoss,
  getCharacter,
  getEnemy,
  getStage,
} from "../content/registry.ts";
import type { StageDef } from "../content/types.ts";
import { extractSpawns } from "../content/validate.ts";
import { SCENES } from "../core/gameConfig.ts";
import { applyDamage, hpFraction, isDead } from "../core/health.ts";
import { type StageFlowEvent, type StageFlowState, nextFlow } from "../core/stageFlow.ts";
import { TUNING } from "../core/tuning.ts";
import type { Bindings } from "../input/actions.ts";
import { keyLabel } from "../input/bindings.ts";
import type { InputManager } from "../input/inputManager.ts";
import { Boss } from "../entities/Boss.ts";
import { Enemy } from "../entities/Enemy.ts";
import { Player } from "../entities/Player.ts";
import { type Hud, createHud } from "./hud.ts";
import { BINDINGS_REGISTRY_KEY, createSceneInput } from "./sceneInput.ts";

const STYLE = { fontFamily: "monospace", fontSize: "8px", color: "#e5e7eb" };

export class StageScene extends Phaser.Scene {
  private stageId = "";
  private stage: StageDef | undefined;
  private input2!: InputManager;
  private player: Player | null = null;
  private paused = false;
  private pauseText: Phaser.GameObjects.Text | null = null;
  private hud: Hud | null = null;
  private mapHeight = 0;
  private ground: Phaser.Tilemaps.TilemapLayer | null = null;
  private enemies: Phaser.Physics.Arcade.Group | null = null;
  private enemyShots: Phaser.Physics.Arcade.Group | null = null;
  private dying = false;
  private flow: StageFlowState = "exploring";
  private boss: Boss | null = null;
  private mapWidth = 0;
  private spawns: ReturnType<typeof extractSpawns> = null;
  private playerShots: Phaser.Physics.Arcade.Group | null = null;

  constructor() {
    super(SCENES.stage);
  }

  init(data: { stageId?: string }): void {
    this.stageId = data.stageId ?? "";
    this.stage = getStage(this.stageId);
    this.player = null;
    this.paused = false;
    this.pauseText = null;
    this.hud = null;
    this.dying = false;
    this.ground = null;
    this.enemies = null;
    this.enemyShots = null;
    this.flow = "exploring";
    this.boss = null;
    this.spawns = null;
    this.playerShots = null;
  }

  preload(): void {
    if (!this.stage) return;
    this.load.tilemapTiledJSON(this.stage.mapKey, this.stage.mapPath);
    this.load.json(`${this.stage.mapKey}-raw`, this.stage.mapPath);
  }

  create(): void {
    this.input2 = createSceneInput(this);
    const stage = this.stage;
    if (!stage) {
      this.add.text(8, 8, `Etapa no registrada: ${this.stageId}`, STYLE);
      return;
    }

    const map = this.make.tilemap({ key: stage.mapKey });
    const tileset = map.addTilesetImage(stage.tilesetName, stage.tilesetTextureKey, 16, 16, 0, 0);
    const created = tileset ? map.createLayer(stage.groundLayer, tileset, 0, 0) : null;
    // Phaser 4 puede devolver una TilemapGPULayer; la IA de enemigos necesita la TilemapLayer clásica.
    if (!(created instanceof Phaser.Tilemaps.TilemapLayer)) {
      throw new Error(`No se pudo crear la capa ${stage.groundLayer}`);
    }
    const layer = created;
    layer.setCollisionByExclusion([-1]);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 64);

    const spawns = extractSpawns(this.cache.json.get(`${stage.mapKey}-raw`), stage.spawnLayer);
    this.spawns = spawns;
    this.mapWidth = map.widthInPixels;
    const start = spawns?.playerStarts[0];
    const def = getCharacter(DEFAULT_CHARACTER_ID);
    if (!start || !def) throw new Error("Falta player_start o personaje por defecto");

    const shots = this.physics.add.group({ allowGravity: false });
    this.playerShots = shots;
    this.player = new Player(this, start.x, start.y, def, shots);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, layer);
    this.physics.add.collider(shots, layer, (shot) => {
      (shot as Phaser.Physics.Arcade.Sprite).destroy();
    });

    this.ground = layer;
    this.enemyShots = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    for (const spawn of spawns?.enemies ?? []) {
      const enemyDef = getEnemy(spawn.enemyId);
      if (!enemyDef) continue;
      const enemy = new Enemy(this, spawn.x, spawn.y, enemyDef);
      this.enemies.add(enemy);
      enemy.configureBody();
    }
    this.physics.add.collider(this.enemies, layer);
    this.physics.add.overlap(shots, this.enemies, (shot, enemyObj) => {
      const bullet = shot as Phaser.Physics.Arcade.Sprite;
      const enemy = enemyObj as Enemy;
      const hit = applyDamage(enemy.health, Number(bullet.getData("damage")), 0);
      enemy.health = hit.state;
      bullet.destroy();
      if (isDead(enemy.health)) enemy.destroy();
    });
    this.physics.add.overlap(this.player, this.enemies, (_p, enemyObj) => {
      const enemy = enemyObj as Enemy;
      this.player?.takeDamage(enemy.def.contactDamage, enemy.x);
    });
    this.physics.add.overlap(this.player, this.enemyShots, (_p, shotObj) => {
      const bullet = shotObj as Phaser.Physics.Arcade.Sprite;
      this.player?.takeDamage(Number(bullet.getData("damage")), bullet.x);
      bullet.destroy();
    });
    this.physics.add.collider(this.enemyShots, layer, (shot) => {
      (shot as Phaser.Physics.Arcade.Sprite).destroy();
    });
    for (const trigger of spawns?.bossTriggers ?? []) {
      const zone = this.add.zone(trigger.x, trigger.y, trigger.width, trigger.height).setOrigin(0);
      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => {
        if (this.flow === "exploring") this.startBossEncounter(trigger.x);
      });
    }
    this.mapHeight = map.heightInPixels;
    this.hud = createHud(this);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player, true);
  }

  update(_time: number, delta: number): void {
    const snapshot = this.input2.update();
    if (!this.stage || !this.player) {
      if (snapshot.pressed.pause) this.scene.start(SCENES.menu);
      return;
    }
    if (snapshot.pressed.pause) this.togglePause();
    if (this.paused) {
      if (snapshot.pressed.jump) this.scene.start(SCENES.menu);
      return;
    }
    const player = this.player;
    if (this.flow === "won") {
      if (snapshot.pressed.jump) this.scene.start(SCENES.menu);
    } else if (player.y > this.mapHeight + 16) {
      player.takeDamage(player.def.maxHp, player.x);
    }
    if (this.flow !== "won" && isDead(player.health)) {
      this.die();
    } else {
      player.update(snapshot, delta);
      const { ground, enemyShots } = this;
      if (ground && enemyShots) {
        for (const child of this.enemies?.getChildren() ?? []) {
          (child as Enemy).update(delta, player, ground, enemyShots);
        }
        this.updateBoss(delta, player, enemyShots);
      }
    }
    this.hud?.setPlayer(hpFraction(player.health));
  }

  private dispatchFlow(event: StageFlowEvent): void {
    this.flow = nextFlow(this.flow, event);
  }

  private startBossEncounter(triggerX: number): void {
    const stage = this.stage;
    const bossDef = stage ? getBoss(stage.bossId) : undefined;
    const spawn = this.spawns?.bossSpawns[0];
    const { ground, player, playerShots, enemyShots } = this;
    if (!bossDef || !spawn || !ground || !player || !playerShots || !enemyShots) return;
    this.dispatchFlow("enteredBossTrigger");
    const width = this.mapWidth - triggerX;
    this.cameras.main.setBounds(triggerX, 0, width, this.mapHeight);
    this.physics.world.setBounds(triggerX, 0, width, this.mapHeight + 64);
    const boss = new Boss(this, spawn.x, spawn.y, bossDef);
    this.boss = boss;
    this.physics.add.collider(boss, ground);
    // Sprite primero, grupo después: con el grupo primero Phaser invierte los argumentos del callback.
    this.physics.add.overlap(boss, playerShots, (_boss, shot) => {
      const bullet = shot as Phaser.Physics.Arcade.Sprite;
      boss.health = applyDamage(boss.health, Number(bullet.getData("damage")), 0).state;
      bullet.destroy();
    });
    this.physics.add.overlap(player, boss, () => {
      player.takeDamage(boss.currentContactDamage(), boss.x);
    });
    this.hud?.setBoss(1);
  }

  private updateBoss(delta: number, player: Player, enemyShots: Phaser.Physics.Arcade.Group): void {
    const boss = this.boss;
    if (!boss) return;
    boss.update(delta, player, enemyShots);
    this.hud?.setBoss(hpFraction(boss.health));
    if (this.flow === "bossIntro" && boss.fsm.kind !== "intro") this.dispatchFlow("bossIntroDone");
    if (this.flow === "bossFight" && boss.fsm.kind === "defeated") {
      this.dispatchFlow("bossDefeated");
      const b = this.registry.get(BINDINGS_REGISTRY_KEY) as Bindings;
      this.hud?.showMessage(`VICTORIA - ${keyLabel(b.jump)}: menú`);
    }
  }

  private die(): void {
    if (this.dying) return;
    this.dying = true;
    this.dispatchFlow("playerDied");
    this.hud?.showMessage("K.O.");
    this.player?.setVelocity(0, 0);
    this.time.delayedCall(TUNING.deathRestartDelayMs, () => {
      this.dispatchFlow("restart");
      this.scene.restart({ stageId: this.stageId });
    });
  }

  private togglePause(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      const b = this.registry.get(BINDINGS_REGISTRY_KEY) as Bindings;
      const text = `PAUSA - ${keyLabel(b.pause)}: seguir / ${keyLabel(b.jump)}: menú`;
      this.pauseText = this.add.text(120, 80, text, STYLE).setOrigin(0.5).setScrollFactor(0);
    } else {
      this.physics.resume();
      this.pauseText?.destroy();
      this.pauseText = null;
    }
  }
}
