import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: "/rainbow/timeline/",
  // Pinned so the bible-ui app switcher can link across dev servers.
  server: { port: 5174, strictPort: true },
  // In production Rainbow's data sits one level up. Dev serves it here instead.
  publicDir: command === "serve" ? "../rainbow/public" : false,
}));
