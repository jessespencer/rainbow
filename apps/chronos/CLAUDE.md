# Chronos — Bible Timeline

Interactive horizontal-scrolling Bible timeline visualization. Sibling project to [Rainbow Reference](../rainbow). Both share the [`@jessespencer/bible-ui`](../../packages/bible-ui) design system.

Scope: Adam through Jesus's resurrection (~AD 33). No apostolic age yet.

## Stack

- **Vanilla TypeScript + Vite** — no framework, no React
- Single page: HTML + CSS + TS
- Dark theme via shared design tokens from `@jessespencer/bible-ui`
- Typography: Fraunces (serif, UI) + DM Mono (monospace, data)
- Deployed as a static site at `/timeline/` base path

## Shared Design System

The `@jessespencer/bible-ui` workspace package (`packages/bible-ui`) provides:
- `createHeader()` — site header with title, subtitle, gradient bar, controls slot
- `loadFonts()` — injects Google Fonts (Fraunces + DM Mono)
- `style.css` — design tokens (colors, fills, borders, text hierarchy, radii)

Chronos imports the shared CSS first, then layers its own app-specific tokens (category colors, layout vars) on top.

## Year Convention

Years are stored as **signed integers**:
- Negative = BC (e.g., Adam born → `-4004`)
- Positive = AD (e.g., resurrection → `33`)
- There is no year 0 — handle the BC/AD boundary accordingly

## Chronology Sources

| Period | Source |
|---|---|
| Pre-monarchy (Adam → David) | **Ussher** |
| Divided kingdom | **Thiele** |

## Key Files

| File | Purpose |
|---|---|
| `src/main.ts` | App entry point — builds DOM, wires zoom/scrubber/minimap |
| `src/style.css` | App-specific tokens and component styles |
| `src/data/timeline.ts` | 108 figure records with birth/death/reign dates |
| `src/lib/scale.ts` | Dynamic `pixelsPerYear`, `yearToX`/`xToYear` coordinate mapping |
| `src/lib/renderBars.ts` | Greedy sub-row layout, bar rendering and repositioning |
| `src/lib/scrubber.ts` | Draggable scrubber, bar highlighting, floating detail panel |
| `src/lib/zoom.ts` | Ctrl+Scroll zoom with cursor anchoring, zoom buttons |
| `src/lib/minimap.ts` | Bottom minimap with viewport indicator and click navigation |
| `src/lib/tooltip.ts` | Hover tooltips on figure bars (400ms delay) |
| `src/lib/eras.ts` | Era band definitions (Primeval through Messianic) |
| `vite.config.ts` | Vite config — sets `/timeline/` base path |

## Code Style

- `const` over `let`; never `var`
- `camelCase` for variables and functions
- `PascalCase` for types and interfaces
- Named exports only — no default exports
- Keep functions small and pure where possible
- This is NOT a React project — do not introduce React patterns

## Git Conventions

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- Imperative mood, subject under 72 characters
