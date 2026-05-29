import type { Inheritor, InheritorStatus } from './types';

export const STATUS_LABEL: Record<InheritorStatus, string> = {
  designated_heir: 'Designated Heir',
  beneficiary: 'Beneficiary',
  alternate: 'Alternate',
  charity: 'Charity',
  museum: 'Museum',
  undecided: 'Undecided',
};

// Tailwind class strings keyed by status — kept here so badge colors
// stay consistent across the inheritor list, detail page, and item
// detail's inheritance section.
export const STATUS_BADGE_CLASS: Record<InheritorStatus, string> = {
  designated_heir: 'bg-gold text-cream',
  beneficiary: 'bg-forest text-cream',
  alternate: 'bg-cream-soft text-ink',
  charity: 'bg-[#9F8AA8] text-cream',
  museum: 'bg-[#6F87B0] text-cream',
  undecided: 'bg-hairline text-ink-soft',
};

export const STATUS_OPTIONS: InheritorStatus[] = [
  'designated_heir',
  'beneficiary',
  'alternate',
  'charity',
  'museum',
  'undecided',
];

export function inheritorInitials(
  i: Pick<Inheritor, 'display_name'>,
): string {
  return (
    i.display_name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}
