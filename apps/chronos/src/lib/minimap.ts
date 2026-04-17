/**
 * Minimap — a compressed overview of the full timeline fixed at the
 * bottom of the viewport. Shows era bands, a viewport indicator,
 * and the scrubber position. Clickable and draggable for navigation.
 */

import { yearToX, TIMELINE_WIDTH } from "./scale.ts";
import { ERA_BANDS } from "./eras.ts";

export interface MinimapHandle {
  /** Call when the scrubber year changes. */
  setScrubberYear: (year: number) => void;
  /** Call when the main viewport scrolls. */
  syncScroll: () => void;
}

export const initMinimap = (
  scrollContainer: HTMLElement,
): MinimapHandle => {
  const app = document.getElementById("app")!;

  // ─── Build DOM ──────────────────────────────────────────────

  const minimap = document.createElement("div");
  minimap.className = "minimap";

  const track = document.createElement("div");
  track.className = "minimap__track";
  minimap.appendChild(track);

  // Era bands
  for (const era of ERA_BANDS) {
    const band = document.createElement("div");
    band.className = "minimap__era";
    const l = yearToX(era.startYear);
    const w = yearToX(era.endYear) - l;
    band.style.left = `${(l / TIMELINE_WIDTH) * 100}%`;
    band.style.width = `${(w / TIMELINE_WIDTH) * 100}%`;
    band.style.background = era.color;
    track.appendChild(band);
  }

  // Viewport indicator
  const viewportRect = document.createElement("div");
  viewportRect.className = "minimap__viewport-rect";
  track.appendChild(viewportRect);

  // Scrubber line
  const scrubLine = document.createElement("div");
  scrubLine.className = "minimap__scrubber";
  track.appendChild(scrubLine);

  app.appendChild(minimap);

  // ─── Helpers ────────────────────────────────────────────────

  const syncViewport = () => {
    const scrollW = scrollContainer.scrollWidth;
    const clientW = scrollContainer.clientWidth;
    if (scrollW <= 0) return;
    const left = scrollContainer.scrollLeft / scrollW;
    const width = clientW / scrollW;
    viewportRect.style.left = `${left * 100}%`;
    viewportRect.style.width = `${width * 100}%`;
  };

  const setScrubberYear = (year: number) => {
    const pct = yearToX(year) / TIMELINE_WIDTH;
    scrubLine.style.left = `${pct * 100}%`;
  };

  // ─── Click to navigate ─────────────────────────────────────

  let isDragging = false;

  const scrollToFraction = (clientX: number) => {
    const rect = track.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetScroll = frac * scrollContainer.scrollWidth - scrollContainer.clientWidth / 2;
    scrollContainer.scrollLeft = Math.max(0, targetScroll);
  };

  minimap.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    minimap.setPointerCapture(e.pointerId);
    scrollToFraction(e.clientX);
    e.preventDefault();
  });

  minimap.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    scrollToFraction(e.clientX);
  });

  minimap.addEventListener("pointerup", () => { isDragging = false; });
  minimap.addEventListener("pointercancel", () => { isDragging = false; });

  // ─── Initial state ─────────────────────────────────────────

  syncViewport();

  return { setScrubberYear, syncScroll: syncViewport };
};
