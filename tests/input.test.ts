import { describe, expect, it } from "vitest";
import { DEFAULT_BINDINGS, emptyActionState } from "../src/input/actions.ts";
import { InputManager } from "../src/input/inputManager.ts";
import { createKeyboardProvider } from "../src/input/keyboardProvider.ts";

const key = (type: string, code: string) => Object.assign(new Event(type), { code });

describe("default bindings", () => {
  it("uses arrows for movement, Z/X/C for actions, Esc for pause, and no WASD", () => {
    expect(DEFAULT_BINDINGS).toEqual({
      left: "ArrowLeft",
      right: "ArrowRight",
      up: "ArrowUp",
      down: "ArrowDown",
      jump: "KeyZ",
      shoot: "KeyX",
      dash: "KeyC",
      pause: "Escape",
    });
    const values = Object.values(DEFAULT_BINDINGS);
    for (const wasd of ["KeyW", "KeyA", "KeyS", "KeyD"]) expect(values).not.toContain(wasd);
  });
});

describe("InputManager + keyboard provider", () => {
  it("reports pressed on the first update and only held on the second", () => {
    const target = new EventTarget();
    const manager = new InputManager([createKeyboardProvider(target, () => DEFAULT_BINDINGS)]);
    target.dispatchEvent(key("keydown", "KeyZ"));
    const first = manager.update();
    expect(first.held.jump).toBe(true);
    expect(first.pressed.jump).toBe(true);
    const second = manager.update();
    expect(second.held.jump).toBe(true);
    expect(second.pressed.jump).toBe(false);
  });

  it("ORs the held state of several providers", () => {
    const a = { id: "a", poll: () => ({ ...emptyActionState(), dash: true }), destroy() {} };
    const b = { id: "b", poll: () => emptyActionState(), destroy() {} };
    const manager = new InputManager([b]);
    manager.addProvider(a);
    expect(manager.update().held.dash).toBe(true);
  });

  it("releases everything on blur", () => {
    const target = new EventTarget();
    const manager = new InputManager([createKeyboardProvider(target, () => DEFAULT_BINDINGS)]);
    target.dispatchEvent(key("keydown", "KeyX"));
    target.dispatchEvent(key("keydown", "ArrowLeft"));
    expect(manager.update().held.shoot).toBe(true);
    target.dispatchEvent(new Event("blur"));
    const after = manager.update();
    expect(Object.values(after.held).some(Boolean)).toBe(false);
  });
});
