---
description: Reglas para la lógica pura testeable (tuning, movimiento, habilidades, FSM de jefes, tests)
paths:
  - "src/core/**"
  - "src/characters/**"
  - "src/bosses/**"
  - "tests/**"
---

# Lógica pura

- `src/core/`, `src/characters/`, `src/bosses/`, `src/input/` y `src/content/` no importan `phaser`. `tests/boundaries.test.ts` lo verifica.
- Toda cifra de sensación de control vive en `TUNING` (`src/core/tuning.ts`), comentada con su unidad. Ningún número mágico de movimiento en entidades o habilidades.
- Funciones puras: entran estado + `dtMs` + entrada, sale estado nuevo. Sin `Date.now()`, sin `Math.random()` sin semilla, sin globales mutables.
- Habilidades implementan `Ability` (`src/characters/ability.ts`) y se registran con una línea en `ABILITY_FACTORIES` (`src/characters/abilityRegistry.ts`).
- El motor de jefes (`src/bosses/fsm.ts`) es genérico: no contiene ids de jefes concretos.
- Tests: Vitest, `import { describe, expect, it } from "vitest"` explícito (sin globals), un archivo por área en `tests/`, nombres que describen el comportamiento.
- Sin aserciones no-null (`!`): usa guardas explícitas, porque `noUncheckedIndexedAccess` está activo.
