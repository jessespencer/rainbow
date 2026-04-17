import "@jessespencer/bible-ui/style.css";
import "./style.css";
import { createHeader, loadFonts } from "@jessespencer/bible-ui";
import {
  yearToX,
  formatYear,
  getTimelineWidth,
  MIN_YEAR,
  MAX_YEAR,
} from "./lib/scale.ts";
import { renderBars, repositionBars } from "./lib/renderBars.ts";
import { initScrubber } from "./lib/scrubber.ts";
import { initTooltip } from "./lib/tooltip.ts";
import { initMinimap } from "./lib/minimap.ts";
import { initZoom } from "./lib/zoom.ts";
import { ERA_BANDS } from "./lib/eras.ts";
import { figures } from "./data/timeline.ts";
import type { Category } from "./data/timeline.ts";

// ─── Constants ───────────────────────────────────────────────────

const TICK_INTERVAL = 100;
const LABEL_INTERVAL = 500;

const CATEGORY_ORDER: Category[] = [
  "antediluvian",
  "postdiluvian",
  "patriarch",
  "exodus",
  "judge",
  "united-king",
  "israel-king",
  "judah-king",
  "prophet",
  "exile-return",
  "messiah",
];

const CATEGORY_NAMES: Record<Category, string> = {
  antediluvian: "Antediluvian",
  postdiluvian: "Postdiluvian",
  patriarch: "Patriarch",
  exodus: "Exodus",
  judge: "Judge",
  "united-king": "United Kingdom",
  "israel-king": "Israel (North)",
  "judah-king": "Judah (South)",
  prophet: "Prophet",
  "exile-return": "Exile & Return",
  messiah: "Messiah",
};

interface EraMarker {
  year: number;
  label: string;
}

const ERA_MARKERS: EraMarker[] = [
  { year: -2348, label: "The Flood" },
  { year: -1921, label: "Call of Abraham" },
  { year: -1491, label: "The Exodus" },
  { year: -1050, label: "United Monarchy" },
  { year: -931, label: "Kingdom Divides" },
  { year: -722, label: "Fall of Israel" },
  { year: -586, label: "Fall of Judah" },
  { year: -538, label: "Return from Exile" },
  { year: -4, label: "Birth of Christ" },
];

// ─── Helpers ─────────────────────────────────────────────────────

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  parent?: HTMLElement,
): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (parent) parent.appendChild(node);
  return node;
};

const cssVar = (cat: Category): string =>
  `var(--cat-${cat})`;

// ─── Build DOM ───────────────────────────────────────────────────

const app = document.querySelector<HTMLDivElement>("#app")!;

// -- Load shared fonts --
loadFonts();

// -- Header (shared component) --
const { element: headerEl, controls: headerControls } = createHeader({
  title: "Chronos",
  subtitle: "A Visual History of the Bible",
});
app.appendChild(headerEl);

// -- Axis row --
const axisRow = el("div", "axis-row", app);
el("div", "label-gutter", axisRow);

const axisViewport = el("div", "axis-viewport", axisRow);
const axisInner = el("div", "axis-inner", axisViewport);

// -- Content row --
const contentRow = el("div", "content-row", app);

const laneLabels = el("div", "lane-labels", contentRow);
const laneLabelsInner = el("div", undefined, laneLabels);

const mainViewport = el("div", "main-viewport", contentRow);
const mainInner = el("div", "main-inner", mainViewport);

// ─── Set initial widths ──────────────────────────────────────────

const applyWidths = () => {
  const w = `${getTimelineWidth()}px`;
  mainInner.style.width = w;
  axisInner.style.width = w;
};

applyWidths();

// ─── Render Era Background Bands ─────────────────────────────────

interface PositionedEl {
  element: HTMLElement;
  year: number;
}

interface EraBandEl {
  element: HTMLElement;
  startYear: number;
  endYear: number;
}

const eraBandEls: EraBandEl[] = [];

for (const era of ERA_BANDS) {
  const band = el("div", "era-band", mainInner);
  band.style.background = era.color;
  eraBandEls.push({ element: band, startYear: era.startYear, endYear: era.endYear });
}

const positionEraBands = () => {
  for (const { element, startYear, endYear } of eraBandEls) {
    const left = yearToX(startYear);
    element.style.left = `${left}px`;
    element.style.width = `${yearToX(endYear) - left}px`;
  }
};

positionEraBands();

// ─── Render Tick Marks ───────────────────────────────────────────

const tickEls: PositionedEl[] = [];

const firstTick = Math.ceil(MIN_YEAR / TICK_INTERVAL) * TICK_INTERVAL;

for (let year = firstTick; year <= MAX_YEAR; year += TICK_INTERVAL) {
  if (year === 0) continue;

  const isMajor = year % LABEL_INTERVAL === 0;
  const tick = el("div", isMajor ? "tick tick--major" : "tick tick--minor", axisInner);

  if (isMajor) {
    const label = el("span", "tick__label", tick);
    label.textContent = formatYear(year);
  }

  tickEls.push({ element: tick, year });
}

const positionTicks = () => {
  for (const { element, year } of tickEls) {
    element.style.left = `${yearToX(year)}px`;
  }
};

positionTicks();

// ─── Render Era Markers ──────────────────────────────────────────

const eraLabelEls: PositionedEl[] = [];
const eraLineEls: PositionedEl[] = [];

for (const era of ERA_MARKERS) {
  const label = el("div", "era-label", axisInner);
  label.textContent = era.label;
  eraLabelEls.push({ element: label, year: era.year });

  const line = el("div", "era-line", mainInner);
  eraLineEls.push({ element: line, year: era.year });
}

const positionEraMarkers = () => {
  for (const { element, year } of eraLabelEls) {
    element.style.left = `${yearToX(year) - 4}px`;
  }
  for (const { element, year } of eraLineEls) {
    element.style.left = `${yearToX(year)}px`;
  }
};

positionEraMarkers();

// ─── Render Lane Labels ──────────────────────────────────────────

const labelElements: HTMLElement[] = [];

for (const cat of CATEGORY_ORDER) {
  const row = el("div", "lane-label", laneLabelsInner);

  const dot = el("span", "lane-label__dot", row);
  dot.style.background = cssVar(cat);

  const text = el("span", "lane-label__text", row);
  text.textContent = CATEGORY_NAMES[cat];

  labelElements.push(row);
}

// ─── Render Lanes ────────────────────────────────────────────────

for (const cat of CATEGORY_ORDER) {
  const lane = el("div", "lane", mainInner);
  lane.dataset.category = cat;
}

// ─── Render Figure Bars ──────────────────────────────────────────

const { laneHeights, barMap } = renderBars(mainInner, figures);

const syncLaneLabels = (heights: Map<Category, number>) => {
  CATEGORY_ORDER.forEach((cat, i) => {
    const h = heights.get(cat);
    if (h != null && labelElements[i]) {
      labelElements[i]!.style.height = `${h}px`;
    }
  });
};

syncLaneLabels(laneHeights);

// ─── Minimap ─────────────────────────────────────────────────────

const minimap = initMinimap(mainViewport);

// ─── Scrubber ────────────────────────────────────────────────────

const scrubber = initScrubber(mainViewport, figures, (year) => {
  minimap.setScrubberYear(year);
});

// ─── Tooltip ─────────────────────────────────────────────────────

initTooltip(mainViewport, figures);

// ─── Zoom ────────────────────────────────────────────────────────

const repositionAll = () => {
  applyWidths();
  positionEraBands();
  positionTicks();
  positionEraMarkers();

  const newHeights = repositionBars(mainInner, figures, barMap);
  syncLaneLabels(newHeights);

  scrubber.reposition();
  minimap.syncScroll();
};

initZoom(mainViewport, headerControls, repositionAll);

// ─── Scroll Sync ─────────────────────────────────────────────────

mainViewport.addEventListener("scroll", () => {
  axisViewport.scrollLeft = mainViewport.scrollLeft;
  laneLabels.scrollTop = mainViewport.scrollTop;
  minimap.syncScroll();
});
