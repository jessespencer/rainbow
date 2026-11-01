/**
 * Subway-map lineage renderer — the Messianic line from Adam to Jesus, with
 * the other family lines peeling off it. Lines and stations are SVG. Labels
 * are HTML, so they keep a readable size at any zoom, take turns when space
 * is tight, and gain dates and descriptions as zooming makes room.
 */

import { yearToX, getTimelineWidth, formatYear, getPixelsPerYear, END_PADDING_PX } from "./scale.ts";
import { el } from "./dom.ts";
import { CHRIST_ID } from "./renderBars.ts";
import { figures } from "../data/timeline.ts";
import type { TimelineFigure, Lineage } from "../data/timeline.ts";

// ─── Layout constants ────────────────────────────────────────────

const NS = "http://www.w3.org/2000/svg";
const MIN_H = 440;
/** Clears the controls in the top right corner. */
const PAD_TOP = 76;
const PAD_BOTTOM = 16;
const FADE_PX = 60;
const MIN_CURVE_PX = 30;
const TIER_OFFSET_PX = 12;
const LABEL_GAP_PX = 10;
const TRUNK_CHAR_PX = 7.6;
const BRANCH_CHAR_PX = 6.8;
/** Detail arrives with zoom, so the whole story stays a clean map. */
const MIN_DATES_PPY = 0.6;
const MIN_BLURB_PPY = 1.2;
const ENDING_CHAR_PX = 6.2;
const ENDING_GAP_PX = 10;
const ENDING_H = 14;
const ENDING_DROP_PX = 22;
const NAME_H = 16;
const DATES_H = 14;
const DATES_W = 118;
const MAX_BLURB_W = 250;
const BLURB_CHAR_PX = 5.8;
const BLURB_LINE_PX = 16.5;
/** Below this lane height, a description would run into the next lane. */
const MIN_BLURB_LANE_PX = 72;
const MAX_TRIBE_ROW_PX = 18;
const MIN_NAMED_TRIBE_ROW_PX = 11;
const TRIBE_NAME_PPY = 3;
const TRIBE_CHAR_PX = 6.7;
const TRIBE_DATES_PX = 118;

interface LaneDef {
  lineage: Lineage;
  name: string;
  /** Share of the height. The trunk and tribes need more than a single line. */
  weight: number;
  color: string;
  /** Printed where the line ends. A hard stop also gets its year. */
  ending?: string;
}

/** Top to bottom. */
const LANES: LaneDef[] = [
  { lineage: "cainite", name: "Line of Cain", weight: 1, color: "var(--lineage-cainite)", ending: "The Flood" },
  { lineage: "nations", name: "The nations", weight: 1, color: "var(--lineage-nations)", ending: "Continues →" },
  { lineage: "ishmaelite", name: "Ishmael", weight: 1, color: "var(--lineage-ishmaelite)", ending: "Continues →" },
  { lineage: "messianic", name: "Messianic line", weight: 1.7, color: "var(--lineage-messianic)" },
  { lineage: "edomite", name: "Edom", weight: 1, color: "var(--lineage-edomite)", ending: "Continues →" },
  { lineage: "tribes", name: "Twelve tribes", weight: 1.8, color: "var(--lineage-tribes)", ending: "Tribes continue →" },
  { lineage: "israel-king", name: "Kings of Israel", weight: 1, color: "var(--lineage-israel-king)", ending: "Fall of Samaria" },
];

/** Lines the story ends outright. The others fade out. */
const HARD_STOP_LINEAGES: Set<Lineage> = new Set(["cainite", "israel-king"]);

/** The line leads to Jesus: his station and label outrank everything else on the map. */
const CHRIST_NAME_H = 28;
/** How far past his station's center a flipped label ends: the edge of the dot. */
const CHRIST_LABEL_REACH_PX = 11;
const CHRIST_CHAR_PX = 13;

/** Who gets a label first when there isn't room for everyone. */
const KEY_FIGURES = new Set([
  "adam", "noah", "abraham", "isaac", "jacob", "judah", "king-david", "king-solomon",
  "hezekiah", "josiah", "zerubbabel", "mary", "jesus",
  "cain", "ham", "ishmael", "esau", "jeroboam-i",
]);

// ─── Data helpers ────────────────────────────────────────────────

const figureMap = new Map(figures.map((f) => [f.id, f]));

const figuresByLineage = (lineage: Lineage): TimelineFigure[] =>
  figures
    .filter((f) => f.lineage === lineage)
    .sort((a, b) => a.birth - b.birth);

const childrenOf = (figure: TimelineFigure): TimelineFigure[] =>
  figures
    .filter((f) => f.parent === figure.id)
    .sort((a, b) => a.birth - b.birth);

const ancestorsOf = (figure: TimelineFigure): TimelineFigure[] => {
  const line: TimelineFigure[] = [];
  let parent = figure.parent ? figureMap.get(figure.parent) : undefined;
  while (parent) {
    line.push(parent);
    parent = parent.parent ? figureMap.get(parent.parent) : undefined;
  }
  return line;
};

const descendantsOf = (figure: TimelineFigure): TimelineFigure[] =>
  childrenOf(figure).flatMap((child) => [child, ...descendantsOf(child)]);

/** A person with every ancestor and descendant the data records. */
export const familyLine = (figure: TimelineFigure): TimelineFigure[] => [
  figure,
  ...ancestorsOf(figure),
  ...descendantsOf(figure),
];

export { childrenOf };

// ─── SVG element helpers ─────────────────────────────────────────

const svgEl = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number>,
  parent: SVGElement,
): SVGElementTagNameMap[K] => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent.appendChild(node);
  return node;
};

const curve = (x1: number, y1: number, x2: number, y2: number): string => {
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
};

// ─── Stored references ───────────────────────────────────────────

interface Station {
  figure: TimelineFigure;
  lineage: Lineage;
  dot: SVGCircleElement;
  hit: SVGCircleElement;
  label: HTMLElement;
  dates: HTMLElement;
  blurb: HTMLElement;
  /** Row within the tribes fan. */
  row: number;
}

interface Branch {
  lineage: Lineage;
  figures: TimelineFigure[];
  from: TimelineFigure | undefined;
  connector: SVGPathElement | null;
  line: SVGPathElement;
  stop: SVGLineElement | null;
  fade: SVGLinearGradientElement | null;
}

interface TribeStem {
  figure: TimelineFigure;
  from: TimelineFigure;
  row: number;
  connector: SVGPathElement;
  line: SVGPathElement;
  fade: SVGLinearGradientElement;
}

interface Ending {
  lineage: Lineage;
  label: HTMLElement;
  rect: Rect;
}

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Claim {
  rect: Rect;
  tier: number;
  x: number;
  y: number;
  station: Station;
}

const overlaps = (a: Rect, b: Rect): boolean =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

// ─── Exports ─────────────────────────────────────────────────────

export interface LineageHandle {
  reposition: (height: number) => void;
  /** Lights these people and dims the rest. `null` clears it. */
  setFocus: (lit: Set<string> | null, selectedId: string | null) => void;
}

export const initLineageView = (
  container: HTMLElement,
  gutter: HTMLElement,
): LineageHandle => {
  const svg = document.createElementNS(NS, "svg");
  svg.classList.add("lineage-svg");
  container.appendChild(svg);
  const labels = el("div", "lineage-labels", container);

  const defs = svgEl("defs", {}, svg);
  const glow = svgEl("radialGradient", { id: "christ-glow" }, defs);
  svgEl("stop", { offset: "0%", "stop-color": "var(--lineage-christ)", "stop-opacity": 0.75 }, glow);
  svgEl("stop", { offset: "45%", "stop-color": "var(--lineage-christ)", "stop-opacity": 0.22 }, glow);
  svgEl("stop", { offset: "100%", "stop-color": "var(--lineage-christ)", "stop-opacity": 0 }, glow);
  const branchGroup = svgEl("g", {}, svg);
  const trunkGroup = svgEl("g", {}, svg);
  const stationGroup = svgEl("g", {}, svg);

  const stations: Station[] = [];
  const branches: Branch[] = [];
  const stems: TribeStem[] = [];
  const gutterNames = new Map<Lineage, HTMLElement>();
  const endings = new Map<Lineage, Ending>();
  let halo: SVGCircleElement | null = null;

  const addStation = (figure: TimelineFigure, lineage: Lineage, row = 0) => {
    const isTrunk = lineage === "messianic";
    const isChrist = figure.id === CHRIST_ID;
    const color = isChrist
      ? "var(--lineage-christ)"
      : LANES.find((l) => l.lineage === lineage)!.color;
    const radius = isChrist
      ? 10
      : isTrunk ? (KEY_FIGURES.has(figure.id) ? 6.5 : 5) : lineage === "tribes" ? 3.5 : 4.5;
    if (isChrist) {
      halo = svgEl("circle", { r: 34, fill: "url(#christ-glow)", class: "lineage-halo" }, stationGroup);
    }
    const hit = svgEl("circle", { r: isChrist ? 20 : 13, fill: "transparent" }, stationGroup);
    const dot = svgEl("circle", {
      r: radius,
      fill: color,
      stroke: isChrist ? "#fff" : "rgba(255,255,255,0.75)",
      "stroke-width": isChrist ? 2.5 : 1.5,
    }, stationGroup);

    const label = el("button", `lineage-label lineage-label--${isTrunk ? "trunk" : "branch"}`, labels);
    if (lineage === "tribes") label.classList.add("lineage-label--tribe");
    if (isChrist) label.classList.add("lineage-label--christ");
    el("span", "lineage-label__name", label).textContent = figure.name;
    const dates = el("span", "lineage-label__dates", label);
    dates.textContent = `${formatYear(figure.birth)} – ${formatYear(figure.death)}`;
    const blurb = el("span", "lineage-label__blurb", label);
    blurb.textContent = figure.blurb;

    for (const node of [dot, hit, label]) {
      node.classList.add("lineage-station");
      node.dataset.id = figure.id;
      node.dataset.lineage = lineage;
    }
    stations.push({ figure, lineage, dot, hit, label, dates, blurb, row });
  };

  const addFade = (id: string, color: string) => {
    // On a user-space gradient, so it paints on a perfectly horizontal line.
    const fade = svgEl("linearGradient", { id, gradientUnits: "userSpaceOnUse" }, defs);
    svgEl("stop", { offset: "0%", "stop-color": color, "stop-opacity": 1 }, fade);
    svgEl("stop", { offset: "100%", "stop-color": color, "stop-opacity": 0 }, fade);
    return fade;
  };

  for (const { lineage, name, color, ending } of LANES) {
    if (ending) {
      const label = el("div", "lineage-ending", labels);
      const lastDeath = Math.max(...figuresByLineage(lineage).map((f) => f.death));
      label.textContent = HARD_STOP_LINEAGES.has(lineage)
        ? `${ending}, ${formatYear(lastDeath)}`
        : ending;
      label.classList.toggle("lineage-ending--final", HARD_STOP_LINEAGES.has(lineage));
      endings.set(lineage, {
        lineage,
        label,
        rect: { left: 0, right: 0, top: 0, bottom: 0 },
      });
    }

    const row = el("div", "lineage-gutter__name", gutter);
    row.textContent = name;
    row.style.setProperty("--dot-color", color);
    gutterNames.set(lineage, row);

    const figs = figuresByLineage(lineage);
    const group = lineage === "messianic" ? trunkGroup : branchGroup;

    if (lineage === "tribes") {
      figs.forEach((figure, i) => {
        const from = figureMap.get(figure.parent ?? "");
        if (!from) return;
        const attrs = { fill: "none", stroke: color, "stroke-width": 1.5, "stroke-linecap": "round" };
        const connector = svgEl("path", attrs, branchGroup);
        const fade = addFade(`fade-tribe-${i}`, color);
        const stem = svgEl("path", { ...attrs, stroke: `url(#fade-tribe-${i})` }, branchGroup);
        connector.dataset.lineage = stem.dataset.lineage = lineage;
        stems.push({ figure, from, row: i, connector, line: stem, fade });
        addStation(figure, lineage, i);
      });
      continue;
    }

    const branchFig = figs.find((f) => {
      const parent = f.parent ? figureMap.get(f.parent) : undefined;
      return parent?.lineage === "messianic";
    });
    const from = branchFig ? figureMap.get(branchFig.parent!) : undefined;
    const isHardStop = HARD_STOP_LINEAGES.has(lineage);
    const isTrunk = lineage === "messianic";

    const fade = isHardStop || isTrunk ? null : addFade(`fade-${lineage}`, color);

    const strokeWidth = isTrunk ? 4 : 2.5;
    const connector = from
      ? svgEl("path", { fill: "none", stroke: color, "stroke-width": strokeWidth, "stroke-linecap": "round" }, group)
      : null;
    const line = svgEl("path", {
      fill: "none",
      stroke: fade ? `url(#fade-${lineage})` : color,
      "stroke-width": strokeWidth,
      "stroke-linecap": "round",
    }, group);
    const stop = isHardStop
      ? svgEl("line", { stroke: color, "stroke-width": 2.5, "stroke-linecap": "round" }, group)
      : null;

    for (const node of [connector, line, stop]) {
      if (node) node.dataset.lineage = lineage;
    }
    branches.push({ lineage, figures: figs, from, connector, line, stop, fade });
    for (const figure of figs) addStation(figure, lineage);
  }

  // ─── Focus state ─────────────────────────────────────────────

  let lit: Set<string> | null = null;
  let selectedId: string | null = null;
  let hoveredId: string | null = null;
  let hoveredLineage: string | null = null;
  let lastHeight = MIN_H;

  const priority = ({ figure, lineage }: Station): number => {
    if (figure.id === CHRIST_ID) return -1;
    if (figure.id === selectedId) return 0;
    if (figure.id === hoveredId) return 1;
    if (lit?.has(figure.id)) return KEY_FIGURES.has(figure.id) ? 2 : 3;
    if (KEY_FIGURES.has(figure.id)) return 4;
    return lineage === "messianic" ? 5 : 6;
  };

  const paintFocus = () => {
    svg.classList.toggle("lineage-svg--focused", lit !== null);
    for (const { figure, dot, label } of stations) {
      const dim = lit !== null && !lit.has(figure.id) && figure.id !== CHRIST_ID;
      dot.classList.toggle("lineage-station--dimmed", dim);
      label.classList.toggle("lineage-label--dimmed", dim);
      const selected = figure.id === selectedId;
      dot.classList.toggle("lineage-station--selected", selected);
      label.classList.toggle("lineage-label--selected", selected);
    }
    const litLineages = new Set(
      stations.filter((s) => lit?.has(s.figure.id)).map((s) => s.lineage as string),
    );
    for (const { lineage, label } of endings.values()) {
      label.classList.toggle("lineage-ending--dimmed", lit !== null && !litLineages.has(lineage));
    }
    svg.querySelectorAll<SVGElement>("[data-lineage]").forEach((node) => {
      const lineage = node.dataset.lineage!;
      node.classList.toggle("lineage-line--lit", litLineages.has(lineage));
      node.classList.toggle(
        "lineage--dimmed",
        lit === null && hoveredLineage !== null && lineage !== hoveredLineage,
      );
    });
  };

  // ─── Layout ──────────────────────────────────────────────────

  /**
   * Each label claims a rectangle, across every lane, highest priority first.
   * Names go in first, then dates and descriptions wherever they still fit.
   */
  const placeLabels = (
    laneYs: Map<Lineage, number>,
    laneHeights: Map<Lineage, number>,
    tribeRow: number,
    tribeTop: number,
  ) => {
    const claims: Claim[] = [];
    const canvasHeight = Math.max(lastHeight, MIN_H);
    const isClear = (rect: Rect, ignore?: Claim) =>
      rect.top >= 0 &&
      rect.bottom <= canvasHeight &&
      [...endings.values()].every((e) => !overlaps(e.rect, rect)) &&
      claims.every((c) => c === ignore || !overlaps(c.rect, rect));
    const ordered = [...stations].sort(
      (a, b) => priority(a) - priority(b) || a.figure.birth - b.figure.birth,
    );

    for (const station of ordered) {
      if (station.lineage !== "tribes") continue;
      const { figure, label, row } = station;
      const isSelected = figure.id === selectedId;
      const named = tribeRow >= MIN_NAMED_TRIBE_ROW_PX || isSelected || figure.id === hoveredId;
      const dated = getPixelsPerYear() >= TRIBE_NAME_PPY || isSelected;
      const x = yearToX(figure.birth) + 8;
      const y = tribeTop + row * tribeRow;
      const width = figure.name.length * TRIBE_CHAR_PX + (dated ? TRIBE_DATES_PX : 0);
      label.classList.toggle("lineage-label--hidden", !named);
      label.classList.toggle("lineage-label--dated", dated);
      label.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
      if (named) {
        claims.push({
          rect: { left: x, right: x + width, top: y - NAME_H / 2, bottom: y + NAME_H / 2 },
          tier: 0,
          x,
          y,
          station,
        });
      }
    }

    const rectAt = (x: number, y: number, tier: number, width: number, height: number): Rect => ({
      left: x,
      right: x + width,
      top: tier === 0 ? y - TIER_OFFSET_PX - height : y + TIER_OFFSET_PX,
      bottom: tier === 0 ? y - TIER_OFFSET_PX : y + TIER_OFFSET_PX + height,
    });

    /** Keeps a label on the map when its station sits near the right edge. */
    const inside = (x: number, width: number) =>
      Math.max(0, Math.min(x, getTimelineWidth() - width - 6));

    const placed: Claim[] = [];

    for (const station of ordered) {
      const { figure, lineage, label } = station;
      if (lineage === "tribes") continue;
      const isChrist = figure.id === CHRIST_ID;
      const y = laneYs.get(lineage)!;
      const charPx = isChrist
        ? CHRIST_CHAR_PX
        : lineage === "messianic" ? TRUNK_CHAR_PX : BRANCH_CHAR_PX;
      const nameH = isChrist ? CHRIST_NAME_H : NAME_H;
      const width = figure.name.length * charPx + LABEL_GAP_PX;
      const stationX = yearToX(figure.birth);
      const christW = Math.max(width, DATES_W);
      const flips = isChrist && stationX + christW > getTimelineWidth() + END_PADDING_PX;
      const x = flips
        ? stationX + CHRIST_LABEL_REACH_PX - christW
        : inside(stationX - 5, Math.max(width, isChrist ? DATES_W : 0));

      const tier = isChrist
        ? 0
        : [0, 1].find((t) => isClear(rectAt(x, y, t, width, nameH)));
      label.classList.toggle("lineage-label--hidden", tier === undefined);
      if (tier === undefined) continue;
      // His dates always show, so he claims room for them from the start.
      const rect = isChrist
        ? rectAt(x, y, tier, Math.max(width, DATES_W), nameH + DATES_H)
        : rectAt(x, y, tier, width, nameH);
      const claim = { rect, tier, x, y, station };
      claims.push(claim);
      placed.push(claim);
    }

    for (const claim of placed) {
      const { station, tier, y } = claim;
      const { figure, lineage, label } = station;
      const nameW = claim.rect.right - claim.rect.left;
      const isChrist = figure.id === CHRIST_ID;
      const isSelected = figure.id === selectedId;
      const nameH = isChrist ? CHRIST_NAME_H : NAME_H;
      const maxLines = lineage === "messianic" ? 3 : 2;
      const lines = Math.min(maxLines, Math.ceil((figure.blurb.length * BLURB_CHAR_PX) / MAX_BLURB_W));
      const blurbH = nameH + DATES_H + lines * BLURB_LINE_PX;
      const blurbW = Math.max(MAX_BLURB_W, nameW);
      const datedW = Math.max(DATES_W, nameW);
      const blurbRect = rectAt(inside(claim.x, blurbW), y, tier, blurbW, blurbH);
      const datedRect = rectAt(inside(claim.x, datedW), y, tier, datedW, nameH + DATES_H);

      const laneFits = (laneHeights.get(lineage) ?? 0) >= MIN_BLURB_LANE_PX;
      const ppy = getPixelsPerYear();
      const showBlurb = laneFits && (ppy >= MIN_BLURB_PPY || isSelected) && isClear(blurbRect, claim);
      const showDates =
        showBlurb || isSelected || isChrist || (ppy >= MIN_DATES_PPY && isClear(datedRect, claim));
      if (showBlurb) claim.rect = blurbRect;
      else if (showDates) claim.rect = datedRect;

      label.classList.toggle("lineage-label--dated", showDates);
      label.classList.toggle("lineage-label--described", showBlurb);
      label.style.width = showBlurb ? `${MAX_BLURB_W}px` : "";
      const offset = tier === 0
        ? `translateY(calc(-100% - ${TIER_OFFSET_PX}px))`
        : `translateY(${TIER_OFFSET_PX}px)`;

      // At the end of the map his label ends at his station instead of starting there.
      const stationX = yearToX(figure.birth);
      const width = claim.rect.right - claim.rect.left;
      const flip = isChrist && stationX + width > getTimelineWidth() + END_PADDING_PX;
      label.classList.toggle("lineage-label--flipped", flip);
      label.style.transform = flip
        ? `translate(${stationX + CHRIST_LABEL_REACH_PX}px, ${y}px) translateX(-100%) ${offset}`
        : `translate(${claim.rect.left}px, ${y}px) ${offset}`;
    }
  };

  const placeEnding = (lineage: Lineage, endX: number, y: number) => {
    const ending = endings.get(lineage);
    if (!ending) return;
    const width = (ending.label.textContent?.length ?? 0) * ENDING_CHAR_PX;
    const rightEdge = getTimelineWidth() + END_PADDING_PX - ENDING_GAP_PX;
    // No room beside the line on a narrow screen: drop below its end instead.
    const fits = endX + ENDING_GAP_PX + width <= rightEdge;
    const x = fits ? endX + ENDING_GAP_PX : rightEdge - width;
    const labelY = fits ? y : y + ENDING_DROP_PX;
    ending.rect = {
      left: x,
      right: x + width,
      top: labelY - ENDING_H / 2,
      bottom: labelY + ENDING_H / 2,
    };
    ending.label.style.transform = `translate(${x}px, ${labelY}px) translateY(-50%)`;
  };

  const reposition = (height: number) => {
    lastHeight = height;
    const h = Math.max(height, MIN_H);
    const width = getTimelineWidth();
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(h));
    labels.style.height = `${h}px`;
    container.style.height = `${h}px`;

    const totalWeight = LANES.reduce((sum, l) => sum + l.weight, 0);
    const unit = (h - PAD_TOP - PAD_BOTTOM) / totalWeight;
    const laneYs = new Map<Lineage, number>();
    const laneHeights = new Map<Lineage, number>();
    let top = PAD_TOP;
    for (const { lineage, weight } of LANES) {
      const y = top + (unit * weight) / 2;
      laneYs.set(lineage, y);
      laneHeights.set(lineage, unit * weight);
      gutterNames.get(lineage)!.style.top = `${y}px`;
      top += unit * weight;
    }

    const trunkY = laneYs.get("messianic")!;

    for (const b of branches) {
      const laneY = laneYs.get(b.lineage)!;
      const lastFig = b.figures[b.figures.length - 1]!;
      const endX = yearToX(lastFig.death);
      let startX = yearToX(b.figures[0]!.birth);

      if (b.from && b.connector) {
        const fromX = yearToX(b.from.birth);
        startX = Math.max(startX, fromX + MIN_CURVE_PX);
        b.connector.setAttribute("d", curve(fromX, trunkY, startX, laneY));
      }
      // A tiny offset keeps the bounding box from collapsing on a flat line.
      b.line.setAttribute("d", `M ${startX} ${laneY} L ${Math.max(endX, startX + 1)} ${laneY}`);
      if (b.fade) {
        b.fade.setAttribute("x1", String(Math.max(startX, endX - FADE_PX)));
        b.fade.setAttribute("x2", String(endX));
        b.fade.setAttribute("y1", "0");
        b.fade.setAttribute("y2", "0");
      }
      if (b.stop) {
        for (const [attr, value] of [["x1", endX], ["x2", endX], ["y1", laneY - 7], ["y2", laneY + 7]] as const) {
          b.stop.setAttribute(attr, String(value));
        }
      }
      placeEnding(b.lineage, endX, laneY);
    }

    const tribeBand = laneHeights.get("tribes")! - 14;
    const tribeCount = stems.length;
    const tribeRow = Math.min(MAX_TRIBE_ROW_PX, tribeBand / Math.max(tribeCount - 1, 1));
    const tribeCenter = laneYs.get("tribes")!;
    const tribeTop = tribeCenter - (tribeRow * (tribeCount - 1)) / 2;

    for (const stem of stems) {
      const y = tribeTop + stem.row * tribeRow;
      const fromX = yearToX(stem.from.birth);
      const x = Math.max(yearToX(stem.figure.birth), fromX + MIN_CURVE_PX);
      stem.connector.setAttribute("d", curve(fromX, trunkY, x, y));
      // The line picks up after the label, so the name never reads as struck through.
      const named = tribeRow >= MIN_NAMED_TRIBE_ROW_PX;
      const dated = getPixelsPerYear() >= TRIBE_NAME_PPY;
      const labelW = named
        ? stem.figure.name.length * TRIBE_CHAR_PX + LABEL_GAP_PX + (dated ? TRIBE_DATES_PX : 0)
        : 0;
      const lineStart = x + labelW + 8;
      const lineEnd = yearToX(stem.figure.death);
      stem.line.setAttribute("d", lineEnd > lineStart ? `M ${lineStart} ${y} L ${lineEnd} ${y}` : "");
      stem.fade.setAttribute("x1", String(Math.max(lineStart, lineEnd - FADE_PX)));
      stem.fade.setAttribute("x2", String(lineEnd));
      stem.fade.setAttribute("y1", "0");
      stem.fade.setAttribute("y2", "0");
    }

    const tribesEnd = Math.max(...stems.map((stem) => yearToX(stem.figure.death)));
    placeEnding("tribes", tribesEnd, tribeCenter);

    for (const { figure, lineage, dot, hit, row } of stations) {
      const cx = yearToX(figure.birth);
      const cy = lineage === "tribes" ? tribeTop + row * tribeRow : laneYs.get(lineage)!;
      const circles = figure.id === CHRIST_ID && halo ? [dot, hit, halo] : [dot, hit];
      for (const circle of circles) {
        circle.setAttribute("cx", String(cx));
        circle.setAttribute("cy", String(cy));
      }
    }

    placeLabels(laneYs, laneHeights, tribeRow, tribeTop);
  };

  // ─── Hover ───────────────────────────────────────────────────

  container.addEventListener("mouseover", (e) => {
    const target = (e.target as Element).closest<HTMLElement | SVGElement>("[data-lineage]");
    const nextLineage = target?.dataset.lineage ?? null;
    const nextId = target?.dataset.id ?? null;
    if (nextLineage === hoveredLineage && nextId === hoveredId) return;
    hoveredLineage = nextLineage;
    hoveredId = nextId;
    paintFocus();
    reposition(lastHeight);
  });

  return {
    reposition,
    setFocus: (nextLit, nextSelected) => {
      lit = nextLit;
      selectedId = nextSelected;
      paintFocus();
      reposition(lastHeight);
    },
  };
};
