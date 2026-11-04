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
  base: "/bible/lineage/",
  plugins: [renderBlockingEntry()],
  // Pinned so the bible-ui app switcher can link across dev servers.
  server: { port: 5174, strictPort: true },
  // In production Atlas's data sits beside us in ../atlas/, and this folder holds only Lineage's own offline files.
  // Dev serves Atlas's public folder here instead.
  publicDir: command === "serve" ? "../atlas/public" : "public",
}));
