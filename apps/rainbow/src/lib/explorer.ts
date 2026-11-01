import { BOOKS } from '../data/books';
import type { Bin, Reference } from './dataWorker';

/** Text alternative to the canvas, also used for precise touch selection. */
export function setupExplorer(options: {
  trigger: HTMLButtonElement;
  bins: () => Bin[];
  references: () => Reference[];
  onBook: (book: number) => void;
  onPair: (a: number, b: number) => void;
  onVerse: (verse: [number, number, number]) => void;
}) {
  const dialog = document.createElement('dialog');
  dialog.className = 'explorer discovery';
  dialog.setAttribute('aria-labelledby', 'explorer-title');
  dialog.innerHTML = `<div class="discovery-shell"><div class="discovery-top"><h2 id="explorer-title">Explore the references</h2><button class="canvas-btn" data-close>Close</button></div><p class="explorer-help">Search for a book, compare its connections, or open an individual verse in Galaxy. This list offers the same synthetic demo data without using the canvas. These generated pairs are not verified cross-references.</p><label>Search books<input type="search" autocomplete="off" id="explorer-query" placeholder="Genesis, John, Ps…"></label><p class="explorer-status" role="status"></p><div class="explorer-results"></div></div>`;
  document.body.append(dialog);
  const query = dialog.querySelector<HTMLInputElement>('input')!;
  const results = dialog.querySelector<HTMLElement>('.explorer-results')!;
  const status = dialog.querySelector<HTMLElement>('[role=status]')!;
  function button(label: string, action: () => void) {
    const b = document.createElement('button'); b.className = 'explorer-result'; b.textContent = label;
    b.addEventListener('click', action); return b;
  }
  function close() { dialog.close(); }
  function books() {
    results.replaceChildren();
    const q = query.value.trim().toLowerCase();
    const matches = BOOKS.map((b, i) => ({ ...b, i })).filter(b => b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().startsWith(q));
    status.textContent = matches.length ? `${matches.length} books. Choose one to see connections.` : 'No matching books. Try a full name such as Genesis or John.';
    matches.forEach(b => results.append(button(b.name, () => connections(b.i))));
  }
  function connections(book: number) {
    results.replaceChildren();
    status.textContent = `${BOOKS[book].name} · connections in the current theme filter`;
    results.append(button('← All books', () => { query.value = ''; books(); query.focus(); }), button(`Focus ${BOOKS[book].name} in the visualization`, () => { close(); options.onBook(book); }));
    const totals = new Map<number, number>();
    options.bins().forEach(b => {
      if (b.sourceBook === book || b.targetBook === book) {
        const other = b.sourceBook === book ? b.targetBook : b.sourceBook;
        totals.set(other, (totals.get(other) || 0) + b.count);
      }
    });
    if (!totals.size) status.textContent += ' · no connections; clear the theme filter to see more.';
    [...totals].sort((a,b) => b[1]-a[1]).forEach(([other,count]) => {
      results.append(button(`${BOOKS[book].name} ↔ ${BOOKS[other].name} · ${count.toLocaleString()} connections`, () => {
        close(); options.onPair(book, other);
      }));
    });
    const unique = new Map<string, [number,number,number]>();
    options.references().forEach(r => { for (const v of [r.s,r.t]) if (v[0] === book) unique.set(v.join('.'), v); });
    const heading = document.createElement('h3'); heading.textContent = 'Verses in this book'; results.append(heading);
    // Paginate DOM work instead of creating thousands of controls at once.
    const verses = [...unique.values()].sort((a,b) => a[1]-b[1] || a[2]-b[2]);
    let shown = 0;
    const more = button('Show more verses', appendVerses);
    function appendVerses() {
      const keepFocus = document.activeElement === more;
      const priorCount = results.querySelectorAll('button').length - (more.isConnected ? 1 : 0);
      more.remove();
      verses.slice(shown, shown+40).forEach(v => results.append(button(`${BOOKS[book].name} ${v[1]}:${v[2]} · Open in Galaxy`, () => { close(); options.onVerse(v); })));
      shown += 40;
      if (shown < verses.length) results.append(more);
      if (keepFocus) results.querySelectorAll<HTMLButtonElement>('button')[priorCount]?.focus();
    }
    appendVerses();
    dialog.scrollTop = 0;
    status.tabIndex = -1; status.focus();
  }
  options.trigger.addEventListener('click', () => { books(); dialog.showModal(); query.focus(); });
  query.addEventListener('input', books);
  dialog.querySelector('[data-close]')!.addEventListener('click', close);
  dialog.addEventListener('keydown', e => { if (e.key === 'Escape') e.stopPropagation(); });
  dialog.addEventListener('close', () => options.trigger.focus());
  return { openBook(book: number) { connections(book); dialog.showModal(); query.focus(); } };
}
