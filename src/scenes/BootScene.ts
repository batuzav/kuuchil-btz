import Phaser from "phaser";
import { GAME_TITLE, SCENES } from "../core/gameConfig.ts";
import { getBrowserStorage, loadBindings } from "../input/bindingsStore.ts";
import { BINDINGS_REGISTRY_KEY } from "./sceneInput.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    this.registry.set(BINDINGS_REGISTRY_KEY, loadBindings(getBrowserStorage()));
    this.add.text(8, 8, GAME_TITLE, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#e5e7eb",
    });
    this.scene.start(SCENES.menu);
  }
}
