/**
 * Subway-map lineage renderer — draws SVG lines and stations showing
 * the Messianic through-line from Adam to Jesus, with non-Messianic
 * branches peeling off and terminating.
 */

import { yearToX, getTimelineWidth, formatYear } from "./scale.ts";
import { figures } from "../data/timeline.ts";
import type { TimelineFigure, Lineage } from "../data/timeline.ts";

// ─── Layout constants ────────────────────────────────────────────

const SVG_H = 600;
const NS = "http://www.w3.org/2000/svg";

/** Y-offset for each lineage lane within the SVG. */
const LANE_Y: Record<Lineage, number> = {
  cainite: 80,
  nations: 140,
  ishmaelite: 200,
  messianic: 280,
  edomite: 360,
  tribes: 420,
  "israel-king": 500,
};

/** Visual color for each lineage line. */
const LINEAGE_COLOR: Record<Lineage, string> = {
  messianic: "var(--lineage-messianic, #e8c06a)",
  cainite: "var(--lineage-cainite, #8a6050)",
  nations: "var(--lineage-nations, #6a8a6a)",
  ishmaelite: "var(--lineage-ishmaelite, #b89050)",
  edomite: "var(--lineage-edomite, #a06040)",
  tribes: "var(--lineage-tribes, #7090b0)",
  "israel-king": "var(--lineage-israel-king, #40b8a0)",
};

/** Lineages that end with a hard stop (no fade). */
const HARD_STOP_LINEAGES: Set<Lineage> = new Set(["cainite", "israel-king"]);

/** The messianic Y for branch-off beziers. */
const TRUNK_Y = LANE_Y.messianic;

// ─── Data helpers ────────────────────────────────────────────────

const figureMap = new Map<string, TimelineFigure>();
for (const f of figures) figureMap.set(f.id, f);

const figuresByLineage = (lineage: Lineage): TimelineFigure[] =>
  figures
    .filter((f) => f.lineage === lineage)
    .sort((a, b) => a.birth - b.birth);

/** Check if a figure's parent is on the messianic line. */
const parentIsMessianic = (f: TimelineFigure): boolean => {
  if (!f.parent) return false;
  const p = figureMap.get(f.parent);
  return p?.lineage === "messianic";
};

// ─── SVG element helpers ─────────────────────────────────────────

const svgEl = <K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string | number>,
  parent?: SVGElement,
): SVGElementTagNameMap[K] => {
  const el = document.createElementNS(NS, tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
  }
  if (parent) parent.appendChild(el);
  return el;
};

// ─── Stored references for reposition ────────────────────────────

interface StationRef {
  circle: SVGCircleElement;
  text: SVGTextElement;
  figure: TimelineFigure;
}

interface LineRef {
  path: SVGPathElement;
  lineage: Lineage;
  figures: TimelineFigure[];
  branchOffX?: number;
}

interface BranchCurveRef {
  path: SVGPathElement;
  startYear: number;
  laneY: number;
}

// ─── Build path d-string ─────────────────────────────────────────

const buildBranchCurve = (startX: number, laneY: number): string => {
  const dx = 60;
  const midX = startX + dx / 2;
  return `M ${startX} ${TRUNK_Y} C ${midX} ${TRUNK_Y}, ${midX} ${laneY}, ${startX + dx} ${laneY}`;
};

// ─── Exports ─────────────────────────────────────────────────────

export interface LineageHandle {
  reposition: () => void;
}

export const initLineageView = (container: HTMLElement): LineageHandle => {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", String(getTimelineWidth()));
  svg.setAttribute("height", String(SVG_H));
  svg.classList.add("lineage-svg");
  container.appendChild(svg);

  // ─── Defs: gradients for fading line endings ─────────────────
  const defs = svgEl("defs", {}, svg);

  const FADE_LINEAGES: Lineage[] = [
    "nations",
    "ishmaelite",
    "edomite",
    "tribes",
  ];

  for (const lin of FADE_LINEAGES) {
    const grad = svgEl("linearGradient", { id: `fade-${lin}` }, defs);
    svgEl("stop", { offset: "0%", "stop-color": LINEAGE_COLOR[lin], "stop-opacity": "1" }, grad);
    svgEl("stop", { offset: "100%", "stop-color": LINEAGE_COLOR[lin], "stop-opacity": "0" }, grad);
  }

  // ─── Groups (back-to-front rendering order) ──────────────────
  const branchGroup = svgEl("g", { class: "lineage-branches" }, svg);
  const trunkGroup = svgEl("g", { class: "lineage-trunk" }, svg);
  const stationGroup = svgEl("g", { class: "lineage-stations" }, svg);

  const allStations: StationRef[] = [];
  const allLines: LineRef[] = [];
  const allCurves: BranchCurveRef[] = [];

  // ─── Render branch lines ─────────────────────────────────────
  const branchLineages: Lineage[] = [
    "cainite",
    "nations",
    "ishmaelite",
    "edomite",
    "tribes",
    "israel-king",
  ];

  for (const lin of branchLineages) {
    const figs = figuresByLineage(lin);
    if (figs.length === 0) continue;

    const laneY = LANE_Y[lin];
    const color = LINEAGE_COLOR[lin];

    // Find the branch-off figure (first figure whose parent is messianic)
    const branchFig = figs.find((f) => parentIsMessianic(f));
    const branchParent = branchFig
      ? figureMap.get(branchFig.parent!)
      : undefined;

    // Draw connector curve from trunk to branch lane
    if (branchParent) {
      const startX = yearToX(branchParent.birth);
      const curvePath = svgEl(
        "path",
        {
          d: buildBranchCurve(startX, laneY),
          fill: "none",
          stroke: color,
          "stroke-width": "2",
          "stroke-linecap": "round",
        },
        branchGroup,
      );
      curvePath.dataset.lineage = lin;
      allCurves.push({ path: curvePath, startYear: branchParent.birth, laneY });
    }

    // Special: tribes — fan out as parallel sub-stems
    if (lin === "tribes") {
      const tribesFigs = figs;
      const fanCenter = laneY;

      for (let i = 0; i < tribesFigs.length; i++) {
        const tf = tribesFigs[i]!;
        const subY = fanCenter - 10 + i * 2;
        const x1 = yearToX(tf.birth);
        const x2 = yearToX(tf.death);

        const subPath = svgEl(
          "path",
          {
            d: `M ${x1} ${subY} L ${x2} ${subY}`,
            fill: "none",
            stroke: color,
            "stroke-width": "1.5",
            "stroke-linecap": "round",
            opacity: "0.7",
          },
          branchGroup,
        );
        subPath.dataset.lineage = lin;

        // Station for this tribe
        const circle = svgEl(
          "circle",
          {
            cx: x1,
            cy: subY,
            r: "3",
            fill: color,
            stroke: "rgba(255,255,255,0.6)",
            "stroke-width": "1",
          },
          stationGroup,
        );
        circle.dataset.lineage = lin;
        const title = svgEl("title", {}, circle);
        title.textContent = `${tf.name} (${formatYear(tf.birth)} – ${formatYear(tf.death)})`;

        const text = svgEl(
          "text",
          {
            x: x1 + 6,
            y: subY - 4,
            "font-size": "8",
            fill: "var(--text-dim, #888)",
            "font-family": "var(--font-mono, monospace)",
            transform: `rotate(-30 ${x1 + 6} ${subY - 4})`,
          },
          stationGroup,
        );
        text.textContent = tf.name;
        text.dataset.lineage = lin;

        allStations.push({ circle, text, figure: tf });
      }

      allLines.push({
        path: null as unknown as SVGPathElement,
        lineage: lin,
        figures: tribesFigs,
      });
      continue;
    }

    // Regular branch line
    const isHardStop = HARD_STOP_LINEAGES.has(lin);
    const lastFig = figs[figs.length - 1]!;
    const lastX = yearToX(lastFig.death);
    const firstX = yearToX(figs[0]!.birth);

    // Main horizontal line (up to the last figure, or up to fade start)
    const fadeLen = 40;
    const mainEndX = isHardStop ? lastX : lastX - fadeLen;

    // Starting X: if we have a branch curve, start after the curve
    const lineStartX = branchParent
      ? yearToX(branchParent.birth) + 60
      : firstX;

    const mainPath = svgEl(
      "path",
      {
        d: `M ${lineStartX} ${laneY} L ${Math.max(mainEndX, lineStartX)} ${laneY}`,
        fill: "none",
        stroke: color,
        "stroke-width": "2",
        "stroke-linecap": "round",
      },
      branchGroup,
    );
    mainPath.dataset.lineage = lin;
    allLines.push({ path: mainPath, lineage: lin, figures: figs });

    // Fade tail for non-hard-stop lines
    if (!isHardStop && mainEndX < lastX) {
      const fadePath = svgEl(
        "path",
        {
          d: `M ${mainEndX} ${laneY} L ${lastX} ${laneY}`,
          fill: "none",
          stroke: `url(#fade-${lin})`,
          "stroke-width": "2",
          "stroke-linecap": "round",
        },
        branchGroup,
      );
      fadePath.dataset.lineage = lin;
    }

    // Hard stop marker
    if (isHardStop) {
      svgEl(
        "line",
        {
          x1: lastX,
          y1: laneY - 6,
          x2: lastX,
          y2: laneY + 6,
          stroke: color,
          "stroke-width": "2",
          "stroke-linecap": "round",
        },
        branchGroup,
      ).dataset.lineage = lin;
    }

    // Branch stations
    for (const f of figs) {
      const cx = yearToX(f.birth);
      const circle = svgEl(
        "circle",
        {
          cx,
          cy: laneY,
          r: "4",
          fill: color,
          stroke: "rgba(255,255,255,0.6)",
          "stroke-width": "1.5",
        },
        stationGroup,
      );
      circle.dataset.lineage = lin;

      const title = svgEl("title", {}, circle);
      title.textContent = `${f.name} (${formatYear(f.birth)} – ${formatYear(f.death)})`;

      const text = svgEl(
        "text",
        {
          x: cx + 6,
          y: laneY - 8,
          "font-size": "9",
          fill: "var(--text-dim, #888)",
          "font-family": "var(--font-mono, monospace)",
          transform: `rotate(-30 ${cx + 6} ${laneY - 8})`,
        },
        stationGroup,
      );
      text.textContent = f.name;
      text.dataset.lineage = lin;

      allStations.push({ circle, text, figure: f });
    }
  }

  // ─── Render messianic trunk ──────────────────────────────────
  const messianicFigs = figuresByLineage("messianic");
  const trunkY = TRUNK_Y;
  const trunkColor = LINEAGE_COLOR.messianic;

  if (messianicFigs.length > 0) {
    const firstX = yearToX(messianicFigs[0]!.birth);
    const lastX = yearToX(messianicFigs[messianicFigs.length - 1]!.death);

    const trunkPath = svgEl(
      "path",
      {
        d: `M ${firstX} ${trunkY} L ${lastX} ${trunkY}`,
        fill: "none",
        stroke: trunkColor,
        "stroke-width": "3.5",
        "stroke-linecap": "round",
      },
      trunkGroup,
    );
    trunkPath.dataset.lineage = "messianic";
    allLines.push({
      path: trunkPath,
      lineage: "messianic",
      figures: messianicFigs,
    });

    // Messianic stations
    for (const f of messianicFigs) {
      const cx = yearToX(f.birth);
      const circle = svgEl(
        "circle",
        {
          cx,
          cy: trunkY,
          r: "5",
          fill: trunkColor,
          stroke: "rgba(255,255,255,0.8)",
          "stroke-width": "1.5",
        },
        stationGroup,
      );
      circle.dataset.lineage = "messianic";

      const title = svgEl("title", {}, circle);
      title.textContent = `${f.name} (${formatYear(f.birth)} – ${formatYear(f.death)})`;

      const text = svgEl(
        "text",
        {
          x: cx + 7,
          y: trunkY - 10,
          "font-size": "11",
          fill: "var(--text-primary, #ccc)",
          "font-family": "var(--font-mono, monospace)",
          "font-weight": "500",
          transform: `rotate(-30 ${cx + 7} ${trunkY - 10})`,
        },
        stationGroup,
      );
      text.textContent = f.name;
      text.dataset.lineage = "messianic";

      allStations.push({ circle, text, figure: f });
    }
  }

  // ─── Hover interaction ───────────────────────────────────────
  let activeLineage: string | null = null;

  const highlightLineage = (lin: string) => {
    if (activeLineage === lin) return;
    activeLineage = lin;
    svg.querySelectorAll("[data-lineage]").forEach((el) => {
      const elLin = (el as SVGElement).dataset.lineage;
      if (elLin === lin) {
        (el as SVGElement).classList.add("lineage--highlighted");
        (el as SVGElement).classList.remove("lineage--dimmed");
      } else {
        (el as SVGElement).classList.add("lineage--dimmed");
        (el as SVGElement).classList.remove("lineage--highlighted");
      }
    });
  };

  const clearHighlight = () => {
    if (!activeLineage) return;
    activeLineage = null;
    svg.querySelectorAll("[data-lineage]").forEach((el) => {
      (el as SVGElement).classList.remove(
        "lineage--highlighted",
        "lineage--dimmed",
      );
    });
  };

  svg.addEventListener("mouseover", (e) => {
    const target = (e.target as SVGElement).closest("[data-lineage]");
    if (target) {
      highlightLineage((target as SVGElement).dataset.lineage!);
    }
  });

  svg.addEventListener("mouseout", (e) => {
    const related = e.relatedTarget as SVGElement | null;
    if (!related || !svg.contains(related)) {
      clearHighlight();
    }
  });

  // ─── Reposition on zoom ──────────────────────────────────────
  const reposition = () => {
    const w = getTimelineWidth();
    svg.setAttribute("width", String(w));

    // Update messianic trunk
    if (messianicFigs.length > 0) {
      const firstX = yearToX(messianicFigs[0]!.birth);
      const lastX = yearToX(messianicFigs[messianicFigs.length - 1]!.death);
      const trunkLine = allLines.find((l) => l.lineage === "messianic");
      if (trunkLine?.path) {
        trunkLine.path.setAttribute(
          "d",
          `M ${firstX} ${trunkY} L ${lastX} ${trunkY}`,
        );
      }
    }

    // Update branch lines
    for (const lineRef of allLines) {
      if (lineRef.lineage === "messianic" || lineRef.lineage === "tribes")
        continue;
      if (!lineRef.path) continue;

      const figs = lineRef.figures;
      if (figs.length === 0) continue;

      const laneY = LANE_Y[lineRef.lineage];
      const lastFig = figs[figs.length - 1]!;
      const lastX = yearToX(lastFig.death);
      const isHardStop = HARD_STOP_LINEAGES.has(lineRef.lineage);
      const fadeLen = 40;
      const mainEndX = isHardStop ? lastX : lastX - fadeLen;

      const branchFig = figs.find((f) => parentIsMessianic(f));
      const branchParent = branchFig
        ? figureMap.get(branchFig.parent!)
        : undefined;
      const lineStartX = branchParent
        ? yearToX(branchParent.birth) + 60
        : yearToX(figs[0]!.birth);

      lineRef.path.setAttribute(
        "d",
        `M ${lineStartX} ${laneY} L ${Math.max(mainEndX, lineStartX)} ${laneY}`,
      );
    }

    // Update branch curves
    for (const curveRef of allCurves) {
      const startX = yearToX(curveRef.startYear);
      curveRef.path.setAttribute(
        "d",
        buildBranchCurve(startX, curveRef.laneY),
      );
    }

    // Update stations
    for (const st of allStations) {
      const cx = yearToX(st.figure.birth);
      st.circle.setAttribute("cx", String(cx));

      // Determine text position based on lineage
      const lin = st.figure.lineage;
      const isMessianic = lin === "messianic";
      const isTribe = lin === "tribes";

      if (isTribe) {
        const tribesFigs = figuresByLineage("tribes");
        const idx = tribesFigs.indexOf(st.figure);
        const subY = LANE_Y.tribes - 10 + idx * 2;
        st.circle.setAttribute("cy", String(subY));
        const tx = cx + 6;
        const ty = subY - 4;
        st.text.setAttribute("x", String(tx));
        st.text.setAttribute("y", String(ty));
        st.text.setAttribute("transform", `rotate(-30 ${tx} ${ty})`);
      } else {
        const baseY = isMessianic ? trunkY : LANE_Y[lin!] ?? trunkY;
        const tx = cx + (isMessianic ? 7 : 6);
        const ty = baseY - (isMessianic ? 10 : 8);
        st.text.setAttribute("x", String(tx));
        st.text.setAttribute("y", String(ty));
        st.text.setAttribute("transform", `rotate(-30 ${tx} ${ty})`);
      }
    }

    // Update fade tails and hard-stop markers (rebuild simpler approach:
    // remove old ones and re-add — these are few elements)
    // For MVP, the fade paths and hard-stop lines are not repositioned
    // individually. Instead we remove and rebuild them.
    branchGroup
      .querySelectorAll("path[stroke^='url'], line")
      .forEach((el) => el.remove());

    for (const lin of branchLineages) {
      if (lin === "tribes") continue;
      const figs = figuresByLineage(lin);
      if (figs.length === 0) continue;

      const laneY = LANE_Y[lin];
      const color = LINEAGE_COLOR[lin];
      const lastFig = figs[figs.length - 1]!;
      const lastX = yearToX(lastFig.death);
      const isHardStop = HARD_STOP_LINEAGES.has(lin);
      const fadeLen = 40;
      const mainEndX = isHardStop ? lastX : lastX - fadeLen;

      if (!isHardStop && mainEndX < lastX) {
        const fadePath = svgEl(
          "path",
          {
            d: `M ${mainEndX} ${laneY} L ${lastX} ${laneY}`,
            fill: "none",
            stroke: `url(#fade-${lin})`,
            "stroke-width": "2",
            "stroke-linecap": "round",
          },
          branchGroup,
        );
        fadePath.dataset.lineage = lin;
      }

      if (isHardStop) {
        svgEl(
          "line",
          {
            x1: lastX,
            y1: laneY - 6,
            x2: lastX,
            y2: laneY + 6,
            stroke: color,
            "stroke-width": "2",
            "stroke-linecap": "round",
          },
          branchGroup,
        ).dataset.lineage = lin;
      }
    }

    // Rebuild tribes sub-stem paths
    branchGroup
      .querySelectorAll(`path[data-lineage="tribes"]`)
      .forEach((el) => el.remove());

    const tribesFigs = figuresByLineage("tribes");
    const fanCenter = LANE_Y.tribes;

    for (let i = 0; i < tribesFigs.length; i++) {
      const tf = tribesFigs[i]!;
      const subY = fanCenter - 10 + i * 2;
      const x1 = yearToX(tf.birth);
      const x2 = yearToX(tf.death);

      const subPath = svgEl(
        "path",
        {
          d: `M ${x1} ${subY} L ${x2} ${subY}`,
          fill: "none",
          stroke: LINEAGE_COLOR.tribes,
          "stroke-width": "1.5",
          "stroke-linecap": "round",
          opacity: "0.7",
        },
        branchGroup,
      );
      subPath.dataset.lineage = "tribes";
    }
  };

  return { reposition };
};
