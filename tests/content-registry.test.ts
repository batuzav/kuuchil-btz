import { describe, expect, it } from "vitest";
import { CONTENT } from "../src/content/registry.ts";
import type { Hitbox } from "../src/content/types.ts";

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe("content registry", () => {
  it("registers walker, hopper and turret with unique ids per kind", () => {
    const ids = CONTENT.enemies.map((e) => e.id);
    for (const id of ["walker", "hopper", "turret"]) expect(ids).toContain(id);
    expect(unique(ids)).toBe(true);
    expect(unique(CONTENT.bosses.map((b) => b.id))).toBe(true);
    expect(unique(CONTENT.characters.map((c) => c.id))).toBe(true);
    expect(unique(CONTENT.stages.map((s) => s.id))).toBe(true);
  });

  it("has valid hitboxes everywhere", () => {
    const boxes: Hitbox[] = [
      ...CONTENT.enemies.map((e) => e.hitbox),
      ...CONTENT.bosses.map((b) => b.hitbox),
      ...CONTENT.characters.map((c) => c.hitbox),
    ];
    for (const h of boxes) {
      expect(h.width).toBeGreaterThan(0);
      expect(h.height).toBeGreaterThan(0);
      expect(h.offsetX).toBeGreaterThanOrEqual(0);
      expect(h.offsetY).toBeGreaterThanOrEqual(0);
    }
  });

  it("gives turrets and hoppers the fields their behavior needs", () => {
    for (const t of CONTENT.enemies.filter((e) => e.behavior === "turret")) {
      expect(t.rangePx).toBeGreaterThan(0);
      expect(t.actionIntervalMs).toBeGreaterThan(0);
      expect(t.projectileSpeed).toBeGreaterThan(0);
    }
    for (const h of CONTENT.enemies.filter((e) => e.behavior === "hopper")) {
      expect(h.jumpVelocity).toBeGreaterThan(0);
      expect(h.actionIntervalMs).toBeGreaterThan(0);
    }
  });
});
