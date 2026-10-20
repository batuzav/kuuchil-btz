export function dashVelocity(bossX: number, playerX: number, speed: number): number {
  return playerX < bossX ? -speed : speed;
}

export function spreadVelocities(
  count: number,
  speed: number,
  facing: 1 | -1,
): { vx: number; vy: number }[] {
  return Array.from({ length: count }, (_, i) => {
    const degrees = count === 1 ? 0 : -20 + (40 * i) / (count - 1);
    const radians = (degrees * Math.PI) / 180;
    return { vx: facing * speed * Math.cos(radians), vy: speed * Math.sin(radians) };
  });
}

export function slamVelocity(
  bossX: number,
  playerX: number,
  speed: number,
): { vx: number; vy: number } {
  return { vx: Math.max(-80, Math.min(80, playerX - bossX)), vy: -speed };
}
