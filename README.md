# bible-viz

Monorepo for Bible visualization tools sharing a common design system.

> **Note:** the GitHub repo is currently named `rainbow` for historical reasons. It will likely be renamed once a permanent parent name lands. The internal package name is `bible-viz` as a placeholder.

## Workspaces

| Path | Package | Description |
|---|---|---|
| `apps/rainbow` | `rainbow` | Rainbow Reference — interactive arc visualization of 63k+ Bible cross-references. |
| `apps/chronos` | `chronos` | Chronos — horizontal-scrolling Bible timeline (Adam → resurrection). |
| `packages/bible-ui` | `@jessespencer/bible-ui` | Shared header, fonts, and design tokens. |

## Stack

Vanilla TypeScript + Vite for both apps. No framework. The shared `bible-ui` package exports raw TS/CSS — consumers import directly with no build step.

## Development

```bash
pnpm install
pnpm dev:rainbow      # http://localhost:5173/rainbow/
pnpm dev:chronos      # http://localhost:5174/rainbow/timeline/
pnpm build            # builds both apps
```

Dev ports are pinned (`strictPort`) so the header's app switcher can link
across the two dev servers. Run both to move between apps locally.

## Deployment

Both apps are deployed together to GitHub Pages via `.github/workflows/deploy.yml`:

- Rainbow Reference → `https://jessespencer.github.io/rainbow/`
- Chronos → `https://jessespencer.github.io/rainbow/timeline/`

The workflow builds each app and assembles a combined `dist/` with chronos nested under `timeline/`.

## History

This repo absorbed two previously-separate repositories:

- `jessespencer/chronos` → `apps/chronos/`
- `jessespencer/bible-ui` → `packages/bible-ui/`

Both have been deleted. Their git histories were rewritten under the paths
above and grafted in, so this repo is the sole source of truth — use
`git log --follow <path>` to read a file's history from before the move.
