# Rainbow — Bible Cross-Reference Visualization

## Project Overview
Interactive visualization of all 344,799 OpenBible.info cross-references, with BSB verse text. Vanilla TypeScript (no framework), arcs in WebGL2, axis and heatmap on Canvas 2D, a Three.js galaxy, D3 for zoom/pan. Sibling project to [Chronos](https://github.com/jessespencer/chronos).

## Stack
- TypeScript + Vite (dev & build)
- WebGL2 for arcs, Canvas 2D overlay for axis, highlights and heatmap
- Three.js for the Galaxy view, loaded by dynamic import only
- D3.js v3/v4 (selection, transition, zoom)
- Deployed as static site at `/rainbow/` base path

## Shared Design System
Both Rainbow and Chronos use the [`@jessespencer/bible-ui`](../bible-ui) package for:
- Site header component (`createHeader()`) — title, subtitle, gradient bar, controls slot, app switcher
- Book and verse numbering (`@jessespencer/bible-ui/bible`), re-exported by `scripts/bible-metadata.ts`
- Design tokens — colors, fills, borders, text hierarchy, radii (CSS custom properties)
- Typography — Fraunces (serif, UI) + DM Mono (monospace, data)
- Font loading (`loadFonts()`)
- The Controls guide (`/guide`). Each view's wording lives in `src/lib/guides.ts`; keep it true when a view's input changes

The shared package is a local dependency at `../bible-ui`. Rainbow's `src/style.css` layers app-specific tokens on top of the shared base. Rainbow puts its toolbar in the header's controls slot and compacts the header with `#app`-scoped CSS. Chronos uses the same layout through bible-ui's `compact` option; move Rainbow onto it, and onto bible-ui's `setupSheet`, in place of its own copies.

## Architecture
- **No framework** — vanilla TS with direct DOM manipulation
- **Verse-level arcs** — every link is one instanced line strip in `arcGl.ts`, bucketed by span so short arcs use fewer segments
- **Two stacked canvases** — `#arc-canvas` (WebGL) under `#main-canvas` (2D overlay, receives input)
- **Fixed world** — baseline at y = 0, Genesis to Revelation across `WORLD_WIDTH`, so resizes keep the reader's place
- **Links are ids** — `links.bin` is sorted by votes, so ascending id means strongest first
- **Three views** — arc diagram (default), heatmap matrix and galaxy, toggled in UI. All share `selection`, `filter` and the companion
- **Galaxy stays lazy** — `main.ts` only `import type`s from `lib/galaxy.ts`, so Arcs' first paint never loads `three`. Keep it that way
- **Galaxy draws a capped set** — one star per verse (a verse id is a star id), but edges only for the strongest 6,000 visible links and 4,000 of the focus's links, never all of them. The render loop stops while the view or tab is hidden and draws only when something changed
- **Galaxy shapes are position sets** — each shape is one `layout*` function returning a position per verse, built on first use. Stars and edges morph between them
- **One vibrancy** — arcs blend additively with one alpha rule; selections and section filters fade the other arcs to `BACKGROUND_DIM` rather than brightening their own
- **Colors are genres** — the 8 canon sections in `data/genres.ts`; OpenBible has no theme data, so don't invent categories
- **URL is state** — `?ref=John.3.16&to=Rom.5.8&votes=10&genre=gospels&view=galaxy&shape=ring` (or `view=heatmap&scale=count`)
- **Canvas overlays** — legend, stats, zoom and credits float over the canvas; `pointer-events: none` on their wrappers keeps pan and tap working underneath
- **About dialog** — holds the full credits. Keep the OpenBible link visible in `#canvas-credits`
- **Phone** — below 760px the companion is a bottom sheet; a finger on the book strip scrubs, elsewhere it pans and pinches. Galaxy shifts its view up by `setInset` to stay clear of the sheet

## Code Style
- Use `const` over `let`; avoid `var`
- camelCase for variables/functions, PascalCase for types
- Prefer named exports
- This is NOT a React project — do not introduce React patterns

## Key Files
- `src/main.ts` — app state, selection, URL, event handling
- `src/lib/arcGl.ts` — WebGL arc renderer
- `src/lib/renderer.ts` — axis, highlighted arcs, arc hit testing
- `src/lib/links.ts` — link store, filter, per-verse index
- `src/lib/verses.ts` — verse numbering, reference parsing and formatting
- `src/lib/companion.ts` — passage and connection panel
- `src/lib/sheet.ts` — phone bottom sheet
- `src/lib/heatmap.ts` — heatmap matrix rendering
- `src/lib/galaxy.ts` — Three.js star view, lazy-loaded
- `src/style.css` — app styles; `#app`-scoped phone rules because bible-ui's CSS loads later

## Data
- Sources: OpenBible.info cross-references (CC BY 4.0, keep the footer credit) and the Berean Standard Bible (public domain)
- `public/data/links.bin` — Int16 rows of `[from, toStart, toEnd, votes]`, strongest first
- `public/data/bsb.json` — verse text in canonical order, loaded after first paint
- Verses are 0-based indices into KJV numbering (31,102 verses). The BSB leaves 16 verses empty; 3 John 15 folds into 14
- Pipeline: `pnpm build:data` downloads to `raw-data/` (ignored) and rebuilds both files

## Scripts
- `pnpm dev` — Vite dev server, pinned to port 5173 so the app switcher can reach it
- `pnpm build` — production build to `dist/`
- `pnpm build:data` — download raw sources and rebuild the datasets

## Git Conventions
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- Keep commit subjects under 72 characters
- Imperative mood in subject line
