// Parse the OpenBible.info cross-references TSV and output compact JSON
// Format: "From Verse\tTo Verse\tVotes" where refs are OSIS like "Gen.1.1"
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { books, bookOffsets, totalVerses, THEMES, themeToIndex } from './bible-metadata.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, '..', 'raw-data');
const OUT_DIR = join(__dirname, '..', 'public', 'data');

// Build OSIS lookup
const osisToBookIndex: Record<string, number> = {};
for (let i = 0; i < books.length; i++) {
  osisToBookIndex[books[i].osis] = i;
}
// Add common OSIS variants
const osisAliases: Record<string, string> = {
  'Song': 'Song', 'SgofSol': 'Song', 'Phlm': 'Phlm',
  '1Kgs': '1Kgs', '2Kgs': '2Kgs',
  '1Sam': '1Sam', '2Sam': '2Sam',
  '1Chr': '1Chr', '2Chr': '2Chr',
  '1Cor': '1Cor', '2Cor': '2Cor',
  '1Thess': '1Thess', '2Thess': '2Thess',
  '1Tim': '1Tim', '2Tim': '2Tim',
  '1Pet': '1Pet', '2Pet': '2Pet',
  '1John': '1John', '2John': '2John', '3John': '3John',
};

function parseOsisRef(ref: string): { bookIdx: number; chapter: number; verse: number } | null {
  // Handle range refs like "Ps.89.11-Ps.89.12" — take the start
  const dashIdx = ref.indexOf('-');
  const startRef = dashIdx >= 0 ? ref.substring(0, dashIdx) : ref;

  const parts = startRef.split('.');
  if (parts.length < 3) return null;

  const bookOsis = parts[0];
  const chapter = parseInt(parts[1], 10);
  const verse = parseInt(parts[2], 10);

  let bookIdx = osisToBookIndex[bookOsis];
  if (bookIdx === undefined) {
    const alias = osisAliases[bookOsis];
    if (alias) bookIdx = osisToBookIndex[alias];
  }
  if (bookIdx === undefined) return null;

  return { bookIdx, chapter, verse };
}

function refToVerseIndex(ref: string): number | null {
  const parsed = parseOsisRef(ref);
  if (!parsed) return null;
  const { bookIdx, chapter, verse } = parsed;
  const book = books[bookIdx];
  if (chapter < 1 || chapter > book.chapters) return null;
  let idx = bookOffsets[bookIdx];
  for (let c = 0; c < chapter - 1; c++) {
    idx += book.verseCounts[c];
  }
  idx += verse - 1;
  if (idx < 0 || idx >= totalVerses) return null;
  return idx;
}

function refToBookChapter(ref: string): { bookNum: number; chapter: number } | null {
  const parsed = parseOsisRef(ref);
  if (!parsed) return null;
  return { bookNum: parsed.bookIdx + 1, chapter: parsed.chapter };
}

// Theme classification by book ranges
function classifyTheme(fromBook: number, toBook: number, fromChapter: number, toChapter: number): number {
  const gospels = [40, 41, 42, 43];
  const isFromGospel = gospels.includes(fromBook);
  const isToGospel = gospels.includes(toBook);

  // Christology: Psalms <-> Gospels
  if ((fromBook === 19 && isToGospel) || (isFromGospel && toBook === 19)) {
    return themeToIndex['christology'];
  }
  // Isaiah Servant Songs <-> NT
  if (fromBook === 23 && toBook >= 40) {
    if ((fromChapter >= 7 && fromChapter <= 12) || [42, 49, 50, 52, 53].includes(fromChapter))
      return themeToIndex['christology'];
  }
  if (toBook === 23 && fromBook >= 40) {
    if ((toChapter >= 7 && toChapter <= 12) || [42, 49, 50, 52, 53].includes(toChapter))
      return themeToIndex['christology'];
  }
  // Prophecy: OT prophets (Isaiah-Malachi = 23-39) <-> NT
  if ((fromBook >= 23 && fromBook <= 39 && toBook >= 40) ||
      (toBook >= 23 && toBook <= 39 && fromBook >= 40)) {
    return themeToIndex['prophecy'];
  }
  // Eschatology: Revelation, Daniel 7-12, Matt 24-25
  if (fromBook === 66 || toBook === 66) return themeToIndex['eschatology'];
  if ((fromBook === 27 && fromChapter >= 7) || (toBook === 27 && toChapter >= 7))
    return themeToIndex['eschatology'];
  if ((fromBook === 40 && fromChapter >= 24 && fromChapter <= 25) ||
      (toBook === 40 && toChapter >= 24 && toChapter <= 25))
    return themeToIndex['eschatology'];
  // Law: Leviticus, Exodus 20+, Deuteronomy
  if (fromBook === 3 || toBook === 3) return themeToIndex['law'];
  if ((fromBook === 2 && fromChapter >= 20) || (toBook === 2 && toChapter >= 20))
    return themeToIndex['law'];
  if (fromBook === 5 || toBook === 5) return themeToIndex['law'];
  // Creation: Genesis 1-2
  if ((fromBook === 1 && fromChapter <= 2) || (toBook === 1 && toChapter <= 2))
    return themeToIndex['creation'];
  // Wisdom: Job(18), Proverbs(20), Ecclesiastes(21)
  if ([18, 20, 21].includes(fromBook) || [18, 20, 21].includes(toBook))
    return themeToIndex['wisdom'];
  // Worship: Psalms
  if (fromBook === 19 || toBook === 19) return themeToIndex['worship'];
  // Salvation: Romans(45), Galatians(48), Ephesians(49)
  if ([45, 48, 49].includes(fromBook) || [45, 48, 49].includes(toBook))
    return themeToIndex['salvation'];

  return themeToIndex['other'];
}

function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Parsing cross-references...');
  const raw = readFileSync(join(RAW_DIR, 'cross_references.txt'), 'utf-8');
  const lines = raw.trim().split('\n');
  console.log(`Header: ${lines[0]}`);
  console.log(`Total lines: ${lines.length}`);

  const arcs: [number, number, number, number][] = [];
  let skipped = 0;
  const unknownBooks = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#') || line.trim() === '') continue;

    const cols = line.split('\t');
    if (cols.length < 3) { skipped++; continue; }

    const fromRef = cols[0];
    const toRef = cols[1];
    const votes = parseInt(cols[2], 10) || 1;

    const fromIdx = refToVerseIndex(fromRef);
    const toIdx = refToVerseIndex(toRef);

    if (fromIdx === null) {
      const p = fromRef.split('.')[0];
      if (!osisToBookIndex[p]) unknownBooks.add(p);
      skipped++;
      continue;
    }
    if (toIdx === null) {
      const p = toRef.split('.')[0];
      if (!osisToBookIndex[p]) unknownBooks.add(p);
      skipped++;
      continue;
    }

    const fromBC = refToBookChapter(fromRef)!;
    const toBC = refToBookChapter(toRef)!;
    const theme = classifyTheme(fromBC.bookNum, toBC.bookNum, fromBC.chapter, toBC.chapter);
    arcs.push([fromIdx, toIdx, votes, theme]);
  }

  if (unknownBooks.size > 0) {
    console.log('Unknown OSIS books:', [...unknownBooks]);
  }
  console.log(`Parsed ${arcs.length} cross-references (skipped ${skipped})`);

  // Sort by distance descending (longest arcs drawn first)
  arcs.sort((a, b) => Math.abs(b[0] - b[1]) - Math.abs(a[0] - a[1]));

  // Write cross-references
  const json = JSON.stringify(arcs);
  writeFileSync(join(OUT_DIR, 'cross-references.json'), json);
  console.log(`Wrote cross-references.json (${(json.length / 1024).toFixed(0)} KB)`);

  // Write bible structure
  const structure = books.map((b, i) => ({
    name: b.name,
    abbr: b.abbr,
    testament: b.testament,
    verseCount: b.verseCounts.reduce((a, c) => a + c, 0),
    offset: bookOffsets[i],
    chapters: b.chapters,
    verseCounts: b.verseCounts,
  }));
  writeFileSync(join(OUT_DIR, 'bible-structure.json'), JSON.stringify(structure));
  console.log('Wrote bible-structure.json');

  // Theme distribution
  const dist: Record<string, number> = {};
  for (const arc of arcs) {
    const theme = THEMES[arc[3]].label;
    dist[theme] = (dist[theme] || 0) + 1;
  }
  console.log('Theme distribution:', dist);
}

main();
