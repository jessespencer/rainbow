import type { BookInfo } from '../data/loader';

export interface BookRect {
  bookIndex: number;
  name: string;
  abbr: string;
  testament: 'OT' | 'NT';
  x: number;
  width: number;
  verseCount: number;
  offset: number;
  chapterOffsets: number[]; // x positions of each chapter boundary within the book
}

export interface Layout {
  bookRects: BookRect[];
  totalWidth: number;
  verseToX: (verseIndex: number) => number;
  xToVerse: (x: number) => number;
  barY: number;
  barHeight: number;
  arcAreaHeight: number;
}

const BAR_HEIGHT = 30;
const BOTTOM_MARGIN = 30;
const HISTOGRAM_HEIGHT = 80;
const LABEL_HEIGHT = 16;
const MIN_BOOK_WIDTH = 20;

// Total height below barY that needs to be visible
export const BOTTOM_REGION = HISTOGRAM_HEIGHT + LABEL_HEIGHT + 4;

export function computeLayout(books: BookInfo[], totalVerses: number, canvasWidth: number, canvasHeight: number): Layout {
  // Push barY to 75% of canvas height for a more vertical arc area
  const barY = Math.floor(canvasHeight * 0.75);
  const arcAreaHeight = 2000;

  // Two-pass layout: proportional widths with minimum enforcement
  const proportional = books.map(b => (b.verseCount / totalVerses) * canvasWidth);
  const needsMin = proportional.map(w => w < MIN_BOOK_WIDTH);
  const deficit = proportional.reduce((sum, w, i) => sum + (needsMin[i] ? MIN_BOOK_WIDTH - w : 0), 0);
  const largeTotal = proportional.reduce((sum, w, i) => sum + (needsMin[i] ? 0 : w), 0);

  const widths = proportional.map((w, i) => {
    if (needsMin[i]) return MIN_BOOK_WIDTH;
    return w - (w / largeTotal) * deficit;
  });

  const totalWidth = widths.reduce((a, b) => a + b, 0);

  // Build book rects with chapter offsets
  let xCursor = 0;
  const bookRects: BookRect[] = books.map((b, i) => {
    const x = xCursor;
    const width = widths[i];
    xCursor += width;

    // Chapter offsets: x position of each chapter start within this book
    const chapterOffsets: number[] = [];
    let verseAccum = 0;
    for (let c = 0; c < b.verseCounts.length; c++) {
      chapterOffsets.push(x + (verseAccum / b.verseCount) * width);
      verseAccum += b.verseCounts[c];
    }

    return {
      bookIndex: i,
      name: b.name,
      abbr: b.abbr,
      testament: b.testament,
      x,
      width,
      verseCount: b.verseCount,
      offset: b.offset,
      chapterOffsets,
    };
  });

  // Book-aware verseToX: find which book, interpolate within it
  function verseToX(verseIndex: number): number {
    let lo = 0, hi = bookRects.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (bookRects[mid].offset <= verseIndex) lo = mid;
      else hi = mid - 1;
    }
    const rect = bookRects[lo];
    const localVerse = verseIndex - rect.offset;
    const frac = rect.verseCount > 0 ? localVerse / rect.verseCount : 0;
    return rect.x + frac * rect.width;
  }

  // Inverse: x position to verse index
  function xToVerse(x: number): number {
    let lo = 0, hi = bookRects.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (bookRects[mid].x <= x) lo = mid;
      else hi = mid - 1;
    }
    const rect = bookRects[lo];
    const frac = Math.max(0, Math.min(1, (x - rect.x) / rect.width));
    return Math.round(rect.offset + frac * rect.verseCount);
  }

  return { bookRects, totalWidth, verseToX, xToVerse, barY, barHeight: BAR_HEIGHT, arcAreaHeight };
}
