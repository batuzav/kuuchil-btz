// Arma public/sprites/business-man.png a partir de art/pixellab/frames/<animación>/<n>.png
// Uso: node art/tools/build-sheet.mjs
// Celda 48x48, 13 columnas, una fila por animación. Los pies quedan en la fila 47 (origen 0.5,1 de Phaser).
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { decode, encode } from "./png.mjs";

const CELL = 48;
const COLS = 13;
const FEET = CELL - 1;
// "ground": desplazamiento vertical constante por animación (conserva el balanceo de los pies).
// "air": cada cuadro baja hasta que su píxel más bajo toque la fila FEET.
const ROWS = [
  { name: "idle", mode: "ground" },
  { name: "run", mode: "ground" },
  { name: "jump", mode: "air" },
  { name: "dash", mode: "ground" },
  { name: "shoot", mode: "ground" },
  { name: "hurt", mode: "ground" },
  { name: "death", mode: "air" },
  { name: "crouch", mode: "ground" },
  { name: "crouch-shoot", mode: "ground" },
];

function bounds(f) {
  let y1 = -1;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.px[(y * f.w + x) * 4 + 3] > 0) y1 = Math.max(y1, y);
  return y1;
}

// Recorta al centro (los lienzos de 64 px tienen 8 px de margen por lado) y desplaza en vertical.
function toCell(f, dy) {
  const o = Buffer.alloc(CELL * CELL * 4);
  const ox = Math.floor((f.w - CELL) / 2);
  const oy = Math.floor((f.h - CELL) / 2);
  for (let y = 0; y < CELL; y++) {
    const sy = y + oy - dy;
    if (sy < 0 || sy >= f.h) continue;
    for (let x = 0; x < CELL; x++) f.px.copy(o, (y * CELL + x) * 4, (sy * f.w + x + ox) * 4, (sy * f.w + x + ox) * 4 + 4);
  }
  return o;
}

const sheetW = COLS * CELL;
const sheet = Buffer.alloc(sheetW * ROWS.length * CELL * 4);
const layout = {};
ROWS.forEach((row, r) => {
  let files;
  try {
    files = readdirSync(`art/pixellab/frames/${row.name}`).filter((f) => f.endsWith(".png")).sort((a, b) => parseInt(a) - parseInt(b));
  } catch {
    return; // fila aún sin cuadros
  }
  const frames = files.map((f) => decode(`art/pixellab/frames/${row.name}/${f}`));
  const crop = (f) => Math.floor((f.h - CELL) / 2);
  const rowBase = row.mode === "ground" ? Math.max(...frames.map((f) => bounds(f) - crop(f))) : 0;
  layout[row.name] = { row: r, frames: frames.length, firstIndex: r * COLS };
  frames.forEach((f, c) => {
    const dy = row.mode === "ground" ? FEET - rowBase : FEET - (bounds(f) - crop(f));
    const cell = toCell(f, dy);
    for (let y = 0; y < CELL; y++) cell.copy(sheet, ((r * CELL + y) * sheetW + c * CELL) * 4, y * CELL * 4, (y + 1) * CELL * 4);
  });
});
mkdirSync("public/sprites", { recursive: true });
encode("public/sprites/business-man.png", sheetW, ROWS.length * CELL, sheet);
writeFileSync("art/pixellab/sheet-layout.json", `${JSON.stringify(layout, null, 2)}\n`);
console.log(layout);
