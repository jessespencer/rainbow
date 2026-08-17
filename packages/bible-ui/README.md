# @jessespencer/bible-ui

Shared design system and UI components for Bible visualization apps — [Rainbow Reference](../../apps/rainbow) and [Chronos](../../apps/chronos).

## What's included

### Design tokens (CSS custom properties)
- Surface colors (`--bg-base`, `--bg-surface`, `--bg-elevated`)
- Fill states (`--fill-subtle` → `--fill-selected`)
- Borders (`--border-faint` → `--border-strong`, opacity-based)
- Text hierarchy (`--text-disabled` → `--text-bright`, 6 levels)
- Accent colors (`--accent-fill`, `--accent-border`, `--accent-text`)
- Radius scale (`--radius-sm` → `--radius-pill`)
- Typography (`--font-ui`: Fraunces, `--font-mono`: DM Mono)

### Components
- `createHeader({ title, subtitle })` — site header with title, subtitle, rainbow gradient bar, and a `controls` slot for app-specific buttons
- `loadFonts()` — injects Google Fonts stylesheet for Fraunces + DM Mono

## Usage

```typescript
import "@jessespencer/bible-ui/style.css";
import { createHeader, loadFonts } from "@jessespencer/bible-ui";

loadFonts();

const { element, controls } = createHeader({
  title: "My App",
  subtitle: "A Bible Visualization",
});

document.getElementById("app")!.appendChild(element);

// Add your own buttons to the controls slot
const btn = document.createElement("button");
btn.textContent = "Zoom";
controls.appendChild(btn);
```

## Install

Workspace package — apps in this monorepo depend on it via pnpm:

```json
"dependencies": {
  "@jessespencer/bible-ui": "workspace:*"
}
```

No build step: `main` points at `src/index.ts` and Vite compiles the raw TS.
