import { ACTIONS, type Action, type Bindings } from "./actions.ts";

export const RESERVED_CODES = ["Tab", "F5", "F11", "F12", "MetaLeft", "MetaRight"] as const;

export type RebindResult =
  | { ok: true; bindings: Bindings; swappedWith: Action | null }
  | { ok: false; reason: "reserved" };

const isReserved = (code: string): boolean => (RESERVED_CODES as readonly string[]).includes(code);

export function rebind(bindings: Bindings, action: Action, code: string): RebindResult {
  if (isReserved(code)) return { ok: false, reason: "reserved" };
  const next: Record<Action, string> = { ...bindings };
  const other = ACTIONS.find((a) => a !== action && bindings[a] === code) ?? null;
  if (other) next[other] = bindings[action];
  next[action] = code;
  return { ok: true, bindings: next, swappedWith: other };
}

export function parseBindings(raw: unknown): Bindings | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const out: Partial<Record<Action, string>> = {};
  const seen = new Set<string>();
  for (const action of ACTIONS) {
    const value = record[action];
    if (typeof value !== "string" || value === "" || isReserved(value) || seen.has(value)) {
      return null;
    }
    seen.add(value);
    out[action] = value;
  }
  return out as Bindings;
}

const ARROWS: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Escape: "Esc",
};

export function keyLabel(code: string): string {
  if (code in ARROWS) return ARROWS[code] as string;
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}
