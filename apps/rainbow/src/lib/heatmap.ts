import { BOOKS, TOTAL_BOOKS } from '../data/books';
import { BOOK_GENRE, GENRES } from '../data/genres';
import { linkFrom, linkToStart, type LinkStore } from './links';
import { VERSE_BOOK } from './verses';

export type HeatmapScale = 'count' | 'expected';

export interface HeatmapData {
  // matrix[row * 66 + col] = links between the two books, mirrored across the diagonal
  matrix: Float32Array;
  maxCount: number;
  // lift[row * 66 + col] = cross-book links over what the two books' link totals predict; 0 on the diagonal
  lift: Float32Array;
}

const N = TOTAL_BOOKS;
// Pseudo-count added to both sides of the ratio, so a pair of short books with two links isn't the brightest cell
const LIFT_PRIOR = 5;
// Ratio that reaches full brightness
const LIFT_FULL = 8;
const LIFT_COLOR = '#E8B84B';

function cellMetrics(canvasWidth: number, canvasHeight: number) {
  const padding = Math.min(canvasWidth, canvasHeight) < 480 ? 30 : 60;
  const size = Math.min(canvasWidth, canvasHeight) - padding * 2;
  return {
    size,
    cellSize: size / N,
    offsetX: (canvasWidth - size) / 2,
    offsetY: (canvasHeight - size) / 2,
  };
}

export function buildHeatmapData(store: LinkStore, ids: Int32Array): HeatmapData {
  const matrix = new Float32Array(N * N);
  for (const id of ids) {
    const a = VERSE_BOOK[linkFrom(store, id)];
    const b = VERSE_BOOK[linkToStart(store, id)];
    matrix[a * N + b]++;
    if (a !== b) matrix[b * N + a]++;
  }
  return { matrix, maxCount: Math.max(...matrix), lift: buildLift(matrix) };
}

// Books cite themselves far more than chance would, so same-book links are left out:
// each cross-book pair is compared with what it would get if every book's links went to other books at random.
function buildLift(matrix: Float32Array): Float32Array {
  const ends = new Float64Array(N);
  let total = 0;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (r === c) continue;
      ends[r] += matrix[r * N + c];
      if (c > r) total += matrix[r * N + c];
    }
  }
  let mass = 0;
  for (let r = 0; r < N; r++) {
    for (let c = r + 1; c < N; c++) mass += ends[r] * ends[c];
  }
  const lift = new Float32Array(N * N);
  if (mass === 0) return lift;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (r === c) continue;
      const expected = total * ends[r] * ends[c] / mass;
      lift[r * N + c] = (matrix[r * N + c] + LIFT_PRIOR) / (expected + LIFT_PRIOR);
    }
  }
  return lift;
}

function cellColor(row: number, col: number): string {
  const channel = (hex: string, shift: number) => Number.parseInt(hex.slice(1), 16) >> shift & 255;
  const a = GENRES[BOOK_GENRE[row]].color;
  const b = GENRES[BOOK_GENRE[col]].color;
  const mix = (shift: number) => Math.round((channel(a, shift) + channel(b, shift)) / 2);
  return `rgb(${mix(16)},${mix(8)},${mix(0)})`;
}

export function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  heatmap: HeatmapData,
  canvasWidth: number,
  canvasHeight: number,
  scale: HeatmapScale,
) {
  const { size, cellSize, offsetX, offsetY } = cellMetrics(canvasWidth, canvasHeight);

  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const count = heatmap.matrix[r * N + c];
      if (count === 0) continue;
      if (scale === 'expected') {
        if (r === c) continue;
        const lift = heatmap.lift[r * N + c];
        // Pairs at or below chance stay as a faint grid so the shape of the canon still reads
        ctx.fillStyle = lift > 1 ? LIFT_COLOR : '#8A8F9C';
        ctx.globalAlpha = lift > 1 ? 0.06 + 0.94 * Math.min(1, Math.log(lift) / Math.log(LIFT_FULL)) : 0.06;
      } else {
        const intensity = Math.log(count + 1) / Math.log(heatmap.maxCount + 1);
        ctx.fillStyle = cellColor(r, c);
        ctx.globalAlpha = 0.15 + intensity * 0.85;
      }
      ctx.fillRect(
        offsetX + c * cellSize,
        offsetY + r * cellSize,
        cellSize - 0.5,
        cellSize - 0.5,
      );
    }
  }
  ctx.globalAlpha = 1;

  ctx.font = `${Math.min(9, Math.max(4, cellSize * 0.7))}px "DM Mono", monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(180,180,190,0.6)';

  ctx.textAlign = 'right';
  for (let i = 0; i < N; i++) {
    ctx.fillText(BOOKS[i].abbr, offsetX - 4, offsetY + i * cellSize + cellSize / 2);
  }

  ctx.textAlign = 'left';
  for (let i = 0; i < N; i++) {
    ctx.save();
    ctx.translate(offsetX + i * cellSize + cellSize / 2, offsetY - 4);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(BOOKS[i].abbr, 0, 0);
    ctx.restore();
  }

  const otEnd = 39;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(offsetX + otEnd * cellSize, offsetY);
  ctx.lineTo(offsetX + otEnd * cellSize, offsetY + size);
  ctx.moveTo(offsetX, offsetY + otEnd * cellSize);
  ctx.lineTo(offsetX + size, offsetY + otEnd * cellSize);
  ctx.stroke();
}

export function heatmapHitTest(
  mx: number, my: number,
  canvasWidth: number,
  canvasHeight: number,
): { row: number; col: number } | null {
  const { cellSize, offsetX, offsetY } = cellMetrics(canvasWidth, canvasHeight);
  const col = Math.floor((mx - offsetX) / cellSize);
  const row = Math.floor((my - offsetY) / cellSize);
  return row >= 0 && row < N && col >= 0 && col < N ? { row, col } : null;
}
