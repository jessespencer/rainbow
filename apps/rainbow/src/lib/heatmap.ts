import { BOOKS } from '../data/books';
import { CATEGORY_COLORS } from '../data/categories';
import type { Bin } from './dataWorker';

export interface HeatmapData {
  // matrix[src * 66 + tgt] = total count for that book pair
  matrix: Float32Array;
  maxCount: number;
  // dominant category per cell
  dominantCat: Int8Array;
}

export function buildHeatmapData(bins: Bin[]): HeatmapData {
  const N = 66;
  const matrix = new Float32Array(N * N);
  // Track per-category counts for each cell to find dominant
  const catCounts = new Array(N * N).fill(null).map(() => new Float32Array(8));

  for (const bin of bins) {
    const key = bin.sourceBook * N + bin.targetBook;
    matrix[key] += bin.count;
    catCounts[key][bin.category] += bin.count;
    // Mirror
    if (bin.sourceBook !== bin.targetBook) {
      const mirror = bin.targetBook * N + bin.sourceBook;
      matrix[mirror] += bin.count;
      catCounts[mirror][bin.category] += bin.count;
    }
  }

  let maxCount = 0;
  const dominantCat = new Int8Array(N * N);
  for (let i = 0; i < N * N; i++) {
    if (matrix[i] > maxCount) maxCount = matrix[i];
    let best = 0;
    for (let c = 1; c < 8; c++) {
      if (catCounts[i][c] > catCounts[i][best]) best = c;
    }
    dominantCat[i] = best;
  }

  return { matrix, maxCount, dominantCat };
}

export function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  heatmap: HeatmapData,
  canvasWidth: number,
  canvasHeight: number,
  categoryVisible: boolean[],
) {
  const N = 66;
  const padding = 60;
  const size = Math.min(canvasWidth, canvasHeight) - padding * 2;
  const cellSize = size / N;
  const offsetX = (canvasWidth - size) / 2;
  const offsetY = (canvasHeight - size) / 2;

  // Background
  ctx.fillStyle = '#0D0D1A';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Draw cells
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const key = r * N + c;
      const count = heatmap.matrix[key];
      if (count === 0) continue;

      const cat = heatmap.dominantCat[key];
      if (!categoryVisible[cat]) continue;

      const intensity = Math.log(count + 1) / Math.log(heatmap.maxCount + 1);
      const color = CATEGORY_COLORS[cat];

      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15 + intensity * 0.75;
      ctx.fillRect(
        offsetX + c * cellSize,
        offsetY + r * cellSize,
        cellSize - 0.5,
        cellSize - 0.5,
      );
    }
  }
  ctx.globalAlpha = 1;

  // Row/column labels
  ctx.font = `${Math.min(9, Math.max(5, cellSize * 0.7))}px sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(180,180,190,0.6)';

  // Left labels (rows)
  ctx.textAlign = 'right';
  for (let i = 0; i < N; i++) {
    ctx.fillText(
      BOOKS[i].abbr,
      offsetX - 4,
      offsetY + i * cellSize + cellSize / 2,
    );
  }

  // Top labels (columns)
  ctx.textAlign = 'left';
  ctx.save();
  for (let i = 0; i < N; i++) {
    ctx.save();
    ctx.translate(
      offsetX + i * cellSize + cellSize / 2,
      offsetY - 4,
    );
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(BOOKS[i].abbr, 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // OT/NT divider lines
  const otEnd = 39;
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  // Vertical
  ctx.beginPath();
  ctx.moveTo(offsetX + otEnd * cellSize, offsetY);
  ctx.lineTo(offsetX + otEnd * cellSize, offsetY + size);
  ctx.stroke();
  // Horizontal
  ctx.beginPath();
  ctx.moveTo(offsetX, offsetY + otEnd * cellSize);
  ctx.lineTo(offsetX + size, offsetY + otEnd * cellSize);
  ctx.stroke();
}

export function heatmapHitTest(
  mx: number, my: number,
  canvasWidth: number,
  canvasHeight: number,
): { row: number; col: number } | null {
  const N = 66;
  const padding = 60;
  const size = Math.min(canvasWidth, canvasHeight) - padding * 2;
  const cellSize = size / N;
  const offsetX = (canvasWidth - size) / 2;
  const offsetY = (canvasHeight - size) / 2;

  const col = Math.floor((mx - offsetX) / cellSize);
  const row = Math.floor((my - offsetY) / cellSize);

  if (row >= 0 && row < N && col >= 0 && col < N) {
    return { row, col };
  }
  return null;
}
