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
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Inheritors
          </h1>
          <p className="text-muted text-sm sm:text-base mt-2 max-w-xl">
            People designated to receive items, collections, and family
            heirlooms in the future.
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

      <HeroCard hasInheritors={inheritors.length > 0} />

      <InheritorTypesSection />

      <HowInheritanceWorksSection />

      {inheritors.length > 0 && (
        <InheritanceSummarySection
          inheritors={inheritors}
          totalItems={totalItems}
          totalCollections={totalCollections}
          totalValue={totalValue}
          totalCurrency={totalCurrency}
        />
      )}
    </div>
  );
}

// ============================================================== //
//  Hero card                                                      //
// ============================================================== //

function HeroCard({ hasInheritors }: { hasInheritors: boolean }) {
  const bullets = [
    {
      title: 'Primary Inheritor',
      body: 'The person you want to receive an item or collection first.',
    },
    {
      title: 'Alternate Inheritor',
      body: 'A backup recipient if the primary cannot or chooses not to accept.',
    },
    {
      title: 'Transfer Notes',
      body: 'Context for how and when each item should be passed on.',
    },
    {
      title: 'Special Instructions',
      body: 'Personal wishes, conditions, or stories that travel with the item.',
    },
  ];

  return (
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-10 shadow-card">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gold-soft flex items-center justify-center text-gold-deep mb-4">
          <KeyIcon className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink">
          Plan Your Family Legacy
        </h2>
        <p className="text-muted text-sm sm:text-base mt-3 max-w-xl">
          Designate who should receive your items and collections in the
          future. Inheritors let you document your wishes today so the
          people you trust know exactly what comes next.
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-3xl mx-auto">
        {bullets.map((b) => (
          <li
            key={b.title}
            className="flex items-start gap-3 bg-cream-soft/50 border border-hairline rounded-xl p-4"
          >
            <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
              <CheckIcon className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <div className="font-serif text-base text-ink leading-tight">
                {b.title}
              </div>
              <div className="text-xs text-ink-soft mt-1 leading-relaxed">
                {b.body}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-center mt-8">
        <Link
          href="/inheritors/new"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
        >
          <UserPlusIcon className="w-4 h-4" />
          {hasInheritors ? 'Add Another Inheritor' : 'Add Your First Inheritor'}
        </Link>
      </div>
    </section>
  );
}

// ============================================================== //
//  Inheritor types                                                //
// ============================================================== //

function InheritorTypesSection() {
  const types = [
    {
      key: 'designated_heir',
      title: 'Designated Heir',
      icon: <PeopleIcon />,
      body: 'Receives an item or collection according to your wishes.',
      examples: ['Family members', 'Friends', 'Organizations'],
    },
    {
      key: 'alternate',
      title: 'Alternate Inheritor',
      icon: <RefreshIcon />,
      body: 'Receives the item if the primary inheritor cannot.',
      examples: [
        'Backup recipient',
        'Secondary family member',
        'Contingency heir',
      ],
    },
    {
      key: 'charity',
      title: 'Charity',
      icon: <HeartIcon />,
      body: 'Designated nonprofit organization or cause to receive selected items.',
      examples: ['Historical society', 'Church', 'Foundation', 'Charity'],
    },
    {
      key: 'museum',
      title: 'Museum / Archive',
      icon: <BuildingIcon />,
      body: 'Institution designated to preserve important items for future generations.',
      examples: [
        'Museum',
        'Library',
        'University archive',
        'Historical collection',
      ],
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">Inheritor Types</h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          Inheritors fall into a few common roles. You can mix and match
          across your archive — each item or collection can have its own
          chain of recipients.
        </p>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {types.map((t) => (
          <li
            key={t.key}
            className="bg-paper border border-hairline rounded-2xl p-5 space-y-3 shadow-card"
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                {t.icon}
              </span>
              <h3 className="font-serif text-xl text-ink leading-tight">
                {t.title}
              </h3>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">{t.body}</p>
            <div className="space-y-1 pt-1">
              <div className="text-[11px] uppercase tracking-wider text-muted">
                Examples
              </div>
              <ul className="space-y-1">
                {t.examples.map((ex) => (
                  <li
                    key={ex}
                    className="flex items-start gap-2 text-sm text-ink-soft"
                  >
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gold-deep shrink-0" />
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================== //
//  How inheritance works                                          //
// ============================================================== //

function HowInheritanceWorksSection() {
  const steps = [
    {
      kicker: 'Step 1',
      title: 'Current Custodian',
      sample: 'You',
      body: 'The person who owns and cares for the item today.',
      icon: <UserIcon className="w-5 h-5" />,
    },
    {
      kicker: 'Step 2',
      title: 'Primary Inheritor',
      sample: 'Grandson Michael',
      body: 'Designated to receive the item next.',
      icon: <KeyIcon className="w-5 h-5" />,
    },
    {
      kicker: 'Step 3',
      title: 'Alternate Inheritor',
      sample: 'Daughter Sarah',
      body: 'Receives the item if the primary inheritor cannot.',
      icon: <RefreshIcon />,
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">How Inheritance Works</h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          Every item in your archive can carry an inheritance chain.
          Here&rsquo;s the path a single heirloom follows from today into
          the future.
        </p>
      </div>
      <div className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-hairline">
          <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
            <WatchIcon />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted">
              Example
            </div>
            <div className="font-serif text-lg text-ink leading-tight">
              Grandpa Joe&rsquo;s Pocket Watch
            </div>
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:items-stretch">
          {steps.map((s, idx) => (
            <li
              key={s.kicker}
              className="relative flex flex-col items-start md:items-center md:text-center md:px-4 md:flex-1"
            >
              <div className="flex md:flex-col items-center md:items-center gap-3 md:gap-2 w-full">
                <span className="shrink-0 w-12 h-12 rounded-full bg-cream-soft text-gold-deep flex items-center justify-center border border-hairline">
                  {s.icon}
                </span>
                {idx < steps.length - 1 && (
                  <span
                    className="hidden md:block absolute top-6 left-1/2 w-full h-px bg-hairline"
                    aria-hidden
                  />
                )}
                <div className="min-w-0 md:mt-2">
                  <div className="text-[10px] uppercase tracking-widest text-muted">
                    {s.kicker}
                  </div>
                  <div className="font-serif text-base text-ink leading-tight mt-0.5">
                    {s.title}
                  </div>
                </div>
              </div>
              <div className="md:mt-3 mt-2 ml-15 md:ml-0 w-full">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-gold-soft text-[11px] font-medium text-gold-deep">
                  {s.sample}
                </div>
                <p className="text-xs text-ink-soft mt-2 leading-relaxed">
                  {s.body}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <span
                  className="md:hidden mt-3 ml-5 text-muted"
                  aria-hidden
                >
                  <ArrowDownIcon />
                </span>
              )}
            </li>
          ))}
        </ol>

        <p className="text-xs text-muted mt-6 pt-4 border-t border-hairline leading-relaxed">
          Inheritance assignments do not transfer ownership today. They
          simply document your wishes for future generations.
        </p>
      </div>
    </section>
  );
}

// ============================================================== //
//  Inheritance summary (only when there are inheritors)           //
// ============================================================== //

function InheritanceSummarySection({
  inheritors,
  totalItems,
  totalCollections,
  totalValue,
  totalCurrency,
}: {
  inheritors: Awaited<ReturnType<typeof listInheritors>>;
  totalItems: number;
  totalCollections: number;
  totalValue: number;
  totalCurrency: string;
}) {
  const cards = [
    { value: inheritors.length, label: 'Inheritors', icon: <PeopleIcon /> },
    { value: totalItems, label: 'Assigned Items', icon: <ArchiveIcon /> },
    {
      value: totalCollections,
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
    <section className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-ink">Inheritance Summary</h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          A snapshot of your inheritance plan today.
        </p>
      </div>

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
              <div className="font-serif text-xl sm:text-2xl text-ink leading-none truncate">
                {c.value}
              </div>
              <div className="text-[11px] uppercase tracking-wider text-muted mt-1.5 leading-tight">
                {c.label}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-4">
        <h3 className="font-serif text-xl text-ink">Your Inheritors</h3>
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {inheritors.map((i) => (
            <li key={i.id}>
              <InheritorCard inheritor={i} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function InheritorCard({
  inheritor,
}: {
  inheritor: Awaited<ReturnType<typeof listInheritors>>[number];
}) {
  return (
    <article className="bg-paper border border-hairline rounded-2xl p-5 shadow-card">
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
            <h4 className="font-serif text-xl text-ink leading-tight">
              {inheritor.display_name}
            </h4>
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
          {inheritor.email && (
            <div className="text-xs text-muted truncate mt-1">
              {inheritor.email}
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

      <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-hairline">
        <Link
          href={`/inheritors/${inheritor.id}`}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-ink/20 text-ink text-sm font-medium hover:border-ink/40 transition-colors"
        >
          <EyeIcon className="w-3.5 h-3.5" />
          View Profile
        </Link>
        <Link
          href={`/inheritors/${inheritor.id}`}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-cream-soft text-ink text-sm font-medium hover:bg-gold-soft transition-colors"
        >
          <ListIcon className="w-3.5 h-3.5" />
          Manage Assignments
        </Link>
      </div>
    </article>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="font-serif text-base text-ink leading-none truncate">
        {value}
      </div>
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

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={18}
      height={18}
      aria-hidden="true"
    >
      <circle cx="8" cy="14" r="4" />
      <path d="M11 12l10-10M15 6l3 3M18 4l2 2" />
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
  return svg('M3 12V4h8l10 10-8 8L3 12zM8 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z');
}

function RefreshIcon() {
  return svg('M4 4v6h6M20 20v-6h-6M20 10a8 8 0 0 0-14.93-2.5M4 14a8 8 0 0 0 14.93 2.5');
}

function HeartIcon() {
  return svg(
    'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  );
}

function BuildingIcon() {
  return svg(
    'M4 21V7l8-4 8 4v14M4 21h16M9 21v-6h6v6M8 11h.01M12 11h.01M16 11h.01',
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M5 12l5 5 9-12" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}

function WatchIcon() {
  return svg(
    'M12 7v5l3 2M8 3l1 3M16 3l-1 3M8 21l1-3M16 21l-1-3M5 12a7 7 0 1 0 14 0 7 7 0 0 0-14 0z',
  );
}

function ArrowDownIcon() {
  return svg('M12 4v16M6 14l6 6 6-6');
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
      <circle cx="20" cy="18" r="1.2" fill="currentColor" />
    </svg>
  );
}
