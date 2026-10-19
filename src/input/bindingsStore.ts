import { DEFAULT_BINDINGS, type Bindings } from "./actions.ts";
import { parseBindings } from "./bindings.ts";

export const BINDINGS_STORAGE_KEY = "kuuchil-btz:bindings:v1";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function getBrowserStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadBindings(storage: StorageLike | null): Bindings {
  try {
    const raw = storage?.getItem(BINDINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_BINDINGS;
    return parseBindings(JSON.parse(raw)) ?? DEFAULT_BINDINGS;
  } catch {
    return DEFAULT_BINDINGS;
  }
}

export function saveBindings(storage: StorageLike | null, bindings: Bindings): boolean {
  try {
    if (!storage) return false;
    storage.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(bindings));
    return true;
  } catch {
    return false;
  }
}

export function clearBindings(storage: StorageLike | null): boolean {
  try {
    if (!storage) return false;
    storage.removeItem(BINDINGS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
