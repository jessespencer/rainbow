# Rainbow — Bible Cross-Reference Visualization

## Project Overview
Interactive canvas-based visualization of 63,000+ Bible cross-references. Vanilla TypeScript (no framework), rendered on HTML5 Canvas, with D3 for zoom/pan.

## Stack
- TypeScript + Vite (dev & build)
- HTML5 Canvas 2D rendering
- D3.js v3/v4 (scale, selection, transition, zoom)
- Web Worker for data loading/binning
- CSS variables for dark theme design tokens
- Deployed as static site at `/rainbow/` base path

## Architecture
- **No framework** — vanilla TS with direct DOM manipulation
- **Bin-based rendering** — references aggregated by (source book, target book, category) into bins; one arc per bin
- **Web Worker** — data loading and binning happens off-main-thread
- **Dual views** — arc diagram (default) and heatmap matrix, toggled in UI
- **Canvas hit testing** — custom tolerance-based ray casting for hover/click on arcs

## Code Style
- Use `const` over `let`; avoid `var`
- camelCase for variables/functions, PascalCase for types
- Prefer named exports
- This is NOT a React project — do not introduce React patterns

## Key Files
- `src/main.ts` — main app logic, state management, event handling (~660 lines)
- `src/lib/renderer.ts` — arc drawing and hit testing
- `src/lib/layout.ts` — canvas coordinate system and book positioning
- `src/lib/dataWorker.ts` — Web Worker for loading/binning reference data
- `src/lib/heatmap.ts` — heatmap matrix rendering
- `src/style.css` — all styles and design tokens (~700 lines)
- `index.html` — single-page template with canvas, controls, modals

## Data
- Source: openbible.info cross-references
- Format: `{ s: [book, ch, v], t: [book, ch, v], cat: index }`
- Pre-built into `public/references.json` (~63,779 references)
- Pipeline: `npm run build:data` (download + parse) → `npm run generate` (build JSON)

## Scripts
- `npm run dev` — Vite dev server
- `npm run build` — production build to `dist/`
- `npm run build:data` — download and parse raw cross-references
- `npm run generate` — generate references.json

## Git Conventions
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- Keep commit subjects under 72 characters
- Imperative mood in subject line
