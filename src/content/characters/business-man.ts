import type { CharacterDef } from "../types.ts";

// Hoja public/sprites/business-man.png: celdas de 48x48, 9 columnas; una fila por animación
// (idle, run, jump, dash, shoot, hurt, death). Índice de cuadro = fila * 9 + columna.
const COLS = 9;
const row = (r: number, ...cols: number[]): number[] => cols.map((c) => r * COLS + c);

export const businessMan: CharacterDef = {
  id: "business-man",
  name: "Business Man",
  textureKey: "business-man",
  projectileTextureKey: "projectile-player",
  // Cuerpo dibujado: ~10 px de ancho y 37 de alto, pies en la fila 47 de la celda.
  // La hitbox es más baja que el dibujo (30 de 37 px) para caber bajo plataformas a 32 px del suelo.
  hitbox: { width: 10, height: 30, offsetX: 19, offsetY: 17 },
  muzzle: { x: 22, y: 28 }, // boca de la pistola, medida sobre el cuadro de disparo
  maxHp: 16,
  shotDamage: 1,
  abilities: ["run", "jump", "dash", "shoot"],
  animations: {
    idle: { frames: row(0, 0, 1, 2, 3), fps: 5, loop: true },
    run: { frames: row(1, 0, 1, 2, 3, 4, 5, 6, 7), fps: 12, loop: true },
    jump: { frames: row(2, 3), fps: 1, loop: false },
    fall: { frames: row(2, 6), fps: 1, loop: false },
    dash: { frames: row(3, 1, 2, 3, 4), fps: 18, loop: false },
    shoot: { frames: row(4, 4, 7, 6, 5), fps: 14, loop: false },
    hurt: { frames: row(5, 1, 2, 3, 4), fps: 16, loop: false },
    dead: { frames: row(6, 0, 1, 2, 3, 4, 5, 6), fps: 10, loop: false },
  },
};
