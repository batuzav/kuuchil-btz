---
description: Reglas de entrada (acciones, proveedores, bindings) y de cómo las escenas leen la entrada
paths:
  - "src/input/**"
  - "src/scenes/**"
  - "src/entities/**"
---

# Entrada: acciones, no teclas

- El juego solo conoce **acciones**: `left`, `right`, `up`, `down`, `jump`, `shoot`, `dash`, `pause` (`src/input/actions.ts`, `ACTIONS`). Ninguna escena ni entidad menciona una tecla física.
- Los códigos físicos son strings `KeyboardEvent.code` (`"ArrowLeft"`, `"KeyZ"`, `"Escape"`). Solo aparecen en `src/input/actions.ts` (defaults), `src/input/bindings.ts` (reservadas y etiquetas) y `src/input/keyboardProvider.ts`.
- `addEventListener` sobre teclado solo existe en `src/input/keyboardProvider.ts`. `tests/boundaries.test.ts` falla si aparece en `src/scenes`.
- Las escenas obtienen la entrada con `createSceneInput(scene)` de `src/scenes/sceneInput.ts` y leen `ActionSnapshot` (`held` / `pressed`) una vez por frame con `input.update()`.
- Un proveedor nuevo (gamepad) implementa `InputProvider` (`id`, `poll()`, `destroy()`) y se agrega con `inputManager.addProvider(...)`. La jugabilidad no se toca.
- Defaults: flechas = moverse/apuntar, `KeyZ` saltar, `KeyX` disparar, `KeyC` dash, `Escape` pausa/atrás. WASD **no** es default (decisión del autor: demasiado cerca de Z/X/C).
- Rebind: un código ya usado se **intercambia** con la otra acción; un código reservado (`Tab`, `F5`, `F11`, `F12`, `MetaLeft`, `MetaRight`) se rechaza. `Escape` durante la captura cancela.
- Persistencia: clave `localStorage` `kuuchil-btz:bindings:v1`. Toda lectura/escritura pasa por `src/input/bindingsStore.ts`, dentro de `try/catch`, y lo inválido cae a `DEFAULT_BINDINGS`. Nunca toques `localStorage` desde otra parte.
- Nada en `src/input/` importa `phaser`.
