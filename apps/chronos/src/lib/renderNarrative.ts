/**
 * Narrative stream graph — a stacked area chart (streamgraph) that
 * visualizes the emotional/political trajectory of the biblical story.
 */

import { stack, stackOffsetWiggle, stackOrderInsideOut, area, curveBasis } from "d3-shape";
import { scaleLinear } from "d3-scale";
import {
  narrativeThreads,
  interpolateAt,
  NARRATIVE_START,
  NARRATIVE_END,
} from "../data/narrative.ts";
import type { NarrativeThread } from "../data/narrative.ts";
import {
  yearToX,
  xToYear,
  getTimelineWidth,
  formatYear,
} from "./scale.ts";
import { getView, onViewChange } from "./viewState.ts";

// ─── Constants ───────────────────────────────────────────────────────

const SVG_NS = "http://www.w3.org/2000/svg";
const YEAR_STEP = 10;
const STREAM_PADDING = 40; // px top/bottom padding inside the SVG
const DEFAULT_HEIGHT = 500;

const THREAD_IDS = narrativeThreads.map((t) => t.id);

const ERA_ANNOTATIONS: { year: number; label: string }[] = [
  { year: -4004, label: "Creation" },
  { year: -2348, label: "Flood" },
  { year: -1921, label: "Abraham called" },
  { year: -1491, label: "Exodus" },
  { year: -1010, label: "David anointed" },
  { year: -931, label: "Kingdom divides" },
  { year: -722, label: "Israel falls" },
  { year: -586, label: "Jerusalem falls" },
  { year: -538, label: "Return from exile" },
  { year: -4, label: "Christ born" },
  { year: 33, label: "Resurrection" },
];

const VALUE_WORDS: [number, string][] = [
  [80, "overwhelming"],
  [60, "dominant"],
  [40, "strong"],
  [20, "present"],
  [0, "faint"],
];

const valueToWord = (v: number): string => {
  for (const [threshold, word] of VALUE_WORDS) {
    if (v >= threshold) return word;
  }
  return "faint";
};

// ─── Dense data generation ──────────────────────────────────────────

type StackRow = { year: number } & Record<string, number>;

/** Hard-transition years that must be included for sharp pinch points. */
const CRITICAL_YEARS = [
  -932, -931, -930,   // kingdom split
  -723, -722, -721,   // fall of Israel
  -587, -586, -585,   // fall of Jerusalem
];

const buildDenseData = (): StackRow[] => {
  // Generate regular steps
  const yearsSet = new Set<number>();
  for (let y = NARRATIVE_START; y <= NARRATIVE_END; y += YEAR_STEP) {
    yearsSet.add(y);
  }
  yearsSet.add(NARRATIVE_END);

  // Inject critical years for hard transitions
  for (const y of CRITICAL_YEARS) {
    yearsSet.add(y);
  }

  const years = Array.from(yearsSet).sort((a, b) => a - b);

  return years.map((year) => {
    const row: StackRow = { year };
    for (const thread of narrativeThreads) {
      row[thread.id] = interpolateAt(thread.points, year);
    }
    return row;
  });
};

// ─── SVG helpers ────────────────────────────────────────────────────

const svgEl = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
  parent?: SVGElement,
): SVGElementTagNameMap[K] => {
  const el = document.createElementNS(SVG_NS, tag) as SVGElementTagNameMap[K];
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
  }
  if (parent) parent.appendChild(el);
  return el;
};

// ─── Init ───────────────────────────────────────────────────────────

export interface NarrativeHandle {
  reposition: () => void;
  getThreadValuesAt: (year: number) => { id: string; name: string; value: number }[];
}

export const initNarrativeView = (container: HTMLElement): NarrativeHandle => {
  // Build dense data (doesn't change on zoom — only x-mapping changes)
  const denseData = buildDenseData();

  // D3 stack
  const stackGen = stack<StackRow>()
    .keys(THREAD_IDS)
    .offset(stackOffsetWiggle)
    .order(stackOrderInsideOut);

  const stackedData = stackGen(denseData);

  // Create SVG
  let svgHeight = DEFAULT_HEIGHT;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.classList.add("narrative-svg");
  svg.setAttribute("width", String(getTimelineWidth()));
  svg.setAttribute("height", String(svgHeight));
  container.appendChild(svg);

  // Groups for layering
  const streamsGroup = svgEl("g", { class: "narrative-streams" }, svg);
  const annotationsGroup = svgEl("g", { class: "narrative-annotations" }, svg);

  // Compute y domain from stacked data
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const series of stackedData) {
    for (const d of series) {
      if (d[0] < yMin) yMin = d[0];
      if (d[1] > yMax) yMax = d[1];
    }
  }

  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([svgHeight - STREAM_PADDING, STREAM_PADDING]);

  // Area generator
  const areaGen = area<[number, number] & { data: StackRow }>()
    .x((d) => yearToX(d.data.year))
    .y0((d) => yScale(d[0]))
    .y1((d) => yScale(d[1]))
    .curve(curveBasis);

  // Thread lookup for fast access
  const threadMap = new Map<string, NarrativeThread>();
  for (const t of narrativeThreads) threadMap.set(t.id, t);

  // ─── Render stream paths ────────────────────────────────────────

  const paths: SVGPathElement[] = [];

  stackedData.forEach((series, i) => {
    const threadId = series.key;
    const thread = threadMap.get(threadId)!;
    const path = svgEl("path", {
      d: areaGen(series as unknown as ([number, number] & { data: StackRow })[]) ?? "",
      fill: thread.color,
      "data-thread": threadId,
    }, streamsGroup);
    path.style.animationDelay = `${i * 200}ms`;
    paths.push(path);
  });

  // ─── Era annotations ───────────────────────────────────────────

  const annotationEls: { line: SVGLineElement; text: SVGTextElement; year: number }[] = [];

  for (const { year, label } of ERA_ANNOTATIONS) {
    const x = yearToX(year);
    const line = svgEl("line", {
      x1: x, y1: 0,
      x2: x, y2: svgHeight,
      class: "narrative-era-line",
    }, annotationsGroup);

    const text = svgEl("text", {
      x, y: 16,
      class: "narrative-era-label",
      transform: `rotate(-30, ${x}, 16)`,
    }, annotationsGroup);
    text.textContent = `${label} (${formatYear(year)})`;

    annotationEls.push({ line, text, year });
  }

  // ─── Legend ─────────────────────────────────────────────────────

  const legend = document.createElement("div");
  legend.className = "narrative-legend";
  legend.style.display = "none";

  for (const thread of narrativeThreads) {
    const row = document.createElement("div");
    row.className = "narrative-legend__row";

    const swatch = document.createElement("span");
    swatch.className = "narrative-legend__swatch";
    swatch.style.background = thread.color;
    row.appendChild(swatch);

    const name = document.createElement("span");
    name.className = "narrative-legend__name";
    name.textContent = thread.name;
    row.appendChild(name);

    legend.appendChild(row);
  }

  container.appendChild(legend);

  // ─── Hover tooltip ──────────────────────────────────────────────

  const tooltip = document.createElement("div");
  tooltip.className = "narrative-tooltip";
  container.appendChild(tooltip);

  let highlightedThread: string | null = null;

  const clearHighlight = () => {
    highlightedThread = null;
    for (const p of paths) {
      p.classList.remove("narrative--dimmed", "narrative--highlighted");
    }
    tooltip.classList.remove("narrative-tooltip--visible");
  };

  svg.addEventListener("mousemove", (e) => {
    const rect = svg.getBoundingClientRect();
    const svgX = e.clientX - rect.left + container.scrollLeft;
    const svgY = e.clientY - rect.top;
    const year = xToYear(svgX);

    if (year < NARRATIVE_START || year > NARRATIVE_END) {
      clearHighlight();
      return;
    }

    // Find which thread the cursor is over by walking stacked layers
    const yValue = yScale.invert(svgY);
    let foundThread: string | null = null;

    for (const series of stackedData) {
      // Find the two data points bracketing this year
      const data = series as unknown as ([number, number] & { data: StackRow })[];
      for (let i = 0; i < data.length - 1; i++) {
        const a = data[i]!;
        const b = data[i + 1]!;
        if (year >= a.data.year && year <= b.data.year) {
          const t = (b.data.year === a.data.year) ? 0 :
            (year - a.data.year) / (b.data.year - a.data.year);
          const low = a[0] + t * (b[0] - a[0]);
          const high = a[1] + t * (b[1] - a[1]);
          if (yValue >= low && yValue <= high) {
            foundThread = series.key;
          }
          break;
        }
      }
      if (foundThread) break;
    }

    if (foundThread && foundThread !== highlightedThread) {
      highlightedThread = foundThread;
      for (const p of paths) {
        const tid = p.getAttribute("data-thread");
        if (tid === foundThread) {
          p.classList.add("narrative--highlighted");
          p.classList.remove("narrative--dimmed");
        } else {
          p.classList.add("narrative--dimmed");
          p.classList.remove("narrative--highlighted");
        }
      }
    }

    if (foundThread) {
      const thread = threadMap.get(foundThread)!;
      const val = interpolateAt(thread.points, year);
      tooltip.innerHTML =
        `<strong>${thread.name}</strong><br>` +
        `<span class="narrative-tooltip__desc">${thread.description}</span><br>` +
        `<span class="narrative-tooltip__year">${formatYear(Math.round(year))}</span> · ` +
        `<span class="narrative-tooltip__word">${valueToWord(val)}</span>`;
      tooltip.classList.add("narrative-tooltip--visible");

      // Position tooltip near cursor
      const containerRect = container.getBoundingClientRect();
      const tx = e.clientX - containerRect.left + 16;
      const ty = e.clientY - containerRect.top - 10;
      tooltip.style.left = `${tx}px`;
      tooltip.style.top = `${ty}px`;
    } else {
      clearHighlight();
    }
  });

  svg.addEventListener("mouseleave", clearHighlight);

  // ─── Legend visibility tied to view ─────────────────────────────

  const syncLegendVisibility = () => {
    legend.style.display = getView() === "narrative" ? "" : "none";
  };

  onViewChange(syncLegendVisibility);
  syncLegendVisibility();

  // ─── Entrance animation ─────────────────────────────────────────

  const playEntrance = () => {
    for (const p of paths) {
      p.classList.remove("narrative-path--animate");
    }
    // Force reflow to restart animation
    void svg.getBoundingClientRect();
    for (const p of paths) {
      p.classList.add("narrative-path--animate");
    }
  };

  onViewChange((view) => {
    if (view === "narrative") playEntrance();
  });

  // ─── Reposition (zoom) ─────────────────────────────────────────

  const reposition = () => {
    const w = getTimelineWidth();
    svg.setAttribute("width", String(w));

    // Recompute area paths (x-coordinates changed)
    stackedData.forEach((series, i) => {
      const d = areaGen(series as unknown as ([number, number] & { data: StackRow })[]) ?? "";
      paths[i]!.setAttribute("d", d);
    });

    // Reposition annotations
    for (const { line, text, year } of annotationEls) {
      const x = yearToX(year);
      line.setAttribute("x1", String(x));
      line.setAttribute("x2", String(x));
      text.setAttribute("x", String(x));
      text.setAttribute("transform", `rotate(-30, ${x}, 16)`);
    }
  };

  // ─── Resize observer for SVG height ─────────────────────────────

  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const h = entry.contentRect.height;
      if (h > 0 && h !== svgHeight) {
        svgHeight = h;
        svg.setAttribute("height", String(svgHeight));
        yScale.range([svgHeight - STREAM_PADDING, STREAM_PADDING]);

        // Recompute paths and annotations with new height
        stackedData.forEach((series, i) => {
          const d = areaGen(series as unknown as ([number, number] & { data: StackRow })[]) ?? "";
          paths[i]!.setAttribute("d", d);
        });

        for (const { line } of annotationEls) {
          line.setAttribute("y2", String(svgHeight));
        }
      }
    }
  });
  resizeObserver.observe(container);

  // ─── Public API ─────────────────────────────────────────────────

  const getThreadValuesAt = (year: number) =>
    narrativeThreads.map((t) => ({
      id: t.id,
      name: t.name,
      value: interpolateAt(t.points, year),
    }));

  return { reposition, getThreadValuesAt };
};
