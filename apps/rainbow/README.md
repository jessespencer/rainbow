# 🌈 Rainbow Reference

> *63,000 threads woven through 66 books. Every arc a conversation across millennia.*

Rainbow Reference is an interactive exploration of connections across the Bible, inspired by [Chris Harrison's](https://www.chrisharrison.net/index.php/visualizations/BibleViz) arc diagram.

**The current visualization uses 63,779 synthetic demo pairs generated with a seeded algorithm. These are not documented scriptural cross-references.** Each rendered arc aggregates demo pairs by book pair and theme. The separately curated **Creation & light** journey contains verified passage text and editorial explanations; it does not alter the graph counts.

---

## ✨ Features

### Three Ways to Explore

**Arc View** groups demo connections by book pair and theme, with group labels at overview scale and book names as space permits.

**Heatmap View** shows counts between books in a 66×66 matrix. Filters recalculate counts, dominant themes, and logarithmic brightness. Selecting a cell opens its reference list.

**Galaxy View** places verses in a 3D network. Select a verse to isolate its neighborhood, or use **Explore references** for a readable alternative. Galaxy loads on demand and pauses while hidden.

### 8 Theological Categories

The synthetic generator assigns each demo pair to one of eight thematic categories. These assignments are illustrative, not verified interpretation:

| Color | Category | What it tracks |
|-------|----------|----------------|
| 🔴 Crimson | Sin & Redemption | The arc from fall to restoration |
| 🟡 Gold | Messianic Prophecy | Predictions and their fulfillments |
| 🟠 Amber | Praise & Worship | Liturgical echoes and doxology |
| 🟢 Sage | Wisdom | Proverbs, teaching, and moral instruction |
| 🔵 Teal | Creation | Cosmology and the natural order |
| 🟣 Violet | Historical Parallel | Typology and mirrored events |
| 🩵 Sky | Law & Covenant | Legal codes and their restatements |
| ⚪ Pearl | Prophecy & Apocalyptic | Eschatological vision and symbol |

### Exploration Tools

- **Book Search** — type any book name or common abbreviation to instantly highlight and filter to its connections
- **Click-to-Filter** — click any book label to isolate just its arcs; click again to release
- **Hover Tooltips** — pause over any arc for verse references and category details
- **Side Panel** — click an arc to open a full detail view: demo reference pairs and connection counts
- **Shuffle Mode** — randomly surface a synthetic demo pair
- **Discover a connection** — three sourced readings with passage text, explanations, highlighted endpoints, and links to Chronos
- **Explore references** — searchable, keyboard-accessible books, pairs, and verses
- **Share and retrace** — URLs restore view and selection; Back retraces exploration
- **Preset Views** — jump instantly to Fit All, Old Testament only, or New Testament only

### Performance Architecture

With over 63,000 reference pairs, naive DOM rendering isn't an option. Rainbow Reference uses:

- **HTML5 Canvas** for all arc and heatmap rendering — thousands of elements drawn in a single paint pass
- **Web Worker** for data loading and binning, keeping the main thread free during initialization
- **D3 zoom/pan** layered on top of Canvas for smooth, native-feeling navigation
- **Spatial hit-testing** on click and hover so interactivity stays sharp even at full data density

---

## 🗂 Project Structure

```
rainbow-reference/
├── public/
│   └── references.json          # Synthetic demo dataset (63,779 pairs)
├── src/
│   ├── main.ts                  # App state, event wiring, animation loop
│   ├── style.css                # Dark theme, CSS design tokens
│   ├── data/
│   │   ├── books.ts             # Metadata for all 66 canonical books
│   │   ├── categories.ts        # 8 theological categories with color assignments
│   │   └── sampleReferences.ts  # Curated verse pairs for the side panel
│   └── lib/
│       ├── dataWorker.ts        # Web Worker: fetch, parse, and bin references
│       ├── layout.ts            # Canvas coordinate system and book positioning
│       ├── renderer.ts          # Arc drawing, color mapping, hit testing
│       ├── heatmap.ts           # Matrix view: cell rendering and interaction
│       ├── tooltip.ts           # Hover tooltip and side panel UI logic
│       └── zoom.ts              # D3-based zoom/pan behavior and preset transitions
├── scripts/
│   ├── download-data.ts         # Download raw cross-reference data from openbible.info
│   ├── parse-crossrefs.ts       # Parse TSV into JSON with theme classification
│   └── generateReferences.ts    # Generate seeded synthetic references.json
├── index.html
├── vite.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install

```bash
git clone https://github.com/jessespencer/rainbow.git
cd rainbow
npm install
```

### Develop

```bash
npm run dev
# → http://localhost:5173/rainbow/
```

### Build

```bash
npm run build
# Production output → dist/
```

### Data Pipeline

The app loads `public/references.json`. Its contents match the output of `scripts/generateReferences.ts` byte for byte (verified October 16, 2026). That script generates synthetic pairs with seed 42; it does not import OpenBible data.

```bash
pnpm --filter rainbow generate    # Regenerate the synthetic demo dataset
pnpm --filter rainbow build:data  # Separate OpenBible download/parse pipeline
```

The OpenBible pipeline writes `public/data/cross-references.json` in a different format. The current app does not load that file. Switching to sourced graph data requires an explicit adapter and provenance review; running `build:data` does not replace the active graph.

---

## 🎨 Design Notes

The color scheme is drawn directly from visible light — a literal rainbow mapped to theological spectrum. The dark background is intentional: arcs are luminous against darkness, the same way meaning emerges from the surrounding silence of a text.

Typography uses Fraunces (a warm variable serif) for content and DM Mono for verse references and UI labels — two registers kept visually distinct: meaning vs. metadata.

The arc shape follows a simple semicircle rather than a cubic Bézier, which Harrison's original used. The tradeoff: slightly less visual elegance for significantly better hit-testing accuracy at high zoom levels.

## 🤝 Shared Design System

Rainbow Reference is part of a Bible visualization ecosystem alongside [Chronos](../chronos) (interactive timeline). Both apps share the [`@jessespencer/bible-ui`](../../packages/bible-ui) package, which provides:

- **Site header** — `createHeader()` with title, subtitle, rainbow gradient bar, and controls slot
- **Design tokens** — navy-toned palette, opacity-based borders, fill states, text hierarchy (CSS custom properties)
- **Typography** — Fraunces + DM Mono via Google Fonts, with `loadFonts()` helper

---

## 📚 Data Source & Attribution

Active graph: synthetic demo data from this repository's seeded generator. Do not cite its pairs or counts as evidence of actual textual relationships.

Curated reading text: World English Bible Classic, public domain, from [Genesis 1](https://ebible.org/eng-web/GEN01.htm), [John 1](https://ebible.org/eng-web/JHN01.htm), and [2 Corinthians 4](https://ebible.org/eng-web/2CO04.htm). Emphasis and explanations are editorial.

A separate, currently unused importer targets [OpenBible.info](https://www.openbible.info/labs/cross-references/). Verify its dataset and attribution before integrating it into the active graph.

Arc diagram concept originally visualized by [Chris Harrison](https://www.chrisharrison.net/index.php/visualizations/BibleViz) at Carnegie Mellon University.

---

## 🛠 Tech Stack

| Layer | Library |
|-------|---------|
| Build | Vite + TypeScript |
| Rendering | HTML5 Canvas API |
| Interaction | D3 (scale, selection, transition, zoom) |
| Concurrency | Web Worker (data loading) |
| Icons | Lucide |

---

## License

MIT — see `LICENSE` for details.
