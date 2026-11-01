import { APPS, appHref } from '@jessespencer/bible-ui';
import { DISCOVERIES, type Discovery, type Passage } from '../data/discoveries';

/** Native modal keeps the underlying camera, filters, and selection untouched. */
export function setupDiscovery(trigger: HTMLButtonElement, drawMap?: (canvas: HTMLCanvasElement, item: Discovery) => void) {
  const dialog = document.createElement('dialog');
  dialog.className = 'discovery';
  dialog.setAttribute('aria-labelledby', 'discovery-title');
  dialog.innerHTML = `
    <div class="discovery-shell">
      <div class="discovery-top"><span>CURATED READING · CREATION & LIGHT</span><button class="canvas-btn" data-close aria-label="Close discovery">Close ×</button></div>
      <p class="discovery-progress"></p>
      <h2 id="discovery-title" tabindex="-1"></h2>
      <canvas class="discovery-map" role="img" aria-label="The selected curated connection highlighted against the book network"></canvas>
      <div class="discovery-passages"></div>
      <div class="discovery-explanation"><h3></h3><p></p></div>
      <p class="discovery-credit">World English Bible Classic · Public domain · Emphasis added. These curated readings are separate from the diagram’s synthetic demo connections.</p>
      <div class="discovery-actions"><button class="canvas-btn" data-previous>Previous connection</button><button class="canvas-btn discovery-next" data-next>Follow this thread →</button><button class="canvas-btn" data-close>Back to the whole</button></div>
    </div>`;
  document.body.append(dialog);
  const title = dialog.querySelector<HTMLElement>('h2')!;
  const passages = dialog.querySelector<HTMLElement>('.discovery-passages')!;
  const previous = dialog.querySelector<HTMLButtonElement>('[data-previous]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-next]')!;
  let step = 0;

  function passageCard(passage: Passage) {
    const article = document.createElement('article');
    const heading = document.createElement('h3');
    heading.textContent = passage.reference;
    const quote = document.createElement('blockquote');
    const start = passage.text.indexOf(passage.emphasis);
    if (start >= 0) {
      const mark = document.createElement('mark');
      mark.textContent = passage.emphasis;
      quote.append(passage.text.slice(0, start), mark, passage.text.slice(start + passage.emphasis.length));
    } else quote.textContent = passage.text;
    const source = document.createElement('a');
    source.href = passage.source;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = 'Read chapter ↗';
    source.setAttribute('aria-label', `Read the chapter for ${passage.reference} (opens a new tab)`);
    const context = document.createElement('a');
    context.className = 'discovery-context';
    const era = passage.reference.startsWith('Genesis') ? 0 : 8;
    context.href = `${appHref(APPS.find(app=>app.id==='chronos')!)}?view=narrative&era=${era}`;
    context.textContent = era === 0 ? 'Creation chronology in Chronos ↗' : 'Jesus’ era in Chronos ↗';
    context.target = '_blank'; context.rel = 'noopener noreferrer';
    context.title = 'Story context in the project chronology, not the date this passage was written';
    article.append(heading, quote, source, document.createElement('br'), context);
    return article;
  }
  function render() {
    const item = DISCOVERIES[step];
    title.textContent = item.title;
    dialog.querySelector('.discovery-progress')!.textContent = `Connection ${step + 1} of ${DISCOVERIES.length}`;
    passages.replaceChildren(...item.passages.map(passageCard));
    dialog.querySelector('.discovery-explanation h3')!.textContent = item.connection;
    dialog.querySelector('.discovery-explanation p')!.textContent = item.explanation;
    previous.disabled = step === 0;
    next.textContent = step === DISCOVERIES.length - 1 ? 'Read again ↺' : 'Follow this thread →';
    drawMap?.(dialog.querySelector('canvas')!,item);
    dialog.scrollTop = 0;
    title.focus({ preventScroll: true });
  }
  trigger.addEventListener('click', () => {
    step = 0;
    dialog.showModal();
    render();
  });
  next.addEventListener('click', () => { step = (step + 1) % DISCOVERIES.length; render(); });
  previous.addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  // Keep the app's global Escape-to-clear-filters handler from running.
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  dialog.addEventListener('close', () => trigger.focus({ preventScroll: true }));
  new ResizeObserver(()=>{if(dialog.open) drawMap?.(dialog.querySelector('canvas')!,DISCOVERIES[step]);}).observe(dialog);
}
