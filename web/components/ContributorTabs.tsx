'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Sub-navigation across the contributor hub and its three sections. Rendered
// near the top of /contributors, /people, /inheritors, and /conservators so a
// person can jump between the sections without going back through the hub.
const TABS = [
  { href: '/contributors', label: 'Overview', matches: ['/contributors'] },
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
      <div className="inline-flex gap-1 rounded-full bg-cream-soft border border-hairline p-1 mx-1">
        {TABS.map((t) => {
          const active = isActive(t.matches);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-forest text-cream shadow-sm'
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
