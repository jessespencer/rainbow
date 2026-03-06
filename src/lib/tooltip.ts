import { BOOKS } from '../data/books';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../data/categories';
import { getSampleKey, SAMPLE_REFS } from '../data/sampleReferences';
import type { Bin, Reference } from './dataWorker';

const tooltip = () => document.getElementById('tooltip')!;
const sidePanel = () => document.getElementById('side-panel')!;
const sidePanelContent = () => document.getElementById('side-panel-content')!;

export function showBinTooltip(bin: Bin, x: number, y: number) {
  const el = tooltip();
  const srcName = BOOKS[bin.sourceBook].name;
  const tgtName = BOOKS[bin.targetBook].name;
  const color = CATEGORY_COLORS[bin.category];
  const label = CATEGORY_LABELS[bin.category];

  el.innerHTML = `
    <div class="tt-cat" style="color:${color}">${label}</div>
    <div class="tt-books">${srcName} &harr; ${tgtName}</div>
    <div class="tt-count">${bin.count} connection${bin.count !== 1 ? 's' : ''}</div>
  `;
  el.classList.remove('hidden');
  el.style.left = `${x + 14}px`;
  el.style.top = `${y - 10}px`;
}

export function showHeatmapTooltip(
  row: number, col: number,
  count: number, dominantCat: number,
  x: number, y: number,
) {
  const el = tooltip();
  const srcName = BOOKS[row].name;
  const tgtName = BOOKS[col].name;
  const color = CATEGORY_COLORS[dominantCat];
  const label = CATEGORY_LABELS[dominantCat];

  el.innerHTML = `
    <div class="tt-books">${srcName} &harr; ${tgtName}</div>
    <div class="tt-count">${count} connection${count !== 1 ? 's' : ''}</div>
    <div class="tt-cat" style="color:${color}">Primary: ${label}</div>
  `;
  el.classList.remove('hidden');
  el.style.left = `${x + 14}px`;
  el.style.top = `${y - 10}px`;
}

export function hideTooltip() {
  tooltip().classList.add('hidden');
}

export function showSidePanel(bin: Bin, references: Reference[]) {
  const panel = sidePanel();
  const content = sidePanelContent();
  const srcName = BOOKS[bin.sourceBook].name;
  const tgtName = BOOKS[bin.targetBook].name;
  const color = CATEGORY_COLORS[bin.category];
  const label = CATEGORY_LABELS[bin.category];

  let html = `
    <div class="sp-header">
      <div class="sp-cat" style="color:${color}">${label}</div>
      <div class="sp-title">${srcName} &harr; ${tgtName}</div>
      <div class="sp-count">${bin.count} connection${bin.count !== 1 ? 's' : ''}</div>
    </div>
  `;

  // Show sample references with theological context if available
  const sampleKey = getSampleKey(bin.sourceBook, bin.targetBook);
  if (sampleKey && SAMPLE_REFS[sampleKey]) {
    html += '<div class="sp-samples">';
    for (const sample of SAMPLE_REFS[sampleKey]) {
      html += `
        <div class="sp-sample">
          <div class="sp-refs">
            <span class="sp-ref">${sample.source}</span>
            <span class="sp-arrow">&rarr;</span>
            <span class="sp-ref">${sample.target}</span>
          </div>
          <div class="sp-note">${sample.note}</div>
        </div>
      `;
    }
    html += '</div>';
  }

  // Show raw reference list with expand capability
  const INITIAL_COUNT = 20;
  if (bin.refIndices.length > 0) {
    html += '<div class="sp-reflist"><div class="sp-reflist-title">References</div>';
    html += '<div class="sp-refitems">';
    for (let i = 0; i < bin.refIndices.length; i++) {
      const ref = references[bin.refIndices[i]];
      const src = `${BOOKS[ref.s[0]].name} ${ref.s[1]}:${ref.s[2]}`;
      const tgt = `${BOOKS[ref.t[0]].name} ${ref.t[1]}:${ref.t[2]}`;
      const hidden = i >= INITIAL_COUNT ? ' class="sp-refitem sp-refitem-hidden"' : ' class="sp-refitem"';
      html += `<div${hidden}>${src} &harr; ${tgt}</div>`;
    }
    html += '</div>';
    if (bin.refIndices.length > INITIAL_COUNT) {
      html += `<button class="sp-show-all">Show all ${bin.refIndices.length} references</button>`;
    }
    html += '</div>';
  }

  content.innerHTML = html;
  panel.classList.remove('hidden');

  // Wire up expand button
  const showAllBtn = content.querySelector('.sp-show-all');
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      content.querySelectorAll('.sp-refitem-hidden').forEach(el => {
        el.classList.remove('sp-refitem-hidden');
      });
      showAllBtn.remove();
    });
  }
}

export function hideSidePanel() {
  sidePanel().classList.add('hidden');
}
