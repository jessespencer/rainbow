// Download the raw OpenBible.info cross-references and the Berean Standard Bible text
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'raw-data');
const CROSS_REF_URL = 'https://a.openbible.info/data/cross-references.zip';
const BSB_URL = 'https://bereanbible.com/bsb.txt';

async function downloadBsb() {
  const outPath = join(DATA_DIR, 'bsb.txt');
  if (existsSync(outPath)) {
    console.log('Already exists: bsb.txt');
    return;
  }
  const resp = await fetch(BSB_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${BSB_URL}`);
  writeFileSync(outPath, Buffer.from(await resp.arrayBuffer()));
  console.log('Saved bsb.txt');
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });
  await downloadBsb();
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
