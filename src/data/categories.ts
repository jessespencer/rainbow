export interface Category {
  id: string;
  label: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'messianic', label: 'Messianic Prophecy / Fulfillment', color: '#F5A623' },
  { id: 'law', label: 'Law & Covenant', color: '#2C5F8A' },
  { id: 'wisdom', label: 'Wisdom & Proverbs', color: '#6B8F71' },
  { id: 'prophecy', label: 'Prophecy & Apocalyptic', color: '#6A0DAD' },
  { id: 'praise', label: 'Praise & Worship', color: '#E8A838' },
  { id: 'historical', label: 'Historical Parallel', color: '#7A8B8B' },
  { id: 'creation', label: 'Creation & Cosmos', color: '#1A8C7A' },
  { id: 'redemption', label: 'Sin, Redemption & Grace', color: '#B22222' },
];

export const CATEGORY_COLORS = CATEGORIES.map(c => c.color);
export const CATEGORY_LABELS = CATEGORIES.map(c => c.label);
