# @jessespencer/bible-ui

Shared design system and UI components for Bible visualization apps — [Atlas](../../apps/rainbow) and [Lineage](../../apps/chronos).

## What's included

### Design tokens (CSS custom properties)
- Surface colors (`--bg-base`, `--bg-surface`, `--bg-elevated`)
- Fill states (`--fill-subtle` → `--fill-selected`)
- Borders (`--border-faint` → `--border-strong`, opacity-based)
- Text hierarchy (`--text-disabled` → `--text-bright`, 6 levels)
- Accent colors (`--accent-fill`, `--accent-border`, `--accent-text`)
- Radius scale (`--radius-sm` → `--radius-lg`)
- `.bui-select`, a dropdown with its own chevron, and the keyboard focus ring
- Typography (`--font-ui`: Fraunces, `--font-mono`: DM Mono)

### Components
- `createHeader({ title, subtitle, appId, compact })` — site header with title, subtitle, rainbow gradient bar, and a `controls` slot for app-specific buttons. `appId` adds the app switcher. `compact` gives the one-bar layout, with a `center` slot for search
- `APPS`, `appHref(app)` — the app registry and a URL to each app that works in dev and production
- `setupSheet(panel, handle, onClose)` (from `/sheet`) — the two-height phone bottom sheet. Give the panel `.bui-sheet` and the handle `.bui-sheet__handle`
- `books`, `bookOffsets`, `totalVerses` (from `/bible`) — the 66 books and KJV verse numbering, 31,102 verses
- `createGuide({ parent, stage, icon })` (from `/guide`) — a Controls button that opens how to explore the current view, with mouse or touch steps and keyboard keys, plus a one-time tip the first time a reader opens each view. Call `show(id, content)` when the view changes; apps pass their own icons
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
