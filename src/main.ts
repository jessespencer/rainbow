import { CATEGORIES, CATEGORY_COLORS } from './data/categories';
import { BOOKS } from './data/books';
import { computeLayout, type Layout } from './lib/layout';
import { renderArcs, renderBookLabels, renderCredit, hitTestBin, createAnimation, getAnimationAlpha, type RenderOptions, type ScreenTransform, type AnimationState } from './lib/renderer';
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
let highlightBook: number | null = null;
let hoveredBin: Bin | null = null;
let selectedBin: Bin | null = null;
let viewMode: 'arcs' | 'heatmap' = 'arcs';
let animFrame: number | null = null;
let filterDebounce: ReturnType<typeof setTimeout> | null = null;

// Canvas
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
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
  ctx.fillStyle = '#0D0D1A';
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
        hoveredBin,
        selectedBin,
      }, transform);
    }

    renderBookLabels(ctx, layout, transform, highlightBook);
    renderCredit(ctx, totalCount, width, height);
  }

  ctx.restore();

  if (animation && !animation.done) {
    animFrame = requestAnimationFrame(() => { animFrame = null; render(); });
  }
}

function renderArcsAnimated(transform: ScreenTransform) {
  if (!animation) return;
  const { k, tx, ty } = transform;
  const baseY = layout.baselineY;

  // Sort bins by count (ascending) so densest appear last
  const sorted = [...bins].sort((a, b) => a.count - b.count);

  for (const bin of sorted) {
    if (!categoryVisible[bin.category]) continue;

    const alpha = getAnimationAlpha(animation, bin.category);
    if (alpha <= 0) continue;

    const x1 = layout.books[bin.sourceBook].centerX;
    const x2 = layout.books[bin.targetBook].centerX;
    const dist = Math.abs(x2 - x1);
    const height = dist * 0.5;

    const sx1 = x1 * k + tx;
    const sx2 = x2 * k + tx;
    const sy = baseY * k + ty;
    const sh = height * k;
    const cpX = (sx1 + sx2) / 2;

    const baseAlpha = 0.3 + 0.55 * Math.min(1, Math.log(bin.count + 1) / Math.log(500));
    const lineWidth = 1 + 3 * Math.min(1, Math.log(bin.count + 1) / Math.log(500));

    ctx.strokeStyle = CATEGORY_COLORS[bin.category];
    ctx.globalAlpha = baseAlpha * alpha;
    ctx.lineWidth = lineWidth;

    // Animate from baseline upward
    const animatedSh = sh * alpha;
    ctx.beginPath();
    ctx.moveTo(sx1, sy);
    ctx.quadraticCurveTo(cpX, sy - animatedSh, sx2, sy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
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
  CATEGORIES.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill';
    btn.innerHTML = `<span class="cat-dot" style="background:${cat.color}"></span>${cat.label}`;
    btn.addEventListener('click', () => {
      categoryVisible[i] = !categoryVisible[i];
      btn.classList.toggle('inactive', !categoryVisible[i]);
      debouncedRender();
    });
    container.appendChild(btn);
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

    const tolerance = 8 / zoomState.k;
    const hit = hitTestBin(mx, my, bins, layout, categoryVisible, tolerance);

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
    hideTooltip();
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

    const tolerance = 8 / zoomState.k;
    const hit = hitTestBin(mx, my, bins, layout, categoryVisible, tolerance);

    if (hit) {
      selectedBin = hit;
      showSidePanel(hit, references);
      scheduleRender();
    } else {
      selectedBin = null;
      hideSidePanel();
      scheduleRender();
    }
  });

  // Side panel close
  document.getElementById('side-panel-close')!.addEventListener('click', () => {
    selectedBin = null;
    hideSidePanel();
    scheduleRender();
  });
}

function setProgress(pct: number) {
  const bar = document.getElementById('loading-progress') as HTMLElement;
  if (bar) bar.style.width = `${pct}%`;
}

async function main() {
  canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
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
      document.getElementById('ref-count')!.textContent = totalCount.toLocaleString();

      // Start entrance animation
      animation = createAnimation();
      scheduleRender();
    }
  };

  worker.postMessage({ type: 'load', url: '/references.json' });

  setupFilters();
  setupViewToggle();
  setupSearch();
  setupInteraction();

  window.addEventListener('resize', () => {
    resizeCanvas();
    layout = computeLayout(width, height);
    scheduleRender();
  });
}

main().catch(err => {
  console.error('Failed to initialize:', err);
  const text = document.getElementById('loading-text');
  if (text) text.textContent = `Error: ${err.message}`;
});
