import { readFileSync } from "node:fs";
import { join } from "node:path";
import { preview } from "vite";

// Sirve dist/ con `vite preview` y pide index.html y el entry JS por HTTP (blueprint §19.6).
const HOST = "127.0.0.1";
const PORT = 4173;
const MARKER = "kuuchil-btz";

async function fetchText(path: string): Promise<string> {
  const response = await fetch(`http://${HOST}:${PORT}${path}`);
  if (response.status !== 200) {
    throw new Error(`GET ${path} devolvió ${response.status}, se esperaba 200`);
  }
  return response.text();
}

async function main(): Promise<void> {
  const html = readFileSync(join("dist", "index.html"), "utf8");
  const entrySrc = html.match(/<script\b[^>]*\bsrc="([^"]+\.js)"/)?.[1];
  if (entrySrc === undefined) {
    throw new Error("dist/index.html no referencia ningún script .js; ejecuta pnpm build");
  }
  const server = await preview({
    logLevel: "warn",
    preview: { host: HOST, port: PORT, strictPort: true, open: false },
  });
  try {
    const page = await fetchText("/");
    if (!page.includes(MARKER)) {
      throw new Error(`GET / no contiene el marcador ${MARKER}`);
    }
    const entryPath = `/${entrySrc.replace(/^\.?\//, "")}`;
    const entry = await fetchText(entryPath);
    if (!entry.includes(MARKER)) {
      throw new Error(`GET ${entryPath} no contiene el marcador ${MARKER}`);
    }
    console.log(`smoke-dist OK: http://${HOST}:${PORT}${entryPath}`);
  } finally {
    await server.close();
  }
}

main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(`smoke-dist: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  },
);
