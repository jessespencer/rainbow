import { defineConfig } from "vite";

export default defineConfig({
  base: "/rainbow/timeline/",
  // Pinned so the bible-ui app switcher can link across dev servers.
  server: { port: 5174, strictPort: true },
});
