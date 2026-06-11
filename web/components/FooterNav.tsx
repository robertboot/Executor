'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = {
  href: string;
  label: string;
  // Match active state against any of these path prefixes so the People
  // tab lights up across /people, /inheritors, /conservators, and the
  // /contributors hub.
  matches: string[];
  icon: (active: boolean) => React.ReactNode;
};

const LEFT_TABS: Tab[] = [
  {
    href: '/home',
    label: 'Home',
    matches: ['/home'],
    icon: (active) => (
      <Icon active={active} d="M3 11l9-8 9 8M5 10v10h14V10" />
    ),
  },
  {
    href: '/contributors',
    label: 'Contributors',
    // Lights up across the whole contributor hub.
    matches: ['/contributors', '/people', '/inheritors', '/conservators'],
    icon: (active) => (
      // Two-person group
      <Icon
        active={active}
        d="M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M15 14h2c2.2 0 4 1.8 4 4"
      />
    ),
  },
];

const RIGHT_TABS: Tab[] = [
  {
    href: '/collections',
    label: 'My Collections',
    matches: ['/collections'],
    icon: (active) => (
      <Icon
        active={active}
        d="M4 6h6v6H4zM14 6h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
      />
    ),
  },
  {
    href: '/scan',
    label: 'Scan',
    matches: ['/scan'],
    icon: (active) => (
      // Scan frame
      <Icon
        active={active}
        d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M3 12h18"
      />
    ),
  },
];

export default function FooterNav() {
  const pathname = usePathname() ?? '';
  const isActive = (matches: string[]) =>
    matches.some((m) => pathname === m || pathname.startsWith(`${m}/`));

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 bg-cream-soft/95 backdrop-blur border-t border-hairline"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 h-16 items-center max-w-2xl mx-auto">
        {LEFT_TABS.map((t) => (
          <TabLink key={t.href} tab={t} active={isActive(t.matches)} />
        ))}

        {/* Centered emphasized Add button — replaces the old floating FAB. */}
        <div className="flex items-center justify-center">
          <Link
            href="/items/new"
            aria-label="Add a new item"
            className="-mt-7 inline-flex items-center justify-center w-14 h-14 rounded-full bg-forest text-cream shadow-raised border-4 border-paper hover:bg-forest-deep transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              width={24}
              height={24}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        </div>

        {RIGHT_TABS.map((t) => (
          <TabLink key={t.href} tab={t} active={isActive(t.matches)} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  return (
    <Link
      href={tab.href}
      className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
        active ? 'text-forest' : 'text-muted hover:text-ink'
      }`}
    >
      {tab.icon(active)}
      <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
    </Link>
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
