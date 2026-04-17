import "./style.css";
import {
  yearToX,
  formatYear,
  TIMELINE_WIDTH,
  MIN_YEAR,
  MAX_YEAR,
} from "./lib/scale.ts";
import { renderBars } from "./lib/renderBars.ts";
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

// -- Axis row --
const axisRow = el("div", "axis-row", app);
const labelGutter = el("div", "label-gutter", axisRow);
labelGutter.textContent = "Chronos";

const axisViewport = el("div", "axis-viewport", axisRow);
const axisInner = el("div", "axis-inner", axisViewport);
axisInner.style.width = `${TIMELINE_WIDTH}px`;

// -- Content row --
const contentRow = el("div", "content-row", app);

const laneLabels = el("div", "lane-labels", contentRow);
const laneLabelsInner = el("div", undefined, laneLabels);

const mainViewport = el("div", "main-viewport", contentRow);
const mainInner = el("div", "main-inner", mainViewport);
mainInner.style.width = `${TIMELINE_WIDTH}px`;

// ─── Render Tick Marks ───────────────────────────────────────────

const firstTick =
  Math.ceil(MIN_YEAR / TICK_INTERVAL) * TICK_INTERVAL;

for (
  let year = firstTick;
  year <= MAX_YEAR;
  year += TICK_INTERVAL
) {
  if (year === 0) continue; // no year 0

  const x = yearToX(year);
  const isMajor = year % LABEL_INTERVAL === 0;

  const tick = el("div", isMajor ? "tick tick--major" : "tick tick--minor", axisInner);
  tick.style.left = `${x}px`;

  if (isMajor) {
    const label = el("span", "tick__label", tick);
    label.textContent = formatYear(year);
  }
}

// ─── Render Era Markers ──────────────────────────────────────────

for (const era of ERA_MARKERS) {
  const x = yearToX(era.year);

  // Label in axis
  const label = el("div", "era-label", axisInner);
  label.style.left = `${x - 4}px`;
  label.textContent = era.label;

  // Vertical line spanning all lanes (height via CSS bottom: 0)
  const line = el("div", "era-line", mainInner);
  line.style.left = `${x}px`;
}

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

const laneHeights = renderBars(mainInner, figures);

// Sync lane-label heights with dynamically sized lanes
CATEGORY_ORDER.forEach((cat, i) => {
  const h = laneHeights.get(cat);
  if (h != null && labelElements[i]) {
    labelElements[i]!.style.height = `${h}px`;
  }
});

// ─── Scroll Sync ─────────────────────────────────────────────────

mainViewport.addEventListener("scroll", () => {
  axisViewport.scrollLeft = mainViewport.scrollLeft;
  laneLabels.scrollTop = mainViewport.scrollTop;
});
