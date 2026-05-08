export interface Category {
  id: string;
  label: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'redemption', label: 'Sin, Redemption & Grace', color: '#C94040' },
  { id: 'messianic', label: 'Messianic Prophecy / Fulfillment', color: '#D47240' },
  { id: 'praise', label: 'Praise & Worship', color: '#E8B84B' },
  { id: 'wisdom', label: 'Wisdom & Proverbs', color: '#96BC5A' },
  { id: 'creation', label: 'Creation & Cosmos', color: '#50976A' },
  { id: 'historical', label: 'Historical Parallel', color: '#3D9E92' },
  { id: 'law', label: 'Law & Covenant', color: '#3B6E9E' },
  { id: 'prophecy', label: 'Prophecy & Apocalyptic', color: '#7B3DAE' },
];

// Maps old data category indices to new array indices
// Old: 0=messianic, 1=law, 2=wisdom, 3=prophecy, 4=praise, 5=historical, 6=creation, 7=redemption
export const CATEGORY_REMAP = [1, 6, 3, 7, 2, 5, 4, 0];

export const CATEGORY_COLORS = CATEGORIES.map(c => c.color);
export const CATEGORY_LABELS = CATEGORIES.map(c => c.label);
