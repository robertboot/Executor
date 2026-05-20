// Category / "Collection" presets driving the dynamic "custom_fields"
// form on the item editor AND the icon picker on the New Collection screen.
//
// Each preset has a key (canonical slug — what we store in items.category),
// a human-readable label, a fallback `glyph` (emoji used until the icon
// PNG is in place), and an optional `iconAsset` (require()'d module ID
// resolved at bundle time).

export interface CustomFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
}

export interface CategoryPreset {
  key: string;
  label: string;
  glyph: string;
  iconAsset?: number | null; // result of require('...png')
  fields: CustomFieldDef[];
  custom?: boolean; // marks the "Other / Custom" tile
}

const f = (key: string, label: string, type: CustomFieldDef['type'] = 'text'): CustomFieldDef => ({
  key,
  label,
  type,
});

// Icon assets. Add a `require(...)` line here as each PNG lands in
// /assets/categories. Filenames must match the preset key.
const ICONS: Record<string, number> = {
  'antiques': require('../assets/categories/antiques.png'),
  'art-paintings': require('../assets/categories/art-paintings.png'),
  'books-manuscripts': require('../assets/categories/books-manuscripts.png'),
  'china-dishware': require('../assets/categories/china-dishware.png'),
  'coins-currency': require('../assets/categories/coins-currency.png'),
  'family-keepsakes': require('../assets/categories/family-keepsakes.png'),
  'fine-jewelry': require('../assets/categories/fine-jewelry.png'),
  'furniture': require('../assets/categories/furniture.png'),
  'holiday-decorations': require('../assets/categories/holiday-decorations.png'),
  'maps-globes': require('../assets/categories/maps-globes.png'),
  'music-instruments': require('../assets/categories/music-instruments.png'),
  'photography': require('../assets/categories/photography.png'),
  'porcelain-ceramics': require('../assets/categories/porcelain-ceramics.png'),
  'sports-memorabilia': require('../assets/categories/sports-memorabilia.png'),
  'stamps': require('../assets/categories/stamps.png'),
  'textiles-quilts': require('../assets/categories/textiles-quilts.png'),
  'toys-dolls': require('../assets/categories/toys-dolls.png'),
  'vintage-tech': require('../assets/categories/vintage-tech.png'),
  'vintage-timepieces': require('../assets/categories/vintage-timepieces.png'),
};

const RAW: CategoryPreset[] = [
  // Row 1
  { key: 'art-paintings', label: 'Art & Paintings', glyph: '🖼️',
    fields: [f('artist', 'Artist'), f('medium', 'Medium'), f('year', 'Year', 'number'), f('dimensions', 'Dimensions')] },
  { key: 'antiques', label: 'Antiques', glyph: '🏺',
    fields: [f('maker', 'Maker'), f('period', 'Period / Era'), f('materials', 'Materials'), f('dimensions', 'Dimensions')] },
  { key: 'vintage-timepieces', label: 'Vintage Timepieces', glyph: '🕰️',
    fields: [f('brand', 'Brand'), f('model', 'Model'), f('movement', 'Movement'), f('year', 'Year', 'number')] },
  { key: 'fine-jewelry', label: 'Fine Jewelry', glyph: '💍',
    fields: [f('material', 'Material'), f('gemstones', 'Gemstones'), f('weight', 'Weight'), f('hallmark', 'Hallmark / stamp')] },
  { key: 'books-manuscripts', label: 'Books & Manuscripts', glyph: '📚',
    fields: [f('author', 'Author'), f('isbn', 'ISBN'), f('publisher', 'Publisher'), f('year', 'Year', 'number'), f('edition', 'Edition')] },
  { key: 'photography', label: 'Photography', glyph: '📷',
    fields: [f('photographer', 'Photographer'), f('camera', 'Camera'), f('year', 'Year', 'number'), f('edition', 'Edition')] },
  { key: 'music-instruments', label: 'Music & Instruments', glyph: '🎷',
    fields: [f('maker', 'Maker'), f('model', 'Model'), f('year', 'Year', 'number'), f('serial', 'Serial')] },
  { key: 'sports-memorabilia', label: 'Sports Memorabilia', glyph: '⚾',
    fields: [f('sport', 'Sport'), f('team', 'Team'), f('player', 'Player'), f('year', 'Year', 'number')] },

  // Row 2
  { key: 'toys-dolls', label: 'Toys & Dolls', glyph: '🧸',
    fields: [f('maker', 'Maker'), f('year', 'Year', 'number'), f('material', 'Material')] },
  { key: 'coins-currency', label: 'Coins & Currency', glyph: '🪙',
    fields: [f('country', 'Country'), f('year', 'Year', 'number'), f('denomination', 'Denomination'), f('mint', 'Mint mark'), f('grade', 'Grade')] },
  { key: 'stamps', label: 'Stamps', glyph: '✉️',
    fields: [f('country', 'Country'), f('year', 'Year', 'number'), f('denomination', 'Denomination'), f('grade', 'Grade')] },
  { key: 'wine-spirits', label: 'Wine & Spirits', glyph: '🍷',
    fields: [f('producer', 'Producer'), f('region', 'Region'), f('vintage', 'Vintage'), f('year', 'Year', 'number')] },
  { key: 'comics', label: 'Comics', glyph: '💥',
    fields: [f('title', 'Title'), f('issue', 'Issue'), f('publisher', 'Publisher'), f('year', 'Year', 'number'), f('grade', 'Grade')] },
  { key: 'records-vinyl', label: 'Records & Vinyl', glyph: '💿',
    fields: [f('artist', 'Artist'), f('title', 'Title'), f('label', 'Label'), f('year', 'Year', 'number')] },
  { key: 'porcelain-ceramics', label: 'Porcelain & Ceramics', glyph: '🫖',
    fields: [f('maker', 'Maker'), f('period', 'Period'), f('mark', 'Mark'), f('country', 'Country')] },
  { key: 'furniture', label: 'Furniture', glyph: '🪑',
    fields: [f('maker', 'Maker'), f('period', 'Period'), f('material', 'Material'), f('dimensions', 'Dimensions')] },

  // Row 3
  { key: 'china-dishware', label: 'China & Dishware', glyph: '🍽️',
    fields: [f('maker', 'Maker'), f('pattern', 'Pattern'), f('period', 'Period')] },
  { key: 'lanterns-lighting', label: 'Lanterns & Lighting', glyph: '🏮',
    fields: [f('type', 'Type'), f('period', 'Period'), f('material', 'Material')] },
  { key: 'military-collectibles', label: 'Military Collectibles', glyph: '🪖',
    fields: [f('country', 'Country'), f('era', 'Era'), f('branch', 'Branch')] },
  { key: 'autographs-letters', label: 'Autographs & Letters', glyph: '✍️',
    fields: [f('signer', 'Signed by'), f('date', 'Date'), f('certificate', 'Certificate')] },
  { key: 'posters-prints', label: 'Posters & Prints', glyph: '📜',
    fields: [f('artist', 'Artist'), f('year', 'Year', 'number'), f('edition', 'Edition'), f('dimensions', 'Dimensions')] },
  { key: 'maps-globes', label: 'Maps & Globes', glyph: '🌍',
    fields: [f('cartographer', 'Cartographer'), f('year', 'Year', 'number'), f('region', 'Region')] },
  { key: 'classic-cars', label: 'Classic Cars', glyph: '🚗',
    fields: [f('make', 'Make'), f('model', 'Model'), f('year', 'Year', 'number'), f('vin', 'VIN'), f('mileage', 'Mileage')] },
  { key: 'nautical-collectibles', label: 'Nautical Collectibles', glyph: '⛵',
    fields: [f('type', 'Type'), f('era', 'Era'), f('origin', 'Origin')] },

  // Row 4
  { key: 'native-american', label: 'Native American', glyph: '🪶',
    fields: [f('tribe', 'Tribe / Nation'), f('period', 'Period'), f('materials', 'Materials')] },
  { key: 'mid-century-modern', label: 'Mid-Century Modern', glyph: '🪩',
    fields: [f('designer', 'Designer'), f('manufacturer', 'Manufacturer'), f('year', 'Year', 'number')] },
  { key: 'natural-history', label: 'Natural History', glyph: '🦋',
    fields: [f('specimen', 'Specimen'), f('origin', 'Origin'), f('year', 'Year', 'number')] },
  { key: 'perfume-bottles', label: 'Perfume Bottles', glyph: '🧴',
    fields: [f('brand', 'Brand'), f('period', 'Period'), f('material', 'Material')] },
  { key: 'knives-blades', label: 'Knives & Blades', glyph: '🗡️',
    fields: [f('maker', 'Maker'), f('blade', 'Blade'), f('year', 'Year', 'number')] },
  { key: 'telescopes-optics', label: 'Telescopes & Optics', glyph: '🔭',
    fields: [f('maker', 'Maker'), f('model', 'Model'), f('year', 'Year', 'number')] },
  { key: 'advertising', label: 'Advertising', glyph: '📺',
    fields: [f('brand', 'Brand'), f('year', 'Year', 'number'), f('type', 'Type')] },
  { key: 'movie-memorabilia', label: 'Movie Memorabilia', glyph: '🎬',
    fields: [f('title', 'Title'), f('year', 'Year', 'number'), f('type', 'Type')] },

  // Row 5
  { key: 'travel-souvenirs', label: 'Travel & Souvenirs', glyph: '🧳',
    fields: [f('origin', 'Origin'), f('year', 'Year', 'number')] },
  { key: 'action-figures', label: 'Action Figures', glyph: '🤖',
    fields: [f('brand', 'Brand'), f('character', 'Character'), f('year', 'Year', 'number')] },
  { key: 'holiday-decorations', label: 'Holiday Decorations', glyph: '🎄',
    fields: [f('holiday', 'Holiday'), f('era', 'Era')] },
  { key: 'hunting-fishing', label: 'Hunting & Fishing', glyph: '🎣',
    fields: [f('type', 'Type'), f('brand', 'Brand'), f('model', 'Model')] },
  { key: 'vintage-tech', label: 'Vintage Tech', glyph: '⌨️',
    fields: [f('maker', 'Maker'), f('model', 'Model'), f('year', 'Year', 'number')] },
  { key: 'garden-outdoor', label: 'Garden & Outdoor', glyph: '🌱',
    fields: [f('type', 'Type'), f('period', 'Period')] },
  { key: 'textiles-quilts', label: 'Textiles & Quilts', glyph: '🪡',
    fields: [f('maker', 'Maker'), f('pattern', 'Pattern'), f('origin', 'Origin'), f('year', 'Year', 'number')] },
  { key: 'family-keepsakes', label: 'Family Keepsakes', glyph: '💝',
    fields: [f('relation', 'Original owner / relation'), f('story', 'Story'), f('year', 'Year', 'number')] },

  // Custom
  { key: 'custom', label: 'Other / Custom', glyph: '➕', custom: true, fields: [] },
];

// Attach icon assets at module load (saves a require lookup per render).
export const CATEGORY_PRESETS: CategoryPreset[] = RAW.map((p) => ({
  ...p,
  iconAsset: ICONS[p.key] ?? null,
}));

export function findCategory(key: string | null | undefined): CategoryPreset | null {
  if (!key) return null;
  // Try exact slug match first
  const direct = CATEGORY_PRESETS.find((c) => c.key === key);
  if (direct) return direct;
  // Try human label match (older data may store labels)
  return CATEGORY_PRESETS.find((c) => c.label.toLowerCase() === key.toLowerCase()) ?? null;
}

export function labelForCategory(key: string | null | undefined): string {
  if (!key) return 'No collection';
  const preset = findCategory(key);
  if (preset) return preset.label;
  // Custom user-typed collection — just show what they typed.
  return key;
}

export function glyphForCategory(key: string | null | undefined): string {
  const preset = findCategory(key);
  return preset?.glyph ?? '◇';
}
