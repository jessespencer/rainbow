// Build the app's datasets from the raw OpenBible.info and BSB files.
// links.bin: Int16 rows of [from, toStart, toEnd, votes], strongest links first.
// bsb.json: verse text in canonical order, indexed by verse.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { books, bookOffsets, totalVerses } from './bible-metadata';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, '..', 'raw-data');
const OUT_DIR = join(__dirname, '..', 'public', 'data');

const EXPECTED_VERSES = 31102;

const osisToBook = new Map(books.map((b, i) => [b.osis, i]));

// OpenBible and the BSB split 3 John into 15 verses; the KJV numbering used here has 14.
const THIRD_JOHN = osisToBook.get('3John')!;

function verseIndex(bookIdx: number, chapter: number, rawVerse: number): number | null {
  const verse = bookIdx === THIRD_JOHN && rawVerse === 15 ? 14 : rawVerse;
  const counts = books[bookIdx].verseCounts;
  if (chapter < 1 || chapter > counts.length) return null;
  if (verse < 1 || verse > counts[chapter - 1]) return null;
  let idx = bookOffsets[bookIdx];
  for (let c = 0; c < chapter - 1; c++) idx += counts[c];
  return idx + verse - 1;
}

function osisToVerse(ref: string): number | null {
  const [osis, chapter, verse] = ref.split('.');
  const bookIdx = osisToBook.get(osis);
  if (bookIdx === undefined) return null;
  return verseIndex(bookIdx, Number(chapter), Number(verse));
}

function buildLinks(): void {
  const lines = readFileSync(join(RAW_DIR, 'cross_references.txt'), 'utf-8').trim().split('\n');
  const rows: [number, number, number, number][] = [];
  const unparsed: string[] = [];

  for (const line of lines.slice(1)) {
    const [fromRef, toRef, votesText] = line.split('\t');
    const [toStartRef, toEndRef = toStartRef] = toRef.split('-');
    const from = osisToVerse(fromRef);
    const toStart = osisToVerse(toStartRef);
    const toEnd = osisToVerse(toEndRef);
    const votes = Number.parseInt(votesText, 10);
    if (from === null || toStart === null || toEnd === null || Number.isNaN(votes)) {
      unparsed.push(line);
      continue;
    }
    rows.push([from, toStart, toEnd, votes]);
  }

  if (unparsed.length > 0) {
    throw new Error(`${unparsed.length} unparsed rows, e.g. ${unparsed.slice(0, 5).join(' | ')}`);
  }

  rows.sort((a, b) => b[3] - a[3]);
  const out = new Int16Array(rows.length * 4);
  rows.forEach((row, i) => out.set(row, i * 4));
  writeFileSync(join(OUT_DIR, 'links.bin'), Buffer.from(out.buffer));
  console.log(`Wrote links.bin: ${rows.length} links, ${(out.byteLength / 1024).toFixed(0)} KB`);
  console.log(`Snapshot: ${lines[0].split('\t')[3]}`);
}

function buildBsb(): void {
  const lines = readFileSync(join(RAW_DIR, 'bsb.txt'), 'utf-8').split('\n');
  const names = new Map(books.map((b, i) => [b.name, i]));
  names.set('Psalm', names.get('Psalms')!);
  const verses = new Array<string>(totalVerses).fill('');
  let filled = 0;

  for (const line of lines) {
    const match = /^(.+) (\d+):(\d+)\t(.*)$/.exec(line.trimEnd());
    if (!match) continue;
    const [, name, chapter, verse, text] = match;
    const bookIdx = names.get(name);
    if (bookIdx === undefined) throw new Error(`Unknown BSB book: ${name}`);
    const index = verseIndex(bookIdx, Number(chapter), Number(verse));
    if (index === null) throw new Error(`BSB verse outside KJV numbering: ${line.slice(0, 40)}`);
    if (!verses[index]) filled++;
    verses[index] = verses[index] ? `${verses[index]} ${text}` : text;
  }

  writeFileSync(join(OUT_DIR, 'bsb.json'), JSON.stringify(verses));
  console.log(`Wrote bsb.json: ${filled} verses, ${verses.filter(v => !v).length} empty`);
}

function main() {
  if (totalVerses !== EXPECTED_VERSES) {
    throw new Error(`Expected ${EXPECTED_VERSES} verses, metadata has ${totalVerses}`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  buildLinks();
  buildBsb();
}

main();
