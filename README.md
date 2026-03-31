# Rainbow

An interactive visualization of Bible cross-references, inspired by Chris Harrison's famous arc diagram. Explore 63,000+ cross-references across all 66 books, color-coded by theological category.

## Features

- **Arc View** — semi-circular arcs connecting cross-referenced verses
- **Heatmap View** — matrix showing reference density between books
- **8 Theological Categories** — Sin & Redemption, Messianic Prophecy, Praise & Worship, Wisdom, Creation, Historical Parallel, Law & Covenant, Prophecy & Apocalyptic
- **Interactive Controls** — zoom/pan with D3, click books to filter, hover for tooltips
- **Preset Views** — quick zoom to Fit, Old Testament, or New Testament
- **Shuffle Mode** — random verse reference discovery
- **Scholar Spotlight** — 13 featured scholars with filtering

## Tech Stack

- TypeScript + Vite
- HTML5 Canvas for rendering
- D3.js (scale, selection, transition, zoom)
- Web Worker for data processing

## Setup

```bash
npm install
```

## Development

```bash
npm run dev       # http://localhost:5173/rainbow/
npm run build     # Production build to dist/
```

## Data

Cross-reference data is sourced from [openbible.info](https://www.openbible.info/) and pre-built into `public/data/references.json`.

```bash
npm run build:data   # Download and parse raw cross-references
npm run generate     # Generate references.json
```
