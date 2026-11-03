import { currentTheme } from '@jessespencer/bible-ui/theme';

export interface Genre {
  id: string;
  label: string;
  /** Night's colour, on the light-on-dark line below. */
  color: string;
  /** Day's colour: the same hue, darker, for ink on paper. */
  ink: string;
  /** The CSS custom property holding whichever of the two is showing, as `var(--crimson)`. */
  css: string;
  firstBook: number;
  lastBook: number;
}

// The eight runs of the canon, left to right, carrying the rainbow in order. One lightness and
// saturation (OKLCH 0.72, about 0.12) and evenly stepped hues, so no section outshines the others.
// Day keeps the hues at OKLCH 0.52 and 0.12. style.css holds both as tokens.
export const GENRES: Genre[] = [
  { id: 'law', label: 'Law', color: '#EB827B', ink: '#A34945', css: 'var(--crimson)', firstBook: 0, lastBook: 4 },
  { id: 'history', label: 'History', color: '#E18C5F', ink: '#9F5021', css: 'var(--ember)', firstBook: 5, lastBook: 16 },
  { id: 'wisdom', label: 'Poetry & Wisdom', color: '#C79E41', ink: '#886200', css: 'var(--saffron)', firstBook: 17, lastBook: 21 },
  { id: 'prophets', label: 'Prophets', color: '#8CB460', ink: '#527621', css: 'var(--moss)', firstBook: 22, lastBook: 38 },
  { id: 'gospels', label: 'Gospels', color: '#5ABB88', ink: '#037D4E', css: 'var(--fern)', firstBook: 39, lastBook: 42 },
  { id: 'acts', label: 'Acts', color: '#4AB9B2', ink: '#007E77', css: 'var(--verdigris)', firstBook: 43, lastBook: 43 },
  { id: 'epistles', label: 'Epistles', color: '#67AAED', ink: '#286CAB', css: 'var(--cerulean)', firstBook: 44, lastBook: 64 },
  { id: 'revelation', label: 'Revelation', color: '#B191EA', ink: '#7457A3', css: 'var(--iris)', firstBook: 65, lastBook: 65 },
];

/** The section's colour in the theme showing, for canvas code. HTML uses `genre.css`. */
export const sectionColor = (genre: Genre): string =>
  currentTheme() === 'light' ? genre.ink : genre.color;

export const BOOK_GENRE: number[] = GENRES.flatMap((genre, i) =>
  new Array<number>(genre.lastBook - genre.firstBook + 1).fill(i),
);
