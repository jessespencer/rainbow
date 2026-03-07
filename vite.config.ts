import { defineConfig } from 'vite';

export default defineConfig({
  base: '/rainbow/',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
});
