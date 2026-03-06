import { CATEGORY_COLORS } from '../data/categories';
import { BOOKS } from '../data/books';
import type { Bin } from './dataWorker';
import type { Layout } from './layout';

export interface RenderOptions {
  categoryVisible: boolean[];
  highlightBook: number | null;
  hoveredBin: Bin | null;
  selectedBin: Bin | null;
}

export interface ScreenTransform {
  k: number;
  tx: number;
  ty: number;
}

// Logarithmic scale for bin count → visual properties
function binAlpha(count: number): number {
  return 0.3 + 0.55 * Math.min(1, Math.log(count + 1) / Math.log(500));
}

function binWidth(count: number): number {
  return 1 + 3 * Math.min(1, Math.log(count + 1) / Math.log(500));
}

export function renderArcs(
  ctx: CanvasRenderingContext2D,
  bins: Bin[],
  layout: Layout,
  opts: RenderOptions,
  transform: ScreenTransform,
) {
  const { k, tx, ty } = transform;
  const { categoryVisible, highlightBook, hoveredBin, selectedBin } = opts;
  const baseY = layout.baselineY;

  // Filter visible bins and sort by span descending so shorter arcs render on top
  const visible: Bin[] = [];
  for (const bin of bins) {
    if (!categoryVisible[bin.category]) continue;
    if (bin === hoveredBin || bin === selectedBin) continue;
    visible.push(bin);
  }
  visible.sort((a, b) => {
    const spanA = Math.abs(a.targetBook - a.sourceBook);
    const spanB = Math.abs(b.targetBook - b.sourceBook);
    return spanB - spanA; // longest first (drawn behind)
  });

  for (const bin of visible) {
    const x1 = layout.books[bin.sourceBook].centerX;
    const x2 = layout.books[bin.targetBook].centerX;

    const sx1 = x1 * k + tx;
    const sx2 = x2 * k + tx;
    const sy = baseY * k + ty;
    const midX = (sx1 + sx2) / 2;
    const radius = Math.abs(sx2 - sx1) / 2;

    let alpha = binAlpha(bin.count);
    let width = binWidth(bin.count);

    // Dim non-matching arcs when a book is highlighted
    if (highlightBook !== null &&
        bin.sourceBook !== highlightBook &&
        bin.targetBook !== highlightBook) {
      alpha *= 0.1;
    }

    ctx.strokeStyle = CATEGORY_COLORS[bin.category];
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(midX, sy, radius, Math.PI, 0);
    ctx.stroke();
  }

  // Render highlighted bin (hovered or selected)
  const specialBins = [selectedBin, hoveredBin].filter(Boolean) as Bin[];
  for (const bin of specialBins) {
    if (!categoryVisible[bin.category]) continue;

    const x1 = layout.books[bin.sourceBook].centerX;
    const x2 = layout.books[bin.targetBook].centerX;

    const sx1 = x1 * k + tx;
    const sx2 = x2 * k + tx;
    const sy = baseY * k + ty;
    const midX = (sx1 + sx2) / 2;
    const radius = Math.abs(sx2 - sx1) / 2;

    // Glow
    ctx.strokeStyle = CATEGORY_COLORS[bin.category];
    ctx.lineWidth = binWidth(bin.count) + 4;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(midX, sy, radius, Math.PI, 0);
    ctx.stroke();

    // Solid
    ctx.lineWidth = binWidth(bin.count) + 1;
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.arc(midX, sy, radius, Math.PI, 0);
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
}

export function renderBookLabels(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  transform: ScreenTransform,
  highlightBook: number | null,
) {
  const { k, tx, ty } = transform;
  const labelY = layout.baselineY * k + ty + 8;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Draw baseline
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  const sy = layout.baselineY * k + ty;
  ctx.beginPath();
  ctx.moveTo(layout.books[0].left * k + tx, sy);
  ctx.lineTo((layout.books[65].left + layout.books[65].width) * k + tx, sy);
  ctx.stroke();

  // OT/NT divider
  const otEnd = (layout.books[38].left + layout.books[38].width) * k + tx;
  const ntStart = layout.books[39].left * k + tx;
  const divX = (otEnd + ntStart) / 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(divX, 0);
  ctx.lineTo(divX, ctx.canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Book labels
  const bookW = layout.bookWidth * k;
  const fontSize = Math.min(11, Math.max(6, bookW * 0.4));

  for (const book of layout.books) {
    const cx = book.centerX * k + tx;
    const isHighlighted = book.index === highlightBook;

    ctx.font = `${isHighlighted ? 'bold ' : ''}${fontSize}px "EB Garamond", Georgia, serif`;
    ctx.fillStyle = isHighlighted ? '#fff' : 'rgba(180,180,190,0.8)';

    // Book tick mark
    ctx.strokeStyle = isHighlighted ? '#fff' : 'rgba(255,255,255,0.2)';
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(cx, sy);
    ctx.lineTo(cx, sy + 4);
    ctx.stroke();

    const label = bookW > 60 ? BOOKS[book.index].name : BOOKS[book.index].abbr;
    ctx.fillText(label, cx, labelY, bookW - 2);
  }
}

export function renderCredit(
  ctx: CanvasRenderingContext2D,
  totalCount: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  ctx.font = '11px "EB Garamond", Georgia, serif';
  ctx.fillStyle = 'rgba(180,180,190,0.4)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(
    `${totalCount.toLocaleString()} connections across 66 books, ~1,500 years, ~40 authors, 1 awesome God`,
    canvasWidth - 16,
    canvasHeight - 12,
  );

}

// Hit-test which bin an (x, y) world coordinate is near
export function hitTestBin(
  mx: number, my: number,
  bins: Bin[],
  layout: Layout,
  categoryVisible: boolean[],
  tolerance: number = 8,
): Bin | null {
  const baseY = layout.baselineY;
  let bestDist = tolerance;
  let bestSpan = Infinity;
  let bestBin: Bin | null = null;

  for (const bin of bins) {
    if (!categoryVisible[bin.category]) continue;

    const x1 = layout.books[bin.sourceBook].centerX;
    const x2 = layout.books[bin.targetBook].centerX;
    if (mx < Math.min(x1, x2) - tolerance || mx > Math.max(x1, x2) + tolerance) continue;

    const dist = Math.abs(x2 - x1);
    const midX = (x1 + x2) / 2;
    const radius = dist / 2;

    // Distance from mouse to the semicircular arc
    const dx = mx - midX;
    const dy = my - baseY;
    // Only match the upper half (arc goes upward)
    if (dy > tolerance) continue;
    const distToCenter = Math.sqrt(dx * dx + dy * dy);
    const minD = Math.abs(distToCenter - radius);

    if (minD >= tolerance) continue;

    // Among all arcs within tolerance, prefer the shortest arc span.
    // This prevents tall arcs (e.g. red) from dominating the hover.
    if (dist < bestSpan || (dist === bestSpan && minD < bestDist)) {
      bestDist = minD;
      bestSpan = dist;
      bestBin = bin;
    }
  }

  return bestBin;
}

// Animate arcs by category, fading in sequentially
export interface AnimationState {
  startTime: number;
  categoryDelays: number[];
  fadeDuration: number;
  totalDuration: number;
  done: boolean;
}

export function createAnimation(): AnimationState {
  const fadeDuration = 600;
  const stagger = 300;
  const categoryDelays = CATEGORY_COLORS.map((_, i) => i * stagger);
  return {
    startTime: performance.now(),
    categoryDelays,
    fadeDuration,
    totalDuration: categoryDelays[categoryDelays.length - 1] + fadeDuration,
    done: false,
  };
}

export function getAnimationAlpha(anim: AnimationState, category: number): number {
  const elapsed = performance.now() - anim.startTime;
  const catStart = anim.categoryDelays[category];
  if (elapsed < catStart) return 0;
  const progress = Math.min(1, (elapsed - catStart) / anim.fadeDuration);
  // Ease-out
  return 1 - (1 - progress) * (1 - progress);
}
