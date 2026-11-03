import { cssToken } from '@jessespencer/bible-ui/tokens';
import { BOOKS } from '../data/books';
import { BOOK_GENRE, GENRES } from '../data/genres';
import { BOOK_SPANS, NT_LEFT, OT_RIGHT, pixelsPerVerse, xOfVerse } from './layout';
import { linkFrom, linkToStart, type LinkStore } from './links';
import { VERSE_BOOK, verseIndex, type Passage } from './verses';
import { books as bookMeta } from '../../scripts/bible-metadata';

export interface ScreenTransform {
  k: number;
  tx: number;
  ty: number;
}

// Height of the book strip under the baseline, also the band a finger can slide along.
export const AXIS_BAND = 34;
const STRIP_HEIGHT = 6;

export function renderAxis(
  ctx: CanvasRenderingContext2D,
  transform: ScreenTransform,
  width: number,
  passage: Passage | null,
) {
  const { k, tx, ty } = transform;
  const screenX = (x: number) => x * k + tx;

  for (const span of BOOK_SPANS) {
    const left = screenX(span.left);
    const right = screenX(span.right);
    if (right < 0 || left > width) continue;
    ctx.fillStyle = GENRES[BOOK_GENRE[span.index]].color;
    ctx.globalAlpha = span.index % 2 === 0 ? 0.95 : 0.6;
    ctx.fillRect(left, ty + 2, Math.max(right - left, 0.5), STRIP_HEIGHT);
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = '11px "DM Mono", monospace';
  for (const span of BOOK_SPANS) {
    const left = Math.max(screenX(span.left), 0);
    const right = Math.min(screenX(span.right), width);
    if (right - left < 18) continue;
    const { name, abbr } = BOOKS[span.index];
    const room = right - left - 6;
    const label = ctx.measureText(name).width <= room ? name : abbr;
    if (ctx.measureText(label).width > room) continue;
    ctx.fillStyle = cssToken('--text-secondary');
    ctx.fillText(label, (left + right) / 2, ty + 13);
  }

  renderChapterTicks(ctx, transform, width);

  if (passage) {
    const left = screenX(xOfVerse(passage.start)) - pixelsPerVerse(k) / 2;
    const right = screenX(xOfVerse(passage.end)) + pixelsPerVerse(k) / 2;
    ctx.fillStyle = cssToken('--text-bright');
    ctx.fillRect(left, ty + 1, Math.max(right - left, 2), STRIP_HEIGHT + 2);
  }
}

function renderChapterTicks(
  ctx: CanvasRenderingContext2D,
  { k, tx, ty }: ScreenTransform,
  width: number,
) {
  const perVerse = pixelsPerVerse(k);
  if (perVerse < 0.4) return;
  ctx.font = '10px "DM Mono", monospace';
  ctx.fillStyle = cssToken('--text-dim');
  for (const span of BOOK_SPANS) {
    if (span.right * k + tx < 0 || span.left * k + tx > width) continue;
    bookMeta[span.index].verseCounts.forEach((count, c) => {
      const x = xOfVerse(verseIndex(span.index, c + 1, 1)!) * k + tx;
      if (x < 0 || x > width) return;
      ctx.fillRect(x - 0.5, ty + 2, 1, STRIP_HEIGHT + 4);
      if (count * perVerse > 16) ctx.fillText(String(c + 1), x + 6, ty + 25);
    });
  }
}

export function renderDivider(
  ctx: CanvasRenderingContext2D,
  { k, tx }: ScreenTransform,
  height: number,
) {
  const x = ((OT_RIGHT + NT_LEFT) / 2) * k + tx;
  ctx.strokeStyle = cssToken('--border-subtle');
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function genreColorOf(verse: number): string {
  return GENRES[BOOK_GENRE[VERSE_BOOK[verse]]].color;
}

export function renderLink(
  ctx: CanvasRenderingContext2D,
  store: LinkStore,
  id: number,
  { k, tx, ty }: ScreenTransform,
  bold: boolean,
) {
  const from = linkFrom(store, id);
  const to = linkToStart(store, id);
  const low = Math.min(from, to);
  const high = Math.max(from, to);
  const x1 = xOfVerse(low) * k + tx;
  const x2 = xOfVerse(high) * k + tx;
  const gradient = ctx.createLinearGradient(x1, 0, Math.max(x2, x1 + 1), 0);
  gradient.addColorStop(0, genreColorOf(low));
  gradient.addColorStop(1, genreColorOf(high));

  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.arc((x1 + x2) / 2, ty, (x2 - x1) / 2, Math.PI, 0);
  ctx.lineWidth = bold ? 7 : 5;
  ctx.globalAlpha = 0.3;
  ctx.stroke();
  ctx.lineWidth = bold ? 2.5 : 1.75;
  ctx.globalAlpha = 1;
  ctx.stroke();
}

// Nearest arc to a world point; ties go to the stronger link, which has the lower id.
export function hitTestLink(
  mx: number, my: number,
  store: LinkStore,
  ids: Int32Array,
  tolerance: number,
): number | null {
  if (my > tolerance) return null;
  let best: number | null = null;
  let bestDistance = tolerance;

  for (const id of ids) {
    const x1 = xOfVerse(linkFrom(store, id));
    const x2 = xOfVerse(linkToStart(store, id));
    const dx = mx - (x1 + x2) / 2;
    const radius = Math.abs(x2 - x1) / 2;
    if (Math.abs(dx) > radius + tolerance) continue;
    const distance = Math.abs(Math.sqrt(dx * dx + my * my) - radius);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = id;
    }
  }
  return best;
}

