---
description: Reglas de contenido (etapas, jefes, enemigos, personajes, mapas Tiled y manifiesto de assets)
paths:
  - "src/content/**"
  - "src/assets/**"
  - "public/maps/**"
  - "scripts/**"
---

# Contenido como datos

- Todo contenido es un módulo TS **de datos puros** tipado con `src/content/types.ts`. Prohibido importar `phaser` aquí: `node scripts/validate-content.ts` carga estos archivos con Node sin bundler.
- Registro: un `import` + una entrada en el arreglo correspondiente de `CONTENT` en `src/content/registry.ts`. Nada se registra en otro lugar.
- Imports relativos siempre con extensión `.ts` (`./types.ts`), e `import type` para tipos. Node despoja tipos pero resuelve especificadores literalmente.
- Hitboxes (`width`, `height`, `offsetX`, `offsetY`) viven en los datos, nunca se derivan del tamaño del sprite. Cambiar arte no cambia el combate.
- Toda `textureKey` usada en contenido existe en `MANIFEST` (`src/assets/manifest.ts`); lo verifica `tests/assets.test.ts`.
- Cambiar arte = editar la entrada en `MANIFEST` de `{ kind: "placeholder", ... }` a `{ kind: "file", path: ... }`. No se toca ningún otro archivo.
- Colores de placeholders solo desde `PALETTE` (`src/assets/palette.ts`).
- Mapas: Tiled JSON (`.tmj`) en `public/maps/`, tiles de 16 px, capas `ground` (tilelayer, CSV sin compresión) y `spawns` (objectgroup). Objetos por `type`: `player_start` (1), `boss_spawn` (1), `boss_trigger` (rectángulo, ≥1), `enemy` con propiedad string `enemyId`.
- Ataques de jefe: `telegraphMs >= TUNING.minTelegraphMs`. Es la regla de justicia; nunca la bajes para "hacerlo más difícil": sube daño o velocidad.
- Después de cualquier cambio aquí: `pnpm validate:content && pnpm test`.
