# kuuchil-btz

Plataformero de acción en el navegador, centrado en jefes difíciles pero justos. Pixel art estilo GBA a 240×160. Hecho con Phaser 4, TypeScript y Vite. El arte actual es temporal y se genera por código, así que se puede cambiar sin tocar la lógica.

## Requisitos

- Node 24 (`.nvmrc`); con nvm: `nvm use 24`.
- pnpm, que activa corepack con la versión fijada en `package.json`.

## Comandos

| Tarea | Comando |
|---|---|
| Servidor de desarrollo | `pnpm dev` (http://localhost:5173) |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` · arreglar formato: `pnpm format` |
| Tests | `pnpm test` · un archivo: `pnpm test tests/<archivo>.test.ts` |
| Validar contenido | `pnpm validate:content` |
| Build | `pnpm build` (genera `dist/`) |
| Comprobar el build | `pnpm check:dist` y `pnpm smoke:dist` |
| Todo junto | `pnpm gate` |

## Controles por defecto

Todos se pueden cambiar desde **Controles** en el menú; se guardan en el navegador.

| Acción | Tecla |
|---|---|
| Mover / apuntar | Flechas |
| Saltar | Z |
| Disparar | X |
| Agacharse (mantener, en el suelo) | ↓ |
| Dash | C |
| Pausa / volver | Esc |

## Cómo está organizado

- `src/core/tuning.ts`: todas las cifras de sensación de control y combate.
- `src/content/registry.ts`: registro de etapas, jefes, enemigos y personajes. Agregar contenido nuevo es crear su archivo y añadir una línea aquí.
- `public/maps/stage-01.tmj`: el mapa de la etapa 1, editable con Tiled.
- `src/assets/manifest.ts`: de dónde sale cada textura; cambiar el arte es editar este archivo.

## Más documentación

- `docs/PLAYTEST.md`: cómo afinar la sensación y checklist del jefe.
- `docs/DEPLOY.md`: cómo publicar el juego.
- `docs/ROADMAP.md`: ideas para el futuro, por ahora el diseño propuesto para añadir más armas.
- Skills del proyecto en `.claude/skills/`: `add-stage`, `add-boss`, `add-character` y `swap-art`.
