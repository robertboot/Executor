'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Sub-navigation across the contributor hub and its three sections. Rendered
// near the top of /contributors, /people, /inheritors, and /conservators so a
// person can jump between the sections without going back through the hub.
// The "All Contributors" anchor stays green to set it apart; the three section
// tabs turn white when selected.
const PRIMARY = {
  href: '/contributors',
  label: 'All Contributors',
  matches: ['/contributors'],
};

const SECTIONS = [
  { href: '/people', label: 'Originators', matches: ['/people'] },
  { href: '/inheritors', label: 'Inheritors', matches: ['/inheritors'] },
  { href: '/conservators', label: 'Conservators', matches: ['/conservators'] },
];

export default function ContributorTabs() {
  const pathname = usePathname() ?? '';
  const isActive = (matches: string[]) =>
    matches.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <nav aria-label="Contributor sections" className="-mx-1 overflow-x-auto">
      <div className="inline-flex items-center gap-1 rounded-full bg-cream-soft border border-hairline p-1 mx-1">
        <Link
          href={PRIMARY.href}
          aria-current={isActive(PRIMARY.matches) ? 'page' : undefined}
          className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap bg-forest text-cream shadow-sm hover:bg-forest-deep transition-colors"
        >
          {PRIMARY.label}
        </Link>

        <span className="w-px h-5 bg-hairline mx-0.5" aria-hidden />

        {SECTIONS.map((t) => {
          const active = isActive(t.matches);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-paper text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
