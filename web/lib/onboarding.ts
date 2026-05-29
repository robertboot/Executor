// Onboarding archetypes + focus modes. Each archetype recommends a subset
// of the 12 Core Collections; the wizard pre-selects those and lets the
// user add/remove before completing setup.

import type { OnboardingArchetype, OnboardingFocus } from './types';

export type HeroOverlayStyle =
  // Forest-green left-to-right fade, intended for images that bake a
  // light left half into the source (so text overlays cleanly).
  | 'fade'
  // Subtle dark scrim across the whole image, intended for dark
  // cinematic source images where the full photo should remain visible
  // and text needs gentle contrast.
  | 'scrim'
  // No overlay at all — image rendered raw. Useful when the source
  // image is already balanced for legible text on its own.
  | 'none';

export interface ArchetypeDef {
  key: OnboardingArchetype;
  title: string;
  tagline: string;
  bestFor: string;
  recommendedKeys: string[];
  bgImage: string;
  // Optional higher-resolution, full-bleed image used on the Home hero
  // card. Falls back to bgImage when not provided.
  fullImage?: string;
  // Overlay style for the Home hero card. Defaults to 'fade'.
  heroOverlayStyle?: HeroOverlayStyle;
}

const ARCHETYPE_BG_VERSION = '1';

export const ARCHETYPES: ArchetypeDef[] = [
  {
    key: 'family-legacy',
    title: 'Family Legacy',
    tagline: 'Preserve your family history and memories.',
    bestFor: 'Heirlooms · photos · letters · recipes · keepsakes',
    bgImage: `/archetypes/family-legacy.png?v=${ARCHETYPE_BG_VERSION}`,
    fullImage: `/archetypes/family-legacy-full.png?v=${ARCHETYPE_BG_VERSION}`,
    recommendedKeys: [
      'family-keepsakes',
      'art-photography',
      'books-documents',
      'jewelry-watches',
      'antiques-decor',
      'military-historical',
      'silver-china-tableware',
      'fashion-textiles',
    ],
  },
  {
    key: 'collector',
    title: 'The Collector',
    tagline: 'Organize and track curated collectibles.',
    bestFor: 'Sports · cards · coins · comics · hobbies',
    bgImage: `/archetypes/collector.png?v=${ARCHETYPE_BG_VERSION}`,
    fullImage: `/archetypes/collector-full.png?v=${ARCHETYPE_BG_VERSION}`,
    heroOverlayStyle: 'scrim',
    recommendedKeys: [
      'sports-memorabilia',
      'collectibles-curiosities',
      'music-instruments',
      'books-documents',
      'outdoor-sporting',
      'art-photography',
    ],
  },
  {
    key: 'luxury',
    title: 'Luxury & Fine Art',
    tagline: 'Curate a refined private collection.',
    bestFor: 'High-value items · watches · art · antiques',
    bgImage: `/archetypes/luxury.png?v=${ARCHETYPE_BG_VERSION}`,
    fullImage: `/archetypes/luxury-full.png?v=${ARCHETYPE_BG_VERSION}`,
    heroOverlayStyle: 'scrim',
    recommendedKeys: [
      'art-photography',
      'jewelry-watches',
      'antiques-decor',
      'books-documents',
      'silver-china-tableware',
      'fashion-textiles',
      'collectibles-curiosities',
    ],
  },
  {
    key: 'historical',
    title: 'Historical Archive',
    tagline: 'Document artifacts with historical significance.',
    bestFor: 'Military · historical documents · genealogy · preservation',
    bgImage: `/archetypes/historical.png?v=${ARCHETYPE_BG_VERSION}`,
    fullImage: `/archetypes/historical-full.png?v=${ARCHETYPE_BG_VERSION}`,
    heroOverlayStyle: 'scrim',
    recommendedKeys: [
      'military-historical',
      'books-documents',
      'art-photography',
      'collectibles-curiosities',
      'family-keepsakes',
      'antiques-decor',
    ],
  },
  {
    key: 'mixed',
    title: 'Mixed Household',
    tagline: 'A little bit of everything.',
    bestFor: 'Most everyday collections',
    bgImage: `/archetypes/mixed.png?v=${ARCHETYPE_BG_VERSION}`,
    fullImage: `/archetypes/mixed-full.png?v=${ARCHETYPE_BG_VERSION}`,
    heroOverlayStyle: 'scrim',
    recommendedKeys: [
      'antiques-decor',
      'jewelry-watches',
      'family-keepsakes',
      'art-photography',
      'books-documents',
      'collectibles-curiosities',
      'outdoor-sporting',
      'silver-china-tableware',
    ],
  },
];

export interface FocusDef {
  key: OnboardingFocus;
  title: string;
  tagline: string;
  bullets: string[];
}

export const FOCUS_MODES: FocusDef[] = [
  {
    key: 'preservation',
    title: 'Preservation',
    tagline: 'Keep each piece in its best possible condition.',
    bullets: [
      'Restoration reminders',
      'Environmental alerts',
      'Archival storage guidance',
    ],
  },
  {
    key: 'family-sharing',
    title: 'Family Sharing',
    tagline: 'Share stories and plan what gets passed on.',
    bullets: [
      'Shared access for relatives',
      'Stories and provenance',
      'Inheritance planning',
    ],
  },
  {
    key: 'valuation',
    title: 'Valuation',
    tagline: 'Track what your collection is worth.',
    bullets: [
      'Appraisals and insurance',
      'Market value tracking',
      'Auction monitoring',
    ],
  },
  {
    key: 'cataloging',
    title: 'Cataloging',
    tagline: 'Document and organize with precision.',
    bullets: [
      'Detailed records',
      'Searchable tags',
      'Photo documentation',
    ],
  },
];

export function findArchetype(key: string | null | undefined): ArchetypeDef | null {
  if (!key) return null;
  return ARCHETYPES.find((a) => a.key === key) ?? null;
}


// ---- Archetype sub-categories ---------------------------------------------
// Each archetype can define a more granular list of sub-categories that
// shows up in the Customize step. Each sub-category maps to one of the 12
// Core Collections (`parent`) so the rest of the app, which still groups
// items by core key, keeps working unchanged. The wizard saves both the
// sub-category keys AND their parents into selected_collections.

export interface SubCategory {
  key: string;
  label: string;
  description: string;
  parent: string;
  bgImage: string;
  defaultSelected: boolean;
  // Optional zoom factor (1 = no zoom, 1.2 = 20% in). Applied to the
  // square thumbnail on the Collections page, anchored to the right
  // edge so the subject stays in frame.
  thumbZoom?: number;
  // Optional explicit zoom for the home page sub-cat card (5:3
  // aspect). Overrides the baseline 1.8 home zoom when set.
  homeZoom?: number;
}

const SUBCATEGORY_BG_VERSION = '1';
const sub = (key: string) => `/subcategories/${key}.png?v=${SUBCATEGORY_BG_VERSION}`;

const FAMILY_LEGACY_SUBCATEGORIES: SubCategory[] = [
  {
    key: 'family-keepsakes-items',
    label: 'Family Keepsakes',
    description: 'Meaningful objects passed down through generations.',
    parent: 'family-keepsakes',
    bgImage: sub('family-keepsakes'),
    defaultSelected: true,
  },
  {
    key: 'family-photographs',
    label: 'Family Photographs',
    description: 'Printed photos, albums, slides, and portraits.',
    parent: 'art-photography',
    bgImage: sub('family-photographs'),
    defaultSelected: true,
  },
  {
    key: 'letters-documents',
    label: 'Letters & Documents',
    description: 'Important papers and handwritten family history.',
    parent: 'books-documents',
    bgImage: sub('letters-documents'),
    defaultSelected: true,
  },
  {
    key: 'recipes-traditions',
    label: 'Recipes & Traditions',
    description: 'Handwritten recipes and family customs worth preserving.',
    parent: 'books-documents',
    bgImage: sub('recipes-traditions'),
    defaultSelected: false,
  },
  {
    key: 'jewelry-personal-treasures',
    label: 'Jewelry & Personal Treasures',
    description: 'Items worn, gifted, or cherished by loved ones.',
    parent: 'jewelry-watches',
    bgImage: sub('jewelry-personal'),
    defaultSelected: true,
  },
  {
    key: 'military-service',
    label: 'Military Service',
    description: 'Artifacts honoring family service and sacrifice.',
    parent: 'military-historical',
    bgImage: sub('military-service'),
    defaultSelected: true,
  },
  {
    key: 'furniture-home-heirlooms',
    label: 'Furniture & Home Heirlooms',
    description: 'Objects that shape family homes.',
    parent: 'antiques-decor',
    bgImage: sub('furniture-heirlooms'),
    defaultSelected: false,
  },
  {
    key: 'family-stories-memories',
    label: 'Family Stories & Memories',
    description: 'Record the stories behind the items.',
    parent: 'family-keepsakes',
    bgImage: sub('family-stories'),
    defaultSelected: true,
  },
  {
    key: 'holiday-special-keepsakes',
    label: 'Holiday & Special Keepsakes',
    description: 'Objects connected to celebrations and milestones.',
    parent: 'collectibles-curiosities',
    bgImage: sub('holiday-keepsakes'),
    defaultSelected: false,
  },
  {
    key: 'genealogy-family-history',
    label: 'Genealogy & Family History',
    description: 'Research and records documenting your ancestry.',
    parent: 'books-documents',
    bgImage: sub('genealogy'),
    defaultSelected: false,
  },
];

const COLLECTOR_SUBCATEGORIES: SubCategory[] = [
  {
    key: 'sports-memorabilia-items',
    label: 'Sports Memorabilia',
    description: 'Game-worn jerseys, signed balls, and team treasures.',
    parent: 'sports-memorabilia',
    bgImage: sub('sports-memorabilia'),
    defaultSelected: true,
  },
  {
    key: 'trading-cards',
    label: 'Trading Cards',
    description: 'Sports cards, gaming sets, and rare singles.',
    parent: 'collectibles-curiosities',
    bgImage: sub('trading-cards'),
    defaultSelected: true,
  },
  {
    key: 'coins-currency',
    label: 'Coins & Currency',
    description: 'Rare coins, paper money, and minting curiosities.',
    parent: 'collectibles-curiosities',
    bgImage: sub('coins-currency'),
    defaultSelected: true,
  },
  {
    key: 'comics-graphic-novels',
    label: 'Comics & Graphic Novels',
    description: 'Issues, runs, and collector editions.',
    parent: 'collectibles-curiosities',
    bgImage: sub('comics-graphic-novels'),
    defaultSelected: true,
    thumbZoom: 1.3,
    homeZoom: 2.16,
  },
  {
    key: 'autographs-signatures',
    label: 'Autographs & Signatures',
    description: 'Signed memorabilia, letters, and certificates of authenticity.',
    parent: 'books-documents',
    bgImage: sub('autographs-signatures'),
    defaultSelected: false,
  },
  {
    key: 'toys-action-figures',
    label: 'Toys & Action Figures',
    description: 'Vintage figurines, playsets, and in-the-box rarities.',
    parent: 'collectibles-curiosities',
    bgImage: sub('toys-action-figures'),
    defaultSelected: true,
    thumbZoom: 1.35,
    homeZoom: 1.98,
  },
  {
    key: 'vinyl-music',
    label: 'Vinyl & Music',
    description: 'Records, sleeves, and pressings worth keeping.',
    parent: 'music-instruments',
    bgImage: sub('vinyl-music'),
    defaultSelected: true,
    thumbZoom: 1.1,
  },
  {
    key: 'advertising-americana',
    label: 'Advertising & Americana',
    description: 'Tin signs, vintage ads, and slice-of-life Americana.',
    parent: 'collectibles-curiosities',
    bgImage: sub('advertising-americana'),
    defaultSelected: false,
    thumbZoom: 1.1,
  },
  {
    key: 'hunting-fishing-gear',
    label: 'Hunting & Fishing',
    description: 'Lures, rods, decoys, and outdoor sporting heritage.',
    parent: 'outdoor-sporting',
    bgImage: sub('hunting-fishing'),
    defaultSelected: false,
    thumbZoom: 1.15,
  },
  {
    key: 'pop-culture',
    label: 'Pop Culture',
    description: 'Movie props, TV memorabilia, and cultural touchstones.',
    parent: 'collectibles-curiosities',
    bgImage: sub('pop-culture'),
    defaultSelected: false,
    thumbZoom: 1.1,
  },
];

const LUXURY_SUBCATEGORIES: SubCategory[] = [
  {
    key: 'fine-art',
    label: 'Fine Art',
    description: 'Old Masters, prints, and gallery acquisitions.',
    parent: 'art-photography',
    bgImage: sub('fine-art'),
    defaultSelected: true,
  },
  {
    key: 'jewelry-watches-fine',
    label: 'Jewelry & Watches',
    description: 'Precious metals, gemstones, and signed timepieces.',
    parent: 'jewelry-watches',
    bgImage: sub('jewelry-watches-fine'),
    defaultSelected: true,
  },
  {
    key: 'antiques-decor-fine',
    label: 'Antiques & Decor',
    description: 'Period pieces, brass, and refined home objects.',
    parent: 'antiques-decor',
    bgImage: sub('antiques-decor-fine'),
    defaultSelected: true,
  },
  {
    key: 'rare-books-manuscripts',
    label: 'Rare Books & Manuscripts',
    description: 'First editions, signed copies, and antiquarian volumes.',
    parent: 'books-documents',
    bgImage: sub('rare-books-manuscripts'),
    defaultSelected: true,
  },
  {
    key: 'luxury-accessories',
    label: 'Luxury Accessories',
    description: 'Designer handbags, scarves, and refined personal goods.',
    parent: 'fashion-textiles',
    bgImage: sub('luxury-accessories'),
    defaultSelected: false,
  },
  {
    key: 'sculpture-decorative-arts',
    label: 'Sculpture & Decorative Arts',
    description: 'Bronzes, marble, and gallery-grade objets d’art.',
    parent: 'antiques-decor',
    bgImage: sub('sculpture-decorative-arts'),
    defaultSelected: false,
  },
  {
    key: 'wine-spirits',
    label: 'Wine & Spirits',
    description: 'Aged vintages, rare bottlings, and crystal decanters.',
    parent: 'collectibles-curiosities',
    bgImage: sub('wine-spirits'),
    defaultSelected: false,
  },
  {
    key: 'estate-furnishings',
    label: 'Estate Furnishings',
    description: 'Mahogany, leather, and inherited furniture pieces.',
    parent: 'antiques-decor',
    bgImage: sub('estate-furnishings'),
    defaultSelected: true,
  },
  {
    key: 'fine-photography',
    label: 'Fine Photography',
    description: 'Archival prints, signed editions, and pedigreed cameras.',
    parent: 'art-photography',
    bgImage: sub('fine-photography'),
    defaultSelected: false,
  },
  {
    key: 'silver-crystal',
    label: 'Silver & Crystal',
    description: 'Sterling tableware, crystal stemware, and formal serving sets.',
    parent: 'silver-china-tableware',
    bgImage: sub('silver-crystal'),
    defaultSelected: true,
  },
];

const HISTORICAL_SUBCATEGORIES: SubCategory[] = [
  {
    key: 'military-war-history',
    label: 'Military & War History',
    description: 'Medals, ribbons, and artifacts from service and conflict.',
    parent: 'military-historical',
    bgImage: sub('military-war-history'),
    defaultSelected: true,
  },
  {
    key: 'historical-documents',
    label: 'Historical Documents',
    description: 'Treaties, declarations, and significant period papers.',
    parent: 'books-documents',
    bgImage: sub('historical-documents'),
    defaultSelected: true,
  },
  {
    key: 'maps-atlases',
    label: 'Maps & Atlases',
    description: 'Cartography, globes, and instruments of exploration.',
    parent: 'collectibles-curiosities',
    bgImage: sub('maps-atlases'),
    defaultSelected: true,
  },
  {
    key: 'genealogy-records',
    label: 'Genealogy Records',
    description: 'Family trees, lineage charts, and ancestral certificates.',
    parent: 'books-documents',
    bgImage: sub('genealogy-records'),
    defaultSelected: true,
  },
  {
    key: 'political-memorabilia',
    label: 'Political Memorabilia',
    description: 'Campaign buttons, sashes, and political ephemera.',
    parent: 'collectibles-curiosities',
    bgImage: sub('political-memorabilia'),
    defaultSelected: false,
  },
  {
    key: 'antique-books',
    label: 'Antique Books',
    description: 'First editions, leather-bound volumes, and rare imprints.',
    parent: 'books-documents',
    bgImage: sub('antique-books'),
    defaultSelected: true,
  },
  {
    key: 'historical-photography',
    label: 'Historical Photography',
    description: 'Daguerreotypes, tintypes, and early portrait photography.',
    parent: 'art-photography',
    bgImage: sub('historical-photography'),
    defaultSelected: false,
  },
  {
    key: 'artifacts-relics',
    label: 'Artifacts & Relics',
    description: 'Excavated objects, period tools, and physical history.',
    parent: 'military-historical',
    bgImage: sub('artifacts-relics'),
    defaultSelected: false,
  },
  {
    key: 'americana',
    label: 'Americana',
    description: 'Flags, eagles, and weathered patriotic objects.',
    parent: 'collectibles-curiosities',
    bgImage: sub('americana'),
    defaultSelected: false,
  },
  {
    key: 'period-correspondence',
    label: 'Period Correspondence',
    description: 'Letters, diaries, and personal writings of an era.',
    parent: 'books-documents',
    bgImage: sub('period-correspondence'),
    defaultSelected: true,
  },
];

const MIXED_SUBCATEGORIES: SubCategory[] = [
  {
    key: 'family-heirlooms',
    label: 'Family Heirlooms',
    description: 'Inherited pieces and meaningful keepsakes.',
    parent: 'family-keepsakes',
    bgImage: sub('family-heirlooms'),
    defaultSelected: true,
  },
  {
    key: 'jewelry-watches-mixed',
    label: 'Jewelry & Watches',
    description: 'Personal and inherited treasures worn or kept close.',
    parent: 'jewelry-watches',
    bgImage: sub('jewelry-watches-mixed'),
    defaultSelected: true,
  },
  {
    key: 'art-wall-pieces',
    label: 'Art & Wall Pieces',
    description: 'Paintings, prints, and framed photographs in your home.',
    parent: 'art-photography',
    bgImage: sub('art-wall-pieces'),
    defaultSelected: true,
  },
  {
    key: 'books-records',
    label: 'Books & Records',
    description: 'Personal library, vinyl, and well-loved volumes.',
    parent: 'books-documents',
    bgImage: sub('books-records'),
    defaultSelected: true,
  },
  {
    key: 'china-tableware',
    label: 'China & Tableware',
    description: 'Sets passed down or collected over the years.',
    parent: 'silver-china-tableware',
    bgImage: sub('china-tableware'),
    defaultSelected: true,
  },
  {
    key: 'furniture-antiques',
    label: 'Furniture & Antiques',
    description: 'Statement pieces and inherited household furniture.',
    parent: 'antiques-decor',
    bgImage: sub('furniture-antiques'),
    defaultSelected: true,
  },
  {
    key: 'holiday-treasures',
    label: 'Holiday Treasures',
    description: 'Ornaments and seasonal décor with stories of their own.',
    parent: 'collectibles-curiosities',
    bgImage: sub('holiday-treasures'),
    defaultSelected: false,
  },
  {
    key: 'outdoor-garden',
    label: 'Outdoor & Garden',
    description: 'Garden tools, patio finds, and well-loved sporting gear.',
    parent: 'outdoor-sporting',
    bgImage: sub('outdoor-garden'),
    defaultSelected: false,
  },
  {
    key: 'hobby-collections',
    label: 'Hobby Collections',
    description: 'The small things you collect that don’t fit anywhere else.',
    parent: 'collectibles-curiosities',
    bgImage: sub('hobby-collections'),
    defaultSelected: false,
  },
  {
    key: 'travel-mementos',
    label: 'Travel & Mementos',
    description: 'Souvenirs, gifts, and keepsakes from life’s milestones.',
    parent: 'family-keepsakes',
    bgImage: sub('travel-mementos'),
    defaultSelected: false,
  },
];

// All five archetypes now ship with curated sub-category lists.
export const ARCHETYPE_SUBCATEGORIES: Partial<Record<OnboardingArchetype, SubCategory[]>> = {
  'family-legacy': FAMILY_LEGACY_SUBCATEGORIES,
  'collector': COLLECTOR_SUBCATEGORIES,
  'luxury': LUXURY_SUBCATEGORIES,
  'historical': HISTORICAL_SUBCATEGORIES,
  'mixed': MIXED_SUBCATEGORIES,
};

const ALL_SUBCATEGORIES: SubCategory[] = [
  ...FAMILY_LEGACY_SUBCATEGORIES,
  ...COLLECTOR_SUBCATEGORIES,
  ...LUXURY_SUBCATEGORIES,
  ...HISTORICAL_SUBCATEGORIES,
  ...MIXED_SUBCATEGORIES,
];

const SUBCATEGORY_BY_KEY = new Map<string, SubCategory>(
  ALL_SUBCATEGORIES.map((s) => [s.key, s]),
);

export function findSubCategory(key: string): SubCategory | null {
  return SUBCATEGORY_BY_KEY.get(key) ?? null;
}

// Reverse lookup: which archetype owns a given sub-category key. Built
// once at module load by walking ARCHETYPE_SUBCATEGORIES.
const ARCHETYPE_FOR_SUBCATEGORY = (() => {
  const map = new Map<string, ArchetypeDef>();
  for (const arch of ARCHETYPES) {
    const subs = ARCHETYPE_SUBCATEGORIES[arch.key] ?? [];
    for (const s of subs) {
      if (!map.has(s.key)) map.set(s.key, arch);
    }
  }
  return map;
})();

export function archetypeForSubCategory(key: string): ArchetypeDef | null {
  return ARCHETYPE_FOR_SUBCATEGORY.get(key) ?? null;
}

// Given a list of selected sub-category keys, return the union of their
// parent Core 12 keys. Used so the Collections page (which only knows
// core keys) still sees everything the user selected.
export function parentCoreKeysFor(subKeys: string[]): string[] {
  const parents = new Set<string>();
  for (const k of subKeys) {
    const sub = findSubCategory(k);
    if (sub) parents.add(sub.parent);
  }
  return [...parents];
}
