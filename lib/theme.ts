// Centralized design tokens for Heirloom.
// Keep this in sync with any branded screens.

export const colors = {
  // Primary palette
  forest: '#0F3D2E', // dark green — sidebar, primary buttons, headers
  forestDeep: '#0A2D22',
  forestSoft: '#1B5340',

  // Background tints
  cream: '#FAF7F2', // app background
  creamSoft: '#F2EDE4',
  paper: '#FFFFFF', // card / surface

  // Accents
  gold: '#B89668', // tan / gold accent for stats, highlights
  goldSoft: '#E6D7BD',
  goldDeep: '#8C6F47',

  // Neutrals
  ink: '#1F2937', // main text on light bg
  inkSoft: '#374151',
  muted: '#6B7280',
  mutedSoft: '#9CA3AF',
  hairline: '#E5DDD0', // soft warm border
  divider: '#EFE9DC',

  // Semantic
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  success: '#0F766E',
  successSoft: '#D1FAE5',
  warning: '#92400E',
  warningSoft: '#FEF3C7',

  // Onbrand text-on-dark
  onForest: '#F2EDE4',
  onForestMuted: '#9DB6A8',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const typography = {
  display: { fontSize: 28, fontWeight: '700' as const, color: colors.ink },
  h1: { fontSize: 22, fontWeight: '700' as const, color: colors.ink },
  h2: { fontSize: 18, fontWeight: '600' as const, color: colors.ink },
  h3: { fontSize: 15, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, color: colors.inkSoft, lineHeight: 22 },
  small: { fontSize: 13, color: colors.muted },
  micro: { fontSize: 11, color: colors.muted, letterSpacing: 0.6, textTransform: 'uppercase' as const },
};

export const brand = {
  name: 'Heirloom',
  tagline: 'COLLECT. VALUE. PRESERVE. PASS ON.',
  motto: 'Your stories. Your legacy. Their future.',
};
