/**
 * Scrubber — a vertical line marking a year on the timeline. A mouse drags it
 * across the lanes. A finger pans the lanes, so touch scrubs on the axis strip
 * and picks with a tap.
 */

import { yearToX, xToYear, formatYear, MIN_YEAR, MAX_YEAR } from "./scale.ts";
import { el } from "./dom.ts";

const TAP_SLOP_PX = 8;
const FINGER_REACH_PX = 16;
const PICKABLE = ".figure-bar, circle.lineage-station";

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export interface ScrubberHandle {
  setYear: (year: number | null) => void;
  /** Reposition the line without changing the year (for zoom). */
  reposition: () => void;
}

interface ScrubberEvents {
  onYear: (year: number) => void;
  onFigure: (id: string) => void;
}

interface Press {
  pointerId: number;
  x: number;
  y: number;
  isMouse: boolean;
  figureId: string | null;
  moved: boolean;
}

export const initScrubber = (
  scrollContainer: HTMLElement,
  axisViewport: HTMLElement,
  { onYear, onFigure }: ScrubberEvents,
): ScrubberHandle => {
  const mainInner = scrollContainer.querySelector<HTMLElement>(".main-inner")!;
  const axisInner = axisViewport.querySelector<HTMLElement>(".axis-inner")!;

  const line = el("div", "scrubber", mainInner);
  const label = el("div", "scrubber__label", axisInner);
  line.hidden = label.hidden = true;

  let currentYear: number | null = null;
  let press: Press | null = null;

  const reposition = () => {
    if (currentYear === null) return;
    const x = `${yearToX(currentYear)}px`;
    line.style.left = x;
    label.style.left = x;
    label.textContent = formatYear(currentYear);
  };

  const setYear = (year: number | null) => {
    currentYear = year === null ? null : clamp(Math.round(year), MIN_YEAR, MAX_YEAR);
    line.hidden = label.hidden = currentYear === null;
    reposition();
  };

  const yearAt = (clientX: number): number => {
    const rect = scrollContainer.getBoundingClientRect();
    return clamp(
      Math.round(xToYear(clientX - rect.left + scrollContainer.scrollLeft)),
      MIN_YEAR,
      MAX_YEAR,
    );
  };

  const scrubTo = (clientX: number) => onYear(yearAt(clientX));

  /** Bars can be thinner than a fingertip, so a tap takes the nearest one in reach. */
  const figureNear = (clientX: number, clientY: number): string | null => {
    let nearest: string | null = null;
    let best = FINGER_REACH_PX;
    for (const node of mainInner.querySelectorAll<HTMLElement | SVGElement>(PICKABLE)) {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0) continue;
      const dx = Math.max(rect.left - clientX, 0, clientX - rect.right);
      const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom);
      const distance = Math.hypot(dx, dy);
      if (distance < best) {
        best = distance;
        nearest = node.dataset.id ?? null;
      }
    }
    return nearest;
  };

  // ─── Lanes ───────────────────────────────────────────────────

  scrollContainer.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    // A second finger means a pinch, not a tap.
    if (press) {
      press = null;
      return;
    }
    const bar = (e.target as Element).closest<HTMLElement | SVGElement>(".figure-bar, .lineage-station");
    press = {
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      isMouse: e.pointerType === "mouse",
      figureId: bar?.dataset.id ?? null,
      moved: false,
    };
    if (press.isMouse) {
      scrollContainer.setPointerCapture(e.pointerId);
      e.preventDefault();
      if (!press.figureId) scrubTo(e.clientX);
    }
  });

  scrollContainer.addEventListener("pointermove", (e) => {
    if (press?.pointerId !== e.pointerId) return;
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > TAP_SLOP_PX) {
      press.moved = true;
    }
    if (press.isMouse && (press.moved || !press.figureId)) scrubTo(e.clientX);
  });

  scrollContainer.addEventListener("pointerup", (e) => {
    if (press?.pointerId !== e.pointerId) return;
    const { moved, isMouse } = press;
    const figureId = press.figureId ?? (isMouse ? null : figureNear(e.clientX, e.clientY));
    press = null;
    if (moved) return;
    if (figureId) onFigure(figureId);
    else scrubTo(e.clientX);
  });

  scrollContainer.addEventListener("pointercancel", () => {
    press = null;
  });

  // ─── Axis strip ──────────────────────────────────────────────

  let axisPointer: number | null = null;

  axisViewport.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    axisPointer = e.pointerId;
    axisViewport.setPointerCapture(e.pointerId);
    scrubTo(e.clientX);
    e.preventDefault();
  });

  axisViewport.addEventListener("pointermove", (e) => {
    if (e.pointerId === axisPointer) scrubTo(e.clientX);
  });

  const stopAxis = () => {
    axisPointer = null;
  };
  axisViewport.addEventListener("pointerup", stopAxis);
  axisViewport.addEventListener("pointercancel", stopAxis);

  return { setYear, reposition };
};
