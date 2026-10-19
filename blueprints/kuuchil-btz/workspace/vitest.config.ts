import { defineConfig } from "vitest/config";

// Los tests nunca importan Phaser: solo módulos puros (src/core, src/input, src/content, ...).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["blueprints/**", "dist/**", "node_modules/**"],
  },
});
