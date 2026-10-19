import Phaser from "phaser";
import { GAME_TITLE, SCENES } from "../core/gameConfig.ts";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    this.add.text(8, 8, GAME_TITLE, {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#e5e7eb",
    });
  }
}
