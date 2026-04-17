/**
 * Hover tooltip for figure bars. Shows name, lifespan, reign,
 * scripture ref, and blurb after a 400ms delay.
 */

import { formatYear } from "./scale.ts";
import type { TimelineFigure } from "../data/timeline.ts";

const SHOW_DELAY = 400;

const formatLifespan = (birth: number, death: number): string => {
  const span = death - birth - (birth < 0 && death > 0 ? 1 : 0);
  const from = formatYear(birth);
  const to = formatYear(death);
  return `${from} – ${to} (${span} yrs)`;
};

const formatReign = (start: number, end: number): string =>
  `Reigned ${formatYear(start)} – ${formatYear(end)}`;

export const initTooltip = (
  container: HTMLElement,
  figures: TimelineFigure[],
): void => {
  const figureMap = new Map(figures.map((f) => [f.id, f]));

  // Single tooltip element, reused
  const tip = document.createElement("div");
  tip.className = "tooltip";
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let activeBar: HTMLElement | null = null;

  const show = (bar: HTMLElement, x: number, y: number) => {
    const id = bar.dataset.id;
    if (!id) return;
    const f = figureMap.get(id);
    if (!f) return;

    let html = `<strong class="tooltip__name">${f.name}</strong>`;
    html += `<span class="tooltip__life">${formatLifespan(f.birth, f.death)}</span>`;
    if (f.reignStart != null && f.reignEnd != null) {
      html += `<span class="tooltip__reign">${formatReign(f.reignStart, f.reignEnd)}</span>`;
    }
    html += `<span class="tooltip__ref">${f.scriptureRef}</span>`;
    html += `<p class="tooltip__blurb">${f.blurb}</p>`;

    tip.innerHTML = html;
    tip.classList.add("tooltip--visible");

    // Position near cursor, clamped to viewport
    const pad = 12;
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;
    const left = Math.min(x + pad, window.innerWidth - tipW - pad);
    const top = Math.max(pad, y - tipH - pad);
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  };

  const hide = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    tip.classList.remove("tooltip--visible");
    activeBar = null;
  };

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
