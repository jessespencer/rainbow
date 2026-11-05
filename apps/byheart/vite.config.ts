import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  base: '/bible/byheart/',
  plugins: [react()],
  // Pinned beside Atlas (5173) and Lineage (5174).
  server: { port: 5175, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
