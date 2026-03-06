export interface BookInfo {
  name: string;
  abbr: string;
  testament: 'OT' | 'NT';
  verseCount: number;
  offset: number;
  chapters: number;
  verseCounts: number[];
}

// Arc format: [fromVerseIndex, toVerseIndex, votes, themeIndex]
export type Arc = [number, number, number, number];

export interface BibleData {
  books: BookInfo[];
  arcs: Arc[];
  totalVerses: number;
}

export async function loadBibleData(onProgress?: (pct: number) => void): Promise<BibleData> {
  onProgress?.(10);

  const [structureResp, arcsResp] = await Promise.all([
    fetch('/data/bible-structure.json'),
    fetch('/data/cross-references.json'),
  ]);

  onProgress?.(50);

  const books: BookInfo[] = await structureResp.json();
  onProgress?.(60);

  const arcs: Arc[] = await arcsResp.json();
  onProgress?.(90);

  const totalVerses = books.reduce((sum, b) => sum + b.verseCount, 0);

  onProgress?.(100);
  return { books, arcs, totalVerses };
}

// Convert verse index to human-readable reference
export function verseIndexToRef(idx: number, books: BookInfo[]): string {
  let bookIdx = 0;
  for (let i = 0; i < books.length; i++) {
    if (i + 1 < books.length && idx >= books[i + 1].offset) continue;
    bookIdx = i;
    break;
  }
  const book = books[bookIdx];
  let remaining = idx - book.offset;
  let chapter = 1;
  for (const vc of book.verseCounts) {
    if (remaining < vc) break;
    remaining -= vc;
    chapter++;
  }
  return `${book.name} ${chapter}:${remaining + 1}`;
}

// Parse a search string like "John 3:16" or "1 Cor 13:4" to a verse index
export function parseVerseRef(input: string, books: BookInfo[]): number | null {
  const cleaned = input.trim();
  // Match patterns like "1 John 3:16", "Genesis 1:1", "Rev 22:21"
  const match = cleaned.match(/^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+):(\d+)$/);
  if (!match) return null;

  const bookStr = match[1].trim().toLowerCase();
  const chapter = parseInt(match[2], 10);
  const verse = parseInt(match[3], 10);

  // Find matching book
  const book = books.find(b =>
    b.name.toLowerCase() === bookStr ||
    b.abbr.toLowerCase() === bookStr ||
    b.name.toLowerCase().startsWith(bookStr)
  );
  if (!book) return null;
  if (chapter < 1 || chapter > book.chapters) return null;

  let idx = book.offset;
  for (let c = 0; c < chapter - 1; c++) {
    idx += book.verseCounts[c];
  }
  idx += verse - 1;
  return idx;
}
