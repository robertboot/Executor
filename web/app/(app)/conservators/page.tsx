import Link from 'next/link';
import Image from 'next/image';
import { listConservators, listMyCollectionsRich } from '@/lib/api';
import { getMyDisplayName } from '@/lib/me';
import ConservatorsList from './ConservatorsList';

export const dynamic = 'force-dynamic';

export default async function ConservatorsPage() {
  const [conservators, collections, myName] = await Promise.all([
    listConservators(),
    listMyCollectionsRich(),
    getMyDisplayName(),
  ]);

  const summary = {
    active: conservators.length,
    sharedCollections: collections.length,
    recentChanges: 0,
    auditCoverage: conservators.length > 0 ? 100 : 0,
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
            Conservators
          </h1>
          <p className="text-muted text-sm sm:text-base mt-2 max-w-xl">
            Invite trusted family members, historians, or caretakers to
            help preserve your archive.
          </p>
        </div>
        <Link
          href="/conservators/new"
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors shrink-0"
        >
          <UserPlusIcon className="w-4 h-4" />
          Invite Conservator
        </Link>
      </header>

      <HeroCard />

      {conservators.length > 0 && (
        <ConservatorsList conservators={conservators} />
      )}

      <WorkflowAndOverviewRow myName={myName} summary={summary} />

      <PermissionLevelsSection />
    </div>
  );
}

// ============================================================== //
//  Hero card                                                      //
// ============================================================== //

function HeroCard() {
  const bullets = [
    'View Access',
    'Edit Access',
    'Activity Tracking',
    'Permanent Audit Log',
  ];

  return (
    <section className="relative overflow-hidden bg-paper border border-hairline rounded-2xl shadow-card">
      {/* Background image — fills the whole hero block */}
      <Image
        src="/conservators-hero.png"
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
          <h2 className="font-serif text-2xl sm:text-3xl text-ink leading-tight">
            Protect Your Family Archive
          </h2>
          <div className="text-ink-soft text-sm sm:text-base mt-3 max-w-md leading-relaxed space-y-3">
            <p>
              Invite trusted family members, historians, or friends to
              help preserve your collections.
            </p>
            <p>
              Give them view or edit access, and every change is
              permanently recorded in the archive log.
            </p>
          </div>

          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-widest text-muted mb-3">
              Every conservator comes with:
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

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/conservators/new"
              className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-forest text-cream text-sm font-medium hover:bg-forest-deep transition-colors"
            >
              <UserPlusIcon className="w-4 h-4" />
              Invite Conservator
            </Link>
            <Link
              href="#permission-levels"
              className="inline-flex items-center px-5 h-11 rounded-lg border border-ink/20 bg-paper/70 text-ink text-sm font-medium hover:border-ink/40 transition-colors backdrop-blur-sm"
            >
              Learn About Permissions
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
//  Workflow + overview row                                        //
// ============================================================== //

type SummaryShape = {
  active: number;
  sharedCollections: number;
  recentChanges: number;
  auditCoverage: number;
};

function WorkflowAndOverviewRow({
  myName,
  summary,
}: {
  myName: string;
  summary: SummaryShape;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <HowStewardshipWorksCard myName={myName} />
      <StewardshipOverviewCard summary={summary} />
    </div>
  );
}

function HowStewardshipWorksCard({ myName }: { myName: string }) {
  const steps = [
    {
      kicker: 'Owner',
      name: myName,
      body: 'You hold full access and decide who else can help.',
      tone: 'muted' as const,
    },
    {
      kicker: 'Conservator',
      name: 'Trusted helper',
      body: 'A family member, historian, or friend with view or edit access.',
      tone: 'forest' as const,
    },
    {
      kicker: 'Archive Log',
      name: 'Permanent record',
      body: 'Every change a conservator makes is captured for the future.',
      tone: 'soft' as const,
    },
  ];

  return (
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card">
      <h3 className="font-serif text-xl text-ink">How Stewardship Works</h3>
      <p className="text-sm text-muted mt-1 leading-relaxed">
        You stay in control, conservators help with the work, and the
        archive log keeps everyone honest.
      </p>

      <ol className="mt-6 space-y-5 relative">
        {steps.map((s, idx) => (
          <WorkflowStep
            key={s.kicker}
            kicker={s.kicker}
            name={s.name}
            body={s.body}
            tone={s.tone}
            isLast={idx === steps.length - 1}
          />
        ))}
      </ol>
    </section>
  );
}

function StewardshipOverviewCard({ summary }: { summary: SummaryShape }) {
  const stats = [
    { value: summary.active, label: 'Active Conservators', icon: <PeopleIcon /> },
    {
      value: summary.sharedCollections,
      label: 'Shared Collections',
      icon: <ArchiveIcon />,
    },
    {
      value: summary.recentChanges,
      label: 'Recent Changes',
      icon: <DocIcon />,
    },
    {
      value: `${summary.auditCoverage}%`,
      label: 'Audit Coverage',
      icon: <CheckBadgeIcon />,
    },
  ];

  return (
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-xl text-ink">Stewardship Overview</h3>
        <Link
          href="#permission-levels"
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
        {summary.active > 0
          ? 'Your conservators are helping keep the archive accurate and complete.'
          : 'Invite a conservator to share the work of preserving the archive without giving up control.'}
      </p>

      <div className="mt-auto pt-6 flex justify-center text-gold-soft">
        <ShieldDecorIcon />
      </div>
    </section>
  );
}

function WorkflowStep({
  kicker,
  name,
  body,
  tone,
  isLast,
}: {
  kicker: string;
  name: string;
  body: string;
  tone: 'muted' | 'forest' | 'soft';
  isLast: boolean;
}) {
  const avatarClass =
    tone === 'forest'
      ? 'bg-forest text-cream border-forest'
      : tone === 'soft'
        ? 'bg-gold-soft text-gold-deep border-gold-soft'
        : 'bg-cream-soft text-ink-soft border-hairline';
  return (
    <li className="grid grid-cols-[44px_minmax(0,1fr)] gap-4">
      <div className="relative flex flex-col items-center">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center border ${avatarClass}`}
        >
          <UserIconSmall />
        </span>
        {!isLast && (
          <span
            className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-full border-l border-dashed border-hairline"
            aria-hidden
          />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.2fr] gap-1 sm:gap-3 pb-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-gold-deep">
            {kicker}
          </div>
          <div className="font-serif text-base text-ink leading-tight mt-0.5 truncate">
            {name}
          </div>
        </div>
        <p className="text-xs text-ink-soft leading-relaxed sm:mt-0.5">
          {body}
        </p>
      </div>
    </li>
  );
}

// ============================================================== //
//  Permission levels                                              //
// ============================================================== //

function PermissionLevelsSection() {
  const levels = [
    {
      key: 'viewer',
      title: 'Viewer',
      icon: <EyeIcon />,
      can: ['View collections', 'View items', 'Search archive'],
      cannot: ['Edit items', 'Delete items', 'Export archive'],
    },
    {
      key: 'contributor',
      title: 'Contributor',
      icon: <PencilIcon />,
      can: [
        'View collections',
        'Add items',
        'Edit item metadata',
        'Upload photos',
      ],
      cannot: ['Delete items', 'Change ownership', 'Manage access'],
    },
    {
      key: 'curator',
      title: 'Curator',
      icon: <ShieldIcon />,
      can: [
        'Edit items',
        'Manage collections',
        'Add stories',
        'Assign items to people',
        'View full activity logs',
      ],
      cannot: ['Delete archive', 'Transfer ownership'],
    },
    {
      key: 'owner',
      title: 'Owner',
      icon: <CrownIcon />,
      can: [
        'Full access',
        'Manage conservators',
        'Export archive',
        'Restore changes',
        'Transfer ownership',
      ],
      cannot: [],
    },
  ];

  return (
    <section id="permission-levels" className="space-y-4">
      <h2 className="font-serif text-2xl text-ink">Permission levels</h2>
      <p className="text-muted text-sm max-w-2xl">
        Each conservator gets one of these access levels. You can change
        them any time from a conservator&rsquo;s Edit Access screen.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {levels.map((l) => (
          <li
            key={l.key}
            className="bg-paper border border-hairline rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                {l.icon}
              </span>
              <h3 className="font-serif text-xl text-ink">{l.title}</h3>
            </div>
            <div className="space-y-2 pt-1">
              <div className="text-[11px] uppercase tracking-wider text-muted">
                Can:
              </div>
              <ul className="space-y-1">
                {l.can.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-ink-soft">
                    <CheckIcon className="w-3.5 h-3.5 text-forest mt-1 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {l.cannot.length > 0 && (
                <>
                  <div className="text-[11px] uppercase tracking-wider text-muted pt-2">
                    Cannot:
                  </div>
                  <ul className="space-y-1">
                    {l.cannot.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2 text-sm text-muted"
                      >
                        <CrossIcon className="w-3.5 h-3.5 text-muted mt-1 shrink-0" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

function svg(
  d: string,
  size = 18,
  fill = 'none',
  strokeWidth = 1.6,
): React.ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
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
  return svg('M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4');
}

function ArchiveIcon() {
  return svg('M4 7h16v12H4zM3 4h18v4H3zM10 12h4');
}

function DocIcon() {
  return svg('M6 3h9l3 3v15H6zM15 3v3h3M9 10h6M9 13h6M9 16h4');
}

function CheckBadgeIcon() {
  return svg('M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4');
}

function ShieldIcon({ className }: { className?: string }) {
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
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function EyeIcon() {
  return svg('M1.5 12s4-7 10.5-7 10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z');
}

function PencilIcon({ className }: { className?: string }) {
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
      <path d="M3 21l3-1 12-12-3-3L3 18z" />
      <path d="M15 5l3 3" />
    </svg>
  );
}

function CrownIcon() {
  return svg('M3 18h18M5 18l-1-9 5 4 3-6 3 6 5-4-1 9');
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

function CrossIcon({ className }: { className?: string }) {
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
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
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

function ShieldDecorIcon() {
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
      <path d="M60 6l5 2v4c0 3-2.2 5-5 5.5-2.8-.5-5-2.5-5-5.5V8z" />
      <path d="M57 11.5l1.8 1.8 3.2-3.2" />
    </svg>
  );
}
