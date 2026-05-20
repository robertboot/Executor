// Category / "Collection" presets that drive the dynamic "custom_fields"
// form on the item editor. Users can also type a custom collection name —
// the picker pulls those in as chips on subsequent edits.

export interface CustomFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

export interface CategoryPreset {
  key: string;
  label: string;
  fields: CustomFieldDef[];
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    key: 'jewelry',
    label: 'Jewelry',
    fields: [
      { key: 'material', label: 'Material', type: 'text' },
      { key: 'gemstones', label: 'Gemstones', type: 'text' },
      { key: 'weight', label: 'Weight', type: 'text' },
      { key: 'hallmark', label: 'Hallmark / stamp', type: 'text' },
      { key: 'size', label: 'Ring / chain size', type: 'text' },
    ],
  },
  {
    key: 'painting',
    label: 'Painting',
    fields: [
      { key: 'artist', label: 'Artist', type: 'text' },
      { key: 'medium', label: 'Medium', type: 'text' },
      { key: 'dimensions', label: 'Dimensions', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'framed', label: 'Framed?', type: 'text' },
    ],
  },
  {
    key: 'books',
    label: 'Books',
    fields: [
      { key: 'author', label: 'Author', type: 'text' },
      { key: 'isbn', label: 'ISBN', type: 'text' },
      { key: 'publisher', label: 'Publisher', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'edition', label: 'Edition', type: 'text' },
    ],
  },
  {
    key: 'fishing',
    label: 'Fishing',
    fields: [
      { key: 'type', label: 'Type (rod / reel / lure)', type: 'text' },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'length', label: 'Length / size', type: 'text' },
    ],
  },
  {
    key: 'tools',
    label: 'Tools',
    fields: [
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
    ],
  },
  {
    key: 'coins',
    label: 'Coins',
    fields: [
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'denomination', label: 'Denomination', type: 'text' },
      { key: 'mint', label: 'Mint mark', type: 'text' },
      { key: 'grade', label: 'Grade', type: 'text' },
    ],
  },
  {
    key: 'antiques',
    label: 'Antiques',
    fields: [
      { key: 'maker', label: 'Maker', type: 'text' },
      { key: 'period', label: 'Period / Era', type: 'text' },
      { key: 'materials', label: 'Materials', type: 'text' },
      { key: 'dimensions', label: 'Dimensions', type: 'text' },
    ],
  },
  {
    key: 'media',
    label: 'DVDs / Media',
    fields: [
      { key: 'director', label: 'Director', type: 'text' },
      { key: 'format', label: 'Format', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
    ],
  },
  {
    key: 'collectibles',
    label: 'Collectibles',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text' },
      { key: 'series', label: 'Series', type: 'text' },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'rarity', label: 'Rarity', type: 'text' },
    ],
  },
  {
    key: 'other',
    label: 'Other',
    fields: [],
  },
];

export function findCategory(key: string | null | undefined): CategoryPreset | null {
  if (!key) return null;
  return CATEGORY_PRESETS.find((c) => c.key === key) ?? null;
}

export function labelForCategory(key: string | null | undefined): string {
  if (!key) return 'No collection';
  const preset = findCategory(key);
  if (preset) return preset.label;
  // Custom user-typed collection — just show what they typed.
  return key;
}
