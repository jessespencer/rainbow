/**
 * Zoom controller — manages zoom level, wheel, pinch and button input,
 * and anchored scroll preservation.
 */

import {
  getPixelsPerYear,
  setPixelsPerYear,
  yearToX,
  xToYear,
  MIN_YEAR,
  MAX_YEAR,
} from "./scale.ts";
import { el } from "./dom.ts";

const MAX_PPY = 16;
const STEP_FACTOR = Math.pow(2, 1 / 4); // ~1.19x per tick
const BUTTON_STEPS = 3;
const FOCUS_PADDING_PX = 32;

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export interface ZoomHandle {
  /** Show the whole timeline, and keep showing it through resizes. */
  fit: () => void;
  focusRange: (start: number, end: number) => void;
}

export const initZoom = (
  scrollContainer: HTMLElement,
  controlsEl: HTMLElement,
  onZoom: () => void,
): ZoomHandle => {
  let fitted = true;

  const fitPpy = () => scrollContainer.clientWidth / (MAX_YEAR - MIN_YEAR);

  // ─── Zoom logic ──────────────────────────────────────────────

  const applyZoom = (
    newPpy: number,
    anchorYear: number,
    anchorViewportX: number,
  ) => {
    const lowest = fitPpy();
    const clamped = clamp(newPpy, lowest, MAX_PPY);
    fitted = clamped === lowest;
    if (clamped !== getPixelsPerYear()) {
      setPixelsPerYear(clamped);
      onZoom();
    }

    // Restore anchor: the year under the cursor stays at the same screen X
    scrollContainer.scrollLeft = yearToX(anchorYear) - anchorViewportX;
  };

  const zoomAt = (factor: number, anchorClientX: number) => {
    const rect = scrollContainer.getBoundingClientRect();
    const viewportX = anchorClientX - rect.left;
    const anchorYear = xToYear(scrollContainer.scrollLeft + viewportX);
    applyZoom(getPixelsPerYear() * factor, anchorYear, viewportX);
  };

  const fit = () => applyZoom(fitPpy(), MIN_YEAR, 0);

  // ─── Wheel binding ───────────────────────────────────────────

  scrollContainer.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomAt(e.deltaY > 0 ? 1 / STEP_FACTOR : STEP_FACTOR, e.clientX);
    },
    { passive: false },
  );

  // ─── Pinch binding ───────────────────────────────────────────

  let pinchDistance = 0;

  const spread = (touches: TouchList): number =>
    Math.hypot(
      touches[0]!.clientX - touches[1]!.clientX,
      touches[0]!.clientY - touches[1]!.clientY,
    );

  scrollContainer.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length === 2) pinchDistance = spread(e.touches);
    },
    { passive: true },
  );

  scrollContainer.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 2 || pinchDistance === 0) return;
      if (e.cancelable) e.preventDefault();
      const distance = spread(e.touches);
      const midX = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
      zoomAt(distance / pinchDistance, midX);
      pinchDistance = distance;
    },
    { passive: false },
  );

  scrollContainer.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) pinchDistance = 0;
  });

  // ─── Zoom UI buttons ────────────────────────────────────────

  const btnFit = el("button", "canvas-btn", controlsEl);
  btnFit.textContent = "Whole story";

  const btnMinus = el("button", "zoom-btn", controlsEl);
  btnMinus.textContent = "−";
  btnMinus.setAttribute("aria-label", "Zoom out");

  const btnPlus = el("button", "zoom-btn", controlsEl);
  btnPlus.textContent = "+";
  btnPlus.setAttribute("aria-label", "Zoom in");

  const zoomButton = (factor: number) => {
    const rect = scrollContainer.getBoundingClientRect();
    zoomAt(factor, rect.left + rect.width / 2);
  };

  btnFit.addEventListener("click", fit);
  btnMinus.addEventListener("click", () => zoomButton(STEP_FACTOR ** -BUTTON_STEPS));
  btnPlus.addEventListener("click", () => zoomButton(STEP_FACTOR ** BUTTON_STEPS));

  // Deferred a frame: refitting can resize the viewport this observer is watching.
  new ResizeObserver(() => {
    requestAnimationFrame(() => {
      if (fitted) fit();
      // Row heights follow the viewport even when the zoom doesn't change.
      onZoom();
    });
  }).observe(scrollContainer);

  fit();

  return {
    fit,
    focusRange: (start, end) => {
      const lo = Math.max(MIN_YEAR, start);
      const hi = Math.min(MAX_YEAR, end);
      const width = scrollContainer.clientWidth - FOCUS_PADDING_PX * 2;
      applyZoom(width / (hi - lo), lo, FOCUS_PADDING_PX);
    },
  };
};
