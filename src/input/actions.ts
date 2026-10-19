export const ACTIONS = ["left", "right", "up", "down", "jump", "shoot", "dash", "pause"] as const;
export type Action = (typeof ACTIONS)[number];
export type ActionState = Readonly<Record<Action, boolean>>;
export type ActionSnapshot = { readonly held: ActionState; readonly pressed: ActionState };
export type Bindings = Readonly<Record<Action, string>>; // acción → KeyboardEvent.code

export const DEFAULT_BINDINGS: Bindings = {
  left: "ArrowLeft",
  right: "ArrowRight",
  up: "ArrowUp",
  down: "ArrowDown",
  jump: "KeyZ",
  shoot: "KeyX",
  dash: "KeyC",
  pause: "Escape",
};

export function emptyActionState(): Record<Action, boolean> {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false,
    dash: false,
    pause: false,
  };
}
