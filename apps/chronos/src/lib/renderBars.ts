/**
 * Renders figure bars into their category lanes.
 *
 * Each figure becomes an absolutely positioned <div> inside its lane.
 * Overlapping figures within the same lane are stacked into sub-rows
 * using a greedy first-fit algorithm (sorted by birth year).
 */

import { formatYear, getPixelsPerYear, yearToX } from "./scale.ts";
import type { TimelineFigure, Category } from "../data/timeline.ts";

export const CHRIST_ID = "jesus";

const FULL_ROW_H = 24;
const MIN_ROW_H = 3;
const FULL_GAP = 4;
const COMPACT_GAP = 1;
const FULL_LANE_PAD = 6;
const COMPACT_LANE_PAD = 3;
/** Rows reach full height, with names, at this zoom. */
const FULL_PPY = 1;
const MIN_LANE_H = 18;
const MIN_NAMED_BAR_W = 36;
const MIN_NAMED_ROW_H = 16;
const MIN_BAR_W = 4;
const BAR_GAP_X = 1;
/** Rows are assigned at the narrowest zoom any screen reaches, so no bar changes row while zooming. */
const LAYOUT_PPY = 0.09;

interface Placement {
  figure: TimelineFigure;
  row: number;
}

/** Greedy first-fit sub-row assignment for one category's figures. */
const computePlacements = (figures: TimelineFigure[]): Placement[] => {
  const sorted = [...figures].sort((a, b) => a.birth - b.birth);
  const rowEnds: number[] = [];
  const minYears = MIN_BAR_W / LAYOUT_PPY;
  const gapYears = BAR_GAP_X / LAYOUT_PPY;

  return sorted.map((figure) => {
    let row = 0;
    while (row < rowEnds.length && (rowEnds[row] ?? -Infinity) + gapYears > figure.birth) {
      row++;
    }

    rowEnds[row] = figure.birth + Math.max(figure.death - figure.birth, minYears);
    return { figure, row };
  });
};

interface Density {
  rowH: number;
  gap: number;
  pad: number;
}

/**
 * Zoomed all the way out, rows shrink so every lane fits the viewport at once.
 * They grow back to full height, with names, as you zoom in.
 */
const densityFor = (totalRows: number, laneCount: number, fitHeight: number, fitPpy: number): Density => {
  const fit = (fitHeight - laneCount * 2 * COMPACT_LANE_PAD) / totalRows - COMPACT_GAP;
  const fitRow = Math.max(MIN_ROW_H, Math.min(FULL_ROW_H, fit));
  const span = Math.log(FULL_PPY / fitPpy);
  const progress = span > 0 ? Math.log(getPixelsPerYear() / fitPpy) / span : 1;
  const t = Math.max(0, Math.min(1, progress));
  return {
    rowH: fitRow + (FULL_ROW_H - fitRow) * t,
    gap: COMPACT_GAP + (FULL_GAP - COMPACT_GAP) * t,
    pad: COMPACT_LANE_PAD + (FULL_LANE_PAD - COMPACT_LANE_PAD) * t,
  };
};

/** Compute lane height from sub-row count. */
const laneHeightForRows = (rowCount: number, { rowH, gap, pad }: Density): number =>
  Math.max(MIN_LANE_H, rowCount * (rowH + gap) - gap + 2 * pad);

const FULL_DENSITY: Density = { rowH: FULL_ROW_H, gap: FULL_GAP, pad: FULL_LANE_PAD };

/** Apply position + reign to a bar element. */
const applyBarPosition = (
  bar: HTMLElement,
  { figure, row }: Placement,
  { rowH, gap, pad }: Density,
) => {
  const left = yearToX(figure.birth);
  const width = Math.max(yearToX(figure.death) - left, MIN_BAR_W);
  bar.style.left = `${left}px`;
  bar.style.width = `${width}px`;
  bar.style.top = `${pad + row * (rowH + gap)}px`;
  bar.style.height = `${rowH}px`;
  bar.classList.toggle(
    "figure-bar--unnamed",
    width < MIN_NAMED_BAR_W || rowH < MIN_NAMED_ROW_H,
  );

  // Update reign overlay if present
  if (figure.reignStart != null && figure.reignEnd != null &&
      (figure.reignStart !== figure.birth || figure.reignEnd !== figure.death)) {
    const reign = bar.querySelector<HTMLElement>(".figure-bar__reign");
    if (reign) {
      const reignLeft = yearToX(figure.reignStart) - left;
      const reignWidth = Math.max(
        yearToX(figure.reignEnd) - yearToX(figure.reignStart),
        MIN_BAR_W,
      );
      reign.style.left = `${reignLeft}px`;
      reign.style.width = `${reignWidth}px`;
    }
  }
};

/** Create a single figure bar element. */
const createBar = (placement: Placement): HTMLDivElement => {
  const { figure } = placement;
  const bar = document.createElement("div");
  bar.className = "figure-bar";
  bar.dataset.category = figure.category;
  bar.dataset.id = figure.id;
  bar.style.setProperty("--bar-color", `var(--cat-${figure.category})`);

  // His bar is too short to name at most zooms, so his label rides beside it.
  if (figure.id === CHRIST_ID) {
    bar.classList.add("figure-bar--christ");
    const label = document.createElement("span");
    label.className = "christ-label";
    const nameEl = document.createElement("span");
    nameEl.className = "christ-label__name";
    nameEl.textContent = figure.name;
    const dates = document.createElement("span");
    dates.className = "christ-label__dates";
    dates.textContent = `${formatYear(figure.birth)} – ${formatYear(figure.death)}`;
    label.append(nameEl, dates);
    bar.appendChild(label);
  }

  const name = document.createElement("span");
  name.className = "figure-bar__name";
  name.textContent = figure.name;
  bar.appendChild(name);

  // Reign overlay — only when reign period differs from lifespan
  if (
    figure.reignStart != null &&
    figure.reignEnd != null &&
    (figure.reignStart !== figure.birth || figure.reignEnd !== figure.death)
  ) {
    const reign = document.createElement("div");
    reign.className = "figure-bar__reign";
    bar.appendChild(reign);
  }

  applyBarPosition(bar, placement, FULL_DENSITY);
  return bar;
};

interface Lane {
  element: HTMLElement;
  placements: Placement[];
  rows: number;
}

export interface RenderResult {
  lanes: Lane[];
  laneHeights: Map<Category, number>;
  barMap: Map<string, HTMLElement>;
}

/**
 * Render all figures as positioned bars within their category lanes.
 * Returns the lanes and a map of bar elements for repositioning.
 */
export const renderBars = (
  container: HTMLElement,
  figures: TimelineFigure[],
): RenderResult => {
  const byCategory = new Map<Category, TimelineFigure[]>();
  for (const f of figures) {
    const list = byCategory.get(f.category);
    if (list) {
      list.push(f);
    } else {
      byCategory.set(f.category, [f]);
    }
  }

  const lanes: Lane[] = [];
  const laneHeights = new Map<Category, number>();
  const barMap = new Map<string, HTMLElement>();

  for (const element of container.querySelectorAll<HTMLElement>(".lane[data-category]")) {
    const cat = element.dataset.category as Category;
    const catFigures = byCategory.get(cat);
    if (!catFigures) continue;

    const placements = computePlacements(catFigures);
    const rows = placements.reduce((m, p) => Math.max(m, p.row), 0) + 1;
    lanes.push({ element, placements, rows });

    const h = laneHeightForRows(rows, FULL_DENSITY);
    element.style.height = `${h}px`;
    laneHeights.set(cat, h);

    for (const placement of placements) {
      const bar = createBar(placement);
      element.appendChild(bar);
      barMap.set(placement.figure.id, bar);
    }
  }

  return { lanes, laneHeights, barMap };
};

/**
 * Reposition existing bars in place after a zoom change.
 * Returns updated lane heights.
 */
export const repositionBars = (
  lanes: Lane[],
  barMap: Map<string, HTMLElement>,
  fitHeight: number,
  fitPpy: number,
): Map<Category, number> => {
  const totalRows = lanes.reduce((sum, { rows }) => sum + rows, 0);
  const density = densityFor(totalRows, lanes.length, fitHeight, fitPpy);
  const laneHeights = new Map<Category, number>();

  for (const { element, placements, rows } of lanes) {
    const h = laneHeightForRows(rows, density);
    element.style.height = `${h}px`;
    laneHeights.set(element.dataset.category as Category, h);

    for (const placement of placements) {
      const bar = barMap.get(placement.figure.id);
      if (bar) applyBarPosition(bar, placement, density);
    }
  }

  return laneHeights;
};
