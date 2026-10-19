# Epic 02: Movimiento, personaje y escenario

> Al terminar existe un personaje jugable (correr, salto variable, dash, disparo) definido como datos + habilidades enchufables, tres enemigos y un jefe como datos, y la etapa 1 cargada desde Tiled con colisión, cámara y pausa.

| | |
|---|---|
| **Epic id** | `02-movimiento-escenario` |
| **Tasks** | `E2-T1` … `E2-T6` (pasos 7–12) |
| **Depends on** | `01-fundacion-entrada` |
| **Unlocks** | `03-combate-jefe-entrega` |
| **Parallel with** | `E2-T1` puede correr junto a `E1-T2`…`E1-T6`; `E2-T5` junto a `E2-T1`…`E2-T4` (archivos distintos, salvo `src/content/registry.ts`, que serializa `E2-T4`/`E2-T5`/`E2-T6`) |

No necesitas ningún otro archivo para completar este epic. Todo lo de abajo se repite aquí a propósito.

---

## Stack

Phaser 4 (Arcade physics, Tiled JSON) · TypeScript 6 · Vite 8 · Vitest (entorno `node`) · Biome · sin backend, sin DB, sin auth, sin variables de entorno · sitio estático.
Gestor: `pnpm` (fijado por `packageManager`). Runtime en `.nvmrc` (Node 24). Versiones de dependencias en `pnpm-lock.yaml`: léelo, nunca adivines una.

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

## Directory subtree

```
src/
  main.ts                          # existe; editado en E2-T6 (registra StageScene en la línea `scene`)
  core/
    tuning.ts                      # existe — solo lectura (TUNING)
    movement.ts                    # NUEVO E2-T1
  characters/
    ability.ts                     # NUEVO E2-T2
    abilityRegistry.ts             # NUEVO E2-T2; editado en E2-T3
    abilities/run.ts               # NUEVO E2-T2
    abilities/jump.ts              # NUEVO E2-T2
    abilities/shoot.ts             # NUEVO E2-T3
    abilities/dash.ts              # NUEVO E2-T3
  content/
    registry.ts                    # existe; editado en E2-T4, E2-T5, E2-T6
    types.ts, validate.ts          # existen — solo lectura
    characters/kuuchil.ts          # NUEVO E2-T4
    enemies/walker.ts              # NUEVO E2-T5
    enemies/hopper.ts              # NUEVO E2-T5
    enemies/turret.ts              # NUEVO E2-T5
    bosses/sentinel.ts             # NUEVO E2-T6
    stages/stage-01/stage.ts       # NUEVO E2-T6
  entities/
    Player.ts                      # NUEVO E2-T4
    Projectile.ts                  # NUEVO E2-T4
  scenes/
    StageScene.ts                  # NUEVO E2-T6
    sceneInput.ts, MenuScene.ts    # existen — solo lectura
scripts/check-dist.ts, scripts/smoke-dist.ts   # existen (workspace) — solo lectura
public/maps/stage-01.tmj           # existe (workspace) — solo lectura
tests/
  movement.test.ts, tuning.test.ts           # E2-T1
  abilities-move.test.ts                     # E2-T2
  abilities-combat.test.ts                   # E2-T3
  character.test.ts                          # E2-T4
  content-registry.test.ts                   # E2-T5
  content-validate.test.ts, assets.test.ts, boundaries.test.ts   # existen — se re-ejecutan
```

Todo lo que esté fuera de este subárbol queda fuera de alcance. Si una tarea parece requerir editar otro archivo, detente y repórtalo.

## Data model touched here

| Entidad | Campos | Notas |
|---|---|---|
| `CharacterDef` `kuuchil` | todos | literal en E2-T4 |
| `EnemyDef` `walker`/`hopper`/`turret` | todos | literal + tabla en E2-T5 |
| `BossDef` `sentinel` | todos | literal en E2-T6 (el motor llega en el epic 03) |
| `StageDef` `stage-01` | todos | literal en E2-T6; mapa `public/maps/stage-01.tmj` |

Mapa: 60×10 tiles de 16 px; capas `ground` (tilelayer) y `spawns` (objectgroup) con `player_start` (24,112), cinco `enemy` con `enemyId` (`walker`, `hopper`, `walker`, `turret`, `hopper`), `boss_trigger` (720,0,16,112) y `boss_spawn` (880,112); tileset `placeholder-tiles`. Los puntos son los **pies** del sprite (origen 0.5,1).

## Contracts

**Consumed** — ya existe, no lo reconstruyas:

| De | Interfaz | Garantía |
|---|---|---|
| `01` | `TUNING`, `Tuning` (`src/core/tuning.ts`) | 19 claves; `vy` negativo = hacia arriba |
| `01` | `ActionState`, `ActionSnapshot`, `emptyActionState()` (`src/input/actions.ts`) | 8 acciones |
| `01` | `createSceneInput(scene): InputManager` (`src/scenes/sceneInput.ts`) | `update()` una vez por frame |
| `01` | `keyLabel(code)` (`src/input/bindings.ts`) | etiqueta legible |
| `01` | `CONTENT`, `getStage`, `getCharacter`, `FIRST_STAGE_ID`, `DEFAULT_CHARACTER_ID` (`src/content/registry.ts`) | |
| `01` | `extractSpawns(map, spawnLayer)`, `validateContent` (`src/content/validate.ts`) | `StageSpawns` con `playerStarts`, `bossSpawns`, `bossTriggers`, `enemies` |
| `01` | `MANIFEST` con `player`, `projectile-player`, `enemy-*`, `projectile-enemy`, `boss-sentinel`, `tiles-placeholder` | texturas generadas en `BootScene` |
| `01` | `SCENES` (`src/core/gameConfig.ts`); línea `  scene: [BootScene, MenuScene, ControlsScene],` en `src/main.ts` | claves de escena; la línea `scene` va en una sola línea |
| Bootstrap | `pnpm check:dist`, `pnpm smoke:dist` | leen y sirven `dist/` (puerto 4173) |

**Produced** — el epic 03 depende de estas firmas:

| Export | Firma | Usado por |
|---|---|---|
| `src/core/movement.ts` → `horizontalVelocity`, `applyJumpCut`, `canJump`, `clampFall`, `apexHeight`, `jumpAirTimeMs`, `runningJumpDistance`, `dashDistance` | ver E2-T1 | 03 (`docs/PLAYTEST.md`) |
| `src/characters/ability.ts` → `AbilityInput`, `AbilityEffect`, `Ability`, `AbilityFactory` | literal en E2-T2 | 03 |
| `src/characters/abilityRegistry.ts` → `ABILITY_FACTORIES`, `hasAbility`, `createAbility` | | 03 |
| `src/entities/Projectile.ts` → `fireProjectile(group, x, y, vx, vy, textureKey, damage, owner, lifetimeMs)` | `owner: "player" \| "enemy"` | 03 (Enemy, Boss) |
| `src/entities/Player.ts` → `class Player` con `update(snapshot, dtMs)` | | 03 (vida, daño) |
| `src/scenes/StageScene.ts` → escena `StageScene`, `init({ stageId })` | | 03 |
| `src/main.ts` → línea `  scene: [BootScene, MenuScene, ControlsScene, StageScene],` | una sola línea | 03 (sin cambios) |
| `getBoss("sentinel")`, `getEnemy(id)` | datos registrados | 03 |

## Conventions that bite in this area

- **Habilidades = objetos con estado interno + `update(input) → efecto`**; el Player solo fusiona efectos en el orden de `CharacterDef.abilities`: cada campo definido sobrescribe al anterior (el dash manda sobre correr y saltar).
- **Hitboxes siempre desde los datos** (`setSize` + `setOffset` con `hitbox`), nunca desde el tamaño de la textura.
- **Contenido = datos puros**: los módulos de `src/content/**` no importan nada salvo `import type` de `../types.ts`; los carga Node en `pnpm validate:content`.
- **Imports relativos con `.ts`** e `import type` para tipos; sin `enum` ni propiedades de parámetro.
- **Ningún test importa `phaser`**: Player, Projectile y StageScene se verifican con `typecheck` + `build` + `check:dist` + `smoke:dist`; la sensación es un checkpoint manual.
- **La línea `scene: [...]` de `src/main.ts` va en una sola línea** (gate `grep -qF`); el puerto 4173 debe estar libre para `pnpm smoke:dist`.
- Ejecuta `pnpm format` antes de los `Verify`.

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/pure-logic.md`, `.claude/rules/content.md`, `.claude/rules/input.md`. Todos están en la raíz del proyecto desde el Bootstrap.

---

## Tasks

En el mismo orden que `tasks.json`. Trabaja de arriba abajo y no reordenes por prioridad.

### `E2-T1` — Add pure movement logic and tuning sanity tests

**Depends on:** `E1-T1` · **Priority:** p0 — metadato para recortes de alcance, no un orden

`src/core/movement.ts` (puro; `import type { Tuning } from "./tuning.ts"`): `horizontalVelocity(left: boolean, right: boolean, runSpeed: number): number`; `applyJumpCut(vy: number, jumpHeld: boolean, multiplier: number): number`; `canJump(msSinceGrounded: number, msSinceJumpPressed: number, t: Tuning): boolean`; `clampFall(vy: number, maxFallSpeed: number): number`; `apexHeight(t)` = `jumpVelocity² / (2·gravityY)`; `jumpAirTimeMs(t)` = `2·jumpVelocity / gravityY · 1000`; `runningJumpDistance(t)` = `runSpeed · jumpAirTimeMs / 1000`; `dashDistance(t)` = `dashSpeed · dashDurationMs / 1000`. Convención: `vy` negativo = hacia arriba. `tests/tuning.test.ts` afirma **propiedades** (plataformas de 3 tiles alcanzables, foso de 3 tiles cruzable, destellos < 3/s), no valores fijos: el autor podrá cambiar `TUNING` sin romperlo mientras el mapa siga siendo jugable.

**Files**
- `src/core/movement.ts` — nuevo
- `tests/movement.test.ts` — nuevo
- `tests/tuning.test.ts` — nuevo

**Acceptance**

Copiado literal del arreglo `acceptance` de esta tarea en `tasks.json`.

1. **WHEN** `applyJumpCut` receives an upward velocity (negative) with jump released **THE SYSTEM SHALL** return it multiplied by `TUNING.jumpCutMultiplier`, and SHALL return it unchanged while jump is held or while falling.
2. **WHEN** `canJump` receives `msSinceGrounded` at most `coyoteTimeMs` and `msSinceJumpPressed` at most `jumpBufferMs` **THE SYSTEM SHALL** return true, and false when either exceeds its window.
3. **WHEN** `horizontalVelocity` receives left and right both held **THE SYSTEM SHALL** return 0, and `TUNING.runSpeed` times the direction otherwise.
4. **WHEN** `pnpm test tests/tuning.test.ts` runs **THE SYSTEM SHALL** assert `apexHeight(TUNING)` is above 48 px, `runningJumpDistance(TUNING)` is above 48 px, `dashDistance(TUNING)` is above 32 px, `TUNING.shotSpeed * TUNING.shotLifetimeMs / 1000` is at least 240 and `TUNING.telegraphBlinkMs` is at least 167.
5. **WHEN** `pnpm typecheck` and `pnpm lint` run **THE SYSTEM SHALL** exit 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto.

```bash
pnpm test tests/movement.test.ts
pnpm test tests/tuning.test.ts
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 7: pure movement and tuning sanity"
git tag step-07-movement
```

Ejecuta ambos tras el último `Verify` en verde. El tag es el objetivo de rollback; cópialo del campo `checkpoint`.

### `E2-T2` — Add run and jump abilities with ability registry

**Depends on:** `E1-T3`, `E2-T1` · **Priority:** p0

`src/characters/ability.ts`, literal:

```ts
import type { Tuning } from "../core/tuning.ts";
import type { ActionState } from "../input/actions.ts";

export type AbilityInput = {
  readonly dtMs: number;
  readonly held: ActionState;
  readonly pressed: ActionState;
  readonly grounded: boolean;
  readonly facing: 1 | -1;
  readonly velocityY: number;
  readonly activeShots: number;
};

export type AbilityEffect = {
  velocityX?: number;
  velocityY?: number;
  ignoreGravity?: boolean;
  fire?: boolean;
};

export type Ability = {
  readonly id: string;
  update(input: AbilityInput): AbilityEffect;
  reset(): void;
};

export type AbilityFactory = (tuning: Tuning) => Ability;
```

`src/characters/abilities/run.ts` → `export const createRun: AbilityFactory` (`velocityX = horizontalVelocity(held.left, held.right, tuning.runSpeed)`). `src/characters/abilities/jump.ts` → `export const createJump: AbilityFactory`: lleva `msSinceGrounded` (0 si `grounded`, si no += `dtMs`) y `msSinceJumpPressed` (0 al pulsar, si no += `dtMs`; empieza en `Number.POSITIVE_INFINITY`); si `canJump` → `velocityY = -jumpVelocity` y ambos contadores a infinito; si no salta, `velocityY = clampFall(applyJumpCut(input.velocityY, held.jump, jumpCutMultiplier), maxFallSpeed)`. `src/characters/abilityRegistry.ts`: `ABILITY_FACTORIES: Readonly<Record<string, AbilityFactory>> = { run: createRun, jump: createJump }`, `hasAbility(id)`, `createAbility(id, tuning)` que lanza un `Error` con mensaje `Unknown ability: <id>` si no existe. Tests con entradas construidas a partir de `emptyActionState()`.

**Files**
- `src/characters/ability.ts` — nuevo
- `src/characters/abilities/run.ts` — nuevo
- `src/characters/abilities/jump.ts` — nuevo
- `src/characters/abilityRegistry.ts` — nuevo
- `tests/abilities-move.test.ts` — nuevo

**Acceptance**

1. **WHEN** `createAbility("run", TUNING)` updates with `right` held **THE SYSTEM SHALL** return `velocityX` equal to `TUNING.runSpeed`.
2. **WHEN** `jump` is pressed while airborne and the character lands within `TUNING.jumpBufferMs` **THE SYSTEM SHALL** return `velocityY` equal to `-TUNING.jumpVelocity` on the first grounded update.
3. **WHEN** `jump` is pressed within `TUNING.coyoteTimeMs` after leaving the ground **THE SYSTEM SHALL** jump, and **WHEN** pressed after that window **THE SYSTEM SHALL** not.
4. **WHEN** `createAbility("wall-jump", TUNING)` is called **THE SYSTEM SHALL** throw an error whose message contains `wall-jump`.
5. **WHEN** `pnpm test tests/boundaries.test.ts`, `pnpm typecheck` and `pnpm lint` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/abilities-move.test.ts
pnpm test tests/boundaries.test.ts
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 8: run and jump abilities with registry"
git tag step-08-abilities-move
```

### `E2-T3` — Add shoot and dash abilities

**Depends on:** `E2-T2` · **Priority:** p0

`src/characters/abilities/dash.ts` → `createDash`: estado `dashRemainingMs`, `cooldownMs`, `airDashUsed`. Si `grounded` → `airDashUsed = false`. Al pulsar `dash` con `dashRemainingMs ≤ 0`, `cooldownMs ≤ 0` y (`grounded` o `!airDashUsed`): inicia (`dashRemainingMs = dashDurationMs`; en el aire, `airDashUsed = true`). Mientras `dashRemainingMs > 0`: efecto `{ velocityX: dashSpeed·facing, velocityY: 0, ignoreGravity: true }` y resta `dtMs`; al llegar a ≤ 0 fija `cooldownMs = dashCooldownMs`. Fuera del dash el cooldown baja con `dtMs` y el efecto es `{}`. `src/characters/abilities/shoot.ts` → `createShoot`: `cooldownMs` baja con `dtMs`; con `pressed.shoot`, `cooldownMs ≤ 0` y `activeShots < maxShotsOnScreen` → `{ fire: true }` y `cooldownMs = shotCooldownMs`. `src/characters/abilityRegistry.ts`: añade `dash: createDash` y `shoot: createShoot`.

**Files**
- `src/characters/abilities/shoot.ts` — nuevo
- `src/characters/abilities/dash.ts` — nuevo
- `src/characters/abilityRegistry.ts` — edición: registra `dash` y `shoot`
- `tests/abilities-combat.test.ts` — nuevo

**Acceptance**

1. **WHEN** `dash` is pressed while grounded **THE SYSTEM SHALL** return `velocityX` equal to `TUNING.dashSpeed` times `facing` with `ignoreGravity` true for `TUNING.dashDurationMs`, then stop overriding velocity.
2. **WHEN** `dash` is pressed again before `TUNING.dashCooldownMs` has elapsed since the previous dash ended **THE SYSTEM SHALL** not start a new dash.
3. **WHEN** one dash has been used in the air **THE SYSTEM SHALL** refuse a second air dash until an update with `grounded` true.
4. **WHEN** `shoot` is pressed with `activeShots` below `TUNING.maxShotsOnScreen` and the cooldown elapsed **THE SYSTEM SHALL** return `fire: true`, and SHALL not fire when `activeShots` equals `TUNING.maxShotsOnScreen`.
5. **WHEN** `pnpm typecheck` and `pnpm lint` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/abilities-combat.test.ts
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 9: shoot and dash abilities"
git tag step-09-abilities-combat
```

### `E2-T4` — Add character data, Player and Projectile

**Depends on:** `E1-T6`, `E2-T3` · **Priority:** p0

`src/content/characters/kuuchil.ts`, literal:

```ts
import type { CharacterDef } from "../types.ts";

export const kuuchil: CharacterDef = {
  id: "kuuchil",
  name: "Kuuchil",
  textureKey: "player",
  projectileTextureKey: "projectile-player",
  hitbox: { width: 10, height: 14, offsetX: 3, offsetY: 2 },
  maxHp: 16,
  shotDamage: 1,
  abilities: ["run", "jump", "dash", "shoot"],
};
```

`src/content/registry.ts` (edición): `import { kuuchil } from "./characters/kuuchil.ts";` y `characters: [kuuchil]`. `src/entities/Projectile.ts`: `type ProjectileOwner = "player" | "enemy"`; `fireProjectile(group: Phaser.Physics.Arcade.Group, x: number, y: number, vx: number, vy: number, textureKey: string, damage: number, owner: ProjectileOwner, lifetimeMs: number)` crea un sprite del grupo sin gravedad, guarda `damage`/`owner` con `setData`, y lo destruye al vencer `lifetimeMs` (`scene.time.delayedCall`) o al salir de los límites del mundo. `src/entities/Player.ts`: `export class Player extends Phaser.Physics.Arcade.Sprite`; constructor `(scene, x, y, def: CharacterDef, shots: Phaser.Physics.Arcade.Group)`; origen (0.5, 1); hitbox desde `def.hitbox` (`setSize` + `setOffset` sobre el body); habilidades con `createAbility(id, TUNING)` en el orden de `def.abilities`. `update(snapshot: ActionSnapshot, dtMs: number)`: actualiza `facing` con left/right, arma `AbilityInput` (`grounded` = body bloqueado abajo, `velocityY` = velocidad actual, `activeShots = shots.countActive(true)`), fusiona efectos, aplica velocidades, `setAllowGravity(!ignoreGravity)`, `setFlipX(facing < 0)`; si `fire` → `fireProjectile(shots, x + 8·facing, y − 8, TUNING.shotSpeed·facing, 0, def.projectileTextureKey, def.shotDamage, "player", TUNING.shotLifetimeMs)`.

**Files**
- `src/content/characters/kuuchil.ts` — nuevo
- `src/content/registry.ts` — edición: registra `kuuchil`
- `src/entities/Player.ts` — nuevo
- `src/entities/Projectile.ts` — nuevo
- `tests/character.test.ts` — nuevo

**Acceptance**

1. **WHEN** `pnpm test tests/character.test.ts` runs **THE SYSTEM SHALL** assert `DEFAULT_CHARACTER_ID` (`kuuchil`) is registered and every id in its `abilities` resolves with `hasAbility`.
2. **WHEN** `pnpm test tests/character.test.ts` runs **THE SYSTEM SHALL** assert the character's `abilities` are exactly `run`, `jump`, `dash`, `shoot` in that order and its hitbox has positive size and non-negative offsets.
3. **WHEN** `pnpm test tests/assets.test.ts` and `pnpm validate:content` run with the character registered **THE SYSTEM SHALL** exit 0.
4. **WHEN** `pnpm typecheck`, `pnpm lint` and `pnpm build` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/character.test.ts
pnpm test tests/assets.test.ts
pnpm validate:content
pnpm typecheck
pnpm lint
pnpm build
```

**Checkpoint**

```bash
git add -A && git commit -m "step 10: character data, player and projectile"
git tag step-10-character-player
```

### `E2-T5` — Add enemy data modules

**Depends on:** `E1-T6` · **Priority:** p0

`src/content/enemies/walker.ts`, literal (`hopper.ts` y `turret.ts` siguen la misma forma con los valores de la tabla y exportan `hopper` y `turret`):

```ts
import type { EnemyDef } from "../types.ts";

export const walker: EnemyDef = {
  id: "walker",
  name: "Caminante",
  behavior: "walker",
  textureKey: "enemy-walker",
  hitbox: { width: 12, height: 14, offsetX: 2, offsetY: 2 },
  maxHp: 3,
  contactDamage: 2,
  speed: 30,
  jumpVelocity: 0,
  actionIntervalMs: 0,
  rangePx: 0,
  projectileSpeed: 0,
  projectileDamage: 0,
};
```

| id | name | behavior | textureKey | hitbox (w,h,ox,oy) | maxHp | contactDamage | speed | jumpVelocity | actionIntervalMs | rangePx | projectileSpeed | projectileDamage |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `walker` | Caminante | walker | `enemy-walker` | 12,14,2,2 | 3 | 2 | 30 | 0 | 0 | 0 | 0 | 0 |
| `hopper` | Saltarín | hopper | `enemy-hopper` | 12,12,2,4 | 2 | 2 | 40 | 260 | 1400 | 0 | 0 | 0 |
| `turret` | Torreta | turret | `enemy-turret` | 14,14,1,2 | 4 | 1 | 0 | 0 | 1800 | 128 | 100 | 2 |

`src/content/registry.ts` (edición): imports de los tres y `enemies: [walker, hopper, turret]`. `tests/content-registry.test.ts`: ids únicos por tipo en `CONTENT`, hitboxes válidas de todo lo registrado, invariantes de `turret`/`hopper`.

**Files**
- `src/content/enemies/walker.ts` — nuevo
- `src/content/enemies/hopper.ts` — nuevo
- `src/content/enemies/turret.ts` — nuevo
- `src/content/registry.ts` — edición: registra los tres enemigos
- `tests/content-registry.test.ts` — nuevo

**Acceptance**

1. **WHEN** `pnpm test tests/content-registry.test.ts` runs **THE SYSTEM SHALL** assert enemies `walker`, `hopper` and `turret` are registered and every id is unique within its kind.
2. **WHEN** `pnpm test tests/content-registry.test.ts` runs **THE SYSTEM SHALL** assert every registered enemy, boss and character hitbox has positive width and height and non-negative offsets.
3. **WHEN** `pnpm test tests/content-registry.test.ts` runs **THE SYSTEM SHALL** assert every `turret` has `rangePx`, `actionIntervalMs` and `projectileSpeed` above 0 and every `hopper` has `jumpVelocity` and `actionIntervalMs` above 0.
4. **WHEN** `pnpm test tests/assets.test.ts` and `pnpm validate:content` run **THE SYSTEM SHALL** exit 0, the latter printing `content OK`.
5. **WHEN** `pnpm typecheck` and `pnpm lint` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/content-registry.test.ts
pnpm test tests/assets.test.ts
pnpm validate:content
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 11: enemy data"
git tag step-11-enemy-data
```

### `E2-T6` — Add boss data, stage 1 and tilemap StageScene

**Depends on:** `E2-T4`, `E2-T5` · **Priority:** p0

`src/content/bosses/sentinel.ts`, literal:

```ts
import type { BossDef } from "../types.ts";

const BODY = { width: 24, height: 28, offsetX: 4, offsetY: 4 };

export const sentinel: BossDef = {
  id: "sentinel",
  name: "Centinela",
  textureKey: "boss-sentinel",
  hitbox: BODY,
  maxHp: 32,
  contactDamage: 3,
  introMs: 1200,
  phases: [
    { id: "phase-1", enterAtHpFraction: 1, idleMs: 900, attackCycle: ["dash", "spread"] },
    { id: "phase-2", enterAtHpFraction: 0.5, idleMs: 600, attackCycle: ["slam", "dash", "spread"] },
  ],
  attacks: [
    {
      id: "dash",
      pattern: "dash",
      telegraphMs: 600,
      activeMs: 500,
      recoveryMs: 500,
      damage: 3,
      hitbox: BODY,
      speed: 220,
      count: 1,
    },
    {
      id: "spread",
      pattern: "shot-spread",
      telegraphMs: 500,
      activeMs: 300,
      recoveryMs: 600,
      damage: 2,
      hitbox: { width: 4, height: 4, offsetX: 0, offsetY: 0 },
      speed: 120,
      count: 3,
    },
    {
      id: "slam",
      pattern: "slam",
      telegraphMs: 700,
      activeMs: 600,
      recoveryMs: 700,
      damage: 4,
      hitbox: BODY,
      speed: 260,
      count: 1,
    },
  ],
};
```

`src/content/stages/stage-01/stage.ts`, literal:

```ts
import type { StageDef } from "../../types.ts";

export const stage01: StageDef = {
  id: "stage-01",
  name: "Ruinas de Kuuchil",
  mapKey: "map-stage-01",
  mapPath: "maps/stage-01.tmj",
  tilesetName: "placeholder-tiles",
  tilesetTextureKey: "tiles-placeholder",
  groundLayer: "ground",
  spawnLayer: "spawns",
  bossId: "sentinel",
  minibossIds: [],
  music: null,
};
```

`src/content/registry.ts`, forma final tras esta tarea:

```ts
import { sentinel } from "./bosses/sentinel.ts";
import { kuuchil } from "./characters/kuuchil.ts";
import { hopper } from "./enemies/hopper.ts";
import { turret } from "./enemies/turret.ts";
import { walker } from "./enemies/walker.ts";
import { stage01 } from "./stages/stage-01/stage.ts";
import type { BossDef, CharacterDef, ContentRegistry, EnemyDef, StageDef } from "./types.ts";

export const FIRST_STAGE_ID = "stage-01";
export const DEFAULT_CHARACTER_ID = "kuuchil";

export const CONTENT: ContentRegistry = {
  stages: [stage01],
  bosses: [sentinel],
  enemies: [walker, hopper, turret],
  characters: [kuuchil],
};
```
(los cuatro `get*` siguen debajo, sin cambios).

`src/scenes/StageScene.ts`: `init({ stageId })` → `getStage`; si es `undefined`, texto "Etapa no registrada: <id>" y la acción `pause` vuelve al menú. `preload()`: `this.load.tilemapTiledJSON(stage.mapKey, stage.mapPath)` y `this.load.json(stage.mapKey + "-raw", stage.mapPath)`. `create()`: `this.make.tilemap({ key: stage.mapKey })`, `addTilesetImage(stage.tilesetName, stage.tilesetTextureKey, 16, 16, 0, 0)`, `createLayer(stage.groundLayer, tileset, 0, 0)`, `setCollisionByExclusion([-1])`; `physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 64)`; `extractSpawns(this.cache.json.get(stage.mapKey + "-raw"), stage.spawnLayer)` → `Player` en `playerStarts[0]` con `getCharacter(DEFAULT_CHARACTER_ID)` y `setCollideWorldBounds(true)`; collider jugador↔capa; cámara `setBounds(0, 0, map.widthInPixels, map.heightInPixels)` + `startFollow(player, true)`; grupo de balas del jugador destruidas al chocar con la capa. `update(_, delta)`: `input.update()`; `pressed.pause` alterna la pausa (`physics.pause()`/`resume()`, texto "PAUSA - Esc: seguir / Z: menú" con las etiquetas reales de `keyLabel`); en pausa, `pressed.jump` → `MenuScene`; fuera de pausa, `player.update(snapshot, delta)`. `src/main.ts` (edición): añade el import y deja la línea `scene` exactamente como `  scene: [BootScene, MenuScene, ControlsScene, StageScene],` (una sola línea; el gate la busca con `grep -qF`).

**Files**
- `src/content/bosses/sentinel.ts` — nuevo
- `src/content/stages/stage-01/stage.ts` — nuevo
- `src/content/registry.ts` — edición: registra etapa y jefe
- `src/scenes/StageScene.ts` — nuevo
- `src/main.ts` — edición: registra `StageScene` en la línea `scene`

**Acceptance**

1. **WHEN** `pnpm validate:content` runs **THE SYSTEM SHALL** validate `stage-01` against `public/maps/stage-01.tmj` (layers `ground` and `spawns`, one `player_start`, one `boss_spawn`, at least one `boss_trigger`, every `enemyId` registered, boss `sentinel` registered) and print `content OK`.
2. **WHEN** `pnpm test tests/content-validate.test.ts` runs **THE SYSTEM SHALL** report 0 errors for the real registry and exit 0.
3. **WHEN** `grep -qF "scene: [BootScene, MenuScene, ControlsScene, StageScene]" src/main.ts` runs **THE SYSTEM SHALL** exit 0, proving `StageScene` is in the `scene` array.
4. **WHEN** `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm validate:content
pnpm test tests/content-validate.test.ts
grep -qF "scene: [BootScene, MenuScene, ControlsScene, StageScene]" src/main.ts
pnpm typecheck
pnpm lint
pnpm build
pnpm check:dist
pnpm smoke:dist
```

Checkpoint manual del autor (playtest 1, no es gate): "Jugar" carga la etapa; correr, salto variable, dash (también uno aéreo), hasta 3 balas; plataformas de filas 5 y 4 alcanzables; la cámara no sale del mapa; Esc pausa. Ajusta `TUNING` una variable por sesión y guarda las notas en tu editor o libreta: `docs/PLAYTEST.md` no existe hasta `E3-T5`, donde se pasan a limpio. Todo ajuste debe mantener verde `pnpm test tests/tuning.test.ts`.

**Checkpoint**

```bash
git add -A && git commit -m "step 12: boss data, stage 1 and tilemap scene"
git tag step-12-stage-map
```

---

## Epic acceptance

El epic está hecho cuando cada tarea está `done` **y**:

1. **WHEN** `pnpm validate:content` runs after `E2-T6` **THE SYSTEM SHALL** print `content OK` with one stage, one boss, three enemies and one character registered.
2. **WHEN** an ability id that is not registered is requested **THE SYSTEM SHALL** throw instead of silently ignoring it (proved by `tests/abilities-move.test.ts`).

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm validate:content && pnpm build && pnpm check:dist && pnpm smoke:dist
```

## Pitfalls

- **Derivar la hitbox del tamaño de la textura** (`body.setSize()` sin argumentos) — al cambiar arte cambiaría el combate. Usa siempre `def.hitbox`.
- **Leer el mapa desde la caché de tilemap de Phaser 4** — su forma interna es UNVERIFIED; por eso se carga una segunda vez con `load.json` y se pasa a `extractSpawns`.
- **Olvidar `setCollisionByExclusion([-1])`** — los tiles vacíos de Phaser valen `-1`; sin esto el jugador atraviesa el suelo.
- **Meter lógica de salto o dash en `Player.ts`** — rompe la extensibilidad; el Player solo aplica efectos de las habilidades.
- **Partir la línea `scene: [...]`** — el gate `grep -qF` de `E2-T6` deja de encontrarla.

## Before moving on

- [ ] Las 6 tareas están `done` en `tasks.json`; ninguna en `in_progress`.
- [ ] Pasaron todos los `verify` de cada tarea, no solo el primero.
- [ ] Ningún `verify` se editó ni se saltó porque faltara un archivo.
- [ ] Existen los tags `step-07-movement` … `step-12-stage-map` (`git tag -l 'step-*'`).
- [ ] El gate pasa limpio desde la raíz del proyecto.
- [ ] Cada contrato "Produced" existe con la firma indicada.
- [ ] Ningún archivo fuera del subárbol se modificó.
- [ ] Este proyecto no tiene variables de entorno; no hay `.env.example` que actualizar.
- [ ] Un commit por tarea, cada uno seguido de su tag.
