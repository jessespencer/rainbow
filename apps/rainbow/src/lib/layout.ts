import { BOOKS, OT_COUNT, TOTAL_BOOKS } from '../data/books';

export interface BookPosition {
  index: number;
  centerX: number;
  left: number;
  width: number;
}

export interface Layout {
  books: BookPosition[];
  baselineY: number;
  totalWidth: number;
  bookWidth: number;
  otNtGap: number;
}

const OT_NT_GAP_RATIO = 0.03; // gap as fraction of total width

export function computeLayout(canvasWidth: number, canvasHeight: number): Layout {
  const baselineY = Math.floor(canvasHeight * 0.78);
  const otNtGap = canvasWidth * OT_NT_GAP_RATIO;
  const bookWidth = (canvasWidth - otNtGap) / TOTAL_BOOKS;
  const totalWidth = canvasWidth;

  const books: BookPosition[] = [];
  for (let i = 0; i < TOTAL_BOOKS; i++) {
    const gapOffset = i >= OT_COUNT ? otNtGap : 0;
    const left = i * bookWidth + gapOffset;
    books.push({
      index: i,
      centerX: left + bookWidth / 2,
      left,
      width: bookWidth,
    });
  }

  return { books, baselineY, totalWidth, bookWidth, otNtGap };
}

export function getArcControlPoint(
  x1: number, x2: number, baselineY: number,
): { cpX: number; cpY: number; height: number } {
  const midX = (x1 + x2) / 2;
  const dist = Math.abs(x2 - x1);
  const height = dist * 0.5;
  return { cpX: midX, cpY: baselineY - height, height };
}

export function bookIndexFromX(x: number, layout: Layout): number {
  for (let i = layout.books.length - 1; i >= 0; i--) {
    if (x >= layout.books[i].left) return i;
  }
  return 0;
}
