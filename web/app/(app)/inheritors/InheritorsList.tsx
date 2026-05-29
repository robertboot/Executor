'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  inheritorInitials,
} from '@/lib/inheritors';
import { formatMoney } from '@/lib/format';
import type { InheritorWithStats } from '@/lib/api';

type SortKey = 'name' | 'items' | 'value' | 'status';

export default function InheritorsList({
  inheritors,
}: {
  inheritors: InheritorWithStats[];
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? inheritors.filter((i) => {
          const haystack = [
            i.display_name,
            i.relationship ?? '',
            i.email ?? '',
            STATUS_LABEL[i.status],
          ]
            .join(' ')
            .toLowerCase();
          return haystack.includes(q);
        })
      : inheritors;
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'items':
          return b.itemCount - a.itemCount;
        case 'value':
          return b.totalValue - a.totalValue;
        case 'status':
          return STATUS_LABEL[a.status].localeCompare(STATUS_LABEL[b.status]);
        case 'name':
        default:
          return a.display_name.localeCompare(b.display_name);
      }
    });
    return sorted;
  }, [inheritors, query, sort]);

  return (
    <section id="your-inheritors" className="space-y-4 scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h2 className="font-serif text-2xl text-ink">Your Inheritors</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <label className="relative">
            <span className="sr-only">Search inheritors</span>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inheritors..."
              className="h-10 w-full sm:w-64 pl-9 pr-3 rounded-lg bg-paper border border-hairline text-sm text-ink placeholder:text-muted focus:outline-none focus:border-forest"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Sort inheritors</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 w-full sm:w-44 pl-3 pr-9 rounded-lg bg-paper border border-hairline text-sm text-ink appearance-none focus:outline-none focus:border-forest"
            >
              <option value="name">Sort by Name</option>
              <option value="status">Sort by Status</option>
              <option value="items">Sort by Items</option>
              <option value="value">Sort by Value</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              <ChevronIcon />
            </span>
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-paper border border-hairline rounded-2xl p-8 text-center text-sm text-muted">
          No inheritors match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <ul className="bg-paper border border-hairline rounded-2xl shadow-card divide-y divide-hairline overflow-hidden">
          {visible.map((i) => (
            <li key={i.id}>
              <InheritorRow inheritor={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function InheritorRow({ inheritor }: { inheritor: InheritorWithStats }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 p-4 sm:p-5 hover:bg-cream-soft/40 transition-colors">
      <div className="flex items-center gap-4 min-w-0 lg:w-64">
        <div className="shrink-0 relative w-14 h-14 rounded-full overflow-hidden bg-gold-soft/60 flex items-center justify-center">
          {inheritor.primaryPhotoUrl ? (
            <Image
              src={inheritor.primaryPhotoUrl}
              alt={inheritor.display_name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <span className="text-base font-serif font-semibold text-gold-deep">
              {inheritorInitials(inheritor)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-serif text-lg text-ink leading-tight truncate">
            {inheritor.display_name}
          </div>
          {inheritor.relationship && (
            <div className="text-xs text-ink-soft truncate mt-0.5">
              {inheritor.relationship}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-3 min-w-0">
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium px-2.5 py-1 rounded-full ${STATUS_BADGE_CLASS[inheritor.status]}`}
        >
          {(inheritor.status === 'charity' ||
            inheritor.status === 'museum') && (
            <span className="opacity-80">
              <HeartIconSmall />
            </span>
          )}
          {STATUS_LABEL[inheritor.status]}
        </span>
        <Stat
          value={String(inheritor.itemCount)}
          label="Assigned Items"
        />
        <Stat
          value={String(inheritor.collectionCount)}
          label={
            inheritor.collectionCount === 1 ? 'Collection' : 'Collections'
          }
        />
        <Stat
          value={formatMoney(inheritor.totalValue, inheritor.totalCurrency)}
          label="Estimated Value"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/inheritors/${inheritor.id}`}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors"
        >
          View Profile
        </Link>
        <Link
          href={`/inheritors/${inheritor.id}`}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          Manage
        </Link>
        <Link
          href={`/inheritors/${inheritor.id}`}
          aria-label={`More actions for ${inheritor.display_name}`}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:bg-cream-soft hover:text-ink transition-colors"
        >
          <DotsIcon />
        </Link>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="font-serif text-base text-ink leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-1">
        {label}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={18}
      height={18}
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

function HeartIconSmall() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      width={11}
      height={11}
      aria-hidden="true"
    >
      <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
    </svg>
  );
}
