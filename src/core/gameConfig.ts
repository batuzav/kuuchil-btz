import { TUNING } from "./tuning.ts";

export const GAME_TITLE = "kuuchil-btz";
export const GAME_WIDTH = 240;
export const GAME_HEIGHT = 160;
export const TILE_SIZE = 16;
export const BACKGROUND_COLOR = "#0f1226";
export const GRAVITY_Y = TUNING.gravityY;
export const RENDER_OPTIONS = { pixelArt: true, roundPixels: true, antialias: false } as const;
export const SCALE_OPTIONS = { mode: "FIT", autoCenter: "CENTER_BOTH" } as const;
export const SCENES = {
  boot: "BootScene",
  menu: "MenuScene",
  controls: "ControlsScene",
  stage: "StageScene",
} as const;
