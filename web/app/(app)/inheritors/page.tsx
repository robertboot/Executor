import Link from 'next/link';
import Image from 'next/image';
import { listInheritors } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import InheritorsList from './InheritorsList';

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
          <PlusIcon className="w-4 h-4" />
          Add Inheritor
        </Link>
      </header>

      <HeroCard />

      <InheritorTypesSection />

      <WorkflowAndOverviewRow
        inheritorCount={inheritors.length}
        itemCount={totalItems}
        collectionCount={totalCollections}
        totalValue={totalValue}
        totalCurrency={totalCurrency}
      />

      {inheritors.length > 0 && <InheritorsList inheritors={inheritors} />}

      <TipBanner />
    </div>
  );
}

// ============================================================== //
//  Hero card                                                      //
// ============================================================== //

function HeroCard() {
  const bullets = [
    'Primary Inheritors',
    'Alternate Inheritors',
    'Transfer Notes',
    'Special Instructions',
  ];

  return (
    <section className="relative overflow-hidden bg-paper border border-hairline rounded-2xl shadow-card">
      {/* Background image — fills the whole hero block */}
      <Image
        src="/inheritors-hero.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-right"
        priority
      />

      {/* Cream-to-transparent overlay so the text stays readable on the left */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-paper/90 via-paper/75 to-transparent lg:from-paper/90 lg:via-paper/60 lg:to-transparent"
        aria-hidden
      />

      {/* Content overlay */}
      <div className="relative grid grid-cols-1 lg:grid-cols-2">
        {/* Left: copy */}
        <div className="p-6 sm:p-10 flex flex-col">
          <div className="w-14 h-14 rounded-full bg-gold-soft flex items-center justify-center text-gold-deep mb-5">
            <KeyIcon className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-ink leading-tight">
            Protect Your Wishes
          </h2>
          <div className="text-ink-soft text-sm sm:text-base mt-3 max-w-md leading-relaxed space-y-3">
            <p>
              Record who should receive your heirlooms, collections, and
              treasured possessions.
            </p>
            <p>
              Create a clear plan for future generations with designated
              inheritors, alternates, and special instructions.
            </p>
          </div>

          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-widest text-muted mb-3">
              Every assignment includes:
            </div>
            <ul className="space-y-2.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm text-ink">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href="/inheritors/new"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Inheritor
            </Link>
          </div>
        </div>

        {/* Right: spacer so the image shows through */}
        <div className="hidden lg:block min-h-[420px]" aria-hidden />
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
      icon: <UserIcon />,
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
      <h2 className="font-serif text-2xl text-ink">Inheritor Types</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {types.map((t) => (
          <li
            key={t.key}
            className="bg-paper border border-hairline rounded-2xl p-5 space-y-3 shadow-card"
          >
            <div className="flex items-center gap-3">
              <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                {t.icon}
              </span>
              <h3 className="font-serif text-lg text-ink leading-tight">
                {t.title}
              </h3>
            </div>
            <p className="text-sm text-ink-soft leading-relaxed">{t.body}</p>
            <div className="space-y-2 pt-1">
              <div className="text-[11px] uppercase tracking-wider text-muted">
                Examples:
              </div>
              <ul className="space-y-1">
                {t.examples.map((ex) => (
                  <li
                    key={ex}
                    className="flex items-center gap-2 text-sm text-ink-soft"
                  >
                    <CheckIcon className="w-3 h-3 text-forest shrink-0" />
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
//  Workflow + Overview row                                        //
// ============================================================== //

function WorkflowAndOverviewRow({
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
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HowInheritanceWorksCard />
      <InheritanceOverviewCard
        inheritorCount={inheritorCount}
        itemCount={itemCount}
        collectionCount={collectionCount}
        totalValue={totalValue}
        totalCurrency={totalCurrency}
      />
    </div>
  );
}

function HowInheritanceWorksCard() {
  const steps = [
    {
      kicker: 'Current Custodian',
      name: 'You',
      body: 'The person currently responsible for the item.',
      tone: 'muted' as const,
    },
    {
      kicker: 'Primary Inheritor',
      name: 'Designated Heir',
      body: 'First in line to receive the item in the future.',
      tone: 'forest' as const,
    },
    {
      kicker: 'Alternate Inheritor',
      name: 'Backup Recipient',
      body: 'Receives the item if the primary inheritor cannot.',
      tone: 'soft' as const,
    },
  ];

  return (
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card">
      <h3 className="font-serif text-xl text-ink">How Inheritance Works</h3>
      <p className="text-sm text-muted mt-1 leading-relaxed">
        Inheritance assignments document your wishes for future
        generations.
      </p>

      <ol className="mt-6 space-y-5 relative">
        {steps.map((s, idx) => (
          <li key={s.kicker} className="relative flex gap-4">
            <div className="relative shrink-0 flex flex-col items-center">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                  s.tone === 'forest'
                    ? 'bg-forest text-cream border-forest'
                    : s.tone === 'soft'
                      ? 'bg-gold-soft text-gold-deep border-gold-soft'
                      : 'bg-cream-soft text-ink-soft border-hairline'
                }`}
              >
                {s.tone === 'forest' ? (
                  <KeyIcon className="w-4 h-4" />
                ) : (
                  <UserIconSmall />
                )}
              </span>
              {idx < steps.length - 1 && (
                <span
                  className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-full border-l border-dashed border-hairline"
                  aria-hidden
                />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="text-[11px] uppercase tracking-widest text-muted">
                {s.kicker}
              </div>
              <div className="font-serif text-base text-ink leading-tight mt-0.5">
                {s.name}
              </div>
              <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InheritanceOverviewCard({
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
  const stats = [
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
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl text-ink">Inheritance Overview</h3>
        <Link
          href="#your-inheritors"
          className="text-xs font-medium text-forest hover:text-forest-deep inline-flex items-center gap-1"
        >
          View Full Summary
          <ChevronRightIcon />
        </Link>
      </div>

      <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-5">
        {stats.map((s) => (
          <li
            key={s.label}
            className="bg-cream-soft/60 border border-hairline rounded-xl p-3 text-center"
          >
            <div className="mx-auto w-9 h-9 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
              {s.icon}
            </div>
            <div className="font-serif text-lg text-ink leading-none mt-2 truncate">
              {s.value}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted mt-1.5 leading-tight">
              {s.label}
            </div>
          </li>
        ))}
      </ul>

      <p className="text-sm text-ink-soft mt-6 leading-relaxed">
        {inheritorCount > 0
          ? 'These items and collections have been assigned to your inheritors according to your wishes.'
          : 'Start by adding an inheritor to assign items, collections, and treasured possessions for the future.'}
      </p>

      <div className="mt-auto pt-6 flex justify-center text-gold-soft">
        <KeyDecorIcon />
      </div>
    </section>
  );
}

// ============================================================== //
//  Tip banner                                                     //
// ============================================================== //

function TipBanner() {
  return (
    <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-cream-soft/70 border border-hairline rounded-2xl px-5 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
          <LightbulbIcon />
        </span>
        <p className="text-sm text-ink-soft leading-relaxed">
          <span className="font-medium text-ink">Tip:</span> You can
          assign or change inheritors directly from any item&rsquo;s
          detail page.
        </p>
      </div>
      <Link
        href="/inheritors/new"
        className="shrink-0 text-sm font-medium text-forest hover:text-forest-deep inline-flex items-center gap-1"
      >
        Learn How
        <ChevronRightIcon />
      </Link>
    </section>
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

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
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

function UserIcon() {
  return svg('M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.5-7 8-7s8 3 8 7');
}

function UserIconSmall() {
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
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

function RefreshIcon() {
  return svg(
    'M4 4v6h6M20 20v-6h-6M20 10a8 8 0 0 0-14.93-2.5M4 14a8 8 0 0 0 14.93 2.5',
  );
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

function PeopleIcon() {
  return svg(
    'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4',
    16,
  );
}

function ArchiveIcon() {
  return svg('M4 7h16v12H4zM3 4h18v4H3zM10 12h4', 16);
}

function BookIcon() {
  return svg(
    'M4 4h7v16H6a2 2 0 0 1-2-2zM20 4h-7v16h5a2 2 0 0 0 2-2zM12 4v16',
    16,
  );
}

function TagIcon() {
  return svg('M3 12V4h8l10 10-8 8L3 12zM8 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 16);
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path d="M9 18h6M10 22h4M12 2a6 6 0 0 0-4 10.5c1 1 1.5 2 1.5 3.5h5c0-1.5.5-2.5 1.5-3.5A6 6 0 0 0 12 2z" />
    </svg>
  );
}

function KeyDecorIcon() {
  return (
    <svg
      viewBox="0 0 120 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={120}
      height={24}
      aria-hidden="true"
    >
      <path d="M0 12h45M75 12h45" />
      <circle cx="60" cy="12" r="6" />
      <path d="M66 12h4M68 10v4" />
    </svg>
  );
}
