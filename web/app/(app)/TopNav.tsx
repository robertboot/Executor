'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface NavItem {
  href: string;
  label: string;
  children?: { href: string; label: string; description?: string }[];
}

export default function TopNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="hidden md:flex items-center gap-1 text-sm">
      {items.map((n) =>
        n.children ? (
          <DropdownItem key={n.href} item={n} />
        ) : (
          <Link
            key={n.href}
            href={n.href}
            className="px-3 py-2 rounded-md text-ink-soft hover:text-ink hover:bg-cream-soft transition-colors"
          >
            {n.label}
          </Link>
        ),
      )}
    </nav>
  );
}

function DropdownItem({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={item.href}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-ink-soft hover:text-ink hover:bg-cream-soft transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {item.label}
        <Chevron />
      </Link>
      {open && item.children && (
        <div className="absolute left-0 top-full pt-1 z-30 min-w-64">
          <div className="bg-paper border border-hairline rounded-xl shadow-raised p-2">
            {item.children.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="block px-3 py-2 rounded-md hover:bg-cream-soft transition-colors"
              >
                <div className="font-medium text-ink">{c.label}</div>
                {c.description && (
                  <div className="text-xs text-muted mt-0.5">
                    {c.description}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={12}
      height={12}
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
