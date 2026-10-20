# kuuchil-btz

Plataformas de acción 2D para navegador, centrado en jefes difíciles pero justos (sensación Mega Man X/Zero, estética GBA 240×160). Prototipo personal del autor; sin backend.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `pnpm install` (CI: `pnpm install --frozen-lockfile`) |
| Dev server | `pnpm dev` — http://localhost:5173 |
| Build producción | `pnpm build` → `dist/` |
| Comprobar build | `pnpm check:dist` (index.html → entry JS existe y contiene `kuuchil-btz`) |
| Servir y probar build | `pnpm smoke:dist` (`vite preview` en http://127.0.0.1:4173, pide `/` y el entry JS, espera 200 + `kuuchil-btz`) |
| Preview manual | `pnpm preview` |
| Typecheck | `pnpm typecheck` |
| Lint + formato (check) | `pnpm lint` · arreglar: `pnpm format` |
| Tests | `pnpm test` · un archivo: `pnpm test tests/<archivo>.test.ts` |
| Validar contenido | `pnpm validate:content` (`node scripts/validate-content.ts`) |
| Gate completo | `pnpm gate` |

**Gate:** ejecuta `pnpm format` y después `pnpm typecheck && pnpm lint && pnpm test`; todo en verde antes de marcar cualquier tarea como hecha. Si tocaste `src/content/**` o `public/maps/**`, también `pnpm validate:content`.

Runtime fijado en `.nvmrc` (Node 24) y `packageManager` (pnpm) en `package.json`. Las versiones de dependencias están en `pnpm-lock.yaml`: léelo, nunca adivines una.

Orden de construcción: `blueprints/kuuchil-btz/tasks.json` + `blueprints/kuuchil-btz/epics/`. No lo repitas aquí.

## Stack

Phaser 4 (Arcade physics, cargador Tiled JSON) · TypeScript 6 · Vite 8 · Vitest · Biome · pnpm · sitio estático (Cloudflare Pages o zip HTML5 de itch.io). Sin backend, sin auth, sin DB, sin variables de entorno en el código.

## Arquitectura

**Camino de un frame.** `index.html` → `src/main.ts` (crea `Phaser.Game` con `src/core/gameConfig.ts`) → `BootScene` (genera texturas de `src/assets/manifest.ts`, carga bindings) → `MenuScene` → `StageScene`. Cada frame `StageScene` llama `input.update()` (`src/scenes/sceneInput.ts` → `InputManager` → `keyboardProvider`) y pasa el `ActionSnapshot` a `Player`, que ejecuta las habilidades de su personaje (`src/characters/abilities/*`) y aplica sus efectos al cuerpo Arcade. `Boss` avanza `stepBoss` (`src/bosses/fsm.ts`) y ejecuta patrones de `src/bosses/patterns.ts`. El flujo de la etapa lo decide `nextFlow` (`src/core/stageFlow.ts`).

**Contenido como datos.** Etapas, jefes, enemigos y personajes son módulos de datos en `src/content/**`, registrados en `src/content/registry.ts` (`CONTENT`). `node scripts/validate-content.ts` los carga sin bundler y valida los mapas `.tmj`.

**Fronteras.**

| Capa | Puede importar | Nunca |
|---|---|---|
| `src/core/**`, `src/bosses/**`, `src/characters/**` | `core`, `content/types.ts`, `input/actions.ts` | `phaser`, escenas, entidades |
| `src/input/**` | `input` | `phaser`, escenas |
| `src/content/**` | `content`, `core/tuning.ts` | `phaser`, `assets`, escenas |
| `src/assets/**` | `assets` | escenas, entidades |
| `src/entities/**` | todo lo puro + `phaser` | escenas |
| `src/scenes/**` | todo | `addEventListener` (va en `src/input/keyboardProvider.ts`) |
| `scripts/**` | `src/content/**`, `src/core/**`, `vite` (solo `smoke-dist.ts`) | `phaser` |

`tests/boundaries.test.ts` hace cumplir las filas de `phaser` y `addEventListener`.

**Dónde vive cada cosa.**

| Tema | Fuente única |
|---|---|
| Cifras de control y combate | `src/core/tuning.ts` (`TUNING`) |
| Resolución, render, escala, claves de escena | `src/core/gameConfig.ts` |
| Acciones y teclas por defecto | `src/input/actions.ts` |
| Rebind, reservadas, etiquetas | `src/input/bindings.ts` |
| Persistencia de controles | `src/input/bindingsStore.ts` (`localStorage` `kuuchil-btz:bindings:v1`) |
| Tipos de contenido | `src/content/types.ts` |
| Registro de contenido | `src/content/registry.ts` |
| Texturas (placeholder o archivo) | `src/assets/manifest.ts` |
| Paleta y estilo de texto | `src/assets/palette.ts` |
| Mapas | `public/maps/*.tmj` |

## Reglas de código

1. **Especificadores relativos con `.ts`** (`import { TUNING } from "../core/tuning.ts"`) e `import type` para tipos. Node ejecuta `scripts/` despojando tipos y resuelve literalmente; `tsconfig.json` ya tiene `allowImportingTsExtensions` y `verbatimModuleSyntax`.
2. **Solo sintaxis borrable** (`erasableSyntaxOnly`): nada de `enum`, `namespace` ni propiedades de parámetro en constructores. Usa uniones de strings y objetos `as const`.
3. **`phaser` solo en** `src/main.ts`, `src/scenes/**`, `src/entities/**`. Lo demás es lógica pura testeable con Vitest en Node.
4. **Sin números mágicos de movimiento/combate** fuera de `TUNING` y de los datos de contenido.
5. **Hitboxes en datos**, nunca derivadas del tamaño del sprite.
6. **Sin `!` no-null**: guardas explícitas (`noUncheckedIndexedAccess` está activo).
7. **Sin barrel files** (`index.ts` que reexporta). Importa del módulo origen.
8. Máximo ~250 líneas por archivo; si crece, separa la parte pura a `src/core/`.
9. Sin dependencias nuevas sin razón en el mensaje de commit. Phaser ya trae física, cámaras, tilemaps y tweens.
10. El arreglo `scene: [...]` de `src/main.ts` va en **una sola línea**: los gates lo comprueban con `grep -qF`.

## Sistema visual (placeholders GBA)

| Rol (`PALETTE.*`) | Hex | Uso |
|---|---|---|
| `background` | `#0f1226` | fondo del juego y de la página |
| `ground` | `#3b4a6b` | tile de relleno |
| `groundEdge` | `#5b6f9a` | tile superior / plataformas |
| `player` | `#3da5ff` | cuerpo del jugador |
| `playerAccent` | `#ffd23f` | visor del jugador |
| `enemy` | `#e5484d` | enemigos y balas enemigas |
| `boss` | `#8e4ec6` | cuerpo del jefe |
| `telegraph` | `#ffffff` | destello antes de cada ataque |
| `projectile` | `#fff176` | balas del jugador |
| `hpPlayer` | `#4ade80` | barra de vida del jugador |
| `hpBoss` | `#f43f5e` | barra de vida del jefe |
| `hudFrame` | `#e5e7eb` | marcos, texto |

- Resolución nativa 240×160, tiles de 16 px (15×10 visibles). `pixelArt: true`, `roundPixels: true`, escala `FIT` centrada.
- Texto: `TEXT_STYLE` = `fontFamily: "monospace"`, `fontSize: "8px"` (16px para títulos), color `#e5e7eb`; posiciones en enteros.
- Telegraph: el jefe alterna blanco/normal cada `TUNING.telegraphBlinkMs` (170 ms → menos de 3 destellos por segundo) durante todo `telegraphMs`.
- HUD: barra del jugador en (4,4), barra del jefe en (186,4), ambas 50×6, fijas a la cámara.

## Entorno

El código no lee variables de entorno. No hay `.env` ni `.env.example`. (`NODE_VERSION=24` solo se configura en el proyecto de Cloudflare Pages si se publica; ver `docs/DEPLOY.md`.)

## Reglas por área

| Archivo | Aplica a |
|---|---|
| `.claude/rules/input.md` | `src/input/**`, `src/scenes/**`, `src/entities/**` |
| `.claude/rules/content.md` | `src/content/**`, `src/assets/**`, `public/maps/**`, `scripts/**` |
| `.claude/rules/pure-logic.md` | `src/core/**`, `src/characters/**`, `src/bosses/**`, `tests/**` |

Skills del proyecto (se activan solas): `add-stage`, `add-boss`, `add-character`, `swap-art` en `.claude/skills/`.

## No negociable

1. Ningún ataque de jefe con `telegraphMs` menor que `TUNING.minTelegraphMs`. La dificultad sube por daño/velocidad, nunca quitando el aviso.
2. Escenas y entidades leen **acciones**, nunca teclas. Las teclas físicas viven en `src/input/`.
3. Nada de `phaser` en módulos puros ni en `scripts/`; si un test necesita Phaser, la lógica está en el lugar equivocado.
4. `localStorage` solo vía `src/input/bindingsStore.ts`, siempre con `try/catch` y caída a defaults.
5. No implementes nada de los No-Objetivos de `blueprints/kuuchil-btz/blueprint.md` §1 (audio, guardado, gamepad, wall-jump, sable, etc.). Las ideas futuras, como más armas, están anotadas en `docs/ROADMAP.md`.
6. Nunca marques una tarea como hecha con un gate en rojo, y nunca edites un comando `verify` para que pase.
7. Nunca commitees `dist/` ni `node_modules/`.
