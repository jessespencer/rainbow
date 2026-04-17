/**
 * Renders figure bars into their category lanes.
 *
 * Each figure becomes an absolutely positioned <div> inside its lane.
 * Overlapping figures within the same lane are stacked into sub-rows
 * using a greedy first-fit algorithm (sorted by birth year).
 */

import { yearToX } from "./scale.ts";
import type { TimelineFigure, Category } from "../data/timeline.ts";

const SUB_ROW_H = 24;
const SUB_ROW_GAP = 4;
const LANE_PAD_Y = 6;
const MIN_LANE_H = 80;
const MIN_BAR_W = 6;
const BAR_GAP_X = 2;

interface Placement {
  figure: TimelineFigure;
  row: number;
  left: number;
  width: number;
}

/** Greedy first-fit sub-row assignment for one category's figures. */
const computePlacements = (figures: TimelineFigure[]): Placement[] => {
  const sorted = [...figures].sort((a, b) => a.birth - b.birth);
  const rowEnds: number[] = [];

  return sorted.map((figure) => {
    const left = yearToX(figure.birth);
    const width = Math.max(yearToX(figure.death) - left, MIN_BAR_W);
    const right = left + width;

    // Find lowest sub-row where this bar doesn't collide
    let row = 0;
    while (row < rowEnds.length && (rowEnds[row] ?? 0) + BAR_GAP_X > left) {
      row++;
    }

    rowEnds[row] = right;
    return { figure, row, left, width };
  });
};

/** Compute lane height from sub-row count. */
const laneHeightForRows = (rowCount: number): number =>
  Math.max(MIN_LANE_H, rowCount * (SUB_ROW_H + SUB_ROW_GAP) - SUB_ROW_GAP + 2 * LANE_PAD_Y);

/** Create a single figure bar element. */
const createBar = ({ figure, row, left, width }: Placement): HTMLDivElement => {
  const bar = document.createElement("div");
  bar.className = "figure-bar";
  bar.dataset.category = figure.category;
  bar.dataset.id = figure.id;
  bar.style.left = `${left}px`;
  bar.style.width = `${width}px`;
  bar.style.top = `${LANE_PAD_Y + row * (SUB_ROW_H + SUB_ROW_GAP)}px`;
  bar.style.height = `${SUB_ROW_H}px`;
  bar.style.setProperty("--bar-color", `var(--cat-${figure.category})`);

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
    const reignLeft = yearToX(figure.reignStart) - left;
    const reignWidth = Math.max(
      yearToX(figure.reignEnd) - yearToX(figure.reignStart),
      MIN_BAR_W,
    );
    const reign = document.createElement("div");
    reign.className = "figure-bar__reign";
    reign.style.left = `${reignLeft}px`;
    reign.style.width = `${reignWidth}px`;
    bar.appendChild(reign);
  }

  return bar;
};

/**
 * Render all figures as positioned bars within their category lanes.
 * Lanes are resized to fit stacked sub-rows. Returns a map of
 * category → computed lane height (px) for syncing label heights.
 */
export const renderBars = (
  container: HTMLElement,
  figures: TimelineFigure[],
): Map<Category, number> => {
  // Group figures by category
  const byCategory = new Map<Category, TimelineFigure[]>();
  for (const f of figures) {
    const list = byCategory.get(f.category);
    if (list) {
      list.push(f);
    } else {
      byCategory.set(f.category, [f]);
    }
  }

  const laneHeights = new Map<Category, number>();
  const lanes = container.querySelectorAll<HTMLElement>(".lane[data-category]");

  for (const lane of lanes) {
    const cat = lane.dataset.category as Category;
    const catFigures = byCategory.get(cat);
    if (!catFigures) continue;

    const placements = computePlacements(catFigures);
    const maxRow = placements.reduce((m, p) => Math.max(m, p.row), 0);
    const h = laneHeightForRows(maxRow + 1);
    lane.style.height = `${h}px`;
    laneHeights.set(cat, h);

    for (const placement of placements) {
      lane.appendChild(createBar(placement));
    }
  }

  return laneHeights;
};
