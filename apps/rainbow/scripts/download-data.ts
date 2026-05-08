// Download cross-references TSV from scrollmapper/bible_databases
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'raw-data');
const CROSS_REF_URL = 'https://a.openbible.info/data/cross-references.zip';

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  const outPath = join(DATA_DIR, 'cross_references.txt');
  if (existsSync(outPath)) {
    console.log('Already exists: cross_references.txt');
    return;
  }

  console.log('Downloading cross-references.zip...');
  const resp = await fetch(CROSS_REF_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${CROSS_REF_URL}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const zipPath = join(DATA_DIR, 'cross-references.zip');
  writeFileSync(zipPath, buf);
  console.log(`Saved zip (${(buf.length / 1024).toFixed(0)} KB)`);

  // Unzip
  const { execSync } = await import('child_process');
  execSync(`unzip -o "${zipPath}" -d "${DATA_DIR}"`);
  console.log('Extracted cross-references data');

  // List extracted files
  const files = execSync(`ls "${DATA_DIR}"`).toString();
  console.log('Files:', files);
}

main().catch(err => { console.error(err); process.exit(1); });
