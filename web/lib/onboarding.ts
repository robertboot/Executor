// Onboarding archetypes + focus modes. Each archetype recommends a subset
// of the 12 Core Collections; the wizard pre-selects those and lets the
// user add/remove before completing setup.

import type { OnboardingArchetype, OnboardingFocus } from './types';

export interface ArchetypeDef {
  key: OnboardingArchetype;
  title: string;
  tagline: string;
  bestFor: string;
  recommendedKeys: string[];
  bgImage: string;
}

const ARCHETYPE_BG_VERSION = '1';

export const ARCHETYPES: ArchetypeDef[] = [
  {
    key: 'family-legacy',
    title: 'Family Legacy',
    tagline: 'Preserve your family history and memories.',
    bestFor: 'Heirlooms · photos · letters · recipes · keepsakes',
    bgImage: `/archetypes/family-legacy.png?v=${ARCHETYPE_BG_VERSION}`,
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
    title: 'Collector',
    tagline: 'Organize and track curated collectibles.',
    bestFor: 'Sports · cards · coins · comics · hobbies',
    bgImage: `/archetypes/collector.png?v=${ARCHETYPE_BG_VERSION}`,
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

export function findFocus(key: string | null | undefined): FocusDef | null {
  if (!key) return null;
  return FOCUS_MODES.find((f) => f.key === key) ?? null;
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

// Other archetypes don't have sub-category lists yet — the wizard falls back
// to the existing 12-icon grid for those until you ship per-archetype copy.
export const ARCHETYPE_SUBCATEGORIES: Partial<Record<OnboardingArchetype, SubCategory[]>> = {
  'family-legacy': FAMILY_LEGACY_SUBCATEGORIES,
};

const ALL_SUBCATEGORIES: SubCategory[] = [
  ...FAMILY_LEGACY_SUBCATEGORIES,
];

const SUBCATEGORY_BY_KEY = new Map<string, SubCategory>(
  ALL_SUBCATEGORIES.map((s) => [s.key, s]),
);

export function findSubCategory(key: string): SubCategory | null {
  return SUBCATEGORY_BY_KEY.get(key) ?? null;
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
