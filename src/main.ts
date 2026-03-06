import { loadBibleData, verseIndexToRef, parseVerseRef, type Arc, type BibleData } from './data/loader';
import { computeLayout, BOTTOM_REGION, type Layout } from './layout/book-layout';
import { createCanvasManager, clearCanvas, type CanvasManager } from './render/canvas-manager';
import { renderBookBars, computeChapterCounts, type ChapterCounts } from './render/book-bar-renderer';
import { renderArcs, renderHighlightedArcs, buildSpatialGrid, hitTestArc, type SpatialGrid, type ScreenTransform } from './render/arc-renderer';
import { THEME_COLORS, THEME_LABELS } from './render/theme-colors';
import { zoom, zoomIdentity, type ZoomBehavior, type D3ZoomEvent } from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';

// State
let data: BibleData;
let cm: CanvasManager;
let layout: Layout;
let grid: SpatialGrid;
let chapterCounts: ChapterCounts;
let zoomBehavior: ZoomBehavior<HTMLCanvasElement, unknown>;
let currentTransform = zoomIdentity;
let themeVisible: boolean[] = THEME_COLORS.map(() => true);
let minVotes = 10;
let highlightVerseIndex: number | null = null;
let hoveredArcIndex: number | null = null;
let selectedArcIndex: number | null = null;
let selectedVerseIndex: number | null = null;
let animFrame: number | null = null;

function setProgress(pct: number) {
  const el = document.getElementById('loading-progress');
  if (el) el.style.width = `${pct}%`;
}

function hideLoading() {
  document.getElementById('loading')?.classList.add('hidden');
}

function updateArcCount(count: number) {
  const el = document.getElementById('arc-count');
  if (el) el.textContent = count.toLocaleString();
}

function getScreenTransform(): ScreenTransform {
  return {
    k: currentTransform.k,
    tx: currentTransform.x,
    ty: currentTransform.y,
  };
}

function render() {
  if (!data || !cm || !layout) return;

  clearCanvas(cm);
  cm.ctx.save();
  // Identity transform (screen-space only, DPR-scaled)
  cm.ctx.setTransform(cm.dpr, 0, 0, cm.dpr, 0, 0);

  const transform = getScreenTransform();

  // Viewport bounds in world coordinates
  const viewportLeft = -currentTransform.x / currentTransform.k;
  const viewportRight = (cm.width - currentTransform.x) / currentTransform.k;

  // Render book bars (chapter histogram)
  renderBookBars(cm.ctx, layout, cm.width, cm.height, transform, chapterCounts);

  // Render arcs
  renderArcs(cm.ctx, data.arcs, layout, {
    themeVisible,
    minVotes,
    highlightVerseIndex,
    zoomK: currentTransform.k,
    viewportLeft,
    viewportRight,
    selectedArcIndex,
    selectedVerseIndex,
  }, transform);

  // Render search-highlighted arcs
  if (highlightVerseIndex !== null && highlightVerseIndex !== selectedVerseIndex) {
    renderHighlightedArcs(cm.ctx, data.arcs, layout, highlightVerseIndex, themeVisible, transform);
  }

  cm.ctx.restore();
}

function scheduleRender() {
  if (animFrame) return;
  animFrame = requestAnimationFrame(() => {
    animFrame = null;
    render();
  });
}

function setupZoom() {
  zoomBehavior = zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([0.5, 50])
    .on('zoom', (event: D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      currentTransform = event.transform;
      scheduleRender();
    });

  select(cm.canvas).call(zoomBehavior);
}

function setupHover() {
  const tooltip = document.getElementById('tooltip')!;

  cm.canvas.addEventListener('mousemove', (e) => {
    if (!grid) return;
    const rect = cm.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - currentTransform.x) / currentTransform.k;
    const my = (e.clientY - rect.top - currentTransform.y) / currentTransform.k;

    const hit = hitTestArc(mx, my, data.arcs, layout, grid, themeVisible, minVotes);

    if (hit !== null && hit !== hoveredArcIndex) {
      hoveredArcIndex = hit;
      const arc = data.arcs[hit];
      const from = verseIndexToRef(arc[0], data.books);
      const to = verseIndexToRef(arc[1], data.books);

      tooltip.innerHTML = `
        <div class="theme-label" style="color: ${THEME_COLORS[arc[3]]}">${THEME_LABELS[arc[3]]}</div>
        <div class="refs">${from} &harr; ${to}</div>
        <div class="votes">${arc[2]} vote${arc[2] !== 1 ? 's' : ''}</div>
      `;
      tooltip.classList.remove('hidden');
      tooltip.style.left = `${e.clientX + 12}px`;
      tooltip.style.top = `${e.clientY - 10}px`;
    } else if (hit === null) {
      hoveredArcIndex = null;
      tooltip.classList.add('hidden');
    } else {
      tooltip.style.left = `${e.clientX + 12}px`;
      tooltip.style.top = `${e.clientY - 10}px`;
    }
  });

  cm.canvas.addEventListener('mouseleave', () => {
    hoveredArcIndex = null;
    tooltip.classList.add('hidden');
  });
}

function setupClick() {
  const infoPanel = document.getElementById('info-panel')!;
  const infoContent = document.getElementById('info-content')!;
  const infoClose = document.getElementById('info-close')!;

  infoClose.addEventListener('click', () => {
    selectedArcIndex = null;
    selectedVerseIndex = null;
    infoPanel.classList.add('hidden');
    scheduleRender();
  });

  cm.canvas.addEventListener('click', (e) => {
    const rect = cm.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const mx = (screenX - currentTransform.x) / currentTransform.k;
    const my = (screenY - currentTransform.y) / currentTransform.k;

    // Check if click is on book bar region
    const barScreenY = layout.barY * currentTransform.k + currentTransform.y;
    if (screenY >= barScreenY && screenY <= barScreenY + 120) {
      // Click on bar: select verse
      const verseIdx = layout.xToVerse(mx);
      selectedVerseIndex = verseIdx;
      selectedArcIndex = null;
      showVerseInfo(verseIdx, infoPanel, infoContent);
      scheduleRender();
      return;
    }

    // Hit-test arcs
    const hit = hitTestArc(mx, my, data.arcs, layout, grid, themeVisible, minVotes);
    if (hit !== null) {
      selectedArcIndex = hit;
      selectedVerseIndex = null;
      showArcInfo(hit, infoPanel, infoContent);
      scheduleRender();
    } else {
      // Click on empty space: clear selection
      selectedArcIndex = null;
      selectedVerseIndex = null;
      infoPanel.classList.add('hidden');
      scheduleRender();
    }
  });
}

function setupVerseOverlay() {
  const overlay = document.getElementById('verse-overlay')!;
  const backdrop = document.getElementById('verse-overlay-backdrop')!;
  const closeBtn = document.getElementById('verse-overlay-close')!;

  function close() {
    overlay.classList.add('hidden');
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

function showVerseOverlay(verseIdx1: number, verseIdx2: number, themeColor: string) {
  const overlay = document.getElementById('verse-overlay')!;
  const cards = document.getElementById('verse-overlay-cards')!;
  const ref1 = verseIndexToRef(verseIdx1, data.books);
  const ref2 = verseIndexToRef(verseIdx2, data.books);

  cards.innerHTML = `
    <div class="verse-card">
      <div class="verse-card-ref" style="color: ${themeColor}">${ref1}</div>
      <div class="verse-card-text">${ref1}</div>
    </div>
    <div class="verse-card-divider"></div>
    <div class="verse-card">
      <div class="verse-card-ref" style="color: ${themeColor}">${ref2}</div>
      <div class="verse-card-text">${ref2}</div>
    </div>
  `;

  overlay.classList.remove('hidden');
}

function showArcInfo(arcIdx: number, panel: HTMLElement, content: HTMLElement) {
  const arc = data.arcs[arcIdx];
  const from = verseIndexToRef(arc[0], data.books);
  const to = verseIndexToRef(arc[1], data.books);
  const color = THEME_COLORS[arc[3]];

  content.innerHTML = `
    <div class="info-theme" style="color: ${color}">${THEME_LABELS[arc[3]]}</div>
    <div class="info-refs">
      <span class="info-ref" data-verse="${arc[0]}" data-other="${arc[1]}">${from}</span>
      <span class="info-arrow">&harr;</span>
      <span class="info-ref" data-verse="${arc[1]}" data-other="${arc[0]}">${to}</span>
    </div>
    <div class="info-votes">${arc[2]} vote${arc[2] !== 1 ? 's' : ''}</div>
  `;

  // Click a verse ref -> show overlay with both verses
  content.querySelectorAll('.info-ref').forEach(el => {
    el.addEventListener('click', () => {
      showVerseOverlay(arc[0], arc[1], color);
    });
  });

  panel.classList.remove('hidden');
}

function showVerseInfo(verseIdx: number, panel: HTMLElement, content: HTMLElement) {
  const ref = verseIndexToRef(verseIdx, data.books);

  // Find all arcs connected to this verse
  const connected: { arcIdx: number; otherVerse: number; votes: number; theme: number }[] = [];
  for (let i = 0; i < data.arcs.length; i++) {
    const arc = data.arcs[i];
    if (arc[0] === verseIdx || arc[1] === verseIdx) {
      const other = arc[0] === verseIdx ? arc[1] : arc[0];
      connected.push({ arcIdx: i, otherVerse: other, votes: arc[2], theme: arc[3] });
    }
  }
  connected.sort((a, b) => b.votes - a.votes);

  let html = `<div class="info-verse-title">${ref}</div>`;
  html += `<div class="info-count">${connected.length} cross-reference${connected.length !== 1 ? 's' : ''}</div>`;
  html += `<div class="info-ref-list">`;
  for (const c of connected.slice(0, 50)) {
    const otherRef = verseIndexToRef(c.otherVerse, data.books);
    const color = THEME_COLORS[c.theme];
    html += `<div class="info-ref-item" data-verse="${c.otherVerse}">
      <span class="info-dot" style="background:${color}"></span>
      <span>${otherRef}</span>
      <span class="info-item-votes">${c.votes}v</span>
    </div>`;
  }
  if (connected.length > 50) {
    html += `<div class="info-more">+ ${connected.length - 50} more</div>`;
  }
  html += `</div>`;

  content.innerHTML = html;

  // Make refs clickable
  content.querySelectorAll('.info-ref-item').forEach(el => {
    el.addEventListener('click', () => {
      const vi = parseInt((el as HTMLElement).dataset.verse!, 10);
      zoomToVerse(vi);
    });
  });

  panel.classList.remove('hidden');
}

function zoomToVerse(verseIdx: number) {
  const x = layout.verseToX(verseIdx);
  const k = 10;
  const txVal = cm.width / 2 - x * k;
  const tyVal = currentTransform.y;
  select(cm.canvas)
    .transition()
    .duration(750)
    .call(zoomBehavior.transform, zoomIdentity.translate(txVal, tyVal).scale(k));
}

function setupThemeFilters() {
  const container = document.getElementById('theme-filters')!;
  THEME_COLORS.forEach((color, i) => {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.innerHTML = `<span class="theme-dot" style="background:${color}"></span>${THEME_LABELS[i]}`;
    btn.addEventListener('click', () => {
      themeVisible[i] = !themeVisible[i];
      btn.classList.toggle('inactive', !themeVisible[i]);
      scheduleRender();
    });
    container.appendChild(btn);
  });
}

// Logarithmic slider: position 0-1000 maps to votes 0-1275
const MAX_VOTES = 1275;
function sliderToVotes(pos: number): number {
  if (pos === 0) return 0;
  const maxPos = 1000;
  return Math.round(Math.exp((pos / maxPos) * Math.log(MAX_VOTES + 1)) - 1);
}

function votesToSlider(votes: number): number {
  if (votes === 0) return 0;
  return Math.round((Math.log(votes + 1) / Math.log(MAX_VOTES + 1)) * 1000);
}

function setupVoteSlider() {
  const slider = document.getElementById('vote-slider') as HTMLInputElement;
  const valueEl = document.getElementById('vote-value')!;
  // Set initial slider position for minVotes=10
  slider.value = String(votesToSlider(minVotes));
  valueEl.textContent = String(minVotes);

  slider.addEventListener('input', () => {
    minVotes = sliderToVotes(parseInt(slider.value, 10));
    valueEl.textContent = String(minVotes);
    scheduleRender();
  });
}

function setupSearch() {
  const input = document.getElementById('verse-search') as HTMLInputElement;
  const searchBtn = document.getElementById('search-btn')!;
  const clearBtn = document.getElementById('clear-search-btn')!;

  function doSearch() {
    const idx = parseVerseRef(input.value, data.books);
    if (idx !== null) {
      highlightVerseIndex = idx;
      zoomToVerse(idx);
    }
  }

  searchBtn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  clearBtn.addEventListener('click', () => {
    highlightVerseIndex = null;
    input.value = '';
    select(cm.canvas)
      .transition()
      .duration(750)
      .call(zoomBehavior.transform, zoomIdentity);
  });
}

function setupZoomPresets() {
  const container = document.getElementById('zoom-presets')!;
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      let txVal = 0, tyVal = 0, k = 1;
      if (preset === 'all') {
        // Scale so the full width fits, and barY + bottom region fits in canvas height
        const kw = cm.width / layout.totalWidth;
        const totalWorldHeight = layout.barY + BOTTOM_REGION;
        const kh = cm.height / totalWorldHeight;
        k = Math.min(kw, kh);
        txVal = (cm.width - layout.totalWidth * k) / 2;
        tyVal = (cm.height - totalWorldHeight * k) / 2;
      } else if (preset === 'ot') {
        const otEnd = data.books[38].offset + data.books[38].verseCount;
        const otWidth = layout.verseToX(otEnd);
        k = cm.width / otWidth;
        txVal = 0;
      } else if (preset === 'nt') {
        const ntStart = layout.verseToX(data.books[39].offset);
        const ntEnd = layout.verseToX(data.totalVerses);
        const ntWidth = ntEnd - ntStart;
        k = cm.width / ntWidth;
        txVal = -ntStart * k;
      }
      select(cm.canvas)
        .transition()
        .duration(750)
        .call(zoomBehavior.transform, zoomIdentity.translate(txVal, tyVal).scale(k));
    });
  });
}

async function main() {
  data = await loadBibleData(setProgress);

  // Sort arcs by votes descending so LOD cutoff keeps the best arcs
  data.arcs.sort((a, b) => b[2] - a[2]);

  hideLoading();

  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  cm = createCanvasManager(canvas);

  layout = computeLayout(data.books, data.totalVerses, cm.width, cm.height);
  chapterCounts = computeChapterCounts(data.arcs, data.books);
  grid = buildSpatialGrid(data.arcs, layout);

  setupZoom();
  setupHover();
  setupClick();
  setupVerseOverlay();
  setupThemeFilters();
  setupVoteSlider();
  setupSearch();
  setupZoomPresets();

  // Set initial transform to fit all content including labels
  {
    const kw = cm.width / layout.totalWidth;
    const totalWorldHeight = layout.barY + BOTTOM_REGION;
    const kh = cm.height / totalWorldHeight;
    const k = Math.min(kw, kh);
    const txVal = (cm.width - layout.totalWidth * k) / 2;
    const tyVal = (cm.height - totalWorldHeight * k) / 2;
    const initialTransform = zoomIdentity.translate(txVal, tyVal).scale(k);
    select(cm.canvas).call(zoomBehavior.transform, initialTransform);
  }

  window.addEventListener('resize', () => {
    cm.resize();
    layout = computeLayout(data.books, data.totalVerses, cm.width, cm.height);
    grid = buildSpatialGrid(data.arcs, layout);
    scheduleRender();
  });

  render();
}

main().catch(err => {
  console.error('Failed to initialize:', err);
  const loadingText = document.getElementById('loading-text');
  if (loadingText) loadingText.textContent = `Error: ${err.message}`;
});
