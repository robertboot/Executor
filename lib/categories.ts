// Category presets that drive the dynamic "custom_fields" form on the item editor.

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
    label: 'Other / Custom',
    fields: [],
  },
];

export function findCategory(key: string | null | undefined): CategoryPreset | null {
  if (!key) return null;
  return CATEGORY_PRESETS.find((c) => c.key === key) ?? null;
}
