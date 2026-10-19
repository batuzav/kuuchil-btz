# Epic 03: Combate, jefe y entrega

> Al terminar el jugador recibe daño y muere/reinicia, los enemigos actúan desde datos, el Centinela pelea en dos fases con telegraph obligatorio y flujo de victoria/derrota, y el proyecto queda documentado con el gate final en verde.

| | |
|---|---|
| **Epic id** | `03-combate-jefe-entrega` |
| **Tasks** | `E3-T1` … `E3-T5` (pasos 13–17) |
| **Depends on** | `01-fundacion-entrada`, `02-movimiento-escenario` |
| **Unlocks** | nada — es el último epic de v1 |
| **Parallel with** | `E3-T3` puede correr junto a `E3-T1`/`E3-T2` (no comparte archivos) |

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
| Gate completo | `pnpm gate` (lint → typecheck → test → validate:content → build → check:dist → smoke:dist) |
| Servicios locales | ninguno permanente; `smoke:dist` abre y cierra su propio servidor |

**Gate:** `pnpm format`, luego `pnpm typecheck && pnpm lint && pnpm test` pasa antes de marcar cualquier tarea como hecha.

## Directory subtree

```
src/
  core/
    tuning.ts                  # existe — solo lectura
    health.ts                  # NUEVO E3-T1
    enemyAi.ts                 # NUEVO E3-T2
    stageFlow.ts               # NUEVO E3-T4
  bosses/
    fsm.ts                     # NUEVO E3-T3
    patterns.ts                # NUEVO E3-T3
  entities/
    Player.ts                  # existe; editado en E3-T1
    Projectile.ts              # existe — solo lectura (fireProjectile)
    Enemy.ts                   # NUEVO E3-T2
    Boss.ts                    # NUEVO E3-T4
  scenes/
    StageScene.ts              # existe; editado en E3-T1, E3-T2, E3-T4
    hud.ts                     # NUEVO E3-T1; editado en E3-T4
  content/**, assets/**        # existen — solo lectura
scripts/check-dist.ts, scripts/smoke-dist.ts   # existen (workspace) — solo lectura
README.md                      # NUEVO E3-T5
docs/PLAYTEST.md               # NUEVO E3-T5
docs/DEPLOY.md                 # NUEVO E3-T5
tests/
  health.test.ts               # E3-T1
  enemy-ai.test.ts             # E3-T2
  boss-fsm.test.ts             # E3-T3
  boss-patterns.test.ts        # E3-T3
  telegraph.test.ts            # E3-T3
  stage-flow.test.ts           # E3-T4
  docs.test.ts                 # E3-T5
```

Todo lo que esté fuera de este subárbol queda fuera de alcance. Si una tarea parece requerir editar otro archivo, detente y repórtalo.

## Data model touched here

| Entidad | Campos que este epic lee | Notas |
|---|---|---|
| `EnemyDef` (`walker`, `hopper`, `turret`) | `behavior`, `hitbox`, `maxHp`, `contactDamage`, `speed`, `jumpVelocity`, `actionIntervalMs`, `rangePx`, `projectileSpeed`, `projectileDamage` | hopper: 1400 ms, 260 px/s; turret: 1800 ms, 128 px, 100 px/s |
| `BossDef` `sentinel` | `maxHp` 32, `introMs` 1200, 2 fases (`phase-2` entra a 0.5), ataques `dash`/`spread`/`slam` con `telegraphMs` 600/500/700 | ya registrado |
| `CharacterDef` `kuuchil` | `maxHp` 16, `shotDamage` 1 | ya registrado |
| `TUNING` | `invulnerabilityMs`, `knockbackSpeed`, `minTelegraphMs`, `telegraphBlinkMs`, `deathRestartDelayMs` | |

## Contracts

**Consumed** — ya existe, no lo reconstruyas:

| De | Interfaz | Garantía |
|---|---|---|
| `01` | `TUNING`, `PALETTE`, `TEXT_STYLE`, `keyLabel`, `createSceneInput` | |
| `01` | `extractSpawns(map, spawnLayer): StageSpawns \| null` | `enemies[]` con `enemyId`, `bossTriggers[]`, `bossSpawns[]` |
| `01` | `CONTENT`, `getEnemy`, `getBoss` | |
| `02` | `fireProjectile(group, x, y, vx, vy, textureKey, damage, owner, lifetimeMs)` | datos `damage`/`owner` en el sprite |
| `02` | `class Player` con `update(snapshot, dtMs)` | hitbox de datos, balas en su grupo |
| `02` | `StageScene` con tilemap, capa `ground` colisionable, cámara y pausa | |
| Bootstrap | `pnpm check:dist`, `pnpm smoke:dist`, script `gate` en `package.json` | leen y sirven `dist/` (puerto 4173) |

**Produced** — contratos finales de v1:

| Export | Firma | Usado por |
|---|---|---|
| `src/core/health.ts` → `createHealth`, `applyDamage`, `tickHealth`, `isDead`, `hpFraction` | ver E3-T1 | Player, Enemy, Boss |
| `src/core/enemyAi.ts` → `walkerDirection`, `hopperStep`, `turretStep` | ver E3-T2 | Enemy |
| `src/bosses/fsm.ts` → `BossState`, `phaseIndexFor`, `createBossState`, `stepBoss` | ver E3-T3 | Boss, `tests/telegraph.test.ts`, skill `add-boss` |
| `src/bosses/patterns.ts` → `dashVelocity`, `spreadVelocities`, `slamVelocity` | ver E3-T3 | Boss |
| `src/core/stageFlow.ts` → `nextFlow(state, event)` | ver E3-T4 | StageScene |

## Conventions that bite in this area

- **La lógica que decide va en `src/core`/`src/bosses` y se testea; las entidades Phaser solo la ejecutan.** Si un comportamiento no se puede probar sin navegador, falta extraer una función pura.
- **El motor de jefes es genérico**: `fsm.ts` y `patterns.ts` no mencionan `sentinel` ni ningún id concreto.
- **Telegraph nunca por debajo de `TUNING.minTelegraphMs`**; el destello alterna cada `TUNING.telegraphBlinkMs` (menos de 3 destellos/s).
- **Imports relativos con `.ts`** e `import type` para tipos; sin `enum` ni propiedades de parámetro; ningún test importa `phaser`.
- **El puerto 4173 debe estar libre** para `pnpm smoke:dist`; no dejes un `pnpm preview` abierto.
- Ejecuta `pnpm format` antes de los `Verify`.

Reglas completas: `CLAUDE.md`. Reglas de área: `.claude/rules/pure-logic.md`, `.claude/rules/content.md`, `.claude/rules/input.md`. Todos están en la raíz del proyecto desde el Bootstrap.

---

## Tasks

En el mismo orden que `tasks.json`. Trabaja de arriba abajo y no reordenes por prioridad.

### `E3-T1` — Add health, damage, HUD and death restart

**Depends on:** `E2-T6` · **Priority:** p0 — metadato para recortes de alcance, no un orden

`src/core/health.ts`: `type HealthState = { readonly hp: number; readonly maxHp: number; readonly invulnMs: number }`; `createHealth(maxHp)`; `applyDamage(s, amount, invulnerabilityMs): { state: HealthState; applied: boolean }` (si `invulnMs > 0` no aplica; si aplica, `hp = max(0, hp − amount)` e `invulnMs = invulnerabilityMs`); `tickHealth(s, dtMs)` (resta hasta 0); `isDead(s)`; `hpFraction(s)` (0..1). `src/scenes/hud.ts`: `createHud(scene)` dibuja con `setScrollFactor(0)` el marco 50×6 en (4,4) con relleno `PALETTE.hpPlayer`, y el marco del jefe en (186,4) oculto; devuelve `{ setPlayer(fraction: number): void; setBoss(fraction: number | null): void; showMessage(text: string | null): void }` (mensaje centrado con `TEXT_STYLE`); en esta tarea `setBoss` solo oculta/muestra el marco. `src/entities/Player.ts` (edición): `health = createHealth(def.maxHp)`; `takeDamage(amount, fromX)` con `applyDamage(…, TUNING.invulnerabilityMs)` y, si aplica, retroceso `TUNING.knockbackSpeed` alejándose de `fromX`; alpha 0.4/1 cada 100 ms mientras `invulnMs > 0`; `tickHealth` en `update`. `src/scenes/StageScene.ts` (edición): HUD cada frame; si `player.y > map.heightInPixels + 16` → `takeDamage(def.maxHp, player.x)`; si muerto → `showMessage("K.O.")`, deja de pasar entrada al jugador y `this.time.delayedCall(TUNING.deathRestartDelayMs, () => this.scene.restart({ stageId }))`.

**Files**
- `src/core/health.ts` — nuevo
- `tests/health.test.ts` — nuevo
- `src/scenes/hud.ts` — nuevo
- `src/entities/Player.ts` — edición: vida, daño, retroceso, parpadeo
- `src/scenes/StageScene.ts` — edición: HUD, foso mortal, K.O. y reinicio

**Acceptance**

Copiado literal del arreglo `acceptance` de esta tarea en `tasks.json`.

1. **WHEN** `applyDamage` hits a state whose `invulnMs` is 0 **THE SYSTEM SHALL** reduce `hp` by the amount, never below 0, set `invulnMs` to the given window and return `applied: true`.
2. **WHEN** `applyDamage` hits a state whose `invulnMs` is above 0 **THE SYSTEM SHALL** return `applied: false` with `hp` unchanged.
3. **WHEN** `tickHealth` advances by at least the remaining `invulnMs` **THE SYSTEM SHALL** return `invulnMs` 0.
4. **WHEN** `hp` reaches 0 **THE SYSTEM SHALL** report `isDead` true and `hpFraction` 0.
5. **WHEN** `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run **THE SYSTEM SHALL** exit 0.

**Verify** — cada comando, en orden, desde la raíz del proyecto.

```bash
pnpm test tests/health.test.ts
pnpm typecheck
pnpm lint
pnpm build
pnpm check:dist
pnpm smoke:dist
```

Checkpoint manual del autor (no es gate): caer al foso muestra "K.O." y reinicia en ~1.2 s; la barra verde queda fija en pantalla.

**Checkpoint**

```bash
git add -A && git commit -m "step 13: health, damage, hud and restart"
git tag step-13-health-hud
```

Ejecuta ambos tras el último `Verify` en verde. El tag es el objetivo de rollback; cópialo del campo `checkpoint`.

### `E3-T2` — Add data-driven enemies to the stage

**Depends on:** `E3-T1` · **Priority:** p0

`src/core/enemyAi.ts` (puro): `walkerDirection(dir: 1 | -1, blockedAhead: boolean, groundAhead: boolean): 1 | -1`; `hopperStep(timerMs: number, dtMs: number, def: EnemyDef, grounded: boolean): { timerMs: number; jump: boolean }` (acumula con tope en `actionIntervalMs`; salta solo si `grounded` y llegó al intervalo, y entonces timer = 0); `turretStep(timerMs: number, dtMs: number, def: EnemyDef, distanceToPlayer: number): { timerMs: number; fire: boolean }` (acumula con tope; dispara solo si `distanceToPlayer ≤ rangePx` y llegó al intervalo, y entonces timer = 0). `src/entities/Enemy.ts`: `export class Enemy extends Phaser.Physics.Arcade.Sprite` con `(scene, x, y, def: EnemyDef)`, origen (0.5,1), hitbox desde `def.hitbox`, `health = createHealth(def.maxHp)`; `update(dtMs, player, ground: Phaser.Tilemaps.TilemapLayer, enemyShots)`: walker usa `ground.getTileAtWorldXY(x + dir·10, y + 2)` para `groundAhead` y el bloqueo izquierdo/derecho del body para `blockedAhead`; hopper aplica `speed` hacia el jugador y `-jumpVelocity` al saltar; turret llama `fireProjectile(enemyShots, x, y − 8, def.projectileSpeed · signo hacia el jugador, 0, "projectile-enemy", def.projectileDamage, "enemy", 2000)` cuando `fire`. `src/scenes/StageScene.ts` (edición): crea un `Enemy` por cada `extractSpawns(...).enemies` con `getEnemy(enemyId)`; collider enemigos↔capa; balas del jugador↔enemigos (`applyDamage(health, damage, 0)`, destruye la bala, destruye el enemigo al morir); jugador↔enemigos (`player.takeDamage(def.contactDamage, enemy.x)`); balas enemigas↔jugador.

**Files**
- `src/core/enemyAi.ts` — nuevo
- `tests/enemy-ai.test.ts` — nuevo
- `src/entities/Enemy.ts` — nuevo
- `src/scenes/StageScene.ts` — edición: spawns de enemigos y colisiones

**Acceptance**

1. **WHEN** `walkerDirection` is told the path ahead is blocked or has no ground **THE SYSTEM SHALL** return the reversed direction, and SHALL keep the direction otherwise.
2. **WHEN** a hopper's timer reaches its `actionIntervalMs` while grounded **THE SYSTEM SHALL** return `jump: true` once and reset the timer to 0, and SHALL not jump while airborne.
3. **WHEN** a turret's timer reaches its `actionIntervalMs` with the player within `rangePx` **THE SYSTEM SHALL** return `fire: true`, and SHALL never return `fire: true` while the player is beyond `rangePx`.
4. **WHEN** `pnpm test tests/boundaries.test.ts`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/enemy-ai.test.ts
pnpm test tests/boundaries.test.ts
pnpm typecheck
pnpm lint
pnpm build
pnpm check:dist
pnpm smoke:dist
```

Checkpoint manual del autor (no es gate): cinco enemigos donde marca el mapa; el caminante gira en bordes; la torreta dispara solo con el jugador cerca.

**Checkpoint**

```bash
git add -A && git commit -m "step 14: data-driven enemies in stage"
git tag step-14-enemies
```

### `E3-T3` — Add boss FSM engine and telegraph invariant

**Depends on:** `E2-T6` · **Priority:** p0

`src/bosses/fsm.ts` (puro, genérico): `type BossStateKind = "intro" | "idle" | "telegraph" | "active" | "recovery" | "defeated"`; `type BossState = { readonly kind: BossStateKind; readonly timerMs: number; readonly phaseIndex: number; readonly cycleIndex: number; readonly attackId: string | null }`; `phaseIndexFor(phases, hpFraction)` (último índice con `hpFraction ≤ enterAtHpFraction`); `createBossState(def)` → `intro` con `timerMs = def.introMs`; `stepBoss(def, state, dtMs, hp)`: si `hp ≤ 0` → `defeated` (para siempre). Si no, resta `dtMs`; al llegar a ≤ 0: `intro → idle` (fase calculada, `cycleIndex 0`, timer `idleMs`); `idle → telegraph` (`attackId = attackCycle[cycleIndex % length]`, timer `telegraphMs`); `telegraph → active` (timer `activeMs`); `active → recovery` (timer `recoveryMs`); `recovery → idle` (recalcula la fase; si cambió, `cycleIndex = 0`, si no `cycleIndex + 1`; timer `idleMs` de la fase). El sobrante del timer no se arrastra. `src/bosses/patterns.ts` (puro): `dashVelocity(bossX, playerX, speed): number` (signo hacia el jugador; si coinciden, `+speed`); `spreadVelocities(count, speed, facing: 1 | -1): { vx: number; vy: number }[]` (ángulos uniformes en [−20°, +20°]; `count 1` → 0°; magnitud `speed`; `vx` con el signo de `facing`); `slamVelocity(bossX, playerX, speed): { vx: number; vy: number }` (`vy = −speed`; `vx = playerX − bossX` acotado a ±80). `tests/boss-fsm.test.ts` usa un `BossDef` fixture de dos fases definido en el propio test. `tests/telegraph.test.ts` recorre `CONTENT.bosses` (hoy `sentinel`) a `hp = maxHp` y `hp = maxHp / 2`, 20000 ms en pasos de 16 ms, acumulando el tiempo en `telegraph` antes de cada entrada a `active`, y comprueba `telegraphMs ≥ TUNING.minTelegraphMs` en cada ataque.

**Files**
- `src/bosses/fsm.ts` — nuevo
- `src/bosses/patterns.ts` — nuevo
- `tests/boss-fsm.test.ts` — nuevo
- `tests/boss-patterns.test.ts` — nuevo
- `tests/telegraph.test.ts` — nuevo

**Acceptance**

1. **WHEN** `stepBoss` advances a boss from `createBossState` at full hp **THE SYSTEM SHALL** visit `intro`, `idle`, `telegraph`, `active`, `recovery` in that order and then return to `idle`.
2. **WHEN** the hp fraction drops to a later phase's `enterAtHpFraction` **THE SYSTEM SHALL** switch `phaseIndex` on the next entry to `idle` and restart that phase's `attackCycle` at index 0.
3. **WHEN** hp is 0 in any state **THE SYSTEM SHALL** enter `defeated` and remain there on every later step.
4. **WHEN** `pnpm test tests/telegraph.test.ts` simulates every registered boss for 20000 ms at full and at half hp in 16 ms steps **THE SYSTEM SHALL** never enter `active` before spending at least that attack's `telegraphMs` in `telegraph`, and every attack's `telegraphMs` SHALL be at least `TUNING.minTelegraphMs`.
5. **WHEN** `spreadVelocities(3, 120, 1)` runs **THE SYSTEM SHALL** return 3 vectors of magnitude 120 (within 0.001), symmetric around the horizontal and with positive `vx`.
6. **WHEN** `pnpm typecheck` and `pnpm lint` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/boss-fsm.test.ts
pnpm test tests/boss-patterns.test.ts
pnpm test tests/telegraph.test.ts
pnpm typecheck
pnpm lint
```

**Checkpoint**

```bash
git add -A && git commit -m "step 15: boss fsm engine and telegraph invariant"
git tag step-15-boss-engine
```

### `E3-T4` — Add boss fight and win/lose flow

**Depends on:** `E3-T2`, `E3-T3` · **Priority:** p0

`src/core/stageFlow.ts`: `type StageFlowState = "exploring" | "bossIntro" | "bossFight" | "won" | "lost"`; `type StageFlowEvent = "enteredBossTrigger" | "bossIntroDone" | "bossDefeated" | "playerDied" | "restart"`; `nextFlow(state, event)` con exactamente estas transiciones (todo lo demás devuelve el mismo estado): `exploring + enteredBossTrigger → bossIntro`; `bossIntro + bossIntroDone → bossFight`; `bossFight + bossDefeated → won`; `exploring|bossIntro|bossFight + playerDied → lost`; `lost + restart → exploring`. `src/entities/Boss.ts`: `export class Boss extends Phaser.Physics.Arcade.Sprite` con `(scene, x, y, def: BossDef)`, hitbox de datos, `health = createHealth(def.maxHp)`, `fsm = createBossState(def)`; `update(dtMs, player, bossShots)`: `fsm = stepBoss(def, fsm, dtMs, health.hp)`; en `telegraph` alterna `setTintFill(PALETTE.telegraph)` / `clearTint()` cada `TUNING.telegraphBlinkMs`; al entrar en `active` ejecuta el patrón: `dash` → `setVelocityX(dashVelocity(...))`; `shot-spread` → una bala por vector de `spreadVelocities(count, speed, signo hacia el jugador)` con `fireProjectile(bossShots, …, "projectile-enemy", attack.damage, "enemy", 2000)`; `slam` → `setVelocity(slam.vx, slam.vy)`; en `recovery` `setVelocityX(0)`. `currentContactDamage()` = `attack.damage` en `active` de `dash`/`slam`; si no, `def.contactDamage`. `src/scenes/StageScene.ts` (edición): estado `flow` con `nextFlow`; overlap jugador↔zona de cada `bossTriggers` → `enteredBossTrigger`: `cameras.main.setBounds(trigger.x, 0, map.widthInPixels − trigger.x, map.heightInPixels)`, `physics.world.setBounds(trigger.x, 0, map.widthInPixels − trigger.x, map.heightInPixels + 64)`, crea el `Boss` en `bossSpawns[0]` con `getBoss(stage.bossId)` y muestra su barra; cuando `boss.fsm.kind` deja `intro` → `bossIntroDone`; balas del jugador → `applyDamage(boss.health, damage, 0)`; contacto → `player.takeDamage(boss.currentContactDamage(), boss.x)`; balas del jefe → `takeDamage`; `defeated` → `bossDefeated` → mensaje "VICTORIA - Z: menú" (con `keyLabel` real) y `pressed.jump` → `MenuScene`; muerte del jugador → `playerDied` → "K.O." y reinicio (reemplaza la lógica directa de `E3-T1`). `src/scenes/hud.ts` (edición): `setBoss(fraction)` rellena la barra con `PALETTE.hpBoss` proporcional; `null` la oculta.

**Files**
- `src/core/stageFlow.ts` — nuevo
- `tests/stage-flow.test.ts` — nuevo
- `src/entities/Boss.ts` — nuevo
- `src/scenes/StageScene.ts` — edición: trigger, arena, jefe, flujo
- `src/scenes/hud.ts` — edición: barra del jefe

**Acceptance**

1. **WHEN** `nextFlow("exploring", "enteredBossTrigger")` runs **THE SYSTEM SHALL** return `bossIntro`, and `nextFlow("bossIntro", "bossIntroDone")` SHALL return `bossFight`.
2. **WHEN** `bossFight` receives `bossDefeated` **THE SYSTEM SHALL** return `won`, and `won` SHALL stay `won` on `playerDied`.
3. **WHEN** any state other than `won` receives `playerDied` **THE SYSTEM SHALL** return `lost`, and `nextFlow("lost", "restart")` SHALL return `exploring`.
4. **WHEN** `pnpm test` runs the whole suite **THE SYSTEM SHALL** exit 0 with 0 failed.
5. **WHEN** `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm check:dist` and `pnpm smoke:dist` run **THE SYSTEM SHALL** exit 0.

**Verify**

```bash
pnpm test tests/stage-flow.test.ts
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm check:dist
pnpm smoke:dist
```

Checkpoint manual del autor (playtest 2, no es gate): al cruzar x=720 la cámara se fija a la arena; el Centinela parpadea antes de **cada** ataque; la fase 2 añade el slam y acorta las esperas; cada ataque deja una ventana de castigo; vencerlo muestra la victoria y morir reinicia. Anota intentos y sensaciones en tu editor o libreta: `docs/PLAYTEST.md` se crea en `E3-T5`, donde se pasan a limpio.

**Checkpoint**

```bash
git add -A && git commit -m "step 16: boss fight and win/lose flow"
git tag step-16-boss-fight
```

### `E3-T5` — Add docs, production build and final gate

**Depends on:** `E3-T4` · **Priority:** p1

`README.md`: qué es, requisitos (Node 24, pnpm vía corepack), la tabla de comandos de `CLAUDE.md` (incluidos `pnpm check:dist` y `pnpm smoke:dist`), controles por defecto (flechas, Z saltar, X disparar, C dash, Esc pausa) y referencias a `docs/PLAYTEST.md`, `docs/DEPLOY.md` y a las skills de `.claude/skills/`. Toda ruta de archivo en backticks debe existir (p. ej. `src/core/tuning.ts`, `src/content/registry.ts`, `public/maps/stage-01.tmj`); las rutas futuras se escriben con `<…>`. `docs/PLAYTEST.md`: tabla con **cada** clave de `TUNING` (`runSpeed`, `gravityY`, `jumpVelocity`, `jumpCutMultiplier`, `maxFallSpeed`, `coyoteTimeMs`, `jumpBufferMs`, `dashSpeed`, `dashDurationMs`, `dashCooldownMs`, `shotSpeed`, `shotCooldownMs`, `shotLifetimeMs`, `maxShotsOnScreen`, `invulnerabilityMs`, `knockbackSpeed`, `minTelegraphMs`, `telegraphBlinkMs`, `deathRestartDelayMs`) con valor actual, efecto y sensación al subir/bajar; procedimiento (una variable por sesión; si el salto flota, subir `gravityY` y `jumpVelocity` juntos; para endurecer al jefe, subir `damage`/`speed` o bajar `idleMs`, nunca el telegraph bajo el mínimo); checklist del jefe (¿cada ataque se lee?, ¿hay ventana de castigo?, ¿cada muerte es atribuible a un error propio?); plantilla de registro de intentos (objetivo: vencerlo en ≤ 10 intentos), donde se pasan a limpio las notas de los playtests de `E2-T6` y `E3-T4`. `docs/DEPLOY.md`: `pnpm build` → `dist/`; comprobar con `pnpm smoke:dist`; Cloudflare Pages (build command `pnpm build`, output `dist/`, `NODE_VERSION=24` en la configuración del proyecto de Pages; ningún código la lee); itch.io (zip del **contenido** de `dist/` con `index.html` en la raíz, tipo HTML, viewport 960×640); rollback (Pages: "Rollback to this deployment"; itch.io: re-subir el zip anterior, uno por tag). `tests/docs.test.ts`: extrae las rutas entre backticks de `README.md`, `docs/PLAYTEST.md`, `docs/DEPLOY.md` y cada `.claude/skills/*/SKILL.md` con la expresión regular `` /`([^`\s]+)`/g ``; se queda con las que empiezan por `src/`, `public/`, `scripts/` o `tests/`, terminan en extensión (`/\.[a-z]+$/`) y no contienen `<` ni `*`; afirma `existsSync` de cada una; afirma que `docs/PLAYTEST.md` contiene cada `Object.keys(TUNING)` y que `docs/DEPLOY.md` contiene `pnpm build` y `dist/`.

**Files**
- `README.md` — nuevo
- `docs/PLAYTEST.md` — nuevo
- `docs/DEPLOY.md` — nuevo
- `tests/docs.test.ts` — nuevo

**Acceptance**

1. **WHEN** `pnpm test tests/docs.test.ts` runs **THE SYSTEM SHALL** assert that every backticked path in `README.md`, `docs/PLAYTEST.md`, `docs/DEPLOY.md` and `.claude/skills/*/SKILL.md` that starts with `src/`, `public/`, `scripts/` or `tests/`, has a file extension and contains no `<` or `*` exists on disk.
2. **WHEN** `pnpm test tests/docs.test.ts` runs **THE SYSTEM SHALL** assert `docs/PLAYTEST.md` contains every key of `TUNING` and `docs/DEPLOY.md` contains `pnpm build` and `dist/`.
3. **WHEN** `pnpm install --frozen-lockfile` runs **THE SYSTEM SHALL** exit 0.
4. **WHEN** `pnpm gate` runs **THE SYSTEM SHALL** run lint, typecheck, test, validate:content, build, check:dist and smoke:dist in that order and exit 0.

**Verify**

```bash
pnpm test tests/docs.test.ts
pnpm install --frozen-lockfile
pnpm gate
```

**Checkpoint**

```bash
git add -A && git commit -m "step 17: docs, production build and final gate"
git tag step-17-release
```

---

## Epic acceptance

El epic está hecho cuando cada tarea está `done` **y**:

1. **WHEN** `pnpm gate` runs on the final tree **THE SYSTEM SHALL** exit 0.
2. **WHEN** a boss attack's `telegraphMs` is lowered below `TUNING.minTelegraphMs` **THE SYSTEM SHALL** fail both `pnpm test tests/telegraph.test.ts` and `pnpm validate:content` (proved by the invariant test and by the fixture case in `tests/content-validate.test.ts`).

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm gate
```

## Pitfalls

- **Bajar el telegraph para subir la dificultad** — viola la regla de justicia y rompe `tests/telegraph.test.ts`. Sube `damage`, `speed` o baja `idleMs`.
- **Destello más rápido que `TUNING.telegraphBlinkMs`** — supera 3 destellos por segundo (riesgo fotosensible).
- **Lógica de decisión dentro de `Enemy.ts`/`Boss.ts`** — no testeable sin navegador; va en `src/core/enemyAi.ts` y `src/bosses/`.
- **Rutas futuras sin `<…>` en docs o skills** — `tests/docs.test.ts` las trata como archivos que deben existir.
- **Puerto 4173 ocupado** — `pnpm smoke:dist` (y por tanto `pnpm gate`) falla por `strictPort`; cierra cualquier `pnpm preview` antes.

## Before moving on

- [ ] Las 5 tareas están `done` en `tasks.json`; ninguna en `in_progress`.
- [ ] Pasaron todos los `verify` de cada tarea, no solo el primero.
- [ ] Ningún `verify` se editó ni se saltó porque faltara un archivo.
- [ ] Existen los tags `step-13-health-hud` … `step-17-release` (`git tag -l 'step-*'`).
- [ ] El gate pasa limpio desde la raíz del proyecto.
- [ ] Cada contrato "Produced" existe con la firma indicada.
- [ ] Ningún archivo fuera del subárbol se modificó.
- [ ] Este proyecto no tiene variables de entorno; no hay `.env.example` que actualizar.
- [ ] Un commit por tarea, cada uno seguido de su tag.
