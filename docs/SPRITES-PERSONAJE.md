# Guía de sprites del personaje principal

Esta guía sirve para dibujar (tú o un artista) el sprite de Business Man y pasárselo al proyecto. Hoy el juego usa un rectángulo azul de 16×16 px como placeholder.

## Estado actual del juego (2026-10-20)

- Business Man ya tiene arte real y animaciones: `public/sprites/business-man.png`, hoja de celdas de 48×48, 13 columnas y una fila por animación (idle, run, jump, dash, shoot, hurt, death, crouch, crouch-shoot).
- El cuerpo dibujado mide unos 10×37 px y los pies quedan en la última fila de la celda (origen 0.5, 1 de Phaser).
- Qué cuadros usa cada animación, a cuántos fps, y la hitbox y la boca de la pistola, viven en `src/content/characters/business-man.ts`. La hitbox de pie mide 10×30 y la agachada 12×22 (misma base); ambas están centradas en la celda para que no se desplace al voltear el sprite.
- El código que elige la animación según el estado está en `src/characters/animationState.ts` (probado en `tests/animation-state.test.ts`).
- El arte se generó con Pixellab. Los cuadros originales están en `art/pixellab/frames/` y `node art/tools/build-sheet.mjs` rehace la hoja (recorta de 64 a 48 y alinea los pies).

## Qué hay que entregar

**Una hoja de sprites (spritesheet) en PNG**, con fondo transparente.

| Requisito | Detalle |
|---|---|
| Formato | PNG con transparencia, sin suavizado (pixel art puro) |
| Cuadrícula | Todas las celdas del mismo tamaño (por ejemplo 32×32) |
| Orientación | Todo dibujado **mirando a la derecha**; el juego lo voltea para la izquierda |
| Pies | Siempre en la misma línea, **abajo al centro** de la celda. Si cambian de posición entre cuadros, el personaje "tiembla" |
| Orden | Una fila por animación, los cuadros de izquierda a derecha |

Junto con el PNG, anota:

1. El tamaño de cada celda.
2. Cuántos cuadros tiene cada animación.
3. La velocidad de cada animación, en cuadros por segundo.

## Cuántos cuadros

| Animación | Mínimo | Cómodo | Notas |
|---|---|---|---|
| Quieto (idle) | 2 | 4 | Respiración o parpadeo sutil |
| Correr | 6 | 8 | Ciclo que cierre en bucle |
| Salto subiendo | 1 | 2 | |
| Caída | 1 | 2 | |
| Dash | 2 | 3 | Cuerpo inclinado |
| Disparar | 1 pose | versiones de quieto, correr y salto con el brazo extendido | Es lo más caro de dibujar |
| Herido | 1 | 2 | |
| K.O. | 2 | 4 | |
| **Total** | **~16** | **~30-40** | Se puede empezar con el mínimo y ampliar |

## Tamaño: decídelo antes de dibujar

El personaje actual mide 16×16 px. Para estética GBA (estilo Mega Man Zero/ZX) suele verse mejor un personaje de **24 a 30 px de alto**, dentro de una celda de 32×32.

Si lo haces más grande que el actual, hay que reajustar su hitbox y comprobar que el salto y las plataformas de `public/maps/stage-01.tmj` sigan siendo alcanzables. Los valores de `src/core/tuning.ts` están pensados para 16×16.

Consejos de estilo: paleta limitada, contorno oscuro, sin degradados ni suavizado, y colores coherentes con enemigos y fondo.

## Cómo construirlo

| Opción | Herramientas / forma |
|---|---|
| Tú mismo | Piskel (gratis, en navegador), LibreSprite o Pixelorama (gratis), Aseprite (de pago, el más cómodo). Todos exportan una hoja en PNG |
| Un artista | Entrégale este documento como encargo |
| Sprite temporal hecho en código | Un personaje con todas las animaciones dibujado directamente en el código, pixel art simple en 3 o 4 colores. No es arte final, pero sirve para probar el sistema de animaciones |

## Cómo se integra (cuando tengas la hoja)

1. Copia el PNG a `public/sprites/` (por ejemplo `public/sprites/business-man.png`).
2. En `src/assets/manifest.ts`, cambia la entrada `player` de `{ kind: "placeholder", ... }` a:
   `{ kind: "file", path: "sprites/business-man.png", frameWidth: 32, frameHeight: 32 }` (usa tu tamaño de celda real).
3. No renombres la clave `player`: el contenido la referencia por nombre.
4. No toques la hitbox "para ajustarla al dibujo" sin probar: cambia el combate.
5. Comprueba con `pnpm test tests/assets.test.ts`, `pnpm build` y `pnpm check:dist`, y mira el resultado en `pnpm dev`.

Con una sola imagen fija esto ya funciona hoy. Con una hoja de varias animaciones, falta el siguiente paso.

## Cómo cambiar un cuadro o una animación

1. Pon los cuadros nuevos en `art/pixellab/frames/<animación>/<n>.png` (48×48 o 64×64, mirando a la derecha).
2. `node art/tools/build-sheet.mjs` regenera `public/sprites/business-man.png`.
3. Si cambió el número de cuadros o cuáles se usan, edita `animations` en `src/content/characters/business-man.ts`.
4. `pnpm gate` y prueba en `pnpm dev`.

Un personaje nuevo en el futuro: su propia hoja, su entrada en `src/assets/manifest.ts` y su archivo en `src/content/characters/` con sus `animations`.
