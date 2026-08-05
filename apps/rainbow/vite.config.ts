import { defineConfig } from 'vite';

export default defineConfig({
  base: '/rainbow/',
  // Pinned so the bible-ui app switcher can link across dev servers.
  server: { port: 5173, strictPort: true },
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
