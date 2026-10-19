import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT } from "../src/content/registry.ts";
import { validateContent } from "../src/content/validate.ts";

const errors = validateContent(CONTENT, (mapPath) =>
  JSON.parse(readFileSync(join("public", mapPath), "utf8")),
);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`x ${error}`);
  }
  process.exit(1);
}

console.log(
  `content OK: ${CONTENT.stages.length} etapas, ${CONTENT.bosses.length} jefes, ${CONTENT.enemies.length} enemigos, ${CONTENT.characters.length} personajes`,
);
