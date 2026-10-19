// Todas las cifras de sensación de control y combate. Unidades: px, px/s, px/s², ms.
export const TUNING = {
  runSpeed: 90, // px/s horizontal al correr
  gravityY: 900, // px/s² gravedad del mundo Arcade
  jumpVelocity: 320, // px/s hacia arriba al saltar (apex ≈ 57 px ≈ 3.5 tiles)
  jumpCutMultiplier: 0.4, // al soltar salto subiendo: vy *= esto (salto variable)
  maxFallSpeed: 320, // px/s velocidad máxima de caída
  coyoteTimeMs: 80, // ms tras dejar el suelo en que aún se puede saltar
  jumpBufferMs: 100, // ms que se recuerda un salto pulsado antes de aterrizar
  dashSpeed: 180, // px/s durante el dash
  dashDurationMs: 220, // ms que dura un dash (≈ 40 px)
  dashCooldownMs: 300, // ms tras terminar un dash antes de otro
  shotSpeed: 240, // px/s de la bala del jugador
  shotCooldownMs: 160, // ms mínimos entre disparos
  shotLifetimeMs: 1000, // ms de vida de una bala (alcance = 1 pantalla)
  maxShotsOnScreen: 3, // balas del jugador simultáneas (estilo MMX)
  invulnerabilityMs: 1000, // ms de invulnerabilidad tras recibir daño
  knockbackSpeed: 80, // px/s de retroceso al recibir daño
  minTelegraphMs: 250, // ms mínimos de aviso de todo ataque de jefe (regla de justicia)
  telegraphBlinkMs: 170, // ms por alternancia del destello (< 3 destellos/s)
  deathRestartDelayMs: 1200, // ms entre "K.O." y reiniciar la etapa
} as const;

export type Tuning = typeof TUNING;
