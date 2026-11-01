import { figures } from '../data/timeline';
import { formatYear } from './scale';

export function setupReader(trigger: HTMLButtonElement, select: (birth: number, death: number) => void) {
  const dialog = document.createElement('dialog'); dialog.className='figure-reader';
  dialog.setAttribute('aria-labelledby','reader-title');
  dialog.innerHTML = `<h2 id="reader-title">People in the story</h2><button class="story-navigation__button" data-close>Close</button><p>Search the timeline without using the diagram. Dates follow the project’s chronology and include estimates.</p><label>Find a person<input type="search" placeholder="Moses, Mary, Isaiah…"></label><p role="status"></p><div class="reader-results"></div>`;
  document.body.append(dialog);
  const query=dialog.querySelector('input')!;
  const results=dialog.querySelector('.reader-results')!;
  function render(){
    results.replaceChildren();
    const matches=figures.filter(f=>f.name.toLowerCase().includes(query.value.trim().toLowerCase()));
    dialog.querySelector('[role=status]')!.textContent=matches.length ? `${matches.length} ${matches.length === 1 ? 'person' : 'people'} found` : 'No people found. Try Moses, Mary, or Isaiah.';
    matches.forEach(f=>{
      const article=document.createElement('article');
      const name=document.createElement('h3');name.textContent=f.name;
      const dates=document.createElement('p');dates.textContent=`${formatYear(f.birth)} – ${formatYear(f.death)} · ${f.scriptureRef}`;
      const text=document.createElement('p');text.textContent=f.blurb;
      const note=document.createElement('p');note.className='reader-note';
      note.textContent=f.reignStart!=null?'Reign dates may be used as lifespan boundaries when birth and death are unknown.':'Dates may be inferred from genealogies or periods of activity; they are not text composition dates.';
      const button=document.createElement('button');button.className='story-navigation__button';button.textContent=`Show ${f.name} in context`;
      button.addEventListener('click',()=>{dialog.close();select(f.birth,f.death);});
      article.append(name,dates,text,note,button);results.append(article);
    });
  }
  trigger.addEventListener('click',()=>{render();dialog.showModal();query.focus();});
  query.addEventListener('input',render);
  dialog.querySelector('[data-close]')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>trigger.focus());
}
