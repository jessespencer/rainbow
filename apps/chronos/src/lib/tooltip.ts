/**
 * Tooltip system. Provides shared show/hide helpers and a
 * figure-bar-specific initializer with 400ms hover delay.
 */

import { formatYear } from "./scale.ts";
import type { TimelineFigure } from "../data/timeline.ts";

const SHOW_DELAY = 400;

// ─── Shared tooltip helpers ──────────────────────────────────────

const tip = document.createElement("div");
tip.className = "tooltip";
tip.setAttribute("role", "tooltip");
document.body.appendChild(tip);

export const showTooltip = (html: string, x: number, y: number): void => {
  tip.innerHTML = html;
  tip.classList.add("tooltip--visible");

  const pad = 12;
  const tipW = tip.offsetWidth;
  const tipH = tip.offsetHeight;
  const left = Math.min(x + pad, window.innerWidth - tipW - pad);
  const top = Math.max(pad, y - tipH - pad);
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
};

export const hideTooltip = (): void => {
  tip.classList.remove("tooltip--visible");
};

// ─── Figure-bar tooltip ──────────────────────────────────────────

export const formatLifespan = (birth: number, death: number): string => {
  const span = death - birth - (birth < 0 && death > 0 ? 1 : 0);
  const from = formatYear(birth);
  const to = formatYear(death);
  return `${from} – ${to} (${span} yrs)`;
};

/** Birth to death for the panel and tooltip, with an unknown death said plainly. */
export const describeLife = (figure: TimelineFigure): string => {
  const estimate = figure.estimated ? "About " : "";
  if (figure.deathUnknown) return `${estimate}${formatYear(figure.birth)} – death not recorded`;
  if (figure.estimated) return `About ${formatYear(figure.birth)} – ${formatYear(figure.death)}, estimated`;
  return formatLifespan(figure.birth, figure.death);
};

/** The short form, for lists and labels. */
export const formatDates = (figure: TimelineFigure): string =>
  `${figure.estimated ? "c. " : ""}${formatYear(figure.birth)} – ${figure.deathUnknown ? "unknown" : formatYear(figure.death)}`;

export const formatReign = (start: number, end: number): string =>
  `Reigned ${formatYear(start)} – ${formatYear(end)}`;

export const initTooltip = (
  container: HTMLElement,
  figures: TimelineFigure[],
): void => {
  const figureMap = new Map(figures.map((f) => [f.id, f]));

  let timer: ReturnType<typeof setTimeout> | null = null;
  let activeBar: HTMLElement | null = null;

  const show = (bar: HTMLElement, x: number, y: number) => {
    const id = bar.dataset.id;
    if (!id) return;
    const f = figureMap.get(id);
    if (!f) return;

    let html = `<strong class="tooltip__name">${f.name}</strong>`;
    html += `<span class="tooltip__life">${describeLife(f)}</span>`;
    if (f.reignStart != null && f.reignEnd != null) {
      html += `<span class="tooltip__reign">${formatReign(f.reignStart, f.reignEnd)}</span>`;
    }
    html += `<span class="tooltip__ref">${f.scriptureRef}</span>`;
    html += `<p class="tooltip__blurb">${f.blurb}</p>`;

    showTooltip(html, x, y);
  };

  const hide = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    hideTooltip();
    activeBar = null;
  };

  // Touch selects a bar instead; a tap's synthetic hover shouldn't also show a tooltip.
  if (!matchMedia("(hover: hover)").matches) return;

  container.addEventListener("mouseover", (e) => {
    const bar = (e.target as HTMLElement).closest<HTMLElement>(".figure-bar");
    if (!bar || bar === activeBar) return;
    hide();
    activeBar = bar;
    const rect = bar.getBoundingClientRect();
    timer = setTimeout(() => {
      show(bar, rect.left + rect.width / 2, rect.top);
    }, SHOW_DELAY);
  });

  container.addEventListener("mouseout", (e) => {
    const bar = (e.target as HTMLElement).closest(".figure-bar");
    if (bar === activeBar || !activeBar) {
      hide();
    }
  });

  // Hide during scrubber drag
  container.addEventListener("pointerdown", () => hide());
};
