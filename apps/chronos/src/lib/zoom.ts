/**
 * Zoom controller — a small camera over the timeline. Every input sets a
 * target and one frame loop moves toward it, so wheel, pinch, buttons and
 * jumps all glide, and any of them can interrupt another.
 */

import {
  getPixelsPerYear,
  setPixelsPerYear,
  yearToX,
  xToYear,
  MIN_YEAR,
  MAX_YEAR,
  END_PADDING_PX,
} from "./scale.ts";
import { el } from "./dom.ts";

const MAX_PPY = 16;
const BUTTON_FACTOR = 1.7;
const FOCUS_PADDING_PX = 32;
const WHEEL_EASE_MS = 80;
const PINCH_EASE_MS = 24;
const RESIZE_EASE_MS = 90;
const BUTTON_MS = 320;
const FLY_MS = 620;
const SETTLED_LOG = 0.001;
const MAX_FRAME_MS = 50;

/** Lucide's Scaling icon, the one on Rainbow's Fit button. */
const FIT_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
  '<path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="M21 3 9 15"/></svg>';

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Stays pinned to one spot on screen while the scale eases to its target. */
interface EaseMotion {
  kind: "ease";
  ppy: number;
  year: number;
  x: number;
  y: number;
  easeMs: number;
}

/** Travels from one view to another over a fixed time. */
interface FlyMotion {
  kind: "fly";
  startedAt: number;
  duration: number;
  fromPpy: number;
  toPpy: number;
  fromCenter: number;
  toCenter: number;
  onFrame?: (progress: number) => void;
}

export interface ZoomHandle {
  /** Show the whole timeline, and keep showing it through resizes. */
  fit: () => void;
  /** Zoom on the middle of the view, as the + and − buttons do. */
  zoomBy: (factor: number) => void;
  /** `onFrame` runs after each step, with progress from 0 to 1. */
  focusRange: (start: number, end: number, onFrame?: (progress: number) => void) => void;
}

interface ZoomEvents {
  /** The scale changed: redraw at the new pixels per year. */
  onZoom: () => void;
  /** The scroll position was set: bring anything synced to it along. */
  onMove: () => void;
}

export const initZoom = (
  scrollContainer: HTMLElement,
  controlsEl: HTMLElement,
  { onZoom, onMove }: ZoomEvents,
): ZoomHandle => {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  let fitted = true;
  let motion: EaseMotion | FlyMotion | null = null;
  let frame: number | null = null;
  let lastTick = 0;

  const fitPpy = () => (scrollContainer.clientWidth - END_PADDING_PX) / (MAX_YEAR - MIN_YEAR);
  const clampPpy = (ppy: number) => clamp(ppy, fitPpy(), MAX_PPY);
  const centerYear = () =>
    xToYear(scrollContainer.scrollLeft + scrollContainer.clientWidth / 2);

  // ─── Drawing ─────────────────────────────────────────────────

  /** The lane under a viewport height, and how far down it that height sits. */
  const laneAnchor = (y: number) => {
    const clientY = scrollContainer.getBoundingClientRect().top + y;
    for (const element of scrollContainer.querySelectorAll<HTMLElement>(".lane")) {
      const rect = element.getBoundingClientRect();
      if (clientY >= rect.top && clientY < rect.bottom) {
        return { element, clientY, fraction: (clientY - rect.top) / rect.height };
      }
    }
    return null;
  };

  const draw = (ppy: number, anchorYear: number, x: number, y: number | null) => {
    // Rows change height with zoom, so hold the lane under the anchor still vertically too.
    const anchor = y === null ? null : laneAnchor(y);

    if (ppy !== getPixelsPerYear()) {
      setPixelsPerYear(ppy);
      onZoom();
    }
    scrollContainer.scrollLeft = yearToX(anchorYear) - x;
    if (anchor) {
      const rect = anchor.element.getBoundingClientRect();
      scrollContainer.scrollTop += rect.top + anchor.fraction * rect.height - anchor.clientY;
    }
    onMove();
  };

  const stepEase = (m: EaseMotion, elapsed: number): boolean => {
    const remaining = Math.log(m.ppy / getPixelsPerYear());
    const settled = Math.abs(remaining) < SETTLED_LOG || m.easeMs === 0;
    const ppy = settled
      ? m.ppy
      : getPixelsPerYear() * Math.exp(remaining * (1 - Math.exp(-elapsed / m.easeMs)));
    draw(ppy, m.year, m.x, m.y);
    return settled;
  };

  const stepFly = (m: FlyMotion, now: number): boolean => {
    const progress = m.duration === 0 ? 1 : clamp((now - m.startedAt) / m.duration, 0, 1);
    const t = easeInOut(progress);
    const ppy = m.fromPpy * (m.toPpy / m.fromPpy) ** t;
    const center = m.fromCenter + (m.toCenter - m.fromCenter) * t;
    draw(ppy, center, scrollContainer.clientWidth / 2, null);
    m.onFrame?.(t);
    return progress === 1;
  };

  const finish = () => {
    motion = null;
    frame = null;
    document.body.classList.remove("zooming");
    fitted = getPixelsPerYear() <= fitPpy() + 1e-6;
  };

  const tick = (now: number) => {
    if (!motion) return;
    const elapsed = Math.min(now - lastTick, MAX_FRAME_MS);
    lastTick = now;
    const done = motion.kind === "ease" ? stepEase(motion, elapsed) : stepFly(motion, now);
    if (done) finish();
    else frame = requestAnimationFrame(tick);
  };

  const start = (next: EaseMotion | FlyMotion) => {
    motion = next;
    fitted = false;
    document.body.classList.add("zooming");
    if (frame === null) {
      lastTick = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  // ─── Moves ───────────────────────────────────────────────────

  const easeAt = (ppy: number, clientX: number, clientY: number, easeMs: number) => {
    const rect = scrollContainer.getBoundingClientRect();
    const x = clientX - rect.left;
    start({
      kind: "ease",
      ppy: clampPpy(ppy),
      year: xToYear(scrollContainer.scrollLeft + x),
      x,
      y: clientY - rect.top,
      easeMs: reducedMotion.matches ? 0 : easeMs,
    });
  };

  const flyTo = (
    ppy: number,
    center: number,
    duration: number,
    onFrame?: (progress: number) => void,
  ) => {
    start({
      kind: "fly",
      startedAt: performance.now(),
      duration: reducedMotion.matches ? 0 : duration,
      fromPpy: getPixelsPerYear(),
      toPpy: clampPpy(ppy),
      fromCenter: centerYear(),
      toCenter: center,
      onFrame,
    });
  };

  const wholeStoryCenter = (MIN_YEAR + MAX_YEAR) / 2;
  const fit = () => flyTo(fitPpy(), wholeStoryCenter, FLY_MS);

  const targetPpy = () =>
    motion?.kind === "ease" ? motion.ppy : getPixelsPerYear();

  // ─── Wheel binding ───────────────────────────────────────────

  scrollContainer.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      // The same curve as d3-zoom, which Rainbow uses. Trackpad pinches arrive as ctrl-wheel.
      const unit = e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002;
      const factor = 2 ** (-e.deltaY * unit * (e.ctrlKey ? 10 : 1));
      easeAt(targetPpy() * factor, e.clientX, e.clientY, WHEEL_EASE_MS);
    },
    { passive: false },
  );

  // ─── Pinch binding ───────────────────────────────────────────

  interface Pinch {
    distance: number;
    ppy: number;
    year: number;
  }

  let pinch: Pinch | null = null;

  const spread = (touches: TouchList): number =>
    Math.hypot(
      touches[0]!.clientX - touches[1]!.clientX,
      touches[0]!.clientY - touches[1]!.clientY,
    );

  const midpoint = (touches: TouchList): [number, number] => {
    const rect = scrollContainer.getBoundingClientRect();
    return [
      (touches[0]!.clientX + touches[1]!.clientX) / 2 - rect.left,
      (touches[0]!.clientY + touches[1]!.clientY) / 2 - rect.top,
    ];
  };

  scrollContainer.addEventListener(
    "touchstart",
    (e) => {
      if (e.touches.length !== 2) return;
      const [x] = midpoint(e.touches);
      pinch = {
        distance: spread(e.touches),
        ppy: getPixelsPerYear(),
        year: xToYear(scrollContainer.scrollLeft + x),
      };
    },
    { passive: true },
  );

  scrollContainer.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length !== 2 || !pinch) return;
      if (e.cancelable) e.preventDefault();
      // Anchored to the year under the fingers at the start, so two fingers also pan.
      const [x, y] = midpoint(e.touches);
      start({
        kind: "ease",
        ppy: clampPpy((pinch.ppy * spread(e.touches)) / pinch.distance),
        year: pinch.year,
        x,
        y,
        easeMs: reducedMotion.matches ? 0 : PINCH_EASE_MS,
      });
    },
    { passive: false },
  );

  scrollContainer.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) pinch = null;
  });

  // ─── Zoom UI buttons ────────────────────────────────────────

  const group = el("div", "segmented", controlsEl);
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Zoom");

  const btnFit = el("button", "zoom-fit", group);
  btnFit.innerHTML = `${FIT_ICON}Fit`;

  const btnMinus = el("button", "", group);
  btnMinus.textContent = "−";
  btnMinus.setAttribute("aria-label", "Zoom out");

  const btnPlus = el("button", "", group);
  btnPlus.textContent = "+";
  btnPlus.setAttribute("aria-label", "Zoom in");

  const zoomButton = (factor: number) => {
    flyTo(getPixelsPerYear() * factor, centerYear(), BUTTON_MS);
  };

  btnFit.addEventListener("click", fit);
  btnMinus.addEventListener("click", () => zoomButton(1 / BUTTON_FACTOR));
  btnPlus.addEventListener("click", () => zoomButton(BUTTON_FACTOR));

  // Deferred a frame: refitting can resize the viewport this observer is watching.
  new ResizeObserver(() => {
    requestAnimationFrame(() => {
      if (motion?.kind === "fly") return;
      if (fitted) {
        // The panel opening or a window resize: glide to the new fit.
        start({
          kind: "ease",
          ppy: fitPpy(),
          year: MIN_YEAR,
          x: 0,
          y: 0,
          easeMs: reducedMotion.matches ? 0 : RESIZE_EASE_MS,
        });
      }
      // Row heights follow the viewport even when the zoom doesn't change.
      onZoom();
      onMove();
    });
  }).observe(scrollContainer);

  setPixelsPerYear(fitPpy());
  onZoom();
  onMove();

  return {
    fit,
    zoomBy: zoomButton,
    focusRange: (from, to, onFrame) => {
      const lo = Math.max(MIN_YEAR, from);
      const hi = Math.min(MAX_YEAR, to);
      const width = scrollContainer.clientWidth - FOCUS_PADDING_PX * 2;
      flyTo(width / (hi - lo), (lo + hi) / 2, FLY_MS, onFrame);
    },
  };
};
