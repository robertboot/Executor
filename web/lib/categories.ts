// Category presets — the 12 "Core Collections" plus a Custom fallback.
// Items in the database may have legacy category keys from earlier
// iterations; those are mapped to the new keys via LEGACY_KEY_MAP so
// existing data continues to surface in the right collection.

export interface CustomFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

export interface CategoryPreset {
  key: string;
  label: string;
  glyph: string;
  iconUrl: string | null;
  fields: CustomFieldDef[];
  custom?: boolean;
}

const f = (key: string, label: string, type: CustomFieldDef['type'] = 'text'): CustomFieldDef => ({
  key,
  label,
  type,
});

const HAS_ICON = new Set([
  'antiques-decor',
  'jewelry-watches',
  'art-photography',
  'books-documents',
  'music-instruments',
  'sports-memorabilia',
  'military-historical',
  'collectibles-curiosities',
  'family-keepsakes',
  'outdoor-sporting',
  'fashion-textiles',
  'silver-china-tableware',
  'custom',
]);

const RAW: Omit<CategoryPreset, 'iconUrl'>[] = [
  { key: 'antiques-decor', label: 'Antiques & Decor', glyph: '🏺',
    fields: [
      f('maker', 'Maker'),
      f('period', 'Period / Era'),
      f('materials', 'Materials'),
      f('dimensions', 'Dimensions'),
    ] },
  { key: 'jewelry-watches', label: 'Jewelry & Watches', glyph: '💍',
    fields: [
      f('brand', 'Brand / Maker'),
      f('model', 'Model'),
      f('material', 'Material'),
      f('gemstones', 'Gemstones'),
      f('hallmark', 'Hallmark / Stamp'),
      f('year', 'Year', 'number'),
    ] },
  { key: 'art-photography', label: 'Art & Photography', glyph: '🖼️',
    fields: [
      f('artist', 'Artist / Photographer'),
      f('medium', 'Medium'),
      f('year', 'Year', 'number'),
      f('edition', 'Edition'),
      f('dimensions', 'Dimensions'),
    ] },
  { key: 'books-documents', label: 'Books & Documents', glyph: '📚',
    fields: [
      f('author', 'Author / Signer'),
      f('publisher', 'Publisher'),
      f('year', 'Year', 'number'),
      f('edition', 'Edition'),
      f('isbn', 'ISBN'),
    ] },
  { key: 'music-instruments', label: 'Music & Instruments', glyph: '🎷',
    fields: [
      f('maker', 'Maker'),
      f('model', 'Model'),
      f('year', 'Year', 'number'),
      f('serial', 'Serial number'),
    ] },
  { key: 'sports-memorabilia', label: 'Sports & Memorabilia', glyph: '⚾',
    fields: [
      f('sport', 'Sport'),
      f('team', 'Team'),
      f('player', 'Player'),
      f('year', 'Year', 'number'),
    ] },
  { key: 'military-historical', label: 'Military & Historical', glyph: '🪖',
    fields: [
      f('country', 'Country'),
      f('conflict', 'Conflict / Era'),
      f('branch', 'Branch'),
      f('year', 'Year', 'number'),
    ] },
  { key: 'collectibles-curiosities', label: 'Collectibles & Curiosities', glyph: '💎',
    fields: [
      f('type', 'Type'),
      f('maker', 'Maker / Brand'),
      f('year', 'Year', 'number'),
      f('origin', 'Origin'),
    ] },
  { key: 'family-keepsakes', label: 'Family Keepsakes', glyph: '💝',
    fields: [
      f('relation', 'Original owner / relation'),
      f('story', 'Story'),
      f('year', 'Year', 'number'),
    ] },
  { key: 'outdoor-sporting', label: 'Outdoor & Sporting', glyph: '🎣',
    fields: [
      f('type', 'Type'),
      f('brand', 'Brand'),
      f('model', 'Model'),
      f('year', 'Year', 'number'),
    ] },
  { key: 'fashion-textiles', label: 'Fashion & Textiles', glyph: '👗',
    fields: [
      f('maker', 'Maker / Designer'),
      f('era', 'Era'),
      f('material', 'Material'),
      f('dimensions', 'Dimensions'),
    ] },
  { key: 'silver-china-tableware', label: 'Silver, China & Tableware', glyph: '🍽️',
    fields: [
      f('maker', 'Maker'),
      f('pattern', 'Pattern'),
      f('material', 'Material'),
      f('period', 'Period'),
    ] },
  { key: 'custom', label: 'Other / Custom', glyph: '➕', custom: true, fields: [] },
];

const ICON_VERSION = '3';

export const CATEGORY_PRESETS: CategoryPreset[] = RAW.map((p) => ({
  ...p,
  iconUrl: HAS_ICON.has(p.key) ? `/categories/${p.key}.png?v=${ICON_VERSION}` : null,
}));

// Legacy category keys → new core collection keys. Used so items that
// were tagged under the previous 39-category taxonomy still group into
// the right collection without a database migration.
const LEGACY_KEY_MAP: Record<string, string> = {
  // Antiques & Decor
  'antiques': 'antiques-decor',
  'furniture': 'antiques-decor',
  'lanterns-lighting': 'antiques-decor',
  'mid-century-modern': 'antiques-decor',
  'garden-outdoor': 'outdoor-sporting',
  // Jewelry & Watches
  'fine-jewelry': 'jewelry-watches',
  'vintage-timepieces': 'jewelry-watches',
  // Art & Photography
  'art-paintings': 'art-photography',
  'photography': 'art-photography',
  'posters-prints': 'art-photography',
  // Books & Documents
  'books-manuscripts': 'books-documents',
  'autographs-letters': 'books-documents',
  // Sports & Memorabilia (key unchanged)
  // Music & Instruments (key unchanged)
  'records-vinyl': 'music-instruments',
  // Military & Historical
  'military-collectibles': 'military-historical',
  'knives-blades': 'military-historical',
  // Collectibles & Curiosities
  'coins-currency': 'collectibles-curiosities',
  'stamps': 'collectibles-curiosities',
  'wine-spirits': 'collectibles-curiosities',
  'comics': 'collectibles-curiosities',
  'toys-dolls': 'collectibles-curiosities',
  'maps-globes': 'collectibles-curiosities',
  'classic-cars': 'collectibles-curiosities',
  'nautical-collectibles': 'collectibles-curiosities',
  'native-american': 'collectibles-curiosities',
  'natural-history': 'collectibles-curiosities',
  'perfume-bottles': 'collectibles-curiosities',
  'telescopes-optics': 'collectibles-curiosities',
  'advertising': 'collectibles-curiosities',
  'movie-memorabilia': 'collectibles-curiosities',
  'action-figures': 'collectibles-curiosities',
  'holiday-decorations': 'collectibles-curiosities',
  'vintage-tech': 'collectibles-curiosities',
  // Family Keepsakes (key unchanged)
  'travel-souvenirs': 'family-keepsakes',
  // Outdoor & Sporting
  'hunting-fishing': 'outdoor-sporting',
  // Fashion & Textiles
  'textiles-quilts': 'fashion-textiles',
  // Silver, China & Tableware
  'china-dishware': 'silver-china-tableware',
  'porcelain-ceramics': 'silver-china-tableware',
};

export function normalizeCategoryKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const lower = key.toLowerCase();
  return LEGACY_KEY_MAP[lower] ?? lower;
}

export function findCategory(key: string | null | undefined): CategoryPreset | null {
  if (!key) return null;
  const normalized = normalizeCategoryKey(key);
  if (!normalized) return null;
  const direct = CATEGORY_PRESETS.find((c) => c.key === normalized);
  if (direct) return direct;
  return CATEGORY_PRESETS.find((c) => c.label.toLowerCase() === key.toLowerCase()) ?? null;
}

export function labelForCategory(key: string | null | undefined): string {
  if (!key) return 'No collection';
  const preset = findCategory(key);
  if (preset) return preset.label;
  return key;
}

export function glyphForCategory(key: string | null | undefined): string {
  const preset = findCategory(key);
  return preset?.glyph ?? '◇';
}
