# Chronos — Bible Timeline

Interactive horizontal-scrolling Bible timeline visualization. Sibling project to [Rainbow Reference](https://github.com/jessespencer/rainbow-reference).

Scope: Adam through Jesus's resurrection (~AD 33). No apostolic age yet.

## Stack

- **Vanilla TypeScript + Vite** — no framework, no React
- Single page: HTML + CSS + TS
- Dark theme with design tokens via CSS custom properties
- Deployed as a static site at `/timeline/` base path

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
| `src/main.ts` | App entry point |
| `src/style.css` | Global styles and design tokens |
| `src/data/timeline.ts` | Figure/event data (stub) |
| `src/lib/scale.ts` | `yearToX` coordinate mapping (stub) |
| `vite.config.ts` | Vite config — sets `/timeline/` base path |
| `index.html` | Shell HTML |

## Code Style

- `const` over `let`; never `var`
- `camelCase` for variables and functions
- `PascalCase` for types and interfaces
- Named exports only — no default exports
- Keep functions small and pure where possible

## Git Conventions

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`
- Imperative mood, subject under 72 characters
