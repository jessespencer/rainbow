# bible

A family of apps for reading and studying the Bible, sharing one design system.

**▶ [Open Atlas](https://jessedestroys.com/bible/atlas/)** · **[Open Lineage](https://jessedestroys.com/bible/lineage/)**

Read the [Atlas](apps/atlas/README.md), [Lineage](apps/lineage/README.md) and [By Heart](apps/byheart/README.md) READMEs for what each one does, how the data works, and how to run it.

## Workspaces

| Path | Package | Description |
|---|---|---|
| `apps/atlas` | `atlas` | Atlas — interactive arc visualization of all 344,799 Bible cross-references, with verse text. |
| `apps/lineage` | `lineage` | Lineage — timeline of 157 biblical lives from Adam to the resurrection, with verse text. |
| `apps/byheart` | `byheart` | By Heart — typographic app for memorizing Scripture, up to whole books. Not deployed yet. |
| `packages/bible-ui` | `@jessespencer/bible-ui` | Shared header, app switcher, bottom sheet, verse numbering, fonts, and design tokens. |

A new app joins as another `apps/<name>` folder and an entry in bible-ui's `APPS`, which puts it in the app switcher.

## Stack

Vanilla TypeScript + Vite for Atlas and Lineage, with no framework. By Heart is React + Vite, tested with Vitest, and doesn't use bible-ui yet. The shared `bible-ui` package exports raw TS/CSS — consumers import directly with no build step.

## Development

```bash
pnpm install
pnpm dev:atlas        # http://localhost:5173/bible/atlas/
pnpm dev:lineage      # http://localhost:5174/bible/lineage/
pnpm dev:byheart      # http://localhost:5175/bible/byheart/
pnpm test:byheart
pnpm build            # builds every app
```

## Deployment

Atlas and Lineage are deployed together to GitHub Pages via `.github/workflows/deploy.yml`:

- Atlas → `https://jessedestroys.com/bible/atlas/`
- Lineage → `https://jessedestroys.com/bible/lineage/`

The workflow builds each app into its own folder of a combined `dist/`, and `pages/index.html` sends `/bible/` on to Atlas. Lineage has no data of its own to ship: it reads Atlas's `data/` from `../atlas/`.

The apps used to live at `/rainbow/` and `/rainbow/timeline/`. Those addresses redirect here from the `jessespencer.github.io` repo, keeping any `?ref=` or `?figure=`.

## History

The repo was called `rainbow`, after Atlas's working name, until the family took the name `bible`. It absorbed three previously-separate repositories:

- [`jessespencer/chronos`](https://github.com/jessespencer/chronos) → `apps/lineage/`
- [`jessespencer/bible-ui`](https://github.com/jessespencer/bible-ui) → `packages/bible-ui/`
- `jessespencer/by-heart` (private) → `apps/byheart/`

The first two keep their git histories in those repos. By Heart came in with `git subtree`, so its history is here too.
