import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import PullToRefresh from '@/components/PullToRefresh';
import FooterNav from '@/components/FooterNav';
import { getCurrentUser } from '@/lib/supabase/server';
import MobileNav from './MobileNav';
import TopNav, { type NavItem } from './TopNav';

const NAV: NavItem[] = [
  { href: '/home', label: 'Home' },
  { href: '/collections', label: 'Collections' },
  {
    href: '/contributors',
    label: 'Contributors',
    children: [
      {
        href: '/people',
        label: 'Legacy People',
        description: 'Family and friends behind every item.',
      },
      {
        href: '/inheritors',
        label: 'Inheritors',
        description: 'Designated recipients for the future.',
      },
      {
        href: '/conservators',
        label: 'Conservators',
        description: 'People who can help maintain the archive.',
      },
    ],
  },
  { href: '/search', label: 'Search' },
  { href: '/scan', label: 'Scan' },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <PullToRefresh />
      <header className="w-full bg-paper border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/home" className="flex items-center shrink-0">
            <Logo variant="compact" />
          </Link>
          <TopNav items={NAV} />
          <div className="flex items-center gap-1">
            <Link
              href="/settings"
              aria-label="Settings"
              className="w-10 h-10 rounded-md hover:bg-cream-soft flex items-center justify-center text-ink"
            >
              <GearIcon />
            </Link>
            <MobileNav items={NAV} />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-6">
        {children}
      </main>
      <footer className="hidden lg:block text-center text-xs text-muted py-6">
        Heirloom · {new Date().getFullYear()}
      </footer>
      <FooterNav />
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}
