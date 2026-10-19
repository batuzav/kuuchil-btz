import { describe, expect, it } from "vitest";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAVITY_Y,
  RENDER_OPTIONS,
  SCALE_OPTIONS,
  TILE_SIZE,
} from "../src/core/gameConfig.ts";
import { TUNING } from "../src/core/tuning.ts";

describe("game config", () => {
  it("is 240x160 pixel art with FIT scaling", () => {
    expect(GAME_WIDTH).toBe(240);
    expect(GAME_HEIGHT).toBe(160);
    expect(RENDER_OPTIONS).toEqual({ pixelArt: true, roundPixels: true, antialias: false });
    expect(SCALE_OPTIONS).toEqual({ mode: "FIT", autoCenter: "CENTER_BOTH" });
  });

  it("shows 15x10 tiles and takes gravity from tuning", () => {
    expect(GAME_WIDTH / TILE_SIZE).toBe(15);
    expect(GAME_HEIGHT / TILE_SIZE).toBe(10);
    expect(GRAVITY_Y).toBe(TUNING.gravityY);
  });
});
