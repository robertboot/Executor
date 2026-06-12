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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Your Inheritors
          </h2>
          <p className="text-muted text-sm sm:text-base mt-2 max-w-xl">
            People designated to receive items, collections, and family
            heirlooms in the future.
          </p>
        </div>
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
    <Link
      href={`/inheritors/${inheritor.id}`}
      className="flex items-center gap-4 p-3 sm:p-4 hover:bg-cream-soft/40 transition-colors"
    >
      <div className="shrink-0 relative w-11 h-11 rounded-full overflow-hidden bg-gold-soft/60 flex items-center justify-center">
        {inheritor.primaryPhotoUrl ? (
          <Image
            src={inheritor.primaryPhotoUrl}
            alt={inheritor.display_name}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <span className="text-sm font-serif font-semibold text-gold-deep">
            {inheritorInitials(inheritor)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-serif text-base text-ink leading-tight truncate">
          {inheritor.display_name}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted mt-0.5 leading-tight">
          {inheritor.relationship && (
            <span className="text-ink-soft truncate">
              {inheritor.relationship}
            </span>
          )}
          {inheritor.relationship && <span aria-hidden>·</span>}
          <span
            className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded ${STATUS_BADGE_CLASS[inheritor.status]}`}
          >
            {(inheritor.status === 'charity' ||
              inheritor.status === 'museum') && (
              <span className="opacity-80">
                <HeartIconSmall />
              </span>
            )}
            {STATUS_LABEL[inheritor.status]}
          </span>
          <span aria-hidden>·</span>
          <span>
            {inheritor.itemCount}{' '}
            {inheritor.itemCount === 1 ? 'item' : 'items'}
          </span>
          <span aria-hidden>·</span>
          <span>
            {inheritor.collectionCount}{' '}
            {inheritor.collectionCount === 1 ? 'collection' : 'collections'}
          </span>
          <span aria-hidden>·</span>
          <span>
            {formatMoney(inheritor.totalValue, inheritor.totalCurrency)}
          </span>
        </div>
      </div>

      <span className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors">
        Manage
      </span>
    </Link>
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
