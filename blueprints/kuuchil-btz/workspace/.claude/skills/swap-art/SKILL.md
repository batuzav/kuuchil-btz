---
name: swap-art
description: Reemplaza texturas placeholder por sprites reales (PNG) editando solo el manifiesto de assets. Úsalo cuando pidan "poner arte", "cambiar sprite", "usar mi PNG", "tileset real" o "swap art".
---

# Cambiar arte placeholder por arte real

## Cuándo usarlo
- "Ya tengo el sprite del jugador", "pon este tileset", "swap the placeholder art".

## Pasos
1. Copia el PNG a `public/sprites/` (o `public/maps/` si es el tileset). Pixel art sin suavizado, tamaño múltiplo de 16 px para tiles.
2. En `src/assets/manifest.ts`, cambia la entrada de esa clave de `{ kind: "placeholder", ... }` a `{ kind: "file", path: "sprites/<archivo>.png" }`. Para hojas de sprites añade `frameWidth` y `frameHeight`.
3. Tileset: cambia `tiles-placeholder` a `{ kind: "file", path: "maps/<tileset>.png" }`; la imagen debe tener los tiles en el mismo orden que el tileset del `.tmj` (2 columnas: relleno, borde) o actualiza el tileset en Tiled.
4. No toques hitboxes: viven en `src/content/**` y no dependen del sprite.

## Verify
```bash
pnpm test tests/assets.test.ts   # expect: exit 0 — toda textureKey del contenido sigue en MANIFEST
pnpm build && pnpm check:dist    # expect: exit 0
```
Manual: `pnpm dev`, abre http://localhost:5173 y confirma que el sprite se ve nítido (sin blur) a escala entera.

## No hagas
- No renombres claves del manifiesto: el contenido las referencia por nombre.
- No cambies `hitbox` para "ajustar" al dibujo nuevo sin playtest: cambia el combate.
