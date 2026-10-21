import { describe, expect, it } from "vitest";
import { MANIFEST } from "../src/assets/manifest.ts";
import { DEFAULT_CHARACTER_ID, CONTENT, getCharacter } from "../src/content/registry.ts";

// Franja vertical (px sobre los pies) que ocupa algo cuyo sprite apoya los pies en el borde inferior de su celda.
function cellHeight(textureKey: string): number {
  const spec = MANIFEST[textureKey];
  if (spec?.kind === "placeholder") return spec.height;
  return spec?.frameHeight ?? 0;
}

const overlaps = (a: [number, number], b: [number, number]): boolean =>
  a[0] <= b[1] && b[0] <= a[1];
const BULLET_HALF_HEIGHT = 2; // la bala del jugador mide 4 px

describe("crouch reach", () => {
  const def = getCharacter(DEFAULT_CHARACTER_ID);

  it("lets the crouched shot hit every registered enemy standing on the ground", () => {
    if (!def) throw new Error("falta el personaje por defecto");
    const shot: [number, number] = [
      def.crouchMuzzle.y - BULLET_HALF_HEIGHT,
      def.crouchMuzzle.y + BULLET_HALF_HEIGHT,
    ];
    for (const enemy of CONTENT.enemies) {
      const h = cellHeight(enemy.textureKey);
      const body: [number, number] = [
        h - enemy.hitbox.offsetY - enemy.hitbox.height,
        h - enemy.hitbox.offsetY,
      ];
      expect(overlaps(shot, body), `${enemy.id}: franja ${body} vs bala ${shot}`).toBe(true);
    }
  });
});
