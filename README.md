# bible-viz

Tools for seeing the Bible whole, sharing one design system.

**▶ [Open Atlas](https://jessespencer.github.io/rainbow/)** · **[Open Lineage](https://jessespencer.github.io/rainbow/timeline/)**

Read the [Atlas](apps/rainbow/README.md) and [Lineage](apps/chronos/README.md) READMEs for what each one does, how the data works, and how to run it.

> **Note:** the GitHub repo is currently named `rainbow` for historical reasons. It will likely be renamed once a permanent parent name lands. The internal package name is `bible-viz` as a placeholder.

## Workspaces

| Path | Package | Description |
|---|---|---|
| `apps/rainbow` | `rainbow` | Atlas — interactive arc visualization of all 344,799 Bible cross-references, with verse text. |
| `apps/chronos` | `chronos` | Lineage — timeline of 157 biblical lives from Adam to the resurrection, with verse text. |
| `packages/bible-ui` | `@jessespencer/bible-ui` | Shared header, app switcher, bottom sheet, verse numbering, fonts, and design tokens. |

## Stack

Vanilla TypeScript + Vite for both apps. No framework. The shared `bible-ui` package exports raw TS/CSS — consumers import directly with no build step.

## Development

```bash
pnpm install
pnpm dev:rainbow      # http://localhost:5173/rainbow/
pnpm dev:chronos      # http://localhost:5174/rainbow/timeline/
pnpm build            # builds both apps
```

## Deployment

Both apps are deployed together to GitHub Pages via `.github/workflows/deploy.yml`:

- Atlas → `https://jessespencer.github.io/rainbow/`
- Lineage → `https://jessespencer.github.io/rainbow/timeline/`

The workflow builds each app and assembles a combined `dist/` with chronos nested under `timeline/`. Lineage has no data of its own to ship: it reads Atlas's `data/bsb.json` from one level up.

## History

This repo absorbed two previously-separate repositories:

- [`jessespencer/chronos`](https://github.com/jessespencer/chronos) → `apps/chronos/`
- [`jessespencer/bible-ui`](https://github.com/jessespencer/bible-ui) → `packages/bible-ui/`

Their original git histories live in those repos.
