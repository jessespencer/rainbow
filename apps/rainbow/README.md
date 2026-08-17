# 🌈 Rainbow Reference

> *63,000 threads woven through 66 books. Every arc a conversation across millennia.*

Rainbow Reference is an interactive visualization of the Bible's internal cross-reference network — the hidden web of allusions, callbacks, prophecies, and echoes that bind scripture together. Inspired by [Chris Harrison's](https://www.chrisharrison.net/index.php/visualizations/BibleViz) landmark arc diagram, this app brings that structure to life as an explorable, filterable, living diagram.

Each arc represents a documented cross-reference. Each color a theological thread. Together, they reveal something remarkable: the Bible is not a collection of independent texts, but a single document in deep conversation with itself across thousands of years of authorship.

---

## ✨ Features

### Two Ways to See the Whole

**Arc View** renders the canonical Bible as a single horizontal axis — Genesis at the left, Revelation at the right — with semi-circular arcs leaping between connected verses. The density of arcs over Isaiah, Psalms, and the Gospels is immediately visible. So is the relative silence of certain books. The diagram doesn't editorialize; it simply shows what's there.

**Heatmap View** collapses that same data into a 66×66 matrix, where each cell's intensity reflects the volume of cross-references between two books. It's the difference between watching individual conversations and seeing a social graph: different information, equally revealing.

### 8 Theological Categories

Every cross-reference is classified into one of eight categories, each with its own color in the spectrum:

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
- **Side Panel** — click an arc to open a full detail view: curated sample references, connection counts, and the theological thread it belongs to
- **Shuffle Mode** — randomly surface a cross-reference pair, ideal for discovery and devotional use
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
│   └── references.json          # Pre-built cross-reference dataset (63,000+ pairs)
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
│   └── generateReferences.ts    # Categorize and emit references.json
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

The cross-reference dataset is pre-built and committed to `public/references.json`. If you want to regenerate it from source:

```bash
npm run build:data   # Fetch raw data from openbible.info
npm run generate     # Parse, classify, and write references.json
```

The raw data comes from the [OpenBible.info cross-reference dataset](https://www.openbible.info/labs/cross-references/), which aggregates references from multiple scholarly sources. The classification step assigns each pair to one of the eight theological categories based on keyword analysis and book-level heuristics.

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

Cross-reference data: [OpenBible.info](https://www.openbible.info/labs/cross-references/) — compiled by Chris Kimball from *Treasury of Scripture Knowledge*, *The New Treasury of Scripture Knowledge*, and other scholarly sources. Used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

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
