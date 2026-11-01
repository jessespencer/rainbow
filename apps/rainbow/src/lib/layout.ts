import { bookOffsets } from '../../scripts/bible-metadata';
import { TOTAL_BOOKS } from '../data/books';
import { OT_VERSES, TOTAL_VERSES } from './verses';

// Arcs live in a fixed world, independent of the screen: baseline at y = 0, Genesis to Revelation
// across WORLD_WIDTH, so a resize keeps the reader's place.
export const WORLD_WIDTH = 1000;
const OT_NT_GAP = 14;
const WORLD_PER_VERSE = (WORLD_WIDTH - OT_NT_GAP) / TOTAL_VERSES;
const OT_END = OT_VERSES * WORLD_PER_VERSE;

export interface BookSpan {
  index: number;
  left: number;
  right: number;
}

export function xOfVerse(verse: number): number {
  return (verse + 0.5) * WORLD_PER_VERSE + (verse >= OT_VERSES ? OT_NT_GAP : 0);
}

export function verseAtX(x: number): number {
  const shifted = x >= OT_END + OT_NT_GAP / 2 ? x - OT_NT_GAP : x;
  return Math.min(TOTAL_VERSES - 1, Math.max(0, Math.floor(shifted / WORLD_PER_VERSE)));
}

export const BOOK_SPANS: BookSpan[] = Array.from({ length: TOTAL_BOOKS }, (_, index) => {
  const end = index + 1 < TOTAL_BOOKS ? bookOffsets[index + 1] : TOTAL_VERSES;
  return {
    index,
    left: xOfVerse(bookOffsets[index]) - WORLD_PER_VERSE / 2,
    right: xOfVerse(end - 1) + WORLD_PER_VERSE / 2,
  };
});

export const OT_RIGHT = BOOK_SPANS[38].right;
export const NT_LEFT = BOOK_SPANS[39].left;

export const pixelsPerVerse = (k: number) => WORLD_PER_VERSE * k;
