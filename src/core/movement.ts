import type { Tuning } from "./tuning.ts";

// Convención: vy negativo = hacia arriba (ejes de pantalla de Phaser).

export function horizontalVelocity(left: boolean, right: boolean, runSpeed: number): number {
  if (left === right) return 0;
  return right ? runSpeed : -runSpeed;
}

export function applyJumpCut(vy: number, jumpHeld: boolean, multiplier: number): number {
  return vy < 0 && !jumpHeld ? vy * multiplier : vy;
}

export function canJump(msSinceGrounded: number, msSinceJumpPressed: number, t: Tuning): boolean {
  return msSinceGrounded <= t.coyoteTimeMs && msSinceJumpPressed <= t.jumpBufferMs;
}

export function clampFall(vy: number, maxFallSpeed: number): number {
  return Math.min(vy, maxFallSpeed);
}

export function apexHeight(t: Tuning): number {
  return t.jumpVelocity ** 2 / (2 * t.gravityY);
}

export function jumpAirTimeMs(t: Tuning): number {
  return ((2 * t.jumpVelocity) / t.gravityY) * 1000;
}

export function runningJumpDistance(t: Tuning): number {
  return (t.runSpeed * jumpAirTimeMs(t)) / 1000;
}

export function dashDistance(t: Tuning): number {
  return (t.dashSpeed * t.dashDurationMs) / 1000;
}
