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
  const roles: RoleSpec[] = [
    {
      key: 'viewer',
      title: 'Viewer',
      icon: <EyeIcon />,
      badge: {
        label: 'Lowest Access',
        className: 'bg-cream-soft text-forest border border-forest/20',
      },
      description: 'View-only access to the archive.',
      bestFor: { label: 'Family Members', icon: <PeopleIcon /> },
      abilities: [
        'Browse collections',
        'View photographs',
        'Read stories',
        'Search archive records',
      ],
      limitation: 'Cannot modify archive content.',
      accent: 'bg-[#9CB39E]', // sage
    },
    {
      key: 'contributor',
      title: 'Contributor',
      icon: <PencilIcon />,
      badge: {
        label: 'Content Creation',
        className:
          'bg-gold-soft text-gold-deep border border-gold-deep/20',
      },
      description: 'Can help build the archive.',
      bestFor: {
        label: 'Relatives Adding Photos',
        icon: <ImageIcon />,
      },
      abilities: [
        'Add photos',
        'Create items',
        'Update details',
        'Contribute stories',
      ],
      limitation: 'Cannot delete archive records.',
      accent: 'bg-[#C68A2E]', // antique gold
    },
    {
      key: 'curator',
      title: 'Curator',
      icon: <ArchiveColumnIcon />,
      badge: {
        label: 'Advanced Access',
        className: 'bg-[#D6E4E0] text-[#234B40] border border-[#234B40]/15',
      },
      description: 'Helps organize and maintain the archive.',
      bestFor: { label: 'Family Historians', icon: <BookIcon /> },
      abilities: [
        'Edit archive records',
        'Manage collections',
        'Assign items to people',
        'Review history logs',
        'Manage provenance',
      ],
      limitation: null,
      accent: 'bg-[#234B40]', // dark teal
    },
    {
      key: 'owner',
      title: 'Owner',
      icon: <CrownIcon />,
      badge: {
        label: 'Highest Access',
        className: 'bg-forest text-cream',
      },
      description: 'Full control of the archive.',
      bestFor: { label: 'Archive Creator', icon: <BadgeIcon /> },
      abilities: [
        'Full archive control',
        'Manage conservators',
        'Export archive',
        'Restore changes',
        'Transfer ownership',
      ],
      limitation: null,
      accent: 'bg-forest', // deep green
    },
  ];

  return (
    <section id="permission-levels" className="space-y-6">
      <header>
        <h2 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Conservator Roles
        </h2>
        <p className="text-muted text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
          Choose how much responsibility each Conservator has within
          your archive. Every change is permanently recorded and can be
          reviewed later.
        </p>
      </header>

      {/* Progression bar — Viewer → Contributor → Curator → Owner */}
      <div
        className="hidden lg:flex items-center justify-between gap-2 px-8"
        aria-hidden
      >
        {roles.map((r, idx) => (
          <div key={r.key} className="flex items-center flex-1 justify-center">
            <div
              className="shrink-0 w-16 h-16 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25 [&_svg]:w-7 [&_svg]:h-7"
              style={{
                background:
                  'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
                boxShadow:
                  'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 6px rgba(180,140,55,0.18)',
              }}
            >
              {r.icon}
            </div>
            {idx < roles.length - 1 && (
              <div className="flex-1 mx-3 h-px bg-gold-deep/35 relative">
                <ArrowHead className="absolute right-0 top-1/2 -translate-y-1/2 text-gold-deep/60" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Role cards */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => (
          <li key={r.key}>
            <RoleCard role={r} />
          </li>
        ))}
      </ul>

      {/* Permission comparison matrix */}
      <PermissionMatrix />

      {/* Footer audit note */}
      <div className="flex items-start gap-3 pt-4">
        <span
          className="shrink-0 w-10 h-10 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25 [&_svg]:w-5 [&_svg]:h-5"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 1px 3px rgba(180,140,55,0.15)',
          }}
        >
          <ShieldIcon />
        </span>
        <p className="text-sm text-muted leading-relaxed pt-2">
          All actions are logged and can be reviewed in the activity
          history.
        </p>
      </div>
    </section>
  );
}

// ----- Role card ----- //

interface RoleSpec {
  key: string;
  title: string;
  icon: React.ReactNode;
  badge: { label: string; className: string };
  description: string;
  bestFor: { label: string; icon: React.ReactNode };
  abilities: string[];
  limitation: string | null;
  accent: string;
}

function RoleCard({ role }: { role: RoleSpec }) {
  return (
    <article className="relative bg-paper border border-hairline rounded-2xl shadow-card overflow-hidden h-full flex flex-col">
      {/* Top accent strip */}
      <div className={`h-1 ${role.accent}`} aria-hidden />

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        {/* Header: icon + title + badge */}
        <div className="flex items-center gap-3">
          <span
            className="shrink-0 w-11 h-11 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25 [&_svg]:w-5 [&_svg]:h-5"
            style={{
              background:
                'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
              boxShadow:
                'inset 0 1px 2px rgba(255,255,255,0.7), 0 2px 5px rgba(180,140,55,0.15)',
            }}
          >
            {role.icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-lg text-ink leading-tight">
              {role.title}
            </h3>
            <span
              className={`inline-flex items-center text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded mt-0.5 ${role.badge.className}`}
            >
              {role.badge.label}
            </span>
          </div>
        </div>

        {/* Best For */}
        <div className="pt-2 border-t border-hairline">
          <div className="text-[10px] uppercase tracking-widest text-muted">
            Best for
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <span className="font-serif text-sm text-ink leading-tight">
              {role.bestFor.label}
            </span>
            <span className="text-gold-deep shrink-0" aria-hidden>
              {role.bestFor.icon}
            </span>
          </div>
        </div>

        {/* Abilities */}
        <ul className="space-y-1.5 flex-1 pt-1">
          {role.abilities.map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 text-[13px] text-ink-soft leading-snug"
            >
              <span className="shrink-0 mt-0.5 w-3.5 h-3.5 rounded-full bg-forest/10 text-forest flex items-center justify-center">
                <CheckIcon className="w-2 h-2" />
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* Limitation footer */}
        {role.limitation && (
          <div className="flex items-center gap-2 pt-2 border-t border-hairline text-[11px] text-muted">
            <LockIcon className="w-3 h-3 text-muted shrink-0" />
            <span>{role.limitation}</span>
          </div>
        )}
      </div>
    </article>
  );
}

// ----- Permission comparison matrix ----- //

function PermissionMatrix() {
  const T = true;
  const F = false;
  const caps: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    granted: [boolean, boolean, boolean, boolean]; // [viewer, contributor, curator, owner]
  }> = [
    {
      key: 'view',
      label: 'View Items',
      icon: <EyeIcon />,
      granted: [T, T, T, T],
    },
    {
      key: 'add',
      label: 'Add Items',
      icon: <PlusCircleIcon />,
      granted: [F, T, T, T],
    },
    {
      key: 'edit',
      label: 'Edit Items',
      icon: <PencilIcon />,
      granted: [F, T, T, T],
    },
    {
      key: 'delete',
      label: 'Delete Items',
      icon: <TrashIcon />,
      granted: [F, F, T, T],
    },
    {
      key: 'collections',
      label: 'Manage Collections',
      icon: <FolderIcon />,
      granted: [F, F, T, T],
    },
    {
      key: 'logs',
      label: 'View Activity Logs',
      icon: <ClockIcon />,
      granted: [F, F, T, T],
    },
    {
      key: 'manage',
      label: 'Manage Conservators',
      icon: <PeopleIcon />,
      granted: [F, F, F, T],
    },
    {
      key: 'export',
      label: 'Export Archive',
      icon: <DownloadIcon />,
      granted: [F, F, F, T],
    },
    {
      key: 'restore',
      label: 'Restore Changes',
      icon: <RotateIcon />,
      granted: [F, F, F, T],
    },
    {
      key: 'transfer',
      label: 'Transfer Ownership',
      icon: <KeyIcon />,
      granted: [F, F, F, T],
    },
  ];

  const columns = [
    { label: 'Viewer', icon: <EyeIcon /> },
    { label: 'Contributor', icon: <PencilIcon /> },
    { label: 'Curator', icon: <ArchiveColumnIcon /> },
    { label: 'Owner', icon: <CrownIcon /> },
  ];

  return (
    <div className="bg-paper border border-hairline rounded-2xl shadow-card overflow-hidden">
      <div className="px-5 sm:px-7 py-5 flex items-center gap-3 border-b border-hairline">
        <span
          className="shrink-0 w-11 h-11 rounded-full text-gold-deep flex items-center justify-center border border-gold-deep/25"
          style={{
            background:
              'radial-gradient(circle at 32% 28%, #F8EBCC 0%, #EDD9A6 55%, #D9B97A 100%)',
            boxShadow:
              'inset 0 1px 2px rgba(255,255,255,0.7), 0 1px 3px rgba(180,140,55,0.15)',
          }}
        >
          <ScalesIcon />
        </span>
        <h3 className="font-serif text-2xl text-ink">Permission Comparison</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              <th className="w-2/5 text-left py-4 px-4 sm:px-6" />
              {columns.map((c) => (
                <th key={c.label} className="text-center py-4 px-2 sm:px-4">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-gold-deep">{c.icon}</span>
                    <span className="font-serif text-base text-ink">
                      {c.label}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {caps.map((cap) => (
              <tr
                key={cap.key}
                className="border-b border-hairline last:border-b-0"
              >
                <td className="py-3.5 px-4 sm:px-6">
                  <span className="flex items-center gap-3 text-ink">
                    <span className="text-gold-deep shrink-0">
                      {cap.icon}
                    </span>
                    <span>{cap.label}</span>
                  </span>
                </td>
                {cap.granted.map((granted, i) => (
                  <td key={i} className="text-center py-3.5 px-2">
                    <Mark granted={granted} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Mark({ granted }: { granted: boolean }) {
  if (granted) {
    return (
      <span className="inline-flex w-7 h-7 rounded-full bg-forest text-cream items-center justify-center">
        <CheckIcon className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span
      className="inline-block w-4 h-0.5 rounded bg-gold-deep/45"
      aria-label="Not granted"
    />
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
  return svg(
    'M8 8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zM16 8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zM3 19c0-3 2.2-5 5-5s5 2 5 5M11 19c0-3 2.2-5 5-5s5 2 5 5',
    16,
  );
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
  return svg(
    'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={18}
      height={18}
      aria-hidden="true"
    >
      <path d="M3 21l1.5-4L17 4.5a2.5 2.5 0 0 1 3 3L7.5 20z" />
      <path d="M14 7.5l3 3" />
      <path d="M3 21l4-1.5" />
    </svg>
  );
}

function CrownIcon() {
  return svg(
    'M3 19h18M4 8l4 4 4-8 4 8 4-4-1 11H5z',
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

function ImageIcon() {
  return svg(
    'M3 5h18v14H3zM8 11a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM3 17l5-5 4 4 3-3 6 6',
    16,
  );
}

function BookIcon() {
  return svg(
    'M12 6v15M3 5a3 3 0 0 1 3-3h6v19H6a3 3 0 0 0-3 3zM21 5a3 3 0 0 0-3-3h-6v19h6a3 3 0 0 1 3 3z',
    16,
  );
}

function BadgeIcon() {
  return svg(
    'M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z',
    16,
  );
}

function ArchiveColumnIcon() {
  return svg(
    'M3 9l9-5 9 5M3 9h18M3 20h18M6 9v11M9.5 9v11M14.5 9v11M18 9v11',
    18,
  );
}

function PlusCircleIcon() {
  return svg('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12h8M12 8v8', 16);
}

function TrashIcon() {
  return svg(
    'M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M6 7l1.2 13a2 2 0 0 0 2 1.8h5.6a2 2 0 0 0 2-1.8L18 7M10 11v6M14 11v6',
    16,
  );
}

function FolderIcon() {
  return svg(
    'M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    16,
  );
}

function ClockIcon() {
  return svg(
    'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zM12 7v5l3.5 2',
    16,
  );
}

function DownloadIcon() {
  return svg('M12 3v13M6 11l6 5 6-5M4 21h16', 16);
}

function RotateIcon() {
  return svg(
    'M3 4v6h6M3.5 10A9 9 0 1 1 4.5 16',
    16,
  );
}

function KeyIcon() {
  return svg(
    'M8 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 12l10-10M16 4l3 3',
    16,
  );
}

function ScalesIcon() {
  return svg(
    'M12 3v18M5 21h14M9 6h6M5 6L2 14a4 4 0 0 0 8 0zM19 6l3 8a4 4 0 0 1-8 0z',
    18,
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={14}
      height={14}
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function ArrowHead({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={12}
      height={12}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
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
