import type Phaser from "phaser";
import type { Bindings } from "../input/actions.ts";
import { InputManager } from "../input/inputManager.ts";
import { createKeyboardProvider } from "../input/keyboardProvider.ts";

export const BINDINGS_REGISTRY_KEY = "bindings";

export function createSceneInput(scene: Phaser.Scene): InputManager {
  const manager = new InputManager([
    createKeyboardProvider(window, () => scene.registry.get(BINDINGS_REGISTRY_KEY) as Bindings),
  ]);
  scene.events.once("shutdown", () => manager.destroy());
  return manager;
}
