'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = {
  href: string;
  label: string;
  // Match the active state against any of these path prefixes so the
  // Contributors tab lights up on /people, /inheritors, /conservators
  // etc.
  matches: string[];
  icon: (active: boolean) => React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: '/home',
    label: 'Home',
    matches: ['/home'],
    icon: (active) => (
      <Icon active={active} d="M3 11l9-8 9 8M5 10v10h14V10" />
    ),
  },
  {
    href: '/collections',
    label: 'Collections',
    matches: ['/collections'],
    icon: (active) => (
      <Icon
        active={active}
        d="M4 6h6v6H4zM14 6h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
      />
    ),
  },
  {
    href: '/contributors',
    label: 'People',
    matches: ['/contributors', '/people', '/inheritors', '/conservators'],
    icon: (active) => (
      <Icon
        active={active}
        d="M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4"
      />
    ),
  },
  {
    href: '/search',
    label: 'Search',
    matches: ['/search'],
    icon: (active) => (
      <Icon active={active} d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4" />
    ),
  },
  {
    href: '/scan',
    label: 'Scan',
    matches: ['/scan'],
    icon: (active) => (
      <Icon
        active={active}
        d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M7 12h10"
      />
    ),
  },
];

export default function FooterNav() {
  const pathname = usePathname() ?? '';
  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur border-t border-hairline"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5 h-16">
        {TABS.map((t) => {
          const active = t.matches.some(
            (m) => pathname === m || pathname.startsWith(`${m}/`),
          );
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                  active
                    ? 'text-forest'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {t.icon(active)}
                <span className="text-[10px] font-medium tracking-wide">
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Icon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={22}
      height={22}
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 1.9 : 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
