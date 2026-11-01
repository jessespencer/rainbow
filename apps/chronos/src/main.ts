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
import { initCompanion } from "./lib/companion.ts";
import { initSearch } from "./lib/search.ts";
import type { SearchResult } from "./lib/search.ts";
import { el } from "./lib/dom.ts";
import { CATEGORY_DESCRIPTIONS, CATEGORY_NAMES, CATEGORY_ORDER } from "./lib/categories.ts";
import { ERA_BANDS } from "./lib/eras.ts";
import { figures } from "./data/timeline.ts";
import type { Category, TimelineFigure } from "./data/timeline.ts";
import { onViewChange, getView, setView } from "./lib/viewState.ts";
import type { ViewMode } from "./lib/viewState.ts";
import { initHeader } from "./lib/header.ts";
import { initLineageView } from "./lib/renderLineage.ts";
import { initNarrativeView } from "./lib/renderNarrative.ts";

// ─── Constants ───────────────────────────────────────────────────

const TICK_INTERVAL = 100;
const LABEL_INTERVAL = 500;
const MIN_ERA_LABEL_GAP = 34;
const MIN_TICK_LABEL_GAP = 60;
const YEAR_STEP = 10;
const MIN_FOCUS_YEARS = 60;
const FOCUS_PADDING_RATIO = 0.15;

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

const cssVar = (cat: Category): string =>
  `var(--cat-${cat})`;

// ─── Build DOM ───────────────────────────────────────────────────

const app = document.querySelector<HTMLDivElement>("#app")!;

// -- Load shared fonts --
loadFonts();

// -- Header (shared component) --
const { element: headerEl, controls: headerControls, center: headerCenter } = createHeader({
  title: "Chronos",
  subtitle: "A Visual History of the Bible",
  appId: "chronos",
  compact: true,
});
app.appendChild(headerEl);

// -- Inject view toggle into header controls --
initHeader(headerControls);

// -- Stage: the timeline beside the companion --
const stage = el("div", "stage", app);
const canvasArea = el("div", "canvas-area", stage);

// -- Axis row --
const axisRow = el("div", "axis-row", canvasArea);
const axisGutter = el("div", "label-gutter", axisRow);

const axisViewport = el("div", "axis-viewport", axisRow);
const axisInner = el("div", "axis-inner", axisViewport);

// -- Content row --
const contentRow = el("div", "content-row", canvasArea);

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

// -- Canvas overlays --
const overlays = el("div", "canvas-status", canvasArea);
const eraSelect = el("select", "era-select", overlays);
eraSelect.setAttribute("aria-label", "Jump to an era");
el("option", undefined, eraSelect).textContent = "Jump to era";
eraSelect.options[0]!.value = "";
ERA_BANDS.forEach((era, i) => {
  const option = el("option", undefined, eraSelect);
  option.value = String(i);
  option.textContent = era.name;
});
const zoomControls = el("div", "zoom-controls", overlays);
const aboutButton = el("button", "canvas-btn", overlays);
aboutButton.textContent = "About";

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
  let lastLabelX = -Infinity;
  for (const { element, year } of tickEls) {
    const x = yearToX(year);
    element.style.left = `${x}px`;
    const label = element.firstElementChild as HTMLElement | null;
    if (label) {
      label.hidden = x - lastLabelX < MIN_TICK_LABEL_GAP;
      if (!label.hidden) lastLabelX = x;
    }
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
  let lastX = -Infinity;
  for (const { element, year } of eraLabelEls) {
    const x = yearToX(year);
    element.style.left = `${x}px`;
    element.hidden = x - lastX < MIN_ERA_LABEL_GAP;
    if (!element.hidden) lastX = x;
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
  axisGutter.style.display = view === "timeline" ? "" : "none";
  hideTooltip();
  syncAddress();
});

// ─── Minimap ─────────────────────────────────────────────────────

const minimap = initMinimap(mainViewport, canvasArea);

// ─── Scrubber ────────────────────────────────────────────────────

// ─── Narrative value-word helper ─────────────────────────────────

const narrativeValueWord = (v: number): string => {
  if (v >= 80) return "overwhelming";
  if (v >= 60) return "dominant";
  if (v >= 40) return "strong";
  if (v >= 20) return "present";
  return "faint";
};

const renderNarrativeExtra = (body: HTMLElement, year: number) => {
  if (getView() !== "narrative") return;

  const values = narrativeHandle.getThreadValuesAt(year)
    .filter((t) => t.value > 5)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  if (values.length === 0) return;

  const section = document.createElement("div");
  section.className = "cp-section narrative-story";

  const title = document.createElement("h3");
  title.className = "cp-section-title";
  title.textContent = "Story at this moment";
  section.appendChild(title);

  for (const { id, name, value } of values) {
    const entry = document.createElement("div");
    entry.className = "narrative-story__entry";

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

  body.appendChild(section);
};

// ─── Selection ───────────────────────────────────────────────────

type Selection =
  | { kind: "figure"; figure: TimelineFigure }
  | { kind: "year"; year: number }
  | null;

let selection: Selection = null;

const byBirth = [...figures].sort((a, b) => a.birth - b.birth);

const aliveAt = (year: number) =>
  byBirth.filter((f) => f.birth <= year && year <= f.death);

const overlapping = (figure: TimelineFigure) =>
  byBirth.filter(
    (f) => f !== figure && f.birth <= figure.death && figure.birth <= f.death,
  );

const paintBars = (lit: TimelineFigure[] | null, selected: TimelineFigure | null) => {
  const litIds = new Set(lit?.map((f) => f.id));
  for (const [id, bar] of barMap) {
    bar.classList.toggle("figure-bar--active", litIds.has(id));
    bar.classList.toggle("figure-bar--dimmed", lit !== null && !litIds.has(id));
    bar.classList.toggle("figure-bar--selected", id === selected?.id);
  }
};

const syncAddress = () => {
  const params = new URLSearchParams();
  if (getView() !== "timeline") params.set("view", getView());
  if (selection?.kind === "figure") params.set("figure", selection.figure.id);
  if (selection?.kind === "year") params.set("year", String(selection.year));
  const query = params.toString();
  history.replaceState(null, "", query ? `?${query}` : location.pathname);
};

const select = (next: Selection) => {
  selection = next;
  if (next?.kind === "figure") {
    const alongside = overlapping(next.figure);
    scrubber.setYear(null);
    minimap.setScrubberYear(null);
    paintBars([next.figure, ...alongside], next.figure);
    companion.showFigure(next.figure, alongside);
  } else if (next?.kind === "year") {
    const alive = aliveAt(next.year);
    scrubber.setYear(next.year);
    minimap.setScrubberYear(next.year);
    paintBars(alive, null);
    companion.showYear(next.year, alive);
  } else {
    scrubber.setYear(null);
    minimap.setScrubberYear(null);
    paintBars(null, null);
    companion.hide();
  }
  syncAddress();
};

const selectFigure = (id: string) => {
  const figure = figures.find((f) => f.id === id);
  if (figure) select({ kind: "figure", figure });
};

const selectYear = (year: number) => {
  select({ kind: "year", year: Math.min(MAX_YEAR, Math.max(MIN_YEAR, year)) });
};

const step = (direction: -1 | 1) => {
  if (selection?.kind === "year") {
    selectYear(selection.year + direction * YEAR_STEP);
  } else if (selection?.kind === "figure") {
    const next = byBirth[byBirth.indexOf(selection.figure) + direction];
    if (next) {
      select({ kind: "figure", figure: next });
      centerOnFigure(next);
    }
  }
};

const scrubber = initScrubber(mainViewport, axisViewport, {
  onYear: selectYear,
  onFigure: selectFigure,
});

const companion = initCompanion(stage, {
  onFigure: (id) => {
    selectFigure(id);
    if (selection?.kind === "figure") centerOnFigure(selection.figure);
  },
  onStep: step,
  onClose: () => select(null),
  renderYearExtra: renderNarrativeExtra,
});

// ─── Tooltip ─────────────────────────────────────────────────────

initTooltip(mainViewport, figures);

// ─── Zoom ────────────────────────────────────────────────────────

const repositionAll = () => {
  applyWidths();
  positionEraBands();
  positionTicks();
  positionEraMarkers();

  const newHeights = repositionBars(
    timelineView,
    figures,
    barMap,
    mainViewport.clientHeight,
    mainViewport.clientWidth / (MAX_YEAR - MIN_YEAR),
  );
  syncLaneLabels(newHeights);

  lineageHandle.reposition();
  narrativeHandle.reposition();

  scrubber.reposition();
  minimap.syncScroll();
};

const zoom = initZoom(mainViewport, zoomControls, repositionAll);

// ─── Navigation ──────────────────────────────────────────────────

const centerOnFigure = (figure: TimelineFigure) => {
  const bar = barMap.get(figure.id);
  const mid = yearToX((figure.birth + figure.death) / 2);
  mainViewport.scrollLeft = mid - mainViewport.clientWidth / 2;
  if (bar) {
    const top = bar.getBoundingClientRect().top - mainInner.getBoundingClientRect().top;
    mainViewport.scrollTop = top - mainViewport.clientHeight / 2;
  }
};

const focusFigure = (figure: TimelineFigure) => {
  const span = Math.max(figure.death - figure.birth, MIN_FOCUS_YEARS);
  const padding = span * FOCUS_PADDING_RATIO;
  zoom.focusRange(figure.birth - padding, figure.birth + span + padding);
  centerOnFigure(figure);
};

eraSelect.addEventListener("change", () => {
  const era = ERA_BANDS[Number(eraSelect.value)];
  if (eraSelect.value && era) zoom.focusRange(era.startYear, era.endYear);
  eraSelect.value = "";
});

initSearch(headerCenter!, (result: SearchResult) => {
  if (result.kind === "figure") {
    select({ kind: "figure", figure: result.figure });
    focusFigure(result.figure);
  } else if (result.kind === "year") {
    selectYear(result.year);
    mainViewport.scrollLeft = yearToX(result.year) - mainViewport.clientWidth / 2;
  } else {
    zoom.focusRange(result.era.startYear, result.era.endYear);
  }
});

// ─── About ───────────────────────────────────────────────────────

const about = document.querySelector<HTMLDialogElement>("#about")!;

aboutButton.addEventListener("click", () => about.showModal());
about.addEventListener("click", (e) => {
  if (e.target === about) about.close();
});

// ─── Keyboard ────────────────────────────────────────────────────

document.addEventListener("keydown", (e) => {
  const target = e.target as HTMLElement;
  if (about.open || target.matches("input, select, textarea")) return;
  if (e.key === "Escape") select(null);
  else if (e.key === "ArrowLeft") step(-1);
  else if (e.key === "ArrowRight") step(1);
});

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

// ─── Address ─────────────────────────────────────────────────────

const params = new URLSearchParams(location.search);
const initialView = params.get("view");
const initialFigure = figures.find((f) => f.id === params.get("figure"));
const initialYear = Number(params.get("year"));

if (initialView === "lineage" || initialView === "narrative") {
  setView(initialView satisfies ViewMode);
}

if (initialFigure) {
  select({ kind: "figure", figure: initialFigure });
  focusFigure(initialFigure);
} else if (params.get("year") && Number.isInteger(initialYear)) {
  selectYear(initialYear);
} else if (!initialView && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  timelineView.classList.add("timeline-view--intro");
  timelineView.addEventListener("animationend", () => {
    timelineView.classList.remove("timeline-view--intro");
  }, { once: true });
}
