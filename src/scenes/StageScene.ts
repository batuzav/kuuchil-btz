import Phaser from "phaser";
import { DEFAULT_CHARACTER_ID, getCharacter, getStage } from "../content/registry.ts";
import type { StageDef } from "../content/types.ts";
import { extractSpawns } from "../content/validate.ts";
import { SCENES } from "../core/gameConfig.ts";
import { hpFraction, isDead } from "../core/health.ts";
import { TUNING } from "../core/tuning.ts";
import type { Bindings } from "../input/actions.ts";
import { keyLabel } from "../input/bindings.ts";
import type { InputManager } from "../input/inputManager.ts";
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
  private dying = false;

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
    const layer = tileset ? map.createLayer(stage.groundLayer, tileset, 0, 0) : null;
    if (!layer) throw new Error(`No se pudo crear la capa ${stage.groundLayer}`);
    layer.setCollisionByExclusion([-1]);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 64);

    const spawns = extractSpawns(this.cache.json.get(`${stage.mapKey}-raw`), stage.spawnLayer);
    const start = spawns?.playerStarts[0];
    const def = getCharacter(DEFAULT_CHARACTER_ID);
    if (!start || !def) throw new Error("Falta player_start o personaje por defecto");

    const shots = this.physics.add.group({ allowGravity: false });
    this.player = new Player(this, start.x, start.y, def, shots);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, layer);
    this.physics.add.collider(shots, layer, (shot) => {
      (shot as Phaser.Physics.Arcade.Sprite).destroy();
    });

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
    if (this.player.y > this.mapHeight + 16)
      this.player.takeDamage(this.player.def.maxHp, this.player.x);
    if (isDead(this.player.health)) {
      this.die();
    } else {
      this.player.update(snapshot, delta);
    }
    this.hud?.setPlayer(hpFraction(this.player.health));
  }

  private die(): void {
    if (this.dying) return;
    this.dying = true;
    this.hud?.showMessage("K.O.");
    this.player?.setVelocity(0, 0);
    this.time.delayedCall(TUNING.deathRestartDelayMs, () => {
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
