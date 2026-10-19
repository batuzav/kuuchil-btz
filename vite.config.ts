import { defineConfig } from "vite";

// base "./" para que dist/ funcione en Cloudflare Pages y en un zip HTML5 de itch.io.
export default defineConfig({
  base: "./",
  optimizeDeps: {
    entries: ["index.html"],
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: ["**/blueprints/**"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Phaser es un solo chunk grande; el aviso de >500 kB es esperado (UNVERIFIED con Vite 8).
    chunkSizeWarningLimit: 2000,
  },
});
