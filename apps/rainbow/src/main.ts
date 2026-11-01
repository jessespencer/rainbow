import '@jessespencer/bible-ui/style.css';
import { createHeader, loadFonts } from '@jessespencer/bible-ui';
import { createElement, Shuffle, Scaling } from 'lucide';
import { CATEGORIES, CATEGORY_COLORS } from './data/categories';
import { BOOKS, OT_COUNT } from './data/books';
import { computeLayout, type Layout } from './lib/layout';
import { renderArcs, renderBookLabels, hitTestBin, createAnimation, getAnimationAlpha, type RenderOptions, type ScreenTransform, type AnimationState } from './lib/renderer';
import { buildHeatmapData, renderHeatmap, heatmapHitTest, type HeatmapData } from './lib/heatmap';
import { showBinTooltip, showHeatmapTooltip, hideTooltip, showSidePanel, hideSidePanel } from './lib/tooltip';
import { setupZoom, zoomTo, type ZoomState } from './lib/zoom';
import type { Bin, Reference, WorkerResult } from './lib/dataWorker';
import { setupDiscovery } from './lib/discovery';
import { setupExplorer } from './lib/explorer';
import { readContext, contextSearch, type ExploreContext } from './lib/context';
import type { GalaxyHandle, ColorMode } from './lib/galaxy';

// State
let bins: Bin[] = [];
let references: Reference[] = [];
let totalCount = 0;
let layout: Layout;
let zoomState: ZoomState;
let heatmapData: HeatmapData;
let animation: AnimationState | null = null;

let categoryVisible: boolean[] = CATEGORIES.map(() => true);
let focusedCategory: number | null = null;
let highlightBook: number | null = null;
let selectedBook: number | null = null;
let hoveredBin: Bin | null = null;
let selectedBin: Bin | null = null;
let viewMode: 'arcs' | 'heatmap' | 'galaxy' = 'arcs';
let galaxy: GalaxyHandle | null = null;
let galaxyLoading = false;
let galaxyPromise: Promise<void> | null = null;
let activePair: [number, number] | null = null;
let activeVerse: [number, number, number] | null = null;
let heatHover: { row: number; col: number } | null = null;
let restoring = false;
let contextReady = false;
let contextDepth = Number.isInteger(history.state?.explorationDepth) ? history.state.explorationDepth : 0;
let restorationVersion = 0;
let shuffleActive = false;
let shuffleRef: Reference | null = null;
let animFrame: number | null = null;
let filterDebounce: ReturnType<typeof setTimeout> | null = null;

// Canvas
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let shuffleCanvas: HTMLCanvasElement;
let shuffleCtx: CanvasRenderingContext2D;
let width = 0;
let height = 0;
let dpr = 1;

function resizeCanvas() {
  const container = canvas.parentElement!;
  const rect = container.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}

function clearCanvas() {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0B0D12';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function render() {
  if (!layout) return;
  clearCanvas();

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (viewMode === 'heatmap') {
    renderHeatmap(ctx, heatmapData, width, height, heatHover ?? (activePair ? {row:activePair[0],col:activePair[1]} : null));
  } else {
    const transform: ScreenTransform = { k: zoomState.k, tx: zoomState.tx, ty: zoomState.ty };

    // Apply animation alpha modifier if animating
    if (animation && !animation.done) {
      const elapsed = performance.now() - animation.startTime;
      if (elapsed >= animation.totalDuration) {
        animation.done = true;
      }
      // Render with per-category animation
      renderArcsAnimated(transform);
    } else {
      renderArcs(ctx, bins, layout, {
        categoryVisible,
        highlightBook,
        selectedBook,
        hoveredBin,
        selectedBin,
      }, transform);
    }

    renderBookLabels(ctx, layout, transform, highlightBook, selectedBook, activePair ?? (hoveredBin ? [hoveredBin.sourceBook, hoveredBin.targetBook] : null));
  }

  ctx.restore();

  // Render highlighted arc on shuffle overlay canvas
  if (shuffleActive) {
    renderShuffleArc();
  }

  if (animation && !animation.done) {
    animFrame = requestAnimationFrame(() => { animFrame = null; render(); });
  }
}

function renderArcsAnimated(transform: ScreenTransform) {
  if (!animation) return;
  const { k, tx, ty } = transform;
  const baseY = layout.baselineY;

  // Sort by span descending so shorter arcs render on top of longer ones
  const sorted = [...bins].sort((a, b) => {
    const spanA = Math.abs(a.targetBook - a.sourceBook);
    const spanB = Math.abs(b.targetBook - b.sourceBook);
    return spanB - spanA;
  });

  for (const bin of sorted) {
    if (!categoryVisible[bin.category]) continue;

    const alpha = getAnimationAlpha(animation, bin.category);
    if (alpha <= 0) continue;

    const x1 = layout.books[bin.sourceBook].centerX;
    const x2 = layout.books[bin.targetBook].centerX;

    const sx1 = x1 * k + tx;
    const sx2 = x2 * k + tx;
    const sy = baseY * k + ty;
    const midX = (sx1 + sx2) / 2;
    const radius = Math.abs(sx2 - sx1) / 2;

    const baseAlpha = 0.3 + 0.55 * Math.min(1, Math.log(bin.count + 1) / Math.log(500));
    const lineWidth = 1 + 3 * Math.min(1, Math.log(bin.count + 1) / Math.log(500));

    // Fade from 50% to 100% of base alpha during animation
    const opacityScale = 0.5 + 0.5 * alpha;

    ctx.strokeStyle = CATEGORY_COLORS[bin.category];
    ctx.globalAlpha = baseAlpha * opacityScale;
    ctx.lineWidth = lineWidth;

    // Animate: grow radius from 0 to full
    ctx.beginPath();
    ctx.arc(midX, sy, radius * alpha, Math.PI, 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function renderShuffleArc() {
  // Size the shuffle canvas to full viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  shuffleCanvas.width = vw * dpr;
  shuffleCanvas.height = vh * dpr;
  shuffleCanvas.style.width = `${vw}px`;
  shuffleCanvas.style.height = `${vh}px`;
  shuffleCtx.clearRect(0, 0, shuffleCanvas.width, shuffleCanvas.height);

  if (!shuffleRef || !layout) return;

  // Get the canvas container offset relative to the viewport
  const containerRect = canvas.parentElement!.getBoundingClientRect();
  const offsetX = containerRect.left;
  const offsetY = containerRect.top;

  const src = Math.min(shuffleRef.s[0], shuffleRef.t[0]);
  const tgt = Math.max(shuffleRef.s[0], shuffleRef.t[0]);

  const x1 = layout.books[src].centerX;
  const x2 = layout.books[tgt].centerX;
  const { k, tx, ty } = zoomState;
  const sx1 = x1 * k + tx + offsetX;
  const sx2 = x2 * k + tx + offsetX;
  const sy = layout.baselineY * k + ty + offsetY;
  const midX = (sx1 + sx2) / 2;
  const radius = Math.abs(sx2 - sx1) / 2;

  shuffleCtx.save();
  shuffleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Glow
  shuffleCtx.strokeStyle = CATEGORY_COLORS[shuffleRef.cat];
  shuffleCtx.lineWidth = 6;
  shuffleCtx.globalAlpha = 0.4;
  shuffleCtx.beginPath();
  shuffleCtx.arc(midX, sy, radius, Math.PI, 0);
  shuffleCtx.stroke();

  // Solid arc
  shuffleCtx.lineWidth = 2.5;
  shuffleCtx.globalAlpha = 1.0;
  shuffleCtx.beginPath();
  shuffleCtx.arc(midX, sy, radius, Math.PI, 0);
  shuffleCtx.stroke();

  shuffleCtx.restore();
}

function fitRainbowToView(animated: boolean) {
  const padding = 20;
  const labelSpace = 30;

  // Rainbow bounding box in world coords
  const left = layout.books[0].left;
  const right = layout.books[65].left + layout.books[65].width;
  const rainbowWidth = right - left;
  const maxRadius = rainbowWidth / 2;
  const top = layout.baselineY - maxRadius;
  const bottom = layout.baselineY + labelSpace;
  const rainbowHeight = bottom - top;

  // Scale to fit with padding
  const scaleX = (width - padding * 2) / rainbowWidth;
  const scaleY = (height - padding * 2) / rainbowHeight;
  const k = Math.min(scaleX, scaleY) * 0.94;

  // Center horizontally and vertically
  const contentW = rainbowWidth * k;
  const contentH = rainbowHeight * k;
  const tx = (width - contentW) / 2 - left * k;
  const ty = (height - contentH) / 2 - top * k;

  zoomTo(canvas, zoomState, k, tx, ty, animated);
}

function scheduleRender() {
  if (animFrame) return;
  animFrame = requestAnimationFrame(() => { animFrame = null; render(); });
}

function debouncedRender() {
  if (filterDebounce) clearTimeout(filterDebounce);
  filterDebounce = setTimeout(() => { scheduleRender(); }, 150);
}

function currentContext(): ExploreContext {
  return { view: viewMode, book: selectedBook, pair: activePair, verse: activeVerse, category: focusedCategory };
}
function recordContext() {
  if (!contextReady) return;
  const context = currentContext();
  const search = contextSearch(context);
  if (!restoring && search !== location.search) {
    contextDepth++;
    history.pushState({ explorationDepth: contextDepth }, '', search);
  }
  const labels = [viewMode === 'arcs' ? 'Arcs' : viewMode === 'heatmap' ? 'Heatmap' : 'Galaxy'];
  if (selectedBook !== null) labels.push(BOOKS[selectedBook].name);
  if (activePair) labels.push(`${BOOKS[activePair[0]].name} ↔ ${BOOKS[activePair[1]].name}`);
  if (activeVerse) labels.push(`${BOOKS[activeVerse[0]].name} ${activeVerse[1]}:${activeVerse[2]}`);
  if (focusedCategory !== null && viewMode !== 'galaxy') labels.push(CATEGORIES[focusedCategory].label);
  document.getElementById('exploration-location')!.textContent = labels.join(' › ');
  (document.getElementById('exploration-back') as HTMLButtonElement).disabled = contextDepth <= 0;
}
function selectBook(book: number) {
  selectedBook = book; activePair = null; activeVerse = null; selectedBin = null;
  highlightBook = null;
  hideSidePanel();
  if (viewMode === 'galaxy') galaxy?.focusBook(book);
  updateClearButton(); scheduleRender(); recordContext();
}
function selectPair(a: number, b: number) {
  activePair = [a,b]; activeVerse = null;
  const matching = bins.filter(bin => categoryVisible[bin.category] &&
    ((bin.sourceBook === a && bin.targetBook === b) || (bin.sourceBook === b && bin.targetBook === a)));
  selectedBin = matching.slice().sort((x,y)=>y.count-x.count)[0] ?? null;
  const panel = document.getElementById('side-panel')!;
  const content = document.getElementById('side-panel-content')!;
  content.replaceChildren();
  const heading = document.createElement('h3'); heading.className = 'sp-title';
  heading.textContent = `${BOOKS[a].name} ↔ ${BOOKS[b].name}`;
  const count = matching.reduce((n,bin)=>n+bin.count,0);
  const meta = document.createElement('p'); meta.className = 'sp-meta';
  meta.textContent = `${count.toLocaleString()} connections in the selected themes. Choose a verse to explore its neighborhood in Galaxy.`;
  content.append(heading,meta);
  const indices = matching.flatMap(bin=>bin.refIndices);
  let shown = 0;
  const more = document.createElement('button'); more.className = 'sp-show-more'; more.textContent = 'Show more references';
  const append = () => {
    const keepFocus = document.activeElement === more;
    const priorCount = content.querySelectorAll('.sp-link').length;
    more.remove();
    indices.slice(shown,shown+30).forEach(index=>{
      const ref = references[index];
      const row = document.createElement('div'); row.className = 'reference-pair';
      for (const verse of [ref.s,ref.t]) {
        const button = document.createElement('button'); button.className = 'sp-link';
        button.textContent = `${BOOKS[verse[0]].name} ${verse[1]}:${verse[2]}`;
        button.addEventListener('click',()=>openVerse(verse)); row.append(button);
      }
      content.append(row);
    });
    shown += 30;
    if(shown<indices.length) content.append(more);
    if (keepFocus) content.querySelectorAll<HTMLButtonElement>('.sp-link')[priorCount]?.focus();
  };
  more.addEventListener('click',append); append();
  const source = document.createElement('p'); source.className = 'sp-hint';
  source.textContent = 'Synthetic demo connections generated for visual exploration. These pairs and theme assignments are not verified scriptural cross-references. Discover a connection contains separately sourced readings.';
  content.prepend(source);
  panel.classList.remove('hidden');
  updateClearButton(); scheduleRender(); recordContext();
}
async function openVerse(verse: [number,number,number]) {
  activeVerse = verse; selectedBook = verse[0]; activePair = null;
  document.getElementById('view-galaxy')!.click();
  await ensureGalaxy();
  const found = viewMode !== 'galaxy' || !galaxy || galaxy.focusVerse(verse);
  recordContext();
  if (!found) document.getElementById('exploration-location')!.textContent = 'This verse is not in the demo graph. Choose another verse from Explore references.';
}
async function restoreContext() {
  const version = ++restorationVersion;
  restoring = true;
  const c = readContext(location.search);
  focusedCategory = c.category;
  categoryVisible = CATEGORIES.map((_,i)=>c.category === null || c.category === i);
  document.querySelectorAll<HTMLButtonElement>('.cat-pill').forEach((b,i)=>{
    b.classList.toggle('focused',i === c.category);
    b.classList.toggle('inactive',c.category !== null && i !== c.category);
    b.setAttribute('aria-pressed',String(i === c.category));
  });
  selectedBook = c.book; activePair = c.pair; activeVerse = c.verse; selectedBin = null;
  refreshHeatmap();
  document.getElementById(`view-${c.view}`)!.click();
  if (c.view === 'galaxy') {
    await ensureGalaxy();
    if (version !== restorationVersion) return;
    if (c.verse) galaxy?.focusVerse(c.verse);
    else if (c.pair && galaxy) { galaxy.focusPair(...c.pair); selectPair(...c.pair); syncFocusedLayers(); }
    else if (c.book !== null) galaxy?.focusBook(c.book);
    else galaxy?.clearSelection();
  } else if (c.pair) selectPair(...c.pair);
  updateClearButton(); scheduleRender(); recordContext(); restoring = false;
}

function refreshHeatmap() {
  heatmapData = buildHeatmapData(bins, categoryVisible);
  hideTooltip();
  const legend = document.getElementById('heatmap-scale')!;
  legend.textContent = heatmapData.maxCount > 0
    ? `Fewer connections → ${heatmapData.maxCount.toLocaleString()} (brightest)`
    : 'No connections in this selection';
}

function updateViewContext() {
  document.getElementById("app")!.classList.toggle("heatmap-mode", viewMode === "heatmap");
  hideTooltip();
  hideSidePanel();
  const descriptions = {
    arcs: 'Each arc groups synthetic demo connections between two books within a theme. Select a book or arc to explore.',
    heatmap: 'Each cell counts connections between two books. Color shows the leading theme; brightness shows the count on a logarithmic scale. Filters recalculate counts and brightness. OT/NT group the books when space is tight; use Explore references for precise selection.',
    galaxy: 'Each star is a verse in the demo graph. Select a star to explore; drag to orbit and pinch or scroll to zoom.',
  };
  document.getElementById('view-description')!.textContent = descriptions[viewMode];
  document.getElementById('heatmap-legend')!.hidden = viewMode !== 'heatmap';
  galaxy?.setActive(viewMode === 'galaxy');
  recordContext();
}

// UI Setup
function setupFilters() {
  const container = document.getElementById('category-filters')!;
  const buttons: HTMLButtonElement[] = [];

  CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill';
    btn.setAttribute('aria-pressed', 'false');
    btn.title = `Show only ${cat.label}; select again to show all themes`;
    btn.innerHTML = `<span class="cat-dot" style="background:${cat.color}"></span>${cat.label}`;
    btn.addEventListener('click', () => {
      if (focusedCategory === i) {
        // Unfocus — show all
        focusedCategory = null;
        categoryVisible = CATEGORIES.map(() => true);
      } else {
        // Focus this category
        focusedCategory = i;
        categoryVisible = CATEGORIES.map((_, j) => j === i);
      }
      // Update button styles
      buttons.forEach((b, j) => {
        b.setAttribute('aria-pressed', String(focusedCategory === j));
        b.classList.toggle('focused', focusedCategory === j);
        b.classList.toggle('inactive', focusedCategory !== null && focusedCategory !== j);
      });
      refreshHeatmap();
      if (activePair) selectPair(...activePair);
      recordContext();
      updateClearButton();
      scheduleRender();
    });
    buttons.push(btn);
    container.appendChild(btn);
  });

  // Clear filters button (in canvas-controls-left, next to shuffle)
  const clearBtn = document.getElementById('clear-filters')!;
  clearBtn.addEventListener('click', () => {
    focusedCategory = null;
    categoryVisible = CATEGORIES.map(() => true);
    selectedBook = null;
    galaxy?.clearSelection();
    activePair = null; activeVerse = null;
    selectedBin = null;
    highlightBook = null;
    hideSidePanel();
    buttons.forEach(b => {
      b.classList.remove('focused', 'inactive');
      b.setAttribute('aria-pressed', 'false');
    });
    refreshHeatmap();
    recordContext();
    updateClearButton();
    scheduleRender();
  });

  updateClearButton = () => {
    const hasFilter = focusedCategory !== null || selectedBook !== null || selectedBin !== null || activePair !== null || activeVerse !== null;
    clearBtn.classList.toggle('visible', hasFilter);
  };
}

let updateClearButton: () => void = () => {};

function fitBooksToView(startBook: number, endBook: number, animated: boolean) {
  const padding = 20;
  const labelSpace = 30;

  const left = layout.books[startBook].left;
  const right = layout.books[endBook].left + layout.books[endBook].width;
  const rainbowWidth = right - left;
  const maxRadius = rainbowWidth / 2;
  const top = layout.baselineY - maxRadius;
  const bottom = layout.baselineY + labelSpace;
  const rainbowHeight = bottom - top;

  const scaleX = (width - padding * 2) / rainbowWidth;
  const scaleY = (height - padding * 2) / rainbowHeight;
  const k = Math.min(scaleX, scaleY);

  const tx = (width - rainbowWidth * k) / 2 - left * k;
  const ty = padding - top * k;

  zoomTo(canvas, zoomState, k, tx, ty, animated);
}

function setupZoomPresets() {
  const fitBtn = document.getElementById('zoom-fit')!;
  const otBtn = document.getElementById('zoom-ot')!;
  const ntBtn = document.getElementById('zoom-nt')!;

  fitBtn.addEventListener('click', () => {
    otBtn.classList.remove('active');
    ntBtn.classList.remove('active');
    fitRainbowToView(true);
  });

  otBtn.addEventListener('click', () => {
    const wasActive = otBtn.classList.contains('active');
    otBtn.classList.toggle('active');
    ntBtn.classList.remove('active');
    if (wasActive) {
      fitRainbowToView(true);
    } else {
      fitBooksToView(0, OT_COUNT - 1, true);
    }
  });

  ntBtn.addEventListener('click', () => {
    const wasActive = ntBtn.classList.contains('active');
    ntBtn.classList.toggle('active');
    otBtn.classList.remove('active');
    if (wasActive) {
      fitRainbowToView(true);
    } else {
      fitBooksToView(OT_COUNT, 65, true);
    }
  });
}

function setupViewToggle() {
  const arcBtn = document.getElementById('view-arcs')!;
  const heatBtn = document.getElementById('view-heatmap')!;
  const uniBtn = document.getElementById('view-galaxy')!;
  const container = document.getElementById('app')!;

  const setActive = (active: HTMLElement) => {
    [arcBtn, heatBtn, uniBtn].forEach((b) => {
      b.classList.toggle('active', b === active);
      b.setAttribute('aria-pressed', String(b === active));
    });
  };

  setActive(arcBtn);

  arcBtn.addEventListener('click', () => {
    viewMode = 'arcs';
    updateViewContext();
    setActive(arcBtn);
    container.classList.remove('galaxy-mode');
    if (activePair) selectPair(...activePair);
    scheduleRender();
  });

  heatBtn.addEventListener('click', () => {
    viewMode = 'heatmap';
    updateViewContext();
    setActive(heatBtn);
    container.classList.remove('galaxy-mode');
    if (activePair) selectPair(...activePair);
    scheduleRender();
  });

  uniBtn.addEventListener('click', async () => {
    viewMode = 'galaxy';
    updateViewContext();
    setActive(uniBtn);
    container.classList.add('galaxy-mode');
    await ensureGalaxy();
    galaxy?.setActive(viewMode === 'galaxy');
    if (viewMode !== 'galaxy') return;
    galaxy?.resize();
    // first open plays the built-in fly-in intro; only re-frame on return
    if (activeVerse) galaxy?.focusVerse(activeVerse);
    else if (activePair && galaxy) { galaxy.focusPair(...activePair); selectPair(...activePair); syncFocusedLayers(); }
    else if (selectedBook !== null) galaxy?.focusBook(selectedBook);
  });
}

async function ensureGalaxy() {
  if (galaxy || references.length === 0) return;
  if (galaxyPromise) return galaxyPromise;
  galaxyPromise = loadGalaxy().finally(() => { galaxyPromise = null; });
  return galaxyPromise;
}
async function loadGalaxy() {
  galaxyLoading = true;
  const host = document.getElementById('galaxy-container')!;
  try {
  host.replaceChildren();
  const { createGalaxy } = await import('./lib/galaxy');
  galaxy = createGalaxy(host, references, {
    onHover: (info, screen) => {
      const tip = document.getElementById('tooltip')!;
      if (!info) { tip.classList.add('hidden'); return; }
      tip.innerHTML =
        `<strong>${info.label}</strong><span class="tt-sub">${info.degree} connection${info.degree === 1 ? '' : 's'}</span>`;
      tip.style.left = `${screen[0] + 14}px`;
      tip.style.top = `${screen[1] + 14}px`;
      tip.classList.remove('hidden');
    },
    onSelect: (info, neighbours) => {
      const panel = document.getElementById('side-panel')!;
      const content = document.getElementById('side-panel-content')!;
      if (!info) { activeVerse = null; panel.classList.add('hidden'); recordContext(); return; }
      activeVerse = [info.book,info.chapter,info.verse];
      selectedBook = info.book; activePair = null;
      syncFocusedLayers();
      recordContext();
      const shown = neighbours.slice(0, 80);
      const items = shown.map((nb) =>
        `<button class="sp-link" data-id="${nb.id}">` +
        `<span class="sp-link-ref">${nb.label}</span>` +
        `<span class="sp-link-deg">${nb.degree}</span></button>`).join('');
      content.innerHTML =
        `<h3 class="sp-title">${info.label}</h3><p class="sp-hint">Synthetic demo connections · not verified cross-references.</p>` +
        `<p class="sp-meta">${info.degree} demo connection${info.degree === 1 ? '' : 's'} — ` +
        `lit in white. Click any verse below to fly to it.</p>` +
        `<div class="sp-neighbours">${items}</div>` +
        (neighbours.length > shown.length
          ? `<p class="sp-hint">+${neighbours.length - shown.length} more connections</p>` : '');
      panel.classList.remove('hidden');
      content.querySelectorAll<HTMLElement>('.sp-link').forEach((el) => {
        el.addEventListener('click', () => galaxy?.focusNode(Number(el.dataset.id)));
      });
    },
  });
  galaxyLoading = false;
  document.getElementById('app')!.classList.remove('galaxy-unavailable');
  setupGalaxyPanel();
  galaxy.setActive(viewMode === 'galaxy');
  } catch {
    document.getElementById('app')!.classList.add('galaxy-unavailable');
    host.replaceChildren();
    const message = document.createElement('p'); message.className = 'view-error';
    message.textContent = 'The 3D view could not start on this device. Explore references offers the same data as a readable list, or return to Arcs.';
    const retry = document.createElement('button'); retry.className = 'canvas-btn'; retry.textContent = 'Retry 3D';
    retry.addEventListener('click', async () => {
      await ensureGalaxy();
      if (viewMode !== 'galaxy' || !galaxy) return;
      if (activeVerse) galaxy.focusVerse(activeVerse);
      else if (activePair) { galaxy.focusPair(...activePair); selectPair(...activePair); syncFocusedLayers(); }
      else if (selectedBook !== null) galaxy.focusBook(selectedBook);
      document.getElementById('view-galaxy')!.focus();
    });
    host.append(message,retry);
  } finally { galaxyLoading = false; }
}

function syncFocusedLayers() {
  document.querySelectorAll('[data-layer="edges"], [data-layer="bridges"]').forEach(row => {
    row.classList.remove('active'); row.setAttribute('aria-checked','false');
    row.querySelector('.u-switch')?.classList.remove('on');
  });
}

function setupGalaxyPanel() {
  if (!galaxy) return;
  const edgesRow = document.querySelector('[data-layer="edges"]')!;
  const bridgesRow = document.querySelector('[data-layer="bridges"]')!;
  const labelsRow = document.querySelector('[data-layer="labels"]')!;
  const colorSeg = document.getElementById('up-color')!;
  const sizeSeg = document.getElementById('up-size')!;
  const fitBtn = document.getElementById('up-fit')!;

  const setRow = (row: Element, on: boolean) => {
    row.classList.toggle('active', on);
    row.setAttribute('aria-checked', String(on));
    row.querySelector('.u-switch')!.classList.toggle('on', on);
  };
  const isOn = (row: Element) => row.classList.contains('active');

  edgesRow.addEventListener('click', () => {
    const on = !isOn(edgesRow);
    setRow(edgesRow, on);
    if (on && isOn(bridgesRow)) setRow(bridgesRow, false); // mutually exclusive
    galaxy!.setBridgesOnly(isOn(bridgesRow));
    galaxy!.setShowEdges(on);
  });
  bridgesRow.addEventListener('click', () => {
    const on = !isOn(bridgesRow);
    setRow(bridgesRow, on);
    setRow(edgesRow, !on); // edges <-> bridges are the two faces of one control
    galaxy!.setBridgesOnly(on);
  });
  labelsRow.addEventListener('click', () => {
    const on = !isOn(labelsRow);
    setRow(labelsRow, on);
    galaxy!.setShowLabels(on);
  });
  fitBtn.addEventListener('click', () => { galaxy!.fit(); activeVerse = null; activePair = null; selectedBook = null; hideSidePanel(); recordContext(); });

  const wireSeg = (seg: HTMLElement, apply: (mode: string) => void) => {
    seg.querySelectorAll('button').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.classList.contains('on')));
      btn.addEventListener('click', () => {
        seg.querySelectorAll('button').forEach((b) => {
          b.classList.remove('on');
          b.setAttribute('aria-pressed', String(b === btn));
        });
        btn.classList.add('on');
        apply(btn.dataset.mode!);
      });
    });
  };
  wireSeg(colorSeg, (m) => galaxy!.setColorMode(m as ColorMode));
  wireSeg(sizeSeg, (m) => galaxy!.setSizeMode(m as 'uniform' | 'connections'));
}

function setupSearch() {
  const input = document.getElementById('book-search') as HTMLInputElement;
  const results = document.createElement('div'); results.id = 'book-results'; results.hidden = true;
  results.setAttribute('role','group'); results.setAttribute('aria-label','Matching books');
  input.after(results);
  input.addEventListener('input',()=>{
    results.replaceChildren();
    const query = input.value.trim().toLowerCase(); results.hidden = !query;
    if(!query) return;
    const matches = BOOKS.map((book,index)=>({...book,index})).filter(book=>book.name.toLowerCase().includes(query)||book.abbr.toLowerCase().startsWith(query));
    if(!matches.length) { results.textContent = 'No books found. Try Genesis or John.'; return; }
    matches.forEach(book=>{
      const b = document.createElement('button'); b.textContent = book.name;
      b.addEventListener('click',()=>{ selectBook(book.index); input.value = book.name; results.hidden = true; input.focus(); });
      results.append(b);
    });
  });
  input.addEventListener('keydown',e=>{
    if(e.key === 'ArrowDown') { e.preventDefault(); results.querySelector('button')?.focus(); }
    if(e.key === 'Enter') { e.preventDefault(); results.querySelector('button')?.click(); }
    if(e.key === 'Escape') { e.stopPropagation(); results.hidden = true; }
  });
  results.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();results.hidden=true;input.focus();}});
  document.addEventListener('click',e=>{ if(e.target!==input && !results.contains(e.target as Node)) results.hidden=true; });
}

function setupShuffle() {
  const overlay = document.getElementById('shuffle-overlay') as HTMLDialogElement;
  const verse1 = document.getElementById('shuffle-verse-1')!;
  const verse2 = document.getElementById('shuffle-verse-2')!;
  const btn = document.getElementById('btn-shuffle')!;
  const btnAgain = document.getElementById('btn-shuffle-again')!;

  function doShuffle() {
    if (references.length === 0) return;

    // Pick a random reference
    const idx = Math.floor(Math.random() * references.length);
    const ref = references[idx];
    shuffleRef = ref;
    shuffleActive = true;

    const srcName = `${BOOKS[ref.s[0]].name} ${ref.s[1]}:${ref.s[2]}`;
    const tgtName = `${BOOKS[ref.t[0]].name} ${ref.t[1]}:${ref.t[2]}`;
    verse1.textContent = srcName;
    verse2.textContent = tgtName;

    overlay.classList.remove('hidden');
    if (!overlay.open) overlay.showModal();
    btnAgain.focus();
    scheduleRender();
  }

  const content = document.getElementById('shuffle-content')!;
  const btnExit = document.getElementById('btn-shuffle-exit')!;

  function dismissShuffle() {
    shuffleActive = false;
    shuffleRef = null;
    overlay.classList.add('hidden');
    overlay.close(); btn.focus();
    scheduleRender();
  }

  overlay.addEventListener('cancel', e => { e.preventDefault(); dismissShuffle(); });
  overlay.addEventListener('keydown', e => { if(e.key === 'Escape') e.stopPropagation(); });
  btn.addEventListener('click', doShuffle);
  btnAgain.addEventListener('click', (e) => {
    e.stopPropagation();
    doShuffle();
  });
  btnExit.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissShuffle();
  });

  // Prevent clicks on content (text selection) from dismissing
  content.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Click overlay background to dismiss
  overlay.addEventListener('click', dismissShuffle);
}

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    hideTooltip();
    if (shuffleActive) { document.getElementById('btn-shuffle-exit')!.click(); return; }
    // Don't intercept Escape when typing in an input
    if (document.activeElement instanceof HTMLInputElement) {
      (document.activeElement as HTMLInputElement).blur();
      return;
    }

    const hasFilter = focusedCategory !== null || selectedBook !== null || selectedBin !== null || activePair !== null || activeVerse !== null;
    if (!hasFilter) return;

    // Clear all filters (same as clear button)
    document.getElementById('clear-filters')!.click();
  });
}

function setupInteraction() {
  // Hover
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (viewMode === 'heatmap') {
      const hit = heatmapHitTest(screenX, screenY, width, height);
      heatHover = hit; scheduleRender();
      if (hit) {
        const key = hit.row * 66 + hit.col;
        const count = heatmapData.matrix[key];
        if (count > 0) {
          showHeatmapTooltip(hit.row, hit.col, count, heatmapData.dominantCat[key], e.clientX, e.clientY);
        } else {
          hideTooltip();
        }
      } else {
        hideTooltip();
      }
      return;
    }

    // Arc view: transform to world coords
    const mx = (screenX - zoomState.tx) / zoomState.k;
    const my = (screenY - zoomState.ty) / zoomState.k;

    // Check if hovering over book label area (below baseline)
    const baselineScreen = layout.baselineY * zoomState.k + zoomState.ty;
    if (screenY > baselineScreen - 2 && screenY < baselineScreen + 40) {
      let hitBook: number | null = null;
      for (const book of layout.books) {
        if (mx >= book.left && mx < book.left + book.width) {
          hitBook = book.index;
          break;
        }
      }
      if (hitBook !== highlightBook) {
        highlightBook = hitBook;
        hoveredBin = null;
        hideTooltip();
        canvas.style.cursor = hitBook !== null ? 'pointer' : 'default';
        scheduleRender();
      }
      return;
    }

    // Clear book highlight when not over labels (but keep selectedBook)
    if (highlightBook !== null) {
      highlightBook = null;
      scheduleRender();
    }

    const tolerance = 8 / zoomState.k;
    const hit = hitTestBin(mx, my, bins, layout, categoryVisible, tolerance, selectedBook);

    if (hit !== hoveredBin) {
      hoveredBin = hit;
      scheduleRender();
    }

    if (hit) {
      showBinTooltip(hit, e.clientX, e.clientY);
      canvas.style.cursor = 'pointer';
    } else {
      hideTooltip();
      canvas.style.cursor = 'default';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    heatHover = null;
    hoveredBin = null;
    highlightBook = null;
    hideTooltip();
    // Keep selectedBook — it persists until explicitly toggled
    scheduleRender();
  });

  // Click
  canvas.addEventListener('click', (e) => {
    if (viewMode === 'heatmap') {
      const rect = canvas.getBoundingClientRect();
      const hit = heatmapHitTest(e.clientX-rect.left,e.clientY-rect.top,width,height);
      if(hit) selectPair(hit.row,hit.col);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const mx = (screenX - zoomState.tx) / zoomState.k;
    const my = (screenY - zoomState.ty) / zoomState.k;

    // Check if clicking on a book label
    const baselineScreen = layout.baselineY * zoomState.k + zoomState.ty;
    if (screenY > baselineScreen - 2 && screenY < baselineScreen + 40) {
      let hitBook: number | null = null;
      for (const book of layout.books) {
        if (mx >= book.left && mx < book.left + book.width) {
          hitBook = book.index;
          break;
        }
      }
      if (hitBook !== null) {
        // Toggle: click same book to deselect, different book to switch
        selectedBook = selectedBook === hitBook ? null : hitBook;
        activePair = null; activeVerse = null;
        recordContext();
        selectedBin = null;
        hideSidePanel();
        updateClearButton();
        scheduleRender();
        return;
      }
    }

    const tolerance = 8 / zoomState.k;
    const hit = hitTestBin(mx, my, bins, layout, categoryVisible, tolerance, selectedBook);

    if (hit) {
      selectedBin = hit;
      selectPair(hit.sourceBook,hit.targetBook);
      updateClearButton();
      scheduleRender();
    } else {
      selectedBin = null;
      selectedBook = null; activePair = null; activeVerse = null;
      recordContext();
      hideSidePanel();
      updateClearButton();
      scheduleRender();
    }
  });

  const expandReading = document.getElementById('side-panel-expand')!;
  expandReading.addEventListener('click', () => {
    const expanded = document.getElementById('side-panel')!.classList.toggle('reading-expanded');
    expandReading.setAttribute('aria-expanded', String(expanded));
    expandReading.textContent = expanded ? 'Show more of the map' : 'Expand reading';
  });

  // Side panel close
  document.getElementById('side-panel-close')!.addEventListener('click', () => {
    selectedBin = null;
    hideSidePanel();
    galaxy?.clearSelection();
    activePair = null; activeVerse = null; recordContext();
    document.getElementById('btn-explore')!.focus({preventScroll:true});
    updateClearButton();
    scheduleRender();
  });
}

function setProgress(pct: number) {
  const bar = document.getElementById('loading-progress') as HTMLElement;
  if (bar) bar.style.width = `${pct}%`;
}

async function main() {
  // Load shared fonts and create header
  loadFonts();
  const app = document.getElementById('app')!;
  const { element: header, controls } = createHeader({
    title: 'Rainbow Reference',
    subtitle: 'The world\'s first hyperlinked Text — The Bible',
    background: 'var(--bg-base)',
    appId: 'rainbow',
  });

  // Create zoom preset buttons inside the shared header controls slot
  const fitBtn = document.createElement('button');
  fitBtn.id = 'zoom-fit';
  fitBtn.className = 'canvas-btn';
  fitBtn.textContent = 'Fit';

  const otBtn = document.createElement('button');
  otBtn.id = 'zoom-ot';
  otBtn.className = 'preset-btn';
  otBtn.textContent = 'Old Testament';

  const ntBtn = document.createElement('button');
  ntBtn.id = 'zoom-nt';
  ntBtn.className = 'preset-btn';
  ntBtn.textContent = 'New Testament';

  controls.append(fitBtn, otBtn, ntBtn);
  app.prepend(header);
  const toolbar = document.createElement('div');
  toolbar.id = 'exploration-toolbar';
  toolbar.append(
    document.getElementById('canvas-controls-left')!,
    document.getElementById('canvas-controls-right')!,
  );
  header.after(toolbar);

  canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  shuffleCanvas = document.getElementById('shuffle-canvas') as HTMLCanvasElement;
  shuffleCtx = shuffleCanvas.getContext('2d')!;
  resizeCanvas();

  layout = computeLayout(width, height);
  zoomState = setupZoom(canvas, () => scheduleRender());

  // Start worker
  const worker = new Worker(
    new URL('./lib/dataWorker.ts', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = (e: MessageEvent<WorkerResult>) => {
    if (e.data.type === 'progress') {
      setProgress(e.data.progress!);
    } else if (e.data.type === 'ready') {
      bins = e.data.bins!;
      references = e.data.references!;
      totalCount = e.data.totalCount!;
      refreshHeatmap();

      (document.getElementById('loading') as HTMLDialogElement).close();
      document.getElementById('loading')!.classList.add('hidden');
      document.getElementById('footer-stats')!.textContent =
        `${totalCount.toLocaleString()} demo connections across 66 books`;

      // Fit the full rainbow in the viewport
      fitRainbowToView(false);

      // Start entrance animation
      animation = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? null : createAnimation();
      contextReady = true;
      restoreContext();
      scheduleRender();
    }
  };

  const failed = () => {
    const loading = document.getElementById('loading') as HTMLDialogElement;
    loading.replaceChildren();
    const message = document.createElement('p'); message.textContent = 'References could not load. Check your connection and retry.';
    const retry = document.createElement('button'); retry.className = 'canvas-btn'; retry.textContent = 'Retry loading';
    retry.addEventListener('click',()=>location.reload());
    const read = document.createElement('button'); read.className = 'canvas-btn'; read.textContent = 'Read curated connections';
    read.addEventListener('click', () => {
      loading.close(); loading.classList.add('hidden');
      if (!document.getElementById('reference-error')) {
        const notice = document.createElement('div'); notice.id = 'reference-error'; notice.setAttribute('role', 'status');
        notice.textContent = 'The map data is unavailable. Sourced readings are still available. ';
        const retryMap = document.createElement('button'); retryMap.className = 'canvas-btn'; retryMap.textContent = 'Retry map';
        retryMap.addEventListener('click', () => location.reload()); notice.append(retryMap);
        document.getElementById('exploration-toolbar')!.after(notice);
      }
      document.getElementById('btn-discover')!.click();
    });
    loading.append(message,retry,read);
    retry.focus();
  };
  worker.onerror = failed;
  worker.addEventListener('message', e=>{if(e.data.type === 'error') failed();});
  worker.postMessage({ type: 'load', url: `${import.meta.env.BASE_URL}references.json` });

  // Inject Lucide icons (prepend before text)
  document.getElementById('btn-shuffle')!.prepend(createElement(Shuffle));
  document.getElementById('btn-shuffle-again')!.prepend(createElement(Shuffle));
  fitBtn.prepend(createElement(Scaling));

  setupFilters();
  setupZoomPresets();
  setupViewToggle();
  updateViewContext();
  setupSearch();
  setupExplorer({
    trigger: document.getElementById('btn-explore') as HTMLButtonElement,
    bins: ()=>bins.filter(b=>categoryVisible[b.category]),
    references: ()=>references.filter(r=>categoryVisible[r.cat]),
    onBook: selectBook, onPair: selectPair, onVerse: openVerse,
  });
  document.getElementById('exploration-back')!.addEventListener('click',()=>history.back());
  window.addEventListener('popstate',()=>{contextDepth=history.state?.explorationDepth ?? 0;restoreContext();});
  document.getElementById('exploration-share')!.addEventListener('click', async()=>{
    const url = new URL(contextSearch(currentContext()),location.href).href;
    const status = document.getElementById('exploration-location')!;
    try { await navigator.clipboard.writeText(url); status.textContent = 'Link copied — opens this selection.'; }
    catch { window.prompt('Copy this link',url); }
  });
  const welcome = document.getElementById('welcome')!;
  try { welcome.hidden = localStorage.getItem('rainbow-welcomed') === 'yes'; } catch {}
  document.getElementById('dismiss-welcome')!.addEventListener('click',()=>{
    welcome.hidden = true; try {localStorage.setItem('rainbow-welcomed','yes');}catch{}
  });
  document.getElementById('start-story')!.addEventListener('click',()=>document.getElementById('btn-discover')!.click());
  for(const id of ['start-book','start-pair']) document.getElementById(id)!.addEventListener('click',()=>document.getElementById('btn-explore')!.click());
  setupInteraction();
  setupShuffle();
  setupDiscovery(document.getElementById("btn-discover") as HTMLButtonElement, (map, item) => {
    const w = map.clientWidth, h = map.clientHeight, ratio = window.devicePixelRatio || 1;
    if (!w || !h) return;
    map.width = w*ratio; map.height = h*ratio;
    const c = map.getContext('2d')!; c.scale(ratio,ratio);
    const l = computeLayout(w,h); const scale = Math.min(1,(h-36)/(w/2));
    const t = {k:scale,tx:(w-w*scale)/2,ty:h-30-l.baselineY*scale};
    renderArcs(c,bins,l,{categoryVisible:CATEGORIES.map(()=>true),highlightBook:null,selectedBook:null,hoveredBin:null,selectedBin:null},t);
    c.fillStyle = '#11151ee6'; c.fillRect(0,0,w,h);
    const names = item.passages.map(p=>p.reference.replace(/ \d+:\d+$/, ''));
    const ids = names.map(name=>BOOKS.findIndex(b=>b.name===name));
    if(ids.some(id=>id<0)) return;
    const xs = ids.map(id=>l.books[id].centerX*t.k+t.tx);
    const y=h-30;
    c.strokeStyle='#c4e9b1'; c.lineWidth=2; c.beginPath(); c.arc((xs[0]+xs[1])/2,y,Math.abs(xs[1]-xs[0])/2,Math.PI,0); c.stroke();
    c.font='12px "DM Mono", monospace'; c.textAlign='center'; c.fillStyle='#e0f2d4';
    xs.forEach((x,i)=>{c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();c.fillText(names[i],Math.max(48,Math.min(w-70,x)),y+22);});
  });
  setupKeyboard();

  const resizeView = () => {
    resizeCanvas();
    layout = computeLayout(width, height);
    if (bins.length > 0 && !contextReady) fitRainbowToView(false);
    galaxy?.resize();
    scheduleRender();
  };
  window.addEventListener('resize', resizeView);
  new ResizeObserver(resizeView).observe(canvas.parentElement!);
  const loadingDialog = document.getElementById('loading') as HTMLDialogElement;
  loadingDialog.addEventListener('cancel', e => e.preventDefault());
  loadingDialog.showModal();
}

main().catch(err => {
  console.error('Failed to initialize:', err);
  const text = document.getElementById('loading-text');
  if (text) text.textContent = `Error: ${err.message}`;
});
