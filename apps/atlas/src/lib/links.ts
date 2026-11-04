import { BOOK_GENRE } from '../data/genres';
import { TOTAL_VERSES, VERSE_BOOK } from './verses';

const STRIDE = 4;

export const DEFAULT_MIN_VOTES = 4;

export interface LinkFilter {
  minVotes: number;
  genre: number | null;
}

// Rows of [from, toStart, toEnd, votes], strongest first, so ascending ids mean descending votes.
export interface LinkStore {
  rows: Int16Array;
  count: number;
  offsets: Int32Array;
  byVerse: Int32Array;
}

export const linkFrom = (store: LinkStore, id: number) => store.rows[id * STRIDE];
export const linkToStart = (store: LinkStore, id: number) => store.rows[id * STRIDE + 1];
export const linkToEnd = (store: LinkStore, id: number) => store.rows[id * STRIDE + 2];
export const linkVotes = (store: LinkStore, id: number) => store.rows[id * STRIDE + 3];

export function createLinkStore(buffer: ArrayBuffer): LinkStore {
  const rows = new Int16Array(buffer);
  const count = rows.length / STRIDE;

  // Compressed index: for each verse, every link with an end on it.
  const offsets = new Int32Array(TOTAL_VERSES + 1);
  for (let id = 0; id < count; id++) {
    offsets[rows[id * STRIDE] + 1]++;
    const toEnd = rows[id * STRIDE + 2];
    for (let v = rows[id * STRIDE + 1]; v <= toEnd; v++) offsets[v + 1]++;
  }
  for (let v = 0; v < TOTAL_VERSES; v++) offsets[v + 1] += offsets[v];

  const byVerse = new Int32Array(offsets[TOTAL_VERSES]);
  const cursor = offsets.slice();
  for (let id = 0; id < count; id++) {
    byVerse[cursor[rows[id * STRIDE]]++] = id;
    const toEnd = rows[id * STRIDE + 2];
    for (let v = rows[id * STRIDE + 1]; v <= toEnd; v++) byVerse[cursor[v]++] = id;
  }

  return { rows, count, offsets, byVerse };
}

export function linkPasses(store: LinkStore, id: number, filter: LinkFilter): boolean {
  if (linkVotes(store, id) < filter.minVotes) return false;
  if (filter.genre === null) return true;
  return BOOK_GENRE[VERSE_BOOK[linkFrom(store, id)]] === filter.genre ||
    BOOK_GENRE[VERSE_BOOK[linkToStart(store, id)]] === filter.genre;
}

export function filterLinks(store: LinkStore, filter: LinkFilter): Int32Array {
  const ids = new Int32Array(store.count);
  let n = 0;
  for (let id = 0; id < store.count; id++) {
    if (linkPasses(store, id, filter)) ids[n++] = id;
  }
  return ids.slice(0, n);
}

// Links with an end in the passage, strongest first, each once.
export function linksInPassage(
  store: LinkStore, start: number, end: number, filter: LinkFilter,
): Int32Array {
  const seen = new Set<number>();
  for (let i = store.offsets[start]; i < store.offsets[end + 1]; i++) {
    const id = store.byVerse[i];
    if (linkPasses(store, id, filter)) seen.add(id);
  }
  return Int32Array.from(seen).sort();
}

// Other links between the same two books, for paging through a connection.
export function linksBetweenBooks(
  store: LinkStore, id: number, filter: LinkFilter, visible: Int32Array,
): Int32Array {
  const a = VERSE_BOOK[linkFrom(store, id)];
  const b = VERSE_BOOK[linkToStart(store, id)];
  const out: number[] = [];
  for (const other of visible) {
    const x = VERSE_BOOK[linkFrom(store, other)];
    const y = VERSE_BOOK[linkToStart(store, other)];
    if ((x === a && y === b) || (x === b && y === a)) out.push(other);
  }
  if (!out.includes(id) && linkPasses(store, id, filter)) out.push(id);
  return Int32Array.from(out).sort();
}

export function findLink(store: LinkStore, from: number, toStart: number): number | null {
  for (let i = store.offsets[from]; i < store.offsets[from + 1]; i++) {
    const id = store.byVerse[i];
    if (linkFrom(store, id) === from && linkToStart(store, id) === toStart) return id;
  }
  return null;
}
