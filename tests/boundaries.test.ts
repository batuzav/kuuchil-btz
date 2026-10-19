import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function tsFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

const offenders = (dirs: string[], needle: string): string[] =>
  dirs.flatMap(tsFiles).filter((file) => readFileSync(file, "utf8").includes(needle));

describe("module boundaries", () => {
  it("keeps phaser out of pure-logic directories", () => {
    const dirs = ["src/core", "src/input", "src/content", "src/characters", "src/bosses"];
    expect(offenders(dirs, 'from "phaser"')).toEqual([]);
  });

  it("keeps raw DOM listeners out of scenes", () => {
    expect(offenders(["src/scenes"], "addEventListener")).toEqual([]);
  });
});
