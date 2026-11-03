import "@jessespencer/bible-ui/style.css";
import "./style.css";
import { createHeader, loadFonts } from "@jessespencer/bible-ui";
import { createGuide } from "@jessespencer/bible-ui/guide";
import { initSelectMenus } from "@jessespencer/bible-ui/select-menu";
import { Compass, createElement } from "lucide";
import {
  yearToX,
  xToYear,
  formatYear,
  getTimelineWidth,
  MIN_YEAR,
  MAX_YEAR,
  END_PADDING_PX,
} from "./lib/scale.ts";
import { CHRIST_ID, renderBars, repositionBars } from "./lib/renderBars.ts";
import { initScrubber } from "./lib/scrubber.ts";
import { initTooltip, showTooltip, hideTooltip } from "./lib/tooltip.ts";
import { initMinimap } from "./lib/minimap.ts";
import { initZoom } from "./lib/zoom.ts";
import { initCompanion, readingTranslation } from "./lib/companion.ts";
import { DEFAULT_TRANSLATION } from "@jessespencer/bible-ui/translations";
import { initSearch } from "./lib/search.ts";
import type { SearchResult } from "./lib/search.ts";
import { el } from "./lib/dom.ts";
import { CATEGORY_DESCRIPTIONS, CATEGORY_NAMES, CATEGORY_ORDER } from "./lib/categories.ts";
import { ERA_BANDS, type EraBand } from "./lib/eras.ts";
import { figures } from "./data/timeline.ts";
import type { Category, TimelineFigure } from "./data/timeline.ts";
import { onViewChange, getView, setView } from "./lib/viewState.ts";
import { initHeader } from "./lib/header.ts";
import { allFigures, familyLine, initLineageView } from "./lib/renderLineage.ts";
import { initLineToggle, parseLineMode } from "./lib/lineToggle.ts";
import { guideFor } from "./lib/guides.ts";
import type { LineMode } from "./lib/lineToggle.ts";

// ─── Constants ───────────────────────────────────────────────────

const TICK_INTERVAL = 100;
const LABEL_INTERVAL = 500;
const MIN_ERA_LABEL_GAP = 34;
const ERA_CHAR_PX = 7;
const MIN_TICK_LABEL_GAP = 60;
const YEAR_STEP = 10;
const MIN_FOCUS_YEARS = 60;
const FOCUS_PADDING_RATIO = 0.15;
// Space kept above an era's first bar when its lives don't all fit on screen
const ERA_TOP_MARGIN = 24;

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
initSelectMenus();

// Works offline once visited, and the browser can install it (public/sw.js). Production only.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((err) => console.warn("Offline copy unavailable", err));
}

// -- Header (shared component) --
const { element: headerEl, controls: headerControls, center: headerCenter } = createHeader({
  title: "Lineage",
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
el("div", "label-gutter", axisRow);

const axisViewport = el("div", "axis-viewport", axisRow);
const axisInner = el("div", "axis-inner", axisViewport);

// -- Content row --
const contentRow = el("div", "content-row", canvasArea);

const laneLabels = el("div", "lane-labels", contentRow);
const laneLabelsInner = el("div", undefined, laneLabels);

const lineageGutter = el("div", "lineage-gutter", contentRow);
lineageGutter.style.display = "none";

const mainViewport = el("div", "main-viewport", contentRow);
const mainInner = el("div", "main-inner", mainViewport);

// -- View containers (all live inside mainInner) --
const timelineView = el("div", "timeline-view", mainInner);
const lineageView = el("div", "lineage-view", mainInner);
lineageView.style.display = "none";

// -- Canvas overlays --
const overlays = el("div", "canvas-status", canvasArea);
const statusRow = el("div", "status-row", overlays);
const livesCount = el("span", undefined, statusRow);
livesCount.textContent = `${figures.length} lives`;
const eraSelect = el("select", "era-select bui-select", statusRow);
eraSelect.setAttribute("aria-label", "Jump to an era");
el("option", undefined, eraSelect).textContent = "Era";
eraSelect.options[0]!.value = "";
ERA_BANDS.forEach((era, i) => {
  const option = el("option", undefined, eraSelect);
  option.value = String(i);
  option.textContent = era.name;
});
const zoomControls = el("div", "zoom-controls", statusRow);

const credits = el("footer", "canvas-credits", app);
const aboutButton = el("button", "about-button", credits);
aboutButton.textContent = "About";
const dataCredit = el("span", undefined, credits);
dataCredit.append("Data: ");
const bsbLink = el("a", undefined, dataCredit);
bsbLink.href = "https://berean.bible/";
bsbLink.target = "_blank";
bsbLink.rel = "noopener";
bsbLink.textContent = "BSB";
dataCredit.append(", Ussher, Thiele");

// ─── Set initial widths ──────────────────────────────────────────

const applyWidths = () => {
  const w = `${getTimelineWidth() + END_PADDING_PX}px`;
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
  // Each theme picks its own: see .era-band and .minimap__era in style.css.
  band.style.setProperty("--era-night", era.color);
  band.style.setProperty("--era-day", era.wash);
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
    // Near the end of the axis, the label runs back from its year so it isn't cut off.
    const labelWidth = (element.textContent?.length ?? 0) * ERA_CHAR_PX;
    element.classList.toggle("era-label--end", x + labelWidth > getTimelineWidth() + END_PADDING_PX);
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

const { lanes, laneHeights, barMap } = renderBars(timelineView, figures);

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

const lineageHandle = initLineageView(lineageView, lineageGutter);

// ─── View Switching ──────────────────────────────────────────────

onViewChange((view) => {
  timelineView.style.display = view === "timeline" ? "" : "none";
  lineageView.style.display = view === "lineage" ? "" : "none";
  laneLabels.style.display = view === "timeline" ? "" : "none";
  lineageGutter.style.display = view === "lineage" ? "" : "none";
  lineToggle.setVisible(view === "lineage");
  livesCount.textContent = `${(view === "lineage" ? allFigures : figures).length} lives`;
  hideTooltip();
  reposition();
  syncAddress();
});

// ─── Minimap ─────────────────────────────────────────────────────

const minimap = initMinimap(mainViewport, canvasArea);

// ─── Scrubber ────────────────────────────────────────────────────

// ─── Selection ───────────────────────────────────────────────────

type Selection =
  | { kind: "figure"; figure: TimelineFigure }
  | { kind: "year"; year: number }
  | null;

let selection: Selection = null;

const byBirth = [...figures].sort((a, b) => a.birth - b.birth);
const allByBirth = [...allFigures].sort((a, b) => a.birth - b.birth);
/** The priests are only on the Lineage map, so only that view counts them. */
const people = () => (getView() === "lineage" ? allByBirth : byBirth);

const aliveAt = (year: number) =>
  people().filter((f) => f.birth <= year && year <= f.death);

const overlapping = (figure: TimelineFigure) =>
  people().filter(
    (f) => f !== figure && f.birth <= figure.death && figure.birth <= f.death,
  );

const paintBars = (lit: TimelineFigure[] | null, selected: TimelineFigure | null) => {
  const litIds = new Set(lit?.map((f) => f.id));
  for (const [id, bar] of barMap) {
    bar.classList.toggle("figure-bar--active", litIds.has(id));
    bar.classList.toggle("figure-bar--dimmed", lit !== null && !litIds.has(id) && id !== CHRIST_ID);
    bar.classList.toggle("figure-bar--selected", id === selected?.id);
  }
};

const syncAddress = () => {
  const params = new URLSearchParams();
  if (getView() !== "timeline") params.set("view", getView());
  if (getView() === "lineage" && lineMode !== "all") params.set("line", lineMode);
  if (selection?.kind === "figure") params.set("figure", selection.figure.id);
  if (selection?.kind === "year") params.set("year", String(selection.year));
  if (readingTranslation().id !== DEFAULT_TRANSLATION.id) params.set("tr", readingTranslation().id);
  const query = params.toString();
  history.replaceState(null, "", query ? `?${query}` : location.pathname);
};

let lineMode: LineMode = "all";

const lineToggle = initLineToggle(overlays, canvasArea, (mode) => {
  lineMode = mode;
  lineageHandle.setMode(mode);
  syncAddress();
});
lineToggle.setVisible(false);

const select = (next: Selection) => {
  selection = next;
  if (next?.kind === "figure") {
    const alongside = overlapping(next.figure);
    scrubber.setYear(null);
    minimap.setScrubberYear(null);
    paintBars([next.figure, ...alongside], next.figure);
    lineageHandle.setFocus(new Set(familyLine(next.figure).map((f) => f.id)), next.figure.id);
    companion.showFigure(next.figure, alongside);
  } else if (next?.kind === "year") {
    const alive = aliveAt(next.year);
    scrubber.setYear(next.year);
    minimap.setScrubberYear(next.year);
    paintBars(alive, null);
    lineageHandle.setFocus(new Set(alive.map((f) => f.id)), null);
    companion.showYear(next.year, alive);
  } else {
    scrubber.setYear(null);
    minimap.setScrubberYear(null);
    paintBars(null, null);
    lineageHandle.setFocus(null, null);
    companion.hide();
  }
  syncAddress();
};

const selectFigure = (id: string) => {
  const figure = allFigures.find((f) => f.id === id);
  if (figure) select({ kind: "figure", figure });
};

const selectYear = (year: number) => {
  select({ kind: "year", year: Math.min(MAX_YEAR, Math.max(MIN_YEAR, year)) });
};

const step = (direction: -1 | 1) => {
  if (selection?.kind === "year") {
    selectYear(selection.year + direction * YEAR_STEP);
  } else if (selection?.kind === "figure") {
    const order = people();
    const next = order[order.indexOf(selection.figure) + direction];
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
  onTranslation: () => syncAddress(),
});

// ─── Tooltip ─────────────────────────────────────────────────────

initTooltip(mainViewport, figures);

// ─── Zoom ────────────────────────────────────────────────────────

const reposition = () => {
  applyWidths();
  positionTicks();
  positionEraMarkers();

  // Only the visible view is redrawn while zooming; switching views catches up.
  const view = getView();
  if (view === "timeline") {
    positionEraBands();
    const fitPpy = mainViewport.clientWidth / (MAX_YEAR - MIN_YEAR);
    syncLaneLabels(repositionBars(lanes, barMap, mainViewport.clientHeight, fitPpy));
  } else {
    lineageHandle.reposition(mainViewport.clientHeight);
  }

  scrubber.reposition();
};

const syncScroll = () => {
  axisViewport.scrollLeft = mainViewport.scrollLeft;
  laneLabels.scrollTop = mainViewport.scrollTop;
  minimap.syncScroll();
};

const zoom = initZoom(mainViewport, zoomControls, { onZoom: reposition, onMove: syncScroll });

// ─── Controls guide ──────────────────────────────────────────────

const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
// Each press of + or − zooms by this much
const KEY_ZOOM = 1.6;
const guide = createGuide({ parent: statusRow, stage: canvasArea, icon: () => createElement(Compass) });
const showGuide = () => guide.show(`chronos-${getView()}`, guideFor(getView(), isMac));
onViewChange(showGuide);
mainViewport.setAttribute(
  "aria-label",
  "Timeline of lives from Adam to the resurrection. Scroll to move through time, hold Command or Control and scroll to zoom, press plus and minus to zoom, click a life to read about it, and press Escape to clear.",
);

// ─── Navigation ──────────────────────────────────────────────────

const smoothScroll = (): ScrollBehavior =>
  matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

const figureTop = (figure: TimelineFigure): number => {
  const bar = barMap.get(figure.id);
  if (!bar || getView() !== "timeline") return mainViewport.scrollTop;
  const top = bar.getBoundingClientRect().top - mainInner.getBoundingClientRect().top;
  return top - mainViewport.clientHeight / 2;
};

const centerOnFigure = (figure: TimelineFigure) => {
  mainViewport.scrollTo({
    left: yearToX((figure.birth + figure.death) / 2) - mainViewport.clientWidth / 2,
    top: figureTop(figure),
    behavior: smoothScroll(),
  });
};

const focusFigure = (figure: TimelineFigure) => {
  const span = Math.max(figure.death - figure.birth, MIN_FOCUS_YEARS);
  const padding = span * FOCUS_PADDING_RATIO;
  const startTop = mainViewport.scrollTop;
  zoom.focusRange(figure.birth - padding, figure.birth + span + padding, (progress) => {
    mainViewport.scrollTop = startTop + (figureTop(figure) - startTop) * progress;
    syncScroll();
  });
};

/** Where to scroll so the era's lives are on screen: all of them centred, or the first at the top. */
const eraTop = (era: EraBand): number => {
  if (getView() !== "timeline") return mainViewport.scrollTop;
  const origin = mainInner.getBoundingClientRect().top;
  let top = Infinity;
  let bottom = -Infinity;
  for (const figure of figures) {
    if (figure.death < era.startYear || figure.birth > era.endYear) continue;
    const rect = barMap.get(figure.id)?.getBoundingClientRect();
    if (!rect) continue;
    top = Math.min(top, rect.top - origin);
    bottom = Math.max(bottom, rect.bottom - origin);
  }
  if (top === Infinity) return mainViewport.scrollTop;
  const room = mainViewport.clientHeight;
  return bottom - top <= room - ERA_TOP_MARGIN * 2
    ? (top + bottom) / 2 - room / 2
    : top - ERA_TOP_MARGIN;
};

// The era a jump landed on, shown in the menu until the view leaves it.
let shownEra: EraBand | null = null;

const focusEra = (era: EraBand) => {
  shownEra = era;
  eraSelect.value = String(ERA_BANDS.indexOf(era));
  const startTop = mainViewport.scrollTop;
  // Measured each frame, since rows grow as the zoom does.
  zoom.focusRange(era.startYear, era.endYear, (progress) => {
    mainViewport.scrollTop = startTop + (eraTop(era) - startTop) * progress;
    syncScroll();
  });
};

eraSelect.addEventListener("change", () => {
  const era = ERA_BANDS[Number(eraSelect.value)];
  if (eraSelect.value && era) focusEra(era);
});

mainViewport.addEventListener("scroll", () => {
  if (!shownEra || document.body.classList.contains("zooming")) return;
  const center = xToYear(mainViewport.scrollLeft + mainViewport.clientWidth / 2);
  if (center < shownEra.startYear || center > shownEra.endYear) {
    shownEra = null;
    eraSelect.value = "";
  }
});

initSearch(headerCenter!, (result: SearchResult) => {
  if (result.kind === "figure") {
    // Some priests have no Timeline bar, so they open on the map that has them.
    if (!barMap.has(result.figure.id)) setView("lineage");
    select({ kind: "figure", figure: result.figure });
    focusFigure(result.figure);
  } else if (result.kind === "year") {
    selectYear(result.year);
    mainViewport.scrollTo({
      left: yearToX(result.year) - mainViewport.clientWidth / 2,
      behavior: smoothScroll(),
    });
  } else {
    focusEra(result.era);
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
  // Plain + and −; with ⌘ or Ctrl they stay the browser's page zoom
  else if (e.metaKey || e.ctrlKey || e.altKey) return;
  else if (e.key === "+" || e.key === "=") zoom.zoomBy(KEY_ZOOM);
  else if (e.key === "-" || e.key === "_") zoom.zoomBy(1 / KEY_ZOOM);
});

// ─── Scroll Sync ─────────────────────────────────────────────────

mainViewport.addEventListener("scroll", syncScroll);

// Forward wheel events from lane labels to main viewport
laneLabels.addEventListener("wheel", (e) => {
  e.preventDefault();
  mainViewport.scrollTop += e.deltaY;
  mainViewport.scrollLeft += e.deltaX;
}, { passive: false });

// ─── Address ─────────────────────────────────────────────────────

const params = new URLSearchParams(location.search);
const initialView = params.get("view");
const initialFigure = allFigures.find((f) => f.id === params.get("figure"));
const initialYear = Number(params.get("year"));

lineMode = parseLineMode(params.get("line"));
lineToggle.setMode(lineMode);
if (lineMode !== "all") lineageHandle.setMode(lineMode);

if (initialView === "lineage") setView(initialView);
showGuide();

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
