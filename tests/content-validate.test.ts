import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT } from "../src/content/registry.ts";
import type { ContentRegistry } from "../src/content/types.ts";
import { validateContent } from "../src/content/validate.ts";

const hb = { width: 8, height: 8, offsetX: 0, offsetY: 0 };

const fixture = (telegraphMs = 300, bossId = "b1"): ContentRegistry => ({
  stages: [
    {
      id: "s1",
      name: "S",
      mapKey: "s1",
      mapPath: "maps/s1.tmj",
      tilesetName: "ts",
      tilesetTextureKey: "t",
      groundLayer: "ground",
      spawnLayer: "spawns",
      bossId,
      minibossIds: [],
      music: null,
    },
  ],
  bosses: [
    {
      id: "b1",
      name: "B",
      textureKey: "b",
      hitbox: hb,
      maxHp: 10,
      contactDamage: 1,
      introMs: 0,
      phases: [{ id: "p1", enterAtHpFraction: 1, idleMs: 100, attackCycle: ["a1"] }],
      attacks: [
        {
          id: "a1",
          pattern: "dash",
          telegraphMs,
          activeMs: 100,
          recoveryMs: 100,
          damage: 1,
          hitbox: hb,
          speed: 1,
          count: 1,
        },
      ],
    },
  ],
  enemies: [
    {
      id: "e1",
      name: "E",
      behavior: "walker",
      textureKey: "e",
      hitbox: hb,
      maxHp: 1,
      contactDamage: 1,
      speed: 1,
      jumpVelocity: 0,
      actionIntervalMs: 0,
      rangePx: 0,
      projectileSpeed: 0,
      projectileDamage: 0,
    },
  ],
  characters: [],
});

const map = (over: { ground?: boolean; spawns?: boolean; enemyId?: string } = {}) => ({
  tilewidth: 16,
  tileheight: 16,
  tilesets: [{ name: "ts" }],
  layers: [
    ...(over.ground === false
      ? []
      : [{ type: "tilelayer", name: "ground", width: 3, height: 2, data: [0, 0, 0, 1, 1, 1] }]),
    ...(over.spawns === false
      ? []
      : [
          {
            type: "objectgroup",
            name: "spawns",
            objects: [
              { type: "player_start", x: 0, y: 0 },
              { type: "boss_spawn", x: 1, y: 1 },
              { type: "boss_trigger", x: 0, y: 0, width: 16, height: 16 },
              {
                type: "enemy",
                x: 2,
                y: 2,
                properties: [{ name: "enemyId", value: over.enemyId ?? "e1" }],
              },
            ],
          },
        ]),
  ],
});

const errorsOf = (c: ContentRegistry, m: () => unknown) => validateContent(c, m).join(" | ");

describe("validateContent", () => {
  it("accepts a valid fixture", () => {
    expect(validateContent(fixture(), () => map())).toEqual([]);
  });

  it("flags a missing ground layer", () => {
    expect(errorsOf(fixture(), () => map({ ground: false }))).toContain("ground");
  });

  it("flags a missing spawns layer", () => {
    expect(errorsOf(fixture(), () => map({ spawns: false }))).toContain("spawns");
  });

  it("flags a readMap that throws, naming the map path", () => {
    const e = errorsOf(fixture(), () => {
      throw new Error("boom");
    });
    expect(e).toContain("map");
    expect(e).toContain("maps/s1.tmj");
  });

  it("flags an unregistered enemyId", () => {
    expect(errorsOf(fixture(), () => map({ enemyId: "zzz" }))).toContain("zzz");
  });

  it("flags an unregistered bossId", () => {
    expect(errorsOf(fixture(300, "nope"), () => map())).toContain("nope");
  });

  it("flags a telegraph below the minimum", () => {
    expect(errorsOf(fixture(100), () => map())).toContain("telegraph");
  });

  it("accepts the real registry", () => {
    const read = (p: string) => JSON.parse(readFileSync(join("public", p), "utf8"));
    expect(validateContent(CONTENT, read)).toEqual([]);
  });
});
