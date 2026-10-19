import type { AssetSpec, PlaceholderSpec } from "./manifest.ts";

export type FillContext = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, w: number, h: number): void;
};

export function toCss(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function drawPlaceholder(ctx: FillContext, spec: PlaceholderSpec): void {
  if (spec.shape === "rect") {
    ctx.fillStyle = toCss(spec.color);
    ctx.fillRect(0, 0, spec.width, spec.height);
    if (spec.accent !== null) {
      ctx.fillStyle = toCss(spec.accent);
      ctx.fillRect(
        0,
        Math.floor(spec.height / 4),
        spec.width,
        Math.max(1, Math.floor(spec.height / 8)),
      );
    }
    return;
  }
  ctx.fillStyle = toCss(spec.color);
  ctx.fillRect(0, 0, 16, 16);
  ctx.fillRect(16, 0, 16, 16);
  if (spec.accent !== null) {
    ctx.fillStyle = toCss(spec.accent);
    ctx.fillRect(16, 0, 16, 4);
  }
}

export function generatePlaceholders(
  manifest: Readonly<Record<string, AssetSpec>>,
  createCanvas: (w: number, h: number) => HTMLCanvasElement,
  addCanvas: (key: string, canvas: HTMLCanvasElement) => void,
): void {
  for (const [key, spec] of Object.entries(manifest)) {
    if (spec.kind !== "placeholder") continue;
    const canvas = createCanvas(spec.width, spec.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(`No se pudo crear el contexto 2d para ${key}`);
    drawPlaceholder(ctx, spec);
    addCanvas(key, canvas);
  }
}
