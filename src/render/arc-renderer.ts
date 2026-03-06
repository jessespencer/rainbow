import type { Arc } from '../data/loader';
import type { Layout } from '../layout/book-layout';
import { THEME_COLORS } from './theme-colors';

export interface ArcRenderOptions {
  themeVisible: boolean[];
  minVotes: number;
  highlightVerseIndex: number | null;
  zoomK: number;
  viewportLeft: number;
  viewportRight: number;
  selectedArcIndex: number | null;
  selectedVerseIndex: number | null;
}

export interface ScreenTransform {
  k: number;
  tx: number;
  ty: number;
}

// LOD: more generous caps, sorted by votes so cutoff keeps best arcs
function getMaxArcs(zoomK: number, totalArcs: number): number {
  if (zoomK >= 2) return totalArcs;
  if (zoomK >= 1) return Math.min(totalArcs, 200000);
  return Math.min(totalArcs, 100000);
}

export function renderArcs(
  ctx: CanvasRenderingContext2D,
  arcs: Arc[],
  layout: Layout,
  opts: ArcRenderOptions,
  transform: ScreenTransform,
) {
  const { themeVisible, minVotes, zoomK, viewportLeft, viewportRight, selectedArcIndex, selectedVerseIndex } = opts;
  const { k, tx, ty } = transform;
  const maxArcs = getMaxArcs(zoomK, arcs.length);
  const barY = layout.barY;

  // Group visible arcs by theme for batch rendering
  const buckets: number[][] = THEME_COLORS.map(() => []);
  let count = 0;

  for (let i = 0; i < arcs.length && count < maxArcs; i++) {
    const arc = arcs[i];
    const theme = arc[3];
    if (!themeVisible[theme]) continue;
    if (arc[2] < minVotes) continue;

    // Viewport culling in world space
    const x1 = layout.verseToX(arc[0]);
    const x2 = layout.verseToX(arc[1]);
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    if (maxX < viewportLeft || minX > viewportRight) continue;

    buckets[theme].push(i);
    count++;
  }

  // Render each theme batch — screen-space coordinates
  ctx.lineWidth = 0.5; // constant screen pixels

  for (let t = 0; t < THEME_COLORS.length; t++) {
    const bucket = buckets[t];
    if (bucket.length === 0) continue;

    ctx.strokeStyle = THEME_COLORS[t];
    ctx.globalAlpha = 0.15;
    ctx.beginPath();

    for (const idx of bucket) {
      const arc = arcs[idx];
      const x1 = layout.verseToX(arc[0]);
      const x2 = layout.verseToX(arc[1]);
      const dist = Math.abs(x2 - x1);
      const h = dist * 0.5;

      // Screen-space coordinates
      const sx1 = x1 * k + tx;
      const sx2 = x2 * k + tx;
      const sy = barY * k + ty;
      const sh = h * k;

      ctx.moveTo(sx1, sy);
      ctx.bezierCurveTo(sx1, sy - sh, sx2, sy - sh, sx2, sy);
    }

    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;

  // Render selected arc
  if (selectedArcIndex !== null) {
    const arc = arcs[selectedArcIndex];
    if (arc && themeVisible[arc[3]]) {
      const x1 = layout.verseToX(arc[0]);
      const x2 = layout.verseToX(arc[1]);
      const dist = Math.abs(x2 - x1);
      const h = dist * 0.5;
      const sx1 = x1 * k + tx;
      const sx2 = x2 * k + tx;
      const sy = barY * k + ty;
      const sh = h * k;

      // Glow pass
      ctx.strokeStyle = THEME_COLORS[arc[3]];
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(sx1, sy);
      ctx.bezierCurveTo(sx1, sy - sh, sx2, sy - sh, sx2, sy);
      ctx.stroke();

      // Solid pass
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(sx1, sy);
      ctx.bezierCurveTo(sx1, sy - sh, sx2, sy - sh, sx2, sy);
      ctx.stroke();
    }
  }

  // Render arcs for selected verse
  if (selectedVerseIndex !== null) {
    renderHighlightedArcs(ctx, arcs, layout, selectedVerseIndex, themeVisible, transform);
  }
}

export function renderHighlightedArcs(
  ctx: CanvasRenderingContext2D,
  arcs: Arc[],
  layout: Layout,
  highlightVerseIndex: number,
  themeVisible: boolean[],
  transform: ScreenTransform,
) {
  const { k, tx, ty } = transform;
  const barY = layout.barY;
  const matching: number[] = [];

  for (let i = 0; i < arcs.length; i++) {
    const arc = arcs[i];
    if (arc[0] === highlightVerseIndex || arc[1] === highlightVerseIndex) {
      if (themeVisible[arc[3]]) matching.push(i);
    }
  }

  if (matching.length === 0) return;

  ctx.lineWidth = 1.5;
  for (const idx of matching) {
    const arc = arcs[idx];
    const x1 = layout.verseToX(arc[0]);
    const x2 = layout.verseToX(arc[1]);
    const dist = Math.abs(x2 - x1);
    const h = dist * 0.5;
    const sx1 = x1 * k + tx;
    const sx2 = x2 * k + tx;
    const sy = barY * k + ty;
    const sh = h * k;

    ctx.strokeStyle = THEME_COLORS[arc[3]];
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(sx1, sy);
    ctx.bezierCurveTo(sx1, sy - sh, sx2, sy - sh, sx2, sy);
    ctx.stroke();
  }

  // Endpoint dot
  const wx = layout.verseToX(highlightVerseIndex);
  const sx = wx * k + tx;
  const sy = barY * k + ty;
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(sx, sy, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Spatial grid for fast hover/click hit-testing
export interface SpatialGrid {
  cellSize: number;
  cols: number;
  rows: number;
  cells: Map<number, number[]>;
}

export function buildSpatialGrid(arcs: Arc[], layout: Layout): SpatialGrid {
  const cellSize = 50;
  const cols = Math.ceil(layout.totalWidth / cellSize);
  const rows = Math.ceil((layout.barY + layout.arcAreaHeight) / cellSize);
  const cells = new Map<number, number[]>();

  for (let i = 0; i < arcs.length; i++) {
    const arc = arcs[i];
    const x1 = layout.verseToX(arc[0]);
    const x2 = layout.verseToX(arc[1]);
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const dist = maxX - minX;
    const arcHeight = dist * 0.5;
    const minY = layout.barY - arcHeight;

    const col1 = Math.max(0, Math.floor(minX / cellSize));
    const col2 = Math.min(cols - 1, Math.floor(maxX / cellSize));
    const row1 = Math.max(0, Math.floor(minY / cellSize));
    const row2 = Math.floor(layout.barY / cellSize);

    const midRow = Math.floor((row1 + row2) / 2);
    for (let c = col1; c <= col2; c += Math.max(1, Math.floor((col2 - col1) / 4))) {
      const key = midRow * cols + c;
      let cell = cells.get(key);
      if (!cell) { cell = []; cells.set(key, cell); }
      cell.push(i);
    }
    for (const col of [col1, col2]) {
      for (const row of [row1, row2]) {
        const key = row * cols + col;
        let cell = cells.get(key);
        if (!cell) { cell = []; cells.set(key, cell); }
        cell.push(i);
      }
    }
  }

  return { cellSize, cols, rows, cells };
}

export function hitTestArc(
  mx: number, my: number,
  arcs: Arc[], layout: Layout,
  grid: SpatialGrid,
  themeVisible: boolean[],
  minVotes: number,
  tolerance: number = 4,
): number | null {
  const col = Math.floor(mx / grid.cellSize);
  const row = Math.floor(my / grid.cellSize);

  const candidates = new Set<number>();
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      const k = (row + dr) * grid.cols + (col + dc);
      const cell = grid.cells.get(k);
      if (cell) cell.forEach(i => candidates.add(i));
    }
  }

  let bestDist = tolerance;
  let bestIdx: number | null = null;

  for (const i of candidates) {
    const arc = arcs[i];
    if (!themeVisible[arc[3]]) continue;
    if (arc[2] < minVotes) continue;

    const x1 = layout.verseToX(arc[0]);
    const x2 = layout.verseToX(arc[1]);
    if (mx < Math.min(x1, x2) - tolerance || mx > Math.max(x1, x2) + tolerance) continue;

    const dist = Math.abs(x2 - x1);
    const h = dist * 0.5;
    const barY = layout.barY;

    // Cubic bezier: P(t) = (1-t)^3*P0 + 3*(1-t)^2*t*P1 + 3*(1-t)*t^2*P2 + t^3*P3
    // P0=(x1,barY), P1=(x1,barY-h), P2=(x2,barY-h), P3=(x2,barY)
    const steps = Math.max(10, Math.min(50, Math.floor(dist / 5)));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const t1 = 1 - t;
      const bx = t1 * t1 * t1 * x1 + 3 * t1 * t1 * t * x1 + 3 * t1 * t * t * x2 + t * t * t * x2;
      const by = t1 * t1 * t1 * barY + 3 * t1 * t1 * t * (barY - h) + 3 * t1 * t * t * (barY - h) + t * t * t * barY;
      const d = Math.sqrt((mx - bx) ** 2 + (my - by) ** 2);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
  }

  return bestIdx;
}
