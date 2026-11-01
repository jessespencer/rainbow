const tooltip = () => document.getElementById('tooltip')!;

function place(html: string, x: number, y: number) {
  const el = tooltip();
  el.innerHTML = html;
  el.classList.remove('hidden');
  const left = Math.min(x + 14, window.innerWidth - el.offsetWidth - 8);
  el.style.left = `${Math.max(8, left)}px`;
  el.style.top = `${Math.max(8, y - 10)}px`;
}

export function showLinkTooltip(title: string, votes: number, x: number, y: number) {
  place(`
    <div class="tt-books">${title}</div>
    <div class="tt-count">${votes} reader vote${votes === 1 ? '' : 's'}</div>
  `, x, y);
}

export function showPassageTooltip(title: string, count: number, x: number, y: number) {
  place(`
    <div class="tt-books">${title}</div>
    <div class="tt-count">${count.toLocaleString()} connection${count === 1 ? '' : 's'}</div>
  `, x, y);
}

export function hideTooltip() {
  tooltip().classList.add('hidden');
}
