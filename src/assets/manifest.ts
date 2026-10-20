import { PALETTE } from "./palette.ts";

export type PlaceholderSpec = {
  readonly kind: "placeholder";
  readonly shape: "rect" | "tiles";
  readonly width: number;
  readonly height: number;
  readonly color: number;
  readonly accent: number | null;
};

export type FileSpec = {
  readonly kind: "file";
  readonly path: string;
  readonly frameWidth?: number;
  readonly frameHeight?: number;
};

export type AssetSpec = PlaceholderSpec | FileSpec;

const rect = (width: number, height: number, color: number, accent: number | null): AssetSpec => ({
  kind: "placeholder",
  shape: "rect",
  width,
  height,
  color,
  accent,
});

export const MANIFEST: Readonly<Record<string, AssetSpec>> = {
  "business-man": {
    kind: "file",
    path: "sprites/business-man.png",
    frameWidth: 48,
    frameHeight: 48,
  },
  "projectile-player": rect(4, 4, PALETTE.projectile, null),
  "enemy-walker": rect(24, 24, PALETTE.enemy, PALETTE.hudFrame),
  "enemy-hopper": rect(24, 24, PALETTE.enemy, PALETTE.playerAccent),
  "enemy-turret": rect(24, 24, PALETTE.enemy, PALETTE.projectile),
  "projectile-enemy": rect(4, 4, PALETTE.enemy, null),
  "boss-sentinel": rect(48, 48, PALETTE.boss, PALETTE.hudFrame),
  "tiles-placeholder": {
    kind: "placeholder",
    shape: "tiles",
    width: 32,
    height: 16,
    color: PALETTE.ground,
    accent: PALETTE.groundEdge,
  },
};
