import { type ActionSnapshot, type ActionState, ACTIONS, emptyActionState } from "./actions.ts";

export type InputProvider = {
  readonly id: string;
  poll(): ActionState;
  destroy(): void;
};

export class InputManager {
  private providers: InputProvider[];
  private previous: ActionState = emptyActionState();

  constructor(providers: InputProvider[] = []) {
    this.providers = providers;
  }

  addProvider(provider: InputProvider): void {
    this.providers.push(provider);
  }

  update(): ActionSnapshot {
    const held = emptyActionState();
    for (const provider of this.providers) {
      const state = provider.poll();
      for (const action of ACTIONS) {
        if (state[action]) held[action] = true;
      }
    }
    const pressed = emptyActionState();
    for (const action of ACTIONS) {
      pressed[action] = held[action] && !this.previous[action];
    }
    this.previous = held;
    return { held, pressed };
  }

  destroy(): void {
    for (const provider of this.providers) provider.destroy();
    this.providers = [];
    this.previous = emptyActionState();
  }
}
