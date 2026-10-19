import { describe, expect, it } from "vitest";
import { DEFAULT_BINDINGS } from "../src/input/actions.ts";
import {
  CONTROLS_ROWS,
  createControlsMenu,
  reduceControlsMenu,
} from "../src/input/controlsMenu.ts";

const rowIndex = (row: string) => CONTROLS_ROWS.indexOf(row as (typeof CONTROLS_ROWS)[number]);

describe("controls menu model", () => {
  it("has the 8 actions plus restore and back", () => {
    expect(CONTROLS_ROWS).toHaveLength(10);
  });

  it("wraps selection up and down", () => {
    const s = createControlsMenu(DEFAULT_BINDINGS);
    expect(reduceControlsMenu(s, { type: "up" }).state.selected).toBe(CONTROLS_ROWS.length - 1);
    const last = { ...s, selected: CONTROLS_ROWS.length - 1 };
    expect(reduceControlsMenu(last, { type: "down" }).state.selected).toBe(0);
  });

  it("rebinds through await-key and emits save", () => {
    let s = { ...createControlsMenu(DEFAULT_BINDINGS), selected: rowIndex("jump") };
    s = reduceControlsMenu(s, { type: "confirm" }).state;
    expect(s.mode).toBe("await-key");
    const r = reduceControlsMenu(s, { type: "key", code: "KeyX" });
    expect(r.effect).toBe("save");
    expect(r.state.bindings.jump).toBe("KeyX");
    expect(r.state.message).toContain("shoot");
  });

  it("restore returns defaults with effect reset", () => {
    const changed = { ...DEFAULT_BINDINGS, dash: "KeyV" };
    const s = { ...createControlsMenu(changed), selected: rowIndex("restore") };
    const r = reduceControlsMenu(s, { type: "confirm" });
    expect(r.effect).toBe("reset");
    expect(r.state.bindings).toEqual(DEFAULT_BINDINGS);
  });

  it("Escape while awaiting a key cancels without changes", () => {
    let s = { ...createControlsMenu(DEFAULT_BINDINGS), selected: rowIndex("shoot") };
    s = reduceControlsMenu(s, { type: "confirm" }).state;
    const r = reduceControlsMenu(s, { type: "key", code: "Escape" });
    expect(r.state.mode).toBe("browse");
    expect(r.state.bindings).toEqual(DEFAULT_BINDINGS);
    expect(r.effect).toBe("none");
  });

  it("reserved key shows a message and keeps bindings", () => {
    let s = { ...createControlsMenu(DEFAULT_BINDINGS), selected: rowIndex("shoot") };
    s = reduceControlsMenu(s, { type: "confirm" }).state;
    const r = reduceControlsMenu(s, { type: "key", code: "F5" });
    expect(r.state.message).toBe("Tecla reservada");
    expect(r.state.bindings).toEqual(DEFAULT_BINDINGS);
  });

  it("back and cancel exit", () => {
    const back = { ...createControlsMenu(DEFAULT_BINDINGS), selected: rowIndex("back") };
    expect(reduceControlsMenu(back, { type: "confirm" }).effect).toBe("exit");
    expect(
      reduceControlsMenu(createControlsMenu(DEFAULT_BINDINGS), { type: "cancel" }).effect,
    ).toBe("exit");
  });
});
