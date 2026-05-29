import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
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
        description: "Family and friends behind every item.",
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
  { href: '/settings', label: 'Settings' },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full bg-paper border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/home" className="flex items-center shrink-0">
            <Logo variant="compact" />
          </Link>
          <TopNav items={NAV} />
          <MobileNav items={NAV} />
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <footer className="text-center text-xs text-muted py-6">
        Heirloom · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
