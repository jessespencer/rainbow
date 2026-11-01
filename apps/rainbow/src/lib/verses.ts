import { bookOffsets, books as bookMeta, totalVerses } from '../../scripts/bible-metadata';
import { BOOKS, OT_COUNT } from '../data/books';

export const TOTAL_VERSES = totalVerses;
export const OT_VERSES = bookOffsets[OT_COUNT];

// A contiguous run of verses: a verse, a verse range, a chapter or a book.
export interface Passage {
  start: number;
  end: number;
  label: string;
}

export interface VerseLocation {
  book: number;
  chapter: number;
  verse: number;
}

export const VERSE_BOOK = new Uint8Array(TOTAL_VERSES);
bookOffsets.forEach((offset, book) => {
  VERSE_BOOK.fill(book, offset, book + 1 < bookOffsets.length ? bookOffsets[book + 1] : TOTAL_VERSES);
});

export function locate(verse: number): VerseLocation {
  const book = VERSE_BOOK[verse];
  let remaining = verse - bookOffsets[book];
  let chapter = 1;
  for (const count of bookMeta[book].verseCounts) {
    if (remaining < count) break;
    remaining -= count;
    chapter++;
  }
  return { book, chapter, verse: remaining + 1 };
}

export function verseIndex(book: number, chapter: number, verse: number): number | null {
  const counts = bookMeta[book].verseCounts;
  if (chapter < 1 || chapter > counts.length) return null;
  if (verse < 1 || verse > counts[chapter - 1]) return null;
  let index = bookOffsets[book];
  for (let c = 0; c < chapter - 1; c++) index += counts[c];
  return index + verse - 1;
}

export function formatVerse(verse: number): string {
  const { book, chapter, verse: number } = locate(verse);
  return `${BOOKS[book].name} ${chapter}:${number}`;
}

export function formatRange(start: number, end: number): string {
  if (start === end) return formatVerse(start);
  const a = locate(start);
  const b = locate(end);
  if (a.book !== b.book) return `${formatVerse(start)} – ${formatVerse(end)}`;
  if (a.chapter !== b.chapter) {
    return `${BOOKS[a.book].name} ${a.chapter}:${a.verse}–${b.chapter}:${b.verse}`;
  }
  return `${BOOKS[a.book].name} ${a.chapter}:${a.verse}–${b.verse}`;
}

export function bookPassage(book: number): Passage {
  const end = (book + 1 < bookOffsets.length ? bookOffsets[book + 1] : TOTAL_VERSES) - 1;
  return { start: bookOffsets[book], end, label: BOOKS[book].name };
}

export function chapterPassage(book: number, chapter: number): Passage | null {
  const start = verseIndex(book, chapter, 1);
  if (start === null) return null;
  const end = start + bookMeta[book].verseCounts[chapter - 1] - 1;
  return { start, end, label: `${BOOKS[book].name} ${chapter}` };
}

export function versePassage(verse: number): Passage {
  return { start: verse, end: verse, label: formatVerse(verse) };
}

// The next verse, chapter or book, matching what the passage is.
export function neighborPassage(passage: Passage, step: -1 | 1): Passage | null {
  const { book, chapter } = locate(passage.start);
  const wholeBook = bookPassage(book);
  if (passage.start === wholeBook.start && passage.end === wholeBook.end) {
    return BOOKS[book + step] ? bookPassage(book + step) : null;
  }
  const verse = step < 0 ? passage.start - 1 : passage.end + 1;
  if (verse < 0 || verse >= TOTAL_VERSES) return null;
  const wholeChapter = chapterPassage(book, chapter)!;
  if (passage.start === wholeChapter.start && passage.end === wholeChapter.end) {
    const next = locate(verse);
    return chapterPassage(next.book, next.chapter);
  }
  return versePassage(verse);
}

const BOOK_ALIASES: Record<string, number> = {
  psalm: 18, song: 21, songofsongs: 21, canticles: 21, revelations: 65,
  mt: 39, mk: 40, lk: 41, jn: 42, php: 49, phm: 55, jas: 58,
};

const BOOK_KEYS = new Map<string, number>(Object.entries(BOOK_ALIASES));
BOOKS.forEach((book, i) => {
  BOOK_KEYS.set(book.name.toLowerCase().replace(/\s/g, ''), i);
  BOOK_KEYS.set(book.abbr.toLowerCase(), i);
  BOOK_KEYS.set(bookMeta[i].osis.toLowerCase(), i);
});

export function findBook(text: string): number | null {
  const key = text.toLowerCase().replace(/[\s.]/g, '');
  if (!key) return null;
  const exact = BOOK_KEYS.get(key);
  if (exact !== undefined) return exact;
  const index = BOOKS.findIndex(b => b.name.toLowerCase().replace(/\s/g, '').startsWith(key));
  return index >= 0 ? index : null;
}

// Reads what a person types: "John 3:16", "ps 23", "1 cor 13:4-7", "Jude 5", "Isaiah".
export function parseReference(text: string): Passage | null {
  const match = /^\s*(\d?\s*[a-zA-Z][a-zA-Z .]*?)\s*(?:(\d+)(?:\s*[:.]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?)?\s*$/.exec(text);
  if (!match) return null;
  const book = findBook(match[1]);
  if (book === null) return null;
  if (!match[2]) return bookPassage(book);

  let chapter = Number(match[2]);
  let firstVerse = match[3] ? Number(match[3]) : null;
  // Single-chapter books are cited by verse alone.
  if (bookMeta[book].chapters === 1 && firstVerse === null) {
    firstVerse = chapter;
    chapter = 1;
  }
  if (firstVerse === null) return chapterPassage(book, chapter);

  const start = verseIndex(book, chapter, firstVerse);
  if (start === null) return null;
  const end = match[4] ? verseIndex(book, chapter, Number(match[4])) : start;
  if (end === null || end < start) return null;
  return { start, end, label: formatRange(start, end) };
}

// "John.3.16" for a verse, "John.3" for a chapter, "John" for a book, used in URLs.
export function passageToParam({ start, end }: Passage): string {
  const a = locate(start);
  const osis = bookMeta[a.book].osis;
  const whole = bookPassage(a.book);
  if (start === whole.start && end === whole.end) return osis;
  const chapter = chapterPassage(a.book, a.chapter)!;
  if (start === chapter.start && end === chapter.end) return `${osis}.${a.chapter}`;
  if (start === end) return `${osis}.${a.chapter}.${a.verse}`;
  return `${osis}.${a.chapter}.${a.verse}-${locate(end).verse}`;
}

export function passageFromParam(param: string): Passage | null {
  return parseReference(param.replace('.', ' ').replace('.', ':'));
}
