# Chronos

> *4,150 years rendered as a single scrollable sweep. Every bar a life, every overlap a shared moment in history.*

Chronos is an interactive horizontal-scrolling Bible timeline — Adam through the resurrection of Jesus (~AD 33). Drag a scrubber across millennia to see who was alive at any given moment. Zoom from bird's-eye to individual king reigns.

Built with vanilla TypeScript and Vite. Chronology follows Ussher (pre-monarchy) and Thiele (divided kingdom). Part of a shared Bible visualization ecosystem with [Rainbow Reference](https://github.com/jessespencer/rainbow-reference).

---

## Features

- **108 figures** across 11 categories — antediluvian patriarchs, kings of Israel and Judah, prophets, exile-era leaders, and the Messiah
- **Draggable scrubber** — position it anywhere on the timeline to highlight who was alive and see details in a floating panel
- **Ctrl+Scroll zoom** — smoothly zoom from a full 4,150-year overview down to individual reign bars, anchored to cursor position
- **Era background bands** — subtle colored bands (Primeval, Patriarchal, Judges, Monarchy, Exile, etc.) orient you at a glance
- **Minimap** — compressed overview at the bottom with click-to-navigate and draggable viewport indicator
- **Hover tooltips** — lifespan, reign period, scripture reference, and blurb on any figure bar
- **Reign overlays** — kings with known lifespans show a distinct reign stripe within their lifespan bar

## Shared Design System

Chronos uses [`@jessespencer/bible-ui`](../bible-ui) for its header, design tokens, and typography — the same package used by Rainbow Reference. Both apps share Fraunces + DM Mono typography, the navy-toned color palette, and the rainbow gradient header bar.

## Scripts

```bash
npm install       # install dependencies (including local bible-ui package)
npm run dev       # start dev server
npm run build     # type-check and build for production
npm run preview   # preview production build locally
```

## Tech Stack

| Layer | Choice |
|---|---|
| Build | Vite + TypeScript |
| Rendering | Vanilla DOM (no framework) |
| Styling | CSS custom properties (shared via `@jessespencer/bible-ui`) |
| Typography | Fraunces (serif) + DM Mono (monospace) |
| Zoom | Custom wheel handler with dynamic `pixelsPerYear` |

## Data

108 figures with birth, death, reign dates, scripture references, and blurbs. Chronology sources:

| Period | Source |
|---|---|
| Pre-monarchy (Adam → David) | James Ussher, *Annals of the World* (1650) |
| Divided kingdom | Edwin R. Thiele, *The Mysterious Numbers of the Hebrew Kings* (3rd ed., 1983) |

---

MIT
