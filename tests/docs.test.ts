import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TUNING } from "../src/core/tuning.ts";

const skillFiles = readdirSync(".claude/skills").map((name) =>
  join(".claude/skills", name, "SKILL.md"),
);
const docFiles = ["README.md", "docs/PLAYTEST.md", "docs/DEPLOY.md", ...skillFiles];

function referencedPaths(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(/`([^`\s]+)`/g)]
    .map((m) => m[1] as string)
    .filter((p) => /^(src|public|scripts|tests)\//.test(p))
    .filter((p) => /\.[a-z]+$/.test(p))
    .filter((p) => !p.includes("<") && !p.includes("*"));
}

describe("docs", () => {
  it("only reference files that exist", () => {
    for (const file of docFiles) {
      for (const path of referencedPaths(file)) {
        expect(existsSync(path), `${file} -> ${path}`).toBe(true);
      }
    }
  });

  it("document every TUNING key", () => {
    const playtest = readFileSync("docs/PLAYTEST.md", "utf8");
    for (const key of Object.keys(TUNING)) expect(playtest).toContain(key);
  });

  it("explain the build output", () => {
    const deploy = readFileSync("docs/DEPLOY.md", "utf8");
    expect(deploy).toContain("pnpm build");
    expect(deploy).toContain("dist/");
  });
});
