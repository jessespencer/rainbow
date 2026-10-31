export interface Genre {
  id: string;
  label: string;
  color: string;
  firstBook: number;
  lastBook: number;
}

// The eight runs of the canon, left to right, carrying the rainbow in order.
export const GENRES: Genre[] = [
  { id: 'law', label: 'Law', color: '#C94040', firstBook: 0, lastBook: 4 },
  { id: 'history', label: 'History', color: '#D47240', firstBook: 5, lastBook: 16 },
  { id: 'wisdom', label: 'Poetry & Wisdom', color: '#E8B84B', firstBook: 17, lastBook: 21 },
  { id: 'prophets', label: 'Prophets', color: '#96BC5A', firstBook: 22, lastBook: 38 },
  { id: 'gospels', label: 'Gospels', color: '#50976A', firstBook: 39, lastBook: 42 },
  { id: 'acts', label: 'Acts', color: '#3D9E92', firstBook: 43, lastBook: 43 },
  { id: 'epistles', label: 'Epistles', color: '#4F86C0', firstBook: 44, lastBook: 64 },
  { id: 'revelation', label: 'Revelation', color: '#8A4CC0', firstBook: 65, lastBook: 65 },
];

export const BOOK_GENRE: number[] = GENRES.flatMap((genre, i) =>
  new Array<number>(genre.lastBook - genre.firstBook + 1).fill(i),
);
