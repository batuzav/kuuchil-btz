import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { type AnimContext, pickAnimation } from "../src/characters/animationState.ts";
import { MANIFEST } from "../src/assets/manifest.ts";
import { DEFAULT_CHARACTER_ID, getCharacter } from "../src/content/registry.ts";
import { TUNING } from "../src/core/tuning.ts";

const base: AnimContext = {
  grounded: true,
  velocityX: 0,
  velocityY: 0,
  dashing: false,
  shooting: false,
  hurt: false,
  dead: false,
};

describe("pickAnimation", () => {
  it("chooses idle, run, jump and fall from movement", () => {
    expect(pickAnimation(base)).toBe("idle");
    expect(pickAnimation({ ...base, velocityX: TUNING.runSpeed })).toBe("run");
    expect(pickAnimation({ ...base, velocityX: -TUNING.runSpeed })).toBe("run");
    expect(pickAnimation({ ...base, grounded: false, velocityY: -100 })).toBe("jump");
    expect(pickAnimation({ ...base, grounded: false, velocityY: 100 })).toBe("fall");
  });

  it("shows the shoot pose only while standing still on the ground", () => {
    expect(pickAnimation({ ...base, shooting: true })).toBe("shoot");
    expect(pickAnimation({ ...base, shooting: true, velocityX: TUNING.runSpeed })).toBe("run");
    expect(pickAnimation({ ...base, shooting: true, grounded: false, velocityY: -50 })).toBe(
      "jump",
    );
  });

  it("applies the priority dead > hurt > dash > air > shoot", () => {
    const all = { ...base, dead: true, hurt: true, dashing: true, shooting: true, grounded: false };
    expect(pickAnimation(all)).toBe("dead");
    expect(pickAnimation({ ...all, dead: false })).toBe("hurt");
    expect(pickAnimation({ ...all, dead: false, hurt: false })).toBe("dash");
  });
});

describe("character sheet", () => {
  const def = getCharacter(DEFAULT_CHARACTER_ID);
  const spec = MANIFEST[def?.textureKey ?? ""];

  it("matches the PNG dimensions declared in the manifest", () => {
    expect(spec?.kind).toBe("file");
    if (spec?.kind !== "file" || !spec.frameWidth || !spec.frameHeight) return;
    const png = readFileSync(`public/${spec.path}`);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    expect(width % spec.frameWidth).toBe(0);
    expect(height % spec.frameHeight).toBe(0);
  });

  it("only references frames that exist in the sheet", () => {
    if (spec?.kind !== "file" || !spec.frameWidth || !spec.frameHeight) return;
    const png = readFileSync(`public/${spec.path}`);
    const total =
      (png.readUInt32BE(16) / spec.frameWidth) * (png.readUInt32BE(20) / spec.frameHeight);
    for (const anim of Object.values(def?.animations ?? {})) {
      expect(anim.frames.length).toBeGreaterThan(0);
      expect(anim.fps).toBeGreaterThan(0);
      for (const f of anim.frames) {
        expect(Number.isInteger(f)).toBe(true);
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThan(total);
      }
    }
  });

  it("keeps the hitbox inside the cell and centered, so flipping does not shift it", () => {
    if (spec?.kind !== "file" || !spec.frameWidth || !spec.frameHeight || !def) return;
    const { width, height, offsetX, offsetY } = def.hitbox;
    expect(offsetX + width).toBeLessThanOrEqual(spec.frameWidth);
    expect(offsetY + height).toBeLessThanOrEqual(spec.frameHeight);
    expect(offsetX + width / 2).toBe(spec.frameWidth / 2);
  });
});
