// Download public-domain and openly licensed Bibles and map each to the KJV verse numbering the
// cross-references use. Writes public/data/text-<id>.json: verse text in canonical order, indexed by verse.
// Verses a translation numbers differently from the KJV are dropped and counted, never guessed.
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TRANSLATIONS } from '@jessespencer/bible-ui/translations';
import { books, bookOffsets, totalVerses } from './bible-metadata';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, '..', 'raw-data', 'translations');
const OUT_DIR = join(__dirname, '..', 'public', 'data');

// eBible's VPL codes first, then the USFM ones some files use, one row per book in canonical order.
const BOOK_CODES: string[][] = [
  ['GEN'], ['EXO'], ['LEV'], ['NUM'], ['DEU'], ['JOS'], ['JDG'], ['RUT'], ['1SA'], ['2SA'],
  ['1KI'], ['2KI'], ['1CH'], ['2CH'], ['EZR'], ['NEH'], ['EST'], ['JOB'], ['PSA'], ['PRO'],
  ['ECC'], ['SOL', 'SNG'], ['ISA'], ['JER'], ['LAM'], ['EZE', 'EZK'], ['DAN'], ['HOS'], ['JOE', 'JOL'], ['AMO'],
  ['OBA'], ['JON'], ['MIC'], ['NAH', 'NAM'], ['HAB'], ['ZEP'], ['HAG'], ['ZEC'], ['MAL'],
  ['MAT'], ['MAR', 'MRK'], ['LUK'], ['JOH', 'JHN'], ['ACT'], ['ROM'], ['1CO'], ['2CO'], ['GAL'], ['EPH'],
  ['PHI', 'PHP'], ['COL'], ['1TH'], ['2TH'], ['1TI'], ['2TI'], ['TIT'], ['PHM'], ['HEB'], ['JAM', 'JAS'],
  ['1PE'], ['2PE'], ['1JO', '1JN'], ['2JO', '2JN'], ['3JO', '3JN'], ['JUD'], ['REV'],
];
const codeToBook = new Map(BOOK_CODES.flatMap((codes, book) => codes.map(code => [code, book] as const)));

function verseIndex(book: number, chapter: number, verse: number): number | null {
  const counts = books[book].verseCounts;
  if (chapter < 1 || chapter > counts.length || verse < 1 || verse > counts[chapter - 1]) return null;
  let index = bookOffsets[book];
  for (let c = 0; c < chapter - 1; c++) index += counts[c];
  return index + verse - 1;
}

async function download(id: string, url: string): Promise<string> {
  const dir = join(RAW_DIR, id);
  const zipPath = join(dir, 'source.zip');
  mkdirSync(dir, { recursive: true });
  if (!existsSync(zipPath)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    writeFileSync(zipPath, Buffer.from(await response.arrayBuffer()));
    console.log(`Saved ${id}`);
  }
  const listing = execFileSync('unzip', ['-Z1', zipPath]).toString().split('\n');
  const entry = listing.find(name => name.endsWith('_vpl.txt'));
  if (!entry) throw new Error(`No VPL text in ${url}`);
  return execFileSync('unzip', ['-p', zipPath, entry], { maxBuffer: 64 * 1024 * 1024 }).toString('utf-8');
}

function parse(id: string, text: string): string[] {
  const verses = new Array<string>(totalVerses).fill('');
  let dropped = 0;
  let skippedBooks = 0;
  for (const raw of text.replace(/^﻿/, '').split('\n')) {
    const match = /^(\w{3}) (\d+):(\d+) (.*)$/.exec(raw.trim());
    if (!match) continue;
    const [, code, chapter, verse, body] = match;
    const book = codeToBook.get(code);
    // Books outside the 66, such as the Apocrypha, have no place in the cross-references.
    if (book === undefined) { skippedBooks++; continue; }
    const index = verseIndex(book, Number(chapter), Number(verse));
    if (index === null) { dropped++; continue; }
    // The KJV marks words its translators supplied with brackets, and paragraphs with ¶; the text reads without them.
    const clean = body.replace(/\[([^\]]*)\]/g, '$1').replace(/¶/g, '').replace(/\s+/g, ' ').trim();
    verses[index] = verses[index] ? `${verses[index]} ${clean}` : clean;
  }
  const empty = verses.filter(v => !v).length;
  console.log(`${id}: ${totalVerses - empty} verses, ${empty} empty, ${dropped} outside KJV numbering, ${skippedBooks} lines from other books`);
  return verses;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const translation of TRANSLATIONS) {
    if (!translation.source) continue;
    const text = await download(translation.id, translation.source);
    writeFileSync(join(OUT_DIR, translation.file), JSON.stringify(parse(translation.id, text)));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
