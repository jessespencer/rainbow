export interface Genre {
  id: string;
  label: string;
  color: string;
  firstBook: number;
  lastBook: number;
}

// The eight runs of the canon, left to right, carrying the rainbow in order. One lightness and
// saturation (OKLCH 0.72, about 0.12) and evenly stepped hues, so no section outshines the others.
export const GENRES: Genre[] = [
  { id: 'law', label: 'Law', color: '#EB827B', firstBook: 0, lastBook: 4 },
  { id: 'history', label: 'History', color: '#E18C5F', firstBook: 5, lastBook: 16 },
  { id: 'wisdom', label: 'Poetry & Wisdom', color: '#C79E41', firstBook: 17, lastBook: 21 },
  { id: 'prophets', label: 'Prophets', color: '#8CB460', firstBook: 22, lastBook: 38 },
  { id: 'gospels', label: 'Gospels', color: '#5ABB88', firstBook: 39, lastBook: 42 },
  { id: 'acts', label: 'Acts', color: '#4AB9B2', firstBook: 43, lastBook: 43 },
  { id: 'epistles', label: 'Epistles', color: '#67AAED', firstBook: 44, lastBook: 64 },
  { id: 'revelation', label: 'Revelation', color: '#B191EA', firstBook: 65, lastBook: 65 },
];

export const BOOK_GENRE: number[] = GENRES.flatMap((genre, i) =>
  new Array<number>(genre.lastBook - genre.firstBook + 1).fill(i),
);
