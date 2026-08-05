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
import { initTooltip, showTooltip, hideTooltip } from "./lib/tooltip.ts";
import { initMinimap } from "./lib/minimap.ts";
import { initZoom } from "./lib/zoom.ts";
import { ERA_BANDS } from "./lib/eras.ts";
import { figures } from "./data/timeline.ts";
import type { Category } from "./data/timeline.ts";
import { onViewChange, getView } from "./lib/viewState.ts";
import { initHeader } from "./lib/header.ts";
import { initLineageView } from "./lib/renderLineage.ts";
import { initNarrativeView } from "./lib/renderNarrative.ts";

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

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  antediluvian: "Before the Flood — Adam through the generation of Noah",
  postdiluvian: "After the Flood — Noah's descendants through Terah",
  patriarch: "The patriarchs of Israel — Abraham, Isaac, Jacob, and Joseph",
  exodus: "The Exodus from Egypt — Moses and Aaron lead Israel out of slavery",
  judge: "Tribal leaders who governed Israel before the monarchy",
  "united-king": "Saul, David, and Solomon rule all twelve tribes",
  "israel-king": "Kings of the Northern Kingdom after the split in 931 BC",
  "judah-king": "Kings of the Southern Kingdom after the split in 931 BC",
  prophet: "God's messengers during the monarchy and exile",
  "exile-return": "The Babylonian exile and the return to rebuild Jerusalem",
  messiah: "Jesus Christ — his birth, ministry, and resurrection",
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
  appId: "chronos",
});
app.appendChild(headerEl);

// -- Inject view toggle into header controls --
initHeader(headerControls);

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

// -- View containers (all live inside mainInner) --
const timelineView = el("div", "timeline-view", mainInner);
const lineageView = el("div", "lineage-view", mainInner);
lineageView.style.display = "none";
const narrativeView = el("div", "narrative-view", mainInner);
narrativeView.style.display = "none";

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
  const band = el("div", "era-band", timelineView);
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

  const line = el("div", "era-line", timelineView);
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

  text.addEventListener("mouseenter", () => {
    const rect = text.getBoundingClientRect();
    const html =
      `<span class="tooltip__cat-title">` +
        `<span class="tooltip__cat-dot" style="background:${cssVar(cat)}"></span>` +
        `${CATEGORY_NAMES[cat]}` +
      `</span>` +
      `<p class="tooltip__blurb">${CATEGORY_DESCRIPTIONS[cat]}</p>`;
    showTooltip(html, rect.right + 8, rect.top + rect.height / 2);
  });

  text.addEventListener("mouseleave", () => hideTooltip());

  labelElements.push(row);
}

// ─── Render Lanes ────────────────────────────────────────────────

for (const cat of CATEGORY_ORDER) {
  const lane = el("div", "lane", timelineView);
  lane.dataset.category = cat;
}

// ─── Render Figure Bars ──────────────────────────────────────────

const { laneHeights, barMap } = renderBars(timelineView, figures);

const syncLaneLabels = (heights: Map<Category, number>) => {
  CATEGORY_ORDER.forEach((cat, i) => {
    const h = heights.get(cat);
    if (h != null && labelElements[i]) {
      labelElements[i]!.style.height = `${h}px`;
    }
  });
};

syncLaneLabels(laneHeights);

// ─── Lineage View ────────────────────────────────────────────────

const lineageHandle = initLineageView(lineageView);

// ─── Narrative View ──────────────────────────────────────────────

const narrativeHandle = initNarrativeView(narrativeView);

// ─── View Switching ──────────────────────────────────────────────

onViewChange((view) => {
  timelineView.style.display = view === "timeline" ? "" : "none";
  lineageView.style.display = view === "lineage" ? "" : "none";
  narrativeView.style.display = view === "narrative" ? "" : "none";
  laneLabels.style.display = view === "timeline" ? "" : "none";
});

// ─── Minimap ─────────────────────────────────────────────────────

const minimap = initMinimap(mainViewport);

// ─── Scrubber ────────────────────────────────────────────────────

// ─── Narrative value-word helper ─────────────────────────────────

const narrativeValueWord = (v: number): string => {
  if (v >= 80) return "overwhelming";
  if (v >= 60) return "dominant";
  if (v >= 40) return "strong";
  if (v >= 20) return "present";
  return "faint";
};

const renderNarrativeExtra = (list: HTMLElement, year: number) => {
  if (getView() !== "narrative") return;

  const values = narrativeHandle.getThreadValuesAt(year)
    .filter((t) => t.value > 5)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  if (values.length === 0) return;

  const section = document.createElement("div");
  section.className = "panel__section narrative-story";

  const title = document.createElement("h3");
  title.className = "panel__section-title narrative-story__title";
  title.textContent = "Story at this moment";
  section.appendChild(title);

  for (const { id, name, value } of values) {
    const entry = document.createElement("div");
    entry.className = "panel__entry narrative-story__entry";

    const swatch = document.createElement("span");
    swatch.className = "narrative-story__swatch";
    swatch.style.background = `var(--thread-${id})`;
    entry.appendChild(swatch);

    const label = document.createElement("span");
    label.className = "narrative-story__label";
    label.textContent = `${name} — ${narrativeValueWord(value)}`;
    entry.appendChild(label);

    section.appendChild(entry);
  }

  list.insertBefore(section, list.firstChild);
};

const scrubber = initScrubber(mainViewport, figures, (year) => {
  minimap.setScrubberYear(year);
}, renderNarrativeExtra);

// ─── Tooltip ─────────────────────────────────────────────────────

initTooltip(mainViewport, figures);

// ─── Zoom ────────────────────────────────────────────────────────

const repositionAll = () => {
  applyWidths();
  positionEraBands();
  positionTicks();
  positionEraMarkers();

  const newHeights = repositionBars(timelineView, figures, barMap);
  syncLaneLabels(newHeights);

  lineageHandle.reposition();
  narrativeHandle.reposition();

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

// Forward wheel events from lane labels to main viewport
laneLabels.addEventListener("wheel", (e) => {
  e.preventDefault();
  mainViewport.scrollTop += e.deltaY;
  mainViewport.scrollLeft += e.deltaX;
}, { passive: false });
