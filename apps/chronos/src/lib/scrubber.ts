/**
 * Draggable scrubber — a vertical line the user positions on the
 * timeline to see who was alive at that moment. Drives bar
 * highlighting and the side panel.
 */

import { yearToX, xToYear, formatYear, MIN_YEAR, MAX_YEAR } from "./scale.ts";
import { formatLifespan, formatReign } from "./tooltip.ts";
import type { TimelineFigure, Category } from "../data/timeline.ts";

// ─── Category display order & names ──────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const aliveAt = (figures: TimelineFigure[], year: number) =>
  figures.filter((f) => f.birth <= year && year <= f.death);

// ─── DOM builders ────────────────────────────────────────────────

const buildScrubberLine = (container: HTMLElement) => {
  const wrapper = document.createElement("div");
  wrapper.className = "scrubber";

  const label = document.createElement("div");
  label.className = "scrubber__label";
  wrapper.appendChild(label);

  container.appendChild(wrapper);
  return { wrapper, label };
};

const buildPanel = () => {
  const panel = document.createElement("aside");
  panel.className = "panel";

  const topRow = document.createElement("div");
  topRow.className = "panel__top";

  const header = document.createElement("h2");
  header.className = "panel__header";
  topRow.appendChild(header);

  const closeBtn = document.createElement("button");
  closeBtn.className = "panel__close";
  closeBtn.setAttribute("aria-label", "Close panel");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    panel.classList.add("panel--hidden");
  });
  topRow.appendChild(closeBtn);

  panel.appendChild(topRow);

  const list = document.createElement("div");
  list.className = "panel__list";
  panel.appendChild(list);

  return { panel, header, list };
};

// ─── Panel rendering ─────────────────────────────────────────────

const renderPanel = (
  header: HTMLElement,
  list: HTMLElement,
  year: number,
  alive: TimelineFigure[],
) => {
  header.textContent = `Alive in ${formatYear(year)}`;

  // Group by category in display order
  const grouped = new Map<Category, TimelineFigure[]>();
  for (const f of alive) {
    const arr = grouped.get(f.category);
    if (arr) arr.push(f);
    else grouped.set(f.category, [f]);
  }

  list.innerHTML = "";

  if (alive.length === 0) {
    const empty = document.createElement("p");
    empty.className = "panel__empty";
    empty.textContent = "No figures at this date.";
    list.appendChild(empty);
    return;
  }

  for (const cat of CATEGORY_ORDER) {
    const group = grouped.get(cat);
    if (!group) continue;

    group.sort((a, b) => a.birth - b.birth);

    const section = document.createElement("div");
    section.className = "panel__section";

    const sectionTitle = document.createElement("h3");
    sectionTitle.className = "panel__section-title";
    sectionTitle.style.setProperty("--dot-color", `var(--cat-${cat})`);
    sectionTitle.textContent = CATEGORY_NAMES[cat];
    section.appendChild(sectionTitle);

    for (const f of group) {
      const entry = document.createElement("div");
      entry.className = "panel__entry";

      const name = document.createElement("span");
      name.className = "panel__name";
      name.textContent = f.name;
      entry.appendChild(name);

      const life = document.createElement("span");
      life.className = "panel__life";
      life.textContent = formatLifespan(f.birth, f.death);
      entry.appendChild(life);

      if (f.reignStart != null && f.reignEnd != null) {
        const reign = document.createElement("span");
        reign.className = "panel__reign";
        reign.textContent = formatReign(f.reignStart, f.reignEnd);
        entry.appendChild(reign);
      }

      const ref = document.createElement("span");
      ref.className = "panel__ref";
      ref.textContent = f.scriptureRef;
      entry.appendChild(ref);

      const blurb = document.createElement("p");
      blurb.className = "panel__blurb";
      blurb.textContent = f.blurb;
      entry.appendChild(blurb);

      section.appendChild(entry);
    }

    list.appendChild(section);
  }
};

// ─── Bar highlighting ────────────────────────────────────────────

const highlightBars = (container: HTMLElement, aliveIds: Set<string>) => {
  const bars = container.querySelectorAll<HTMLElement>(".figure-bar");
  for (const bar of bars) {
    const id = bar.dataset.id ?? "";
    if (aliveIds.has(id)) {
      bar.classList.add("figure-bar--active");
      bar.classList.remove("figure-bar--dimmed");
    } else {
      bar.classList.remove("figure-bar--active");
      bar.classList.add("figure-bar--dimmed");
    }
  }
};

// ─── Main init ───────────────────────────────────────────────────

export interface ScrubberHandle {
  setYear: (year: number) => void;
  getCurrentYear: () => number;
  /** Reposition the scrubber line without recomputing the panel (for zoom). */
  reposition: () => void;
}

export const initScrubber = (
  scrollContainer: HTMLElement,
  figures: TimelineFigure[],
  onChange?: (year: number) => void,
): ScrubberHandle => {
  const mainInner = scrollContainer.querySelector<HTMLElement>(".main-inner")!;
  const contentRow = scrollContainer.parentElement!;

  const { wrapper, label } = buildScrubberLine(mainInner);
  const { panel, header, list } = buildPanel();
  contentRow.appendChild(panel);

  // State: the scrubber tracks a year, not a pixel position.
  // This keeps it stable when the container scrolls.
  const centerX =
    scrollContainer.scrollLeft + scrollContainer.clientWidth / 2;
  const initialYear = clamp(
    Math.round(xToYear(centerX)),
    MIN_YEAR,
    MAX_YEAR,
  );

  let currentYear = initialYear;
  let isDragging = false;

  const positionScrubber = (year: number) => {
    const x = yearToX(year);
    wrapper.style.left = `${x}px`;
    label.textContent = formatYear(year);
  };

  const update = (year: number) => {
    currentYear = clamp(Math.round(year), MIN_YEAR, MAX_YEAR);
    positionScrubber(currentYear);
    panel.classList.remove("panel--hidden");

    const alive = aliveAt(figures, currentYear);
    const aliveIds = new Set(alive.map((f) => f.id));
    highlightBars(mainInner, aliveIds);
    renderPanel(header, list, currentYear, alive);
    onChange?.(currentYear);
  };

  // Initial render
  update(currentYear);

  // ─── Pointer events on the lane area ─────────────────────────

  const xFromPointer = (clientX: number): number => {
    const rect = scrollContainer.getBoundingClientRect();
    return clientX - rect.left + scrollContainer.scrollLeft;
  };

  const yearFromPointer = (clientX: number): number =>
    xToYear(xFromPointer(clientX));

  // Click to jump
  scrollContainer.addEventListener("pointerdown", (e) => {
    // Only primary button / touch
    if (e.button !== 0) return;

    // Don't intercept clicks on figure bars (let hover work)
    const target = e.target as HTMLElement;
    if (target.closest(".figure-bar")) {
      // Still set scrubber position but don't prevent default
    }

    isDragging = true;
    wrapper.classList.add("scrubber--dragging");
    scrollContainer.setPointerCapture(e.pointerId);
    update(yearFromPointer(e.clientX));
    e.preventDefault();
  });

  scrollContainer.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    update(yearFromPointer(e.clientX));
  });

  const stopDrag = () => {
    isDragging = false;
    wrapper.classList.remove("scrubber--dragging");
  };

  scrollContainer.addEventListener("pointerup", stopDrag);
  scrollContainer.addEventListener("pointercancel", stopDrag);

  return {
    setYear: update,
    getCurrentYear: () => currentYear,
    reposition: () => positionScrubber(currentYear),
  };
};
