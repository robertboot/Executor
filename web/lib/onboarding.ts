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
    bgImage: `/archetypes/family-legacy.jpg?v=${ARCHETYPE_BG_VERSION}`,
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
    bgImage: `/archetypes/collector.jpg?v=${ARCHETYPE_BG_VERSION}`,
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
    bgImage: `/archetypes/luxury.jpg?v=${ARCHETYPE_BG_VERSION}`,
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
    bgImage: `/archetypes/historical.jpg?v=${ARCHETYPE_BG_VERSION}`,
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
    bgImage: `/archetypes/mixed.jpg?v=${ARCHETYPE_BG_VERSION}`,
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
