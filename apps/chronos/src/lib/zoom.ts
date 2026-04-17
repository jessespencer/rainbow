/**
 * Zoom controller — manages zoom level, wheel/button input,
 * and cursor-anchored scroll preservation.
 */

import {
  getPixelsPerYear,
  setPixelsPerYear,
  getDefaultPPY,
  yearToX,
  xToYear,
} from "./scale.ts";

const MIN_PPY = 1;
const MAX_PPY = 16;
const STEP_FACTOR = Math.pow(2, 1 / 4); // ~1.19x per tick

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

export interface ZoomHandle {
  getZoomPercent: () => number;
}

export const initZoom = (
  scrollContainer: HTMLElement,
  gutterEl: HTMLElement,
  onZoom: () => void,
): ZoomHandle => {
  // ─── Zoom logic ──────────────────────────────────────────────

  const applyZoom = (
    newPpy: number,
    anchorYear: number,
    anchorViewportX: number,
  ) => {
    const clamped = clamp(newPpy, MIN_PPY, MAX_PPY);
    if (clamped === getPixelsPerYear()) return;

    setPixelsPerYear(clamped);
    onZoom();

    // Restore anchor: the year under the cursor stays at the same screen X
    scrollContainer.scrollLeft =
      yearToX(anchorYear) - anchorViewportX;

    updateLabel();
  };

  const zoomByDelta = (
    delta: number,
    anchorClientX: number,
  ) => {
    const rect = scrollContainer.getBoundingClientRect();
    const viewportX = anchorClientX - rect.left;
    const anchorYear = xToYear(
      scrollContainer.scrollLeft + viewportX,
    );

    const ppy = getPixelsPerYear();
    const newPpy =
      delta > 0 ? ppy / STEP_FACTOR : ppy * STEP_FACTOR;
    applyZoom(newPpy, anchorYear, viewportX);
  };

  // ─── Wheel binding ───────────────────────────────────────────

  scrollContainer.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      zoomByDelta(e.deltaY, e.clientX);
    },
    { passive: false },
  );

  // ─── Zoom UI buttons ────────────────────────────────────────

  const controls = document.createElement("div");
  controls.className = "zoom-controls";

  const btnMinus = document.createElement("button");
  btnMinus.className = "zoom-btn";
  btnMinus.textContent = "−";
  btnMinus.setAttribute("aria-label", "Zoom out");

  const labelBtn = document.createElement("button");
  labelBtn.className = "zoom-label";
  labelBtn.setAttribute("aria-label", "Reset zoom");

  const btnPlus = document.createElement("button");
  btnPlus.className = "zoom-btn";
  btnPlus.textContent = "+";
  btnPlus.setAttribute("aria-label", "Zoom in");

  controls.appendChild(btnMinus);
  controls.appendChild(labelBtn);
  controls.appendChild(btnPlus);
  gutterEl.appendChild(controls);

  const updateLabel = () => {
    const pct = Math.round(
      (getPixelsPerYear() / getDefaultPPY()) * 100,
    );
    labelBtn.textContent = `${pct}%`;
  };

  updateLabel();

  const zoomButton = (direction: number) => {
    // Anchor to viewport center
    const rect = scrollContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    zoomByDelta(direction, centerX);
  };

  btnMinus.addEventListener("click", () => zoomButton(1));
  btnPlus.addEventListener("click", () => zoomButton(-1));
  labelBtn.addEventListener("click", () => {
    const rect = scrollContainer.getBoundingClientRect();
    const viewportX = rect.width / 2;
    const anchorYear = xToYear(
      scrollContainer.scrollLeft + viewportX,
    );
    applyZoom(getDefaultPPY(), anchorYear, viewportX);
  });

  return {
    getZoomPercent: () =>
      Math.round((getPixelsPerYear() / getDefaultPPY()) * 100),
  };
};
