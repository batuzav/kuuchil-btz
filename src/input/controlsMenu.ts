import { ACTIONS, type Action, type Bindings, DEFAULT_BINDINGS } from "./actions.ts";
import { rebind } from "./bindings.ts";

export const CONTROLS_ROWS = [...ACTIONS, "restore", "back"] as const;
export type ControlsRow = (typeof CONTROLS_ROWS)[number];

export type ControlsMenuState = {
  bindings: Bindings;
  selected: number;
  mode: "browse" | "await-key";
  message: string | null;
};

export type ControlsMenuEvent =
  | { type: "up" }
  | { type: "down" }
  | { type: "confirm" }
  | { type: "cancel" }
  | { type: "key"; code: string };

export type ControlsMenuEffect = "none" | "save" | "reset" | "exit";

export function createControlsMenu(bindings: Bindings): ControlsMenuState {
  return { bindings, selected: 0, mode: "browse", message: null };
}

type Reduced = { state: ControlsMenuState; effect: ControlsMenuEffect };

export function reduceControlsMenu(state: ControlsMenuState, event: ControlsMenuEvent): Reduced {
  const count = CONTROLS_ROWS.length;
  if (state.mode === "await-key") {
    if (event.type !== "key") return { state, effect: "none" };
    const action = CONTROLS_ROWS[state.selected] as Action;
    if (event.code === "Escape") {
      return { state: { ...state, mode: "browse", message: null }, effect: "none" };
    }
    const result = rebind(state.bindings, action, event.code);
    if (!result.ok) {
      return { state: { ...state, mode: "browse", message: "Tecla reservada" }, effect: "none" };
    }
    const message = result.swappedWith ? `Intercambiado con ${result.swappedWith}` : null;
    return {
      state: { ...state, bindings: result.bindings, mode: "browse", message },
      effect: "save",
    };
  }
  switch (event.type) {
    case "up":
      return {
        state: { ...state, selected: (state.selected + count - 1) % count },
        effect: "none",
      };
    case "down":
      return { state: { ...state, selected: (state.selected + 1) % count }, effect: "none" };
    case "cancel":
      return { state, effect: "exit" };
    case "confirm": {
      const row = CONTROLS_ROWS[state.selected] as ControlsRow;
      if (row === "back") return { state, effect: "exit" };
      if (row === "restore") {
        return {
          state: { ...state, bindings: DEFAULT_BINDINGS, message: "Controles restaurados" },
          effect: "reset",
        };
      }
      return {
        state: { ...state, mode: "await-key", message: `Pulsa una tecla para ${row}` },
        effect: "none",
      };
    }
    default:
      return { state, effect: "none" };
  }
}
