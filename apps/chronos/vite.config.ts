import { defineConfig } from "vite";
import type { Plugin } from "vite";

/** Holds first paint until the app has built its header, so moving between apps doesn't flash. */
const renderBlockingEntry = (): Plugin => ({
  name: "render-blocking-entry",
  transformIndexHtml: {
    order: "post",
    handler: (html) => html.replace(`<script type="module"`, `<script type="module" blocking="render"`),
  },
});

export default defineConfig(({ command }) => ({
  base: "/rainbow/timeline/",
  plugins: [renderBlockingEntry()],
  // Pinned so the bible-ui app switcher can link across dev servers.
  server: { port: 5174, strictPort: true },
  // In production Rainbow's data sits one level up. Dev serves it here instead.
  publicDir: command === "serve" ? "../rainbow/public" : false,
}));
