# kuuchil-btz — instrucciones para agentes

Plataformas de acción 2D para navegador centrado en jefes (Phaser 4 + TypeScript + Vite), resolución 240×160, sin backend.

## Comandos

| Tarea | Comando |
|---|---|
| Instalar | `pnpm install` |
| Dev | `pnpm dev` — http://localhost:5173 |
| Build | `pnpm build`, luego `pnpm check:dist` y `pnpm smoke:dist` (sirve `dist/` en 127.0.0.1:4173) |
| Typecheck | `pnpm typecheck` |
| Lint | `pnpm lint` · arreglar: `pnpm format` |
| Tests | `pnpm test` · uno: `pnpm test tests/<archivo>.test.ts` |
| Validar contenido | `pnpm validate:content` |
| Gate completo | `pnpm gate` |

## No negociable

1. Ningún ataque de jefe con `telegraphMs` menor que `TUNING.minTelegraphMs`.
2. Escenas y entidades leen acciones, nunca teclas; las teclas viven en `src/input/`.
3. Nada de `phaser` en `src/core`, `src/input`, `src/content`, `src/characters`, `src/bosses` ni `scripts/`.
4. Imports relativos con extensión `.ts` e `import type` para tipos.
5. `localStorage` solo vía `src/input/bindingsStore.ts`.
6. No implementes los No-Objetivos del blueprint §1.
7. Nunca marques una tarea hecha con un gate en rojo.

Arquitectura completa, fronteras y paleta: `CLAUDE.md` en este directorio. Orden de construcción: `blueprints/kuuchil-btz/tasks.json`.
