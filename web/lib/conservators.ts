import type { Conservator, ConservatorPermissionLevel } from './types';

export const LEVEL_LABEL: Record<ConservatorPermissionLevel, string> = {
  viewer: 'Viewer',
  contributor: 'Contributor',
  curator: 'Curator',
  owner: 'Owner',
};

export const LEVEL_BADGE: Record<ConservatorPermissionLevel, string> = {
  viewer: 'View Only',
  contributor: 'Can Edit',
  curator: 'Full Editing',
  owner: 'Full Access',
};

export const LEVEL_OPTIONS: ConservatorPermissionLevel[] = [
  'viewer',
  'contributor',
  'curator',
  'owner',
];

export function conservatorInitials(
  c: Pick<Conservator, 'name'>,
): string {
  return c.name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}
