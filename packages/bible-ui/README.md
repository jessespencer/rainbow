# @jessespencer/bible-ui

Shared design system and UI components for Bible visualization apps — [Atlas](../../apps/rainbow) and [Lineage](../../apps/chronos).

## What's included

### Design tokens (CSS custom properties)
- Deep Night surfaces (`#020611` base), shared with By Heart (`--bg-edge`, `--bg-base`, `--bg-surface`, `--bg-elevated`, plus `--bg-scrim` and `--bg-glass` for overlays). Hairlines are starlight blue
- Fill states (`--fill-subtle` → `--fill-selected`)
- Borders (`--border-faint` → `--border-strong`, opacity-based)
- Parchment text hierarchy (`--text-disabled` → `--text-bright`, 6 levels)
- One accent per app. Each app sets `--accent-rgb`, `--accent-bright` and `--accent-fill` on `html:root`; `--accent-text`, `--accent-border`, `--accent-glow` and `--accent-halo` derive from them. Atlas is Starlight, Lineage Candlelight, By Heart Ember
- Depth from light: `--shadow-raised` is a halo in the app's accent for selected and live states; `--shadow-pop` for menus
- Radius scale (`--radius-sm` → `--radius-lg`)
- `.bui-select`, a dropdown with its own chevron, and the keyboard focus ring
- Typography (`--font-display`: IM Fell Great Primer, `--font-ui`: EB Garamond, `--font-mono`: DM Mono)

### Components
- `createHeader({ title, subtitle, appId, compact })` — site header with title, subtitle, rainbow gradient bar, and a `controls` slot for app-specific buttons. `appId` adds the app switcher. `compact` gives the one-bar layout, with a `center` slot for search
- `APPS`, `appHref(app)` — the app registry and a URL to each app that works in dev and production. Each entry carries its Lucide icon as SVG markup and its accent, and the switcher draws each icon glowing in its own app's accent
- `setupSheet(panel, handle, onClose)` (from `/sheet`) — the two-height phone bottom sheet. Give the panel `.bui-sheet` and the handle `.bui-sheet__handle`
- `books`, `bookOffsets`, `totalVerses` (from `/bible`) — the 66 books and KJV verse numbering, 31,102 verses
- `createGuide({ parent, stage, icon })` (from `/guide`) — a Controls button that opens how to explore the current view, with mouse or touch steps and keyboard keys, plus a one-time tip the first time a reader opens each view. Call `show(id, content)` when the view changes; apps pass their own icons
- `loadFonts()` — injects the Google Fonts stylesheet for EB Garamond, IM Fell Great Primer and DM Mono
- `TRANSLATIONS`, `savedTranslation()`, `saveTranslation()` (from `/translations`) — the Bibles on offer, their files and licences, and the reader's pick shared across apps
- `createTranslationPicker({ parent, current, onChange })` (from `/translation-picker`) — the chip and grouped menu for picking a translation
- `cssToken(name)` (from `/tokens`) — reads a design token for canvas, SVG and WebGL code, which can't use `var()`

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
