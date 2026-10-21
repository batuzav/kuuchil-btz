import { describe, expect, it } from "vitest";
import { hasAbility } from "../src/characters/abilityRegistry.ts";
import { DEFAULT_CHARACTER_ID, getCharacter } from "../src/content/registry.ts";

describe("default character", () => {
  const character = getCharacter(DEFAULT_CHARACTER_ID);

  it("is registered and every ability resolves", () => {
    expect(character).toBeDefined();
    for (const id of character?.abilities ?? []) expect(hasAbility(id)).toBe(true);
  });

  it("uses run, jump, crouch, dash, shoot in that order with a sane hitbox", () => {
    expect(character?.abilities).toEqual(["run", "jump", "crouch", "dash", "shoot"]);
    const h = character?.hitbox;
    expect(h?.width).toBeGreaterThan(0);
    expect(h?.height).toBeGreaterThan(0);
    expect(h?.offsetX).toBeGreaterThanOrEqual(0);
    expect(h?.offsetY).toBeGreaterThanOrEqual(0);
  });
});
