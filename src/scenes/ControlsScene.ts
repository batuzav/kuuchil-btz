import Phaser from "phaser";
import { SCENES } from "../core/gameConfig.ts";
import type { Bindings } from "../input/actions.ts";
import { keyLabel } from "../input/bindings.ts";
import { clearBindings, getBrowserStorage, saveBindings } from "../input/bindingsStore.ts";
import {
  CONTROLS_ROWS,
  type ControlsMenuEffect,
  type ControlsMenuEvent,
  type ControlsMenuState,
  createControlsMenu,
  reduceControlsMenu,
} from "../input/controlsMenu.ts";
import type { InputManager } from "../input/inputManager.ts";
import { captureNextKey } from "../input/keyboardProvider.ts";
import { BINDINGS_REGISTRY_KEY, createSceneInput } from "./sceneInput.ts";

const STYLE = { fontFamily: "monospace", fontSize: "8px", color: "#e5e7eb" };
const LABELS: Record<string, string> = {
  left: "Izquierda",
  right: "Derecha",
  up: "Arriba",
  down: "Abajo / Agacharse",
  jump: "Saltar",
  shoot: "Disparar",
  dash: "Dash",
  pause: "Pausa",
  restore: "Restaurar",
  back: "Volver",
};

export class ControlsScene extends Phaser.Scene {
  private input2!: InputManager;
  private model!: ControlsMenuState;
  private rowTexts: Phaser.GameObjects.Text[] = [];
  private message!: Phaser.GameObjects.Text;
  private storageNote: string | null = null;
  private cancelCapture: (() => void) | null = null;

  constructor() {
    super(SCENES.controls);
  }

  create(): void {
    this.input2 = createSceneInput(this);
    this.model = createControlsMenu(this.registry.get(BINDINGS_REGISTRY_KEY) as Bindings);
    this.storageNote = null;
    this.add.text(8, 4, "Controles", { ...STYLE, fontSize: "16px" });
    this.rowTexts = CONTROLS_ROWS.map((_, i) => this.add.text(16, 24 + i * 11, "", STYLE));
    this.message = this.add.text(8, 144, "", { ...STYLE, color: "#facc15" });
    this.events.once("shutdown", () => this.cancelCapture?.());
    this.render();
  }

  update(): void {
    const snapshot = this.input2.update();
    if (this.model.mode === "await-key") return;
    const { pressed } = snapshot;
    if (pressed.up) this.dispatch({ type: "up" });
    else if (pressed.down) this.dispatch({ type: "down" });
    else if (pressed.jump) this.dispatch({ type: "confirm" });
    else if (pressed.pause) this.dispatch({ type: "cancel" });
  }

  private dispatch(event: ControlsMenuEvent): void {
    const { state, effect } = reduceControlsMenu(this.model, event);
    this.model = state;
    this.apply(effect);
    if (this.model.mode === "await-key") {
      this.cancelCapture = captureNextKey(window, (code) => {
        this.cancelCapture = null;
        this.dispatch({ type: "key", code });
      });
    }
    this.render();
  }

  private apply(effect: ControlsMenuEffect): void {
    this.storageNote = null;
    if (effect === "exit") {
      this.scene.start(SCENES.menu);
      return;
    }
    if (effect === "none") return;
    this.registry.set(BINDINGS_REGISTRY_KEY, this.model.bindings);
    const storage = getBrowserStorage();
    const ok =
      effect === "save" ? saveBindings(storage, this.model.bindings) : clearBindings(storage);
    if (!ok) this.storageNote = "No se pudo guardar (se usarán en esta sesión)";
  }

  private render(): void {
    this.rowTexts.forEach((text, i) => {
      const row = CONTROLS_ROWS[i] as string;
      const cursor = i === this.model.selected ? "> " : "  ";
      const key =
        row === "restore" || row === "back"
          ? ""
          : `  ${keyLabel(this.model.bindings[row as keyof Bindings])}`;
      text.setText(`${cursor}${LABELS[row]}${key}`);
    });
    this.message.setText(this.storageNote ?? this.model.message ?? "");
  }
}
