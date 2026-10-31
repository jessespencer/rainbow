import { BOOKS, TOTAL_BOOKS } from '../data/books';
import { BOOK_GENRE, GENRES } from '../data/genres';
import { linkFrom, linkToStart, type LinkStore } from './links';
import { VERSE_BOOK } from './verses';

export interface HeatmapData {
  // matrix[row * 66 + col] = links between the two books, mirrored across the diagonal
  matrix: Float32Array;
  maxCount: number;
}

const N = TOTAL_BOOKS;

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
  return { matrix, maxCount: Math.max(...matrix) };
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
) {
  const { size, cellSize, offsetX, offsetY } = cellMetrics(canvasWidth, canvasHeight);

  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const count = heatmap.matrix[r * N + c];
      if (count === 0) continue;
      const intensity = Math.log(count + 1) / Math.log(heatmap.maxCount + 1);
      ctx.fillStyle = cellColor(r, c);
      ctx.globalAlpha = 0.15 + intensity * 0.85;
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
