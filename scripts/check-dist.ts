import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Ejerce el contrato index.html -> entry JS del build (blueprint §19.6, valores cruzados).
const DIST_DIR = "dist";
const MARKER = "kuuchil-btz";

function fail(message: string): never {
  console.error(`check-dist: ${message}`);
  process.exit(1);
}

const indexPath = join(DIST_DIR, "index.html");
if (!existsSync(indexPath)) {
  fail(`${indexPath} no existe; ejecuta pnpm build primero`);
}

const html = readFileSync(indexPath, "utf8");
const match = html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"/);
const entrySrc = match?.[1];
if (entrySrc === undefined) {
  fail("dist/index.html no referencia ningún script .js");
}
if (entrySrc.startsWith("/")) {
  fail(`la ruta ${entrySrc} es absoluta; vite.config.ts debe usar base "./"`);
}

const entryPath = join(DIST_DIR, entrySrc.replace(/^\.\//, ""));
if (!existsSync(entryPath) || statSync(entryPath).size === 0) {
  fail(`el entry ${entryPath} declarado en index.html no existe o está vacío`);
}
if (!readFileSync(entryPath, "utf8").includes(MARKER)) {
  fail(`el entry ${entryPath} no contiene el marcador ${MARKER}`);
}

console.log(`check-dist OK: ${entryPath}`);
