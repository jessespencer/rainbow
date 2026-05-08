import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { books } from './bible-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_COUNT = 63779;

// Category indices matching src/data/categories.ts
const CAT = {
  MESSIANIC: 0,
  LAW: 1,
  WISDOM: 2,
  PROPHECY: 3,
  PRAISE: 4,
  HISTORICAL: 5,
  CREATION: 6,
  REDEMPTION: 7,
} as const;

// Book group ranges (0-indexed)
type Range = [number, number];
const TORAH: Range = [0, 4];
const HISTORICAL_OT: Range = [5, 16];
const WISDOM_LIT: Range = [17, 21];
const MAJOR_PROPHETS: Range = [22, 26];
const MINOR_PROPHETS: Range = [27, 38];
const GOSPELS: Range = [39, 42];
const ACTS: Range = [43, 43];
const PAULINE: Range = [44, 56];
const GENERAL_EP: Range = [57, 64];
const REV: Range = [65, 65];
const ALL_OT: Range = [0, 38];
const ALL_NT: Range = [39, 65];
const ALL: Range = [0, 65];

// Single-book ranges
const GENESIS: Range = [0, 0];
const DEUT: Range = [4, 4];
const JOB: Range = [17, 17];
const PSALMS: Range = [18, 18];
const PROVERBS: Range = [19, 19];
const ISAIAH: Range = [22, 22];
const EZEKIEL: Range = [25, 25];
const DANIEL: Range = [26, 26];
const MATTHEW: Range = [39, 39];
const JOHN: Range = [42, 42];
const ROMANS: Range = [44, 44];
const HEBREWS: Range = [57, 57];
const SAMUEL_KINGS: Range = [8, 11];
const CHRONICLES: Range = [12, 13];

// Connection pattern: [sourceRange, targetRange, category, weight]
type Pattern = [Range, Range, number, number];

const patterns: Pattern[] = [
  // Messianic Prophecy / Fulfillment
  [MAJOR_PROPHETS, GOSPELS, CAT.MESSIANIC, 3500],
  [PSALMS, GOSPELS, CAT.MESSIANIC, 2000],
  [TORAH, GOSPELS, CAT.MESSIANIC, 1500],
  [ISAIAH, MATTHEW, CAT.MESSIANIC, 1800],
  [MINOR_PROPHETS, GOSPELS, CAT.MESSIANIC, 800],

  // Law & Covenant
  [TORAH, TORAH, CAT.LAW, 2500],
  [TORAH, PAULINE, CAT.LAW, 2800],
  [TORAH, HEBREWS, CAT.LAW, 1200],
  [DEUT, PAULINE, CAT.LAW, 1000],
  [PAULINE, PAULINE, CAT.LAW, 1000],
  [MINOR_PROPHETS, PAULINE, CAT.LAW, 600],

  // Wisdom cluster (self-contained)
  [WISDOM_LIT, WISDOM_LIT, CAT.WISDOM, 2200],
  [PSALMS, PROVERBS, CAT.WISDOM, 800],
  [WISDOM_LIT, GENERAL_EP, CAT.WISDOM, 600],
  [JOB, WISDOM_LIT, CAT.WISDOM, 400],

  // Prophecy & Apocalyptic
  [MAJOR_PROPHETS, REV, CAT.PROPHECY, 2500],
  [MINOR_PROPHETS, REV, CAT.PROPHECY, 1200],
  [DANIEL, REV, CAT.PROPHECY, 1800],
  [MAJOR_PROPHETS, MAJOR_PROPHETS, CAT.PROPHECY, 1500],
  [EZEKIEL, ISAIAH, CAT.PROPHECY, 600],
  [MINOR_PROPHETS, GENERAL_EP, CAT.PROPHECY, 400],
  [PAULINE, REV, CAT.PROPHECY, 400],
  [TORAH, REV, CAT.PROPHECY, 800],
  [HISTORICAL_OT, REV, CAT.PROPHECY, 500],

  // Praise & Worship
  [PSALMS, PSALMS, CAT.PRAISE, 1500],
  [PSALMS, PAULINE, CAT.PRAISE, 800],
  [PSALMS, HEBREWS, CAT.PRAISE, 900],
  [PSALMS, GENERAL_EP, CAT.PRAISE, 400],
  [PSALMS, REV, CAT.PRAISE, 600],

  // Historical Parallel
  [HISTORICAL_OT, HISTORICAL_OT, CAT.HISTORICAL, 2000],
  [GOSPELS, GOSPELS, CAT.HISTORICAL, 3000],
  [HISTORICAL_OT, ACTS, CAT.HISTORICAL, 600],
  [SAMUEL_KINGS, CHRONICLES, CAT.HISTORICAL, 800],
  [ACTS, PAULINE, CAT.HISTORICAL, 800],
  [ALL_OT, ALL_NT, CAT.HISTORICAL, 2000],

  // Creation & Cosmos
  [GENESIS, JOHN, CAT.CREATION, 1200],
  [GENESIS, PAULINE, CAT.CREATION, 800],
  [GENESIS, REV, CAT.CREATION, 600],
  [TORAH, JOHN, CAT.CREATION, 400],

  // Sin, Redemption & Grace
  [TORAH, PAULINE, CAT.REDEMPTION, 2000],
  [GENESIS, ROMANS, CAT.REDEMPTION, 1000],
  [MAJOR_PROPHETS, PAULINE, CAT.REDEMPTION, 1200],
  [GOSPELS, PAULINE, CAT.REDEMPTION, 1500],
  [ISAIAH, PAULINE, CAT.REDEMPTION, 800],
  [GOSPELS, REV, CAT.REDEMPTION, 500],
  [GENERAL_EP, GENERAL_EP, CAT.REDEMPTION, 300],
  [PAULINE, GENERAL_EP, CAT.REDEMPTION, 500],
  [ALL, ALL, CAT.REDEMPTION, 1500],
];

// Simple seeded PRNG for reproducibility
let seed = 42;
function random(): number {
  seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function randVerse(bookIdx: number): [number, number] {
  const book = books[bookIdx];
  const chap = randInt(1, book.chapters);
  const maxVerse = book.verseCounts[chap - 1];
  const verse = randInt(1, maxVerse);
  return [chap, verse];
}

interface Ref {
  s: [number, number, number];
  t: [number, number, number];
  cat: number;
}

const totalWeight = patterns.reduce((sum, p) => sum + p[3], 0);
const refs: Ref[] = [];
const seen = new Set<string>();

for (const [srcRange, tgtRange, cat, weight] of patterns) {
  const count = Math.round((weight / totalWeight) * TARGET_COUNT);

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    while (attempts < 5) {
      const srcBook = randInt(srcRange[0], srcRange[1]);
      const tgtBook = randInt(tgtRange[0], tgtRange[1]);

      // Allow same-book refs only for single-book ranges
      if (srcBook === tgtBook && (srcRange[0] !== srcRange[1] || tgtRange[0] !== tgtRange[1])) {
        attempts++;
        continue;
      }

      const [srcChap, srcVerse] = randVerse(srcBook);
      const [tgtChap, tgtVerse] = randVerse(tgtBook);

      const key = `${srcBook}:${srcChap}:${srcVerse}-${tgtBook}:${tgtChap}:${tgtVerse}`;
      if (seen.has(key)) {
        attempts++;
        continue;
      }
      seen.add(key);

      refs.push({
        s: [srcBook, srcChap, srcVerse],
        t: [tgtBook, tgtChap, tgtVerse],
        cat,
      });
      break;
    }
  }
}

// Pad to exact target
while (refs.length < TARGET_COUNT) {
  const srcBook = randInt(0, 65);
  let tgtBook = randInt(0, 65);
  while (tgtBook === srcBook) tgtBook = randInt(0, 65);
  const [sc, sv] = randVerse(srcBook);
  const [tc, tv] = randVerse(tgtBook);
  const cat = randInt(0, 7);
  refs.push({ s: [srcBook, sc, sv], t: [tgtBook, tc, tv], cat });
}

// Trim if over
if (refs.length > TARGET_COUNT) refs.length = TARGET_COUNT;

// Shuffle
for (let i = refs.length - 1; i > 0; i--) {
  const j = Math.floor(random() * (i + 1));
  [refs[i], refs[j]] = [refs[j], refs[i]];
}

const outPath = join(__dirname, '..', 'public', 'references.json');
writeFileSync(outPath, JSON.stringify(refs));

console.log(`Generated ${refs.length} references -> ${outPath}`);
console.log(`File size: ${(Buffer.byteLength(JSON.stringify(refs)) / 1024 / 1024).toFixed(1)} MB`);

// Stats
const catCounts = new Array(8).fill(0);
const bookOutbound = new Array(66).fill(0);
const bookInbound = new Array(66).fill(0);
for (const r of refs) {
  catCounts[r.cat]++;
  bookOutbound[r.s[0]]++;
  bookInbound[r.t[0]]++;
}

const catNames = ['Messianic', 'Law', 'Wisdom', 'Prophecy', 'Praise', 'Historical', 'Creation', 'Redemption'];
console.log('\nCategory distribution:');
catCounts.forEach((c: number, i: number) => console.log(`  ${catNames[i]}: ${c}`));

console.log('\nTop 10 outbound:');
bookOutbound
  .map((c: number, i: number) => ({ name: books[i].name, count: c }))
  .sort((a: {count: number}, b: {count: number}) => b.count - a.count)
  .slice(0, 10)
  .forEach((b: {name: string, count: number}) => console.log(`  ${b.name}: ${b.count}`));

console.log('\nTop 10 inbound:');
bookInbound
  .map((c: number, i: number) => ({ name: books[i].name, count: c }))
  .sort((a: {count: number}, b: {count: number}) => b.count - a.count)
  .slice(0, 10)
  .forEach((b: {name: string, count: number}) => console.log(`  ${b.name}: ${b.count}`));
