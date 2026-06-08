import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import PullToRefresh from '@/components/PullToRefresh';
import CreateDrawer from '@/components/CreateDrawer';
import SplashGate from '@/components/SplashGate';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <>
      <SplashGate />
      <PullToRefresh>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-20 w-full bg-cream/95 backdrop-blur border-b border-hairline">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
              <Link href="/home" className="flex items-center shrink-0">
                <Logo variant="compact" />
              </Link>
              <form
                action="/search"
                method="get"
                className="flex-1 min-w-0 max-w-2xl"
              >
                <label className="relative block">
                  <span className="sr-only">Search your archive</span>
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    name="q"
                    placeholder="Search your archive..."
                    className="w-full bg-paper border border-hairline rounded-full pl-10 pr-4 h-10 text-sm placeholder:text-muted focus:outline-none focus:border-forest"
                  />
                </label>
              </form>
              <Link
                href="/settings"
                aria-label="Settings"
                title="Settings"
                className="shrink-0 w-10 h-10 rounded-md hover:bg-cream-soft flex items-center justify-center text-ink"
              >
                <GearIcon />
              </Link>
            </div>
          </header>
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">
            {children}
          </main>
        </div>
      </PullToRefresh>
      <CreateDrawer />
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <path d="M14 14l4 4" />
    </svg>
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
