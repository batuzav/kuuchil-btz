# Epic 01: Fundación, contenido y entrada

> Al terminar existe un juego Phaser 240×160 que arranca, se construye y se sirve por HTTP, valida contenido, lee acciones remapeables desde el teclado, persiste los controles y genera todas las texturas placeholder desde un manifiesto.

| | |
|---|---|
| **Epic id** | `01-fundacion-entrada` |
| **Tasks** | `E1-T1` … `E1-T6` (pasos 1–6) |
| **Depends on** | nada — empieza aquí (después del Bootstrap de `blueprint.md` §10) |
| **Unlocks** | `02-movimiento-escenario`, `03-combate-jefe-entrega` |
| **Parallel with** | `E2-T1` puede correr junto a `E1-T2`…`E1-T6` (no comparte archivos) |

No necesitas ningún otro archivo para completar este epic. Todo lo de abajo se repite aquí a propósito.

---

## Stack

Phaser 4 (Arcade physics, Tiled JSON) · TypeScript 6 · Vite 8 · Vitest (entorno `node`) · Biome · sin backend, sin DB, sin auth, sin variables de entorno · sitio estático.
Gestor: `pnpm` (fijado por `packageManager` en `package.json`). Runtime fijado en `.nvmrc` (Node 24). Las versiones de dependencias están en `pnpm-lock.yaml`: léelo, nunca adivines una.

| Tarea | Comando |
|---|---|
| Dev | `pnpm dev` (http://localhost:5173) |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` · arreglar formato: `pnpm format` |
| Test (un archivo) | `pnpm test tests/<archivo>.test.ts` |
| Validar contenido | `pnpm validate:content` |
| Build + chequeos | `pnpm build`, `pnpm check:dist` (lee `dist/`) y `pnpm smoke:dist` (sirve `dist/` en http://127.0.0.1:4173 y pide `/` y el entry JS) |
| Servicios locales | ninguno permanente; `smoke:dist` abre y cierra su propio servidor |

**Gate:** `pnpm format`, luego `pnpm typecheck && pnpm lint && pnpm test` pasa antes de marcar cualquier tarea como hecha.

Prerrequisito: el Bootstrap de `blueprint.md` §10 ya se ejecutó, así que en la raíz existen `package.json`, `tsconfig.json`, `biome.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.nvmrc`, `.gitignore`, `scripts/check-dist.ts`, `scripts/smoke-dist.ts`, `public/maps/stage-01.tmj`, `CLAUDE.md` y `.claude/`, con dependencias instaladas y un primer commit. No escribes ninguno de esos archivos.

## Directory subtree

```
src/
  main.ts                    # NUEVO en E1-T1; editado en E1-T5
  core/
    tuning.ts                # NUEVO E1-T1 — TUNING
    gameConfig.ts            # NUEVO E1-T1 — resolución, render, escala, SCENES
  content/
    types.ts                 # NUEVO E1-T2
    registry.ts              # NUEVO E1-T2 (arreglos vacíos)
    validate.ts              # NUEVO E1-T2
  input/
    actions.ts               # NUEVO E1-T3
    inputManager.ts          # NUEVO E1-T3
    keyboardProvider.ts      # NUEVO E1-T3
    bindings.ts              # NUEVO E1-T4
    bindingsStore.ts         # NUEVO E1-T4
    controlsMenu.ts          # NUEVO E1-T4
  assets/
    palette.ts               # NUEVO E1-T6
    manifest.ts              # NUEVO E1-T6
    placeholders.ts          # NUEVO E1-T6
  scenes/
    BootScene.ts             # NUEVO E1-T1; editado en E1-T5 y E1-T6
    sceneInput.ts            # NUEVO E1-T5
    MenuScene.ts             # NUEVO E1-T5
    ControlsScene.ts         # NUEVO E1-T5
scripts/
  validate-content.ts        # NUEVO E1-T2
  check-dist.ts              # existe (workspace) — solo lectura
  smoke-dist.ts              # existe (workspace) — solo lectura
public/maps/stage-01.tmj     # existe (workspace) — solo lectura
tests/
  game-config.test.ts        # E1-T1
  content-validate.test.ts   # E1-T2
  input.test.ts              # E1-T3
  boundaries.test.ts         # E1-T3
  bindings.test.ts           # E1-T4
  controls-menu.test.ts      # E1-T4
  assets.test.ts             # E1-T6
```

Todo lo que esté fuera de este subárbol queda fuera de alcance. Si una tarea parece requerir editar otro archivo, detente y repórtalo.

## Data model touched here

| Entidad | Campos que este epic añade o lee | Notas |
|---|---|---|
| Tipos de contenido (`src/content/types.ts`) | `Hitbox`, `CharacterDef`, `EnemyDef`, `BossDef`, `BossPhaseDef`, `BossAttackDef`, `StageDef`, `ContentRegistry` | literal abajo en E1-T2 |
| `CONTENT` | `stages`, `bosses`, `enemies`, `characters` (vacíos en este epic) | el epic 02 los llena |
| Bindings | `Record<Action, string>` (`KeyboardEvent.code`) | `localStorage["kuuchil-btz:bindings:v1"]` |
| `MANIFEST` | 8 claves de textura | tabla en E1-T6 |

## Contracts

**Consumed** — ya existe, no lo reconstruyas:

| De | Interfaz | Garantía |
|---|---|---|
| Bootstrap | `scripts/check-dist.ts` (`pnpm check:dist`) | sale 0 si el `<script src>` de `dist/index.html` existe, no está vacío y contiene `kuuchil-btz` |
| Bootstrap | `scripts/smoke-dist.ts` (`pnpm smoke:dist`) | levanta `vite preview` en `127.0.0.1:4173` (`strictPort`), pide `/` y el entry JS, exige HTTP 200 y `kuuchil-btz` en ambos, cierra el servidor y sale 0; sale 1 ante cualquier fallo |
| Bootstrap | `public/maps/stage-01.tmj` | mapa Tiled 60×10, capas `ground`/`spawns` |

**Produced** — los epics posteriores dependen de estas firmas exactas:

| Export | Firma | Usado por |
|---|---|---|
| `src/core/tuning.ts` → `TUNING`, `Tuning` | objeto `as const` (19 claves) | 02, 03 |
| `src/core/gameConfig.ts` → `SCENES`, `GAME_WIDTH`, `TILE_SIZE`… | constantes | 02, 03 |
| `src/content/registry.ts` → `CONTENT`, `FIRST_STAGE_ID`, `DEFAULT_CHARACTER_ID`, `getStage`, `getBoss`, `getEnemy`, `getCharacter` | ver E1-T2 | 02, 03 |
| `src/content/validate.ts` → `extractSpawns(map: unknown, spawnLayer: string): StageSpawns \| null`, `validateContent(content, readMap): string[]` | ver E1-T2 | 02, 03 |
| `src/input/actions.ts` → `ACTIONS`, `Action`, `ActionState`, `ActionSnapshot`, `Bindings`, `DEFAULT_BINDINGS`, `emptyActionState()` | ver E1-T3 | 02, 03 |
| `src/input/inputManager.ts` → `InputProvider`, `InputManager` | `update(): ActionSnapshot` | 02, 03 |
| `src/input/bindings.ts` → `keyLabel(code): string` | | 02, 03 |
| `src/scenes/sceneInput.ts` → `createSceneInput(scene): InputManager`, `BINDINGS_REGISTRY_KEY` | | 02 (StageScene) |
| `src/assets/palette.ts` → `PALETTE`, `TEXT_STYLE` | | 03 |
| `src/assets/manifest.ts` → `MANIFEST` | `Readonly<Record<string, AssetSpec>>` | 02, 03 |
| `src/main.ts` → línea `scene` en una sola línea | `  scene: [BootScene, MenuScene, ControlsScene],` tras E1-T5 | 02 (E2-T6 añade `StageScene` en la misma línea) |

## Conventions that bite in this area

- **Imports relativos con extensión `.ts`** e `import type` para tipos: `node scripts/validate-content.ts` carga `src/content/**` con Node, que despoja tipos y resuelve el especificador literalmente. Un import sin `.ts` o un tipo importado sin `type` revienta el script aunque `tsc` y Vite lo acepten.
- **Solo sintaxis borrable**: nada de `enum`, `namespace` ni propiedades de parámetro (`constructor(private x)`); `tsconfig.json` tiene `erasableSyntaxOnly`.
- **Ningún test importa `phaser`** (Phaser necesita `window`). Escenas y `src/main.ts` se verifican con `typecheck` + `build` + `check:dist` + `smoke:dist`.
- **`noUncheckedIndexedAccess` está activo**: `arr[i]` es `T | undefined`; usa guardas, nunca `!`.
- **La línea `scene: [...]` de `src/main.ts` va en una sola línea**: los gates la buscan con `grep -qF`.
- **El puerto 4173 debe estar libre** para `pnpm smoke:dist` (usa `strictPort`); no dejes un `pnpm preview` abierto.
- Ejecuta `pnpm format` antes de los comandos `Verify`: Biome es la fuente del formato.

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/input.md`, `.claude/rules/content.md`, `.claude/rules/pure-logic.md`. Todos están en la raíz del proyecto desde el Bootstrap.

---

## Tasks

En el mismo orden que `tasks.json`. Ese orden es el orden de construcción: trabaja de arriba abajo y no reordenes por prioridad.

### `E1-T1` — Configure Phaser at 240x160 and boot BootScene

**Depends on:** nada · **Priority:** p0 — metadato para recortes de alcance, no un orden

Crea la configuración pura (que se testea) separada de `src/main.ts` (que importa Phaser y no se testea). `src/core/tuning.ts`, literal:

```ts
// Todas las cifras de sensación de control y combate. Unidades: px, px/s, px/s², ms.
export const TUNING = {
  runSpeed: 90, // px/s horizontal al correr
  gravityY: 900, // px/s² gravedad del mundo Arcade
  jumpVelocity: 320, // px/s hacia arriba al saltar (apex ≈ 57 px ≈ 3.5 tiles)
  jumpCutMultiplier: 0.4, // al soltar salto subiendo: vy *= esto (salto variable)
  maxFallSpeed: 320, // px/s velocidad máxima de caída
  coyoteTimeMs: 80, // ms tras dejar el suelo en que aún se puede saltar
  jumpBufferMs: 100, // ms que se recuerda un salto pulsado antes de aterrizar
  dashSpeed: 180, // px/s durante el dash
  dashDurationMs: 220, // ms que dura un dash (≈ 40 px)
  dashCooldownMs: 300, // ms tras terminar un dash antes de otro
  shotSpeed: 240, // px/s de la bala del jugador
  shotCooldownMs: 160, // ms mínimos entre disparos
  shotLifetimeMs: 1000, // ms de vida de una bala (alcance = 1 pantalla)
  maxShotsOnScreen: 3, // balas del jugador simultáneas (estilo MMX)
  invulnerabilityMs: 1000, // ms de invulnerabilidad tras recibir daño
  knockbackSpeed: 80, // px/s de retroceso al recibir daño
  minTelegraphMs: 250, // ms mínimos de aviso de todo ataque de jefe (regla de justicia)
  telegraphBlinkMs: 170, // ms por alternancia del destello (< 3 destellos/s)
  deathRestartDelayMs: 1200, // ms entre "K.O." y reiniciar la etapa
} as const;

export type Tuning = typeof TUNING;
```

`src/core/gameConfig.ts`, literal:

```ts
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
```

`src/main.ts`, literal (E1-T5 y E2-T6 solo cambian la línea `scene`, que siempre queda en una sola línea):

```ts
import Phaser from "phaser";
import {
  BACKGROUND_COLOR,
  GAME_HEIGHT,
  GAME_TITLE,
  GAME_WIDTH,
  GRAVITY_Y,
  RENDER_OPTIONS,
  SCALE_OPTIONS,
} from "./core/gameConfig.ts";
import { BootScene } from "./scenes/BootScene.ts";

export const game = new Phaser.Game({
  type: Phaser.AUTO,
  title: GAME_TITLE,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: BACKGROUND_COLOR,
  pixelArt: RENDER_OPTIONS.pixelArt,
  roundPixels: RENDER_OPTIONS.roundPixels,
  antialias: RENDER_OPTIONS.antialias,
  scale: {
    mode: Phaser.Scale[SCALE_OPTIONS.mode],
    autoCenter: Phaser.Scale[SCALE_OPTIONS.autoCenter],
  },
  physics: { default: "arcade", arcade: { gravity: { x: 0, y: GRAVITY_Y }, debug: false } },
  scene: [BootScene],
});
```

Desviaciones permitidas, solo si `pnpm typecheck` las exige con los tipos de Phaser 4 (anótalas en el commit): `import * as Phaser from "phaser"`; `Phaser.Scale.FIT` / `Phaser.Scale.CENTER_BOTH` literales en lugar del acceso indexado. `src/scenes/BootScene.ts`: `export class BootScene extends Phaser.Scene` con `super(SCENES.boot)`; en `create()` dibuja `GAME_TITLE` en (8,8) con `{ fontFamily: "monospace", fontSize: "16px", color: "#e5e7eb" }`. `tests/game-config.test.ts` importa solo `../src/core/gameConfig.ts` y `../src/core/tuning.ts`. `scripts/check-dist.ts` y `scripts/smoke-dist.ts` ya existen: no los escribas.

**Files**
- `src/core/tuning.ts` — nuevo
- `src/core/gameConfig.ts` — nuevo
- `src/main.ts` — nuevo
- `src/scenes/BootScene.ts` — nuevo
- `tests/game-config.test.ts` — nuevo

**Acceptance**

Copiado literal del arreglo `acceptance` de esta tarea en `tasks.json`. Cada criterio lo decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `pnpm test tests/game-config.test.ts` runs **THE SYSTEM SHALL** assert `GAME_WIDTH` is 240, `GAME_HEIGHT` is 160, `RENDER_OPTIONS` is `{ pixelArt: true, roundPixels: true, antialias: false }` and `SCALE_OPTIONS` is `{ mode: "FIT", autoCenter: "CENTER_BOTH" }`, and exit 0.
2. **WHEN** `pnpm test tests/game-config.test.ts` runs **THE SYSTEM SHALL** assert `GAME_WIDTH / TILE_SIZE` is 15, `GAME_HEIGHT / TILE_SIZE` is 10 and `GRAVITY_Y` equals `TUNING.gravityY`.
3. **WHEN** `pnpm typecheck` and `pnpm lint` run **THE SYSTEM SHALL** exit 0.
4. **WHEN** `pnpm build` runs **THE SYSTEM SHALL** exit 0 and write `dist/index.html`.
5. **WHEN** `pnpm check:dist` runs after the build **THE SYSTEM SHALL** find the module script that `dist/index.html` references, non-empty and containing the marker `kuuchil-btz`, and exit 0.
6. **WHEN** `pnpm smoke:dist` runs after the build **THE SYSTEM SHALL** serve `dist/` with `vite preview` on `127.0.0.1:4173`, receive HTTP 200 for `/` and for the entry script, both containing `kuuchil-btz`, close the server and exit 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto. Cada uno sale 0 cuando la tarea es correcta.

```bash
pnpm test tests/game-config.test.ts
pnpm typecheck
pnpm lint
pnpm build
pnpm check:dist
pnpm smoke:dist
```

Checkpoint manual del autor (no es gate): `pnpm dev` muestra el canvas centrado, fondo `#0f1226`, título nítido. Phaser 4 en navegador es UNVERIFIED; si hay blur, es decisión del autor aplicar el fallback de zoom entero (riesgo 4 del blueprint).

**Checkpoint**

```bash
git add -A && git commit -m "step 1: phaser boots at 240x160"
git tag step-01-boot
```

Ejecuta ambos tras el último `Verify` en verde y antes de la siguiente tarea. El tag es el objetivo de rollback; cópialo del campo `checkpoint`, nunca lo inventes.

### `E1-T2` — Add content types, registry and validator

**Depends on:** `E1-T1` · **Priority:** p0

`src/content/types.ts`, literal:

```ts
export type Hitbox = {
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
};

export type CharacterDef = {
  readonly id: string;
  readonly name: string;
  readonly textureKey: string;
  readonly projectileTextureKey: string;
  readonly hitbox: Hitbox;
  readonly maxHp: number;
  readonly shotDamage: number;
  readonly abilities: readonly string[];
};

export type EnemyBehavior = "walker" | "hopper" | "turret";

export type EnemyDef = {
  readonly id: string;
  readonly name: string;
  readonly behavior: EnemyBehavior;
  readonly textureKey: string;
  readonly hitbox: Hitbox;
  readonly maxHp: number;
  readonly contactDamage: number;
  readonly speed: number; // px/s horizontal (walker, hopper)
  readonly jumpVelocity: number; // px/s hacia arriba (hopper); 0 si no salta
  readonly actionIntervalMs: number; // hopper: cada cuánto salta; turret: cada cuánto dispara; 0 = nunca
  readonly rangePx: number; // turret: distancia máxima para disparar; 0 = no aplica
  readonly projectileSpeed: number; // px/s; 0 = no dispara
  readonly projectileDamage: number;
};

export type BossPattern = "dash" | "shot-spread" | "slam";

export type BossAttackDef = {
  readonly id: string;
  readonly pattern: BossPattern;
  readonly telegraphMs: number; // aviso visible; >= TUNING.minTelegraphMs
  readonly activeMs: number;
  readonly recoveryMs: number; // ventana de castigo del jugador
  readonly damage: number;
  readonly hitbox: Hitbox; // dash/slam: cuerpo durante el ataque; shot-spread: cada bala
  readonly speed: number; // px/s
  readonly count: number; // shot-spread: balas; otros: 1
};

export type BossPhaseDef = {
  readonly id: string;
  readonly enterAtHpFraction: number; // 1 para la primera; estrictamente decreciente
  readonly idleMs: number;
  readonly attackCycle: readonly string[]; // ids de attacks, en orden cíclico
};

export type BossDef = {
  readonly id: string;
  readonly name: string;
  readonly textureKey: string;
  readonly hitbox: Hitbox;
  readonly maxHp: number;
  readonly contactDamage: number;
  readonly introMs: number;
  readonly phases: readonly BossPhaseDef[];
  readonly attacks: readonly BossAttackDef[];
};

export type StageDef = {
  readonly id: string;
  readonly name: string;
  readonly mapKey: string;
  readonly mapPath: string;
  readonly tilesetName: string;
  readonly tilesetTextureKey: string;
  readonly groundLayer: string;
  readonly spawnLayer: string;
  readonly bossId: string;
  readonly minibossIds: readonly string[];
  readonly music: null;
};

export type ContentRegistry = {
  readonly stages: readonly StageDef[];
  readonly bosses: readonly BossDef[];
  readonly enemies: readonly EnemyDef[];
  readonly characters: readonly CharacterDef[];
};
```

`src/content/registry.ts` en esta tarea (el epic 02 añade imports y entradas):

```ts
import type { BossDef, CharacterDef, ContentRegistry, EnemyDef, StageDef } from "./types.ts";

export const FIRST_STAGE_ID = "stage-01";
export const DEFAULT_CHARACTER_ID = "kuuchil";

export const CONTENT: ContentRegistry = {
  stages: [],
  bosses: [],
  enemies: [],
  characters: [],
};

export function getStage(id: string): StageDef | undefined {
  return CONTENT.stages.find((stage) => stage.id === id);
}

export function getBoss(id: string): BossDef | undefined {
  return CONTENT.bosses.find((boss) => boss.id === id);
}

export function getEnemy(id: string): EnemyDef | undefined {
  return CONTENT.enemies.find((enemy) => enemy.id === id);
}

export function getCharacter(id: string): CharacterDef | undefined {
  return CONTENT.characters.find((character) => character.id === id);
}
```

`src/content/validate.ts` (puro; importa `./types.ts` y `../core/tuning.ts`): tipos `SpawnPoint = { x: number; y: number }`, `EnemySpawn = SpawnPoint & { enemyId: string }`, `TriggerRect = { x: number; y: number; width: number; height: number }`, `StageSpawns = { playerStarts: SpawnPoint[]; bossSpawns: SpawnPoint[]; bossTriggers: TriggerRect[]; enemies: EnemySpawn[] }`. `extractSpawns(map: unknown, spawnLayer: string): StageSpawns | null` — `null` si no hay objectgroup con ese nombre; tipo de objeto = `obj.type` si es string, si no `obj.class` si es string, si no `""`; `enemyId` = `value` string de la propiedad `name: "enemyId"`, o `""`. `validateContent(content: ContentRegistry, readMap: (mapPath: string) => unknown): string[]` con estas reglas; cada mensaje DEBE contener el token indicado (el resto del texto es libre, en español):

| Regla | Token obligatorio |
|---|---|
| ids únicos por tipo | el id duplicado |
| `readMap(mapPath)` lanza | `map` y el `mapPath` |
| `tilewidth`/`tileheight` ≠ 16 | `tile` |
| falta tilelayer `groundLayer`, o `data.length ≠ width*height` | `ground` |
| falta objectgroup `spawnLayer` | `spawns` |
| `player_start` ≠ 1, `boss_spawn` ≠ 1, `boss_trigger` < 1 o con ancho/alto 0 | `player_start` / `boss_spawn` / `boss_trigger` |
| `enemyId` no registrado | ese `enemyId` |
| `tilesetName` no está en `tilesets[].name` | el `tilesetName` |
| `bossId` o un `minibossIds` no registrado | ese id |
| jefe sin fases, primera fase con `enterAtHpFraction ≠ 1`, no estrictamente decreciente o ≤ 0 | `phase` |
| `attackCycle` vacío o con id inexistente | `attackCycle` |
| `telegraphMs < TUNING.minTelegraphMs` | `telegraph` |
| `activeMs ≤ 0`, `recoveryMs < 0`, `damage ≤ 0` | el id del ataque |
| hitbox con ancho/alto ≤ 0 u offset < 0 | `hitbox` |
| personaje con `abilities` vacío | `abilities` |

`scripts/validate-content.ts`, literal:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT } from "../src/content/registry.ts";
import { validateContent } from "../src/content/validate.ts";

const errors = validateContent(CONTENT, (mapPath) =>
  JSON.parse(readFileSync(join("public", mapPath), "utf8")),
);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`x ${error}`);
  }
  process.exit(1);
}

console.log(
  `content OK: ${CONTENT.stages.length} etapas, ${CONTENT.bosses.length} jefes, ${CONTENT.enemies.length} enemigos, ${CONTENT.characters.length} personajes`,
);
```

`tests/content-validate.test.ts`: construye en el test un registro *fixture* (1 etapa, 1 jefe con un ataque `telegraphMs: 300`, 1 enemigo `e1`) y un mapa *fixture* mínimo (3×2 tiles de 16 px, `ground` con `data` de 6 enteros, `spawns` con `player_start`, `boss_spawn`, `boss_trigger` 16×16 y un `enemy` con `enemyId: "e1"`, tileset con el `tilesetName` del fixture). Casos: válido → `[]`; sin `ground`; sin `spawns`; `readMap` que lanza; `enemyId` desconocido; `bossId` desconocido; `telegraphMs: 100`; y el registro real `CONTENT` con `readMap` que lee `join("public", mapPath)` con `node:fs` → `[]`.

**Files**
- `src/content/types.ts` — nuevo
- `src/content/registry.ts` — nuevo
- `src/content/validate.ts` — nuevo
- `scripts/validate-content.ts` — nuevo
- `tests/content-validate.test.ts` — nuevo

**Acceptance**

1. **WHEN** `pnpm test tests/content-validate.test.ts` runs **THE SYSTEM SHALL** report 0 errors for a valid in-test fixture (one stage, one boss, one enemy, one map) and exit 0.
2. **WHEN** a fixture map lacks the `ground` tile layer or the `spawns` object layer, or `readMap` throws, **THE SYSTEM SHALL** return an error whose text contains `ground`, `spawns` or `map` respectively.
3. **WHEN** a fixture spawn references an unregistered `enemyId` or the stage references an unregistered `bossId` **THE SYSTEM SHALL** return an error whose text contains that id.
4. **WHEN** a fixture boss attack has `telegraphMs` below `TUNING.minTelegraphMs` **THE SYSTEM SHALL** return an error whose text contains `telegraph`.
5. **WHEN** `pnpm validate:content` runs against the real registry **THE SYSTEM SHALL** print `content OK` and exit 0.

**Verify**

```bash
pnpm test tests/content-validate.test.ts
pnpm validate:content
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 2: content types, registry and validator"
git tag step-02-content-core
```

### `E1-T3` — Add input actions, manager and keyboard provider

**Depends on:** `E1-T1` · **Priority:** p0

`src/input/actions.ts`, literal:

```ts
export const ACTIONS = ["left", "right", "up", "down", "jump", "shoot", "dash", "pause"] as const;
export type Action = (typeof ACTIONS)[number];
export type ActionState = Readonly<Record<Action, boolean>>;
export type ActionSnapshot = { readonly held: ActionState; readonly pressed: ActionState };
export type Bindings = Readonly<Record<Action, string>>; // acción → KeyboardEvent.code

export const DEFAULT_BINDINGS: Bindings = {
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
  jump: "KeyZ",
  shoot: "KeyX",
  dash: "KeyC",
  pause: "Escape",
};

export function emptyActionState(): Record<Action, boolean> {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    dash: false,
    pause: false,
  };
}
```

`src/input/inputManager.ts`: `export type InputProvider = { readonly id: string; poll(): ActionState; destroy(): void }`; `export class InputManager` con `constructor(providers: InputProvider[] = [])` (asigna a un campo privado; sin propiedades de parámetro), `addProvider(provider)`, `update(): ActionSnapshot` (held = OR de todos los proveedores; pressed = held ahora y no en el `update()` anterior) y `destroy()`.

`src/input/keyboardProvider.ts`: `export type KeyTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">` — `window` cumple este tipo y en Node también `new EventTarget()`; **no** declares un tipo estructural propio para el listener, porque `window` no sería asignable. `createKeyboardProvider(target: KeyTarget, getBindings: () => Bindings): InputProvider`: listeners `(event: Event) => void` para `keydown`/`keyup` que leen `const code = (event as KeyboardEvent).code`, agregan/quitan el código de un `Set` y llaman `event.preventDefault()` si el código está ligado a alguna acción; un listener `blur` vacía el `Set`. `poll()` = para cada acción, `codes.has(bindings[action])`. `destroy()` quita los tres listeners. `captureNextKey(target: KeyTarget, onKey: (code: string) => void): () => void` registra un `keydown` de un solo uso (con `preventDefault()`) y devuelve la función que lo cancela.

`tests/input.test.ts`: usa el `EventTarget` y `Event` globales de Node 24 — `const target = new EventTarget()`, `target.dispatchEvent(Object.assign(new Event("keydown"), { code: "KeyZ" }))`, `target.dispatchEvent(new Event("blur"))`. `tests/boundaries.test.ts`: recorre con `node:fs` los `.ts` de `src/core`, `src/input`, `src/content`, `src/characters`, `src/bosses` (ignora directorios que aún no existen) y falla si alguno contiene `from "phaser"`; recorre `src/scenes` y falla si alguno contiene `addEventListener`.

**Files**
- `src/input/actions.ts` — nuevo
- `src/input/inputManager.ts` — nuevo
- `src/input/keyboardProvider.ts` — nuevo
- `tests/input.test.ts` — nuevo
- `tests/boundaries.test.ts` — nuevo

**Acceptance**

1. **WHEN** `pnpm test tests/input.test.ts` runs **THE SYSTEM SHALL** assert `DEFAULT_BINDINGS` maps `left`/`right`/`up`/`down` to `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`, `jump` to `KeyZ`, `shoot` to `KeyX`, `dash` to `KeyC` and `pause` to `Escape`, with none of `KeyW`, `KeyA`, `KeyS`, `KeyD` among its values.
2. **WHEN** a fake event target dispatches `keydown` with code `KeyZ` **THE SYSTEM SHALL** report `jump` held and pressed on the first `update()` and held but not pressed on the second.
3. **WHEN** two providers are registered and either one reports an action held **THE SYSTEM SHALL** report that action held in the snapshot.
4. **WHEN** the fake target dispatches `blur` **THE SYSTEM SHALL** report every action released on the next `update()`.
5. **WHEN** `pnpm test tests/boundaries.test.ts` runs **THE SYSTEM SHALL** find no `from "phaser"` import under `src/core`, `src/input`, `src/content`, `src/characters` or `src/bosses` and no `addEventListener` call under `src/scenes`, and exit 0.

**Verify**

```bash
pnpm test tests/input.test.ts
pnpm test tests/boundaries.test.ts
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 3: input actions, manager and keyboard provider"
git tag step-03-input
```

### `E1-T4` — Add rebind, persistence and controls menu model

**Depends on:** `E1-T3` · **Priority:** p0

Todo puro, sin Phaser. `src/input/bindings.ts`: `RESERVED_CODES = ["Tab", "F5", "F11", "F12", "MetaLeft", "MetaRight"] as const`; `type RebindResult = { ok: true; bindings: Bindings; swappedWith: Action | null } | { ok: false; reason: "reserved" }`; `rebind(bindings, action, code): RebindResult` (si otra acción usa `code`, intercambia; reservado → rechazo); `parseBindings(raw: unknown): Bindings | null` (las 8 acciones, strings no vacíos, sin duplicados ni reservados); `keyLabel(code)` (`ArrowLeft`→`←`, `ArrowRight`→`→`, `ArrowUp`→`↑`, `ArrowDown`→`↓`, `Key*` → la letra, `Digit*` → el dígito, `Escape`→`Esc`, otros → el código).

`src/input/bindingsStore.ts`: `BINDINGS_STORAGE_KEY = "kuuchil-btz:bindings:v1"`; `type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">`; `getBrowserStorage(): StorageLike | null` (try/catch alrededor de `globalThis.localStorage`); `loadBindings(storage: StorageLike | null): Bindings` (try/catch + `JSON.parse` + `parseBindings`; todo fallo → `DEFAULT_BINDINGS`); `saveBindings(storage, bindings): boolean`; `clearBindings(storage): boolean`.

`src/input/controlsMenu.ts`: filas = 8 acciones + `"restore"` + `"back"`. `ControlsMenuState = { bindings: Bindings; selected: number; mode: "browse" | "await-key"; message: string | null }`; `ControlsMenuEvent = { type: "up" } | { type: "down" } | { type: "confirm" } | { type: "cancel" } | { type: "key"; code: string }`; `ControlsMenuEffect = "none" | "save" | "reset" | "exit"`; `createControlsMenu(bindings)`; `reduceControlsMenu(state, event): { state; effect }`. En `browse`: up/down con vuelta; confirm en acción → `await-key` ("Pulsa una tecla para <acción>"); confirm en `restore` → `DEFAULT_BINDINGS`, efecto `reset` ("Controles restaurados"); confirm en `back` o `cancel` → `exit`. En `await-key`: `key` `Escape` → `browse` sin cambios; otro código → `rebind`; ok → efecto `save` ("Intercambiado con <acción>" si hubo intercambio); reservado → "Tecla reservada" y vuelve a `browse`. Tests con un storage en memoria y otro que lanza en `getItem`/`setItem`.

**Files**
- `src/input/bindings.ts` — nuevo
- `src/input/bindingsStore.ts` — nuevo
- `src/input/controlsMenu.ts` — nuevo
- `tests/bindings.test.ts` — nuevo
- `tests/controls-menu.test.ts` — nuevo

**Acceptance**

1. **WHEN** `rebind` assigns a code already bound to another action **THE SYSTEM SHALL** swap the two codes and return `swappedWith` naming the other action.
2. **WHEN** `rebind` receives a reserved code (`Tab`, `F5`, `F11`, `F12`, `MetaLeft`, `MetaRight`) **THE SYSTEM SHALL** return `{ ok: false, reason: "reserved" }` and leave the bindings unchanged.
3. **WHEN** stored bindings are malformed JSON, miss an action, or contain a duplicate or reserved code **THE SYSTEM SHALL** return `DEFAULT_BINDINGS` from `loadBindings`.
4. **WHEN** storage is `null` or throws on `getItem`/`setItem` **THE SYSTEM SHALL** return defaults from `loadBindings` and `false` from `saveBindings` without throwing.
5. **WHEN** the controls menu confirms the `restore` row **THE SYSTEM SHALL** return `DEFAULT_BINDINGS` with effect `reset`, and **WHEN** it awaits a key and receives `Escape` **THE SYSTEM SHALL** return to `browse` with the bindings unchanged.

**Verify**

```bash
pnpm test tests/bindings.test.ts
pnpm test tests/controls-menu.test.ts
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 4: rebind, persistence and controls menu model"
git tag step-04-bindings
```

### `E1-T5` — Add MenuScene and ControlsScene

**Depends on:** `E1-T2`, `E1-T4` · **Priority:** p0

`src/scenes/sceneInput.ts`: `BINDINGS_REGISTRY_KEY = "bindings"`; `createSceneInput(scene: Phaser.Scene): InputManager` crea `createKeyboardProvider(window, () => scene.registry.get(BINDINGS_REGISTRY_KEY) as Bindings)` y destruye el manager en `scene.events.once("shutdown", …)`. `src/scenes/BootScene.ts` (edición): `create()` hace `this.registry.set(BINDINGS_REGISTRY_KEY, loadBindings(getBrowserStorage()))` y `this.scene.start(SCENES.menu)`. `src/scenes/MenuScene.ts`: título 16px, filas "Jugar"/"Controles", `up`/`down` mueven, `jump` confirma; "Jugar" muestra "Sin etapas registradas" si `CONTENT.stages.length === 0`, si no `this.scene.start(SCENES.stage, { stageId: FIRST_STAGE_ID })`; pie "<tecla de jump>: aceptar" con `keyLabel`. `src/scenes/ControlsScene.ts`: dibuja las 10 filas del modelo con `keyLabel`; traduce `pressed.up`/`down`/`jump`/`pause` a `up`/`down`/`confirm`/`cancel`; en `await-key` usa `captureNextKey(window, …)` y envía `{ type: "key", code }` (sin procesar el snapshot mientras espera); `save`/`reset` → `registry.set` + `saveBindings`/`clearBindings`, y si devuelven `false`, mensaje "No se pudo guardar (se usarán en esta sesión)"; `exit` → `MenuScene`. `src/main.ts` (edición): añade los dos imports y deja la línea `scene` exactamente como `  scene: [BootScene, MenuScene, ControlsScene],` (una sola línea; el gate la busca con `grep -qF`). Ninguna escena llama `addEventListener`.

**Files**
- `src/scenes/sceneInput.ts` — nuevo
- `src/scenes/MenuScene.ts` — nuevo
- `src/scenes/ControlsScene.ts` — nuevo
- `src/scenes/BootScene.ts` — edición: carga bindings y arranca el menú
- `src/main.ts` — edición: registra las dos escenas en la línea `scene`

**Acceptance**

1. **WHEN** `grep -qF "scene: [BootScene, MenuScene, ControlsScene" src/main.ts` runs **THE SYSTEM SHALL** exit 0, proving both scenes are in the `scene` array.
2. **WHEN** `pnpm test tests/boundaries.test.ts` runs **THE SYSTEM SHALL** still find no `addEventListener` call under `src/scenes` and no `phaser` import in the pure directories.
3. **WHEN** `pnpm typecheck` and `pnpm lint` run **THE SYSTEM SHALL** exit 0.
4. **WHEN** `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
grep -qF "scene: [BootScene, MenuScene, ControlsScene" src/main.ts
pnpm test tests/boundaries.test.ts
pnpm typecheck
pnpm lint
pnpm build
pnpm check:dist
pnpm smoke:dist
```

Checkpoint manual del autor (no es gate): reasignar "Saltar" a X intercambia con "Disparar"; recargar conserva el cambio; "Restaurar" vuelve a Z/X/C; sin `localStorage` funciona con defaults.

**Checkpoint**

```bash
git add -A && git commit -m "step 5: menu and controls scenes"
git tag step-05-menu-controls
```

### `E1-T6` — Add asset manifest and placeholder textures

**Depends on:** `E1-T2`, `E1-T5` · **Priority:** p0

`src/assets/palette.ts`: `PALETTE = { background: 0x0f1226, ground: 0x3b4a6b, groundEdge: 0x5b6f9a, player: 0x3da5ff, playerAccent: 0xffd23f, enemy: 0xe5484d, boss: 0x8e4ec6, telegraph: 0xffffff, projectile: 0xfff176, hpPlayer: 0x4ade80, hpBoss: 0xf43f5e, hudFrame: 0xe5e7eb } as const` y `TEXT_STYLE = { fontFamily: "monospace", fontSize: "8px", color: "#e5e7eb" } as const`.

`src/assets/manifest.ts`: `PlaceholderSpec = { readonly kind: "placeholder"; readonly shape: "rect" | "tiles"; readonly width: number; readonly height: number; readonly color: number; readonly accent: number | null }`, `FileSpec = { readonly kind: "file"; readonly path: string; readonly frameWidth?: number; readonly frameHeight?: number }`, `AssetSpec = PlaceholderSpec | FileSpec`, y `MANIFEST: Readonly<Record<string, AssetSpec>>` con exactamente:

| Clave | shape | w×h | color | accent |
|---|---|---|---|---|
| `player` | rect | 16×16 | `PALETTE.player` | `PALETTE.playerAccent` |
| `projectile-player` | rect | 4×4 | `PALETTE.projectile` | null |
| `enemy-walker` | rect | 16×16 | `PALETTE.enemy` | `PALETTE.hudFrame` |
| `enemy-hopper` | rect | 16×16 | `PALETTE.enemy` | `PALETTE.playerAccent` |
| `enemy-turret` | rect | 16×16 | `PALETTE.enemy` | `PALETTE.projectile` |
| `projectile-enemy` | rect | 4×4 | `PALETTE.enemy` | null |
| `boss-sentinel` | rect | 32×32 | `PALETTE.boss` | `PALETTE.hudFrame` |
| `tiles-placeholder` | tiles | 32×16 | `PALETTE.ground` | `PALETTE.groundEdge` |

`src/assets/placeholders.ts` (sin `phaser`): `FillContext = { fillStyle: string | CanvasGradient | CanvasPattern; fillRect(x: number, y: number, w: number, h: number): void }`; `toCss(color)` → `#` + 6 hex; `drawPlaceholder(ctx, spec)`: `rect` → rectángulo completo en `color` y, si hay `accent`, banda de ancho completo en `y = Math.floor(height / 4)` de alto `Math.max(1, Math.floor(height / 8))`; `tiles` → tile 1 (0,0,16,16) en `color`, tile 2 (16,0,16,16) en `color` + borde (16,0,16,4) en `accent`. `generatePlaceholders(manifest, createCanvas: (w: number, h: number) => HTMLCanvasElement, addCanvas: (key: string, canvas: HTMLCanvasElement) => void)`: por cada placeholder crea canvas, `getContext("2d")` (si es `null`, lanza `Error`), dibuja y registra.

`src/scenes/BootScene.ts` (edición): `preload()` carga cada `kind: "file"` (`load.spritesheet` con `frameWidth`/`frameHeight`, si no `load.image`) y muestra "Cargando..."; `create()` llama `generatePlaceholders(MANIFEST, (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h }), (key, canvas) => { this.textures.addCanvas(key, canvas); })` antes de cargar bindings e ir al menú. Si los tipos de Phaser 4 no exponen `textures.addCanvas`, usa `this.textures.createCanvas(key, w, h)` + su `getContext()` + `refresh()` y anótalo en el commit. `tests/assets.test.ts`: criterios 1–4 con un contexto falso que registra cada `fillRect`; el criterio 3 recorre `CONTENT` (vacío hoy; crece en el epic 02 y sigue en verde porque esas claves ya están en la tabla).

**Files**
- `src/assets/palette.ts` — nuevo
- `src/assets/manifest.ts` — nuevo
- `src/assets/placeholders.ts` — nuevo
- `src/scenes/BootScene.ts` — edición: carga archivos y genera placeholders
- `tests/assets.test.ts` — nuevo

**Acceptance**

1. **WHEN** `pnpm test tests/assets.test.ts` runs **THE SYSTEM SHALL** assert every placeholder `color` and non-null `accent` in `MANIFEST` is a value of `PALETTE`.
2. **WHEN** `pnpm test tests/assets.test.ts` runs **THE SYSTEM SHALL** assert `MANIFEST["tiles-placeholder"]` is a placeholder with shape `tiles`, width 32 and height 16.
3. **WHEN** `pnpm test tests/assets.test.ts` runs **THE SYSTEM SHALL** assert every `textureKey`, `projectileTextureKey` and `tilesetTextureKey` referenced by `CONTENT` exists in `MANIFEST`.
4. **WHEN** `drawPlaceholder` draws any placeholder entry onto a recording fake context **THE SYSTEM SHALL** issue at least one `fillRect` and every `fillRect` SHALL stay inside `0..width` by `0..height`.
5. **WHEN** `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/assets.test.ts
pnpm typecheck
pnpm lint
pnpm build
pnpm check:dist
pnpm smoke:dist
```

**Checkpoint**

```bash
git add -A && git commit -m "step 6: asset manifest and placeholder textures"
git tag step-06-assets
```

---

## Epic acceptance

El epic está hecho cuando cada tarea está `done` **y**:

1. **WHEN** the whole suite and the content validator run after `E1-T6` **THE SYSTEM SHALL** exit 0 on `pnpm test` and print `content OK` on `pnpm validate:content`.
2. **WHEN** `localStorage` is unavailable **THE SYSTEM SHALL** keep `DEFAULT_BINDINGS` in memory (proved by `tests/bindings.test.ts`).

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm validate:content && pnpm build && pnpm check:dist && pnpm smoke:dist
```

## Pitfalls

- **Importar `phaser` en un test o en `src/input`/`src/content`** — Vitest corre en Node sin `window` y el test muere al importar. Saca la lógica a un módulo puro.
- **Tipar el objetivo del teclado con un tipo estructural propio** — `window` deja de ser asignable y `pnpm typecheck` falla en E1-T5. Usa `Pick<EventTarget, "addEventListener" | "removeEventListener">`.
- **Imports sin `.ts` en `src/content`** — `pnpm validate:content` falla con `ERR_MODULE_NOT_FOUND` aunque `tsc` pase.
- **Partir la línea `scene: [...]` en varias líneas** — el gate `grep -qF` de E1-T5 (y el de E2-T6) deja de encontrarla.
- **Dejar un `pnpm preview` corriendo** — ocupa el puerto 4173 y `pnpm smoke:dist` falla por `strictPort`.
- **Reescribir `package.json`, `tsconfig.json`, `biome.json` o los `scripts/` del workspace** — los entregó el Bootstrap; si crees que necesitan cambiar, detente y reporta.

## Before moving on

- [ ] Las 6 tareas están `done` en `tasks.json`; ninguna en `in_progress`.
- [ ] Pasaron todos los `verify` de cada tarea, no solo el primero.
- [ ] Ningún `verify` se editó ni se saltó porque faltara un archivo.
- [ ] Existen los tags `step-01-boot` … `step-06-assets` (`git tag -l 'step-*'`).
- [ ] El gate pasa limpio desde la raíz del proyecto.
- [ ] Cada contrato "Produced" existe con la firma indicada.
- [ ] Ningún archivo fuera del subárbol se modificó.
- [ ] Este proyecto no tiene variables de entorno; no hay `.env.example` que actualizar.
- [ ] Un commit por tarea, cada uno seguido de su tag.
