import Link from 'next/link';
import Image from 'next/image';
import { listInheritors } from '@/lib/api';
import {
  STATUS_LABEL,
  STATUS_BADGE_CLASS,
  inheritorInitials,
} from '@/lib/inheritors';
import { formatMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function InheritorsPage() {
  const inheritors = await listInheritors();

  const totalItems = inheritors.reduce((acc, i) => acc + i.itemCount, 0);
  const totalCollections = inheritors.reduce(
    (acc, i) => acc + i.collectionCount,
    0,
  );
  const totalValue = inheritors.reduce((acc, i) => acc + i.totalValue, 0);
  const totalCurrency = inheritors[0]?.totalCurrency ?? 'USD';

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Inheritors
          </h1>
          <p className="text-muted text-sm sm:text-base mt-2 max-w-xl">
            People designated to receive items, collections, and family
            heirlooms.
          </p>
        </div>
        <Link
          href="/inheritors/new"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors shrink-0"
        >
          <UserPlusIcon className="w-4 h-4" />
          Add Inheritor
        </Link>
      </header>

      {inheritors.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <SummaryGrid
            inheritorCount={inheritors.length}
            itemCount={totalItems}
            collectionCount={totalCollections}
            totalValue={totalValue}
            totalCurrency={totalCurrency}
          />
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-ink">All Inheritors</h2>
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {inheritors.map((i) => (
                <li key={i.id}>
                  <InheritorCard inheritor={i} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <section className="bg-paper border border-hairline rounded-2xl p-8 sm:p-12 text-center shadow-card">
      <div className="mx-auto w-16 h-16 rounded-full bg-gold-soft flex items-center justify-center text-gold-deep mb-4">
        <ScrollIcon className="w-8 h-8" />
      </div>
      <h2 className="font-serif text-2xl sm:text-3xl text-ink">
        Plan your archive&rsquo;s future
      </h2>
      <p className="text-muted text-sm sm:text-base mt-3 max-w-lg mx-auto">
        Designate the people who should receive your items and
        collections. Each item can have a primary and alternate
        inheritor, with notes and transfer instructions.
      </p>
      <Link
        href="/inheritors/new"
        className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors mt-6"
      >
        <UserPlusIcon className="w-4 h-4" />
        Add Your First Inheritor
      </Link>
    </section>
  );
}

function SummaryGrid({
  inheritorCount,
  itemCount,
  collectionCount,
  totalValue,
  totalCurrency,
}: {
  inheritorCount: number;
  itemCount: number;
  collectionCount: number;
  totalValue: number;
  totalCurrency: string;
}) {
  const cards = [
    { value: inheritorCount, label: 'Inheritors', icon: <PeopleIcon /> },
    { value: itemCount, label: 'Assigned Items', icon: <ArchiveIcon /> },
    {
      value: collectionCount,
      label: 'Assigned Collections',
      icon: <BookIcon />,
    },
    {
      value: formatMoney(totalValue, totalCurrency),
      label: 'Estimated Total Value',
      icon: <TagIcon />,
    },
  ];
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <li
          key={c.label}
          className="bg-paper border border-hairline rounded-2xl p-4 flex items-center gap-3 shadow-card"
        >
          <div className="shrink-0 w-12 h-12 rounded-full bg-cream-soft text-gold-deep flex items-center justify-center">
            {c.icon}
          </div>
          <div className="min-w-0">
            <div className="font-serif text-xl sm:text-2xl text-ink leading-none">
              {c.value}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted mt-1.5 leading-tight">
              {c.label}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function InheritorCard({
  inheritor,
}: {
  inheritor: Awaited<ReturnType<typeof listInheritors>>[number];
}) {
  return (
    <Link
      href={`/inheritors/${inheritor.id}`}
      className="block bg-paper border border-hairline rounded-2xl p-5 shadow-card hover:shadow-raised transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 relative w-16 h-16 rounded-full overflow-hidden bg-gold-soft/60 flex items-center justify-center">
          {inheritor.primaryPhotoUrl ? (
            <Image
              src={inheritor.primaryPhotoUrl}
              alt={inheritor.display_name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span className="text-base font-serif font-semibold text-gold-deep">
              {inheritorInitials(inheritor)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-serif text-xl text-ink leading-tight">
              {inheritor.display_name}
            </h3>
            <span
              className={`text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded ${STATUS_BADGE_CLASS[inheritor.status]}`}
            >
              {STATUS_LABEL[inheritor.status]}
            </span>
          </div>
          {inheritor.relationship && (
            <div className="text-sm text-ink-soft mt-0.5">
              {inheritor.relationship}
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-hairline">
        <Stat value={String(inheritor.itemCount)} label="Items" />
        <Stat value={String(inheritor.collectionCount)} label="Collections" />
        <Stat
          value={formatMoney(inheritor.totalValue, inheritor.totalCurrency)}
          label="Value"
        />
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-base text-ink leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted mt-1">
        {label}
      </div>
    </div>
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

function svg(d: string, size = 18): React.ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 21c0-3.5 3.5-6 7-6s7 2.5 7 6" />
      <path d="M18 9v6M15 12h6" />
    </svg>
  );
}

function PeopleIcon() {
  return svg(
    'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4',
  );
}

function ArchiveIcon() {
  return svg('M4 7h16v12H4zM3 4h18v4H3zM10 12h4');
}

function BookIcon() {
  return svg(
    'M4 4h7v16H6a2 2 0 0 1-2-2zM20 4h-7v16h5a2 2 0 0 0 2-2zM12 4v16',
  );
}

function TagIcon() {
  return svg(
    'M3 12V4h8l10 10-8 8L3 12zM8 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  );
}

function ScrollIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 2h11a3 3 0 0 1 3 3v3h-3M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3H7M7 2v18" />
      <path d="M10 7h6M10 11h6" />
    </svg>
  );
}
