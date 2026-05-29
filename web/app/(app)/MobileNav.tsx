'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { NavItem } from './TopNav';

export default function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-md hover:bg-cream-soft flex items-center justify-center"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <nav className="absolute right-0 top-full mt-2 z-20 min-w-56 max-w-[90vw] bg-paper border border-hairline rounded-xl shadow-raised py-2">
            {items.map((n) =>
              n.children ? (
                <div key={n.href} className="py-1">
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-ink hover:bg-cream-soft"
                  >
                    {n.label}
                  </Link>
                  <div className="pl-2">
                    {n.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2 text-sm text-ink-soft hover:bg-cream-soft hover:text-ink"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-ink hover:bg-cream-soft"
                >
                  {n.label}
                </Link>
              ),
            )}
          </nav>
        </>
      )}
    </div>
  );
}
