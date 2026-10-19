---
name: add-stage
description: Añade una etapa nueva a kuuchil-btz (mapa Tiled + módulo de etapa + registro). Úsalo cuando pidan "nueva etapa", "stage 2", "otro nivel", "agregar mapa" o "add stage".
---

# Añadir una etapa

## Cuándo usarlo
- "Agrega la etapa 2", "nuevo nivel", "otro mapa", "add a stage".

## Pasos
1. Crea el mapa en Tiled 1.12.2: orientación ortogonal, tiles de 16×16, **Map → Map Properties → Tile Layer Format: CSV**, sin compresión. Guarda como JSON en `public/maps/<id>.tmj` (copia `public/maps/stage-01.tmj` como punto de partida).
2. Capas obligatorias:
   - tilelayer `ground` (colisiona todo tile distinto de vacío);
   - objectgroup `spawns` con objetos cuyo campo *Class/Type* es: `player_start` (un punto), `boss_spawn` (un punto), `boss_trigger` (un rectángulo, al menos uno), `enemy` (puntos con propiedad string `enemyId`).
3. Tileset embebido llamado `placeholder-tiles` (o el nombre que declares en `tilesetName`), imagen de 32×16 px con 2 tiles. Tiled avisará que falta la imagen placeholder: es esperado, el juego dibuja la textura `tiles-placeholder` en código.
4. Crea `src/content/stages/<id>/stage.ts` copiando la forma de `src/content/stages/stage-01/stage.ts`: `id`, `name`, `mapKey`, `mapPath` (`"maps/<id>.tmj"`), `tilesetName`, `tilesetTextureKey`, `groundLayer: "ground"`, `spawnLayer: "spawns"`, `bossId`, `minibossIds`, `music: null`.
5. Regístrala en `src/content/registry.ts`: un `import` y una entrada en `CONTENT.stages`.
6. Cada `enemyId` y el `bossId` deben existir ya (usa `add-boss` o crea el enemigo en `src/content/enemies/` y regístralo).

## Verify
```bash
pnpm validate:content   # expect: "content OK", exit 0
pnpm test               # expect: exit 0, 0 failed
pnpm typecheck && pnpm lint   # expect: exit 0
```

## No hagas
- No referencies texturas que no estén en `src/assets/manifest.ts`.
- No uses capas comprimidas (zlib/gzip) ni mapas infinitos: el validador y Phaser esperan CSV finito.
- No importes `phaser` en el módulo de la etapa.
