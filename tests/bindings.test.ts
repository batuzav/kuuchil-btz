import { describe, expect, it } from "vitest";
import { DEFAULT_BINDINGS } from "../src/input/actions.ts";
import { keyLabel, parseBindings, rebind } from "../src/input/bindings.ts";
import {
  BINDINGS_STORAGE_KEY,
  type StorageLike,
  loadBindings,
  saveBindings,
} from "../src/input/bindingsStore.ts";

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
};
const throwing: StorageLike = {
  getItem() {
    throw new Error("blocked");
  },
  setItem() {
    throw new Error("blocked");
  },
  removeItem() {
    throw new Error("blocked");
  },
};

describe("rebind", () => {
  it("swaps codes when another action already uses the key", () => {
    const r = rebind(DEFAULT_BINDINGS, "jump", "KeyX");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.swappedWith).toBe("shoot");
      expect(r.bindings.jump).toBe("KeyX");
      expect(r.bindings.shoot).toBe("KeyZ");
    }
  });

  it("rejects reserved codes and leaves bindings untouched", () => {
    for (const code of ["Tab", "F5", "F11", "F12", "MetaLeft", "MetaRight"]) {
      expect(rebind(DEFAULT_BINDINGS, "jump", code)).toEqual({ ok: false, reason: "reserved" });
    }
  });

  it("assigns a free key without swapping", () => {
    const r = rebind(DEFAULT_BINDINGS, "jump", "KeyV");
    expect(r.ok && r.swappedWith).toBe(null);
  });
});

describe("persistence", () => {
  it("round-trips valid bindings", () => {
    const store = memory();
    const next = rebind(DEFAULT_BINDINGS, "dash", "KeyV");
    if (!next.ok) throw new Error("rebind failed");
    expect(saveBindings(store, next.bindings)).toBe(true);
    expect(loadBindings(store)).toEqual(next.bindings);
  });

  it("falls back to defaults on malformed, incomplete, duplicate or reserved data", () => {
    const store = memory();
    store.setItem(BINDINGS_STORAGE_KEY, "{nope");
    expect(loadBindings(store)).toEqual(DEFAULT_BINDINGS);
    const { dash: _dash, ...missing } = DEFAULT_BINDINGS;
    store.setItem(BINDINGS_STORAGE_KEY, JSON.stringify(missing));
    expect(loadBindings(store)).toEqual(DEFAULT_BINDINGS);
    store.setItem(BINDINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BINDINGS, dash: "KeyZ" }));
    expect(loadBindings(store)).toEqual(DEFAULT_BINDINGS);
    store.setItem(BINDINGS_STORAGE_KEY, JSON.stringify({ ...DEFAULT_BINDINGS, dash: "F5" }));
    expect(loadBindings(store)).toEqual(DEFAULT_BINDINGS);
    expect(parseBindings(null)).toBeNull();
  });

  it("never throws when storage is null or blocked", () => {
    expect(loadBindings(null)).toEqual(DEFAULT_BINDINGS);
    expect(loadBindings(throwing)).toEqual(DEFAULT_BINDINGS);
    expect(saveBindings(null, DEFAULT_BINDINGS)).toBe(false);
    expect(saveBindings(throwing, DEFAULT_BINDINGS)).toBe(false);
  });
});

describe("keyLabel", () => {
  it("renders arrows, letters, digits and Esc", () => {
    expect(keyLabel("ArrowLeft")).toBe("←");
    expect(keyLabel("KeyZ")).toBe("Z");
    expect(keyLabel("Digit5")).toBe("5");
    expect(keyLabel("Escape")).toBe("Esc");
    expect(keyLabel("Space")).toBe("Space");
  });
});
