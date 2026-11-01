/**
 * Reads the timeline's scripture references ("Gen 4:25–5:8", "1 Kgs 17–2 Kgs 2",
 * "Gen 25:13; 28:9; Isa 60:7") into verse ranges in Rainbow's numbering, and
 * loads the Berean Standard Bible text that Rainbow already ships.
 */

import { bookOffsets, books } from "@jessespencer/bible-ui/bible";

export interface Passage {
  start: number;
  end: number;
  label: string;
  /** Rainbow's `?ref=` value. Rainbow opens one chapter at most, so long passages open at their first. */
  param: string;
}

interface Point {
  book: number;
  chapter: number | null;
  verse: number | null;
}

const ENDPOINT = /^(\d?\s?[A-Za-z]+)?\s*(?:(\d+)(?::(\d+))?)?$/;

const findBook = (abbr: string): number | null => {
  const key = abbr.replace(/\s/g, "");
  const index = books.findIndex((b) => b.abbr === key || b.osis === key);
  return index >= 0 ? index : null;
};

const firstVerse = (book: number, chapter: number): number => {
  const counts = books[book]!.verseCounts;
  let index = bookOffsets[book]!;
  for (let c = 0; c < chapter - 1; c++) index += counts[c]!;
  return index;
};

const lastVerse = (book: number, chapter: number): number =>
  firstVerse(book, chapter) + books[book]!.verseCounts[chapter - 1]! - 1;

const startIndex = ({ book, chapter, verse }: Point): number =>
  firstVerse(book, chapter ?? 1) + (verse ?? 1) - 1;

const endIndex = ({ book, chapter, verse }: Point): number => {
  const last = chapter ?? books[book]!.chapters;
  return verse === null ? lastVerse(book, last) : firstVerse(book, last) + verse - 1;
};

export const locate = (index: number): Point & { chapter: number; verse: number } => {
  let book = books.length - 1;
  while (bookOffsets[book]! > index) book--;
  let remaining = index - bookOffsets[book]!;
  let chapter = 1;
  for (const count of books[book]!.verseCounts) {
    if (remaining < count) break;
    remaining -= count;
    chapter++;
  }
  return { book, chapter, verse: remaining + 1 };
};

const describe = (start: number, end: number): Pick<Passage, "label" | "param"> => {
  const a = locate(start);
  const b = locate(end);
  const { name, osis, chapters, verseCounts } = books[a.book]!;
  const wholeChapters =
    a.verse === 1 && b.book === a.book && b.verse === verseCounts[b.chapter - 1];

  if (b.book !== a.book) {
    return { label: `${name} – ${books[b.book]!.name}`, param: `${osis}.${a.chapter}` };
  }
  if (wholeChapters && a.chapter === 1 && b.chapter === chapters) {
    return { label: name, param: osis };
  }
  if (wholeChapters) {
    const span = a.chapter === b.chapter ? `${a.chapter}` : `${a.chapter}–${b.chapter}`;
    return { label: `${name} ${span}`, param: `${osis}.${a.chapter}` };
  }
  if (a.chapter !== b.chapter) {
    return {
      label: `${name} ${a.chapter}:${a.verse}–${b.chapter}:${b.verse}`,
      param: `${osis}.${a.chapter}`,
    };
  }
  const verses = a.verse === b.verse ? `${a.verse}` : `${a.verse}–${b.verse}`;
  return {
    label: `${name} ${a.chapter}:${verses}`,
    param: `${osis}.${a.chapter}.${verses.replace("–", "-")}`,
  };
};

const readPoint = (text: string, fallback: Point | null): Point | null => {
  const match = ENDPOINT.exec(text.trim());
  if (!match) return null;
  const book = match[1] ? findBook(match[1]) : (fallback?.book ?? null);
  if (book === null) return null;
  const chapter = match[2] ? Number(match[2]) : null;
  const verse = match[3] ? Number(match[3]) : null;
  return { book, chapter, verse };
};

const readRange = (text: string, previous: Point | null, inVerses: boolean): [Point, Point] | null => {
  const [left, right] = text.split("–") as [string, string | undefined];
  const start = readPoint(left, previous);
  if (!start) return null;
  // After a comma, bare numbers are verses of the chapter before it.
  if (inVerses && start.verse === null) {
    start.verse = start.chapter;
    start.chapter = previous?.chapter ?? null;
  }
  if (right === undefined) return [start, start];

  const end = readPoint(right, start);
  if (!end) return null;
  const sameBook = !/[A-Za-z]/.test(right);
  if (sameBook && start.verse !== null && end.verse === null) {
    end.verse = end.chapter;
    end.chapter = start.chapter;
  }
  return [start, end];
};

export const parseScripture = (ref: string): Passage[] => {
  const passages: Passage[] = [];
  let previous: Point | null = null;

  for (const clause of ref.split(";")) {
    clause.split(",").forEach((part, i) => {
      const range = readRange(part, previous, i > 0);
      if (!range) return;
      const [from, to] = range;
      const start = startIndex(from);
      const end = endIndex(to);
      passages.push({ start, end, ...describe(start, end) });
      previous = to;
    });
  }
  return passages;
};

let bible: Promise<string[]> | null = null;

/** The BSB as one string per verse. Rainbow's file, fetched on first use. */
export const loadBible = (): Promise<string[]> => {
  if (!bible) {
    const base = import.meta.env.BASE_URL;
    const url = `${base}${import.meta.env.DEV ? "" : "../"}data/bsb.json`;
    bible = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${url}`);
      return res.json() as Promise<string[]>;
    });
    bible.catch(() => { bible = null; });
  }
  return bible;
};
