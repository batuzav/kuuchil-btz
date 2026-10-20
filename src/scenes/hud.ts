import type Phaser from "phaser";
import { PALETTE, TEXT_STYLE } from "../assets/palette.ts";

export type Hud = {
  setPlayer(fraction: number): void;
  setBoss(fraction: number | null): void;
  showMessage(text: string | null): void;
};

const FILL_WIDTH = 48;

function bar(scene: Phaser.Scene, x: number, color: number) {
  const frame = scene.add
    .rectangle(x, 4, 50, 6)
    .setOrigin(0)
    .setStrokeStyle(1, PALETTE.hudFrame)
    .setScrollFactor(0)
    .setDepth(100);
  const fill = scene.add
    .rectangle(x + 1, 5, FILL_WIDTH, 4, color)
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(100);
  const set = (fraction: number) => {
    fill.setVisible(fraction > 0);
    fill.setScale(Math.max(0.0001, Math.min(1, fraction)), 1);
  };
  const show = (visible: boolean) => {
    frame.setVisible(visible);
    fill.setVisible(visible);
  };
  return { set, show };
}

export function createHud(scene: Phaser.Scene): Hud {
  const player = bar(scene, 4, PALETTE.hpPlayer);
  const boss = bar(scene, 186, PALETTE.hpBoss);
  boss.show(false);
  const message = scene.add
    .text(120, 80, "", TEXT_STYLE)
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(101)
    .setVisible(false);
  return {
    setPlayer: (fraction) => player.set(fraction),
    setBoss: (fraction) => {
      if (fraction === null) {
        boss.show(false);
        return;
      }
      boss.show(true);
      boss.set(fraction);
    },
    showMessage: (text) => {
      message.setText(text ?? "");
      message.setVisible(text !== null);
    },
  };
}
