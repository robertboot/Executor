import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full bg-paper border-b border-hairline">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/home" className="flex items-center">
            <Logo variant="compact" />
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/home" label="Home" />
            <NavLink href="/collections" label="Collections" />
            <NavLink href="/scan" label="Scan" />
            <NavLink href="/conservators" label="Conservators" />
            <NavLink href="/inventories" label="Inventories" />
            <NavLink href="/settings" label="Settings" />
          </nav>
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

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-ink-soft hover:text-ink hover:bg-cream-soft transition-colors"
    >
      {label}
    </Link>
  );
}
