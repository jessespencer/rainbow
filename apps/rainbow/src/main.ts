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
let viewMode: 'arcs' | 'heatmap' = 'arcs';
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
    renderHeatmap(ctx, heatmapData, width, height, categoryVisible);
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

    renderBookLabels(ctx, layout, transform, highlightBook, selectedBook);
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

// UI Setup
function setupFilters() {
  const container = document.getElementById('category-filters')!;
  const buttons: HTMLButtonElement[] = [];

  CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill';
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
        b.classList.toggle('focused', focusedCategory === j);
        b.classList.toggle('inactive', focusedCategory !== null && focusedCategory !== j);
      });
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
    selectedBin = null;
    highlightBook = null;
    hideSidePanel();
    buttons.forEach(b => {
      b.classList.remove('focused', 'inactive');
    });
    updateClearButton();
    scheduleRender();
  });

  updateClearButton = () => {
    const hasFilter = focusedCategory !== null || selectedBook !== null || selectedBin !== null;
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

  arcBtn.addEventListener('click', () => {
    viewMode = 'arcs';
    arcBtn.classList.add('active');
    heatBtn.classList.remove('active');
    scheduleRender();
  });

  heatBtn.addEventListener('click', () => {
    viewMode = 'heatmap';
    heatBtn.classList.add('active');
    arcBtn.classList.remove('active');
    scheduleRender();
  });
}

function setupSearch() {
  const input = document.getElementById('book-search') as HTMLInputElement;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      highlightBook = null;
      scheduleRender();
      return;
    }
    const idx = BOOKS.findIndex(b =>
      b.name.toLowerCase().startsWith(query) ||
      b.abbr.toLowerCase().startsWith(query)
    );
    highlightBook = idx >= 0 ? idx : null;
    scheduleRender();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && highlightBook !== null) {
      selectedBook = highlightBook;
      highlightBook = null;
      selectedBin = null;
      hideSidePanel();
      input.value = '';
      input.blur();
      updateClearButton();
      scheduleRender();
    }
  });
}

function setupShuffle() {
  const overlay = document.getElementById('shuffle-overlay')!;
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
    scheduleRender();
  }

  const content = document.getElementById('shuffle-content')!;
  const btnExit = document.getElementById('btn-shuffle-exit')!;

  function dismissShuffle() {
    shuffleActive = false;
    shuffleRef = null;
    overlay.classList.add('hidden');
    scheduleRender();
  }

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
    // Don't intercept Escape when typing in an input
    if (document.activeElement instanceof HTMLInputElement) {
      (document.activeElement as HTMLInputElement).blur();
      return;
    }

    const hasFilter = focusedCategory !== null || selectedBook !== null || selectedBin !== null;
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
    hoveredBin = null;
    highlightBook = null;
    hideTooltip();
    // Keep selectedBook — it persists until explicitly toggled
    scheduleRender();
  });

  // Click
  canvas.addEventListener('click', (e) => {
    if (viewMode === 'heatmap') return;

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
      showSidePanel(hit, references);
      updateClearButton();
      scheduleRender();
    } else {
      selectedBin = null;
      selectedBook = null;
      hideSidePanel();
      updateClearButton();
      scheduleRender();
    }
  });

  // Side panel close
  document.getElementById('side-panel-close')!.addEventListener('click', () => {
    selectedBin = null;
    hideSidePanel();
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
      heatmapData = buildHeatmapData(bins);

      document.getElementById('loading')!.classList.add('hidden');
      document.getElementById('footer-stats')!.textContent =
        `${totalCount.toLocaleString()} connections across 66 books, ~1,500 years, ~40 authors, 1 awesome God`;

      // Fit the full rainbow in the viewport
      fitRainbowToView(false);

      // Start entrance animation
      animation = createAnimation();
      scheduleRender();
    }
  };

  worker.postMessage({ type: 'load', url: `${import.meta.env.BASE_URL}references.json` });

  // Inject Lucide icons (prepend before text)
  document.getElementById('btn-shuffle')!.prepend(createElement(Shuffle));
  document.getElementById('btn-shuffle-again')!.prepend(createElement(Shuffle));
  fitBtn.prepend(createElement(Scaling));

  setupFilters();
  setupZoomPresets();
  setupViewToggle();
  setupSearch();
  setupInteraction();
  setupShuffle();
  setupKeyboard();

  // Prevent browser zoom (ctrl+wheel / pinch) outside the canvas
  // d3-zoom already handles wheel events on the canvas itself
  document.getElementById('app')!.addEventListener('wheel', (e) => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

  window.addEventListener('resize', () => {
    resizeCanvas();
    layout = computeLayout(width, height);
    if (bins.length > 0) fitRainbowToView(false);
    scheduleRender();
  });
}

main().catch(err => {
  console.error('Failed to initialize:', err);
  const text = document.getElementById('loading-text');
  if (text) text.textContent = `Error: ${err.message}`;
});
