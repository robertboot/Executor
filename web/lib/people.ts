// Display + ordering helpers for people-related labels.

import type {
  Person,
  ItemPersonRole,
  SideOfFamily,
  Confidence,
} from './types';

export const ROLE_LABEL: Record<ItemPersonRole, string> = {
  owner: 'Owner',
  inherited_from: 'Inherited From',
  current_custodian: 'Current Custodian',
  photographed: 'Photographed',
  created_by: 'Created By',
  mentioned_in: 'Mentioned In',
  related_to: 'Related To',
};

export const ROLE_ORDER: ItemPersonRole[] = [
  'owner',
  'inherited_from',
  'current_custodian',
  'created_by',
  'photographed',
  'mentioned_in',
  'related_to',
];

export const SIDE_LABEL: Record<SideOfFamily, string> = {
  paternal: 'Paternal Side',
  maternal: 'Maternal Side',
  other: 'Other',
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  confirmed: 'Confirmed',
  likely: 'Likely',
  unknown: 'Unknown',
};

export function displayName(p: Pick<Person, 'first_name' | 'middle_name' | 'last_name'>): string {
  return [p.first_name, p.middle_name, p.last_name]
    .filter((s) => s && s.trim().length > 0)
    .join(' ')
    .trim();
}

export function lifeDates(p: Pick<Person, 'birth_date' | 'death_date'>): string | null {
  const b = p.birth_date ? new Date(p.birth_date).getFullYear() : null;
  const d = p.death_date ? new Date(p.death_date).getFullYear() : null;
  if (b && d) return `${b}–${d}`;
  if (b) return `b. ${b}`;
  if (d) return `d. ${d}`;
  return null;
}

export function personInitials(p: Pick<Person, 'first_name' | 'last_name'>): string {
  const first = p.first_name?.[0] ?? '';
  const last = p.last_name?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}
