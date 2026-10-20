import type Phaser from "phaser";
import { animationKey } from "../characters/animationState.ts";
import type { CharacterDef } from "../content/types.ts";

export function createCharacterAnimations(scene: Phaser.Scene, def: CharacterDef): void {
  for (const [state, anim] of Object.entries(def.animations)) {
    const key = animationKey(def.id, state);
    if (scene.anims.exists(key)) continue;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(def.textureKey, { frames: [...anim.frames] }),
      frameRate: anim.fps,
      repeat: anim.loop ? -1 : 0,
    });
  }
}
