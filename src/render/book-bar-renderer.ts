import type { Arc } from '../data/loader';
import type { Layout, BookRect } from '../layout/book-layout';

export interface ChapterCounts {
  counts: Float32Array; // per-chapter cross-ref count, indexed globally
  maxCount: number;
  bookChapterStarts: number[]; // global chapter index where each book starts
}

export function computeChapterCounts(arcs: Arc[], books: { verseCounts: number[]; offset: number }[]): ChapterCounts {
  let totalChapters = 0;
  const bookChapterStarts: number[] = [];
  for (const b of books) {
    bookChapterStarts.push(totalChapters);
    totalChapters += b.verseCounts.length;
  }

  const counts = new Float32Array(totalChapters);

  for (const arc of arcs) {
    const fromChap = verseToGlobalChapter(arc[0], books, bookChapterStarts);
    const toChap = verseToGlobalChapter(arc[1], books, bookChapterStarts);
    if (fromChap >= 0) counts[fromChap]++;
    if (toChap >= 0) counts[toChap]++;
  }

  let maxCount = 0;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] > maxCount) maxCount = counts[i];
  }

  return { counts, maxCount, bookChapterStarts };
}

function verseToGlobalChapter(verseIndex: number, books: { verseCounts: number[]; offset: number }[], bookChapterStarts: number[]): number {
  let lo = 0, hi = books.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (books[mid].offset <= verseIndex) lo = mid;
    else hi = mid - 1;
  }
  const book = books[lo];
  let remaining = verseIndex - book.offset;
  for (let c = 0; c < book.verseCounts.length; c++) {
    if (remaining < book.verseCounts[c]) {
      return bookChapterStarts[lo] + c;
    }
    remaining -= book.verseCounts[c];
  }
  return bookChapterStarts[lo] + book.verseCounts.length - 1;
}

export interface BarTransform {
  k: number;
  tx: number;
  ty: number;
}

const MAX_BAR_HEIGHT = 80;

export function renderBookBars(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  canvasWidth: number,
  canvasHeight: number,
  transform: BarTransform,
  chapterCounts: ChapterCounts,
) {
  const { bookRects, barY } = layout;
  const { k, tx, ty } = transform;

  // Draw chapter histogram bars hanging downward from barY
  for (let bi = 0; bi < bookRects.length; bi++) {
    const rect = bookRects[bi];
    const chapStart = chapterCounts.bookChapterStarts[bi];
    const numChaps = rect.chapterOffsets.length;
    const baseColor = bi % 2 === 0 ? 'rgba(200,200,200,' : 'rgba(160,160,160,';

    for (let c = 0; c < numChaps; c++) {
      const globalChap = chapStart + c;
      const count = chapterCounts.counts[globalChap];
      if (count === 0) continue;

      const chapX = rect.chapterOffsets[c];
      const nextChapX = c + 1 < numChaps
        ? rect.chapterOffsets[c + 1]
        : rect.x + rect.width;

      const sx = chapX * k + tx;
      const sw = (nextChapX - chapX) * k;
      const sy = barY * k + ty;
      const barH = (count / chapterCounts.maxCount) * MAX_BAR_HEIGHT;

      ctx.fillStyle = baseColor + '0.7)';
      ctx.fillRect(sx, sy, Math.max(sw - 0.5, 0.5), barH);
    }
  }

  // Book labels below histogram
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const labelY = barY * k + ty + MAX_BAR_HEIGHT + 4;

  for (const rect of bookRects) {
    const sx = rect.x * k + tx;
    const sw = rect.width * k;
    const centerX = sx + sw / 2;

    const fontSize = Math.min(11, Math.max(7, sw * 0.15));
    ctx.font = `${fontSize}px sans-serif`;
    const label = sw > 40 ? rect.name : rect.abbr;
    ctx.fillText(label, centerX, labelY, sw);
  }

  // Testament divider
  const otEnd = bookRects[38].x + bookRects[38].width;
  const divX = otEnd * k + tx;
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(divX, 0);
  ctx.lineTo(divX, canvasHeight);
  ctx.stroke();
  ctx.setLineDash([]);
}
