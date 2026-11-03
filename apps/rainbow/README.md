# 🌈 Atlas

> *344,799 threads woven through 66 books. Every arc a conversation across millennia.*

**▶ [Open Atlas](https://jessespencer.github.io/rainbow/)**

## Why this exists

Readers of the Bible have always followed cross-references: the small notes in the margin that send you from one passage to another that echoes, quotes, or fulfills it. On paper you follow them one at a time, so the bigger picture stays hidden.

Atlas draws all of them at once. Start with the whole Bible as a single rainbow, then read both ends of any arc. It's a picture of how deeply scripture speaks to itself, and a way to actually read those connections.

It's free and open source, and inspired by [Chris Harrison's](https://www.chrisharrison.net/index.php/visualizations/BibleViz) landmark arc diagram.

## What you can do

### See the whole Bible at once

All 31,102 verses sit on one line, Genesis at the left and Revelation at the right, and every cross-reference is an arc. The weight of Psalms, Isaiah, and the Gospels is immediately visible. So is the quiet of the smaller books. Zoom in to go from books to chapters to single verses.

### Read both ends of a connection

Tap an arc and both passages open together, joined by a line in their section colors, with the reader votes behind the link. Page through every connection between those two books, strongest first.

### Read a passage with its connections

Tap a verse, chapter, or book on the axis to bring its arcs forward while the rest fade back. The panel beside it shows the text, then splits its links into what it references and what references it, grouped by book with the strongest first. Point at a verse in the list and its arc lights up on the rainbow. Step to the next verse or chapter, copy any verse with a link, or use Read in context to see it in its chapter.

### See it as a matrix

The heatmap collapses the same links into a 66×66 grid, one cell for each pair of books. It opens on Affinity, which sets book size aside: each pair is compared with the share of links it would get if every book's links were spread across the others in proportion, so parallel histories, sister letters, and Daniel with Revelation stand out. Same-book links are left out of that comparison. Switch the scale to Link count to see raw totals instead. Tap a cell to open the strongest link.

### See it as a galaxy

Galaxy turns every verse into a star on a two-armed spiral, one arm per Testament, in reading order from the core out. Switch shapes and the stars fly to their new places: Ring closes the canon so Revelation meets Genesis, and Binary makes the Testaments two galaxies joined where Malachi meets Matthew. It opens with the strongest 6,000 links, because drawing all of them would only be a white blur. Tap a star to open it in the panel and light up everything it connects to. Drag to orbit, scroll or pinch to zoom, and use Layers to change the colors, star sizes, and labels. Filters, search, and sharing work as they do everywhere else.

### Find, filter, and share

- **Search** for `John 3:16`, `ps 23`, `1 cor 13:4-7`, or a book name.
- **Filter by votes** from 100 down to every link.
- **Filter by section** to bring forward Law, History, Poetry & Wisdom, Prophets, Gospels, Acts, Epistles, or Revelation while the rest fade back.
- **Shuffle** to land on a random connection with both verses in front of you.
- **Share** any view. Everything you've selected lives in the address:

| Parameter | Example | Meaning |
| --- | --- | --- |
| `ref` | `?ref=John.3.16`, `?ref=Ps.23`, `?ref=Isa` | A verse, chapter, or book |
| `to` | `?ref=John.3.16&to=Rom.5.8` | The other end of a connection |
| `votes` | `?votes=25` | Minimum reader votes |
| `genre` | `?genre=gospels` | Section filter |
| `view` | `?view=heatmap`, `?view=galaxy` | Open the heatmap or the galaxy |
| `shape` | `?view=galaxy&shape=ring` | Galaxy shape: `ring` or `binary` |
| `scale` | `?view=heatmap&scale=count` | Heatmap shows raw link counts instead of affinity |

Each view has a Controls button that explains how to explore it, and the first visit to each view shows a short tip. On a keyboard, `⌘K` or `Ctrl K` jumps to search, `←` and `→` step to the previous or next verse, chapter, or connection, `+` and `−` zoom, and `Esc` clears everything.

### Use it on your phone

The panel becomes a bottom sheet you can drag up to read and pull down to close. Slide a finger along the book strip to preview passages. Everywhere else, drag to pan and pinch to zoom. In Galaxy, one finger orbits, two zoom, and the selected stars stay in view above the sheet.

## How to read it

**Votes rank, they don't prove.** OpenBible.info readers vote on how helpful each link is. By default you see links with at least 4 votes: 154,386 of them, about 45%. That hides the loosest links and the 1,231 that readers voted down. The filter brings them back.

**Colors show where, not what.** Each arc fades between the colors of the two sections it joins, so the rainbow runs left to right through the canon. The source data doesn't sort links by theme, so the colors don't claim to.

| Section | Books | Color |
| --- | --- | --- |
| Law | Genesis–Deuteronomy | Crimson |
| History | Joshua–Esther | Ember |
| Poetry & Wisdom | Job–Song of Solomon | Saffron |
| Prophets | Isaiah–Malachi | Moss |
| Gospels | Matthew–John | Fern |
| Acts | Acts | Verdigris |
| Epistles | Romans–Jude | Blue |
| Revelation | Revelation | Iris |

## Data

| Dataset | Source | License |
| --- | --- | --- |
| Cross-references | [OpenBible.info](https://www.openbible.info/labs/cross-references/), 2026-10-26 snapshot, drawn mainly from the public-domain *Treasury of Scripture Knowledge* | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Bible text | [Berean Standard Bible](https://berean.bible/) | [Public domain](https://berean.bible/terms.htm) |

A few notes on how these are handled:

- **Numbering:** verses follow the KJV numbering of 31,102 verses. OpenBible and the BSB split 3 John into 15 verses, so verse 15 folds into verse 14.
- **Omitted verses:** the BSB leaves out 16 verses, such as Matthew 17:21, that the earliest manuscripts don't have. The links to them still appear, and the app says why the text is missing.
- **Ranges:** many links point to a range of verses. The arc lands on the first verse, and the panel shows the whole range.

The build fails if a row can't be parsed or the verse count isn't 31,102, so a bad upstream file can't ship quietly.

## Development

Requires [Node.js](https://nodejs.org/) 22 or newer and [pnpm](https://pnpm.io/). Run these from the repository root:

```bash
pnpm install
pnpm dev:rainbow
```

Then open <http://localhost:5173/rainbow/>. The path matters: the app is served under `/rainbow/`, as it is on GitHub Pages.

| Command | Purpose |
| --- | --- |
| `pnpm dev:rainbow` | Start the Vite dev server |
| `pnpm build:rainbow` | Build the site into `apps/rainbow/dist/` |
| `pnpm build` | Build every app in the monorepo |

The datasets are committed, so you don't need to download anything to run the app. To rebuild them from source, for example to pick up new OpenBible votes:

```bash
cd apps/rainbow
pnpm build:data
```

`raw-data/` is ignored by git, and an existing file there isn't downloaded again. Delete it to fetch fresh copies.

### Project structure

```text
apps/rainbow/
├── public/data/
│   ├── links.bin                # All cross-references, strongest first
│   └── bsb.json                 # Berean Standard Bible text by verse
├── scripts/
│   ├── bible-metadata.ts        # Books and verse counts, shared with the app
│   ├── download-data.ts         # Fetch the raw OpenBible and BSB files
│   └── parse-crossrefs.ts       # Validate and build the datasets
└── src/
    ├── main.ts                  # App state, URL, event wiring
    ├── style.css                # Navy theme and phone layout
    ├── data/
    │   ├── books.ts             # The 66 canonical books
    │   └── genres.ts            # The 8 sections and their colors
    └── lib/
        ├── arcGl.ts             # WebGL arc renderer
        ├── renderer.ts          # Axis, highlighted arcs, hit testing
        ├── links.ts             # Link store, filters, per-verse index
        ├── verses.ts            # Verse numbering and reference parsing
        ├── companion.ts         # Passage and connection panel
        ├── sheet.ts             # Phone bottom sheet
        ├── heatmap.ts           # Matrix view
        ├── galaxy.ts            # 3D star view, loaded on first use
        ├── layout.ts            # World coordinates
        ├── tooltip.ts           # Hover tooltip
        └── zoom.ts              # D3-based zoom and pan
```

### How it's built

Vanilla TypeScript and Vite, with no UI framework.

- **Arcs are WebGL 2.** Each link is one instanced line strip, and the shader computes its semicircle. A Canvas 2D layer on top draws the axis, highlights, and heatmap, and takes the input.
- **Links are 8 bytes each.** `links.bin` holds Int16 rows of `[from, toStart, toEnd, votes]`, sorted by votes, so a lower id always means a stronger link. A per-verse index built on load makes finding a passage's links instant.
- **Galaxy loads on demand.** Three.js sits in its own chunk that's only fetched when you open the view, so the arcs don't pay for it. It stops rendering whenever it's out of sight, and respects your reduced-motion setting.
- **The world is fixed.** Arcs live in a coordinate space that doesn't depend on the screen, so resizing or opening the panel keeps your place.

The site deploys to GitHub Pages from `main` through [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml).

## Part of a family

Atlas lives alongside [Lineage](https://jessespencer.github.io/rainbow/timeline/), a horizontal Bible timeline from Adam to the resurrection. Both share the [`@jessespencer/bible-ui`](../../packages/bible-ui) design system: IM Fell Great Primer, EB Garamond and DM Mono type, a navy and parchment palette shared with By Heart, and the rainbow gradient.

## Credits

Arc diagram concept by [Chris Harrison](https://www.chrisharrison.net/index.php/visualizations/BibleViz). Built by [jessedestroys.com](https://www.jessedestroys.com).

> Cross-reference data: OpenBible.info (CC BY 4.0), largely from the public-domain *Treasury of Scripture Knowledge*. Modified: re-indexed to KJV verse numbering.
> Scripture text: Berean Standard Bible (BSB), dedicated to the public domain.

## License

The code is released under the [MIT License](../../LICENSE). The data keeps its own licenses, listed above.
