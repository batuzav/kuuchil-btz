import { ACTIONS, type ActionState, type Bindings, emptyActionState } from "./actions.ts";
import type { InputProvider } from "./inputManager.ts";

export type KeyTarget = Pick<EventTarget, "addEventListener" | "removeEventListener">;

export function createKeyboardProvider(
  target: KeyTarget,
  getBindings: () => Bindings,
): InputProvider {
  const codes = new Set<string>();

  const isBound = (code: string): boolean => Object.values(getBindings()).includes(code);

  const onKeyDown = (event: Event): void => {
    const code = (event as KeyboardEvent).code;
    codes.add(code);
    if (isBound(code)) event.preventDefault();
  };
  const onKeyUp = (event: Event): void => {
    const code = (event as KeyboardEvent).code;
    codes.delete(code);
    if (isBound(code)) event.preventDefault();
  };
  const onBlur = (): void => {
    codes.clear();
  };

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("blur", onBlur);

  return {
    id: "keyboard",
    poll(): ActionState {
      const bindings = getBindings();
      const state = emptyActionState();
      for (const action of ACTIONS) state[action] = codes.has(bindings[action]);
      return state;
    },
    destroy(): void {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", onBlur);
      codes.clear();
    },
  };
}

export function captureNextKey(target: KeyTarget, onKey: (code: string) => void): () => void {
  const handler = (event: Event): void => {
    event.preventDefault();
    target.removeEventListener("keydown", handler);
    onKey((event as KeyboardEvent).code);
  };
  target.addEventListener("keydown", handler);
  return () => target.removeEventListener("keydown", handler);
}
