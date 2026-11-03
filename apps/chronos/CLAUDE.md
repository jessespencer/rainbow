# Lineage — Bible Timeline

Interactive Bible timeline, shown to readers as **Lineage**. Its Lineage view is shown as **Family Tree**. The folder, package, URL (`/rainbow/timeline/`, `?view=lineage`) and code keep the old names `chronos` and `lineage`, so links keep working. Sibling to [Atlas](../rainbow), and shares the [`@jessespencer/bible-ui`](../../packages/bible-ui) design system with it.

Scope: Adam through Jesus's resurrection (~AD 33). No apostolic age yet.

## Stack

- **Vanilla TypeScript + Vite** — no framework, no React
- Single page: HTML + CSS + TS
- Dark theme via shared design tokens from `@jessespencer/bible-ui`
- Typography: Fraunces (serif, UI) + DM Mono (monospace, data)
- Deployed as a static site at `/rainbow/timeline/`

## Shared Design System

`@jessespencer/bible-ui` provides the compact header and app switcher, the phone bottom sheet (`/sheet`), the Controls guide (`/guide`, with each view's wording in `src/lib/guides.ts`), book and verse numbering (`/bible`), fonts, and design tokens. Chronos imports the shared CSS first, then layers its own tokens on top.

## Architecture

- **Whole story first** — loads fitted to the viewport. `renderBars` shrinks rows to fit every lane on screen and grows them back, with names, as you zoom
- **Camera zoom** — every input in \`zoom.ts\` sets a target and one frame loop moves toward it, so route new zoom moves through it rather than setting the scale directly. Rows are assigned once, in years, so bars never change row while zooming. Only the visible view redraws on each frame
- **Lineage labels are HTML** over the SVG lines, so they keep their size at any zoom. `placeLabels` gives each a turn by priority, then adds dates and descriptions where its neighbor leaves room. Jesus always comes first and never dims, here and on the Timeline
- **King and Priest** — `?line=royal|priestly|both` in Lineage. Priests live in `data/priests.ts`, on the Lineage map only (`allFigures`). Hebrews 7:14 says Jesus descended from Judah, so never give the priestly line a family link to him: it stays a dashed link
- **Selection is the state** — nothing, a figure, or a year. `select()` in `main.ts` drives the bars, scrubber, minimap, panel and URL together
- **URL is state** — `?figure=king-david`, `?year=-586`, `?view=lineage`
- **Input** — a mouse scrubs by dragging the lanes. A finger pans them, so touch scrubs on the axis strip and picks with a tap. Pinch also pans, and lives in `zoom.ts`
- **Scripture comes from Rainbow** — `scripture.ts` parses each `scriptureRef` into Rainbow's verse numbering, reads Rainbow's `data/bsb.json`, and links to `?ref=` there. Every `scriptureRef` must keep parsing when you add a figure
- **Phone** — below 760px the panel is a bottom sheet and the lane labels are gone; color carries the category

## Year Convention

Years are stored as **signed integers**:
- Negative = BC (e.g., Adam born → `-4004`)
- Positive = AD (e.g., resurrection → `33`)
- There is no year 0 — handle the BC/AD boundary accordingly

## Chronology Sources

| Period | Source |
|---|---|
| Pre-monarchy (Adam → David) | **Ussher** |
| Divided kingdom | **Thiele** |

## Key Files

| File | Purpose |
|---|---|
| `src/main.ts` | Entry point — builds DOM, selection, URL, keyboard |
| `src/data/timeline.ts` | The figures, with birth, death and reign dates |
| `src/lib/scale.ts` | Dynamic `pixelsPerYear`, `yearToX`/`xToYear` coordinate mapping |
| `src/lib/renderBars.ts` | Sub-row layout, row density, bar rendering and repositioning |
| `src/lib/renderLineage.ts` | Subway-map lines, stations and label placement |
| `src/lib/lineToggle.ts` | King and Priest toggle and scripture cards |
| `src/data/priests.ts` | The priestly line, with estimated dates |
| `src/lib/scrubber.ts` | Year line and all pointer input on the lanes and axis |
| `src/lib/zoom.ts` | Camera: fit, wheel, pinch, buttons and jumps |
| `src/lib/companion.ts` | Figure and year panel |
| `src/lib/search.ts` | Search for people, years and eras |
| `src/lib/scripture.ts` | Reference parsing and BSB loading |
| `src/lib/minimap.ts` | Bottom minimap with viewport indicator |
| `src/lib/eras.ts` | Era bands |
| `vite.config.ts` | Base path, pinned dev port 5174, and Rainbow's data in dev |

## Code Style

- `const` over `let`; never `var`
- Named exports only — no default exports
- This is NOT a React project — do not introduce React patterns
