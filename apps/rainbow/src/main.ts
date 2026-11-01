import '@jessespencer/bible-ui/style.css';
import { createHeader, loadFonts } from '@jessespencer/bible-ui';
import { createElement, Shuffle, Scaling } from 'lucide';
import { GENRES } from './data/genres';
import { BOOKS } from './data/books';
import { NT_LEFT, OT_RIGHT, WORLD_WIDTH, pixelsPerVerse, verseAtX, xOfVerse } from './lib/layout';
import { createArcRenderer, MAX_DPR, type ArcRenderer } from './lib/arcGl';
import {
  createLinkStore, DEFAULT_MIN_VOTES, filterLinks, findLink, linkFrom, linksBetweenBooks,
  linksInPassage, linkToEnd, linkToStart, linkVotes, type LinkFilter, type LinkStore,
} from './lib/links';
import { AXIS_BAND, hitTestLink, renderAxis, renderDivider, renderLink, type ScreenTransform } from './lib/renderer';
import { buildHeatmapData, heatmapHitTest, renderHeatmap, type HeatmapData } from './lib/heatmap';
import { hideTooltip, showLinkTooltip, showPassageTooltip } from './lib/tooltip';
import { setupZoom, zoomTo, type ZoomState } from './lib/zoom';
import { rememberSection, renderLinkView, renderPassageView, type CompanionTarget, type VerseTexts } from './lib/companion';
import { setupSheet, type SheetHandle } from './lib/sheet';
import {
  bookPassage, chapterPassage, formatRange, formatVerse, locate, neighborPassage, parseReference, passageFromParam,
  passageToParam, VERSE_BOOK, versePassage, type Passage,
} from './lib/verses';

type Selection =
  | { kind: 'passage'; passage: Passage; expanded: Set<string>; highlight: number | null }
  | { kind: 'link'; id: number };

const PHONE_QUERY = '(max-width: 760px)';
const INTRO_MS = 2800;
const FIT_PADDING = 20;
const LABEL_SPACE = 36;
const BACKGROUND_DIM = 0.25;
const COPIED_FEEDBACK_MS = 1600;
// Leaves breathing room around the rainbow; phones need every pixel of their width.
const FIT_SCALE = 0.8;

// State
let store: LinkStore;
let visible: Int32Array = new Int32Array(0);
let texts: VerseTexts = null;
let heatmapData: HeatmapData;
const filter: LinkFilter = { minVotes: DEFAULT_MIN_VOTES, genre: null };
let selection: Selection | null = null;
let preview: Passage | null = null;
let hoveredLink: number | null = null;
let shuffleLink: number | null = null;
let viewMode: 'arcs' | 'heatmap' = 'arcs';
let fitted = true;
let fitRange: [number, number] = [0, WORLD_WIDTH];
let introStart: number | null = null;
let animFrame: number | null = null;
let pendingPointer: { x: number; y: number; clientX: number; clientY: number } | null = null;
let clicksIgnoredUntil = 0;

// Canvas
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let arcs: ArcRenderer;
let zoomState: ZoomState;
let sheet: SheetHandle;
let shuffleCanvas: HTMLCanvasElement;
let shuffleCtx: CanvasRenderingContext2D;
let width = 0;
let height = 0;
let dpr = 1;

const isPhone = () => window.matchMedia(PHONE_QUERY).matches;
const transform = (): ScreenTransform => ({ k: zoomState.k, tx: zoomState.tx, ty: zoomState.ty });
const selectedPassage = () => selection?.kind === 'passage' ? selection.passage : null;
const selectedLink = () => selection?.kind === 'link' ? selection.id : null;
const companion = () => document.getElementById('companion')!;
const companionOpen = () => !companion().classList.contains('hidden');

function resizeCanvas() {
  const rect = canvas.parentElement!.getBoundingClientRect();
  width = rect.width;
  height = rect.height;
  dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  arcs.resize(width, height, dpr);
}

function introProgress(): number {
  if (introStart === null) return 1;
  const progress = Math.min(1, (performance.now() - introStart) / INTRO_MS);
  if (progress === 1) introStart = null;
  return progress;
}

function render() {
  if (!store) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  if (viewMode === 'heatmap') {
    renderHeatmap(ctx, heatmapData, width, height);
  } else {
    const dimmed = preview !== null || selection !== null || filter.genre !== null;
    arcs.draw({ ...transform(), width, height, dpr, reveal: introProgress(), backgroundAlpha: dimmed ? BACKGROUND_DIM : 1 });
    renderDivider(ctx, transform(), height);
    renderAxis(ctx, transform(), width, preview ?? selectedPassage());
    const link = selectedLink();
    if (link !== null) renderLink(ctx, store, link, transform(), true);
    if (hoveredLink !== null && hoveredLink !== link) renderLink(ctx, store, hoveredLink, transform(), false);
  }

  if (shuffleLink !== null) renderShuffleArc();
  if (introStart !== null) scheduleRender();
}

function scheduleRender() {
  if (animFrame) return;
  animFrame = requestAnimationFrame(() => { animFrame = null; render(); });
}

function renderShuffleArc() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  shuffleCanvas.width = vw * dpr;
  shuffleCanvas.height = vh * dpr;
  shuffleCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  shuffleCtx.clearRect(0, 0, vw, vh);
  const rect = canvas.getBoundingClientRect();
  const { k, tx, ty } = transform();
  renderLink(shuffleCtx, store, shuffleLink!, { k, tx: tx + rect.left, ty: ty + rect.top }, true);
}

// Fit a stretch of the axis into whatever is left above the phone's sheet.
function fitView(left: number, right: number, animated: boolean) {
  fitRange = [left, right];
  if (width <= FIT_PADDING * 2 || height <= FIT_PADDING * 2 + LABEL_SPACE) return;
  const sheetInset = isPhone() && companionOpen() ? companion().getBoundingClientRect().height * 0.52 : 0;
  const usable = Math.max(height - sheetInset, 160);
  const span = right - left;
  const k = (isPhone() ? 1 : FIT_SCALE) * Math.min(
    (width - FIT_PADDING * 2) / span,
    (usable - FIT_PADDING * 2 - LABEL_SPACE) / (span / 2),
  );
  const tx = (width - span * k) / 2 - left * k;
  const ty = (usable + (span / 2) * k - LABEL_SPACE) / 2;
  fitted = true;
  zoomState.baselineY = ty;
  zoomTo(canvas, zoomState, k, tx, ty, animated);
}

function refreshFocus() {
  const focused = preview ?? selectedPassage();
  if (focused) arcs.setFocus(store, linksInPassage(store, focused.start, focused.end, filter));
  else arcs.setFocus(store, filter.genre !== null ? visible : null);
  scheduleRender();
}

function companionTarget(): CompanionTarget {
  return {
    heading: document.getElementById('companion-heading')!,
    content: document.getElementById('side-panel-content')!,
  };
}

function setNavEnabled(previous: boolean, next: boolean) {
  (document.getElementById('panel-prev') as HTMLButtonElement).disabled = !previous;
  (document.getElementById('panel-next') as HTMLButtonElement).disabled = !next;
}

function renderCompanion() {
  if (!selection) return;
  if (selection.kind === 'link') {
    const siblings = linksBetweenBooks(store, selection.id, filter, visible);
    const position = siblings.indexOf(selection.id);
    renderLinkView(companionTarget(), store, selection.id, texts, siblings);
    setNavEnabled(position > 0, position >= 0 && position < siblings.length - 1);
  } else {
    const { passage, expanded, highlight } = selection;
    const connections = linksInPassage(store, passage.start, passage.end, filter);
    renderPassageView(companionTarget(), store, passage, connections, texts, expanded, highlight);
    setNavEnabled(neighborPassage(passage, -1) !== null, neighborPassage(passage, 1) !== null);
  }
}

function writeUrl(mode: 'push' | 'replace') {
  const params = new URLSearchParams();
  if (selection?.kind === 'passage') {
    params.set('ref', passageToParam(selection.passage));
  } else if (selection?.kind === 'link') {
    params.set('ref', passageToParam(versePassage(linkFrom(store, selection.id))));
    params.set('to', passageToParam(versePassage(linkToStart(store, selection.id))));
  }
  if (filter.minVotes !== DEFAULT_MIN_VOTES) params.set('votes', String(filter.minVotes));
  if (filter.genre !== null) params.set('genre', GENRES[filter.genre].id);
  if (viewMode === 'heatmap') params.set('view', 'heatmap');
  const query = params.toString().replace(/%3A/g, ':');
  const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
}

function applySelection(next: Selection | null, url: 'push' | 'none' = 'push') {
  const wasOpen = companionOpen();
  selection = next;
  preview = null;
  companion().classList.toggle('hidden', next === null);
  if (next === null || !wasOpen) {
    sheet.reset();
  }
  renderCompanion();
  const content = document.getElementById('side-panel-content')!;
  content.scrollTop = 0;
  content.querySelector('.cp-marked')?.scrollIntoView({ block: 'center' });
  updateClearButton();
  refreshFocus();
  if (url === 'push') writeUrl('push');
  // The docked panel changes the canvas through the resize observer; the phone sheet does not.
  if (isPhone() && fitted && wasOpen !== (next !== null)) fitView(fitRange[0], fitRange[1], true);
}

function selectPassage(passage: Passage, highlight: number | null = null) {
  applySelection({ kind: 'passage', passage, expanded: new Set(), highlight });
}

function selectLink(id: number) {
  applySelection({ kind: 'link', id });
}

function applyFilter() {
  visible = filterLinks(store, filter);
  // A section filter fades the other links back instead of hiding them.
  arcs.setArcs(store, filter.genre === null ? visible : filterLinks(store, { ...filter, genre: null }));
  heatmapData = buildHeatmapData(store, visible);
  document.getElementById('footer-stats')!.textContent =
    `${visible.length.toLocaleString()} of ${store.count.toLocaleString()} links shown`;
  renderCompanion();
  updateClearButton();
  refreshFocus();
}

const updateClearButton = () => {
  const active = selection !== null || filter.genre !== null;
  document.getElementById('clear-filters')!.classList.toggle('visible', active);
};

function syncFilterControls() {
  document.querySelectorAll<HTMLButtonElement>('.cat-pill').forEach((button, i) => {
    button.classList.toggle('focused', filter.genre === i);
    button.classList.toggle('inactive', filter.genre !== null && filter.genre !== i);
  });
  (document.getElementById('votes-filter') as HTMLSelectElement).value = String(filter.minVotes);
}

function setViewMode(mode: 'arcs' | 'heatmap') {
  viewMode = mode;
  document.getElementById('view-arcs')!.classList.toggle('active', mode === 'arcs');
  document.getElementById('view-heatmap')!.classList.toggle('active', mode === 'heatmap');
  document.getElementById('arc-canvas')!.classList.toggle('hidden', mode === 'heatmap');
  scheduleRender();
}

// UI Setup
function setupFilters() {
  const container = document.getElementById('category-filters')!;

  GENRES.forEach((genre, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-pill';
    btn.innerHTML = `<span class="cat-dot" style="background:${genre.color}"></span>${genre.label}`;
    btn.addEventListener('click', () => {
      filter.genre = filter.genre === i ? null : i;
      syncFilterControls();
      applyFilter();
      writeUrl('replace');
    });
    container.appendChild(btn);
  });

  document.getElementById('votes-filter')!.addEventListener('change', (e) => {
    filter.minVotes = Number((e.target as HTMLSelectElement).value);
    applyFilter();
    writeUrl('replace');
  });

  document.getElementById('clear-filters')!.addEventListener('click', clearAll);
}

function clearAll() {
  filter.genre = null;
  syncFilterControls();
  applyFilter();
  applySelection(null);
}

function setupZoomPresets() {
  const otBtn = document.getElementById('zoom-ot')!;
  const ntBtn = document.getElementById('zoom-nt')!;

  document.getElementById('zoom-fit')!.addEventListener('click', () => {
    otBtn.classList.remove('active');
    ntBtn.classList.remove('active');
    fitView(0, WORLD_WIDTH, true);
  });

  const toggle = (button: HTMLElement, other: HTMLElement, left: number, right: number) => {
    const wasActive = button.classList.toggle('active') === false;
    other.classList.remove('active');
    fitView(wasActive ? 0 : left, wasActive ? WORLD_WIDTH : right, true);
  };

  otBtn.addEventListener('click', () => toggle(otBtn, ntBtn, 0, OT_RIGHT));
  ntBtn.addEventListener('click', () => toggle(ntBtn, otBtn, NT_LEFT, WORLD_WIDTH));
}

function setupViewToggle() {
  const choose = (mode: 'arcs' | 'heatmap') => () => {
    setViewMode(mode);
    writeUrl('replace');
  };
  document.getElementById('view-arcs')!.addEventListener('click', choose('arcs'));
  document.getElementById('view-heatmap')!.addEventListener('click', choose('heatmap'));
}

function setupSearch() {
  const input = document.getElementById('book-search') as HTMLInputElement;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  document.getElementById('search-hint')!.textContent = isMac ? '⌘K' : 'Ctrl K';

  input.addEventListener('input', () => {
    input.classList.remove('invalid');
    preview = input.value.trim() ? parseReference(input.value) : null;
    refreshFocus();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const passage = parseReference(input.value);
    if (!passage) {
      input.classList.add('invalid');
      return;
    }
    input.value = '';
    input.blur();
    selectPassage(passage);
  });
}

function setupShuffle() {
  const overlay = document.getElementById('shuffle-overlay')!;

  function showText(verseId: string, textId: string, start: number, end: number) {
    document.getElementById(verseId)!.textContent = formatRange(start, end);
    document.getElementById(textId)!.textContent = texts?.[start] ?? '';
  }

  function doShuffle() {
    if (visible.length === 0) return;
    const id = visible[Math.floor(Math.random() * visible.length)];
    shuffleLink = id;
    showText('shuffle-verse-1', 'shuffle-text-1', linkFrom(store, id), linkFrom(store, id));
    showText('shuffle-verse-2', 'shuffle-text-2', linkToStart(store, id), linkToEnd(store, id));
    overlay.classList.remove('hidden');
    scheduleRender();
  }

  function dismissShuffle() {
    shuffleLink = null;
    overlay.classList.add('hidden');
    scheduleRender();
  }

  document.getElementById('btn-shuffle')!.addEventListener('click', doShuffle);
  document.getElementById('btn-shuffle-again')!.addEventListener('click', (e) => {
    e.stopPropagation();
    doShuffle();
  });
  document.getElementById('btn-shuffle-exit')!.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissShuffle();
  });
  document.getElementById('btn-shuffle-open')!.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = shuffleLink;
    dismissShuffle();
    if (id !== null) selectLink(id);
  });

  // Prevent clicks on content (text selection) from dismissing
  document.getElementById('shuffle-content')!.addEventListener('click', (e) => e.stopPropagation());
  overlay.addEventListener('click', dismissShuffle);
}

// Previous or next: through a connection's neighbors, or to the next verse, chapter or book.
function navigate(step: -1 | 1) {
  if (selection?.kind === 'passage') {
    const passage = neighborPassage(selection.passage, step);
    if (passage) selectPassage(passage);
    return;
  }
  const id = selectedLink();
  if (id === null) return;
  const siblings = linksBetweenBooks(store, id, filter, visible);
  const next = siblings[siblings.indexOf(id) + step];
  if (next !== undefined) selectLink(next);
}

function setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if ((document.getElementById('about') as HTMLDialogElement).open) return;
    if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const search = document.getElementById('book-search') as HTMLInputElement;
      search.focus();
      search.select();
      return;
    }
    if (document.activeElement instanceof HTMLInputElement) {
      if (e.key === 'Escape') document.activeElement.blur();
      return;
    }
    if (e.key === 'ArrowLeft') navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Escape' && (selection !== null || filter.genre !== null)) clearAll();
  });
}

async function copyPassage(button: HTMLElement, start: number, end: number) {
  const passage: Passage = { start, end, label: formatRange(start, end) };
  const lines = [];
  for (let verse = start; verse <= end; verse++) lines.push(texts?.[verse] ?? '');
  const url = `${window.location.origin}${window.location.pathname}?ref=${passageToParam(passage)}`;
  const copied = await writeClipboard(`${lines.join(' ')}\n— ${passage.label} (BSB)\n${url}`);
  const state = copied ? 'copied' : 'copy-failed';
  button.classList.add(state);
  setTimeout(() => button.classList.remove(state), COPIED_FEEDBACK_MS);
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Some browsers and embedded views refuse the clipboard API, but allow the older command.
    const field = document.createElement('textarea');
    field.value = text;
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
  }
}

function setHoveredLink(id: number | null) {
  if (id === hoveredLink) return;
  hoveredLink = id;
  scheduleRender();
}

function setupCompanion() {
  document.getElementById('side-panel-close')!.addEventListener('click', () => applySelection(null));
  document.getElementById('panel-prev')!.addEventListener('click', () => navigate(-1));
  document.getElementById('panel-next')!.addEventListener('click', () => navigate(1));

  const content = document.getElementById('side-panel-content')!;

  content.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!target) return;
    if (target.dataset.link) {
      setHoveredLink(null);
      selectLink(Number(target.dataset.link));
    }
    if (target.dataset.range) {
      const [start, end] = target.dataset.range.split('-').map(Number);
      selectPassage({ start, end, label: formatRange(start, end) });
    }
    if (target.dataset.context) {
      const verse = Number(target.dataset.context);
      const { book, chapter } = locate(verse);
      selectPassage(chapterPassage(book, chapter)!, verse);
    }
    if (target.dataset.copy) {
      const [start, end] = target.dataset.copy.split('-').map(Number);
      void copyPassage(target, start, end);
    }
    if (target.dataset.showAll && selection?.kind === 'passage') {
      selection.expanded.add(target.dataset.showAll);
      renderCompanion();
    }
  });

  // Pointing at a row shows its arc on the rainbow.
  const rowLink = (e: Event) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-link]');
    return row ? Number(row.dataset.link) : null;
  };
  content.addEventListener('pointerover', (e) => {
    if (e.pointerType === 'mouse') setHoveredLink(rowLink(e));
  });
  content.addEventListener('pointerleave', () => setHoveredLink(null));
  content.addEventListener('focusin', (e) => setHoveredLink(rowLink(e)));
  content.addEventListener('focusout', () => setHoveredLink(null));

  // The toggle event doesn't bubble, so it's caught on the way down.
  content.addEventListener('toggle', (e) => {
    const section = e.target as HTMLDetailsElement;
    if (section.dataset.section) rememberSection(section.dataset.section, section.open);
  }, true);
}

function setupAbout() {
  const about = document.getElementById('about') as HTMLDialogElement;
  document.getElementById('btn-about')!.addEventListener('click', () => about.showModal());
  // A click on the backdrop lands on the dialog itself.
  about.addEventListener('click', (e) => {
    if (e.target === about) about.close();
  });
}

// What a point on the axis means at this zoom: a book, then chapters, then single verses.
function passageAtAxis(worldX: number): Passage {
  const verse = verseAtX(worldX);
  const perVerse = pixelsPerVerse(zoomState.k);
  if (perVerse >= 3) return versePassage(verse);
  if (perVerse >= 0.25) {
    const { book, chapter } = locate(verse);
    return chapterPassage(book, chapter)!;
  }
  return bookPassage(VERSE_BOOK[verse]);
}

const onAxis = (screenY: number) =>
  screenY > zoomState.ty - 4 && screenY < zoomState.ty + AXIS_BAND;

const samePassage = (a: Passage | null, b: Passage | null) =>
  a?.start === b?.start && a?.end === b?.end;

function setPreview(next: Passage | null) {
  if (samePassage(preview, next)) return;
  preview = next;
  refreshFocus();
}

function updateHover(pointer: NonNullable<typeof pendingPointer>) {
  const { x, y, clientX, clientY } = pointer;

  if (viewMode === 'heatmap') {
    const hit = heatmapHitTest(x, y, width, height);
    const count = hit ? heatmapData.matrix[hit.row * 66 + hit.col] : 0;
    if (hit && count > 0) {
      showPassageTooltip(`${BOOKS[hit.row].name} &harr; ${BOOKS[hit.col].name}`, count, clientX, clientY);
    } else {
      hideTooltip();
    }
    return;
  }

  const worldX = (x - zoomState.tx) / zoomState.k;
  const worldY = (y - zoomState.ty) / zoomState.k;

  if (onAxis(y)) {
    const passage = passageAtAxis(worldX);
    setPreview(passage);
    hoveredLink = null;
    canvas.style.cursor = 'pointer';
    showPassageTooltip(passage.label, linksInPassage(store, passage.start, passage.end, filter).length, clientX, clientY);
    scheduleRender();
    return;
  }

  setPreview(null);
  const hit = hitTestLink(worldX, worldY, store, visible, 6 / zoomState.k);
  if (hit !== hoveredLink) {
    hoveredLink = hit;
    scheduleRender();
  }
  if (hit !== null) {
    const title = `${formatVerse(linkFrom(store, hit))} &harr; ${formatRange(linkToStart(store, hit), linkToEnd(store, hit))}`;
    showLinkTooltip(title, linkVotes(store, hit), clientX, clientY);
    canvas.style.cursor = 'pointer';
  } else {
    hideTooltip();
    canvas.style.cursor = 'default';
  }
}

function pointerIn(e: MouseEvent | PointerEvent) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top, clientX: e.clientX, clientY: e.clientY };
}

function handleTap(x: number, y: number, tolerancePx: number) {
  if (viewMode === 'heatmap') {
    const hit = heatmapHitTest(x, y, width, height);
    if (!hit) return;
    const first = visible.find(id => {
      const a = VERSE_BOOK[linkFrom(store, id)];
      const b = VERSE_BOOK[linkToStart(store, id)];
      return (a === hit.row && b === hit.col) || (a === hit.col && b === hit.row);
    });
    if (first !== undefined) selectLink(first);
    return;
  }

  const worldX = (x - zoomState.tx) / zoomState.k;
  const worldY = (y - zoomState.ty) / zoomState.k;
  if (onAxis(y)) {
    selectPassage(passageAtAxis(worldX));
    return;
  }
  const hit = hitTestLink(worldX, worldY, store, visible, tolerancePx / zoomState.k);
  if (hit !== null) selectLink(hit);
  else applySelection(null);
}

function setupInteraction() {
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (pendingPointer === null) {
      requestAnimationFrame(() => {
        if (pendingPointer) updateHover(pendingPointer);
        pendingPointer = null;
      });
    }
    pendingPointer = pointerIn(e);
  });

  canvas.addEventListener('mouseleave', () => {
    pendingPointer = null;
    hoveredLink = null;
    hideTooltip();
    setPreview(null);
    scheduleRender();
  });

  canvas.addEventListener('click', (e) => {
    if (performance.now() < clicksIgnoredUntil) return;
    const { x, y } = pointerIn(e);
    handleTap(x, y, 14);
  });

  setupAxisScrub();
}

// A finger on the book strip slides through passages; everywhere else it pans and pinches.
function setupAxisScrub() {
  let scrubbing = false;

  const previewAt = (e: PointerEvent) => {
    const { x, clientX, clientY } = pointerIn(e);
    const passage = passageAtAxis((x - zoomState.tx) / zoomState.k);
    setPreview(passage);
    showPassageTooltip(passage.label, linksInPassage(store, passage.start, passage.end, filter).length, clientX, clientY - 44);
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || viewMode === 'heatmap' || !onAxis(pointerIn(e).y)) return;
    scrubbing = true;
    canvas.setPointerCapture(e.pointerId);
    previewAt(e);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (scrubbing) previewAt(e);
  });

  canvas.addEventListener('pointerup', () => {
    if (!scrubbing) return;
    scrubbing = false;
    hideTooltip();
    clicksIgnoredUntil = performance.now() + 400;
    if (preview) selectPassage(preview);
  });

  canvas.addEventListener('pointercancel', () => {
    scrubbing = false;
    hideTooltip();
    setPreview(null);
  });
}

function setProgress(pct: number) {
  const bar = document.getElementById('loading-progress') as HTMLElement;
  if (bar) bar.style.width = `${pct}%`;
}

function readUrl(): Selection | null {
  const params = new URLSearchParams(window.location.search);
  const votes = Number(params.get('votes'));
  filter.minVotes = params.has('votes') && Number.isFinite(votes) ? votes : DEFAULT_MIN_VOTES;
  const genre = GENRES.findIndex(g => g.id === params.get('genre'));
  filter.genre = genre >= 0 ? genre : null;
  setViewMode(params.get('view') === 'heatmap' ? 'heatmap' : 'arcs');

  const ref = params.get('ref');
  const passage = ref ? passageFromParam(ref) : null;
  if (!passage) return null;
  const to = params.get('to');
  const target = to ? passageFromParam(to) : null;
  if (target) {
    const id = findLink(store, passage.start, target.start);
    if (id !== null) return { kind: 'link', id };
  }
  return { kind: 'passage', passage, expanded: new Set(), highlight: null };
}

function restoreFromUrl() {
  const next = readUrl();
  syncFilterControls();
  applyFilter();
  applySelection(next, 'none');
}

async function loadTexts() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/bsb.json`);
  if (!response.ok) throw new Error(`Failed to load verse text (${response.status})`);
  texts = await response.json() as string[];
  renderCompanion();
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

  controls.append(document.getElementById('toolbar')!);
  app.prepend(header);

  canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  shuffleCanvas = document.getElementById('shuffle-canvas') as HTMLCanvasElement;
  shuffleCtx = shuffleCanvas.getContext('2d')!;

  const renderer = createArcRenderer(document.getElementById('arc-canvas') as HTMLCanvasElement);
  if (!renderer) throw new Error('This browser does not support WebGL 2');
  arcs = renderer;
  resizeCanvas();

  zoomState = setupZoom(
    canvas,
    (byUser) => {
      if (byUser) fitted = false;
      scheduleRender();
    },
    (event) => {
      const rect = canvas.getBoundingClientRect();
      return event.touches.length > 1 || !onAxis(event.touches[0].clientY - rect.top);
    },
  );
  sheet = setupSheet(companion(), document.getElementById('companion-handle')!, () => applySelection(null));

  // Inject Lucide icons (prepend before text)
  document.getElementById('btn-shuffle')!.prepend(createElement(Shuffle));
  document.getElementById('btn-shuffle-again')!.prepend(createElement(Shuffle));
  document.getElementById('zoom-fit')!.prepend(createElement(Scaling));

  setupFilters();
  setupZoomPresets();
  setupViewToggle();
  setupSearch();
  setupInteraction();
  setupShuffle();
  setupKeyboard();
  setupCompanion();
  setupAbout();

  // Prevent browser zoom (ctrl+wheel / pinch) outside the canvas
  // d3-zoom already handles wheel events on the canvas itself
  app.addEventListener('wheel', (e) => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

  setProgress(30);
  const response = await fetch(`${import.meta.env.BASE_URL}data/links.bin`);
  if (!response.ok) throw new Error(`Failed to load cross-references (${response.status})`);
  setProgress(70);
  store = createLinkStore(await response.arrayBuffer());
  setProgress(90);

  fitView(0, WORLD_WIDTH, false);
  restoreFromUrl();
  document.getElementById('loading')!.classList.add('hidden');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) introStart = performance.now();
  scheduleRender();

  void loadTexts().catch(err => console.error(err));

  window.addEventListener('popstate', restoreFromUrl);

  new ResizeObserver(() => {
    resizeCanvas();
    if (fitted) fitView(fitRange[0], fitRange[1], false);
    render();
  }).observe(canvas.parentElement!);
}

main().catch(err => {
  console.error('Failed to initialize:', err);
  const text = document.getElementById('loading-text');
  if (text) text.textContent = `Error: ${err.message}`;
});
