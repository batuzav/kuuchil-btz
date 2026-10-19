# kuuchil-btz — Blueprint

> Generado por The Architect el 2026-10-19
> Shape: ninguna shape oficial de juego existe en The Architect; se trata como **aplicación web solo-cliente** (sin backend, sin auth, sin DB, sin pagos, sin observabilidad) construida con el runtime track ts-node como tooling de build.
> Runtime track: ts-node · `knowledge/runtime-tracks/ts-node.md` (fallback; los pins del informe `stack-researcher` del 2026-10-19 mandan)
> Modo de emisión: bundle (17 pasos)
> Versión del blueprint: 1
> Versiones verificadas: 2026-10-19 — ver §11 para la procedencia por paquete

**Cómo usar este bundle.** Este directorio (`blueprints/kuuchil-btz/`) vive *dentro* del proyecto. El builder ejecuta el bloque *Bootstrap* de §10 desde la raíz del proyecto: copia el contenido de `workspace/` a la raíz con una copia que nunca pisa archivos existentes, crea el repositorio git, instala y hace el primer commit. Después trabaja `tasks.json` en orden, abriendo solo el epic de cada tarea (`epics/`). Los comandos `verify` corren siempre desde la raíz del proyecto.

---

## 1. Project Overview & Non-Goals

### Visión
kuuchil-btz es un juego de plataformas de acción 2D para navegador cuyo atractivo principal son los **jefes**: combates difíciles pero justos, donde cada ataque se anuncia con un telegraph visible y medible antes de golpear. La sensación de control apunta a Mega Man X / Zero (correr, saltar con altura variable, dash, disparar) sin copiar sus personajes ni niveles, y la estética es pixel art de era GBA a resolución nativa 240×160.

Es un prototipo personal del autor (hispanohablante, sin arte propio). Todo el arte es geometría generada en código detrás de un manifiesto de assets, de modo que los sprites reales se cambian editando rutas. La v1 entrega una etapa jugable completa que termina en un jefe de dos fases, con controles remapeables, y deja preparados los puntos de extensión (etapas, jefes, personajes, habilidades, gamepad) para que crecer sea "añadir un archivo + una línea de registro".

### Usuarios
| Persona | Qué viene a hacer | Frecuencia |
|---|---|---|
| El autor (jugador/diseñador) | Jugar la etapa, pelear contra el jefe, ajustar `TUNING` y datos de jefes, iterar | Diaria durante el desarrollo |
| Jugador web casual (futuro, opcional) | Jugar la build pública en itch.io o Cloudflare Pages | Ocasional, solo si el autor publica |

### Objetivos — alcance v1
1. El juego arranca en el navegador a 240×160 escalado con `FIT`, pixel-perfect, con menú principal y pantalla de controles.
2. Los controles por defecto (flechas, Z saltar, X disparar, C dash, Esc pausa) son remapeables en el juego, detectan conflictos, se restauran a valores por defecto y persisten en `localStorage` con caída segura.
3. Un personaje jugable con correr, salto variable (coyote time + buffer), dash y disparo, con todas las cifras en un solo archivo de tuning probado por tests.
4. La etapa 1 se carga desde un mapa Tiled, con colisión, cámara, tres tipos de enemigo definidos como datos, daño, vida, HUD, muerte y reinicio.
5. Un jefe de dos fases conducido por una FSM genérica dirigida por datos, con telegraph obligatorio en cada ataque, y flujo de victoria y derrota.
6. Validación automática de contenido, documentación y skills de proyecto para añadir etapas, jefes, personajes y cambiar arte; build estática de producción servida y comprobada por HTTP.

### Non-Goals — fuera de alcance v1

| No se construye | Por qué no ahora | Vuelve cuando | Punto de extensión |
|---|---|---|---|
| Guardado / progreso | Una sola etapa; nada que guardar | Exista una segunda etapa | `src/input/bindingsStore.ts` es el patrón (clave versionada + validación) |
| Menú de selección de etapa | Una sola etapa | Haya ≥2 etapas registradas | `CONTENT.stages` + `MenuScene` |
| Audio (música y SFX) | Sin assets de audio; el foco es control y jefes | El autor tenga pistas/SFX | `StageDef.music` (hoy `null`) + `MANIFEST` |
| Más de un personaje jugable | Validar primero la sensación con uno | El primer jefe se sienta bien en playtest | `CONTENT.characters` + `DEFAULT_CHARACTER_ID` |
| Proveedor de gamepad | El teclado basta para el prototipo | El autor quiera jugar con mando | `InputProvider` + `InputManager.addProvider` |
| Wall-jump | Cambia el diseño de niveles; primero el núcleo | Tras el playtest del jefe 1 | `ABILITY_FACTORIES` (una línea) |
| Sable / melee | Requiere hitboxes de ataque del jugador | Tras wall-jump | `Ability` + `AbilityEffect` |
| Robar el arma del jefe | Requiere varios jefes | ≥2 jefes | `CharacterDef.abilities` |
| Móvil / táctil | Control de precisión pensado para teclado | Publicación pública con demanda móvil | Otro `InputProvider` |
| Multijugador | Fuera del concepto | No planificado | — |
| Backend / cuentas | Sin datos que sincronizar | Leaderboards (no planificado) | — |
| Arte real | El autor no tiene arte aún | Haya sprites | `MANIFEST` (skill `swap-art`) |
| Localización | Un solo idioma (español) | Publicación internacional | Textos centralizados por escena |
| Analítica | Prototipo personal | Publicación pública | — |

**El builder no implementa nada de esta tabla**, aunque parezca pequeño mientras trabaja en un paso adyacente. Si un paso parece requerir un no-objetivo, es un defecto del blueprint: detente y repórtalo.

### Métricas de éxito
| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Gate completo verde | 100 % al cerrar el paso 17 | `pnpm gate` sale 0 |
| Telegraph justo | 0 ataques sin telegraph ≥ `TUNING.minTelegraphMs` | `pnpm test tests/telegraph.test.ts` |
| Jefe vencible | El autor vence al jefe en ≤ 10 intentos tras el ajuste final | Registro de intentos (en `docs/PLAYTEST.md` desde el paso 17) |
| Arte intercambiable | Cambiar un sprite toca 1 archivo | Skill `swap-art`: solo `src/assets/manifest.ts` |

---

## 2. Tech Stack

**Runtime track: ts-node.** Esta tabla nombra *elecciones*; toda versión vive en §11.

| Capa | Elección | Por qué esto, sobre qué |
|---|---|---|
| Lenguaje / runtime | TypeScript sobre Node 24 LTS (tooling) y el navegador (juego) | Un idioma para juego, scripts y tests; Node 24 ejecuta `scripts/*.ts` despojando tipos, sin `tsx` |
| Framework | Phaser 4 (Arcade physics, cargador Tiled JSON, cámaras) | Trae física, tilemaps y escalado pixel-art; Kaplay/Excalibur tienen peor soporte Tiled; un motor propio costaría semanas |
| Bundler / dev server | Vite 8 | Dev server instantáneo, build estática y `preview()` programático para el smoke test; no se usa `phaserjs/template-vite-ts` (desactualizado) |
| Estilos | CSS mínimo inline en `index.html` | La UI vive en el canvas; no hace falta un framework CSS |
| Capa de componentes | NOT APPLICABLE — no hay UI DOM; escenas Phaser | — |
| Base de datos | NOT APPLICABLE — sin servidor | Contenido = archivos `.tmj` + módulos TS; preferencias = `localStorage` |
| ORM / acceso a datos | Módulos de datos TS + `validateContent` | Validados en test/build; un ORM no tendría nada que mapear |
| Auth | NOT APPLICABLE — sin cuentas | — |
| Trabajo en segundo plano | NOT APPLICABLE | — |
| Pagos | NOT APPLICABLE | — |
| Almacenamiento de archivos | NOT APPLICABLE — assets estáticos en `public/` | — |
| Email / notificaciones | NOT APPLICABLE | — |
| Hosting | Sitio estático: Cloudflare Pages o zip HTML5 de itch.io (opcional) | `dist/` con `base: "./"` corre en ambos sin servidor |
| Tests | Vitest en entorno `node` | Toda la lógica de juego es pura y se prueba sin navegador |
| Lint + formato | Biome | Una herramienta, un config; reemplaza ESLint + Prettier |
| Gestor de paquetes | pnpm vía `packageManager` + corepack | Lockfile estricto; versión fijada por el manifiesto |
| Editor de mapas | Tiled 1.12.2 (herramienta de escritorio, no dependencia) | Formato JSON `.tmj` que Phaser carga nativamente |

### Compatibility check
Checked against `knowledge/stack-compatibility.md` — ninguna de las filas de combinaciones conocidas como malas aplica (no hay framework CSS con at-rules, ni servidor, ni DB, ni auth). Gotchas del track que sí se arrastran: `corepack enable` con `--install-directory` (EACCES), TypeScript fijado en 6.x (no 7), convención de especificadores `.ts` para scripts Node, y el comportamiento `ERR_PNPM_IGNORED_BUILDS` documentado para pnpm 11 (**UNVERIFIED en pnpm 12**: el Bootstrap lo maneja con un fallback explícito y no se afirma en ningún sentido).

**Riesgos de stack no verificados en navegador:** Phaser 4 solo fue leído en código fuente por `stack-researcher`, no ejecutado. `pixelArt: true` fuerza antialias off; `roundPixels` es `false` por defecto en v4, por eso se fija `true` explícitamente. El comportamiento real de `Scale.FIT` + `pixelArt` en navegador es **UNVERIFIED** y es un checkpoint manual del paso 1.

---

## 3. Directory Structure

```
kuuchil-btz/                         # raíz del proyecto (aquí corren todos los comandos)
  blueprints/kuuchil-btz/            # ESTE bundle; se commitea; excluido de biome/tsc/vitest/vite
  .claude/                           # origen 2: copiado desde workspace/
    settings.json                    # allowlist de comandos de verify
    rules/input.md                   # reglas de entrada (paths: src/input, src/scenes, src/entities)
    rules/content.md                 # reglas de contenido (paths: src/content, src/assets, public/maps, scripts)
    rules/pure-logic.md              # reglas de lógica pura (paths: src/core, src/characters, src/bosses, tests)
    skills/add-stage/SKILL.md        # procedimiento: nueva etapa
    skills/add-boss/SKILL.md         # procedimiento: nuevo jefe
    skills/add-character/SKILL.md    # procedimiento: personaje / habilidad
    skills/swap-art/SKILL.md         # procedimiento: cambiar arte
  CLAUDE.md                          # origen 2 — instrucciones del proyecto
  AGENTS.md                          # origen 2 — stub para agentes no-Claude
  package.json                       # origen 2 — manifiesto completo (scripts + deps)
  pnpm-lock.yaml                     # generado por `pnpm install` en el Bootstrap
  tsconfig.json                      # origen 2
  biome.json                         # origen 2
  vite.config.ts                     # origen 2 — base "./", outDir "dist"
  vitest.config.ts                   # origen 2 — tests/**/*.test.ts, entorno node
  index.html                         # origen 2 — <div id="game"> + /src/main.ts
  .nvmrc                             # origen 2 — "24"
  .gitignore                         # origen 2 — node_modules/, dist/, ...
  README.md                          # paso 17
  docs/PLAYTEST.md                   # paso 17 — guía de tuning y playtest
  docs/DEPLOY.md                     # paso 17 — publicación estática
  public/
    maps/stage-01.tmj                # origen 2 — mapa Tiled escrito a mano (§19.6)
  scripts/
    check-dist.ts                    # origen 2 — lee dist/: index.html → entry JS existe y contiene el marcador
    smoke-dist.ts                    # origen 2 — SIRVE dist/ con vite preview en 127.0.0.1:4173 y pide / y el entry por HTTP
    validate-content.ts              # paso 2 — `pnpm validate:content`
  src/
    main.ts                          # pasos 1, 5, 12 — crea Phaser.Game, registra escenas
    core/                            # lógica pura (sin phaser)
      tuning.ts                      # paso 1 — TUNING: todas las cifras de control/combate
      gameConfig.ts                  # paso 1 — resolución, render, escala, claves de escena
      movement.ts                    # paso 7 — salto variable, coyote, buffer, distancias
      health.ts                      # paso 13 — vida, daño, invulnerabilidad
      enemyAi.ts                     # paso 14 — decisiones de walker/hopper/turret
      stageFlow.ts                   # paso 16 — flujo exploring→boss→won/lost
    input/                           # entrada (sin phaser)
      actions.ts                     # paso 3 — ACTIONS, tipos, DEFAULT_BINDINGS
      inputManager.ts                # paso 3 — InputProvider, InputManager
      keyboardProvider.ts            # paso 3 — único lugar con listeners de teclado
      bindings.ts                    # paso 4 — rebind, parseBindings, reservadas, etiquetas
      bindingsStore.ts               # paso 4 — localStorage con try/catch
      controlsMenu.ts                # paso 4 — modelo puro de la pantalla de controles
    characters/                      # habilidades (sin phaser)
      ability.ts                     # paso 8 — tipos Ability/AbilityInput/AbilityEffect
      abilityRegistry.ts             # pasos 8, 9 — ABILITY_FACTORIES
      abilities/run.ts               # paso 8
      abilities/jump.ts              # paso 8
      abilities/shoot.ts             # paso 9
      abilities/dash.ts              # paso 9
    bosses/                          # motor de jefes (sin phaser)
      fsm.ts                         # paso 15 — createBossState/stepBoss
      patterns.ts                    # paso 15 — vectores de dash/spread/slam
    content/                         # contenido como datos (sin phaser)
      types.ts                       # paso 2
      registry.ts                    # pasos 2, 10, 11, 12 — CONTENT
      validate.ts                    # paso 2 — extractSpawns, validateContent
      characters/kuuchil.ts          # paso 10
      enemies/walker.ts              # paso 11
      enemies/hopper.ts              # paso 11
      enemies/turret.ts              # paso 11
      bosses/sentinel.ts             # paso 12
      stages/stage-01/stage.ts       # paso 12
    assets/
      palette.ts                     # paso 6 — PALETTE, TEXT_STYLE
      manifest.ts                    # paso 6 — MANIFEST
      placeholders.ts                # paso 6 — drawPlaceholder, generatePlaceholders
    entities/                        # Phaser
      Player.ts                      # pasos 10, 13
      Projectile.ts                  # paso 10
      Enemy.ts                       # paso 14
      Boss.ts                        # paso 16
    scenes/                          # Phaser
      BootScene.ts                   # pasos 1, 5, 6
      sceneInput.ts                  # paso 5 — createSceneInput(scene)
      MenuScene.ts                   # paso 5
      ControlsScene.ts               # paso 5
      StageScene.ts                  # pasos 12, 13, 14, 16
      hud.ts                         # pasos 13, 16
  tests/                             # Vitest, un archivo por área (lista exacta en §13)
  dist/                              # salida de `pnpm build` (ignorada)
```

**Reglas de frontera**
- `phaser` solo se importa en `src/main.ts`, `src/scenes/**` y `src/entities/**`. Lo verifica `tests/boundaries.test.ts`.
- `addEventListener` solo existe en `src/input/keyboardProvider.ts`; ninguna escena lo llama (también en `tests/boundaries.test.ts`).
- `src/content/**` y `scripts/**` solo importan módulos puros (y `scripts/smoke-dist.ts` importa además `vite`): Node los ejecuta sin bundler.
- El arreglo `scene: [...]` de `src/main.ts` se escribe en **una sola línea**; los gates de los pasos 5 y 12 lo comprueban con `grep -qF`.
- **Convención de resolución:** especificadores relativos con extensión `.ts` + `import type` para tipos. Reconciliada contra todos los cargadores en §19.6, *Resolution convention matrix*.

Cada archivo del árbol tiene un único origen: un paso de §9 (columna "Toca" del mapa) u "origen 2" (emitido en `workspace/` y aterrizado por la copia del Bootstrap). `scripts/check-dist.ts` y `scripts/smoke-dist.ts` son origen 2: los `Verify` los necesitan desde el paso 1 y ningún paso los escribe.

---

## 4. Data Model

No hay base de datos. El "modelo de datos" son tres cosas: **módulos de contenido** (tipados por `src/content/types.ts`, registrados en `src/content/registry.ts`), **mapas Tiled** (`public/maps/*.tmj`) y **una preferencia persistida** (bindings en `localStorage`). La capa de datos es sistema de archivos sin servicio; se ejercita en el paso 2 (`pnpm validate:content`, lee mapas con `node:fs`) y en el paso 12 contra el mapa real.

### Entidades

**StageDef** — una etapa jugable; vive mientras esté registrada.
| Campo | Tipo | Restricciones | Notas |
|---|---|---|---|
| `id` | string | único entre etapas | p. ej. `stage-01` |
| `mapKey` | string | único | clave de caché Phaser del tilemap |
| `mapPath` | string | relativo a `public/` | URL que carga Phaser **y** ruta que lee el validador |
| `tilesetName` | string | = `tilesets[].name` del `.tmj` | se liga a una textura generada |
| `tilesetTextureKey` | string | existe en `MANIFEST` | |
| `groundLayer` / `spawnLayer` | string | capas existentes | `"ground"` / `"spawns"` |
| `bossId` | string | jefe registrado | |
| `minibossIds` | string[] | jefes registrados | vacío en v1 |
| `music` | `null` | siempre `null` en v1 | punto de extensión de audio |

**EnemyDef**, **BossDef** (con `BossPhaseDef` y `BossAttackDef`), **CharacterDef**, **Hitbox** — esquema completo abajo.

**Bindings** — `Record<Action, string>`: acción → `KeyboardEvent.code`. Se persiste como JSON en `localStorage["kuuchil-btz:bindings:v1"]`.

### Relaciones
- `StageDef —(1)→ BossDef` por `bossId`; `StageDef —(0..n)→ BossDef` por `minibossIds`.
- Mapa `.tmj —(0..n)→ EnemyDef` por la propiedad `enemyId` de cada objeto `enemy`.
- `CharacterDef —(1..n)→ AbilityFactory` por ids en `abilities`.
- Todo `textureKey` —(1)→ entrada de `MANIFEST`.
- No hay borrado en cascada: quitar algo del registro hace fallar `pnpm validate:content` en lugar de dejar referencias colgantes.

### Índices
NOT APPLICABLE — sin base de datos; la búsqueda es lineal sobre arreglos de decenas de elementos (`getStage`, `getBoss`, …).

### Schema
`src/content/types.ts` (paso 2), literal:

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

**Contenido literal (un ejemplo por tipo — el builder copia, no inventa):**

`src/content/characters/kuuchil.ts` (paso 10):
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

`src/content/enemies/walker.ts` (paso 11; `hopper.ts` y `turret.ts` siguen la misma forma con los valores de la tabla y exportan `hopper` y `turret`):
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

`src/content/bosses/sentinel.ts` (paso 12):
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

`src/content/stages/stage-01/stage.ts` (paso 12):
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

`src/content/registry.ts` — forma **final** (tras el paso 12). En el paso 2 los cuatro arreglos están vacíos y no hay imports de contenido (solo `import type` de `./types.ts`); los pasos 10, 11 y 12 añaden cada uno sus imports y entradas:
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

### El mapa Tiled
`public/maps/stage-01.tmj` se emite literal en `workspace/` (§19.6). Contrato que comparten el validador y `StageScene`: mapa 60×10 tiles de 16 px (960×160 px), finito, tileset embebido `placeholder-tiles` (2 tiles: gid 1 = relleno, gid 2 = borde superior; imagen 32×16). Capa `ground` (tilelayer, datos CSV como arreglo JSON): suelo en filas 7–9, foso en columnas 20–22, plataformas en fila 5 (cols 12–15) y fila 4 (cols 30–33), muro derecho en columna 59. Capa `spawns` (objectgroup), objetos por `type`: `player_start` (24,112), cinco `enemy` con propiedad string `enemyId` (`walker`, `hopper`, `walker`, `turret`, `hopper`), `boss_trigger` rectángulo (720,0,16,112) y `boss_spawn` (880,112). Las coordenadas de punto son los **pies** del sprite (origen 0.5,1).

Tiled 1.12.2 abre el archivo y avisa de que falta `tiles-placeholder.png`: es esperado (la textura se genera en código). Que abra en Tiled es **UNVERIFIED** desde esta sesión; el validador estructural del paso 2 sí lo verifica en cada ejecución.

### Migraciones
NOT APPLICABLE — sin base de datos. El único dato persistido (bindings) se versiona en la clave (`:v1`): un formato nuevo usa `:v2`, y lo que `parseBindings` rechace cae a defaults.

### Seed data
NOT APPLICABLE — el "seed" es el contenido registrado; `pnpm validate:content` lo valida.

---

## 5. API Design

NOT APPLICABLE — el juego no expone ni consume ninguna API HTTP; no hay servidor. Los contratos internos (tipos, funciones puras) están en §4 y en cada paso de §9.

---

## 6. Frontend Architecture

### Routes
No hay rutas URL; la "navegación" son escenas Phaser.
| Escena (clave) | Qué es | Fuente de datos | Acceso |
|---|---|---|---|
| `BootScene` | Genera texturas, carga archivos del manifiesto, carga bindings | `MANIFEST`, `localStorage` | inicial |
| `MenuScene` | "Jugar" / "Controles" | `CONTENT.stages` | desde Boot, desde Controles, tras victoria o pausa |
| `ControlsScene` | Lista acciones, rebind, restaurar, volver | `controlsMenu.ts` + registry de Phaser | desde Menu |
| `StageScene` | Etapa jugable + HUD + jefe | `getStage(stageId)`, `.tmj` | desde Menu (`{ stageId }`) |

### Rendering strategy
Solo cliente: un `index.html` estático carga `src/main.ts` como módulo. Phaser con `type: Phaser.AUTO`, 240×160, `pixelArt: true`, `roundPixels: true`, `antialias: false`, escala `FIT`, `CENTER_BOTH`, `parent: "game"`. CSS `image-rendering: pixelated` en el canvas como refuerzo. Sin SSR ni caché de rutas.

### Component hierarchy
```
Phaser.Game (src/main.ts)
├─ BootScene → MenuScene ↔ ControlsScene
└─ StageScene
   ├─ Tilemap (ground, colisión) + cámara con bounds
   ├─ Player (Arcade sprite) ← Abilities ← InputManager ← keyboardProvider
   ├─ Group<Enemy> (Arcade) ← enemyAi
   ├─ Boss (Arcade sprite) ← fsm + patterns
   ├─ Group de balas del jugador / Group de balas enemigas (Projectile)
   └─ HUD (scrollFactor 0): barra HP jugador, barra HP jefe, mensajes de pausa/K.O./victoria
```

### State management
- Estado de juego en las instancias de escena/entidad; la lógica de decisión en funciones puras (`src/core`, `src/bosses`, `src/characters`).
- Bindings: `BootScene` los carga con `loadBindings(getBrowserStorage())` y los guarda en el registry de Phaser bajo `BINDINGS_REGISTRY_KEY` (`"bindings"`); `sceneInput.ts` los lee de ahí en cada `poll()`.
- Nada global mutable fuera del registry de Phaser.

### Loading, empty, and error states
| Superficie | Cargando | Vacío | Error |
|---|---|---|---|
| Boot | texto "Cargando..." mientras carga entradas `kind: "file"` | — | un archivo que falla se ve en la consola del navegador; el resto del juego sigue |
| Menu "Jugar" | — | si `CONTENT.stages` está vacío, muestra "Sin etapas registradas" y no navega | — |
| StageScene | carga del `.tmj` en `preload` | — | si `getStage(stageId)` es `undefined`, muestra "Etapa no registrada: <id>" y la acción `pause` vuelve al menú |
| Controles | — | — | si `saveBindings` devuelve `false`, muestra "No se pudo guardar (se usarán en esta sesión)" |

---

## 7. Design System

Placeholders estilo GBA: paleta limitada, formas planas, sin degradados. Valores literales; fuente única en `src/assets/palette.ts` (paso 6).

### Colors
| Token (`PALETTE.*`) | Hex | Uso |
|---|---|---|
| `background` | `#0f1226` | fondo del juego y de la página |
| `ground` | `#3b4a6b` | tile de relleno |
| `groundEdge` | `#5b6f9a` | borde superior de suelo / plataformas |
| `player` | `#3da5ff` | cuerpo del jugador |
| `playerAccent` | `#ffd23f` | visor del jugador, ojo del saltarín |
| `enemy` | `#e5484d` | enemigos y balas enemigas |
| `boss` | `#8e4ec6` | cuerpo del jefe |
| `telegraph` | `#ffffff` | destello de telegraph |
| `projectile` | `#fff176` | balas del jugador, ojo de la torreta |
| `hpPlayer` | `#4ade80` | barra de vida del jugador |
| `hpBoss` | `#f43f5e` | barra de vida del jefe |
| `hudFrame` | `#e5e7eb` | marcos del HUD, texto, ojos del caminante y del jefe |

**Contraste** (fórmula de luminancia relativa WCAG): texto `#e5e7eb` sobre `#0f1226` ≈ 15:1; barra `#4ade80` sobre fondo ≈ 10:1; barra `#f43f5e` sobre fondo ≈ 5.3:1; jugador `#3da5ff` sobre suelo `#3b4a6b` ≈ 3.3:1 (≥ 3:1 para objetos gráficos).

### Typography
| Rol | Familia | Tamaño | Peso | Tracking |
|---|---|---|---|---|
| Título | `monospace` (texto Phaser, sin bitmap font) | 16px | normal | 0 |
| Menú / HUD / mensajes | `monospace` | 8px | normal | 0 |

**Carga de fuentes:** ninguna; monospace del sistema. Posiciones de texto siempre en enteros. `TEXT_STYLE = { fontFamily: "monospace", fontSize: "8px", color: "#e5e7eb" }`.

### Spacing, radius, elevation
- Rejilla de 16 px (tile); márgenes de UI de 4 y 8 px.
- Radio: 0 (pixel art). Sombras: ninguna.
- HUD: barra del jugador, marco 50×6 en (4,4); barra del jefe, marco 50×6 en (186,4); relleno con 1 px de margen interior.
- Resolución nativa 240×160; escalado `FIT` (preferir múltiplos enteros — ver riesgo 4).

### Motion
- Telegraph: el jefe alterna `setTintFill(PALETTE.telegraph)` / `clearTint()` cada `TUNING.telegraphBlinkMs` (170 ms → menos de 3 destellos por segundo, WCAG 2.3.1).
- Invulnerabilidad del jugador: alpha 0.4/1 cada 100 ms durante `TUNING.invulnerabilityMs` (cambio de opacidad, no destello de color pleno).
- Sin tweens decorativos en v1.

### Component style
Formas planas de un color con una banda de acento (visor/ojo) de 1–4 px; los tiles muestran relleno y borde superior. Si un elemento nuevo necesita un color fuera de `PALETTE`, se añade primero a la paleta.

---

## 8. Authentication & Authorization

NOT APPLICABLE — el juego no tiene cuentas, sesiones ni servidor.

---

## 9. BUILD ORDER

### Reglas de un paso
1. Un paso por sesión: ≤ 5 archivos y ≤ 6 criterios.
2. Cada paso tiene `Do`, `Done when`, `Verify` y `Checkpoint`, y se ejecutan en ese orden.
3. Criterios en EARS, decidibles por un comando en esta máquina.
4. Prohibido "se ve bien". Lo visual y la sensación son un **checkpoint manual del autor** explícito, nunca un gate.
5. `Verify` es shell literal desde la raíz del proyecto; cada línea sale 0 cuando el paso es correcto.
6. **Antes de correr `Verify`, ejecuta `pnpm format`** (Biome reescribe el formato de lo que acabas de escribir; `pnpm lint` es el gate que lo comprueba).
7. Un paso no está hecho hasta que su `Verify` pasa **y** los de los pasos anteriores siguen pasando.
8. Checkpoint: `git add -A && git commit` + `git tag step-NN-slug`. Rollback: `git reset --hard <tag anterior>`.
9. Nunca adelantar pasos; si uno se bloquea, detente y reporta.
10. Ningún paso introduce un requisito que rompa un gate anterior. No hay variables de entorno en el código; `tsconfig.json` y `biome.json` están completos desde el Bootstrap, así que ninguna regla nueva aparece a mitad de camino.
11. Sin números derivados frágiles: los gates afirman propiedades (`exit 0`, "toda clave existe"). El único conteo es el de 17 tags en §20.1, que es el número de pasos de este mapa.
12. Ningún `Verify` depende de su propio Checkpoint (no hay comprobaciones de estado git en los `Verify`).
13. **Medio:** Phaser necesita `window`, así que nada que importe `phaser` se ejecuta en Vitest. Cada paso con escenas/entidades verifica su lógica pura con tests y su código Phaser con `typecheck` + `build` + `check:dist` + `smoke:dist`; lo que solo se ve en un navegador está en "Checkpoint manual del autor".
14. **Fail fast:** el paso 1 produce `dist/` y lo **sirve**: `pnpm check:dist` lee el contrato `index.html` → entry JS en disco, y `pnpm smoke:dist` levanta `vite preview` en `127.0.0.1:4173`, pide `/` y el entry JS por HTTP, exige 200 y el marcador `kuuchil-btz` en ambos, y cierra el servidor. Ejecutar el canvas de Phaser exige un navegador real; esa es la verificación manual del paso 1. Todo paso posterior que reconstruye (`pnpm build`) vuelve a ejecutar ambos.

**Gotchas del track arrastrados al paso 1:** TypeScript queda en 6.x (`~6.0.3`, nunca 7); si `pnpm install` falla por scripts de build ignorados, el Bootstrap ya ejecuta `pnpm approve-builds --all` y reinstala; `corepack enable` usa `--install-directory`.

### Una regla de conteo
**17 pasos = 17 tareas en `tasks.json` = 17 bloques de tarea en 3 epics** (`01-fundacion-entrada`: pasos 1–6, `02-movimiento-escenario`: pasos 7–12, `03-combate-jefe-entrega`: pasos 13–17).

### Step map

| # | Paso | Depende de | Toca | Gate |
|---|---|---|---|---|
| 1 | Phaser 240×160 arranca | — | `src/core/tuning.ts`, `src/core/gameConfig.ts`, `src/main.ts`, `src/scenes/BootScene.ts`, `tests/game-config.test.ts` | `pnpm smoke:dist` |
| 2 | Tipos, registro y validador de contenido | 1 | `src/content/types.ts`, `src/content/registry.ts`, `src/content/validate.ts`, `scripts/validate-content.ts`, `tests/content-validate.test.ts` | `pnpm validate:content` |
| 3 | Acciones, InputManager, teclado | 1 | `src/input/actions.ts`, `src/input/inputManager.ts`, `src/input/keyboardProvider.ts`, `tests/input.test.ts`, `tests/boundaries.test.ts` | `pnpm test tests/input.test.ts` |
| 4 | Rebind, persistencia, modelo de controles | 3 | `src/input/bindings.ts`, `src/input/bindingsStore.ts`, `src/input/controlsMenu.ts`, `tests/bindings.test.ts`, `tests/controls-menu.test.ts` | `pnpm test tests/bindings.test.ts` |
| 5 | MenuScene y ControlsScene | 2, 4 | `src/scenes/sceneInput.ts`, `src/scenes/MenuScene.ts`, `src/scenes/ControlsScene.ts`, `src/scenes/BootScene.ts`, `src/main.ts` | `pnpm smoke:dist` |
| 6 | Manifiesto y placeholders | 2, 5 | `src/assets/palette.ts`, `src/assets/manifest.ts`, `src/assets/placeholders.ts`, `src/scenes/BootScene.ts`, `tests/assets.test.ts` | `pnpm test tests/assets.test.ts` |
| 7 | Movimiento puro + sanidad de tuning | 1 | `src/core/movement.ts`, `tests/movement.test.ts`, `tests/tuning.test.ts` | `pnpm test tests/tuning.test.ts` |
| 8 | Habilidades run/jump + registro | 3, 7 | `src/characters/ability.ts`, `src/characters/abilities/run.ts`, `src/characters/abilities/jump.ts`, `src/characters/abilityRegistry.ts`, `tests/abilities-move.test.ts` | `pnpm test tests/abilities-move.test.ts` |
| 9 | Habilidades shoot/dash | 8 | `src/characters/abilities/shoot.ts`, `src/characters/abilities/dash.ts`, `src/characters/abilityRegistry.ts`, `tests/abilities-combat.test.ts` | `pnpm test tests/abilities-combat.test.ts` |
| 10 | Personaje + Player + Projectile | 6, 9 | `src/content/characters/kuuchil.ts`, `src/content/registry.ts`, `src/entities/Player.ts`, `src/entities/Projectile.ts`, `tests/character.test.ts` | `pnpm test tests/character.test.ts` |
| 11 | Datos de enemigos | 6 | `src/content/enemies/walker.ts`, `src/content/enemies/hopper.ts`, `src/content/enemies/turret.ts`, `src/content/registry.ts`, `tests/content-registry.test.ts` | `pnpm validate:content` |
| 12 | Jefe (datos), etapa 1, StageScene con mapa | 10, 11 | `src/content/bosses/sentinel.ts`, `src/content/stages/stage-01/stage.ts`, `src/content/registry.ts`, `src/scenes/StageScene.ts`, `src/main.ts` | `pnpm validate:content` |
| 13 | Vida, daño, HUD, muerte/reinicio | 12 | `src/core/health.ts`, `tests/health.test.ts`, `src/scenes/hud.ts`, `src/entities/Player.ts`, `src/scenes/StageScene.ts` | `pnpm test tests/health.test.ts` |
| 14 | Enemigos en la etapa | 13 | `src/core/enemyAi.ts`, `tests/enemy-ai.test.ts`, `src/entities/Enemy.ts`, `src/scenes/StageScene.ts` | `pnpm test tests/enemy-ai.test.ts` |
| 15 | Motor FSM de jefes + invariante de telegraph | 12 | `src/bosses/fsm.ts`, `src/bosses/patterns.ts`, `tests/boss-fsm.test.ts`, `tests/boss-patterns.test.ts`, `tests/telegraph.test.ts` | `pnpm test tests/telegraph.test.ts` |
| 16 | Pelea de jefe y flujo victoria/derrota | 14, 15 | `src/core/stageFlow.ts`, `tests/stage-flow.test.ts`, `src/entities/Boss.ts`, `src/scenes/StageScene.ts`, `src/scenes/hud.ts` | `pnpm test` |
| 17 | Docs, build de producción, gate final | 16 | `README.md`, `docs/PLAYTEST.md`, `docs/DEPLOY.md`, `tests/docs.test.ts` | `pnpm gate` |

---

#### Step 1 — Configurar Phaser a 240×160 y arrancar BootScene

**Do**
1. `src/core/tuning.ts` — literal:
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
2. `src/core/gameConfig.ts` — literal:
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
3. `src/main.ts` — literal (los pasos 5 y 12 solo cambian la línea `scene`, que siempre queda en una sola línea):
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
   Desviaciones permitidas, solo si `pnpm typecheck` las exige con los tipos de Phaser 4 (anótalas en el mensaje del commit): `import * as Phaser from "phaser"` en lugar del import por defecto; `Phaser.Scale.FIT` / `Phaser.Scale.CENTER_BOTH` literales en lugar del acceso indexado.
4. `src/scenes/BootScene.ts` — `export class BootScene extends Phaser.Scene` con `super(SCENES.boot)`; en `create()` dibuja `GAME_TITLE` en (8,8) con `{ fontFamily: "monospace", fontSize: "16px", color: "#e5e7eb" }`.
5. `tests/game-config.test.ts` — importa solo `../src/core/gameConfig.ts` y `../src/core/tuning.ts` (nunca `phaser`); afirma los dos primeros criterios.

`scripts/check-dist.ts` y `scripts/smoke-dist.ts` ya existen (origen 2, Bootstrap); este paso no los escribe.

**Done when**
- [ ] WHEN `pnpm test tests/game-config.test.ts` runs THE SYSTEM SHALL assert `GAME_WIDTH` is 240, `GAME_HEIGHT` is 160, `RENDER_OPTIONS` is `{ pixelArt: true, roundPixels: true, antialias: false }` and `SCALE_OPTIONS` is `{ mode: "FIT", autoCenter: "CENTER_BOTH" }`, and exit 0.
- [ ] WHEN `pnpm test tests/game-config.test.ts` runs THE SYSTEM SHALL assert `GAME_WIDTH / TILE_SIZE` is 15, `GAME_HEIGHT / TILE_SIZE` is 10 and `GRAVITY_Y` equals `TUNING.gravityY`.
- [ ] WHEN `pnpm typecheck` and `pnpm lint` run THE SYSTEM SHALL exit 0.
- [ ] WHEN `pnpm build` runs THE SYSTEM SHALL exit 0 and write `dist/index.html`.
- [ ] WHEN `pnpm check:dist` runs after the build THE SYSTEM SHALL find the module script that `dist/index.html` references, non-empty and containing the marker `kuuchil-btz`, and exit 0.
- [ ] WHEN `pnpm smoke:dist` runs after the build THE SYSTEM SHALL serve `dist/` with `vite preview` on `127.0.0.1:4173`, receive HTTP 200 for `/` and for the entry script, both containing `kuuchil-btz`, close the server and exit 0.

**Checkpoint manual del autor (no es gate):** `pnpm dev`, abrir http://localhost:5173: canvas centrado con letterbox, fondo `#0f1226`, título nítido sin blur al redimensionar. El comportamiento de Phaser 4 en navegador es **UNVERIFIED**; si `FIT` produce blur, el autor aplica el fallback del riesgo 4 (§20.2).

**Verify**
```bash
pnpm test tests/game-config.test.ts   # expect: exit 0, 0 failed
pnpm typecheck                        # expect: exit 0
pnpm lint                             # expect: exit 0
pnpm build                            # expect: exit 0 (el aviso de chunk grande está permitido)
pnpm check:dist                       # expect: exit 0, "check-dist OK: dist/assets/…"
pnpm smoke:dist                       # expect: exit 0, "smoke-dist OK: http://127.0.0.1:4173/assets/…"
```

**Checkpoint**
```bash
git add -A && git commit -m "step 1: phaser boots at 240x160"
git tag step-01-boot
```

---

#### Step 2 — Tipos, registro y validador de contenido

**Do**
1. `src/content/types.ts` — literal de §4.
2. `src/content/registry.ts` — forma de §4 **sin** imports de contenido y con `stages: []`, `bosses: []`, `enemies: []`, `characters: []`; incluye `FIRST_STAGE_ID`, `DEFAULT_CHARACTER_ID` y los cuatro `get*`.
3. `src/content/validate.ts` (puro; importa `./types.ts` y `../core/tuning.ts`):
   - Tipos `SpawnPoint = { x: number; y: number }`, `EnemySpawn = SpawnPoint & { enemyId: string }`, `TriggerRect = { x: number; y: number; width: number; height: number }`, `StageSpawns = { playerStarts: SpawnPoint[]; bossSpawns: SpawnPoint[]; bossTriggers: TriggerRect[]; enemies: EnemySpawn[] }`.
   - `extractSpawns(map: unknown, spawnLayer: string): StageSpawns | null` — `null` si no existe un objectgroup con ese nombre. Tipo de objeto = `obj.type` si es string, si no `obj.class` si es string, si no `""`. `enemyId` = `value` de la propiedad `{ name: "enemyId" }` si es string; si falta, `""`.
   - `validateContent(content: ContentRegistry, readMap: (mapPath: string) => unknown): string[]` — devuelve errores (vacío = válido). Reglas y la palabra que cada mensaje DEBE contener (el resto del texto es libre, en español):
     | Regla | Token obligatorio en el mensaje |
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
4. `scripts/validate-content.ts` — literal:
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
5. `tests/content-validate.test.ts` — construye en el propio test un registro *fixture* (1 etapa, 1 jefe con un ataque `telegraphMs: 300`, 1 enemigo `e1`) y un mapa *fixture* mínimo (3×2 tiles de 16 px, capa `ground` con `data` de 6 enteros, capa `spawns` con `player_start`, `boss_spawn`, `boss_trigger` 16×16 y un `enemy` con `enemyId: "e1"`, tileset con el `tilesetName` del fixture). Casos: fixture válido → `[]`; sin `ground`; sin `spawns`; `readMap` que lanza; `enemyId` desconocido; `bossId` desconocido; `telegraphMs: 100`; y **el registro real** `CONTENT` con `readMap` leyendo `join("public", mapPath)` vía `node:fs` → `[]`.

**Done when**
- [ ] WHEN `pnpm test tests/content-validate.test.ts` runs THE SYSTEM SHALL report 0 errors for a valid in-test fixture (one stage, one boss, one enemy, one map) and exit 0.
- [ ] WHEN a fixture map lacks the `ground` tile layer or the `spawns` object layer, or `readMap` throws, THE SYSTEM SHALL return an error whose text contains `ground`, `spawns` or `map` respectively.
- [ ] WHEN a fixture spawn references an unregistered `enemyId` or the stage references an unregistered `bossId` THE SYSTEM SHALL return an error whose text contains that id.
- [ ] WHEN a fixture boss attack has `telegraphMs` below `TUNING.minTelegraphMs` THE SYSTEM SHALL return an error whose text contains `telegraph`.
- [ ] WHEN `pnpm validate:content` runs against the real registry THE SYSTEM SHALL print `content OK` and exit 0.

**Verify**
```bash
pnpm test tests/content-validate.test.ts   # expect: exit 0, 0 failed
pnpm validate:content                      # expect: exit 0, "content OK: 0 etapas, …"
pnpm typecheck                             # expect: exit 0
pnpm lint                                  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 2: content types, registry and validator"
git tag step-02-content-core
```

---

#### Step 3 — Acciones, InputManager y proveedor de teclado

**Do**
1. `src/input/actions.ts` — literal:
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
2. `src/input/inputManager.ts` — `export type InputProvider = { readonly id: string; poll(): ActionState; destroy(): void }`; `export class InputManager` con `constructor(providers: InputProvider[] = [])` (asigna a un campo privado, sin propiedades de parámetro), `addProvider(provider)`, `update(): ActionSnapshot` (held = OR de todos los proveedores; pressed = held ahora y no held en el `update()` anterior) y `destroy()`.
3. `src/input/keyboardProvider.ts` — `export type KeyTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">` (`window` cumple este tipo; en Node también `new EventTarget()`). `createKeyboardProvider(target: KeyTarget, getBindings: () => Bindings): InputProvider`: listeners `(event: Event) => void` para `keydown`/`keyup` que leen `const code = (event as KeyboardEvent).code`, agregan/quitan el código de un `Set` y llaman `event.preventDefault()` si el código está ligado a alguna acción; listener `blur` que vacía el `Set`. `poll()` = para cada acción, `codes.has(bindings[action])`. `destroy()` quita los tres listeners. `captureNextKey(target: KeyTarget, onKey: (code: string) => void): () => void` registra un `keydown` de un solo uso (también con `preventDefault()`) y devuelve la función que lo cancela.
4. `tests/input.test.ts` — usa el `EventTarget` y `Event` globales de Node 24: `const target = new EventTarget()`, `target.dispatchEvent(Object.assign(new Event("keydown"), { code: "KeyZ" }))`, `target.dispatchEvent(new Event("blur"))`; casos de los criterios 1–4.
5. `tests/boundaries.test.ts` — recorre con `node:fs` los `.ts` bajo `src/core`, `src/input`, `src/content`, `src/characters`, `src/bosses` (ignora directorios que aún no existen) y falla si alguno contiene `from "phaser"`; recorre `src/scenes` y falla si alguno contiene `addEventListener`.

**Done when**
- [ ] WHEN `pnpm test tests/input.test.ts` runs THE SYSTEM SHALL assert `DEFAULT_BINDINGS` maps `left`/`right`/`up`/`down` to `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`, `jump` to `KeyZ`, `shoot` to `KeyX`, `dash` to `KeyC` and `pause` to `Escape`, with none of `KeyW`, `KeyA`, `KeyS`, `KeyD` among its values.
- [ ] WHEN a fake event target dispatches `keydown` with code `KeyZ` THE SYSTEM SHALL report `jump` held and pressed on the first `update()` and held but not pressed on the second.
- [ ] WHEN two providers are registered and either one reports an action held THE SYSTEM SHALL report that action held in the snapshot.
- [ ] WHEN the fake target dispatches `blur` THE SYSTEM SHALL report every action released on the next `update()`.
- [ ] WHEN `pnpm test tests/boundaries.test.ts` runs THE SYSTEM SHALL find no `from "phaser"` import under `src/core`, `src/input`, `src/content`, `src/characters` or `src/bosses` and no `addEventListener` call under `src/scenes`, and exit 0.

**Verify**
```bash
pnpm test tests/input.test.ts        # expect: exit 0, 0 failed
pnpm test tests/boundaries.test.ts   # expect: exit 0, 0 failed
pnpm typecheck                       # expect: exit 0
pnpm lint                            # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 3: input actions, manager and keyboard provider"
git tag step-03-input
```

---

#### Step 4 — Rebind con conflictos, persistencia y modelo de controles

**Do**
1. `src/input/bindings.ts`: `RESERVED_CODES = ["Tab", "F5", "F11", "F12", "MetaLeft", "MetaRight"] as const`; `type RebindResult = { ok: true; bindings: Bindings; swappedWith: Action | null } | { ok: false; reason: "reserved" }`; `rebind(bindings, action, code): RebindResult` (si otra acción usa `code`, intercambia los dos códigos; código reservado → rechazo); `parseBindings(raw: unknown): Bindings | null` (objeto con las 8 acciones, strings no vacíos, sin duplicados, sin reservados); `keyLabel(code)` (`ArrowLeft`→`←`, `ArrowRight`→`→`, `ArrowUp`→`↑`, `ArrowDown`→`↓`, `Key*`→ la letra, `Digit*` → el dígito, `Escape`→`Esc`, otros → el código).
2. `src/input/bindingsStore.ts`: `BINDINGS_STORAGE_KEY = "kuuchil-btz:bindings:v1"`; `type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">`; `getBrowserStorage(): StorageLike | null` (try/catch alrededor de `globalThis.localStorage`); `loadBindings(storage: StorageLike | null): Bindings` (try/catch + `JSON.parse` + `parseBindings`; cualquier fallo → `DEFAULT_BINDINGS`); `saveBindings(storage, bindings): boolean`; `clearBindings(storage): boolean`.
3. `src/input/controlsMenu.ts` (puro): filas = las 8 acciones + `"restore"` + `"back"`. `type ControlsMenuState = { bindings: Bindings; selected: number; mode: "browse" | "await-key"; message: string | null }`; `type ControlsMenuEvent = { type: "up" } | { type: "down" } | { type: "confirm" } | { type: "cancel" } | { type: "key"; code: string }`; `type ControlsMenuEffect = "none" | "save" | "reset" | "exit"`; `createControlsMenu(bindings)`; `reduceControlsMenu(state, event): { state: ControlsMenuState; effect: ControlsMenuEffect }`. En `browse`: up/down con vuelta; confirm en una acción → `await-key`, mensaje "Pulsa una tecla para <acción>"; confirm en `restore` → `DEFAULT_BINDINGS`, efecto `reset`, mensaje "Controles restaurados"; confirm en `back` o `cancel` → `exit`. En `await-key`: `key` con `Escape` → `browse` sin cambios; otro código → `rebind`; ok → efecto `save` (mensaje "Intercambiado con <acción>" si hubo intercambio); reservado → mensaje "Tecla reservada" y vuelve a `browse`.
4. `tests/bindings.test.ts` y `tests/controls-menu.test.ts` — un storage en memoria y uno que lanza en `getItem`/`setItem`.

**Done when**
- [ ] WHEN `rebind` assigns a code already bound to another action THE SYSTEM SHALL swap the two codes and return `swappedWith` naming the other action.
- [ ] WHEN `rebind` receives a reserved code (`Tab`, `F5`, `F11`, `F12`, `MetaLeft`, `MetaRight`) THE SYSTEM SHALL return `{ ok: false, reason: "reserved" }` and leave the bindings unchanged.
- [ ] WHEN stored bindings are malformed JSON, miss an action, or contain a duplicate or reserved code THE SYSTEM SHALL return `DEFAULT_BINDINGS` from `loadBindings`.
- [ ] WHEN storage is `null` or throws on `getItem`/`setItem` THE SYSTEM SHALL return defaults from `loadBindings` and `false` from `saveBindings` without throwing.
- [ ] WHEN the controls menu confirms the `restore` row THE SYSTEM SHALL return `DEFAULT_BINDINGS` with effect `reset`, and WHEN it awaits a key and receives `Escape` THE SYSTEM SHALL return to `browse` with the bindings unchanged.

**Verify**
```bash
pnpm test tests/bindings.test.ts        # expect: exit 0, 0 failed
pnpm test tests/controls-menu.test.ts   # expect: exit 0, 0 failed
pnpm typecheck                          # expect: exit 0
pnpm lint                               # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 4: rebind, persistence and controls menu model"
git tag step-04-bindings
```

---

#### Step 5 — MenuScene y ControlsScene

**Do**
1. `src/scenes/sceneInput.ts`: `BINDINGS_REGISTRY_KEY = "bindings"`; `createSceneInput(scene: Phaser.Scene): InputManager` crea `createKeyboardProvider(window, () => scene.registry.get(BINDINGS_REGISTRY_KEY) as Bindings)` y destruye el manager en `scene.events.once("shutdown", …)`.
2. `src/scenes/BootScene.ts` (edición): en `create()` hace `this.registry.set(BINDINGS_REGISTRY_KEY, loadBindings(getBrowserStorage()))` y `this.scene.start(SCENES.menu)`.
3. `src/scenes/MenuScene.ts`: título (16px) y dos filas "Jugar" / "Controles"; `up`/`down` mueven, `jump` confirma. "Jugar": si `CONTENT.stages.length === 0` muestra "Sin etapas registradas"; si no, `this.scene.start(SCENES.stage, { stageId: FIRST_STAGE_ID })`. Pie: "<tecla de jump>: aceptar" con `keyLabel`.
4. `src/scenes/ControlsScene.ts`: dibuja las 10 filas del modelo (acción + `keyLabel` de su código), traduce `pressed.up`/`down`/`jump`/`pause` a eventos `up`/`down`/`confirm`/`cancel`; al entrar en `await-key` llama `captureNextKey(window, (code) => …)` y envía `{ type: "key", code }` (mientras espera, no procesa el `ActionSnapshot`). Efecto `save`/`reset` → `registry.set` + `saveBindings`/`clearBindings`; si devuelven `false`, mensaje "No se pudo guardar (se usarán en esta sesión)". `exit` → `MenuScene`.
5. `src/main.ts` (edición): la línea `scene` pasa a ser exactamente `  scene: [BootScene, MenuScene, ControlsScene],` (una sola línea), más los dos imports.

**Done when**
- [ ] WHEN `grep -qF "scene: [BootScene, MenuScene, ControlsScene" src/main.ts` runs THE SYSTEM SHALL exit 0, proving both scenes are in the `scene` array.
- [ ] WHEN `pnpm test tests/boundaries.test.ts` runs THE SYSTEM SHALL still find no `addEventListener` call under `src/scenes` and no `phaser` import in the pure directories.
- [ ] WHEN `pnpm typecheck` and `pnpm lint` run THE SYSTEM SHALL exit 0.
- [ ] WHEN `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run THE SYSTEM SHALL exit 0.

**Checkpoint manual del autor:** en `pnpm dev`, el menú navega con flechas y Z; en Controles, reasignar "Saltar" a `X` intercambia con "Disparar"; recargar la página conserva el cambio; "Restaurar" vuelve a Z/X/C; en una ventana privada sin `localStorage` el juego funciona con defaults.

**Verify**
```bash
grep -qF "scene: [BootScene, MenuScene, ControlsScene" src/main.ts   # expect: exit 0
pnpm test tests/boundaries.test.ts                                    # expect: exit 0
pnpm typecheck                                                        # expect: exit 0
pnpm lint                                                             # expect: exit 0
pnpm build                                                            # expect: exit 0
pnpm check:dist                                                       # expect: exit 0
pnpm smoke:dist                                                       # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 5: menu and controls scenes"
git tag step-05-menu-controls
```

---

#### Step 6 — Manifiesto de assets y texturas placeholder

**Do**
1. `src/assets/palette.ts` — `PALETTE` con los 12 tokens de §7 como números (`background: 0x0f1226`, …) `as const`, y `TEXT_STYLE = { fontFamily: "monospace", fontSize: "8px", color: "#e5e7eb" } as const`.
2. `src/assets/manifest.ts`: tipos `PlaceholderSpec = { readonly kind: "placeholder"; readonly shape: "rect" | "tiles"; readonly width: number; readonly height: number; readonly color: number; readonly accent: number | null }`, `FileSpec = { readonly kind: "file"; readonly path: string; readonly frameWidth?: number; readonly frameHeight?: number }`, `AssetSpec = PlaceholderSpec | FileSpec`; `MANIFEST: Readonly<Record<string, AssetSpec>>` con exactamente estas claves:
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
3. `src/assets/placeholders.ts` (sin import de `phaser`): `type FillContext = { fillStyle: string | CanvasGradient | CanvasPattern; fillRect(x: number, y: number, w: number, h: number): void }`; `toCss(color: number): string` (`#` + 6 dígitos hex); `drawPlaceholder(ctx: FillContext, spec: PlaceholderSpec): void`: `rect` → rectángulo completo en `color` y, si `accent`, banda de ancho completo en `y = Math.floor(height / 4)` con alto `Math.max(1, Math.floor(height / 8))`; `tiles` → tile 1 (0,0,16,16) en `color`, tile 2 (16,0,16,16) en `color` + borde superior (16,0,16,4) en `accent`. `generatePlaceholders(manifest, createCanvas: (w: number, h: number) => HTMLCanvasElement, addCanvas: (key: string, canvas: HTMLCanvasElement) => void): void`: por cada placeholder crea canvas, `getContext("2d")` (si es `null`, lanza `Error`), dibuja y registra.
4. `src/scenes/BootScene.ts` (edición): `preload()` carga cada entrada `kind: "file"` (`this.load.spritesheet` si tiene `frameWidth` y `frameHeight`, si no `this.load.image`) y muestra "Cargando..."; `create()` llama `generatePlaceholders(MANIFEST, (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h }), (key, canvas) => { this.textures.addCanvas(key, canvas); })` antes de cargar bindings y pasar al menú; el título usa `TEXT_STYLE` con `fontSize: "16px"`. Si los tipos de Phaser 4 no exponen `textures.addCanvas` (error de `pnpm typecheck`), usa `this.textures.createCanvas(key, w, h)`, dibuja en su `getContext()` y llama `refresh()`; anótalo en el commit.
5. `tests/assets.test.ts` — criterios 1–4 (contexto falso que registra cada `fillRect`).

**Done when**
- [ ] WHEN `pnpm test tests/assets.test.ts` runs THE SYSTEM SHALL assert every placeholder `color` and non-null `accent` in `MANIFEST` is a value of `PALETTE`.
- [ ] WHEN `pnpm test tests/assets.test.ts` runs THE SYSTEM SHALL assert `MANIFEST["tiles-placeholder"]` is a placeholder with shape `tiles`, width 32 and height 16.
- [ ] WHEN `pnpm test tests/assets.test.ts` runs THE SYSTEM SHALL assert every `textureKey`, `projectileTextureKey` and `tilesetTextureKey` referenced by `CONTENT` exists in `MANIFEST`.
- [ ] WHEN `drawPlaceholder` draws any placeholder entry onto a recording fake context THE SYSTEM SHALL issue at least one `fillRect` and every `fillRect` SHALL stay inside `0..width` by `0..height`.
- [ ] WHEN `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm test tests/assets.test.ts   # expect: exit 0, 0 failed
pnpm typecheck                   # expect: exit 0
pnpm lint                        # expect: exit 0
pnpm build                       # expect: exit 0
pnpm check:dist                  # expect: exit 0
pnpm smoke:dist                  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 6: asset manifest and placeholder textures"
git tag step-06-assets
```

---

#### Step 7 — Movimiento puro y sanidad de tuning

**Do**
1. `src/core/movement.ts` (puro; `import type { Tuning } from "./tuning.ts"`): `horizontalVelocity(left: boolean, right: boolean, runSpeed: number): number`; `applyJumpCut(vy: number, jumpHeld: boolean, multiplier: number): number`; `canJump(msSinceGrounded: number, msSinceJumpPressed: number, t: Tuning): boolean`; `clampFall(vy: number, maxFallSpeed: number): number`; `apexHeight(t)` = `jumpVelocity² / (2·gravityY)`; `jumpAirTimeMs(t)` = `2·jumpVelocity / gravityY · 1000`; `runningJumpDistance(t)` = `runSpeed · jumpAirTimeMs / 1000`; `dashDistance(t)` = `dashSpeed · dashDurationMs / 1000`. Convención: `vy` negativo = hacia arriba.
2. `tests/movement.test.ts` — criterios 1–3.
3. `tests/tuning.test.ts` — criterio 4. Son propiedades, no valores fijos: si el autor cambia `TUNING`, el test solo falla si rompe la jugabilidad del mapa (alcanzar plataformas de 3 tiles, cruzar el foso de 3 tiles, limitar destellos).

**Done when**
- [ ] WHEN `applyJumpCut` receives an upward velocity (negative) with jump released THE SYSTEM SHALL return it multiplied by `TUNING.jumpCutMultiplier`, and SHALL return it unchanged while jump is held or while falling.
- [ ] WHEN `canJump` receives `msSinceGrounded` at most `coyoteTimeMs` and `msSinceJumpPressed` at most `jumpBufferMs` THE SYSTEM SHALL return true, and false when either exceeds its window.
- [ ] WHEN `horizontalVelocity` receives left and right both held THE SYSTEM SHALL return 0, and `TUNING.runSpeed` times the direction otherwise.
- [ ] WHEN `pnpm test tests/tuning.test.ts` runs THE SYSTEM SHALL assert `apexHeight(TUNING)` is above 48 px, `runningJumpDistance(TUNING)` is above 48 px, `dashDistance(TUNING)` is above 32 px, `TUNING.shotSpeed * TUNING.shotLifetimeMs / 1000` is at least 240 and `TUNING.telegraphBlinkMs` is at least 167.
- [ ] WHEN `pnpm typecheck` and `pnpm lint` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm test tests/movement.test.ts   # expect: exit 0, 0 failed
pnpm test tests/tuning.test.ts     # expect: exit 0, 0 failed
pnpm typecheck                     # expect: exit 0
pnpm lint                          # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 7: pure movement and tuning sanity"
git tag step-07-movement
```

---

#### Step 8 — Habilidades run/jump y registro de habilidades

**Do**
1. `src/characters/ability.ts` — literal:
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
2. `src/characters/abilities/run.ts` → `export const createRun: AbilityFactory` (`velocityX = horizontalVelocity(held.left, held.right, tuning.runSpeed)`).
3. `src/characters/abilities/jump.ts` → `export const createJump: AbilityFactory`: lleva `msSinceGrounded` (0 si `grounded`, si no += `dtMs`) y `msSinceJumpPressed` (0 al pulsar, si no += `dtMs`; empieza en `Number.POSITIVE_INFINITY`). Si `canJump` → `velocityY = -jumpVelocity` y ambos contadores a infinito. Si no salta: `velocityY = clampFall(applyJumpCut(input.velocityY, held.jump, jumpCutMultiplier), maxFallSpeed)`.
4. `src/characters/abilityRegistry.ts`: `ABILITY_FACTORIES: Readonly<Record<string, AbilityFactory>> = { run: createRun, jump: createJump }`; `hasAbility(id): boolean`; `createAbility(id, tuning): Ability`, que lanza un `Error` con mensaje `Unknown ability: <id>` si el id no existe.
5. `tests/abilities-move.test.ts` — entradas falsas construidas con `emptyActionState()`.

**Done when**
- [ ] WHEN `createAbility("run", TUNING)` updates with `right` held THE SYSTEM SHALL return `velocityX` equal to `TUNING.runSpeed`.
- [ ] WHEN `jump` is pressed while airborne and the character lands within `TUNING.jumpBufferMs` THE SYSTEM SHALL return `velocityY` equal to `-TUNING.jumpVelocity` on the first grounded update.
- [ ] WHEN `jump` is pressed within `TUNING.coyoteTimeMs` after leaving the ground THE SYSTEM SHALL jump, and WHEN pressed after that window THE SYSTEM SHALL not.
- [ ] WHEN `createAbility("wall-jump", TUNING)` is called THE SYSTEM SHALL throw an error whose message contains `wall-jump`.
- [ ] WHEN `pnpm test tests/boundaries.test.ts`, `pnpm typecheck` and `pnpm lint` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm test tests/abilities-move.test.ts   # expect: exit 0, 0 failed
pnpm test tests/boundaries.test.ts       # expect: exit 0
pnpm typecheck                           # expect: exit 0
pnpm lint                                # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 8: run and jump abilities with registry"
git tag step-08-abilities-move
```

---

#### Step 9 — Habilidades shoot y dash

**Do**
1. `src/characters/abilities/dash.ts` → `createDash`: estado `dashRemainingMs`, `cooldownMs`, `airDashUsed`. Si `grounded` → `airDashUsed = false`. Al pulsar `dash` con `dashRemainingMs ≤ 0`, `cooldownMs ≤ 0` y (`grounded` o `!airDashUsed`): inicia (`dashRemainingMs = dashDurationMs`; si está en el aire, `airDashUsed = true`). Mientras `dashRemainingMs > 0`: efecto `{ velocityX: dashSpeed·facing, velocityY: 0, ignoreGravity: true }` y resta `dtMs`; al llegar a ≤ 0 fija `cooldownMs = dashCooldownMs`. Fuera del dash el cooldown baja con `dtMs` y el efecto es `{}`.
2. `src/characters/abilities/shoot.ts` → `createShoot`: `cooldownMs` baja con `dtMs`; con `pressed.shoot`, `cooldownMs ≤ 0` y `activeShots < maxShotsOnScreen` → `{ fire: true }` y `cooldownMs = shotCooldownMs`.
3. `src/characters/abilityRegistry.ts` (edición): añade `dash: createDash` y `shoot: createShoot`.
4. `tests/abilities-combat.test.ts`.

El `Player` (paso 10) aplica las habilidades en el orden de `CharacterDef.abilities` (`run`, `jump`, `dash`, `shoot`): cada campo definido sobrescribe al anterior, así el dash manda sobre correr y saltar.

**Done when**
- [ ] WHEN `dash` is pressed while grounded THE SYSTEM SHALL return `velocityX` equal to `TUNING.dashSpeed` times `facing` with `ignoreGravity` true for `TUNING.dashDurationMs`, then stop overriding velocity.
- [ ] WHEN `dash` is pressed again before `TUNING.dashCooldownMs` has elapsed since the previous dash ended THE SYSTEM SHALL not start a new dash.
- [ ] WHEN one dash has been used in the air THE SYSTEM SHALL refuse a second air dash until an update with `grounded` true.
- [ ] WHEN `shoot` is pressed with `activeShots` below `TUNING.maxShotsOnScreen` and the cooldown elapsed THE SYSTEM SHALL return `fire: true`, and SHALL not fire when `activeShots` equals `TUNING.maxShotsOnScreen`.
- [ ] WHEN `pnpm typecheck` and `pnpm lint` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm test tests/abilities-combat.test.ts   # expect: exit 0, 0 failed
pnpm typecheck                             # expect: exit 0
pnpm lint                                  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 9: shoot and dash abilities"
git tag step-09-abilities-combat
```

---

#### Step 10 — Personaje como datos, Player y Projectile

**Do**
1. `src/content/characters/kuuchil.ts` — literal de §4.
2. `src/content/registry.ts` (edición): `import { kuuchil } from "./characters/kuuchil.ts";` y `characters: [kuuchil]`.
3. `src/entities/Projectile.ts`: `type ProjectileOwner = "player" | "enemy"`; `fireProjectile(group: Phaser.Physics.Arcade.Group, x: number, y: number, vx: number, vy: number, textureKey: string, damage: number, owner: ProjectileOwner, lifetimeMs: number)` crea un sprite del grupo sin gravedad, guarda `damage`/`owner` con `setData`, y lo destruye al vencer `lifetimeMs` (`scene.time.delayedCall`) o al salir de los límites del mundo.
4. `src/entities/Player.ts`: `export class Player extends Phaser.Physics.Arcade.Sprite`; constructor `(scene, x, y, def: CharacterDef, shots: Phaser.Physics.Arcade.Group)`; origen (0.5, 1); hitbox **desde los datos** (`setSize(hitbox.width, hitbox.height)` + `setOffset(hitbox.offsetX, hitbox.offsetY)` sobre el body); crea sus habilidades con `createAbility(id, TUNING)` en el orden de `def.abilities`. `update(snapshot: ActionSnapshot, dtMs: number)`: actualiza `facing` con left/right, arma `AbilityInput` (`grounded` = body bloqueado abajo, `velocityY` = velocidad actual, `activeShots = shots.countActive(true)`), fusiona efectos, aplica velocidades, `setAllowGravity(!ignoreGravity)`, `setFlipX(facing < 0)`, y si `fire` llama `fireProjectile(shots, x + 8·facing, y − 8, TUNING.shotSpeed·facing, 0, def.projectileTextureKey, def.shotDamage, "player", TUNING.shotLifetimeMs)`.
5. `tests/character.test.ts`.

**Done when**
- [ ] WHEN `pnpm test tests/character.test.ts` runs THE SYSTEM SHALL assert `DEFAULT_CHARACTER_ID` (`kuuchil`) is registered and every id in its `abilities` resolves with `hasAbility`.
- [ ] WHEN `pnpm test tests/character.test.ts` runs THE SYSTEM SHALL assert the character's `abilities` are exactly `run`, `jump`, `dash`, `shoot` in that order and its hitbox has positive size and non-negative offsets.
- [ ] WHEN `pnpm test tests/assets.test.ts` and `pnpm validate:content` run with the character registered THE SYSTEM SHALL exit 0.
- [ ] WHEN `pnpm typecheck`, `pnpm lint` and `pnpm build` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm test tests/character.test.ts   # expect: exit 0, 0 failed
pnpm test tests/assets.test.ts      # expect: exit 0
pnpm validate:content               # expect: exit 0, "content OK"
pnpm typecheck                      # expect: exit 0
pnpm lint                           # expect: exit 0
pnpm build                          # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 10: character data, player and projectile"
git tag step-10-character-player
```

---

#### Step 11 — Datos de enemigos

**Do**
1. `src/content/enemies/walker.ts` (literal de §4), `src/content/enemies/hopper.ts` y `src/content/enemies/turret.ts` (misma forma, valores de la tabla de §4).
2. `src/content/registry.ts` (edición): imports y `enemies: [walker, hopper, turret]`.
3. `tests/content-registry.test.ts`.

**Done when**
- [ ] WHEN `pnpm test tests/content-registry.test.ts` runs THE SYSTEM SHALL assert enemies `walker`, `hopper` and `turret` are registered and every id is unique within its kind.
- [ ] WHEN `pnpm test tests/content-registry.test.ts` runs THE SYSTEM SHALL assert every registered enemy, boss and character hitbox has positive width and height and non-negative offsets.
- [ ] WHEN `pnpm test tests/content-registry.test.ts` runs THE SYSTEM SHALL assert every `turret` has `rangePx`, `actionIntervalMs` and `projectileSpeed` above 0 and every `hopper` has `jumpVelocity` and `actionIntervalMs` above 0.
- [ ] WHEN `pnpm test tests/assets.test.ts` and `pnpm validate:content` run THE SYSTEM SHALL exit 0, the latter printing `content OK`.
- [ ] WHEN `pnpm typecheck` and `pnpm lint` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm test tests/content-registry.test.ts   # expect: exit 0, 0 failed
pnpm test tests/assets.test.ts             # expect: exit 0
pnpm validate:content                      # expect: exit 0, "content OK"
pnpm typecheck                             # expect: exit 0
pnpm lint                                  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 11: enemy data"
git tag step-11-enemy-data
```

---

#### Step 12 — Jefe (datos), etapa 1 y StageScene con mapa Tiled

**Do**
1. `src/content/bosses/sentinel.ts` y `src/content/stages/stage-01/stage.ts` — literales de §4.
2. `src/content/registry.ts` (edición): imports y `stages: [stage01]`, `bosses: [sentinel]` (forma final de §4).
3. `src/scenes/StageScene.ts`: `init({ stageId })` → `getStage`; si es `undefined`, texto "Etapa no registrada: <id>" y la acción `pause` vuelve al menú. `preload()`: `this.load.tilemapTiledJSON(stage.mapKey, stage.mapPath)` y `this.load.json(stage.mapKey + "-raw", stage.mapPath)`. `create()`: `this.make.tilemap({ key: stage.mapKey })`, `addTilesetImage(stage.tilesetName, stage.tilesetTextureKey, 16, 16, 0, 0)`, `createLayer(stage.groundLayer, tileset, 0, 0)`, `setCollisionByExclusion([-1])`; `physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels + 64)` (el foso deja caer); `extractSpawns(this.cache.json.get(stage.mapKey + "-raw"), stage.spawnLayer)` → `Player` en `playerStarts[0]` con `getCharacter(DEFAULT_CHARACTER_ID)`, `setCollideWorldBounds(true)`; collider jugador↔capa; cámara con `setBounds(0, 0, map.widthInPixels, map.heightInPixels)` y `startFollow(player, true)`; grupo de balas del jugador, destruidas al chocar con la capa. `update(_, delta)`: `input.update()`; `pressed.pause` alterna la pausa (`physics.pause()`/`resume()`, texto "PAUSA - Esc: seguir / Z: menú" con las etiquetas reales de `keyLabel`); en pausa, `pressed.jump` → `MenuScene`; fuera de pausa, `player.update(snapshot, delta)`.
4. `src/main.ts` (edición): la línea `scene` pasa a ser exactamente `  scene: [BootScene, MenuScene, ControlsScene, StageScene],` (una sola línea), más el import.

**Done when**
- [ ] WHEN `pnpm validate:content` runs THE SYSTEM SHALL validate `stage-01` against `public/maps/stage-01.tmj` (layers `ground` and `spawns`, one `player_start`, one `boss_spawn`, at least one `boss_trigger`, every `enemyId` registered, boss `sentinel` registered) and print `content OK`.
- [ ] WHEN `pnpm test tests/content-validate.test.ts` runs THE SYSTEM SHALL report 0 errors for the real registry and exit 0.
- [ ] WHEN `grep -qF "scene: [BootScene, MenuScene, ControlsScene, StageScene]" src/main.ts` runs THE SYSTEM SHALL exit 0, proving `StageScene` is in the `scene` array.
- [ ] WHEN `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run THE SYSTEM SHALL exit 0.

**Checkpoint manual del autor (playtest 1 — sensación):** "Jugar" carga la etapa; el jugador corre, salta con altura variable, hace dash (también uno en el aire), dispara hasta 3 balas; las plataformas de las filas 5 y 4 son alcanzables; la cámara sigue sin salirse del mapa; Esc pausa. Ajusta `TUNING` (una variable por sesión) y guarda tus notas en tu editor o libreta hasta el paso 17, que crea `docs/PLAYTEST.md` para registrarlas; cualquier cambio debe mantener verde `pnpm test tests/tuning.test.ts`.

**Verify**
```bash
pnpm validate:content                                                             # expect: exit 0, "content OK: 1 etapas, 1 jefes, 3 enemigos, 1 personajes"
pnpm test tests/content-validate.test.ts                                          # expect: exit 0, 0 failed
grep -qF "scene: [BootScene, MenuScene, ControlsScene, StageScene]" src/main.ts   # expect: exit 0
pnpm typecheck                                                                    # expect: exit 0
pnpm lint                                                                         # expect: exit 0
pnpm build                                                                        # expect: exit 0
pnpm check:dist                                                                   # expect: exit 0
pnpm smoke:dist                                                                   # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 12: boss data, stage 1 and tilemap scene"
git tag step-12-stage-map
```

---

#### Step 13 — Vida, daño, HUD, muerte y reinicio

**Do**
1. `src/core/health.ts`: `type HealthState = { readonly hp: number; readonly maxHp: number; readonly invulnMs: number }`; `createHealth(maxHp)`; `applyDamage(s, amount, invulnerabilityMs): { state: HealthState; applied: boolean }`; `tickHealth(s, dtMs)`; `isDead(s)`; `hpFraction(s)` (0..1).
2. `tests/health.test.ts`.
3. `src/scenes/hud.ts`: `createHud(scene)` dibuja con `setScrollFactor(0)` el marco 50×6 en (4,4) con relleno `PALETTE.hpPlayer`, y el marco del jefe en (186,4) oculto; devuelve `{ setPlayer(fraction: number): void; setBoss(fraction: number | null): void; showMessage(text: string | null): void }` (mensaje centrado con `TEXT_STYLE`). En este paso `setBoss` solo oculta/muestra el marco; el relleno llega en el paso 16.
4. `src/entities/Player.ts` (edición): `health = createHealth(def.maxHp)`; `takeDamage(amount, fromX)` usa `applyDamage(…, TUNING.invulnerabilityMs)` y, si aplica, retroceso `TUNING.knockbackSpeed` alejándose de `fromX`; alpha 0.4/1 cada 100 ms mientras `invulnMs > 0`; `tickHealth` en `update`.
5. `src/scenes/StageScene.ts` (edición): HUD actualizado cada frame; si `player.y > map.heightInPixels + 16` → `player.takeDamage(def.maxHp, player.x)`; si `isDead` → `showMessage("K.O.")`, deja de pasar entrada al jugador y `this.time.delayedCall(TUNING.deathRestartDelayMs, () => this.scene.restart({ stageId }))`.

**Done when**
- [ ] WHEN `applyDamage` hits a state whose `invulnMs` is 0 THE SYSTEM SHALL reduce `hp` by the amount, never below 0, set `invulnMs` to the given window and return `applied: true`.
- [ ] WHEN `applyDamage` hits a state whose `invulnMs` is above 0 THE SYSTEM SHALL return `applied: false` with `hp` unchanged.
- [ ] WHEN `tickHealth` advances by at least the remaining `invulnMs` THE SYSTEM SHALL return `invulnMs` 0.
- [ ] WHEN `hp` reaches 0 THE SYSTEM SHALL report `isDead` true and `hpFraction` 0.
- [ ] WHEN `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run THE SYSTEM SHALL exit 0.

**Checkpoint manual del autor:** caer al foso muestra "K.O." y reinicia la etapa tras ~1.2 s; la barra verde del HUD queda fija en pantalla.

**Verify**
```bash
pnpm test tests/health.test.ts   # expect: exit 0, 0 failed
pnpm typecheck                   # expect: exit 0
pnpm lint                        # expect: exit 0
pnpm build                       # expect: exit 0
pnpm check:dist                  # expect: exit 0
pnpm smoke:dist                  # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 13: health, damage, hud and restart"
git tag step-13-health-hud
```

---

#### Step 14 — Enemigos de datos en la etapa

**Do**
1. `src/core/enemyAi.ts` (puro): `walkerDirection(dir: 1 | -1, blockedAhead: boolean, groundAhead: boolean): 1 | -1`; `hopperStep(timerMs: number, dtMs: number, def: EnemyDef, grounded: boolean): { timerMs: number; jump: boolean }` (acumula con tope en `actionIntervalMs`; salta solo si `grounded` y el timer llegó al intervalo, y entonces timer = 0); `turretStep(timerMs: number, dtMs: number, def: EnemyDef, distanceToPlayer: number): { timerMs: number; fire: boolean }` (acumula con tope en `actionIntervalMs`; dispara solo si `distanceToPlayer ≤ rangePx` y el timer llegó al intervalo, y entonces timer = 0).
2. `tests/enemy-ai.test.ts`.
3. `src/entities/Enemy.ts`: `export class Enemy extends Phaser.Physics.Arcade.Sprite` con `(scene, x, y, def: EnemyDef)`, origen (0.5,1), hitbox desde `def.hitbox`, `health = createHealth(def.maxHp)`; `update(dtMs, player, ground: Phaser.Tilemaps.TilemapLayer, enemyShots)`: walker usa `ground.getTileAtWorldXY(x + dir·10, y + 2)` para `groundAhead` y el bloqueo izquierdo/derecho del body para `blockedAhead`; hopper aplica `speed` hacia el jugador y `-jumpVelocity` cuando `jump`; turret llama `fireProjectile(enemyShots, x, y − 8, def.projectileSpeed · signo hacia el jugador, 0, "projectile-enemy", def.projectileDamage, "enemy", 2000)` cuando `fire`.
4. `src/scenes/StageScene.ts` (edición): por cada `extractSpawns(...).enemies` crea `Enemy` con `getEnemy(enemyId)` en un grupo; collider enemigos↔capa; overlap balas del jugador↔enemigos (`applyDamage(health, damage, 0)`; destruye bala; destruye enemigo al morir); overlap jugador↔enemigos (`player.takeDamage(def.contactDamage, enemy.x)`); overlap balas enemigas↔jugador (`takeDamage(damage, bala.x)`).

**Done when**
- [ ] WHEN `walkerDirection` is told the path ahead is blocked or has no ground THE SYSTEM SHALL return the reversed direction, and SHALL keep the direction otherwise.
- [ ] WHEN a hopper's timer reaches its `actionIntervalMs` while grounded THE SYSTEM SHALL return `jump: true` once and reset the timer to 0, and SHALL not jump while airborne.
- [ ] WHEN a turret's timer reaches its `actionIntervalMs` with the player within `rangePx` THE SYSTEM SHALL return `fire: true`, and SHALL never return `fire: true` while the player is beyond `rangePx`.
- [ ] WHEN `pnpm test tests/boundaries.test.ts`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run THE SYSTEM SHALL exit 0.

**Checkpoint manual del autor:** los cinco enemigos aparecen donde marca el mapa; el caminante gira en bordes y paredes; el saltarín salta; la torreta dispara solo con el jugador cerca; tres disparos matan al caminante.

**Verify**
```bash
pnpm test tests/enemy-ai.test.ts     # expect: exit 0, 0 failed
pnpm test tests/boundaries.test.ts   # expect: exit 0
pnpm typecheck                       # expect: exit 0
pnpm lint                            # expect: exit 0
pnpm build                           # expect: exit 0
pnpm check:dist                      # expect: exit 0
pnpm smoke:dist                      # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 14: data-driven enemies in stage"
git tag step-14-enemies
```

---

#### Step 15 — Motor FSM de jefes, patrones e invariante de telegraph

**Do**
1. `src/bosses/fsm.ts` (puro, genérico): `type BossStateKind = "intro" | "idle" | "telegraph" | "active" | "recovery" | "defeated"`; `type BossState = { readonly kind: BossStateKind; readonly timerMs: number; readonly phaseIndex: number; readonly cycleIndex: number; readonly attackId: string | null }`; `phaseIndexFor(phases, hpFraction)` (último índice con `hpFraction ≤ enterAtHpFraction`); `createBossState(def)` → `intro` con `timerMs = def.introMs`; `stepBoss(def, state, dtMs, hp): BossState`: si `hp ≤ 0` → `defeated` (y se queda). Si no, resta `dtMs`; al llegar a ≤ 0: `intro → idle` (fase calculada, `cycleIndex 0`, timer `idleMs`); `idle → telegraph` (`attackId = attackCycle[cycleIndex % length]`, timer `telegraphMs`); `telegraph → active` (timer `activeMs`); `active → recovery` (timer `recoveryMs`); `recovery → idle` (recalcula fase; si cambió, `cycleIndex = 0`, si no `cycleIndex + 1`; timer `idleMs` de la fase). El sobrante del timer no se arrastra.
2. `src/bosses/patterns.ts` (puro): `dashVelocity(bossX, playerX, speed): number` (signo hacia el jugador; si coinciden, `+speed`); `spreadVelocities(count, speed, facing: 1 | -1): { vx: number; vy: number }[]` (ángulos repartidos uniformemente en [−20°, +20°]; `count 1` → 0°; magnitud `speed`; `vx` con el signo de `facing`); `slamVelocity(bossX, playerX, speed): { vx: number; vy: number }` (`vy = −speed`; `vx = playerX − bossX` acotado a ±80).
3. `tests/boss-fsm.test.ts` — con un `BossDef` fixture de dos fases definido en el test (no depende de `sentinel`).
4. `tests/boss-patterns.test.ts`.
5. `tests/telegraph.test.ts` — para cada jefe de `CONTENT.bosses`, a `hp = maxHp` y `hp = maxHp / 2`, simula 20000 ms en pasos de 16 ms acumulando el tiempo pasado en `telegraph` antes de cada entrada a `active`; además comprueba `telegraphMs ≥ TUNING.minTelegraphMs` en todos sus ataques.

**Done when**
- [ ] WHEN `stepBoss` advances a boss from `createBossState` at full hp THE SYSTEM SHALL visit `intro`, `idle`, `telegraph`, `active`, `recovery` in that order and then return to `idle`.
- [ ] WHEN the hp fraction drops to a later phase's `enterAtHpFraction` THE SYSTEM SHALL switch `phaseIndex` on the next entry to `idle` and restart that phase's `attackCycle` at index 0.
- [ ] WHEN hp is 0 in any state THE SYSTEM SHALL enter `defeated` and remain there on every later step.
- [ ] WHEN `pnpm test tests/telegraph.test.ts` simulates every registered boss for 20000 ms at full and at half hp in 16 ms steps THE SYSTEM SHALL never enter `active` before spending at least that attack's `telegraphMs` in `telegraph`, and every attack's `telegraphMs` SHALL be at least `TUNING.minTelegraphMs`.
- [ ] WHEN `spreadVelocities(3, 120, 1)` runs THE SYSTEM SHALL return 3 vectors of magnitude 120 (within 0.001), symmetric around the horizontal and with positive `vx`.
- [ ] WHEN `pnpm typecheck` and `pnpm lint` run THE SYSTEM SHALL exit 0.

**Verify**
```bash
pnpm test tests/boss-fsm.test.ts        # expect: exit 0, 0 failed
pnpm test tests/boss-patterns.test.ts   # expect: exit 0, 0 failed
pnpm test tests/telegraph.test.ts       # expect: exit 0, 0 failed
pnpm typecheck                          # expect: exit 0
pnpm lint                               # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 15: boss fsm engine and telegraph invariant"
git tag step-15-boss-engine
```

---

#### Step 16 — Pelea del jefe y flujo victoria/derrota

**Do**
1. `src/core/stageFlow.ts`: `type StageFlowState = "exploring" | "bossIntro" | "bossFight" | "won" | "lost"`; `type StageFlowEvent = "enteredBossTrigger" | "bossIntroDone" | "bossDefeated" | "playerDied" | "restart"`; `nextFlow(state, event)` con exactamente estas transiciones (todo lo demás devuelve el mismo estado): `exploring + enteredBossTrigger → bossIntro`; `bossIntro + bossIntroDone → bossFight`; `bossFight + bossDefeated → won`; `exploring|bossIntro|bossFight + playerDied → lost`; `lost + restart → exploring`.
2. `tests/stage-flow.test.ts`.
3. `src/entities/Boss.ts`: `export class Boss extends Phaser.Physics.Arcade.Sprite` con `(scene, x, y, def: BossDef)`, hitbox de datos, `health = createHealth(def.maxHp)`, `fsm = createBossState(def)`. `update(dtMs, player, bossShots)`: `fsm = stepBoss(def, fsm, dtMs, health.hp)`; al entrar en `telegraph` alterna `setTintFill(PALETTE.telegraph)` / `clearTint()` cada `TUNING.telegraphBlinkMs` hasta salir de `telegraph`; al entrar en `active` ejecuta el patrón del ataque: `dash` → `setVelocityX(dashVelocity(...))`; `shot-spread` → una bala por vector de `spreadVelocities(count, speed, signo hacia el jugador)` con `fireProjectile(bossShots, …, "projectile-enemy", attack.damage, "enemy", 2000)`; `slam` → `setVelocity(slam.vx, slam.vy)`; en `recovery` frena (`setVelocityX(0)`). `currentContactDamage()` = `attack.damage` en `active` de `dash`/`slam`; si no, `def.contactDamage`.
4. `src/scenes/StageScene.ts` (edición): estado `flow` gobernado por `nextFlow`. Overlap jugador↔zona de cada `bossTriggers` → `enteredBossTrigger`: `cameras.main.setBounds(trigger.x, 0, map.widthInPixels − trigger.x, map.heightInPixels)`, `physics.world.setBounds(trigger.x, 0, map.widthInPixels − trigger.x, map.heightInPixels + 64)`, crea el `Boss` en `bossSpawns[0]` con `getBoss(stage.bossId)` y muestra su barra. Cuando `boss.fsm.kind` deja `intro` → `bossIntroDone`. Balas del jugador → `applyDamage(boss.health, damage, 0)`; contacto → `player.takeDamage(boss.currentContactDamage(), boss.x)`; balas del jefe → `takeDamage`. `defeated` → `bossDefeated` → mensaje "VICTORIA - Z: menú" (con `keyLabel` real) y `pressed.jump` → `MenuScene`. Muerte del jugador → `playerDied` → "K.O." y reinicio (reemplaza la lógica directa del paso 13).
5. `src/scenes/hud.ts` (edición): `setBoss(fraction)` rellena la barra con `PALETTE.hpBoss` proporcional a `fraction`; `null` la oculta.

**Done when**
- [ ] WHEN `nextFlow("exploring", "enteredBossTrigger")` runs THE SYSTEM SHALL return `bossIntro`, and `nextFlow("bossIntro", "bossIntroDone")` SHALL return `bossFight`.
- [ ] WHEN `bossFight` receives `bossDefeated` THE SYSTEM SHALL return `won`, and `won` SHALL stay `won` on `playerDied`.
- [ ] WHEN any state other than `won` receives `playerDied` THE SYSTEM SHALL return `lost`, and `nextFlow("lost", "restart")` SHALL return `exploring`.
- [ ] WHEN `pnpm test` runs the whole suite THE SYSTEM SHALL exit 0 with 0 failed.
- [ ] WHEN `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run THE SYSTEM SHALL exit 0.

**Checkpoint manual del autor (playtest 2 — jefe):** al cruzar x=720 la cámara se fija en la arena; el Centinela parpadea en blanco antes de **cada** ataque; en fase 2 (≤ 50 % de vida) añade el slam y espera menos entre ataques; cada ataque deja una ventana de castigo; vencerlo muestra la victoria, morir reinicia la etapa. Anota intentos y sensaciones en tu editor o libreta; el paso 17 crea `docs/PLAYTEST.md`, donde se pasan a limpio.

**Verify**
```bash
pnpm test tests/stage-flow.test.ts   # expect: exit 0, 0 failed
pnpm test                            # expect: exit 0, 0 failed, 0 skipped
pnpm typecheck                       # expect: exit 0
pnpm lint                            # expect: exit 0
pnpm build                           # expect: exit 0
pnpm check:dist                      # expect: exit 0
pnpm smoke:dist                      # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 16: boss fight and win/lose flow"
git tag step-16-boss-fight
```

---

#### Step 17 — Documentación, build de producción y gate final

**Do**
1. `README.md`: qué es, requisitos (Node 24, pnpm vía corepack), la tabla de comandos de `CLAUDE.md`, controles por defecto, y referencias a `docs/PLAYTEST.md`, `docs/DEPLOY.md` y a las skills de `.claude/skills/`. Cada ruta de archivo en backticks debe existir (p. ej. `src/core/tuning.ts`, `src/content/registry.ts`, `public/maps/stage-01.tmj`); las rutas futuras se escriben siempre con `<…>`.
2. `docs/PLAYTEST.md`: tabla con **cada** clave de `TUNING` (nombre exacto, valor actual, efecto, cómo se siente si sube o baja); procedimiento de playtest (§13); checklist del jefe (¿cada ataque se lee?, ¿hay ventana de castigo?, ¿cada muerte es atribuible a un error propio?); plantilla de registro de intentos, donde se pasan a limpio las notas de los playtests de los pasos 12 y 16.
3. `docs/DEPLOY.md`: `pnpm build` → `dist/`; comprobar con `pnpm smoke:dist`; Cloudflare Pages (build command `pnpm build`, output `dist/`, variable `NODE_VERSION=24` en la configuración del proyecto de Pages); itch.io (zip del **contenido** de `dist/` con `index.html` en la raíz del zip, tipo HTML, viewport 960×640); rollback (§12).
4. `tests/docs.test.ts`: extrae las rutas entre backticks de `README.md`, `docs/PLAYTEST.md`, `docs/DEPLOY.md` y de cada `.claude/skills/*/SKILL.md` con la expresión regular `` /`([^`\s]+)`/g ``; se queda con las que empiezan por `src/`, `public/`, `scripts/` o `tests/`, terminan en una extensión (`/\.[a-z]+$/`) y no contienen `<` ni `*`; afirma `existsSync` de cada una. Afirma también que `docs/PLAYTEST.md` contiene cada `Object.keys(TUNING)` y que `docs/DEPLOY.md` contiene `pnpm build` y `dist/`.

**Done when**
- [ ] WHEN `pnpm test tests/docs.test.ts` runs THE SYSTEM SHALL assert that every backticked path in `README.md`, `docs/PLAYTEST.md`, `docs/DEPLOY.md` and `.claude/skills/*/SKILL.md` that starts with `src/`, `public/`, `scripts/` or `tests/`, has a file extension and contains no `<` or `*` exists on disk.
- [ ] WHEN `pnpm test tests/docs.test.ts` runs THE SYSTEM SHALL assert `docs/PLAYTEST.md` contains every key of `TUNING` and `docs/DEPLOY.md` contains `pnpm build` and `dist/`.
- [ ] WHEN `pnpm install --frozen-lockfile` runs THE SYSTEM SHALL exit 0.
- [ ] WHEN `pnpm gate` runs THE SYSTEM SHALL run lint, typecheck, test, validate:content, build, check:dist and smoke:dist in that order and exit 0.

**Verify**
```bash
pnpm test tests/docs.test.ts      # expect: exit 0, 0 failed
pnpm install --frozen-lockfile    # expect: exit 0
pnpm gate                         # expect: exit 0
```

**Checkpoint**
```bash
git add -A && git commit -m "step 17: docs, production build and final gate"
git tag step-17-release
```

---

### 9.1 Parity and cutover

NOT APPLICABLE — greenfield build, no system is being replaced.

---

## 10. Environment Setup

### Prerequisites
| Herramienta | Versión | Comprobación |
|---|---|---|
| Node.js | 24.x LTS (§11; `.nvmrc` = `24`) | `node -v` → `v24.…` |
| corepack | incluido en Node 24 | `corepack --version` |
| pnpm | la de `packageManager` (§11), activada por corepack | `pnpm -v` |
| git | cualquiera reciente | `git --version` |
| rsync | el del sistema (macOS trae uno) | `rsync --version` |
| Navegador moderno | Chrome/Firefox/Safari actuales | checkpoints manuales |
| Tiled (opcional) | 1.12.2 (§11) | Help → About |

### Accounts to create first
Ninguna para construir. Opcionales, solo para publicar (post-build): Cloudflare (https://dash.cloudflare.com/sign-up) o itch.io (https://itch.io/register).

### Environment variables
El código **no lee variables de entorno**: no hay servidor ni secretos, y no existe `.env` ni `.env.example` (`.gitignore` ignora `.env` y `.env.*` por precaución). Ninguna herramienta que invocan los gates (`tsc`, `biome`, `vite`, `vitest`, `node scripts/*.ts`) lee variables del proyecto. Las únicas variables que aparecen en este blueprint son de tooling o de publicación:

| Variable | Propósito | Dónde se obtiene | Requerida desde el paso | ¿Secreta? |
|---|---|---|---|---|
| `COREPACK_ENABLE_DOWNLOAD_PROMPT` | evita que corepack pregunte antes de descargar pnpm (ejecución desatendida) | la exporta el Bootstrap con valor `0` | Bootstrap | no |
| `NODE_VERSION` | versión de Node del build en Cloudflare Pages; ningún código la lee | configuración del proyecto en el panel de Cloudflare Pages, valor `24` | ninguno (opcional, post-build, solo si se publica en Pages; ver `docs/DEPLOY.md`) | no |

### Files that must be committed

| Archivo | Por qué se commitea | Línea de excepción en el ignore |
|---|---|---|
| `package.json`, `pnpm-lock.yaml` | manifiesto y lockfile reproducible | — no coincide con ningún patrón |
| `tsconfig.json`, `biome.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.nvmrc` | configs que leen los gates | — no coincide |
| `.gitignore` | gobierna el primer commit | — no coincide |
| `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/rules/*.md`, `.claude/skills/*/SKILL.md` | configuración del agente | — no coincide (`.claude/` no está ignorado) |
| `public/maps/stage-01.tmj` | contenido del juego | — no coincide |
| `scripts/check-dist.ts`, `scripts/smoke-dist.ts` | gates de build | — no coinciden (`dist/` solo coincide con un directorio llamado `dist`) |
| `pnpm-workspace.yaml` (si pnpm lo crea al aprobar builds) | política de builds de dependencias | — no coincide |
| `blueprints/kuuchil-btz/**` | este bundle | — no coincide |

### Bootstrap
Desde la **raíz del proyecto** (el directorio que contiene `blueprints/kuuchil-btz/`), en zsh o bash. Es seguro ejecutarlo dos veces: la segunda ejecución sale 0 sin cambiar nada. Este bloque corre **antes** de que `.claude/settings.json` exista en la raíz (la copia lo instala), así que sus comandos no están preaprobados en la primera ejecución: quien lo lance (el usuario o el hilo principal) los aprueba una vez.

```bash
set -euo pipefail
# order matters: copia guardada de workspace/ (trae .gitignore y biome.json/tsconfig.json con sus excludes)
#   → repo git → identidad git → toolchain (Node 24 + pnpm) → install → lint de configs → primer commit
test -d blueprints/kuuchil-btz/workspace   # expect: exit 0 — el bundle está donde §19 dice
rsync -a --ignore-existing blueprints/kuuchil-btz/workspace/ ./   # nunca pisa archivos existentes (package.json, pnpm-lock.yaml, tsconfig.json...); sale 0 al saltar, también en macOS
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main      # idempotente: no-op si ya hay repo
git config user.name >/dev/null || git config user.name "kuuchil-btz builder"            # solo si no hay identidad configurada
git config user.email >/dev/null || git config user.email "builder@kuuchil-btz.local"    # solo si no hay identidad configurada
node -e 'process.exit(process.versions.node.split(".")[0] === "24" ? 0 : 1)'   # expect: exit 0 — Node 24 (si falla: nvm use)
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
mkdir -p "$HOME/.local/bin"
corepack enable --install-directory "$HOME/.local/bin"   # `corepack enable` a secas falla con EACCES si el bin global no es escribible
export PATH="$HOME/.local/bin:$PATH"
corepack prepare pnpm@12.14.0 --activate
pnpm -v   # expect: 12.14.0
pnpm install || { pnpm approve-builds --all && pnpm install; }   # pnpm 11 abortaba con ERR_PNPM_IGNORED_BUILDS; en pnpm 12 es UNVERIFIED — el fallback aprueba los builds pendientes y reinstala
pnpm lint   # expect: exit 0 — las configs y scripts emitidos pasan su propio gate, con blueprints/ excluido
git rev-parse --verify -q HEAD >/dev/null || { git add -A && git commit -m "chore: bootstrap kuuchil-btz"; }   # primer commit (el .gitignore ya está en disco); no-op si ya existe
```

La copia **nunca** sobrescribe un archivo presente (`--ignore-existing`), en particular `package.json`, `pnpm-lock.yaml`, `tsconfig.json` y `biome.json`: re-ejecutar el Bootstrap no revierte nada que un paso haya editado. El repositorio, el primer commit y el `.gitignore` (antes de ese commit) existen antes del paso 1, así que todos los Checkpoints tienen dónde etiquetar.

---

## 11. Dependencies

Fuente autoritativa: informe de `stack-researcher` de esta sesión (2026-10-19). Ningún pin viene del track `ts-node.md` (sus valores para Node, pnpm, Vite, Vitest y Biome están superados por el informe). Los rangos de `package.json` son exactamente los de esta tabla.

### Runtime
| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| `phaser` | `4.2.1` (exacto) | https://registry.npmjs.org/-/package/phaser/dist-tags | 2026-10-19 | §10 Bootstrap — `pnpm install` desde `package.json` (`dependencies`) | Motor: Arcade physics, tilemaps Tiled JSON, cámaras, escalado. Trae sus propios tipos. Comportamiento en navegador **UNVERIFIED** (solo lectura de fuente); `roundPixels` es `false` por defecto en v4 y se fija `true` |

### Development
| Package | Version | Source (registry URL or track file) | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| `vite` | `^8.3.4` | https://registry.npmjs.org/-/package/vite/dist-tags (fecha de publicación **UNVERIFIED**) | 2026-10-19 | §10 Bootstrap — `pnpm install` (`devDependencies`) | Dev server, build estática y `preview()` programático de `scripts/smoke-dist.ts`. Requiere Node `^20.19 \|\| >=22.12`. Gotchas de Phaser 4 + Vite 8 **UNVERIFIED** (aviso de chunk > 500 kB esperado; se sube `chunkSizeWarningLimit`) |
| `typescript` | `~6.0.3` | https://registry.npmjs.org/-/package/typescript/dist-tags | 2026-10-19 | §10 Bootstrap — `pnpm install` | Typecheck (`tsc --noEmit`). 7.0.2 es `latest` pero no está probado con los tipos de Phaser: no usar 7 |
| `vitest` | `^5.0.5` | https://registry.npmjs.org/-/package/vitest/dist-tags | 2026-10-19 | §10 Bootstrap — `pnpm install` | Tests en Node. Peer `vite ^6.4 \|\| ^7 \|\| ^8`; engines `^22.12 \|\| ^24 \|\| >=26` |
| `@biomejs/biome` | `2.5.15` (exacto) | https://registry.npmjs.org/-/package/@biomejs/biome/dist-tags | 2026-10-19 | §10 Bootstrap — `pnpm install` | Lint + formato; el `$schema` de `biome.json` apunta a 2.5.15 |
| `@types/node` | `^24` | https://registry.npmjs.org/-/package/@types/node/dist-tags | 2026-10-19 | §10 Bootstrap — `pnpm install` | Tipos de `node:fs`/`node:path`/`fetch`/`process` para `scripts/` y tests; peer de Vitest |

### Toolchain (prerrequisitos o fijados por archivo, no instalados por pasos)
| Herramienta | Version | Source | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| Node.js | `24.22.0` LTS (`.nvmrc` = `24`) | informe stack-researcher, sesión 2026-10-19 | 2026-10-19 | el desarrollador (prerrequisito §10); `.nvmrc` emitido en §19.6 | Runtime del tooling; ejecuta `scripts/*.ts` despojando tipos; trae `fetch` global |
| pnpm | `12.14.0` | https://registry.npmjs.org/-/package/pnpm/dist-tags (informe stack-researcher) | 2026-10-19 | §10 Bootstrap — `corepack prepare pnpm@12.14.0 --activate`; `packageManager` en `package.json` | Gestor de paquetes. Comportamiento con builds ignorados en v12 **UNVERIFIED** |
| Tiled | `1.12.2` | informe stack-researcher, sesión 2026-10-19 | 2026-10-19 | el autor, a mano (herramienta de escritorio, no dependencia) | Editor de mapas; exportar JSON `.tmj`, capas CSV sin compresión |

### Deliberately not used
| Rechazado | En su lugar | Por qué |
|---|---|---|
| `@types/phaser` | tipos incluidos en `phaser` | obsoleto; duplicaría y contradiría los tipos de v4 |
| `phaserjs/template-vite-ts` | manifiesto y configs propios (§19.6) | plantilla desactualizada respecto a Vite 8 / Phaser 4 |
| `typescript@7` | `typescript@~6.0.3` | sin probar con los tipos de Phaser; sin API de compilador estable |
| `tsx` | Node 24 nativo (despoje de tipos) | una dependencia menos; la convención `.ts` lo hace innecesario |
| ESLint + Prettier | Biome | una herramienta, un config |
| `zod` | validación a mano en `parseBindings` / `validateContent` | dos validadores pequeños no justifican una dependencia |
| Playwright / servidor HTTP aparte para el smoke test | `preview()` de Vite + `fetch` de Node | ya instalados; sin navegadores que descargar |
| librerías de audio (Howler, …) | nada | el audio es no-objetivo v1 |

---

## 12. Deployment Strategy

### Hosting
Opcional; solo si el autor publica. Sitio estático: `pnpm build` produce `dist/` con rutas relativas (`base: "./"`), así que funciona en:
- **Cloudflare Pages** (plan Free): build command `pnpm build`, output directory `dist`, `NODE_VERSION=24` en la configuración del proyecto de Pages (§10; no la lee el código).
- **itch.io**: subir un zip del *contenido* de `dist/` (con `index.html` en la raíz del zip), tipo "HTML", "This file will be played in the browser", viewport 960×640 (4× la resolución nativa).

### Environments
| Entorno | Rama | URL | Base de datos | Terceros |
|---|---|---|---|---|
| Local | — | http://localhost:5173 (`pnpm dev`) · http://127.0.0.1:4173 (`pnpm smoke:dist`, y `pnpm preview` usa por defecto el mismo puerto) | ninguna | ninguno |
| Preview | cualquier rama (si se conecta Pages a git) | automática de Pages | ninguna | ninguno |
| Producción | `main` | subdominio `*.pages.dev` o página de itch.io | ninguna | ninguno |

### CI/CD
Tier 0. Sin CI obligatoria en v1 (el autor trabaja solo y en local): el gate es `pnpm gate` en local antes de publicar. Si el autor sube el repo a GitHub, el único job es `pnpm install --frozen-lockfile && pnpm gate`, el mismo conjunto que §20.1.

### Release and rollback
Publicar = `pnpm gate` en verde → subir `dist/`. Rollback en Pages: "Rollback to this deployment" sobre el despliegue anterior (segundos). En itch.io: volver a subir el zip anterior (conservar un zip por tag, `kuuchil-btz-<tag>.zip`). Sin migraciones.

### Domain, DNS, TLS
NOT APPLICABLE en v1 — subdominio del proveedor con TLS automático.

---

## 13. Testing Strategy

Tests para que los "Done when" de §9 sean decidibles; no hay objetivo de cobertura.

| Capa | Framework | Qué cubre | Dónde | Corre |
|---|---|---|---|---|
| Unit (lógica pura) | Vitest (entorno `node`) | tuning, movimiento, habilidades, entrada, bindings, vida, IA, FSM, patrones, flujo | `tests/*.test.ts` | cada paso, `pnpm test` |
| Integración de contenido | Vitest + `node scripts/validate-content.ts` | registro real + mapas `.tmj` reales + manifiesto | `tests/content-validate.test.ts`, `tests/assets.test.ts`, `tests/content-registry.test.ts`, `tests/telegraph.test.ts` | cada paso que toca contenido |
| Arquitectura | Vitest | fronteras `phaser`/`addEventListener`, rutas de docs/skills | `tests/boundaries.test.ts`, `tests/docs.test.ts` | cada paso |
| Build servido | `pnpm build` + `pnpm check:dist` + `pnpm smoke:dist` | `index.html` → entry JS existe en disco; `vite preview` sirve `/` y el entry con 200 y el marcador | `scripts/check-dist.ts`, `scripts/smoke-dist.ts` | pasos 1, 5, 6, 12, 13, 14, 16 y el gate |
| E2E en navegador | ninguno automatizado (manual) | sensación, render pixel-art, flujo completo | checkpoints manuales de los pasos 1, 5, 12, 13, 14, 16 | antes de publicar |

Archivos de test (todos creados por un paso): `game-config`, `content-validate`, `input`, `boundaries`, `bindings`, `controls-menu`, `assets`, `movement`, `tuning`, `abilities-move`, `abilities-combat`, `character`, `content-registry`, `health`, `enemy-ai`, `boss-fsm`, `boss-patterns`, `telegraph`, `stage-flow`, `docs`.

### Critical flows (manuales — Phaser exige navegador)
1. Menú → Controles → reasignar → recargar → el cambio persiste → Restaurar.
2. Menú → Jugar → recorrer la etapa (plataformas, foso, cinco enemigos) → morir en el foso → reinicio.
3. Llegar a la arena → intro del jefe → fase 1 → fase 2 → victoria → menú.

### Playtest y tuning (notas para el autor)
- Una variable de `TUNING` por sesión; anotar valor anterior, nuevo y sensación (en tu editor hasta el paso 17; después, en `docs/PLAYTEST.md`).
- Referencia MMX: el salto debe sentirse "pesado arriba, rápido abajo". Si flota, sube `gravityY` y `jumpVelocity` juntos para mantener la altura; `pnpm test tests/tuning.test.ts` vigila que las plataformas sigan alcanzables.
- Jefe justo: cada muerte debe poder atribuirse a una lectura fallida del telegraph. Si no, sube `telegraphMs` o `recoveryMs` del ataque. Para endurecer, sube `damage`/`speed` o baja `idleMs`, nunca el telegraph por debajo de `TUNING.minTelegraphMs`.
- Objetivo de dificultad: vencer al Centinela en ≤ 10 intentos tras el ajuste final.

### Test data
Sin base de datos. Los tests construyen *fixtures* en memoria (mapas mínimos, `BossDef` de prueba, storage falso, `EventTarget` de Node) o leen el contenido real con `node:fs`. Ningún test depende del orden ni comparte estado mutable. `pnpm smoke:dist` usa el puerto fijo 4173 con `strictPort`: si está ocupado falla con un error explícito en lugar de usar otro.

### Lo que deliberadamente no se testea
Renderizado y física de Phaser (código del motor), apariencia de las texturas y tiempos reales de frame. Se cubren con los checkpoints manuales; la lógica que decide el comportamiento está extraída a módulos puros precisamente para no necesitar navegador.

---

## 14. Security & Secrets

| Preocupación | Control | Implementado en |
|---|---|---|
| Almacenamiento de secretos | No hay secretos | — |
| Rotación de secretos | NOT APPLICABLE — sin secretos | — |
| Validación de entrada | `parseBindings` valida todo lo leído de `localStorage`; `validateContent` valida contenido y mapas | `src/input/bindings.ts`, `src/content/validate.ts` |
| Output encoding / XSS | Todo texto se dibuja en el canvas con objetos de texto de Phaser; nunca `innerHTML` | `src/scenes/**` |
| Inyección SQL | NOT APPLICABLE — sin SQL | — |
| AuthN / AuthZ | NOT APPLICABLE — sin cuentas | — |
| CSRF | NOT APPLICABLE — sin servidor | — |
| Rate limiting | NOT APPLICABLE | — |
| Webhooks | NOT APPLICABLE | — |
| Auditoría de dependencias | `pnpm audit --prod` antes de publicar; el autor actualiza | manual, pre-publicación |
| Cabeceras de seguridad | Pages: archivo `_headers` opcional post-v1; itch.io controla las suyas | — |
| PII | No se almacena nada personal; solo bindings de teclado en el `localStorage` del navegador del jugador | `src/input/bindingsStore.ts` |
| Higiene de logs | Solo `console` en desarrollo; no se registra nada del jugador | — |
| Smoke server | `vite preview` escucha solo en `127.0.0.1` y se cierra en un `finally` | `scripts/smoke-dist.ts` |

No se manejan datos regulados (salud, financieros, menores, datos personales UE).

---

## 15. Accessibility

**Objetivo:** WCAG 2.2 AA en lo que un juego de canvas puede cumplir; el HTML es un único contenedor.

### Requisitos base
| Requisito | Regla en este proyecto |
|---|---|
| HTML semántico | `index.html` con `lang="es"` y `<title>`; el juego es un canvas |
| Teclado | Juego y menús se operan solo con teclado; nada requiere ratón |
| Remapeo | Todas las acciones remapeables (pasos 4–5): cubre distribuciones de teclado y movilidad distintas |
| Contraste | Texto `#e5e7eb` sobre `#0f1226` ≈ 15:1 (§7) |
| Destellos (2.3.1) | Telegraph a `TUNING.telegraphBlinkMs` = 170 ms → menos de 3 destellos/s; `tests/tuning.test.ts` lo vigila |
| Motion | Sin animación decorativa; los destellos son información de juego |
| Zoom / reflow | El canvas escala con `FIT` a cualquier ventana |

### Adiciones WCAG 2.2
| SC | Estado |
|---|---|
| 2.4.11 Focus Not Obscured | NOT APPLICABLE — no hay elementos DOM enfocables |
| 2.5.7 Dragging Movements | NOT APPLICABLE — sin arrastre |
| 2.5.8 Target Size | NOT APPLICABLE — sin objetivos de puntero |
| 3.3.7 Redundant Entry | NOT APPLICABLE — sin formularios |
| 3.3.8 Accessible Authentication | NOT APPLICABLE — sin autenticación |

### Verification
```bash
pnpm test tests/tuning.test.ts   # expect: exit 0 — incluye el límite de destellos
```
Pase manual antes de publicar: jugar la etapa completa solo con teclado tras remapear todas las acciones a teclas no-default.

---

## 16. Observability & Cost

### Instrumentation
| Señal | Herramienta | Qué captura | Quién lo mira |
|---|---|---|---|
| Errores | consola del navegador (DevTools) | excepciones durante el desarrollo | el autor |
| Logs | `console` en `scripts/` | resultado de `validate-content`, `check-dist` y `smoke-dist` | el autor / el builder |
| Métricas | NOT APPLICABLE — sin telemetría (la analítica es no-objetivo) | — | — |
| Uptime | NOT APPLICABLE — hosting estático gestionado | — | — |

### Métricas que importan
| Métrica | Objetivo | Alerta en |
|---|---|---|
| Intentos para vencer al jefe (manual; `docs/PLAYTEST.md` desde el paso 17) | 3–10 | > 15 o < 2 |
| Tamaño del entry JS de `dist/` | < 2 MB | aviso de Vite por encima de `chunkSizeWarningLimit` |

### Health check
NOT APPLICABLE como endpoint (no hay servidor). El equivalente para el artefacto es `pnpm smoke:dist`: sirve `dist/` y exige 200 + marcador en `/` y en el entry JS.

### Cost model
| Servicio | Free tier | Coste v1 | Coste 10× | Precipicio |
|---|---|---|---|---|
| Cloudflare Pages | builds mensuales limitados; tráfico estático sin cargo en el plan Free | $0 | $0 | ninguno a esta escala |
| itch.io | gratuito para juegos gratuitos | $0 | $0 | ninguno |

**Coste mensual estimado al lanzar: $0.** Ningún componente escala de forma superlineal.

---

## 17. Model Routing

NOT APPLICABLE — this project does not call an LLM at runtime.

---

## 18. Skills to Use During Build

Ninguna skill externa es imprescindible; si no está instalada, el builder sigue este blueprint y lo anota en una línea. Las skills del proyecto (`add-stage`, `add-boss`, `add-character`, `swap-art`) viajan en `workspace/.claude/skills/` y se activan solas.

| Skill | Pasos | Por qué | Install |
|---|---|---|---|
| frontend-design (se activa sola, sin `/`) | 1, 17 | Coherencia de la página contenedora y del README si el autor publica | `/plugin marketplace add anthropics/skills` y luego `/plugin install example-skills@anthropic-agent-skills` |

---

## 19. Agent Workspace

**Modo bundle:** cada artefacto de esta sección es un archivo real bajo `blueprints/kuuchil-btz/workspace/`, en la misma ruta que tendrá en el proyecto. **El archivo de `workspace/` es la fuente canónica**; esta sección lo describe y no repite su contenido, para que no existan dos copias que puedan divergir. La única copia al proyecto es la línea `rsync -a --ignore-existing blueprints/kuuchil-btz/workspace/ ./` del Bootstrap (§10): nunca sobrescribe un archivo existente y sale 0 cuando salta (a diferencia de `cp -Rn`, que en macOS sale 1). Nada fuera de `workspace/` se copia.

`.claude/commands/` no se emite: el builder es autónomo y no teclea comandos slash.

Los archivos emitidos siguen el formato que impone el `biome.json` emitido (fuente 1 del orden de configs: el config que este blueprint deja en disco): 2 espacios, comillas dobles, `;`, trailing commas en TS, ancho 100, salto de línea final. Biome solo procesa `**/*.ts` y `**/*.json`; `.md`, `.html` y `.tmj` quedan fuera de su alcance por esas `includes`.

### 19.1 `CLAUDE.md`
`workspace/CLAUDE.md` — en español, comandos primero, menos de 200 líneas: comandos (incluido `pnpm smoke:dist`), stack, camino de un frame, tabla de fronteras, fuentes únicas, reglas de código, paleta, entorno, tabla de reglas por área y no negociables.

### 19.2 `AGENTS.md`
`workspace/AGENTS.md` — stub de ~30 líneas: descripción, comandos, no negociables y puntero a `CLAUDE.md`.

### 19.3 `.claude/settings.json`
`workspace/.claude/settings.json` — `permissions.allow` cubre cada comando de los `Verify` de §9, de los Checkpoints y de §20.1:
- Verify: `pnpm test:*`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm build`, `pnpm check:dist`, `pnpm smoke:dist`, `pnpm validate:content`, `pnpm gate`, `pnpm install:*`, `grep:*`, `node scripts/validate-content.ts`, `node scripts/check-dist.ts`, `node scripts/smoke-dist.ts`.
- Checkpoints y §20.1: `git add:*`, `git commit:*`, `git tag:*`, `git log:*`, `git ls-files:*`, `git check-ignore:*`, `test:*`, `wc:*`, `tr:*`, `tail:*`.
- Bootstrap (re-ejecuciones): `rsync -a --ignore-existing:*`, `corepack enable:*`, `corepack prepare:*`, `pnpm -v`, `pnpm approve-builds:*`, `node -e:*`, `git init:*`, `git rev-parse:*`, `git config user.name:*`, `git config user.email:*`, `mkdir -p:*`.
- `deny`: leer `.env*`, `git push`, `rm -rf`, `pnpm publish`.

**Nota:** la **primera** ejecución del Bootstrap ocurre antes de que este archivo llegue a la raíz (lo instala el propio `rsync`), así que esa vez los comandos se aprueban fuera de este allowlist; desde el paso 1 todo gate corre preaprobado. Los bucles `for` de los gates manuales de §20.1 se ejecutan a mano, una vez antes de publicar.

### 19.4 Project skills
| Skill | Se activa con | Automatiza |
|---|---|---|
| `add-stage` | "nueva etapa", "stage 2", "otro mapa" | mapa Tiled + `src/content/stages/<id>/stage.ts` + registro + validación |
| `add-boss` | "nuevo jefe", "otro ataque" | `BossDef` con fases/ataques/telegraph + registro + `tests/telegraph.test.ts` |
| `add-character` | "nuevo personaje", "wall jump", "sable" | `AbilityFactory` + registro, o `CharacterDef` |
| `swap-art` | "poner arte", "cambiar sprite" | editar `MANIFEST` de placeholder a archivo |

### 19.5 `.claude/rules/*.md`
| Archivo | `paths` | Cubre |
|---|---|---|
| `.claude/rules/input.md` | `src/input/**`, `src/scenes/**`, `src/entities/**` | acciones vs teclas, proveedores, rebind, persistencia |
| `.claude/rules/content.md` | `src/content/**`, `src/assets/**`, `public/maps/**`, `scripts/**` | datos puros, registro, hitboxes, manifiesto, contrato de mapas, telegraph mínimo |
| `.claude/rules/pure-logic.md` | `src/core/**`, `src/characters/**`, `src/bosses/**`, `tests/**` | pureza, `TUNING`, habilidades, convenciones de test |

### 19.6 Verify-critical config and local infrastructure

**Manifiesto:** no hay scaffolder, así que el blueprint es el autor de `package.json` (origen 2, contenido completo con dependencias). Ningún paso de §9 lo escribe; el Bootstrap instala desde él antes del paso 1. Lo mismo vale para `scripts/check-dist.ts` y `scripts/smoke-dist.ts`: los `Verify` del paso 1 los ejecutan, así que existen antes del paso 1 y **no** figuran en el `files` de ninguna tarea (un archivo, un origen).

| Archivo | Ruta en el proyecto | Qué `Verify` lo necesita | Resolución / entorno que lleva | Exclusión del bundle |
|---|---|---|---|---|
| `package.json` | `package.json` | todos (scripts `test`, `typecheck`, `lint`, `format`, `build`, `check:dist`, `smoke:dist`, `validate:content`, `gate`) | `"type": "module"` (Node trata `scripts/*.ts` como ESM); `packageManager` fija pnpm | n/a — no recorre el árbol |
| `tsconfig.json` | `tsconfig.json` | `pnpm typecheck` en todos los pasos | `moduleResolution: "bundler"`, `allowImportingTsExtensions`, `rewriteRelativeImportExtensions`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `types: ["node"]`, `esModuleInterop`; `include` cubre `scripts` | `"exclude": ["blueprints", "dist", "node_modules"]` e `include` explícito |
| `biome.json` | `biome.json` | `pnpm lint` en todos los pasos y en el Bootstrap | ninguno: no resuelve módulos ni lee env | `"!!**/blueprints"` en `files.includes` (force-ignore: el escáner no entra, no ve el `biome.json` anidado) |
| `vite.config.ts` | `vite.config.ts` | `pnpm build` (pasos 1, 5, 6, 10, 12–17); también lo carga `preview()` en `pnpm smoke:dist` | `base: "./"`, `build.outDir: "dist"`, `chunkSizeWarningLimit: 2000`; resolución nativa de `.ts` en Vite | `optimizeDeps.entries: ["index.html"]` (no escanea `blueprints/**/index.html`) y `server.watch.ignored: ["**/blueprints/**"]` |
| `vitest.config.ts` | `vitest.config.ts` | todo `pnpm test` | entorno `node`; ningún test importa `phaser`; Vitest resuelve `.ts` igual que Vite | `exclude: ["blueprints/**", "dist/**", "node_modules/**"]`, `include: ["tests/**/*.test.ts"]` |
| `index.html` | `index.html` | `pnpm build`, `pnpm check:dist`, `pnpm smoke:dist` | `<script type="module" src="/src/main.ts">`, `<div id="game">`, `<title>kuuchil-btz</title>` | n/a |
| `scripts/check-dist.ts` | `scripts/check-dist.ts` | `pnpm check:dist` (pasos 1, 5, 6, 12, 13, 14, 16, gate) | solo `node:fs`/`node:path`; no lee env | n/a |
| `scripts/smoke-dist.ts` | `scripts/smoke-dist.ts` | `pnpm smoke:dist` (pasos 1, 5, 6, 12, 13, 14, 16, gate) | importa `preview` de `vite` (paquete instalado; Node lo resuelve desde `node_modules`) y usa el `fetch` global de Node 24; `host: "127.0.0.1"`, `port: 4173`, `strictPort: true`; cierra el servidor en `finally`; no lee env | n/a |
| `public/maps/stage-01.tmj` | `public/maps/stage-01.tmj` | `pnpm validate:content` y `tests/content-validate.test.ts` desde el paso 12 | lo lee `node:fs` vía `join("public", stage.mapPath)` | n/a |
| `.nvmrc` | `.nvmrc` | Bootstrap (`node -e …` exige 24) | `24` | n/a |
| `.gitignore` | `.gitignore` | Bootstrap (precede al primer commit) | — | `blueprints/` **no** se ignora: el bundle se commitea |

**Servicios locales:** ninguno permanente. `pnpm smoke:dist` levanta y cierra su propio `vite preview` dentro del mismo comando; ningún `Verify` necesita base de datos, cola ni contenedor; no se emite `docker-compose.yml`.

**Herramientas que leen variables de entorno:** ninguna de las invocadas por los gates lee variables del proyecto; no hace falta mecanismo de carga.

**Paquetes con resolución no trivial:** `phaser` (paquete grande con tipos propios). Solo lo cargan Vite y `tsc`, nunca Vitest ni Node — garantizado por `tests/boundaries.test.ts` y por la regla de que los tests y `scripts/` importan solo módulos puros (más `vite` en `smoke-dist.ts`, un paquete ESM normal). Ningún otro paquete mandado tiene condiciones de exportación especiales, binarios nativos que cargue el código del proyecto ni codegen.

#### Resolution convention matrix

**La convención, una vez:** especificadores relativos con extensión **`.ts`** (`import { TUNING } from "./tuning.ts"`), `import type` para todo lo que es solo tipo, y solo sintaxis TypeScript borrable. Sin alias de rutas. Los paquetes (`phaser`, `vite`, `vitest`) se importan por nombre.

| Contexto | Comando que lo ejerce | Forma que ve | Config + ajuste literal que lo hace funcionar |
|---|---|---|---|
| Código de la app (dev) | `pnpm dev` | `./x.ts` | Vite resuelve `.ts` explícito de forma nativa; `vite.config.ts` sin ajustes extra |
| Tests | `pnpm test` (`vitest run`) | `../src/x.ts` | Vitest usa la resolución de Vite; `vitest.config.ts` |
| Scripts standalone | `node scripts/validate-content.ts`, `node scripts/check-dist.ts`, `node scripts/smoke-dist.ts` | `../src/content/registry.ts`; `"vite"` | Node 24 despoja tipos y resuelve **literalmente** el `.ts`; los paquetes por nombre desde `node_modules`; `package.json` `"type": "module"`; `tsconfig.json` `"erasableSyntaxOnly": true` y `"verbatimModuleSyntax": true` garantizan que lo que typechequea también corre en Node |
| Typecheck | `pnpm typecheck` (`tsc --noEmit`) | `./x.ts` | `tsconfig.json`: `"allowImportingTsExtensions": true`, `"rewriteRelativeImportExtensions": true`, `"moduleResolution": "bundler"`, `"noEmit": true`, `include` con `scripts` |
| Build | `pnpm build` (`vite build`) | `./x.ts` | Vite reescribe todo en el bundle; `pnpm check:dist` y `pnpm smoke:dist` confirman que el entry declarado existe y se sirve |
| Lint | `pnpm lint` | — | Biome no resuelve imports; sin ajuste |

#### Cross-artifact value reconciliation

| Valor compartido | Fuente única | Literal | Otros lugares donde aparece | Comparado |
|---|---|---|---|---|
| Directorio de salida | `vite.config.ts` — `build.outDir` | `dist` | `scripts/check-dist.ts` `DIST_DIR = "dist"` · `scripts/smoke-dist.ts` `join("dist", "index.html")` · `.gitignore` `dist/` · `tsconfig.json` exclude `"dist"` · `biome.json` `"!!**/dist"` · `vitest.config.ts` `"dist/**"` · §12 output directory · `docs/DEPLOY.md` (paso 17) | yes |
| Entry del juego | `index.html` — `src="/src/main.ts"` | `/src/main.ts` | archivo `src/main.ts` (paso 1) · §3 | yes |
| Marcador del build | `src/core/gameConfig.ts` — `GAME_TITLE` | `kuuchil-btz` | `scripts/check-dist.ts` `MARKER` · `scripts/smoke-dist.ts` `MARKER` · `package.json` `name` · `index.html` `<title>` | yes |
| Puerto del smoke test | `scripts/smoke-dist.ts` — `PORT` | `4173` | `HOST` `127.0.0.1` en el mismo archivo · §12 Environments · `CLAUDE.md` · `AGENTS.md`. Distinto de `5173` (dev) a propósito | yes |
| Puerto dev | `vite.config.ts` — `server.port` | `5173` | `CLAUDE.md` · `AGENTS.md` · skill `swap-art` · §12 | yes |
| Contenedor del canvas | `index.html` — `<div id="game">` | `game` | `src/main.ts` `parent: "game"` · CSS `#game` | yes |
| Línea de escenas | `src/main.ts` — `scene` | `scene: [BootScene, MenuScene, ControlsScene, StageScene]` (forma final) | gate `grep -qF` del paso 5 (prefijo `scene: [BootScene, MenuScene, ControlsScene`) y del paso 12 (línea completa) | yes |
| Ruta del mapa | `src/content/stages/stage-01/stage.ts` — `mapPath` | `maps/stage-01.tmj` | archivo `public/maps/stage-01.tmj` · `scripts/validate-content.ts` `join("public", mapPath)` · `StageScene` `load.tilemapTiledJSON` | yes |
| Nombre del tileset | `public/maps/stage-01.tmj` — `tilesets[0].name` | `placeholder-tiles` | `stage.ts` `tilesetName` · skill `add-stage` | yes |
| Textura del tileset | `src/assets/manifest.ts` — clave | `tiles-placeholder` | `stage.ts` `tilesetTextureKey` · `.tmj` `image` (`tiles-placeholder.png`, solo informativo) | yes |
| Capas del mapa | `public/maps/stage-01.tmj` — `layers[].name` | `ground` / `spawns` | `stage.ts` `groundLayer`/`spawnLayer` · reglas del validador | yes |
| Ids de enemigos | `src/content/enemies/*.ts` — `id` | `walker`, `hopper`, `turret` | propiedades `enemyId` del `.tmj` · claves `enemy-walker`/`enemy-hopper`/`enemy-turret` de `MANIFEST` vía `textureKey` | yes |
| Id del jefe | `src/content/bosses/sentinel.ts` — `id` | `sentinel` | `stage.ts` `bossId` · clave `boss-sentinel` de `MANIFEST` vía `textureKey` | yes |
| Ruta del bundle | estructura del bundle | `blueprints/kuuchil-btz/` | `biome.json` · `tsconfig.json` · `vitest.config.ts` · `vite.config.ts` · línea `rsync` de §10 | yes |
| Versión de pnpm | `package.json` — `packageManager` | `pnpm@12.14.0` | §10 `corepack prepare pnpm@12.14.0` · §11 | yes |
| Major de Node | `.nvmrc` | `24` | `package.json` `engines` `>=24.0.0 <25` · §10 `node -e` · §10 `NODE_VERSION` (Pages) | yes |
| Clave de bindings | `src/input/bindingsStore.ts` — `BINDINGS_STORAGE_KEY` | `kuuchil-btz:bindings:v1` | `.claude/rules/input.md` · `CLAUDE.md` | yes |
| Composición del gate | `package.json` — script `gate` | `lint → typecheck → test → validate:content → build → check:dist → smoke:dist` | criterio del paso 17 · §20.1 | yes |

El contrato `index.html` ↔ salida del build ↔ servidor se ejerce en el **paso 1** (`pnpm check:dist` + `pnpm smoke:dist`), el primer paso donde existen todos sus lados. El contrato mapa ↔ etapa ↔ enemigos ↔ jefe se ejerce en el **paso 12** (`pnpm validate:content`), el primer paso donde existen todos sus lados.

#### Byte-exact artifact reconciliation

NOT APPLICABLE — this blueprint authors no byte-exact expected output. `public/maps/stage-01.tmj` se valida estructuralmente (capas, tipos de objeto, ids), y los scripts de build buscan una subcadena (`kuuchil-btz`) que el propio código emite, nunca un diff de bytes ni un literal producido por el runtime.

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El proyecto está **terminado** cuando todo esto sale 0 en un checkout limpio, desde la raíz:

```bash
pnpm install --frozen-lockfile   # expect: exit 0
pnpm lint                        # expect: exit 0, 0 errores
pnpm typecheck                   # expect: exit 0
pnpm test                        # expect: exit 0, 0 failed, 0 skipped
pnpm validate:content            # expect: exit 0, "content OK"
pnpm build                       # expect: exit 0
pnpm check:dist                  # expect: exit 0 — el entry que declara dist/index.html existe y es el build
pnpm smoke:dist                  # expect: exit 0 — vite preview sirve / y el entry con 200 y el marcador
pnpm gate                        # expect: exit 0 — las siete anteriores (lint…smoke:dist) en cadena
```

Gates manuales, una vez antes de publicar (se ejecutan a mano; usan `git`, `test`, `wc`, `tr`, `tail`, todos en el allowlist de §19.3):

- [ ] Un tag por paso: `test "$(git tag -l 'step-*' | wc -l | tr -d ' ')" -eq 17` sale 0 (17 = pasos de §9). El repositorio lo crea el Bootstrap de §10, no un scaffolder.
- [ ] Cada archivo de *Files that must be committed* está trackeado y no ignorado, una ruta por invocación y con el código afirmado:
  ```bash
  for f in package.json pnpm-lock.yaml tsconfig.json biome.json vite.config.ts vitest.config.ts index.html .nvmrc .gitignore CLAUDE.md AGENTS.md .claude/settings.json public/maps/stage-01.tmj scripts/check-dist.ts scripts/smoke-dist.ts; do
    git ls-files --error-unmatch "$f" >/dev/null                 # expect: exit 0
    rc=0; git check-ignore -q "$f" || rc=$?; test "$rc" -eq 1    # 1 = no ignorado · 128 = error de uso, y entonces falla
  done
  ```
- [ ] El `.gitignore` entró en el commit del Bootstrap: `test "$(git log --diff-filter=A --format=%s -- .gitignore | tail -n 1)" = "chore: bootstrap kuuchil-btz"` sale 0.
- [ ] El bloque Bootstrap de §10, re-ejecutado sobre el árbol ya construido, **sale 0**; `package.json` sigue listando sus seis dependencias y `pnpm lint` sigue encontrando su binario.
- [ ] Todas las filas de *Cross-artifact value reconciliation* dicen `yes`, y `pnpm lint`/`pnpm typecheck`/`pnpm test` se corrieron con `blueprints/` presente.
- [ ] *Byte-exact artifact reconciliation* es NOT APPLICABLE (no hay literales comparados byte a byte).
- [ ] Ningún no-objetivo de §1 se construyó (no existen habilidades de wall-jump o sable, proveedores de gamepad ni audio).
- [ ] Checkpoints manuales de los pasos 1, 5, 12, 13, 14 y 16 hechos por el autor en navegador; el jefe vencido en ≤ 10 intentos y las notas pasadas a `docs/PLAYTEST.md`.
- [ ] Pase solo-teclado con controles remapeados (§15).
- [ ] Si se publica: el juego carga desde la URL pública y se ensayó un rollback una vez (§12).

No hay variables de entorno de aplicación, servicios persistentes, E2E de navegador automatizado ni comando automático de accesibilidad: no aplican a este proyecto (§13, §15).

### 20.2 Risk register

| # | Riesgo | Prob. | Impacto | Señal temprana | Mitigación |
|---|---|---|---|---|---|
| 1 | El control no se siente como Mega Man X | M | A | Playtest 1 (paso 12): salto flotante o dash corto | Todo en `TUNING`; lógica pura con tests (pasos 7–9); guía de ajuste en `docs/PLAYTEST.md` (paso 17). Dueño: autor |
| 2 | Jefe injusto o "barato" | M | A | Muertes no atribuibles a error propio en el playtest 2 | Invariante de telegraph testeado (paso 15); tiempos en datos; checklist del jefe en `docs/PLAYTEST.md`. Dueño: autor |
| 3 | Scope creep más allá de un jefe | A | M | Peticiones de etapa 2, wall-jump o audio antes del paso 17 | v1 termina en el primer jefe jugable; tabla de no-objetivos con su punto de extensión; todo lo demás es post-v1. Dueño: builder (detenerse y reportar) |
| 4 | Phaser 4 es joven; `pixelArt` + `FIT` solo verificado leyendo código | M | M | Blur o costuras entre tiles en el checkpoint manual del paso 1 | Fallback de zoom entero, decisión del autor tras verlo en navegador (no del builder): en `src/core/gameConfig.ts` `SCALE_OPTIONS = { mode: "NONE", autoCenter: "CENTER_BOTH" }`; en `src/main.ts` añadir `zoom: Math.max(1, Math.floor(Math.min(innerWidth / 240, innerHeight / 160)))`; actualizar `tests/game-config.test.ts` al nuevo valor |
| 5 | `localStorage` no disponible (modo privado, iframe de itch.io) | M | B | `saveBindings` devuelve `false` | Caída a defaults en memoria y mensaje en Controles (pasos 4–5) |
| 6 | Casos borde no verificados de pnpm 12 / Vite 8 (incluido `preview()` programático y `previewServer.close()`) | M | M | `pnpm install`, `pnpm build` o `pnpm smoke:dist` fallan en el Bootstrap o el paso 1 | Fallback `approve-builds` en el Bootstrap; smoke test del Bootstrap y del paso 1 antes de entregar; pins marcados UNVERIFIED en §11 |
| 7 | Cambiar arte rompe hitboxes | B | A | Combate distinto tras `swap-art` | Hitboxes en datos, nunca derivadas del sprite; `tests/content-registry.test.ts` valida hitboxes; la skill `swap-art` lo prohíbe |

### 20.3 Decision log

| # | Decisión | Alternativa rechazada | Por qué | Se revierte si |
|---|---|---|---|---|
| 1 | Track ts-node como tooling, app solo-cliente | Godot / Unity | Juego web sin instalación, un solo idioma, tests en Node | Se necesita exportar a consola o móvil nativo |
| 2 | Phaser 4.2.1 | Phaser 3 | v4 es el `latest` estable con tipos propios | El checkpoint del paso 1 muestra fallos de render que el fallback de zoom no resuelve |
| 3 | TypeScript 6 | TypeScript 7 | 7 no está probado con los tipos de Phaser | Phaser declara compatibilidad con TS 7 |
| 4 | Especificadores `.ts` + Node nativo para scripts | `tsx` como runner | Una dependencia menos; la misma convención en todos los cargadores | Node deja de despojar tipos por defecto |
| 5 | Lógica pura separada de Phaser | Tests con Phaser + jsdom/canvas | Phaser exige `window`; los tests puros son rápidos y deterministas | Aparece un bug que solo existe en la integración con Phaser y se repite |
| 6 | Contenido como módulos TS + `.tmj` | JSON puro para todo el contenido | Tipado y autocompletado; el validador cubre lo que el tipo no | El autor quiere editar contenido sin tocar TS |
| 7 | `KeyboardEvent.code` y listeners DOM en el proveedor | Teclado de Phaser (`this.input.keyboard`) | Independiente de la distribución de teclado y testeable con el `EventTarget` de Node | Un proveedor necesita algo que solo Phaser expone |
| 8 | Rebind con intercambio de conflictos | Rechazar conflictos | Menos fricción: nunca queda una acción sin tecla | Se piden varias teclas por acción |
| 9 | Sin GameOverScene: K.O. reinicia la etapa | Pantalla de game over | Reintento inmediato, propio de un juego de jefes difíciles | Se añaden vidas/continues |
| 10 | Texturas por Canvas 2D (`drawPlaceholder`) | `Graphics.generateTexture` | El dibujo es puro y testeable; solo `textures.addCanvas` toca Phaser | `addCanvas` no existe en v4 (fallback documentado en el paso 6) |
| 11 | Sitio estático (Pages / itch.io) | Servidor propio | No hay nada dinámico que servir; $0 | Se añaden leaderboards |
| 12 | Biome con `assist` desactivado | Orden de imports obligatorio | Un gate menos que se rompe por estilo; `pnpm format` sigue formateando | Se quiere orden de imports uniforme |
| 13 | Smoke del build con `preview()` de Vite + `fetch` en un script Node | Playwright con navegador headless | Sirve y pide el artefacto real sin descargar navegadores ni añadir dependencias | Se necesita verificar el render del canvas automáticamente |

### 20.4 What to build next

1. **Wall-jump** — cuando el playtest del jefe 1 esté cerrado (`add-character`).
2. **Etapa 2 + jefe 2** — con la segunda etapa vuelven el guardado y el selector de etapa (`add-stage`, `add-boss`).
3. **Audio** — cuando el autor tenga pistas y SFX (`StageDef.music`, `MANIFEST`).
4. **Proveedor de gamepad** — cuando el autor quiera jugar con mando (`InputProvider`).
5. **Arte real** — en cuanto existan sprites (`swap-art`).

---

*Fin del blueprint. El orden de construcción es §9. Detente cuando §20.1 esté en verde.*
