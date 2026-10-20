# Playtest y afinación

La sensación del control se ajusta en `src/core/tuning.ts`. Cambia **una variable por sesión**, prueba, y anota el resultado. Los tests de `tests/tuning.test.ts` avisan si un cambio rompe el mapa (plataformas inalcanzables o foso imposible).

## Valores de TUNING

| Clave | Valor actual | Efecto | Si sube / si baja |
|---|---|---|---|
| `runSpeed` | 90 | velocidad horizontal al correr (px/s) | más rápido y menos preciso / más pesado |
| `gravityY` | 900 | gravedad del mundo (px/s²) | saltos más cortos y secos / más flotante |
| `jumpVelocity` | 360 | impulso del salto (px/s) | salta más alto / salta más bajo |
| `jumpCutMultiplier` | 0.4 | fracción de velocidad que queda al soltar el salto | salto casi fijo / salto muy variable |
| `maxFallSpeed` | 320 | velocidad máxima de caída | caída más violenta / caída más suave |
| `coyoteTimeMs` | 80 | margen para saltar tras dejar el suelo | más permisivo / más estricto |
| `jumpBufferMs` | 100 | margen para recordar un salto pulsado antes de aterrizar | más permisivo / más estricto |
| `dashSpeed` | 180 | velocidad del dash | recorre más distancia / se queda corto |
| `dashDurationMs` | 220 | duración del dash | dash más largo / más corto |
| `dashCooldownMs` | 300 | espera entre dashes | menos espera, más spam / más espera |
| `shotSpeed` | 240 | velocidad de la bala | alcanza más rápido / bala lenta |
| `shotCooldownMs` | 160 | tiempo mínimo entre disparos | menos cadencia / ráfaga más rápida |
| `shotLifetimeMs` | 1000 | vida de una bala | alcance mayor / alcance menor |
| `maxShotsOnScreen` | 3 | balas simultáneas del jugador | más fuego / más control |
| `invulnerabilityMs` | 1000 | invulnerabilidad tras recibir daño | más margen / más castigo |
| `knockbackSpeed` | 80 | retroceso al recibir daño | empuja más lejos / casi no empuja |
| `minTelegraphMs` | 250 | aviso mínimo de todo ataque de jefe | más justo / más difícil de leer |
| `telegraphBlinkMs` | 170 | duración de cada destello del aviso | parpadeo más lento / más rápido (no bajar de 167) |
| `shootPoseMs` | 280 | cuánto dura la pose de disparo tras disparar (solo parado) | pose más larga / más corta |
| `hurtPoseMs` | 250 | cuánto dura la pose de herido tras recibir daño | pose más larga / más corta |
| `runAnimMinSpeed` | 10 | velocidad por debajo de la cual se ve el idle en vez de correr | más tiempo en idle / pasa a correr antes |
| `deathRestartDelayMs` | 1200 | pausa entre K.O. y reinicio | pausa más larga / reinicio inmediato |

## Procedimiento

1. `pnpm dev` y abre http://localhost:5173.
2. Juega la etapa 1 de principio a fin al menos 3 veces antes de tocar nada.
3. Cambia una sola clave de la tabla, guarda y recarga.
4. Repite el mismo tramo. Anota si mejoró, empeoró o no se nota.
5. Antes de commitear: `pnpm test tests/tuning.test.ts`.

## Checklist del jefe

- [ ] ¿Cada ataque se lee a tiempo (el jefe parpadea en blanco antes de cada uno)?
- [ ] ¿Cada ataque deja una ventana de castigo clara?
- [ ] ¿Cada muerte se puede atribuir a un error propio?
- [ ] ¿La fase 2 se siente más intensa, no solo más injusta?

## Registro de intentos

| Fecha | Variable cambiada | Valor anterior → nuevo | Resultado |
|---|---|---|---|
|  |  |  |  |
