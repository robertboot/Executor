'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function MobileNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
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
          <nav className="absolute right-0 top-full mt-2 z-20 min-w-44 bg-paper border border-hairline rounded-xl shadow-raised py-2">
            {links.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm text-ink hover:bg-cream-soft"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
