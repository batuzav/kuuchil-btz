import Phaser from "phaser";
import {
  BACKGROUND_COLOR,
  GAME_HEIGHT,
  GAME_TITLE,
  GAME_WIDTH,
  GRAVITY_Y,
  RENDER_OPTIONS,
  SCALE_OPTIONS,
} from "./core/gameConfig.ts";
import { BootScene } from "./scenes/BootScene.ts";

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  title: GAME_TITLE,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: BACKGROUND_COLOR,
  pixelArt: RENDER_OPTIONS.pixelArt,
  roundPixels: RENDER_OPTIONS.roundPixels,
  antialias: RENDER_OPTIONS.antialias,
  scale: {
    mode: Phaser.Scale[SCALE_OPTIONS.mode],
    autoCenter: Phaser.Scale[SCALE_OPTIONS.autoCenter],
  },
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false } },
  scene: [BootScene],
});
