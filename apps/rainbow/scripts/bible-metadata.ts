// 66 books of the Bible with chapter counts and verse counts per chapter
// Used by both build scripts and runtime

export interface BookMeta {
  index: number;      // 1-66
  name: string;
  abbr: string;       // Standard abbreviation
  osis: string;       // OSIS abbreviation (used in cross-ref data)
  chapters: number;
  verseCounts: number[];  // verses per chapter
  testament: 'OT' | 'NT';
}

// Verse counts per chapter for all 66 books (KJV)
const booksRaw: [string, string, string, 'OT' | 'NT', number[]][] = [
  ['Genesis', 'Gen', 'Gen', 'OT', [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26]],
  ['Exodus', 'Exod', 'Exod', 'OT', [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38]],
  ['Leviticus', 'Lev', 'Lev', 'OT', [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34]],
  ['Numbers', 'Num', 'Num', 'OT', [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13]],
  ['Deuteronomy', 'Deut', 'Deut', 'OT', [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12]],
  ['Joshua', 'Josh', 'Josh', 'OT', [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33]],
  ['Judges', 'Judg', 'Judg', 'OT', [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25]],
  ['Ruth', 'Ruth', 'Ruth', 'OT', [22,23,18,22]],
  ['1 Samuel', '1Sam', '1Sam', 'OT', [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13]],
  ['2 Samuel', '2Sam', '2Sam', 'OT', [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25]],
  ['1 Kings', '1Kgs', '1Kgs', 'OT', [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53]],
  ['2 Kings', '2Kgs', '2Kgs', 'OT', [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30]],
  ['1 Chronicles', '1Chr', '1Chr', 'OT', [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30]],
  ['2 Chronicles', '2Chr', '2Chr', 'OT', [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23]],
  ['Ezra', 'Ezra', 'Ezra', 'OT', [11,70,13,24,17,22,28,36,15,44]],
  ['Nehemiah', 'Neh', 'Neh', 'OT', [11,20,32,23,19,19,73,18,38,39,36,47,31]],
  ['Esther', 'Esth', 'Esth', 'OT', [22,23,15,17,14,14,10,17,32,3]],
  ['Job', 'Job', 'Job', 'OT', [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17]],
  ['Psalms', 'Ps', 'Ps', 'OT', [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6]],
  ['Proverbs', 'Prov', 'Prov', 'OT', [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31]],
  ['Ecclesiastes', 'Eccl', 'Eccl', 'OT', [18,26,22,16,20,12,29,17,18,20,10,14]],
  ['Song of Solomon', 'Song', 'Song', 'OT', [17,17,11,16,16,13,13,14]],
  ['Isaiah', 'Isa', 'Isa', 'OT', [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24]],
  ['Jeremiah', 'Jer', 'Jer', 'OT', [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34]],
  ['Lamentations', 'Lam', 'Lam', 'OT', [22,22,66,22,22]],
  ['Ezekiel', 'Ezek', 'Ezek', 'OT', [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35]],
  ['Daniel', 'Dan', 'Dan', 'OT', [21,49,30,37,31,28,28,27,27,21,45,13]],
  ['Hosea', 'Hos', 'Hos', 'OT', [11,23,5,19,15,11,16,14,17,15,12,14,16,9]],
  ['Joel', 'Joel', 'Joel', 'OT', [20,32,21]],
  ['Amos', 'Amos', 'Amos', 'OT', [15,16,15,13,27,14,17,14,15]],
  ['Obadiah', 'Obad', 'Obad', 'OT', [21]],
  ['Jonah', 'Jonah', 'Jonah', 'OT', [17,10,10,11]],
  ['Micah', 'Mic', 'Mic', 'OT', [16,13,12,13,15,16,20]],
  ['Nahum', 'Nah', 'Nah', 'OT', [15,13,19]],
  ['Habakkuk', 'Hab', 'Hab', 'OT', [17,20,19]],
  ['Zephaniah', 'Zeph', 'Zeph', 'OT', [18,15,20]],
  ['Haggai', 'Hag', 'Hag', 'OT', [15,23]],
  ['Zechariah', 'Zech', 'Zech', 'OT', [21,13,10,14,11,15,14,23,17,12,17,14,9,21]],
  ['Malachi', 'Mal', 'Mal', 'OT', [14,17,18,6]],
  // New Testament
  ['Matthew', 'Matt', 'Matt', 'NT', [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20]],
  ['Mark', 'Mark', 'Mark', 'NT', [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20]],
  ['Luke', 'Luke', 'Luke', 'NT', [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53]],
  ['John', 'John', 'John', 'NT', [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25]],
  ['Acts', 'Acts', 'Acts', 'NT', [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31]],
  ['Romans', 'Rom', 'Rom', 'NT', [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27]],
  ['1 Corinthians', '1Cor', '1Cor', 'NT', [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,10]],
  ['2 Corinthians', '2Cor', '2Cor', 'NT', [24,17,18,18,21,18,16,24,15,18,33,21,14]],
  ['Galatians', 'Gal', 'Gal', 'NT', [24,21,29,31,26,18]],
  ['Ephesians', 'Eph', 'Eph', 'NT', [23,22,21,32,33,24]],
  ['Philippians', 'Phil', 'Phil', 'NT', [30,30,21,23]],
  ['Colossians', 'Col', 'Col', 'NT', [29,23,25,18]],
  ['1 Thessalonians', '1Thess', '1Thess', 'NT', [10,20,13,18,28]],
  ['2 Thessalonians', '2Thess', '2Thess', 'NT', [12,17,18]],
  ['1 Timothy', '1Tim', '1Tim', 'NT', [20,15,16,16,25,21]],
  ['2 Timothy', '2Tim', '2Tim', 'NT', [18,26,17,22]],
  ['Titus', 'Titus', 'Titus', 'NT', [16,15,15]],
  ['Philemon', 'Phlm', 'Phlm', 'NT', [25]],
  ['Hebrews', 'Heb', 'Heb', 'NT', [14,18,19,16,14,20,28,13,28,39,40,29,25]],
  ['James', 'Jas', 'Jas', 'NT', [27,26,18,17,20]],
  ['1 Peter', '1Pet', '1Pet', 'NT', [25,25,22,19,14]],
  ['2 Peter', '2Pet', '2Pet', 'NT', [21,22,18]],
  ['1 John', '1John', '1John', 'NT', [10,29,24,21,21]],
  ['2 John', '2John', '2John', 'NT', [13]],
  ['3 John', '3John', '3John', 'NT', [14]],
  ['Jude', 'Jude', 'Jude', 'NT', [25]],
  ['Revelation', 'Rev', 'Rev', 'NT', [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21]],
];

export const books: BookMeta[] = booksRaw.map(([name, abbr, osis, testament, verseCounts], i) => ({
  index: i + 1,
  name,
  abbr,
  osis,
  chapters: verseCounts.length,
  verseCounts,
  testament,
}));

// Total verses per book and cumulative offsets
export const bookVerseTotals = books.map(b => b.verseCounts.reduce((a, c) => a + c, 0));
export const bookOffsets: number[] = [];
let offset = 0;
for (const total of bookVerseTotals) {
  bookOffsets.push(offset);
  offset += total;
}
export const totalVerses = offset; // Should be 31102

// Map OSIS abbreviation to book index (1-based)
export const osisToIndex: Record<string, number> = {};
for (const book of books) {
  osisToIndex[book.osis] = book.index;
}

// Convert a reference like "Gen.1.1" to a global verse index (0-based)
export function refToVerseIndex(ref: string): number | null {
  const parts = ref.split('.');
  if (parts.length < 3) return null;
  const bookOsis = parts[0];
  const chapter = parseInt(parts[1], 10);
  const verse = parseInt(parts[2], 10);
  const bookIdx = osisToIndex[bookOsis];
  if (bookIdx === undefined) return null;
  const book = books[bookIdx - 1];
  if (chapter < 1 || chapter > book.chapters) return null;
  // Sum verses in all preceding chapters
  let idx = bookOffsets[bookIdx - 1];
  for (let c = 0; c < chapter - 1; c++) {
    idx += book.verseCounts[c];
  }
  idx += verse - 1;
  return idx;
}

// Convert a global verse index back to a human-readable reference
export function verseIndexToRef(idx: number): string {
  // Find the book
  let bookIdx = 0;
  for (let i = 0; i < books.length; i++) {
    if (i + 1 < books.length && idx >= bookOffsets[i + 1]) continue;
    bookIdx = i;
    break;
  }
  const book = books[bookIdx];
  let remaining = idx - bookOffsets[bookIdx];
  let chapter = 1;
  for (const vc of book.verseCounts) {
    if (remaining < vc) break;
    remaining -= vc;
    chapter++;
  }
  return `${book.name} ${chapter}:${remaining + 1}`;
}

// Theme definitions
export const THEMES = [
  { id: 'christology', label: 'Christology', color: '#e94560' },
  { id: 'prophecy', label: 'Prophecy', color: '#f5a623' },
  { id: 'eschatology', label: 'Eschatology', color: '#f7dc6f' },
  { id: 'law', label: 'Law', color: '#1abc9c' },
  { id: 'salvation', label: 'Salvation', color: '#2980b9' },
  { id: 'creation', label: 'Creation', color: '#27ae60' },
  { id: 'worship', label: 'Worship', color: '#8e44ad' },
  { id: 'wisdom', label: 'Wisdom', color: '#e84393' },
  { id: 'other', label: 'Other', color: '#636e72' },
] as const;

export type ThemeId = typeof THEMES[number]['id'];
export const themeToIndex: Record<string, number> = {};
THEMES.forEach((t, i) => { themeToIndex[t.id] = i; });
