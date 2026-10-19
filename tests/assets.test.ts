import { describe, expect, it } from "vitest";
import { MANIFEST } from "../src/assets/manifest.ts";
import { PALETTE } from "../src/assets/palette.ts";
import { type FillContext, drawPlaceholder } from "../src/assets/placeholders.ts";
import { CONTENT } from "../src/content/registry.ts";

const placeholders = Object.entries(MANIFEST).flatMap(([key, spec]) =>
  spec.kind === "placeholder" ? [[key, spec] as const] : [],
);

describe("asset manifest", () => {
  it("uses only PALETTE colors", () => {
    const values = new Set<number>(Object.values(PALETTE));
    for (const [, spec] of placeholders) {
      expect(values.has(spec.color)).toBe(true);
      if (spec.accent !== null) expect(values.has(spec.accent)).toBe(true);
    }
  });

  it("defines the tile placeholder as a 32x16 tiles sheet", () => {
    const tiles = MANIFEST["tiles-placeholder"];
    expect(tiles).toMatchObject({ kind: "placeholder", shape: "tiles", width: 32, height: 16 });
  });

  it("covers every texture key referenced by CONTENT", () => {
    const keys = [
      ...CONTENT.characters.flatMap((c) => [c.textureKey, c.projectileTextureKey]),
      ...CONTENT.enemies.map((e) => e.textureKey),
      ...CONTENT.bosses.map((b) => b.textureKey),
      ...CONTENT.stages.map((s) => s.tilesetTextureKey),
    ];
    for (const key of keys) expect(MANIFEST[key]).toBeDefined();
  });

  it("draws every placeholder inside its own bounds", () => {
    for (const [, spec] of placeholders) {
      const rects: number[][] = [];
      const ctx: FillContext = {
        fillStyle: "",
        fillRect: (x, y, w, h) => void rects.push([x, y, w, h]),
      };
      drawPlaceholder(ctx, spec);
      expect(rects.length).toBeGreaterThan(0);
      for (const [x, y, w, h] of rects as [number, number, number, number][]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(spec.width);
        expect(y + h).toBeLessThanOrEqual(spec.height);
      }
    }
  });
});
