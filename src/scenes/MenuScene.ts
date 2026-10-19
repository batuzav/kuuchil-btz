import Phaser from "phaser";
import { CONTENT, FIRST_STAGE_ID } from "../content/registry.ts";
import { GAME_TITLE, SCENES } from "../core/gameConfig.ts";
import type { Bindings } from "../input/actions.ts";
import { keyLabel } from "../input/bindings.ts";
import type { InputManager } from "../input/inputManager.ts";
import { BINDINGS_REGISTRY_KEY, createSceneInput } from "./sceneInput.ts";

const ROWS = ["Jugar", "Controles"] as const;
const STYLE = { fontFamily: "monospace", fontSize: "8px", color: "#e5e7eb" };

export class MenuScene extends Phaser.Scene {
  private input2!: InputManager;
  private selected = 0;
  private rowTexts: Phaser.GameObjects.Text[] = [];
  private notice!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    this.selected = 0;
    this.input2 = createSceneInput(this);
    const bindings = this.registry.get(BINDINGS_REGISTRY_KEY) as Bindings;
    this.add.text(8, 16, GAME_TITLE, { ...STYLE, fontSize: "16px" });
    this.rowTexts = ROWS.map((label, i) => this.add.text(24, 64 + i * 16, label, STYLE));
    this.notice = this.add.text(8, 112, "", { ...STYLE, color: "#facc15" });
    this.add.text(8, 144, `${keyLabel(bindings.jump)}: aceptar`, STYLE);
    this.render();
  }

  update(): void {
    const { pressed } = this.input2.update();
    if (pressed.up) this.move(-1);
    if (pressed.down) this.move(1);
    if (pressed.jump) this.confirm();
  }

  private move(delta: number): void {
    this.selected = (this.selected + delta + ROWS.length) % ROWS.length;
    this.render();
  }

  private render(): void {
    this.rowTexts.forEach((text, i) => {
      text.setText(`${i === this.selected ? "> " : "  "}${ROWS[i]}`);
    });
  }

  private confirm(): void {
    if (this.selected === 1) {
      this.scene.start(SCENES.controls);
      return;
    }
    if (CONTENT.stages.length === 0) {
      this.notice.setText("Sin etapas registradas");
      return;
    }
    this.scene.start(SCENES.stage, { stageId: FIRST_STAGE_ID });
  }
}
