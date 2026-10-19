---
name: add-boss
description: Añade un jefe nuevo como datos (fases, ataques con telegraph, hitboxes) al motor genérico de jefes. Úsalo cuando pidan "nuevo jefe", "boss 2", "otro ataque del jefe" o "add boss".
---

# Añadir un jefe

## Cuándo usarlo
- "Crea el jefe de la etapa 2", "añade un ataque al jefe", "add a boss".

## Pasos
1. Crea `src/content/bosses/<id>.ts` copiando la forma de `src/content/bosses/sentinel.ts` (tipo `BossDef` de `src/content/types.ts`).
2. `phases`: ordenadas; la primera con `enterAtHpFraction: 1`, las siguientes estrictamente decrecientes y > 0. Cada fase tiene `idleMs` y un `attackCycle` no vacío con ids de `attacks`.
3. `attacks`: cada uno con `pattern` (`"dash"`, `"shot-spread"` o `"slam"`), `telegraphMs` (≥ `TUNING.minTelegraphMs` de `src/core/tuning.ts`), `activeMs`, `recoveryMs`, `damage`, `hitbox`, `speed`, `count`.
4. Hitbox en datos (`width`, `height`, `offsetX`, `offsetY`), independiente del sprite.
5. Añade la textura al `MANIFEST` de `src/assets/manifest.ts` si es nueva (placeholder con colores de `PALETTE`).
6. Regístralo en `src/content/registry.ts` (`import` + entrada en `CONTENT.bosses`) y apúntalo desde el `bossId` de una etapa.
7. Un patrón nuevo (más allá de los tres) es código: función pura en `src/bosses/patterns.ts` + test, y su ejecución en `src/entities/Boss.ts`.

## Verify
```bash
pnpm test tests/telegraph.test.ts   # expect: exit 0 — ningún ataque activo sin telegraph completo
pnpm validate:content               # expect: "content OK", exit 0
pnpm typecheck && pnpm lint         # expect: exit 0
```

## No hagas
- No bajes `telegraphMs` por debajo del mínimo para subir dificultad: sube `damage`, `speed` o acorta `recoveryMs`/`idleMs`.
- No pongas ids de jefes concretos dentro de `src/bosses/fsm.ts`.
