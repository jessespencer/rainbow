export type View = 'arcs' | 'heatmap' | 'galaxy';
export interface ExploreContext { view: View; book: number | null; pair: [number, number] | null; verse: [number, number, number] | null; category: number | null }
export function readContext(search: string): ExploreContext {
  const p = new URLSearchParams(search);
  const integer = (value: string | null, max: number) => value !== null && /^\d+$/.test(value) && Number(value) <= max ? Number(value) : null;
  const tuple = (key: string, count: number) => {
    const value = p.get(key)?.split('.');
    if (!value || value.length !== count || value.some(v => !/^\d+$/.test(v))) return null;
    return value.map(Number);
  };
  const pair = tuple('pair', 2);
  const verse = tuple('verse', 3);
  return {
    view: p.get('view') === 'galaxy' ? 'galaxy' : p.get('view') === 'heatmap' ? 'heatmap' : 'arcs',
    book: integer(p.get('book'), 65), category: integer(p.get('theme'), 7),
    pair: pair && pair.every(n => n <= 65) ? pair as [number, number] : null,
    verse: verse && verse[0] <= 65 && verse[1] > 0 && verse[1] <= 150 && verse[2] > 0 && verse[2] <= 176 ? verse as [number, number, number] : null,
  };
}
export function contextSearch(context: ExploreContext): string {
  const p = new URLSearchParams();
  p.set('view', context.view);
  if (context.book !== null) p.set('book', String(context.book));
  if (context.category !== null) p.set('theme', String(context.category));
  if (context.pair) p.set('pair', context.pair.join('.'));
  if (context.verse) p.set('verse', context.verse.join('.'));
  return `?${p}`;
}
