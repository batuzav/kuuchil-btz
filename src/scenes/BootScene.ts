import Phaser from "phaser";
import { MANIFEST } from "../assets/manifest.ts";
import { TEXT_STYLE } from "../assets/palette.ts";
import { generatePlaceholders } from "../assets/placeholders.ts";
import { CONTENT } from "../content/registry.ts";
import { GAME_TITLE, SCENES } from "../core/gameConfig.ts";
import { createCharacterAnimations } from "../entities/animations.ts";
import { getBrowserStorage, loadBindings } from "../input/bindingsStore.ts";
import { BINDINGS_REGISTRY_KEY } from "./sceneInput.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  preload(): void {
    this.add.text(8, 144, "Cargando...", TEXT_STYLE);
    for (const [key, spec] of Object.entries(MANIFEST)) {
      if (spec.kind !== "file") continue;
      if (spec.frameWidth !== undefined && spec.frameHeight !== undefined) {
        this.load.spritesheet(key, spec.path, {
          frameWidth: spec.frameWidth,
          frameHeight: spec.frameHeight,
        });
      } else {
        this.load.image(key, spec.path);
      }
    }
  }

  create(): void {
    generatePlaceholders(
      MANIFEST,
      (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h }),
      (key, canvas) => {
        this.textures.addCanvas(key, canvas);
      },
    );
    for (const character of CONTENT.characters) createCharacterAnimations(this, character);
    this.registry.set(BINDINGS_REGISTRY_KEY, loadBindings(getBrowserStorage()));
    this.add.text(8, 8, GAME_TITLE, { ...TEXT_STYLE, fontSize: "16px" });
    this.scene.start(SCENES.menu);
  }
}
