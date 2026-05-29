import Link from 'next/link';
import { listPeople, listInheritors, listConservators } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function ContributorsPage() {
  const [people, inheritors, conservators] = await Promise.all([
    listPeople(),
    listInheritors(),
    listConservators(),
  ]);

  const totalContributors =
    people.length + inheritors.length + conservators.length;

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          Contributors
        </h1>
        <p className="text-muted text-sm sm:text-base mt-2 max-w-2xl">
          Everyone who shapes your archive — the people in your items&rsquo;
          stories, the people who will receive them, and the people
          helping you preserve the record.
        </p>
      </header>

      {/* Hero */}
      <HeroCard totalContributors={totalContributors} />

      {/* Three role cards */}
      <ul className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <li>
          <ContributorCard
            href="/people"
            kicker="Past · Provenance · Stories"
            title="Legacy People"
            description="Track the family, friends, and previous owners behind every heirloom."
            question="Who is part of this item's story?"
            count={people.length}
            countLabel={people.length === 1 ? 'person' : 'people'}
            cta="Manage Legacy People"
            icon={<PeopleIcon />}
          />
        </li>
        <li>
          <ContributorCard
            href="/inheritors"
            kicker="Future · Succession · Bequests"
            title="Inheritors"
            description="Designate who should receive items, collections, and heirlooms in the future."
            question="Who receives this item next?"
            count={inheritors.length}
            countLabel={inheritors.length === 1 ? 'inheritor' : 'inheritors'}
            cta="Manage Inheritors"
            icon={<ScrollIcon />}
          />
        </li>
        <li>
          <ContributorCard
            href="/conservators"
            kicker="Present · Access · Audit"
            title="Conservators"
            description="Invite trusted people to view, edit, and preserve the archive together."
            question="Who helps you keep the record?"
            count={conservators.length}
            countLabel={
              conservators.length === 1 ? 'conservator' : 'conservators'
            }
            cta="Manage Conservators"
            icon={<ShieldIcon />}
          />
        </li>
      </ul>

      {/* One person, three roles — visualized */}
      <ThreeRolesExample />

      {/* Where to start */}
      <WhereToStart
        peopleCount={people.length}
        inheritorCount={inheritors.length}
        conservatorCount={conservators.length}
      />
    </div>
  );
}

// ============================================================== //
//  Hero                                                           //
// ============================================================== //

function HeroCard({ totalContributors }: { totalContributors: number }) {
  const lenses = [
    {
      title: 'The Past',
      body: 'Legacy People — the lives an item passed through before it reached you.',
      icon: <ClockIcon />,
    },
    {
      title: 'The Future',
      body: 'Inheritors — the people you want each item to reach next.',
      icon: <ArrowForwardIcon />,
    },
    {
      title: 'The Present',
      body: 'Conservators — the people who help you keep the archive alive today.',
      icon: <ShieldIcon />,
    },
  ];

  return (
    <section className="bg-paper border border-hairline rounded-2xl p-6 sm:p-10 shadow-card">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-gold-soft flex items-center justify-center text-gold-deep mb-4">
          <NetworkIcon className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-ink">
          Every heirloom has a human chain
        </h2>
        <p className="text-muted text-sm sm:text-base mt-3 max-w-2xl">
          An item is more than an object — it is the people who owned it,
          the people who will inherit it, and the people who help you
          remember it. Contributors gives each of those relationships its
          own place in your archive.
        </p>
        {totalContributors > 0 && (
          <p className="text-xs text-muted mt-3">
            You&rsquo;ve added{' '}
            <span className="text-ink font-medium">{totalContributors}</span>{' '}
            {totalContributors === 1 ? 'contributor' : 'contributors'} so
            far.
          </p>
        )}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
        {lenses.map((l) => (
          <li
            key={l.title}
            className="flex items-start gap-3 bg-cream-soft/50 border border-hairline rounded-xl p-4"
          >
            <span className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
              {l.icon}
            </span>
            <div className="min-w-0">
              <div className="font-serif text-base text-ink leading-tight">
                {l.title}
              </div>
              <div className="text-xs text-ink-soft mt-1 leading-relaxed">
                {l.body}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================== //
//  Three-roles example                                            //
// ============================================================== //

function ThreeRolesExample() {
  const roles = [
    {
      kicker: 'Legacy Person',
      title: 'Joe',
      body: "Joe carried this pocket watch every day for fifty years. He belongs to the watch's story.",
      tag: 'Past',
      href: '/people',
      icon: <PeopleIcon />,
    },
    {
      kicker: 'Inheritor',
      title: 'Sarah',
      body: "Sarah is designated to receive the watch one day. She belongs to the watch's future.",
      tag: 'Future',
      href: '/inheritors',
      icon: <ScrollIcon />,
    },
    {
      kicker: 'Conservator',
      title: 'Emily',
      body: 'Emily helps keep the archive accurate. She can edit the record today.',
      tag: 'Present',
      href: '/conservators',
      icon: <ShieldIcon />,
    },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">
          One heirloom, three relationships
        </h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          A single item can connect to all three contributor types — and
          a single human can hold more than one of those roles. Here is
          what that looks like for Grandpa Joe&rsquo;s pocket watch.
        </p>
      </div>

      <div className="bg-paper border border-hairline rounded-2xl p-6 sm:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-hairline">
          <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
            <WatchIcon />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted">
              Example heirloom
            </div>
            <div className="font-serif text-lg text-ink leading-tight">
              Grandpa Joe&rsquo;s Pocket Watch
            </div>
          </div>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roles.map((r) => (
            <li key={r.kicker}>
              <Link
                href={r.href}
                className="group block h-full bg-cream-soft/50 border border-hairline rounded-xl p-5 hover:bg-gold-soft/30 hover:border-forest/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                    {r.icon}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted">
                    {r.kicker}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="font-serif text-xl text-ink leading-tight">
                    {r.title}
                  </h3>
                  <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded bg-paper text-ink-soft border border-hairline">
                    {r.tag}
                  </span>
                </div>
                <p className="text-sm text-ink-soft mt-2 leading-relaxed">
                  {r.body}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted mt-6 pt-4 border-t border-hairline leading-relaxed">
          The same person can appear in more than one section — a child
          who inherits a portrait painted by their grandmother is both a
          Legacy Person (subject) and an Inheritor (recipient).
        </p>
      </div>
    </section>
  );
}

// ============================================================== //
//  Where to start                                                 //
// ============================================================== //

function WhereToStart({
  peopleCount,
  inheritorCount,
  conservatorCount,
}: {
  peopleCount: number;
  inheritorCount: number;
  conservatorCount: number;
}) {
  const suggestions: { href: string; title: string; body: string }[] = [];
  if (peopleCount === 0) {
    suggestions.push({
      href: '/people/new',
      title: 'Add your first Legacy Person',
      body: 'A parent, grandparent, or original owner is usually the easiest place to start.',
    });
  }
  if (inheritorCount === 0) {
    suggestions.push({
      href: '/inheritors/new',
      title: 'Designate your first Inheritor',
      body: 'Record who should receive a single meaningful item — you can always add more later.',
    });
  }
  if (conservatorCount === 0) {
    suggestions.push({
      href: '/conservators/new',
      title: 'Invite your first Conservator',
      body: 'A spouse, sibling, or trusted historian can help you keep the archive accurate.',
    });
  }

  if (suggestions.length === 0) {
    return (
      <section className="bg-paper border border-hairline rounded-2xl p-5 sm:p-6 shadow-card">
        <h2 className="font-serif text-xl text-ink">All three roles in play</h2>
        <p className="text-ink-soft text-sm leading-relaxed mt-2 max-w-3xl">
          You&rsquo;ve added contributors to all three sections — your
          archive captures the past, future, and present of every item.
          Keep refining each profile as new stories surface.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-2xl text-ink">Where to start</h2>
        <p className="text-muted text-sm max-w-2xl mt-1">
          A few suggestions to round out your contributor list.
        </p>
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group block h-full bg-paper border border-hairline rounded-2xl p-5 shadow-card hover:shadow-raised hover:border-forest/30 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="shrink-0 w-8 h-8 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
                  <PlusIcon className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-lg text-ink leading-tight">
                  {s.title}
                </h3>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed">{s.body}</p>
              <span className="inline-flex items-center gap-1 text-sm text-forest font-medium mt-4 group-hover:gap-2 transition-all">
                Get started →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ============================================================== //
//  Contributor card                                               //
// ============================================================== //

function ContributorCard({
  href,
  kicker,
  title,
  description,
  question,
  count,
  countLabel,
  cta,
  icon,
}: {
  href: string;
  kicker: string;
  title: string;
  description: string;
  question: string;
  count: number;
  countLabel: string;
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block h-full bg-paper border border-hairline rounded-2xl p-5 sm:p-6 shadow-card hover:shadow-raised hover:border-forest/30 transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="shrink-0 w-12 h-12 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center">
          {icon}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-muted">
          {kicker}
        </div>
      </div>
      <h2 className="font-serif text-2xl text-ink leading-tight">{title}</h2>
      <p className="text-sm text-ink-soft mt-2 leading-relaxed">
        {description}
      </p>
      <p className="text-xs italic text-muted mt-3 leading-relaxed">
        &ldquo;{question}&rdquo;
      </p>
      <div className="flex items-baseline gap-2 mt-5">
        <span className="font-serif text-3xl text-ink leading-none">
          {count}
        </span>
        <span className="text-xs text-muted uppercase tracking-wider">
          {countLabel}
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 mt-5 px-4 h-10 rounded-lg bg-forest text-cream text-sm font-medium group-hover:bg-forest-deep transition-colors">
        {cta} →
      </span>
    </Link>
  );
}

// ============================================================== //
//  Icons                                                          //
// ============================================================== //

function svg(d: string, size = 20): React.ReactNode {
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

function PeopleIcon() {
  return svg(
    'M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM15 14h2c2.2 0 4 1.8 4 4',
  );
}

function ScrollIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={20}
      height={20}
      aria-hidden="true"
    >
      <path d="M7 2h11a3 3 0 0 1 3 3v3h-3M7 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h11a3 3 0 0 0 3-3v-3H7M7 2v18" />
      <path d="M10 7h6M10 11h6" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={20}
      height={20}
      aria-hidden="true"
    >
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width={20}
      height={20}
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <path d="M12 7.5v3M12 10.5l-6 5.5M12 10.5l6 5.5M7.5 18h9" />
    </svg>
  );
}

function ClockIcon() {
  return svg('M12 7v5l3 2M5 12a7 7 0 1 0 14 0 7 7 0 0 0-14 0z', 18);
}

function ArrowForwardIcon() {
  return svg('M4 12h16M14 6l6 6-6 6', 18);
}

function WatchIcon() {
  return svg(
    'M12 7v5l3 2M8 3l1 3M16 3l-1 3M8 21l1-3M16 21l-1-3M5 12a7 7 0 1 0 14 0 7 7 0 0 0-14 0z',
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
